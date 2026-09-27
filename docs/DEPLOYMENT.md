# Deployment — MentorSetu

## Local (supported, tested)
1. Oracle XE running (`system/admin@//localhost:1521/XEPDB1`).
2. `database/setup.sql` order via SQL*Plus (schema → seed → migrate_02..06).
3. `backend/`: copy `.env.example` → `.env`, set `DB_PASSWORD` to match DB user + 32+ char `JWT_SECRET`; `npm install`; `npm test`; `node src/server.js` (:4000).
4. `frontend/`: `npm install`; `npm run dev` (:5173) or `npm run build` + serve `dist/`. Or double-click `start-local.bat`.

## Containers (files ready, NOT VERIFIED here)
`docker-compose.yml` builds `backend/Dockerfile` + `frontend/Dockerfile`; Oracle stays host-local (`ORACLE_CONNECT=host.docker.internal/XEPDB1`, `DB_PASSWORD` + `JWT_SECRET` required env). Run `docker compose up --build` on a Docker host; point CORS at the web origin.

## CI (file ready, NOT VERIFIED)
`.github/workflows/ci.yml`: backend install/test/audit, frontend install/build/audit, docker builds. Push to GitHub for the first green run; no secrets in the file.
