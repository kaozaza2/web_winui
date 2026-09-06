/** @odoo-module **/

import { browser } from "@web/core/browser/browser";
import { throttleForAnimation } from "@web/core/utils/timing";

/**
 * Reveal highlight.
 *
 * WinUI lights the border and background of a control from the pointer's
 * position, so a group of adjacent controls reads as one lit surface.
 *
 * The effect is purely decorative, so it must cost nothing measurable: a single
 * passive document-level listener, throttled to one write per animation frame,
 * and one `getBoundingClientRect` per element *entered* rather than per pointer
 * move - a board of a hundred kanban cards would otherwise force a layout on
 * every mouse event.
 *
 * `base/materials.scss` and the component layer consume `--winui-reveal-x` and
 * `--winui-reveal-y`; a browser or a user preference that turns motion off
 * simply never sets them.
 */

const REVEAL_SELECTOR = [
    ".o_kanban_record",
    ".o_stat_button",
    ".o_setting_box",
    ".winui-card",
    ".o_search_panel_category_value",
].join(",");

let currentTarget = null;
let currentRect = null;

/**
 * Read the preference at event time rather than at load time: the theme service
 * and the effects are independent modules with no import between them, so their
 * execution order is not guaranteed, and the user can flip the preference
 * mid-session anyway.
 */
function motionEnabled() {
    return (
        document.documentElement.dataset.winuiMotion !== "off" &&
        !browser.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    );
}

function clear() {
    if (currentTarget) {
        currentTarget.style.removeProperty("--winui-reveal-x");
        currentTarget.style.removeProperty("--winui-reveal-y");
        currentTarget.classList.remove("o-winui-reveal");
    }
    currentTarget = null;
    currentRect = null;
}

const track = throttleForAnimation((clientX, clientY) => {
    if (!currentTarget || !currentRect) {
        return;
    }
    currentTarget.style.setProperty("--winui-reveal-x", `${clientX - currentRect.left}px`);
    currentTarget.style.setProperty("--winui-reveal-y", `${clientY - currentRect.top}px`);
});

function onPointerMove(ev) {
    if (!motionEnabled()) {
        clear();
        return;
    }
    const target = ev.target instanceof Element ? ev.target.closest(REVEAL_SELECTOR) : null;
    if (target !== currentTarget) {
        clear();
        if (target) {
            currentTarget = target;
            // Measured once per element entered. A scroll while the pointer is
            // held still leaves the highlight a few pixels off until the next
            // move, which is not worth a scroll listener.
            currentRect = target.getBoundingClientRect();
            target.classList.add("o-winui-reveal");
        }
    }
    track(ev.clientX, ev.clientY);
}

export function startWinuiReveal() {
    // Both listeners are passive and do nothing while motion is off, so they can
    // be attached once and left alone.
    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", clear, { passive: true });
}

startWinuiReveal();
