"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatterClusterMapper = void 0;
exports.encodeAreaId = encodeAreaId;
exports.decodeAreaId = decodeAreaId;
exports.deriveFloorNameFromScenes = deriveFloorNameFromScenes;
const mappers_1 = require("./mappers");
const NON_NUMERIC_AREA_OFFSET = 0x10000;
/**
 * Multi-floor robots reuse room IDs (1-N) on each floor — e.g. mapId=10 has
 * a room id=1, and mapId=17 ALSO has a room id=1. The Matter ServiceArea spec
 * requires every `areaId` in `supportedAreas` to be unique across the cluster,
 * so we encode the mapId into the high bits: `areaId = mapId * 10000 + roomId`.
 * Room IDs above 9999 fall back to the legacy offset scheme.  Decoded with
 * [[decodeAreaId]] before being sent back to the robot.
 */
const AREA_ID_MAP_FACTOR = 10000;
/** Combines mapId + roomId into a single globally-unique areaId. */
function encodeAreaId(mapId, roomId) {
    if (roomId <= 0 || roomId >= AREA_ID_MAP_FACTOR)
        return NON_NUMERIC_AREA_OFFSET + roomId;
    return mapId * AREA_ID_MAP_FACTOR + roomId;
}
/** Inverse of [[encodeAreaId]] — extracts the floor's mapId and per-floor roomId. */
function decodeAreaId(areaId) {
    if (areaId >= NON_NUMERIC_AREA_OFFSET)
        return { mapId: undefined, roomId: areaId - NON_NUMERIC_AREA_OFFSET };
    if (areaId < AREA_ID_MAP_FACTOR)
        return { mapId: undefined, roomId: areaId };
    return { mapId: Math.floor(areaId / AREA_ID_MAP_FACTOR), roomId: areaId % AREA_ID_MAP_FACTOR };
}
/**
 * Floor-name keywords (case-insensitive) recognised in scene names. The user
 * typically names a scene something like "Beneden volledig schoonmaken" — we
 * pull "Beneden" out as the floor's friendly name.
 *
 * Dutch keywords cover the common floor names; English equivalents are added
 * so the heuristic works for English-named Eufy accounts too. Ordering matters
 * a bit: multi-word phrases (`Eerste verdieping`, `First floor`) are checked
 * before single words so we don't truncate "Eerste verdieping" to "Eerste".
 */
const FLOOR_KEYWORD_PATTERNS = [
    /\bbegane\s*grond\b/i,
    /\beerste\s+verdieping\b/i,
    /\btweede\s+verdieping\b/i,
    /\bderde\s+verdieping\b/i,
    /\bground\s+floor\b/i,
    /\bfirst\s+floor\b/i,
    /\bsecond\s+floor\b/i,
    /\bthird\s+floor\b/i,
    // Single-word fallbacks — picked up when nothing more specific matched.
    /\bbeneden\b/i,
    /\bboven\b/i,
    /\bverdieping\b/i,
    /\bzolder\b/i,
    /\bkelder\b/i,
    /\bspeelkamer\b/i,
    /\bdownstairs\b/i,
    /\bupstairs\b/i,
    /\bbasement\b/i,
    /\battic\b/i,
    /\bplayroom\b/i,
];
/**
 * Picks a friendly floor name from a list of scene names by scanning each
 * scene for known floor keywords. Returns the first match, capitalised. The
 * caller should fall back to "Floor N" when this returns undefined.
 */
function deriveFloorNameFromScenes(sceneNames) {
    for (const scene of sceneNames) {
        for (const pattern of FLOOR_KEYWORD_PATTERNS) {
            const match = scene.match(pattern);
            if (match) {
                // Capitalise the first letter of each word, lower-case the rest, so
                // "BENEDEN" or "beneden" both render as "Beneden".
                return match[0]
                    .toLowerCase()
                    .replace(/\b\w/g, (c) => c.toUpperCase())
                    .replace(/\s+/g, ' ')
                    .trim();
            }
        }
    }
    return undefined;
}
/** Creates cluster payloads from normalized state. */
class MatterClusterMapper {
    /**
     * Builds the ServiceArea payload, or returns `undefined` when the device has
     * no known rooms. Returning undefined lets callers omit the serviceArea
     * cluster entirely — registering it with an empty supportedAreas array
     * crashes the Matter ServiceAreaServer behavior in #assertSupportedMaps.
     *
     * `supportedMaps` is always included in the payload (as `[]` in mapless mode).
     * HomebridgeServiceAreaServer.#assertSupportedMaps reads `.length` on this
     * field regardless of whether the Maps feature is explicitly enabled, so
     * omitting the key causes "Cannot read properties of undefined (reading 'length')".
     */
    static buildServiceArea(state) {
        const knownMaps = state.activity.knownMaps ?? [];
        const mapsWithRooms = knownMaps
            .map((m) => ({ ...m, rooms: MatterClusterMapper.normalizeRooms(m.rooms) }))
            .filter((m) => m.rooms.length > 0);
        // Fall back to mapless mode when knownMaps is empty (no mapId in DPS 165, or
        // device has a single floor without an explicit map ID).
        const useMapMode = mapsWithRooms.length > 0;
        let supportedMaps = [];
        let supportedAreas = [];
        if (useMapMode) {
            const scenesByMapId = state.activity.scenesByMapId ?? {};
            supportedMaps = mapsWithRooms.map((m, index) => {
                // Priority chain for the floor label:
                // 1. User-configured `floors` name (highest — explicit user intent)
                // 2. Heuristic from scene names ("Beneden volledig schoonmaken" → "Beneden")
                // 3. Generic "Floor N" by index
                const configured = (m.name && m.name.trim().length > 0) ? m.name.trim() : undefined;
                const sceneNames = scenesByMapId[m.mapId] ?? [];
                const sceneDerived = configured ? undefined : deriveFloorNameFromScenes(sceneNames);
                return {
                    mapId: m.mapId,
                    name: configured ?? sceneDerived ?? `Floor ${index + 1}`,
                };
            });
            let globalIndex = 0;
            for (const map of mapsWithRooms) {
                for (const room of map.rooms) {
                    const parsed = Number.parseInt(room.id, 10);
                    // Multi-floor: bake mapId into areaId so Matter's uniqueness check
                    // passes and we can decode back to (mapId, roomId) on selectAreas.
                    const areaId = (Number.isFinite(parsed) && parsed > 0)
                        ? encodeAreaId(map.mapId, parsed)
                        : NON_NUMERIC_AREA_OFFSET + globalIndex;
                    const trimmedName = (room.name ?? '').trim();
                    supportedAreas.push({
                        areaId,
                        mapId: map.mapId,
                        areaInfo: {
                            locationInfo: {
                                locationName: trimmedName.length > 0 ? trimmedName : `Room ${parsed}`,
                                floorNumber: null,
                                areaType: null,
                            },
                            landmarkInfo: null,
                        },
                    });
                    globalIndex += 1;
                }
            }
        }
        else {
            // Mapless mode: flat list of rooms without floor association.
            const rooms = MatterClusterMapper.normalizeRooms(state.activity.availableRooms);
            if (rooms.length === 0)
                return undefined;
            supportedAreas = rooms.map((room, index) => {
                const parsed = Number.parseInt(room.id, 10);
                const areaId = Number.isFinite(parsed) && parsed > 0 ? parsed : NON_NUMERIC_AREA_OFFSET + index;
                const trimmedName = (room.name ?? '').trim();
                return {
                    areaId,
                    mapId: null,
                    areaInfo: {
                        locationInfo: {
                            locationName: trimmedName.length > 0 ? trimmedName : `Room ${areaId}`,
                            floorNumber: null,
                            areaType: null,
                        },
                        landmarkInfo: null,
                    },
                };
            });
        }
        if (supportedAreas.length === 0)
            return undefined;
        const validAreaIds = new Set(supportedAreas.map((a) => a.areaId));
        const selectedSource = Array.isArray(state.activity.selectedRooms) ? state.activity.selectedRooms : [];
        const selectedAreas = selectedSource
            .map((roomId) => Number.parseInt(roomId, 10))
            .filter((areaId) => Number.isFinite(areaId) && validAreaIds.has(areaId));
        return { supportedMaps, supportedAreas, selectedAreas };
    }
    static toMatterState(state) {
        const result = {
            RvcRunMode: {
                supportedModes: mappers_1.MatterMappers.getSupportedRunModes(),
                currentMode: mappers_1.MatterMappers.mapRvcRunMode(state),
            },
            RvcCleanMode: {
                supportedModes: mappers_1.MatterMappers.getSupportedCleanModes(),
                // Apple Home reads tags on each supportedModes entry to decide which dropdown
                // an entry belongs to (Clean Mode vs Suction Power). The single currentMode
                // field can only carry the user's MOST RECENT pick, so we surface
                // lastSelectedMatterMode when it's set and fall back to deriving from
                // cleanMode for the very first push.
                currentMode: state.activity.lastSelectedMatterMode
                    ?? mappers_1.MatterMappers.mapRvcCleanMode(state.activity.cleanMode),
            },
            RvcOperationalState: {
                operationalStateList: mappers_1.MatterMappers.getOperationalStateList(),
                operationalState: mappers_1.MatterMappers.mapOperationalState(state),
                operationalError: mappers_1.MatterMappers.mapOperationalError(state),
            },
            PowerSource: {
                batPercentRemaining: mappers_1.MatterMappers.mapBatteryLevel(state.power.batteryPercent),
                batChargeState: mappers_1.MatterMappers.mapChargeState(state.power),
            },
        };
        const serviceArea = MatterClusterMapper.buildServiceArea(state);
        if (serviceArea) {
            result.ServiceArea = serviceArea;
        }
        // EufyCleanSessionData (durationSeconds / areaSqDm) is omitted until
        // Homebridge supports custom cluster behaviors. Call buildCleanSession()
        // directly when the API becomes available.
        // EufyConsumables (consumable wear hours) is omitted until Homebridge
        // supports custom cluster behaviors. Call buildConsumables() directly
        // when the API becomes available.
        return result;
    }
    static buildCleanSession(state) {
        const session = mappers_1.MatterMappers.mapCleanSession(state);
        if (!session)
            return undefined;
        return session;
    }
    /**
     * Builds the EufyConsumables payload from normalized state, or returns null
     * when consumable data has not yet been reported by the device.
     * Not pushed to Matter until Homebridge supports custom cluster behaviors.
     */
    static buildConsumables(state) {
        return mappers_1.MatterMappers.mapConsumables(state);
    }
    static normalizeRooms(value) {
        if (!Array.isArray(value))
            return [];
        return value.filter((room) => typeof room === 'object'
            && room !== null
            && typeof room.id === 'string'
            && room.id.length > 0);
    }
}
exports.MatterClusterMapper = MatterClusterMapper;
// EufyMapSelection (F1): currentMapId is used internally by handleStartCommand()
// for room-clean payloads. Exposing map switching to Apple Home requires both
// a list of available maps (not tracked — DPS 165 provides rooms but not a map
// catalogue) and Homebridge custom cluster support. Deferred until both
// prerequisites are met.
