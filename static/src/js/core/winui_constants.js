/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";

/**
 * Option lists shared by the systray picker, the preferences dialog and the
 * theme service. They mirror the selection fields declared on `res.users`, so
 * adding a value means touching exactly these two places.
 */

export const WINUI_THEMES = [
    { value: "auto", label: _t("Use system setting"), icon: "fa-adjust" },
    { value: "light", label: _t("Light"), icon: "fa-sun-o" },
    { value: "dark", label: _t("Dark"), icon: "fa-moon-o" },
];

/**
 * The Windows 11 "Personalisation > Colours" grid, plus Odoo's brand purple.
 * Keep the hex values in step with `static/src/scss/tokens/winui_accents.scss`;
 * the SCSS emits the ramp for these, and `winui_color.js` derives it at runtime
 * for the custom colour.
 */
export const WINUI_ACCENTS = [
    { value: "system", label: _t("Default"), color: "#0078D4" },
    { value: "blue", label: _t("Blue"), color: "#0078D4" },
    { value: "navy", label: _t("Navy blue"), color: "#0063B1" },
    { value: "teal", label: _t("Teal"), color: "#038387" },
    { value: "green", label: _t("Green"), color: "#10893E" },
    { value: "seafoam", label: _t("Seafoam"), color: "#00B294" },
    { value: "purple", label: _t("Purple"), color: "#8764B8" },
    { value: "orchid", label: _t("Orchid"), color: "#C239B3" },
    { value: "red", label: _t("Red"), color: "#C42B1C" },
    { value: "orange", label: _t("Orange"), color: "#CA5010" },
    { value: "gold", label: _t("Gold"), color: "#EAA300" },
    { value: "plum", label: _t("Plum"), color: "#E3008C" },
    { value: "steel", label: _t("Steel"), color: "#69797E" },
    { value: "odoo", label: _t("Odoo purple"), color: "#714B67" },
];

export const WINUI_MATERIALS = [
    { value: "mica", label: _t("Mica"), help: _t("The default Windows 11 window backdrop.") },
    { value: "mica_alt", label: _t("Mica Alt"), help: _t("A deeper backdrop that makes content read as a card.") },
    { value: "acrylic", label: _t("Acrylic"), help: _t("A translucent, blurred backdrop.") },
    { value: "solid", label: _t("Solid"), help: _t("No transparency at all.") },
];

export const WINUI_DENSITIES = [
    { value: "standard", label: _t("Standard"), help: _t("32px controls and 40px rows, the desktop default.") },
    { value: "compact", label: _t("Compact"), help: _t("Tighter spacing for data-heavy screens.") },
    { value: "touch", label: _t("Touch"), help: _t("44px targets, for tablets and touchscreens.") },
];

export const WINUI_CORNERS = [
    { value: "rounded", label: _t("Rounded") },
    { value: "square", label: _t("Square") },
];

/** Applied when the server sends nothing, e.g. for a public or portal user. */
export const WINUI_DEFAULTS = {
    theme: "auto",
    accent: "system",
    accentCustom: "#0078D4",
    material: "mica",
    density: "standard",
    corner: "rounded",
    animations: true,
    transparency: true,
};
