import { request } from './client.js'

export const listMappings = (device) => request(`/mappings/${encodeURIComponent(device)}`)
export const upsertMapping = (device, payload) => request(`/mappings/${encodeURIComponent(device)}`, { method: 'POST', body: payload })
export const bulkApply = (device, payload) => request(`/mappings/${encodeURIComponent(device)}/bulk_apply`, { method: 'POST', body: payload })
export const importMappings = (device, payload) => request(`/mappings/${encodeURIComponent(device)}/import`, { method: 'POST', body: payload })
export const validateMappings = (device, payload) => request(`/mappings/${encodeURIComponent(device)}/validate`, { method: 'POST', body: payload })

