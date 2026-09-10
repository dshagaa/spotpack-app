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
  const headers = { ...(options.headers || authHeaders()) }
  if (options.method && options.method !== 'GET') {
    const key = getApiKey()
    if (key) headers['x-api-key'] = key
  }

  let res
  try {
    res = await fetch(`${BASE}${path}`, { ...options, headers })
  } catch {
    throw new Error('No se pudo conectar al servidor')
  }

  if (!res.ok) {
    const text = await res.text()
    let msg = `HTTP ${res.status}`
    try {
      const body = JSON.parse(text)
      if (body.error) msg = body.error
    } catch { /* not JSON, use status */ }
    if (res.status === 502) msg = 'Backend no disponible — ejecutá wrangler dev'
    throw new Error(msg)
  }

  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Respuesta inesperada del servidor`)
  }
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
