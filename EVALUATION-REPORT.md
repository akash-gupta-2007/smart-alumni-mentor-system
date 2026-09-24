# Evaluation Report — MentorSetu (measured 2026-09-14, synthetic data, n=14 requests × 12 alumni)

Method: `backend/scripts/baseline-compare.js` on live Oracle seed (33 users, 37 slots).
Baseline = greedy domain-only pick, first-come-first-served, no capacity logic.
Proposed = weighted score (40/25/15/20) + 0.3×load penalty + waitlist.

## Results
| Metric | Baseline | Proposed (ours) |
|---|---|---|
| Domain-hit rate | 71.4% | 71.4% |
| Capacity violations | **4** | **0** |
| Full-mentor picks | 4 | 0 (waitlisted instead) |
| Avg top-1 score | n/a (no score) | 47.0 |
| Explanations | none | reasons[] + breakdown every pick |

Reading: relevance ties (seed tags overlap heavily), but baseline overloads 4 mentors while the engine violates capacity zero times — that is the capacity-aware contribution. Verdict: GO on capacity/safety; CONDITIONAL-GO on relevance (needs richer seed + real-user ratings).

## Capacity balance
`v_mentor_load`: no mentor exceeds cap (DB + API gates); std-dev monitored on admin tab. Target <25% after real usage.

## Scheduling conflicts
Conflict engine rejects OVERLAP/PAST/OUTSIDE with 409 (live-verified). Conflict-rate KPI = cancelled/total.

## Privacy checks (all PASS)
Cross-student suggest 403 · student→admin 403 · alumni→others' match 403 · `password_hash` never selected · audit append-only (ORA-20001) · secrets gitignored.

## Usability (honest status)
Not yet measured with real users (limitation). UI provides loading/empty/error states, validation messages, dark/light themes, 44px+ targets. Plan: 5-user SUS test, target >70.

## Limitations
Small synthetic sample; no longitudinal satisfaction data; relevance tie unresolved until diverse seed; single-machine latency only.
