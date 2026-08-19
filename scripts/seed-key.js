// scripts/seed-key.js — first-time maintainer key seed (OVERWRITES auth/keys.json)
// Usage: node scripts/seed-key.js [label]
// Generates a random 32-byte key, stores ONLY its SHA-256 hash in R2,
// and prints the raw key once for the operator to store securely.
import { randomBytes, createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BUCKET = 'spotpack-data';
const OBJECT = 'auth/keys.json';
const label = process.argv[2] || 'Seed Key';

const rawKey = randomBytes(32).toString('hex');
const hash = `sha256:${createHash('sha256').update(rawKey).digest('hex')}`;

const keys = [
  { key_hash: hash, role: 'maintainer', label, created_at: new Date().toISOString() },
];

const tmp = join(tmpdir(), 'spotpack-auth-keys.json');
writeFileSync(tmp, JSON.stringify(keys, null, 2));

execSync(`npx wrangler r2 object put ${BUCKET}/${OBJECT} --file "${tmp}" --remote`, {
  stdio: 'inherit',
});

console.log('\n=== NEW MAINTAINER KEY (shown once — store securely) ===');
console.log(rawKey);
console.log('========================================================');
console.log('Stored hash:', hash);
