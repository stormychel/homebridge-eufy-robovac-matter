# `homebridge-ui/` — drop‑in custom UI for the plugin

This folder is a **complete Homebridge custom UI** for
`homebridge-eufy-robovac-matter`. Copy it into the plugin repo at the path
`homebridge-ui/` (same level as `src/`, `dist/`, `config.schema.json`) and
the Homebridge UI X shell will pick it up automatically.

It is wired to the **Eufy RoboVac Matter design system** in the parent project
— same tokens, same components, same iconography — but with real
`homebridge.request(...)` calls instead of mock state.

```
homebridge-ui/
├─ server.js                 ← Node side, extends HomebridgePluginUiServer
└─ public/
   ├─ index.html             ← entry point
   ├─ styles.css             ← design tokens + reset (self-contained)
   ├─ mock.js                ← stub `window.homebridge` for standalone preview
   ├─ components.jsx         ← Pill, Card, Toggle, WearBar, Btn, …
   ├─ tabs.jsx               ← TabDevice / Consumables / Scenes / Rooms / Settings / Diagnostics
   └─ app.jsx                ← top-level shell + tab routing
```

## Quick integration steps

1. **Copy the folder** into the plugin repo (`homebridge-matter-eufy-mqtt/homebridge-ui/`).
2. **Tell Homebridge it's there** — in `config.schema.json` set `"customUi": true`:
   ```json
   {
     "pluginAlias": "EufyRobovacMatter",
     "pluginType": "platform",
     "singular": true,
     "customUi": true,
     ...
   }
   ```
3. **Add the runtime dep** to `package.json`:
   ```bash
   npm install @homebridge/plugin-ui-utils
   ```
4. **Ship the folder** — in `package.json`, ensure `"files"` includes it:
   ```json
   "files": ["dist", "config.schema.json", "homebridge-ui"]
   ```
5. **(Optional but recommended)** Have the running platform plugin write a
   periodic JSON state snapshot to
   `<homebridge storage>/.homebridge-eufy-robovac-matter.state.json`. The UI
   server reads that snapshot. See **INTEGRATION.md** for the exact contract
   and a 60‑line patch for `src/device-session.ts`.

## Standalone preview

The folder also runs as a static page outside Homebridge UI X. `mock.js`
detects the absence of `window.homebridge` and installs a stand-in that uses
in‑memory state — handy for design iteration without a running Homebridge.

Open `homebridge-ui/public/index.html` directly to preview.

## Endpoints exposed by `server.js`

| Method | Path | Payload | Returns |
|---|---|---|---|
| GET  | `/status`               | —                            | Full normalised state snapshot |
| POST | `/reset-consumable`     | `{ key: "sideBrush" }`       | `{ ok: true }` |
| POST | `/run-scene`            | `{ id: "sc-quick" }`         | `{ ok: true, queued: "sc-quick" }` |
| POST | `/save-scene`           | `{ scene: { … } }`           | `{ ok: true }` |
| POST | `/delete-scene`         | `{ id }`                     | `{ ok: true }` |
| POST | `/toggle-room`          | `{ id, enabled }`            | `{ ok: true }` |
| POST | `/reconnect-mqtt`       | —                            | `{ ok: true }` |
| GET  | `/diagnostics`          | —                            | `{ log, dps }` |

Server emits these events to the UI via `pushEvent`:

| Event | Payload |
|---|---|
| `state-update`    | partial state diff |
| `mqtt-status`     | `{ connected, attempts, lastMsgAt }` |
| `dps`             | `{ key, value, decoded }` (debug stream) |
