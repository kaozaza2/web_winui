# web_winui — WinUI 3 design for the Odoo 18 backend

Re-skins the Odoo web client with Microsoft's **WinUI 3 / Fluent Design System**,
without touching a single Odoo template, widget or class. Every third-party
module that builds its UI out of the standard `o_*` and Bootstrap classes — which
is how Odoo modules are written — inherits the new look automatically.

* **Odoo version:** 18.0 (Community and Enterprise)
* **Depends on:** `web`, `mail` — `mail` is declared so its assets load first
  and the chatter can be themed by cascade order rather than by escalating
  specificity
* **Licence:** LGPL-3
* **Author:** MokiMikore
* **Repository:** <https://github.com/kaozaza2/web_winui>

---

## How it works

The theme is four layers, applied in this order inside `web.assets_backend`:

| # | Layer | File(s) | What it does |
|---|-------|---------|--------------|
| 1 | **SCSS variables** | `tokens/winui_primary_variables.scss`, `tokens/winui_bootstrap_overridden.scss` | Injected *before* Odoo's own `primary_variables.scss` and `bootstrap_overridden.scss`. Odoo declares all of those with `!default`, so assigning first is what makes **Odoo's own compiled stylesheets** adopt the Fluent radii, type ramp, control metrics and colours. This is the layer that reaches modules the theme has never heard of. |
| 2 | **Runtime tokens** | `tokens/winui_tokens.scss`, `tokens/winui_accents.scss` | The genuine Fluent alpha ramps as CSS custom properties, in light and dark, plus the Windows accent palette, density, corner and material switches. Because they are custom properties, the theme flips at runtime with no asset recompilation. |
| 3 | **Components & views** | `base/`, `components/`, `layout/`, `views/` | The actual Fluent controls: Button, TextBox, ComboBox, CheckBox, RadioButton, ToggleSwitch, Slider, MenuFlyout, ContentDialog, ToolTip, InfoBar, ProgressBar/Ring, SelectorBar, TableView, ItemContainer, NavigationView, CommandBar, AutoSuggestBox, TokenView, SettingsCard. |
| 3b | **App drawer** | `js/components/winui_app_drawer.js`, `layout/app_drawer.scss` | Replaces the apps dropdown with a Start-menu-style grid + cross-app menu search. Same idea as OCA `web_responsive`, but built on `menu`, `fuzzyLookup` and `scrollTo` from Odoo core - no extra dependency. |
| 4 | **Compatibility sweep** | `compat/odoo_classes.scss`, `compat/dark_surface.scss` | Maps the shared Odoo class vocabulary (`o_field_widget`, `o_tag`, `o_status`, the chatter, the colour utilities) onto Fluent tokens, and re-points every surface Odoo compiled with a literal light colour when the dark theme is active. |

Values are transcribed from the WinUI 3 sources rather than eyeballed:

```
controls/dev/CommonStyles/Common_themeresources_any.xaml   colour ramps
controls/dev/CommonStyles/CornerRadius_themeresources.xaml radii (4 / 8)
controls/dev/CommonStyles/TextBlock_themeresources.xaml    type ramp
controls/dev/CommonStyles/Button_themeresources.xaml       button states
controls/dev/CommonStyles/TextBox_themeresources*.xaml     TextBox states
dxaml/xcp/dxaml/themes/generic.xaml                        control metrics
```

## App drawer

Clicking the apps button (or <kbd>Alt</kbd>+<kbd>H</kbd>) opens a Windows 11
Start menu rather than a dropdown list:

* a grid of app tiles, with the app you are in marked by the accent pill;
* a search field that matches **apps and every menu item beneath them**, each
  result labelled with its full path (`Sales / Configuration / Quotation
  Templates`) and the matched run emphasised;
* keyboard throughout - arrows move (by a measured grid row, not a guess),
  <kbd>Home</kbd>/<kbd>End</kbd> jump, <kbd>Enter</kbd> opens, <kbd>Esc</kbd>
  clears the query and closes on the second press;
* on a small screen it fills the surface, and the sidebar's "All Apps" button
  hands over to it.

## The surface ladder

Fluent specifies `ControlFillColorDefault` as **translucent white** (`#B3FFFFFF`).
That only lifts a control when the surface beneath it is not white — which holds
in Windows, where pages sit on Mica, but not in Odoo, whose views are white. Taken
literally the token composites to pure-white-on-pure-white and every button, text
box and card disappears into its background.

The theme therefore recesses the page and lets controls be the light element on
top of it, which is what Windows actually does:

| | light | dark |
|---|---|---|
| window (Mica) | `#F3F3F3` | `#202020` |
| content layer (`--winui-layer-alt`) | `#F7F7F7` | `#2B2B2B` |
| cards (`--winui-card-default`) | `#FCFCFC` | — |
| controls (`--winui-control-default`) | `#FFFFFF` | `#383838` |

Two consequences worth knowing when editing the theme:

* **Never paint a backend surface opaque white.** Odoo does it in a handful of
  places (`.o_notebook .nav`, `.o_form_nosheet`, the settings surface); each is
  reset to `transparent` so the page tone comes through. Grep the compiled bundle
  for opaque light fills after any change — that is how these were found.
* **The sheet is the card, and it is sized by its content.** The content layer
  is full height by definition, so leaving it as the surface rendered a
  device-tall slab with the form *and* the chatter inside it. The layer steps
  aside for form views; the sheet and the chatter are separate cards. Note that
  `.o_form_sheet_bg` is a **column** flex container — `align-self` there governs
  width, not height, and shrinking the sheet pushes the totals column offscreen.
* **`.o_web_client` is `<body>`.** Odoo 18 mounts the web client on the body
  element itself, so a rule that looks scoped to the app also matches every
  portalled overlay — dialogs, the app drawer, `.modal-backdrop`. Two bugs came
  from this: a `> *` rule knocked the backdrop out of `position: fixed`, and the
  generic TextBox rule drew a second box inside the drawer's search field.
  When styling a portalled component, out-specify deliberately:
  `.o_web_client input[type="text"]:focus` scores **(0,3,1)** — the attribute
  selector counts as a class *and* `input` adds an element — so a two-class
  selector loses to it.
* **Tooltips are popovers in Odoo 18.** They render as `.o_popover.popover`
  with a `.tooltip-inner` inside, so a rule scoped to `.tooltip .tooltip-inner`
  never reaches them and Bootstrap keeps painting that inner node pure black.
  The popover carries the surface; the inner node only carries text.
* **Odoo's own hooks are the cleanest override point.** The navbar colours the
  brand and the portalled breadcrumb with `var(--NavBar-brand-color, #1B1B1B)`.
  Nothing sets that hook, so the light literal won and the small-screen
  breadcrumb came out near-black on the dark navbar. Filling the hook beats
  out-specifying each rule.
* **Reset every *state* of a nested control, not just the base.** A composite
  field draws its chrome on the wrapper and the inner input must stay bare — but
  `[readonly]` and `:disabled` in the `winui-textbox` mixin outrank a plain
  `input` reset, so a readonly many2one painted a second fill inside the first.
* **Odoo renamed the button box.** It is `.o-form-buttonbox` in 18, not
  `.oe_button_box`; styling the old name silently does nothing and the stat
  buttons stay plain outline buttons.
* **Pin control heights, do not floor them.** `min-block-size` lets a text
  button grow past the density token on its own padding, so a command bar
  mixing text and icon buttons comes out ragged (33 / 29 / 45px in one row).
  Command-bar and chatter-topbar controls set `block-size` and
  `padding-block: 0` instead.
* **`$o-main-text-color` and `$o-main-link-color` compile to literals.** Odoo
  bakes them in as `#1B1B1B` / `#005A9E`, and since the theme flips through
  custom properties those literals cannot follow it — dark forms ended up with
  1.2:1 body text and 1.4:1 links. They cannot simply be set to `var(...)`
  either: Odoo runs `str-slice()` and colour maths on them. The affected rules
  are re-pointed at the tokens in `compat/odoo_classes.scss`.
* **A command is not a link, and a state is not a command.** Odoo renders
  "Add a line" as `<a role="button">` — styled like the record links directly
  above it, the two become indistinguishable, so `role="button"` is excluded
  from the accent link colour and gets a Subtle-button treatment instead.
  Likewise the statusbar is a SelectorBar (recessed track, raised current chip,
  accent pill), never the solid accent fill of a primary button sitting beside
  it.
* **Never give `.o_statusbar_status` vertical padding or a border.**
  `StatusBarField.areItemsWrapping()` decides the pipeline overflowed by testing
  `container.height > firstItem.height`. Any block padding makes that
  permanently true and Odoo folds every state into its overflow dropdown. All
  segments must also measure the same height — hence the 1px transparent border
  on every one of them.
* **Field state belongs to the control, not to its container.** Odoo predates
  fields having a box of their own, so it marks required and invalid cells by
  drawing a border along the whole `<td>` (`list_renderer.scss`) and gives
  `.o_input` a bottom-only border. Against a real TextBox those land as a
  second, wider underline offset from the control's. The list view resets them
  and re-expresses the state on the input itself.
* **Hover deepens, it does not brighten.** A control at rest is the lightest
  thing; `--winui-control-secondary` (hover) and `...-tertiary` (pressed) step
  back down towards the page, as Fluent specifies.

## Preferences

Per user, stored on `res.users`, changed from the **systray flyout** (theme +
accent) or the full **Appearance dialog**, and applied without a reload:

| Setting | Values |
|---|---|
| Theme | Use system setting · Light · Dark |
| Accent colour | The Windows 11 palette, Odoo purple, or any custom colour (the five derived shades follow the Windows mixing formula) |
| Backdrop material | Mica · Mica Alt · Acrylic · Solid |
| Density | Standard (32px controls / 40px rows) · Compact · Touch |
| Corner style | Rounded (Fluent) · Square |
| Transparency effects | on/off — mirrors the Windows personalisation setting |
| Animation effects | on/off — also forced off by `prefers-reduced-motion` |

`session_info` carries the settings, so the window is themed **before the first
paint** — no flash of the light theme for a user who chose dark.

## Notes

* **Dark mode needs nothing else.** The theme switches through CSS custom
  properties, so it works on Odoo Community, which has no dark asset bundle.
  `tokens/winui_primary_variables.dark.scss` exists only so that installations
  which *also* compile `web.assets_web_dark` (Enterprise, OCA `web_dark_mode`)
  get a consistent bundle instead of two themes fighting.
* **Fonts.** Segoe UI Variable ships with Windows 11 and static Segoe UI with
  Windows 10; the stack falls back to the platform UI font elsewhere, so the
  metrics stay close without bundling a webfont.
* **Accessibility.** Focus is the Fluent two-tone rectangle on `:focus-visible`
  only, `forced-colors` hands every stroke back to the system, and reduced
  motion is honoured from both the OS and the per-user preference.
