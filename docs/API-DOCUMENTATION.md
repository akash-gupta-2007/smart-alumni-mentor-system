# API Documentation — MentorSetu v2.1.0

Base `http://localhost:4000`. Auth: `Authorization: Bearer <JWT>` except register/login/health/metrics. Full machine spec: `openapi.yaml` (served at `/openapi.yaml`).

## Auth
- `POST /api/auth/register` (student|alumni) → 201 `{id, token}` / 400 validation / 409 duplicate. Password: 10+ chars, upper+lower+digit.
- `POST /api/auth/login` → 200 `{token, user}` / 401 generic / 429 locked (5 fails/15 min).
- `POST /api/auth/logout` (auth) → 200, writes audit.
- `GET /api/auth/me` → own `{id,email,role,full_name,languages}` (never hash).

## Profile
- `GET /profile` → user + role profile (alumni includes `active_mentees`).
- `PUT /profile` → update own name/languages/bio + role fields (cap 1–20). 200 `{updated:true}`.

## Requests & matching
- `POST /api/requests` (student) → 201. `GET /api/requests/open` (alumni/coordinator).
- `GET /api/suggest/:requestId?freeDays=1,3,5` → Top-5 `[{alumni_id,name,score,full,breakdown,reasons,active,cap}]`. Students only own requests (403 otherwise).
- `POST /api/request-match` (student) → 201 `{id,status:requested|waitlisted,capacity}` / 403 not-own / 404 no alumni / 409 duplicate.

## Matches & slots
- `GET /api/matches/mine` → role-filtered list.
- `PATCH /api/matches/:id` `{accepted|declined|completed}` → 409 illegal transition / at-capacity.
- `POST /api/slots` (alumni), `PUT /api/slots/:id`, `DELETE /api/slots/:id` (own only). Bad ranges → 400 (Oracle CHECK).

## Meetings / goals / feedback
- `POST /api/meetings` → 201 / 409 `OVERLAP|PAST_DATE|END_BEFORE_START|OUTSIDE_AVAILABILITY`. `PATCH /api/meetings/:id` (participant-only) incl. notes/outcomes. `GET /api/meetings/mine`.
- `POST /api/goals`, `GET /api/goals`, `PATCH /api/goals/:id`, `DELETE /api/goals/:id` (own only; progress 0–100).
- `POST /api/feedback` (participant; one/person/meeting → 409 duplicate).

## Coordinator
- `GET /api/admin/kpis` → satisfaction (+comm/relevance), load table + stddev, conflict rate, totals (students/mentors/active/pending/open/upcoming/goals).
- `GET /api/admin/audit` → latest 100 audit rows.

## Errors
Consistent `{error}` (+`details[]` for 400). Never leaks hashes, secrets, or stacks. 404 JSON for unknown routes.
