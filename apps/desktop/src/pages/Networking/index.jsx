import React, { useMemo, useState } from 'react'
import { useApp } from '../../state/store.jsx'
import {
  selectReachability,
  selectDevices,
  selectDbTargets,
  selectDefaultDbTargetId,
  selectHasConnectedDevice,
  selectDbDefaultOk,
} from '../../state/selectors.js'
import '../../styles/networking.css'

function ipToInt(ip) {
  const parts = (ip || '').split('.').map(n => parseInt(n, 10))
  if (parts.length !== 4 || parts.some(n => Number.isNaN(n))) return 0
  return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3]
}

function cidrToMask(cidr) {
  const n = Math.max(0, Math.min(32, +cidr || 0))
  return n === 0 ? 0 : (0xFFFFFFFF << (32 - n)) >>> 0
}

function Dot({ status }) {
  const color = status === 'connected' || status === 'ok' ? '#22a06b'
    : status === 'degraded' ? '#b37feb'
    : status === 'connecting' ? '#f59e0b'
    : status === 'fail' ? '#ef4444' : '#9ca3af'
  return <span className="dot" style={{ backgroundColor: color }} aria-hidden />
}

export function Networking({ onProceed }) {
  const { state, dispatch } = useApp()
  const reach = selectReachability(state)
  const devices = selectDevices(state)
  const targets = selectDbTargets(state)
  const defaultTargetId = selectDefaultDbTargetId(state)
  const hasConnected = selectHasConnectedDevice(state)
  const defaultOk = selectDbDefaultOk(state)

  const [left, setLeft] = useState('reachability') // 'reachability' | 'connect' | 'devices' | 'databases'
  const [selectedDeviceId, setSelectedDeviceId] = useState(null)

  // Reachability helpers
  const adapter = useMemo(() => reach.adapters.find(a => a.id === reach.adapterId) || reach.adapters[0], [reach])
  const subnetHint = useMemo(() => {
    const tip = (target) => {
      const ipInt = ipToInt(target)
      const aInt = ipToInt(adapter?.ip)
      const mask = cidrToMask(adapter?.cidr)
      if (!ipInt || !aInt || !mask) return ''
      return (ipInt & mask) === (aInt & mask) ? 'Same subnet' : 'Different subnet'
    }
    return tip(reach.target)
  }, [adapter, reach.target])

  const runPing = async () => {
    // Simulated ping metrics
    const start = performance.now()
    const delay = 300 + Math.random() * 500
    await new Promise(r => setTimeout(r, delay))
    const success = Math.random() > 0.2
    const samples = Array.from({ length: 5 }, () => Math.round(10 + Math.random() * 40))
    const min = Math.min(...samples)
    const max = Math.max(...samples)
    const avg = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length)
    const lossPct = success ? 0 : 100
    dispatch({ type: 'NET_SET_PING_RESULT', result: { success, lossPct, min, avg, max, samples, timeMs: Math.round(performance.now() - start) } })
  }

  const runPortTests = async (ports) => {
    const results = []
    for (const p of ports) {
      // Simulate quick TCP handshake timing
      const t = Math.round(20 + Math.random() * 80)
      const r = Math.random()
      const status = r > 0.7 ? 'timeout' : r > 0.4 ? 'closed' : 'open'
      results.push({ port: p, status, timeMs: t })
      await new Promise(r => setTimeout(r, 50))
    }
    dispatch({ type: 'NET_SET_PORT_RESULTS', results })
  }

  // Connect (Add Device) local state
  const [adding, setAdding] = useState(false)
  const [proto, setProto] = useState('modbus') // 'modbus' | 'opcua'
  const [fb, setFb] = useState({ host: '', port: 502, unitId: 1, mode: 'network', com: 'COM3', baud: 9600, parity: 'N', stop: 1, timeoutMs: 1000, retries: 1, endian: 'be' })
  const [ua, setUa] = useState({ endpoint: '', auth: 'anon', user: '', pass: '' })
  const [probe, setProbe] = useState(null) // { ok, value, latency }
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [saveName, setSaveName] = useState('Device-1')

  const doTest = async () => {
    setProbe(null)
    const latency = Math.round(30 + Math.random() * 120)
    await new Promise(r => setTimeout(r, latency))
    const ok = Math.random() > 0.2
    setProbe({ ok, value: ok ? 'Test OK' : 'Test failed', latency })
  }

  const doConnect = async () => {
    setConnecting(true)
    const latency = Math.round(40 + Math.random() * 180)
    await new Promise(r => setTimeout(r, latency))
    setConnecting(false)
    const ok = Math.random() > 0.15
    setConnected(ok)
  }

  const doSave = () => {
    if (!connected) return
    const id = 'dev_' + Math.random().toString(36).slice(2, 8)
    const params = proto === 'modbus' ? fb : ua
    dispatch({ type: 'DEV_ADD', device: { id, name: saveName, protocol: proto, status: 'connected', latencyMs: 0, lastError: null, params } })
    // Reset
    setAdding(false); setConnected(false); setProbe(null)
  }

  const quickTestDevice = async (id) => {
    dispatch({ type: 'DEV_UPDATE_STATUS', id, patch: { status: 'connecting' } })
    const latency = Math.round(25 + Math.random() * 100)
    await new Promise(r => setTimeout(r, latency))
    const ok = Math.random() > 0.1
    dispatch({ type: 'DEV_UPDATE_STATUS', id, patch: { status: ok ? 'connected' : 'degraded', latencyMs: latency, lastError: ok ? null : 'Intermittent response' } })
  }

  const toggleConn = async (d) => {
    if (d.status === 'connected' || d.status === 'degraded') {
      dispatch({ type: 'DEV_UPDATE_STATUS', id: d.id, patch: { status: 'disconnected' } })
    } else {
      dispatch({ type: 'DEV_UPDATE_STATUS', id: d.id, patch: { status: 'connecting' } })
      const latency = Math.round(30 + Math.random() * 150)
      await new Promise(r => setTimeout(r, latency))
      dispatch({ type: 'DEV_UPDATE_STATUS', id: d.id, patch: { status: 'connected', latencyMs: latency, lastError: null } })
    }
  }

  // Databases
  const [dbForm, setDbForm] = useState({ provider: 'sqlite', conn: 'file:plc_logger.db' })
  const addTarget = () => {
    const id = 'db_' + Math.random().toString(36).slice(2, 8)
    dispatch({ type: 'DB_ADD_TARGET', target: { id, provider: dbForm.provider, conn: dbForm.conn, status: 'untested', lastMsg: '' } })
  }
  const testTarget = async (t) => {
    const time = Math.round(20 + Math.random() * 100)
    await new Promise(r => setTimeout(r, time))
    const ok = t.provider === 'sqlite' ? true : Math.random() > 0.2
    dispatch({ type: 'DB_UPDATE_TARGET', id: t.id, patch: { status: ok ? 'ok' : 'fail', lastMsg: ok ? 'Test OK' : 'Failed to connect' } })
  }
  const setDefault = (id) => dispatch({ type: 'DB_SET_DEFAULT', id })

  // Left rail item component
  const LeftItem = ({ id, title, subtitle, badge, active, onClick }) => (
    <button className={`rail-item ${active ? 'active' : ''}`} onClick={onClick} aria-current={active ? 'true' : 'false'}>
      <div className="rail-title">{title}</div>
      {subtitle && <div className="rail-sub">{subtitle}</div>}
      {badge}
    </button>
  )

  return (
    <div className="networking">
      <aside className="rail" aria-label="Networking sections">
        <LeftItem id="reachability" title="Reachability" subtitle={reach.target || 'Check network & ports'} active={left==='reachability'} onClick={()=>setLeft('reachability')} badge={reach.lastPing ? <Dot status={reach.lastPing.success ? 'ok' : 'fail'} /> : null} />
        <LeftItem id="connect" title="Connect" subtitle="Add Device" active={left==='connect'} onClick={()=>setLeft('connect')} />
        <LeftItem id="devices" title="Saved Devices" subtitle={`${devices.length} saved`} active={left==='devices'} onClick={()=>setLeft('devices')} badge={hasConnected ? <Dot status="connected" /> : null} />
        <LeftItem id="databases" title="Databases" subtitle={`${targets.length} targets`} active={left==='databases'} onClick={()=>setLeft('databases')} badge={defaultOk ? <Dot status="ok" /> : null} />
      </aside>

      <main className="main" aria-live="polite">
        {left === 'reachability' && (
          <section>
            <h3>Reachability</h3>
            <div className="row">
              <label>Adapter</label>
              <select value={reach.adapterId} onChange={e=>dispatch({ type: 'NET_SET_ADAPTER', id: e.target.value })}>
                {reach.adapters.map(a => (
                  <option key={a.id} value={a.id}>{a.label} 
                    ({a.ip}/{a.cidr})
                  </option>
                ))}
              </select>
            </div>
            <div className="row">
              <label>Target address</label>
              <input value={reach.target} onChange={e=>dispatch({ type: 'NET_SET_TARGET', target: e.target.value })} placeholder="IP or host" />
              <span className="hint">{subnetHint}</span>
            </div>
            <div className="row">
              <button onClick={runPing}>Ping</button>
              <button onClick={()=>runPortTests([502, 4840, 80, 443])}>Test common ports</button>
            </div>
            {reach.lastPing && (
              <div className="card">
                <div><strong>Ping:</strong> {reach.lastPing.success ? 'OK' : 'Failed'} | loss {reach.lastPing.lossPct}% | min {reach.lastPing.min}ms avg {reach.lastPing.avg}ms max {reach.lastPing.max}ms</div>
                <div className="samples">{reach.lastPing.samples.map((s,i)=>(<span key={i} style={{height: Math.max(4, Math.min(40, s)), display:'inline-block', width:6, background:'#cfe3ff', marginRight:2}} />))}</div>
              </div>
            )}
            {reach.portTests?.length > 0 && (
              <div className="card">
                <strong>Ports:</strong>
                <div className="ports">
                  {reach.portTests.map(r => (
                    <div key={r.port} className="port-pill">
                      <Dot status={r.status === 'open' ? 'ok' : r.status === 'timeout' ? 'degraded' : 'fail'} />
                      <span> {r.port} • {r.status} • {r.timeMs}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {left === 'connect' && (
          <section>
            <h3>Connect</h3>
            {!adding && (
              <button onClick={()=>{ setAdding(true); setConnected(false); setProbe(null) }}>Add Device</button>
            )}
            {adding && (
              <div className="card">
                <div className="row">
                  <label>Protocol</label>
                  <select value={proto} onChange={e=>setProto(e.target.value)}>
                    <option value="modbus">Modbus</option>
                    <option value="opcua">OPC UA</option>
                  </select>
                </div>
                {proto === 'modbus' ? (
                  <>
                    <div className="grid">
                      <div className="row"><label>Address</label><input value={fb.host} onChange={e=>setFb({ ...fb, host: e.target.value })} /></div>
                      <div className="row"><label>Port</label><input type="number" value={fb.port} onChange={e=>setFb({ ...fb, port: Number(e.target.value) })} /></div>
                      <div className="row"><label>Unit ID</label><input type="number" value={fb.unitId} onChange={e=>setFb({ ...fb, unitId: Number(e.target.value) })} /></div>
                      <div className="row"><label>Mode</label>
                        <select value={fb.mode} onChange={e=>setFb({ ...fb, mode: e.target.value })}>
                          <option value="network">Network</option>
                          <option value="serial">Serial</option>
                        </select>
                      </div>
                      {fb.mode === 'serial' && (
                        <>
                          <div className="row"><label>COM</label><input value={fb.com} onChange={e=>setFb({ ...fb, com: e.target.value })} /></div>
                          <div className="row"><label>Baud</label><input type="number" value={fb.baud} onChange={e=>setFb({ ...fb, baud: Number(e.target.value) })} /></div>
                          <div className="row"><label>Parity</label><input value={fb.parity} onChange={e=>setFb({ ...fb, parity: e.target.value })} /></div>
                          <div className="row"><label>Stop bits</label><input type="number" value={fb.stop} onChange={e=>setFb({ ...fb, stop: Number(e.target.value) })} /></div>
                        </>
                      )}
                      <div className="row"><label>Timeout (ms)</label><input type="number" value={fb.timeoutMs} onChange={e=>setFb({ ...fb, timeoutMs: Number(e.target.value) })} /></div>
                      <div className="row"><label>Retries</label><input type="number" value={fb.retries} onChange={e=>setFb({ ...fb, retries: Number(e.target.value) })} /></div>
                    </div>
                    <details className="adv"><summary>Advanced</summary>
                      <div className="row"><label>Endianness</label>
                        <select value={fb.endian} onChange={e=>setFb({ ...fb, endian: e.target.value })}>
                          <option value="be">Big-endian</option>
                          <option value="le">Little-endian</option>
                        </select>
                      </div>
                    </details>
                  </>
                ) : (
                  <>
                    <div className="grid">
                      <div className="row"><label>Endpoint</label><input value={ua.endpoint} onChange={e=>setUa({ ...ua, endpoint: e.target.value })} /></div>
                      <div className="row"><label>Auth</label>
                        <select value={ua.auth} onChange={e=>setUa({ ...ua, auth: e.target.value })}>
                          <option value="anon">Anonymous</option>
                          <option value="user">User/Password</option>
                        </select>
                      </div>
                      {ua.auth === 'user' && (
                        <>
                          <div className="row"><label>User</label><input value={ua.user} onChange={e=>setUa({ ...ua, user: e.target.value })} /></div>
                          <div className="row"><label>Password</label><input type="password" value={ua.pass} onChange={e=>setUa({ ...ua, pass: e.target.value })} /></div>
                        </>
                      )}
                    </div>
                  </>
                )}
                <div className="row">
                  <button onClick={doTest}>Test</button>
                  <button onClick={doConnect} disabled={connecting || connected}> {connecting ? 'Connecting…' : connected ? 'Connected' : 'Connect'} </button>
                  <button onClick={()=>{ setAdding(false); setConnected(false); setProbe(null) }}>Cancel</button>
                </div>
                {probe && (
                  <div className="card">{probe.ok ? 'Test OK' : 'Test failed'} • {probe.latency}ms</div>
                )}
                {connected && (
                  <div className="row">
                    <label>Device name</label>
                    <input value={saveName} onChange={e=>setSaveName(e.target.value)} />
                    <button onClick={doSave}>Save Device</button>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {left === 'devices' && (
          <section>
            <h3>Saved Devices</h3>
            {devices.length === 0 && <div>No devices saved yet.</div>}
            {devices.length > 0 && (
              <div className="table">
                {devices.map(d => (
                  <div key={d.id} className={`row line ${selectedDeviceId===d.id ? 'sel':''}`} onClick={()=>setSelectedDeviceId(d.id)}>
                    <div className="cell name"><Dot status={d.status} /> {d.name}</div>
                    <div className="cell proto">{d.protocol}</div>
                    <div className="cell lat">{d.latencyMs ? `${d.latencyMs}ms` : '—'}</div>
                    <div className="cell act">
                      <button onClick={(e)=>{ e.stopPropagation(); toggleConn(d) }}>{(d.status==='connected'||d.status==='degraded')?'Disconnect':'Connect'}</button>
                      <button onClick={(e)=>{ e.stopPropagation(); quickTestDevice(d.id) }}>Quick Test</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {selectedDeviceId && (
              <div className="card" style={{ marginTop: 12 }}>
                <strong>Device details</strong>
                <div>Latency: {devices.find(d=>d.id===selectedDeviceId)?.latencyMs ?? '—'} ms</div>
                <div>Status: {devices.find(d=>d.id===selectedDeviceId)?.status}</div>
                {devices.find(d=>d.id===selectedDeviceId)?.lastError && (
                  <div style={{ color: '#ef4444' }}>Last error: {devices.find(d=>d.id===selectedDeviceId)?.lastError}</div>
                )}
              </div>
            )}
          </section>
        )}

        {left === 'databases' && (
          <section>
            <h3>Databases</h3>
            <div className="grid">
              <div className="row"><label>Provider</label>
                <select value={dbForm.provider} onChange={e=>setDbForm({ ...dbForm, provider: e.target.value })}>
                  <option value="sqlite">SQLite</option>
                  <option value="postgres">Postgres</option>
                  <option value="sqlserver">SQL Server</option>
                  <option value="mysql">MySQL</option>
                </select>
              </div>
              <div className="row"><label>Connection</label>
                <input value={dbForm.conn} onChange={e=>setDbForm({ ...dbForm, conn: e.target.value })} placeholder="connection string or file path" />
              </div>
              <div className="row"><button onClick={addTarget}>Add Target</button></div>
            </div>
            <div className="table" style={{ marginTop: 12 }}>
              {targets.map(t => (
                <div key={t.id} className="row line">
                  <div className="cell name"><Dot status={t.status === 'ok' ? 'ok' : t.status === 'fail' ? 'fail' : 'connecting'} /> {t.provider} • {t.conn}</div>
                  <div className="cell act">
                    <button onClick={()=>testTarget(t)}>Test</button>
                    <button disabled={t.status!=='ok'} onClick={()=>setDefault(t.id)}>{defaultTargetId===t.id?'Default':'Set Default'}</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="gate">
          <div className="checks">
            <div><Dot status={hasConnected ? 'ok' : 'fail'} /> At least one device is connected</div>
            <div><Dot status={defaultOk ? 'ok' : 'fail'} /> A database target is test‑OK and set as default</div>
          </div>
          {hasConnected && defaultOk ? (
            <button onClick={()=>onProceed && onProceed()}>Proceed to next</button>
          ) : (
            <div className="hint">Complete the unmet items above to proceed.</div>
          )}
        </div>
      </main>
    </div>
  )
}
