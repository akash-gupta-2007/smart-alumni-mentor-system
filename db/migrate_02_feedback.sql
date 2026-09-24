-- Migration 02: richer feedback survey (communication + relevance ratings, optional).
--   sqlplus system/admin@//localhost:1521/XEPDB1 @db/migrate_02_feedback.sql
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK
SET DEFINE OFF
PROMPT === feedback ratings migration ===
BEGIN EXECUTE IMMEDIATE 'ALTER TABLE mentor_app.feedback ADD (communication_rating NUMBER(1) CHECK (communication_rating BETWEEN 1 AND 5))';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -1430 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'ALTER TABLE mentor_app.feedback ADD (relevance_rating NUMBER(1) CHECK (relevance_rating BETWEEN 1 AND 5))';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -1430 THEN RAISE; END IF; END;
/
PROMPT === migration 02 complete ===
COMMIT;
EXIT;
