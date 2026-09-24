const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { v, schemas } = require('../src/middleware/validate');

// helper: run a Joi schema synchronously
function check(schema, body) {
  return schema.validate(body, { abortEarly: false, stripUnknown: true });
}

// --- 1. SQL-injection payloads must die at validation (never reach Oracle) ---
const INJECTIONS = [
  "' OR '1'='1",
  "'; DROP TABLE users;--",
  'admin"--',
  "' UNION SELECT password_hash FROM users--",
  '1 OR 1=1'
];
test('SQLi strings rejected as emails (login/register)', () => {
  for (const p of INJECTIONS) {
    const { error } = check(schemas.login, { email: p, password: 'Password123!Aa' });
    assert.ok(error, `payload passed validation: ${p}`);
  }
});

test('NoSQL-style hostile keys stripped, never trusted', () => {
  const { error, value } = check(schemas.login, { email: 'a@b.com', password: 'x'.repeat(10) + 'A1', $ne: 1 });
  assert.equal(error, undefined);
  assert.equal(value.$ne, undefined);
  assert.equal(Object.prototype.hasOwnProperty.call(value, '__proto__'), false);
  assert.equal(value.isAdmin, undefined);
});

test('oversized + malformed bodies rejected (DoS / buffer abuse)', () => {
  const { error: e1 } = check(schemas.feedback, { meeting_id: 'x'.repeat(5000), rating: 5 });
  assert.ok(e1);
  const { error: e2 } = check(schemas.feedback, { meeting_id: '1 OR 1=1', rating: 5 });
  assert.ok(e2);
  const { error: e3 } = check(schemas.register, { email: 'a@b.com', password: 'short', full_name: 'x', role: 'admin' });
  assert.ok(e3, 'weak password + admin role must fail');
});

test('password policy enforced (10+ chars, upper+lower+digit)', () => {
  assert.ok(check(schemas.register, { email: 'a@b.com', password: 'Password123!', full_name: 'Test User', role: 'student', consent: true }).error === undefined);
  for (const bad of ['short1Aa', 'alllowercase123', 'ALLUPPER123', 'NoDigitsHere!']) {
    const { error } = check(schemas.register, { email: 'a@b.com', password: bad, full_name: 'Test User', role: 'student', consent: true });
    assert.ok(error, `weak password accepted: ${bad}`);
  }
});
test('explicit data-consent required at registration', () => {
  const { error: missing } = check(schemas.register, { email: 'a@b.com', password: 'Password123!', full_name: 'Test User', role: 'student' });
  assert.ok(missing, 'registration without consent must fail');
  const { error: refused } = check(schemas.register, { email: 'a@b.com', password: 'Password123!', full_name: 'Test User', role: 'student', consent: false });
  assert.ok(refused, 'consent=false must fail');
});

// --- 2. Static guard: no string-interpolated SQL anywhere in backend ---
test('no ${} interpolation inside SQL statements', () => {
  const src = path.join(__dirname, '..', 'src');
  const bad = [];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return walk(p);
    if (!p.endsWith('.js')) return;
    const lines = fs.readFileSync(p, 'utf8').split('\n');
    lines.forEach((ln, i) => {
      if (/\b(SELECT|INSERT|UPDATE|DELETE|MERGE|BEGIN)\b/i.test(ln) && ln.includes('${')) bad.push(`${p}:${i + 1}`);
    });
  });
  walk(src);
  assert.deepEqual(bad, [], 'interpolated SQL found (injection risk)');
});

// --- 2b. No Oracle-reserved words as bind names (ORA-01745 at runtime) ---
test('no reserved words used as :bind names', () => {
  const RESERVED = ['uid', 'mode', 'by', 'from', 'to', 'comment', 'user', 'date', 'level', 'size', 'type', 'group', 'order', 'select', 'where'];
  const srcDir = path.join(__dirname, '..', 'src');
  const found = new Set();
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return walk(p);
    if (!p.endsWith('.js')) return;
    const src = fs.readFileSync(p, 'utf8');
    for (const m of src.matchAll(/:([a-zA-Z][a-zA-Z0-9_]*)/g)) {
      if (RESERVED.includes(m[1].toLowerCase())) found.add(`${p.split('src')[1]}:${m[1]}`);
    }
  });
  walk(srcDir);
  assert.deepEqual([...found], [], 'reserved bind names (ORA-01745 risk)');
});

// --- 3. Hostile input must not crash the engines (robustness) ---
test('matching + scheduling survive hostile input', () => {
  const { scorePair } = require('../src/services/matchingService');
  const { detectConflicts } = require('../src/services/schedulingService');
  const evil = { domain: "x'; DROP TABLE--", domainInterests: null, goal_type: {}, language: 12345, freeDays: 'everyday' };
  const alum = { expertise_tags: 'not-an-array', languages: null, slots: null, max_mentees: 0 };
  assert.doesNotThrow(() => scorePair(evil, alum, NaN));
  assert.doesNotThrow(() => detectConflicts({ scheduled_start: 'not-a-date', scheduled_end: null }, [{ scheduled_start: 1 }], 'x'));
});
