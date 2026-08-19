// functions/_shared/auth.js
// API key verification with role-based permissions

const PERMISSIONS = {
  general: {
    events: ['read', 'create', 'update'],
    schedules: ['import'],
    keys: [],
  },
  maintainer: {
    events: ['read', 'create', 'update', 'delete'],
    schedules: ['import'],
    keys: ['create'],
  },
};

/**
 * Verify x-api-key header against keys stored in R2.
 * @param {Request} request
 * @param {object} env - Cloudflare env with SPOTPACK_BUCKET binding
 * @param {string} action - 'read' | 'create' | 'update' | 'delete' | 'import'
 * @param {string} resource - 'events' | 'schedules' | 'keys'
 * @returns {Promise<'unauthorized'|'forbidden'|{role: string, label: string}>}
 */
export async function authorize(request, env, action, resource) {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey) return 'unauthorized';

  const hash = await sha256(apiKey);
  const keyHash = `sha256:${hash}`;

  const keys = await getKeys(env);
  const found = keys.find(k => k.key_hash === keyHash);
  if (!found) return 'unauthorized';

  const rolePerms = PERMISSIONS[found.role];
  if (!rolePerms) return 'forbidden';
  if (!rolePerms[resource]?.includes(action)) return 'forbidden';

  return { role: found.role, label: found.label };
}

/**
 * Hash a string with SHA-256 (Web Crypto API).
 */
async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Import getKeys from r2.js (avoids circular dependency by importing lazily)
import { getKeys } from './r2.js';
