const WEIGHTS = [['domain', 0.40, 'Domain'], ['goal', 0.25, 'Goal'], ['lang', 0.15, 'Language'], ['avail', 0.20, 'Availability']];
export function ScoreBar({ breakdown }) {
  if (!breakdown) return null;
  return (
    <div style={{ display: 'flex', height: 10, borderRadius: 99, overflow: 'hidden', background: 'var(--line)', marginTop: 8 }} title="Score composition">
      {WEIGHTS.map(([k, w, label]) => {
        const v = Math.max(0, Math.min(1, Number(breakdown[k]) || 0));
        return <i key={k} title={`${label}: ${v} × ${w}`} style={{ width: `${v * w * 100}%`, background: k === 'domain' ? 'var(--brand)' : k === 'goal' ? '#22c55e' : k === 'lang' ? 'var(--gold-soft)' : 'var(--gold)', display: 'block', height: '100%' }} />;
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
          <span key={i} className="chip" style={{ minWidth: 30, justifyContent: 'center', borderColor: set.has(i) ? 'var(--gold)' : 'var(--line)', opacity: set.has(i) ? 1 : 0.45 }}>{d}</span>
        ))}
      </div>
    </div>
  );
}
export default function MatchCard({ m, i, onAsk, freeDays }) {
  const common = (freeDays || []).map(Number).filter(d => (m.reasons || []).join(' ').includes(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]));
  return (
    <div className="card rv" style={{ marginBottom: 14, opacity: m.full ? 0.9 : 1, borderColor: i === 0 ? 'var(--gold)' : 'var(--line)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
        <b>#{i + 1} {m.name}</b>
        <span className="kpi gold-text" style={{ fontSize: 24 }}>{m.score}%</span>
      </div>
      <div className="meter rv-meter"><i data-w={m.score + '%'} /></div>
      <ScoreBar breakdown={m.breakdown} />
      <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>40% domain · 25% goal · 15% language · 20% availability, minus load penalty</div>
      <div style={{ margin: '10px 0' }}>{m.reasons.map((r, j) => <span className="chip" key={j}>✓ {r}</span>)}</div>
      <WeekStrip freeDays={common.length ? common : (freeDays || [])} caption="Gold = common slot-days" />
      <div style={{ color: 'var(--muted)', fontSize: 12 }}>weights 40·25·15·20 → {JSON.stringify(m.breakdown)} · load {m.active}/{m.cap}</div>
      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
        <button className={m.full ? 'btn btn-ghost btn-sm' : 'btn btn-green btn-sm'} onClick={() => onAsk(m)}>{m.full ? 'Join waitlist' : 'Request mentor →'}</button>
      </div>
    </div>
  );
}
export function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--line)', padding: '34px 22px', textAlign: 'center', color: 'var(--muted)' }}>
      <div className="wrap">MentorSetu · BIT-05 Capstone · Oracle + Node + React + Three.js + GSAP · <span className="gold-text">green · white · gold</span> · dark + light · audit-logged, capacity-aware</div>
    </footer>
  );
}
