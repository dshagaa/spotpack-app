// functions/_shared/r2.js
// R2 read/write helpers for JSON event storage

export async function readJSON(env, key) {
  const obj = await env.SPOTPACK_BUCKET.get(key);
  if (!obj) return null;
  const text = await obj.text();
  return JSON.parse(text);
}

export async function writeJSON(env, key, data) {
  const json = JSON.stringify(data);
  await env.SPOTPACK_BUCKET.put(key, json, {
    httpMetadata: { contentType: 'application/json' },
  });
}

export async function deleteKey(env, key) {
  await env.SPOTPACK_BUCKET.delete(key);
}

// --- Event-specific helpers ---

export async function listEvents(env) {
  const data = await readJSON(env, 'events/index.json');
  return data || [];
}

export async function saveEventIndex(env, events) {
  await writeJSON(env, 'events/index.json', events);
}

export async function getEvent(env, id) {
  return readJSON(env, `events/${id}.json`);
}

export async function saveEvent(env, id, data) {
  await writeJSON(env, `events/${id}.json`, data);
}

export async function deleteEvent(env, id) {
  await deleteKey(env, `events/${id}.json`);
}

// --- Auth helpers ---

export async function getKeys(env) {
  const data = await readJSON(env, 'auth/keys.json');
  return data || [];
}

export async function saveKeys(env, keys) {
  await writeJSON(env, 'auth/keys.json', keys);
}
