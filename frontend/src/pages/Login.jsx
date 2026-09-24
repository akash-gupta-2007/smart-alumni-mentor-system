import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useReveal } from '../components/motion.jsx';

function ForgotForm({ back }) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <div style={{ marginTop: 16, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
      <h3>Reset password</h3>
      <label htmlFor="fp-email">Email</label>
      <input id="fp-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@college.edu" />
      <div style={{ marginTop: 8 }}><button className="btn btn-green btn-sm" disabled={busy} onClick={() => { setBusy(true); api.forgot(email).then(r => { setMsg('If the account exists, a reset token was created. Demo token: ' + (r.demo_token || '(emailed in production)')); if (r.demo_token) setToken(r.demo_token); }).catch(e => setMsg(e.message)).finally(() => setBusy(false)); }}>{busy ? 'Sending…' : 'Send reset link'}</button></div>
      <label htmlFor="fp-token">Token</label>
      <input id="fp-token" value={token} onChange={e => setToken(e.target.value)} placeholder="paste token" />
      <label htmlFor="fp-pw">New password (10+ chars, UPPER+lower+digit)</label>
      <input id="fp-pw" type="password" autoComplete="new-password" value={pw} onChange={e => setPw(e.target.value)} />
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button className="btn btn-gold btn-sm" disabled={busy} onClick={() => api.reset(token, pw).then(() => { setMsg('Password reset — please log in.'); back(); }).catch(e => setMsg(e.message))}>Set new password</button>
        <button className="btn btn-ghost btn-sm" onClick={back}>Back</button>
      </div>
      {msg && <p role="status" style={{ color: 'var(--muted)', fontSize: 13 }}>{msg}</p>}
    </div>
  );
}

const EMAIL_RE = /^[^@]+@[^@]+\.[^@]+$/;

export default function Login() {
  useReveal();
  const [q] = useSearchParams();
  const { login, register } = useAuth();
  const [mode, setMode] = useState(mode0(q));
  const [f, setF] = useState({ email: 'student1@college.edu', password: 'Password123!', full_name: 'Demo Student', role: 'student', consent: false });
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  function mode0(params) { return params.get('mode') === 'register' ? 'register' : 'login'; }

  const emailOk = EMAIL_RE.test(f.email);
  const pwOk = mode === 'login' ? f.password.length > 0 : /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/.test(f.password);
  const nameOk = mode === 'login' || f.full_name.trim().length >= 2;
  const consentOk = mode === 'login' || mode === 'forgot' || f.consent;
  const canSubmit = emailOk && pwOk && nameOk && consentOk && !busy;

  const go = async (e) => {
    e.preventDefault(); setErr('');
    if (!canSubmit) { setErr('Please fix the highlighted fields first.'); return; }
    setBusy(true);
    try {
      if (mode === 'login') await login(f.email, f.password);
      else await register({ email: f.email, password: f.password, full_name: f.full_name.trim(), role: f.role, consent: !!f.consent });
      nav('/app');
    } catch (ex) { setErr(ex.message + ' — is the backend on :4000?'); }
    finally { setBusy(false); }
  };

  return (
    <section className="section wrap grid2" style={{ alignItems: 'stretch', minHeight: '70vh' }}>
      <div className="card rv">
        <div className="eyebrow">{mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Join the marketplace' : 'Recover access'}</div>
        <h2 style={{ fontSize: 38 }}>Mentor<span className="gold-text">Setu</span> access ✦</h2>
        <div className="tabs" role="tablist" aria-label="Access mode">
          <button role="tab" aria-selected={mode === 'login'} className={`btn btn-sm ${mode === 'login' ? 'btn-gold tab-active' : 'btn-ghost'}`} onClick={() => setMode('login')}>Login</button>
          <button role="tab" aria-selected={mode === 'register'} className={`btn btn-sm ${mode === 'register' ? 'btn-gold tab-active' : 'btn-ghost'}`} onClick={() => setMode('register')}>Register</button>
        </div>
        {mode !== 'forgot' ? (
          <form onSubmit={go} noValidate>
            {mode === 'register' && (<>
              <label htmlFor="rg-name">Full name</label>
              <input id="rg-name" autoComplete="name" value={f.full_name} onChange={e => setF({ ...f, full_name: e.target.value })} aria-invalid={!nameOk} />
              {!nameOk && <p style={{ color: 'var(--danger)', fontSize: 13 }}>Name needs at least 2 characters.</p>}
              <label htmlFor="rg-role">I am joining as</label>
              <select id="rg-role" value={f.role} onChange={e => setF({ ...f, role: e.target.value })}>
                <option value="student">Student — find a mentor</option>
                <option value="alumni">Alumni — mentor students</option>
              </select>
            </>)}
            <label htmlFor="lg-email">Email</label>
            <input id="lg-email" type="email" autoComplete="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} aria-invalid={!emailOk} aria-describedby="lg-email-hint" />
            {!emailOk && <p id="lg-email-hint" style={{ color: 'var(--danger)', fontSize: 13 }}>Enter a valid email address.</p>}
            <label htmlFor="lg-pw">Password {mode === 'register' && '(10+ chars, UPPER+lower+digit)'}</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input id="lg-pw" style={{ flex: 1 }} type={showPw ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={f.password} onChange={e => setF({ ...f, password: e.target.value })} aria-invalid={!pwOk} />
              <button type="button" className="btn btn-ghost btn-sm" aria-label={showPw ? 'Hide password' : 'Show password'} onClick={() => setShowPw(s => !s)}>{showPw ? 'Hide' : 'Show'}</button>
            </div>
            {mode === 'register' && !pwOk && <p style={{ color: 'var(--danger)', fontSize: 13 }}>Password needs 10+ characters with upper, lower and digit.</p>}
            {mode === 'register' && (
              <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>
                <input type="checkbox" style={{ width: 18, marginTop: 2 }} checked={f.consent} onChange={e => setF({ ...f, consent: e.target.checked })} />
                I consent to MentorSetu storing my profile, availability and mentorship activity to operate the matching service (demo data only).
              </label>
            )}
            {err && <p role="alert" style={{ color: 'var(--danger)' }}>{err}</p>}
            <div style={{ marginTop: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-gold" type="submit" disabled={!canSubmit} aria-busy={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Login →' : 'Create account →'}</button>
              {mode === 'login' && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode('forgot')}>Forgot password?</button>}
            </div>
          </form>
        ) : null}
        {mode === 'forgot' && <ForgotForm back={() => setMode('login')} />}
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 12 }}>Demo accounts: <b>student1@college.edu</b> · <b>alumni1@example.com</b> · <b>coordinator@college.edu</b> (password <b>Password123!</b>) — <Link to="/app">workspace</Link> needs login first.</p>
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
