import { request } from './client.js'

export const getHealth = () => request('/health')

