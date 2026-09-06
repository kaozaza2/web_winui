/** @odoo-module **/

/**
 * Derivation of the Windows accent ramp.
 *
 * Windows exposes six shades around the chosen accent colour
 * (SystemAccentColorLight1..3 and Dark1..3). Checking the shipped ramp for the
 * default blue - #0078D4 giving #429CE3 / #76B9ED / #A6D8FF and #005A9E /
 * #004275 / #002642 - shows the shades are the base colour mixed towards white
 * at 74% / 53% / 30% and towards black at 75% / 55% / 31%.
 *
 * `winui_accents.scss` applies the same weights with Sass' `mix()`, so a colour
 * picked at runtime and one baked into the bundle produce identical ramps.
 */

const MIX_WHITE = [0.74, 0.53, 0.3];
const MIX_BLACK = [0.75, 0.55, 0.31];

/**
 * @param {string} hex "#RGB" or "#RRGGBB", with or without the hash
 * @returns {[number, number, number]|null} the channels, or null if unparseable
 */
export function parseHex(hex) {
    if (typeof hex !== "string") {
        return null;
    }
    let value = hex.trim().replace(/^#/, "");
    if (value.length === 3) {
        value = value
            .split("")
            .map((c) => c + c)
            .join("");
    }
    if (!/^[0-9a-fA-F]{6}$/.test(value)) {
        return null;
    }
    return [
        parseInt(value.slice(0, 2), 16),
        parseInt(value.slice(2, 4), 16),
        parseInt(value.slice(4, 6), 16),
    ];
}

export function toHex([r, g, b]) {
    const channel = (c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, "0");
    return `#${channel(r)}${channel(g)}${channel(b)}`.toUpperCase();
}

/** Sass' `mix($a, $b, $weight)` for opaque colours. */
export function mix(a, b, weight) {
    return [0, 1, 2].map((i) => a[i] * weight + b[i] * (1 - weight));
}

/**
 * @param {string} baseHex
 * @returns {Object|null} the CSS custom properties for the ramp, or null when
 *   the colour cannot be parsed - callers should then leave the ramp alone
 *   rather than fall back to a colour the user did not ask for.
 */
export function accentRamp(baseHex) {
    const base = parseHex(baseHex);
    if (!base) {
        return null;
    }
    const white = [255, 255, 255];
    const black = [0, 0, 0];
    const light = MIX_WHITE.map((w) => mix(base, white, w));
    const dark = MIX_BLACK.map((w) => mix(base, black, w));
    return {
        "--winui-accent": toHex(base),
        "--winui-accent-light-1": toHex(light[0]),
        "--winui-accent-light-2": toHex(light[1]),
        "--winui-accent-light-3": toHex(light[2]),
        "--winui-accent-dark-1": toHex(dark[0]),
        "--winui-accent-dark-2": toHex(dark[1]),
        "--winui-accent-dark-3": toHex(dark[2]),
        "--winui-accent-rgb": base.map(Math.round).join(", "),
        "--winui-accent-light-2-rgb": light[1].map(Math.round).join(", "),
        "--winui-accent-dark-1-rgb": dark[0].map(Math.round).join(", "),
    };
}

/**
 * Relative luminance per WCAG 2.1, used to decide whether a swatch needs a
 * light or a dark check mark drawn on it.
 */
export function luminance(hex) {
    const rgb = parseHex(hex);
    if (!rgb) {
        return 0;
    }
    const [r, g, b] = rgb.map((c) => {
        const s = c / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
