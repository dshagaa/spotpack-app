# SpotPack — Complete Session Dump

> 2026-07-14. Every decision, reference, dead end, and piece of knowledge from this session.

---

## 1. Project Identity

| Key | Value |
|-----|-------|
| **Name** | SpotPack (Spot = jaguar rosettes + Pack = wolf pack) |
| **Tagline** | "Tu agenda de furcon, sin complicaciones" |
| **Repo** | https://github.com/dshagaa/spotpack |
| **Maintainer** | @dshagaa |
| **Discord** | @dshagaa (ID 416616105319202817) |
| **Language** | Spanish UI, English code, casual/furry tone |
| **Plan file** | `.hermes/plans/2026-07-14_spotpack-mvp.md` |

### Name alternatives (rejected)
- PackSchedule, SpotPlan, PawPlanner, FurSchedule, TailTracker, ConPounce, DenPlan, WhiskerWatch, AnthroAgenda, FluffFolio, SnoutSchedule, CritterCalendar, RoarSchedule

---

## 2. Why This Exists

User (@dshagaa) goes to a furry convention. Needs a webapp to:
- Import the schedule (photo → structured data)
- Filter by classification (+18, general, etc.)
- Mark "voy" events → personal agenda
- Support multiple events/conventions with variable N days
- Future: group collaborative mode

---

## 3. Architecture

```
┌─────────────────────────────┐     ┌──────────────────────────────┐
│   Frontend (Vanilla JS SPA)  │     │   Backend (Python FastAPI)    │
│                              │     │                              │
│  index.html                 │     │  main.py                     │
│  js/app.js   (1400+ lines)  │HTTP │  POST /api/import  (GPT-4V)  │
│  js/api.js   (HTTP client)  │←───→│  GET /api/events/{id}        │
│  js/store.js (localStorage) │     │  data/schedules.json         │
│  js/models.js               │     │                              │
│  css/style.css              │     └──────────────────────────────┘
└─────────────────────────────┘
```

**Data flow:** One person uploads schedule image → GPT-4V extracts JSON → stored on server → everyone reads lightweight JSON. Frontend caches in localStorage for offline access.

**Storage keys:**
- `localStorage.spotpack_events` — JSON array of Event objects
- `localStorage.spotpack_settings` — `{ showAdultContent, activeEventId }`
- `localStorage.spotpack_schedule_cache` — `{ eventId: { items, cachedAt } }`
- `localStorage.spotpack_api_url` — backend URL (default `http://localhost:8000`)

---

## 4. Data Model

```
Event {
  id: string (uuid-like)
  name: string
  startDate: "YYYY-MM-DD"
  endDate: "YYYY-MM-DD"
  location: string
  days: Day[]
}

Day {
  date: "YYYY-MM-DD"
  label: "Sábado 18 julio"
  items: ScheduleItem[]
}

ScheduleItem {
  id: string
  dayDate: "YYYY-MM-DD"
  startTime: "HH:MM"
  endTime: "HH:MM"
  title: string
  description: string
  room: string
  category: Category
  classification: Classification
  attending: boolean
}
```

### Enums

**Classification:** `general`, `+16`, `+18`, `+21`
**Category:** `panel`, `meetup`, `workshop`, `fursuit_games`, `dance`, `ceremony`, `other`

### Badge colors

| Classification | Color | CSS class |
|---------------|-------|-----------|
| General | 🟢 #4CAF50 | `badge-general` |
| +16 | 🟡 #FFC107 | `badge-16` |
| +18 | 🔴 #F44336 | `badge-18` |
| +21 | 🟣 #9C27B0 | `badge-21` |

---

## 5. Color Palette (CSS Variables)

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | #1A1025 | Page background |
| `--surface` | #2D1B3D | Cards, modals |
| `--surface-hover` | #3A2548 | Hover states |
| `--primary` | #E87D3E | Jaguar orange — buttons, accents |
| `--primary-hover` | #F0965A | Button hover |
| `--accent` | #FFB347 | Secondary accent |
| `--text` | #FFF8E7 | Primary text |
| `--text-secondary` | #C4B8D4 | Secondary text |
| `--muted` | #8B7B9E | Muted/captions |
| `--border` | #3E2A52 | Borders |
| `--danger` | #F44336 | +18, errors |
| `--warning` | #FFC107 | +16, conflicts |
| `--success` | #4CAF50 | General |
| `--purple` | #9C27B0 | +21 |

---

## 6. Routes & Views

| Hash | View | Description |
|------|------|-------------|
| `#/` | EventList | List of events, create new, FAB |
| `#/event/:id` | EventSchedule | Schedule with day tabs, filters, search, import button |
| `#/agenda` | MyAgenda | Items with `attending=true` across all events |

### View states

**Home (`#/`):**
- Empty: "¡Bienvenido a SpotPack!" + "✨ Crear evento" + FAB "+"
- With events: Card list with name, dates, location, item count, delete button

**Schedule (`#/event/:id`):**
- Empty (no items): "No hay actividades para este día 🦊"
- With items: Table with columns Hora/Evento/Sala/Cat/Edad/🐾
- Filters: Category chips (Todas, Panel, Meetup, Taller, Fursuit Games, Baile, Ceremonia, Otro)
- Filters: Classification chips (Todas, General, +16, +18, +21)
- Search bar: Filter by title/description
- Day tabs: Auto-generated from event dates
- Buttons: "📸 Importar", "+ Agregar" (FAB)

**Agenda (`#/agenda`):**
- Empty: "Nada por aquí..." + link back to events
- With items: Grouped by event → date, each item with time, title, room, category badge, classification badge, remove button

---

## 7. OCR Journey (Complete)

### 7.1 — Tesseract.js (REJECTED)
Browser-side OCR using Tesseract.js v5 CDN. Parsed text line-by-line looking for `HH:MM - HH:MM Title Room`. Failed because:
- Real schedules are **tables** (rows = time, columns = rooms), not linear lists
- Room/time headers are in separate cells from event titles
- OCR merges adjacent cells: "Panel A Meet B Taller C" all on one line
- Cells can be merged (2h event spans multiple rows)

### 7.2 — Zone-based Canvas Selection (REJECTED)
User draws rectangles on the image to isolate each row. Canvas overlay with mousedown/move/up. OCR runs per-rectangle using Tesseract's `rectangle` option.
- Pros: Isolates text per row, no cell merging
- Cons: Tedious UX, still needs text parsing, bad for complex layouts
- Code removed from app.js but exists in git history

### 7.3 — GPT-4V via Backend (CURRENT)
User uploads image → `POST /api/import` → GPT-4V extracts table → returns JSON → preview table for review → save.

### 7.4 — sVLM Evaluation (DOCUMENTED, NOT BUILT)

Four small Vision Language Models were evaluated as local alternatives:

| Model | Strengths | Weaknesses | Verdict |
|-------|-----------|------------|---------|
| **SmolVLM** | Lightest multimodal, laptop-friendly | Weak on complex tables | Backup candidate |
| **PaddleOCR-VL** | Built for document/table analysis | Heavy setup (~500MB) | Strongest local option |
| **Moondream2** | Tiny, fast end-to-end | Limited accuracy on dense grids | Too weak |
| **LightOnOCR** | Fast, open-source | Text-only, no vision | Discarded early |

**Decision matrix:**

| Option | Offline | Accuracy | Setup | Cost | Chosen |
|--------|---------|----------|-------|------|--------|
| Cloud (GPT-4V) | ❌ | ✅ Perfect | ✅ 5 min | ~$0.01/img | ✅ |
| Local sVLM | ✅ | ⚠️ Medium | ❌ Heavy | ✅ Free | ❌ |
| Hybrid | ✅ | ✅ | ❌ Complex | ~$0.01/img | ❌ |

**Why GPT-4V won:** Backend runs on user's server (not phones). Internet dependency acceptable — upload happens before/during con via mobile data. One upload serves all users. sVLM kept as future option if API costs become problematic.

---

## 8. Architecture Decisions

| Decision | Chosen | Rejected | Why |
|----------|--------|----------|-----|
| **OCR engine** | GPT-4V via FastAPI | Tesseract.js, zone canvas, sVLM | Table extraction accuracy |
| **Frontend** | Vanilla JS ES Modules | React, Svelte | No build step needed |
| **Backend** | Python FastAPI | Node.js, Go | User has Python |
| **Storage (FE)** | localStorage | IndexedDB, SQLite | Simple, sufficient for text |
| **Storage (BE)** | JSON file (`data/schedules.json`) | PostgreSQL, SQLite | Single schedule, low volume |
| **Hosting** | User's domain + hosting | GitHub Pages, Vercel | User preference |
| **Theme** | Dark, jaguar palette | Light mode | Battery-friendly, furry vibe |
| **Build** | No build step | Webpack, Vite | ES Modules work natively |
| **Modals** | Custom in-app system | `<dialog>`, library | Control over styling |
| **Router** | Hash-based (`#/path`) | History API | Simpler, no server config |
| **CSS** | Plain CSS with variables | Tailwind, Sass | No tooling needed |
| **Logo** | SVG paw with jaguar spots | Emoji, font icon | Custom branding |

---

## 9. MVP Scope

### Phase 0-3: Core (all COMPLETED)
- ✅ Event CRUD (create, edit, delete) with N configurable days
- ✅ Schedule view with auto-generated day tabs
- ✅ Add/edit/delete schedule items manually
- ✅ Classification badges (General, +16, +18, +21)
- ✅ Toggle 🔞 to show/hide adult content
- ✅ "Mi Agenda" view (attending items only)
- ✅ Conflict detection (overlapping times → warning)
- ✅ Multiple events support

### Phase 4: Filters & Search (COMPLETED)
- ✅ Category filter chips
- ✅ Classification filter chips
- ✅ Text search with debounce

### Phase 5: OCR Import (COMPLETED — GPT-4V)
- ✅ Image upload with drag & drop
- ✅ Image preview
- ✅ "🤖 Enviar a GPT-4V" → backend processing
- ✅ Progress indicator
- ✅ Error handling with retry
- ✅ Editable preview table before save

### Phase 6: Polish (COMPLETED)
- ✅ Mobile-first responsive
- ✅ Dark theme with brand colors
- ✅ Toast notifications
- ✅ Favicon (🐾 emoji)

### Future (DOCUMENTED, NOT BUILT)
- Group collaborative mode ("Pack" system)
- Offline PWA
- Share link
- Notifications "quedan 10 min para X"

---

## 10. File Structure (Complete)

```
spotpack/
├── index.html                 ← Entry point, imports app.js as module
├── AGENTS.md                  ← AI agent context (for future Claude/Copilot/etc.)
├── SESSION.md                 ← This file
├── README.md                  ← Project overview
├── .gitignore                 ← Excludes .env, __pycache__, node_modules, backend/data/
├── assets/
│   └── paw.svg               ← Logo (SVG paw with jaguar spots)
├── css/
│   └── style.css             ← All styles, mobile-first, dark theme
├── js/
│   ├── app.js                ← ⚠️ MONOLITHIC SPA (1400+ lines)
│   ├── api.js                ← HTTP client for backend
│   ├── models.js             ← Factory functions + enums
│   ├── store.js              ← localStorage CRUD
│   ├── utils.js              ← Helpers (formatTime, escapeHtml, debounce, detectConflict)
│   ├── ocr/
│   │   ├── engine.js         ← VESTIGIAL: Tesseract.js wrapper (not used)
│   │   └── parser.js         ← VESTIGIAL: OCR text parser (not used)
│   └── views/
│       ├── events.js         ← VESTIGIAL: modular event list view
│       ├── schedule.js       ← VESTIGIAL: modular schedule view
│       ├── agenda.js         ← VESTIGIAL: modular agenda view
│       ├── item-form.js      ← VESTIGIAL: modular item form
│       └── ocr-import.js     ← VESTIGIAL: modular OCR import view
└── backend/
    ├── main.py               ← FastAPI server + GPT-4V integration
    ├── requirements.txt      ← fastapi, uvicorn, openai, pillow, python-dotenv
    └── .env.example          ← Template for OPENAI_API_KEY, VISION_MODEL, CORS_ORIGINS
```

### Critical note about js/app.js
This file is **monolithic** — it contains the router, all views, modals, handlers, and OCR flow in one file. It evolved through heavy patching during this session and reached 1895 lines at one point before garbage code was removed. The original modular architecture (`js/views/`, `js/ocr/`) was consolidated into this file by a subagent. The modular files remain for reference but are **NOT imported at runtime**.

**Do not refactor app.js lightly.** Test after every change. It has been through multiple corruption → reconstruction cycles.

---

## 11. Key Code Patterns

```js
// Shorthand selectors
$sel(selector)    // document.querySelector
$selAll(selector)  // document.querySelectorAll

// HTML escape
esc(str)          // prevents XSS in template literals

// Toast notifications
showToast(message, type)  // type: 'success', 'warning', 'error', ''

// Modal system
openModal(type, data)  // type: 'event-form', 'item-form', 'ocr-import', 'confirm-delete', 'event-detail'
closeModal()           // closes and re-renders

// Router
parseRoute()     // returns { view, eventId? }
renderView()     // main render function

// State object
state = {
  settings, events, route, activeDay,
  searchQuery, filterCategory, filterClassification,
  modal, apiOnline, importingSchedule
}

// API client (js/api.js)
importScheduleImage(file, eventId)  // POST /api/import
getEventSchedule(eventId)           // GET /api/events/:id
cacheSchedule(eventId, items)       // localStorage cache
getCachedSchedule(eventId)          // localStorage read
setApiBase(url)                     // change backend URL
```

---

## 12. Backend Details

### Endpoints
- `GET /api/health` — health check, returns `{ status: "ok", model: "gpt-4o" }`
- `GET /api/events/{event_id}` — get processed schedule, returns `{ items, source, imported_at, image_base64 }`
- `POST /api/import` — upload image (multipart form), returns `{ success, items, raw_response, error }`

### GPT-4V Prompt (critical)
The `SYSTEM_PROMPT` constant in `main.py` tells GPT-4V:
- Rows = time slots, columns = rooms
- Merge adjacent cells with same title
- 24h time format
- Classification detection from keywords ("18+", "NSFW", "Adult" → +18)
- Category detection ("Panel", "Workshop", "Fursuit Games", etc.)
- Return ONLY JSON array, no markdown
- Spanish + English support

### Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # add OPENAI_API_KEY=sk-...
python main.py        # runs on :8000
```

---

## 13. Environment

| Item | Value |
|------|-------|
| **OS** | Windows 10 |
| **Shell** | Git Bash (MSYS) — use POSIX syntax |
| **Python** | python3 = 3.10.11, python = 3.11.14 |
| **Node** | Available (for `node --check`) |
| **Package manager** | pip (python3.11), uv (installed) |
| **Live Server** | VS Code extension, port 5500 |
| **Backend (dev)** | port 8000 |
| **Hermes profile** | personal-projects |
| **Work dir** | C:\Users\Dshagaa\projects\spotpack |

---

## 14. GitHub Story

1. Initial push went to **work account** `apithy-edson-gomez/spotpack` (was already authenticated)
2. User corrected: wants personal account `dshagaa`
3. `gh auth login` with device code flow → authenticated as dshagaa
4. Created `dshagaa/spotpack`, pushed, removed work remote
5. Work repo `apithy-edson-gomez/spotpack` still exists — user will delete manually

---

## 15. Development Incidents

### app.js corruption
During the OCR → API refactor, a large `patch` operation nested new code inside `attachEventFormHandlers` instead of replacing at module level. This:
- Created duplicate `renderOcrModal` functions
- Removed `attachItemFormHandlers` closing braces
- Left 459 lines of garbage code

**Recovery:** Multiple surgical patches + Python script to identify and remove garbage lines. File went from 1895 → 1436 lines. Final verification: `node --check` passed, browser renders correctly.

### ES Modules + file://
Opening `index.html` directly via `file://` fails silently — CORS blocks module imports. **Must use HTTP server** (Live Server on :5500 or `python3 -m http.server`).

### 2 browser console errors
Two exceptions with empty messages appear on load. Likely from Live Server's injected live-reload script, not app code. Don't block functionality.

### Tesseract CDN removal
Tesseract.js was loaded via CDN in `index.html` (`<script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js">`). Removed when switching to GPT-4V backend. No more external JS dependencies.

---

## 16. Pending / TODO

- [ ] Set `OPENAI_API_KEY` in `backend/.env`
- [ ] Run `pip install -r backend/requirements.txt`
- [ ] Deploy backend to user's hosting + domain
- [ ] Update `localStorage.spotpack_api_url` to deployed backend URL
- [ ] Test OCR import with real convention schedule image
- [ ] Tune `SYSTEM_PROMPT` in `main.py` if extraction quality is off
- [ ] Delete work repo `apithy-edson-gomez/spotpack`
- [ ] Future: Group collaborative mode (see `.hermes/plans/2026-07-14_spotpack-mvp.md`)
- [ ] Future: sVLM fallback if API costs become an issue

---

## 17. User Preferences

- **Language:** Spanish (casual, social tone, self-deprecating humor, emojis)
- **Iteration style:** Small corrections, one thing at a time
- **Planning style:** Objectives → scope → MVP → build (methodical)
- **Stack preference:** Self-hosted, own domain, Python backend
- **GitHub:** Personal = dshagaa, Work = apithy-edson-gomez
- **Discord:** @dshagaa (ID 416616105319202817)
- **Interests:** Cosmere, anime, D&D, Pathfinder, board games, Balatro, furry (jaguar fursona)
- **Coffee makes them sleepy** ☕😴
