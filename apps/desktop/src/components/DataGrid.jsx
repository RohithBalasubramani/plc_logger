import React from 'react'
export default function DataGrid({ rows }) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 6, padding: 8 }}>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(rows, null, 2)}</pre>
    </div>
  )
}

