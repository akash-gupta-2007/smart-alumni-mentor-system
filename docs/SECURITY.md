# Security — MentorSetu

Controls: bcrypt-12 + complexity policy; JWT 12h; DB lockout (5/15min) + IP rate limits; RBAC + ownership on every route; Joi allowlists + UUID params; 100% bind variables + static no-interpolation scan + reserved-bind scan; least-privilege `mentor_app`; append-only audit (ORA-20001); helmet CSP/HSTS; CORS allowlist; `.env` gitignored, `.env.example` placeholders only.

## Threat model
| Asset | Threat/Attack | Mitigation | Evidence |
|---|---|---|---|
| Credentials | stuffing/brute force | lockout + limits + bcrypt cost + generic 401 | 429 path tested |
| Profiles/matches | IDOR/BOLA, escalation | ownership checks + role gates | live 403s |
| Database | SQLi | binds + scans | payload suite green |
| Sessions | token theft | short expiry, no token in logs, 401 interceptor logout | code |
| Browser | XSS | React escaping + length caps + CSP | code |
| Capacity | double-accept race | DB re-check at accept | 409 tested |
| Audit | tampering | trigger block | spool ORA-20001 PASS |
| Secrets | commit leak | example-only placeholders | repo scan |

## Privacy & data handling
Synthetic demo data only (Faker-style seeds, no real PII). Collected: email, name, prefs, slots, meetings, goals, ratings. Access: own data + counterpart names; aggregates for coordinator. No passwords/hashes/tokens in responses or logs. Retention: demo DB, reset by re-running schema. See TEST-RESULTS for `npm audit` (3 moderate, unreachable uuid path, documented in SECURITY-REPORT.md).
