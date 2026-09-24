-- Migration 03: in-app notifications (poll-based bell, no mailer needed).
--   sqlplus system/admin@//localhost:1521/XEPDB1 @db/migrate_03_notifications.sql
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK
SET DEFINE OFF
PROMPT === notifications table ===
BEGIN EXECUTE IMMEDIATE '
CREATE TABLE mentor_app.notifications (
  id          CHAR(36) PRIMARY KEY,
  user_id     CHAR(36) NOT NULL REFERENCES mentor_app.users(id) ON DELETE CASCADE,
  kind        VARCHAR2(40) NOT NULL,
  title       VARCHAR2(200) NOT NULL,
  body        VARCHAR2(1000),
  link        VARCHAR2(200),
  is_read     NUMBER(1) DEFAULT 0 NOT NULL CHECK (is_read IN (0,1)),
  created_at  TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
)';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'CREATE INDEX mentor_app.idx_notif_user ON mentor_app.notifications(user_id, is_read, created_at)';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF; END;
/
GRANT SELECT, INSERT, UPDATE, DELETE ON mentor_app.notifications TO mentor_app;
PROMPT === migration 03 complete ===
COMMIT;
EXIT;
