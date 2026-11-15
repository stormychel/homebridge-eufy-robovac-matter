"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateParser = void 0;
const WORK_STATUS_MAP = {
    0: 'idle', // STANDBY — also used for paused states
    1: 'idle', // SLEEP
    2: 'error', // FAULT
    3: 'idle', // CHARGING (docked)
    4: 'cleaning', // FAST_MAPPING
    5: 'cleaning', // CLEANING
    6: 'cleaning', // REMOTE_CTRL
    7: 'returning', // GO_HOME
    8: 'cleaning', // CRUISING
};
// Derived from error_code_list_standard.proto + legacy numeric codes for older firmware.
// The standard proto uses 4-digit codes (E1013, E2010, …); older firmware reports small
// integers 1-24. Both sets are merged here so decoding works across all firmware versions.
const ERROR_CODES = {
    // Legacy small-integer codes (older firmware)
    0: 'NONE',
    1: 'BUMPER STUCK',
    2: 'WHEEL STUCK',
    3: 'SIDE BRUSH STUCK',
    4: 'SUCTION FAN ERROR',
    5: 'DUSTBOX MISSING OR FULL',
    6: 'TRAPPED',
    7: 'CLIFF SENSOR DIRTY',
    8: 'ULTRASONIC SENSOR ERROR',
    9: 'INFRARED SENSOR ERROR',
    10: 'MAGNETIC INTERFERENCE',
    11: 'WALL SENSOR ERROR',
    12: 'DUST SENSOR ERROR',
    13: 'CHARGING CONTACTS DIRTY',
    14: 'CHARGING TIMEOUT',
    15: 'LOW BATTERY SHUTDOWN',
    16: 'STRONG MAGNETIC FIELD',
    17: 'BATTERY LOW',
    18: 'SHUTDOWN',
    19: 'MAGNETIC BOUNDARY ERROR',
    20: 'LDS SENSOR DIRTY',
    21: 'LDS SENSOR ERROR',
    22: 'FRONT COVER STUCK',
    23: 'PSD SENSOR ERROR',
    24: 'MIDDLE BRUSH STUCK',
    68: 'CAMERA SENSOR ERROR',
    69: 'COMPASS SENSOR ERROR',
    // Standard 4-digit codes from error_code_list_standard.proto
    // Wheel errors (E1xxx)
    1010: 'LEFT WHEEL OPEN CIRCUIT',
    1011: 'LEFT WHEEL SHORT CIRCUIT',
    1012: 'LEFT WHEEL ABNORMAL',
    1013: 'LEFT WHEEL OVERCURRENT',
    1020: 'RIGHT WHEEL OPEN CIRCUIT',
    1021: 'RIGHT WHEEL SHORT CIRCUIT',
    1022: 'RIGHT WHEEL ABNORMAL',
    1023: 'RIGHT WHEEL OVERCURRENT',
    1030: 'LEFT AND RIGHT WHEEL OPEN CIRCUIT',
    1031: 'LEFT AND RIGHT WHEEL SHORT CIRCUIT',
    1032: 'LEFT AND RIGHT WHEEL ABNORMAL',
    1033: 'LEFT AND RIGHT WHEEL OVERCURRENT',
    // Fan errors (E2xxx)
    2010: 'SUCTION FAN OPEN CIRCUIT',
    2011: 'SUCTION FAN SHORT CIRCUIT',
    2012: 'SUCTION FAN ABNORMAL',
    2013: 'SUCTION FAN ROTATION ABNORMAL',
    2020: 'LEFT FAN OPEN CIRCUIT',
    2021: 'LEFT FAN SHORT CIRCUIT',
    2022: 'LEFT FAN ABNORMAL',
    2023: 'LEFT FAN ROTATION ABNORMAL',
    2024: 'RIGHT FAN OPEN CIRCUIT',
    2025: 'RIGHT FAN SHORT CIRCUIT',
    2026: 'RIGHT FAN ABNORMAL',
    2027: 'RIGHT FAN ROTATION ABNORMAL',
    // Brush errors (E21xx, E22xx, E23xx)
    2110: 'MAIN BRUSH OPEN CIRCUIT',
    2111: 'MAIN BRUSH SHORT CIRCUIT',
    2112: 'MAIN BRUSH OVERCURRENT',
    2113: 'MAIN BRUSH ABNORMAL',
    2120: 'FRONT BRUSH OPEN CIRCUIT',
    2121: 'FRONT BRUSH SHORT CIRCUIT',
    2122: 'FRONT BRUSH OVERCURRENT',
    2123: 'REAR BRUSH OPEN CIRCUIT',
    2124: 'REAR BRUSH SHORT CIRCUIT',
    2125: 'REAR BRUSH OVERCURRENT',
    2210: 'SIDE BRUSH OPEN CIRCUIT',
    2211: 'SIDE BRUSH SHORT CIRCUIT',
    2212: 'SIDE BRUSH ABNORMAL',
    2213: 'SIDE BRUSH OVERCURRENT',
    2220: 'LEFT SIDE BRUSH OPEN CIRCUIT',
    2221: 'LEFT SIDE BRUSH SHORT CIRCUIT',
    2222: 'LEFT SIDE BRUSH ABNORMAL',
    2223: 'LEFT SIDE BRUSH OVERCURRENT',
    2224: 'RIGHT SIDE BRUSH OPEN CIRCUIT',
    2225: 'RIGHT SIDE BRUSH SHORT CIRCUIT',
    2226: 'RIGHT SIDE BRUSH ABNORMAL',
    2227: 'RIGHT SIDE BRUSH OVERCURRENT',
    2310: 'DUSTBOX NOT INSTALLED',
    2311: 'DUSTBOX IN USE OVER 10 HOURS',
    // Water system errors (E3xxx)
    3010: 'ROBOT WATER PUMP OPEN CIRCUIT',
    3011: 'ROBOT WATER PUMP SHORT CIRCUIT',
    3012: 'ROBOT WATER PUMP ABNORMAL',
    3013: 'ROBOT WATER TANK INSUFFICIENT',
    3020: 'ROBOT WATER TANK REMOVED',
    3110: 'LEFT MOP NOT INSTALLED',
    3111: 'RIGHT MOP NOT INSTALLED',
    3120: 'ROTATING MOTOR OPEN CIRCUIT',
    3121: 'ROTATING MOTOR SHORT CIRCUIT',
    3122: 'ROTATING MOTOR ABNORMAL',
    3123: 'ROTATING MOTOR JAMMED',
    3130: 'LIFTING MOTOR OPEN CIRCUIT',
    3131: 'LIFTING MOTOR SHORT CIRCUIT',
    3132: 'LIFTING MOTOR ABNORMAL',
    3133: 'LIFTING MOTOR JAMMED',
    // Sensor errors (E4xxx)
    4010: 'RADAR NO SIGNAL',
    4011: 'RADAR BLOCKED',
    4012: 'RADAR ROTATION ABNORMAL',
    4020: 'GYROSCOPE ABNORMAL',
    4030: 'TOF SENSOR NO SIGNAL',
    4031: 'TOF SENSOR BLOCKED',
    4040: 'CAMERA NO SIGNAL',
    4041: 'CAMERA BLOCKED',
    4090: 'WALL SENSOR NO SIGNAL',
    4091: 'WALL SENSOR BLOCKED',
    4111: 'LEFT FRONT COLLISION STUCK',
    4112: 'RIGHT FRONT COLLISION STUCK',
    4120: 'ULTRASONIC COMMUNICATION ERROR (CLEANING)',
    4121: 'ULTRASONIC COMMUNICATION ERROR',
    4130: 'LASER SHIELD STUCK',
    // Battery/power errors (E5xxx)
    5010: 'BATTERY OPEN CIRCUIT',
    5011: 'BATTERY SHORT CIRCUIT',
    5012: 'BATTERY CHARGING CURRENT LOW',
    5013: 'BATTERY DISCHARGE CURRENT HIGH',
    5014: 'LOW BATTERY SHUTDOWN',
    5015: 'LOW BATTERY — CANNOT SCHEDULE',
    5016: 'CHARGING CURRENT TOO HIGH',
    5017: 'CHARGING VOLTAGE ABNORMAL',
    5018: 'BATTERY TEMPERATURE ABNORMAL',
    5021: 'DISCHARGE HIGH TEMPERATURE',
    5022: 'DISCHARGE LOW TEMPERATURE',
    5023: 'CHARGING HIGH TEMPERATURE',
    5024: 'CHARGING LOW TEMPERATURE',
    5110: 'WI-FI ABNORMAL',
    5111: 'BLUETOOTH ABNORMAL',
    5112: 'INFRARED COMMUNICATION ABNORMAL',
    // Station errors (E6xxx)
    6010: 'CLEAN WATER TANK NOT INSTALLED',
    6011: 'CLEAN WATER TANK EMPTY',
    6012: 'CLEAN WATER PUMP OPEN CIRCUIT',
    6013: 'CLEAN WATER PUMP SHORT CIRCUIT',
    6014: 'THREE-WAY VALVE SHORT CIRCUIT',
    6020: 'DIRTY WATER TANK NOT INSTALLED',
    6021: 'DIRTY WATER TANK FULL',
    6022: 'DIRTY WATER PUMP OPEN CIRCUIT',
    6023: 'DIRTY WATER PUMP SHORT CIRCUIT',
    6024: 'DIRTY WATER TANK NOT SEALED',
    6025: 'DIRTY WATER TANK FULL OR NOT INSTALLED',
    6030: 'CLEANING DISC NOT INSTALLED',
    6031: 'CLEANING DISC WATER FULL',
    6032: 'CLEANING DISC MISSING OR FULL',
    6040: 'BLOWING FAN OPEN CIRCUIT',
    6041: 'BLOWING FAN SHORT CIRCUIT',
    6042: 'HEATING MODULE OPEN CIRCUIT',
    6043: 'NTC OPEN CIRCUIT',
    6110: 'VOLTAGE TRANSFORMER ABNORMAL',
    6111: 'DUSTBIN AIR LEAK',
    6112: 'DUSTBIN BLOCKED',
    6113: 'DUSTBAG NOT INSTALLED',
    6114: 'FAN OVERHEATED',
    6115: 'PRESSURE GAUGE ABNORMAL',
    6311: 'HAIR CUTTING COMPONENT JAMMED',
    // Navigation/mechanical errors (E7xxx)
    7000: 'SMALL SPACE TIMEOUT',
    7001: 'PARTIALLY SUSPENDED',
    7002: 'ROBOT LIFTED — WHEELS SUSPENDED',
    7003: 'STARTUP FALL DETECTED',
    7004: 'ROBOT STUCK',
    7010: 'ENTERED FORBIDDEN AREA',
    7011: 'ENTERED CARPET ZONE',
    7031: 'DOCKING FAILED',
    7033: 'EXPLORING BASE STATION FAILED',
    7034: 'STARTING POINT NOT FOUND',
    7035: 'DOCKING FAILED — BASE NOT POWERED',
    7036: 'DOCKING FAILED — OMNI-WHEEL JAMMED',
    7037: 'DOCKING FAILED — INFRARED INTERFERENCE',
    7040: 'UNDOCKING FAILED',
    7053: 'ROBOT TILTED',
    7055: 'BASE STATION NOT FOUND — MOPPING SKIPPED',
};
// DPS 158 fan suction index (0-4) → SuctionLevel (1-5)
// QUIET=0, STANDARD=1, TURBO=2, MAX=3, MAX_PLUS=4
const FAN_SUCTION_MAP = {
    0: 1, // QUIET
    1: 2, // STANDARD
    2: 3, // TURBO
    3: 4, // MAX
    4: 5, // MAX_PLUS
};
/**
 * Maximum number of DPS keys retained in `state.debug.rawDps`. Caps unbounded
 * growth over multi-week sessions — the X10 Pro Omni steady-state churn is
 * ~25 keys but firmware updates or seldom-seen one-shot responses can balloon
 * past that. Newest insertion order wins so the diagnostics surface always
 * shows the freshest data.
 */
const MAX_RAW_DPS_KEYS = 50;
/**
 * Trims a record to its last `max` insertion-ordered entries. Iteration order
 * in JavaScript objects is insertion-order for string keys, so reassignment
 * (`{ ...prev, key: value }`) moves the key to the end — the oldest keys end
 * up first and we drop them when over budget.
 */
function capRecord(rec, max) {
    const entries = Object.entries(rec);
    if (entries.length <= max)
        return rec;
    return Object.fromEntries(entries.slice(entries.length - max));
}
/** Parses DPS payload data into normalized vacuum state. */
class StateParser {
    codec;
    log;
    seenUnmappedDpsKeys = new Set();
    constructor(codec, log) {
        this.codec = codec;
        this.log = log;
    }
    processDps(rawDps, state) {
        // Cap rawDps to the most-recent keys to prevent unbounded memory growth.
        // Over long-running sessions (weeks) the device pushes a steady set of ~25
        // keys but ad-hoc / one-shot DPS responses can add more over time.  Keep
        // the freshest values per key while bounding the total size — the UI's
        // Diagnostics tab only needs a snapshot, not full history.
        const mergedDps = { ...state.debug.rawDps, ...rawDps };
        const cappedDps = capRecord(mergedDps, MAX_RAW_DPS_KEYS);
        const newState = {
            ...state,
            connectivity: { ...state.connectivity, online: true },
            power: { ...state.power },
            // Pass arrays and objects by reference instead of shallow cloning them to
            // reduce garbage collection (GC) churn during high-frequency MQTT state syncs.
            activity: { ...state.activity },
            debug: { rawDps: cappedDps },
        };
        this.log.info(`DPS update received. Keys: ${Object.keys(rawDps).join(', ')}`);
        for (const [dpsKey, value] of Object.entries(rawDps)) {
            try {
                if (!value)
                    continue;
                switch (dpsKey) {
                    case '153':
                        this.processWorkStatus(value, newState);
                        break;
                    case '154':
                        this.processCleanParamResponse(value, newState);
                        break;
                    case '172':
                        this.log.debug(`[Maps] DPS 172 raw value (first 120): ${String(value).substring(0, 120)}`);
                        this.tryProcessMultiMapsResponse(value, newState);
                        break;
                    case '158':
                        this.processCleanSpeedIndex(value, newState);
                        break;
                    case '163':
                        this.processBatteryLevel(value, newState);
                        break;
                    case '165':
                        this.processUniversalData(value, newState);
                        break;
                    case '152':
                        this.processModeCtrlResponse(value);
                        break;
                    case '167':
                        // DPS 167 carries CleanStatistics (last-session + lifetime totals);
                        // the previous mapping had this on DPS 168 which is actually the
                        // ConsumableResponse channel. Verified against jeppesens/eufy-clean.
                        this.processCleanStatistics(value, newState);
                        break;
                    case '168':
                        this.processConsumables(value, newState);
                        break;
                    case '173':
                        this.processStationStatus(value, newState);
                        break;
                    case '177':
                        this.processErrorCode(value, newState);
                        break;
                    case '180':
                        this.processScenes(value, newState);
                        break;
                    case 'clean_param':
                        this.processCleanParam(value, newState);
                        break;
                    case 'work_mode':
                        this.processWorkMode(value, newState);
                        break;
                    case 'clean_speed':
                        this.processCleanSpeedString(value, newState);
                        break;
                    default:
                        if (!this.seenUnmappedDpsKeys.has(dpsKey)) {
                            this.seenUnmappedDpsKeys.add(dpsKey);
                            // Log full value for diagnostic DPS keys; others get first 80 chars
                            const fullLogKeys = new Set(['180', '176', '157', '156', '172']);
                            const logVal = fullLogKeys.has(dpsKey)
                                ? String(value)
                                : String(value).substring(0, 80);
                            this.log.debug(`Ignoring unmapped DPS key: ${dpsKey} (value: ${logVal})`);
                        }
                        this.tryProcessRooms(dpsKey, value, newState);
                }
            }
            catch (error) {
                this.log.error(`Failed to parse DPS ${dpsKey}: ${String(error)}`);
            }
        }
        return newState;
    }
    processBatteryLevel(rawValue, state) {
        const parsed = Number.parseInt(rawValue, 10);
        if (Number.isNaN(parsed))
            throw new Error(`Invalid battery level payload: ${rawValue}`);
        state.power.batteryPercent = Math.min(Math.max(parsed, 0), 100);
    }
    processWorkStatus(base64Val, state) {
        const decoded = this.codec.decode('WorkStatus', base64Val);
        if (decoded.state === undefined)
            return;
        const rawState = decoded.state;
        // STANDBY (0) covers both "idle" and any paused sub-state — preserve the
        // cleaning context so Matter shows PAUSED instead of STOPPED.
        if (rawState === 0 && state.activity.runMode === 'cleaning') {
            state.activity.paused = true;
            return;
        }
        const mode = WORK_STATUS_MAP[rawState] ?? 'idle';
        state.activity.runMode = mode;
        state.power.docked = rawState === 3;
        // Charging sub-state: 0=DOING (actively charging), 1=DONE (full), 2=ABNORMAL
        if (rawState === 3) {
            state.power.charging = (decoded.charging?.state ?? 0) !== 1;
        }
        else {
            state.power.charging = false;
        }
        // Cleaning sub-state 1 = PAUSED; all other modes are not paused
        if (mode === 'cleaning') {
            state.activity.paused = decoded.cleaning?.state === 1;
        }
        else {
            state.activity.paused = false;
        }
        state.activity.activeError = mode === 'error' ? 'Error Active' : undefined;
    }
    processModeCtrlResponse(base64Val) {
        try {
            const decoded = this.codec.decode('ModeCtrlResponse', base64Val);
            const result = decoded.result ?? 0;
            const resultLabel = result === 0 ? 'SUCCESS' : `FAILED (result=${result})`;
            const methodLabel = decoded.method ?? 0;
            this.log.info(`DPS 152 ModeCtrlResponse: method=${methodLabel} → ${resultLabel}`);
        }
        catch (e) {
            this.log.debug(`DPS 152 ModeCtrlResponse decode failed: ${String(e)}. Raw: ${base64Val}`);
        }
    }
    /**
     * DPS 173 — `proto.cloud.StationResponse` (NOT WorkStatus, despite what an
     * older version of this parser assumed). Confirmed against jeppesens/eufy-
     * clean's reference Home Assistant integration which decodes this same DPS
     * as StationResponse to extract `clean_water.value` (0-100%).
     *
     * Fields we care about:
     *   - `status` (StationStatus):
     *       state enum   — 0=IDLE, 1=WASHING, 2=DRYING, 3=REMOVING_SCALE
     *       collecting_dust, clear_water_adding, waste_water_recycling, …  bool flags
     *   - `clean_water` (Numerical{value}) — 0-100% clean reservoir level.
     *       Default-valued Numerical (value=0) arrives on the wire as an empty
     *       submessage (`2A 00`), so absence-of-value still means "0%".
     *
     * Dirty-tank percentage is computed client-side by the Eufy app and never
     * appears on the wire — we leave `state.water.dirty` unset.
     */
    processStationStatus(base64Val, state) {
        for (const withPrefix of [true, false]) {
            try {
                const decoded = this.codec.decode('proto.cloud.StationResponse', base64Val, withPrefix);
                const status = decoded.status;
                // Only commit changes when the decode produced at least one recognisable
                // field — otherwise we may have hit a foreign payload and shouldn't
                // overwrite previously-populated state with empty defaults.
                if (!status && decoded.cleanWater === undefined)
                    continue;
                const parts = [];
                if (status?.collectingDust)
                    parts.push('dust-collecting');
                if (status?.state === 1)
                    parts.push('mop-washing');
                if (status?.state === 2)
                    parts.push('mop-drying');
                if (status?.clearWaterAdding)
                    parts.push('filling-clean-water');
                if (status?.wasteWaterRecycling)
                    parts.push('draining-waste-water');
                state.activity.stationActivity = parts;
                // clean_water present as a (possibly empty) Numerical → reservoir level
                // is being reported. Empty submessage means 0%. Clamp defensively.
                if (decoded.cleanWater !== undefined) {
                    const v = decoded.cleanWater.value ?? 0;
                    state.water = { clean: Math.min(100, Math.max(0, v)), dirty: state.water.dirty };
                }
                if (parts.length > 0) {
                    this.log.info(`Station status (DPS 173): ${parts.join(', ')}`);
                    state.activity.runMode = 'idle';
                    state.activity.paused = false;
                    state.power.docked = true;
                    state.power.charging = false;
                }
                return;
            }
            catch { /* try other prefix */ }
        }
    }
    processErrorCode(base64Val, state) {
        const decoded = this.codec.decode('ErrorCode', base64Val);
        const activeErrors = (decoded.error ?? []).filter(code => code !== 0);
        if (activeErrors.length > 0) {
            const code = activeErrors[0];
            state.activity.activeError = ERROR_CODES[code] ?? `Error ${code}`;
            state.activity.activeErrorCode = code;
            state.activity.runMode = 'error';
        }
        else {
            state.activity.activeError = undefined;
            state.activity.activeErrorCode = undefined;
        }
    }
    /**
     * DPS 180 — SceneResponse: list of scenes the user defined in the Eufy app.
     * Each scene has a `name` and a `mapid` linking it to a floor. We group the
     * names per mapId so the Matter cluster builder can derive a floor name
     * from scene keywords (e.g. "Beneden volledig schoonmaken" → "Beneden" for
     * mapId 10) when the user hasn't explicitly named the floor in plugin config.
     */
    processScenes(base64Val, state) {
        for (const withPrefix of [true, false]) {
            try {
                const decoded = this.codec.decode('proto.cloud.SceneResponse', base64Val, withPrefix);
                if (!decoded.infos?.length)
                    continue;
                const grouped = {};
                for (const info of decoded.infos) {
                    if (!info.name || info.mapid === undefined || info.mapid === 0)
                        continue;
                    if (!grouped[info.mapid])
                        grouped[info.mapid] = [];
                    grouped[info.mapid].push(info.name);
                }
                state.activity.scenesByMapId = grouped;
                return;
            }
            catch { /* try other prefix */ }
        }
    }
    /**
     * DPS 165 — MAP_DATA: contains room names/IDs in UniversalDataResponse.
     * This is the primary source for room discovery on modern Eufy robots.
     */
    processUniversalData(base64Val, state) {
        const errors = [];
        for (const withPrefix of [true, false]) {
            try {
                const decoded = this.codec.decode('proto.cloud.UniversalDataResponse', base64Val, withPrefix);
                const table = decoded.curMapRoom;
                if (!table?.data?.length) {
                    this.log.debug(`DPS 165 decoded (withPrefix=${withPrefix}) but curMapRoom.data is empty. decoded=${JSON.stringify(decoded).substring(0, 120)}`);
                    continue;
                }
                const rooms = this.normalizeRoomArray(table.data);
                if (rooms.length > 0) {
                    const mapIdNum = (table.mapId !== undefined && table.mapId !== 0) ? table.mapId : undefined;
                    this.log.info(`Discovered ${rooms.length} rooms from DPS 165${mapIdNum !== undefined ? ` (mapId=${mapIdNum})` : ''}: ${rooms.map((r) => r.name).join(', ')}`);
                    if (mapIdNum !== undefined) {
                        const isNewFloor = !state.activity.knownMaps.some((m) => m.mapId === mapIdNum);
                        if (isNewFloor) {
                            // First time seeing this floor — print a copy-pasteable config
                            // snippet so the user can give the floor a friendly name in
                            // their Homebridge config.json.
                            this.log.info(`[Floors] New floor discovered (mapId=${mapIdNum}). Add this to your plugin config under "floors" to give it a name:`);
                            this.log.info(`[Floors]   { "mapId": ${mapIdNum}, "name": "Your floor name" }`);
                        }
                        state.activity.currentMapId = mapIdNum;
                        // Upsert rooms into knownMaps so all floors accumulate across sessions.
                        const existingIndex = state.activity.knownMaps.findIndex((m) => m.mapId === mapIdNum);
                        if (existingIndex >= 0) {
                            // Uphold immutability by not mutating the existing map object in-place.
                            const newMaps = [...state.activity.knownMaps];
                            const existingMap = newMaps[existingIndex];
                            if (existingMap) {
                                // Preserve the user-configured floor name (from `floors` config)
                                // when freshening rooms — DPS 165 only carries room data, not
                                // the floor label, so overwriting `name` here would drop it.
                                const updated = existingMap.name !== undefined
                                    ? { mapId: existingMap.mapId, rooms, name: existingMap.name }
                                    : { mapId: existingMap.mapId, rooms };
                                newMaps[existingIndex] = updated;
                            }
                            state.activity.knownMaps = newMaps;
                        }
                        else {
                            // Assign explicitly via MapRooms type so typescript infers it's not undefined
                            const newMap = { mapId: mapIdNum, rooms };
                            state.activity.knownMaps = [...state.activity.knownMaps, newMap];
                        }
                        // availableRooms = flat union of all known maps for backward-compat consumers.
                        state.activity.availableRooms = state.activity.knownMaps.flatMap((m) => m.rooms);
                    }
                    else {
                        // No mapId in payload — fall back to mapless mode (single-floor devices).
                        state.activity.availableRooms = rooms;
                    }
                    return;
                }
            }
            catch (e) {
                errors.push(`withPrefix=${withPrefix}: ${String(e)}`);
            }
        }
        this.log.warn(`DPS 165 received but no rooms decoded. Errors: [${errors.join('; ')}]. Raw (first 80): ${base64Val.substring(0, 80)}`);
    }
    /**
     * DPS 154 — tries to decode as MultiMapsManageResponse (MAP_GET_ALL reply).
     * Returns true if the payload was a valid multi-map response (method=7) and was handled.
     * Returns false when the payload is not a MAP_GET_ALL response, so the caller can
     * fall through to CleanParamResponse handling.
     */
    tryProcessMultiMapsResponse(base64Val, state) {
        for (const withPrefix of [true, false]) {
            try {
                const decoded = this.codec.decode('proto.cloud.MultiMapsManageResponse', base64Val, withPrefix);
                // method=7 is MAP_GET_ALL; anything else is a different operation (not our request)
                if (decoded.method !== 7)
                    continue;
                const maps = decoded.completeMaps?.completeMap;
                if (!maps?.length) {
                    this.log.debug(`[Maps] MultiMapsManageResponse MAP_GET_ALL received, result=${decoded.result} — no completeMaps in DP payload (may arrive via P2P)`);
                    return true;
                }
                let discovered = 0;
                for (const map of maps) {
                    if (!map.mapId)
                        continue;
                    const rooms = this.normalizeRoomArray(map.roomParams?.rooms);
                    const floorName = (typeof map.name === 'string' && map.name.trim()) ? map.name.trim() : `Floor ${map.mapId}`;
                    this.log.info(`[Maps] Discovered floor from MAP_GET_ALL: mapId=${map.mapId} name="${floorName}" with ${rooms.length} rooms`);
                    const existingIndex = state.activity.knownMaps.findIndex((m) => m.mapId === map.mapId);
                    if (existingIndex >= 0) {
                        const newMaps = [...state.activity.knownMaps];
                        newMaps[existingIndex] = { mapId: map.mapId, rooms };
                        state.activity.knownMaps = newMaps;
                    }
                    else {
                        state.activity.knownMaps = [...state.activity.knownMaps, { mapId: map.mapId, rooms }];
                    }
                    discovered++;
                }
                if (discovered > 0) {
                    state.activity.availableRooms = state.activity.knownMaps.flatMap((m) => m.rooms);
                }
                return true;
            }
            catch { /* not a valid MultiMapsManageResponse */ }
        }
        return false;
    }
    /**
     * DPS 154 — CleanParamResponse: cleaning parameters including fan speed, clean type, and mop level.
     */
    processCleanParamResponse(base64Val, state) {
        for (const withPrefix of [true, false]) {
            try {
                const decoded = this.codec.decode('proto.cloud.CleanParamResponse', base64Val, withPrefix);
                // Prefer the param that's actually executing: running_clean_param (during a
                // run) wins over the persisted defaults. Otherwise fall back to clean_param,
                // then area_clean_param so room-clean echoes are still surfaced.
                const param = decoded.runningCleanParam ?? decoded.cleanParam ?? decoded.areaCleanParam;
                if (!param)
                    continue;
                if (param.fan?.suction !== undefined) {
                    const mapped = FAN_SUCTION_MAP[param.fan.suction];
                    if (mapped !== undefined)
                        state.activity.suctionLevel = mapped;
                }
                if (param.cleanType?.value !== undefined) {
                    const modes = { 0: 'VACUUM_ONLY', 1: 'MOP_ONLY', 2: 'VACUUM_AND_MOP', 3: 'VACUUM_AND_MOP' };
                    state.activity.cleanMode = modes[param.cleanType.value] ?? 'AUTO';
                }
                if (param.mopMode?.level !== undefined) {
                    const mopLevels = { 0: 'LOW', 1: 'MIDDLE', 2: 'HIGH' };
                    state.activity.mopLevel = mopLevels[param.mopMode.level] ?? 'MIDDLE';
                }
                if (param.cleanExtent?.value !== undefined) {
                    const extents = { 0: 'NORMAL', 1: 'NARROW', 2: 'QUICK' };
                    state.activity.cleanExtent = extents[param.cleanExtent.value] ?? 'NORMAL';
                }
                state.activity.cleaningProfile = this.detectProfile(param);
                return;
            }
            catch { /* try other prefix */ }
        }
    }
    /**
     * Maps an observed CleanParam (suction + mop level + extent + clean type) back to
     * the closest CleaningProfile so the Apple Home "Suction Power" dropdown reflects
     * the device's currently active settings. Falls back to AUTO when the combination
     * doesn't match any known profile (e.g. legacy device defaults).
     */
    detectProfile(p) {
        const suction = p.fan?.suction;
        const mop = p.mopMode?.level;
        const extent = p.cleanExtent?.value;
        const ctype = p.cleanType?.value;
        const smartOn = p.smartModeSw?.value === true;
        // smart_mode_sw=true (the Eufy app's "AI-automatisering" toggle) is the
        // strongest AUTO signal — the robot is picking params on its own.
        if (smartOn)
            return 'AUTO';
        // Order matters: DEEP_CLEAN and QUIET have unique cleanType signatures, check first.
        if (ctype === 3)
            return 'DEEP_CLEAN'; // SWEEP_THEN_MOP
        if (ctype === 0 && suction === 0)
            return 'QUIET'; // sweep-only + quiet
        if (suction === 0 && mop === 0 && extent === 2)
            return 'LOW_POWER'; // quiet + drier + quick
        if (suction === 1 && extent === 2)
            return 'QUICK'; // standard + quick route
        return 'AUTO'; // default / catch-all
    }
    /**
     * DPS 168 — CleanStatistics: area (m²) and duration (seconds) for the current session.
     * Note: DPS key 168 is observed on X-series models; may vary by firmware.
     */
    processCleanStatistics(base64Val, state) {
        for (const withPrefix of [true, false]) {
            try {
                const decoded = this.codec.decode('proto.cloud.CleanStatistics', base64Val, withPrefix);
                let handled = false;
                if (decoded.single) {
                    const { cleanDuration, cleanArea } = decoded.single;
                    if (cleanDuration !== undefined || cleanArea !== undefined) {
                        state.activity.cleanSession = {
                            durationSeconds: cleanDuration ?? state.activity.cleanSession?.durationSeconds ?? 0,
                            areaSqCm: cleanArea ?? state.activity.cleanSession?.areaSqCm ?? 0,
                        };
                        this.log.debug(`Clean session — duration: ${state.activity.cleanSession.durationSeconds}s, area: ${state.activity.cleanSession.areaSqCm} m²`);
                        handled = true;
                    }
                }
                // Prefer `userTotal` (resets per user) over `total` (only resets at
                // factory reset). Both can appear; either gives a meaningful "lifetime"
                // figure to surface in the plugin UI.
                const lifetimeSource = decoded.userTotal ?? decoded.total;
                if (lifetimeSource) {
                    const { cleanDuration, cleanArea, cleanCount } = lifetimeSource;
                    if (cleanDuration !== undefined || cleanArea !== undefined || cleanCount !== undefined) {
                        state.activity.lifetime = {
                            durationSeconds: cleanDuration ?? state.activity.lifetime?.durationSeconds ?? 0,
                            areaSqCm: cleanArea ?? state.activity.lifetime?.areaSqCm ?? 0,
                            cleans: cleanCount ?? state.activity.lifetime?.cleans ?? 0,
                        };
                        this.log.debug(`Clean lifetime — cleans: ${state.activity.lifetime.cleans}, `
                            + `area: ${state.activity.lifetime.areaSqCm} m², duration: ${state.activity.lifetime.durationSeconds}s`);
                        handled = true;
                    }
                }
                if (handled)
                    return;
            }
            catch { /* try other prefix */ }
        }
    }
    /**
     * DPS 175 — ConsumableResponse: usage hours for brushes, filters, mops, etc.
     * Note: DPS key 175 is observed on X-series models; may vary by firmware.
     */
    // DPS 179 is undocumented robot telemetry — does NOT carry water levels.
    // Water reservoir % lives on DPS 173 (StationResponse.clean_water) and is
    // already handled by processStationStatus above. We ignore 179 entirely.
    processConsumables(base64Val, state) {
        for (const withPrefix of [true, false]) {
            try {
                const decoded = this.codec.decode('proto.cloud.ConsumableResponse', base64Val, withPrefix);
                if (!decoded.runtime)
                    continue;
                const r = decoded.runtime;
                state.activity.consumables = {
                    ...(r.sideBrush?.duration !== undefined ? { sideBrushHours: r.sideBrush.duration } : {}),
                    ...(r.rollingBrush?.duration !== undefined ? { rollingBrushHours: r.rollingBrush.duration } : {}),
                    ...(r.filterMesh?.duration !== undefined ? { filterMeshHours: r.filterMesh.duration } : {}),
                    ...(r.mop?.duration !== undefined ? { mopHours: r.mop.duration } : {}),
                    ...(r.dustbag?.duration !== undefined ? { dustbagHours: r.dustbag.duration } : {}),
                    ...(r.dirtyWaterfilter?.duration !== undefined ? { dirtyWaterFilterHours: r.dirtyWaterfilter.duration } : {}),
                };
                this.log.info(`Consumable hours — side brush: ${r.sideBrush?.duration ?? '?'}h, ` +
                    `main brush: ${r.rollingBrush?.duration ?? '?'}h, ` +
                    `filter: ${r.filterMesh?.duration ?? '?'}h, ` +
                    `mop: ${r.mop?.duration ?? '?'}h`);
                return;
            }
            catch { /* try other prefix */ }
        }
    }
    /**
     * DPS 158 — CLEAN_SPEED: suction level as integer index (0=quiet … 4=max+).
     * Named `clean_param` DPS key is handled separately for older model compatibility.
     */
    processCleanSpeedIndex(rawValue, state) {
        const index = Number.parseInt(rawValue, 10);
        const mapped = FAN_SUCTION_MAP[index];
        if (mapped !== undefined)
            state.activity.suctionLevel = mapped;
    }
    processCleanParam(rawValue, state) {
        const rooms = this.extractRooms(rawValue);
        if (rooms.length > 0) {
            state.activity.availableRooms = rooms;
        }
    }
    /**
     * Called for every DPS key that isn't explicitly handled. Tries to extract
     * room info from both JSON and protobuf formats.
     */
    tryProcessRooms(dpsKey, value, state) {
        const rooms = this.extractRooms(value);
        // Only replace the room list if we found more rooms than we already have,
        // so a spurious single-room decode from an unrelated DPS key cannot clobber
        // the full room list discovered from DPS 165.
        if (rooms.length > state.activity.availableRooms.length) {
            this.log.info(`Discovered ${rooms.length} rooms from DPS '${dpsKey}': ${rooms.map((r) => r.name).join(', ')}`);
            state.activity.availableRooms = rooms;
        }
    }
    /**
     * Tries to extract a room list from a DPS value.
     * Supports:
     *  - JSON: `{ "rooms": [{ "id": 1, "name": "Kitchen" }] }`
     *  - Protobuf RoomParams (with or without varint length prefix)
     */
    extractRooms(value) {
        if (value.startsWith('{')) {
            try {
                const parsed = JSON.parse(value);
                const rooms = this.normalizeRoomArray(parsed.rooms);
                if (rooms.length > 0)
                    return rooms;
            }
            catch { /* not valid JSON or no rooms */ }
            return [];
        }
        // Performance optimization: skip protobuf decode attempts for plain numbers
        // or strings too short to be valid protobuf Base64 room data. This avoids
        // throwing and catching thousands of exceptions during state polling.
        if (value.length < 8 || /^[0-9]+$/.test(value)) {
            return [];
        }
        for (const withPrefix of [true, false]) {
            try {
                const decoded = this.codec.decode('proto.cloud.stream.RoomParams', value, withPrefix);
                const rooms = this.normalizeRoomArray(decoded.rooms);
                if (rooms.length > 0)
                    return rooms;
            }
            catch { /* not a valid RoomParams */ }
        }
        return [];
    }
    normalizeRoomArray(raw) {
        if (!Array.isArray(raw))
            return [];
        return raw
            .map((entry) => {
            if (typeof entry !== 'object' || entry === null)
                return null;
            const r = entry;
            const id = r.id !== undefined ? String(r.id) : undefined;
            if (!id || id === '0')
                return null;
            const name = (typeof r.name === 'string' && r.name.trim())
                ? r.name.trim()
                : (typeof r.label === 'string' && r.label.trim())
                    ? r.label.trim()
                    : `Room ${id}`;
            return { id, name };
        })
            .filter((r) => r !== null);
    }
    processWorkMode(rawValue, state) {
        const workMode = Number.parseInt(rawValue, 10);
        const mapped = { 0: 'AUTO', 1: 'VACUUM_ONLY', 2: 'VACUUM_AND_MOP', 3: 'MOP_ONLY' }[workMode] ?? 'AUTO';
        state.activity.cleanMode = mapped;
    }
    /** Named DPS key `clean_speed` from older/alternate firmware (values 1-5). */
    processCleanSpeedString(rawValue, state) {
        const level = Number.parseInt(rawValue, 10);
        if (level >= 1 && level <= 5) {
            state.activity.suctionLevel = level;
        }
    }
}
exports.StateParser = StateParser;
