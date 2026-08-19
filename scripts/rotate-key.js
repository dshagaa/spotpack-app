// scripts/rotate-key.js — add a new maintainer key and revoke the old one
// Usage: node scripts/rotate-key.js [label] [--revoke <label_to_remove>]
// Reads current keys from R2, appends a fresh maintainer key (hash only),
// and optionally removes old keys by label. Prints the new raw key once.
import { randomBytes, createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BUCKET = 'spotpack-data';
const OBJECT = 'auth/keys.json';

const args = process.argv.slice(2);
const revokeIdx = args.indexOf('--revoke');
const revokeLabel = revokeIdx !== -1 ? args[revokeIdx + 1] : null;
const label = args.find(a => !a.startsWith('--') && a !== revokeLabel) || 'Rotated Key';

// Read current keys from remote R2
let keys;
try {
  keys = JSON.parse(
    execSync(`npx wrangler r2 object get ${BUCKET}/${OBJECT} --remote --pipe`, { encoding: 'utf8' }),
  );
} catch {
  console.error('Failed to read auth/keys.json from R2. Ensure the bucket/object exists.');
  process.exit(1);
}

const rawKey = randomBytes(32).toString('hex');
const hash = `sha256:${createHash('sha256').update(rawKey).digest('hex')}`;

// Remove revoked keys (match by label)
const removed = revokeLabel
  ? keys.filter(k => k.label === revokeLabel)
  : [];
const next = revokeLabel
  ? keys.filter(k => k.label !== revokeLabel)
  : keys;

next.push({ key_hash: hash, role: 'maintainer', label, created_at: new Date().toISOString() });

const tmp = join(tmpdir(), 'spotpack-auth-keys.json');
writeFileSync(tmp, JSON.stringify(next, null, 2));
execSync(`npx wrangler r2 object put ${BUCKET}/${OBJECT} --file "${tmp}" --remote`, {
  stdio: 'inherit',
});

console.log('\n=== NEW MAINTAINER KEY (shown once — store securely) ===');
console.log(rawKey);
console.log('========================================================');
console.log('Stored hash:', hash);
if (revokeLabel) {
  console.log(`Revoked ${removed.length} key(s) with label "${revokeLabel}"`);
}
console.log(`Total keys now: ${next.length}`);
