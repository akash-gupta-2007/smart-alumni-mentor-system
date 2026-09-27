const test = require('node:test');
const assert = require('node:assert');
const { detectConflicts } = require('../src/services/schedulingService');
const { schemas } = require('../src/middleware/validate');
const check = (s, b) => s.validate(b, { abortEarly: false, stripUnknown: true });

const DAY = '2030-06-03T10:00:00Z'; // a Monday (dow 1)
const LATER = '2030-06-03T11:00:00Z';

test('availability: meeting inside mentor slots is allowed', () => {
  const chk = detectConflicts(
    { scheduled_start: DAY, scheduled_end: LATER }, [],
    [{ day_of_week: 1, is_blocked: 0 }]);
  assert.equal(chk.ok, true);
});

test('availability: meeting outside mentor days rejected (OUTSIDE_AVAILABILITY)', () => {
  const chk = detectConflicts(
    { scheduled_start: DAY, scheduled_end: LATER }, [],
    [{ day_of_week: 3, is_blocked: 0 }]);
  assert.equal(chk.ok, false);
  assert.ok(chk.issues.includes('OUTSIDE_AVAILABILITY'));
});

test('availability: blocked slots do not count as available', () => {
  const chk = detectConflicts(
    { scheduled_start: DAY, scheduled_end: LATER }, [],
    [{ day_of_week: 1, is_blocked: 1 }]);
  assert.equal(chk.ok, false);
  assert.ok(chk.issues.includes('OUTSIDE_AVAILABILITY'));
});

test('availability: overlapping meeting rejected, cancelled ignored', () => {
  const over = detectConflicts(
    { scheduled_start: DAY, scheduled_end: LATER },
    [{ id: 'm1', scheduled_start: '2030-06-03T10:30:00Z', scheduled_end: '2030-06-03T11:30:00Z', status: 'scheduled' }],
    [{ day_of_week: 1, is_blocked: 0 }]);
  assert.equal(over.ok, false);
  assert.ok(over.issues.some(i => i.startsWith('OVERLAP')));
  const cancelled = detectConflicts(
    { scheduled_start: DAY, scheduled_end: LATER },
    [{ id: 'm1', scheduled_start: '2030-06-03T10:30:00Z', scheduled_end: '2030-06-03T11:30:00Z', status: 'cancelled' }],
    [{ day_of_week: 1, is_blocked: 0 }]);
  assert.equal(cancelled.ok, true);
});

test('availability: end-before-start and past dates rejected', () => {
  const bad = detectConflicts(
    { scheduled_start: LATER, scheduled_end: DAY }, [],
    [{ day_of_week: 1, is_blocked: 0 }]);
  assert.equal(bad.ok, false);
  assert.ok(bad.issues.includes('END_BEFORE_START'));
  const past = detectConflicts(
    { scheduled_start: '2020-01-06T10:00:00Z', scheduled_end: '2020-01-06T11:00:00Z' }, [],
    [{ day_of_week: 1, is_blocked: 0 }]);
  assert.equal(past.ok, false);
  assert.ok(past.issues.includes('PAST_DATE'));
});

test('availability: slot schema enforces day + HH:MM shape', () => {
  assert.equal(check(schemas.slot, { day_of_week: 3, start_time: '18:00', end_time: '20:00' }).error, undefined);
  assert.ok(check(schemas.slot, { day_of_week: 9, start_time: '18:00', end_time: '20:00' }).error, 'day 9 must fail');
  assert.ok(check(schemas.slot, { day_of_week: 3, start_time: 'nope', end_time: '20:00' }).error, 'bad time must fail');
});
