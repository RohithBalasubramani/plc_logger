import React, { useState } from 'react'

export default function OpcUaForm() {
  const [endpoint, setEndpoint] = useState('opc.tcp://localhost:4840')
  const [status, setStatus] = useState('idle')
  return (
    <div>
      <h4>OPC UA</h4>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={endpoint} onChange={e=>setEndpoint(e.target.value)} placeholder="endpoint" />
        <button onClick={()=>setStatus('not implemented (stub)')}>Test Read</button>
      </div>
      <div style={{ marginTop: 8 }}>Status: {status}</div>
    </div>
  )
}

