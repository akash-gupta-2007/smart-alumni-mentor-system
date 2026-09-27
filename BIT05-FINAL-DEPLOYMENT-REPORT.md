# BIT05-FINAL-DEPLOYMENT-REPORT.md

## 1. Project Information

- **Project:** BIT-05 — Explainable Alumni-Mentor Matching Marketplace with Capacity-Aware Recommendations
- **App:** MentorSetu
- **Stack:** React 18 + Vite 5 (frontend :5173) → Express 4 + oracledb thin (backend :4000) → Oracle XE (host-local, SQL*Plus)
- **Verified on:** 2026-09-27 (Windows, Node 24, Edge headless)
- **Repo state:** clean tree; launch scripts `start-local.bat` / `stop-local.bat`

## 2. BIT-05 Requirement Matrix

| Requirement | Status | Evidence | Missing Work |
|---|---|---|---|
| Profile onboarding (student + alumni) | VERIFIED | Register 201/409 live; profile GET/PUT live; role-conditional forms | — |
| Availability calendar | VERIFIED | Slot add 201 / list 200 live; edit/delete code-reviewed | Live edit/delete round-trip NOT VERIFIED |
| Match suggestions | VERIFIED | `suggest` 200 live: 5 scored, top 42.75, reasons[]+breakdown+capacity | — |
| Explainable matching ("Why this mentor?") | VERIFIED | reasons[] + `breakdown{domain,goal,lang,avail,load_penalty}` in every suggestion; weights 0.40/0.25/0.15/0.20 − 0.30×load in `matchingService.js` | — |
| Capacity-aware recommendations | VERIFIED | Full mentor → `waitlisted` (live `capacity:"2/1"`, never over-accepted); recheck on accept via `fn_capacity_ok`; waitlist promotion | — |
| Match request workflow | VERIFIED | requested → accepted → completed live; dup → 409; bad transition → 400/409 | — |
| Meeting log + conflict detection | VERIFIED | Book 201, overlap 409, complete 200 live; OUTSIDE_AVAILABILITY 409 | — |
| Goal tracker | VERIFIED | Create 201, progress/done 200, list 200 live | — |
| Feedback survey | VERIFIED | Submit 201, duplicate 409 live | — |
| Coordinator dashboard | VERIFIED | KPIs 200 (real numbers), users, audit, CSV exports live | — |
| Role-based access | VERIFIED | student→admin 403, alumni→admin 403 live; `RoleGuard` on `/app/admin`, `/app/availability` | — |
| Modular architecture / secure APIs / validation | VERIFIED | Joi on bodies, UUID path params, helmet, rate limits, named-bind SQL only (static-scan test) | — |
| Auth (JWT rotate) / health / ready / docs | VERIFIED | 15m access + 30d rotating refresh (reuse → 401); `/health /ready /version /metrics /openapi.yaml` live | — |
| Automated tests | VERIFIED | Backend 18/18 PASS (run 2026-09-27) | Frontend has no unit tests |
| Baseline comparison | VERIFIED | `scripts/baseline-compare.js` on real Oracle data: baseline 5 violations + 5 full picks → proposed 0 violations, explains=true | — |
| Failure/robustness | VERIFIED | Bad-DB drill: `/health`=`db:down`, `/ready`=503, login=500 `{"error":"Login failed"}` (no leaks) | — |
| Responsive | VERIFIED | DOM at 390/768/1024/1440 (+320/375/430/820/1280 earlier): hero+nav render, grids stack ≤960px, burger ≤860px, tables scroll | Real phone NOT VERIFIED |
| Reproducible setup | VERIFIED | `setup.sql` order schema→seed→migrate_02..06; README + 15 docs; `.env.example` placeholders | — |
| Containerized deployment | NOT VERIFIED | Dockerfiles + compose exist but **Docker is not installed** — never built/run (BLOCKED, see §7) | Docker host needed |
| CI/CD | NOT VERIFIED | `.github/workflows/ci.yml` added this session; never executed (no runner) | CI run needed |
| No hard-coded secrets | VERIFIED | `backend/.env` git-ignored, none tracked; only documented demo seed pw `Password123!` | — |

## 3. Feature Verification
Full journey executed live 2026-09-27 (student1 → alumni12 → coordinator): request 201 → suggest 200 → match 201 → accept 200 → slot 201 → meeting 201 → overlap 409 → complete 200 → feedback 201 → dup 409 → goal 201 → logout 200 → refresh-after-logout 401. Auth matrix: valid 200 / bad 401 / no-token 401 / forbidden 403 / weak 400 / dup 409.

## 4. Authentication Verification
- Login (student/alumni/coordinator) 200 with token+refresh+user; logout revokes refresh (reuse → 401).
- `/app` unauthenticated renders login form only (DOM-verified, no workspace leak, no canvas).
- Nested `/app/*` routes + `RoleGuard`; logo → `/app` when authed; single-flight refresh; `/auth/*` errors never log out; only genuine 401-after-failed-refresh clears session.
- Browser refresh/back: token in `localStorage`, routes are stateless → preserved by design; headless DOM confirms gated routes render login when unauthenticated.

## 5. Oracle Database Verification
- XE reachable via SQL*Plus; `MENTOR_APP` 15 tables; seed live (12 alumni / 1 coordinator / 24 students, open requests, audit rows — verified 2026-09-27).
- `/health` → `{"ok":true,"db":"up"}` (this session).
- Oracle-only: `oracledb` is the sole driver; dialect (`VARCHAR2`, `SYSTIMESTAMP`, `FETCH FIRST`, PL/SQL `mentor_sec`, `ORA-20001` trigger) throughout; **no migration performed or planned**.

## 6. Automated Test Results
- `node --test tests/matching.test.js tests/security.test.js tests/workflow.test.js` → **18 pass / 0 fail** (2026-09-27).
- `npm run build` (frontend) → success, ~1–2s.
- `baseline-compare.js` → baseline 5 capacity violations vs proposed 0 (real data).

## 7. Docker/Container Verification — BLOCKED
- Files: `backend/Dockerfile` (node:20-alpine, `npm install --omit=dev`), `frontend/Dockerfile` (build → nginx:alpine), `docker-compose.yml` (api :4000, web :8080, Oracle host-local via `host.docker.internal`, secrets via required env `DB_PASSWORD`/`JWT_SECRET`, no secrets in images).
- **Result: NOT VERIFIED — Docker is not installed on this machine** (`docker` command not found). Never built, never run. Do not treat compose as passing.
- Answers: (1) frontend yes (nginx), (2) backend yes (node), (3) Oracle external by design (images not redistributable — documented in compose header), (4) via env with `:?` guards, (5) yes (`.env` ignored, `.dockerignore` covers), (6) yes on a Docker host, (7) `/health`+`/ready` exist but no compose `healthcheck` blocks, (8) `depends_on: [api]`, ports 4000/80, (9) ports documented, (10) **runnable only where Docker exists — not here**.

## 8. CI/CD Verification — NOT VERIFIED
- No workflows existed; added `.github/workflows/ci.yml` (backend `npm test`, frontend `npm run build`) this session.
- Never executed (no runner/MVP host). DB-backed checks intentionally excluded from CI (need local Oracle XE).

## 9. Security Verification
- `.env` ignored + untracked; no hardcoded secrets (only documented demo seed password); frontend uses `/api` proxy (no hardcoded backend URL); CORS allowlist (`CORS_ORIGIN`); Bearer tokens in memory+localStorage, never logged; RBAC server-side (live 403s); named-bind SQL + static-scan test; Joi validation; safe error shapes (verified `{"error":"Login failed"}` on DB-down); prod JWT-length guard. Full pen-test NOT VERIFIED.

## 10. Responsive Verification
- 390 / 768 / 1024 / 1440 PASS (hero+nav render; burger CSS present; login form @390). Earlier: 320/375/430/820/1280 PASS. Breakpoints: grids→1fr ≤960px, burger ≤860px, `tbl-wrap` horizontal scroll. Real phone: NOT VERIFIED (LAN method documented in README).

## 11. Deployment Architecture
```text
User Browser
     |
     v
Frontend (Vite dev :5173 local | nginx :8080 in compose)
     |
     v  (/api proxy local; direct :4000 in compose)
Backend API (node :4000)
     |
     v  (ORACLE_CONNECT, least-privilege mentor_app)
Oracle XE (HOST-LOCAL, SQL*Plus administered, NOT containerised)
```
Recommended strategy: **Option B** — containerize frontend+backend as defined, keep Oracle XE host-local (zero migration, matches compose + Dockerfiles). Local demo uses `start-local.bat` (verified working).

## 12. Environment Configuration
1. `cd backend && copy .env.example .env` → set `DB_PASSWORD`, 32+ char `JWT_SECRET` (optional `ACCESS/REFRESH_EXPIRES`, `CORS_ORIGIN`).
2. `sqlplus system/admin@//localhost:1521/XEPDB1 @db/oracle_schema.sql` (+ seed + migrate_02..06 per `database/setup.sql`).
3. `npm install` in `backend/` and `frontend/`; `npm test` (backend); `start-local.bat`.
4. Never commit `.env`; never bake secrets into images (compose requires them as env).

## 13. Known Limitations
- Docker unavailable → containers never built/run.
- CI workflow added but never executed.
- SMTP is demo-token mode (hook documented).
- Real phone + browser-console capture not possible headlessly here.
- `three`/`gsap` npm packages installed but unused by `src/` (dead weight).
- QA test rows from verification sessions remain in DB (synthetic, harmless).
- Access token valid ≤15m after logout (stateless JWT; refresh revoked by design).

## 14. Final Status
**READY WITH LIMITATIONS** — every mandatory BIT-05 functional, auth, Oracle, test, build, security-config, and responsive requirement is VERIFIED above; the only open items are environment-bound (Docker host, CI runner, real phone, SMTP), each explicitly marked NOT VERIFIED/BLOCKED with no faking.
