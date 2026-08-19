# SpotPack Architecture

> How the pieces fit together. Read this before making architectural decisions.

---

## Overview

SpotPack is a **zero-database, JSON-on-S3** web application. Events and schedule items are stored as JSON files in Cloudflare R2. A thin API layer (Pages Functions) handles reads and writes. The frontend is a Vite-bundled SPA using Svelte 5 for reactivity.

---

## System Diagram

```
                          USERS (5k concurrent)
                               │
                               │ HTTPS
                               ▼
┌──────────────────────────────────────────────────────────┐
│                   CLOUDFLARE PAGES                       │
│                                                          │
│  ┌─────────────────────┐    ┌────────────────────────┐  │
│  │  Static Assets (CDN) │    │  Pages Functions (API)  │  │
│  │                      │    │                        │  │
│  │  index.html          │    │  GET  /api/events      │  │
│  │  assets/*.js         │    │  GET  /api/events/:id  │  │
│  │  assets/*.css        │    │  POST /api/events      │  │
│  │  sw.js               │    │  PATCH /api/events/:id │  │
│  │  manifest.webmanifest│    │  DELETE /api/events/:id│  │
│  │  favicon.svg         │    │  POST /api/import      │  │
│  └─────────────────────┘    │  POST /api/keys         │  │
│                              └───────────┬────────────┘  │
└──────────────────────────────────────────┼───────────────┘
                                           │
                              ┌────────────▼────────────┐
                              │    CLOUDFLARE R2         │
                              │                          │
                              │  events/index.json       │
                              │  events/{uuid}.json      │
                              │  images/{event_id}/*     │
                              │  auth/keys.json          │
                              └──────────────────────────┘
                                           │
                              ┌────────────▼────────────┐
                              │    OPENCODE ZEN          │
                              │    MiMo V2.5 Free        │
                              │    (vision API)          │
                              └──────────────────────────┘
```

---

## Layer 1: Frontend (SPA)

**Tech:** Vite 6 + Svelte 5 + Tailwind CSS v4

**Key decisions:**
- **Svelte 5 runes.** `$state()`, `$derived()`, `$effect()`, `$props()` provide compile-time reactivity.
- **No CDN imports.** Svelte and Tailwind are bundled into the Vite output.
- **Hash-free routing.** Path-based SPA router using `history.pushState()` and `@popstate.window`.
- **System fonts only.** No font downloads.

**Components:**
- `EventList.svelte` — Home page, card grid of events
- `EventDetail.svelte` — Event detail with day groups, search, category/room/+18 filters, schedule grid
- `MyAgenda.svelte` — Personal agenda from localStorage attending state
- Planned: `CreateEvent.svelte` — Modal form for new/edit event
- Planned: `ImportModal.svelte` — Image upload → AI processing
- Planned: `ApiKey.svelte` — API key input for write operations

**State management:**
- Module-level store (`src/lib/store.js`) — Attending state in localStorage
- `src/lib/cache.js` — Snapshot cache with 30min TTL (localStorage)
- `svelte-spa-router` — Client-side path-based routing
- Per-component `$state()` — UI state: route, selected day, search, category, room, adult filter

---

## Layer 2: API (Pages Functions)

**Tech:** Cloudflare Pages Functions (Workers-compatible, same origin as frontend)

**Key decisions:**
- **Same origin.** Functions deployed alongside static assets — no CORS headaches for same-domain requests.
- **Stateless.** Each request is independent. State lives in R2.
- **Async auth.** API key verification reads `auth/keys.json` from R2, hashes the incoming key with SHA-256, compares.

**Shared modules (`functions/_shared/`):**

| Module | Responsibility |
|--------|---------------|
| `auth.js` | `authorize(request, env, action, resource)` — returns `{ role }` or error Response |
| `r2.js` | `readJSON()`, `writeJSON()`, `deleteKey()`, `listEvents()`, `getEvent()`, `saveEvent()` |
| `response.js` | `ok()`, `badRequest()`, `unauthorized()`, `forbidden()`, `notFound()`, `serverError()`, `corsPreflight()` |
| `validation.js` | `isValidUUID()`, `normalizeCategory()`, `normalizeClassification()` |

**Endpoint routing:**

Pages Functions use file-based routing:

```
# General (public)
functions/api/events.js              → /api/events              GET
functions/api/events/[id].js         → /api/events/:id          GET

# Manage (API key)
functions/api/events.js              → /api/events              POST
functions/api/events/[id].js         → /api/events/:id          PATCH, DELETE
functions/api/events/[id]/items.js   → /api/events/:id/items    POST
functions/api/events/[id]/items/[itemId].js → /api/events/:id/items/:itemId  PATCH, DELETE
functions/api/import.js              → /api/import              POST
functions/api/keys.js                → /api/keys                POST

# Packs (Phase 2 — not built, private membership)
# functions/api/packs.js             → /api/packs               GET (my packs), POST (create)
# functions/api/packs/join.js        → /api/packs/join?pack-code=... POST (join by code)
# functions/api/packs/[id]/js        → /api/packs/:id           GET, PATCH, DELETE
# functions/api/packs/[id]/import-agenda.js → /api/packs/:id/import-agenda POST (bulk import attending)
# functions/api/packs/[id]/members/[userId].js → /api/packs/:id/members/:userId  DELETE
# functions/api/packs/[id]/agenda.js → /api/packs/:id/agenda    GET
# functions/api/packs/[id]/attending.js → /api/packs/:id/attending POST (mark), DELETE (unmark)
```

---

## Layer 3: Storage (R2)

**Tech:** Cloudflare R2 (S3-compatible object storage)

**Data structure:**

```
spotpack-data/
├── events/
│   ├── index.json              # Array of { id, name, start_date, end_date, location, item_count }
│   └── {uuid}.json             # { event: {...}, items: [...] }
├── images/
│   └── {event_id}/
│       └── {timestamp}_{short_uuid}.{ext}
└── auth/
    └── keys.json               # Array of { key_hash: "sha256:...", role, label, created_at }
```

**Why R2 instead of a database:**
- **Unlimited reads.** No connection pools, no query limits.
- **Zero egress.** Reading data doesn't cost bandwidth.
- **CDN integration.** R2 sits behind Cloudflare's edge — reads are cached automatically.
- **Simple mental model.** Events are JSON files. No SQL, no ORM, no migrations.

**Trade-off:** No transactions, no JOINs, no ACID. Writes to `index.json` can race. Mitigated by:
- Writes are rare (only organizers, ~1-2 per event)
- `index.json` is rebuilt from `events/` listing if inconsistent

---

## Layer 4: AI (MiMo V2.5)

**Tech:** MiMo V2.5 Free via OpenCode Zen (`https://opencode.ai/zen/v1`)

**Flow:**
1. Image uploaded as multipart form → Pages Function
2. Image stored in R2 (`images/{event_id}/...`)
3. Image converted to base64, sent to MiMo with system prompt
4. Response parsed as JSON array of schedule items
5. Items merged into `events/{id}.json`
6. `events/index.json` updated with new `item_count`

**Image dedup:** SHA-256 of image bytes stored on each item as `image_hash`. If the same image is imported again, the function returns existing items without calling MiMo.

---

## Caching Strategy

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ localStorage │ ──▶ │  CDN edge    │ ──▶ │ Pages Func   │ ──▶ │     R2       │
│  (30 min)    │     │  (5 min)     │     │  (origin)    │     │  (source)    │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
    Device              Cloudflare          Cloudflare          Cloudflare
```

**Cache headers (GET responses):**
```
Cache-Control: public, max-age=300, s-maxage=300
Access-Control-Allow-Origin: *
```

**localStorage behavior:**
- On component init → check `getSnapshot('event', id)` 
- If cached AND `!stale` → render immediately, **no network request**
- If cached but `stale` → render cached, fetch fresh in background
- If no cache → fetch from API
- User clicks "Actualizar" → force fetch, bypass cache

**Cache invalidation:**
- Mutations (create/update/delete/import) → `invalidateEventCache(id)` 
- This clears the localStorage snapshot for that event
- CDN cache expires naturally (5min TTL)

---

## Auth System

```
Request with x-api-key
    │
    ▼
SHA-256(key) → "sha256:abc123..."
    │
    ▼
Read auth/keys.json from R2
    │
    ▼
Find matching key_hash
    │
    ▼
Check permissions matrix:
  general:    events[read,create,update], schedules[import]
  maintainer: events[*], schedules[import], keys[create]
    │
    ▼
Return { role, label } or 401/403
```

**Roles:**

| Role | Created by | Can do |
|------|-----------|--------|
| `general` | Maintainer (via `/api/keys`) | Read, create, update events. Import schedules. |
| `maintainer` | Seed key + `/api/keys` | Everything: delete events, manage keys. |

**Seed key:** First maintainer key created manually. Hash stored in `auth/keys.json`. Raw key shown once.

---

## Offline & PWA

- **Service worker** (`public/sw.js`): Caches same-origin static assets (`index.html`, JS, CSS) and offline fallback page.
- **API responses NOT cached by SW.** localStorage handles data caching.
- **PWA manifest:** Installable on mobile home screen.
- **Offline behavior:** Cached event data renders from localStorage. Network-dependent features (import, create) show "Sin conexión" indicator.

---

## Scale & Performance

| Metric | Target | How |
|--------|--------|-----|
| Concurrent users | 5,000 | CDN absorbs 99% of reads |
| Page load (cached) | < 100ms | localStorage, zero network |
| Page load (first visit) | < 2s | CDN edge → R2 (~50ms) |
| API origin hits | < 1/min per event | CDN cache (5min) |
| Monthly cost | $0 | Cloudflare free tier |

---

## Security

- **API keys never exposed:** Only SHA-256 hashes in storage and logs.
- **No user accounts:** Attendees are anonymous. No PII collected.
- **CORS open:** All endpoints allow any origin (public schedule app).
- **No secrets in frontend:** API key stored in browser localStorage only. No env keys in client code.
- **Image uploads:** Validated for type (PNG/JPEG/WebP) and size (< 5MB).

---

## Future: Group Mode

Documented in [GOAL.md](../GOAL.md#group-mode-fase-2). Not built. Requires:
- User identity (auth)
- Centralized attending state (not localStorage)
- Real-time sync (WebSocket or Durable Objects)

The current architecture can accommodate this by adding a D1 database or Durable Objects layer without changing the event storage (R2).
