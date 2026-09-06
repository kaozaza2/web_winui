# Part of web_winui. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models

#: Fields every user is allowed to read/write on their own record without
#: needing group "Administration / Settings". Odoo checks these lists in
#: ``res.users.read``/``write`` through ``SELF_READABLE_FIELDS``.
WINUI_SELF_FIELDS = [
    "winui_theme",
    "winui_accent",
    "winui_accent_custom",
    "winui_material",
    "winui_density",
    "winui_corner",
    "winui_animations",
    "winui_transparency",
]


class ResUsers(models.Model):
    _inherit = "res.users"

    winui_theme = fields.Selection(
        selection=[
            ("auto", "Use system setting"),
            ("light", "Light"),
            ("dark", "Dark"),
        ],
        string="WinUI Theme",
        default="auto",
        required=True,
        help="Application theme, mirroring the Windows 'App mode' setting. "
        "'Use system setting' follows the operating system preference.",
    )
    winui_accent = fields.Selection(
        selection=[
            ("system", "Default (Windows blue)"),
            ("blue", "Blue"),
            ("navy", "Navy blue"),
            ("teal", "Teal"),
            ("green", "Green"),
            ("seafoam", "Seafoam"),
            ("purple", "Purple"),
            ("orchid", "Orchid"),
            ("red", "Red"),
            ("orange", "Orange"),
            ("gold", "Gold"),
            ("plum", "Plum"),
            ("steel", "Steel"),
            ("odoo", "Odoo purple"),
            ("custom", "Custom colour"),
        ],
        string="WinUI Accent Colour",
        default="system",
        required=True,
    )
    winui_accent_custom = fields.Char(
        string="Custom Accent",
        default="#0078D4",
        help="Hexadecimal colour (e.g. #0078D4) used when the accent colour is "
        "set to 'Custom colour'. The lighter/darker shades of the Fluent accent "
        "ramp are derived from it automatically.",
    )
    winui_material = fields.Selection(
        selection=[
            ("mica", "Mica"),
            ("mica_alt", "Mica Alt"),
            ("acrylic", "Acrylic"),
            ("solid", "Solid (no transparency)"),
        ],
        string="WinUI Backdrop Material",
        default="mica",
        required=True,
        help="Backdrop material used behind the application chrome, as in the "
        "WinUI 3 'Materials' guidance.",
    )
    winui_density = fields.Selection(
        selection=[
            ("standard", "Standard"),
            ("compact", "Compact"),
            ("touch", "Touch"),
        ],
        string="WinUI Density",
        default="standard",
        required=True,
    )
    winui_corner = fields.Selection(
        selection=[
            ("rounded", "Rounded (Fluent)"),
            ("square", "Square"),
        ],
        string="WinUI Corner Style",
        default="rounded",
        required=True,
    )
    winui_animations = fields.Boolean(
        string="WinUI Animations",
        default=True,
        help="Enable Fluent motion (connected animations, pointer-down scale, "
        "reveal highlight). Turned off automatically when the browser reports "
        "'prefers-reduced-motion'.",
    )
    winui_transparency = fields.Boolean(
        string="Transparency Effects",
        default=True,
        help="Mirrors the Windows 'Transparency effects' setting. When off, "
        "Mica and Acrylic fall back to solid surfaces.",
    )

    @property
    def SELF_READABLE_FIELDS(self):
        return super().SELF_READABLE_FIELDS + WINUI_SELF_FIELDS

    @property
    def SELF_WRITEABLE_FIELDS(self):
        return super().SELF_WRITEABLE_FIELDS + WINUI_SELF_FIELDS

    @api.model
    def winui_get_settings(self):
        """Return the current user's WinUI preferences."""
        user = self.env.user
        return {
            "theme": user.winui_theme,
            "accent": user.winui_accent,
            "accentCustom": user.winui_accent_custom or "#0078D4",
            "material": user.winui_material,
            "density": user.winui_density,
            "corner": user.winui_corner,
            "animations": user.winui_animations,
            "transparency": user.winui_transparency,
        }

    @api.model
    def winui_set_settings(self, settings):
        """Persist a partial update of the current user's WinUI preferences.

        Called from the theme service so the systray picker can write without
        opening the preferences dialog.
        """
        values = {
            "winui_%s" % key: settings[camel]
            for key, camel in (
                ("theme", "theme"),
                ("accent", "accent"),
                ("accent_custom", "accentCustom"),
                ("material", "material"),
                ("density", "density"),
                ("corner", "corner"),
                ("animations", "animations"),
                ("transparency", "transparency"),
            )
            if camel in settings
        }
        if values:
            self.env.user.sudo().write(values)
        return True
