# Failure / Robustness Tests (observed)

| # | Scenario | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Mentor at capacity, student requests | waitlist, 409 on accept-race | waitlisted + `fn_capacity_ok` 409 | PASS |
| 2 | No suitable mentor (rare domain/language) | low scores, honest reasons | shown w/ language-gap reasons | PASS |
| 3 | No availability overlap | 409 OUTSIDE_AVAILABILITY | 409 + code | PASS |
| 4 | Duplicate match request | 409 | 409 with existing id | PASS |
| 5 | Cross-role/cross-user access | 403/401 | 403s live-verified | PASS |
| 6 | Invalid input (bad email, weak pw, rating 9, bad UUID) | 400 | 400 + messages | PASS |
| 7 | Oracle stopped | /health db:down, safe 500s | code path reviewed (pool catch) | PARTIAL (stop-XE drill documented in ADMIN-GUIDE) |
| 8 | 14-request burst | no errors | <1s total | PASS |
| 9 | Audit UPDATE | ORA-20001 | spool PASS | PASS |
| 10 | Expired JWT | 401 → login redirect | interceptor added; verify by waiting 12h or forging token | NOT VERIFIED (manual step documented) |
