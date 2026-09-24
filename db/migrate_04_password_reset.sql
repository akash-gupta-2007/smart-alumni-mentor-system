-- Migration 04: password-reset tokens (demo-mode: token returned by API, no SMTP needed).
--   sqlplus system/admin@//localhost:1521/XEPDB1 @db/migrate_04_password_reset.sql
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK
SET DEFINE OFF
PROMPT === password_resets table ===
BEGIN EXECUTE IMMEDIATE '
CREATE TABLE mentor_app.password_resets (
  id          CHAR(36) PRIMARY KEY,
  user_id     CHAR(36) NOT NULL REFERENCES mentor_app.users(id) ON DELETE CASCADE,
  token_hash  VARCHAR2(255) NOT NULL,
  expires_at  TIMESTAMP NOT NULL,
  used        NUMBER(1) DEFAULT 0 NOT NULL CHECK (used IN (0,1)),
  created_at  TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
)';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'CREATE INDEX mentor_app.idx_pwreset_user ON mentor_app.password_resets(user_id, used)';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF; END;
/
GRANT SELECT, INSERT, UPDATE, DELETE ON mentor_app.password_resets TO mentor_app;
PROMPT === migration 04 complete ===
COMMIT;
EXIT;
