// functions/api/events/[id].js
// GET    /api/events/:id  — get event with items (public, no auth)
// PATCH  /api/events/:id  — update event metadata (auth: general+)
// DELETE /api/events/:id  — delete event (auth: maintainer)

import { corsPreflight, ok, badRequest, unauthorized, forbidden, notFound, serverError } from '../../_shared/response.js';
import { authorize } from '../../_shared/auth.js';
import { getEvent, saveEvent, deleteEvent, listEvents, saveEventIndex } from '../../_shared/r2.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  if (request.method === 'OPTIONS') return corsPreflight();
  if (request.method === 'GET') return handleGet(env, params);
  if (request.method === 'PATCH') return handlePatch(context);
  if (request.method === 'DELETE') return handleDelete(context);
  return badRequest('Method not allowed');
}

async function handleGet(env, params) {
  try {
    const id = params.id;
    const data = await getEvent(env, id);
    if (!data) return notFound();
    return ok(data, {
      headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
    });
  } catch (err) {
    return serverError(err.message);
  }
}

async function handlePatch({ request, env, params }) {
  const auth = await authorize(request, env, 'update', 'events');
  if (auth === 'unauthorized') return unauthorized();
  if (auth === 'forbidden') return forbidden('general');

  try {
    const id = params.id;
    const data = await getEvent(env, id);
    if (!data) return notFound();

    const body = await request.json();
    // id is immutable — spread body but lock id
    data.event = { ...data.event, ...body, id };

    await saveEvent(env, id, data);

    // Update index entry
    const events = await listEvents(env);
    const idx = events.findIndex(e => e.id === id);
    if (idx !== -1) {
      events[idx] = {
        ...events[idx],
        name: data.event.name,
        start_date: data.event.start_date,
        end_date: data.event.end_date,
        location: data.event.location,
      };
      await saveEventIndex(env, events);
    }

    return ok({ event: data.event });
  } catch (err) {
    return serverError(err.message);
  }
}

async function handleDelete({ request, env, params }) {
  const auth = await authorize(request, env, 'delete', 'events');
  if (auth === 'unauthorized') return unauthorized();
  if (auth === 'forbidden') return forbidden('maintainer');

  try {
    const id = params.id;
    const data = await getEvent(env, id);
    if (!data) return notFound();

    await deleteEvent(env, id);

    const events = await listEvents(env);
    await saveEventIndex(env, events.filter(e => e.id !== id));

    return ok({ deleted: true });
  } catch (err) {
    return serverError(err.message);
  }
}
