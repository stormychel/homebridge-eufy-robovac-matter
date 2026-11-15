/* eslint-disable */
const { useState, useEffect, useCallback } = React;

// v5.0: Removed consumables/scenes/rooms tabs — those presented Reset / Run /
// Toggle buttons that quietly no-op'd (the underlying trigger-file IPC was
// never wired up on the platform side). See tabs.jsx for the migration note.
const TABS = [
  { id: 'device',       label: 'Device',       icon: 'bi-cpu',             render: TabDevice },
  { id: 'profiles',     label: 'Profiles',     icon: 'bi-stars',           render: TabProfiles },
  { id: 'matter',       label: 'Matter',       icon: 'bi-qr-code',         render: TabMatter },
  { id: 'settings',     label: 'Settings',     icon: 'bi-sliders',         render: TabSettings },
  { id: 'diagnostics',  label: 'Diagnostics',  icon: 'bi-terminal',        render: TabDiagnostics },
];

function Header({ theme, setTheme, mqtt, deviceName }) {
  const online = !!mqtt?.connected;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 0 8px' }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10, background: 'var(--bg-1)',
        border: '1px solid var(--border-1)', color: 'var(--brand-300)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9.25"/>
          <circle cx="12" cy="12" r="2"/>
          <path d="M 4.6 9.5 A 9 9 0 0 1 19.4 9.5"/>
          <path d="M 4 16 l -1.6 .6 M 4 16 l -1.4 -1 M 4 16 l 0 -1.6"/>
          <path d="M 20 16 l 1.6 .6 M 20 16 l 1.4 -1 M 20 16 l 0 -1.6"/>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: '600 18px var(--font-sans)', color: 'var(--fg-1)' }}>Eufy RoboVac · Matter</div>
        <div style={{ font: '400 12px var(--font-mono)', color: 'var(--fg-4)', marginTop: 2 }}>homebridge-eufy-robovac-matter</div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Pill tone={online ? 'success' : 'danger'} icon="bi-circle-fill">
          {online ? 'MQTT online' : 'MQTT offline'}
        </Pill>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{
          width: 32, height: 32, borderRadius: 8, background: 'transparent',
          border: '1px solid var(--border-1)', color: 'var(--fg-3)',
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className={'bi ' + (theme === 'dark' ? 'bi-sun' : 'bi-moon')}/>
        </button>
      </div>
    </div>
  );
}

function DeviceHeader({ state }) {
  const d = state.device || {};
  const p = state.power || {};
  const a = state.activity || {};
  const station = state.station?.activity?.[0];
  const stationLabel = {
    'mop-washing':         { icon: 'bi-droplet-fill', label: 'Mop washing', color: 'var(--info-fg)' },
    'mop-drying':          { icon: 'bi-wind',         label: 'Mop drying',  color: 'var(--info-fg)' },
    'dust-collecting':     { icon: 'bi-arrow-down-circle', label: 'Dust collecting', color: 'var(--info-fg)' },
    'filling-clean-water': { icon: 'bi-droplet',      label: 'Filling water', color: 'var(--fg-3)' },
    'draining-waste-water':{ icon: 'bi-droplet-half', label: 'Draining waste', color: 'var(--fg-3)' },
  }[station];

  return (
    <div style={{
      display: 'flex', gap: 14, padding: 16, marginTop: 12,
      background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 10,
    }}>
      <div style={{
        width: 56, height: 56, background: 'var(--bg-0)', border: '1px solid var(--border-1)',
        borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--brand-300)', flexShrink: 0,
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9.25"/>
          <circle cx="12" cy="12" r="2"/>
          <path d="M 4.6 9.5 A 9 9 0 0 1 19.4 9.5"/>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ font: '600 15px var(--font-sans)', color: 'var(--fg-1)' }}>{d.name || 'Unknown device'}</div>
          <Pill tone={p.docked ? 'success' : 'brand'} icon={p.charging ? 'bi-lightning-charge-fill' : 'bi-battery-half'}>
            {(p.batteryPercent ?? '—') + '%'}
          </Pill>
        </div>
        <div style={{ font: '400 11.5px var(--font-sans)', color: 'var(--fg-4)', marginTop: 4 }}>
          {[d.model, 'fw ' + (d.firmware || '—'), d.lastSyncAt ? 'last sync ' + formatRelativeShort(d.lastSyncAt) : null].filter(Boolean).join(' · ')}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 10, font: '500 12px var(--font-sans)', color: 'var(--fg-2)', flexWrap: 'wrap' }}>
          <span><i className="bi bi-house-door" style={{ color: 'var(--fg-3)', marginRight: 5 }}/>{p.docked ? 'Docked' : 'Away'}</span>
          {stationLabel && (
            <span><i className={'bi ' + stationLabel.icon} style={{ color: stationLabel.color, marginRight: 5 }}/>{stationLabel.label}</span>
          )}
          <span><i className="bi bi-stars" style={{ color: 'var(--fg-3)', marginRight: 5 }}/>
            {(a.cleanMode && a.cleanMode.replace('_', ' ').toLowerCase()) || 'idle'}
          </span>
        </div>
      </div>
    </div>
  );
}

function formatRelativeShort(ts) {
  if (!ts) return '—';
  const d = (Date.now() - ts) / 1000;
  if (d < 60) return Math.round(d) + ' s ago';
  if (d < 3600) return Math.round(d / 60) + ' min ago';
  return Math.round(d / 3600) + ' h ago';
}

function App() {
  const [theme, setTheme] = useState('dark');
  const [active, setActive] = useState('device');
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);

  // Imperative state mutation that bypasses an extra round-trip.
  const mutate = useCallback((fn) => setState(prev => fn(prev || {})), []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await homebridge.request('/status');
        if (!cancelled) setState(snap);
      } catch (e) {
        if (!cancelled) setError(e.message || String(e));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Live updates — events arrive as MessageEvents with the snapshot in `.data`.
  useEffect(() => {
    const onState = (event) => {
      const patch = event && event.data !== undefined ? event.data : event;
      setState(prev => {
        if (!prev) return patch;
        return { ...prev, ...patch };
      });
    };
    const onMqtt = (event) => {
      const mqtt = event && event.data !== undefined ? event.data : event;
      setState(prev => prev ? { ...prev, mqtt } : prev);
    };
    homebridge.addEventListener('state-update', onState);
    homebridge.addEventListener('mqtt-status', onMqtt);
    return () => {
      homebridge.removeEventListener('state-update', onState);
      homebridge.removeEventListener('mqtt-status', onMqtt);
    };
  }, []);

  if (error) {
    return (
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px' }}>
        <EmptyState
          icon="bi-plug"
          title="Plugin UI server not reachable"
          hint={error}
        />
      </div>
    );
  }

  if (!state) {
    return (
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px' }}>
        <EmptyState icon="bi-hourglass-split" title="Loading…" hint="Reading state snapshot from the plugin."/>
      </div>
    );
  }

  const Current = TABS.find(t => t.id === active).render;
  const liveData = state?.live !== false;

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 48px' }}>
      <Header theme={theme} setTheme={setTheme} mqtt={state.mqtt} deviceName={state.device?.name}/>
      {liveData ? (
        <>
          <DeviceHeader state={state}/>
          <div style={{
            display: 'flex', gap: 4, padding: 4, marginTop: 16,
            background: 'var(--bg-0)', border: '1px solid var(--border-1)',
            borderRadius: 8, overflowX: 'auto',
          }}>
            {TABS.map(t => {
              const a = t.id === active;
              return (
                <button key={t.id} onClick={() => setActive(t.id)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: a ? 'var(--bg-3)' : 'transparent',
                  color: a ? 'var(--fg-1)' : 'var(--fg-3)',
                  border: 'none', padding: '7px 14px', borderRadius: 6,
                  font: `${a ? 600 : 500} 12.5px var(--font-sans)`, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                  <i className={'bi ' + t.icon}/>{t.label}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 16 }}>
            <Current state={state} mutate={mutate}/>
          </div>
        </>
      ) : (
        <div style={{ marginTop: 16 }}>
          <Card title="No live data yet" action={<Btn variant="ghost" size="sm" icon="bi-arrow-repeat" onClick={() => window.location.reload()}>Retry</Btn>}>
            <div style={{ font: '400 13px var(--font-sans)', color: 'var(--fg-2)' }}>
              The plugin hasn't written a state snapshot yet. This is normal when:
            </div>
            <ul style={{ margin: '8px 0 0 16px', font: '400 12.5px/1.6 var(--font-sans)', color: 'var(--fg-3)' }}>
              <li>You just installed the plugin and Homebridge hasn't started yet</li>
              <li>The Eufy credentials in <code style={{ font: '12px var(--font-mono)', color: 'var(--fg-2)' }}>Settings</code> are missing or wrong</li>
              <li>The robot is offline in the Eufy app</li>
            </ul>
            <div style={{ font: '400 12px var(--font-sans)', color: 'var(--fg-4)', marginTop: 10 }}>
              You can still fill in <strong>Settings</strong> below — the UI will reload once data arrives.
            </div>
          </Card>
          <div style={{ marginTop: 16 }}>
            <TabSettings state={state}/>
          </div>
        </div>
      )}

      <div style={{
        marginTop: 32, padding: '14px 0 0', borderTop: '1px solid var(--border-1)',
        display: 'flex', justifyContent: 'space-between',
        font: '400 11.5px var(--font-sans)', color: 'var(--fg-4)', flexWrap: 'wrap', gap: 8,
      }}>
        <span>homebridge-eufy-robovac-matter · plugin config UI</span>
        <span>Apache 2.0 · <a href="https://github.com/SyntaxThaw/homebridge-matter-eufy-mqtt" target="_blank" rel="noopener">source</a></span>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
