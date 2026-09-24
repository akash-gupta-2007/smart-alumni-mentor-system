# Final Report — MentorSetu (BIT-05), T.Y. B.Sc. IT Capstone

## Ch 1. Introduction
Alumni cells match students to mentors manually (sheets/WhatsApp). It breaks on five axes at once: domain, goals, language, availability, capacity. We built a working marketplace that scores all five and explains itself.

## Ch 2. Industry problem & requirements
Personas: student (needs guidance + proof), alumni (limited hours), coordinator (needs oversight). Pain: popular mentors drown, niche students get nobody, no record of why a match was made. Success = satisfaction ≥4, zero cap violations, conflicts <5%, RBAC 100%.

## Ch 3. Baseline (manual process)
Greedy domain-only matching, first-come-first-served. Measured on our data: 71.4% domain hit but 4 capacity violations in 14 requests — popular mentors overloaded, no explanations, no audit.

## Ch 4. Proposed system
Explainable Rule-Based Matching and Recommendation Engine (rule-based, NOT ML): score = .40·domain(Jaccard) + .25·goal + .15·language + .20·availability, minus 0.3·load penalty; full mentors waitlist with reasons. Backend gates capacity twice (request + accept).

## Ch 5. Architecture
React/Vite/Three.js UI → Express API (JWT/RBAC/Joi/helmet/rate-limit/prom-client) → Oracle XE via bind-only oracledb as least-privilege `mentor_app`. Full diagrams: ARCHITECTURE.md.

## Ch 6. Database
12 tables, CHECK/UNIQUE/FK everywhere, `mentor_sec` PL/SQL (lockout, capacity gate, autonomous audit), append-only audit trigger, `v_mentor_load` view. Scripts run in SQL*Plus as system; app never uses SYSTEM. See DATA-DICTIONARY.md, db/.

## Ch 7. Implementation
Matching service (pure, tested), scheduling guard (409 codes), state machines (workflow.js), 6-tab workspace, 3D landing. Every button calls a real API — no fakes (verified in workout).

## Ch 8. Security & privacy
Bind-only SQL + static scan, bcrypt-12 + complexity + lockout, RBAC + ownership, CSP/HSTS, no hashes/secrets in responses or repo. Threat model + real `npm audit` (3 moderate, unreachable path) in SECURITY-REPORT.md.

## Ch 9. Testing
14/14 automated; live RBAC/transition/conflict workout; SQL*Plus spool 4/4 PASS; 8 failure experiments observed. TEST-REPORT.md. Nothing fabricated — all outputs saved.

## Ch 10. Evaluation
Baseline vs engine table (EVALUATION-REPORT.md): relevance ties 71.4%, violations 4→0. Privacy all-pass. Usability study pending (limitation).

## Ch 11. Innovation vs baseline
Innovation is engineering maturity: explainability payload + capacity gates + audit + telemetry + container-ready stateless API. Value proven where baseline fails: overloads and opacity.

## Ch 12. Results & discussion
All functional gates green; relevance needs richer data; capacity story is the proven win.

## Ch 13. Limitations & future scope
No real-user SUS yet; no notifications; no password-reset flow; single-machine perf; skill tags are JSON not normalized tables (documented trade-off).

## Ch 14. Conclusion
A stakeholder-testable prototype covering intake→match→meet→goal→feedback→oversight→audit→monitoring, on Oracle + SQL*Plus, with measured evidence. Status: 🟡 near-complete (pending usability study + CI first green run).

## References / Annexures
Code, `evidence/database/verify-output.txt`, `openapi.yaml`, USER/ADMIN-GUIDE, DEMO-FLOW, release notes. Demo accounts: student1@college.edu, alumni1@example.com, coordinator@college.edu / Password123!.
