// Baseline vs proposed matching experiment (REAL run on synthetic Oracle data).
// BASELINE: greedy domain-only pick, first-come-first-served, ignores capacity.
// PROPOSED: weighted multi-factor score + capacity penalty + waitlist (matchingService.rank).
// Metrics: domain-hit rate, capacity violations, avg top-1 score, full-mentor picks.
// Run: node scripts/baseline-compare.js  (needs Oracle up + seed data)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const oracledb = require('oracledb');
const { q, J } = require('../src/config/db');
const { rank } = require('../src/services/matchingService');

async function main() {
  const alums = await q(`SELECT u.id AS user_id, u.full_name, u.languages, a.expertise_tags, a.years_exp, a.max_mentees
                           FROM users u JOIN alumni_profiles a ON a.user_id = u.id WHERE u.is_active = 1`);
  for (const a of alums) {
    a.languages = J(a.languages); a.expertise_tags = J(a.expertise_tags);
    a.years_exp = Number(a.years_exp); a.max_mentees = Number(a.max_mentees);
    const sl = await q('SELECT day_of_week FROM availability_slots WHERE alumni_user_id = :aid AND is_blocked = 0', { aid: a.user_id });
    a.slots = sl.map(s => ({ day_of_week: Number(s.day_of_week) }));
  }
  const loads = await q(`SELECT alumni_user_id, COUNT(*) AS c FROM matches WHERE status IN ('accepted','requested') GROUP BY alumni_user_id`);
  const loadMap = Object.fromEntries(loads.map(x => [x.alumni_user_id, Number(x.c)]));

  // 25 synthetic requests spanning all domains/goals/languages (covers edge: rare domain, Marathi-only)
  const DOMAINS = ['DevOps', 'AI/ML', 'Web Dev', 'Data Science', 'Cybersecurity', 'Mobile', 'Blockchain'];
  const reqs = DOMAINS.flatMap((d, i) => [
    { domain: d, domainInterests: [d], goal_type: ['placement', 'skill', 'startup'][i % 3], language: i % 4 === 3 ? 'Marathi' : 'English', freeDays: [1, 3, 5] },
    { domain: d, domainInterests: [d], goal_type: 'higher_studies', language: 'Hindi', freeDays: [0, 6] }
  ]);

  let baseHits = 0, baseViol = 0, baseFull = 0;
  let propHits = 0, propViol = 0, propFull = 0, propScore = 0;
  const sim = {}; // simulated load so capacity pressure is visible
  for (const rq of reqs) {
    // BASELINE: first alumni whose tags include the domain (or first alumni), no capacity check
    const b = alums.find(a => a.expertise_tags.map(String).includes(rq.domain)) || alums[0];
    const bTags = b.expertise_tags.map(String);
    if (bTags.includes(rq.domain)) baseHits++;
    const bLoad = (loadMap[b.user_id] || 0) + (sim[b.user_id] || 0);
    if (bLoad >= b.max_mentees) { baseViol++; baseFull++; }
    sim[b.user_id] = (sim[b.user_id] || 0) + 1;
    // PROPOSED
    const ranked = rank(rq, alums.map(a => ({ ...a, id: a.user_id })), Object.fromEntries(
      alums.map(a => [a.user_id, (loadMap[a.user_id] || 0) + (sim['p:' + a.user_id] || 0)])));
    const top = ranked[0];
    propScore += top.score;
    if (top.full) { propFull++; }
    else {
      sim['p:' + top.alum.user_id] = (sim['p:' + top.alum.user_id] || 0) + 1;
      if (top.breakdown.domain >= 0.5) propHits++;
      const pl = (loadMap[top.alum.user_id] || 0) + (sim['p:' + top.alum.user_id] || 0);
      if (pl > top.alum.max_mentees) propViol++;
    }
  }
  const n = reqs.length;
  const out = {
    requests: n, alumni: alums.length,
    baseline: { domain_hit_pct: pct(baseHits / n), capacity_violations: baseViol, full_mentor_picks: baseFull, explains: false, capacity_aware: false },
    proposed: { domain_hit_pct: pct(propHits / n), capacity_violations: propViol, waitlisted_full: propFull, avg_top1_score: Math.round(propScore / n * 10) / 10, explains: true, capacity_aware: true }
  };
  console.log(JSON.stringify(out, null, 2));
  try { await oracledb.getPool().close(5); } catch { /* pool may not exist */ }
  process.exit(0);
}
const pct = x => Math.round(x * 1000) / 10;
main().catch(e => { console.error('BASELINE_FAIL: ' + e.message); process.exit(1); });
