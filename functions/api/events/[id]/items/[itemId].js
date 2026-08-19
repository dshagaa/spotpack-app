// functions/api/events/[id]/items/[itemId].js
// PATCH  /api/events/:id/items/:itemId — update a schedule item (auth: general+)
// DELETE /api/events/:id/items/:itemId — delete a schedule item (auth: maintainer)

import { authorize } from '../../../../_shared/auth.js';
import { corsPreflight, ok, badRequest, unauthorized, forbidden, notFound, serverError } from '../../../../_shared/response.js';
import { getEvent, saveEvent, listEvents, saveEventIndex } from '../../../../_shared/r2.js';

export async function onRequest(context) {
  const { request } = context;
  if (request.method === 'OPTIONS') return corsPreflight();
  if (request.method === 'PATCH') return handlePatch(context);
  if (request.method === 'DELETE') return handleDelete(context);
  return badRequest('Method not allowed');
}

async function handlePatch({ request, env, params }) {
  const auth = await authorize(request, env, 'update', 'events');
  if (auth === 'unauthorized') return unauthorized();
  if (auth === 'forbidden') return forbidden('general');

  try {
    const data = await getEvent(env, params.id);
    if (!data) return notFound();

    const itemIdx = data.items.findIndex(i => i.id === params.itemId);
    if (itemIdx === -1) return notFound();

    const body = await request.json();
    // id is immutable — spread body but lock id
    data.items[itemIdx] = { ...data.items[itemIdx], ...body, id: params.itemId };
    await saveEvent(env, params.id, data);

    return ok({ item: data.items[itemIdx] });
  } catch (err) {
    return serverError(err.message);
  }
}

async function handleDelete({ request, env, params }) {
  const auth = await authorize(request, env, 'delete', 'events');
  if (auth === 'unauthorized') return unauthorized();
  if (auth === 'forbidden') return forbidden('maintainer');

  try {
    const data = await getEvent(env, params.id);
    if (!data) return notFound();

    data.items = data.items.filter(i => i.id !== params.itemId);
    await saveEvent(env, params.id, data);

    // Update index item_count
    const events = await listEvents(env);
    const idx = events.findIndex(e => e.id === params.id);
    if (idx !== -1) {
      events[idx].item_count = data.items.length;
      await saveEventIndex(env, events);
    }

    return ok({ deleted: true });
  } catch (err) {
    return serverError(err.message);
  }
}
