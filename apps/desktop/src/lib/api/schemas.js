import { request } from './client.js'

export const listSchemas = () => request('/schemas')
export const createSchema = (payload) => request('/schemas', { method: 'POST', body: payload })
export const exportSchemas = () => request('/schemas/export')
export const importSchemas = (payload) => request('/schemas/import', { method: 'POST', body: payload })

