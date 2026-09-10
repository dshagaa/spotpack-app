export const ATTENDING_EVENTS_KEY = 'spotpack-attending-events';

export function toggleAttendance(ids, eventId) {
  return ids.includes(eventId)
    ? ids.filter((id) => id !== eventId)
    : [...ids, eventId];
}

export function readAttendance() {
  if (typeof window === 'undefined') return [];

  try {
    const stored = JSON.parse(localStorage.getItem(ATTENDING_EVENTS_KEY) ?? '[]');
    return Array.isArray(stored) ? stored.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function writeAttendance(ids) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ATTENDING_EVENTS_KEY, JSON.stringify(ids));
}
