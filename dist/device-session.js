"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceSession = void 0;
const node_path_1 = require("node:path");
const atomic_write_1 = require("./util/atomic-write");
const logger_1 = require("./util/logger");
const client_1 = require("./eufy/client");
/** Maximum number of UI snapshot writes per second (throttled to avoid I/O storms). */
const UI_SNAPSHOT_MIN_INTERVAL_MS = 500;
const UI_SNAPSHOT_FILENAME = '.homebridge-eufy-robovac-matter.state.json';
/** Per-consumable max hours used to render the wear bar in the UI. */
const CONSUMABLE_MAX_HOURS = {
    sideBrushHours: 150,
    rollingBrushHours: 300,
    filterMeshHours: 200,
    mopHours: 100,
    dustbagHours: 60,
    dirtyWaterFilterHours: 50,
};
const CONSUMABLE_UI_META = {
    sideBrushHours: { key: 'sideBrush', name: 'Side brush', icon: 'bi-fan' },
    rollingBrushHours: { key: 'rollingBrush', name: 'Rolling brush', icon: 'bi-record-circle' },
    filterMeshHours: { key: 'filterMesh', name: 'Filter mesh', icon: 'bi-filter' },
    mopHours: { key: 'mop', name: 'Mop pad', icon: 'bi-droplet' },
    dustbagHours: { key: 'dustbag', name: 'Dust bag', icon: 'bi-trash3' },
    dirtyWaterFilterHours: { key: 'dirtyWaterfilter', name: 'Dirty water filter', icon: 'bi-funnel' },
};
/**
 * Short human-readable labels for raw DPS keys we know about — used by the
 * plugin UI's Diagnostics tab so the middle column shows "WorkStatus" instead
 * of an empty string. Keys we don't recognise fall back to "" so the row is
 * still rendered (with key + raw value) for forensic purposes.
 */
const DPS_NAMES = {
    '151': 'state',
    '152': 'ModeCtrlResponse',
    '153': 'WorkStatus',
    '154': 'CleanParamResponse',
    '156': 'multi-maps',
    '157': 'UniversalDataResponse',
    '158': 'CleanSpeed',
    '163': 'battery',
    '165': 'UniversalDataResponse',
    '166': 'mode',
    '167': 'CleanStatistics',
    '168': 'ConsumableResponse',
    '169': 'device info',
    '170': 'MapEditRequest',
    '172': 'MultiMapsManageResponse',
    '173': 'StationResponse',
    '176': 'CleanParam',
    '177': 'ErrorCode',
    '178': 'timer',
    '179': 'telemetry',
    '180': 'SceneResponse',
};
/**
 * Encapsulates the per-device runtime: MQTT client, command handlers, and
 * the accessory state machine. Created in Phase 2 once cloud credentials are
 * available; the command handlers may exist earlier (Phase 1, null MQTT).
 */
class DeviceSession {
    deviceId;
    deviceModel;
    deviceName;
    handlers;
    accessoryHandler;
    parser;
    log;
    uiStoragePath;
    mqttClient = null;
    lastSnapshotAt = 0;
    pendingSnapshotTimer;
    mqttAttempts = 0;
    mqttLastMsgAt;
    /** Set true by `dispose()`; throttled writers must short-circuit when true. */
    disposed = false;
    constructor(deviceId, deviceModel, deviceName, handlers, accessoryHandler, parser, log, uiStoragePath = undefined) {
        this.deviceId = deviceId;
        this.deviceModel = deviceModel;
        this.deviceName = deviceName;
        this.handlers = handlers;
        this.accessoryHandler = accessoryHandler;
        this.parser = parser;
        this.log = log;
        this.uiStoragePath = uiStoragePath;
    }
    /** Creates and connects the MQTT client, wiring all event handlers. */
    async connect(userId, appId, openudid, settings, reconnectMaxDelayMs) {
        const client = new client_1.EufyMqttClient(this.deviceId, this.deviceModel, userId, appId, openudid, settings.certificatePem, settings.privateKey, settings.username, settings.endpoint, this.log, { reconnectMaxDelayMs });
        client.on('message', (payload) => {
            if (!this.isDpsPayload(payload)) {
                this.log.debug(`Non-DPS MQTT payload (keys: ${Object.keys(payload).join(', ')}): ${JSON.stringify(payload).substring(0, 150)}`);
                return;
            }
            const currentState = this.accessoryHandler.getCurrentState();
            const newState = this.parser.processDps(payload.data, currentState);
            this.mqttLastMsgAt = Date.now();
            // Echo suppression: when the handler is inside the suppression window
            // because the user just picked a clean mode, the device may still echo
            // back its previous mode for several seconds. Restore the user's choice
            // before publishing so the Matter state push doesn't roll currentMode
            // back to the stale value.
            const decodedCleanMode = newState.activity.cleanMode;
            newState.activity.cleanMode = this.handlers.resolveCleanModeForState(decodedCleanMode);
            this.accessoryHandler.onStateUpdate(newState);
            if (decodedCleanMode !== currentState.activity.cleanMode) {
                this.handlers.syncCleanModeFromDevice(decodedCleanMode);
            }
            this.maybeWriteUiSnapshot(newState);
        });
        client.on('connected', () => {
            this.mqttAttempts += 1;
            this.log.info(`MQTT connected for ${this.deviceName}. Requesting device status...`);
            // Refresh the UI snapshot immediately so the plugin UI flips from
            // "Disconnected" to "Connected" without waiting for the next DPS push.
            this.maybeWriteUiSnapshot(this.accessoryHandler.getCurrentState());
            void client.requestStatus().catch((err) => {
                this.log.warn(`Device status request failed for ${this.deviceName}: ${String(err)}`);
            });
            // On reconnect (mqttClient already set from prior connect), re-request all maps
            // so newly added floors are picked up. Initial connect is handled after setMqttClient below.
            if (this.mqttClient) {
                void this.handlers.requestAllMaps().catch((err) => {
                    this.log.warn(`[Maps] MAP_GET_ALL reconnect request failed: ${String(err)}`);
                });
            }
        });
        client.on('error', (err) => {
            const message = err instanceof Error ? err.message : String(err);
            this.log.error(`MQTT error for ${this.deviceName}: ${message}`);
        });
        await client.connect();
        this.mqttClient = client;
        this.handlers.setMqttClient(client);
        // Now that mqttClient is set, refresh the UI snapshot so its mqtt.connected
        // flag flips to true even before any DPS messages flow in. Without this the
        // UI sees `connected: false` from any earlier snapshot until the device
        // first publishes — which can be tens of seconds when the robot is idle.
        this.maybeWriteUiSnapshot(this.accessoryHandler.getCurrentState());
        // Initial connect: request all saved floor maps now that the MQTT client is wired up.
        void this.handlers.requestAllMaps().catch((err) => {
            this.log.warn(`[Maps] Initial MAP_GET_ALL request failed: ${String(err)}`);
        });
        return client;
    }
    /** Disconnects MQTT and disposes accessory timers. */
    dispose() {
        this.disposed = true;
        this.mqttClient?.disconnect();
        this.mqttClient = null;
        if (this.pendingSnapshotTimer) {
            clearTimeout(this.pendingSnapshotTimer);
            this.pendingSnapshotTimer = undefined;
        }
        this.accessoryHandler.dispose();
    }
    /**
     * Writes a UI snapshot, throttled to one write per [[UI_SNAPSHOT_MIN_INTERVAL_MS]].
     * The plugin UI server polls this file at the same cadence — every successful
     * MQTT message triggers a snapshot but coalesces bursts.
     */
    maybeWriteUiSnapshot(state) {
        if (!this.uiStoragePath || this.disposed)
            return;
        const now = Date.now();
        const sinceLast = now - this.lastSnapshotAt;
        if (sinceLast >= UI_SNAPSHOT_MIN_INTERVAL_MS) {
            this.lastSnapshotAt = now;
            void this.writeUiSnapshot(state);
            return;
        }
        if (this.pendingSnapshotTimer)
            return;
        this.pendingSnapshotTimer = setTimeout(() => {
            this.pendingSnapshotTimer = undefined;
            if (this.disposed)
                return;
            this.lastSnapshotAt = Date.now();
            void this.writeUiSnapshot(this.accessoryHandler.getCurrentState());
        }, UI_SNAPSHOT_MIN_INTERVAL_MS - sinceLast);
    }
    async writeUiSnapshot(state) {
        if (!this.uiStoragePath || this.disposed)
            return;
        const file = (0, node_path_1.join)(this.uiStoragePath, UI_SNAPSHOT_FILENAME);
        const activeError = state.activity.activeError ? {
            code: state.activity.activeErrorCode !== undefined ? `E${state.activity.activeErrorCode}` : '—',
            label: state.activity.activeError,
            detail: '',
            ageMs: 0,
        } : null;
        const consumables = state.activity.consumables
            ? Object.keys(CONSUMABLE_UI_META)
                .filter((k) => state.activity.consumables?.[k] !== undefined)
                .map((k) => ({
                ...CONSUMABLE_UI_META[k],
                hours: state.activity.consumables[k] ?? 0,
                max: CONSUMABLE_MAX_HOURS[k],
            }))
            : [];
        const snap = {
            live: true,
            device: {
                sn: this.deviceId,
                model: this.deviceModel,
                name: this.deviceName,
                firmware: state.identity.firmware,
                lastSyncAt: Date.now(),
            },
            activity: {
                runMode: state.activity.runMode,
                paused: state.activity.paused,
                cleanMode: state.activity.cleanMode,
                suctionLevel: state.activity.suctionLevel,
                mopLevel: state.activity.mopLevel,
                cleanExtent: state.activity.cleanExtent,
                cleaningProfile: state.activity.cleaningProfile,
                cleanSession: state.activity.cleanSession ?? null,
                lifetime: state.activity.lifetime ?? null,
                activeError,
            },
            power: state.power,
            water: state.water ?? { clean: null, dirty: null },
            station: { activity: state.activity.stationActivity ?? [] },
            rooms: state.activity.availableRooms.map((r) => ({ id: r.id, name: r.name, enabled: true })),
            consumables,
            mqtt: {
                connected: !!this.mqttClient,
                attempts: this.mqttAttempts,
                backoffMs: 0,
                lastMsgAt: this.mqttLastMsgAt ?? null,
                dpsKeyCount: Object.keys(state.debug.rawDps).length,
            },
            diagnostics: {
                // Last 50 log lines from the in-memory pluginLogRing — captured by
                // the Logger wrapper as the platform runs. Each entry has its UNIX
                // timestamp pre-formatted as HH:MM:SS to match the UI's expectation.
                log: logger_1.pluginLogRing.snapshot().map((e) => ({
                    t: new Date(e.ts).toISOString().substring(11, 19),
                    level: e.level,
                    msg: e.msg,
                })),
                dps: Object.fromEntries(Object.entries(state.debug.rawDps).map(([k, v]) => [k, {
                        name: DPS_NAMES[k] ?? '',
                        value: typeof v === 'string' ? v.substring(0, 80) : String(v),
                    }])),
            },
        };
        try {
            await (0, atomic_write_1.atomicWriteFile)(file, JSON.stringify(snap, null, 2), { mode: 0o600 });
        }
        catch (e) {
            this.log.debug(`[UI] Snapshot write failed: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
    isDpsPayload(payload) {
        if (typeof payload !== 'object' || payload === null || !('data' in payload))
            return false;
        const payloadData = payload.data;
        if (typeof payloadData !== 'object' || payloadData === null || Array.isArray(payloadData))
            return false;
        const raw = payloadData;
        const coerced = {};
        for (const [k, v] of Object.entries(raw)) {
            if (v === null || v === undefined)
                continue;
            coerced[k] = typeof v === 'string' ? v : JSON.stringify(v);
        }
        Object.assign(payloadData, coerced);
        return true;
    }
}
exports.DeviceSession = DeviceSession;
