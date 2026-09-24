# Admin Guide — Coordinator

Login: `coordinator@college.edu` / `Password123!` → Workspace → **admin** tab.

## What you see
- **Satisfaction /5** (overall + communication + relevance averages from feedback)
- **Load std-dev %** — spread of mentor utilization; high = rebalance needed
- **Conflict rate %** — cancelled/total meetings
- **Mentor load table** — active/cap/load% per mentor from `v_mentor_load`
- **Audit trail** — latest 100 events (who did what, when, from which IP)

## SQL*Plus checks (system/admin)
```sql
ALTER SESSION SET CURRENT_SCHEMA = mentor_app;
SELECT * FROM v_mentor_load ORDER BY load_pct DESC;      -- who is hot
SELECT action, COUNT(*) FROM audit_logs GROUP BY action;  -- activity mix
SELECT email, COUNT(*) FROM login_attempts               -- brute-force watch
 WHERE success = 0 AND attempted_at > SYSTIMESTAMP - INTERVAL '15' MINUTE GROUP BY email;
```

## Operations
- **Rebalance**: ask an overloaded mentor to raise `max_mentees`, or waitlist students to emptier mentors:
  `UPDATE alumni_profiles SET max_mentees = 7 WHERE user_id = '...'; COMMIT;`
- **Lockout**: 5 failed logins/15 min auto-locks an email; clear with `DELETE FROM login_attempts WHERE email='...'; COMMIT;`
- **Monitoring**: API exposes `/health` (db up/down) and `/metrics` (Prometheus: latency histogram, match timing). Logs are JSON-ish via morgan; every response carries `X-Request-Id`.
- **Never**: share SYSTEM password, edit `audit_logs` (trigger blocks it — ORA-20001), store real student PII in demo DB.
