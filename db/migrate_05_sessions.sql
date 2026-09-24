-- Migration 05: server-side sessions (refresh-token rotation) for SaaS-grade auth.
--   sqlplus system/admin@//localhost:1521/XEPDB1 @db/migrate_05_sessions.sql
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK
SET DEFINE OFF
PROMPT === refresh_tokens table ===
BEGIN EXECUTE IMMEDIATE '
CREATE TABLE mentor_app.refresh_tokens (
  id          CHAR(36) PRIMARY KEY,
  user_id     CHAR(36) NOT NULL REFERENCES mentor_app.users(id) ON DELETE CASCADE,
  token_hash  VARCHAR2(255) NOT NULL,
  expires_at  TIMESTAMP NOT NULL,
  revoked     NUMBER(1) DEFAULT 0 NOT NULL CHECK (revoked IN (0,1)),
  created_at  TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
)';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'CREATE INDEX mentor_app.idx_refresh_user ON mentor_app.refresh_tokens(user_id, revoked)';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF; END;
/
GRANT SELECT, INSERT, UPDATE, DELETE ON mentor_app.refresh_tokens TO mentor_app;
PROMPT === migration 05 complete ===
COMMIT;
EXIT;
