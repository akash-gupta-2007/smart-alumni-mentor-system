const express = require('express');
const { v4: uuid } = require('uuid');
const { q, one, J } = require('../config/db');
const { auth, allow } = require('../middleware/auth');
const { v, vId, schemas } = require('../middleware/validate');
const { rank } = require('../services/matchingService');
const { detectConflicts } = require('../services/schedulingService');
const { audit, notify } = require('../middleware/audit');
const r = express.Router();
r.use(auth);
// NOTE (anti-SQLi): every statement below is a constant string with :named binds.
// User input only ever travels in the binds object — never concatenated into SQL.

// ---- Availability: alumni sets weekly slots ----
r.post('/slots', allow('alumni'), v(schemas.slot), async (req, res) => {
  const id = uuid();
  await q(`INSERT INTO availability_slots (id, alumni_user_id, day_of_week, start_time, end_time)
           VALUES (:id, :aid, :d, :st, :et)`,
    { id, aid: req.user.id, d: req.body.day_of_week, st: req.body.start_time, et: req.body.end_time });
  await audit(req.user.id, 'SLOT.CREATED', 'availability_slots', id, req.body, req.ip);
  res.status(201).json({ id, ...req.body });
});
r.get('/slots/:alumniId', async (req, res) => {
  const rows = await q('SELECT id, day_of_week, start_time, end_time FROM availability_slots WHERE alumni_user_id = :aid AND is_blocked = 0',
    { aid: req.params.alumniId });
  res.json(rows.map(s => ({ ...s, day_of_week: Number(s.day_of_week), is_blocked: 0 })));
});

// ---- paging helper: ?q= text search, ?limit= (1-100, default 50), ?offset= ----
function page(req) {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
  const qstr = typeof req.query.q === 'string' ? req.query.q.slice(0, 80) : '';
  return { limit, offset, qstr };
}
// ---- Notifications bell (own only, newest first) ----
r.get('/notifications', async (req, res) => {
  const { limit, offset } = page(req);
  const unreadOnly = req.query.unread === '1';
  const rows = await q(`SELECT id, kind, title, body, link, is_read, created_at FROM notifications
                         WHERE user_id = :who ${unreadOnly ? 'AND is_read = 0' : ''}
                         ORDER BY created_at DESC OFFSET :off ROWS FETCH NEXT :lim ROWS ONLY`,
    { who: req.user.id, off: offset, lim: limit });
  const c = await one('SELECT COUNT(*) AS c FROM notifications WHERE user_id = :who AND is_read = 0', { who: req.user.id });
  res.json({ unread: Number(c.c), items: rows.map(n => ({ ...n, is_read: Number(n.is_read) })) });
});
r.patch('/notifications/:id/read', vId('id'), async (req, res) => {
  const own = await one('SELECT id FROM notifications WHERE id = :id AND user_id = :who',
    { id: req.params.id, who: req.user.id });
  if (!own) return res.status(404).json({ error: 'Notification not found' });
  await q('UPDATE notifications SET is_read = 1 WHERE id = :id', { id: req.params.id });
  res.json({ id: req.params.id, read: true });
});

// ---- Mentorship request (student) ----
r.post('/requests', allow('student'), v(schemas.request), async (req, res) => {
  const id = uuid();
  const b = req.body;
  await q(`INSERT INTO mentorship_requests (id, student_user_id, title, goal_type, domain, language, description)
           VALUES (:id, :sid, :title, :goal, :domain, :lang, :descr)`,
    { id, sid: req.user.id, title: b.title, goal: b.goal_type, domain: b.domain, lang: b.language, descr: b.description || null });
  await audit(req.user.id, 'REQUEST.CREATED', 'mentorship_requests', id, b, req.ip);
  res.status(201).json({ id, ...b });
});
r.get('/requests/open', allow('coordinator', 'admin', 'alumni'), async (req, res) => {
  const { limit, offset, qstr } = page(req);
  const rows = await q(`SELECT id, student_user_id, title, goal_type, domain, language, status, created_at
                          FROM mentorship_requests
                         WHERE status = 'open' ${qstr ? `AND (LOWER(title) LIKE '%' || LOWER(:qstr) || '%' OR LOWER(domain) LIKE '%' || LOWER(:qstr) || '%' OR LOWER(goal_type) LIKE '%' || LOWER(:qstr) || '%')` : ''}
                         ORDER BY created_at DESC OFFSET :off ROWS FETCH NEXT :lim ROWS ONLY`,
    qstr ? { qstr, off: offset, lim: limit } : { off: offset, lim: limit });
  res.json(rows);
});

// ---- Match suggestions: explainable + capacity-aware ----
r.get('/suggest/:requestId', vId('requestId'), async (req, res) => {
  const rq = await one('SELECT id, student_user_id, title, goal_type, domain, language FROM mentorship_requests WHERE id = :id',
    { id: req.params.requestId });
  if (!rq) return res.status(404).json({ error: 'Request not found' });
  // Ownership: students see only their own request's suggestions
  if (req.user.role === 'student' && rq.student_user_id !== req.user.id)
    return res.status(403).json({ error: 'Not your request' });
  const freeDays = Array.isArray(req.query.freeDays)
    ? req.query.freeDays.map(Number).filter(n => n >= 0 && n <= 6)
    : String(req.query.freeDays || '').split(',').map(Number).filter(n => n >= 0 && n <= 6);
  const free = freeDays.length ? freeDays : [1, 3, 5];
  const alums = await q(`SELECT u.id AS user_id, u.full_name, u.languages, a.expertise_tags, a.years_exp, a.max_mentees
                           FROM users u JOIN alumni_profiles a ON a.user_id = u.id WHERE u.is_active = 1`);
  const loads = await q(`SELECT alumni_user_id, COUNT(*) AS c FROM matches
                         WHERE status IN ('accepted','requested') GROUP BY alumni_user_id`);
  const loadMap = Object.fromEntries(loads.map(x => [x.alumni_user_id, Number(x.c)]));
  const allSlots = await q('SELECT alumni_user_id, day_of_week FROM availability_slots WHERE is_blocked = 0');
  const slotsByAlum = {};
  for (const s of allSlots) {
    (slotsByAlum[s.alumni_user_id] = slotsByAlum[s.alumni_user_id] || []).push({ day_of_week: Number(s.day_of_week) });
  }
  for (const a of alums) {
    a.languages = J(a.languages); a.expertise_tags = J(a.expertise_tags);
    a.years_exp = Number(a.years_exp); a.max_mentees = Number(a.max_mentees);
    a.slots = slotsByAlum[a.user_id] || [];
  }
  const ranked = rank({ ...rq, freeDays: free, domainInterests: [rq.domain] }, alums.map(a => ({ ...a, id: a.user_id })), loadMap);
  res.json(ranked.map(x => ({ alumni_id: x.alum.user_id, name: x.alum.full_name, score: x.score, full: x.full, active: x.active, cap: x.alum.max_mentees, breakdown: x.breakdown, reasons: x.reasons })));
});

// ---- Request a match (ownership + duplicate + capacity re-checked inside Oracle via mentor_sec) ----
r.post('/request-match', allow('student'), async (req, res) => {
  const { request_id, alumni_id } = req.body;
  if (!request_id || !alumni_id) return res.status(400).json({ error: 'request_id + alumni_id required' });
  const own = await one('SELECT id FROM mentorship_requests WHERE id = :rid AND student_user_id = :sid',
    { rid: request_id, sid: req.user.id });
  if (!own) return res.status(403).json({ error: 'Not your request' });
  const cap = await one('SELECT max_mentees FROM alumni_profiles WHERE user_id = :aid', { aid: alumni_id });
  if (!cap) return res.status(404).json({ error: 'Alumni not found' });
  const dup = await one('SELECT id, status FROM matches WHERE request_id = :rid AND alumni_user_id = :aid',
    { rid: request_id, aid: alumni_id });
  if (dup) return res.status(409).json({ error: 'Already requested', id: dup.id, status: dup.status });
  const gate = await one('SELECT mentor_sec.fn_capacity_ok(:aid) AS ok FROM DUAL', { aid: alumni_id });
  const full = !gate || Number(gate.ok) !== 1;
  const active = await one(`SELECT COUNT(*) AS c FROM matches WHERE alumni_user_id = :aid
                            AND status IN ('accepted','requested')`, { aid: alumni_id });
  const id = uuid();
  await q(`INSERT INTO matches (id, request_id, alumni_user_id, student_user_id, score, score_breakdown, reasons, status)
           VALUES (:id, :rid, :aid, :sid, :score, :brk, :rsn, :st)`,
    {
      id, rid: request_id, aid: alumni_id, sid: req.user.id, score: full ? 0 : 75,
      brk: JSON.stringify({ note: full ? 'waitlisted-full' : 'requested' }),
      rsn: JSON.stringify(full ? ['Mentor full — waitlisted'] : ['Requested by student']),
      st: full ? 'waitlisted' : 'requested'
    });
  await audit(req.user.id, full ? 'MATCH.WAITLISTED' : 'MATCH.REQUESTED', 'matches', id, { request_id, alumni_id }, req.ip);
  await notify(alumni_id, full ? 'MATCH.WAITLIST' : 'MATCH.REQUEST',
    full ? 'New waitlist entry' : 'New mentorship request',
    full ? 'A student joined your waitlist (you are at capacity).' : 'A student requested your mentorship.', '/app');
  res.status(201).json({ id, status: full ? 'waitlisted' : 'requested', capacity: `${Number(active.c)}/${cap.max_mentees}` });
});

// ---- Profile: view + edit own profile (student/alumni fields by role) ----
r.get('/profile', async (req, res) => {
  const u = await one('SELECT id, email, role, full_name, languages FROM users WHERE id = :id', { id: req.user.id });
  if (!u) return res.status(404).json({ error: 'User not found' });
  u.languages = J(u.languages);
  if (u.role === 'student') {
    const p = await one('SELECT enrollment_no, department, study_year, goals, domain_interests, bio FROM student_profiles WHERE user_id = :id', { id: req.user.id });
    if (p) { p.goals = J(p.goals, {}); p.domain_interests = J(p.domain_interests); p.study_year = p.study_year === null ? null : Number(p.study_year); }
    return res.json({ ...u, profile: p || null });
  }
  if (u.role === 'alumni') {
    const p = await one('SELECT graduation_year, company, designation, expertise_tags, years_exp, max_mentees, bio FROM alumni_profiles WHERE user_id = :id', { id: req.user.id });
    if (p) { p.expertise_tags = J(p.expertise_tags); p.years_exp = Number(p.years_exp); p.max_mentees = Number(p.max_mentees); p.graduation_year = Number(p.graduation_year); }
    const c = await one(`SELECT COUNT(*) AS c FROM matches WHERE alumni_user_id = :aid AND status IN ('accepted','requested')`, { aid: req.user.id });
    return res.json({ ...u, profile: p || null, active_mentees: Number(c.c) });
  }
  return res.json({ ...u, profile: null });
});
r.put('/profile', v(schemas.profile), async (req, res) => {
  const b = req.body;
  await q('UPDATE users SET full_name = :n, languages = :l WHERE id = :id',
    { n: b.full_name, l: JSON.stringify(b.languages), id: req.user.id });
  if (req.user.role === 'student') {
    const ex = await one('SELECT user_id FROM student_profiles WHERE user_id = :id', { id: req.user.id });
    if (ex) await q(`UPDATE student_profiles SET bio = :bio, department = NVL(:dept, department),
                     study_year = NVL(:yr, study_year), domain_interests = NVL(:dom, domain_interests)
                     WHERE user_id = :id`,
      { bio: b.bio || null, dept: b.department || null, yr: b.study_year ?? null, dom: b.domain_interests ? JSON.stringify(b.domain_interests) : null, id: req.user.id });
  } else if (req.user.role === 'alumni') {
    const ex = await one('SELECT user_id FROM alumni_profiles WHERE user_id = :id', { id: req.user.id });
    if (ex) await q(`UPDATE alumni_profiles SET bio = NVL(:bio, bio), company = NVL(:co, company),
                     designation = NVL(:des, designation), expertise_tags = NVL(:tags, expertise_tags),
                     years_exp = NVL(:exp, years_exp), max_mentees = NVL(:cap, max_mentees)
                     WHERE user_id = :id`,
      { bio: b.bio || null, co: b.company || null, des: b.designation || null, tags: b.expertise_tags ? JSON.stringify(b.expertise_tags) : null, exp: b.years_exp ?? null, cap: b.max_mentees ?? null, id: req.user.id });
  }
  await audit(req.user.id, 'PROFILE.UPDATED', 'users', req.user.id, { role: req.user.role }, req.ip);
  res.json({ id: req.user.id, updated: true });
});

// ---- My matches (student sees own, alumni sees incoming; two static queries, no dynamic SQL) ----
r.get('/matches/mine', async (req, res) => {
  const { limit, offset, qstr } = page(req);
  const base = `SELECT m.id, m.status, m.score, m.reasons, m.created_at, m.decided_at,
                       u.full_name AS other_name, r2.title AS request_title
                  FROM matches m JOIN users u ON u.id = OTHER_COL
                  JOIN mentorship_requests r2 ON r2.id = m.request_id
                 WHERE MINE_COL = :who ${qstr ? `AND (LOWER(u.full_name) LIKE '%' || LOWER(:qstr) || '%' OR LOWER(r2.title) LIKE '%' || LOWER(:qstr) || '%')` : ''}
                 ORDER BY m.created_at DESC OFFSET :off ROWS FETCH NEXT :lim ROWS ONLY`;
  const sql = req.user.role === 'alumni'
    ? base.replace('OTHER_COL', 'm.student_user_id').replace('MINE_COL', 'm.alumni_user_id')
    : base.replace('OTHER_COL', 'm.alumni_user_id').replace('MINE_COL', 'm.student_user_id');
  const binds = qstr ? { who: req.user.id, qstr, off: offset, lim: limit } : { who: req.user.id, off: offset, lim: limit };
  res.json(await q(sql, binds));
});

// ---- Slot edit (alumni owns the slot; time order enforced by Oracle CHECK) ----
r.put('/slots/:id', vId('id'), allow('alumni'), v(schemas.slot), async (req, res) => {
  const s = await one('SELECT id FROM availability_slots WHERE id = :id AND alumni_user_id = :aid',
    { id: req.params.id, aid: req.user.id });
  if (!s) return res.status(404).json({ error: 'Slot not found' });
  try {
    await q('UPDATE availability_slots SET day_of_week = :d, start_time = :st, end_time = :et WHERE id = :id',
      { d: req.body.day_of_week, st: req.body.start_time, et: req.body.end_time, id: req.params.id });
  } catch (e) {
    if (e.errorNum === 2290) return res.status(400).json({ error: 'Invalid time range (end must be after start)' });
    throw e;
  }
  await audit(req.user.id, 'SLOT.UPDATED', 'availability_slots', req.params.id, req.body, req.ip);
  res.json({ id: req.params.id, ...req.body });
});

// ---- Slot delete (alumni owns the slot) ----
r.delete('/slots/:id', vId('id'), allow('alumni'), async (req, res) => {
  const s = await one('SELECT id FROM availability_slots WHERE id = :id AND alumni_user_id = :aid',
    { id: req.params.id, aid: req.user.id });
  if (!s) return res.status(404).json({ error: 'Slot not found' });
  await q('DELETE FROM availability_slots WHERE id = :id', { id: req.params.id });
  await audit(req.user.id, 'SLOT.DELETED', 'availability_slots', req.params.id, {}, req.ip);
  res.json({ id: req.params.id, deleted: true });
});

// ---- Match state machine: requested→accepted/declined, accepted→completed; completed/declined terminal ----
const { canTransition, canMeetTransition } = require('../services/workflow');
// ---- Alumni accept / decline (ownership + transition + capacity enforced) ----
r.patch('/matches/:id', vId('id'), allow('alumni', 'coordinator', 'admin'), async (req, res) => {
  const { status } = req.body;
  if (!['accepted', 'declined', 'completed'].includes(status)) return res.status(400).json({ error: 'bad status' });
  const cur = await one('SELECT id, status, alumni_user_id FROM matches WHERE id = :id', { id: req.params.id });
  if (!cur) return res.status(404).json({ error: 'Match not found' });
  if (req.user.role === 'alumni' && cur.alumni_user_id !== req.user.id)
    return res.status(403).json({ error: 'Not your match' });
  if (!canTransition(cur.status, status))
    return res.status(409).json({ error: `Invalid transition ${cur.status} → ${status}` });
  if (status === 'accepted') {
    // TOCTOU-safe: re-check capacity at decision time, inside the DB
    const m = await one('SELECT alumni_user_id FROM matches WHERE id = :id', { id: req.params.id });
    const gate = m && await one('SELECT mentor_sec.fn_capacity_ok(:aid) AS ok FROM DUAL', { aid: m.alumni_user_id });
    if (m && (!gate || Number(gate.ok) !== 1)) return res.status(409).json({ error: 'Mentor at capacity — waitlist instead' });
  }
  await q('UPDATE matches SET status = :st, decided_at = SYSTIMESTAMP WHERE id = :id', { st: status, id: req.params.id });
  await audit(req.user.id, 'MATCH.' + status.toUpperCase(), 'matches', req.params.id, { status }, req.ip);
  const fullRow = await one('SELECT student_user_id, alumni_user_id, request_id FROM matches WHERE id = :id', { id: req.params.id });
  if (fullRow) {
    await notify(fullRow.student_user_id, 'MATCH.' + status.toUpperCase(),
      status === 'accepted' ? 'Mentor accepted your request' : status === 'declined' ? 'Mentor declined your request' : 'Mentorship completed',
      null, '/app');
  }
  // Waitlist promotion: a freed seat goes to the oldest waitlisted match of the same mentor
  let promoted = null;
  if ((status === 'declined' || status === 'completed') && fullRow) {
    const gate = await one('SELECT mentor_sec.fn_capacity_ok(:aid) AS ok FROM DUAL', { aid: fullRow.alumni_user_id });
    if (gate && Number(gate.ok) === 1) {
      const next = await one(`SELECT id, student_user_id FROM matches WHERE alumni_user_id = :aid AND status = 'waitlisted'
                              ORDER BY created_at ASC FETCH FIRST 1 ROWS ONLY`, { aid: fullRow.alumni_user_id });
      if (next) {
        await q(`UPDATE matches SET status = 'requested', decided_at = NULL WHERE id = :id AND status = 'waitlisted'`, { id: next.id });
        await audit(req.user.id, 'MATCH.PROMOTED', 'matches', next.id, { from: 'waitlisted', to: 'requested' }, req.ip);
        await notify(next.student_user_id, 'MATCH.PROMOTED', 'You moved off the waitlist', 'A mentor seat freed up — your request is now active.', '/app');
        promoted = next.id;
      }
    }
  }
  res.json({ id: req.params.id, status, promoted });
});

// ---- Meetings with conflict detection ----
r.post('/meetings', v(schemas.meeting), async (req, res) => {
  const b = req.body;
  const m = await one('SELECT id, student_user_id, alumni_user_id FROM matches WHERE id = :id', { id: b.match_id });
  if (!m) return res.status(404).json({ error: 'Match not found' });
  if (![m.student_user_id, m.alumni_user_id].includes(req.user.id) && !['coordinator', 'admin'].includes(req.user.role))
    return res.status(403).json({ error: 'Not a participant' });
  const existing = await q('SELECT id, scheduled_start, scheduled_end, status FROM meetings WHERE match_id = :mid', { mid: b.match_id });
  const slots = await q('SELECT day_of_week, is_blocked FROM availability_slots WHERE alumni_user_id = :aid', { aid: m.alumni_user_id });
  const chk = detectConflicts(b, existing, slots.map(s => ({ day_of_week: Number(s.day_of_week), is_blocked: Number(s.is_blocked) })));
  if (!chk.ok) return res.status(409).json({ error: 'Scheduling conflict', issues: chk.issues });
  const id = uuid();
  await q(`INSERT INTO meetings (id, match_id, scheduled_start, scheduled_end, meet_mode, meet_link, created_by)
           VALUES (:id, :mid, :st, :et, :mmode, :link, :cby)`,
    { id, mid: b.match_id, st: new Date(b.scheduled_start), et: new Date(b.scheduled_end), mmode: b.mode, link: b.meet_link || null, cby: req.user.id });
  await audit(req.user.id, 'MEETING.SCHEDULED', 'meetings', id, b, req.ip);
  const other = req.user.id === m.student_user_id ? m.alumni_user_id : m.student_user_id;
  await notify(other, 'MEETING.SCHEDULED', 'New meeting scheduled', null, '/app');
  res.status(201).json({ id, ...b });
});
r.patch('/meetings/:id', vId('id'), async (req, res) => {
  const { status, notes, outcomes } = req.body;
  if (status && !['scheduled', 'completed', 'no_show', 'cancelled'].includes(status)) return res.status(400).json({ error: 'bad status' });
  const cur0 = await one('SELECT id, match_id FROM meetings WHERE id = :id', { id: req.params.id });
  if (!cur0) return res.status(404).json({ error: 'Meeting not found' });
  const part = await one('SELECT student_user_id, alumni_user_id FROM matches WHERE id = :id', { id: cur0.match_id });
  if (!part || (![part.student_user_id, part.alumni_user_id].includes(req.user.id) && !['coordinator', 'admin'].includes(req.user.role)))
    return res.status(403).json({ error: 'Not a participant' });
  if (status) {
    const cur = await one('SELECT id, status, match_id FROM meetings WHERE id = :id', { id: req.params.id });
    if (!cur) return res.status(404).json({ error: 'Meeting not found' });
    if (!canMeetTransition(cur.status, status)) return res.status(409).json({ error: `Invalid meeting transition ${cur.status} → ${status}` });
    await q('UPDATE meetings SET status = :st WHERE id = :id', { st: status, id: req.params.id });
  }
  if (notes) {
    if (String(notes).length > 2000) return res.status(400).json({ error: 'notes too long' });
    const ex = await one('SELECT id FROM meeting_logs WHERE meeting_id = :mid', { mid: req.params.id });
    if (ex) await q('UPDATE meeting_logs SET notes = :n, outcomes = :o WHERE meeting_id = :mid',
      { n: String(notes), o: outcomes ? String(outcomes).slice(0, 1000) : null, mid: req.params.id });
    else await q('INSERT INTO meeting_logs (id, meeting_id, notes, outcomes) VALUES (:id, :mid, :n, :o)',
      { id: uuid(), mid: req.params.id, n: String(notes), o: outcomes ? String(outcomes).slice(0, 1000) : null });
  }
  await audit(req.user.id, 'MEETING.UPDATED', 'meetings', req.params.id, req.body, req.ip);
  res.json({ id: req.params.id, status });
});

// ---- My meetings (both roles see matches they belong to) ----
r.get('/meetings/mine', async (req, res) => {
  const { limit, offset, qstr } = page(req);
  const rows = await q(`SELECT g.id, g.match_id, g.scheduled_start, g.scheduled_end, g.status,
                               u.full_name AS other_name
                          FROM meetings g JOIN matches m ON m.id = g.match_id
                          JOIN users u ON u.id = CASE WHEN m.student_user_id = :me THEN m.alumni_user_id ELSE m.student_user_id END
                         WHERE (m.student_user_id = :me OR m.alumni_user_id = :me)
                         ${qstr ? `AND LOWER(u.full_name) LIKE '%' || LOWER(:qstr) || '%'` : ''}
                         ORDER BY g.scheduled_start DESC OFFSET :off ROWS FETCH NEXT :lim ROWS ONLY`,
    qstr ? { me: req.user.id, qstr, off: offset, lim: limit } : { me: req.user.id, off: offset, lim: limit });
  res.json(rows);
});

// ---- Goals ----
r.post('/goals', allow('student'), v(schemas.goal), async (req, res) => {
  const id = uuid();
  await q('INSERT INTO goals (id, student_user_id, match_id, title, target_date) VALUES (:id, :sid, :mid, :title, :td)',
    { id, sid: req.user.id, mid: req.body.match_id || null, title: req.body.title, td: new Date(req.body.target_date) });
  await audit(req.user.id, 'GOAL.CREATED', 'goals', id, req.body, req.ip);
  res.status(201).json({ id });
});
r.get('/goals', async (req, res) => {
  const rows = await q('SELECT id, title, target_date, status, progress_pct FROM goals WHERE student_user_id = :sid ORDER BY target_date',
    { sid: req.user.id });
  res.json(rows.map(g => ({ ...g, progress_pct: Number(g.progress_pct) })));
});
r.patch('/goals/:id', vId('id'), async (req, res) => {  const { status, progress_pct } = req.body;
  if (status && !['not_started', 'in_progress', 'done', 'dropped'].includes(status)) return res.status(400).json({ error: 'bad status' });
  if (progress_pct !== undefined && (Number(progress_pct) < 0 || Number(progress_pct) > 100)) return res.status(400).json({ error: 'bad progress' });
  const own = await one('SELECT id FROM goals WHERE id = :id AND student_user_id = :sid',
    { id: req.params.id, sid: req.user.id });
  if (!own) return res.status(404).json({ error: 'Goal not found' });
  await q(`UPDATE goals SET status = NVL(:st, status), progress_pct = NVL(:pp, progress_pct)
           WHERE id = :id AND student_user_id = :sid`,
    { st: status || null, pp: progress_pct ?? null, id: req.params.id, sid: req.user.id });
  res.json({ id: req.params.id });
});
r.delete('/goals/:id', vId('id'), async (req, res) => {
  const own = await one('SELECT id FROM goals WHERE id = :id AND student_user_id = :sid',
    { id: req.params.id, sid: req.user.id });
  if (!own) return res.status(404).json({ error: 'Goal not found' });
  await q('DELETE FROM goals WHERE id = :id', { id: req.params.id });
  await audit(req.user.id, 'GOAL.DELETED', 'goals', req.params.id, {}, req.ip);
  res.json({ id: req.params.id, deleted: true });
});

// ---- Feedback ----
r.post('/feedback', v(schemas.feedback), async (req, res) => {
  const b = req.body;
  const mt = await one('SELECT id, match_id FROM meetings WHERE id = :id', { id: b.meeting_id });
  if (!mt) return res.status(404).json({ error: 'Meeting not found' });
  const mm = await one('SELECT student_user_id, alumni_user_id FROM matches WHERE id = :id', { id: mt.match_id });
  if (![mm.student_user_id, mm.alumni_user_id].includes(req.user.id)) return res.status(403).json({ error: 'Not a participant' });
  const toId = req.user.id === mm.student_user_id ? mm.alumni_user_id : mm.student_user_id;
  const id = uuid();
  try {
    await q(`INSERT INTO feedback (id, meeting_id, from_user_id, to_user_id, rating, communication_rating, relevance_rating, tags, comment_text)
             VALUES (:id, :mid, :fuser, :tuser, :rating, :comm, :rel, :tags, :cmt)`,
      { id, mid: b.meeting_id, fuser: req.user.id, tuser: toId, rating: b.rating, comm: b.communication_rating ?? null, rel: b.relevance_rating ?? null, tags: JSON.stringify(b.tags), cmt: b.comment || null });
  } catch (e) {
    if (e.errorNum === 1) return res.status(409).json({ error: 'Already rated this meeting' });
    throw e;
  }
  await audit(req.user.id, 'FEEDBACK.SUBMITTED', 'feedback', id, b, req.ip);
  await notify(toId, 'FEEDBACK.SUBMITTED', 'New meeting rating', `You received a ${b.rating}/5 rating.`, '/app');
  res.status(201).json({ id });
});

// ---- Coordinator: audit trail (read-only, paged) ----
r.get('/admin/audit', allow('coordinator', 'admin'), async (req, res) => {
  const { limit, offset, qstr } = page(req);
  const rows = await q(`SELECT id, actor_user_id, action, entity, entity_id, ip, created_at
                          FROM audit_logs
                         ${qstr ? `WHERE LOWER(action) LIKE '%' || LOWER(:qstr) || '%' OR LOWER(entity) LIKE '%' || LOWER(:qstr) || '%'` : ''}
                         ORDER BY id DESC OFFSET :off ROWS FETCH NEXT :lim ROWS ONLY`,
    qstr ? { qstr, off: offset, lim: limit } : { off: offset, lim: limit });
  res.json(rows);
});

// ---- Coordinator dashboard KPIs ----
r.get('/admin/kpis', allow('coordinator', 'admin'), async (req, res) => {
  const sat = await one(`SELECT ROUND(AVG(rating), 2) AS avg_sat, COUNT(*) AS n,
                                ROUND(AVG(communication_rating), 2) AS avg_comm,
                                ROUND(AVG(relevance_rating), 2) AS avg_rel FROM feedback`);
  const students = await one(`SELECT COUNT(*) AS c FROM users WHERE role = 'student' AND is_active = 1`);
  const mentors = await one(`SELECT COUNT(*) AS c FROM users WHERE role = 'alumni' AND is_active = 1`);
  const activeM = await one(`SELECT COUNT(*) AS c FROM matches WHERE status = 'accepted'`);
  const pending = await one(`SELECT COUNT(*) AS c FROM matches WHERE status = 'requested'`);
  const openReq = await one(`SELECT COUNT(*) AS c FROM mentorship_requests WHERE status = 'open'`);
  const upcoming = await one(`SELECT COUNT(*) AS c FROM meetings WHERE status = 'scheduled' AND scheduled_start > SYSTIMESTAMP`);
  const goalsDone = await one(`SELECT COUNT(*) AS c FROM goals WHERE status = 'done'`);
  const goalsTot = await one('SELECT COUNT(*) AS c FROM goals');
  const load = await q('SELECT alumni_id, full_name, max_mentees, active_mentees, load_pct FROM v_mentor_load');
  const conf = await one(`SELECT COUNT(*) AS c FROM meetings WHERE status = 'cancelled'`);
  const tot = await one('SELECT COUNT(*) AS c FROM meetings');
  const loads = load.map(x => Number(x.load_pct) || 0);
  const mean = loads.length ? loads.reduce((a, b) => a + b, 0) / loads.length : 0;
  const sd = loads.length ? Math.sqrt(loads.reduce((a, b) => a + (b - mean) ** 2, 0) / loads.length) : 0;
  res.json({
    satisfaction: sat.avg_sat, feedback_count: Number(sat.n),
    communication: sat.avg_comm, relevance: sat.avg_rel,
    mentor_load: load.map(x => ({ ...x, max_mentees: Number(x.max_mentees), active_mentees: Number(x.active_mentees), load_pct: Number(x.load_pct) })),
    load_stddev: Math.round(sd * 10) / 10,
    conflict_rate: Number(tot.c) ? Math.round(Number(conf.c) / Number(tot.c) * 1000) / 10 : 0,
    total_meetings: Number(tot.c),
    totals: {
      students: Number(students.c), mentors: Number(mentors.c),
      active_matches: Number(activeM.c), pending_requests: Number(pending.c),
      open_requests: Number(openReq.c), upcoming_meetings: Number(upcoming.c),
      goals_done: Number(goalsDone.c), goals_total: Number(goalsTot.c)
    }
  });
});

module.exports = r;
