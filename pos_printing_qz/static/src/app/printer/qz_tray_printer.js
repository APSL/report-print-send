/** @odoo-module **/

import {QZConnection} from "./qz_tray_connection";

export class QZTrayPrinter {
  constructor(printerName, mode = "html") {
    this.printerName = printerName;
    this.mode = mode; // "html" | "escpos"
  }

  async printReceipt(el) {
    try {
      let data;
      if (this.mode === "escpos") {
        data = await this._getEscPosData(el);
      } else {
        data = el.outerHTML;
      }

      await QZConnection.print(this.printerName, [
        this.mode === "escpos" ? {type: "raw", data} : data,
      ]);
      return {successful: true};
    } catch (error) {
      console.error("QZTray print error: ", error);
      return {
        successful: false,
        message: {title: "QZ Tray Error", body: error.message},
      };
    }
  }

  async _getEscPosData(el) {
    const text = el.textContent || "";
    return text.replace(/\n/g, "\x0A");
  }
}
