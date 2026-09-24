# User Guide / Admin Guide / Troubleshooting — pointers

Full guides at repo root (kept there for evaluators): USER-GUIDE.md (student/alumni journeys), ADMIN-GUIDE.md (coordinator KPIs + SQL*Plus ops + lockout clear + monitoring).

## Troubleshooting (quick)
| Symptom | Cause → Fix |
|---|---|
| Workspace shows 🔴 offline | API window closed → rerun `start-local.bat`; check `:4000/health` |
| Login 401 | wrong password or lockout (5 fails/15min) → wait or coordinator clears `login_attempts` |
| Bounced to /login mid-use | JWT expired (12h) → log in again (401 interceptor) |
| Suggest empty/low scores | rare domain + few tags → broaden domain, add tags/slots |
| 409 on accept | mentor filled up meanwhile → student stays waitlisted |
| 409 OVERLAP/OUTSIDE | double-book or wrong day → pick a listed slot day |
| ORA-12541 | Oracle listener down → start OracleServiceXE |
| Port in use | old windows alive → `stop-local.bat` first |
| Vite blank page | `node_modules` missing → `npm install` in `frontend/` |
