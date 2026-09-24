import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../theme/ThemeContext.jsx';
import { api } from '../lib/api.js';
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
        <div className="nav-cta" style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={toggle}>{theme === 'dark' ? '☀ light' : '◐ dark'}</button>
          {!user ? (<><button className="btn btn-ghost btn-sm" onClick={() => nav('/login')}>Login</button><button className="btn btn-gold btn-sm" onClick={() => nav('/login?mode=register')}>Join →</button></>)
            : (<><button className="btn btn-ghost btn-sm" onClick={() => nav('/app')}>{user.full_name} · {user.role}</button><button className="btn btn-ghost btn-sm" onClick={() => doLogout(nav)}>Logout</button></>)}
        </div>
      </div>
    </div>
  );
}
