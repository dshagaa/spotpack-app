// functions/api/events/[id]/items.js
// POST /api/events/:id/items — create a schedule item manually (auth: general+)

import { authorize } from '../../../_shared/auth.js';
import { corsPreflight, created, badRequest, unauthorized, forbidden, notFound, serverError } from '../../../_shared/response.js';
import { getEvent, saveEvent, listEvents, saveEventIndex } from '../../../_shared/r2.js';
import { normalizeCategory, normalizeClassification } from '../../../_shared/validation.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  if (request.method === 'OPTIONS') return corsPreflight();
  if (request.method !== 'POST') return badRequest('Method not allowed');

  const auth = await authorize(request, env, 'create', 'events');
  if (auth === 'unauthorized') return unauthorized();
  if (auth === 'forbidden') return forbidden('general');

  try {
    const id = params.id;
    const data = await getEvent(env, id);
    if (!data) return notFound();

    const body = await request.json();
    const { day_date, start_time, end_time, title, description, room, category, classification } = body;
    if (!day_date || !start_time || !end_time || !title) {
      return badRequest('Missing required fields: day_date, start_time, end_time, title');
    }

    const newItem = {
      id: crypto.randomUUID(),
      day_date,
      start_time,
      end_time,
      title,
      description: description || '',
      room: room || '',
      category: normalizeCategory(category || ''),
      classification: normalizeClassification(classification || ''),
    };

    data.items = [...(data.items || []), newItem];
    await saveEvent(env, id, data);

    // Update index item_count
    const events = await listEvents(env);
    const idx = events.findIndex(e => e.id === id);
    if (idx !== -1) {
      events[idx].item_count = data.items.length;
      await saveEventIndex(env, events);
    }

    return created({ item: newItem });
  } catch (err) {
    return serverError(err.message);
  }
}
