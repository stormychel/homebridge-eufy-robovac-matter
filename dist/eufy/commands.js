"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandBuilder = exports.EufyControlCommands = void 0;
const PROFILE_PARAMS = {
    AUTO: { fanSuction: 1, mopLevel: 1, cleanExtent: 0, cleanType: 2, cleanTimes: 1, smartMode: true },
    QUICK: { fanSuction: 1, mopLevel: 1, cleanExtent: 2, cleanType: 2, cleanTimes: 1, smartMode: false },
    QUIET: { fanSuction: 0, mopLevel: 1, cleanExtent: 0, cleanType: 0, cleanTimes: 1, smartMode: false },
    LOW_POWER: { fanSuction: 0, mopLevel: 0, cleanExtent: 2, cleanType: 2, cleanTimes: 1, smartMode: false },
    DEEP_CLEAN: { fanSuction: 1, mopLevel: 1, cleanExtent: 1, cleanType: 3, cleanTimes: 1, smartMode: false },
};
var MapEditMethod;
(function (MapEditMethod) {
    MapEditMethod[MapEditMethod["SET_ROOMS_CUSTOM"] = 5] = "SET_ROOMS_CUSTOM";
})(MapEditMethod || (MapEditMethod = {}));
const CLEAN_TYPE_BY_MODE = {
    // proto.cloud.CleanType.Value: SWEEP_ONLY=0, MOP_ONLY=1, SWEEP_AND_MOP=2
    AUTO: 2,
    VACUUM_ONLY: 0,
    MOP_ONLY: 1,
    VACUUM_AND_MOP: 2,
};
function cleanTypeFromMode(mode) {
    return CLEAN_TYPE_BY_MODE[mode] ?? 2;
}
var EufyControlCommands;
(function (EufyControlCommands) {
    EufyControlCommands[EufyControlCommands["START_AUTO_CLEAN"] = 0] = "START_AUTO_CLEAN";
    EufyControlCommands[EufyControlCommands["START_SELECT_ROOMS_CLEAN"] = 1] = "START_SELECT_ROOMS_CLEAN";
    EufyControlCommands[EufyControlCommands["START_SPOT_CLEAN"] = 3] = "START_SPOT_CLEAN";
    EufyControlCommands[EufyControlCommands["START_GOHOME"] = 6] = "START_GOHOME";
    EufyControlCommands[EufyControlCommands["STOP_TASK"] = 12] = "STOP_TASK";
    EufyControlCommands[EufyControlCommands["PAUSE_TASK"] = 13] = "PAUSE_TASK";
    EufyControlCommands[EufyControlCommands["RESUME_TASK"] = 14] = "RESUME_TASK";
})(EufyControlCommands || (exports.EufyControlCommands = EufyControlCommands = {}));
/**
 * Encodes strongly-typed Eufy control payloads.
 */
class CommandBuilder {
    codec;
    profileOverrides;
    constructor(codec, profileOverrides = {}) {
        this.codec = codec;
        this.profileOverrides = profileOverrides;
    }
    /**
     * Returns the effective [[ProfileParams]] for a profile after applying user
     * overrides from `cleanProfiles` config. Defaults from PROFILE_PARAMS fill
     * any field the user left unset.
     */
    effectiveProfileParams(profile) {
        const base = PROFILE_PARAMS[profile];
        const override = this.profileOverrides[profile];
        if (!override)
            return base;
        return {
            ...base,
            ...(override.fanSuction !== undefined ? { fanSuction: override.fanSuction } : {}),
            ...(override.mopLevel !== undefined ? { mopLevel: override.mopLevel } : {}),
            ...(override.cleanExtent !== undefined ? { cleanExtent: override.cleanExtent } : {}),
            ...(override.cleanType !== undefined ? { cleanType: override.cleanType } : {}),
        };
    }
    /** Builds command for returning to dock. */
    buildGoHome() {
        const buf = this.codec.encode('ModeCtrlRequest', { method: EufyControlCommands.START_GOHOME });
        return { '152': buf };
    }
    /** Builds pause command. */
    buildPause() {
        const buf = this.codec.encode('ModeCtrlRequest', { method: EufyControlCommands.PAUSE_TASK });
        return { '152': buf };
    }
    /** Builds resume command. */
    buildResume() {
        const buf = this.codec.encode('ModeCtrlRequest', { method: EufyControlCommands.RESUME_TASK });
        return { '152': buf };
    }
    /** Builds auto clean command. */
    buildStartAuto() {
        const buf = this.codec.encode('ModeCtrlRequest', {
            method: EufyControlCommands.START_AUTO_CLEAN,
            autoClean: { cleanTimes: 1, forceMapping: false },
        });
        return { '152': buf };
    }
    /** Builds stop command. */
    buildStop() {
        const buf = this.codec.encode('ModeCtrlRequest', { method: EufyControlCommands.STOP_TASK });
        return { '152': buf };
    }
    /**
     * Builds room-selection clean command. mapId comes from DPS 165 room discovery.
     *
     * `customMode` toggles the SelectRoomsClean.Mode enum:
     *   - GENERAL (0) — device should pick params (default; safe when no
     *     SET_ROOMS_CUSTOM was sent ahead of this call).
     *   - CUSTOMIZE (1) — device should honour the per-room Custom.clean_type
     *     we just wrote via MapEditRequest SET_ROOMS_CUSTOM. The Eufy Clean HA
     *     integration (jeppesens/eufy-clean) uses CUSTOMIZE whenever it has
     *     pushed per-room params first.
     *
     * `releases` is intentionally NOT set: hardcoding it to 1 risked the device
     * rejecting the request as referring to a stale map revision, which is what
     * appears to have been happening on the X10 Pro Omni after we started
     * pushing per-room params on DPS 170. jeppesens leaves it at proto default
     * (0) and that path is known to work.
     */
    buildRoomSelection(roomIds, mapId, customMode = false) {
        const rooms = roomIds.map((id, index) => ({ id, order: index + 1 }));
        const buf = this.codec.encode('ModeCtrlRequest', {
            method: EufyControlCommands.START_SELECT_ROOMS_CLEAN,
            selectRoomsClean: {
                rooms,
                cleanTimes: 1,
                mode: customMode ? 1 : 0, // SelectRoomsClean.Mode: GENERAL=0, CUSTOMIZE=1
                ...(mapId !== undefined && mapId !== 0 ? { mapId } : {}),
            },
        });
        return { '152': buf };
    }
    /** Builds spot-clean command (cleans the area around the robot's current position). */
    buildSpotClean() {
        const buf = this.codec.encode('ModeCtrlRequest', {
            method: EufyControlCommands.START_SPOT_CLEAN,
            spotClean: { cleanTimes: 1 },
        });
        return { '152': buf };
    }
    /** Builds clean mode command as CleanParamRequest on DPS 154. */
    buildWorkMode(mode) {
        // CleanType.Value: SWEEP_ONLY=0, MOP_ONLY=1, SWEEP_AND_MOP=2, SWEEP_THEN_MOP=3
        // SPOT_CLEAN uses its own DPS 152 command and does not need a work mode update.
        // We set the clean type in BOTH clean_param (global default) AND area_clean_param
        // (used when the next run targets selected rooms / areas). Setting only the
        // global default leaves the device's persisted area_clean_param untouched, so a
        // START_SELECT_ROOMS_CLEAN would silently fall back to the previous area mode
        // (e.g. VACUUM_AND_MOP) regardless of what the user just picked.
        const cleanType = { value: cleanTypeFromMode(mode) };
        const buf = this.codec.encode('proto.cloud.CleanParamRequest', {
            cleanParam: { cleanType },
            areaCleanParam: { cleanType },
        });
        return { '154': buf };
    }
    /**
     * Overrides per-room custom clean parameters (DPS 170 MapEditRequest with
     * method=SET_ROOMS_CUSTOM). On the X10 generation the device always uses the
     * map's per-room Custom.clean_type for a room clean — the global clean_param
     * on DPS 154 is ignored once a room run starts. The Eufy mobile app calls
     * this same MapEditRequest whenever the user toggles a room's cleaning mode,
     * and the jeppesens/eufy-clean Home Assistant integration confirms the same
     * shape (build_set_room_custom_command). Without this, picking Vacuum Only
     * in Apple Home and starting a room clean still ran Vacuum + Mop because the
     * persisted per-room clean_type stayed at SWEEP_AND_MOP.
     *
     * NOTE: this rewrites the saved per-room setting; it's not a one-shot
     * override. Subsequent runs (including from the Eufy app) will use the new
     * value until something updates it again.
     */
    buildSetRoomCustom(roomIds, mode, mapId) {
        const cleanType = { value: cleanTypeFromMode(mode) };
        const rooms = roomIds.map(id => ({ id, custom: { cleanType } }));
        const buf = this.codec.encode('proto.cloud.MapEditRequest', {
            method: MapEditMethod.SET_ROOMS_CUSTOM,
            mapId,
            roomsCustom: { roomsParm: { rooms } },
        });
        return { '170': buf };
    }
    /**
     * Builds suction-level command via DPS 154 CleanParamRequest (fan.suction index 0-4).
     * Maps SuctionLevel 1-5 → fan suction index 0-4 (QUIET/STANDARD/TURBO/MAX/MAX_PLUS).
     */
    buildSuctionLevel(level) {
        const suctionIndex = (level - 1);
        const buf = this.codec.encode('proto.cloud.CleanParamRequest', {
            cleanParam: { fan: { suction: suctionIndex } },
        });
        return { '154': buf };
    }
    /**
     * Builds mop-level command via DPS 154 CleanParamRequest (mopMode.level 0-2).
     * Maps MopLevel LOW/MIDDLE/HIGH → 0/1/2 per proto.cloud.MopMode.Level.
     */
    buildMopLevel(level) {
        const mopIndex = { LOW: 0, MIDDLE: 1, HIGH: 2 };
        const buf = this.codec.encode('proto.cloud.CleanParamRequest', {
            cleanParam: { mopMode: { level: mopIndex[level] } },
        });
        return { '154': buf };
    }
    /**
     * Builds cleaning route command via DPS 154 CleanParamRequest.
     * Maps CleanExtent NORMAL/NARROW/QUICK → cleanExtent index 0/1/2.
     */
    buildCleanExtent(extent) {
        const extentIndex = { NORMAL: 0, NARROW: 1, QUICK: 2 };
        const buf = this.codec.encode('proto.cloud.CleanParamRequest', {
            cleanParam: { cleanExtent: { value: extentIndex[extent] } },
        });
        return { '154': buf };
    }
    /**
     * Triggers the auto-empty station to collect dust from the robot's bin.
     * Sends a StationRequest.ManualActionCmd { go_collect_dust: true } on DPS 179.
     * Only meaningful for models with a self-empty base (e.g. T2351 X10 Pro Omni).
     */
    buildEmptyBin() {
        const buf = this.codec.encode('StationRequest', { manualCmd: { goCollectDust: true } }, true);
        return { '179': buf };
    }
    /**
     * Builds a MAP_GET_ALL request to fetch all stored maps and their room params.
     * Sent on DPS 172 (MULTI_MAP_MANAGE). The device responds on DPS 172 with a
     * MultiMapsManageResponse; full pixel data arrives separately via P2P, but the
     * DP response contains at minimum method + result and (on supported firmware)
     * the complete_maps list with floor names and room params.
     */
    buildRequestMapData() {
        const buf = this.codec.encode('proto.cloud.MultiMapsManageRequest', { method: 7, seq: 1 }, false);
        return { '172': buf };
    }
    /**
     * Builds the bundled CleanParamRequest for a CleaningProfile + active CleaningMode.
     * Sets suction, mop level, route (clean_extent), pass count and clean_type in one
     * shot on DPS 154. Applied to both clean_param (global) and area_clean_param so a
     * subsequent select-rooms-clean run honours the same profile.
     */
    buildCleaningProfile(profile, mode) {
        const p = this.effectiveProfileParams(profile);
        // cleanTypeForProfileAndMode resolves CleaningMode precedence over the
        // profile's own cleanType. Apply the same logic but starting from the
        // POSSIBLY-overridden cleanType, not the hardcoded PROFILE_PARAMS one.
        const baseCleanType = mode === 'VACUUM_ONLY' ? 0
            : mode === 'MOP_ONLY' ? 1
                : mode === 'VACUUM_AND_MOP' ? 2
                    : p.cleanType;
        const cleanType = { value: baseCleanType };
        const cleanParam = {
            cleanType,
            cleanExtent: { value: p.cleanExtent },
            mopMode: { level: p.mopLevel },
            fan: { suction: p.fanSuction },
            cleanTimes: p.cleanTimes,
            smartModeSw: { value: p.smartMode },
        };
        const buf = this.codec.encode('proto.cloud.CleanParamRequest', {
            cleanParam,
            areaCleanParam: cleanParam,
        });
        return { '154': buf };
    }
}
exports.CommandBuilder = CommandBuilder;
