# System Architecture — MentorSetu (BIT-05)

```
Browser (React+Vite+Three.js :5173)
  → Express API :4000 (JWT → RBAC → Joi → services → oracledb binds)
  → Oracle XE :1521/XEPDB1 as mentor_app (tables + mentor_sec PL/SQL + triggers + v_mentor_load)
  → audit_logs (autonomous) + /health + /metrics + request-ids
```

Modules: auth (register/login/logout/me), profile, requests, suggest/rank, request-match, matches/mine + transitions, slots CRUD, meetings + mine + log, goals CRUD, feedback, admin KPIs + audit.
Request flow: intake → suggest (batched slots + loads → rank) → request-match (ownership/dup/capacity) → accept (transition + capacity re-check) → meeting (conflict 409s) → goals/feedback → coordinator oversight.
Security layers: client strip → JWT/RBAC → UUID params → guards → binds → least-privilege → CHECK/FK/trigger → audit. See ARCHITECTURE.md + SECURITY.md.
