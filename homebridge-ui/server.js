/**
 * Homebridge UI server for homebridge-eufy-robovac-matter.
 *
 * Runs in its own Node process under Homebridge UI X. Cannot share an
 * MQTT connection with the running platform plugin (different process),
 * so we read a state snapshot the platform writes to disk.
 *
 *   - State file:   <storagePath>/.homebridge-eufy-robovac-matter.state.json
 *
 * The UI is **read-only** with respect to plugin state. Writing back to the
 * device (start clean, reset consumable, toggle room, …) is intentionally
 * NOT done from this UI — those actions belong in Apple Home / EVE via
 * Matter, which already exposes them through the 5 momentary OnOffOutlet
 * sibling accessories the plugin publishes. Keeping the UI read-only avoids
 * the "shown but doesn't actually work" trap that previously surfaced fake
 * Reset / Reconnect / Run-Scene buttons.
 *
 * If the snapshot file doesn't exist (plugin not running, or just installed),
 * /status returns a "no live data" sentinel and the UI shows a calm empty
 * state. The UI never crashes the request pipeline.
 *
 * NOTE: @homebridge/plugin-ui-utils@2.x is ESM-only, so this file must use
 * `import` (not `require`). The homebridge-ui/package.json sets
 * `"type": "module"` so Node parses .js here as ESM.
 */
import fs from 'node:fs';
import path from 'node:path';
import { HomebridgePluginUiServer, RequestError } from '@homebridge/plugin-ui-utils';
import QRCode from 'qrcode';
import { resetPairing } from './reset-pairing.mjs';

const STATE_FILE_NAME = '.homebridge-eufy-robovac-matter.state.json';
const STATE_POLL_MS = 2000;

class UiServer extends HomebridgePluginUiServer {
  constructor() {
    super();

    this.storagePath = this.homebridgeStoragePath;
    this.stateFile = path.join(this.storagePath, STATE_FILE_NAME);

    // --- request handlers ----------------------------------------------------
    this.onRequest('/status',         this.handleStatus.bind(this));
    this.onRequest('/health',         this.handleHealth.bind(this));
    this.onRequest('/doctor',         this.handleDoctor.bind(this));
    this.onRequest('/diagnostics',    this.handleDiagnostics.bind(this));
    this.onRequest('/matter-codes',   this.handleMatterCodes.bind(this));
    // /reset-pairing is the ONE write endpoint on this otherwise read-only
    // server — it wipes Matter fabric state when Apple Home leaves orphans
    // (a known matter.js / Apple Home interaction bug). Guarded by a typed
    // confirm token so a stray POST can't accidentally re-pair.
    this.onRequest('/reset-pairing',  this.handleResetPairing.bind(this));

    // --- state polling -------------------------------------------------------
    this._lastStateHash = '';
    this._pollTimer = setInterval(() => this.pollState(), STATE_POLL_MS);

    this.ready();
  }

  // ---------------------------------------------------------------------------
  // Read helpers — every read is best-effort; the UI must work without files.
  // ---------------------------------------------------------------------------

  readStateSnapshot() {
    try {
      const txt = fs.readFileSync(this.stateFile, 'utf8');
      return JSON.parse(txt);
    } catch (e) {
      return { live: false, reason: e.code === 'ENOENT' ? 'no-snapshot' : String(e) };
    }
  }

  // ---------------------------------------------------------------------------
  // Polling — diff state on disk against last seen, push updates to UI.
  // ---------------------------------------------------------------------------

  pollState() {
    const snap = this.readStateSnapshot();
    const hash = JSON.stringify(snap);
    if (hash === this._lastStateHash) return;
    this._lastStateHash = hash;
    this.pushEvent('state-update', snap);

    if (snap?.mqtt) this.pushEvent('mqtt-status', snap.mqtt);
  }

  // ---------------------------------------------------------------------------
  // Request handlers
  // ---------------------------------------------------------------------------

  async handleStatus() {
    return this.readStateSnapshot();
  }

  /**
   * Lightweight health probe — minimal output, intended for external uptime
   * checks (curl, monitoring agents). For human-friendly explanations see
   * /doctor instead.
   */
  async handleHealth() {
    const snap = this.readStateSnapshot();
    if (!snap || snap.live === false) {
      return { status: 'no-snapshot', snapshotAgeMs: null, mqttConnected: false, dpsKeyCount: 0 };
    }
    const ageMs = snap.device?.lastSyncAt ? Date.now() - snap.device.lastSyncAt : null;
    const stale = ageMs !== null && ageMs > 5 * 60 * 1000;
    return {
      status: stale ? 'stale' : 'ok',
      snapshotAgeMs: ageMs,
      mqttConnected: !!snap.mqtt?.connected,
      mqttAttempts: snap.mqtt?.attempts ?? 0,
      dpsKeyCount: snap.mqtt?.dpsKeyCount ?? 0,
      deviceName: snap.device?.name ?? null,
      runMode: snap.activity?.runMode ?? null,
      pluginUiVersion: process.env.HOMEBRIDGE_UI_VERSION ?? null,
    };
  }

  /**
   * Doctor — runs a structured set of "is the plugin healthy" checks and
   * returns one row per check with status + remediation hint. The UI renders
   * this as a green/amber/red table so users can sanity-check their install
   * without having to grep logs.
   *
   * Each check is one of:
   *   { id, label, status: 'pass'|'warn'|'fail'|'skip', detail, hint? }
   */
  async handleDoctor() {
    const snap = this.readStateSnapshot();
    const checks = [];

    // ── Plugin snapshot ─────────────────────────────────────────────────────
    if (!snap || snap.live === false) {
      checks.push({
        id: 'snapshot', label: 'Plugin running', status: 'fail',
        detail: 'No state snapshot found on disk yet.',
        hint: 'Restart Homebridge and wait ~30 s for the plugin to publish its first snapshot. '
          + 'If this persists, check the Homebridge log for plugin load errors.',
      });
      return { checks, generatedAt: Date.now() };
    }
    checks.push({
      id: 'snapshot', label: 'Plugin running', status: 'pass',
      detail: `Last snapshot ${formatRelative(Date.now() - (snap.device?.lastSyncAt ?? 0))}.`,
    });

    // ── MQTT connectivity ───────────────────────────────────────────────────
    const ageMs = snap.device?.lastSyncAt ? Date.now() - snap.device.lastSyncAt : null;
    const mqttConnected = !!snap.mqtt?.connected;
    if (!mqttConnected) {
      checks.push({
        id: 'mqtt', label: 'MQTT connection', status: 'fail',
        detail: `MQTT disconnected after ${snap.mqtt?.attempts ?? 0} attempts.`,
        hint: 'Check the Eufy username/password in Settings. If credentials are correct, '
          + 'the cloud broker may be rate-limiting — wait a minute and look at the log.',
      });
    } else if (ageMs !== null && ageMs > 10 * 60 * 1000) {
      checks.push({
        id: 'mqtt', label: 'MQTT connection', status: 'warn',
        detail: `Connected, but no MQTT traffic for ${Math.round(ageMs / 60000)} min.`,
        hint: 'Normal when the robot is idle. If your robot is actively cleaning, this may indicate a stale connection.',
      });
    } else {
      checks.push({
        id: 'mqtt', label: 'MQTT connection', status: 'pass',
        detail: `Connected · ${snap.mqtt?.dpsKeyCount ?? 0} DPS keys received.`,
      });
    }

    // ── Device discovery ────────────────────────────────────────────────────
    if (!snap.device?.sn) {
      checks.push({
        id: 'device', label: 'Robot device', status: 'fail',
        detail: 'No device discovered from the Eufy cloud.',
        hint: 'Verify the robot appears in the Eufy app under the same account.',
      });
    } else {
      checks.push({
        id: 'device', label: 'Robot device', status: 'pass',
        detail: `${snap.device.name} (${snap.device.model}, fw ${snap.device.firmware ?? '—'}).`,
      });
    }

    // ── Rooms ──────────────────────────────────────────────────────────────
    const roomCount = snap.rooms?.length ?? 0;
    if (roomCount === 0) {
      checks.push({
        id: 'rooms', label: 'Room discovery', status: 'warn',
        detail: 'No rooms discovered yet (DPS 165).',
        hint: 'Open the Eufy app and tap each floor under "Multi-Map"; the robot will broadcast the room list shortly after.',
      });
    } else {
      checks.push({
        id: 'rooms', label: 'Room discovery', status: 'pass',
        detail: `${roomCount} room${roomCount === 1 ? '' : 's'} known.`,
      });
    }

    // ── Active error ────────────────────────────────────────────────────────
    if (snap.activity?.activeError) {
      checks.push({
        id: 'error', label: 'Robot error state', status: 'warn',
        detail: `${snap.activity.activeError.code} — ${snap.activity.activeError.label}.`,
        hint: 'Resolve the condition on the robot, then the error clears automatically.',
      });
    } else {
      checks.push({
        id: 'error', label: 'Robot error state', status: 'pass',
        detail: 'No active error reported.',
      });
    }

    // ── Matter fabrics ──────────────────────────────────────────────────────
    // Scans every <storage>/matter/<id>/commissioning.json for orphan fabric
    // records — Apple Home occasionally leaves these behind when "Remove
    // Accessory" fails to send a clean UnpairFabric command, which then
    // blocks re-pairing until the fabric state is wiped.
    try {
      const codes = (await this.handleMatterCodes()).codes ?? [];
      const orphanBridges = codes.filter((c) => c.commissioned && c.hasOrphanFabric);
      if (orphanBridges.length > 0) {
        const names = orphanBridges.map((c) => c.displayName).join(', ');
        checks.push({
          id: 'matter-fabrics', label: 'Matter fabrics', status: 'warn',
          detail: `Orphan fabric on: ${names}. Re-pairing in Apple Home will likely fail.`,
          hint: 'Open the Matter tab → Reset Pairing on the affected bridge, then restart Homebridge and scan the fresh QR code.',
        });
      } else if (codes.length > 0) {
        const total = codes.reduce((s, c) => s + (c.fabricCount ?? 0), 0);
        checks.push({
          id: 'matter-fabrics', label: 'Matter fabrics', status: 'pass',
          detail: `${codes.length} bridge${codes.length === 1 ? '' : 's'} · ${total} fabric${total === 1 ? '' : 's'}, all labelled.`,
        });
      }
    } catch (e) {
      checks.push({
        id: 'matter-fabrics', label: 'Matter fabrics', status: 'skip',
        detail: `Could not scan Matter storage: ${e.message}.`,
      });
    }

    return { checks, generatedAt: Date.now() };
  }

  /**
   * Wipes Matter fabric state for a single bridge so Apple Home can re-pair.
   * Delegates to the testable resetPairing() helper — server-side this thin
   * wrapper just translates plain Errors into RequestError with HTTP status.
   *
   * Payload: { uniqueId: '<12-hex>', confirm: 'RESET' }
   * Returns: { ok, uniqueId, wiped: [...], backup, restartHint }
   */
  async handleResetPairing(payload) {
    try {
      return resetPairing({
        storagePath: this.storagePath,
        uniqueId:    String(payload?.uniqueId ?? '').trim(),
        confirm:     String(payload?.confirm  ?? '').trim(),
      });
    } catch (e) {
      const msg = e.message || String(e);
      // 400 for input errors, 404 for missing dir, 500 for anything else.
      let status = 500;
      if (msg.startsWith('No bridge dir')) status = 404;
      else if (/Refused|Invalid|requires confirm|required/.test(msg)) status = 400;
      throw new RequestError(msg, { status });
    }
  }

  async handleDiagnostics() {
    const snap = this.readStateSnapshot();
    return {
      log: snap?.diagnostics?.log ?? [],
      dps: snap?.diagnostics?.dps ?? {},
    };
  }

  /**
   * Walks every `<storage>/matter/<id>/commissioning.json` and returns every
   * Matter publisher this Homebridge instance hosts. Some accessories (notably
   * RoboticVacuumCleaner) are published as standalone external Matter nodes
   * with their own QR code — those are normally hidden in the Homebridge UI
   * and the user has to dig through the filesystem to find them. This endpoint
   * collects them in one shot so the plugin UI can render every code in a
   * single place.
   */
  async handleMatterCodes() {
    const matterRoot = path.join(this.storagePath, 'matter');
    let entries;
    try {
      entries = await fs.promises.readdir(matterRoot, { withFileTypes: true });
    } catch (e) {
      if (e.code === 'ENOENT') return { codes: [] };
      throw new RequestError(`Failed to scan ${matterRoot}: ${e.message}`, { status: 500 });
    }

    const out = [];
    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      const dir = path.join(matterRoot, ent.name);
      const commissioningPath = path.join(dir, 'commissioning.json');
      const accessoriesPath = path.join(dir, 'accessories.json');

      let commissioning;
      try {
        commissioning = JSON.parse(await fs.promises.readFile(commissioningPath, 'utf8'));
      } catch {
        continue;
      }

      let accessories = [];
      try {
        const arr = JSON.parse(await fs.promises.readFile(accessoriesPath, 'utf8'));
        if (Array.isArray(arr)) accessories = arr;
      } catch { /* leave empty */ }

      const kind = accessories.length === 1 ? 'standalone' : 'aggregator';
      const primaryName = accessories[0]?.displayName ?? ent.name;
      const displayName = kind === 'standalone'
        ? primaryName
        : `Bridge (${accessories.length} accessor${accessories.length === 1 ? 'y' : 'ies'})`;

      let qrDataUrl = null;
      try {
        qrDataUrl = await QRCode.toDataURL(commissioning.qrCode, {
          margin: 2,
          width: 220,
          color: { dark: '#0F1216', light: '#FFFFFF' },
        });
      } catch (e) {
        // Render failure shouldn't break the whole listing.
      }

      // Fabric labels surface which Apple Home(s) are paired. An empty label
      // on an otherwise-commissioned bridge is the orphan-fabric signature
      // (Apple Home didn't finish UnpairFabric cleanly on a re-pair attempt).
      const fabrics = Array.isArray(commissioning.fabrics)
        ? commissioning.fabrics.map((f) => ({
            fabricIndex: f.fabricIndex ?? null,
            nodeId: f.nodeId ?? null,
            label: typeof f.label === 'string' ? f.label : '',
          }))
        : [];
      const hasOrphanFabric = fabrics.some((f) => !f.label);

      out.push({
        uniqueId: ent.name,
        displayName,
        kind,
        manualPairingCode: commissioning.manualPairingCode,
        qrPayload: commissioning.qrCode,
        qrDataUrl,
        passcode: commissioning.passcode,
        discriminator: commissioning.discriminator,
        commissioned: !!commissioning.commissioned,
        fabricCount: commissioning.fabricCount ?? fabrics.length,
        fabrics,
        hasOrphanFabric,
        accessories: accessories.map((a) => ({
          displayName: a.displayName ?? a.serialNumber ?? '?',
          deviceType: typeof a.deviceType === 'object' ? a.deviceType?.name : a.deviceType,
        })),
      });
    }

    out.sort((a, b) => {
      if (a.commissioned !== b.commissioned) return a.commissioned ? 1 : -1;
      return a.displayName.localeCompare(b.displayName);
    });

    return { codes: out };
  }
}

function formatRelative(ageMs) {
  if (ageMs === null || ageMs === undefined || Number.isNaN(ageMs)) return 'never';
  const s = ageMs / 1000;
  if (s < 60) return Math.round(s) + ' s ago';
  if (s < 3600) return Math.round(s / 60) + ' min ago';
  return (s / 3600).toFixed(1) + ' h ago';
}

new UiServer();
