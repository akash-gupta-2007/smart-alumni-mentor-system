import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useTheme } from '../theme/ThemeContext.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { IconBell, IconSun, IconMoon, IconMenu, IconLogout, IconArrow, IconLogin } from './Icons.jsx';

function Bell() {
  const [n, setN] = useState({ unread: 0, items: [] });
  const [open, setOpen] = useState(false);
  const { token } = useAuth();
  const loc = useLocation();
  useEffect(() => { setOpen(false); }, [loc.pathname]);
  // Only load on mount + pathname change; NOT on token change (avoids double-fire on login)
  useEffect(() => {
    if (!token) return;
    let stop = false;
    const load = () => api.notif().then(d => { if (!stop) setN(d); }).catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => { stop = true; clearInterval(t); };
  }, [loc.pathname]);
  if (!token) return null;
  return (
    <span style={{ position: 'relative' }} className="notif-wrap">
      <button className="nav-icon-btn" aria-label={`Notifications${n.unread ? `, ${n.unread} unread` : ''}`} aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <IconBell size={18} />
        {n.unread > 0 && <span className="notif-badge">{n.unread}</span>}
      </button>
      {open && (
        <div className="card notif-panel" role="menu" aria-label="Notifications">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Notifications</div>
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

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();
  useEffect(() => { setOpen(false); }, [loc.pathname]);

  const goLogout = async () => { await logout(); nav('/'); };

  // Logo navigates to /app when authenticated, / when public
  const logoHref = user ? '/app' : '/';

  return (
    <div className="nav">
      <a href="#main" className="btn btn-ghost btn-sm" style={{ position: 'absolute', left: -9999 }} onFocus={e => { e.target.style.left = 8; e.target.style.top = 8; e.target.style.zIndex = 100; }} onBlur={e => { e.target.style.left = -9999; }}>Skip to content</a>
      <div className="nav-inner">
        <Link to={logoHref} className="nav-brand" aria-label={user ? "MentorSetu workspace" : "MentorSetu home"}>
          <span className="nav-mark" aria-hidden="true"><span style={{ color: 'var(--white)', fontSize: 13, lineHeight: 1 }}>◆</span></span>
          Mentor<span className="gold-text">Setu</span>
        </Link>
        <button className="btn btn-ghost btn-sm burger nav-icon-btn" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(o => !o)}><IconMenu size={18} /></button>
        <div className={`nav-menu ${open ? 'open' : ''}`}>
          <nav className="nav-links" aria-label="Primary">
            {!user && <NavLink to="/#how" onClick={() => setOpen(false)}>How it scores</NavLink>}
            {!user && <NavLink to="/#modules" onClick={() => setOpen(false)}>Modules</NavLink>}
            {user && <NavLink to="/app/profile" onClick={() => setOpen(false)}>Profile</NavLink>}
            {user && <NavLink to="/app/matches" onClick={() => setOpen(false)}>Matches</NavLink>}
            {user && <NavLink to="/app/availability" onClick={() => setOpen(false)}>Availability</NavLink>}
            {user && <NavLink to="/app/meetings" onClick={() => setOpen(false)}>Meetings</NavLink>}
            {user && <NavLink to="/app/goals" onClick={() => setOpen(false)}>Goals</NavLink>}
            {user && <NavLink to="/app/feedback" onClick={() => setOpen(false)}>Feedback</NavLink>}
            {user && (user.role === 'coordinator' || user.role === 'admin') && <NavLink to="/app/admin" onClick={() => setOpen(false)}>Admin</NavLink>}
          </nav>
          <div className="nav-cta">
            <button className="nav-icon-btn" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>{theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}</button>
            <Bell />
            {!user ? (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => { setOpen(false); nav('/login'); }}><IconLogin size={15} /> Login</button>
                <button className="btn btn-gold btn-sm" onClick={() => { setOpen(false); nav('/login?mode=register'); }}>Join <IconArrow size={14} /></button>
              </>
            ) : (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => { setOpen(false); nav('/app'); }} title={`${user.role} workspace`}>
                  <span className="chip chip-live" style={{ margin: 0 }}>{user.full_name} · {user.role}</span>
                </button>
                <button className="btn btn-ghost btn-sm" onClick={goLogout}><IconLogout size={15} /> Logout</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}