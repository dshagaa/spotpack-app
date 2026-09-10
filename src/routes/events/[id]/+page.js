import { browser } from '$app/environment';
import { getSnapshot, setSnapshot } from '$lib/cache.js';
import { normalizeEventDetail } from '$lib/event-model.js';

export async function load({ fetch, params }) {
  const cached = browser ? getSnapshot('event', params.id) : null;
  if (cached && !cached.stale) {
    return { event: normalizeEventDetail(cached.data), cached: true, error: null };
  }

  try {
    const response = await fetch(`/api/events/${encodeURIComponent(params.id)}`);
    const payload = await response.json();
    if (!response.ok) {
      return { event: null, cached: false, error: payload.error ?? 'Event not found.' };
    }
    if (browser) setSnapshot('event', params.id, payload);
    return { event: normalizeEventDetail(payload), cached: false, error: null };
  } catch (loadError) {
    if (cached) {
      return {
        event: normalizeEventDetail(cached.data),
        cached: true,
        error: 'Showing your last saved schedule.'
      };
    }
    return {
      event: null,
      cached: false,
      error: loadError instanceof Error ? loadError.message : 'Unable to load event.'
    };
  }
}
