# Data Dictionary — MentorSetu (Oracle 21c XE, schema MENTOR_APP)

| Table | Column | Oracle type | Purpose | Constraint |
|---|---|---|---|---|
| users | id | CHAR(36) | UUID PK | PK |
| users | email | VARCHAR2(191) | login | UNIQUE, regex CHECK |
| users | password_hash | VARCHAR2(255) | bcrypt-12 hash | NOT NULL (never selected by API) |
| users | role | VARCHAR2(20) | student/alumni/coordinator/admin | CHECK IN list |
| users | full_name | VARCHAR2(120) | display name | NOT NULL |
| users | languages | CLOB | e.g. ["English","Hindi"] | IS JSON |
| users | consent_given/is_active | NUMBER(1) | consent + soft-delete flag | 0/1 |
| users | created_at/updated_at | TIMESTAMP | audit times | updated_at via trigger |
| student_profiles | user_id | CHAR(36) | 1:1 to users | PK+FK cascade |
| student_profiles | enrollment_no | VARCHAR2(40) | college roll | UNIQUE |
| student_profiles | study_year | NUMBER(1) | 1–5 | CHECK |
| student_profiles | goals/domain_interests | CLOB | JSON prefs | IS JSON |
| alumni_profiles | user_id | CHAR(36) | 1:1 to users | PK+FK cascade |
| alumni_profiles | expertise_tags | CLOB | JSON skill tags | IS JSON |
| alumni_profiles | years_exp | NUMBER(2) | 0–50 | CHECK |
| alumni_profiles | max_mentees | NUMBER(2) | capacity cap 1–20 | CHECK |
| availability_slots | id/alumni_user_id | CHAR(36) | slot + owner FK | PK, FK cascade, idx(alumni,day) |
| availability_slots | day_of_week | NUMBER(1) | 0=Sun..6=Sat | CHECK |
| availability_slots | start/end_time | VARCHAR2(5) | HH:MM | regex + end>start CHECK |
| mentorship_requests | id/student_user_id | CHAR(36) | request + author FK | PK, FK cascade |
| mentorship_requests | goal_type/status | VARCHAR2(20) | enums | CHECK IN lists |
| matches | id/request/alumni/student | CHAR(36) | match edges | PK, 3×FK, UNIQUE(request,alumni) |
| matches | score | NUMBER(5,2) | 0–100 explainable | CHECK |
| matches | score_breakdown/reasons | CLOB | JSON weights + why[] | IS JSON |
| matches | status/decided_at | VARCHAR2(20)/TIMESTAMP | state machine | CHECK IN 6 states |
| meetings | scheduled_start/end | TIMESTAMP | slot | end>start CHECK |
| meetings | meet_mode/status | VARCHAR2 | online/offline; 4 states | CHECK IN lists |
| meeting_logs | meeting_id | CHAR(36) | 1:1 log | UNIQUE+FK |
| meeting_logs | duration_min | NUMBER(3) | 5–300 | CHECK |
| goals | target_date/status/progress_pct | DATE/VARCHAR2(20)/NUMBER(3) | tracker | CHECKs |
| feedback | rating/comm/relevance | NUMBER(1) | 1–5 each | CHECK |
| feedback | (meeting,from) | — | one rating per person | UNIQUE |
| feedback | from≠to | — | no self-rating | CHECK |
| audit_logs | id | NUMBER IDENTITY | append-only PK | trigger blocks UPDATE/DELETE |
| audit_logs | action/entity/meta/ip | VARCHAR2/CLOB | who-did-what | meta IS NULL OR IS JSON |
| login_attempts | email/success/attempted_at | VARCHAR2/NUMBER(1)/TIMESTAMP | brute-force shield | idx(email,time) |

Views/packages: `v_mentor_load` (live capacity %), `mentor_sec` (fn_is_locked, fn_capacity_ok, proc_reg_fail/success, proc_audit).
