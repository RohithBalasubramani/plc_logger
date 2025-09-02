import React, { useState } from 'react'

export default function BulkCreate() {
  const [pattern, setPattern] = useState('Transformer-{1..5}')
  const [target, setTarget] = useState('sqlite:plc_logger.db')
  return (
    <div>
      <h4>Bulk Device Table Creation</h4>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={pattern} onChange={e=>setPattern(e.target.value)} />
        <input value={target} onChange={e=>setTarget(e.target.value)} />
        <button onClick={()=>{}}>Create (stub)</button>
      </div>
    </div>
  )
}

