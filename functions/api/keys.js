// functions/api/keys.js
// POST /api/keys — create a new API key (auth: maintainer)

import { authorize, sha256, generateKey } from '../_shared/auth.js';
import { corsPreflight, ok, badRequest, unauthorized, forbidden, serverError } from '../_shared/response.js';
import { getKeys, saveKeys } from '../_shared/r2.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return corsPreflight();
  if (request.method !== 'POST') return badRequest('Method not allowed');

  const auth = await authorize(request, env, 'create', 'keys');
  if (auth === 'unauthorized') return unauthorized();
  if (auth === 'forbidden') return forbidden('maintainer');

  try {
    const body = await request.json();
    const { label, role = 'general' } = body;
    if (!label) return badRequest('Missing label');

    if (role !== 'general' && role !== 'maintainer') {
      return badRequest('role must be "general" or "maintainer"');
    }

    const rawKey = `sk-sp-${generateKey()}`;
    const hash = await sha256(rawKey);

    const keys = await getKeys(env);
    keys.push({
      key_hash: `sha256:${hash}`,
      role,
      label,
      created_at: new Date().toISOString(),
    });
    await saveKeys(env, keys);

    // Raw key returned ONCE — caller stores it
    return ok({ key: rawKey, role, label });
  } catch (err) {
    return serverError(err.message);
  }
}
