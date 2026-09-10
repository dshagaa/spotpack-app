# SpotPack TODO

Legend: `[x]` verified, `[~]` started/partial, `[ ]` not done.

## Current baseline

- [x] `pnpm run build` passes.
- [~] SvelteKit UX migration exists under `src/`.
- [~] Local attendance and tracked-session persistence exists.
- [~] Schedule, theme, and schematic map UI exists.
- [ ] Production API is connected to the SvelteKit UI.
- [ ] Cloudflare deployment is configured for SvelteKit.
- [ ] Automated test and check commands exist.

## P0 — Public attendee MVP

### Repository and architecture

- [ ] Review the migration diff and classify intentional vs accidental deletions.
- [ ] Keep SvelteKit as the canonical runtime; keep `docs/ux/` as reference only.
- [ ] Standardize on pnpm.
- [ ] Remove the conflicting npm lockfile or document why both are required.
- [ ] Ignore `.svelte-kit/` and generated output.
- [ ] Define and test the API-to-UI event/schedule mapper.

### API and data

- [ ] Restore `functions/_middleware.js`.
- [ ] Restore `functions/_shared/auth.js`.
- [ ] Restore `functions/_shared/r2.js`.
- [ ] Restore `functions/_shared/response.js`.
- [ ] Restore `functions/_shared/validation.js`.
- [ ] Restore `functions/api/events.js`.
- [ ] Restore `functions/api/events/[id].js`.
- [ ] Restore the frontend API client.
- [ ] Add loading, empty, error, and not-found states.
- [ ] Add local snapshot caching with TTL and invalidation.
- [ ] Replace static event lookup in `src/routes/events/[id]/+page.js`.
- [ ] Remove production dependence on `src/lib/data/events.js` fixtures.

### Schedule UX

- [ ] Derive day tabs from real event dates.
- [ ] Filter activities by selected day.
- [ ] Display correct date labels for every day.
- [ ] Map API fields to activity title, time, room, category, classification, description, and optional speaker.
- [ ] Add category/track filtering with an unknown-category fallback.
- [ ] Keep “all activities” and “my tracked” filters composable.
- [ ] Verify empty states for days and filters.
- [ ] Verify tracked activities survive reload.
- [ ] Verify attendance survives reload.
- [ ] Handle malformed localStorage safely.
- [ ] Remove stale attendance IDs when event data is refreshed.

### Group and map honesty

- [ ] Replace the Group placeholder with an explicit “not available yet” state, or remove it from MVP navigation.
- [ ] Stop presenting fixture members as real synchronized users.
- [ ] Decide whether the schematic map is MVP or deferred.
- [ ] Remove “Live guide” wording unless live venue data exists.
- [ ] Ensure map locations handle unknown room names.

## P1 — Organizer release

- [ ] Restore event create/update/delete API behavior.
- [ ] Build organizer event metadata form.
- [ ] Add API-key storage UX without exposing secrets in the bundle.
- [ ] Add maintainer confirmation before event deletion.
- [ ] Restore manual activity create/update/delete endpoints.
- [ ] Build manual activity editor.
- [ ] Validate dates, times, categories, and classifications.
- [ ] Restore image import endpoint.
- [ ] Restore image type and size validation.
- [ ] Restore SHA-256 image deduplication.
- [ ] Restore MiMo extraction and structured parsing.
- [ ] Add import progress and failure states.
- [ ] Add extracted-item review before publishing.
- [ ] Add cache invalidation after publish.
- [ ] Restore API-key creation and rotation scripts.
- [ ] Verify raw API keys are shown only once.

## P0/P1 — Deployment and offline support

- [ ] Install/configure `@sveltejs/adapter-cloudflare`.
- [ ] Remove the `adapter-auto` production warning.
- [ ] Restore `wrangler.toml` or replace it with the final Cloudflare configuration.
- [ ] Configure the R2 binding without committing secrets.
- [ ] Verify Pages Functions and SvelteKit routes together.
- [ ] Restore `static/manifest.webmanifest`.
- [ ] Restore/implement `static/sw.js`.
- [ ] Restore favicon and install icons.
- [ ] Cache only shell/static assets in the service worker.
- [ ] Keep API response caching in the documented client cache.
- [ ] Verify offline rendering for previously loaded events.
- [ ] Verify direct deep links on Cloudflare Pages.
- [ ] Run a preview deployment smoke test.

## Quality gates

- [ ] Add Vitest.
- [ ] Test attendance helpers.
- [ ] Test tracking helpers.
- [ ] Test theme behavior.
- [ ] Test cache behavior.
- [ ] Test API-to-UI mapping.
- [ ] Test schedule day/filter derivation.
- [ ] Test API validation and authorization.
- [ ] Add `pnpm test`.
- [ ] Add `pnpm run check`.
- [ ] Add formatting/linting if compatible with the chosen SvelteKit setup.
- [ ] Test keyboard navigation.
- [ ] Test visible focus states.
- [ ] Test tab semantics and pressed states.
- [ ] Test light, dark, and system themes.
- [ ] Test reduced-motion behavior.
- [ ] Test phone and desktop viewport sizes.
- [ ] Test 404, API error, empty, and offline states.

## Documentation and release

- [ ] Update `README.md` with pnpm setup and deployment instructions.
- [ ] Update `docs/api.md` to match implemented endpoints.
- [ ] Update `docs/architecture.md` to match the final SvelteKit/Cloudflare architecture.
- [ ] Document R2 bindings and required environment/configuration values.
- [ ] Document API-key bootstrap and rotation.
- [ ] Document import review/publish behavior.
- [ ] Keep `GOAL.md`, `PLAN.md`, and `TODO.md` aligned with implementation.
- [ ] Add a release smoke-test checklist.
- [ ] Create a PR from a feature branch before merging.
- [ ] Verify CI/build/test results before merge.

## P2 — Packs / Group Mode, deferred

- [ ] Approve identity/authentication model.
- [ ] Define private pack membership and invite-code rules.
- [ ] Choose persistent attendance storage.
- [ ] Define synchronization and conflict behavior.
- [ ] Design and test Pack endpoints.
- [ ] Implement real Group UI only after backend support exists.
- [ ] Add privacy, authorization, and data deletion tests.

## Definition of done

- [ ] Public events and details use real API data.
- [ ] Schedule day/filter behavior is correct.
- [ ] Local agenda works across reloads and bad storage data.
- [ ] No fake collaborative behavior is presented as real.
- [ ] Cloudflare deployment is configured and smoke-tested.
- [ ] Offline/PWA behavior is verified.
- [ ] Tests and static checks pass.
- [ ] Documentation matches the shipped system.
