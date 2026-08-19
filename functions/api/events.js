// functions/api/events.js
// GET  /api/events  — list all events (public, no auth)
// POST /api/events  — create event (auth: general+)

import { corsPreflight, ok, created, badRequest, unauthorized, forbidden, serverError } from '../_shared/response.js';
import { authorize } from '../_shared/auth.js';
import { listEvents, saveEvent, saveEventIndex } from '../_shared/r2.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return corsPreflight();
  if (request.method === 'GET') return handleGet(env);
  if (request.method === 'POST') return handlePost(context);
  return badRequest('Method not allowed');
}

async function handleGet(env) {
  try {
    const events = await listEvents(env);
    return ok({ events }, {
      headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
    });
  } catch (err) {
    return serverError(err.message);
  }
}

async function handlePost({ request, env }) {
  const auth = await authorize(request, env, 'create', 'events');
  if (auth === 'unauthorized') return unauthorized();
  if (auth === 'forbidden') return forbidden('general');

  try {
    const body = await request.json();
    const { name, start_date, end_date, location } = body;

    if (!name || !start_date || !end_date) {
      return badRequest('Missing required fields: name, start_date, end_date');
    }

    const id = crypto.randomUUID();
    const event = {
      id,
      name,
      start_date,
      end_date,
      location: location || '',
      created_at: new Date().toISOString(),
    };

    const eventData = { event, items: [] };
    await saveEvent(env, id, eventData);

    // Update index
    const events = await listEvents(env);
    events.push({
      id,
      name,
      start_date,
      end_date,
      location: location || '',
      item_count: 0,
    });
    await saveEventIndex(env, events);

    return created({ event });
  } catch (err) {
    return serverError(err.message);
  }
}
