import { request } from './client.js'

export const bulkCreate = (payload) => request('/tables/bulk_create', { method: 'POST', body: payload })
export const dryRunDDL = (payload) => request('/tables/dry_run_ddl', { method: 'POST', body: payload })
export const migrate = (payload) => request('/tables/migrate', { method: 'POST', body: payload })

