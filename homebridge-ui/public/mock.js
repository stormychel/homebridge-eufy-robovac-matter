/**
 * Standalone preview bridge.
 *
 * Inside Homebridge UI X, the host injects `window.homebridge` before
 * iframes load. Outside that shell (this design system's preview pane,
 * or a plain browser) we install a stub with the same surface so the
 * exact same React code works in both environments.
 *
 * The mock holds state in memory, fakes optimistic mutations, and emits
 * 'state-update' events at a slow tick so you can see live behaviour.
 */
(function () {
  'use strict';
  if (window.homebridge && typeof window.homebridge.request === 'function') {
    return; // real host present, nothing to do.
  }
  console.info('[eufy-ui] no Homebridge host — installing in-memory mock.');

  // ---- in-memory fixture ---------------------------------------------------
  const state = {
    live: true,
    device: {
      sn: 'T2351-A0F381D6',
      model: 'T2351',
      name: 'RoboVac X10 Pro Omni',
      firmware: '1.12.4',
      lastSyncAt: Date.now() - 4000,
    },
    activity: {
      runMode: 'idle', paused: false, cleanMode: 'AUTO', suctionLevel: 2,
      mopLevel: 'MIDDLE',
      cleanSession: { durationSeconds: 1680, areaSqCm: 1840000 },
      lifetime:     { cleans: 142, areaSqCm: 124300000, durationSeconds: 86400 * 4 },
      activeError: {
        code: 'E6021', label: 'dirty water tank full',
        detail: 'Empty the dirty water tank at the dock. The robot will pause cleaning until the tank is reinstalled.',
        ageMs: 120000,
      },
    },
    power:    { batteryPercent: 93, docked: true, charging: false },
    water:    { clean: 76, dirty: 88 },
    station:  { activity: ['mop-drying'] },
    rooms: [
      { id: '12', name: 'Kitchen',     enabled: true  },
      { id: '15', name: 'Living room', enabled: true  },
      { id: '18', name: 'Hallway',     enabled: false },
      { id: '21', name: 'Bedroom',     enabled: true  },
      { id: '24', name: 'Office',      enabled: false },
    ],
    consumables: [
      { key: 'sideBrush',    name: 'Side brush',         icon: 'bi-fan',           hours: 112, max: 150 },
      { key: 'rollingBrush', name: 'Rolling brush',      icon: 'bi-record-circle', hours: 78,  max: 300 },
      { key: 'filterMesh',   name: 'Filter mesh',        icon: 'bi-filter',        hours: 36,  max: 200 },
      { key: 'mop',          name: 'Mop pad',            icon: 'bi-droplet',       hours: 91,  max: 100 },
      { key: 'dustbag',      name: 'Dust bag',           icon: 'bi-trash3',        hours: 22,  max: 60  },
      { key: 'dirtyWaterfilter', name: 'Dirty water filter', icon: 'bi-funnel',    hours: 8,   max: 50  },
    ],
    mqtt: { connected: true, attempts: 1, backoffMs: 0, lastMsgAt: Date.now() - 4000, dpsKeyCount: 9 },
    diagnostics: {
      log: [
        { t: '12:04:11', level: 'info',  msg: 'MQTT connected · subscribed cmd/eufy_home/T2351/.../res' },
        { t: '12:04:12', level: 'debug', msg: 'DPS 163  battery → 93' },
        { t: '12:04:12', level: 'debug', msg: 'DPS 153  WorkStatus → state=3 charging.state=0 → docked, charging' },
        { t: '12:04:12', level: 'debug', msg: 'DPS 158  clean_speed → 1 → SuctionLevel STANDARD (2)' },
        { t: '12:04:13', level: 'info',  msg: 'DPS 165  UniversalDataResponse → 5 rooms discovered' },
        { t: '12:04:13', level: 'debug', msg: 'DPS 175  ConsumableRuntime → side:112h roll:78h filter:36h mop:91h' },
        { t: '12:04:14', level: 'debug', msg: 'DPS 168  CleanStatistics single → duration=1680s area=184dm²' },
        { t: '12:04:14', level: 'info',  msg: 'DPS 173  Station → mop-drying' },
        { t: '12:06:32', level: 'warn',  msg: 'DPS 177  ErrorCode → E6021 dirty water tank full' },
      ],
      dps: {
        '153': { name: 'WorkStatus',           value: 'docked, charging' },
        '154': { name: 'CleanParamResponse',   value: 'fan=1, type=0' },
        '158': { name: 'clean_speed',          value: '1' },
        '163': { name: 'battery',              value: '93' },
        '165': { name: 'UniversalDataResponse', value: '5 rooms' },
        '168': { name: 'CleanStatistics',      value: '1680s · 184dm²' },
        '173': { name: 'Station',              value: 'mop-drying' },
        '175': { name: 'ConsumableRuntime',    value: '{ … }' },
        '177': { name: 'ErrorCode',            value: 'E6021' },
      },
    },
    scenes: [
      { id: 'sc-quick',   name: 'Quick clean',     icon: 'bi-lightning',   accent: '#4FD3DA',
        mode: 'VACUUM_ONLY',     suction: 2, mopLevel: null,   roomIds: ['12','15'],
        summary: 'Living room · hallway · vacuum only · standard',
        exposed: true, lastRunAt: Date.now() - 4 * 3600 * 1000 },
      { id: 'sc-deep',    name: 'Deep clean',      icon: 'bi-stars',       accent: '#F0B354',
        mode: 'VACUUM_AND_MOP',  suction: 4, mopLevel: 'HIGH', roomIds: [],
        summary: 'All rooms · vacuum + mop · max · mop high',
        exposed: true, lastRunAt: Date.now() - 28 * 3600 * 1000 },
      { id: 'sc-kitchen', name: 'Kitchen mop',     icon: 'bi-droplet',     accent: '#7FB2FF',
        mode: 'MOP_ONLY',        suction: 1, mopLevel: 'HIGH', roomIds: ['12'],
        summary: 'Kitchen only · mop only · mop high',
        exposed: false, lastRunAt: Date.now() - 3 * 86400 * 1000 },
      { id: 'sc-bedroom', name: 'Bedroom quiet',   icon: 'bi-moon-stars',  accent: '#58D89A',
        mode: 'VACUUM_ONLY',     suction: 1, mopLevel: null,   roomIds: ['21'],
        summary: 'Bedroom only · vacuum only · quiet suction',
        exposed: true, lastRunAt: null },
    ],
  };

  const config = [{
    platform: 'EufyRobovacMatter',
    username: 'sebastian@example.com',
    password: '••••••••',
    defaultMode: 'AUTO',
    defaultSuction: 2,
    mqttReconnectMaxDelay: 30000,
    disableMatterStatePush: false,
    rooms: [],
  }];

  // ---- event emitter -------------------------------------------------------
  const listeners = new Map();
  function emit(type, payload) {
    (listeners.get(type) || []).forEach(fn => { try { fn(payload); } catch (e) { console.error(e); } });
  }

  // ---- handlers ------------------------------------------------------------
  const handlers = {
    '/status':           async () => ({ ...structuredClone(state) }),
    '/health':           async () => ({
      status: 'ok', snapshotAgeMs: 3500, mqttConnected: true,
      mqttAttempts: 1, dpsKeyCount: 24,
      deviceName: state.device.name, runMode: state.activity.runMode,
      pluginUiVersion: 'mock',
    }),
    '/diagnostics':      async () => structuredClone(state.diagnostics),
    '/matter-codes':     async () => ({
      codes: [
        {
          uniqueId: '38F271D9B643', displayName: 'Robovac', kind: 'standalone',
          manualPairingCode: '0285-490-5403', qrPayload: 'MT:-24J0IRV01FEJ.24700',
          qrDataUrl: null, passcode: 8859525, discriminator: 313,
          commissioned: false, fabricCount: 0,
          fabrics: [], hasOrphanFabric: false,
          accessories: [{ displayName: 'Robovac', deviceType: 'RoboticVacuumCleaner' }],
        },
        {
          uniqueId: '0EBCFFE6F1FC', displayName: 'Bridge (5 accessories)', kind: 'aggregator',
          manualPairingCode: '1234-567-8901', qrPayload: 'MT:-MOCK',
          qrDataUrl: null, passcode: 12345678, discriminator: 1234,
          commissioned: true, fabricCount: 2,
          // One real Apple Home + one orphan — exercises the warning state.
          fabrics: [
            { fabricIndex: 1, nodeId: '1331526602', label: 'Winde' },
            { fabricIndex: 2, nodeId: '4112752971', label: '' },
          ],
          hasOrphanFabric: true,
          accessories: [
            { displayName: 'Robovac Empty Bin',  deviceType: 'OnOffPlugInUnit' },
            { displayName: 'Robovac Quick',      deviceType: 'OnOffPlugInUnit' },
            { displayName: 'Robovac Quiet',      deviceType: 'OnOffPlugInUnit' },
            { displayName: 'Robovac Low Power',  deviceType: 'OnOffPlugInUnit' },
            { displayName: 'Robovac Deep Clean', deviceType: 'OnOffPlugInUnit' },
          ],
        },
      ],
    }),
    '/reset-pairing':    async ({ uniqueId, confirm } = {}) => {
      if (confirm !== 'RESET') throw new Error('confirm must be "RESET"');
      if (!/^[0-9A-Fa-f]{12}$/.test(String(uniqueId || ''))) throw new Error('invalid uniqueId');
      // Mock just pretends — real server wipes files on disk.
      return {
        ok: true, uniqueId,
        wiped: [`${uniqueId}/`, 'commissioning.json', 'credentials.json'],
        backup: `/.homebridge-dev/matter/${uniqueId}/accessories.backup.mock.json`,
        restartHint: 'Click "Restart Homebridge" to regenerate codes.',
      };
    },
    '/doctor':           async () => ({
      checks: [
        { id: 'snapshot', label: 'Plugin running', status: 'pass', detail: 'Last snapshot 4 s ago.' },
        { id: 'mqtt',     label: 'MQTT connection', status: 'pass', detail: 'Connected · 24 DPS keys received.' },
        { id: 'device',   label: 'Robot device', status: 'pass', detail: 'RoboVac X10 Pro Omni (T2351, fw 1.12.4).' },
        { id: 'rooms',    label: 'Room discovery', status: 'pass', detail: '5 rooms known.' },
        { id: 'error',    label: 'Robot error state', status: 'warn',
          detail: 'E6021 — dirty water tank full.',
          hint: 'Empty the dirty water tank at the dock; the error clears automatically.' },
        { id: 'matter-fabrics', label: 'Matter fabrics', status: 'warn',
          detail: 'Orphan fabric on: Bridge (5 accessories). Re-pairing in Apple Home will likely fail.',
          hint: 'Open the Matter tab → Reset Pairing on the affected bridge, then restart Homebridge and scan the fresh QR code.' },
      ],
      generatedAt: Date.now(),
    }),
    // Mock-only stub kept so the legacy reconnect-mqtt call doesn't 404 in
    // older UI builds that may still exist in browser cache during dev. Real
    // server.js no longer exposes this endpoint.
    '/reconnect-mqtt':   async () => {
      state.mqtt.connected = false;
      emit('mqtt-status', state.mqtt);
      await new Promise(r => setTimeout(r, 900));
      state.mqtt.connected = true;
      state.mqtt.attempts = (state.mqtt.attempts || 0) + 1;
      state.mqtt.lastMsgAt = Date.now();
      emit('mqtt-status', state.mqtt);
      return { ok: true };
    },
  };

  // ---- the homebridge stub ------------------------------------------------
  window.homebridge = {
    async request(p, payload) {
      const h = handlers[p];
      if (!h) throw new Error('mock handler missing: ' + p);
      await new Promise(r => setTimeout(r, 80)); // tiny delay
      return await h(payload || {});
    },
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
    },
    removeEventListener(type, fn) {
      const arr = listeners.get(type);
      if (!arr) return;
      const i = arr.indexOf(fn);
      if (i >= 0) arr.splice(i, 1);
    },
    async getPluginConfig() { return structuredClone(config); },
    async updatePluginConfig(next) { config[0] = { ...config[0], ...next[0] }; return; },
    async savePluginConfig() { return; },
    toast: {
      success(msg) { showToast('success', msg); },
      error(msg)   { showToast('error',   msg); },
      info(msg)    { showToast('info',    msg); },
    },
    showSpinner() {}, hideSpinner() {},
  };

  function showToast(kind, msg) {
    let host = document.querySelector('.toast-host');
    if (!host) {
      host = document.createElement('div');
      host.className = 'toast-host';
      document.body.appendChild(host);
    }
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    const icon = kind === 'success' ? 'bi-check-circle-fill'
              : kind === 'error'   ? 'bi-exclamation-triangle-fill'
              :                       'bi-info-circle-fill';
    el.innerHTML = `<i class="bi ${icon}"></i><span>${msg}</span>`;
    host.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  // periodic battery jitter so the page feels alive
  setInterval(() => {
    if (state.power.docked && state.power.batteryPercent < 100) {
      state.power.batteryPercent = Math.min(100, state.power.batteryPercent + 1);
      emit('state-update', { power: state.power });
    }
  }, 7000);
})();
