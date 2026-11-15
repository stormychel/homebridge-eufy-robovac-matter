/**
 * Pure-node helper that wipes Matter fabric state for a single bridge.
 *
 * Lives outside server.js so it can be unit-tested without standing up the
 * @homebridge/plugin-ui-utils superclass. The bash CLI in
 * scripts/reset-matter-pairing.sh does the same thing in pure shell for the
 * SSH-into-Pi case.
 *
 * Files removed (best-effort, missing is fine):
 *   <storage>/matter/<uniqueId>/<uniqueId>/        ← matter.js fabric data
 *   <storage>/matter/<uniqueId>/commissioning.json ← QR / passcode / fabrics
 *   <storage>/matter/<uniqueId>/credentials.json   ← operational credentials
 *
 * Preserved (with timestamped backup):
 *   <storage>/matter/<uniqueId>/accessories.json   ← stable Matter identity
 */
import fs from 'node:fs';
import path from 'node:path';

/**
 * @typedef {object} ResetResult
 * @property {boolean} ok
 * @property {string} uniqueId
 * @property {string[]} wiped    paths-relative-to-bridgeDir that were removed
 * @property {string|null} backup absolute path to the backup file, or null
 * @property {string} restartHint user-facing next-step
 */

/**
 * @param {object} opts
 * @param {string} opts.storagePath  Homebridge storage root (e.g. ~/.homebridge-dev)
 * @param {string} opts.uniqueId     12-char hex Matter bridge id
 * @param {string} opts.confirm      Must equal 'RESET' or throws
 * @returns {ResetResult}
 */
export function resetPairing({ storagePath, uniqueId, confirm }) {
  if (confirm !== 'RESET') {
    throw new Error('Reset requires confirm: "RESET".');
  }
  if (!/^[0-9A-Fa-f]{12}$/.test(String(uniqueId ?? ''))) {
    throw new Error('Invalid uniqueId (expected 12-char hex).');
  }
  if (!storagePath) {
    throw new Error('storagePath required.');
  }

  // Resolve and guard against path traversal: the dir MUST be a direct
  // child of <storagePath>/matter — no '..' segments allowed.
  const matterRoot = path.resolve(path.join(storagePath, 'matter'));
  const bridgeDir  = path.resolve(path.join(matterRoot, uniqueId));
  if (path.dirname(bridgeDir) !== matterRoot) {
    throw new Error('Refused: bridgeDir escaped matter root.');
  }
  if (!fs.existsSync(bridgeDir)) {
    throw new Error(`No bridge dir at ${bridgeDir}.`);
  }

  const wiped = [];
  let backup = null;

  // 1. Back up accessories.json first — abort if backup fails.
  const accessoriesPath = path.join(bridgeDir, 'accessories.json');
  if (fs.existsSync(accessoriesPath)) {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    backup = path.join(bridgeDir, `accessories.backup.${ts}.json`);
    fs.copyFileSync(accessoriesPath, backup);
  }

  // 2. Wipe the three fabric-state targets.
  const innerDir = path.join(bridgeDir, uniqueId);
  if (fs.existsSync(innerDir)) {
    fs.rmSync(innerDir, { recursive: true, force: true });
    wiped.push(`${uniqueId}/`);
  }
  for (const name of ['commissioning.json', 'credentials.json']) {
    const p = path.join(bridgeDir, name);
    if (fs.existsSync(p)) {
      fs.rmSync(p, { force: true });
      wiped.push(name);
    }
  }

  return {
    ok: true,
    uniqueId,
    wiped,
    backup,
    restartHint: 'Click "Restart Homebridge" in the top bar. The plugin '
      + 'regenerates a fresh commissioning.json with a new QR code.',
  };
}
