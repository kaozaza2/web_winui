/** @odoo-module **/

import { Component } from "@odoo/owl";
import { Dropdown } from "@web/core/dropdown/dropdown";
import { DropdownItem } from "@web/core/dropdown/dropdown_item";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";

import { WINUI_ACCENTS, WINUI_THEMES } from "../core/winui_constants";
import { luminance } from "../core/winui_color";
import { WinuiSettingsDialog } from "./winui_settings_dialog";

/**
 * The systray theme picker.
 *
 * Windows puts light/dark and the accent colour one click away in the taskbar
 * flyout; this is the same affordance. Everything else lives in the full
 * preferences dialog.
 */
export class WinuiThemeMenu extends Component {
    static template = "web_winui.ThemeMenu";
    static components = { Dropdown, DropdownItem };
    static props = {};

    setup() {
        this.theme = useService("winui_theme");
        this.dialog = useService("dialog");
        this.themes = WINUI_THEMES;
        // The systray flyout shows a single row of swatches, so "system" - which
        // is the same blue as "blue" - is left to the full dialog.
        this.accents = WINUI_ACCENTS.filter((a) => a.value !== "system");
    }

    get settings() {
        return this.theme.settings;
    }

    /** The glyph on the systray button reflects the theme actually in force. */
    get currentIcon() {
        return this.theme.resolvedTheme === "dark" ? "fa-moon-o" : "fa-sun-o";
    }

    /** A dark check mark on a light swatch and vice versa. */
    swatchCheckClass(accent) {
        return luminance(accent.color) > 0.5 ? "text-black" : "text-white";
    }

    onSelectTheme(value) {
        this.theme.set({ theme: value });
    }

    onSelectAccent(value) {
        this.theme.set({ accent: value });
    }

    openSettings() {
        this.dialog.add(WinuiSettingsDialog);
    }
}

export const systrayItem = { Component: WinuiThemeMenu };

// Sequence 10 keeps it to the left of the user menu (0) and the activity/messaging
// items, which is where Windows puts its own quick settings.
registry.category("systray").add("web_winui.theme_menu", systrayItem, { sequence: 10 });
