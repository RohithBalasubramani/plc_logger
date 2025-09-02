import React, { useState } from 'react'

export default function SchemaEditor() {
  const [name, setName] = useState('LTPanel')
  const [fields, setFields] = useState([{ key: 'r_current', type: 'float', unit: 'A', scale: 1 }])
  return (
    <div>
      <h4>Parent Schemas</h4>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="schema name" />
        <button onClick={()=>{}}>Save (stub)</button>
        <button onClick={()=>{}}>Export (stub)</button>
        <button onClick={()=>{}}>Import (stub)</button>
      </div>
      <div style={{ marginTop: 8 }}>
        Fields: {fields.map(f=>f.key).join(', ')}
      </div>
    </div>
  )
}

