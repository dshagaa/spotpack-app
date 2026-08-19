// functions/api/import.js
// POST /api/import — image → MiMo V2.5 → schedule items (auth: general+)
// multipart/form-data: image (File) + event_id (UUID)

import { authorize, sha256 } from '../_shared/auth.js';
import { corsPreflight, ok, badRequest, unauthorized, forbidden, notFound, serverError } from '../_shared/response.js';
import { getEvent, saveEvent, listEvents, saveEventIndex } from '../_shared/r2.js';
import { isValidUUID, normalizeCategory, normalizeClassification } from '../_shared/validation.js';

const VISION_MODEL = 'mimo-v2.5-free';
const OPENCODE_URL = 'https://opencode.ai/zen/v1/chat/completions';
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const SYSTEM_PROMPT = `You are a schedule extraction assistant. Analyze the convention schedule image and return a JSON array of events.

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
- Return ONLY valid JSON array, no other text, no pretty-printing, no whitespace between items
- Return each object on a single line, compact format

Return format:
[
  {"day_date": "...", "start_time": "...", "end_time": "...", "title": "...", "description": "...", "room": "...", "category": "...", "classification": "..."}
]`;

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

    // Read image bytes + compute content hash for dedup
    const imageBuffer = await image.arrayBuffer();
    const imageHash = await sha256Bytes(imageBuffer);

    // Store image in R2 (before MiMo, so failed imports are recoverable)
    const ext = (image.name.split('.').pop() || 'png').toLowerCase();
    const storagePath = `images/${eventId}/${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;
    await env.SPOTPACK_BUCKET.put(storagePath, imageBuffer, {
      httpMetadata: { contentType: image.type },
    });

    // Dedup: skip MiMo if this exact image was already processed for this event
    const existingItems = eventData.items || [];
    if (existingItems.some(item => item.image_hash === imageHash)) {
      return ok({ success: true, count: existingItems.length, items: existingItems, dedup: true });
    }

    // Call MiMo V2.5
    const base64 = bytesToBase64(imageBuffer);
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
          {
            role: 'user',
            content: [{
              type: 'image_url',
              image_url: { url: `data:${image.type};base64,${base64}` },
            }],
          },
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

    // Parse JSON array from response
    let parsedItems;
    try {
      const jsonMatch =
        rawContent.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/) ||
        rawContent.match(/(\[[\s\S]*\])/);
      const jsonStr = jsonMatch ? jsonMatch[1] : rawContent;
      parsedItems = JSON.parse(jsonStr);
      if (!Array.isArray(parsedItems)) throw new Error('Not an array');
    } catch {
      return badRequest('Failed to parse vision response');
    }

    // Normalize into schedule items
    const newItems = parsedItems.map(item => ({
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
    }));

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

    return ok({ success: true, count: newItems.length, items: newItems });
  } catch (err) {
    return serverError(`Internal error: ${err.message}`);
  }
}

// Hash a Uint8Array/ArrayBuffer with SHA-256 (Web Crypto)
async function sha256Bytes(buffer) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ArrayBuffer → base64 (without btoa, which breaks on large buffers)
function bytesToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
