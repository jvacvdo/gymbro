# Test Credentials — GymBro

Auth: JWT Bearer. Login/register return `{token, user}`. Send `Authorization: Bearer <token>`.

## Demo user (seeded)
- email: `demo@gymbro.app`
- password: `demo1234`
- Seeded with July 2026 sessions (6 entrenado, 4 planificado) + setlogs for progress.

## Auth endpoints (all under /api)
- POST /api/auth/register
- POST /api/auth/login
- GET  /api/me
- PATCH /api/me
- GET  /api/taxonomy
- GET  /api/sessions?month=YYYY-MM
- GET  /api/sessions/next
- POST /api/sessions
- PATCH /api/sessions/{id}
- GET  /api/progress/muscle?muscle=Pecho
- GET  /api/progress?exercise=Press+banca
