-- =====================================================================
-- MentorSetu demo seed for SQL*Plus (synthetic, no real PII).
--   sqlplus system/admin@//localhost:1521/XEPDB1 @db/oracle_seed.sql
-- Password for every demo user: Password123!
-- (bcrypt hash is portable across databases.)
-- =====================================================================
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK
SET DEFINE OFF
ALTER SESSION SET CURRENT_SCHEMA = mentor_app;
PROMPT === seeding demo users ===

DECLARE
  c_hash CONSTANT VARCHAR2(255) := '$2a$12$tzgdQYZtvxOMjpNpNOySduieDgHqn/9BZcUpQy.VZfAKhq4y8kVIS';
  PROCEDURE mk_user(p_id CHAR, p_email VARCHAR2, p_role VARCHAR2, p_name VARCHAR2, p_lang VARCHAR2) IS
  BEGIN
    INSERT INTO users(id, email, password_hash, role, full_name, languages, consent_given)
    VALUES (p_id, p_email, c_hash, p_role, p_name, p_lang, 1);
  EXCEPTION WHEN DUP_VAL_ON_INDEX THEN NULL;
  END;
  PROCEDURE mk_alum(p_id CHAR, p_tags VARCHAR2, p_exp NUMBER, p_cap NUMBER) IS
  BEGIN
    INSERT INTO alumni_profiles(user_id, graduation_year, company, designation, expertise_tags, years_exp, max_mentees)
    VALUES (p_id, 2019, 'Demo Corp', 'Mentor', p_tags, p_exp, p_cap);
  EXCEPTION WHEN DUP_VAL_ON_INDEX THEN NULL;
  END;
BEGIN
  mk_user('11111111-1111-4111-8111-111111111111', 'coordinator@college.edu', 'coordinator', 'Capstone Coordinator', '["English"]');
  mk_user('22222222-2222-4222-8222-222222222222', 'alumni1@example.com', 'alumni', 'Priya Sharma', '["English","Hindi"]');
  mk_user('33333333-3333-4333-8333-333333333333', 'alumni2@example.com', 'alumni', 'Rahul Verma', '["English"]');
  mk_user('44444444-4444-4444-8444-444444444444', 'student1@college.edu', 'student', 'Aarav Patil', '["English","Marathi"]');
  mk_alum('22222222-2222-4222-8222-222222222222', '["DevOps","Docker","Kubernetes"]', 6, 5);
  mk_alum('33333333-3333-4333-8333-333333333333', '["AI/ML","Python"]', 4, 4);
  BEGIN
    INSERT INTO student_profiles(user_id, enrollment_no, department, study_year, goals, domain_interests)
    VALUES ('44444444-4444-4444-8444-444444444444', 'ENR2024001', 'IT', 3, '{"primary":"placement"}', '["DevOps"]');
  EXCEPTION WHEN DUP_VAL_ON_INDEX THEN NULL;
  END;
  FOR s IN (
    SELECT 'aa000001-0001-4001-8001-00000000000' || LEVEL AS sid, '22222222-2222-4222-8222-222222222222' AS aid,
           CASE MOD(LEVEL,3) WHEN 1 THEN 1 WHEN 2 THEN 3 ELSE 5 END AS d,
           CASE WHEN MOD(LEVEL,3)=0 THEN '11:00' ELSE '18:00' END AS st,
           CASE WHEN MOD(LEVEL,3)=0 THEN '13:00' ELSE '20:00' END AS et FROM DUAL CONNECT BY LEVEL <= 3
    UNION ALL
    SELECT 'bb000001-0001-4001-8001-00000000000' || LEVEL, '33333333-3333-4333-8333-333333333333',
           CASE WHEN MOD(LEVEL,2)=0 THEN 6 ELSE 1 END,
           CASE WHEN MOD(LEVEL,2)=0 THEN '10:00' ELSE '19:00' END,
           CASE WHEN MOD(LEVEL,2)=0 THEN '12:00' ELSE '21:00' END FROM DUAL CONNECT BY LEVEL <= 2) LOOP
    BEGIN
      INSERT INTO availability_slots(id, alumni_user_id, day_of_week, start_time, end_time)
      VALUES (s.sid, s.aid, s.d, s.st, s.et);
    EXCEPTION WHEN DUP_VAL_ON_INDEX THEN NULL;
    END;
  END LOOP;
END;
/
PROMPT === seeded: coordinator@college.edu / alumni1@example.com / student1@college.edu (Password123!) ===
COMMIT;
EXIT;
