// Global attending state (localStorage-backed)
let _attending = {}
try { _attending = JSON.parse(localStorage.getItem('spotpack:v1:attending') || '{}') } catch {}

function save() {
  try { localStorage.setItem('spotpack:v1:attending', JSON.stringify(_attending)) } catch {}
}

export function isAttending(eventId, itemId) {
  return !!(_attending[eventId] && _attending[eventId][itemId])
}

export function setAttending(eventId, itemId, value) {
  if (!_attending[eventId]) _attending[eventId] = {}
  if (value) {
    _attending[eventId][itemId] = true
  } else {
    delete _attending[eventId][itemId]
    if (Object.keys(_attending[eventId]).length === 0) delete _attending[eventId]
  }
  save()
}

export function getAttendingItems(eventId) {
  return Object.keys(_attending[eventId] || {})
}

export function getAllAttending() { return { ..._attending } }
