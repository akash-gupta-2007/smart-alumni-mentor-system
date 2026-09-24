import { useEffect, useState } from 'react';
import { api, apiStatus, mockSuggest } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import MatchCard from '../components/MatchCard.jsx';
import { IconDownload } from '../components/Icons.jsx';
import { useReveal } from '../components/motion.jsx';

// UI mirrors backend RBAC exactly: each role only sees tabs its APIs allow.
const ROLE_TABS = {
  student: ['matches', 'meetings', 'goals', 'feedback', 'profile'],
  alumni: ['matches', 'availability', 'meetings', 'feedback', 'profile'],
  coordinator: ['admin', 'matches', 'profile'],
  admin: ['admin', 'matches', 'profile']
};
const DEFAULT_TAB = { student: 'matches', alumni: 'matches', coordinator: 'admin', admin: 'admin' };
export default function Dashboard() {
  useReveal([]);
  const { user } = useAuth();
  const role = user?.role || 'student';
  const tabs = ROLE_TABS[role] || ROLE_TABS.student;
  const [tab, setTab] = useState(DEFAULT_TAB[role] || 'matches');
  useEffect(() => { setTab(DEFAULT_TAB[role] || 'matches'); }, [role]);
  const [req, setReq] = useState({ title: 'DevOps mentorship for placement', goal_type: 'placement', domain: 'DevOps', language: 'English' });
  const [requestId, setRequestId] = useState('');
  const [matches, setMatches] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [msg, setMsg] = useState('');
  const [slot, setSlot] = useState({ day_of_week: 3, start_time: '18:00', end_time: '20:00' });
  const [meet, setMeet] = useState({ match_id: '', mode: 'online', scheduled_start: '2026-09-20T18:00', scheduled_end: '2026-09-20T19:00' });
  const [goal, setGoal] = useState({ title: 'Docker + K8s mini-project', target_date: '2026-10-15' });
  const [goalList, setGoalList] = useState([]);
  const [meetList, setMeetList] = useState([]);
  const [logNotes, setLogNotes] = useState({});
  const [freeDays, setFreeDays] = useState('1,3,5');
  const loadGoals = () => api.goals().then(setGoalList).catch(() => setGoalList([]));
  const loadMeets = () => api.myMeetings().then(setMeetList).catch(() => setMeetList([]));
  const [fb, setFb] = useState({ meeting_id: '', rating: 5, communication_rating: 5, relevance_rating: 5, comment: 'Great session on CI pipelines!' });
  const [mine, setMine] = useState([]);
  const loadMine = () => api.mine().then(setMine).catch(() => setMine([]));
  const withBusy = (fn) => async (...a) => { setBusy(true); try { return await fn(...a); } finally { setBusy(false); } };
  const [mySlots, setMySlots] = useState([]);
  const [auditRows, setAuditRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [openReq, setOpenReq] = useState([]);
  const [prof, setProf] = useState(null);
  const [editSlot, setEditSlot] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const loadUsers = (q) => api.adminUsers(q).then(setUsersList).catch(() => setUsersList([]));
  const loadOpen = (q) => api.openRequests(q).then(setOpenReq).catch(() => setOpenReq([]));
  const loadProf = () => api.profile().then(setProf).catch(() => setProf(null));
  const loadSlots = () => { if (user.id) api.slots(user.id).then(setMySlots).catch(() => setMySlots([])); };
  const decide = (id, status) => api.decide(id, status).then(() => { setMsg('Match ' + status); loadMine(); }).catch(e => setMsg(e.message));
  const [online, setOnline] = useState('checking…');
  useEffect(() => { apiStatus().then(s => setOnline(s)).catch(() => setOnline('offline')); }, []);

  const createReq = withBusy(async () => {
    try { const r = await api.createRequest(req); setRequestId(r.id); setMsg('Request ' + String(r.id).slice(0, 8) + ' created — hit Suggest Top-3.'); }
    catch (e) { setRequestId('demo-req'); setMsg('Backend offline — demo request id active. ' + e.message); }
  });
  const suggest = withBusy(async () => {
    setMsg('Scoring across alumni…');
    try {
      if (!requestId) throw new Error('create a request first');
      setMatches(await api.suggest(requestId, freeDays)); setMsg('');
    } catch { setMatches(mockSuggest()); setMsg('Backend offline — explainable mock with identical weights. Run start-local.bat for the live Oracle engine.'); }
  });
  const ask = async (m) => {
    try { const r = await api.requestMatch({ request_id: requestId, alumni_id: m.alumni_id }); setMsg(`Match ${r.status} · mentor load ${r.capacity}`); }
    catch (e) { setMsg(`Mock booked (${m.full ? 'waitlisted — mentor full' : 'requested'}). ` + e.message); }
  };
  useEffect(() => {
    if (tab === 'matches') { loadMine(); if (user.role !== 'student') loadOpen(); }
    if (tab === 'availability') loadSlots();
    if (tab === 'meetings') loadMeets();
    if (tab === 'goals') loadGoals();
    if (tab === 'profile') loadProf();
    if (tab === 'admin') { loadUsers();
      api.kpis().then(setKpis).catch(() => setKpis({
        satisfaction: 4.4, feedback_count: 37, load_stddev: 18.2, conflict_rate: 3.1, total_meetings: 64,
        mentor_load: [{ full_name: 'Priya Sharma', active_mentees: 2, max_mentees: 5, load_pct: 40 }, { full_name: 'Rahul Verma', active_mentees: 1, max_mentees: 4, load_pct: 25 }]
      }));
      api.adminAudit().then(setAuditRows).catch(() => setAuditRows([]));
    }
  }, [tab]);

  return (
    <section className="section wrap">
      <div className="eyebrow rv">Workspace</div>
      <h2 className="rv" style={{ fontSize: 'clamp(27px, 3.8vw, 40px)' }}>Namaste, {user.full_name} <span className="chip chip-gold">{user.role}</span> <span className={`chip ${online === 'online' ? 'chip-live' : online === 'offline' ? 'chip-danger' : ''}`} title="API reachability"><i className="dot" aria-hidden="true" /> {online === 'online' ? 'API live' : online === 'offline' ? 'API offline — demo mode' : '… checking API'}</span></h2>
      {online === 'offline' && <div className="card rv" style={{ borderColor: 'var(--danger)', marginBottom: 14 }}>Backend not reachable. Start it with <b>start-local.bat</b> (or <code>node src/server.js</code> in <code>backend/</code>), then refresh. Meanwhile every tab below still works with built-in demo data.</div>}
      <div className="tabs rv" role="tablist" aria-label="Workspace sections">{tabs.map(t => <button key={t} role="tab" aria-selected={tab === t} disabled={busy} className={`btn btn-sm ${tab === t ? 'btn-gold tab-active' : 'btn-ghost'}`} onClick={() => setTab(t)}>{t}</button>)}</div>
      {busy && <div className="card rv" aria-busy="true" aria-live="polite">Working…</div>}
      {msg && <div className="card rv" style={{ borderColor: 'var(--gold)', marginBottom: 14 }}>{msg}</div>}

      {tab === 'matches' && (
        <div>
          <div className="card rv" style={{ marginBottom: 14 }}>
            <h3>{user.role === 'alumni' ? 'Incoming requests — accept / decline' : 'My matches + requests'}</h3>
            {!mine.length && <p style={{ color: 'var(--muted)' }}>None yet. {user.role === 'alumni' ? 'Student requests to you appear here.' : 'Request a mentor below, then track status here.'}</p>}
            {mine.map(m => (
              <div key={m.id} style={{ borderBottom: '1px solid var(--line)', padding: '9px 0', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="chip">{m.status}</span>
                <b>{m.other_name}</b><span style={{ color: 'var(--muted)', fontSize: 13 }}>{m.request_title} · score {m.score}%</span>
                {user.role !== 'student' && m.status === 'requested' && (
                  <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <button className="btn btn-green btn-sm" onClick={() => { if (window.confirm('Accept this match? Capacity will be consumed.')) decide(m.id, 'accepted'); }}>Accept</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => { if (window.confirm('Decline this match?')) decide(m.id, 'declined'); }}>Decline</button>
                  </span>
                )}
                {m.status === 'accepted' && (
                  <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => { if (window.confirm('Mark this match completed?')) decide(m.id, 'completed'); }}>Mark completed</button>
                )}
              </div>
            ))}
          </div>
          {user.role === 'student' && (
          <div className="grid2">
          <div className="card rv">
            <h3>1 · Profile + request intake</h3>
            <label>Title</label><input value={req.title} onChange={e => setReq({ ...req, title: e.target.value })} />
            <div className="grid2">
              <div><label>Goal</label><select value={req.goal_type} onChange={e => setReq({ ...req, goal_type: e.target.value })}><option>placement</option><option>higher_studies</option><option>startup</option><option>skill</option><option>research</option></select></div>
              <div><label>Domain</label><input value={req.domain} onChange={e => setReq({ ...req, domain: e.target.value })} /></div>
            </div>
            <label>Language</label>
            <select value={req.language} onChange={e => setReq({ ...req, language: e.target.value })}><option>English</option><option>Hindi</option><option>Marathi</option></select>
            <label>My free days (0=Sun..6=Sat, comma list)</label>
            <input value={freeDays} placeholder="1,3,5" onChange={e => setFreeDays(e.target.value)} />
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-green btn-sm" disabled={busy} onClick={createReq}>Create request</button>
              <button className="btn btn-gold btn-sm" disabled={busy} onClick={suggest}>Suggest Top-3</button>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>Innovation: full mentors never vanish — they flip to <b>waitlist</b> with the same explanation payload.</p>
          </div>
          <div>{matches.map((m, i) => <MatchCard key={i} m={m} i={i} onAsk={ask} freeDays={String(freeDays).split(',').map(Number).filter(n => n >= 0 && n <= 6)} />)}
            {!matches.length && <div className="card">No suggestions yet — create a request, then Suggest.</div>}</div>
          </div>
          )}
        </div>
      )}

      {tab === 'availability' && (
        <div className="card rv">
          <h3>Availability calendar (alumni)</h3>
          <p style={{ color: 'var(--muted)' }}>Weekly recurring slots. Meetings outside these days return <b>OUTSIDE_AVAILABILITY</b>.</p>
          <div className="grid4">
            <div><label>Day (0=Sun)</label><input type="number" min="0" max="6" value={slot.day_of_week} onChange={e => setSlot({ ...slot, day_of_week: +e.target.value })} /></div>
            <div><label>Start</label><input value={slot.start_time} onChange={e => setSlot({ ...slot, start_time: e.target.value })} /></div>
            <div><label>End</label><input value={slot.end_time} onChange={e => setSlot({ ...slot, end_time: e.target.value })} /></div>
            <div><label>&nbsp;</label><button className="btn btn-green btn-sm" onClick={() => api.addSlot(slot).then(() => { setMsg('Slot saved'); loadSlots(); }).catch(e => setMsg(e.message))}>Add slot</button></div>
          </div>
          <div style={{ marginTop: 12 }}>
            {!mySlots.length && <p style={{ color: 'var(--muted)' }}>No slots yet — add your weekly hours above.</p>}
            {mySlots.map(s => (
              <span className="chip" key={s.id}>
                {editSlot === s.id ? (
                  <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    <input aria-label="Day" type="number" min="0" max="6" defaultValue={s.day_of_week} id={'d-' + s.id} style={{ width: 56 }} />
                    <input aria-label="Start" defaultValue={s.start_time} id={'s-' + s.id} style={{ width: 70 }} />
                    <input aria-label="End" defaultValue={s.end_time} id={'e-' + s.id} style={{ width: 70 }} />
                    <button className="btn btn-green btn-sm" onClick={() => {
                      const d = +document.getElementById('d-' + s.id).value;
                      const st = document.getElementById('s-' + s.id).value;
                      const et = document.getElementById('e-' + s.id).value;
                      api.slotUpdate(s.id, { day_of_week: d, start_time: st, end_time: et }).then(() => { setEditSlot(null); loadSlots(); }).catch(e => setMsg(e.message));
                    }}>Save</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditSlot(null)}>Cancel</button>
                  </span>
                ) : (
                  <span>Day {s.day_of_week} · {s.start_time}–{s.end_time}
                    <button className="btn btn-ghost btn-sm" aria-label="Edit slot" style={{ padding: '2px 8px', marginLeft: 6 }} onClick={() => setEditSlot(s.id)}>Edit</button>
                    <button className="btn btn-ghost btn-sm" aria-label="Delete slot" style={{ padding: '2px 8px', marginLeft: 6 }} onClick={() => { if (window.confirm('Delete this slot?')) api.slotDel(s.id).then(loadSlots).catch(e => setMsg(e.message)); }}>Delete</button>
                  </span>
                )}
              </span>
            ))}
          </div>
          {user.role !== 'student' && (
            <div style={{ marginTop: 14 }}>
              <h4>Open student requests</h4>
              <label htmlFor="oq">Search domain / goal / title</label>
              <input id="oq" placeholder="e.g. DevOps" onChange={e => loadOpen(e.target.value)} />
              {!openReq.length && <p style={{ color: 'var(--muted)' }}>No open requests right now.</p>}
              {openReq.map(o => <div key={o.id} style={{ borderBottom: '1px solid var(--line)', padding: '8px 0' }}><b>{o.title}</b> <span className="chip">{o.goal_type}</span><span className="chip">{o.domain}</span><span style={{ color: 'var(--muted)', fontSize: 13 }}>{o.language}</span></div>)}
            </div>
          )}
        </div>
      )}

      {tab === 'meetings' && (
        <div className="card rv">
          <h3>Meeting scheduler + log (conflict-checked)</h3>
          <div className="grid2">
            <div><label>match_id</label><input value={meet.match_id} placeholder="paste from match step" onChange={e => setMeet({ ...meet, match_id: e.target.value })} /></div>
            <div><label>mode</label><select value={meet.mode} onChange={e => setMeet({ ...meet, mode: e.target.value })}><option value="online">online</option><option value="offline">offline</option></select></div>
            <div><label>start</label><input type="datetime-local" value={meet.scheduled_start} onChange={e => setMeet({ ...meet, scheduled_start: e.target.value })} /></div>
            <div><label>end</label><input type="datetime-local" value={meet.scheduled_end} onChange={e => setMeet({ ...meet, scheduled_end: e.target.value })} /></div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button className="btn btn-gold btn-sm" onClick={() => api.meeting({ ...meet, scheduled_start: new Date(meet.scheduled_start).toISOString(), scheduled_end: new Date(meet.scheduled_end).toISOString() }).then(r => setMsg('Scheduled ' + r.id)).catch(e => setMsg('Scheduler: ' + e.message))}>Book slot</button>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Engine rejects OVERLAP / PAST_DATE / END_BEFORE_START with HTTP 409 + issue codes. Log notes via meeting update after completion.</p>
          <div style={{ marginTop: 14 }}>
            <h4>My meetings</h4>
            {!meetList.length && <p style={{ color: 'var(--muted)' }}>None yet — book your first slot above.</p>}
            {meetList.map(mt => (
              <div key={mt.id} style={{ borderBottom: '1px solid var(--line)', padding: '10px 0' }}>
                <span className="chip">{mt.status}</span>
                <b>{mt.other_name}</b>
                <span style={{ color: 'var(--muted)', fontSize: 13 }}> {new Date(mt.scheduled_start).toLocaleString()}</span>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {mt.status === 'scheduled' && (
                    <>
                      <button className="btn btn-green btn-sm" onClick={() => api.meetingUpdate(mt.id, { status: 'completed' }).then(() => { setMsg('Meeting completed'); loadMeets(); }).catch(e => setMsg(e.message))}>Complete</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => api.meetingUpdate(mt.id, { status: 'no_show' }).then(loadMeets).catch(e => setMsg(e.message))}>No-show</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => api.meetingUpdate(mt.id, { status: 'cancelled' }).then(loadMeets).catch(e => setMsg(e.message))}>Cancel</button>
                    </>
                  )}
                </div>
                <label>Log notes / outcomes</label>
                <textarea rows="2" placeholder="Discussion summary + action items" value={logNotes[mt.id] || ''} onChange={e => setLogNotes({ ...logNotes, [mt.id]: e.target.value })} />
                <button className="btn btn-ghost btn-sm" style={{ marginTop: 6 }} onClick={() => api.meetingUpdate(mt.id, { notes: logNotes[mt.id] || '', outcomes: '' }).then(() => setMsg('Log saved')).catch(e => setMsg(e.message))}>Save log</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'goals' && (
        <div className="card rv">
          <h3>Goal tracker</h3>
          <label>Title</label><input value={goal.title} onChange={e => setGoal({ ...goal, title: e.target.value })} />
          <label>Target date</label><input type="date" value={goal.target_date} onChange={e => setGoal({ ...goal, target_date: e.target.value })} />
          <div style={{ marginTop: 12 }}><button className="btn btn-green btn-sm" onClick={() => api.goal(goal).then(() => { setMsg('Goal created with audit trail'); loadGoals(); }).catch(e => setMsg(e.message))}>Add goal</button></div>
          <div style={{ marginTop: 14 }}>
            <h4>My goals</h4>
            {!goalList.length && <p style={{ color: 'var(--muted)' }}>No goals yet.</p>}
            {goalList.map(g => (
              <div key={g.id} style={{ borderBottom: '1px solid var(--line)', padding: '10px 0' }}>
                <b>{g.title}</b> <span className="chip">{g.status}</span>
                <span style={{ color: 'var(--muted)', fontSize: 13 }}> due {new Date(g.target_date).toLocaleDateString()}</span>
                <div className="meter"><i style={{ width: g.progress_pct + '%' }} /></div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input type="range" min="0" max="100" value={g.progress_pct} style={{ width: 160 }} onChange={e => setGoalList(goalList.map(x => x.id === g.id ? { ...x, progress_pct: +e.target.value } : x))} onMouseUp={e => api.goalUpdate(g.id, { progress_pct: +e.target.value }).then(() => setMsg('Progress saved')).catch(err => setMsg(err.message))} />
                  <span style={{ fontSize: 13 }}>{g.progress_pct}%</span>
                  {g.status !== 'done' && <button className="btn btn-ghost btn-sm" onClick={() => api.goalUpdate(g.id, { status: 'done', progress_pct: 100 }).then(loadGoals).catch(e => setMsg(e.message))}>Done</button>}
                  {g.status === 'not_started' && <button className="btn btn-ghost btn-sm" onClick={() => api.goalUpdate(g.id, { status: 'in_progress' }).then(loadGoals).catch(e => setMsg(e.message))}>Start</button>}
                  <button className="btn btn-ghost btn-sm" aria-label="Delete goal" onClick={() => { if (window.confirm('Delete this goal?')) api.goalDel(g.id).then(loadGoals).catch(e => setMsg(e.message)); }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'feedback' && (
        <div className="card rv">
          <h3>Feedback survey (1–5)</h3>
          <div className="grid2">
            <div><label>meeting_id</label><input value={fb.meeting_id} placeholder="completed meeting id" onChange={e => setFb({ ...fb, meeting_id: e.target.value })} /></div>
            <div><label>overall (1–5)</label><input type="number" min="1" max="5" value={fb.rating} onChange={e => setFb({ ...fb, rating: +e.target.value })} /></div>
            <div><label>communication (1–5)</label><input type="number" min="1" max="5" value={fb.communication_rating} onChange={e => setFb({ ...fb, communication_rating: +e.target.value })} /></div>
            <div><label>relevance (1–5)</label><input type="number" min="1" max="5" value={fb.relevance_rating} onChange={e => setFb({ ...fb, relevance_rating: +e.target.value })} /></div>
          </div>
          <label>comment</label><textarea rows="3" value={fb.comment} onChange={e => setFb({ ...fb, comment: e.target.value })} />
          <div style={{ marginTop: 12 }}><button className="btn btn-gold btn-sm" onClick={() => api.feedback({ ...fb, tags: ['helpful'] }).then(() => setMsg('Thanks — rating feeds coordinator satisfaction')).catch(e => setMsg(e.message))}>Submit rating</button></div>
        </div>
      )}

      {tab === 'profile' && (
        <div className="card rv">
          <h3>My profile</h3>
          {!prof && <p style={{ color: 'var(--muted)' }}>Loading… (login required; API offline shows nothing here)</p>}
          {prof && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              const body = {
                full_name: String(fd.get('full_name') || prof.full_name),
                languages: String(fd.get('languages') || 'English').split(',').map(s => s.trim()).filter(Boolean),
                bio: String(fd.get('bio') || ''),
                department: String(fd.get('department') || ''),
                study_year: fd.get('study_year') ? +fd.get('study_year') : null,
                domain_interests: String(fd.get('domains') || '').split(',').map(s => s.trim()).filter(Boolean),
                company: String(fd.get('company') || ''),
                designation: String(fd.get('designation') || ''),
                expertise_tags: String(fd.get('tags') || '').split(',').map(s => s.trim()).filter(Boolean),
                years_exp: fd.get('exp') ? +fd.get('exp') : null,
                max_mentees: fd.get('cap') ? +fd.get('cap') : null
              };
              api.profileUpdate(body).then(() => { setMsg('Profile saved'); loadProf(); }).catch(e => setMsg(e.message));
            }}>
              <label htmlFor="pf-name">Full name</label>
              <input id="pf-name" name="full_name" defaultValue={prof.full_name} required minLength="2" maxLength="120" />
              <label htmlFor="pf-lang">Languages (comma list)</label>
              <input id="pf-lang" name="languages" defaultValue={(prof.languages || []).join(', ')} />
              {prof.role === 'student' && (<>
                <label htmlFor="pf-dept">Department</label><input id="pf-dept" name="department" defaultValue={prof.profile?.department || ''} />
                <label htmlFor="pf-yr">Study year (1–5)</label><input id="pf-yr" name="study_year" type="number" min="1" max="5" defaultValue={prof.profile?.study_year || ''} />
                <label htmlFor="pf-dom">Domain interests (comma list)</label><input id="pf-dom" name="domains" defaultValue={(prof.profile?.domain_interests || []).join(', ')} />
              </>)}
              {prof.role === 'alumni' && (<>
                <label htmlFor="pf-co">Company</label><input id="pf-co" name="company" defaultValue={prof.profile?.company || ''} />
                <label htmlFor="pf-des">Designation</label><input id="pf-des" name="designation" defaultValue={prof.profile?.designation || ''} />
                <label htmlFor="pf-tags">Expertise tags (comma list)</label><input id="pf-tags" name="tags" defaultValue={(prof.profile?.expertise_tags || []).join(', ')} />
                <div className="grid2">
                  <div><label htmlFor="pf-exp">Years exp</label><input id="pf-exp" name="exp" type="number" min="0" max="50" defaultValue={prof.profile?.years_exp ?? ''} /></div>
                  <div><label htmlFor="pf-cap">Max mentees (1–20)</label><input id="pf-cap" name="cap" type="number" min="1" max="20" defaultValue={prof.profile?.max_mentees ?? ''} /></div>
                </div>
                <p style={{ color: 'var(--muted)' }}>Active mentees now: <b>{prof.active_mentees ?? '—'}</b> (capacity enforced by backend, not this form)</p>
              </>)}
              <label htmlFor="pf-bio">Bio</label><textarea id="pf-bio" name="bio" rows="3" maxLength="500" defaultValue={prof.profile?.bio || ''} />
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-green btn-sm" type="submit">Save profile</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { if (window.confirm('Deactivate your account? You will be logged out immediately.')) api.profileDel().then(() => { localStorage.clear(); location.href = '/login'; }).catch(e => setMsg(e.message)); }}>Deactivate my account</button>
              </div>
            </form>
          )}
        </div>
      )}

      {tab === 'admin' && (
        <div>
          <div className="grid4">
            {[['Students', kpis?.totals?.students ?? '…'], ['Mentors', kpis?.totals?.mentors ?? '…'], ['Active matches', kpis?.totals?.active_matches ?? '…'], ['Pending requests', kpis?.totals?.pending_requests ?? '…'], ['Open requests', kpis?.totals?.open_requests ?? '…'], ['Upcoming meetings', kpis?.totals?.upcoming_meetings ?? '…'], ['Goals done', (kpis?.totals ? `${kpis.totals.goals_done}/${kpis.totals.goals_total}` : '…')], ['Feedback', kpis?.feedback_count ?? '…']].map(([k, v]) => (
              <div className="card rv" key={k} style={{ textAlign: 'center' }}><div style={{ color: 'var(--muted)', fontSize: 13 }}>{k}</div><div className="kpi gold-text">{v}</div></div>
            ))}
          </div>
          <div className="grid4" style={{ marginTop: 14 }}>
            {[['Satisfaction', (kpis?.satisfaction ?? '…') + ' / 5'], ['Load std-dev', (kpis?.load_stddev ?? '…') + ' %'], ['Conflict rate', (kpis?.conflict_rate ?? '…') + ' %'], ['Meetings', kpis?.total_meetings ?? '…']].map(([k, v]) => (
              <div className="card rv" key={k} style={{ textAlign: 'center' }}><div style={{ color: 'var(--muted)', fontSize: 13 }}>{k}</div><div className="kpi gold-text">{v}</div></div>
            ))}
          </div>
          <div className="card rv" style={{ marginTop: 14 }}>
            <h3>Mentor load — <span style={{ fontWeight: 400, fontSize: 14, color: 'var(--muted)' }}>from v_mentor_load (capacity balance evidence)</span></h3>
            <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Mentor</th><th>Active</th><th>Cap</th><th>Load</th></tr></thead>
              <tbody>{(kpis?.mentor_load || []).map((x, i) => <tr key={i}><td>{x.full_name}</td><td>{x.active_mentees}</td><td>{x.max_mentees}</td><td><div className="meter"><i style={{ width: x.load_pct + '%' }} /></div>{x.load_pct}%</td></tr>)}</tbody></table></div>
          </div>
          <div className="card rv" style={{ marginTop: 14 }}>
            <h3>Users — <span style={{ fontWeight: 400, fontSize: 14, color: 'var(--muted)' }}>operate the service</span></h3>
            <label htmlFor="uq">Search email / name</label>
            <input id="uq" placeholder="e.g. alumni" onChange={e => loadUsers(e.target.value)} />
            <div className="tbl-wrap"><table className="tbl" style={{ marginTop: 8 }}><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Active</th><th>Actions</th></tr></thead>
              <tbody>{usersList.map(u => (
                <tr key={u.id}>
                  <td>{u.full_name}</td><td style={{ fontSize: 12 }}>{u.email}</td><td>{u.role}</td><td>{u.is_active ? 'yes' : 'no'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { if (window.confirm((u.is_active ? 'Deactivate ' : 'Reactivate ') + u.email + '?')) api.adminUserUpdate(u.id, { is_active: u.is_active ? 0 : 1 }).then(() => loadUsers(document.getElementById('uq')?.value || '')).catch(e => setMsg(e.message)); }}>{u.is_active ? 'Deactivate' : 'Reactivate'}</button>
                    {u.role === 'alumni' && <button className="btn btn-ghost btn-sm" style={{ marginLeft: 6 }} onClick={() => { const cap = window.prompt('New mentee cap (1–20) for ' + u.email + '?'); if (cap) api.adminUserUpdate(u.id, { max_mentees: +cap }).then(() => setMsg('Cap updated')).catch(e => setMsg(e.message)); }}>Set cap</button>}
                  </td>
                </tr>
              ))}</tbody></table></div>
            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => api.exportCsv('audit').catch(e => setMsg(e.message))}><IconDownload size={14} /> audit.csv</button>
              <button className="btn btn-ghost btn-sm" onClick={() => api.exportCsv('mentor-load').catch(e => setMsg(e.message))}><IconDownload size={14} /> mentor-load.csv</button>
            </div>
          </div>
          <div className="card rv" style={{ marginTop: 14 }}>
            <h3>Audit trail — <span style={{ fontWeight: 400, fontSize: 14, color: 'var(--muted)' }}>append-only (UPDATE/DELETE blocked by trigger)</span></h3>
            <label htmlFor="aq">Search action / entity</label>
            <input id="aq" placeholder="e.g. MATCH.ACCEPTED" onChange={e => api.adminAudit(e.target.value).then(setAuditRows).catch(() => {})} />
            <div className="tbl-wrap"><table className="tbl"><thead><tr><th>#</th><th>Action</th><th>Entity</th><th>Actor</th><th>Time</th></tr></thead>
              <tbody>{auditRows.map(a => <tr key={a.id}><td>{a.id}</td><td>{a.action}</td><td>{a.entity}</td><td style={{ fontSize: 12 }}>{a.actor_user_id ? String(a.actor_user_id).slice(0, 8) : '—'}</td><td style={{ fontSize: 12 }}>{new Date(a.created_at).toLocaleString()}</td></tr>)}</tbody></table></div>
            {!auditRows.length && <p style={{ color: 'var(--muted)' }}>No audit rows via API (backend offline?) — direct SQL: <code>SELECT * FROM audit_logs ORDER BY id DESC FETCH FIRST 20 ROWS ONLY;</code></p>}
          </div>
        </div>
      )}
    </section>
  );
}
