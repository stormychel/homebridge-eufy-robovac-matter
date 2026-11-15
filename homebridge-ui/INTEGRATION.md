# Wiring the UI into the running plugin

The UI server in this folder runs as a **separate Node process** under
Homebridge UI X — it cannot share the platform plugin's MQTT client
directly. The two processes talk through a single read-only file in
`<homebridge storage>/`:

| Path | Direction | Who writes | Who reads |
|---|---|---|---|
| `.homebridge-eufy-robovac-matter.state.json` | platform → UI | `src/device-session.ts` | `server.js` |

The UI **never** assumes the platform is running. If the state file
doesn't exist, the UI shows a calm empty state and still lets the user
edit `Settings`.

## Read-only by design (v5.0)

Earlier versions of this UI had a "triggers" directory (`<storage>/.homebridge-eufy-robovac-matter.triggers/`) that the UI dropped JSON files into for actions like Reset-Consumable / Run-Scene / Toggle-Room / Reconnect-MQTT. The platform never watched that directory — the buttons looked like they worked but did nothing on the robot. v5.0 removed that pattern entirely.

If new write-back actions are added later, the recommendation is to do them through Matter (Apple Home / EVE) where they already work via the 5 momentary OnOffOutlet sibling accessories. If a Matter action genuinely cannot cover a use case, the next-best option is:

1. Add a DPS-command path in `src/eufy/commands.ts` and a handler in `src/matter/handlers.ts`.
2. Expose it as a new Matter cluster command (not a UI button).

This keeps the plugin's surface coherent — every user-triggerable action lives in HomeKit, and the plugin UI is a read-only status + config surface.

## Snapshot writer

The platform writes `state.json` via `DeviceSession.maybeWriteUiSnapshot` on every successful DPS update, throttled to one write per 500 ms via [`atomicWriteFile`](../src/util/atomic-write.ts) (tmp + rename, no corruption risk on crash). The schema is documented in the snapshot writer itself.

## Endpoints

| Method | Path | Returns |
|---|---|---|
| GET  | `/status`        | Full normalised state snapshot |
| GET  | `/health`        | Lightweight `{ status, mqttConnected, … }` for external monitoring |
| GET  | `/doctor`        | Structured pass/warn/fail checks with remediation hints (incl. orphan-fabric detection) |
| GET  | `/diagnostics`   | `{ log, dps }` — log ring buffer + raw DPS snapshot |
| GET  | `/matter-codes`  | Every Matter publisher (bridges + standalone vacuums) with QR + manual codes + fabric labels |
| POST | `/reset-pairing` | Wipe fabric state for ONE bridge — requires `{ uniqueId, confirm: 'RESET' }` |

The server also pushes events to the UI via `pushEvent`:

| Event | Payload |
|---|---|
| `state-update` | full state snapshot (debounced via 2 s polling) |
| `mqtt-status`  | `{ connected, attempts, lastMsgAt }` |

## `/reset-pairing` — the one write endpoint

Read-only by design has one carved-out exception: Apple Home sometimes leaves orphan fabric records behind when "Remove Accessory" doesn't send a clean `UnpairFabric` command. The bridge stays `commissioned: true` on disk and refuses to publish a fresh QR code, so re-pairing fails silently — the user is stuck.

`/reset-pairing` wipes the three fabric-state files for a single bridge while preserving `accessories.json` (so the Matter device identity stays stable and existing automations don't break). A timestamped backup of `accessories.json` is written alongside in case the wipe goes sideways.

Wipes:
- `<storage>/matter/<uniqueId>/<uniqueId>/`     — matter.js fabric data
- `<storage>/matter/<uniqueId>/commissioning.json`
- `<storage>/matter/<uniqueId>/credentials.json`

Preserves (with backup):
- `<storage>/matter/<uniqueId>/accessories.json`
- `<storage>/matter/<uniqueId>/accessories.backup.<ts>.json` (new)

Safety:
- Requires `confirm: 'RESET'` in payload — a stray POST gets a 400.
- `uniqueId` must match `^[0-9A-Fa-f]{12}$` (Matter unique-id format).
- The resolved `bridgeDir` must be a direct child of `<storage>/matter` — no path traversal.
- After wiping, Homebridge must be restarted so the plugin regenerates `commissioning.json` with a fresh code.

The actual wipe logic lives in [`reset-pairing.mjs`](./reset-pairing.mjs) (pure node, testable in isolation — `tests/reset-pairing.test.ts`). The bash CLI at [`scripts/reset-matter-pairing.sh`](../scripts/reset-matter-pairing.sh) does the same thing for SSH-into-Pi recovery.
