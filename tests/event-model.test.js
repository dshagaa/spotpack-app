import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterActivities,
  normalizeEventDetail,
  normalizeEventSummary
} from '../src/lib/event-model.js';

const rawEvent = {
  id: 'event-1',
  name: 'FurCon 2026',
  start_date: '2026-10-16',
  end_date: '2026-10-18',
  location: 'Guadalajara'
};

const rawItems = [
  {
    id: 'item-1',
    day_date: '2026-10-16',
    start_time: '10:00',
    end_time: '11:00',
    title: 'Opening Ceremony',
    description: 'Welcome.',
    room: 'Main Hall',
    category: 'ceremony',
    classification: 'general'
  },
  {
    id: 'item-2',
    day_date: '2026-10-17',
    start_time: '12:00',
    end_time: '13:00',
    title: 'Workshop',
    room: 'Workshop A',
    category: 'workshop',
    classification: '+16'
  }
];

test('normalizes an event summary without fixture-only fields', () => {
  const summary = normalizeEventSummary({ ...rawEvent, item_count: 12 });

  assert.equal(summary.id, 'event-1');
  assert.equal(summary.itemCount, 12);
  assert.equal(summary.dates, 'Oct 16–18, 2026');
  assert.equal(summary.location, 'Guadalajara');
});

test('normalizes detail items and derives available days', () => {
  const event = normalizeEventDetail({ event: rawEvent, items: rawItems });

  assert.deepEqual(event.days, [
    { value: '2026-10-16', label: 'Day 1', dateLabel: 'Oct 16' },
    { value: '2026-10-17', label: 'Day 2', dateLabel: 'Oct 17' }
  ]);
  assert.equal(event.activities[0].time, '10:00 → 11:00');
  assert.equal(event.activities[0].location, 'Main Hall');
  assert.equal(event.activities[1].track, 'workshop');
  assert.equal(event.activities[1].classification, '+16');
  assert.equal(event.nextUp.id, 'item-1');
});

test('filters by day, category, and tracked activity ids', () => {
  const event = normalizeEventDetail({ event: rawEvent, items: rawItems });
  const result = filterActivities(event.activities, {
    day: '2026-10-17',
    category: 'workshop',
    trackedIds: ['item-2'],
    trackedOnly: true
  });

  assert.deepEqual(result.map((activity) => activity.id), ['item-2']);
});

test('returns no activities when tracked-only has no matching ids', () => {
  const event = normalizeEventDetail({ event: rawEvent, items: rawItems });

  assert.deepEqual(filterActivities(event.activities, { trackedOnly: true, trackedIds: [] }), []);
});
