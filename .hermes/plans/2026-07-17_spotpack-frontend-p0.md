# SpotPack Frontend — Implementation Plan (P0 MVP)

> **For Hermes:** Use this plan to build the frontend task-by-task.  
> Alpine.js + Vite + Tailwind CSS. Feature branches, PRs, conventional commits.

**Goal:** Rebuild SpotPack frontend as a modern SPA using Alpine.js + Vite + Tailwind CSS, consuming the Supabase Edge Functions backend. P0: list events, view event with schedule items, import schedule from image, create event, dark theme.

**Architecture:** Vite-bundled SPA with Alpine.js for reactivity. Single `index.html` entry, components as Alpine data objects. API layer (`api.js`) wraps fetch calls to Supabase Edge Functions with API key from localStorage. Tailwind CSS for styling with the jaguar color palette.

**Tech Stack:**
- **Runtime:** Vite (dev server + build)
- **Framework:** Alpine.js (lightweight reactivity, no build step needed at runtime)
- **CSS:** Tailwind CSS v4
- **Testing:** Vitest (unit) + Playwright (E2E)
- **API:** fetch nativo, x-api-key header
- **Deploy:** Vercel / Netlify (static site)

---

## Scope (P0 MVP)

| Feature | Endpoint | Priority |
|---------|----------|----------|
| List events (home) | GET /get-events | 🔴 P0 |
| View event with items by day | GET /get-event?id= | 🔴 P0 |
| Create event | POST /create-event | 🔴 P0 |
| Import schedule from image | POST /import-schedule | 🔴 P0 |
| API key input (localStorage) | — | 🔴 P0 |
| Dark theme (jaguar palette) | — | 🔴 P0 |

---

## Color Palette (Tailwind)

```js
// tailwind.config.js
colors: {
  bg:      '#1A1025',
  surface: '#2D1B3D',
  primary: '#E87D3E',  // jaguar orange
  danger:  '#F44336',  // +18 badge
  warning: '#FFC107',  // +16 badge
  success: '#4CAF50',  // general badge
}
```

---

## Project Structure

```
frontend/
├── index.html              # Entry point, Alpine app mount
├── src/
│   ├── main.js             # Alpine init, router
│   ├── api.js              # HTTP client (fetch wrapper)
│   ├── store.js            # Alpine store (global state)
│   ├── components/
│   │   ├── event-list.js   # Home page — list events
│   │   ├── event-detail.js # View event — items by day
│   │   ├── create-event.js # Modal/form — new event
│   │   ├── import-modal.js # Modal — upload image → AI
│   │   └── api-key.js      # API key input/save
│   ├── utils.js            # Date formatting, UUID, helpers
│   └── style.css           # Tailwind imports + custom
├── tests/
│   ├── api.test.js         # Vitest — api.js
│   ├── store.test.js       # Vitest — store.js
│   └── e2e/                # Playwright — full flows
├── tailwind.config.js
├── vite.config.js
├── package.json
├── AGENTS.md
├── README.md
└── .gitignore
```

---

## Implementation Tasks

### Task 1: Create GitHub repo + scaffold Vite project

**Objective:** Create `dshagaa/spotpack-frontend` repo, scaffold Vite + Alpine.js + Tailwind

**Files:**
- Create: entire scaffold

**Steps:**
1. `gh repo create dshagaa/spotpack-frontend --public`
2. Clone, `npm create vite@latest . -- --template vanilla`
3. `npm install alpinejs tailwindcss @tailwindcss/vite`
4. Configure `vite.config.js`, `tailwind.config.js`
5. Create `src/main.js` with Alpine init
6. Create `index.html` with Alpine mount
7. Test: `npm run dev` → page loads, Alpine works

**Verification:** `curl http://localhost:5173` returns HTML, `npm run build` succeeds

---

### Task 2: Configure Tailwind with jaguar palette

**Objective:** Set up Tailwind dark theme with SpotPack colors

**Files:**
- Create/Modify: `tailwind.config.js`, `src/style.css`

**Steps:**
1. Define custom colors in Tailwind config
2. Set dark background + text colors
3. Create sample component to verify
4. `npm run build` — verify CSS output

**Verification:** Sample div with `bg-bg text-white` renders dark purple background

---

### Task 3: Build API client (api.js)

**Objective:** fetch wrapper for all 7 backend endpoints

**Files:**
- Create: `src/api.js`
- Create: `tests/api.test.js`

**API:**
```js
// api.js
const BASE = localStorage.getItem('spotpack_api_url') || 'http://127.0.0.1:54321/functions/v1';

function authHeaders() {
  const key = localStorage.getItem('spotpack_api_key') || '';
  return { 'x-api-key': key, 'Content-Type': 'application/json' };
}

export async function getEvents() {
  const res = await fetch(`${BASE}/get-events`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getEvent(id) {
  const res = await fetch(`${BASE}/get-event?id=${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function createEvent(data) {
  const res = await fetch(`${BASE}/create-event`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function importSchedule(imageFile, eventId) {
  const fd = new FormData();
  fd.append('image', imageFile);
  fd.append('event_id', eventId);
  const res = await fetch(`${BASE}/import-schedule`, {
    method: 'POST',
    headers: { 'x-api-key': localStorage.getItem('spotpack_api_key') || '' },
    body: fd,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
```

**Tests (Vitest):**
- `getEvents()` calls correct URL, returns parsed JSON
- `getEvents()` throws on 401
- `createEvent()` sends correct body
- `importSchedule()` sends FormData with image

**Verification:** `npx vitest run` — 6+ tests pass

---

### Task 4: API key input component

**Objective:** Input field for x-api-key, stored in localStorage

**Files:**
- Create: `src/components/api-key.js`
- Modify: `index.html`, `src/main.js`

**Behavior:**
- If no key in localStorage → show input
- On save → store key, show "connected" indicator
- Key used by `api.js` via `localStorage.getItem('spotpack_api_key')`

**Verification:** Enter test key → page reloads → key persists

---

### Task 5: Event list (home page)

**Objective:** Fetch and display events in a card grid

**Files:**
- Create: `src/components/event-list.js`
- Modify: `index.html`, `src/main.js`

**Behavior:**
- On load: `getEvents()` → render cards
- Each card: name, date range, location, item count
- Click → navigate to event detail
- "Crear evento" button → create-event modal

**Tailwind:** Cards use `bg-surface`, hover effect, responsive grid

**Verification:** With Supabase running, events from FurCon 2026 show in cards

---

### Task 6: Create event modal

**Objective:** Modal form to create a new event

**Files:**
- Create: `src/components/create-event.js`
- Modify: `index.html`

**Behavior:**
- Form: name, start_date, end_date, location (optional)
- Submit → `createEvent()` → close modal → refresh list
- Validation: name required, dates valid
- Alpine `x-show` for modal toggle

**Verification:** Create "Test Con" → appears in event list

---

### Task 7: Event detail page with schedule items

**Objective:** View event with items grouped by day

**Files:**
- Create: `src/components/event-detail.js`
- Modify: `index.html`, `src/main.js`

**Behavior:**
- Fetch `getEvent(id)` → render event header + items
- Items grouped by `day_date`
- Each item: time, title, room, category, classification
- Classification badges: +16 (warning), +18 (danger), general (success)
- Back button → event list

**Tailwind:** Items as rows, days as sections with sticky headers

**Verification:** Navigate to FurCon 2026 → shows empty state (no items yet)

---

### Task 8: Import schedule modal + flow

**Objective:** Upload image → MiMo extracts → items appear in event

**Files:**
- Create: `src/components/import-modal.js`
- Modify: `index.html`

**Behavior:**
1. Click "Importar" on event detail → modal opens
2. File input (accept: image/png, image/jpeg, image/webp)
3. Preview selected image
4. Click "Enviar a MiMo" → `importSchedule(file, eventId)`
5. Show loading spinner while processing
6. On success → refresh event detail (items now visible)
7. On error → show error message (422 parse error, 502 API error, etc.)

**Alpine state:** `loading`, `error`, `preview`

**Verification:** Upload test image → items appear in event detail (requires local Supabase running)

---

### Task 9: Simple SPA router

**Objective:** Hash-based routing (no page reloads)

**Files:**
- Modify: `src/main.js`

**Behavior:**
- `#/` → event list (home)
- `#/event/{id}` → event detail
- Alpine `x-effect` watches `location.hash`
- Active component mounted in `#app`

**Verification:** Navigate `#/event/9ca318aa...` → loads event detail

---

### Task 10: Responsive layout + mobile menu

**Objective:** Mobile-first layout with navigation

**Files:**
- Modify: `index.html`, `src/style.css`

**Behavior:**
- Top bar: "SpotPack" logo + API key indicator
- Mobile: hamburger menu
- Desktop: sidebar navigation
- Bottom padding for mobile safe area

**Verification:** Test at 320px, 768px, 1024px widths

---

### Task 11: AGENTS.md + README.md

**Objective:** AI context and setup docs

**Files:**
- Create: `AGENTS.md`, `README.md`, `.env.example`

**AGENTS.md:** Architecture, stack, endpoints, color palette, rules (same pattern as backend)
**README.md:** Setup, `npm install && npm run dev`, env vars

**Verification:** Both files present, AI can understand project from AGENTS.md

---

### Task 12: E2E smoke test (Playwright)

**Objective:** One full flow test

**Files:**
- Create: `tests/e2e/smoke.spec.js`

**Test flow:**
1. Open app → see empty state or event list
2. Enter API key → connected
3. Create event → appears in list
4. Navigate to event → see empty items
5. Error state: bad API key → shows error

**Verification:** `npx playwright test` — smoke test passes

---

## Risk & Open Questions

| Risk | Mitigation |
|------|-----------|
| Alpine.js limits for SPA routing | Keep routing simple (hash-based), evaluate upgrade later |
| Tailwind v4 breaking changes | Pin version, test on install |
| Image upload timeout (60s Edge Function) | Show loading state, accept < 5MB images |
| localStorage API key exposure | General key only (read/write), maintainer key never stored |
| Vite dev proxy vs CORS | Use backend CORS headers (already in place) |

---

## P1 (Post-MVP) — NOT built now

- Edit event (update-event)
- Delete event (delete-event) — maintainer
- Mark items as attending
- Offline cache (localStorage)
- Filters / search

## P2 (Future) — NOT built now

- API key management UI (create-api-key)
- Drag & drop image upload
- Export schedule (PDF/ICS)
- PWA (service worker, offline)
