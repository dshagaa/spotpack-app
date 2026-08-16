// API client — public reads, API key for writes
const BASE = '/api'

function getApiKey() {
  try { return localStorage.getItem('spotpack_api_key') || '' } catch { return '' }
}

function authHeaders() {
  const key = getApiKey()
  return key ? { 'x-api-key': key, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

async function request(path, options = {}) {
  const headers = options.headers || authHeaders()
  if (options.method && options.method !== 'GET') {
    headers['x-api-key'] = getApiKey()
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export function getEvents() { return request('/events') }
export function getEvent(id) { return request(`/events/${encodeURIComponent(id)}`) }
export function createEvent(data) { return request('/events', { method: 'POST', body: JSON.stringify(data) }) }
export function updateEvent(id, data) { return request(`/events/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }) }
export function deleteEvent(id) { return request(`/events/${encodeURIComponent(id)}`, { method: 'DELETE' }) }
export function createItem(eventId, data) { return request(`/events/${encodeURIComponent(eventId)}/items`, { method: 'POST', body: JSON.stringify(data) }) }
export function updateItem(eventId, itemId, data) { return request(`/events/${encodeURIComponent(eventId)}/items/${encodeURIComponent(itemId)}`, { method: 'PATCH', body: JSON.stringify(data) }) }
export function deleteItem(eventId, itemId) { return request(`/events/${encodeURIComponent(eventId)}/items/${encodeURIComponent(itemId)}`, { method: 'DELETE' }) }
export function importSchedule(imageFile, eventId) {
  const fd = new FormData()
  fd.append('image', imageFile)
  fd.append('event_id', eventId)
  return request('/import', { method: 'POST', headers: { 'x-api-key': getApiKey() }, body: fd })
}
export function createApiKey(label) { return request('/keys', { method: 'POST', body: JSON.stringify({ label }) }) }
