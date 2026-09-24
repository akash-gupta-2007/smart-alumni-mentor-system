# Agile Backlog — MentorSetu

## P0 (must work for demo)
- [x] As a student, I want to register/login securely so my data is protected. (bcrypt-12, JWT, lockout)
- [x] As a student, I want Top-N mentor picks WITH reasons so I trust the system. (breakdown + reasons[])
- [x] As a system, I must never overload a mentor so nobody burns out. (cap penalty + DB gate + waitlist)
- [x] As an alumnus, I want to set weekly slots + a mentee cap so mentoring fits my life.
- [x] As an alumnus, I want to accept/decline requests so I stay in control. (transition guard)
- [x] As a user, I want meetings conflict-checked so double-booking is impossible. (409 + issue codes)

## P1 (full lifecycle)
- [x] As a student, I want goals with progress % so I see growth.
- [x] As a student, I want to rate meetings so good mentors get recognised. (1–5 ×3 axes, one/person/meeting)
- [x] As a coordinator, I want satisfaction/load/conflict KPIs + audit trail so I can govern.
- [x] As a coordinator, I want to inspect any audit event. (admin/audit, 100 latest)

## P2 (hardening & polish)
- [x] Security suite: SQLi/NoSQL/DoS-shape inputs rejected; no interpolated SQL (static scan in CI).
- [x] Telemetry: /health, /metrics, match_duration_seconds, request-id tracing.
- [x] Baseline experiment with real numbers (baseline-compare.js).
- [ ] Usability study with 5+ real users (SUS) — planned, not yet run (see EVALUATION-REPORT).
- [ ] Email/push notifications for request/accept — future scope.
