# Privacy & Data Handling — MentorSetu

All records are synthetic demo data (seed + `npm run seed`). Never enter real student/alumni PII.

- Collected: account (email, name, languages), role profiles (goals, tags, bio, company, capacity), slots, requests, matches + scores, meetings + notes, goals, ratings.
- Why: each field directly serves matching, scheduling, progress, or oversight — nothing speculative.
- Who sees what: users see own data + counterpart names/scores; students cannot see others' requests (403); coordinator sees aggregates + audit metadata.
- Never stored/logged: plaintext passwords (bcrypt-12 only), JWTs, secrets, full DB errors.
- Retention/reset: demo Oracle XE; full reset = re-run `db/oracle_schema.sql` + seed. No backups retain PII because there is none.
- Limitation: no automated ID verification — fake profiles possible; coordinator oversight is the control.
