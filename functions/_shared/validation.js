// functions/_shared/validation.js
// UUID, category, and classification validation/normalization

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(str) {
  return UUID_RE.test(str);
}

const VALID_CATEGORIES = [
  'panel', 'meetup', 'workshop', 'fursuit_games',
  'dance', 'ceremony', 'other',
];

const VALID_CLASSIFICATIONS = ['general', '+16', '+18', '+21'];

export function normalizeCategory(cat) {
  return VALID_CATEGORIES.includes(cat) ? cat : 'other';
}

export function normalizeClassification(cls) {
  return VALID_CLASSIFICATIONS.includes(cls) ? cls : 'general';
}
