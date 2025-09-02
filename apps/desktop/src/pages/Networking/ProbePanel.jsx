import React from 'react'

export default function ProbePanel({ value, latency, status }) {
  return (
    <div>
      <h4>Probe</h4>
      <div>Value: {String(value ?? '-')}</div>
      <div>Latency: {latency ?? '-'} ms</div>
      <div>Status: {status ?? '-'}</div>
    </div>
  )}

