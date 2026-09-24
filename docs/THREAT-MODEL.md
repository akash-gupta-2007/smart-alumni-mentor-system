# Threat Model (lightweight)

See SECURITY.md for the full table. Summary: credentials (lockout+limits+bcrypt), IDOR/BOLA (ownership+roles, live 403s), SQLi (binds+scans), XSS (escaping+caps+CSP), escalation (allow() gates), capacity gaming (DB re-check), audit tampering (ORA-20001), DoS (rate limits + 100kb cap; no WAF — limitation), fake profiles (college-email convention + coordinator review — limitation).
