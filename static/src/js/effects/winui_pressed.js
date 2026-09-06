/** @odoo-module **/

/**
 * Pressed feedback.
 *
 * WinUI scales a control to 98% while it is held down and releases it over
 * 83ms. CSS `:active` cannot express that on its own for keyboard activation or
 * for a pointer that leaves the control while held, so a class carries the
 * state instead; `components/buttons.scss` owns the geometry.
 */

const PRESSABLE = ".btn, .o_kanban_record, .dropdown-item, .o_stat_button";
const CLASS = "o-winui-pressed";

let pressed = null;

function release() {
    if (pressed) {
        pressed.classList.remove(CLASS);
        pressed = null;
    }
}

function onPointerDown(ev) {
    // Read the preference at event time: the theme service is a separate module
    // with no import relation to this one, so its execution order is not
    // guaranteed, and the user can flip the preference mid-session.
    if (ev.button !== 0 || document.documentElement.dataset.winuiMotion === "off") {
        return;
    }
    const target = ev.target instanceof Element ? ev.target.closest(PRESSABLE) : null;
    if (!target || target.disabled) {
        return;
    }
    release();
    pressed = target;
    pressed.classList.add(CLASS);
}

export function startWinuiPressed() {
    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.addEventListener("pointerup", release, { passive: true });
    document.addEventListener("pointercancel", release, { passive: true });
    // A drag that ends outside the control still has to let it go.
    document.addEventListener("dragend", release, { passive: true });
}

startWinuiPressed();
