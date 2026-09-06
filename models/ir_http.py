# Part of web_winui. See LICENSE file for full copyright and licensing details.

from odoo import models
from odoo.http import request


class IrHttp(models.AbstractModel):
    _inherit = "ir.http"

    def session_info(self):
        """Expose the WinUI preferences to the web client.

        Shipping them in ``session_info`` lets the theme service apply the
        theme during ``start``, i.e. before the first paint, which avoids the
        light/dark flash a lazily fetched preference would cause.
        """
        result = super().session_info()
        if request.env.user._is_internal():
            result["winui"] = request.env["res.users"].winui_get_settings()
        return result
