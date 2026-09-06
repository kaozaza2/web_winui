# Part of web_winui. See LICENSE for full copyright and licensing details.

{
    "name": "WinUI Backend Theme",
    "summary": "Re-skins the Odoo backend with Microsoft's WinUI 3 / Fluent design system.",
    "description": """
WinUI 3 design for the Odoo web client
======================================

Replaces the visual language of the Odoo backend with Microsoft's WinUI 3
(Fluent Design System). Every Odoo class, template and widget is left
untouched, so third-party modules built on the standard ``o_*`` classes inherit
the new look without changes.

What it covers
--------------
* **Design tokens** - the Fluent 2 colour ramps (text, control, stroke, fill,
  solid background, system fills), the WinUI type ramp, corner radii, elevation
  and control metrics. Published both as SCSS variables, so Odoo's own compiled
  stylesheets follow, and as CSS custom properties, so the theme and accent can
  change at runtime.
* **Materials** - Mica, Mica Alt and Acrylic backdrops with a solid fallback,
  honouring the user's transparency preference.
* **Controls** - buttons, inputs, flyouts, checkboxes, radios, switches,
  sliders, tabs, badges, tags, dialogs, tooltips, toasts and progress
  indicators, rebuilt on the Fluent control specs.
* **Views** - form, list, kanban, search panel, calendar, pivot, graph,
  activity and settings, plus the navbar, control panel and search view.
* **Discuss** - the messaging menu, chat windows, message bubbles and the
  Discuss shell, which otherwise paint themselves from hard-coded light values.
* **App drawer** - Odoo's apps dropdown becomes a Windows 11 style Start menu:
  an acrylic sheet of app tiles with a search field covering every menu item in
  every app, each shown with its full "App / Section / Item" path. Keyboard
  driven, and reused by the small-screen sidebar's "All Apps" button. This is
  the capability OCA's ``web_responsive`` provides, rebuilt on Odoo core
  services so the theme carries no third-party dependency.
* **Preferences** - theme (light / dark / follow system), accent colour,
  backdrop material, density, corner style, motion and transparency. Stored per
  user and switchable from the systray without a reload.

Requires Odoo 18.0.
""",
    "version": "18.0.1.0.0",
    "category": "Themes/Backend",
    "license": "LGPL-3",
    "author": "MokiMikore",
    "website": "https://github.com/kaozaza2/web_winui",
    # `mail` is a hard dependency purely for asset ordering: the chatter and
    # Discuss are themed surfaces here, and several of their rules ship opaque
    # light fills that are overridden by load order rather than by escalating
    # specificity. Without the dependency that order is incidental.
    "depends": ["web", "mail"],
    "data": [
        "views/res_users_views.xml",
    ],
    "assets": {
        "web.assets_backend": [
            # -- SCSS variable layer ------------------------------------
            # Injected *before* Odoo's own `primary_variables.scss`. Almost
            # everything Odoo declares there, and in the `**/*.variables.scss`
            # glob that follows it, uses `!default` - so defining the variables
            # first is what makes Odoo's compiled stylesheets adopt the Fluent
            # metrics. The few that skip `!default` are listed, with the CSS
            # custom property to use instead, in `winui_primary_variables.scss`.
            (
                "before",
                "web/static/src/scss/primary_variables.scss",
                "web_winui/static/src/scss/tokens/winui_primary_variables.scss",
            ),
            (
                "before",
                "web/static/src/scss/bootstrap_overridden.scss",
                "web_winui/static/src/scss/tokens/winui_bootstrap_overridden.scss",
            ),
            # -- Runtime tokens (CSS custom properties) -----------------
            "web_winui/static/src/scss/tokens/winui_tokens.scss",
            "web_winui/static/src/scss/tokens/winui_accents.scss",
            # -- Foundations --------------------------------------------
            "web_winui/static/src/scss/base/typography.scss",
            "web_winui/static/src/scss/base/materials.scss",
            "web_winui/static/src/scss/base/motion.scss",
            "web_winui/static/src/scss/base/focus.scss",
            "web_winui/static/src/scss/base/scrollbar.scss",
            # -- Controls -----------------------------------------------
            "web_winui/static/src/scss/components/buttons.scss",
            "web_winui/static/src/scss/components/inputs.scss",
            "web_winui/static/src/scss/components/toggles.scss",
            "web_winui/static/src/scss/components/flyouts.scss",
            "web_winui/static/src/scss/components/tabs.scss",
            "web_winui/static/src/scss/components/badges.scss",
            "web_winui/static/src/scss/components/tables.scss",
            "web_winui/static/src/scss/components/cards.scss",
            "web_winui/static/src/scss/components/dialogs.scss",
            "web_winui/static/src/scss/components/tips.scss",
            "web_winui/static/src/scss/components/progress.scss",
            "web_winui/static/src/scss/components/infobars.scss",
            # -- Shell --------------------------------------------------
            "web_winui/static/src/scss/layout/webclient.scss",
            "web_winui/static/src/scss/layout/navbar.scss",
            "web_winui/static/src/scss/layout/control_panel.scss",
            "web_winui/static/src/scss/layout/searchview.scss",
            "web_winui/static/src/scss/layout/search_panel.scss",
            "web_winui/static/src/scss/layout/app_drawer.scss",
            # -- Views --------------------------------------------------
            "web_winui/static/src/scss/views/form.scss",
            "web_winui/static/src/scss/views/list.scss",
            "web_winui/static/src/scss/views/kanban.scss",
            "web_winui/static/src/scss/views/settings.scss",
            "web_winui/static/src/scss/views/misc_views.scss",
            # -- Compatibility ------------------------------------------
            # Load last, in this order. These answer rules that other modules
            # compiled from light literals, and several of them win on file
            # order rather than on specificity, so the sequence matters: the
            # generic `o_*` sweep, then `mail`, then the dark-only sweep.
            "web_winui/static/src/scss/compat/odoo_classes.scss",
            "web_winui/static/src/scss/compat/mail.scss",
            "web_winui/static/src/scss/compat/dark_surface.scss",
            # -- Behaviour ----------------------------------------------
            "web_winui/static/src/js/core/winui_constants.js",
            "web_winui/static/src/js/core/winui_color.js",
            "web_winui/static/src/js/core/winui_theme_service.js",
            "web_winui/static/src/js/effects/winui_reveal.js",
            "web_winui/static/src/js/effects/winui_pressed.js",
            "web_winui/static/src/js/components/winui_settings_dialog.js",
            "web_winui/static/src/js/components/winui_settings_dialog.xml",
            "web_winui/static/src/js/components/winui_theme_menu.js",
            "web_winui/static/src/js/components/winui_theme_menu.xml",
            "web_winui/static/src/js/components/winui_app_drawer.js",
            "web_winui/static/src/js/components/winui_app_drawer.xml",
        ],
        # The lazily loaded graph/pivot bundle re-imports the variable chain, so
        # it needs the same injection to compile against the Fluent tokens.
        "web.assets_backend_lazy": [
            (
                "before",
                "web/static/src/scss/primary_variables.scss",
                "web_winui/static/src/scss/tokens/winui_primary_variables.scss",
            ),
        ],
        # Odoo's own dark bundle, used by web_enterprise and OCA's
        # web_dark_mode. This theme does not need it - it switches through CSS
        # custom properties - but keeping the variables consistent avoids a
        # double-dark result when one of those modules is installed alongside.
        "web.assets_web_dark": [
            (
                "after",
                "web_winui/static/src/scss/tokens/winui_primary_variables.scss",
                "web_winui/static/src/scss/tokens/winui_primary_variables.dark.scss",
            ),
        ],
    },
    "installable": True,
    "application": True,
}
