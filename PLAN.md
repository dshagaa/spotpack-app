# SpotPack Completion Plan

> **For Hermes:** Implement this plan task-by-task on feature branches. Keep the working tree clean between logical tasks and verify each acceptance criterion before moving on.

**Goal:** Deliver a production-ready, mobile-first event schedule app with public API-backed browsing, local attendee agendas, organizer schedule management, image import, offline support, and Cloudflare Pages deployment.

**Architecture:** Keep SvelteKit as the canonical frontend and Cloudflare Pages as the deployment target. Keep Pages Functions as the API boundary and Cloudflare R2 as the JSON/object store. The attendee experience remains anonymous and local-first for MVP; collaborative Packs are explicitly deferred.

**Tech Stack:** Svelte 5 runes, SvelteKit, Tailwind CSS v4, Vite, Cloudflare Pages Functions, Cloudflare R2, MiMo V2.5 through OpenCode Zen, pnpm, Vitest, and browser smoke tests.

---

## Current baseline

- Current branch: `feat/ux-theme-system`.
- `pnpm run build` currently passes.
- The current UI has static data in `src/lib/data/events.js`.
- `src/lib/components/EventDetail.svelte` has local attendance/tracking, schedule controls, and a schematic map.
- The previous API, cache, storage, PWA, and Cloudflare files are marked deleted in the working tree.
- `docs/api.md` and `docs/architecture.md` still describe the intended Pages Functions + R2 system.
- `docs/ux/` is a separate Figma/React prototype and is reference material, not the production entrypoint.

## Decisions to preserve

1. **Canonical UI:** use the SvelteKit app under `src/`; do not merge the Figma/React prototype into the runtime.
2. **Backend:** restore/adapt Pages Functions and R2 instead of replacing the documented storage model.
3. **Attendee identity:** use localStorage for MVP attendance and tracked sessions.
4. **Collaborative mode:** defer Packs until authentication and privacy requirements are approved.
5. **Package manager:** standardize on pnpm and remove the conflicting npm lockfile or explicitly choose another policy before implementation.
6. **Release target:** Cloudflare Pages with the Cloudflare SvelteKit adapter.

## Phase 0 — Reconcile the migration

### Task 0.1: Inventory and protect the current work

**Files:** `git status`, `git diff`, `docs/ux/`

- Separate intentional UX migration files from accidental deletions.
- Preserve the current SvelteKit UI on the feature branch.
- Do not commit generated `.svelte-kit/` output.

**Verification:** The intended source tree and the API source tree are identified before restoration.

### Task 0.2: Standardize repository hygiene

**Files:** `.gitignore`, `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`

- Ignore `.svelte-kit/` and other generated output.
- Pick pnpm as the only package manager and align lockfile policy.
- Keep root documentation trackable.
- Add scripts for `test`, `check`, and `preview` as their implementations land.

**Verification:** A clean build does not create unexpected untracked generated files.

### Task 0.3: Define the canonical data model

**Files:** `docs/api.md`, `docs/architecture.md`, `src/lib/data/` or a new mapper module

- Map API event fields to UI event fields.
- Map API schedule fields (`day_date`, `start_time`, `end_time`, `room`, `category`, `classification`) to the component model.
- Define behavior for missing descriptions, rooms, categories, and invalid dates.
- Keep the mapper pure and testable.

**Verification:** A representative API response renders without relying on fixture-only fields such as `speaker` or `track`.

## Phase 1 — Restore the public production path (P0)

### Task 1.1: Restore shared API infrastructure

**Files:** `functions/_middleware.js`, `functions/_shared/auth.js`, `functions/_shared/r2.js`, `functions/_shared/response.js`, `functions/_shared/validation.js`

- Restore the shared modules from the existing implementation/history.
- Verify public GET behavior, cache headers, CORS, validation, and error shapes.
- Keep API-key checks for write operations only as documented.

**Verification:** Local Pages Functions tests cover 200, 400, 401, 403, 404, and 500 responses.

### Task 1.2: Restore public event endpoints

**Files:** `functions/api/events.js`, `functions/api/events/[id].js`, `src/lib/api.js`

- Restore list and detail endpoints.
- Create a typed/validated frontend API client for list/detail requests.
- Add loading, empty, network-error, malformed-response, and not-found states.

**Verification:** The app renders a real event list and detail response using a local API or fixture server; no production screen depends on `src/lib/data/events.js`.

### Task 1.3: Restore client caching

**Files:** `src/lib/cache.js`, `src/lib/storage.js`, `src/lib/store.js`, `src/lib/api.js`

- Implement the documented localStorage snapshot cache and TTL.
- Render fresh cached data immediately and refresh stale data in the background.
- Provide explicit refresh and invalidation behavior.
- Keep local attendee/tracked-session state separate from server snapshots.

**Verification:** Cached data renders with the network disabled; stale data refreshes; mutations invalidate the affected event.

### Task 1.4: Make routes data-backed

**Files:** `src/routes/+page.svelte`, `src/routes/events/[id]/+page.js`, `src/routes/events/[id]/+page.svelte`, `src/lib/components/EventCard.svelte`, `src/lib/components/EventDetail.svelte`

- Replace static event lookup with API-backed loading.
- Preserve SSR-safe localStorage access through `onMount` or browser guards.
- Display an explicit 404 state for unknown event IDs.
- Keep the current UX styling while replacing fixture-only assumptions.

**Verification:** Changing the API response changes the rendered event list/detail without editing source fixtures.

## Phase 2 — Finish the attendee UX (P0)

### Task 2.1: Implement correct day selection

**Files:** `src/lib/components/EventDetail.svelte`, `src/lib/data/events.js` or the API mapper

- Derive available days from event data instead of hardcoding three days.
- Filter schedule results by selected day.
- Show the actual date for each day tab.
- Reset or preserve compatible filters when changing days.

**Verification:** A session from Day 2 never appears in Day 1 results; empty-day states are correct.

### Task 2.2: Align schedule fields and filters

**Files:** `src/lib/components/EventDetail.svelte`, `src/lib/components/MapView.svelte`, mapper/tests

- Render start/end times, room, category, classification, description, and optional speaker fields safely.
- Support the documented category and classification filters.
- Keep “all” and “my tracked” views correct after filtering.
- Ensure track colors have a fallback for unknown categories.

**Verification:** Filter combinations return the intersection expected by the user and never throw on missing data.

### Task 2.3: Harden local agenda state

**Files:** `src/lib/attendance.js`, `src/lib/tracking.js`, `src/routes/+page.svelte`, `src/lib/components/EventDetail.svelte`

- Remove stale event IDs when the current event index is known.
- Handle invalid or unavailable localStorage without breaking the page.
- Ensure toggling an event/session is idempotent and survives reload.
- Add accessible pressed/selected state and keyboard behavior.

**Verification:** Reloading preserves valid state; malformed localStorage values are ignored safely.

### Task 2.4: Implement the Group tab boundary

**Files:** `src/lib/components/EventDetail.svelte`, `docs/architecture.md`, `GOAL.md`

- For MVP, replace the placeholder with an honest “group mode is not available yet” state or remove the tab from the release UI.
- Do not present fixture members as synchronized users.
- Keep the Pack requirements documented for a later phase.

**Verification:** No UI claims that local fixture data represents real shared schedules.

### Task 2.5: Decide the map release scope

**Files:** `src/lib/components/MapView.svelte`, API model/docs

- Keep the schematic map only if it is clearly labeled as a venue guide generated from known rooms.
- Otherwise defer it from MVP until venue geometry/map data exists.
- Ensure selecting a location filters the correct activities and handles unknown rooms.

**Verification:** The map behavior matches the documented data guarantee; no fake “live guide” claim remains without live map data.

## Phase 3 — Organizer and import workflows (P1)

### Task 3.1: Restore organizer event CRUD

**Files:** `functions/api/events.js`, `functions/api/events/[id].js`, new organizer UI under `src/routes/` and `src/lib/components/`

- Restore create, update, and maintainer-only delete behavior.
- Build the smallest organizer form for event metadata.
- Store API keys only in a deliberate organizer-only local setting; never bundle secrets.
- Require confirmation for destructive deletion.

**Verification:** API authorization and validation are tested for general and maintainer roles.

### Task 3.2: Restore manual activity CRUD

**Files:** `functions/api/events/[id]/items.js`, `functions/api/events/[id]/items/[itemId].js`, organizer components

- Add and edit individual schedule items.
- Validate dates, times, category, and classification.
- Confirm destructive item deletion.

**Verification:** A manually edited item appears in the public event response after cache invalidation.

### Task 3.3: Restore image import

**Files:** `functions/api/import.js`, `scripts/seed-key.js`, `scripts/rotate-key.js`, organizer import UI

- Restore image type/size validation and SHA-256 deduplication.
- Restore MiMo request, structured response parsing, and failure handling.
- Store source images and extracted items according to the R2 layout.
- Show import progress, extraction errors, and a reviewable result.

**Verification:** A valid image produces validated items; duplicate images do not call MiMo again; malformed vision output fails safely.

### Task 3.4: Add import correction and publish flow

**Files:** organizer import components, event/item API client, cache invalidation modules

- Let organizers review and correct extracted items before publication.
- Make publish/update state explicit.
- Ensure public users do not see partial import state.

**Verification:** A correction is visible in the public schedule only after the organizer saves/publishes it.

## Phase 4 — Cloudflare, PWA, and offline behavior (P0/P1)

### Task 4.1: Configure Cloudflare deployment

**Files:** `svelte.config.js`, `package.json`, `vite.config.ts`, `wrangler.toml`, Cloudflare project settings

- Replace `adapter-auto` with the Cloudflare adapter.
- Restore the required R2 binding and environment configuration without committing secrets.
- Verify Pages Functions and SvelteKit routes coexist correctly.

**Verification:** `pnpm run build` produces a Cloudflare-compatible output with no adapter warning.

### Task 4.2: Restore installable PWA assets

**Files:** `static/manifest.webmanifest`, `static/sw.js`, `static/favicon.svg`, `src/app.html`

- Restore manifest metadata and icons.
- Cache the shell and static assets.
- Do not cache mutable API responses in the service worker; use the documented client cache.
- Provide an offline fallback state.

**Verification:** The app can be installed in a supported browser and previously loaded event data is readable offline.

### Task 4.3: Add production smoke checks

**Files:** `scripts/` or documented CI commands

- Verify event list, event detail, day filtering, local tracking, API failure, refresh, and offline behavior.
- Test at mobile and desktop viewport sizes.
- Confirm 404 routes and direct deep links work on Pages.

**Verification:** A repeatable smoke checklist passes against a preview deployment.

## Phase 5 — Quality gates and release

### Task 5.1: Add automated tests

**Files:** `tests/`, `src/**/*.test.js`, `package.json`

- Add Vitest and tests for API mapping, attendance, tracking, theme, cache, and filter derivation.
- Add endpoint tests for validation and authorization.
- Add component tests only for user-critical interaction paths.

**Verification:** `pnpm test` passes and covers the P0 acceptance criteria.

### Task 5.2: Add static checks

**Files:** `package.json`, `svelte.config.js`, `tsconfig.json` or `jsconfig.json`

- Add Svelte/TypeScript checks and a formatting/linting command if the chosen tool is compatible with the repo.
- Remove dead imports and fixture-only code from production paths.

**Verification:** `pnpm run check` and the formatter/linter pass.

### Task 5.3: Accessibility and UX review

**Files:** all production Svelte components, especially `EventDetail.svelte` and `ThemeToggle.svelte`

- Test keyboard navigation and visible focus.
- Confirm tab semantics and `aria-selected`/`aria-pressed` state.
- Check contrast in both themes.
- Support reduced motion and readable touch targets.

**Verification:** No critical accessibility issue remains in the release smoke test.

### Task 5.4: Release documentation

**Files:** `README.md`, `docs/api.md`, `docs/architecture.md`, `GOAL.md`, `PLAN.md`, `TODO.md`, deployment documentation

- Document install, local development, R2 bindings, API keys, import setup, deployment, and rollback.
- Update API and architecture docs to match the final code.
- Record deferred Packs work without implying it is implemented.

**Verification:** A new developer can run the project and understand which features are production-ready.

## Phase 6 — Packs / Group Mode (P2, separate project phase)

Do not start this phase until P0/P1 are released and requirements are approved.

- Choose authentication and identity model.
- Define private pack membership and invite-code rules.
- Choose persistent attendance storage.
- Design synchronization and conflict behavior.
- Add API endpoints and authorization tests.
- Replace the Group placeholder with real data.

## Validation commands

Use pnpm consistently:

```bash
pnpm install
pnpm run build
pnpm run check
pnpm test
pnpm run preview
```

For Cloudflare validation, add the project-specific Wrangler command after the adapter and bindings are restored. Do not claim deployment success until the preview URL and key flows have been tested.

## Definition of done

The MVP is complete only when:

- [ ] Public event data comes from the API, not fixtures.
- [ ] Day and schedule filters are correct against real API-shaped data.
- [ ] Local attendee/tracked-session state survives reload and handles invalid storage.
- [ ] Group mode is honestly deferred or fully implemented; no fake synchronization remains.
- [ ] Cloudflare build/deployment is configured without adapter warnings.
- [ ] PWA/offline behavior is verified.
- [ ] Tests, checks, accessibility review, and smoke tests pass.
- [ ] README, API, architecture, goal, plan, and todo documentation match the implementation.
