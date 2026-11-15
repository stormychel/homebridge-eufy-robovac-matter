"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInitialState = createInitialState;
/**
 * Creates the baseline runtime state for a single Eufy robot.
 */
function createInitialState(identity, capabilities) {
    return {
        identity,
        connectivity: { online: false },
        power: { batteryPercent: 100, charging: true, docked: true },
        water: { clean: null, dirty: null },
        activity: {
            runMode: 'idle',
            paused: false,
            activeError: undefined,
            activeErrorCode: undefined,
            cleanMode: 'AUTO',
            suctionLevel: 2,
            mopLevel: 'MIDDLE',
            cleanExtent: 'NORMAL',
            cleaningProfile: 'AUTO',
            lastSelectedMatterMode: undefined,
            selectedRooms: [],
            availableRooms: [],
            currentMapId: undefined,
            knownMaps: [],
            scenesByMapId: {},
            stationActivity: [],
        },
        capabilities,
        debug: { rawDps: {} },
    };
}
