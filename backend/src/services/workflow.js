// Match + meeting state machines (single source of truth, unit-tested).
// Match: suggested→requested→accepted→completed; requested→declined; waitlisted→requested/declined.
// completed + declined are terminal. Meeting: scheduled→completed/no_show/cancelled (terminal).
const MATCH_FLOW = {
  suggested: ['requested'],
  requested: ['accepted', 'declined'],
  waitlisted: ['requested', 'declined'],
  accepted: ['completed']
};
function canTransition(from, to) {
  if (!from || !to || from === to) return false;
  if (from === 'completed' || from === 'declined') return false;
  return (MATCH_FLOW[from] || []).includes(to);
}
const MEET_TERMINAL = ['completed', 'no_show', 'cancelled'];
function canMeetTransition(from, to) {
  if (!from || !to) return false;
  if (MEET_TERMINAL.includes(from)) return false;
  return ['completed', 'no_show', 'cancelled'].includes(to);
}
module.exports = { MATCH_FLOW, canTransition, MEET_TERMINAL, canMeetTransition };
