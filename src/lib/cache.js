// localStorage snapshot cache — 30 min TTL
import { KEYS, readJSON, writeJSON } from './storage.js'

const DEFAULT_TTL = 30 * 60 * 1000

export function getSnapshot(kind, id = '') {
  const key = kind === 'event' ? KEYS.eventSnapshotPrefix + id : KEYS.eventsSnapshot
  const value = readJSON(key)
  if (!value || value.version !== 1 || !value.cachedAt || value.data == null) return null
  const now = Date.now()
  return {
    data: value.data,
    cachedAt: value.cachedAt,
    stale: now - value.cachedAt > (value.ttl || DEFAULT_TTL),
  }
}

export function setSnapshot(kind, id = '', data, ttl = DEFAULT_TTL) {
  const key = kind === 'event' ? KEYS.eventSnapshotPrefix + id : KEYS.eventsSnapshot
  return writeJSON(key, { version: 1, cachedAt: Date.now(), ttl, data })
}

export function clearSnapshot(kind, id = '') {
  const key = kind === 'event' ? KEYS.eventSnapshotPrefix + id : KEYS.eventsSnapshot
  try { localStorage.removeItem(key) } catch {}
}

export function invalidateAll() {
  try {
    const keys = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith('spotpack:v1:snapshot:')) keys.push(k)
    }
    keys.forEach(k => localStorage.removeItem(k))
  } catch {}
}
