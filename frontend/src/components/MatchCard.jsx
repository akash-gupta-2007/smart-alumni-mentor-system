import { IconCheck } from './Icons.jsx';
const WEIGHTS = [['domain', 0.40, 'Domain'], ['goal', 0.25, 'Goal'], ['lang', 0.15, 'Language'], ['avail', 0.20, 'Availability']];
export function ScoreBar({ breakdown }) {
  if (!breakdown) return null;
  return (
    <div style={{ display: 'flex', height: 8, borderRadius: 99, overflow: 'hidden', background: 'var(--line)', marginTop: 8 }} title="Score composition">
      {WEIGHTS.map(([k, w, label]) => {
        const v = Math.max(0, Math.min(1, Number(breakdown[k]) || 0));
        return <i key={k} title={`${label}: ${v} × ${w}`} style={{ width: `${v * w * 100}%`, background: k === 'domain' ? 'var(--brand)' : k === 'goal' ? 'var(--b-400)' : k === 'lang' ? 'var(--b-300)' : 'var(--b-200)', display: 'block', height: '100%' }} />;
      })}
    </div>
  );
}
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export function WeekStrip({ freeDays, caption }) {
  const set = new Set((freeDays || []).map(Number));
  return (
    <div style={{ marginTop: 8 }} title={caption || 'Availability overlap'}>
      <div style={{ display: 'flex', gap: 4 }}>
        {DAYS.map((d, i) => (
          <span key={i} className="chip" style={{ minWidth: 28, justifyContent: 'center', margin: 0, borderColor: set.has(i) ? 'var(--gold)' : 'var(--line)', opacity: set.has(i) ? 1 : 0.45 }}>{d}</span>
        ))}
      </div>
    </div>
  );
}
export default function MatchCard({ m, i, onAsk, freeDays }) {
  const common = (freeDays || []).map(Number).filter(d => (m.reasons || []).join(' ').includes(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]));
  return (
    <div className="card" style={{ marginBottom: 15, opacity: m.full ? 0.92 : 1, borderColor: i === 0 ? 'color-mix(in srgb, var(--gold) 50%, var(--line))' : 'var(--line)', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
        <b style={{ fontSize: 16 }}>#{i + 1} · {m.name}</b>
        <span className="kpi gold-text" style={{ fontSize: 24 }}>{m.score}%</span>
      </div>
      <div className="meter rv-meter"><i data-w={m.score + '%'} /></div>
      <ScoreBar breakdown={m.breakdown} />
      <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 5 }}>40% domain · 25% goal · 15% language · 20% availability, minus load penalty</div>
      <div style={{ margin: '12px 0' }}>{m.reasons.map((r, j) => <span className="chip" key={j}><IconCheck size={12} /> {r}</span>)}</div>
      <WeekStrip freeDays={common.length ? common : (freeDays || [])} caption="Blue = common slot-days" />
      <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 6 }}>weights 40·25·15·20 · load {m.active}/{m.cap}</div>
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button className={m.full ? 'btn btn-ghost btn-sm' : 'btn btn-green btn-sm'} onClick={() => onAsk(m)}>{m.full ? 'Join waitlist' : 'Request mentor'}</button>
      </div>
    </div>
  );
}
export function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--line)', padding: '36px 24px', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
      <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div><span className="gold-text" style={{ fontWeight: 700 }}>MentorSetu</span> · BIT-05 Capstone · Oracle + Node + React + Three.js</div>
        <div style={{ fontSize: 13 }}>Audit-logged and capacity-aware · TRL 4–5 · dark + light</div>
      </div>
    </footer>
  );
}