# SpotPack Production — Plan de Implementación

> **For Hermes:** Use this plan to build the production version task-by-task.
> Cloudflare Pages + Pages Functions + R2. Monorepo. localStorage-first caching.

**Goal:** Rebuild SpotPack for production: 5k concurrent users, zero database, infinite read scale, $0/mes infra. Migrate from Supabase Edge Functions + PostgreSQL to Cloudflare Pages Functions + R2.

**Architecture:** Single Cloudflare Pages project. Frontend (Vite + Alpine.js + Tailwind) served as static assets. API endpoints as Pages Functions reading/writing JSON files on R2. No database — events and items live as JSON objects in R2. Reads are public (no auth). Writes require API key (SHA-256 hashed, stored in R2). localStorage-first caching on client: don't fetch if cached and fresh.

**Tech Stack:**
- **Frontend:** Vite + Alpine.js 3 + Tailwind CSS v4 (same as current, refined)
- **Backend:** Cloudflare Pages Functions (same as Workers, deployed alongside frontend)
- **Storage:** Cloudflare R2 (S3-compatible, zero egress)
- **AI:** MiMo V2.5 Free via OpenCode Zen
- **Auth:** API keys (SHA-256 hashed) stored in `auth/keys.json` on R2
- **Cache:** Client-side localStorage (30 min TTL) + CDN edge (5 min TTL)

---

## Scope Tiers

| Tier | Feature | Notes |
|------|---------|-------|
| 🔴 P0 | Event list (public read) | GET /api/events → index.json |
| 🔴 P0 | Event detail + items (public read) | GET /api/events/[id] → {id}.json |
| 🔴 P0 | Create event (API key) | POST /api/events |
| 🔴 P0 | Update event (API key) | PATCH /api/events/[id] |
| 🔴 P0 | Delete event (maintainer) | DELETE /api/events/[id] |
| 🔴 P0 | Import schedule from image (API key) | POST /api/import → MiMo |
| 🔴 P0 | API key management (maintainer) | POST /api/keys |
| 🔴 P0 | localStorage-first caching | No fetch if cached and fresh |
| 🔴 P0 | Public reads (no auth) | GET endpoints open |
| 🟡 P1 | Image dedup (content hash) | Skip MiMo if same image already processed |
| 🟡 P1 | Import warning if event has items | Frontend confirm dialog |
| 🟢 P2 | Rate limiting per event | Max N imports per event |

---

## Project Structure (after migration)

```
spotpack/
├── index.html                  # SPA entry point (same as now)
├── src/                        # Frontend (same structure)
│   ├── main.js
│   ├── api.js                  # ← refactored: no Supabase, public reads
│   ├── store.js                # ← simplified: no refreshCounter
│   ├── lib/
│   │   ├── storage.js          # ← keep as-is
│   │   └── cache.js            # ← keep as-is, extend TTL to 30min
│   └── components/
│       ├── event-list.js       # ← don't fetch if !stale
│       ├── event-detail.js     # ← don't fetch if !stale
│       ├── create-event.js     # ← remove Supabase deps
│       ├── import-modal.js     # ← add warning if event has items
│       ├── my-agenda.js        # ← refactor: cached reads
│       └── api-key.js          # ← simplify: no env key concept
├── functions/                  # Cloudflare Pages Functions (NEW)
│   ├── api/
│   │   ├── events.js           # GET (list) + POST (create)
│   │   ├── events/
│   │   │   └── [id].js         # GET + PATCH + DELETE
│   │   │   └── [id]/
│   │   │       └── items.js         # POST (create item)
│   │   │       └── items/
│   │   │           └── [itemId].js  # PATCH + DELETE
│   │   ├── import.js           # POST (image → MiMo)
│   │   └── keys.js             # POST (create API key)
│   │   # Packs (Phase 2 — NOT built now, private membership)
│   │   # ├── packs.js           # GET (my packs) + POST (create)
│   │   # ├── packs/
│   │   # │   ├── join.js              # POST (join by code)
│   │   # │   └── [id].js              # GET + PATCH + DELETE
│   │   # │   └── [id]/
│   │   # │       ├── members/
│   │   # │       │   └── [userId].js  # DELETE
│   │   # │       ├── agenda.js        # GET
│   │   # │       └── attending.js     # POST (mark) + DELETE (unmark)
│   └── _shared/
│       ├── r2.js               # R2 read/write helpers
│       ├── auth.js             # API key verification
│       ├── response.js         # JSON response helpers
│       └── validation.js       # UUID, category, classification
├── wrangler.toml               # Cloudflare config (NEW)
├── public/
│   ├── sw.js                   # service worker (keep)
│   ├── manifest.webmanifest
│   └── favicon.svg
├── package.json
├── vite.config.js
├── tailwind.config.js (or CSS config)
├── AGENTS.md                   # ← updated
└── README.md
```

---

## R2 Data Structure

```
spotpack-bucket/
├── events/
│   ├── index.json              # Array of event summaries (no items)
│   └── {uuid}.json             # Full event + items array
├── images/
│   └── {eventId}/
│       └── {timestamp}_{shortUuid}.{ext}
└── auth/
    └── keys.json               # Array of { key_hash, role, label, created_at }
```

### events/index.json

```json
[
  {
    "id": "a1b2c3d4-...",
    "name": "FurCon 2026",
    "start_date": "2026-12-05",
    "end_date": "2026-12-08",
    "location": "CDMX",
    "item_count": 142
  }
]
```

### events/{uuid}.json

```json
{
  "event": {
    "id": "a1b2c3d4-...",
    "name": "FurCon 2026",
    "start_date": "2026-12-05",
    "end_date": "2026-12-08",
    "location": "CDMX",
    "created_at": "2026-12-01T10:00:00Z"
  },
  "items": [
    {
      "id": "x9f8e7d6-...",
      "day_date": "2026-12-05",
      "start_time": "10:00",
      "end_time": "11:30",
      "title": "Fursuit Building 101",
      "description": "Aprende a construir tu primer fursuit",
      "room": "Salón A",
      "category": "workshop",
      "classification": "general",
      "image_hash": "abc123..."  // SHA-256 of the source image that produced this
    }
  ]
}
```

### auth/keys.json

```json
[
  {
    "key_hash": "sha256:a1b2c3...",
    "role": "maintainer",
    "label": "Seed Key",
    "created_at": "2026-08-15T00:00:00Z"
  },
  {
    "key_hash": "sha256:d4e5f6...",
    "role": "general",
    "label": "Frontend App",
    "created_at": "2026-08-15T01:00:00Z"
  }
]
```

---

## API Endpoints (Pages Functions)

Base URL: `https://spotpack.pages.dev/api`

### General — Public (no auth)

| Method | Path | R2 Operation | Returns |
|--------|------|-------------|---------|
| GET | `/api/events` | Read `events/index.json` | `{ events: [...] }` |
| GET | `/api/events/{id}` | Read `events/{id}.json` | `{ event, items: [...] }` |

### Manage — Organizer (API key)

| Method | Path | Auth | R2 Operation | Returns |
|--------|------|------|-------------|---------|
| POST | `/api/events` | general+ | Write `events/{id}.json` + update index | `{ event }` |
| PATCH | `/api/events/{id}` | general+ | Read → modify → write `events/{id}.json` + update index | `{ event }` |
| DELETE | `/api/events/{id}` | maintainer | Delete `events/{id}.json` + update index | `{ deleted: true }` |
| POST | `/api/events/{id}/items` | general+ | Add item to `events/{id}.json` + update index | `{ item }` |
| PATCH | `/api/events/{id}/items/{itemId}` | general+ | Update item in `events/{id}.json` | `{ item }` |
| DELETE | `/api/events/{id}/items/{itemId}` | maintainer | Remove item from `events/{id}.json` + update index | `{ deleted: true }` |
| POST | `/api/import` | general+ | Upload to R2 → MiMo → write `events/{id}.json` + update index | `{ success, count, items }` |
| POST | `/api/keys` | maintainer | Read `auth/keys.json` → append → write | `{ key, role, label }` |

### Packs — Collaborative (Phase 2 — NOT built now)

See `docs/api.md` for full Pack endpoint reference.

### CORS & Headers

All endpoints return:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: x-api-key, content-type
Cache-Control: public, max-age=300, s-maxage=300  (for GET only)
```

---

## Frontend Changes

### 1. api.js — Remove Supabase, public reads

What changes:
- Remove `VITE_SUPABASE_PUBLISHABLE_KEY` and `apikey` header
- `x-api-key` only sent for mutations (POST/PATCH/DELETE)
- GET endpoints: no auth header
- API key from localStorage only (remove VITE_SPOTPACK_API_KEY env concept)
- Default URL: `/api` (same origin — Pages Functions)

```js
// Old: const BASE = () => readLocalString(KEYS.apiUrl, '') || 'http://127.0.0.1:54321/functions/v1';
// New: const BASE = () => readLocalString(KEYS.apiUrl, '') || '/api';
```

### 2. localStorage-first caching

Current behavior: fetch fresh data on every view, even if cached.

New behavior:
- `event-list.js` → check localStorage → if cached AND not stale → render, NO fetch
- `event-detail.js` → same
- `my-agenda.js` → same
- Only fetch if: no cache, cache is stale (expired), or user clicks "Actualizar"
- TTL: 30 minutes (schedules don't change during an event)

The `getSnapshot()` already returns `stale: true/false`. The fix is in the components:

```js
// event-list.js — new fetchEvents
async fetchEvents({ force = false } = {}) {
  this.loading = true;
  this.error = null;
  const cached = !force ? getSnapshot('events') : null;

  // If cached and fresh, don't fetch at all
  if (cached && !cached.stale) {
    this.applyResponse(cached.data, cached);
    this.loading = false;
    return;  // ← NO network request
  }

  // If cached but stale, show cached while fetching
  if (cached) {
    this.applyResponse(cached.data, cached);
    this.loading = false;
  }

  try {
    const data = await getEvents();
    setSnapshot('events', '', data);
    this.applyResponse(data);
  } catch (e) {
    if (!cached) this.error = e.message;
    else this.stale = true;
  } finally {
    this.loading = false;
  }
}
```

### 3. remove Supabase dependencies

- Remove `apikey` header from `api.js`
- Remove `VITE_SUPABASE_PUBLISHABLE_KEY` from `.env` / `.env.example`
- Remove `hasEnvKey` from `store.js`
- Remove Supabase publishable key concept from `api-key.js`

### 4. API key UI changes

- If no key in localStorage → show "⚡ Conectar" (same as now)
- If key present → show green dot, allow changing (same as now)
- Reads work without key (public)
- Writes fail with 401 if no key → show error toast

---

## Implementation Tasks

### Phase 1: Infra & Scaffold

---

### Task 1: Create Cloudflare project + R2 bucket

**Objective:** Set up Cloudflare Pages project and R2 bucket for the monorepo.

**Files:**
- Create: `wrangler.toml`
- Create: R2 bucket `spotpack-data`

**Steps:**

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. Create R2 bucket:
   ```bash
   wrangler r2 bucket create spotpack-data
   ```

3. Create `wrangler.toml`:
   ```toml
   name = "spotpack"
   pages_build_output_dir = "dist"
   compatibility_date = "2026-08-15"

   [[r2_buckets]]
   binding = "SPOTPACK_BUCKET"
   bucket_name = "spotpack-data"
   ```

4. Verify: `wrangler r2 bucket list` shows `spotpack-data`

---

### Task 2: Initialize auth/keys.json with seed maintainer key

**Objective:** Create the initial maintainer API key and store it in R2.

**Files:**
- Create: `auth/keys.json` → upload to R2
- Create: `scripts/seed-key.js` (one-time script)

**Steps:**

1. Generate a random 32-byte key:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   # Output: a1b2c3d4e5f6... (64 hex chars)
   ```

2. Compute SHA-256:
   ```bash
   node -e "console.log(require('crypto').createHash('sha256').update('a1b2c3...').digest('hex'))"
   ```

3. Create `auth/keys.json`:
   ```json
   [
     {
       "key_hash": "sha256:<hash>",
       "role": "maintainer",
       "label": "Seed Key",
       "created_at": "2026-08-15T00:00:00Z"
     }
   ]
   ```

4. Upload to R2:
   ```bash
   # Using wrangler or a script
   ```

5. Save the raw key securely (it's shown once)

**Verification:** Can read `auth/keys.json` from R2 via `wrangler r2 object get spotpack-data/auth/keys.json`

---

### Task 3: Create _shared modules

**Objective:** Build the shared utilities used by all Pages Functions.

**Files:**
- Create: `functions/_shared/response.js`
- Create: `functions/_shared/auth.js`
- Create: `functions/_shared/r2.js`
- Create: `functions/_shared/validation.js`

**Step 1: `functions/_shared/response.js`**

```js
// functions/_shared/response.js
export function ok(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      ...init.headers,
    },
    ...init,
  });
}

export function badRequest(message) {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

export function unauthorized() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

export function forbidden(requiredRole) {
  return new Response(JSON.stringify({ error: 'Forbidden', required_role: requiredRole }), {
    status: 403,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

export function notFound() {
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

export function serverError(message) {
  return new Response(JSON.stringify({ error: message }), {
    status: 500,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

export function corsPreflight() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'x-api-key, content-type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
```

**Step 2: `functions/_shared/auth.js`**

```js
// functions/_shared/auth.js
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

export async function getKeys(env) {
  const obj = await env.SPOTPACK_BUCKET.get('auth/keys.json');
  if (!obj) return [];
  const text = await obj.text();
  return JSON.parse(text);
}

export async function authorize(request, env, action, resource) {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey) return 'unauthorized';

  // Hash the incoming key
  const hash = await sha256(apiKey);
  const keyHash = `sha256:${hash}`;

  // Load keys from R2
  const keys = await getKeys(env);
  const found = keys.find(k => k.key_hash === keyHash);
  if (!found) return 'unauthorized';

  // Check permissions
  const rolePerms = PERMISSIONS[found.role];
  if (!rolePerms) return 'forbidden';
  if (!rolePerms[resource]?.includes(action)) return 'forbidden';

  return { role: found.role, label: found.label };
}

async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

**Step 3: `functions/_shared/r2.js`**

```js
// functions/_shared/r2.js
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
```

**Step 4: `functions/_shared/validation.js`**

```js
// functions/_shared/validation.js
export function isValidUUID(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

const VALID_CATEGORIES = ['panel', 'meetup', 'workshop', 'fursuit_games', 'dance', 'ceremony', 'other'];
const VALID_CLASSIFICATIONS = ['general', '+16', '+18', '+21'];

export function normalizeCategory(cat) {
  return VALID_CATEGORIES.includes(cat) ? cat : 'other';
}

export function normalizeClassification(cls) {
  return VALID_CLASSIFICATIONS.includes(cls) ? cls : 'general';
}
```

**Verification:** No syntax errors. Ready to use in endpoints.

---

### Phase 2: API Endpoints

---

### Task 4: GET /api/events — List events (public)

**Objective:** Return all events without schedule items.

**Files:**
- Create: `functions/api/events.js`

```js
// functions/api/events.js
import { corsPreflight, ok, serverError } from '../_shared/response.js';
import { listEvents } from '../_shared/r2.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return corsPreflight();

  try {
    const events = await listEvents(env);
    return ok({ events }, {
      headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
    });
  } catch (err) {
    return serverError(err.message);
  }
}
```

**Verification:** `GET /api/events` returns `{ events: [] }` (empty initially)

---

### Task 5: GET /api/events/[id] — Get event with items (public)

**Objective:** Return full event + schedule items.

**Files:**
- Create: `functions/api/events/[id].js`

```js
// functions/api/events/[id].js
import { corsPreflight, ok, notFound, serverError } from '../../_shared/response.js';
import { getEvent } from '../../_shared/r2.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  if (request.method === 'OPTIONS') return corsPreflight();

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
```

**Verification:** `GET /api/events/nonexistent` returns 404

---

### Task 6: POST /api/events — Create event (auth required)

**Objective:** Create a new event, store in R2, update index.

**Files:**
- Modify: `functions/api/events.js` (add POST handler)

```js
// Add to functions/api/events.js
import { authorize } from '../_shared/auth.js';
import { badRequest, unauthorized, forbidden } from '../_shared/response.js';
import { listEvents, saveEvent, saveEventIndex } from '../_shared/r2.js';
import { isValidUUID } from '../_shared/validation.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  const auth = await authorize(request, env, 'create', 'events');
  if (auth === 'unauthorized') return unauthorized();
  if (auth === 'forbidden') return forbidden('general');

  try {
    const body = await request.json();
    const { name, start_date, end_date, location } = body;
    if (!name || !start_date || !end_date) return badRequest('Missing required fields: name, start_date, end_date');

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
      id, name, start_date, end_date,
      location: location || '',
      item_count: 0,
    });
    await saveEventIndex(env, events);

    return ok({ event }, { status: 201 });
  } catch (err) {
    return serverError(err.message);
  }
}
```

**Verification:** `POST /api/events` with body → returns 201 with event. `GET /api/events` now shows it.

---

### Task 7: PATCH /api/events/[id] — Update event (auth required)

**Objective:** Update event metadata, keep items intact.

**Files:**
- Modify: `functions/api/events/[id].js` (add PATCH handler)

```js
export async function onRequestPatch(context) {
  const { request, env, params } = context;
  const auth = await authorize(request, env, 'update', 'events');
  if (auth === 'unauthorized') return unauthorized();
  if (auth === 'forbidden') return forbidden('general');

  try {
    const id = params.id;
    const data = await getEvent(env, id);
    if (!data) return notFound();

    const body = await request.json();
    data.event = { ...data.event, ...body, id }; // id is immutable

    await saveEvent(env, id, data);

    // Update index
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
```

**Verification:** `PATCH /api/events/{id}` with `{ "name": "Updated" }` → returns updated event

---

### Task 8: DELETE /api/events/[id] — Delete event (maintainer only)

**Objective:** Delete event JSON + remove from index.

**Files:**
- Modify: `functions/api/events/[id].js` (add DELETE handler)

```js
export async function onRequestDelete(context) {
  const { request, env, params } = context;
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
```

**Verification:** `DELETE /api/events/{id}` with maintainer key → 200. Without → 403.

---

### Task 8b: POST /api/events/[id]/items — Create activity manually (auth required)

**Objective:** Add a single schedule item to an event without AI import.

**Files:**
- Create: `functions/api/events/[id]/items.js`

```js
// functions/api/events/[id]/items.js
import { authorize } from '../../../_shared/auth.js';
import { corsPreflight, ok, badRequest, unauthorized, forbidden, notFound, serverError } from '../../../_shared/response.js';
import { getEvent, saveEvent, listEvents, saveEventIndex } from '../../../_shared/r2.js';
import { normalizeCategory, normalizeClassification } from '../../../_shared/validation.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  if (request.method === 'OPTIONS') return corsPreflight();

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

    // Update index
    const events = await listEvents(env);
    const idx = events.findIndex(e => e.id === id);
    if (idx !== -1) {
      events[idx].item_count = data.items.length;
      await saveEventIndex(env, events);
    }

    return ok({ item: newItem }, { status: 201 });
  } catch (err) {
    return serverError(err.message);
  }
}
```

**Verification:** `POST /api/events/{id}/items` with body → 201 with item.

---

### Task 8c: PATCH + DELETE /api/events/[id]/items/[itemId]

**Objective:** Update or delete a single schedule item.

**Files:**
- Create: `functions/api/events/[id]/items/[itemId].js`

```js
// functions/api/events/[id]/items/[itemId].js
import { authorize } from '../../../../_shared/auth.js';
import { corsPreflight, ok, badRequest, unauthorized, forbidden, notFound, serverError } from '../../../../_shared/response.js';
import { getEvent, saveEvent, listEvents, saveEventIndex } from '../../../../_shared/r2.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  if (request.method === 'OPTIONS') return corsPreflight();

  if (request.method === 'PATCH') return handlePatch(context);
  if (request.method === 'DELETE') return handleDelete(context);
  return badRequest('Method not allowed');
}

async function handlePatch({ request, env, params }) {
  const auth = await authorize(request, env, 'update', 'events');
  if (auth === 'unauthorized') return unauthorized();
  if (auth === 'forbidden') return forbidden('general');

  const data = await getEvent(env, params.id);
  if (!data) return notFound();

  const itemIdx = data.items.findIndex(i => i.id === params.itemId);
  if (itemIdx === -1) return notFound();

  const body = await request.json();
  data.items[itemIdx] = { ...data.items[itemIdx], ...body, id: params.itemId };
  await saveEvent(env, params.id, data);

  return ok({ item: data.items[itemIdx] });
}

async function handleDelete({ request, env, params }) {
  const auth = await authorize(request, env, 'delete', 'events');
  if (auth === 'unauthorized') return unauthorized();
  if (auth === 'forbidden') return forbidden('maintainer');

  const data = await getEvent(env, params.id);
  if (!data) return notFound();

  data.items = data.items.filter(i => i.id !== params.itemId);
  await saveEvent(env, params.id, data);

  const events = await listEvents(env);
  const idx = events.findIndex(e => e.id === params.id);
  if (idx !== -1) {
    events[idx].item_count = data.items.length;
    await saveEventIndex(env, events);
  }

  return ok({ deleted: true });
}
```

**Verification:** 
- `PATCH /api/events/{id}/items/{itemId}` → 200 with updated item
- `DELETE /api/events/{id}/items/{itemId}` with maintainer key → 200. Without → 403.

---

### Task 9: POST /api/import — Import schedule from image (auth required)

**Objective:** Upload image to R2, call MiMo V2.5, parse response, store items.

**Files:**
- Create: `functions/api/import.js`

```js
// functions/api/import.js
import { authorize } from '../_shared/auth.js';
import { corsPreflight, ok, badRequest, unauthorized, forbidden, notFound, serverError } from '../_shared/response.js';
import { getEvent, saveEvent, listEvents, saveEventIndex } from '../_shared/r2.js';
import { isValidUUID, normalizeCategory, normalizeClassification } from '../_shared/validation.js';

const VISION_MODEL = 'mimo-v2.5-free';
const OPENCODE_URL = 'https://opencode.ai/zen/v1/chat/completions';
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const SYSTEM_PROMPT = `You are a schedule extraction assistant...`; // Same as current

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return corsPreflight();
  if (request.method !== 'POST') return badRequest('Method not allowed');

  const auth = await authorize(request, env, 'import', 'schedules');
  if (auth === 'unauthorized') return unauthorized();
  if (auth === 'forbidden') return forbidden('general');

  try {
    const formData = await request.formData();
    const image = formData.get('image');
    const eventId = formData.get('event_id');

    if (!image || !eventId) return badRequest('Missing image or event_id');
    if (!isValidUUID(eventId)) return badRequest('event_id must be a valid UUID');
    if (!ALLOWED_TYPES.includes(image.type)) return badRequest(`Invalid file type: ${image.type}`);
    if (image.size > MAX_FILE_SIZE) return badRequest('File too large (max 5MB)');

    // Verify event exists
    const eventData = await getEvent(env, eventId);
    if (!eventData) return notFound();

    // Upload image to R2
    const ext = image.name.split('.').pop() || 'png';
    const storagePath = `images/${eventId}/${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;
    await env.SPOTPACK_BUCKET.put(storagePath, image.stream(), {
      httpMetadata: { contentType: image.type },
    });

    // Compute image hash for dedup
    const imageBuffer = await image.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', imageBuffer);
    const imageHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    // Check if this exact image was already processed for this event
    const existingItems = eventData.items || [];
    const alreadyProcessed = existingItems.some(item => item.image_hash === imageHash);
    if (alreadyProcessed) {
      return ok({ success: true, count: existingItems.length, items: existingItems, dedup: true });
    }

    // Call MiMo
    const base64 = btoa(
      Array.from(new Uint8Array(imageBuffer), b => String.fromCharCode(b)).join('')
    );
    const visionRes = await fetch(OPENCODE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENCODE_API_KEY || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.VISION_MODEL || VISION_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: [{ type: 'image_url', image_url: { url: `data:${image.type};base64,${base64}` } }] },
        ],
        temperature: 0.1,
        max_tokens: 12000,
      }),
    });

    if (!visionRes.ok) {
      return serverError(`Vision API error: ${visionRes.status}`);
    }

    const visionData = await visionRes.json();
    const rawContent = visionData.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    let parsedItems;
    try {
      const jsonMatch = rawContent.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/) || rawContent.match(/(\[[\s\S]*\])/);
      const jsonStr = jsonMatch ? jsonMatch[1] : rawContent;
      parsedItems = JSON.parse(jsonStr);
      if (!Array.isArray(parsedItems)) throw new Error('Not an array');
    } catch {
      return badRequest('Failed to parse vision response');
    }

    // Insert new items
    let count = 0;
    const newItems = [];
    for (const item of parsedItems) {
      const newItem = {
        id: crypto.randomUUID(),
        day_date: item.day_date,
        start_time: item.start_time,
        end_time: item.end_time,
        title: item.title,
        description: item.description || '',
        room: item.room || '',
        category: normalizeCategory(item.category || ''),
        classification: normalizeClassification(item.classification || ''),
        image_hash: imageHash,
      };
      newItems.push(newItem);
      count++;
    }

    // Merge with existing items
    eventData.items = [...existingItems, ...newItems];
    await saveEvent(env, eventId, eventData);

    // Update index item_count
    const events = await listEvents(env);
    const idx = events.findIndex(e => e.id === eventId);
    if (idx !== -1) {
      events[idx].item_count = eventData.items.length;
      await saveEventIndex(env, events);
    }

    return ok({ success: true, count, items: newItems });
  } catch (err) {
    return serverError(`Internal error: ${err.message}`);
  }
}
```

**Verification:** Upload a test schedule image → returns items. Same image again → `dedup: true`.

---

### Task 10: POST /api/keys — Create API key (maintainer only)

**Objective:** Generate a new API key, hash it, store in auth/keys.json.

**Files:**
- Create: `functions/api/keys.js`

```js
// functions/api/keys.js
import { authorize, getKeys } from '../_shared/auth.js';
import { corsPreflight, ok, badRequest, unauthorized, forbidden, serverError } from '../_shared/response.js';

async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return corsPreflight();

  const auth = await authorize(request, env, 'create', 'keys');
  if (auth === 'unauthorized') return unauthorized();
  if (auth === 'forbidden') return forbidden('maintainer');

  try {
    const body = await request.json();
    const { label } = body;
    if (!label) return badRequest('Missing label');

    const rawKey = `sk-sp-${generateKey()}`;
    const hash = await sha256(rawKey);

    const keys = await getKeys(env);
    keys.push({
      key_hash: `sha256:${hash}`,
      role: 'general',
      label,
      created_at: new Date().toISOString(),
    });

    await env.SPOTPACK_BUCKET.put('auth/keys.json', JSON.stringify(keys), {
      httpMetadata: { contentType: 'application/json' },
    });

    return ok({ key: rawKey, role: 'general', label }, { status: 201 });
  } catch (err) {
    return serverError(err.message);
  }
}
```

**Note:** The raw key is returned ONCE. The caller is responsible for saving it.

**Verification:** `POST /api/keys` with maintainer key → returns new key. Can use it for writes.

---

### Phase 3: Frontend Refactor

---

### Task 11: Refactor api.js — Public reads, remove Supabase

**Objective:** Remove Supabase dependencies, make reads public, keep auth only for writes.

**Files:**
- Modify: `src/api.js`

**Changes:**
1. Remove `VITE_SUPABASE_PUBLISHABLE_KEY` and `apikey` header
2. Default URL: `/api` instead of `http://127.0.0.1:54321/functions/v1`
3. `x-api-key` header only in functions that do mutations
4. Remove `VITE_SPOTPACK_API_KEY` env key concept
5. Remove `createApiKey` → handled by pages function now

**Verification:** `GET /api/events` works without auth header. `POST /api/events` fails without key.

---

### Task 12: Refactor event-list.js — localStorage-first

**Objective:** Don't fetch if cached and fresh. 30 min TTL.

**Files:**
- Modify: `src/components/event-list.js`

**Changes:**
- Change TTL default in `cache.js` from 5min to 30min (or pass 30min explicitly)
- In `fetchEvents()`: if cached AND `!cached.stale` → return early, no fetch
- Remove `$watch('$store.app.refreshCounter')` if not needed

**Verification:** 
1. Load page → fetches events
2. Reload page (within 30 min) → shows cached, no network request (check DevTools)
3. Click "Actualizar" → fetches fresh

---

### Task 13: Refactor event-detail.js — localStorage-first

**Objective:** Same localStorage-first pattern as event list.

**Files:**
- Modify: `src/components/event-detail.js`

**Changes:**
- In `loadEvent()`: if cached AND `!cached.stale` → return early
- Same stale-while-revalidate fallback

**Verification:** Navigate to event, reload → no network request within TTL.

---

### Task 14: Add import warning if event has items

**Objective:** Show confirm dialog before re-importing if event already has schedule items.

**Files:**
- Modify: `src/components/import-modal.js`

**Changes:**
- When modal opens (`open-import-modal` event), check if event has items
- If yes → show warning: "Este evento ya tiene 45 actividades. ¿Importar otra imagen?"
- If no → normal flow

```js
// In init()
window.addEventListener('open-import-modal', async (e) => {
  this.eventId = e.detail;
  // Check if event has items
  try {
    const { items } = await getEvent(this.eventId);
    this.hasExistingItems = items && items.length > 0;
    this.existingCount = items?.length || 0;
  } catch { this.hasExistingItems = false; }
  this.open = true;
});
```

**Verification:** Import once → open import modal again → shows warning with item count.

---

### Task 15: Simplify api-key component + store

**Objective:** Remove env key concept, show status for reads (always works) vs writes (needs key).

**Files:**
- Modify: `src/components/api-key.js`
- Modify: `src/store.js`
- Modify: `src/main.js`

**Changes:**
- Remove `hasEnvKey` from store
- API key is only for writes → label it "Clave de escritura"
- Green dot always shows for reads (they're public)
- If no key configured and user tries a write → show error "Necesitás configurar una API key"

**Verification:** 
1. No key configured → event list loads fine (public read)
2. Try to create event → error toast "Necesitás configurar una API key"
3. Enter key → create event works

---

### Phase 4: Cleanup & Deploy

---

### Task 16: Remove old backend and vestigial files

**Objective:** Clean up old Supabase backend and unused code.

**Files:**
- Delete: `backend/` directory (or archive it)
- Remove from `frontend/`: `.env.example` with `VITE_SUPABASE_*` vars
- Keep old repos for reference (don't delete from GitHub)

**Verification:** Project only has `frontend/` code (which becomes the root) + `functions/` + `wrangler.toml`

---

### Task 17: Deploy to Cloudflare Pages

**Objective:** Deploy the full project to Cloudflare Pages.

**Steps:**

1. Ensure `wrangler.toml` has correct config:
   ```toml
   name = "spotpack"
   pages_build_output_dir = "dist"
   compatibility_date = "2026-08-15"

   [[r2_buckets]]
   binding = "SPOTPACK_BUCKET"
   bucket_name = "spotpack-data"
   ```

2. Set secrets:
   ```bash
   wrangler secret put OPENCODE_API_KEY
   ```

3. Deploy:
   ```bash
   npm run build
   wrangler pages deploy dist
   ```

4. Or connect to GitHub for auto-deploy on push to `main`

**Verification:** 
1. `https://spotpack.pages.dev` loads the SPA
2. `https://spotpack.pages.dev/api/events` returns JSON
3. R2 bucket has `events/index.json`

---

### Task 18: Update AGENTS.md

**Objective:** Update AI context for the new architecture.

**Files:**
- Modify: `AGENTS.md` (write new one at project root)

**Content:** Document new stack (Cloudflare Pages + R2), architecture, API endpoints, caching strategy, auth system. Remove all Supabase references.

---

## Cache Strategy Summary

```
Layer 1: localStorage (client)   ← 30 min TTL, NO network if fresh
Layer 2: Cloudflare CDN (edge)   ← 5 min TTL, Cache-Control header
Layer 3: Pages Function (origin) ← reads R2, only hit on cache miss
Layer 4: R2 (storage)            ← JSON files, virtually unlimited reads
```

**Result for 5k users:**
- First visitor fetches from origin → cached in CDN + localStorage
- Next 4,999 visitors get it from CDN edge (no origin hit)
- Revisit within 30 min → localStorage (zero network)
- Peak load on R2: ~1 request per 30 minutes per unique event

---

## Migration Notes

- **Old repos preserved:** `dshagaa/spotpack-frontend` and `dshagaa/spotpack-backend` stay on GitHub as archive
- **New repo:** The monorepo goes to a new GitHub repo (name TBD) or replaces the frontend repo
- **Data migration:** No data to migrate — events are created fresh in R2
- **Auth migration:** Generate new seed maintainer key for production

---

## Risk & Open Questions

| Risk | Mitigation |
|------|-----------|
| Race condition on `index.json` writes | Writes are rare (only organizers). Use optimistic locking if needed. |
| MiMo API downtime | Cache last successful import. Frontend shows error + retry. |
| R2 latency on cold reads | Minimal (~50ms). CDN absorbs 99% of reads. |
| Pages Functions CPU limits (10ms) | All operations are I/O bound (R2 fetch). Well within limits. |
| API key stored in R2 (not DB) | Hashed + private bucket. Acceptable for this threat model. |

---

## P2 (Post-Production) — NOT built now

- Image dedup with content hash (included in import task as bonus)
- Edit event in UI (PATCH endpoint exists, UI TBD)
- Rate limiting per event
- Analytics (page views, imports, attendees)
- Scalar API docs for the Pages Functions endpoints
