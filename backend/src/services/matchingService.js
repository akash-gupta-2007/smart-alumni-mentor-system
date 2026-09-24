// Explainable + Capacity-Aware Matching Engine (core intelligence)
// Score = 0.40*domain + 0.25*goal + 0.15*lang + 0.20*availability, then capacity penalty.
// Every result carries score_breakdown + human reasons (explainability) + capacity flag.
// Hardening: every input is coerced — hostile / malformed values can never
// throw. Validation (Joi) is layer 1; this coercion is layer 2 (defense in depth).
function toArr(x) { return Array.isArray(x) ? x : []; }
function toObj(x) { return (x && typeof x === 'object' && !Array.isArray(x)) ? x : {}; }
function toCap(n) { n = Number(n); return Number.isFinite(n) && n >= 1 ? Math.min(Math.floor(n), 100) : 5; }
function toCount(n) { n = Number(n); return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0; }
function jaccard(a = [], b = []) {
  a = toArr(a); b = toArr(b);
  const A = new Set(a.map(String).map(s => s.toLowerCase()));
  const B = new Set(b.map(String).map(s => s.toLowerCase()));
  if (!A.size && !B.size) return 0;
  let inter = 0; for (const x of A) if (B.has(x)) inter++;
  return inter / new Set([...A, ...B]).size;
}

function availabilityOverlap(studentFree = [], alumniSlots = []) {
  // studentFree: [dayInts], alumniSlots: [{day_of_week}] -> fraction of student days covered
  studentFree = toArr(studentFree).map(Number).filter(Number.isFinite);
  alumniSlots = toArr(alumniSlots);
  if (!studentFree.length || !alumniSlots.length) return 0;
  const alumDays = new Set(alumniSlots.map(s => +s.day_of_week));
  const hit = studentFree.filter(d => alumDays.has(+d)).length;
  return hit / studentFree.length;
}

function scorePair(req, alum, activeCount) {
  req = toObj(req); alum = toObj(alum);
  const reqTags = toArr(req.domainInterests);
  const expTags = toArr(alum.expertise_tags);
  const langs = toArr(alum.languages);
  const slots = toArr(alum.slots);
  const free = toArr(req.freeDays);
  const domain = jaccard(reqTags.length ? reqTags : [req.domain], expTags);
  const supported = toArr(alum.goals_supported).map(String);
  const goal = (req.goal_type && supported.includes(String(req.goal_type))) ? 1
    : expTags.join(' ').toLowerCase().includes(String(req.goal_type || '').toLowerCase()) ? 0.6 : 0.3;
  const lang = langs.includes(req.language) ? 1 : 0;
  const avail = availabilityOverlap(free.length ? free : [1, 3, 5], slots);
  const raw = 0.40 * domain + 0.25 * goal + 0.15 * lang + 0.20 * avail;
  const cap = toCap(alum.max_mentees);
  const active = toCount(activeCount);
  const load = Math.min(activeCount / cap, 1.2);
  const full = activeCount >= cap;
  const penalty = 0.30 * Math.min(load, 1);
  const final = full ? 0 : Math.round(raw * (1 - penalty) * 10000) / 100;

  const reasons = [];
  const overlap = reqTags.filter(d => expTags.map(String).includes(String(d)));
  if (overlap.length) reasons.push(`Domain overlap: ${overlap.slice(0, 3).join(', ')} (${Number(alum.years_exp) || 1}+ yrs exp)`);
  else if (domain > 0) reasons.push(`Related expertise: ${expTags.slice(0, 3).join(', ')}`);
  reasons.push(lang ? `Speaks ${req.language}` : `Language gap — prefers ${langs.join('/') || '—'}`);
  const common = free.filter(d => slots.some(s => s && +s.day_of_week === +d));
  if (common.length) reasons.push(`${common.length} common slot-day(s): ${common.map(dayName).join(', ')}`);
  reasons.push(full ? `FULL ${activeCount}/${cap} — join waitlist` : `Bandwidth OK ${activeCount}/${cap}`);
  if (goal === 1) reasons.push(`Goal fit: ${req.goal_type}`);

  return {
    score: final, full,
    breakdown: { domain: r2(domain), goal: r2(goal), lang, avail: r2(avail), load_penalty: r2(penalty), load_ratio: r2(load) },
    reasons
  };
}
function dayName(d) { return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][+d] || `D${d}`; }
function r2(n) { n = Number(n); return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0; }

function rank(request, alumniList, loadMap) {
  alumniList = toArr(alumniList); loadMap = toObj(loadMap);
  return alumniList
    .map(a => ({ alum: a, active: loadMap[a.user_id] ?? loadMap[a.id] ?? 0 }))
    .map(({ alum, active }) => ({ alum, active, ...scorePair(request, alum, active) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, 5);
}

module.exports = { scorePair, rank, jaccard, availabilityOverlap };
