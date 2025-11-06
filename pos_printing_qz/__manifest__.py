# Copyright <YEAR(S)> <AUTHOR(S)>
# License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).
{
    "name": "POS Printing QZ",
    "summary": "POS ticket printing via QZ Tray",
    "version": "18.0.1.0.0",
    # see https://odoo-community.org/page/development-status
    "development_status": "Alpha",
    "category": "Point Of Sale",
    "website": "https://github.com/OCA/pos",
    "author": "APSL Nagarro, Odoo Community Association (OCA)",
    "maintainers": ["miquelalzanillas"],
    "license": "AGPL-3",
    "application": False,
    "installable": True,
    "depends": [
        "point_of_sale",
        "base_report_to_printer_qz",
    ],
    "data": [
        "views/pos_config_views.xml",
    ],
    "assets": {
        "point_of_sale._assets_pos": [
            "pos_printing_qz/static/src/app/printer/qz_tray_connection.js",
            "pos_printing_qz/static/src/app/printer/qz_tray_printer.js",
            "pos_printing_qz/static/src/app/services/qz_tray_printer_service.js",
        ],
    },
}
