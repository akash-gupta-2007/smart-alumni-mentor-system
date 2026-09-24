# BIT-05 Gap Analysis (post-polish, 2026-09-24)

Stack preserved: React+Vite+Three.js frontend, Node+Express+oracledb backend, Oracle XE + SQL*Plus. No migration performed.

| Requirement | Status | Evidence | Missing/Problem | Action |
|---|---|---|---|---|
| Auth (register/login/logout) | COMPLETE | `routes/auth.js` + bcrypt-12 + lockout + `POST /auth/logout` audit; live logins verified | — | — |
| RBAC | COMPLETE | `allow()` + ownership checks; live 403s | — | — |
| Student profile edit | COMPLETE | `GET/PUT /profile` + Dashboard profile tab | — | — |
| Alumni profile + cap edit | COMPLETE | same endpoint; `active_mentees` shown | — | — |
| Availability CRUD | COMPLETE | POST/GET/PUT/DELETE + UI edit/delete + CHECK end>start | — | — |
| Explainable matching | COMPLETE | `matchingService.js` weights + reasons[] + breakdown; UI cards | — | — |
| Capacity-aware | COMPLETE | penalty + waitlist + `fn_capacity_ok` double-gate; baseline 4→0 | — | — |
| Match workflow | COMPLETE | `workflow.js` transitions; UI accept/decline/complete w/ confirms | — | — |
| Meetings + log | COMPLETE | conflict 409s + `GET /meetings/mine` + UI list/status/log editor | — | — |
| Goals CRUD | COMPLETE | POST/GET/PATCH/DELETE + UI list/slider/Start/Done/Delete | — | — |
| Feedback | COMPLETE | 3-axis ratings + dup 409 + UI | — | — |
| Coordinator dashboard | COMPLETE | totals + KPIs + load + audit viewer (live data only) | — | — |
| Audit logging | COMPLETE | autonomous PL/SQL + trigger ORA-20001; spool 4/4 PASS | — | — |
| Secure APIs | COMPLETE | binds-only + static scans, helmet, limits; 17/17 tests | — | — |
| Tests | COMPLETE | 17/17 unit+security+workflow | — | — |
| Baseline comparison | COMPLETE | `scripts/baseline-compare.js` real run 14×12 | — | — |
| Failure/robustness | COMPLETE | 8 scenarios observed, spool PASS | — | — |
| Telemetry | COMPLETE | /health /metrics + match timing + request-ids | — | — |
| Docker | PARTIAL | Dockerfiles + compose (Oracle-external) | NOT VERIFIED (no Docker host here) | Run `docker compose up --build` on a Docker host |
| CI | PARTIAL | `.github/workflows/ci.yml` | NOT VERIFIED (no remote) | Push to GitHub, watch first green run |
| Usability study | MISSING | — | No real-user SUS yet | 5-user test, target >70 |
| Demo video | MISSING | DEMO-FLOW.md exists | Not recorded | Record 5–8 min per flow |
