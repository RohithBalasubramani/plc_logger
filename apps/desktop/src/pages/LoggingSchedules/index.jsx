import React, { useMemo, useState } from 'react'
import { useApp } from '../../state/store.jsx'
import {
  selectJobs, selectTables, selectSchemas, selectDevices,
  selectBuffers, selectSystem, selectDbDefaultOk,
  selectAnyJobEnabled, selectAnyJobHasMappedScope, selectLoggingReady,
  selectTableMappingStatus,
} from '../../state/selectors.js'
import '../../styles/logging.css'

function Dot({ color = '#9ca3af' }) { return <span className="dot" style={{ backgroundColor: color }} aria-hidden /> }
const statusColor = (s) => s==='running' ? '#22a06b' : s==='paused' ? '#f59e0b' : s==='degraded'? '#b37feb' : '#9ca3af'

export function LoggingSchedules() {
  const { state, dispatch } = useApp()
  const jobs = selectJobs(state)
  const tables = selectTables(state)
  const schemas = selectSchemas(state)
  const devices = selectDevices(state)
  const buffers = selectBuffers(state)
  const system = selectSystem(state)
  const dbOk = selectDbDefaultOk(state)
  const jobEnabled = selectAnyJobEnabled(state)
  const jobHasMapped = selectAnyJobHasMappedScope(state)
  const ready = selectLoggingReady(state)

  const [left, setLeft] = useState('jobs') // jobs | alarms | buffers | history | utilities
  const [selJobId, setSelJobId] = useState(null)

  const selJob = useMemo(() => jobs.find(j => j.id === selJobId) || jobs[0], [jobs, selJobId])

  // ------ Job creation/edit (compact wizard) ------
  const [creating, setCreating] = useState(false)
  const [jType, setJType] = useState('continuous')
  const [jName, setJName] = useState('New Job')
  const [jTables, setJTables] = useState([])
  const [jColumns, setJColumns] = useState('all')
  const [jInterval, setJInterval] = useState(1000)
  const [jEnabled, setJEnabled] = useState(true)
  const [jBatchCount, setJBatchCount] = useState(1)
  const [jBatchMs, setJBatchMs] = useState(0)
  const [jCpu, setJCpu] = useState('balanced')
  const saveJob = () => {
    const id = 'job_' + Math.random().toString(36).slice(2,8)
    dispatch({ type: 'JOB_ADD', job: { id, name: jName, type: jType, tables: jTables, columns: jColumns, intervalMs: jInterval, enabled: jEnabled, status: jEnabled ? 'paused' : 'stopped', batching: { count: jBatchCount||undefined, ms: jBatchMs||undefined }, cpuBudget: jCpu, metrics: {} } })
    setCreating(false); setSelJobId(id); setLeft('jobs')
  }

  // ------ Job controls & metrics (simulated) ------
  const startJob = (id) => { dispatch({ type: 'JOB_SET_STATUS', id, status: 'running' }) }
  const pauseJob = (id) => { dispatch({ type: 'JOB_SET_STATUS', id, status: 'paused' }) }
  const stopJob = (id) => { dispatch({ type: 'JOB_SET_STATUS', id, status: 'stopped' }) }
  const dryRun = async (id) => {
    const readRate = Math.round(5 + Math.random()*40)
    const writeRate = Math.round(readRate * 0.9)
    const qDepth = Math.round(Math.random()*10)
    const errPct = Math.round(Math.random()*5)
    const p50 = Math.round(10 + Math.random()*30)
    const p95 = Math.round(p50 + 20 + Math.random()*40)
    dispatch({ type: 'JOB_SET_METRICS', id, metrics: { readRate, writeRate, qDepth, errPct, p50, p95, lastRun: new Date().toISOString(), errors1h: Math.round(Math.random()*3) } })
  }
  const backfillOnce = (id) => {
    dispatch({ type: 'JOB_SET_METRICS', id, metrics: { ...(selJob?.metrics||{}), lastRun: new Date().toISOString() } })
  }

  // ------ Alarms (stubs) ------
  const [alarmName, setAlarmName] = useState('New Alarm')
  const [alarmField, setAlarmField] = useState('')
  const addAlarm = () => {
    const id = 'alm_' + Math.random().toString(36).slice(2,8)
    dispatch({ type: 'ALARM_ADD_DEF', def: { id, name: alarmName, field: alarmField } })
  }

  return (
    <div className="logging">
      <div className="layout">
        <aside className="rail" aria-label="Logging sections">
          <button className={`rail-item ${left==='jobs'?'active':''}`} onClick={()=>setLeft('jobs')}>
            <div className="rail-title">Jobs</div>
            <div className="rail-sub">{jobs.length} total</div>
          </button>
          <button className={`rail-item ${left==='alarms'?'active':''}`} onClick={()=>setLeft('alarms')}>
            <div className="rail-title">Alarms</div>
            <div className="rail-sub">define, arm, acknowledge</div>
          </button>
          <button className={`rail-item ${left==='buffers'?'active':''}`} onClick={()=>setLeft('buffers')}>
            <div className="rail-title">Buffers & Health</div>
            <div className="rail-sub">queues, CPU/IO budget</div>
          </button>
          <button className={`rail-item ${left==='history'?'active':''}`} onClick={()=>setLeft('history')}>
            <div className="rail-title">History & Reports</div>
            <div className="rail-sub">runs, errors</div>
          </button>
          <button className={`rail-item ${left==='utilities'?'active':''}`} onClick={()=>setLeft('utilities')}>
            <div className="rail-title">Utilities</div>
            <div className="rail-sub">templates, validation</div>
          </button>
        </aside>

        <main className="main" aria-live="polite">
          {left === 'jobs' && (
            <section>
              <h3>Jobs</h3>
              {!creating && <button onClick={()=>setCreating(true)}>Create Job</button>}
              {creating && (
                <div className="card">
                  <div className="row"><label>Name</label><input value={jName} onChange={e=>setJName(e.target.value)} /></div>
                  <div className="row"><label>Type</label>
                    <select value={jType} onChange={e=>setJType(e.target.value)}>
                      <option value="continuous">Continuous</option>
                      <option value="triggered">Triggered</option>
                    </select>
                  </div>
                  <div className="row"><label>Scope tables</label>
                    <select multiple value={jTables} onChange={e=>setJTables(Array.from(e.target.selectedOptions).map(o=>o.value))}>
                      {tables.filter(t=>selectTableMappingStatus(state,t.id)!=='Unmapped').map(t=>(<option key={t.id} value={t.id}>{t.name}</option>))}
                    </select>
                  </div>
                  {jType==='continuous' && (
                    <div className="row"><label>Interval (ms)</label><input type="number" value={jInterval} onChange={e=>setJInterval(Number(e.target.value)||0)} /></div>
                  )}
                  <div className="row"><label>Batching</label>
                    <input type="number" value={jBatchCount} onChange={e=>setJBatchCount(Number(e.target.value)||0)} placeholder="count" />
                    <input type="number" value={jBatchMs} onChange={e=>setJBatchMs(Number(e.target.value)||0)} placeholder="ms" />
                  </div>
                  <div className="row"><label>CPU budget</label>
                    <select value={jCpu} onChange={e=>setJCpu(e.target.value)}>
                      <option value="eco">Eco</option>
                      <option value="balanced">Balanced</option>
                      <option value="performance">Performance</option>
                    </select>
                  </div>
                  <div className="row"><label>Enabled</label><input type="checkbox" checked={jEnabled} onChange={e=>setJEnabled(e.target.checked)} /></div>
                  <div className="row">
                    <button onClick={saveJob}>Save</button>
                    <button onClick={()=>setCreating(false)}>Cancel</button>
                  </div>
                </div>
              )}

              <div className="table" style={{ marginTop: 12 }}>
                <div className="line head"><div>Name</div><div>Type</div><div>Scope</div><div>Interval</div><div>Batching</div><div>Status</div><div>Next</div><div>Last</div><div>Errors</div><div></div></div>
                {jobs.length===0 && <div className="empty">No jobs yet.</div>}
                {jobs.map(j => (
                  <div key={j.id} className={`line ${selJobId===j.id?'sel':''}`} onClick={()=>setSelJobId(j.id)}>
                    <div>{j.name}</div>
                    <div>{j.type}</div>
                    <div>{(j.tables||[]).length} table(s)</div>
                    <div>{j.type==='continuous'? (j.intervalMs+'ms') : 'triggered'}</div>
                    <div>{j.batching?.count||1}/{j.batching?.ms||0}ms</div>
                    <div><Dot color={statusColor(j.status)} /> {j.status||'stopped'}</div>
                    <div>{j.metrics?.nextRun || '—'}</div>
                    <div>{j.metrics?.lastRun || '—'}</div>
                    <div>{j.metrics?.errors1h ?? 0}</div>
                    <div className="cell act">
                      <button onClick={(e)=>{e.stopPropagation(); startJob(j.id)}}>Start</button>
                      <button onClick={(e)=>{e.stopPropagation(); pauseJob(j.id)}}>Pause</button>
                      <button onClick={(e)=>{e.stopPropagation(); stopJob(j.id)}}>Stop</button>
                      <button onClick={(e)=>{e.stopPropagation(); dryRun(j.id)}}>Dry-Run 60s</button>
                      <button onClick={(e)=>{e.stopPropagation(); backfillOnce(j.id)}}>Backfill once</button>
                      <button onClick={(e)=>{e.stopPropagation(); dispatch({ type:'JOB_DUPLICATE', id:j.id })}}>Duplicate</button>
                      <button onClick={(e)=>{e.stopPropagation(); dispatch({ type:'JOB_DELETE', id:j.id })}}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>

              {selJob && (
                <div className="card" style={{ marginTop: 12 }}>
                  <strong>{selJob.name}</strong>
                  <div className="metrics">
                    <div>Read: {selJob.metrics?.readRate ?? 0}/s</div>
                    <div>Write: {selJob.metrics?.writeRate ?? 0}/s</div>
                    <div>Queue: {selJob.metrics?.qDepth ?? 0}</div>
                    <div>Errors: {selJob.metrics?.errPct ?? 0}%</div>
                    <div>p50: {selJob.metrics?.p50 ?? 0}ms</div>
                    <div>p95: {selJob.metrics?.p95 ?? 0}ms</div>
                  </div>
                </div>
              )}
            </section>
          )}

          {left === 'alarms' && (
            <section>
              <h3>Alarms</h3>
              <div className="card">
                <div className="row"><label>Name</label><input value={alarmName} onChange={e=>setAlarmName(e.target.value)} /></div>
                <div className="row"><label>Field</label><input value={alarmField} onChange={e=>setAlarmField(e.target.value)} placeholder="table.field" /></div>
                <div className="row"><button onClick={addAlarm}>Add Alarm</button></div>
              </div>
              <div className="hint">Alarm definitions and actions are UI stubs.</div>
            </section>
          )}

          {left === 'buffers' && (
            <section>
              <h3>Buffers & Health</h3>
              <div className="card">
                <strong>Store-and-forward</strong>
                <div className="row">
                  <div className="bar"><div className="bar-fill" style={{ width: `${Math.min(100, (buffers.usedMb/buffers.limitMb)*100||0)}%` }} /></div>
                  <span>{buffers.usedMb} / {buffers.limitMb} MB</span>
                </div>
              </div>
              <div className="card">
                <strong>Per-job queues</strong>
                {jobs.map(j => (
                  <div key={j.id} className="row"><span>{j.name}</span><div className="bar small"><div className="bar-fill" style={{ width: `${Math.min(100,(buffers.perJob[j.id]||0))}%` }} /></div></div>
                ))}
              </div>
              <div className="card">
                <strong>System</strong>
                <div className="row"><label>CPU</label><div className="bar small"><div className="bar-fill" style={{ width: `${(system.cpu*100)|0}%` }} /></div></div>
                <div className="row"><label>I/O</label><div className="bar small"><div className="bar-fill" style={{ width: `${(system.io*100)|0}%` }} /></div></div>
                <div className="row"><button onClick={()=>{ jobs.forEach(j=>dispatch({ type:'JOB_SET_STATUS', id:j.id, status:'stopped' })); dispatch({ type:'BUF_UPDATE', patch:{ usedMb:0, perJob:{} }}) }}>Drain and stop all jobs</button></div>
              </div>
            </section>
          )}

          {left === 'history' && (
            <section>
              <h3>History & Reports</h3>
              <div className="hint">Runs, failures, and throughput summaries are UI stubs.</div>
            </section>
          )}

          {left === 'utilities' && (
            <section>
              <h3>Utilities</h3>
              <div className="row">
                <button>Import jobs</button>
                <button>Export jobs</button>
                <button>Templates</button>
                <button>Validation center</button>
              </div>
            </section>
          )}

          <div className="gate">
            <div className="checks">
              <div><Dot color={jobHasMapped?'#22a06b':'#ef4444'} /> A job selects a mapped table</div>
              <div><Dot color={jobEnabled?'#22a06b':'#ef4444'} /> A job is enabled</div>
              <div><Dot color={dbOk?'#22a06b':'#ef4444'} /> Default DB is OK</div>
            </div>
            {ready ? (
              <div className="hint">Ready to run</div>
            ) : (
              <div className="hint">Complete the unmet items above.</div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
