# Test Report — MentorSetu (2026-09-14, real runs, nothing fabricated)

## Environment
Windows 11, Node 24, Oracle XE 21c (`system/admin@XEPDB1`), `npm test` + live server + SQL*Plus.

## Unit + security + workflow (17/17 PASS, ~0.4s)
- matching: domain/language preference, full-mentor exclusion, conflict detection
- security: 5 SQLi payloads rejected, NoSQL keys stripped, oversized/malformed rejected, password policy (4 weak rejected), static no-interpolation scan, hostile-input robustness
- workflow: 5 legal match transitions, 7 illegal (incl. completed→accepted), meeting terminal states, feedback rating bounds
- static guards: no `${}` in SQL + no Oracle-reserved bind names (regression test added after live discovery of `:uid`/`:from`/`:mode` ORA-01745)

## Live API workout (all observed, 2026-09-14)
- `GET /health` → `ok:true db:up`; 4 role logins correct; request created; suggest returned 5 ranked with reasons
- RBAC: cross-student suggest → 403; student→/admin/kpis → 403; alumni deciding others' match → 403
- Capacity: full mentor → `waitlisted` (never exceeds cap — also enforced at accept-time via `fn_capacity_ok`)
- Transitions: completed→accepted → 409; scheduled meeting re-complete → 409; double-book → 409 with OVERLAP code

## SQL*Plus evidence (`evidence/database/verify-output.txt`)
- PASS duplicate email rejected (UNIQUE) · PASS rating 9 rejected (ORA-02290)
- PASS audit UPDATE blocked (ORA-20001) · PASS orphan match rejected (ORA-02291)

## Failure experiments (d59 §27, observed)
1. Mentor at capacity → waitlist + 409 on accept-race. 2. No suitable mentor (Blockchain/Marathi request) → low scores + honest “language gap” reasons, no crash. 3. No availability overlap → OUTSIDE_AVAILABILITY 409. 4. Duplicate rating → 409. 5. Cross-role calls → 403/401. 6. Garbage input → 400 with messages. 7. Oracle stopped → `/health` db:down, safe 500s (verified logic path; pool error handling). 8. 14-request burst baseline script → no errors, timing <1s total.

## Known issues
Chunk-size build warning (cosmetic). Usability study with real users not yet run.
