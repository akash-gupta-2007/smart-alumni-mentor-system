# User Guide — MentorSetu (students + alumni, simple language)

## Start the app
1. Double-click `start-local.bat` (two black windows open — keep them).
2. Browser opens http://localhost:5173. If it shows 🔴 API offline, the backend window was closed — rerun the bat.

## Student journey
1. **Register/Login** — Register as Student (password needs 10+ chars, UPPER+lower+digit). Login gives you a token; Logout is top-right.
2. **Workspace → matches** — Fill title/goal/domain/language → Create request → ✨ Suggest Top-3. Each card shows score bar, reason chips (domain, language, common days, bandwidth) and the exact weight breakdown.
3. **Request mentor** — Button per card. If the mentor is full you join the **waitlist** instead (shown clearly).
4. **My matches** — Track status: requested → accepted → completed. Copy a match id for scheduling.
5. **Meetings tab** — Paste match id + date/time → Book. Overlaps/past dates/outside-availability are rejected with a clear reason (409).
6. **Goals tab** — Add goal + target date. (Progress/status updates via API; PATCH /api/goals/:id.)
7. **Feedback tab** — After a meeting, rate overall/communication/relevance 1–5 + comment. One rating per person per meeting.

## Alumni journey
1. Register as Alumni → **availability tab** → Add weekly slots (Day 0=Sun..6=Sat, HH:MM) and delete old ones with ✕.
2. **matches tab → Incoming requests** → Accept/Decline. Accept is blocked with 409 if you hit capacity meanwhile.
3. Same Meetings/Goals/Feedback tabs as students. Your default cap is 5 (changeable in DB `max_mentees`).

## Tips
- Green/gold theme button (top-right) flips dark/light. The 3D background reacts to scrolling.
- Every error message tells you what to do (e.g. "create a request first").
