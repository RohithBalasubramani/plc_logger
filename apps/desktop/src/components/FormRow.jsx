import React from 'react'
export default function FormRow({ label, children }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 140 }}>{label}</span>
      <span>{children}</span>
    </label>
  )
}

