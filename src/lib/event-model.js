const TRACK_BY_CATEGORY = {
  panel: 'keynote',
  ceremony: 'keynote',
  keynote: 'keynote',
  workshop: 'workshop',
  meetup: 'design',
  dance: 'design',
  fursuit_games: 'business',
  other: 'business'
};

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC'
});

function parseDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = parseDate(value);
  return date ? DATE_FORMATTER.format(date) : value || '';
}

function formatDateRange(start, end) {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  if (!startDate || !endDate) return [start, end].filter(Boolean).join('–');

  const year = endDate.getUTCFullYear();
  return start === end
    ? `${formatDate(start)}, ${year}`
    : `${formatDate(start)}–${endDate.getUTCDate()}, ${year}`;
}

function enumerateDates(start, end) {
  const first = parseDate(start);
  const last = parseDate(end);
  if (!first || !last || first > last) return [];

  const dates = [];
  for (const cursor = new Date(first); cursor <= last; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    dates.push(cursor.toISOString().slice(0, 10));
  }
  return dates;
}

function categoryToTrack(category) {
  return TRACK_BY_CATEGORY[category] || 'business';
}

function normalizeItem(item) {
  const category = item.category || 'other';
  const start = item.start_time || '';
  const end = item.end_time || '';

  return {
    id: item.id,
    title: item.title || 'Untitled activity',
    description: item.description || '',
    speaker: item.speaker || item.presenter || '',
    day: item.day_date || '',
    time: end ? `${start} → ${end}` : start,
    startTime: start,
    endTime: end,
    location: item.room || item.location || 'Location TBA',
    category,
    classification: item.classification || 'general',
    track: categoryToTrack(category)
  };
}

export function normalizeEventSummary(record) {
  return {
    id: record.id,
    name: record.name || 'Untitled event',
    subtitle: record.description || record.location || '',
    status: record.status || 'Upcoming',
    dates: formatDateRange(record.start_date, record.end_date),
    location: record.location || 'Location TBA',
    itemCount: Number(record.item_count || record.itemCount || 0),
    accent: record.accent || '#8B5CF6'
  };
}

export function normalizeEventDetail(payload) {
  const rawEvent = payload?.event || payload || {};
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const activities = items
    .map(normalizeItem)
    .filter((item) => item.id)
    .sort((a, b) => `${a.day}T${a.startTime}`.localeCompare(`${b.day}T${b.startTime}`));

  const itemDays = [...new Set(activities.map((item) => item.day).filter(Boolean))];
  const days = (itemDays.length > 0
    ? itemDays
    : enumerateDates(rawEvent.start_date, rawEvent.end_date)
  ).map((value, index) => ({
    value,
    label: `Day ${index + 1}`,
    dateLabel: formatDate(value)
  }));

  const summary = normalizeEventSummary({
    ...rawEvent,
    item_count: rawEvent.item_count ?? activities.length
  });

  return {
    ...summary,
    subtitle: rawEvent.description || summary.subtitle,
    activities,
    days,
    nextUp: activities[0] || null,
    members: []
  };
}

export function filterActivities(activities, {
  day = 'all',
  category = 'all',
  trackedOnly = false,
  trackedIds = []
} = {}) {
  return activities.filter((activity) => {
    const dayMatches = day === 'all' || activity.day === day;
    const categoryMatches = category === 'all'
      || activity.category === category
      || activity.track === category;
    const trackedMatches = !trackedOnly || trackedIds.includes(activity.id);
    return dayMatches && categoryMatches && trackedMatches;
  });
}

export { categoryToTrack, formatDate, formatDateRange, normalizeItem };
