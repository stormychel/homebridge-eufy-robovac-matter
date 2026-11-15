"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.platformConfigSchema = exports.cleanProfilesSchema = exports.profileOverrideSchema = exports.floorSchema = exports.roomSchema = void 0;
exports.parsePlatformConfig = parsePlatformConfig;
const zod_1 = require("zod");
exports.roomSchema = zod_1.z.object({
    id: zod_1.z.string().min(1).max(256),
    name: zod_1.z.string().min(1).max(256),
});
/**
 * One saved floor map on the robot. `mapId` is the Tuya cloud_mapid (e.g. 10
 * for the X10 Pro Omni's default Beganegrond). Names get the Apple Home
 * "supportedMaps" label; rooms can be left empty here — they auto-populate
 * when DPS 165 arrives for that floor (i.e., when the Eufy app switches the
 * robot to that floor for the first time after plugin start).
 *
 * How to discover your mapIds: enable Homebridge debug logging, then in the
 * Eufy app tap each floor under "Multi-Map" / "Plattegrond beheren" and start
 * a brief clean. The plugin logs `Discovered N rooms from DPS 165 (mapId=X)`
 * for each floor as the robot publishes its state. Put those mapIds here.
 */
exports.floorSchema = zod_1.z.object({
    mapId: zod_1.z.number().int().positive(),
    name: zod_1.z.string().min(1).max(64),
    rooms: zod_1.z.array(exports.roomSchema).max(100).optional().default([]),
});
/**
 * Per-profile overrides for the 4 user-controllable Apple-Home "Suction Power"
 * profiles. AUTO is omitted on purpose — its smart-mode flag supersedes any
 * fan/mop/extent values, so overriding those would be silently ignored by the
 * device. Each field maps to the same integer encoding the X10 firmware
 * expects on DPS 154 (see [[PROFILE_PARAMS]] in commands.ts). Fields are
 * optional — omitted entries fall back to the plugin's built-in defaults.
 */
exports.profileOverrideSchema = zod_1.z.object({
    fanSuction: zod_1.z.number().int().min(0).max(4).optional(),
    mopLevel: zod_1.z.number().int().min(0).max(2).optional(),
    cleanExtent: zod_1.z.number().int().min(0).max(2).optional(),
    cleanType: zod_1.z.number().int().min(0).max(3).optional(),
}).optional();
exports.cleanProfilesSchema = zod_1.z.object({
    QUICK: exports.profileOverrideSchema,
    QUIET: exports.profileOverrideSchema,
    LOW_POWER: exports.profileOverrideSchema,
    DEEP_CLEAN: exports.profileOverrideSchema,
}).optional().default({});
exports.platformConfigSchema = zod_1.z.object({
    name: zod_1.z.string().max(256).optional(),
    platform: zod_1.z.string().max(256).optional(),
    // username/password can be overridden by EUFY_USERNAME / EUFY_PASSWORD env vars
    username: zod_1.z.string().max(256).optional(),
    password: zod_1.z.string().max(256).optional(),
    disableMatterStatePush: zod_1.z.boolean().optional().default(false),
    rooms: zod_1.z.array(exports.roomSchema).max(100).optional().default([]),
    floors: zod_1.z.array(exports.floorSchema).max(10).optional().default([]),
    defaultMode: zod_1.z.enum(['AUTO', 'VACUUM_ONLY', 'MOP_ONLY', 'VACUUM_AND_MOP']).optional().default('AUTO'),
    defaultSuction: zod_1.z.number().int().min(1).max(5).optional().default(2),
    mqttReconnectMaxDelay: zod_1.z.number().int().positive().optional().default(30000),
    cleanProfiles: exports.cleanProfilesSchema,
});
/**
 * Validates and normalizes user config.
 * Credentials can be supplied via EUFY_USERNAME / EUFY_PASSWORD environment variables,
 * which take precedence over values in config.json (useful for avoiding plaintext secrets).
 */
function parsePlatformConfig(config) {
    const overrides = { ...config };
    if (process.env['EUFY_USERNAME']) {
        overrides.username = process.env['EUFY_USERNAME'];
    }
    if (process.env['EUFY_PASSWORD']) {
        overrides.password = process.env['EUFY_PASSWORD'];
    }
    return exports.platformConfigSchema.parse(overrides);
}
