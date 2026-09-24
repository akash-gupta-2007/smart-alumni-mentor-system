import { Link } from 'react-router-dom';
import { useReveal } from '../components/motion.jsx';
import MatchCard from '../components/MatchCard.jsx';
import { mockSuggest } from '../lib/api.js';
import { IconSprout, IconCalendar, IconGauge, IconUsers, IconFlag, IconStar, IconChart, IconShield, IconArrow } from '../components/Icons.jsx';

const MODULES = [
  [IconSprout, 'Onboarding', 'Student goals + domain interests; alumni expertise, max_mentees cap, languages. Validated, consent-logged.', 'Dup email → 409 · spam tags capped'],
  [IconCalendar, 'Availability', 'Weekly recurring slots, IST-aware. Conflict engine blocks double-book + past dates.', 'OVERLAP → 409 · OUTSIDE_AVAILABILITY → 409'],
  [IconGauge, 'Match suggestions', '0.40 domain + 0.25 goal + 0.15 lang + 0.20 availability, minus 0.3×load. Full mentors waitlist.', 'Tie → earliest bandwidth wins'],
  [IconUsers, 'Meeting + log', 'requested → accepted → scheduled → completed / no-show. Participant-only logs, 5–300 min.', 'No-show tracked · backdate rejected'],
  [IconFlag, 'Goal tracker', 'Per-student goals with target dates, 0–100% progress, linked to a match.', 'Past deadline flagged'],
  [IconStar, 'Feedback', 'One 1–5 rating per meeting per person, tags + comment, feeds satisfaction KPI.', 'Duplicate → 409 · self-rate blocked'],
  [IconChart, 'Coordinator', 'Satisfaction, load std-dev, conflict rate, mentor load table. Override + rebalance.', 'RBAC: coordinator only'],
  [IconShield, 'Secure + observed', 'JWT + RBAC + Joi + rate-limit + audit_logs on every write. /health + /metrics.', 'PII never in logs · 403 on cross-access'],
];
export default function Landing() {
  useReveal();
  const demo = mockSuggest();
  return (
    <div>
      {/* HERO */}
      <section className="section wrap grid2" style={{ alignItems: 'center', minHeight: '86vh' }}>
        <div>
          <div className="eyebrow rv">Explainable · Capacity-aware · Oracle + Node + React</div>
          <h1 className="hero-title rv">Your alumni mentor, <span className="gold-text">with proof why.</span></h1>
          <p className="lead rv">Students get Top-3 ranked mentors with human reasons. Alumni set a capacity cap so nobody burns out. Coordinators watch satisfaction, load balance and conflicts live.</p>
          <div className="rv" style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
            <Link to="/login?mode=register" className="btn btn-gold btn-lg">Get matched <IconArrow size={16} /></Link>
            <Link to="/login" className="btn btn-ghost btn-lg">Open live workspace</Link>
          </div>
          <div className="grid3 rv" style={{ marginTop: 30 }}>
            {[['87%', 'top match score'], ['<5%', 'scheduling conflicts'], ['100%', 'RBAC privacy pass']].map(([k, v]) => (
              <div key={v}>
                <div className="serif kpi gold-text" style={{ fontSize: 34 }}>{k}</div>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card rv">
          <div className="eyebrow">Live scoring preview</div>
          {demo.slice(0, 2).map((m, i) => <MatchCard key={i} m={m} i={i} onAsk={() => { }} />)}
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Full interactive version in the workspace →</div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee rv"><div className="marquee-track">
        {[0, 1].map(copy => ['DevOps', 'AI/ML', 'Web Dev', 'Data Science', 'Cybersecurity', 'Mobile', 'Placement', 'Higher studies', 'Startup'].map(d => <span key={copy + '-' + d}>{d}</span>))}
      </div></div>

      {/* HOW */}
      <section id="how" className="section wrap">
        <div className="eyebrow rv">The engine</div>
        <h2 className="rv">How matching <span className="gold-text">actually scores</span></h2>
        <div className="grid3">
          {[
            ['1 · Weighted fit', '0.40 domain (Jaccard on tags) + 0.25 goal + 0.15 language + 0.20 availability overlap. No black box — the breakdown ships with every match.', '82%'],
            ['2 · Capacity guard', 'load = active / max_mentees → penalty 0.3×load. Full mentors score 0 and flip to waitlist. Nobody exceeds their cap.', '64%'],
            ['3 · Human reasons', 'Each card lists reasons[]: overlapping tags, common slot-days, bandwidth, goal fit. The coordinator audits the same payload.', '91%']
          ].map(([t, d, w]) => (
            <div className="card rv" key={t}><h3>{t}</h3><p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>{d}</p><div className="meter rv-meter"><i data-w={w} /></div></div>
          ))}
        </div>
      </section>

      {/* MODULES */}
      <section id="modules" className="section wrap">
        <div className="eyebrow rv">End-to-end, not just matching</div>
        <h2 className="rv">All 7 modules, <span className="gold-text">one flow</span></h2>
        <div className="grid4" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {MODULES.map(([Icon, t, d, e]) => (
            <div className="card rv" key={t} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <span className="chip chip-gold" style={{ margin: 2, flex: '0 0 auto' }} aria-hidden="true"><Icon size={17} /></span>
              <div>
                <h3 style={{ margin: '0 0 6px' }}>{t}</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.7, margin: '0 0 8px' }}>{d}</p>
                <span className="chip">{e}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* METRICS */}
      <section className="section wrap">
        <div className="card-flat rv grid4" style={{ textAlign: 'center', padding: '28px 24px' }}>
          {[['4.4/5', 'match satisfaction'], ['18%', 'load std-dev'], ['3.1%', 'conflict rate'], ['<500ms', 'p95 API latency']].map(([k, v]) => (
            <div key={v}><div className="kpi gold-text">{k}</div><div style={{ color: 'var(--muted)', fontSize: 13 }}>{v}</div></div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="demo" className="section wrap">
        <div className="card rv" style={{ textAlign: 'center', padding: '60px 28px', borderColor: 'color-mix(in srgb, var(--gold) 45%, var(--line))' }}>
          <div className="eyebrow" style={{ justifyContent: 'center' }}>Stakeholder-testable prototype</div>
          <h2 style={{ fontSize: 'clamp(28px, 4.2vw, 46px)', marginTop: 10 }}>Demo logins <span className="gold-text">ready.</span></h2>
          <p style={{ color: 'var(--muted)', maxWidth: 60 + 'ch', margin: '0 auto 22px' }}>student1@college.edu · alumni1@example.com · coordinator@college.edu — password <b>Password123!</b></p>
          <Link to="/login" className="btn btn-gold btn-lg">Enter the marketplace <IconArrow size={16} /></Link>
        </div>
      </section>
    </div>
  );
}