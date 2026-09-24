import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useTheme } from '../theme/ThemeContext.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';

function Bell() {
  const [n, setN] = useState({ unread: 0, items: [] });
  const [open, setOpen] = useState(false);
  const { token } = useAuth();
  const loc = useLocation();
  useEffect(() => { setOpen(false); }, [loc.pathname]);
  useEffect(() => {
    if (!token) return;
    let stop = false;
    const load = () => api.notif().then(d => { if (!stop) setN(d); }).catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => { stop = true; clearInterval(t); };
  }, [token]);
  if (!token) return null;
  return (
    <span style={{ position: 'relative' }}>
      <button className="btn btn-ghost btn-sm" aria-label={`Notifications${n.unread ? `, ${n.unread} unread` : ''}`} aria-expanded={open} onClick={() => setOpen(o => !o)}>🔔{n.unread > 0 && <b style={{ color: 'var(--gold-soft)' }}> {n.unread}</b>}</button>
      {open && (
        <div className="card" role="menu" aria-label="Notifications" style={{ position: 'absolute', right: 0, top: '110%', width: 300, zIndex: 50, padding: 12 }}>
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

const linkStyle = ({ isActive }) => ({
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 600,
  padding: '8px 13px',
  borderRadius: 'var(--r-pill)',
  color: isActive ? 'var(--ink)' : 'var(--muted)',
  background: isActive ? 'var(--surface2)' : 'transparent',
  outline: isActive ? '1px solid var(--gold)' : 'none'
});

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();
  useEffect(() => { setOpen(false); }, [loc.pathname]);

  const goLogout = async () => { await logout(); nav('/'); };

  return (
    <div className="nav">
      <a href="#main" className="btn btn-ghost btn-sm" style={{ position: 'absolute', left: -9999 }} onFocus={e => { e.target.style.left = 8; e.target.style.top = 8; e.target.style.zIndex = 100; }} onBlur={e => { e.target.style.left = -9999; }}>Skip to content</a>
      <div className="nav-inner">
        <Link to="/" style={{ textDecoration: 'none', fontWeight: 900, fontSize: 21, fontFamily: 'var(--serif)' }} aria-label="MentorSetu home">
          <span style={{ color: 'var(--brand)' }} aria-hidden="true">●</span> Mentor<span className="gold-text">Setu</span>
        </Link>
        <span className="chip chip-gold">BIT-05 · TRL 4–5</span>
        <button className="btn btn-ghost btn-sm burger" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(o => !o)}>☰</button>
        <div className={`nav-menu ${open ? 'open' : ''}`}>
          <nav className="nav-links" aria-label="Primary">
            <NavLink to="/#how" onClick={() => setOpen(false)} style={linkStyle}>How it scores</NavLink>
            <NavLink to="/#modules" onClick={() => setOpen(false)} style={linkStyle}>Modules</NavLink>
            <NavLink to="/#demo" onClick={() => setOpen(false)} style={linkStyle}>Live demo</NavLink>
            {user && <NavLink to="/app" onClick={() => setOpen(false)} style={linkStyle}>Workspace</NavLink>}
          </nav>
          <div className="nav-cta">
            <button className="btn btn-ghost btn-sm" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>{theme === 'dark' ? '☀ light' : '◐ dark'}</button>
            <Bell />
            {!user ? (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => { setOpen(false); nav('/login'); }}>Login</button>
                <button className="btn btn-gold btn-sm" onClick={() => { setOpen(false); nav('/login?mode=register'); }}>Join →</button>
              </>
            ) : (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => { setOpen(false); nav('/app'); }} title={`${user.role} workspace`}>
                  {user.full_name} · <span className="gold-text">{user.role}</span>
                </button>
                <button className="btn btn-ghost btn-sm" onClick={goLogout}>Logout</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
