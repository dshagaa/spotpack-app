# SpotPack API Reference

> Base URL: `https://spotpack.pages.dev/api`  
> All responses are JSON.

---

## API Sections

| Section | Auth | Purpose |
|---------|------|---------|
| **General** | None (public) | Read events and schedule items |
| **Manage** | API key (`x-api-key`) | Create, edit, delete events and items. Import schedules. Manage keys. |
| **Packs** | User token (future) | Collaborative groups: packs, shared agendas, member management |

---

## Authentication

**General — No auth required.**
All `GET` requests in the General section are public.

**Manage — API key.**
Header: `x-api-key: sk-sp-<64 hex chars>`
Roles: `general` (read+write+import) or `maintainer` (everything+key management)

```
401 — { "error": "Unauthorized" }
403 — { "error": "Forbidden", "required_role": "maintainer" }
```

**Packs — User auth (Fase 2).**
Not yet implemented. Will likely use magic links or JWT tokens.

---

## CORS & Cache

All endpoints return:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: x-api-key, content-type
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
```

Public GET endpoints return:
```
Cache-Control: public, max-age=300, s-maxage=300
```

---

## General — Public Reads

> No authentication required.

### List Events

```http
GET /api/events
```

**Response `200`:**
```json
{
  "events": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "FurCon 2026",
      "start_date": "2026-12-05",
      "end_date": "2026-12-08",
      "location": "CDMX",
      "item_count": 142
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `events` | array | Event summaries |
| `events[].id` | UUID | Event identifier |
| `events[].name` | string | Event name |
| `events[].start_date` | string | `YYYY-MM-DD` |
| `events[].end_date` | string | `YYYY-MM-DD` |
| `events[].location` | string | Venue/city |
| `events[].item_count` | number | Total schedule items |

---

### Get Event

```http
GET /api/events/{id}
```

**Response `200`:**
```json
{
  "event": {
    "id": "a1b2c3d4-...",
    "name": "FurCon 2026",
    "start_date": "2026-12-05",
    "end_date": "2026-12-08",
    "location": "CDMX",
    "created_at": "2026-08-15T23:00:00Z"
  },
  "items": [
    {
      "id": "x9f8e7d6-...",
      "day_date": "2026-12-05",
      "start_time": "10:00",
      "end_time": "11:30",
      "title": "Fursuit Building 101",
      "description": "Aprende a construir tu primer fursuit.",
      "room": "Salón A",
      "category": "workshop",
      "classification": "general",
      "image_hash": "a1b2c3d4..."
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `event` | object | Event metadata |
| `items` | array | Schedule items |
| `items[].id` | UUID | Item identifier |
| `items[].day_date` | string | `YYYY-MM-DD` |
| `items[].start_time` | string | `HH:MM` (24h) |
| `items[].end_time` | string | `HH:MM` (24h) |
| `items[].title` | string | Activity title |
| `items[].description` | string | May be empty |
| `items[].room` | string | Room/salon, may be empty |
| `items[].category` | string | Enum: `panel`, `meetup`, `workshop`, `fursuit_games`, `dance`, `ceremony`, `other` |
| `items[].classification` | string | Enum: `general`, `+16`, `+18`, `+21` |
| `items[].image_hash` | string | SHA-256 of source image |

**Response `404`:**
```json
{ "error": "Not found" }
```

---

## Manage — Organizer Operations

> Requires `x-api-key` header.  
> Role required indicated per endpoint.

---

### Create Event

```http
POST /api/events
x-api-key: sk-sp-<key>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "FurCon 2026",
  "start_date": "2026-12-05",
  "end_date": "2026-12-08",
  "location": "CDMX"
}
```

| Field | Required | Type |
|-------|----------|------|
| `name` | ✅ | string |
| `start_date` | ✅ | string (`YYYY-MM-DD`) |
| `end_date` | ✅ | string (`YYYY-MM-DD`) |
| `location` | ❌ | string (default `""`) |

**Response `201`:**
```json
{
  "event": {
    "id": "a1b2c3d4-...",
    "name": "FurCon 2026",
    "start_date": "2026-12-05",
    "end_date": "2026-12-08",
    "location": "CDMX",
    "created_at": "2026-08-15T23:00:00Z"
  }
}
```

**Auth:** `general` or `maintainer`

---

### Update Event

```http
PATCH /api/events/{id}
x-api-key: sk-sp-<key>
Content-Type: application/json
```

Partial update. Send only the fields to change.

**Request Body (all optional):**
```json
{
  "name": "FurCon 2026 — Edición Especial",
  "location": "Guadalajara"
}
```

| Field | Type |
|-------|------|
| `name` | string |
| `start_date` | string |
| `end_date` | string |
| `location` | string |

**Response `200`:**
```json
{
  "event": {
    "id": "a1b2c3d4-...",
    "name": "FurCon 2026 — Edición Especial",
    "start_date": "2026-12-05",
    "end_date": "2026-12-08",
    "location": "Guadalajara",
    "created_at": "2026-08-15T23:00:00Z"
  }
}
```

**Auth:** `general` or `maintainer`

---

### Delete Event

```http
DELETE /api/events/{id}
x-api-key: sk-sp-<key>
```

Deletes the event, all its items, and removes it from the index.

**Response `200`:**
```json
{ "deleted": true }
```

**Auth:** `maintainer` only

---

### Create Activity (manual)

```http
POST /api/events/{id}/items
x-api-key: sk-sp-<key>
Content-Type: application/json
```

Add a single schedule item without AI import.

**Request Body:**
```json
{
  "day_date": "2026-12-05",
  "start_time": "14:00",
  "end_time": "15:30",
  "title": "Fursuit Dance Competition",
  "description": "Competencia de baile en fursuit.",
  "room": "Salón Principal",
  "category": "dance",
  "classification": "general"
}
```

| Field | Required | Type |
|-------|----------|------|
| `day_date` | ✅ | string (`YYYY-MM-DD`) |
| `start_time` | ✅ | string (`HH:MM` 24h) |
| `end_time` | ✅ | string (`HH:MM` 24h) |
| `title` | ✅ | string |
| `description` | ❌ | string (default `""`) |
| `room` | ❌ | string (default `""`) |
| `category` | ❌ | string (default `"other"`) |
| `classification` | ❌ | string (default `"general"`) |

**Response `201`:**
```json
{
  "item": {
    "id": "x9f8e7d6-...",
    "day_date": "2026-12-05",
    "start_time": "14:00",
    "end_time": "15:30",
    "title": "Fursuit Dance Competition",
    "description": "Competencia de baile en fursuit.",
    "room": "Salón Principal",
    "category": "dance",
    "classification": "general"
  }
}
```

**Auth:** `general` or `maintainer`

---

### Update Activity

```http
PATCH /api/events/{id}/items/{itemId}
x-api-key: sk-sp-<key>
Content-Type: application/json
```

Partial update of a single schedule item.

**Request Body (all optional):**
```json
{
  "room": "Salón B",
  "start_time": "14:30"
}
```

All item fields are optional. Send only what changes.

**Response `200`:**
```json
{
  "item": {
    "id": "x9f8e7d6-...",
    "day_date": "2026-12-05",
    "start_time": "14:30",
    "end_time": "15:30",
    "title": "Fursuit Dance Competition",
    "description": "Competencia de baile en fursuit.",
    "room": "Salón B",
    "category": "dance",
    "classification": "general"
  }
}
```

**Auth:** `general` or `maintainer`

---

### Delete Activity

```http
DELETE /api/events/{id}/items/{itemId}
x-api-key: sk-sp-<key>
```

Removes a single schedule item from the event.

**Response `200`:**
```json
{ "deleted": true }
```

**Auth:** `maintainer` only

---

### Import Schedule

```http
POST /api/import
x-api-key: sk-sp-<key>
Content-Type: multipart/form-data
```

Uploads a schedule image → MiMo V2.5 extracts items → adds to event.

**Form fields:**

| Field | Required | Type |
|-------|----------|------|
| `image` | ✅ | File (PNG, JPEG, WebP, max 5 MB) |
| `event_id` | ✅ | string (UUID) |

**Response `200`:**
```json
{
  "success": true,
  "count": 48,
  "items": [
    {
      "id": "x9f8e7d6-...",
      "day_date": "2026-12-05",
      "start_time": "10:00",
      "end_time": "11:30",
      "title": "Fursuit Building 101",
      "description": "",
      "room": "Salón A",
      "category": "workshop",
      "classification": "general",
      "image_hash": "a1b2c3d4..."
    }
  ]
}
```

**Image deduplication:** If the same image (SHA-256 match) is uploaded again for the same event, the AI call is skipped and existing items are returned with `"dedup": true`.

**Error responses:**
```
400 — Missing image or event_id
400 — event_id must be a valid UUID
400 — Invalid file type: <type>
400 — File too large (max 5MB)
400 — Failed to parse vision response
404 — Event not found
502 — Vision API error: <status>
```

**Auth:** `general` or `maintainer`

---

### Create API Key

```http
POST /api/keys
x-api-key: sk-sp-<key>
Content-Type: application/json
```

Creates a new `general` API key. Raw key returned **once**.

**Request Body:**
```json
{
  "label": "Frontend App"
}
```

| Field | Required | Type |
|-------|----------|------|
| `label` | ✅ | string |

**Response `201`:**
```json
{
  "key": "sk-sp-a1b2c3d4e5f6...",
  "role": "general",
  "label": "Frontend App"
}
```

> ⚠️ The raw key in `key` is shown only once. Save it now.

**Auth:** `maintainer` only

---

## Packs — Collaborative (Fase 2)

> ⚠️ **Not yet implemented.** Documented as reference for the Group Mode phase.  
> Will require user authentication (magic links or JWT).

**Privacy model:** All packs are **private**. A user can only see packs they are a member of. The only way to discover a pack is via its invite code. There is no public pack directory.

---

### List My Packs

```http
GET /api/packs
Authorization: Bearer <user_token>
```

Returns only packs where the authenticated user is a member.

**Response `200`:**
```json
{
  "packs": [
    {
      "id": "p9k8j7h6-...",
      "name": "FurCon Squad",
      "event_id": "a1b2c3d4-...",
      "event_name": "FurCon 2026",
      "member_count": 5,
      "role": "owner"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `packs` | array | Packs the user belongs to |
| `packs[].id` | UUID | Pack identifier |
| `packs[].name` | string | Pack name |
| `packs[].event_id` | UUID | Associated event |
| `packs[].event_name` | string | Event name (denormalized) |
| `packs[].member_count` | number | Total members in pack |
| `packs[].role` | string | User's role: `owner` or `member` |

---

### Create Pack

```http
POST /api/packs
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "FurCon Squad",
  "event_id": "a1b2c3d4-..."
}
```

**Response `201`:**
```json
{
  "pack": {
    "id": "p9k8j7h6-...",
    "name": "FurCon Squad",
    "event_id": "a1b2c3d4-...",
    "invite_code": "FURCON-X7K2",
    "owner_id": "u1a2b3c4-...",
    "created_at": "2026-08-15T23:00:00Z"
  }
}
```

---

### Get Pack

```http
GET /api/packs/{id}
Authorization: Bearer <user_token>
```

Returns pack info, members, and each member's attending items. Only accessible to pack members.

**Response `200`:**
```json
{
  "pack": {
    "id": "p9k8j7h6-...",
    "name": "FurCon Squad",
    "invite_code": "FURCON-X7K2"
  },
  "members": [
    {
      "id": "u1a2b3c4-...",
      "name": "Dshagaa",
      "attending": [
        { "item_id": "x9f8e7d6-...", "day_date": "2026-12-05", "start_time": "10:00", "end_time": "11:30" }
      ]
    }
  ]
}
```

---

### Update Pack

```http
PATCH /api/packs/{id}
Authorization: Bearer <user_token>
```

**Request Body (all optional):**
```json
{ "name": "FurCon Besties" }
```

**Auth:** Pack owner only.

---

### Delete Pack

```http
DELETE /api/packs/{id}
Authorization: Bearer <user_token>
```

**Auth:** Pack owner only.

---

### Join Pack

```http
POST /api/packs/join?pack-code=FURCON-X7K2
Authorization: Bearer <user_token>
```

Joins the pack matching the invite code. The pack ID is never exposed publicly — users join by code.

**Response `201`:**
```json
{
  "pack": {
    "id": "p9k8j7h6-...",
    "name": "FurCon Squad",
    "event_id": "a1b2c3d4-...",
    "role": "member"
  }
}
```

**Response `404`:**
```json
{ "error": "Invalid invite code" }
```

---

### Leave Pack

```http
DELETE /api/packs/{id}/members/me
Authorization: Bearer <user_token>
```

Member removes themselves.

---

### Remove Member

```http
DELETE /api/packs/{id}/members/{userId}
Authorization: Bearer <user_token>
```

**Auth:** Pack owner only.

---

### Import My Agenda

```http
POST /api/packs/{id}/import-agenda
Authorization: Bearer <user_token>
Content-Type: application/json
```

Bulk-imports the user's existing attending items (from event detail / localStorage) into the pack. Avoids re-selecting every activity one by one after joining.

**Request Body:**
```json
{
  "items": ["x9f8e7d6-...", "a1b2c3d4-..."]
}
```

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `items` | ✅ | UUID[] | Item IDs to mark as attending in the pack |

**Response `200`:**
```json
{
  "imported": 14,
  "skipped": 2
}
```

| Field | Type | Description |
|-------|------|-------------|
| `imported` | number | Items successfully marked as attending |
| `skipped` | number | Items already marked (no-op) |

**Flow:**
1. User opens pack → sees empty agenda
2. Frontend reads `localStorage.spotpack:v1:attending` → gets item IDs
3. Frontend calls `POST /api/packs/{id}/import-agenda` with those IDs
4. User's agenda appears instantly in the pack

---

### Collaborative Agenda

```http
GET /api/packs/{id}/agenda
Authorization: Bearer <user_token>
```

Merged agenda of all pack members. Each item shows which members are attending.

**Response `200`:**
```json
{
  "agenda": [
    {
      "item_id": "x9f8e7d6-...",
      "title": "Fursuit Building 101",
      "start_time": "10:00",
      "end_time": "11:30",
      "day_date": "2026-12-05",
      "room": "Salón A",
      "attending": ["Dshagaa", "FurFriend42"]
    }
  ]
}
```

---

### Mark Attending

```http
POST /api/packs/{id}/attending
Authorization: Bearer <user_token>
Content-Type: application/json
```

```json
{ "item_id": "x9f8e7d6-..." }
```

Marks an activity as "attending" for the authenticated user within the pack.

---

### Unmark Attending

```http
DELETE /api/packs/{id}/attending/{itemId}
Authorization: Bearer <user_token>
```

Removes the attending mark for the authenticated user.

---

## Enums

### Category

| Value | Spanish |
|-------|---------|
| `panel` | Panel |
| `meetup` | Meetup |
| `workshop` | Taller |
| `fursuit_games` | Fursuit Games |
| `dance` | Baile |
| `ceremony` | Ceremonia |
| `other` | Otro |

### Classification

| Value | Meaning |
|-------|---------|
| `general` | All ages |
| `+16` | 16+ |
| `+18` | 18+ |
| `+21` | 21+ |

---

## Error Format

```json
{
  "error": "Human-readable message",
  "required_role": "maintainer"
}
```

| HTTP | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `204` | No Content (CORS) |
| `400` | Bad Request |
| `401` | Unauthorized |
| `403` | Forbidden |
| `404` | Not Found |
| `500` | Internal Server Error |
| `502` | Bad Gateway (MiMo) |
