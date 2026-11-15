"use strict";
(() => {
  const { useState, useEffect, useMemo } = React;
  function formatRelative(ts) {
    if (!ts) return "never";
    const diff = (Date.now() - ts) / 1e3;
    if (diff < 60) return Math.round(diff) + " s ago";
    if (diff < 3600) return Math.round(diff / 60) + " min ago";
    if (diff < 86400) return Math.round(diff / 3600) + " h ago";
    return Math.round(diff / 86400) + " d ago";
  }
  function formatArea(sqMeters) {
    if (!sqMeters && sqMeters !== 0) return "\u2014";
    if (sqMeters === 0) return "\u2014";
    return sqMeters + " m\xB2";
  }
  function formatDuration(seconds) {
    if (!seconds) return "\u2014";
    if (seconds < 60) return seconds + " s";
    if (seconds < 3600) return Math.round(seconds / 60) + " min";
    return (seconds / 3600).toFixed(1) + " h";
  }
  function TabDevice({ state, mutate }) {
    const power = state.power || {};
    const water = state.water || { clean: null, dirty: null };
    const err = state.activity?.activeError;
    const session = state.activity?.cleanSession || {};
    const lifetime = state.activity?.lifetime || {};
    const hasActiveSession = (session.areaSqCm ?? 0) > 0 || (session.durationSeconds ?? 0) > 0;
    const sessionLabel = hasActiveSession ? "Last clean" : "Avg session";
    const durationLabel = hasActiveSession ? "Duration" : "Avg duration";
    const sessionArea = hasActiveSession ? session.areaSqCm : lifetime.cleans ? Math.round(lifetime.areaSqCm / lifetime.cleans) : void 0;
    const sessionDuration = hasActiveSession ? session.durationSeconds : lifetime.cleans ? Math.round(lifetime.durationSeconds / lifetime.cleans) : void 0;
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } }, err && /* @__PURE__ */ React.createElement("div", { style: {
      display: "flex",
      gap: 12,
      padding: "14px 16px",
      background: "color-mix(in oklab, var(--danger-500) 18%, var(--bg-1))",
      border: "1px solid color-mix(in oklab, var(--danger-500) 40%, transparent)",
      borderRadius: 10,
      alignItems: "flex-start"
    } }, /* @__PURE__ */ React.createElement("i", { className: "bi bi-exclamation-triangle-fill", style: { color: "var(--danger-fg)", fontSize: 20, marginTop: 1 } }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { font: "600 13.5px var(--font-sans)", color: "var(--danger-fg)" } }, err.code, " \u2014 ", err.label), /* @__PURE__ */ React.createElement("div", { style: { font: "400 12.5px var(--font-sans)", color: "var(--fg-2)", marginTop: 2 } }, err.detail), /* @__PURE__ */ React.createElement("div", { style: { font: "400 11.5px var(--font-sans)", color: "var(--fg-4)", marginTop: 4 } }, "Reported via DPS 177 \xB7 ", err.ageMs ? formatRelative(Date.now() - err.ageMs) : "")), /* @__PURE__ */ React.createElement(Btn, { variant: "danger", size: "sm", onClick: () => mutate((s) => ({ ...s, activity: { ...s.activity, activeError: null } })) }, "Clear")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 } }, /* @__PURE__ */ React.createElement(Stat, { label: "Battery", value: (power.batteryPercent ?? "\u2014") + "%", icon: power.charging ? "bi-lightning-charge-fill" : null, accent: "var(--success-fg)" }), /* @__PURE__ */ React.createElement(Stat, { label: sessionLabel, value: formatArea(sessionArea) }), /* @__PURE__ */ React.createElement(Stat, { label: durationLabel, value: formatDuration(sessionDuration) }), /* @__PURE__ */ React.createElement(Stat, { label: "Cleans total", value: (lifetime.cleans ?? "\u2014").toString() })), /* @__PURE__ */ React.createElement(Card, { title: "Station activity", action: /* @__PURE__ */ React.createElement("span", { style: { font: "400 11.5px var(--font-sans)", color: "var(--fg-4)" } }, "DPS 173") }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } }, (state.station?.activity || []).length === 0 && /* @__PURE__ */ React.createElement("span", { style: { font: "400 12px var(--font-sans)", color: "var(--fg-4)" } }, "Station idle."), (state.station?.activity || []).includes("mop-washing") && /* @__PURE__ */ React.createElement(Pill, { tone: "info", icon: "bi-droplet-fill" }, "Mop washing"), (state.station?.activity || []).includes("mop-drying") && /* @__PURE__ */ React.createElement(Pill, { tone: "info", icon: "bi-wind" }, "Mop drying"), (state.station?.activity || []).includes("dust-collecting") && /* @__PURE__ */ React.createElement(Pill, { tone: "info", icon: "bi-arrow-down-circle" }, "Dust collecting"), (state.station?.activity || []).includes("filling-clean-water") && /* @__PURE__ */ React.createElement(Pill, { tone: "neutral", icon: "bi-droplet" }, "Filling clean water"), (state.station?.activity || []).includes("draining-waste-water") && /* @__PURE__ */ React.createElement(Pill, { tone: "neutral", icon: "bi-droplet-half" }, "Draining waste")), /* @__PURE__ */ React.createElement("div", { style: { font: "400 11.5px var(--font-sans)", color: "var(--fg-4)", marginTop: 10 } }, 'HomeKit reports "Idle" while these run \u2014 this is the only place the user sees them.')), /* @__PURE__ */ React.createElement(Card, { title: "Water tank", action: /* @__PURE__ */ React.createElement("span", { style: { font: "400 11.5px var(--font-sans)", color: "var(--fg-4)" } }, "clean water reservoir") }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr", gap: 14 } }, [
      { key: "clean", label: "Clean water", pct: water.clean, icon: "bi-droplet", hint: "Top up at the dock when low" }
    ].map((t) => {
      const pct = t.pct ?? 0;
      const critical = pct < 20;
      const fg = critical ? "var(--danger-fg)" : "var(--info-fg)";
      return /* @__PURE__ */ React.createElement("div", { key: t.key, style: { display: "flex", gap: 12, padding: 12, background: "var(--bg-2)", border: "1px solid var(--border-1)", borderRadius: 10 } }, /* @__PURE__ */ React.createElement("i", { className: "bi " + t.icon, style: { color: fg, fontSize: 20 } }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline" } }, /* @__PURE__ */ React.createElement("span", { style: { font: "500 12px var(--font-sans)", color: "var(--fg-3)" } }, t.label), /* @__PURE__ */ React.createElement("span", { style: { font: "600 16px var(--font-sans)", color: "var(--fg-1)", fontVariantNumeric: "tabular-nums" } }, t.pct == null ? "\u2014" : t.pct + "%")), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 6, height: 6, background: "var(--bg-0)", borderRadius: 999, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: pct + "%", background: fg, borderRadius: 999, transition: "width 220ms var(--ease)" } })), /* @__PURE__ */ React.createElement("div", { style: { font: "400 11px var(--font-sans)", color: "var(--fg-4)", marginTop: 4 } }, t.hint)));
    }))), /* @__PURE__ */ React.createElement(DoctorCard, null), /* @__PURE__ */ React.createElement(MqttCard, { mqtt: state.mqtt }));
  }
  function DoctorCard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const run = async () => {
      setLoading(true);
      try {
        const result = await homebridge.request("/doctor");
        setData(result);
      } catch (e) {
        homebridge.toast.error("Doctor failed: " + e.message);
      } finally {
        setLoading(false);
      }
    };
    useEffect(() => {
      run();
    }, []);
    const toneFor = (status) => {
      if (status === "pass") return { fg: "var(--success-fg)", icon: "bi-check-circle-fill" };
      if (status === "warn") return { fg: "var(--warning-fg)", icon: "bi-exclamation-circle-fill" };
      if (status === "fail") return { fg: "var(--danger-fg)", icon: "bi-x-circle-fill" };
      return { fg: "var(--fg-4)", icon: "bi-dash-circle" };
    };
    return /* @__PURE__ */ React.createElement(
      Card,
      {
        title: "Doctor",
        action: /* @__PURE__ */ React.createElement(Btn, { variant: "ghost", size: "sm", icon: "bi-arrow-repeat", loading, onClick: run }, "Re-run")
      },
      !data ? /* @__PURE__ */ React.createElement("div", { style: { font: "400 12.5px var(--font-sans)", color: "var(--fg-4)" } }, "Running checks\u2026") : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, data.checks.map((c) => {
        const t = toneFor(c.status);
        return /* @__PURE__ */ React.createElement("div", { key: c.id, style: {
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "8px 10px",
          background: "var(--bg-2)",
          border: "1px solid var(--border-1)",
          borderRadius: 8
        } }, /* @__PURE__ */ React.createElement("i", { className: "bi " + t.icon, style: { color: t.fg, fontSize: 16, marginTop: 1 } }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { font: "600 12.5px var(--font-sans)", color: "var(--fg-1)" } }, c.label), /* @__PURE__ */ React.createElement("div", { style: { font: "400 12px var(--font-sans)", color: "var(--fg-3)", marginTop: 2 } }, c.detail), c.hint && /* @__PURE__ */ React.createElement("div", { style: { font: "400 11.5px var(--font-sans)", color: "var(--fg-4)", marginTop: 4, fontStyle: "italic" } }, c.hint)));
      }))
    );
  }
  function MqttCard({ mqtt }) {
    const connected = mqtt?.connected;
    return /* @__PURE__ */ React.createElement(Card, { title: "MQTT connection" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("span", { style: {
      width: 10,
      height: 10,
      borderRadius: "50%",
      background: connected ? "var(--success-fg)" : "var(--danger-fg)",
      boxShadow: "0 0 0 3px color-mix(in oklab, " + (connected ? "var(--success-500)" : "var(--danger-500)") + " 30%, transparent)"
    } }), /* @__PURE__ */ React.createElement("div", { style: { font: "600 14px var(--font-sans)", color: "var(--fg-1)" } }, connected ? "Connected" : "Disconnected")), /* @__PURE__ */ React.createElement("span", { style: { font: "400 11.5px var(--font-mono)", color: "var(--fg-4)" } }, "tls://mqtt.eufylife.com:8883")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 18, marginTop: 12, font: "400 12px var(--font-sans)", color: "var(--fg-3)", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(Metric, { label: "attempts", value: mqtt?.attempts ?? 0 }), /* @__PURE__ */ React.createElement(Metric, { label: "backoff", value: (mqtt?.backoffMs ?? 0) + " ms" }), /* @__PURE__ */ React.createElement(Metric, { label: "last msg", value: mqtt?.lastMsgAt ? formatRelative(mqtt.lastMsgAt) : "\u2014" }), /* @__PURE__ */ React.createElement(Metric, { label: "DPS keys", value: mqtt?.dpsKeyCount ?? 0 })));
  }
  const Metric = ({ label, value }) => /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--fg-4)" } }, label), " ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--fg-1)", fontWeight: 600, marginLeft: 4 } }, value));
  function TabSettings({ state }) {
    const [cfg, setCfg] = useState(null);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    useEffect(() => {
      (async () => {
        try {
          const arr = await homebridge.getPluginConfig();
          setCfg(arr[0] || {});
        } catch (e) {
          homebridge.toast.error("Could not load config: " + e.message);
        }
      })();
    }, []);
    if (!cfg) return /* @__PURE__ */ React.createElement(EmptyState, { icon: "bi-sliders", title: "Loading settings\u2026" });
    const set = (patch) => {
      setCfg((c) => ({ ...c, ...patch }));
      setDirty(true);
    };
    const save = async () => {
      setSaving(true);
      try {
        await homebridge.updatePluginConfig([cfg]);
        await homebridge.savePluginConfig();
        setDirty(false);
        homebridge.toast.success("Saved. Restart Homebridge for changes to take effect.");
      } catch (e) {
        homebridge.toast.error("Save failed: " + e.message);
      } finally {
        setSaving(false);
      }
    };
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement(Card, { title: "Eufy account" }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } }, /* @__PURE__ */ React.createElement(Field, { label: "Email", hint: "Same as your Eufy mobile app login." }, /* @__PURE__ */ React.createElement(Input, { value: cfg.username || "", onChange: (e) => set({ username: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: "Password" }, /* @__PURE__ */ React.createElement(Input, { type: "password", value: cfg.password || "", onChange: (e) => set({ password: e.target.value }) })))), /* @__PURE__ */ React.createElement(Card, { title: "Defaults" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14 } }, /* @__PURE__ */ React.createElement(Field, { label: "Default cleaning mode" }, /* @__PURE__ */ React.createElement(
      Segmented,
      {
        value: cfg.defaultMode || "AUTO",
        onChange: (v) => set({ defaultMode: v }),
        options: [
          { value: "AUTO", label: "Auto" },
          { value: "VACUUM_ONLY", label: "Vacuum" },
          { value: "MOP_ONLY", label: "Mop" },
          { value: "VACUUM_AND_MOP", label: "Both" }
        ]
      }
    )), /* @__PURE__ */ React.createElement(Field, { label: "Default suction level" }, /* @__PURE__ */ React.createElement(
      Segmented,
      {
        value: cfg.defaultSuction || 2,
        onChange: (v) => set({ defaultSuction: v }),
        options: [
          { value: 1, label: "Quiet" },
          { value: 2, label: "Standard" },
          { value: 3, label: "Turbo" },
          { value: 4, label: "Max" }
        ]
      }
    )))), /* @__PURE__ */ React.createElement(Card, { title: "Advanced", action: /* @__PURE__ */ React.createElement("span", { style: { font: "400 11.5px var(--font-sans)", color: "var(--fg-4)" } }, "Change only if asked to.") }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 0 } }, /* @__PURE__ */ React.createElement(
      ToggleRow,
      {
        name: "Disable Matter state push",
        hint: "Keep command support, stop pushing state to Matter (troubleshooting only).",
        on: !!cfg.disableMatterStatePush,
        onChange: (v) => set({ disableMatterStatePush: v })
      }
    ), /* @__PURE__ */ React.createElement(Divider, null), /* @__PURE__ */ React.createElement(Field, { label: "MQTT reconnect max delay", hint: "Maximum exponential backoff delay between reconnect attempts." }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center" } }, /* @__PURE__ */ React.createElement(
      Input,
      {
        value: cfg.mqttReconnectMaxDelay ?? 3e4,
        onChange: (e) => set({ mqttReconnectMaxDelay: parseInt(e.target.value, 10) || 0 }),
        style: { flex: 1, fontFamily: "var(--font-mono)" }
      }
    ), /* @__PURE__ */ React.createElement("span", { style: { font: "400 12px var(--font-sans)", color: "var(--fg-4)" } }, "ms"))))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { font: "400 11.5px var(--font-sans)", color: "var(--fg-4)" } }, dirty ? "Unsaved changes" : "All changes saved"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement(Btn, { variant: "ghost", onClick: () => window.location.reload() }, "Discard"), /* @__PURE__ */ React.createElement(Btn, { variant: "primary", icon: "bi-check2", loading: saving, disabled: !dirty, onClick: save }, "Save changes"))));
  }
  const ToggleRow = ({ name, hint, on, onChange }) => /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { font: "500 13px var(--font-sans)", color: "var(--fg-1)" } }, name), /* @__PURE__ */ React.createElement("div", { style: { font: "400 11.5px var(--font-sans)", color: "var(--fg-4)", marginTop: 2 } }, hint)), /* @__PURE__ */ React.createElement(Toggle, { on, onClick: () => onChange(!on) }));
  function TabDiagnostics({ state }) {
    const [diag, setDiag] = useState({ log: [], dps: {} });
    useEffect(() => {
      (async () => {
        try {
          const d = await homebridge.request("/diagnostics");
          setDiag(d);
        } catch (e) {
        }
      })();
    }, [state]);
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement(Card, { title: "Recent MQTT activity", action: /* @__PURE__ */ React.createElement(Btn, { variant: "ghost", size: "sm", icon: "bi-clipboard", onClick: () => {
      navigator.clipboard?.writeText(diag.log.map((l) => `[${l.t}] ${l.level.toUpperCase()} ${l.msg}`).join("\n"));
      homebridge.toast.info("Copied to clipboard.");
    } }, "Copy") }, /* @__PURE__ */ React.createElement("pre", { style: {
      margin: 0,
      font: "12px/1.55 var(--font-mono)",
      color: "var(--fg-2)",
      background: "var(--bg-0)",
      border: "1px solid var(--border-1)",
      padding: 12,
      borderRadius: 8,
      overflow: "auto",
      maxHeight: 220,
      whiteSpace: "pre-wrap"
    } }, diag.log.length === 0 ? "\u2014 no log lines yet \u2014" : diag.log.map((l) => `[${l.t}] ${l.msg}`).join("\n"))), /* @__PURE__ */ React.createElement(Card, { title: "Raw DPS snapshot" }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, font: "12.5px/1.45 var(--font-mono)", color: "var(--fg-2)" } }, Object.entries(diag.dps).length === 0 && /* @__PURE__ */ React.createElement("span", { style: { font: "400 12px var(--font-sans)", color: "var(--fg-4)" } }, "No DPS data yet."), Object.entries(diag.dps).map(([k, info]) => /* @__PURE__ */ React.createElement("div", { key: k, style: { display: "flex", gap: 10, padding: "6px 10px", background: "var(--bg-0)", borderRadius: 6, border: "1px solid var(--border-1)" } }, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--brand-300)", minWidth: 32 } }, k), /* @__PURE__ */ React.createElement("span", { style: { color: "var(--fg-3)", minWidth: 130 } }, info.name), /* @__PURE__ */ React.createElement("span", { style: { color: "var(--fg-1)" } }, info.value))))));
  }
  function TabMatter() {
    const [codes, setCodes] = useState(null);
    const [error, setError] = useState(null);
    const reload = async () => {
      setCodes(null);
      setError(null);
      try {
        const res = await homebridge.request("/matter-codes");
        setCodes(res.codes ?? []);
      } catch (e) {
        setError(e.message || String(e));
      }
    };
    useEffect(() => {
      reload();
    }, []);
    if (error) return /* @__PURE__ */ React.createElement(EmptyState, { icon: "bi-exclamation-triangle", title: "Could not load Matter codes", hint: error });
    if (codes === null) return /* @__PURE__ */ React.createElement(EmptyState, { icon: "bi-hourglass-split", title: "Loading Matter codes\u2026" });
    if (codes.length === 0) {
      return /* @__PURE__ */ React.createElement(
        EmptyState,
        {
          icon: "bi-qr-code",
          title: "No Matter bridges yet",
          hint: "Matter codes appear after Homebridge starts and the plugin publishes its first accessory."
        }
      );
    }
    return /* @__PURE__ */ React.createElement(
      Section,
      {
        title: "Matter pairing",
        hint: "Scan or enter each code in Apple Home \u2192 Add Accessory. Robot vacuums are published as standalone Matter devices (each has its own code); other accessories share a bridge code.",
        action: /* @__PURE__ */ React.createElement(Btn, { variant: "ghost", size: "sm", icon: "bi-arrow-repeat", onClick: reload }, "Refresh")
      },
      /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 } }, codes.map((c) => /* @__PURE__ */ React.createElement(MatterCodeCard, { key: c.uniqueId, code: c, onChanged: reload })))
    );
  }
  function MatterCodeCard({ code, onChanged }) {
    const [copied, setCopied] = useState(false);
    const copyCode = () => {
      const text = (code.manualPairingCode || "").replace(/-/g, "");
      navigator.clipboard?.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      });
    };
    const tone = code.hasOrphanFabric ? "warning" : code.commissioned ? "success" : "brand";
    const statusIcon = code.hasOrphanFabric ? "bi-exclamation-triangle-fill" : code.commissioned ? "bi-check-circle-fill" : "bi-arrow-down-circle";
    const statusText = code.commissioned ? `Paired \xB7 ${code.fabricCount} fabric${code.fabricCount === 1 ? "" : "s"}` : "Ready to pair";
    return /* @__PURE__ */ React.createElement("div", { style: {
      background: "var(--bg-1)",
      border: "1px solid var(--border-1)",
      borderRadius: 10,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 12
    } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { font: "600 14px var(--font-sans)", color: "var(--fg-1)" } }, code.displayName), /* @__PURE__ */ React.createElement("div", { style: { font: "400 11px var(--font-mono)", color: "var(--fg-4)", marginTop: 2 } }, code.kind === "standalone" ? "Standalone Matter device" : "Matter bridge", " \xB7 ", code.uniqueId)), /* @__PURE__ */ React.createElement(Pill, { tone, icon: statusIcon }, statusText)), code.qrDataUrl ? /* @__PURE__ */ React.createElement("div", { style: {
      display: "flex",
      justifyContent: "center",
      background: "#fff",
      padding: 12,
      borderRadius: 8
    } }, /* @__PURE__ */ React.createElement("img", { src: code.qrDataUrl, alt: `QR code for ${code.displayName}`, style: { display: "block", width: 200, height: 200 } })) : /* @__PURE__ */ React.createElement("div", { style: {
      font: "400 11.5px var(--font-mono)",
      color: "var(--fg-4)",
      wordBreak: "break-all",
      padding: 8,
      background: "var(--bg-0)",
      borderRadius: 6
    } }, "QR payload: ", code.qrPayload), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { font: "500 11.5px var(--font-sans)", color: "var(--fg-3)" } }, "Manual pairing code"), /* @__PURE__ */ React.createElement(Btn, { variant: "ghost", size: "sm", icon: copied ? "bi-check2" : "bi-clipboard", onClick: copyCode }, copied ? "Copied" : "Copy")), /* @__PURE__ */ React.createElement("div", { style: {
      font: "600 18px var(--font-mono)",
      color: "var(--fg-1)",
      padding: "10px 12px",
      background: "var(--bg-0)",
      border: "1px solid var(--border-1)",
      borderRadius: 6,
      letterSpacing: "0.04em",
      textAlign: "center"
    } }, code.manualPairingCode || "\u2014")), code.fabrics && code.fabrics.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { font: "500 11.5px var(--font-sans)", color: "var(--fg-3)" } }, "Paired with"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } }, code.fabrics.map((f, i) => /* @__PURE__ */ React.createElement(
      Pill,
      {
        key: i,
        tone: f.label ? "neutral" : "warning",
        icon: f.label ? "bi-house-fill" : "bi-exclamation-circle-fill",
        title: `node ${f.nodeId}`
      },
      f.label || "Orphan (no label)"
    )))), code.accessories.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { font: "500 11.5px var(--font-sans)", color: "var(--fg-3)" } }, "Contains ", code.accessories.length, " accessor", code.accessories.length === 1 ? "y" : "ies"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } }, code.accessories.map((a, i) => /* @__PURE__ */ React.createElement(Pill, { key: i, tone: "neutral", icon: "bi-dot" }, a.displayName)))), /* @__PURE__ */ React.createElement(ResetPairingControl, { code, onChanged }));
  }
  function ResetPairingControl({ code, onChanged }) {
    const [open, setOpen] = useState(false);
    const [token, setToken] = useState("");
    const [working, setWorking] = useState(false);
    const armed = token.trim() === "RESET";
    const reset = async () => {
      setWorking(true);
      try {
        const result = await homebridge.request("/reset-pairing", {
          uniqueId: code.uniqueId,
          confirm: "RESET"
        });
        const summary = result.wiped?.length ? `Wiped ${result.wiped.join(", ")}.` : "Nothing to wipe \u2014 state was already clean.";
        homebridge.toast.success(`${summary} Now click Restart Homebridge.`);
        setOpen(false);
        setToken("");
        onChanged && onChanged();
      } catch (e) {
        homebridge.toast.error("Reset failed: " + (e.message || e));
      } finally {
        setWorking(false);
      }
    };
    if (!open) {
      return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "flex-end", marginTop: 4 } }, /* @__PURE__ */ React.createElement(Btn, { variant: "ghost", size: "sm", icon: "bi-eraser", onClick: () => setOpen(true) }, "Reset pairing\u2026"));
    }
    return /* @__PURE__ */ React.createElement("div", { style: {
      marginTop: 4,
      padding: 12,
      borderRadius: 8,
      background: "color-mix(in oklab, var(--warning-500) 12%, var(--bg-0))",
      border: "1px solid color-mix(in oklab, var(--warning-500) 35%, transparent)",
      display: "flex",
      flexDirection: "column",
      gap: 8
    } }, /* @__PURE__ */ React.createElement("div", { style: { font: "600 12.5px var(--font-sans)", color: "var(--fg-1)" } }, "Reset Matter pairing"), /* @__PURE__ */ React.createElement("div", { style: { font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-2)" } }, "Deletes the fabric records, commissioning code and operational credentials for this bridge. The plugin will regenerate fresh codes on the next Homebridge restart. Existing Apple Home tile may need to be removed and re-added \u2014 automations referencing it will break."), /* @__PURE__ */ React.createElement("div", { style: { font: "400 11.5px var(--font-sans)", color: "var(--fg-3)" } }, "Type ", /* @__PURE__ */ React.createElement("span", { style: { font: "600 11.5px var(--font-mono)", color: "var(--fg-1)" } }, "RESET"), " to enable."), /* @__PURE__ */ React.createElement(
      Input,
      {
        value: token,
        onChange: (e) => setToken(e.target.value),
        placeholder: "RESET",
        style: { fontFamily: "var(--font-mono)" }
      }
    ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "flex-end", gap: 8 } }, /* @__PURE__ */ React.createElement(Btn, { variant: "ghost", size: "sm", onClick: () => {
      setOpen(false);
      setToken("");
    } }, "Cancel"), /* @__PURE__ */ React.createElement(
      Btn,
      {
        variant: "danger",
        size: "sm",
        icon: "bi-eraser-fill",
        disabled: !armed,
        loading: working,
        onClick: reset
      },
      "Wipe fabric state"
    )));
  }
  const PROFILE_LABELS = {
    AUTO: { nl: "Automatisch", en: "Auto", icon: "bi-stars" },
    QUICK: { nl: "Snel", en: "Quick", icon: "bi-lightning" },
    QUIET: { nl: "Stil", en: "Quiet", icon: "bi-moon-stars" },
    LOW_POWER: { nl: "Energiebesparing", en: "Low Power", icon: "bi-battery-half" },
    DEEP_CLEAN: { nl: "Dieptereiniging", en: "Deep Clean", icon: "bi-water" }
  };
  const PROFILE_DESCRIPTIONS = {
    AUTO: "De robot kiest zelf de juiste zuigkracht, dweilstand en route op basis van vloer-type en vuilheid (smart mode aan). Geen handmatige sturing nodig \u2014 voor dagelijks gebruik.",
    QUICK: "Snelste pad door de woning. S-patroon zonder randen en deuropeningen mee te nemen. Standaard zuigkracht. Goed voor een snelle dagelijkse opfrisbeurt.",
    QUIET: "Maximaal stil \u2014 alleen zuigen (geen dweilen), zuigkracht op QUIET. Voor avond/nacht of als je thuiswerkt.",
    LOW_POWER: "Spaarstand. Quiet zuigen, drogere dweil, snelle route. Robot maakt minder herrie en de basis verbruikt minder energie.",
    DEEP_CLEAN: "Grondige beurt. Eerst zuigen, dan dweilen (sweep-then-mop) met dichte route die meer overlappende banen rijdt. Voor wekelijkse intensive reiniging."
  };
  const SUCTION_NAMES = ["Quiet", "Standard", "Turbo", "Max", "Max+"];
  const MOP_NAMES = ["Low (drier)", "Middle", "High (wetter)"];
  const EXTENT_NAMES = ["Normal (daily)", "Narrow (dense passes)", "Quick (S-pattern)"];
  const CTYPE_NAMES = ["Sweep only", "Mop only", "Sweep + mop", "Sweep then mop"];
  const PROFILE_DEFAULTS = {
    AUTO: { fanSuction: 1, mopLevel: 1, cleanExtent: 0, cleanType: 2, smartMode: true },
    QUICK: { fanSuction: 1, mopLevel: 1, cleanExtent: 2, cleanType: 2, smartMode: false },
    QUIET: { fanSuction: 0, mopLevel: 1, cleanExtent: 0, cleanType: 0, smartMode: false },
    LOW_POWER: { fanSuction: 0, mopLevel: 0, cleanExtent: 2, cleanType: 2, smartMode: false },
    DEEP_CLEAN: { fanSuction: 1, mopLevel: 1, cleanExtent: 1, cleanType: 3, smartMode: false }
  };
  const SUCTION_OPTS = SUCTION_NAMES.map((label, value) => ({ value, label }));
  const MOP_OPTS = MOP_NAMES.map((label, value) => ({ value, label }));
  const EXTENT_OPTS = EXTENT_NAMES.map((label, value) => ({ value, label }));
  const CTYPE_OPTS = CTYPE_NAMES.map((label, value) => ({ value, label }));
  const EDITABLE_PROFILES = ["QUICK", "QUIET", "LOW_POWER", "DEEP_CLEAN"];
  function TabProfiles() {
    const [cfg, setCfg] = useState(null);
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    useEffect(() => {
      (async () => {
        try {
          const arr = await homebridge.getPluginConfig();
          setCfg(arr[0] || {});
        } catch (e) {
          homebridge.toast.error("Could not load config: " + e.message);
          setCfg({});
        }
      })();
    }, []);
    const updateProfile = (profileKey, field, value) => {
      setCfg((prev) => {
        const overrides = { ...prev?.cleanProfiles || {} };
        const current = { ...overrides[profileKey] || {} };
        if (current[field] === value) {
          delete current[field];
        } else {
          current[field] = value;
        }
        if (Object.keys(current).length === 0) {
          delete overrides[profileKey];
        } else {
          overrides[profileKey] = current;
        }
        return { ...prev, cleanProfiles: overrides };
      });
      setDirty(true);
    };
    const save = async () => {
      setSaving(true);
      try {
        await homebridge.updatePluginConfig([cfg]);
        await homebridge.savePluginConfig();
        setDirty(false);
        homebridge.toast.success("Profielen opgeslagen. Restart Homebridge om de plugin de nieuwe profielen te laten gebruiken.");
      } catch (e) {
        homebridge.toast.error("Save failed: " + e.message);
      } finally {
        setSaving(false);
      }
    };
    const reset = async () => {
      try {
        const arr = await homebridge.getPluginConfig();
        setCfg(arr[0] || {});
        setDirty(false);
        homebridge.toast.info("Wijzigingen ongedaan.");
      } catch (e) {
        homebridge.toast.error("Reload failed: " + e.message);
      }
    };
    if (!cfg) return /* @__PURE__ */ React.createElement(EmptyState, { icon: "bi-hourglass-split", title: "Loading profiles\u2026" });
    return /* @__PURE__ */ React.createElement(
      Section,
      {
        title: "Cleaning profiles",
        hint: 'Wat de "Zuigkracht" dropdown in Apple Home doet \u2014 elke optie bundelt zuigkracht, dweilstand, routepatroon en werkmodus tot \xE9\xE9n keuze. Klik in Apple Home \u2192 Robovac tegel \u2192 Zuigkracht om te schakelen.',
        action: dirty && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement(Btn, { variant: "ghost", size: "sm", onClick: reset }, "Discard"), /* @__PURE__ */ React.createElement(Btn, { variant: "primary", size: "sm", icon: "bi-check2", loading: saving, onClick: save }, "Save"))
      },
      /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 12 } }, /* @__PURE__ */ React.createElement(ProfileCard, { profileKey: "AUTO", overrides: null, editable: false, onChange: () => {
      } }), EDITABLE_PROFILES.map((key) => /* @__PURE__ */ React.createElement(
        ProfileCard,
        {
          key,
          profileKey: key,
          overrides: cfg.cleanProfiles?.[key],
          editable: true,
          onChange: (field, value) => updateProfile(key, field, value)
        }
      ))),
      /* @__PURE__ */ React.createElement("div", { style: {
        marginTop: 14,
        padding: 12,
        background: "var(--bg-1)",
        border: "1px solid var(--border-1)",
        borderRadius: 10,
        font: "400 12.5px var(--font-sans)",
        color: "var(--fg-3)"
      } }, /* @__PURE__ */ React.createElement("strong", { style: { color: "var(--fg-2)" } }, "Hoe te gebruiken:"), ' open Apple Home \u2192 tik op de Robovac tegel \u2192 onderaan "Zuigkracht" \u2014 kies \xE9\xE9n van deze 5 profielen. Bij ', /* @__PURE__ */ React.createElement("em", null, "Automatisch"), " beslist de robot zelf; bij de andere vier neem je expliciete controle. De keuze geldt voor de volgende clean.", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("strong", { style: { color: "var(--fg-2)" } }, "Overrides resetten:"), " klik op de huidige (paarse) optie om die override te verwijderen \u2014 het profiel valt dan terug op de fabrieksdefault.", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("br", null), "Wijzigingen worden pas actief na een Homebridge restart.")
    );
  }
  function ProfileCard({ profileKey, overrides, editable, onChange }) {
    const defaults = PROFILE_DEFAULTS[profileKey];
    const meta = PROFILE_LABELS[profileKey];
    const eff = (field) => overrides?.[field] !== void 0 ? overrides[field] : defaults[field];
    const overridden = (field) => overrides?.[field] !== void 0;
    return /* @__PURE__ */ React.createElement("div", { style: {
      background: "var(--bg-1)",
      border: "1px solid var(--border-1)",
      borderRadius: 10,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 12
    } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: {
      width: 32,
      height: 32,
      borderRadius: 8,
      background: "color-mix(in oklab, var(--brand-500) 18%, var(--bg-2))",
      color: "var(--brand-300)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0
    } }, /* @__PURE__ */ React.createElement("i", { className: "bi " + meta.icon })), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { font: "600 14px var(--font-sans)", color: "var(--fg-1)" } }, meta.nl, " ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--fg-4)", fontWeight: 400 } }, "\xB7 ", meta.en)), /* @__PURE__ */ React.createElement("div", { style: { font: "400 11px var(--font-mono)", color: "var(--fg-4)" } }, profileKey)), defaults.smartMode && /* @__PURE__ */ React.createElement(Pill, { tone: "brand", icon: "bi-stars" }, "Smart mode"), overrides && Object.keys(overrides).length > 0 && /* @__PURE__ */ React.createElement(Pill, { tone: "warning", icon: "bi-pencil-fill" }, "Modified")), /* @__PURE__ */ React.createElement("div", { style: { font: "400 12.5px/1.45 var(--font-sans)", color: "var(--fg-2)" } }, PROFILE_DESCRIPTIONS[profileKey]), /* @__PURE__ */ React.createElement(Divider, null), !editable ? (
      // AUTO read-only — smart mode supersedes manual params.
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, /* @__PURE__ */ React.createElement(ParamRow, { label: "Zuigkracht", value: "Auto (smart mode)", icon: "bi-fan" }), /* @__PURE__ */ React.createElement(ParamRow, { label: "Dweilstand", value: "Auto (smart mode)", icon: "bi-droplet" }), /* @__PURE__ */ React.createElement(ParamRow, { label: "Route", value: "Auto (smart mode)", icon: "bi-bezier" }), /* @__PURE__ */ React.createElement(ParamRow, { label: "Werkmodus", value: "Auto (smart mode)", icon: "bi-arrow-repeat" }))
    ) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, /* @__PURE__ */ React.createElement(
      ParamEditor,
      {
        label: "Zuigkracht",
        icon: "bi-fan",
        options: SUCTION_OPTS,
        value: eff("fanSuction"),
        modified: overridden("fanSuction"),
        onChange: (v) => onChange("fanSuction", v)
      }
    ), /* @__PURE__ */ React.createElement(
      ParamEditor,
      {
        label: "Dweilstand",
        icon: "bi-droplet",
        options: MOP_OPTS,
        value: eff("mopLevel"),
        modified: overridden("mopLevel"),
        onChange: (v) => onChange("mopLevel", v)
      }
    ), /* @__PURE__ */ React.createElement(
      ParamEditor,
      {
        label: "Route",
        icon: "bi-bezier",
        options: EXTENT_OPTS,
        value: eff("cleanExtent"),
        modified: overridden("cleanExtent"),
        onChange: (v) => onChange("cleanExtent", v)
      }
    ), /* @__PURE__ */ React.createElement(
      ParamEditor,
      {
        label: "Werkmodus",
        icon: "bi-arrow-repeat",
        options: CTYPE_OPTS,
        value: eff("cleanType"),
        modified: overridden("cleanType"),
        onChange: (v) => onChange("cleanType", v)
      }
    )));
  }
  function ParamRow({ label, value, icon }) {
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 6, font: "500 11.5px var(--font-sans)", color: "var(--fg-3)" } }, /* @__PURE__ */ React.createElement("i", { className: "bi " + icon, style: { color: "var(--fg-4)", fontSize: 11 } }), label), /* @__PURE__ */ React.createElement("span", { style: { font: "500 12px var(--font-mono)", color: "var(--fg-1)" } }, value));
  }
  function ParamEditor({ label, icon, options, value, modified, onChange }) {
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 6, font: "500 11.5px var(--font-sans)", color: "var(--fg-3)" } }, /* @__PURE__ */ React.createElement("i", { className: "bi " + icon, style: { color: "var(--fg-4)", fontSize: 11 } }), label, modified && /* @__PURE__ */ React.createElement("i", { className: "bi bi-asterisk", style: { color: "var(--warning-fg)", fontSize: 9 }, title: "Overridden" }))), /* @__PURE__ */ React.createElement(Segmented, { options, value, onChange }));
  }
  Object.assign(window, { TabDevice, TabSettings, TabDiagnostics, TabMatter, TabProfiles });
})();
