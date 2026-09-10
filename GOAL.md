# SpotPack — Goals & Vision

## Problem → Solution

Convention schedules are usually published as images or static documents. Attendees need a fast way to discover events, browse sessions by day and track, build a personal agenda, and use that agenda while moving through the venue.

SpotPack turns organizer-provided schedule data into a mobile-first web app. Organizers manage event data and import schedule images; attendees access public schedules and keep their personal selections locally on their device.

## Primary users

| User | Need | Frequency |
|---|---|---|
| Attendee | Find events, browse schedules, save sessions, use the agenda offline | During event preparation and attendance |
| Organizer | Create and update an event, import a schedule image, correct extracted sessions | Before and during an event |
| Maintainer | Manage API keys and remove invalid event data | Occasional administration |

## Product principles

1. **Useful without an account.** Public schedule browsing must not require registration.
2. **Mobile first.** The primary experience is a narrow phone viewport, with a centered readable layout on larger screens.
3. **Local-first attendee state.** Event attendance and tracked activities are stored locally until collaborative accounts are intentionally added.
4. **Human-correctable data.** AI extraction accelerates imports but never becomes the only way to correct schedule data.
5. **Simple storage.** Keep public event data in JSON on Cloudflare R2; avoid a database until the product has a demonstrated relational need.
6. **Accessible by default.** Keyboard navigation, visible focus, semantic controls, readable contrast, and reduced-motion support are release requirements.
7. **No accidental collaboration claims.** Group features are not considered complete until identity, privacy, and synchronization are real.

## Scope tiers

### Core MVP — P0

| Feature | Acceptance signal |
|---|---|
| Public event list | A user can load the event list from the API and see loading, empty, error, and success states. |
| Public event detail | A user can open an event and view its real schedule data. |
| Day-aware schedule | Selecting a day shows only sessions for that day. |
| Schedule filters | A user can filter by category/track and view only saved sessions. |
| Local agenda | Attendance and tracked sessions survive reloads on the same device. |
| Responsive UX | Main flows work at phone width and remain usable on desktop. |
| Cloudflare deployment | The production build runs with the Cloudflare adapter and Pages Functions. |
| Basic offline support | Previously loaded event data and the shell remain usable without a network connection. |

### Organizer release — P1

| Feature | Acceptance signal |
|---|---|
| Create and edit events | An authenticated organizer can create and update event metadata. |
| Manual activity CRUD | An organizer can add, edit, and delete individual sessions. |
| Image import | An organizer can upload a supported schedule image and receive extracted sessions. |
| Import correction flow | Extracted data can be reviewed and corrected before becoming public. |
| API key management | A maintainer can create keys, and raw keys are shown only once. |
| Cache invalidation | Published changes become visible after the documented cache window or an explicit refresh. |

### Premium / future — P2

| Feature | Scope boundary |
|---|---|
| Group mode / Packs | Requires user identity, private membership, synchronized agendas, and a defined privacy model. |
| Realtime group updates | Evaluate Durable Objects or another realtime layer only after Pack requirements are approved. |
| Push notifications | Add only after event timing, permission, and delivery rules are defined. |
| Advanced venue maps | Replace the current schematic with organizer-provided or structured venue data. |

## No-goals for the MVP

- User registration, social login, or public profiles.
- Collaborative group schedules or shared attendance.
- A relational database, ORM, or migration system.
- Realtime synchronization.
- A full organizer dashboard if the API and manual correction path are not stable first.
- Treating the Figma/React prototype in `docs/ux/` as production code.

## Success metrics

The MVP is successful when all of the following are true:

- [ ] A first-time attendee can find an event and save a session without creating an account.
- [ ] A returning attendee sees the same local agenda after a reload and after reopening the app.
- [ ] Day, category, and saved-session filters produce correct results from real API data.
- [ ] A schedule can be read from cached data when the network is unavailable.
- [ ] An organizer can publish a corrected schedule without editing R2 files manually.
- [ ] `pnpm run build`, automated tests, and the release smoke test pass.
- [ ] The app is deployed to Cloudflare Pages with the documented environment and bindings.

## Future phases

Group Mode / Packs remains documented but is not part of the MVP or organizer release. It should be planned separately after the public schedule and organizer workflows are stable.
