import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../theme/ThemeContext.jsx';
import { api } from '../lib/api.js';
function Bell() {
  const [n, setN] = useState({ unread: 0, items: [] });
  const [open, setOpen] = useState(false);
  const logged = !!localStorage.getItem('mm_token');
  useEffect(() => {
    if (!logged) return;
    let stop = false;
    const load = () => api.notif().then(d => { if (!stop) setN(d); }).catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => { stop = true; clearInterval(t); };
  }, [logged]);
  if (!logged) return null;
  return (
    <span style={{ position: 'relative' }}>
      <button className="btn btn-ghost btn-sm" aria-label="Notifications" onClick={() => setOpen(o => !o)}>🔔{n.unread > 0 && <b style={{ color: 'var(--gold-soft)' }}> {n.unread}</b>}</button>
      {open && (
        <div className="card" style={{ position: 'absolute', right: 0, top: '110%', width: 300, zIndex: 50, padding: 12 }}>
          {!n.items.length && <p style={{ color: 'var(--muted)', fontSize: 13 }}>No notifications yet.</p>}
          {n.items.map(x => (
            <div key={x.id} style={{ borderBottom: '1px solid var(--line)', padding: '8px 0', opacity: x.is_read ? 0.65 : 1 }}>
              <b style={{ fontSize: 13 }}>{x.title}</b>
              {x.body && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{x.body}</div>}
              {!x.is_read && <button className="btn btn-ghost btn-sm" style={{ marginTop: 4 }} onClick={() => api.notifRead(x.id).then(() => setN({ ...n, unread: Math.max(0, n.unread - 1), items: n.items.map(i => i.id === x.id ? { ...i, is_read: 1 } : i) }))}>Mark read</button>}
            </div>
          ))}
        </div>
      )}
    </span>
  );
}
async function doLogout(nav) {
  try { await api.logout(); } catch { /* audit best-effort; token is client-side */ }
  localStorage.removeItem('mm_token');
  localStorage.removeItem('mm_user');
  nav('/');
}
export default function Navbar() {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const user = JSON.parse(localStorage.getItem('mm_user') || 'null');
  return (
    <div className="nav">
      <div className="nav-inner">
        <Link to="/" style={{ textDecoration: 'none', fontWeight: 900, fontSize: 21, fontFamily: 'var(--serif)' }}>
          <span style={{ color: 'var(--brand)' }}>●</span> Mentor<span className="gold-text">Setu</span>
        </Link>
        <span className="chip chip-gold">BIT-05 · TRL 4–5</span>
        <nav className={`nav-links ${open ? 'open' : ''}`}>
          <Link to="/#how" onClick={() => setOpen(false)}>How it scores</Link>
          <Link to="/#modules" onClick={() => setOpen(false)}>Modules</Link>
          <Link to="/#demo" onClick={() => setOpen(false)}>Live demo</Link>
          <Link to="/app" onClick={() => setOpen(false)}>Workspace</Link>
        </nav>
        <button className="btn btn-ghost btn-sm burger" onClick={() => setOpen(o => !o)}>☰</button>
        <div className="nav-cta" style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={toggle}>{theme === 'dark' ? '☀ light' : '◐ dark'}</button>
          <Bell />
          {!user ? (<><button className="btn btn-ghost btn-sm" onClick={() => nav('/login')}>Login</button><button className="btn btn-gold btn-sm" onClick={() => nav('/login?mode=register')}>Join →</button></>)
            : (<><button className="btn btn-ghost btn-sm" onClick={() => nav('/app')}>{user.full_name} · {user.role}</button><button className="btn btn-ghost btn-sm" onClick={() => doLogout(nav)}>Logout</button></>)}
        </div>
      </div>
    </div>
  );
}
