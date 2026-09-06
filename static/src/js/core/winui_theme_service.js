/** @odoo-module **/

import { browser } from "@web/core/browser/browser";
import { registry } from "@web/core/registry";
import { session } from "@web/session";
import { reactive } from "@odoo/owl";

import { WINUI_DEFAULTS } from "./winui_constants";
import { accentRamp } from "./winui_color";

const STORAGE_KEY = "web_winui.settings";

/**
 * The attributes the stylesheet keys off. `theme: "auto"` deliberately writes
 * *no* attribute: the token layer then resolves through `prefers-color-scheme`,
 * which is both cheaper and correct when the OS setting changes mid-session.
 */
function themeAttributes(settings) {
    return {
        "data-winui-theme": settings.theme === "auto" ? null : settings.theme,
        "data-winui-accent": settings.accent,
        "data-winui-material": settings.material,
        "data-winui-density": settings.density,
        "data-winui-corner": settings.corner,
        "data-winui-motion": settings.animations ? null : "off",
        "data-winui-transparency": settings.transparency ? null : "off",
    };
}

/**
 * Write the settings onto <html>. Kept as a free function so it can run at
 * module load - before the web client mounts - which is what prevents a flash
 * of the light theme for a user who chose dark.
 */
export function applyWinuiSettings(settings) {
    const root = document.documentElement;
    for (const [name, value] of Object.entries(themeAttributes(settings))) {
        if (value === null) {
            root.removeAttribute(name);
        } else {
            root.setAttribute(name, value);
        }
    }

    // A custom accent has no pre-compiled ramp, so it is derived here and set
    // inline; every other accent is served by `winui_accents.scss`.
    const ramp = settings.accent === "custom" ? accentRamp(settings.accentCustom) : null;
    const properties = [
        "--winui-accent",
        "--winui-accent-light-1",
        "--winui-accent-light-2",
        "--winui-accent-light-3",
        "--winui-accent-dark-1",
        "--winui-accent-dark-2",
        "--winui-accent-dark-3",
        "--winui-accent-rgb",
        "--winui-accent-light-2-rgb",
        "--winui-accent-dark-1-rgb",
    ];
    for (const property of properties) {
        if (ramp) {
            root.style.setProperty(property, ramp[property]);
        } else {
            root.style.removeProperty(property);
        }
    }
}

function readCache() {
    try {
        return JSON.parse(browser.localStorage.getItem(STORAGE_KEY)) || null;
    } catch {
        return null;
    }
}

function writeCache(settings) {
    try {
        browser.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
        // A full or disabled storage only costs the pre-paint application on the
        // next load; the server copy remains the source of truth.
    }
}

/**
 * The settings the very first paint should use.
 *
 * `session_info` carries the server value, so it wins. The localStorage copy is
 * the fallback for the login screen and for any page rendered before the
 * session is available.
 */
function initialSettings() {
    return { ...WINUI_DEFAULTS, ...(readCache() || {}), ...(session.winui || {}) };
}

// Applied at module evaluation: the assets bundle is parsed before the web
// client mounts, so the window is already themed when the first frame paints.
const bootSettings = initialSettings();
applyWinuiSettings(bootSettings);
writeCache(bootSettings);

export const winuiThemeService = {
    // 16.0 exposes RPC as a service rather than the free `rpc` function that
    // 18.0 exports from `@web/core/network/rpc`, so it is injected here.
    dependencies: ["rpc"],
    start(env, { rpc }) {
        const state = reactive({ ...bootSettings });

        /**
         * The theme actually in force, with "auto" resolved. Components use it
         * for labels ("System - currently dark"), never for styling: the CSS
         * resolves `auto` on its own.
         */
        const media = browser.matchMedia?.("(prefers-color-scheme: dark)");
        const resolved = reactive({ theme: media?.matches ? "dark" : "light" });
        media?.addEventListener?.("change", (ev) => {
            resolved.theme = ev.matches ? "dark" : "light";
        });

        function apply() {
            applyWinuiSettings(state);
            writeCache({ ...state });
        }

        return {
            settings: state,

            /** The effective light/dark value, with "auto" resolved. */
            get resolvedTheme() {
                return state.theme === "auto" ? resolved.theme : state.theme;
            },

            /**
             * Update one or more preferences.
             *
             * The UI is repainted first and the write is fired afterwards, so
             * the picker feels instant; a failed write leaves the session
             * looking right and the stored value unchanged, which is the least
             * surprising outcome for a purely cosmetic preference.
             *
             * @param {Object} changes partial settings
             * @param {Object} [options]
             * @param {boolean} [options.persist=true] set false while dragging
             *   a colour picker, then call once more on release
             */
            async set(changes, { persist = true } = {}) {
                Object.assign(state, changes);
                apply();
                // 16.0 has no `@web/core/user`; the session carries the uid.
                if (!persist || !session.uid) {
                    return;
                }
                try {
                    await rpc("/web/dataset/call_kw", {
                        model: "res.users",
                        method: "winui_set_settings",
                        args: [changes],
                        kwargs: {},
                    });
                } catch (error) {
                    console.warn("web_winui: could not save the theme preference", error);
                }
            },

            /** Restore every preference to the module's defaults. */
            async reset() {
                return this.set({ ...WINUI_DEFAULTS });
            },
        };
    },
};

registry.category("services").add("winui_theme", winuiThemeService);
