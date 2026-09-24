# Release Notes — MentorSetu v2.0.0 (2026-09-14, Oracle edition)

## Features
- Explainable rule-based matching (NOT ML): weights 40/25/15/20 + capacity penalty + reasons[]
- Capacity-aware backend gates (request + accept-time `fn_capacity_ok`) + waitlist state
- Match/meeting state machines with illegal-transition 409s
- Availability calendar with conflict-checked scheduling
- Goals, 3-axis feedback, coordinator KPIs + audit-trail viewer
- 3D Three.js landing, GSAP scroll, dark/light green-white-gold theme
- Telemetry: /health, /metrics (+match_duration_seconds), request-ids, audit on every write

## Security
- Bind-only SQL + CI scan, bcrypt-12 + complexity policy, DB lockout, RBAC+ownership, helmet CSP/HSTS, least-privilege `mentor_app`, append-only audit

## Testing (all real)
- 14/14 unit+security+workflow tests; live RBAC/transition/conflict workout; SQL*Plus constraint spool 4/4 PASS; baseline 14×12 experiment (0 violations vs baseline 4)

## Fixes this release
- Oracle reserved word `MODE` → `meet_mode`; idempotent schema re-runs; seed bcrypt hash corrected; anchor-scroll routing; API status visibility

## Known limitations
- Oracle XE must be host-local (not containerised); CI workflow added but never executed (no remote); usability study pending; notifications out of scope.
