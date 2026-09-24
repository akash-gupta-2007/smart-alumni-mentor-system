-- MentorSetu constraint + security evidence (safe to re-run; all writes rolled back).
--   sqlplus system/admin@//localhost:1521/XEPDB1 @evidence/database/verify.sql
SET DEFINE OFF
SET SERVEROUTPUT ON
SPOOL evidence/database/verify-output.txt
ALTER SESSION SET CURRENT_SCHEMA = mentor_app;
PROMPT === row counts ===
SELECT (SELECT COUNT(*) FROM users) AS users_n,
       (SELECT COUNT(*) FROM alumni_profiles) AS alumni_n,
       (SELECT COUNT(*) FROM student_profiles) AS students_n,
       (SELECT COUNT(*) FROM availability_slots) AS slots_n FROM DUAL;
PROMPT === capacity gate function (1 = has bandwidth) ===
SELECT mentor_sec.fn_capacity_ok('22222222-2222-4222-8222-222222222222') AS alumni1_ok,
       mentor_sec.fn_is_locked('nobody@example.com') AS stranger_locked FROM DUAL;
DECLARE
  PROCEDURE check_dup_email IS
  BEGIN
    INSERT INTO users(id, email, password_hash, role, full_name, languages, consent_given)
    VALUES ('99999999-9999-4999-8999-999999999999', 'student1@college.edu', 'x', 'student', 'Dup', '["English"]', 1);
    DBMS_OUTPUT.PUT_LINE('FAIL: duplicate email accepted');
  EXCEPTION WHEN DUP_VAL_ON_INDEX THEN DBMS_OUTPUT.PUT_LINE('PASS: duplicate email rejected (UNIQUE)');
  END;
  PROCEDURE check_bad_rating IS
  BEGIN
    INSERT INTO feedback(id, meeting_id, from_user_id, to_user_id, rating)
    VALUES ('99999999-9999-4999-8999-999999999998', '00000000-0000-4000-8000-000000000000',
            '44444444-4444-4444-8444-444444444444', '22222222-2222-4222-8222-222222222222', 9);
    DBMS_OUTPUT.PUT_LINE('FAIL: rating 9 accepted');
  EXCEPTION WHEN OTHERS THEN
    IF SQLCODE IN (-2290, -2291) THEN DBMS_OUTPUT.PUT_LINE('PASS: rating 9 rejected (CHECK/FK, ORA-' || ABS(SQLCODE) || ')');
    ELSE DBMS_OUTPUT.PUT_LINE('FAIL: unexpected ORA-' || ABS(SQLCODE)); END IF;
  END;
  PROCEDURE check_audit_immutable IS
  BEGIN
    UPDATE audit_logs SET action = 'HACKED' WHERE ROWNUM = 1;
    DBMS_OUTPUT.PUT_LINE('FAIL: audit row updated');
  EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -20001 THEN DBMS_OUTPUT.PUT_LINE('PASS: audit append-only enforced (ORA-20001)');
    ELSE DBMS_OUTPUT.PUT_LINE('FAIL: unexpected ORA-' || ABS(SQLCODE)); END IF;
  END;
  PROCEDURE check_fk IS
  BEGIN
    INSERT INTO matches(id, request_id, alumni_user_id, student_user_id, score, score_breakdown, reasons, status)
    VALUES ('99999999-9999-4999-8999-999999999997', '00000000-0000-4000-8000-000000000000',
            '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002',
            50, '{}', '[]', 'suggested');
    DBMS_OUTPUT.PUT_LINE('FAIL: orphan match accepted');
  EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -2291 THEN DBMS_OUTPUT.PUT_LINE('PASS: orphan match rejected (FK, ORA-02291)');
    ELSE DBMS_OUTPUT.PUT_LINE('FAIL: unexpected ORA-' || ABS(SQLCODE)); END IF;
  END;
BEGIN
  check_dup_email; check_bad_rating; check_audit_immutable; check_fk;
  ROLLBACK;
END;
/
SPOOL OFF
PROMPT === evidence saved to evidence/database/verify-output.txt ===
EXIT;
