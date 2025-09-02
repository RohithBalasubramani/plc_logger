import React, { useState } from 'react'

export default function DbTargets() {
  const [provider, setProvider] = useState('sqlite')
  const [conn, setConn] = useState('file:plc_logger.db')
  const [status, setStatus] = useState('idle')
  return (
    <div>
      <h4>Storage Target</h4>
      <div style={{ display: 'flex', gap: 8 }}>
        <select value={provider} onChange={e=>setProvider(e.target.value)}>
          <option value="sqlite">SQLite</option>
          <option value="postgres">Postgres</option>
          <option value="sqlserver">SQL Server</option>
          <option value="mysql">MySQL</option>
        </select>
        <input value={conn} onChange={e=>setConn(e.target.value)} placeholder="connection" />
        <button onClick={()=>setStatus('OK (stub)')}>Test Connection</button>
        <button onClick={()=>setStatus('Default set (stub)')}>Set Default</button>
      </div>
      <div style={{ marginTop: 8 }}>Status: {status}</div>
    </div>
  )
}

