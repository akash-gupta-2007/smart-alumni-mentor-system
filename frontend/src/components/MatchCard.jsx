export default function MatchCard({ m, i, onAsk }) {
  return (
    <div className="card rv" style={{ marginBottom: 14, opacity: m.full ? 0.9 : 1, borderColor: i === 0 ? 'var(--gold)' : 'var(--line)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
        <b>#{i + 1} {m.name}</b>
        <span className="kpi gold-text" style={{ fontSize: 24 }}>{m.score}%</span>
      </div>
      <div className="meter rv-meter"><i data-w={m.score + '%'} /></div>
      <div style={{ margin: '10px 0' }}>{m.reasons.map((r, j) => <span className="chip" key={j}>✓ {r}</span>)}</div>
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
