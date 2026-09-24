# Architecture — MentorSetu (BIT-05)

Plain-language guide for B.Sc. IT students. Stack: React+Vite+Three.js (frontend),
Node+Express+oracledb (backend), Oracle XE via SQL*Plus (database). No Docker needed locally.

## 1. System context (C4 L1)

```
[Student/Alumni/Coordinator browser] --HTTPS--> [Vite UI :5173] --/api--> [Express API :4000]
                                                                              |
                                                                              v (oracledb binds only)
                                                              [Oracle XE :1521/XEPDB1 as mentor_app]
```

## 2. Containers (C4 L2)

| Container | Tech | Responsibility |
|---|---|---|
| Web UI | React 18, react-router, Three Fiber, GSAP | 3 pages: Landing, Login, Workspace (6 tabs). Never trusts itself: every action re-checked server-side |
| API | Express 4, JWT, Joi, helmet, rate-limit, prom-client | Auth, RBAC, matching orchestration, scheduling guard, audit, /health, /metrics |
| Matching engine | Pure JS `matchingService.js` | Weighted score + capacity penalty + reasons[] (rule-based, NOT ML) |
| Database | Oracle 21c XE | 12 tables, `mentor_sec` PL/SQL (lockout, capacity gate, audit), 2 triggers, `v_mentor_load` view |
| Seed/simulator | `seed.js` + `baseline-compare.js` | 33 synthetic users, 37 slots, baseline experiment |

## 3. Data flow: request → recommendation

```
Student POST /api/requests ──► mentorship_requests (status=open)
Student GET /api/suggest/:id ──► load alumni + slots + active counts
   ──► rank(): score = .40·domain + .25·goal + .15·lang + .20·avail; × (1 − .30·load)
   ──► full mentors → score 0 + waitlist reason
   ◄── Top-5 [{score, breakdown, reasons[]}]
Student POST /api/request-match ──► mentor_sec.fn_capacity_ok ──► matches(requested|waitlisted)
Alumni PATCH /api/matches/:id ──► transition guard ──► accepted ──► meeting ──► goals/feedback
Every write ──► mentor_sec.proc_audit (autonomous txn) ──► audit_logs
```

## 4. Matching sequence

```
Student → API: GET /suggest/:req
API → Oracle: alumni + slots + active counts (3 bound queries)
API → rank(): pure function, timed by match_duration_seconds histogram
API → Student: [{alumni_id, score, breakdown, reasons[], full}]
```

## 5. Meeting workflow

```
accepted match → POST /meetings (conflict check: OVERLAP/PAST/OUTSIDE → 409)
→ scheduled → PATCH status (forward-only; terminal states locked)
→ meeting_logs row → goals progress → feedback (one rating/meeting/person)
```

## 6. ER (key relations)

```
users 1──1 student_profiles | 1──1 alumni_profiles | 1──n availability_slots
users 1──n mentorship_requests 1──n matches ──1──n meetings ──1──1 meeting_logs
matches 1──n goals | meetings 1──n feedback | users 1──n audit_logs
```

## 7. Security layering

Client Joi-strip → JWT+RBAC → UUID params → capacity/transition guards → bind-only SQL →
least-privilege `mentor_app` → CHECK/FK/TRIGGER constraints → append-only audit.
