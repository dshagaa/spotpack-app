# SpotPack — AI Agent Context (Production)

> **Repo:** `dshagaa/spotpack`  
> **Stack:** Cloudflare Pages + Pages Functions + R2  
> **App:** Convention schedule SPA for 5k concurrent users

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│  Cloudflare Pages (CDN edge)                     │
│                                                  │
│  Static assets (Vite build)                      │
│  ├── index.html                                  │
│  ├── assets/*.js, *.css                          │
│  └── sw.js, manifest.webmanifest                 │
│                                                  │
│  Pages Functions (API)                           │
│  ├── /api/events        GET + POST              │
│  ├── /api/events/[id]   GET + PATCH + DELETE     │
│  ├── /api/import         POST (image → MiMo)     │
│  └── /api/keys           POST (create API key)   │
└──────────────┬───────────────────────────────────┘
               │ R2 API
┌──────────────▼───────────────────────────────────┐
│  Cloudflare R2 (S3-compatible storage)           │
│                                                  │
│  events/index.json     ← event summaries         │
│  events/{id}.json      ← full event + items      │
│  images/{eventId}/...  ← uploaded schedule images│
│  auth/keys.json        ← hashed API keys         │
└──────────────────────────────────────────────────┘
```

**Data flow:**
1. Organizer uploads schedule image → Pages Function → MiMo V2.5 → JSON items stored in R2
2. Attendee visits URL → Pages serves static SPA → SPA fetches `/api/events/{id}` → R2 → JSON
3. JSON cached in CDN (5min) + localStorage (30min) → near-zero server load

**No database.** Events and items live as JSON files in R2. No PostgreSQL, no SQLite, no migrations.

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Frontend** | Vite + Alpine.js 3 + Tailwind CSS v4 | Bundled locally, no CDN runtime deps |
| **API** | Cloudflare Pages Functions | Same as Workers, deployed with frontend |
| **Storage** | Cloudflare R2 | S3-compatible, zero egress fees |
| **AI** | MiMo V2.5 Free | Via OpenCode Zen (OpenAI-compatible) |
| **Auth** | API keys (SHA-256) | Stored in `auth/keys.json` on R2 |
| **Cache** | localStorage (30min) + CDN (5min) | Two-layer: client-first, edge fallback |
| **Testing** | Vitest (unit) + Playwright (E2E) | Frontend only |

---

## Project Structure

```
spotpack/
├── index.html                  # SPA entry point
├── src/
│   ├── main.js                 # Alpine init + router + service worker
│   ├── api.js                  # HTTP client (fetch /api/*)
│   ├── store.js                # Alpine store (UI state + attending)
│   ├── style.css               # Tailwind imports + custom
│   ├── lib/
│   │   ├── storage.js          # Defensive localStorage/sessionStorage
│   │   └── cache.js            # Snapshot cache with TTL
│   └── components/
│       ├── api-key.js          # API key input (writes only)
│       ├── event-list.js       # Home — event card grid
│       ├── event-detail.js     # Event detail — day/schedule views
│       ├── create-event.js     # Modal — new/edit event
│       ├── import-modal.js     # Modal — image → AI import
│       └── my-agenda.js        # Personal agenda from localStorage
├── functions/
│   ├── api/
│   │   ├── events.js           # GET (list) + POST (create)
│   │   ├── events/
│   │   │   └── [id].js         # GET + PATCH + DELETE
│   │   ├── import.js           # POST (image → MiMo → items)
│   │   └── keys.js             # POST (create API key)
│   └── _shared/
│       ├── auth.js             # API key verification
│       ├── r2.js               # R2 read/write helpers
│       ├── response.js         # JSON response + CORS helpers
│       └── validation.js       # UUID, category, classification
├── public/
│   ├── sw.js                   # Service worker (offline cache)
│   ├── manifest.webmanifest    # PWA manifest
│   └── favicon.svg
├── docs/
│   ├── architecture.md
│   └── api.md
├── wrangler.toml               # Cloudflare config
├── package.json
├── vite.config.js
├── GOAL.md                     # Vision & scope
├── PLAN.md                     # Implementation plan
├── AGENTS.md                   # This file
└── README.md
```

---

## Data Model

### Event (JSON in R2)

```json
{
  "event": {
    "id": "uuid",
    "name": "string",
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD",
    "location": "string",
    "created_at": "ISO8601"
  },
  "items": [
    {
      "id": "uuid",
      "day_date": "YYYY-MM-DD",
      "start_time": "HH:MM (24h)",
      "end_time": "HH:MM (24h)",
      "title": "string",
      "description": "string",
      "room": "string",
      "category": "panel | meetup | workshop | fursuit_games | dance | ceremony | other",
      "classification": "general | +16 | +18 | +21",
      "image_hash": "sha256 of source image"
    }
  ]
}
```

### Event Index (`events/index.json`)

```json
[
  {
    "id": "uuid",
    "name": "string",
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD",
    "location": "string",
    "item_count": 142
  }
]
```

### API Keys (`auth/keys.json`)

```json
[
  {
    "key_hash": "sha256:<hex>",
    "role": "general | maintainer",
    "label": "human-readable name",
    "created_at": "ISO8601"
  }
]
```

---

## Caching Strategy

```
Layer 1: localStorage (browser)  → 30 min TTL, zero network if fresh
Layer 2: CDN edge (Cloudflare)    → 5 min TTL, Cache-Control header
Layer 3: Pages Function (origin)  → reads R2, only on cache miss
Layer 4: R2 (storage)             → JSON files, unlimited reads
```

**Behavior:**
- First visit: fetch from origin → store in CDN + localStorage
- Subsequent visits (<30 min): localStorage, no network request
- Subsequent visits (>30 min, <5 min CDN): CDN edge, no origin hit
- User clicks "Actualizar": force fetch, bypass cache

---

## Color Palette (Tailwind)

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg` | #1A1025 | Page background |
| `--color-surface` | #2D1B3D | Cards, modals |
| `--color-primary` | #E87D3E | Jaguar orange — buttons, accents |
| `--color-danger` | #F44336 | +18 badge, errors, destructive actions |
| `--color-warning` | #FFC107 | +16 badge, conflicts |
| `--color-success` | #4CAF50 | General badge, connected indicator |

---

## API Endpoints

See `docs/api.md` for full reference. The API is split into three sections:

| Section | Auth | Purpose |
|---------|------|---------|
| **General** | None (public) | Read events and schedule items |
| **Manage** | API key | Create, edit, delete events/items. Import schedules. Manage keys. |
| **Packs** | User token (Fase 2) | Collaborative groups — not built yet |

| Method | Path | Section | Auth |
|--------|------|---------|------|
| GET | `/api/events` | General | none |
| GET | `/api/events/{id}` | General | none |
| POST | `/api/events` | Manage | general+ |
| PATCH | `/api/events/{id}` | Manage | general+ |
| DELETE | `/api/events/{id}` | Manage | maintainer |
| POST | `/api/events/{id}/items` | Manage | general+ |
| PATCH | `/api/events/{id}/items/{itemId}` | Manage | general+ |
| DELETE | `/api/events/{id}/items/{itemId}` | Manage | maintainer |
| POST | `/api/import` | Manage | general+ |
| POST | `/api/keys` | Manage | maintainer |

---

## Rules for AI Agents

1. **Feature branches only.** `git checkout -b feat/<name>` from `dev`. Never work on `main` directly.
2. **Conventional branch names:** `feat/`, `fix/`, `docs/`, `test/`, `chore/`.
3. **Conventional commits:** `feat(scope): msg`, `fix(scope):`, `docs:`, `test:`, `style:`, `chore:`.
4. **Merge via PR.** Push branch → `gh pr create` → `gh pr merge --merge --delete-branch`. Never direct merge.
5. **Commit before switching context.** Small, atomic, signed.
6. **Run `npx vitest run` before commit.** All tests must pass.
7. **Run `npm run build` before commit.** Build must succeed.
8. **Alpine components follow init() pattern.** Loading → error → data states.
9. **Dark theme only.** No light mode toggle.
10. **Spanish UI, English code.** User-facing text in Spanish, code/comments in English.
11. **Mobile-first.** Test at 320-428px.
12. **No CDN dependencies.** Everything bundled through Vite.
13. **localStorage-first reads.** Don't fetch from API if local cache is fresh.
14. **Confirmation dialogs** on all destructive actions (z-50 overlay, Escape closes).
15. **Delete buttons at top-right** of cards, not centered or bottom.
16. **No database queries.** Data lives in R2 as JSON. No SQL, no ORM, no migrations.
17. **API keys never log or expose.** Only SHA-256 hashes in storage. Raw keys returned once on creation.
18. **All GET endpoints public.** No auth required for reads.

---

## Prototype Reference

The original prototype (Supabase + vanilla JS) is archived in `prototype/`. Use for reference only — the production version is a greenfield rebuild following this AGENTS.md and `PLAN.md`.
