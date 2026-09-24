const test = require('node:test');
const assert = require('node:assert');
const { scorePair, rank } = require('../src/services/matchingService');
const { detectConflicts } = require('../src/services/schedulingService');

test('explainable score prefers domain+language fit', () => {
  const req = { domain: 'DevOps', domainInterests: ['DevOps'], goal_type: 'placement', language: 'English', freeDays: [1, 3] };
  const good = { expertise_tags: ['DevOps', 'K8s'], languages: ['English'], slots: [{ day_of_week: 1 }, { day_of_week: 3 }], max_mentees: 5, years_exp: 4 };
  const bad = { expertise_tags: ['Design'], languages: ['Marathi'], slots: [{ day_of_week: 0 }], max_mentees: 5, years_exp: 1 };
  const g = scorePair(req, good, 1), b = scorePair(req, bad, 1);
  assert.ok(g.score > b.score);
  assert.ok(g.reasons.length >= 3);
  assert.ok(g.breakdown.domain > b.breakdown.domain);
});
test('capacity-aware: full mentor excluded / waitlisted', () => {
  const req = { domain: 'AI/ML', domainInterests: ['AI/ML'], goal_type: 'skill', language: 'English', freeDays: [1] };
  const alum = { expertise_tags: ['AI/ML'], languages: ['English'], slots: [{ day_of_week: 1 }], max_mentees: 2 };
  const r = scorePair(req, alum, 2);
  assert.equal(r.full, true); assert.equal(r.score, 0);
});
test('scheduling conflict detected', () => {
  const chk = detectConflicts(
    { scheduled_start: '2030-05-01T10:00:00Z', scheduled_end: '2030-05-01T11:00:00Z' },
    [{ id: 'm1', scheduled_start: '2030-05-01T10:30:00Z', scheduled_end: '2030-05-01T11:30:00Z', status: 'scheduled' }], []);
  assert.equal(chk.ok, false);
});
