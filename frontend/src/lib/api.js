const API = '/api';
// Single-flight refresh: parallel 401s (tab switch fires several API calls at
// once) must share ONE rotation. Refresh tokens are one-time-use server-side,
// so firing N concurrent refreshes revokes N-1 of them and logs the user out.
let refreshPromise = null;
function doRefresh() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = localStorage.getItem('mm_refresh');
      if (!refreshToken) throw new Error('no refresh token');
      const rr = await fetch(API + '/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      const dd = await rr.json().catch(() => ({}));
      if (!rr.ok || !dd.token) throw new Error(dd.error || 'refresh failed');
      localStorage.setItem('mm_token', dd.token);
      if (dd.refreshToken) localStorage.setItem('mm_refresh', dd.refreshToken);
      if (dd.user) localStorage.setItem('mm_user', JSON.stringify(dd.user));
    })().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}
// Decode JWT exp locally to avoid needless 401 round-trips
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.exp * 1000 < Date.now() + 30000; // 30s buffer
  } catch { return true; }
}
async function req(path, opts = {}, retried = false) {
  const token = localStorage.getItem('mm_token');
  // Proactively refresh if token is expired (or about to expire) before sending
  if (token && isTokenExpired(token) && localStorage.getItem('mm_refresh') && !path.startsWith('/auth/')) {
    try { await doRefresh(); }
    catch { /* fall through, let the 401 handler deal with it */ }
  }
  const freshToken = localStorage.getItem('mm_token');
  const r = await fetch(API + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(freshToken ? { Authorization: 'Bearer ' + freshToken } : {}), ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  // 401 on protected endpoint → try one silent refresh
  if (r.status === 401 && !retried && !path.startsWith('/auth/') && localStorage.getItem('mm_refresh')) {
    try { await doRefresh(); return req(path, opts, true); }
    catch { /* fall through to logout */ }
  }
  // Only treat 401 as session expiry. 403/404/500 etc. are NOT logout triggers.
  if (r.status === 401 && !path.startsWith('/auth/') && localStorage.getItem('mm_token')) {
    localStorage.removeItem('mm_token');
    localStorage.removeItem('mm_refresh');
    localStorage.removeItem('mm_user');
    window.dispatchEvent(new Event('mm:logout'));
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
  logout: () => req('/auth/logout', { method: 'POST', body: { refreshToken: localStorage.getItem('mm_refresh') } }),
  refresh: () => req('/auth/refresh', { method: 'POST', body: { refreshToken: localStorage.getItem('mm_refresh') } }),
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
  profileDel: () => req('/profile', { method: 'DELETE' }),
  adminUsers: (q) => req('/admin/users' + (q ? '?q=' + encodeURIComponent(q) : '')),
  adminUserUpdate: (id, b) => req('/admin/users/' + id, { method: 'PATCH', body: b }),
  exportCsv: (which) => fetch('/api/admin/export/' + which, { headers: { Authorization: 'Bearer ' + localStorage.getItem('mm_token') } }).then(r => { if (!r.ok) throw new Error('Export failed'); return r.blob(); }).then(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = which + '.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }),
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
export function saveSession(r) {
  localStorage.setItem('mm_token', r.token);
  if (r.refreshToken) localStorage.setItem('mm_refresh', r.refreshToken);
  if (r.user) localStorage.setItem('mm_user', JSON.stringify(r.user));
}
export function clearSession() {
  localStorage.removeItem('mm_token');
  localStorage.removeItem('mm_refresh');
  localStorage.removeItem('mm_user');
}
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
