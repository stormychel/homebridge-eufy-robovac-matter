"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatterMappers = exports.MatterOperationalErrorState = exports.MatterRvcRunModeTag = exports.MatterCommonModeTag = exports.MatterRvcCleanModeTag = exports.MatterRvcCleanMode = exports.MatterChargeState = exports.MatterRvcRunMode = exports.MatterOperationalState = void 0;
var MatterOperationalState;
(function (MatterOperationalState) {
    MatterOperationalState[MatterOperationalState["STOPPED"] = 0] = "STOPPED";
    MatterOperationalState[MatterOperationalState["RUNNING"] = 1] = "RUNNING";
    MatterOperationalState[MatterOperationalState["PAUSED"] = 2] = "PAUSED";
    MatterOperationalState[MatterOperationalState["ERROR"] = 3] = "ERROR";
    // RvcOperationalState (Matter 1.2, cluster 0x0061) extends OperationalState with:
    MatterOperationalState[MatterOperationalState["SEEKING_CHARGER"] = 64] = "SEEKING_CHARGER";
    MatterOperationalState[MatterOperationalState["CHARGING"] = 65] = "CHARGING";
    MatterOperationalState[MatterOperationalState["DOCKED"] = 66] = "DOCKED";
})(MatterOperationalState || (exports.MatterOperationalState = MatterOperationalState = {}));
var MatterRvcRunMode;
(function (MatterRvcRunMode) {
    MatterRvcRunMode[MatterRvcRunMode["IDLE"] = 0] = "IDLE";
    MatterRvcRunMode[MatterRvcRunMode["CLEANING"] = 1] = "CLEANING";
    MatterRvcRunMode[MatterRvcRunMode["RETURNING_HOME"] = 2] = "RETURNING_HOME";
})(MatterRvcRunMode || (exports.MatterRvcRunMode = MatterRvcRunMode = {}));
var MatterChargeState;
(function (MatterChargeState) {
    MatterChargeState[MatterChargeState["UNKNOWN"] = 0] = "UNKNOWN";
    MatterChargeState[MatterChargeState["IS_NOT_CHARGING"] = 1] = "IS_NOT_CHARGING";
    MatterChargeState[MatterChargeState["IS_AT_MAX_CHARGE"] = 2] = "IS_AT_MAX_CHARGE";
    MatterChargeState[MatterChargeState["IS_CHARGING"] = 3] = "IS_CHARGING";
})(MatterChargeState || (exports.MatterChargeState = MatterChargeState = {}));
var MatterRvcCleanMode;
(function (MatterRvcCleanMode) {
    MatterRvcCleanMode[MatterRvcCleanMode["AUTO"] = 0] = "AUTO";
    MatterRvcCleanMode[MatterRvcCleanMode["VACUUM_ONLY"] = 1] = "VACUUM_ONLY";
    MatterRvcCleanMode[MatterRvcCleanMode["MOP_ONLY"] = 2] = "MOP_ONLY";
    MatterRvcCleanMode[MatterRvcCleanMode["VACUUM_AND_MOP"] = 3] = "VACUUM_AND_MOP";
    MatterRvcCleanMode[MatterRvcCleanMode["SPOT_CLEAN"] = 4] = "SPOT_CLEAN";
    // Cleaning-profile (Suction Power) modes — share the RvcCleanMode cluster so
    // Apple Home can group them by tag into a separate "Suction Power" dropdown.
    // Apple's UI only renders these four extra tags plus AUTO (5 total); other
    // Common Mode tags (DAY/NIGHT/MIN/MAX/LOW_NOISE) are silently dropped.
    MatterRvcCleanMode[MatterRvcCleanMode["PROFILE_QUICK"] = 5] = "PROFILE_QUICK";
    MatterRvcCleanMode[MatterRvcCleanMode["PROFILE_QUIET"] = 6] = "PROFILE_QUIET";
    MatterRvcCleanMode[MatterRvcCleanMode["PROFILE_LOW_POWER"] = 7] = "PROFILE_LOW_POWER";
    MatterRvcCleanMode[MatterRvcCleanMode["PROFILE_DEEP_CLEAN"] = 8] = "PROFILE_DEEP_CLEAN";
})(MatterRvcCleanMode || (exports.MatterRvcCleanMode = MatterRvcCleanMode = {}));
var MatterRvcCleanModeTag;
(function (MatterRvcCleanModeTag) {
    MatterRvcCleanModeTag[MatterRvcCleanModeTag["DEEP_CLEAN"] = 16384] = "DEEP_CLEAN";
    MatterRvcCleanModeTag[MatterRvcCleanModeTag["VACUUM"] = 16385] = "VACUUM";
    MatterRvcCleanModeTag[MatterRvcCleanModeTag["MOP"] = 16386] = "MOP";
    MatterRvcCleanModeTag[MatterRvcCleanModeTag["VACUUM_THEN_MOP"] = 16387] = "VACUUM_THEN_MOP";
})(MatterRvcCleanModeTag || (exports.MatterRvcCleanModeTag = MatterRvcCleanModeTag = {}));
/**
 * Common ModeBase tags (shared across Matter Mode clusters). Apple Home uses
 * these to group / label modes — e.g. the Quick / Quiet / LowEnergy tags drive
 * the "Suction Power" dropdown for Matter robovacs.
 *
 * Tag values from Matter 1.3 spec, table 1.10.7 (Common Mode Tags namespace).
 */
var MatterCommonModeTag;
(function (MatterCommonModeTag) {
    MatterCommonModeTag[MatterCommonModeTag["AUTO"] = 0] = "AUTO";
    MatterCommonModeTag[MatterCommonModeTag["QUICK"] = 1] = "QUICK";
    MatterCommonModeTag[MatterCommonModeTag["QUIET"] = 2] = "QUIET";
    MatterCommonModeTag[MatterCommonModeTag["LOW_NOISE"] = 3] = "LOW_NOISE";
    MatterCommonModeTag[MatterCommonModeTag["LOW_ENERGY"] = 4] = "LOW_ENERGY";
    MatterCommonModeTag[MatterCommonModeTag["VACATION"] = 5] = "VACATION";
    MatterCommonModeTag[MatterCommonModeTag["MIN"] = 6] = "MIN";
    MatterCommonModeTag[MatterCommonModeTag["MAX"] = 7] = "MAX";
    MatterCommonModeTag[MatterCommonModeTag["NIGHT"] = 8] = "NIGHT";
    MatterCommonModeTag[MatterCommonModeTag["DAY"] = 9] = "DAY";
})(MatterCommonModeTag || (exports.MatterCommonModeTag = MatterCommonModeTag = {}));
var MatterRvcRunModeTag;
(function (MatterRvcRunModeTag) {
    MatterRvcRunModeTag[MatterRvcRunModeTag["IDLE"] = 16384] = "IDLE";
    MatterRvcRunModeTag[MatterRvcRunModeTag["CLEANING"] = 16385] = "CLEANING";
})(MatterRvcRunModeTag || (exports.MatterRvcRunModeTag = MatterRvcRunModeTag = {}));
var MatterOperationalErrorState;
(function (MatterOperationalErrorState) {
    MatterOperationalErrorState[MatterOperationalErrorState["NO_ERROR"] = 0] = "NO_ERROR";
    MatterOperationalErrorState[MatterOperationalErrorState["STUCK"] = 65] = "STUCK";
    MatterOperationalErrorState[MatterOperationalErrorState["DUST_BIN_MISSING"] = 66] = "DUST_BIN_MISSING";
    MatterOperationalErrorState[MatterOperationalErrorState["WATER_TANK_EMPTY"] = 67] = "WATER_TANK_EMPTY";
    MatterOperationalErrorState[MatterOperationalErrorState["WATER_TANK_MISSING"] = 68] = "WATER_TANK_MISSING";
    MatterOperationalErrorState[MatterOperationalErrorState["MOP_CLEANING_PAD_MISSING"] = 69] = "MOP_CLEANING_PAD_MISSING";
    MatterOperationalErrorState[MatterOperationalErrorState["UNABLE_TO_START_OR_RESUME"] = 71] = "UNABLE_TO_START_OR_RESUME";
    MatterOperationalErrorState[MatterOperationalErrorState["FAILED_TO_FIND_CHARGING_DOCK"] = 72] = "FAILED_TO_FIND_CHARGING_DOCK";
})(MatterOperationalErrorState || (exports.MatterOperationalErrorState = MatterOperationalErrorState = {}));
// Maps DPS 177 raw integer error codes to granular Matter RVC error states.
// Codes not in this table fall back to STUCK (most general "blocked" state).
const ERROR_CODE_TO_MATTER_STATE = {
    // ── Stuck / physically trapped ───────────────────────────────────────────
    1: MatterOperationalErrorState.STUCK, // BUMPER STUCK
    2: MatterOperationalErrorState.STUCK, // WHEEL STUCK
    3: MatterOperationalErrorState.STUCK, // SIDE BRUSH STUCK
    6: MatterOperationalErrorState.STUCK, // TRAPPED
    22: MatterOperationalErrorState.STUCK, // FRONT COVER STUCK
    24: MatterOperationalErrorState.STUCK, // MIDDLE BRUSH STUCK
    // Wheel motor errors (E1xxx) — robot can't move
    1010: MatterOperationalErrorState.STUCK, 1011: MatterOperationalErrorState.STUCK,
    1012: MatterOperationalErrorState.STUCK, 1013: MatterOperationalErrorState.STUCK,
    1020: MatterOperationalErrorState.STUCK, 1021: MatterOperationalErrorState.STUCK,
    1022: MatterOperationalErrorState.STUCK, 1023: MatterOperationalErrorState.STUCK,
    1030: MatterOperationalErrorState.STUCK, 1031: MatterOperationalErrorState.STUCK,
    1032: MatterOperationalErrorState.STUCK, 1033: MatterOperationalErrorState.STUCK,
    // Collision / navigation stuck (E4xxx, E7xxx)
    4111: MatterOperationalErrorState.STUCK, // LEFT FRONT COLLISION STUCK
    4112: MatterOperationalErrorState.STUCK, // RIGHT FRONT COLLISION STUCK
    4130: MatterOperationalErrorState.STUCK, // LASER SHIELD STUCK
    7000: MatterOperationalErrorState.STUCK, // SMALL SPACE TIMEOUT
    7001: MatterOperationalErrorState.STUCK, // PARTIALLY SUSPENDED
    7002: MatterOperationalErrorState.STUCK, // ROBOT LIFTED — WHEELS SUSPENDED
    7003: MatterOperationalErrorState.STUCK, // STARTUP FALL DETECTED
    7004: MatterOperationalErrorState.STUCK, // ROBOT STUCK
    7053: MatterOperationalErrorState.STUCK, // ROBOT TILTED
    // ── Dust bin / bag missing ───────────────────────────────────────────────
    5: MatterOperationalErrorState.DUST_BIN_MISSING, // DUSTBOX MISSING OR FULL
    2310: MatterOperationalErrorState.DUST_BIN_MISSING, // DUSTBOX NOT INSTALLED
    6111: MatterOperationalErrorState.DUST_BIN_MISSING, // DUSTBIN AIR LEAK
    6112: MatterOperationalErrorState.DUST_BIN_MISSING, // DUSTBIN BLOCKED
    6113: MatterOperationalErrorState.DUST_BIN_MISSING, // DUSTBAG NOT INSTALLED
    // ── Water tank empty ─────────────────────────────────────────────────────
    3013: MatterOperationalErrorState.WATER_TANK_EMPTY, // ROBOT WATER TANK INSUFFICIENT
    6011: MatterOperationalErrorState.WATER_TANK_EMPTY, // CLEAN WATER TANK EMPTY
    // ── Water tank missing ───────────────────────────────────────────────────
    3020: MatterOperationalErrorState.WATER_TANK_MISSING, // ROBOT WATER TANK REMOVED
    6010: MatterOperationalErrorState.WATER_TANK_MISSING, // CLEAN WATER TANK NOT INSTALLED
    6020: MatterOperationalErrorState.WATER_TANK_MISSING, // DIRTY WATER TANK NOT INSTALLED
    6025: MatterOperationalErrorState.WATER_TANK_MISSING, // DIRTY WATER TANK FULL OR NOT INSTALLED
    // ── Mop / cleaning pad missing ───────────────────────────────────────────
    3110: MatterOperationalErrorState.MOP_CLEANING_PAD_MISSING, // LEFT MOP NOT INSTALLED
    3111: MatterOperationalErrorState.MOP_CLEANING_PAD_MISSING, // RIGHT MOP NOT INSTALLED
    6030: MatterOperationalErrorState.MOP_CLEANING_PAD_MISSING, // CLEANING DISC NOT INSTALLED
    6032: MatterOperationalErrorState.MOP_CLEANING_PAD_MISSING, // CLEANING DISC MISSING OR FULL
    // ── Unable to start or resume ────────────────────────────────────────────
    7010: MatterOperationalErrorState.UNABLE_TO_START_OR_RESUME, // ENTERED FORBIDDEN AREA
    7011: MatterOperationalErrorState.UNABLE_TO_START_OR_RESUME, // ENTERED CARPET ZONE
    7034: MatterOperationalErrorState.UNABLE_TO_START_OR_RESUME, // STARTING POINT NOT FOUND
    7040: MatterOperationalErrorState.UNABLE_TO_START_OR_RESUME, // UNDOCKING FAILED
    // ── Failed to find charging dock ─────────────────────────────────────────
    7031: MatterOperationalErrorState.FAILED_TO_FIND_CHARGING_DOCK, // DOCKING FAILED
    7033: MatterOperationalErrorState.FAILED_TO_FIND_CHARGING_DOCK, // EXPLORING BASE STATION FAILED
    7035: MatterOperationalErrorState.FAILED_TO_FIND_CHARGING_DOCK, // DOCKING FAILED — BASE NOT POWERED
    7036: MatterOperationalErrorState.FAILED_TO_FIND_CHARGING_DOCK, // DOCKING FAILED — OMNI-WHEEL JAMMED
    7037: MatterOperationalErrorState.FAILED_TO_FIND_CHARGING_DOCK, // DOCKING FAILED — INFRARED INTERFERENCE
    7055: MatterOperationalErrorState.FAILED_TO_FIND_CHARGING_DOCK, // BASE STATION NOT FOUND — MOPPING SKIPPED
};
class MatterMappers {
    static SUPPORTED_RUN_MODES = [
        {
            label: 'Idle',
            mode: MatterRvcRunMode.IDLE,
            modeTags: [{ value: MatterRvcRunModeTag.IDLE }],
        },
        {
            label: 'Cleaning',
            mode: MatterRvcRunMode.CLEANING,
            modeTags: [{ value: MatterRvcRunModeTag.CLEANING }],
        },
        {
            label: 'Returning Home',
            mode: MatterRvcRunMode.RETURNING_HOME,
            modeTags: [{ value: 16386 }], // Mapping tag; empty modeTags fails Matter validation (1..8)
        },
    ];
    static getSupportedRunModes() {
        return MatterMappers.SUPPORTED_RUN_MODES;
    }
    static OPERATIONAL_STATE_LIST = [
        { operationalStateId: MatterOperationalState.STOPPED },
        { operationalStateId: MatterOperationalState.RUNNING },
        { operationalStateId: MatterOperationalState.PAUSED },
        { operationalStateId: MatterOperationalState.ERROR },
        { operationalStateId: MatterOperationalState.SEEKING_CHARGER },
        { operationalStateId: MatterOperationalState.CHARGING },
        { operationalStateId: MatterOperationalState.DOCKED },
    ];
    static getOperationalStateList() {
        return MatterMappers.OPERATIONAL_STATE_LIST;
    }
    static mapOperationalError(state) {
        if (!state.activity.activeError) {
            return { errorStateId: MatterOperationalErrorState.NO_ERROR };
        }
        const code = state.activity.activeErrorCode;
        const errorStateId = (code !== undefined && ERROR_CODE_TO_MATTER_STATE[code] !== undefined)
            ? ERROR_CODE_TO_MATTER_STATE[code]
            : MatterOperationalErrorState.STUCK;
        return { errorStateId, errorStateLabel: state.activity.activeError };
    }
    static ERROR_STATE_LIST = [
        { errorStateId: MatterOperationalErrorState.NO_ERROR },
        { errorStateId: MatterOperationalErrorState.STUCK },
        { errorStateId: MatterOperationalErrorState.DUST_BIN_MISSING },
        { errorStateId: MatterOperationalErrorState.WATER_TANK_EMPTY },
        { errorStateId: MatterOperationalErrorState.WATER_TANK_MISSING },
        { errorStateId: MatterOperationalErrorState.MOP_CLEANING_PAD_MISSING },
        { errorStateId: MatterOperationalErrorState.UNABLE_TO_START_OR_RESUME },
        { errorStateId: MatterOperationalErrorState.FAILED_TO_FIND_CHARGING_DOCK },
    ];
    static getErrorStateList() {
        return MatterMappers.ERROR_STATE_LIST;
    }
    static mapRvcRunMode(state) {
        switch (state.activity.runMode) {
            case 'cleaning':
                return MatterRvcRunMode.CLEANING;
            case 'returning':
                return MatterRvcRunMode.RETURNING_HOME;
            case 'error':
            case 'idle':
            default:
                return MatterRvcRunMode.IDLE;
        }
    }
    static mapCleanMode(mode) {
        return mode || 'auto';
    }
    static SUPPORTED_CLEAN_MODES = [
        { label: 'Auto', mode: MatterRvcCleanMode.AUTO, modeTags: [{ value: MatterCommonModeTag.AUTO }] },
        { label: 'Vacuum Only', mode: MatterRvcCleanMode.VACUUM_ONLY, modeTags: [{ value: MatterRvcCleanModeTag.VACUUM }] },
        { label: 'Mop Only', mode: MatterRvcCleanMode.MOP_ONLY, modeTags: [{ value: MatterRvcCleanModeTag.MOP }] },
        {
            label: 'Vacuum and Mop',
            mode: MatterRvcCleanMode.VACUUM_AND_MOP,
            // Apple Home shoves any mode carrying VACUUM_THEN_MOP (0x4003) into its
            // "Suction Power" dropdown (rendered as "Stofzuigen, daarna dweilen"
            // in NL) — it treats that tag as a cleaning *style* alongside Quick /
            // Quiet / Deep Clean. To keep "Vacuum and Mop" in the Clean Mode
            // dropdown instead, give it BOTH the Vacuum and Mop tags so Apple
            // Home recognises it as "does both work modes" rather than a
            // power-profile shortcut.
            modeTags: [
                { value: MatterRvcCleanModeTag.VACUUM },
                { value: MatterRvcCleanModeTag.MOP },
            ],
        },
        // Spot Clean has no dedicated tag in Matter 1.2 RvcCleanMode; using
        // DEEP_CLEAN here was misleading (intensive ≠ localized). Leave
        // modeTags empty so controllers don't conflate it with a deep-clean
        // preset. A dedicated tag is expected in Matter 1.4+.
        {
            label: 'Spot Clean',
            mode: MatterRvcCleanMode.SPOT_CLEAN,
            modeTags: [{ value: MatterRvcCleanModeTag.VACUUM }], // empty modeTags fails Matter validation (1..8)
        },
        // Cleaning-profile entries ("Suction Power" in Apple Home). Tags are the
        // common-namespace power tags so Apple Home groups them into the secondary
        // dropdown rather than mixing them in with Vacuum/Mop. Auto re-uses the
        // first entry above — selecting "Automatic" in Suction Power maps back to
        // the AUTO mode tag (cleaning mode is governed by the user's separate
        // Vacuum/Mop/Vacuum&Mop selection).
        { label: 'Quick', mode: MatterRvcCleanMode.PROFILE_QUICK, modeTags: [{ value: MatterCommonModeTag.QUICK }] },
        { label: 'Quiet', mode: MatterRvcCleanMode.PROFILE_QUIET, modeTags: [{ value: MatterCommonModeTag.QUIET }] },
        { label: 'Low Power', mode: MatterRvcCleanMode.PROFILE_LOW_POWER, modeTags: [{ value: MatterCommonModeTag.LOW_ENERGY }] },
        { label: 'Deep Clean', mode: MatterRvcCleanMode.PROFILE_DEEP_CLEAN, modeTags: [{ value: MatterRvcCleanModeTag.DEEP_CLEAN }] },
    ];
    /**
     * Returns the RvcCleanMode SupportedModes list. Each mode carries a unique
     * standard ModeTag so Apple Home can unambiguously map user-facing actions
     * (e.g. "vacuum only" in a room-clean automation) to the correct mode index.
     * If multiple entries shared the Vacuum tag, Apple Home would pick the first
     * one — 'Auto' — and the device would default to vacuum+mop.
     */
    static getSupportedCleanModes() {
        return MatterMappers.SUPPORTED_CLEAN_MODES;
    }
    static mapRvcCleanMode(mode) {
        switch (mode) {
            case 'VACUUM_ONLY':
                return MatterRvcCleanMode.VACUUM_ONLY;
            case 'MOP_ONLY':
                return MatterRvcCleanMode.MOP_ONLY;
            case 'VACUUM_AND_MOP':
                return MatterRvcCleanMode.VACUUM_AND_MOP;
            case 'SPOT_CLEAN':
                return MatterRvcCleanMode.SPOT_CLEAN;
            case 'AUTO':
            default:
                return MatterRvcCleanMode.AUTO;
        }
    }
    /**
     * Maps a CleaningProfile to its corresponding Matter mode index in the shared
     * RvcCleanMode cluster. AUTO maps to the standard Auto entry (mode 0) since
     * Apple Home uses the AUTO tag for that.
     */
    static mapCleaningProfileToRvcMode(profile) {
        switch (profile) {
            case 'QUICK': return MatterRvcCleanMode.PROFILE_QUICK;
            case 'QUIET': return MatterRvcCleanMode.PROFILE_QUIET;
            case 'LOW_POWER': return MatterRvcCleanMode.PROFILE_LOW_POWER;
            case 'DEEP_CLEAN': return MatterRvcCleanMode.PROFILE_DEEP_CLEAN;
            case 'AUTO':
            default: return MatterRvcCleanMode.AUTO;
        }
    }
    /**
     * Inverse of mapCleaningProfileToRvcMode — translates an inbound Matter mode
     * index (from Apple Home) back to a CleaningProfile, when the picked index
     * corresponds to one of the profile entries. Returns undefined when the
     * picked index is a work-mode entry (Vacuum/Mop/Vacuum&Mop/Spot Clean) so
     * the caller knows the user changed CleaningMode rather than profile.
     */
    static matterRvcModeToProfile(mode) {
        switch (mode) {
            case MatterRvcCleanMode.PROFILE_QUICK: return 'QUICK';
            case MatterRvcCleanMode.PROFILE_QUIET: return 'QUIET';
            case MatterRvcCleanMode.PROFILE_LOW_POWER: return 'LOW_POWER';
            case MatterRvcCleanMode.PROFILE_DEEP_CLEAN: return 'DEEP_CLEAN';
            default: return undefined;
        }
    }
    /**
     * Maps internal runMode + power state to Matter's RvcOperationalState.
     *
     * Precedence:
     *   activeError > paused > runMode-specific > docked/charging-derived states.
     *
     * When the robot is `returning`, we emit SeekingCharger (0x40) so controllers
     * (e.g. Apple Home) show "Seeking Charger" instead of generic "Running".
     * When idle and on the dock, we distinguish Charging (0x41) from Docked
     * (0x42, full battery).
     */
    static mapOperationalState(state) {
        if (state.activity.activeError)
            return MatterOperationalState.ERROR;
        if (state.activity.paused)
            return MatterOperationalState.PAUSED;
        switch (state.activity.runMode) {
            case 'cleaning':
                return MatterOperationalState.RUNNING;
            case 'returning':
                return MatterOperationalState.SEEKING_CHARGER;
            case 'idle':
                if (state.power.docked) {
                    return state.power.charging ? MatterOperationalState.CHARGING : MatterOperationalState.DOCKED;
                }
                return MatterOperationalState.STOPPED;
            case 'error':
            default:
                return MatterOperationalState.ERROR;
        }
    }
    /** Maps MopLevel string to numeric index (LOW=0, MIDDLE=1, HIGH=2). */
    static mapMopLevel(level) {
        const map = { LOW: 0, MIDDLE: 1, HIGH: 2 };
        return map[level];
    }
    /** Reverse of mapMopLevel — validates and converts numeric index to MopLevel. */
    static mapMopLevelFromNumber(level) {
        if (level === 0)
            return 'LOW';
        if (level === 2)
            return 'HIGH';
        return 'MIDDLE';
    }
    /**
     * Translates 0-100 battery level into Matter's 0-200 BatPercentRemaining scale
     */
    static mapBatteryLevel(percent) {
        return Math.min(Math.max(percent * 2, 0), 200);
    }
    /**
     * Maps power state to Matter BatChargeState enum.
     * `charging` is set by processWorkStatus: true=actively charging (DOING), false=done (DONE).
     */
    static mapChargeState(power) {
        if (!power.docked)
            return MatterChargeState.IS_NOT_CHARGING;
        if (power.charging)
            return MatterChargeState.IS_CHARGING;
        return MatterChargeState.IS_AT_MAX_CHARGE;
    }
    /**
     * Returns the clean session data for the current (or last) cleaning session,
     * or null when no session data is available. The device reports area in dm²
     * even though the model field is named areaSqCm; the public attribute is
     * renamed to areaSqDm to reflect the actual unit.
     */
    static mapCleanSession(state) {
        const session = state.activity.cleanSession;
        if (!session)
            return null;
        return { durationSeconds: session.durationSeconds, areaSqDm: session.areaSqCm };
    }
    /** Returns consumable wear data from state, or null when not yet reported. */
    static mapConsumables(state) {
        return state.activity.consumables ?? null;
    }
}
exports.MatterMappers = MatterMappers;
// cleanExtent (CleanExtent) is surfaced via the EVE Fanv2 "Clean Route" service
// only — it is not a standard Matter RvcCleanMode attribute and has no mapping here.
// See EufyRobovacAccessory.setupCleanRouteService for the HAP-layer exposure.
//
// activity.lifetime (CleanLifetime), activity.stationActivity (StationActivityTag[]),
// and water (WaterLevels) are UI-only fields populated by the parser for the Homebridge
// custom UI's Device tab. No Matter cluster exposes lifetime totals, per-station-task
// state, or water-reservoir percentages, so they have no mapping here either. See
// DeviceSession.writeUiSnapshot for the snapshot surface.
