// Scheduling conflict detector: overlapping meetings + double-book + past-date + blocked slots
function overlaps(aStart, aEnd, bStart, bEnd) {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
}
function detectConflicts(proposed, existingMeetings = [], alumniSlots = []) {
  const issues = [];
  proposed = (proposed && typeof proposed === 'object') ? proposed : {};
  existingMeetings = Array.isArray(existingMeetings) ? existingMeetings : [];
  alumniSlots = Array.isArray(alumniSlots) ? alumniSlots : [];
  const s = new Date(proposed.scheduled_start), e = new Date(proposed.scheduled_end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return { ok: false, issues: ['INVALID_DATETIME'] };
  if (s >= e) issues.push('END_BEFORE_START');
  if (s < new Date()) issues.push('PAST_DATE');
  for (const m of existingMeetings) {
    if (!m || typeof m !== 'object' || m.status === 'cancelled') continue;
    if (overlaps(s, e, m.scheduled_start, m.scheduled_end)) { issues.push(`OVERLAP:${m.id}`); break; }
  }
  if (alumniSlots.length) {
    const day = s.getDay();
    const ok = alumniSlots.some(sl => sl && typeof sl === 'object' && +sl.day_of_week === day && !+sl.is_blocked);
    if (!ok) issues.push('OUTSIDE_AVAILABILITY');
  }
  return { ok: issues.length === 0, issues };
}
module.exports = { detectConflicts, overlaps };
