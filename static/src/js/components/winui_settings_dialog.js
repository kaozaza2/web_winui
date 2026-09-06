/** @odoo-module **/

import { Component } from "@odoo/owl";
import { Dialog } from "@web/core/dialog/dialog";
import { CheckBox } from "@web/core/checkbox/checkbox";
import { useService } from "@web/core/utils/hooks";
import { _t } from "@web/core/l10n/translation";

import {
    WINUI_ACCENTS,
    WINUI_CORNERS,
    WINUI_DENSITIES,
    WINUI_MATERIALS,
    WINUI_THEMES,
} from "../core/winui_constants";
import { luminance, parseHex } from "../core/winui_color";

/**
 * The full appearance dialog, laid out as a Windows 11 Settings page: a column
 * of SettingsCards, each with a header, a description and its control on the
 * trailing edge.
 *
 * Every change applies immediately and is written straight away - there is no
 * OK/Cancel, exactly as in the Settings app.
 */
export class WinuiSettingsDialog extends Component {
    static template = "web_winui.SettingsDialog";
    static components = { Dialog, CheckBox };
    static props = { close: { type: Function, optional: true } };

    setup() {
        this.theme = useService("winui_theme");
        this.title = _t("Appearance");
        this.themes = WINUI_THEMES;
        this.accents = WINUI_ACCENTS;
        this.materials = WINUI_MATERIALS;
        this.densities = WINUI_DENSITIES;
        this.corners = WINUI_CORNERS;
    }

    get settings() {
        return this.theme.settings;
    }

    /**
     * The help line under a card follows the selected value, so it is resolved
     * here rather than with an inline `find()` in the template.
     */
    get materialHelp() {
        return this.materials.find((m) => m.value === this.settings.material)?.help || "";
    }

    get densityHelp() {
        return this.densities.find((d) => d.value === this.settings.density)?.help || "";
    }

    swatchCheckClass(accent) {
        return luminance(accent.color) > 0.5 ? "text-black" : "text-white";
    }

    set(changes, options) {
        this.theme.set(changes, options);
    }

    onCustomColorInput(ev) {
        // Dragging the native colour picker fires `input` continuously; the
        // preview follows every frame but only the final `change` is written.
        this.set({ accent: "custom", accentCustom: ev.target.value }, { persist: false });
    }

    onCustomColorChange(ev) {
        const value = ev.target.value;
        if (!parseHex(value)) {
            return;
        }
        this.set({ accent: "custom", accentCustom: value });
    }

    onReset() {
        this.theme.reset();
    }
}
