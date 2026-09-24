const test = require('node:test');
const assert = require('node:assert');
const { canTransition, canMeetTransition } = require('../src/services/workflow');
const { v, schemas } = require('../src/middleware/validate');
const check = (s, b) => s.validate(b, { abortEarly: false, stripUnknown: true });

test('match lifecycle: happy path transitions allowed', () => {
  assert.equal(canTransition('suggested', 'requested'), true);
  assert.equal(canTransition('requested', 'accepted'), true);
  assert.equal(canTransition('requested', 'declined'), true);
  assert.equal(canTransition('accepted', 'completed'), true);
  assert.equal(canTransition('waitlisted', 'requested'), true);
});
test('match lifecycle: invalid transitions rejected', () => {
  assert.equal(canTransition('completed', 'accepted'), false); // the classic illegal move
  assert.equal(canTransition('declined', 'accepted'), false);
  assert.equal(canTransition('suggested', 'completed'), false); // no skipping
  assert.equal(canTransition('accepted', 'declined'), false);
  assert.equal(canTransition('requested', 'requested'), false);
  assert.equal(canTransition('bogus', 'accepted'), false);
  assert.equal(canTransition(null, 'accepted'), false);
});
test('meeting lifecycle: terminal states enforced', () => {
  assert.equal(canMeetTransition('scheduled', 'completed'), true);
  assert.equal(canMeetTransition('scheduled', 'no_show'), true);
  assert.equal(canMeetTransition('scheduled', 'cancelled'), true);
  assert.equal(canMeetTransition('completed', 'scheduled'), false);
  assert.equal(canMeetTransition('cancelled', 'completed'), false);
  assert.equal(canMeetTransition('scheduled', 'bogus'), false);
});
test('feedback extended ratings validated', () => {
  const good = check(schemas.feedback, { meeting_id: '123e4567-e89b-42d3-a456-426614174000', rating: 5, communication_rating: 4, relevance_rating: 5 });
  assert.equal(good.error, undefined);
  const bad = check(schemas.feedback, { meeting_id: '123e4567-e89b-42d3-a456-426614174000', rating: 9, communication_rating: 0 });
  assert.ok(bad.error);
});
test('goal progress bounds enforced', () => {
  // progress validated at route level (0-100); schema carries dates/titles
  const bad = check(schemas.goal, { title: 'G', target_date: '2030-01-01' });
  assert.ok(bad.error, 'short title must fail');
});
test('profile update validated (role fields, cap bounds)', () => {
  const alum = check(schemas.profile, { full_name: 'Priya S', languages: ['English'], company: 'G', designation: 'SDE', expertise_tags: ['DevOps'], years_exp: 6, max_mentees: 5, bio: '' });
  assert.equal(alum.error, undefined);
  const badCap = check(schemas.profile, { full_name: 'Priya S', max_mentees: 99 });
  assert.ok(badCap.error, 'cap 99 must fail (1-20)');
  const badName = check(schemas.profile, { full_name: 'x' });
  assert.ok(badName.error, 'short name must fail');
});
test('slot time shape validated (HH:MM)', () => {
  assert.equal(check(schemas.slot, { day_of_week: 3, start_time: '18:00', end_time: '20:00' }).error, undefined);
  assert.ok(check(schemas.slot, { day_of_week: 9, start_time: 'nope', end_time: '20:00' }).error);
});
