from odoo import http
from odoo.http import request


class QZTrayPosController(http.Controller):
    @http.route("/pos/print_qz_receipt", type="json", auth="user")
    def print_qz_receipt(self, receipt):
        """Return ESC/POS commands same as IoT printer backend."""
        try:
            # POS uses this to get the formatted ESC/POS string
            order_env = request.env["pos.order"].sudo()
            escpos_data = order_env._get_escpos_receipt(receipt)
            return {"receipt": escpos_data}
        except AttributeError:
            # fallback if _get_escpos_receipt is not present
            return {"receipt": str(receipt)}
        except Exception as e:
            return {"error": str(e)}
