-- MentorSetu SQL*Plus verification queries (run as system, read-only except where noted).
--   sqlplus system/admin@//localhost:1521/XEPDB1 @db/verify_queries.sql
SET DEFINE OFF
ALTER SESSION SET CURRENT_SCHEMA = mentor_app;
PROMPT --- 1. table inventory ---
SELECT table_name, num_rows FROM user_tables ORDER BY 1;
PROMPT --- 2. live mentor load (capacity balance) ---
SELECT * FROM v_mentor_load ORDER BY load_pct DESC FETCH FIRST 10 ROWS ONLY;
PROMPT --- 3. open requests awaiting matches ---
SELECT id, title, goal_type, domain, status FROM mentorship_requests WHERE status = 'open' FETCH FIRST 10 ROWS ONLY;
PROMPT --- 4. recent audit trail ---
SELECT id, action, entity, created_at FROM audit_logs ORDER BY id DESC FETCH FIRST 15 ROWS ONLY;
PROMPT --- 5. failed-login shield state ---
SELECT email, COUNT(*) AS fails_15min FROM login_attempts
 WHERE success = 0 AND attempted_at > SYSTIMESTAMP - INTERVAL '15' MINUTE GROUP BY email;
PROMPT --- 6. satisfaction snapshot ---
SELECT ROUND(AVG(rating),2) AS avg_rating, COUNT(*) AS n FROM feedback;
EXIT;
