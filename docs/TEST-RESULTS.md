# Test Results (actual runs, 2026-09-24)

`npm test` in `backend/`: **17/17 PASS** — matching (3), security incl. SQLi/NoSQL/DoS-shape/password-policy/no-interpolation/reserved-binds/hostile-input (7), workflow transitions + profile/slot validation (7).

Live verification 2026-09-24 (fresh server, Oracle XE): notifications endpoint OK, forgot→reset→login-with-new-password OK (password restored after), request-match writes `MATCH.REQUEST` notification row (spooled), correct-alumni accept OK with bell item, wrong-alumni accept correctly 403, promotion SELECT valid (no waitlisted rows — path code-reviewed).
2026-09-24 SaaS pass: refresh rotation verified (new token differs, old-token reuse → 401, chained refresh OK). **Bug found live:** pre-`jti` refresh JWTs minted in the same second were byte-identical, defeating rotation — fixed with `jti` nonce + unique hash index (`migrate_06`), temp test users removed. Ready/version probes, consent-required register, self-erasure (register→deactivate→login-blocked), admin users search + deactivate + cap, CSV exports all live-verified.

| Test | Result | Evidence |
|---|---|---|
| explainable score prefers fit | PASS | matching.test.js |
| full mentor excluded | PASS | matching.test.js |
| conflict detected | PASS | matching.test.js |
| SQLi strings rejected | PASS | security.test.js (5 payloads) |
| NoSQL keys stripped | PASS | security.test.js |
| oversized/malformed rejected | PASS | security.test.js |
| password policy | PASS | security.test.js (4 weak rejected) |
| no ${} in SQL | PASS | static scan |
| no reserved binds | PASS | static scan (regression for live ORA-01745) |
| hostile input survives | PASS | engines coerce, no throw |
| match transitions (5 legal / 7 illegal) | PASS | workflow.test.js |
| meeting terminal states | PASS | workflow.test.js |
| feedback bounds | PASS | workflow.test.js |
| profile validation | PASS | workflow.test.js |
| slot time shape | PASS | workflow.test.js |

Live API workout (2026-09-14, recorded in TEST-REPORT.md): health up, 4 role logins, request→suggest(5)→request-match→accept, 403s, 409s, audit rows. Re-run after this polish via `start-local.bat` + demo flow.
Frontend `vite build`: success (~12s; chunk-size warning only).
SQL*Plus `evidence/database/verify.sql`: 4/4 PASS (UNIQUE, CHECK ORA-02290, audit ORA-20001, FK ORA-02291).
Baseline `scripts/baseline-compare.js`: 14 requests × 12 alumni → baseline 4 violations vs proposed 0 (EVALUATION-REPORT.md).
`npm audit`: 3 moderate (uuid GHSA, unreachable path) — SECURITY-REPORT.md.
Docker/CI: files present, NOT VERIFIED (no Docker host / no remote here).
