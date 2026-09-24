import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useReveal } from '../components/motion.jsx';

function ForgotForm({ back }) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  return (
    <div style={{ marginTop: 16, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
      <h3>Reset password</h3>
      <label>Email</label>
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@college.edu" />
      <div style={{ marginTop: 8 }}><button className="btn btn-green btn-sm" onClick={() => api.forgot(email).then(r => { setMsg('If the account exists, a reset token was created. Demo token: ' + (r.demo_token || '(emailed in production)')); if (r.demo_token) setToken(r.demo_token); }).catch(e => setMsg(e.message))}>Send reset link</button></div>
      <label>Token</label>
      <input value={token} onChange={e => setToken(e.target.value)} placeholder="paste token" />
      <label>New password (10+ chars, UPPER+lower+digit)</label>
      <input type="password" value={pw} onChange={e => setPw(e.target.value)} />
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button className="btn btn-gold btn-sm" onClick={() => api.reset(token, pw).then(() => { setMsg('Password reset — please log in.'); back(); }).catch(e => setMsg(e.message))}>Set new password</button>
        <button className="btn btn-ghost btn-sm" onClick={back}>Back</button>
      </div>
      {msg && <p style={{ color: 'var(--muted)', fontSize: 13 }}>{msg}</p>}
    </div>
  );
}

export default function Login() {
  useReveal();
  const [q] = useSearchParams();
  const [mode, setMode] = useState(q.get('mode') === 'register' ? 'register' : 'login');
  const [f, setF] = useState({ email: 'student1@college.edu', password: 'Password123!', full_name: 'Demo Student', role: 'student' });
  const [err, setErr] = useState('');
  const nav = useNavigate();
  const go = async (e) => {
    e.preventDefault(); setErr('');
    try {
      const r = mode === 'login' ? await api.login({ email: f.email, password: f.password })
        : await api.register({ email: f.email, password: f.password, full_name: f.full_name, role: f.role });
      localStorage.setItem('mm_token', r.token);
      const me = r.user || await api.me().catch(() => ({ full_name: f.full_name, role: f.role }));
      localStorage.setItem('mm_user', JSON.stringify(me));
      nav('/app');
    } catch (ex) { setErr(ex.message + ' — is the backend on :4000? You can still tour /app in mock mode.'); }
  };
  return (
    <section className="section wrap grid2" style={{ alignItems: 'stretch', minHeight: '70vh' }}>
      <div className="card rv">
        <div className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Join the marketplace'}</div>
        <h2 style={{ fontSize: 38 }}>Mentor<span className="gold-text">Setu</span> access ✦</h2>
        <div className="tabs">
          <button className="btn btn-ghost btn-sm" onClick={() => setMode('login')}>Login</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setMode('register')}>Register</button>
        </div>
        <form onSubmit={go}>
          {mode === 'register' && (<><label>Full name</label><input value={f.full_name} onChange={e => setF({ ...f, full_name: e.target.value })} /><label>Role</label><select value={f.role} onChange={e => setF({ ...f, role: e.target.value })}><option value="student">Student</option><option value="alumni">Alumni</option></select></>)}
          <label>Email</label><input value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
          <label>Password (10+ chars, UPPER+lower+digit)</label><input type="password" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} />
          {err && <p style={{ color: 'var(--danger)' }}>{err}</p>}
          <div style={{ marginTop: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}><button className="btn btn-gold" type="submit">{mode === 'login' ? 'Login →' : 'Create account →'}</button>
          {mode === 'login' && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode('forgot')}>Forgot password?</button>}</div>
        </form>
        {mode === 'forgot' && <ForgotForm back={() => setMode('login')} />}
      </div>
      <div className="card rv" style={{ borderColor: 'var(--gold)' }}>
        <h3>What happens next?</h3>
        <ol style={{ color: 'var(--muted)', lineHeight: 1.9 }}>
          <li><b>Students</b> create a request → get Top-3 with reasons → request.</li>
          <li><b>Alumni</b> set weekly slots + cap → accept / decline.</li>
          <li><b>Both</b> schedule (conflict-checked), log meetings, track goals, rate.</li>
          <li><b>Coordinator</b> watches KPIs + audit trail.</li>
        </ol>
        <span className="chip chip-gold">JWT + RBAC + audit on every write</span>
        <span className="chip">Oracle relational</span>
      </div>
    </section>
  );
}
