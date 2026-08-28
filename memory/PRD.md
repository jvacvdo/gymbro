# GymBro — PRD

## Problem statement
Mobile training app. Frontend was delivered complete (design-system port; `window.GB` global pattern, do NOT modify `frontend/src/screens/`, `theme.css`, `ds/`, `vite.config.js`, `globals.js`). Task = build ONLY the backend (FastAPI + MongoDB/motor) + a single new frontend file `frontend/src/api.js` (module only, not wired to screens).

## Architecture
- Backend: FastAPI, all routes under `/api`, JWT Bearer auth (python-jose + passlib bcrypt). Runs via supervisor `uvicorn server:app` on :8001.
- DB: MongoDB (motor). Collections: `users`, `exercises`, `sessions`, `setlogs`.
- Config via pydantic-settings reading `backend/.env` (MONGO_URL, DB_NAME, JWT_SECRET, CORS_ORIGINS). `.env.example` provided.
- CORS open to http://localhost:5173 (+ localhost:3000 + preview APP_URL).
- Frontend client `frontend/src/api.js`: base from `import.meta.env.VITE_API_URL`, token in localStorage (`gb_token`), one function per endpoint.

## Done (2026-06)
- Models + all spec endpoints: auth/register, auth/login, GET/PATCH /me, /taxonomy, /sessions (list by month), /sessions/next, POST /sessions, PATCH /sessions/{id}, /progress/muscle, /progress.
- `Exercise` seeded by parsing the TAXONOMY constant directly from `frontend/src/screens/shared.jsx` (3 groups, 14 muscles — the file is source of truth).
- Demo user `demo@gymbro.app` / `demo1234` seeded with 6 entrenado + 4 planificado July-2026 sessions and setlogs (progressive bench 80→100; stagnant triceps for the `stagnating` flag).
- Response shapes match frontend mocks: `/progress` → `chart` (7 numbers) + `records` (triplets) + `stagnating` bool; `/sessions/next` feeds the home card.
- Added `frontend/.oxlintrc.json` declaring the global `React` (screens rely on `window.React`) — fixes lint without touching protected files.
- Verified: `cd frontend && npm run build` passes; backend 17/17 tests pass (iteration_1).

## Out of scope (left as mock, per instructions)
- Social tab (`gymbro.jsx`): connections, user search, shared session.
- Trainer-client mode (`perfil.jsx`).

## Backlog / next
- Wire `api.js` into screens (explicitly deferred by spec).
- Build social endpoints (connections, search, shared session) when requested.
- Build trainer-client relationship + endpoints.
