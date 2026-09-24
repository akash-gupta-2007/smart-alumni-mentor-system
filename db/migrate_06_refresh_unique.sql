-- Migration 06: unique refresh-token hashes + clean up pre-jti duplicates.
-- Same-second minted JWTs used to be byte-identical (same iat), which broke
-- rotation re-use detection. jti nonces fix new tokens; this clears the old rows
-- (one forced re-login) and prevents any future duplicate hash.
--   sqlplus system/admin@//localhost:1521/XEPDB1 @db/migrate_06_refresh_unique.sql
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK
SET DEFINE OFF
PROMPT === dedupe + unique index on refresh token hashes ===
DELETE FROM mentor_app.refresh_tokens;
BEGIN EXECUTE IMMEDIATE 'CREATE UNIQUE INDEX mentor_app.uq_refresh_hash ON mentor_app.refresh_tokens(token_hash)';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF; END;
/
PROMPT === migration 06 complete (all sessions revoked — users log in again) ===
COMMIT;
EXIT;
