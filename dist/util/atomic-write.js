"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.atomicWriteFile = atomicWriteFile;
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const node_crypto_1 = require("node:crypto");
/**
 * Atomic file write — writes content to a temporary sibling, then renames it
 * onto the target path. POSIX `rename()` is atomic when source and destination
 * live on the same filesystem, so readers never observe a half-written file
 * even if the process is killed mid-write.
 *
 * Why this matters in production: the plugin writes its sidecar JSON (rooms,
 * known maps, water levels, …) on every MQTT update. A crash or sudden
 * shutdown between `open` and `close` would leave a zero-byte or truncated
 * file on disk. On the next Homebridge restart the corrupted file would fail
 * to parse and the user loses their rooms / floor names / etc.
 *
 * The temp name uses a random suffix so concurrent writers don't clobber each
 * other's tmp file. On `rename` failure we attempt to clean up the tmp.
 */
async function atomicWriteFile(target, content, options = {}) {
    const dir = (0, node_path_1.dirname)(target);
    await (0, promises_1.mkdir)(dir, { recursive: true, mode: 0o700 });
    const tmp = (0, node_path_1.join)(dir, `.${(0, node_crypto_1.randomBytes)(6).toString('hex')}.tmp`);
    try {
        await (0, promises_1.writeFile)(tmp, content, { encoding: 'utf8', mode: options.mode ?? 0o600 });
        await (0, promises_1.rename)(tmp, target);
    }
    catch (err) {
        // Best-effort cleanup — ignore failure (tmp may already be renamed or
        // never created); the original error is what the caller cares about.
        await (0, promises_1.unlink)(tmp).catch(() => undefined);
        throw err;
    }
}
