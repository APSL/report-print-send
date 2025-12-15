/* global qz, fetch, console */
import { registry } from "@web/core/registry";
import { rpc } from "@web/core/network/rpc";
import { _t } from "@web/core/l10n/translation";

class PrintActionHandler {
    constructor() {
        qz.security.setCertificatePromise((resolve, reject) => {
            fetch("/qz-certificate", {
                cache: "no-store",
                headers: { "Content-Type": "text/plain" },
            })
                .then((response) =>
                    response.text().then((text) =>
                        response.ok ? resolve(text) : reject(text)
                    )
                )
                .catch(reject);
        });

        qz.security.setSignatureAlgorithm("SHA512");
        qz.security.setSignaturePromise((toSign) => (resolve, reject) => {
            fetch(`/qz-sign-message?request=${toSign}`, {
                cache: "no-store",
                headers: { "Content-Type": "text/plain" },
            })
                .then((response) =>
                    response.text().then((text) =>
                        response.ok ? resolve(text) : reject(text)
                    )
                )
                .catch(reject);
        });
    }

    // ------------------------------------------------------------
    // MAIN ENTRY (Odoo 18)
    // ------------------------------------------------------------
    async printOrDownloadReport(action, env) {
        action.context = action.context || {};
        action.context.skip_printer_exception = true;

        const report_action = await rpc("/web/dataset/call_kw", {
            model: "ir.actions.report",
            method: "print_action_for_report_name",
            args: [action.report_name],
            kwargs: { context: action.context },
        });

        if (report_action && report_action.action === "server") {
            let printed = false;
            try {
                printed = await this._triggerPrint(
                    action,
                    report_action,
                    env?.services?.notification
                );
            } catch (e) {
                console.warn("Print failed, fallback to download", e);
            }
            if (printed) {
                return true;
            }
        }

        return this._downloadReport(action);
    }

    // ------------------------------------------------------------
    // PRINT (QZ Tray)
    // ------------------------------------------------------------
    async _triggerPrint(action, report_action, notificationService) {
        try {
            const data = await rpc("/web/dataset/call_kw", {
                model: "ir.actions.report",
                method: "get_qz_tray_data",
                args: [
                    report_action.id,
                    action.context.active_ids,
                    action.report_type === "qweb-pdf"
                        ? "pdf"
                        : action.report_type === "py3o"
                        ? "py3o"
                        : "text",
                    action.report_name,
                ],
                kwargs: { data: action.data || {} },
                context: action.context,
            });

            let printer_name = report_action.printer_name;

            if (printer_name.includes("\\")) {
                const [server, printer] = printer_name.split("\\");
                printer_name = printer;
                await qz.websocket.connect({ host: server });
            } else {
                await qz.websocket.connect();
            }

            let qz_printer_name;
            try {
                qz_printer_name = await qz.printers.find(printer_name);
            } catch {
                notificationService?.add(
                    _t("Printer not found: ") + printer_name,
                    { sticky: true, type: "warning" }
                );
                await qz.websocket.disconnect().catch(() => {});
                return false;
            }

            const config = qz.configs.create(qz_printer_name);
            await qz.print(config, data);
            await qz.websocket.disconnect();

            notificationService?.add(
                _t("Document sent to the printer: ") + qz_printer_name,
                { type: "info" }
            );

            return true;
        } catch (err) {
            notificationService?.add(
                _t("Error printing document: ") + (err?.message || err),
                { sticky: true, type: "danger" }
            );
            await qz.websocket.disconnect().catch(() => {});
            return false;
        }
    }

    // ------------------------------------------------------------
    // DOWNLOAD (Odoo 18 API)
    // ------------------------------------------------------------
    async _downloadReport(action) {
        return rpc("/web/action/load", {
            action_id: action.id,
            context: action.context,
        });
    }
}

const handler = new PrintActionHandler();

// ------------------------------------------------------------
// REPORT HANDLER REGISTRATION
// ------------------------------------------------------------
function print_or_download_report_handler(action, _options, env) {
    if (!action.context?.auto_print) {
        return false;
    }
    return handler.printOrDownloadReport(action, env);
}

registry
    .category("ir.actions.report handlers")
    .add(
        "print_or_download_report",
        print_or_download_report_handler,
        { sequence: 0 }
    );
