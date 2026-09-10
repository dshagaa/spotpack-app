import { browser } from '$app/environment';
import { getSnapshot, setSnapshot } from '$lib/cache.js';
import { normalizeEventSummary } from '$lib/event-model.js';

function fromPayload(payload) {
  return (payload.events ?? []).map(normalizeEventSummary);
}

export async function load({ fetch }) {
  const cached = browser ? getSnapshot('events') : null;
  if (cached && !cached.stale) {
    return { events: fromPayload(cached.data), error: null, cached: true };
  }

  try {
    const response = await fetch('/api/events');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    if (browser) setSnapshot('events', payload);
    return { events: fromPayload(payload), error: null, cached: false };
  } catch (loadError) {
    if (cached) {
      return {
        events: fromPayload(cached.data),
        error: 'Showing your last saved schedule.',
        cached: true
      };
    }
    return {
      events: [],
      error: loadError instanceof Error ? loadError.message : 'Unable to load events.',
      cached: false
    };
  }
}
