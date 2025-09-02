import React from 'react'
export default function TableToolbar({ children }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
      {children}
    </div>
  )
}

