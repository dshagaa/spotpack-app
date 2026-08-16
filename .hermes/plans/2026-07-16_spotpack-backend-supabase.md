# SpotPack Backend — Implementation Plan (Supabase)

> **For Hermes:** Use this plan to build the Supabase backend task-by-task.  
> Zero FastAPI. Everything runs on Supabase.

**Goal:** Build SpotPack backend from scratch on Supabase (Edge Functions + PostgreSQL + Storage). Image upload → MiMo V2.5 vision analysis → structured JSON → database records. Zero legacy code.

**Architecture:** Supabase Edge Functions handle import pipeline (image → MiMo V2.5 → JSON → DB). PostgreSQL stores events, schedule items, and processing results. Storage bucket with 7-day TTL for uploaded images. Role-based auth via two API keys.

**Tech Stack:**
- **Runtime:** Supabase Edge Functions (Deno + TypeScript)
- **AI:** MiMo V2.5 Free via OpenCode Zen API (`https://opencode.ai/zen/v1/chat/completions`)
- **DB:** Supabase PostgreSQL
- **Storage:** Supabase Storage (images, 7-day TTL)
- **Auth:** API key via `x-api-key` header
- **Local Dev:** Supabase CLI + Docker
- **Deploy:** `supabase functions deploy`

---

## Environment Variables (Supabase Secrets)

All sensitive values go to `supabase secrets set`:

| Variable | Value | Purpose |
|----------|-------|---------|
| `GENERAL_API_KEY` | (user-defined shared secret) | General access — read, create, update, import |
| `MAINTAINER_API_KEY` | (user-defined admin secret) | Full access — all operations including delete & debug |
| `OPENCODE_API_KEY` | `sk-9kOLxGBxXX4yP2SGgjqJ6zHYww0FWvkKfssDbhGkXLD2wAlxECTlEtdgGzSNHPtB` | OpenCode Zen API |
| `OPENCODE_BASE_URL` | `https://opencode.ai/zen/v1` | API base URL |
| `VISION_MODEL` | `mimo-v2.5-free` | Model for vision tasks |

---

## Auth System: Role-Based API Keys

Two API keys, two roles. A shared utility `_shared/auth.ts` is imported by every Edge Function.

### Roles

| Role | Key secret | Who uses it |
|------|-----------|-------------|
| `general` | `GENERAL_API_KEY` | Frontend app — read schedules, create events, import images |
| `maintainer` | `MAINTAINER_API_KEY` | Admin — delete events, view processing logs, manage storage |

### Permission Matrix (actions × modules)

| Action | Module | general | maintainer |
|--------|--------|:---:|:---:|
| `read` | `events` | ✅ | ✅ |
| `read` | `items` | ✅ | ✅ |
| `create` | `events` | ✅ | ✅ |
| `create` | `items` | ✅ | ✅ |
| `update` | `events` | ✅ | ✅ |
| `update` | `items` | ✅ | ✅ |
| `import` | `schedules` | ✅ | ✅ |
| `delete` | `events` | ❌ | ✅ |
| `delete` | `items` | ❌ | ✅ |
| `read` | `processing` | ❌ | ✅ |
| `manage` | `storage` | ❌ | ✅ |

### Shared auth utility

**File:** `supabase/functions/_shared/auth.ts`

```typescript
// _shared/auth.ts — Role-based authorization for SpotPack Edge Functions

type Role = "general" | "maintainer";
type Action = "read" | "create" | "update" | "delete" | "import" | "manage";
type Module = "events" | "items" | "schedules" | "processing" | "storage";

const PERMISSIONS: Record<Role, Record<Action, Module[]>> = {
  general: {
    read:    ["events", "items"],
    create:  ["events", "items"],
    update:  ["events", "items"],
    import:  ["schedules"],
    delete:  [],
    manage:  [],
  },
  maintainer: {
    read:    ["events", "items", "processing"],
    create:  ["events", "items"],
    update:  ["events", "items"],
    import:  ["schedules"],
    delete:  ["events", "items"],
    manage:  ["storage"],
  },
};

export interface AuthResult {
  role: Role;
}

/**
 * Validates the x-api-key header and checks permissions.
 * Returns AuthResult on success, or a Response (401/403) to return immediately.
 *
 * Usage:
 *   const auth = authorize(req, "import", "schedules");
 *   if (auth instanceof Response) return auth;
 *   // auth.role is "general" | "maintainer"
 */
export function authorize(req: Request, action: Action, module: Module): AuthResult | Response {
  const key = req.headers.get("x-api-key") || "";
  let role: Role;

  if (key === Deno.env.get("MAINTAINER_API_KEY")) {
    role = "maintainer";
  } else if (key === Deno.env.get("GENERAL_API_KEY")) {
    role = "general";
  } else {
    return new Response(
      JSON.stringify({ error: "Unauthorized — invalid or missing API key" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!PERMISSIONS[role][action].includes(module)) {
    return new Response(
      JSON.stringify({
        error: "Forbidden",
        detail: `Role '${role}' cannot ${action} on ${module}`,
        required_role: "maintainer",
      }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  return { role };
}
```

### Auth summary per endpoint

| Function | Method | Auth | Action | Module |
|----------|--------|------|--------|--------|
| `import-schedule` | POST | general+ | `import` | `schedules` |
| `get-events` | GET | none (public) | `read` | `events` |
| `get-event` | GET | none (public) | `read` | `items` |
| `create-event` | POST | general+ | `create` | `events` |
| `update-event` | PATCH | general+ | `update` | `events` |
| `delete-event` | DELETE | maintainer | `delete` | `events` |

---

## Database Schema

### Table: `events`
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `schedule_items`
```sql
CREATE TABLE schedule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  day_date DATE NOT NULL,
  start_time TEXT NOT NULL,       -- "HH:MM" in 24h
  end_time TEXT NOT NULL,         -- "HH:MM" in 24h
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  room TEXT DEFAULT '',
  category TEXT DEFAULT 'other',  -- panel, meetup, workshop, fursuit_games, dance, ceremony, other
  classification TEXT DEFAULT 'general', -- general, +16, +18, +21
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_schedule_items_event ON schedule_items(event_id);
CREATE INDEX idx_schedule_items_day ON schedule_items(day_date);
```

### Table: `processing_results`
```sql
CREATE TABLE processing_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,      -- path in Supabase Storage
  raw_json JSONB NOT NULL,         -- raw GPT-4V / MiMo response
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Storage Bucket: `schedule-images`
- Public: false (private bucket)
- TTL policy: delete objects after 7 days
- RLS: only Edge Functions can read/write (service_role)

---

## Edge Functions

### `import-schedule` (POST)

**Auth:** `x-api-key` header → `authorize(req, "import", "schedules")` — general or maintainer.

**Request:** `multipart/form-data`
- `image`: image file (PNG/JPEG/WebP)
- `event_id`: UUID of the event to add items to

**Flow:**
1. `authorize(req, "import", "schedules")` — 401 if bad key, 403 if role can't import
2. Parse multipart form → extract image + event_id
3. Generate filename: `{event_id}/{timestamp}_{random}.{ext}`
4. Upload image to `schedule-images` bucket (service_role)
5. Read image as base64
6. Call OpenCode Zen API with MiMo V2.5 Free:
   ```
   POST https://opencode.ai/zen/v1/chat/completions
   Authorization: Bearer {OPENCODE_API_KEY}
   Content-Type: application/json
   
   {
     "model": "mimo-v2.5-free",
     "messages": [
       {
         "role": "system",
         "content": "[prompt — see below]"
       },
       {
         "role": "user",
         "content": [
           {
             "type": "image_url",
             "image_url": { "url": "data:image/png;base64,{base64}" }
           }
         ]
       }
     ],
     "temperature": 0.1,
     "max_tokens": 8000
   }
   ```
7. Parse response → extract JSON array
8. INSERT raw JSON into `processing_results`
9. INSERT each parsed item into `schedule_items`
10. Return `{ success: true, count: N, items: [...] }`

**MiMo System Prompt** (migrated from old FastAPI prompt, tuned for MiMo):

```
You are a schedule extraction assistant. Analyze the convention schedule image and return a JSON array of events.

For each row in the schedule, extract these fields:
- day_date: "YYYY-MM-DD" format
- start_time: "HH:MM" in 24h format
- end_time: "HH:MM" in 24h format
- title: event title
- description: any additional text about the event
- room: room/location name
- category: one of [panel, meetup, workshop, fursuit_games, dance, ceremony, other]
- classification: one of [general, +16, +18, +21]

Rules:
- Detect merged cells — if a cell spans multiple rows, it's a multi-hour event
- If times are in 12h format (AM/PM), convert to 24h
- If no classification is indicated, default to "general"
- If no category is clear, default to "other"
- Return ONLY valid JSON array, no other text
- Support both Spanish and English text in the image

Return format:
[
  {"day_date": "...", "start_time": "...", "end_time": "...", "title": "...", "description": "...", "room": "...", "category": "...", "classification": "..."}
]
```

**Error handling:**
- 401: Invalid/missing API key
- 400: Missing image or event_id
- 404: Event not found
- 502: MiMo API error → store error in processing_results, return 502
- 422: MiMo returned invalid JSON → store raw response, return 422 with raw text

### `get-events` (GET)

**Auth:** None (public) — no `x-api-key` needed.

### `get-event` (GET)

**Auth:** None (public) — no `x-api-key` needed.

### `create-event` (POST)

**Auth:** `x-api-key` → `authorize(req, "create", "events")` — general or maintainer.

**Request:** `application/json`
```json
{
  "name": "FurCon 2026",
  "start_date": "2026-08-15",
  "end_date": "2026-08-17",
  "location": "Hotel Example"
}
```

**Response:** `{ "event": { id, name, ... } }`

### `update-event` (PATCH)

**Auth:** `x-api-key` → `authorize(req, "update", "events")` — general or maintainer.

**Request:** `application/json` with fields to update (partial update):
```json
{
  "id": "event-uuid",
  "name": "New Name",
  "location": "New Location"
}
```

### `delete-event` (DELETE)

**Auth:** `x-api-key` → `authorize(req, "delete", "events")` — maintainer ONLY (general gets 403).

Deletes event + cascades to schedule_items and processing_results. Also deletes associated images from Storage.

---

## Implementation Tasks

### Task 1: Create Supabase project and set up local dev

**Objective:** Create Supabase project, install CLI, init local dev

**Steps:**
1. Create Supabase account (if not already) at https://supabase.com
2. Create new project named `spotpack`
3. Note project URL and anon key
4. Install Supabase CLI:
   ```bash
   brew install supabase/tap/supabase  # macOS
   # or
   npm install -g supabase             # cross-platform
   ```
5. In the backend repo (`C:\Users\Dshagaa\Projects\spotpack\backend`):
   ```bash
   supabase init
   ```
6. Link to remote project:
   ```bash
   supabase link --project-ref {project_ref}
   ```
7. Start local dev:
   ```bash
   supabase start
   ```

**Verification:** `supabase status` shows all services running (API, DB, Storage, Edge Functions)

---

### Task 2: Create database migration

**Objective:** SQL migration for all three tables

**Files:**
- Create: `supabase/migrations/20260716000001_create_tables.sql`

**SQL:**
```sql
-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  location TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Schedule items table
CREATE TABLE schedule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  day_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  room TEXT DEFAULT '',
  category TEXT DEFAULT 'other',
  classification TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_schedule_items_event ON schedule_items(event_id);
CREATE INDEX idx_schedule_items_day ON schedule_items(day_date);

-- Processing results table (audit trail)
CREATE TABLE processing_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  raw_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: public read, service_role write
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_results ENABLE ROW LEVEL SECURITY;

-- Public can read events and items
CREATE POLICY "public_read_events" ON events FOR SELECT TO anon USING (true);
CREATE POLICY "public_read_items" ON schedule_items FOR SELECT TO anon USING (true);

-- Only service_role can write (Edge Functions use service_role)
CREATE POLICY "service_write_events" ON events FOR INSERT TO service_role USING (true);
CREATE POLICY "service_write_items" ON schedule_items FOR INSERT TO service_role USING (true);
CREATE POLICY "service_write_processing" ON processing_results FOR INSERT TO service_role USING (true);
CREATE POLICY "service_delete_events" ON events FOR DELETE TO service_role USING (true);
```

**Verification:** `supabase db push` applies migration without errors

---

### Task 3: Create storage bucket with TTL

**Objective:** `schedule-images` bucket with 7-day auto-delete

**File:**
- Create: `supabase/migrations/20260716000002_create_bucket.sql`

**SQL:**
```sql
-- Create storage bucket via SQL (or use dashboard)
-- Note: bucket creation may need to be done via dashboard or API
-- This SQL defines the RLS policies

-- Allow service_role full access to storage
CREATE POLICY "service_storage_access" ON storage.objects 
  FOR ALL TO service_role 
  USING (bucket_id = 'schedule-images');

-- Deny public access
CREATE POLICY "deny_public_storage" ON storage.objects 
  FOR ALL TO anon 
  USING (false);
```

After migration, create bucket manually:
```bash
# Via dashboard: Storage → New Bucket → "schedule-images" → Private
# Or via SQL insert:
# INSERT INTO storage.buckets (id, name, public) VALUES ('schedule-images', 'schedule-images', false);
```

Set TTL rule in Supabase Dashboard: Storage → schedule-images → Policies → Add TTL → 7 days

**Verification:** Bucket exists in dashboard, TTL policy active

---

### Task 4: Create shared auth utility + `import-schedule` Edge Function

**Objective:** Shared `_shared/auth.ts` utility + full import pipeline: upload → vision AI → store

**Files:**
- Create: `supabase/functions/_shared/auth.ts` (from Auth System section above)
- Create: `supabase/functions/import-schedule/index.ts`

**Dependencies:** (Deno imports, no package.json needed)
```typescript
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authorize } from "../_shared/auth.ts";
```

**Key implementation details:**

```typescript
// Environment variables
const OPENCODE_API_KEY = Deno.env.get("OPENCODE_API_KEY")!;
const OPENCODE_BASE_URL = Deno.env.get("OPENCODE_BASE_URL") || "https://opencode.ai/zen/v1";
const VISION_MODEL = Deno.env.get("VISION_MODEL") || "mimo-v2.5-free";

// Constants
const SYSTEM_PROMPT = `You are a schedule extraction assistant...`; // full prompt from above
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

serve(async (req: Request) => {
  // 1. Role-based auth — general or maintainer can import
  const auth = authorize(req, "import", "schedules");
  if (auth instanceof Response) return auth;

  // 2. Parse multipart form
  const formData = await req.formData();
  const image = formData.get("image") as File;
  const eventId = formData.get("event_id") as string;

  if (!image || !eventId) {
    return new Response(JSON.stringify({ error: "Missing image or event_id" }), { status: 400 });
  }

  // 3. Validate file
  if (!ALLOWED_TYPES.includes(image.type)) {
    return new Response(JSON.stringify({ error: "Invalid file type" }), { status: 400 });
  }
  if (image.size > MAX_FILE_SIZE) {
    return new Response(JSON.stringify({ error: "File too large (max 10MB)" }), { status: 400 });
  }

  // 4. Create Supabase client (service_role for RLS bypass)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 5. Verify event exists
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .single();
  
  if (eventError || !event) {
    return new Response(JSON.stringify({ error: "Event not found" }), { status: 404 });
  }

  // 6. Upload image to Storage
  const ext = image.name.split(".").pop() || "png";
  const filename = `${eventId}/${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const imageBuffer = await image.arrayBuffer();
  
  const { error: uploadError } = await supabase.storage
    .from("schedule-images")
    .upload(filename, imageBuffer, {
      contentType: image.type,
      upsert: false,
    });

  if (uploadError) {
    return new Response(JSON.stringify({ error: "Upload failed", detail: uploadError }), { status: 500 });
  }

  // 7. Convert image to base64 for vision API
  const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

  // 8. Call OpenCode Zen API (MiMo V2.5)
  const visionResponse = await fetch(`${OPENCODE_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENCODE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${image.type};base64,${base64}`
              }
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 8000,
    }),
  });

  if (!visionResponse.ok) {
    const errText = await visionResponse.text();
    return new Response(JSON.stringify({ error: "Vision API error", detail: errText }), { status: 502 });
  }

  const visionData = await visionResponse.json();
  const rawContent = visionData.choices?.[0]?.message?.content || "";

  // 9. Store raw result in processing_results
  let parsedItems: any[];
  try {
    // Extract JSON from response (may have markdown code blocks)
    const jsonMatch = rawContent.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/) || 
                      rawContent.match(/(\[[\s\S]*?\])/);
    const jsonStr = jsonMatch ? jsonMatch[1] : rawContent;
    parsedItems = JSON.parse(jsonStr);
  } catch {
    // Store raw response even if parse fails
    await supabase.from("processing_results").insert({
      event_id: eventId,
      storage_path: filename,
      raw_json: { error: "parse_failed", raw_content: rawContent },
    });
    return new Response(JSON.stringify({ 
      error: "Failed to parse vision response", 
      raw: rawContent.slice(0, 1000)
    }), { status: 422 });
  }

  // Store successful raw JSON
  await supabase.from("processing_results").insert({
    event_id: eventId,
    storage_path: filename,
    raw_json: parsedItems,
  });

  // 10. Insert parsed items into schedule_items
  let insertedCount = 0;
  const items: any[] = [];

  for (const item of parsedItems) {
    const { error: insertError, data } = await supabase
      .from("schedule_items")
      .insert({
        event_id: eventId,
        day_date: item.day_date,
        start_time: item.start_time,
        end_time: item.end_time,
        title: item.title,
        description: item.description || "",
        room: item.room || "",
        category: item.category || "other",
        classification: item.classification || "general",
      })
      .select()
      .single();

    if (!insertError && data) {
      insertedCount++;
      items.push(data);
    }
  }

  return new Response(JSON.stringify({
    success: true,
    count: insertedCount,
    items,
  }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

**Verification:** Deploy function and test with curl:
```bash
curl -X POST https://{project}.supabase.co/functions/v1/import-schedule \
  -H "x-api-key: {API_KEY}" \
  -F "image=@test_schedule.png" \
  -F "event_id={event_uuid}"
```

---

### Task 5: Create `get-events` and `get-event` Edge Functions

**Objective:** Public read endpoints — no auth required

**Files:**
- Create: `supabase/functions/get-events/index.ts`
- Create: `supabase/functions/get-event/index.ts`

**`get-events`:**
```typescript
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (_req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!  // anon key (public)
  );

  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // Add item counts
  const eventsWithCounts = await Promise.all(
    events.map(async (event) => {
      const { count } = await supabase
        .from("schedule_items")
        .select("*", { count: "exact", head: true })
        .eq("event_id", event.id);
      return { ...event, item_count: count || 0 };
    })
  );

  return new Response(JSON.stringify({ events: eventsWithCounts }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

**`get-event`:**
```typescript
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  const url = new URL(req.url);
  const eventId = url.searchParams.get("id");
  if (!eventId) {
    return new Response(JSON.stringify({ error: "Missing id parameter" }), { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  const { data: event } = await supabase.from("events").select("*").eq("id", eventId).single();
  if (!event) {
    return new Response(JSON.stringify({ error: "Event not found" }), { status: 404 });
  }

  const { data: items } = await supabase
    .from("schedule_items")
    .select("*")
    .eq("event_id", eventId)
    .order("day_date")
    .order("start_time");

  return new Response(JSON.stringify({ event, items }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

### Task 6: Create `create-event` and `update-event` Edge Functions

**Objective:** Auth-protected CRUD for events (general role)

**Files:**
- Create: `supabase/functions/create-event/index.ts`
- Create: `supabase/functions/update-event/index.ts`

**`create-event`:**
```typescript
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authorize } from "../_shared/auth.ts";

serve(async (req: Request) => {
  const auth = authorize(req, "create", "events");
  if (auth instanceof Response) return auth;

  const { name, start_date, end_date, location } = await req.json();
  if (!name || !start_date || !end_date) {
    return new Response(JSON.stringify({ error: "Missing name, start_date, or end_date" }), { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: event, error } = await supabase
    .from("events")
    .insert({ name, start_date, end_date, location: location || "" })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ event }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

**`update-event`:**
```typescript
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authorize } from "../_shared/auth.ts";

serve(async (req: Request) => {
  const auth = authorize(req, "update", "events");
  if (auth instanceof Response) return auth;

  const { id, ...fields } = await req.json();
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing id" }), { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: event, error } = await supabase
    .from("events")
    .update(fields)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ event }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

### Task 7: Create `delete-event` Edge Function

**Objective:** Maintainer-only delete — `authorize(req, "delete", "events")`

**File:**
- Create: `supabase/functions/delete-event/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authorize } from "../_shared/auth.ts";

serve(async (req: Request) => {
  // Only maintainer can delete — general gets 403
  const auth = authorize(req, "delete", "events");
  if (auth instanceof Response) return auth;

  const url = new URL(req.url);
  const eventId = url.searchParams.get("id");
  if (!eventId) {
    return new Response(JSON.stringify({ error: "Missing id" }), { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Delete images from storage
  const { data: files } = await supabase.storage
    .from("schedule-images")
    .list(eventId);

  if (files && files.length > 0) {
    await supabase.storage
      .from("schedule-images")
      .remove(files.map(f => `${eventId}/${f.name}`));
  }

  // Delete event (cascades to items + processing_results)
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

---

### Task 8: Set secrets and deploy all functions

**Objective:** Push secrets to Supabase, deploy all 6 functions

```bash
# Set secrets
supabase secrets set GENERAL_API_KEY="(user-chosen-frontend-key)"
supabase secrets set MAINTAINER_API_KEY="(user-chosen-admin-key)"
supabase secrets set OPENCODE_API_KEY="sk-9kOLxGBxXX4yP2SGgjqJ6zHYww0FWvkKfssDbhGkXLD2wAlxECTlEtdgGzSNHPtB"
supabase secrets set OPENCODE_BASE_URL="https://opencode.ai/zen/v1"
supabase secrets set VISION_MODEL="mimo-v2.5-free"

# Deploy all functions
supabase functions deploy import-schedule
supabase functions deploy get-events
supabase functions deploy get-event
supabase functions deploy create-event
supabase functions deploy update-event
supabase functions deploy delete-event
```

**Verification:** `supabase functions list` shows all 6 functions deployed

---

### Task 9: Create `README.md` and `.env.example` for the backend repo

**Objective:** Document setup, endpoints, and auth for the backend repo

**File:**
- Create: `README.md` (in backend repo root)
- Create: `.env.example` (local dev reference — actual secrets in Supabase)

**`.env.example`:**
```bash
# Copy these to Supabase secrets, never commit real values
GENERAL_API_KEY=sk-spotpack-general-xxx
MAINTAINER_API_KEY=sk-spotpack-maintainer-xxx
OPENCODE_API_KEY=sk-xxx
OPENCODE_BASE_URL=https://opencode.ai/zen/v1
VISION_MODEL=mimo-v2.5-free
```


---

## Risk & Open Questions

| Risk | Mitigation |
|------|-----------|
| MiMo V2.5 Free may be rate-limited or discontinued | `VISION_MODEL` is env var — easy to switch to another model |
| MiMo vision quality may differ from gpt-4o | Test with real schedule images; adjust prompt if needed |
| Edge Functions have 60s timeout (free tier) | Image processing + API call should fit; if not, upgrade to Pro |
| Free models: data may be used for training | Not ideal for user-uploaded images; document in README |
| Storage TTL is 7 days — images gone before user may need to debug | Processing_results keeps the raw JSON; re-upload if needed |

---

---

## Appendix: MiMo V2.5 API Notes

- **Endpoint:** `https://opencode.ai/zen/v1/chat/completions`
- **Model ID:** `mimo-v2.5-free`
- **Auth:** `Authorization: Bearer {api_key}`
- **Format:** OpenAI-compatible chat completions
- **Vision:** Supports `image_url` content blocks with `data:image/...;base64,...`
- **Context:** 1M tokens
- **Pricing:** Free (limited time on OpenCode Zen)
- **Privacy:** During free period, data may be used to improve the model
