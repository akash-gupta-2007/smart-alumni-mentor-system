-- =====================================================================
-- MentorSetu (BIT-05) — Oracle schema for SQL*Plus. Run as SYSTEM:
--   sqlplus system/admin@//localhost:1521/XEPDB1 @db/oracle_schema.sql
-- Creates least-privilege app user MENTOR_APP (never run the app as SYSTEM).
-- Tables live in MENTOR_APP schema; app gets DML-only grants (no DDL).
-- =====================================================================
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK
SET DEFINE OFF
PROMPT === MentorSetu: creating app user (least privilege) ===

BEGIN
  EXECUTE IMMEDIATE 'CREATE USER mentor_app IDENTIFIED BY "Mentor_App_2026_Strong!"';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -1920 THEN RAISE; END IF; END;
/
ALTER USER mentor_app QUOTA UNLIMITED ON USERS;
GRANT CREATE SESSION TO mentor_app;

PROMPT === tables (MENTOR_APP schema) ===
PROMPT --- idempotent re-run: drop old objects first (missing = skipped) ---
BEGIN EXECUTE IMMEDIATE 'DROP VIEW mentor_app.v_mentor_load'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP PACKAGE mentor_app.mentor_sec'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -4043 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE mentor_app.login_attempts CASCADE CONSTRAINTS PURGE'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE mentor_app.audit_logs CASCADE CONSTRAINTS PURGE'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE mentor_app.feedback CASCADE CONSTRAINTS PURGE'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE mentor_app.goals CASCADE CONSTRAINTS PURGE'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE mentor_app.meeting_logs CASCADE CONSTRAINTS PURGE'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE mentor_app.meetings CASCADE CONSTRAINTS PURGE'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE mentor_app.matches CASCADE CONSTRAINTS PURGE'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE mentor_app.mentorship_requests CASCADE CONSTRAINTS PURGE'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE mentor_app.availability_slots CASCADE CONSTRAINTS PURGE'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE mentor_app.alumni_profiles CASCADE CONSTRAINTS PURGE'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE mentor_app.student_profiles CASCADE CONSTRAINTS PURGE'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE mentor_app.users CASCADE CONSTRAINTS PURGE'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;
/


CREATE TABLE mentor_app.users (
  id            CHAR(36) PRIMARY KEY,
  email         VARCHAR2(191) NOT NULL UNIQUE,
  password_hash VARCHAR2(255) NOT NULL,
  role          VARCHAR2(20) NOT NULL CHECK (role IN ('student','alumni','coordinator','admin')),
  full_name     VARCHAR2(120) NOT NULL,
  languages     CLOB NOT NULL CHECK (languages IS JSON),
  consent_given NUMBER(1) DEFAULT 0 NOT NULL CHECK (consent_given IN (0,1)),
  is_active     NUMBER(1) DEFAULT 1 NOT NULL CHECK (is_active IN (0,1)),
  created_at    TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at    TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT chk_email_fmt CHECK (REGEXP_LIKE(email, '^[^@]+@[^@]+\.[^@]+$'))
);
CREATE INDEX mentor_app.idx_users_role ON mentor_app.users(role, is_active);

CREATE TABLE mentor_app.student_profiles (
  user_id          CHAR(36) PRIMARY KEY REFERENCES mentor_app.users(id) ON DELETE CASCADE,
  enrollment_no    VARCHAR2(40) NOT NULL UNIQUE,
  department       VARCHAR2(80) NOT NULL,
  study_year       NUMBER(1) NOT NULL CHECK (study_year BETWEEN 1 AND 5),
  goals            CLOB NOT NULL CHECK (goals IS JSON),
  domain_interests CLOB NOT NULL CHECK (domain_interests IS JSON),
  bio              VARCHAR2(500)
);

CREATE TABLE mentor_app.alumni_profiles (
  user_id        CHAR(36) PRIMARY KEY REFERENCES mentor_app.users(id) ON DELETE CASCADE,
  graduation_year NUMBER(4) NOT NULL,
  company        VARCHAR2(120),
  designation    VARCHAR2(120),
  expertise_tags CLOB NOT NULL CHECK (expertise_tags IS JSON),
  years_exp      NUMBER(2) DEFAULT 1 NOT NULL CHECK (years_exp BETWEEN 0 AND 50),
  max_mentees    NUMBER(2) DEFAULT 5 NOT NULL CHECK (max_mentees BETWEEN 1 AND 20),
  bio            VARCHAR2(500),
  linkedin_url   VARCHAR2(255)
);

CREATE TABLE mentor_app.availability_slots (
  id             CHAR(36) PRIMARY KEY,
  alumni_user_id CHAR(36) NOT NULL REFERENCES mentor_app.users(id) ON DELETE CASCADE,
  day_of_week    NUMBER(1) NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time     VARCHAR2(5) NOT NULL CHECK (REGEXP_LIKE(start_time, '^[0-2][0-9]:[0-5][0-9]$')),
  end_time       VARCHAR2(5) NOT NULL CHECK (REGEXP_LIKE(end_time, '^[0-2][0-9]:[0-5][0-9]$')),
  timezone       VARCHAR2(40) DEFAULT 'Asia/Kolkata' NOT NULL,
  is_blocked     NUMBER(1) DEFAULT 0 NOT NULL CHECK (is_blocked IN (0,1)),
  valid_from     DATE,
  valid_to       DATE,
  created_at     TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT chk_slot_time CHECK (end_time > start_time)
);
CREATE INDEX mentor_app.idx_slots_alumni ON mentor_app.availability_slots(alumni_user_id, day_of_week);

CREATE TABLE mentor_app.mentorship_requests (
  id              CHAR(36) PRIMARY KEY,
  student_user_id CHAR(36) NOT NULL REFERENCES mentor_app.users(id) ON DELETE CASCADE,
  title           VARCHAR2(150) NOT NULL,
  goal_type       VARCHAR2(20) NOT NULL CHECK (goal_type IN ('placement','higher_studies','startup','skill','research')),
  domain          VARCHAR2(80) NOT NULL,
  language        VARCHAR2(30) DEFAULT 'English' NOT NULL,
  description     VARCHAR2(1000),
  status          VARCHAR2(20) DEFAULT 'open' NOT NULL CHECK (status IN ('open','matched','closed','cancelled')),
  created_at      TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
);
CREATE INDEX mentor_app.idx_req_status ON mentor_app.mentorship_requests(status);
CREATE INDEX mentor_app.idx_req_student ON mentor_app.mentorship_requests(student_user_id);

CREATE TABLE mentor_app.matches (
  id              CHAR(36) PRIMARY KEY,
  request_id      CHAR(36) NOT NULL REFERENCES mentor_app.mentorship_requests(id) ON DELETE CASCADE,
  alumni_user_id  CHAR(36) NOT NULL REFERENCES mentor_app.users(id) ON DELETE CASCADE,
  student_user_id CHAR(36) NOT NULL REFERENCES mentor_app.users(id) ON DELETE CASCADE,
  score           NUMBER(5,2) NOT NULL CHECK (score BETWEEN 0 AND 100),
  score_breakdown CLOB NOT NULL CHECK (score_breakdown IS JSON),
  reasons         CLOB NOT NULL CHECK (reasons IS JSON),
  status          VARCHAR2(20) DEFAULT 'suggested' NOT NULL
                  CHECK (status IN ('suggested','requested','accepted','declined','waitlisted','completed')),
  created_at      TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  decided_at      TIMESTAMP,
  CONSTRAINT uq_req_alumni UNIQUE (request_id, alumni_user_id)
);
CREATE INDEX mentor_app.idx_match_status ON mentor_app.matches(status);
CREATE INDEX mentor_app.idx_match_alumni ON mentor_app.matches(alumni_user_id, status);

CREATE TABLE mentor_app.meetings (
  id              CHAR(36) PRIMARY KEY,
  match_id        CHAR(36) NOT NULL REFERENCES mentor_app.matches(id) ON DELETE CASCADE,
  scheduled_start TIMESTAMP NOT NULL,
  scheduled_end   TIMESTAMP NOT NULL,
  meet_mode       VARCHAR2(10) DEFAULT 'online' NOT NULL CHECK (meet_mode IN ('online','offline')),
  meet_link       VARCHAR2(500),
  status          VARCHAR2(20) DEFAULT 'scheduled' NOT NULL CHECK (status IN ('scheduled','completed','no_show','cancelled')),
  created_by      CHAR(36) NOT NULL REFERENCES mentor_app.users(id),
  created_at      TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT chk_meet_time CHECK (scheduled_end > scheduled_start)
);
CREATE INDEX mentor_app.idx_meet_match ON mentor_app.meetings(match_id);
CREATE INDEX mentor_app.idx_meet_time ON mentor_app.meetings(scheduled_start);

CREATE TABLE mentor_app.meeting_logs (
  id          CHAR(36) PRIMARY KEY,
  meeting_id  CHAR(36) NOT NULL UNIQUE REFERENCES mentor_app.meetings(id) ON DELETE CASCADE,
  notes       VARCHAR2(2000) NOT NULL,
  outcomes    VARCHAR2(1000),
  duration_min NUMBER(3) DEFAULT 30 NOT NULL CHECK (duration_min BETWEEN 5 AND 300),
  created_at  TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
);

CREATE TABLE mentor_app.goals (
  id              CHAR(36) PRIMARY KEY,
  student_user_id CHAR(36) NOT NULL REFERENCES mentor_app.users(id) ON DELETE CASCADE,
  match_id        CHAR(36) REFERENCES mentor_app.matches(id) ON DELETE SET NULL,
  title           VARCHAR2(150) NOT NULL,
  target_date     DATE NOT NULL,
  status          VARCHAR2(20) DEFAULT 'not_started' NOT NULL CHECK (status IN ('not_started','in_progress','done','dropped')),
  progress_pct    NUMBER(3) DEFAULT 0 NOT NULL CHECK (progress_pct BETWEEN 0 AND 100),
  created_at      TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
);
CREATE INDEX mentor_app.idx_goal_student ON mentor_app.goals(student_user_id, status);

CREATE TABLE mentor_app.feedback (
  id           CHAR(36) PRIMARY KEY,
  meeting_id   CHAR(36) NOT NULL REFERENCES mentor_app.meetings(id) ON DELETE CASCADE,
  from_user_id CHAR(36) NOT NULL REFERENCES mentor_app.users(id) ON DELETE CASCADE,
  to_user_id   CHAR(36) NOT NULL REFERENCES mentor_app.users(id) ON DELETE CASCADE,
  rating       NUMBER(1) NOT NULL CHECK (rating BETWEEN 1 AND 5),
  tags         CLOB CHECK (tags IS NULL OR tags IS JSON),
  comment_text VARCHAR2(1000),
  is_anonymous NUMBER(1) DEFAULT 0 NOT NULL CHECK (is_anonymous IN (0,1)),
  created_at   TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT uq_meet_from UNIQUE (meeting_id, from_user_id),
  CONSTRAINT chk_no_self CHECK (from_user_id <> to_user_id)
);

CREATE TABLE mentor_app.audit_logs (
  id            NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_user_id CHAR(36) REFERENCES mentor_app.users(id) ON DELETE SET NULL,
  action        VARCHAR2(80) NOT NULL,
  entity        VARCHAR2(40) NOT NULL,
  entity_id     VARCHAR2(60),
  meta          CLOB CHECK (meta IS NULL OR meta IS JSON),
  ip            VARCHAR2(45),
  created_at    TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
);
CREATE INDEX mentor_app.idx_audit_actor ON mentor_app.audit_logs(actor_user_id);
CREATE INDEX mentor_app.idx_audit_action ON mentor_app.audit_logs(action);
CREATE INDEX mentor_app.idx_audit_time ON mentor_app.audit_logs(created_at);

-- Brute-force shield: every failed login is recorded here
CREATE TABLE mentor_app.login_attempts (
  id           NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email        VARCHAR2(191) NOT NULL,
  ip           VARCHAR2(45),
  success      NUMBER(1) NOT NULL CHECK (success IN (0,1)),
  attempted_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
);
CREATE INDEX mentor_app.idx_attempts_email ON mentor_app.login_attempts(email, attempted_at);

PROMPT === PL/SQL security package ===
CREATE OR REPLACE PACKAGE mentor_app.mentor_sec AS
  FUNCTION fn_failed_count(p_email IN VARCHAR2) RETURN NUMBER; -- fails in last 15 min
  FUNCTION fn_is_locked(p_email IN VARCHAR2) RETURN NUMBER;    -- 1 = locked (>=5 fails)
  FUNCTION fn_capacity_ok(p_alumni IN CHAR) RETURN NUMBER;     -- 1 = has bandwidth
  PROCEDURE proc_reg_fail(p_email IN VARCHAR2, p_ip IN VARCHAR2);
  PROCEDURE proc_reg_success(p_email IN VARCHAR2);
  PROCEDURE proc_audit(p_actor IN CHAR, p_action IN VARCHAR2, p_entity IN VARCHAR2,
                       p_eid IN VARCHAR2, p_meta IN CLOB, p_ip IN VARCHAR2);
END mentor_sec;
/
CREATE OR REPLACE PACKAGE BODY mentor_app.mentor_sec AS
  FUNCTION fn_failed_count(p_email IN VARCHAR2) RETURN NUMBER IS
    v_n NUMBER := 0;
  BEGIN
    SELECT COUNT(*) INTO v_n FROM mentor_app.login_attempts
     WHERE email = p_email AND success = 0 AND attempted_at > SYSTIMESTAMP - INTERVAL '15' MINUTE;
    RETURN v_n;
  END;
  FUNCTION fn_is_locked(p_email IN VARCHAR2) RETURN NUMBER IS
  BEGIN
    IF fn_failed_count(p_email) >= 5 THEN RETURN 1; ELSE RETURN 0; END IF;
  END;
  FUNCTION fn_capacity_ok(p_alumni IN CHAR) RETURN NUMBER IS
    v_active NUMBER := 0; v_max NUMBER := 5;
  BEGIN
    SELECT NVL(max_mentees, 5) INTO v_max FROM mentor_app.alumni_profiles WHERE user_id = p_alumni;
    SELECT COUNT(*) INTO v_active FROM mentor_app.matches
     WHERE alumni_user_id = p_alumni AND status IN ('accepted','requested');
    IF v_active < v_max THEN RETURN 1; ELSE RETURN 0; END IF;
  EXCEPTION WHEN NO_DATA_FOUND THEN RETURN 0;
  END;
  PROCEDURE proc_reg_fail(p_email IN VARCHAR2, p_ip IN VARCHAR2) IS
  BEGIN
    INSERT INTO mentor_app.login_attempts(email, ip, success) VALUES (p_email, p_ip, 0);
    COMMIT;
  END;
  PROCEDURE proc_reg_success(p_email IN VARCHAR2) IS
  BEGIN
    DELETE FROM mentor_app.login_attempts WHERE email = p_email;
    COMMIT;
  END;
  PROCEDURE proc_audit(p_actor IN CHAR, p_action IN VARCHAR2, p_entity IN VARCHAR2,
                       p_eid IN VARCHAR2, p_meta IN CLOB, p_ip IN VARCHAR2) IS
    PRAGMA AUTONOMOUS_TRANSACTION; -- audit persists even if caller rolls back
  BEGIN
    INSERT INTO mentor_app.audit_logs(actor_user_id, action, entity, entity_id, meta, ip)
    VALUES (p_actor, p_action, p_entity, SUBSTR(p_eid,1,60), p_meta, p_ip);
    COMMIT;
  END;
END mentor_sec;
/

PROMPT === hardening triggers ===
-- auto-touch updated_at
CREATE OR REPLACE TRIGGER mentor_app.trg_users_touch
BEFORE UPDATE ON mentor_app.users FOR EACH ROW
BEGIN :NEW.updated_at := SYSTIMESTAMP; END;
/
-- audit trail is append-only: no UPDATE / DELETE ever
CREATE OR REPLACE TRIGGER mentor_app.trg_audit_readonly
BEFORE UPDATE OR DELETE ON mentor_app.audit_logs FOR EACH ROW
BEGIN RAISE_APPLICATION_ERROR(-20001, 'audit_logs is append-only'); END;
/

PROMPT === capacity view + least-privilege grants ===
CREATE OR REPLACE VIEW mentor_app.v_mentor_load AS
SELECT a.user_id AS alumni_id, u.full_name,
       a.max_mentees AS max_mentees,
       SUM(CASE WHEN m.status IN ('accepted','requested') THEN 1 ELSE 0 END) AS active_mentees,
       ROUND(SUM(CASE WHEN m.status IN ('accepted','requested') THEN 1 ELSE 0 END) / a.max_mentees * 100, 1) AS load_pct
  FROM mentor_app.alumni_profiles a
  JOIN mentor_app.users u ON u.id = a.user_id
  LEFT JOIN mentor_app.matches m ON m.alumni_user_id = a.user_id
 GROUP BY a.user_id, u.full_name, a.max_mentees;

GRANT SELECT, INSERT, UPDATE, DELETE ON mentor_app.users TO mentor_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON mentor_app.student_profiles TO mentor_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON mentor_app.alumni_profiles TO mentor_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON mentor_app.availability_slots TO mentor_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON mentor_app.mentorship_requests TO mentor_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON mentor_app.matches TO mentor_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON mentor_app.meetings TO mentor_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON mentor_app.meeting_logs TO mentor_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON mentor_app.goals TO mentor_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON mentor_app.feedback TO mentor_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON mentor_app.audit_logs TO mentor_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON mentor_app.login_attempts TO mentor_app;
GRANT SELECT ON mentor_app.v_mentor_load TO mentor_app;
GRANT EXECUTE ON mentor_app.mentor_sec TO mentor_app;
-- NOTE: mentor_app has NO create/drop/alter rights and must never be SYSTEM.
-- Lock down further any time with: REVOKE RESOURCE FROM mentor_app;

PROMPT === MentorSetu Oracle setup complete ===
COMMIT;
EXIT;
