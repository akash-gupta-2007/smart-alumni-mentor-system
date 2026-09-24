const API = '/api';
async function req(path, opts = {}) {
  const token = localStorage.getItem('mm_token');
  const r = await fetch(API + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  if (r.status === 401 && localStorage.getItem('mm_token')) {
    localStorage.removeItem('mm_token');
    localStorage.removeItem('mm_user');
    if (!location.pathname.includes('/login')) location.href = '/login';
    throw new Error('Session expired — please log in again');
  }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || ('HTTP ' + r.status));
  return data;
}
export const api = {
  register: (b) => req('/auth/register', { method: 'POST', body: b }),
  login: (b) => req('/auth/login', { method: 'POST', body: b }),
  me: () => req('/auth/me'),
  logout: () => req('/auth/logout', { method: 'POST' }),
  profile: () => req('/profile'),
  profileUpdate: (b) => req('/profile', { method: 'PUT', body: b }),
  openRequests: () => req('/requests/open'),
  suggest: (id, freeDays) => req('/suggest/' + id + (freeDays ? '?freeDays=' + encodeURIComponent(freeDays) : '')),
  createRequest: (b) => req('/requests', { method: 'POST', body: b }),
  requestMatch: (b) => req('/request-match', { method: 'POST', body: b }),
  decide: (id, status) => req('/matches/' + id, { method: 'PATCH', body: { status } }),
  slots: (alumniId) => req('/slots/' + alumniId),
  addSlot: (b) => req('/slots', { method: 'POST', body: b }),
  slotUpdate: (id, b) => req('/slots/' + id, { method: 'PUT', body: b }),
  meeting: (b) => req('/meetings', { method: 'POST', body: b }),
  meetingUpdate: (id, b) => req('/meetings/' + id, { method: 'PATCH', body: b }),
  myMeetings: () => req('/meetings/mine'),
  goal: (b) => req('/goals', { method: 'POST', body: b }),
  goals: () => req('/goals'),
  goalUpdate: (id, b) => req('/goals/' + id, { method: 'PATCH', body: b }),
  goalDel: (id) => req('/goals/' + id, { method: 'DELETE' }),
  feedback: (b) => req('/feedback', { method: 'POST', body: b }),
  kpis: () => req('/admin/kpis'),
  mine: () => req('/matches/mine'),
  slotDel: (id) => req('/slots/' + id, { method: 'DELETE' }),
  adminAudit: (q) => req('/admin/audit' + (q ? '?q=' + encodeURIComponent(q) : '')),
  notif: () => req('/notifications?limit=10'),
  notifRead: (id) => req('/notifications/' + id + '/read', { method: 'PATCH' }),
  openRequests: (q) => req('/requests/open' + (q ? '?q=' + encodeURIComponent(q) : '')),
  forgot: (email) => req('/auth/forgot', { method: 'POST', body: { email } }),
  reset: (token, password) => req('/auth/reset', { method: 'POST', body: { token, password } })
};
// Probes whether the API is reachable: /auth/me without a token answers
// 401 when online; a network failure means the backend is down.
export async function apiStatus() {
  try {
    await fetch(API + '/auth/me', { headers: { 'Content-Type': 'application/json' } });
    return 'online';
  } catch { return 'offline'; }
}
// Demo fallback mirroring backend scoring weights so UI never looks dead
export const mockSuggest = () => ([
  { alumni_id: 'a1', name: 'Priya Sharma · DevOps · 6y', score: 87.4, full: false, active: 2, cap: 5, breakdown: { domain: 0.9, goal: 1, lang: 1, avail: 0.66, load_penalty: 0.12 }, reasons: ['Domain overlap: DevOps, Docker (6+ yrs exp)', 'Speaks English', '2 common slot-days: Mon, Wed', 'Bandwidth OK 2/5', 'Goal fit: placement'] },
  { alumni_id: 'a2', name: 'Rahul Verma · AI/ML · 4y', score: 71.8, full: false, active: 1, cap: 4, breakdown: { domain: 0.5, goal: 1, lang: 1, avail: 0.5, load_penalty: 0.07 }, reasons: ['Related expertise: AI/ML, Python', 'Speaks English / Hindi', '1 common slot-day: Mon', 'Bandwidth OK 1/4'] },
  { alumni_id: 'a3', name: 'Sneha Iyer · SDE · 8y', score: 0, full: true, active: 5, cap: 5, breakdown: { domain: 0.8, goal: 1, lang: 1, avail: 1, load_penalty: 0.3 }, reasons: ['FULL 5/5 — auto-waitlisted, never overloaded'] }
]);
