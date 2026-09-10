export const TRACKED_ACTIVITIES_KEY = 'spotpack-tracked-activities';

export function toggleTracked(ids, activityId) {
  return ids.includes(activityId)
    ? ids.filter((id) => id !== activityId)
    : [...ids, activityId];
}

export function getHomeActivities(activities, trackedIds) {
  if (trackedIds.length === 0) return activities;

  return activities.filter((activity) => trackedIds.includes(activity.id));
}

export function readTracked(eventId) {
  if (typeof window === 'undefined') return [];

  try {
    const stored = JSON.parse(localStorage.getItem(TRACKED_ACTIVITIES_KEY) ?? '{}');
    return Array.isArray(stored?.[eventId])
      ? stored[eventId].filter((id) => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
}

export function writeTracked(eventId, ids) {
  if (typeof window === 'undefined') return;

  try {
    const stored = JSON.parse(localStorage.getItem(TRACKED_ACTIVITIES_KEY) ?? '{}');
    const next = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
    next[eventId] = ids;
    localStorage.setItem(TRACKED_ACTIVITIES_KEY, JSON.stringify(next));
  } catch {
    // Tracking is local-only; ignore storage failures.
  }
}
