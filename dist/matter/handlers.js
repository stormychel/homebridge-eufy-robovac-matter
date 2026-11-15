"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatterCommandHandlers = void 0;
class MatterCommandHandlers {
    commandBuilder;
    log;
    capabilities;
    pauseSuppressionUntil = 0;
    pendingRoomIds = null;
    /** Floor the user picked the pending rooms on (decoded from Matter areaId). */
    pendingMapId = undefined;
    currentCleanMode;
    mqttClient;
    /** Suppresses syncCleanModeFromDevice echoes for N ms after an explicit mode command. */
    modeCommandSentUntil = 0;
    onCleanModeSelected;
    onCleaningProfileSelected;
    constructor(commandBuilder, mqttClient, log, capabilities, defaultCleanMode = 'AUTO') {
        this.commandBuilder = commandBuilder;
        this.log = log;
        this.capabilities = capabilities;
        this.mqttClient = mqttClient;
        this.currentCleanMode = defaultCleanMode;
    }
    /**
     * Registers a callback that fires whenever the user explicitly picks a clean
     * mode in the controller. The platform wires this to update the accessory's
     * NormalizedState so the next Matter state push reflects the user's choice
     * instead of the device's previous (still-echoing) mode. Without this hook
     * the device echo would roll rvcCleanMode.currentMode back to whatever the
     * vacuum last reported.
     */
    setOnCleanModeSelected(callback) {
        this.onCleanModeSelected = callback;
    }
    /** Same as setOnCleanModeSelected but for CleaningProfile (Suction Power) selections. */
    setOnCleaningProfileSelected(callback) {
        this.onCleaningProfileSelected = callback;
    }
    /** True while the device echo for clean mode is being suppressed. */
    isCleanModeSuppressionActive() {
        return Date.now() < this.modeCommandSentUntil;
    }
    /**
     * Returns the authoritative clean mode for outgoing Matter state given a
     * candidate value decoded from the latest device DPS update. Within the
     * suppression window the user's explicit selection wins; otherwise the
     * caller's candidate is returned unchanged.
     */
    resolveCleanModeForState(candidate) {
        return this.isCleanModeSuppressionActive() ? this.currentCleanMode : candidate;
    }
    /**
     * Replaces the MQTT client once cloud credentials are available.
     * Called during Phase 2 of device discovery, after cloud auth completes.
     */
    setMqttClient(client) {
        this.mqttClient = client;
    }
    /**
     * Handles Matter start/run command.
     * mapId is resolved at call time (not at room-selection time) so that DPS 165
     * has had a chance to arrive before we build the room-clean payload.
     */
    async handleStartCommand(isPaused = false, mapId) {
        if (!this.mqttClient) {
            this.log.warn('Start command ignored: MQTT not yet connected.');
            return;
        }
        this.log.info('Handling Matter Start Command...');
        this.suppressPauseForCommandSequence();
        if (isPaused && this.capabilities.supportsResume) {
            this.log.debug('Robot is paused — sending RESUME before START');
            await this.mqttClient.sendCommand(this.commandBuilder.buildResume());
        }
        // Spot clean uses its own DPS 152 method and doesn't need a work-mode update
        if (this.currentCleanMode === 'SPOT_CLEAN') {
            this.log.debug('Sending START_SPOT_CLEAN via MQTT DPS 152');
            await this.mqttClient.sendCommand(this.commandBuilder.buildSpotClean());
            return;
        }
        this.log.debug(`[Mode] Applying clean mode before start: ${this.currentCleanMode}`);
        const workModePayload = this.commandBuilder.buildWorkMode(this.currentCleanMode);
        this.log.debug(`[Mode] Work-mode MQTT payload: ${JSON.stringify(workModePayload)}`);
        await this.mqttClient.sendCommand(workModePayload);
        this.modeCommandSentUntil = Date.now() + 10_000;
        if (this.pendingRoomIds && this.pendingRoomIds.length > 0) {
            if (!mapId) {
                this.log.warn(`[Rooms] Room selection requested for rooms [${this.pendingRoomIds.join(', ')}] but map ID is still unknown. `
                    + 'Falling back to START_AUTO_CLEAN (selection retained for next start).');
            }
            else {
                // On the X10 generation the device always uses the map's per-room
                // Custom.clean_type for a room clean — DPS 154's clean_param is
                // ignored once a room run starts. Push a SET_ROOMS_CUSTOM update
                // first so each selected room runs in the mode the user just picked
                // in Apple Home. Skip for AUTO so the user's saved per-room config
                // stays intact when they explicitly chose "Auto".
                const useCustomize = this.currentCleanMode !== 'AUTO';
                if (useCustomize) {
                    const customPayload = this.commandBuilder.buildSetRoomCustom(this.pendingRoomIds, this.currentCleanMode, mapId);
                    this.log.debug(`[Rooms] Applying per-room clean mode ${this.currentCleanMode} `
                        + `to rooms [${this.pendingRoomIds.join(', ')}] (DPS 170 SET_ROOMS_CUSTOM): ${JSON.stringify(customPayload)}`);
                    await this.mqttClient.sendCommand(customPayload);
                }
                // Use CUSTOMIZE mode in the room-clean ONLY when we just pushed
                // per-room params. The Eufy Clean HA integration does the same:
                // GENERAL mode for "just clean these rooms with whatever params",
                // CUSTOMIZE mode after a SET_ROOMS_CUSTOM so the device honours the
                // freshly-written per-room Custom.clean_type instead of falling
                // back to a stale default.
                const roomPayload = this.commandBuilder.buildRoomSelection(this.pendingRoomIds, mapId, useCustomize);
                this.log.debug(`[Rooms] Sending START_SELECT_ROOMS_CLEAN (mode=${useCustomize ? 'CUSTOMIZE' : 'GENERAL'}) — `
                    + `rooms: [${this.pendingRoomIds.join(', ')}], mapId: ${mapId}, payload: ${JSON.stringify(roomPayload)}`);
                await this.mqttClient.sendCommand(roomPayload);
                this.log.debug('[Rooms] START_SELECT_ROOMS_CLEAN sent successfully');
                this.pendingRoomIds = null;
                this.pendingMapId = undefined;
                return;
            }
        }
        this.log.debug('[Mode] Sending START_AUTO_CLEAN via MQTT DPS 152');
        await this.mqttClient.sendCommand(this.commandBuilder.buildStartAuto());
        this.log.debug('[Mode] START_AUTO_CLEAN sent successfully');
    }
    /** Handles Matter stop command. */
    async handleStopCommand() {
        if (!this.mqttClient) {
            this.log.warn('Stop command ignored: MQTT not yet connected.');
            return;
        }
        this.log.info('Handling Matter Stop Command...');
        this.log.debug('Sending STOP_TASK via MQTT DPS 152');
        await this.mqttClient.sendCommand(this.commandBuilder.buildStop());
        this.log.debug('STOP_TASK sent successfully');
    }
    /** Handles Matter pause command when supported. */
    async handlePauseCommand() {
        if (!this.mqttClient)
            return;
        if (Date.now() < this.pauseSuppressionUntil)
            return;
        if (!this.capabilities.supportsPause)
            return;
        await this.mqttClient.sendCommand(this.commandBuilder.buildPause());
    }
    /** Handles Matter resume command when supported. */
    async handleResumeCommand() {
        if (!this.mqttClient)
            return;
        this.suppressPauseForCommandSequence();
        if (!this.capabilities.supportsResume)
            return;
        await this.mqttClient.sendCommand(this.commandBuilder.buildResume());
    }
    /** Handles return-to-dock command when supported. */
    async handleGoHomeCommand() {
        if (!this.mqttClient) {
            this.log.warn('Go Home command ignored: MQTT not yet connected.');
            return;
        }
        this.suppressPauseForCommandSequence();
        if (!this.capabilities.supportsGoHome) {
            this.log.warn('Ignoring Matter Go Home command: model reports go-home as unsupported.');
            return;
        }
        this.log.info('Handling Matter Go Home Command...');
        await this.mqttClient.sendCommand(this.commandBuilder.buildGoHome());
    }
    /** Handles cleaning mode selection command. */
    async handleCleaningMode(mode) {
        this.currentCleanMode = mode;
        this.modeCommandSentUntil = Date.now() + 10_000;
        this.log.debug(`[Mode] User selected cleaning mode: ${mode} — suppressing device echo for 10s`);
        // Notify the accessory so its NormalizedState reflects the user's choice
        // immediately. Otherwise the next state push (triggered by an unrelated
        // DPS update) would publish the stale device-reported mode and overwrite
        // the cluster cache that Matter just set.
        try {
            this.onCleanModeSelected?.(mode);
        }
        catch (error) {
            this.log.warn(`[Mode] onCleanModeSelected callback threw: ${error instanceof Error ? error.message : String(error)}`);
        }
        if (!this.mqttClient)
            return;
        const payload = this.commandBuilder.buildWorkMode(mode);
        this.log.debug(`[Mode] Sending work-mode command: ${JSON.stringify(payload)}`);
        await this.mqttClient.sendCommand(payload);
    }
    /** Triggers the auto-empty station to collect dust from the robot's bin. */
    async handleEmptyBinCommand() {
        if (!this.mqttClient)
            return;
        if (!this.capabilities.supportsEmptyBin) {
            this.log.warn('Ignoring Empty Bin command: model does not support auto-empty station.');
            return;
        }
        this.log.info('Handling Empty Bin Command — triggering auto-empty station via DPS 179...');
        await this.mqttClient.sendCommand(this.commandBuilder.buildEmptyBin());
        this.log.debug('Empty Bin command sent successfully');
    }
    /** Handles suction level selection command (1=QUIET … 5=MAX_PLUS). */
    async handleSuctionLevel(level) {
        if (!this.mqttClient)
            return;
        await this.mqttClient.sendCommand(this.commandBuilder.buildSuctionLevel(level));
    }
    /** Handles mop intensity selection command (LOW / MIDDLE / HIGH). */
    async handleMopLevel(level) {
        if (!this.mqttClient)
            return;
        await this.mqttClient.sendCommand(this.commandBuilder.buildMopLevel(level));
    }
    /** Handles cleaning route selection command (NORMAL / NARROW / QUICK). */
    async handleCleanExtent(extent) {
        if (!this.mqttClient)
            return;
        await this.mqttClient.sendCommand(this.commandBuilder.buildCleanExtent(extent));
    }
    /**
     * Handles "Suction Power" cleaning profile selection from Apple Home. Applies the
     * profile's bundled suction / mop level / route / clean-type / pass count in one
     * CleanParamRequest. The active CleaningMode (Vacuum/Mop/Vacuum&Mop) takes
     * precedence over the profile's default clean_type so the user's explicit
     * work-mode choice is preserved when they switch profile.
     */
    async handleCleaningProfile(profile) {
        this.log.info(`[Profile] User selected cleaning profile: ${profile} (current mode: ${this.currentCleanMode})`);
        // Push the user's choice into NormalizedState immediately so the next Matter
        // sync surfaces the picked profile index, even if the device's CleanParamResponse
        // echo arrives before the MQTT round-trip completes.
        try {
            this.onCleaningProfileSelected?.(profile);
        }
        catch (error) {
            this.log.warn(`[Profile] onCleaningProfileSelected callback threw: ${error instanceof Error ? error.message : String(error)}`);
        }
        if (!this.mqttClient)
            return;
        const payload = this.commandBuilder.buildCleaningProfile(profile, this.currentCleanMode);
        this.log.debug(`[Profile] CleanParam payload: ${JSON.stringify(payload)}`);
        await this.mqttClient.sendCommand(payload);
    }
    /** Sends MAP_GET_ALL to proactively discover all saved floors on the device. */
    async requestAllMaps() {
        if (!this.mqttClient)
            return;
        this.log.debug('[Maps] Sending MAP_GET_ALL request to discover all floors');
        await this.mqttClient.sendCommand(this.commandBuilder.buildRequestMapData());
    }
    /**
     * Called when DPS 154/work_mode arrives from the device — keeps internal clean mode in sync.
     * Ignored for 10 s after an explicit handleCleaningMode call so the device echo cannot
     * override what the user just selected.
     */
    syncCleanModeFromDevice(mode) {
        if (Date.now() < this.modeCommandSentUntil) {
            this.log.debug(`[Mode] Ignoring device-reported mode ${mode} (user explicitly set ${this.currentCleanMode}; echo suppression active)`);
            return;
        }
        this.log.debug(`[Mode] Syncing clean mode from device: ${mode}`);
        this.currentCleanMode = mode;
    }
    /**
     * Stores selected rooms; mapId is resolved fresh from state when Start fires.
     * Pass an empty array to clear the pending selection (robot will auto-clean on next start).
     *
     * `targetMapId` is the explicit floor the user picked rooms on, recovered from
     * the encoded Matter areaId (see [[encodeAreaId]] in clusters.ts). When set, it
     * overrides resolveMapIdForPendingRooms() — necessary for multi-floor setups
     * where room IDs overlap across floors and ID-matching would be ambiguous.
     */
    async handleRoomSelection(roomIds, targetMapId) {
        this.pendingRoomIds = roomIds.length > 0 ? [...roomIds] : null;
        this.pendingMapId = roomIds.length > 0 ? targetMapId : undefined;
        this.log.debug(roomIds.length > 0
            ? `[Rooms] User selected rooms for next start: [${roomIds.join(', ')}]${targetMapId !== undefined ? ` (mapId=${targetMapId})` : ''}`
            : '[Rooms] Room selection cleared — next start will auto-clean.');
    }
    /**
     * Resolves the correct mapId for the pending room-clean. When Apple Home
     * encoded the target floor into the areaId (multi-floor setup), `pendingMapId`
     * wins outright; otherwise we fall back to scanning `knownMaps` for the floor
     * whose rooms match the pending IDs — that fallback only works reliably when
     * room IDs are unique across floors.
     * Returns undefined when no rooms are pending or none match any known map.
     */
    resolveMapIdForPendingRooms(knownMaps) {
        if (!this.pendingRoomIds || this.pendingRoomIds.length === 0 || knownMaps.length === 0) {
            return undefined;
        }
        if (this.pendingMapId !== undefined) {
            return this.pendingMapId;
        }
        const pendingSet = new Set(this.pendingRoomIds);
        let bestMapId;
        let bestCount = 0;
        for (const map of knownMaps) {
            const count = map.rooms.filter((r) => {
                const id = Number.parseInt(r.id, 10);
                return Number.isFinite(id) && pendingSet.has(id);
            }).length;
            if (count > bestCount) {
                bestCount = count;
                bestMapId = map.mapId;
            }
        }
        return bestMapId;
    }
    suppressPauseForCommandSequence(durationMs = 8000) {
        this.pauseSuppressionUntil = Date.now() + durationMs;
    }
}
exports.MatterCommandHandlers = MatterCommandHandlers;
