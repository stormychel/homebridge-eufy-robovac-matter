/* eslint-disable */
const { useState, useEffect, useMemo } = React;

// ============================================================================
// Helpers
// ============================================================================

function formatRelative(ts) {
  if (!ts) return 'never';
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60)    return Math.round(diff) + ' s ago';
  if (diff < 3600)  return Math.round(diff / 60) + ' min ago';
  if (diff < 86400) return Math.round(diff / 3600) + ' h ago';
  return Math.round(diff / 86400) + ' d ago';
}

function formatArea(sqMeters) {
  // CleanStatistics.clean_area arrives from DPS 167 already in m² (verified
  // against jeppesens/eufy-clean which renders the raw value with "m²" unit).
  // The earlier `(value / 10000)` divider was a leftover from a misread of
  // the proto comment ("dm²" was an assumption, the device ships m²).
  if (!sqMeters && sqMeters !== 0) return '—';
  if (sqMeters === 0) return '—';
  return sqMeters + ' m²';
}

function formatDuration(seconds) {
  if (!seconds) return '—';
  if (seconds < 60)   return seconds + ' s';
  if (seconds < 3600) return Math.round(seconds / 60) + ' min';
  return (seconds / 3600).toFixed(1) + ' h';
}

const SUCTION_LABEL = { 1: 'Quiet', 2: 'Standard', 3: 'Turbo', 4: 'Max', 5: 'Max+' };
const MODE_LABEL    = { AUTO: 'Auto', VACUUM_ONLY: 'Vacuum', MOP_ONLY: 'Mop', VACUUM_AND_MOP: 'Vacuum + mop' };

// ============================================================================
// TabDevice
// ============================================================================

function TabDevice({ state, mutate }) {
  const power = state.power || {};
  const water = state.water || { clean: null, dirty: null };
  const err = state.activity?.activeError;
  const session = state.activity?.cleanSession || {};
  const lifetime = state.activity?.lifetime || {};

  // The device only ships `single` (last session area/duration) while a clean
  // is active or just-completed; after the dock clears it back to zero we'd
  // otherwise show '—'. Fall back to the lifetime AVERAGE so the stats stay
  // populated. The label flips to "Avg session" so the number isn't misleading.
  const hasActiveSession = (session.areaSqCm ?? 0) > 0 || (session.durationSeconds ?? 0) > 0;
  const sessionLabel  = hasActiveSession ? 'Last clean'  : 'Avg session';
  const durationLabel = hasActiveSession ? 'Duration'    : 'Avg duration';
  const sessionArea     = hasActiveSession
    ? session.areaSqCm
    : (lifetime.cleans ? Math.round(lifetime.areaSqCm / lifetime.cleans) : undefined);
  const sessionDuration = hasActiveSession
    ? session.durationSeconds
    : (lifetime.cleans ? Math.round(lifetime.durationSeconds / lifetime.cleans) : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {err && (
        <div style={{
          display: 'flex', gap: 12, padding: '14px 16px',
          background: 'color-mix(in oklab, var(--danger-500) 18%, var(--bg-1))',
          border: '1px solid color-mix(in oklab, var(--danger-500) 40%, transparent)',
          borderRadius: 10, alignItems: 'flex-start',
        }}>
          <i className="bi bi-exclamation-triangle-fill" style={{ color: 'var(--danger-fg)', fontSize: 20, marginTop: 1 }}/>
          <div style={{ flex: 1 }}>
            <div style={{ font: '600 13.5px var(--font-sans)', color: 'var(--danger-fg)' }}>{err.code} — {err.label}</div>
            <div style={{ font: '400 12.5px var(--font-sans)', color: 'var(--fg-2)', marginTop: 2 }}>{err.detail}</div>
            <div style={{ font: '400 11.5px var(--font-sans)', color: 'var(--fg-4)', marginTop: 4 }}>
              Reported via DPS 177 · {err.ageMs ? formatRelative(Date.now() - err.ageMs) : ''}
            </div>
          </div>
          <Btn variant="danger" size="sm" onClick={() => mutate(s => ({...s, activity: { ...s.activity, activeError: null }}))}>Clear</Btn>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <Stat label="Battery" value={(power.batteryPercent ?? '—') + '%'} icon={power.charging ? 'bi-lightning-charge-fill' : null} accent="var(--success-fg)"/>
        <Stat label={sessionLabel} value={formatArea(sessionArea)}/>
        <Stat label={durationLabel} value={formatDuration(sessionDuration)}/>
        <Stat label="Cleans total" value={(lifetime.cleans ?? '—').toString()}/>
      </div>

      <Card title="Station activity" action={<span style={{font:'400 11.5px var(--font-sans)',color:'var(--fg-4)'}}>DPS 173</span>}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(state.station?.activity || []).length === 0 && (
            <span style={{ font: '400 12px var(--font-sans)', color: 'var(--fg-4)' }}>Station idle.</span>
          )}
          {(state.station?.activity || []).includes('mop-washing')        && <Pill tone="info" icon="bi-droplet-fill">Mop washing</Pill>}
          {(state.station?.activity || []).includes('mop-drying')         && <Pill tone="info" icon="bi-wind">Mop drying</Pill>}
          {(state.station?.activity || []).includes('dust-collecting')    && <Pill tone="info" icon="bi-arrow-down-circle">Dust collecting</Pill>}
          {(state.station?.activity || []).includes('filling-clean-water')  && <Pill tone="neutral" icon="bi-droplet">Filling clean water</Pill>}
          {(state.station?.activity || []).includes('draining-waste-water') && <Pill tone="neutral" icon="bi-droplet-half">Draining waste</Pill>}
        </div>
        <div style={{ font: '400 11.5px var(--font-sans)', color: 'var(--fg-4)', marginTop: 10 }}>
          HomeKit reports "Idle" while these run — this is the only place the user sees them.
        </div>
      </Card>

      <Card title="Water tank" action={<span style={{font:'400 11.5px var(--font-sans)',color:'var(--fg-4)'}}>clean water reservoir</span>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
          {[
            { key: 'clean', label: 'Clean water', pct: water.clean, icon: 'bi-droplet', hint: 'Top up at the dock when low' },
          ].map(t => {
            const pct = t.pct ?? 0;
            const critical = pct < 20;
            const fg = critical ? 'var(--danger-fg)' : 'var(--info-fg)';
            return (
              <div key={t.key} style={{ display: 'flex', gap: 12, padding: 12, background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 10 }}>
                <i className={'bi ' + t.icon} style={{ color: fg, fontSize: 20 }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ font: '500 12px var(--font-sans)', color: 'var(--fg-3)' }}>{t.label}</span>
                    <span style={{ font: '600 16px var(--font-sans)', color: 'var(--fg-1)', fontVariantNumeric: 'tabular-nums' }}>
                      {t.pct == null ? '—' : t.pct + '%'}
                    </span>
                  </div>
                  <div style={{ marginTop: 6, height: 6, background: 'var(--bg-0)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pct + '%', background: fg, borderRadius: 999, transition: 'width 220ms var(--ease)' }}/>
                  </div>
                  <div style={{ font: '400 11px var(--font-sans)', color: 'var(--fg-4)', marginTop: 4 }}>{t.hint}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <DoctorCard/>

      <MqttCard mqtt={state.mqtt}/>
    </div>
  );
}

// DoctorCard — calls /doctor and renders the pass/warn/fail rows. The endpoint
// is read-only and side-effect free, so we can re-fetch on a button click
// without race risk.
function DoctorCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const result = await homebridge.request('/doctor');
      setData(result);
    } catch (e) {
      homebridge.toast.error('Doctor failed: ' + e.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { run(); }, []);

  const toneFor = (status) => {
    if (status === 'pass') return { fg: 'var(--success-fg)', icon: 'bi-check-circle-fill' };
    if (status === 'warn') return { fg: 'var(--warning-fg)', icon: 'bi-exclamation-circle-fill' };
    if (status === 'fail') return { fg: 'var(--danger-fg)',  icon: 'bi-x-circle-fill' };
    return                       { fg: 'var(--fg-4)',         icon: 'bi-dash-circle' };
  };

  return (
    <Card title="Doctor"
      action={<Btn variant="ghost" size="sm" icon="bi-arrow-repeat" loading={loading} onClick={run}>Re-run</Btn>}>
      {!data ? (
        <div style={{ font: '400 12.5px var(--font-sans)', color: 'var(--fg-4)' }}>Running checks…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.checks.map((c) => {
            const t = toneFor(c.status);
            return (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '8px 10px', background: 'var(--bg-2)',
                border: '1px solid var(--border-1)', borderRadius: 8,
              }}>
                <i className={'bi ' + t.icon} style={{ color: t.fg, fontSize: 16, marginTop: 1 }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: '600 12.5px var(--font-sans)', color: 'var(--fg-1)' }}>{c.label}</div>
                  <div style={{ font: '400 12px var(--font-sans)', color: 'var(--fg-3)', marginTop: 2 }}>{c.detail}</div>
                  {c.hint && (
                    <div style={{ font: '400 11.5px var(--font-sans)', color: 'var(--fg-4)', marginTop: 4, fontStyle: 'italic' }}>
                      {c.hint}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function MqttCard({ mqtt }) {
  // Read-only status — there is no "Reconnect" button. The plugin's own
  // exponential backoff (in EufyMqttClient.scheduleReconnect) handles
  // recovery; a user-triggered reconnect would race with that and break the
  // 30-second backoff window. Surface only what's observable.
  const connected = mqtt?.connected;
  return (
    <Card title="MQTT connection">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 10, height: 10, borderRadius: '50%',
            background: connected ? 'var(--success-fg)' : 'var(--danger-fg)',
            boxShadow: '0 0 0 3px color-mix(in oklab, ' + (connected ? 'var(--success-500)' : 'var(--danger-500)') + ' 30%, transparent)',
          }}/>
          <div style={{ font: '600 14px var(--font-sans)', color: 'var(--fg-1)' }}>
            {connected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
        <span style={{ font: '400 11.5px var(--font-mono)', color: 'var(--fg-4)' }}>tls://mqtt.eufylife.com:8883</span>
      </div>
      <div style={{ display: 'flex', gap: 18, marginTop: 12, font: '400 12px var(--font-sans)', color: 'var(--fg-3)', flexWrap: 'wrap' }}>
        <Metric label="attempts" value={mqtt?.attempts ?? 0}/>
        <Metric label="backoff" value={(mqtt?.backoffMs ?? 0) + ' ms'}/>
        <Metric label="last msg" value={mqtt?.lastMsgAt ? formatRelative(mqtt.lastMsgAt) : '—'}/>
        <Metric label="DPS keys" value={mqtt?.dpsKeyCount ?? 0}/>
      </div>
    </Card>
  );
}

const Metric = ({ label, value }) => (
  <span><span style={{color:'var(--fg-4)'}}>{label}</span> <span style={{color:'var(--fg-1)',fontWeight:600,marginLeft:4}}>{value}</span></span>
);

// ============================================================================
// Removed in v5.0: TabConsumables, TabScenes, TabRooms.
//
// Those tabs presented Reset / Run-Scene / Toggle-Room buttons that wrote to
// a `~/.homebridge-eufy-robovac-matter.triggers/` directory the plugin never
// watched — pure placeholder UI that misled users into thinking they were
// changing robot state. Per the v5.0 audit: half-working UI is more confusing
// than no UI. If these features come back, they need:
//   - A working trigger-file watcher in DeviceSession or platform
//   - OR direct Matter-cluster actions (preferred for room toggle)
//   - OR per-button DPS commands routed through the existing handlers
// Until then, equivalent functionality is exposed via Matter:
//   - Empty Bin → Matter switch sibling accessory (Apple Home / EVE)
//   - Profiles  → Matter RvcCleanMode (Apple Home Suction Power dropdown)
//   - Rooms     → Matter ServiceArea
// Consumables wear hours arrive on DPS 168; surface them read-only in the
// Diagnostics tab if needed, but don't fake reset buttons.

// ============================================================================
// TabSettings — reads/writes via homebridge.getPluginConfig + updatePluginConfig
// ============================================================================

function TabSettings({ state }) {
  const [cfg, setCfg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { (async () => {
    try {
      const arr = await homebridge.getPluginConfig();
      setCfg(arr[0] || {});
    } catch (e) { homebridge.toast.error('Could not load config: ' + e.message); }
  })(); }, []);

  if (!cfg) return <EmptyState icon="bi-sliders" title="Loading settings…"/>;

  const set = (patch) => { setCfg(c => ({ ...c, ...patch })); setDirty(true); };

  const save = async () => {
    setSaving(true);
    try {
      await homebridge.updatePluginConfig([cfg]);
      await homebridge.savePluginConfig();
      setDirty(false);
      homebridge.toast.success('Saved. Restart Homebridge for changes to take effect.');
    } catch (e) {
      homebridge.toast.error('Save failed: ' + e.message);
    } finally { setSaving(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card title="Eufy account">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Email" hint="Same as your Eufy mobile app login.">
            <Input value={cfg.username || ''} onChange={e => set({ username: e.target.value })}/>
          </Field>
          <Field label="Password">
            <Input type="password" value={cfg.password || ''} onChange={e => set({ password: e.target.value })}/>
          </Field>
        </div>
      </Card>

      <Card title="Defaults">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Default cleaning mode">
            <Segmented value={cfg.defaultMode || 'AUTO'} onChange={v => set({ defaultMode: v })}
              options={[
                { value: 'AUTO', label: 'Auto' },
                { value: 'VACUUM_ONLY', label: 'Vacuum' },
                { value: 'MOP_ONLY', label: 'Mop' },
                { value: 'VACUUM_AND_MOP', label: 'Both' },
              ]}/>
          </Field>
          <Field label="Default suction level">
            <Segmented value={cfg.defaultSuction || 2} onChange={v => set({ defaultSuction: v })}
              options={[
                { value: 1, label: 'Quiet' },
                { value: 2, label: 'Standard' },
                { value: 3, label: 'Turbo' },
                { value: 4, label: 'Max' },
              ]}/>
          </Field>
        </div>
      </Card>

      <Card title="Advanced" action={<span style={{font:'400 11.5px var(--font-sans)',color:'var(--fg-4)'}}>Change only if asked to.</span>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <ToggleRow name="Disable Matter state push"
            hint="Keep command support, stop pushing state to Matter (troubleshooting only)."
            on={!!cfg.disableMatterStatePush}
            onChange={v => set({ disableMatterStatePush: v })}/>
          <Divider/>
          <Field label="MQTT reconnect max delay" hint="Maximum exponential backoff delay between reconnect attempts.">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Input
                value={cfg.mqttReconnectMaxDelay ?? 30000}
                onChange={e => set({ mqttReconnectMaxDelay: parseInt(e.target.value, 10) || 0 })}
                style={{ flex: 1, fontFamily: 'var(--font-mono)' }}/>
              <span style={{ font: '400 12px var(--font-sans)', color: 'var(--fg-4)' }}>ms</span>
            </div>
          </Field>
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={{ font: '400 11.5px var(--font-sans)', color: 'var(--fg-4)' }}>
          {dirty ? 'Unsaved changes' : 'All changes saved'}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="ghost" onClick={() => window.location.reload()}>Discard</Btn>
          <Btn variant="primary" icon="bi-check2" loading={saving} disabled={!dirty} onClick={save}>Save changes</Btn>
        </div>
      </div>
    </div>
  );
}

const ToggleRow = ({ name, hint, on, onChange }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', gap: 16 }}>
    <div style={{ flex: 1 }}>
      <div style={{ font: '500 13px var(--font-sans)', color: 'var(--fg-1)' }}>{name}</div>
      <div style={{ font: '400 11.5px var(--font-sans)', color: 'var(--fg-4)', marginTop: 2 }}>{hint}</div>
    </div>
    <Toggle on={on} onClick={() => onChange(!on)}/>
  </div>
);

// ============================================================================
// TabDiagnostics
// ============================================================================

function TabDiagnostics({ state }) {
  const [diag, setDiag] = useState({ log: [], dps: {} });
  useEffect(() => { (async () => {
    try {
      const d = await homebridge.request('/diagnostics');
      setDiag(d);
    } catch (e) { /* nothing live */ }
  })(); }, [state]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card title="Recent MQTT activity" action={<Btn variant="ghost" size="sm" icon="bi-clipboard" onClick={() => {
        navigator.clipboard?.writeText(diag.log.map(l => `[${l.t}] ${l.level.toUpperCase()} ${l.msg}`).join('\n'));
        homebridge.toast.info('Copied to clipboard.');
      }}>Copy</Btn>}>
        <pre style={{
          margin: 0, font: '12px/1.55 var(--font-mono)', color: 'var(--fg-2)',
          background: 'var(--bg-0)', border: '1px solid var(--border-1)',
          padding: 12, borderRadius: 8, overflow: 'auto', maxHeight: 220, whiteSpace: 'pre-wrap',
        }}>
{diag.log.length === 0
  ? '— no log lines yet —'
  : diag.log.map(l => `[${l.t}] ${l.msg}`).join('\n')}
        </pre>
      </Card>

      <Card title="Raw DPS snapshot">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, font: '12.5px/1.45 var(--font-mono)', color: 'var(--fg-2)' }}>
          {Object.entries(diag.dps).length === 0 && (
            <span style={{ font: '400 12px var(--font-sans)', color: 'var(--fg-4)' }}>No DPS data yet.</span>
          )}
          {Object.entries(diag.dps).map(([k, info]) => (
            <div key={k} style={{ display: 'flex', gap: 10, padding: '6px 10px', background: 'var(--bg-0)', borderRadius: 6, border: '1px solid var(--border-1)' }}>
              <span style={{ color: 'var(--brand-300)', minWidth: 32 }}>{k}</span>
              <span style={{ color: 'var(--fg-3)', minWidth: 130 }}>{info.name}</span>
              <span style={{ color: 'var(--fg-1)' }}>{info.value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// TabMatter — Matter QR codes for every bridge / standalone accessory
// ============================================================================

function TabMatter() {
  const [codes, setCodes] = useState(null);
  const [error, setError] = useState(null);

  const reload = async () => {
    setCodes(null); setError(null);
    try {
      const res = await homebridge.request('/matter-codes');
      setCodes(res.codes ?? []);
    } catch (e) {
      setError(e.message || String(e));
    }
  };

  useEffect(() => { reload(); }, []);

  if (error) return <EmptyState icon="bi-exclamation-triangle" title="Could not load Matter codes" hint={error}/>;
  if (codes === null) return <EmptyState icon="bi-hourglass-split" title="Loading Matter codes…"/>;
  if (codes.length === 0) {
    return <EmptyState icon="bi-qr-code"
      title="No Matter bridges yet"
      hint="Matter codes appear after Homebridge starts and the plugin publishes its first accessory."/>;
  }

  return (
    <Section
      title="Matter pairing"
      hint="Scan or enter each code in Apple Home → Add Accessory. Robot vacuums are published as standalone Matter devices (each has its own code); other accessories share a bridge code."
      action={<Btn variant="ghost" size="sm" icon="bi-arrow-repeat" onClick={reload}>Refresh</Btn>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
        {codes.map((c) => <MatterCodeCard key={c.uniqueId} code={c} onChanged={reload}/>)}
      </div>
    </Section>
  );
}

function MatterCodeCard({ code, onChanged }) {
  const [copied, setCopied] = useState(false);
  const copyCode = () => {
    const text = (code.manualPairingCode || '').replace(/-/g, '');
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };

  const tone = code.hasOrphanFabric ? 'warning' : (code.commissioned ? 'success' : 'brand');
  const statusIcon = code.hasOrphanFabric
    ? 'bi-exclamation-triangle-fill'
    : (code.commissioned ? 'bi-check-circle-fill' : 'bi-arrow-down-circle');
  const statusText = code.commissioned
    ? `Paired · ${code.fabricCount} fabric${code.fabricCount === 1 ? '' : 's'}`
    : 'Ready to pair';

  return (
    <div style={{
      background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 10,
      padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: '600 14px var(--font-sans)', color: 'var(--fg-1)' }}>{code.displayName}</div>
          <div style={{ font: '400 11px var(--font-mono)', color: 'var(--fg-4)', marginTop: 2 }}>
            {code.kind === 'standalone' ? 'Standalone Matter device' : 'Matter bridge'} · {code.uniqueId}
          </div>
        </div>
        <Pill tone={tone} icon={statusIcon}>{statusText}</Pill>
      </div>

      {code.qrDataUrl ? (
        <div style={{
          display: 'flex', justifyContent: 'center',
          background: '#fff', padding: 12, borderRadius: 8,
        }}>
          <img src={code.qrDataUrl} alt={`QR code for ${code.displayName}`} style={{ display: 'block', width: 200, height: 200 }}/>
        </div>
      ) : (
        <div style={{ font: '400 11.5px var(--font-mono)', color: 'var(--fg-4)', wordBreak: 'break-all',
          padding: 8, background: 'var(--bg-0)', borderRadius: 6 }}>
          QR payload: {code.qrPayload}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span style={{ font: '500 11.5px var(--font-sans)', color: 'var(--fg-3)' }}>Manual pairing code</span>
          <Btn variant="ghost" size="sm" icon={copied ? 'bi-check2' : 'bi-clipboard'} onClick={copyCode}>
            {copied ? 'Copied' : 'Copy'}
          </Btn>
        </div>
        <div style={{
          font: '600 18px var(--font-mono)', color: 'var(--fg-1)',
          padding: '10px 12px', background: 'var(--bg-0)',
          border: '1px solid var(--border-1)', borderRadius: 6,
          letterSpacing: '0.04em', textAlign: 'center',
        }}>
          {code.manualPairingCode || '—'}
        </div>
      </div>

      {code.fabrics && code.fabrics.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ font: '500 11.5px var(--font-sans)', color: 'var(--fg-3)' }}>
            Paired with
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {code.fabrics.map((f, i) => (
              <Pill
                key={i}
                tone={f.label ? 'neutral' : 'warning'}
                icon={f.label ? 'bi-house-fill' : 'bi-exclamation-circle-fill'}
                title={`node ${f.nodeId}`}>
                {f.label || 'Orphan (no label)'}
              </Pill>
            ))}
          </div>
        </div>
      )}

      {code.accessories.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ font: '500 11.5px var(--font-sans)', color: 'var(--fg-3)' }}>
            Contains {code.accessories.length} accessor{code.accessories.length === 1 ? 'y' : 'ies'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {code.accessories.map((a, i) => (
              <Pill key={i} tone="neutral" icon="bi-dot">{a.displayName}</Pill>
            ))}
          </div>
        </div>
      )}

      <ResetPairingControl code={code} onChanged={onChanged}/>
    </div>
  );
}

// ResetPairingControl — collapsed by default; type "RESET" to enable the
// destructive button. Wipes fabric state on the server, then nudges the user
// to click Homebridge's own "Restart" so the plugin regenerates fresh codes.
function ResetPairingControl({ code, onChanged }) {
  const [open, setOpen]         = useState(false);
  const [token, setToken]       = useState('');
  const [working, setWorking]   = useState(false);
  const armed = token.trim() === 'RESET';

  const reset = async () => {
    setWorking(true);
    try {
      const result = await homebridge.request('/reset-pairing', {
        uniqueId: code.uniqueId,
        confirm:  'RESET',
      });
      const summary = result.wiped?.length
        ? `Wiped ${result.wiped.join(', ')}.`
        : 'Nothing to wipe — state was already clean.';
      homebridge.toast.success(`${summary} Now click Restart Homebridge.`);
      setOpen(false);
      setToken('');
      onChanged && onChanged();
    } catch (e) {
      homebridge.toast.error('Reset failed: ' + (e.message || e));
    } finally {
      setWorking(false);
    }
  };

  if (!open) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
        <Btn variant="ghost" size="sm" icon="bi-eraser" onClick={() => setOpen(true)}>
          Reset pairing…
        </Btn>
      </div>
    );
  }

  return (
    <div style={{
      marginTop: 4, padding: 12, borderRadius: 8,
      background: 'color-mix(in oklab, var(--warning-500) 12%, var(--bg-0))',
      border: '1px solid color-mix(in oklab, var(--warning-500) 35%, transparent)',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ font: '600 12.5px var(--font-sans)', color: 'var(--fg-1)' }}>
        Reset Matter pairing
      </div>
      <div style={{ font: '400 12px/1.5 var(--font-sans)', color: 'var(--fg-2)' }}>
        Deletes the fabric records, commissioning code and operational credentials for
        this bridge. The plugin will regenerate fresh codes on the next Homebridge restart.
        Existing Apple Home tile may need to be removed and re-added — automations referencing
        it will break.
      </div>
      <div style={{ font: '400 11.5px var(--font-sans)', color: 'var(--fg-3)' }}>
        Type <span style={{ font: '600 11.5px var(--font-mono)', color: 'var(--fg-1)' }}>RESET</span> to enable.
      </div>
      <Input
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="RESET"
        style={{ fontFamily: 'var(--font-mono)' }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Btn variant="ghost" size="sm" onClick={() => { setOpen(false); setToken(''); }}>
          Cancel
        </Btn>
        <Btn variant="danger" size="sm" icon="bi-eraser-fill"
          disabled={!armed} loading={working} onClick={reset}>
          Wipe fabric state
        </Btn>
      </div>
    </div>
  );
}

// ============================================================================
// TabProfiles — documentation + editor for the 5 Apple-Home "Suction Power" profiles
// ============================================================================

// Keep these in sync with src/eufy/commands.ts PROFILE_PARAMS.
const PROFILE_LABELS = {
  AUTO:        { nl: 'Automatisch',     en: 'Auto',       icon: 'bi-stars' },
  QUICK:       { nl: 'Snel',            en: 'Quick',      icon: 'bi-lightning' },
  QUIET:       { nl: 'Stil',            en: 'Quiet',      icon: 'bi-moon-stars' },
  LOW_POWER:   { nl: 'Energiebesparing', en: 'Low Power', icon: 'bi-battery-half' },
  DEEP_CLEAN:  { nl: 'Dieptereiniging', en: 'Deep Clean', icon: 'bi-water' },
};

const PROFILE_DESCRIPTIONS = {
  AUTO: 'De robot kiest zelf de juiste zuigkracht, dweilstand en route op basis van vloer-type en vuilheid (smart mode aan). Geen handmatige sturing nodig — voor dagelijks gebruik.',
  QUICK: 'Snelste pad door de woning. S-patroon zonder randen en deuropeningen mee te nemen. Standaard zuigkracht. Goed voor een snelle dagelijkse opfrisbeurt.',
  QUIET: 'Maximaal stil — alleen zuigen (geen dweilen), zuigkracht op QUIET. Voor avond/nacht of als je thuiswerkt.',
  LOW_POWER: 'Spaarstand. Quiet zuigen, drogere dweil, snelle route. Robot maakt minder herrie en de basis verbruikt minder energie.',
  DEEP_CLEAN: 'Grondige beurt. Eerst zuigen, dan dweilen (sweep-then-mop) met dichte route die meer overlappende banen rijdt. Voor wekelijkse intensive reiniging.',
};

const SUCTION_NAMES = ['Quiet', 'Standard', 'Turbo', 'Max', 'Max+'];
const MOP_NAMES     = ['Low (drier)', 'Middle', 'High (wetter)'];
const EXTENT_NAMES  = ['Normal (daily)', 'Narrow (dense passes)', 'Quick (S-pattern)'];
const CTYPE_NAMES   = ['Sweep only', 'Mop only', 'Sweep + mop', 'Sweep then mop'];

// Default params — mirrors PROFILE_PARAMS in commands.ts.
const PROFILE_DEFAULTS = {
  AUTO:       { fanSuction: 1, mopLevel: 1, cleanExtent: 0, cleanType: 2, smartMode: true  },
  QUICK:      { fanSuction: 1, mopLevel: 1, cleanExtent: 2, cleanType: 2, smartMode: false },
  QUIET:      { fanSuction: 0, mopLevel: 1, cleanExtent: 0, cleanType: 0, smartMode: false },
  LOW_POWER:  { fanSuction: 0, mopLevel: 0, cleanExtent: 2, cleanType: 2, smartMode: false },
  DEEP_CLEAN: { fanSuction: 1, mopLevel: 1, cleanExtent: 1, cleanType: 3, smartMode: false },
};

// Map enum index ↔ Segmented `value` for each param.
const SUCTION_OPTS = SUCTION_NAMES.map((label, value) => ({ value, label }));
const MOP_OPTS     = MOP_NAMES.map((label, value)     => ({ value, label }));
const EXTENT_OPTS  = EXTENT_NAMES.map((label, value)  => ({ value, label }));
const CTYPE_OPTS   = CTYPE_NAMES.map((label, value)   => ({ value, label }));

// AUTO can't be overridden — its smartMode flag supersedes the params.
const EDITABLE_PROFILES = ['QUICK', 'QUIET', 'LOW_POWER', 'DEEP_CLEAN'];

function TabProfiles() {
  const [cfg, setCfg]       = useState(null);
  const [dirty, setDirty]   = useState(false);
  const [saving, setSaving] = useState(false);

  // Load plugin config on mount.
  useEffect(() => { (async () => {
    try {
      const arr = await homebridge.getPluginConfig();
      setCfg(arr[0] || {});
    } catch (e) {
      homebridge.toast.error('Could not load config: ' + e.message);
      setCfg({});
    }
  })(); }, []);

  const updateProfile = (profileKey, field, value) => {
    setCfg(prev => {
      const overrides = { ...(prev?.cleanProfiles || {}) };
      const current   = { ...(overrides[profileKey] || {}) };
      if (current[field] === value) {
        // Toggling to the same value → clear override (back to default).
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
      homebridge.toast.success('Profielen opgeslagen. Restart Homebridge om de plugin de nieuwe profielen te laten gebruiken.');
    } catch (e) {
      homebridge.toast.error('Save failed: ' + e.message);
    } finally { setSaving(false); }
  };

  const reset = async () => {
    try {
      const arr = await homebridge.getPluginConfig();
      setCfg(arr[0] || {});
      setDirty(false);
      homebridge.toast.info('Wijzigingen ongedaan.');
    } catch (e) {
      homebridge.toast.error('Reload failed: ' + e.message);
    }
  };

  if (!cfg) return <EmptyState icon="bi-hourglass-split" title="Loading profiles…"/>;

  return (
    <Section
      title="Cleaning profiles"
      hint='Wat de "Zuigkracht" dropdown in Apple Home doet — elke optie bundelt zuigkracht, dweilstand, routepatroon en werkmodus tot één keuze. Klik in Apple Home → Robovac tegel → Zuigkracht om te schakelen.'
      action={dirty && (
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="ghost" size="sm" onClick={reset}>Discard</Btn>
          <Btn variant="primary" size="sm" icon="bi-check2" loading={saving} onClick={save}>Save</Btn>
        </div>
      )}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 12 }}>
        <ProfileCard profileKey="AUTO" overrides={null} editable={false} onChange={() => {}}/>
        {EDITABLE_PROFILES.map((key) => (
          <ProfileCard
            key={key}
            profileKey={key}
            overrides={cfg.cleanProfiles?.[key]}
            editable={true}
            onChange={(field, value) => updateProfile(key, field, value)}
          />
        ))}
      </div>

      <div style={{
        marginTop: 14, padding: 12, background: 'var(--bg-1)', border: '1px solid var(--border-1)',
        borderRadius: 10, font: '400 12.5px var(--font-sans)', color: 'var(--fg-3)',
      }}>
        <strong style={{ color: 'var(--fg-2)' }}>Hoe te gebruiken:</strong> open Apple Home → tik op de Robovac tegel → onderaan "Zuigkracht" — kies één van deze 5 profielen. Bij <em>Automatisch</em> beslist de robot zelf; bij de andere vier neem je expliciete controle. De keuze geldt voor de volgende clean.
        <br/><br/>
        <strong style={{ color: 'var(--fg-2)' }}>Overrides resetten:</strong> klik op de huidige (paarse) optie om die override te verwijderen — het profiel valt dan terug op de fabrieksdefault.
        <br/><br/>
        Wijzigingen worden pas actief na een Homebridge restart.
      </div>
    </Section>
  );
}

function ProfileCard({ profileKey, overrides, editable, onChange }) {
  const defaults = PROFILE_DEFAULTS[profileKey];
  const meta = PROFILE_LABELS[profileKey];
  // Effective value = override if set, otherwise default.
  const eff = (field) => overrides?.[field] !== undefined ? overrides[field] : defaults[field];
  const overridden = (field) => overrides?.[field] !== undefined;

  return (
    <div style={{
      background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 10,
      padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'color-mix(in oklab, var(--brand-500) 18%, var(--bg-2))',
          color: 'var(--brand-300)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <i className={'bi ' + meta.icon}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: '600 14px var(--font-sans)', color: 'var(--fg-1)' }}>
            {meta.nl} <span style={{ color: 'var(--fg-4)', fontWeight: 400 }}>· {meta.en}</span>
          </div>
          <div style={{ font: '400 11px var(--font-mono)', color: 'var(--fg-4)' }}>{profileKey}</div>
        </div>
        {defaults.smartMode && <Pill tone="brand" icon="bi-stars">Smart mode</Pill>}
        {overrides && Object.keys(overrides).length > 0 && (
          <Pill tone="warning" icon="bi-pencil-fill">Modified</Pill>
        )}
      </div>

      <div style={{ font: '400 12.5px/1.45 var(--font-sans)', color: 'var(--fg-2)' }}>
        {PROFILE_DESCRIPTIONS[profileKey]}
      </div>

      <Divider/>

      {!editable ? (
        // AUTO read-only — smart mode supersedes manual params.
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ParamRow label="Zuigkracht" value="Auto (smart mode)" icon="bi-fan"/>
          <ParamRow label="Dweilstand" value="Auto (smart mode)" icon="bi-droplet"/>
          <ParamRow label="Route"      value="Auto (smart mode)" icon="bi-bezier"/>
          <ParamRow label="Werkmodus"  value="Auto (smart mode)" icon="bi-arrow-repeat"/>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ParamEditor label="Zuigkracht" icon="bi-fan"
            options={SUCTION_OPTS} value={eff('fanSuction')} modified={overridden('fanSuction')}
            onChange={(v) => onChange('fanSuction', v)}/>
          <ParamEditor label="Dweilstand" icon="bi-droplet"
            options={MOP_OPTS} value={eff('mopLevel')} modified={overridden('mopLevel')}
            onChange={(v) => onChange('mopLevel', v)}/>
          <ParamEditor label="Route" icon="bi-bezier"
            options={EXTENT_OPTS} value={eff('cleanExtent')} modified={overridden('cleanExtent')}
            onChange={(v) => onChange('cleanExtent', v)}/>
          <ParamEditor label="Werkmodus" icon="bi-arrow-repeat"
            options={CTYPE_OPTS} value={eff('cleanType')} modified={overridden('cleanType')}
            onChange={(v) => onChange('cleanType', v)}/>
        </div>
      )}
    </div>
  );
}

function ParamRow({ label, value, icon }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: '500 11.5px var(--font-sans)', color: 'var(--fg-3)' }}>
        <i className={'bi ' + icon} style={{ color: 'var(--fg-4)', fontSize: 11 }}/>
        {label}
      </span>
      <span style={{ font: '500 12px var(--font-mono)', color: 'var(--fg-1)' }}>{value}</span>
    </div>
  );
}

function ParamEditor({ label, icon, options, value, modified, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: '500 11.5px var(--font-sans)', color: 'var(--fg-3)' }}>
          <i className={'bi ' + icon} style={{ color: 'var(--fg-4)', fontSize: 11 }}/>
          {label}
          {modified && <i className="bi bi-asterisk" style={{ color: 'var(--warning-fg)', fontSize: 9 }} title="Overridden"/>}
        </span>
      </div>
      <Segmented options={options} value={value} onChange={onChange}/>
    </div>
  );
}

Object.assign(window, { TabDevice, TabSettings, TabDiagnostics, TabMatter, TabProfiles });
