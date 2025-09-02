import React, { useMemo, useState } from 'react'
import { useApp } from '../../state/store.jsx'
import {
  selectSchemas,
  selectTables,
  selectMappings,
  selectDbTargets,
  selectDefaultDbTargetId,
  selectDevices,
  selectTablesGateSatisfied,
  selectTableMappingStatus,
} from '../../state/selectors.js'
import '../../styles/tables.css'

function Dot({ color = '#9ca3af' }) {
  return <span className="dot" style={{ backgroundColor: color }} aria-hidden />
}

function StatusPill({ status }) {
  const map = {
    'Not migrated': '#ef4444',
    'Migrated': '#22a06b',
    'Needs update': '#f59e0b',
    'Unmapped': '#9ca3af',
    'Partially mapped': '#f59e0b',
    'Mapped': '#22a06b'
  }
  const color = map[status] || '#9ca3af'
  return <span className="pill"><span className="dot" style={{ backgroundColor: color }} /> {status}</span>
}

function expandPattern(text) {
  // Supports Pattern `{1..N}` sequential expansion; falls back to single name
  const m = /^(.*)\{(\d+)\.\.(\d+)\}(.*)$/.exec(text || '')
  if (!m) return [text]
  const [, pre, a, b, post] = m
  const start = parseInt(a, 10), end = parseInt(b, 10)
  const list = []
  for (let i = start; i <= end; i++) list.push(`${pre}${i}${post}`)
  return list
}

export function TablesMapping({ onProceed }) {
  const { state, dispatch } = useApp()
  const schemas = selectSchemas(state)
  const tables = selectTables(state)
  const mappings = selectMappings(state)
  const targets = selectDbTargets(state)
  const defaultTargetId = selectDefaultDbTargetId(state)
  const devices = selectDevices(state)
  const gateOK = selectTablesGateSatisfied(state)

  const [left, setLeft] = useState('schemas') // 'schemas' | 'tables' | 'mapping' | 'utilities'
  const [selSchemaId, setSelSchemaId] = useState(null)
  const [selTableId, setSelTableId] = useState(null)

  // Top DB display
  const defaultTarget = useMemo(() => targets.find(t => t.id === defaultTargetId), [targets, defaultTargetId])

  // ----------------- Schemas -----------------
  const [schName, setSchName] = useState('NewSchema')
  const [schFields, setSchFields] = useState([{ key: 'r_current', type: 'float', unit: 'A', scale: 1, desc: '' }])
  const saveSchema = () => {
    if (!schName.trim()) return
    const id = 'sch_' + Math.random().toString(36).slice(2, 8)
    dispatch({ type: 'SCH_ADD', schema: { id, name: schName.trim(), fields: schFields } })
    setSelSchemaId(id)
    setLeft('tables')
  }
  const addField = () => setSchFields([...schFields, { key: '', type: 'float', unit: '', scale: 1, desc: '' }])
  const updateField = (i, patch) => setSchFields(s => s.map((f, idx) => idx === i ? { ...f, ...patch } : f))
  const removeField = (i) => setSchFields(s => s.filter((_, idx) => idx !== i))

  // ----------------- Tables -----------------
  const [pattern, setPattern] = useState('Transformer-{1..5}')
  const [overrideTarget, setOverrideTarget] = useState('')
  const canMigrate = tables.some(t => t.status !== 'migrated')
  const migrateSelected = (ids) => {
    ids.forEach(id => dispatch({ type: 'TBL_UPDATE', id, patch: { status: 'migrated', lastMigratedAt: new Date().toISOString() } }))
  }
  const createTables = () => {
    const schemaId = selSchemaId || (schemas[0]?.id)
    if (!schemaId) return
    const names = expandPattern(pattern)
    const created = names.filter(Boolean).map(n => ({ id: 'tbl_' + Math.random().toString(36).slice(2, 8), name: n, schemaId, dbTargetId: overrideTarget || defaultTargetId || null, status: 'not_migrated', lastMigratedAt: null }))
    if (created.length) dispatch({ type: 'TBL_ADD_BULK', tables: created })
    setSelTableId(created[0]?.id)
    setLeft('mapping')
  }

  // ----------------- Mapping -----------------
  const table = useMemo(() => tables.find(t => t.id === selTableId) || tables[0], [tables, selTableId])
  const schema = useMemo(() => schemas.find(s => s.id === (table?.schemaId)) || schemas.find(s => s.id === selSchemaId), [schemas, table, selSchemaId])
  const rows = useMemo(() => (schema?.fields || []).map(f => ({ ...f, map: (mappings[table?.id] || {})[f.key] || {} })), [schema, mappings, table])
  const setDevice = (devId) => table && dispatch({ type: 'MAP_SET_DEVICE', tableId: table.id, deviceId: devId })
  const upsertRow = (fieldKey, patch) => table && dispatch({ type: 'MAP_UPSERT_ROW', tableId: table.id, fieldKey, payload: patch })
  const mappingStatus = table ? selectTableMappingStatus(state, table.id) : 'Unmapped'

  return (
    <div className="tables">
      <div className="topbar">
        <div className="db">Database: {defaultTarget ? `${defaultTarget.provider} • ${defaultTarget.conn}` : '— not set —'}</div>
        <div className="actions">
          <button disabled={!canMigrate} title={canMigrate?'' : 'All migrated'}>Migrate</button>
        </div>
      </div>

      <div className="layout">
        <aside className="rail" aria-label="Tables & Mapping sections">
          <button className={`rail-item ${left==='schemas'?'active':''}`} onClick={()=>setLeft('schemas')}>
            <div className="rail-title">Schemas</div>
            <div className="rail-sub">{schemas.length} defined</div>
          </button>
          <button className={`rail-item ${left==='tables'?'active':''}`} onClick={()=>setLeft('tables')}>
            <div className="rail-title">Device Tables</div>
            <div className="rail-sub">{tables.length} tables</div>
          </button>
          <button className={`rail-item ${left==='mapping'?'active':''}`} onClick={()=>setLeft('mapping')}>
            <div className="rail-title">Mapping</div>
            <div className="rail-sub">status: {table ? mappingStatus : '—'}</div>
          </button>
          <button className={`rail-item ${left==='utilities'?'active':''}`} onClick={()=>setLeft('utilities')}>
            <div className="rail-title">Utilities</div>
            <div className="rail-sub">import/export, bulk apply</div>
          </button>
        </aside>

        <main className="main" aria-live="polite">
          {left === 'schemas' && (
            <section>
              <h3>Schemas</h3>
              <div className="card">
                <div className="row"><label>Name</label><input value={schName} onChange={e=>setSchName(e.target.value)} /></div>
                <div className="grid col-6 header">
                  <div>Key</div><div>Type</div><div>Unit</div><div>Scale</div><div>Description</div><div></div>
                </div>
                {schFields.map((f,i)=>(
                  <div key={i} className="grid col-6">
                    <input value={f.key} onChange={e=>updateField(i,{ key:e.target.value })} placeholder="key" />
                    <select value={f.type} onChange={e=>updateField(i,{ type:e.target.value })}>
                      <option value="float">float</option>
                      <option value="int">int</option>
                      <option value="bool">bool</option>
                      <option value="string">string</option>
                    </select>
                    <input value={f.unit} onChange={e=>updateField(i,{ unit:e.target.value })} placeholder="unit" />
                    <input type="number" value={f.scale} onChange={e=>updateField(i,{ scale:Number(e.target.value)||0 })} />
                    <input value={f.desc} onChange={e=>updateField(i,{ desc:e.target.value })} placeholder="description" />
                    <button onClick={()=>removeField(i)}>Remove</button>
                  </div>
                ))}
                <div className="row">
                  <button onClick={addField}>Add field</button>
                  <button onClick={saveSchema}>Save schema</button>
                </div>
              </div>

              {schemas.length > 0 && (
                <div className="card" style={{ marginTop: 12 }}>
                  <strong>Existing:</strong>
                  {schemas.map(s => (
                    <div key={s.id} className="line">
                      <div className="cell name">{s.name}</div>
                      <div className="cell">{s.fields.length} fields</div>
                      <div className="cell">used by {tables.filter(t=>t.schemaId===s.id).length} tables</div>
                      <div className="cell act"><button onClick={()=>{ setSelSchemaId(s.id); setLeft('tables') }}>Select</button></div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {left === 'tables' && (
            <section>
              <h3>Device Tables</h3>
              <div className="card">
                <div className="row"><label>Parent schema</label>
                  <select value={selSchemaId || ''} onChange={e=>setSelSchemaId(e.target.value)}>
                    <option value="" disabled>Select schema…</option>
                    {schemas.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                  </select>
                </div>
                <div className="row"><label>Names</label>
                  <input value={pattern} onChange={e=>setPattern(e.target.value)} placeholder="Transformer-{1..5} or paste list" />
                  <button onClick={createTables}>Create</button>
                </div>
                <div className="row"><label>Target DB</label>
                  <input value={overrideTarget} onChange={e=>setOverrideTarget(e.target.value)} placeholder={defaultTarget ? `${defaultTarget.provider}:${defaultTarget.conn}` : 'inherit default'} />
                </div>
                <div className="card" style={{ marginTop: 8 }}>
                  <strong>Preview:</strong>
                  <div>{expandPattern(pattern).join(', ') || '—'}</div>
                </div>
              </div>

              <div className="table" style={{ marginTop: 12 }}>
                {tables.length === 0 && <div className="empty">No tables yet.</div>}
                {tables.map(t => (
                  <div key={t.id} className="row line">
                    <div className="cell name">{t.name}</div>
                    <div className="cell">{schemas.find(s=>s.id===t.schemaId)?.name || '—'}</div>
                    <div className="cell">{t.dbTargetId || defaultTargetId || 'default'}</div>
                    <div className="cell"><StatusPill status={t.status==='not_migrated'?'Not migrated':t.status==='needs_update'?'Needs update':'Migrated'} /></div>
                    <div className="cell act">
                      <button onClick={()=>migrateSelected([t.id])} disabled={t.status==='migrated'}>Migrate</button>
                      <button onClick={()=>{ setSelTableId(t.id); setLeft('mapping') }}>Map</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {left === 'mapping' && (
            <section>
              <h3>Mapping</h3>
              <div className="row">
                <label>Table</label>
                <select value={table?.id || ''} onChange={e=>setSelTableId(e.target.value)}>
                  {tables.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
                </select>
                <span className="hint">{schema ? `Schema: ${schema.name}` : ''}</span>
              </div>
              <div className="row">
                <label>Bind device</label>
                <select value={table?.deviceId || ''} onChange={e=>setDevice(e.target.value)}>
                  <option value="">— none —</option>
                  {devices.map(d => (<option key={d.id} value={d.id}>{d.name} ({d.status})</option>))}
                </select>
                <span className="hint">Device status affects live preview availability.</span>
              </div>
              <div className="grid col-7 header">
                <div>Field</div><div>Type</div><div>Protocol</div><div>Address/Node</div><div>Data type</div><div>Scale</div><div>Deadband</div>
              </div>
              {rows.map(r => (
                <div key={r.key} className="grid col-7">
                  <div>{r.key}</div>
                  <div>{r.type}</div>
                  <select value={r.map.protocol||''} onChange={e=>upsertRow(r.key,{ protocol:e.target.value })}>
                    <option value="">—</option>
                    <option value="modbus">Modbus</option>
                    <option value="opcua">OPC UA</option>
                  </select>
                  <input value={r.map.address||''} onChange={e=>upsertRow(r.key,{ address:e.target.value })} placeholder={r.map.protocol==='opcua'?'ns=2;s=...':'40001'} />
                  <select value={r.map.dataType||''} onChange={e=>upsertRow(r.key,{ dataType:e.target.value })}>
                    <option value="">—</option>
                    <option value="float">float</option>
                    <option value="int">int</option>
                    <option value="bool">bool</option>
                    <option value="string">string</option>
                  </select>
                  <input type="number" value={r.map.scale??1} onChange={e=>upsertRow(r.key,{ scale:Number(e.target.value)||1 })} />
                  <input type="number" value={r.map.deadband??0} onChange={e=>upsertRow(r.key,{ deadband:Number(e.target.value)||0 })} />
                </div>
              ))}
              <div className="row" style={{ marginTop: 8 }}>
                <span>Table status: <StatusPill status={mappingStatus} /></span>
                <button onClick={()=>{/* stub save */}}>Save mapping</button>
                <button onClick={()=>{/* stub validate */}}>Validate all</button>
              </div>
            </section>
          )}

          {left === 'utilities' && (
            <section>
              <h3>Utilities</h3>
              <div className="row">
                <button>Import schemas</button>
                <button>Export schemas</button>
                <button>Import mapping</button>
                <button>Export mapping</button>
                <button>Bulk apply</button>
              </div>
              <div className="hint">All actions are UI stubs for now.</div>
            </section>
          )}

          <div className="gate">
            <div className="checks">
              <div><Dot color={schemas.length>0?'#22a06b':'#ef4444'} /> At least one parent schema exists</div>
              <div><Dot color={tables.some(t=>t.status==='migrated')?'#22a06b':'#ef4444'} /> At least one device table is migrated</div>
              <div><Dot color={tables.some(t=>selectTableMappingStatus(state,t.id)==='Mapped')?'#22a06b':'#ef4444'} /> At least one table has valid mappings</div>
            </div>
            {gateOK ? (
              <button onClick={()=>onProceed && onProceed()}>Proceed to next</button>
            ) : (
              <div className="hint">Complete the unmet items above to proceed.</div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
