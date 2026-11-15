"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.pluginLogRing = void 0;
const log_ring_1 = require("./log-ring");
/**
 * Plugin-wide log capture ring (latest 50 entries). The platform's Logger
 * pushes every line here on top of forwarding to Homebridge's log; the UI's
 * snapshot writer copies a stable snapshot of the ring into every state.json
 * write so the Diagnostics tab can show recent context.
 *
 * Module-singleton so DeviceSession can read the same ring the platform
 * writes to, without an IPC channel or DI plumbing.
 */
exports.pluginLogRing = new log_ring_1.LogRing(50);
class Logger {
    log;
    name;
    constructor(log, name) {
        this.log = log;
        this.name = name;
    }
    record(level, message) {
        // Capture into the in-memory ring first — even if the underlying
        // homebridge logger throws (e.g. closed stream during shutdown), the
        // ring still gets the message so it's visible in the UI.
        try {
            exports.pluginLogRing.push(level, `[${this.name}] ${message}`);
        }
        catch { /* ignore */ }
    }
    info(message, ...parameters) {
        this.record('info', message);
        this.log.info(`[${this.name}] ${message}`, ...parameters);
    }
    warn(message, ...parameters) {
        this.record('warn', message);
        this.log.warn(`[${this.name}] ${message}`, ...parameters);
    }
    error(message, ...parameters) {
        this.record('error', message);
        this.log.error(`[${this.name}] ${message}`, ...parameters);
    }
    debug(message, ...parameters) {
        this.record('debug', message);
        this.log.debug(`[${this.name}] ${message}`, ...parameters);
    }
    getRaw() {
        return this.log;
    }
}
exports.Logger = Logger;
