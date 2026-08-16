// Safe localStorage/sessionStorage helpers

const KEYS = {
  eventsSnapshot: 'spotpack:v1:snapshot:events',
  eventSnapshotPrefix: 'spotpack:v1:snapshot:event:',
  attending: 'spotpack:v1:attending',
  ui: 'spotpack:v1:ui',
  apiKey: 'spotpack_api_key',
}

function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

function writeJSON(key, value, maxBytes = 250000) {
  try {
    const s = JSON.stringify(value)
    if (s.length > maxBytes) return false
    localStorage.setItem(key, s)
    return true
  } catch { return false }
}

export { KEYS, readJSON, writeJSON }
