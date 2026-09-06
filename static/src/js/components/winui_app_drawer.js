/** @odoo-module **/

import { Component, useEffect, useRef, useState } from "@odoo/owl";
import { NavBar } from "@web/webclient/navbar/navbar";
import { fuzzyLookup } from "@web/core/utils/search";
import { patch } from "@web/core/utils/patch";
import { escapeRegExp } from "@web/core/utils/strings";
import { scrollTo } from "@web/core/utils/scrolling";
import { useAutofocus, useBus, useService } from "@web/core/utils/hooks";

/**
 * The app drawer.
 *
 * Odoo's stock apps menu is a plain dropdown list of app names, which stops
 * being usable somewhere around a dozen apps and offers no way to reach a menu
 * item without first entering its app.
 *
 * This replaces it with the Windows 11 Start menu: a full-surface acrylic sheet
 * carrying a search field, a grid of app tiles, and - as soon as anything is
 * typed - a flat result list covering both apps *and* every menu item beneath
 * them, each shown with its full "App / Section / Item" path.
 *
 * It is the same capability OCA's `web_responsive` provides, rebuilt here on
 * Odoo core services only (`menu`, `fuzzyLookup`, `scrollTo`) so that the theme
 * stays dependency-free.
 */

/** Bus event used by the navbar button and the mobile sidebar to open it. */
export const TOGGLE_EVENT = "WINUI_APP_DRAWER:TOGGLE";

/**
 * Resolve a menu's icon to something `<img src>` can use.
 *
 * Odoo stores it either as `"module,static/path.png"` or as base64 in
 * `webIconData`, with the payload occasionally already carrying its data URI
 * prefix. A base64 SVG always starts with "P" ("<" encoded), which is how the
 * mime type is told apart.
 */
export function getAppIconSrc(menu) {
    const webIcon = menu.webIcon;
    if (webIcon && webIcon.split(",").length === 2) {
        const path = webIcon.replace(",", "/");
        return path.startsWith("/") ? path : `/${path}`;
    }
    const data = menu.webIconData;
    if (!data) {
        return null;
    }
    if (data.startsWith("data:image")) {
        return data;
    }
    const prefix = data.startsWith("P") ? "data:image/svg+xml;base64," : "data:image/png;base64,";
    return prefix + data.replace(/\s/g, "");
}

/** `/odoo/sales` when the menu declares a path, `/odoo/action-42` otherwise. */
function menuHref(menu) {
    return `/odoo/${menu.actionPath || `action-${menu.actionID}`}`;
}

/**
 * Flatten an app's menu tree into actionable leaves, each labelled with the
 * path taken to reach it so that two "Products" entries in different apps stay
 * tellable apart in the results.
 */
function collectMenuItems(node, trail, out) {
    for (const child of node.childrenTree || []) {
        const path = [...trail, child.name.trim()];
        // A node can carry both an action and children; it is still a
        // destination, so it is collected as well as descended into.
        if (child.actionID) {
            out.push({
                id: child.id,
                appID: child.appID,
                actionID: child.actionID,
                actionPath: child.actionPath,
                xmlid: child.xmlid,
                name: child.name.trim(),
                displayName: path.join(" / "),
            });
        }
        collectMenuItems(child, path, out);
    }
    return out;
}

export class WinuiAppDrawer extends Component {
    static template = "web_winui.AppDrawer";
    static props = {};

    setup() {
        this.menuService = useService("menu");
        this.state = useState({ open: false, query: "", highlight: 0 });

        this.searchInput = useAutofocus({ refName: "search" });
        this.resultsRef = useRef("results");
        this.gridRef = useRef("grid");

        useBus(this.env.bus, TOGGLE_EVENT, () => this.toggle());
        // Any completed navigation closes the drawer, so selecting an entry
        // never leaves it hanging over the action it just opened.
        useBus(this.env.bus, "ACTION_MANAGER:UI-UPDATED", () => this.close());

        // The body class lets the stylesheet lock background scrolling while
        // the sheet is up.
        useEffect(
            (open) => {
                document.body.classList.toggle("o_winui_drawer_open", open);
                return () => document.body.classList.remove("o_winui_drawer_open");
            },
            () => [this.state.open]
        );

        // Keep the highlighted entry in view during keyboard navigation.
        useEffect(
            () => this.scrollHighlightIntoView(),
            () => [this.state.highlight, this.state.query]
        );
    }

    // -- data ---------------------------------------------------------------

    get apps() {
        return this.menuService.getApps().map((app) => ({
            ...app,
            iconSrc: getAppIconSrc(app),
            href: menuHref(app),
        }));
    }

    /** Every actionable menu item across every app, computed once per query. */
    get menuItems() {
        if (!this._menuItems) {
            this._menuItems = [];
            for (const app of this.menuService.getApps()) {
                const tree = this.menuService.getMenuAsTree(app.id);
                collectMenuItems(tree, [app.name.trim()], this._menuItems);
            }
        }
        return this._menuItems;
    }

    get currentAppId() {
        return this.menuService.getCurrentApp()?.id;
    }

    /**
     * The flat, ordered list the keyboard walks: matching apps first, then
     * matching menu items. Rendering and navigation read the same array, so the
     * highlight can never point at something the user cannot see.
     */
    get results() {
        const query = this.state.query.trim();
        if (!query) {
            return null;
        }
        const apps = fuzzyLookup(query, this.apps, (a) => a.name).map((app) => ({
            type: "app",
            key: `app-${app.id}`,
            menu: app,
            iconSrc: app.iconSrc,
            href: app.href,
            label: app.name,
        }));
        const items = fuzzyLookup(query, this.menuItems, (i) => i.displayName).map((item) => ({
            type: "item",
            key: `item-${item.id}`,
            menu: item,
            iconSrc: null,
            href: menuHref(item),
            label: item.displayName,
        }));
        return [...apps, ...items];
    }

    /**
     * Split a label on the query so the matched run can be emphasised. Fluent
     * marks a match with weight, never with a highlight colour.
     */
    splitOnQuery(label) {
        const query = this.state.query.trim();
        if (!query) {
            return [label];
        }
        const parts = label.split(new RegExp(`(${escapeRegExp(query)})`, "ig"));
        return parts.length > 1 ? parts : [label];
    }

    // -- open / close -------------------------------------------------------

    open() {
        this.state.open = true;
        this.state.query = "";
        this.state.highlight = 0;
    }

    close() {
        if (this.state.open) {
            this.state.open = false;
            this.state.query = "";
        }
    }

    toggle() {
        if (this.state.open) {
            this.close();
        } else {
            this.open();
        }
    }

    // -- selection ----------------------------------------------------------

    onSelect(menu) {
        this.close();
        this.menuService.selectMenu(menu);
    }

    onEntryClick(ev, menu) {
        // The entries are real links so they keep their href for middle-click
        // and "open in new tab"; a plain click is handled in the SPA instead.
        if (ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.button !== 0) {
            return;
        }
        ev.preventDefault();
        this.onSelect(menu);
    }

    // -- keyboard -----------------------------------------------------------

    /**
     * How many tiles fit on a row, measured rather than assumed: the grid is
     * responsive, so the column count is only knowable from the layout.
     */
    gridColumns() {
        const tiles = this.gridRef.el?.querySelectorAll(".o_winui_app_tile");
        if (!tiles || tiles.length === 0) {
            return 1;
        }
        const firstTop = tiles[0].offsetTop;
        let columns = 0;
        for (const tile of tiles) {
            if (tile.offsetTop !== firstTop) {
                break;
            }
            columns++;
        }
        return Math.max(1, columns);
    }

    get entryCount() {
        return this.results ? this.results.length : this.apps.length;
    }

    move(delta) {
        const total = this.entryCount;
        if (!total) {
            return;
        }
        // Wraps in both directions, so holding an arrow key cycles rather than
        // sticking at an edge.
        this.state.highlight = (this.state.highlight + delta + total) % total;
    }

    onSearchKeydown(ev) {
        const searching = Boolean(this.results);
        const columns = searching ? 1 : this.gridColumns();

        switch (ev.key) {
            case "Escape":
                ev.preventDefault();
                ev.stopPropagation();
                // Escape clears a query first and only closes on the second
                // press, so a mistyped search never costs the whole drawer.
                if (this.state.query) {
                    this.state.query = "";
                    this.state.highlight = 0;
                } else {
                    this.close();
                }
                break;
            case "ArrowDown":
                ev.preventDefault();
                this.move(columns);
                break;
            case "ArrowUp":
                ev.preventDefault();
                this.move(-columns);
                break;
            case "ArrowRight":
                if (searching) {
                    return;
                }
                ev.preventDefault();
                this.move(1);
                break;
            case "ArrowLeft":
                if (searching) {
                    return;
                }
                ev.preventDefault();
                this.move(-1);
                break;
            case "Home":
                ev.preventDefault();
                this.state.highlight = 0;
                break;
            case "End":
                ev.preventDefault();
                this.state.highlight = this.entryCount - 1;
                break;
            case "Enter": {
                ev.preventDefault();
                const entry = this.results
                    ? this.results[this.state.highlight]
                    : this.apps[this.state.highlight];
                if (entry) {
                    this.onSelect(entry.menu || entry);
                }
                break;
            }
        }
    }

    onSearchInput(ev) {
        this.state.query = ev.target.value;
        this.state.highlight = 0;
    }

    scrollHighlightIntoView() {
        const container = this.resultsRef.el || this.gridRef.el;
        const active = container?.querySelector(".o_winui_drawer_highlight");
        if (active) {
            scrollTo(active, container);
        }
    }
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------
NavBar.components = { ...NavBar.components, WinuiAppDrawer };

// 16.0's `patch()` is `patch(obj, patchName, patchValue)`; the two-argument
// form is 17.0 onwards. The name has to be unique across patches on this
// prototype, so it is namespaced to the module.
patch(NavBar.prototype, "web_winui.NavBar", {
    /** The navbar button and the mobile sidebar both open the same drawer. */
    onWinuiAppDrawerToggle() {
        this.env.bus.trigger(TOGGLE_EVENT);
    },

    /**
     * On a small screen Odoo's sidebar lists the current app's sections and
     * offers an "All Apps" button that swaps in an inline app list. That button
     * hands over to the drawer instead, so both form factors get the same
     * searchable grid.
     */
    onAllAppsBtnClick() {
        this._closeAppMenuSidebar();
        this.env.bus.trigger(TOGGLE_EVENT);
    },
});
