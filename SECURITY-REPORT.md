# Security Report — MentorSetu (v2.0.0, 2026-09-14)

## Controls implemented
| Area | Control | Evidence |
|---|---|---|
| Passwords | bcrypt-12, 10+ char UPPER/lower/digit policy | `auth.js`, `validate.js`, tests |
| SQL injection | 100% bind variables (`:name`); CI static scan fails build on `${}` in SQL | `tests/security.test.js` “no interpolation” |
| Auth | JWT (12h, 32+ char secret), generic 401 (no enumeration) | `auth.js` |
| Brute force | 5 fails/15 min lockout (`login_attempts` + `fn_is_locked`) + 30/15min IP limit | live-tested 429 path |
| RBAC | student/alumni/coordinator enforced per-route + ownership checks | live 403s verified |
| Validation | Joi allowlist, UUID path params, capped lengths, stripUnknown | 9 security tests |
| Least privilege | App = `mentor_app` (DML only); never SYSTEM | `oracle_schema.sql` grants |
| Audit | Autonomous-txn PL/SQL writer; trigger blocks UPDATE/DELETE (ORA-20001) | `evidence/database/verify-output.txt` |
| Transport | helmet CSP+HSTS, CORS allowlist, no x-powered-by, 100kb bodies, request-ids | `app.js` |
| Secrets | `.env` gitignored, `.env.example` only; no secrets in repo/evidence | `.gitignore` |

## Threat model
| Threat → Impact → Likelihood → Mitigation → Test |
|---|---|---|---|---|
| SQLi → full DB theft → Low → binds + scan → payload suite passes |
| Credential stuffing → account takeover → Med → lockout + rate limit + bcrypt cost → 429 verified |
| Privilege escalation (student→admin) → data exposure → Low → allow() + ownership → live 403s |
| XSS via comment/name → session theft → Low → React escaping + Joi length caps + CSP `object-src none` |
| Capacity gaming (double-accept race) → overload → Low → DB re-check `fn_capacity_ok` at decision time |
| Fake profiles → matching abuse → Med → college-email convention + coordinator oversight (no automated ID check — limitation) |
| Audit tampering → cover tracks → Low → trigger ORA-20001 → spool PASS |
| DoS floods → outage → Med → rate limits + 100kb cap (no WAF — limitation) |

## Dependency scan (npm audit, backend, 2026-09-14)
- **3 moderate**: `uuid` GHSA-w5hq-g745-h8pq (buffer bounds, needs breaking major). NOT fixed by design: we use only `v4()` with no caller buffers, so the vulnerable path is unreachable; upgrading to v14 would break CJS build. Re-check monthly.

## Limitations
No WAF, no automated ID verification, JWT logout is client-side (12h expiry), no at-rest TDE (XE default). Password reset flow not implemented (coordinator resets via SQL*Plus).
