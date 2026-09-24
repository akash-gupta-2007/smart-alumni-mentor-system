# MentorSetu — BIT-05 (Oracle SQL*Plus + Node + React + Three.js)

Explainable, capacity-aware alumni-mentor marketplace. Green / White / Gold, dark + light, 3D animated, scrollable, responsive. Hardened against SQL injection + common web attacks.

Docs hub: `docs/` (gap analysis, architecture, matching algorithm, API, security, privacy, tests, baseline, robustness, deployment, troubleshooting, readiness). Machine API spec: `openapi.yaml`.

## 0. One-click local hosting (Windows)
Double-click **`start-local.bat`** — API (`:4000`) + UI (`:5173`, browser auto-opens) in visible windows. **`stop-local.bat`** shuts both down. (Keep those windows open while testing.)
- Node 20+, Oracle XE with SQL*Plus. Login to SQL*Plus as `system` / `admin`:
```bash
sqlplus system/admin@//localhost:1521/XEPDB1
```

## 2. Database — Oracle via SQL*Plus (robust relational + PL/SQL)
```bash
sqlplus system/admin@//localhost:1521/XEPDB1 @db/oracle_schema.sql
sqlplus system/admin@//localhost:1521/XEPDB1 @db/oracle_seed.sql
sqlplus system/admin@//localhost:1521/XEPDB1 @db/migrate_02_feedback.sql
```
- 12 tables (users, student/alumni profiles, slots, requests, matches, meetings, logs, goals, feedback, append-only `audit_logs`, `login_attempts`) + `v_mentor_load` view
- PL/SQL package `mentor_sec`: lockout counter, capacity gate, autonomous-txn audit writer
- Triggers: `updated_at` auto-touch, audit-trail append-only guard (`ORA-20001` on UPDATE/DELETE)
- Least privilege: app connects as `mentor_app` (DML-only grants, no DDL, never SYSTEM)
- Demo logins (pw `Password123!`): `student1@college.edu`, `alumni1@example.com`, `coordinator@college.edu`

## 3. Backend (strong logic + anti-hack)
```bash
cd backend
copy .env.example .env   # set DB_PASSWORD + 32+ char JWT_SECRET
npm install
npm test                 # matching + capacity + conflicts + SQLi/validation/static-SQL-scan
npm run seed             # 32-user synthetic set (needs Oracle up)
npm start                # :4000 | /health | /metrics
```
Security layers:
1. **SQL injection impossible by construction** — oracledb bind variables only (`:email`), static test scans `src/` for `${}` inside SQL and fails the build
2. **DB least privilege** — `mentor_app` cannot DROP/ALTER; audit writes via PL/SQL proc
3. **Brute-force shield** — 5 fails/15min → lockout (`login_attempts` + `fn_is_locked`), generic 401 (no user enumeration), bcrypt-12
4. **Input allowlist** — Joi on every body, UUID-format path params, 10-char complex passwords, sizes capped, unknown keys stripped
5. **Headers/transport** — helmet CSP + HSTS, CORS allowlist, no `X-Powered-By`, rate limits, 100kb bodies, request-id tracing, zero stack traces to clients
6. **Ownership checks** — students see only own requests, alumni decide only own matches, meeting writes are participant-only

Core engine `matchingService.js`: `0.40 domain(Jaccard)+0.25 goal+0.15 lang+0.20 availability`, penalty `0.3×load`, full→waitlist with reasons. Scheduler rejects `OVERLAP/PAST_DATE/OUTSIDE_AVAILABILITY` (409) + Oracle CHECKs back it up.

## 4. Frontend (unchanged 3D build)
```bash
cd frontend
npm install
npm run dev   # :5173, proxies /api → :4000
```

## 5. Acceptance evidence
- `npm test` green (incl. security suite), satisfaction ≥4/5, load std-dev <25%, conflicts <5%, RBAC 100%, p95 <500ms
- Failure drills: stop Oracle → `/health` shows `db: down`, API returns safe 500s; double-book → 409; audit UPDATE attempt → ORA-20001

## 6. Structure
```
database/setup.sql           (SQL*Plus run order: schema → seed → migrate_02)
db/oracle_schema.sql, db/oracle_seed.sql, db/migrate_02_feedback.sql, db/verify_queries.sql
backend/src/{server,app,config/db,middleware/{auth,audit,validate},routes/{auth,api},services/{matchingService,schedulingService,workflow},seed}
backend/tests/{matching.test.js, security.test.js, workflow.test.js}   (17/17 green)
backend/scripts/baseline-compare.js
frontend/src/{App,main,theme,lib/api,three/Scene3D,components,pages}
docs/{BIT05-GAP-ANALYSIS,MATCHING-ALGORITHM,API-DOCUMENTATION,SECURITY,PRIVACY-AND-DATA-HANDLING,TEST-RESULTS,BASELINE-COMPARISON,FAILURE-ROBUSTNESS-TEST,SYSTEM-CARD,SYSTEM-ARCHITECTURE,DATABASE-DESIGN,THREAT-MODEL,DEPLOYMENT,TROUBLESHOOTING,FINAL-READINESS-REPORT}.md
openapi.yaml   (served at /openapi.yaml)
```
