import { request } from './client.js'

export async function getHealth() { return request('/health') }

export async function testModbus(params) { return request('/networking/modbus/test', { method: 'POST', body: params }) }
export async function testOpcUa(params) { return request('/networking/opcua/test', { method: 'POST', body: params }) }
export async function addDbTarget(params) { return request('/storage/targets', { method: 'POST', body: params }) }
export async function testDbTarget(params) { return request('/storage/targets/test', { method: 'POST', body: params }) }
export async function setDefaultTarget(id) { return request('/storage/targets/default', { method: 'POST', body: { id } }) }

