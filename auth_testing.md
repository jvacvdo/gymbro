# GymBro Auth Testing

JWT Bearer auth (no cookies). Token returned in `{token, user}` and sent as `Authorization: Bearer <token>`.

## Demo / test credentials
- Demo user: `demo@gymbro.app` / `demo1234` (seeded with July 2026 sessions + setlogs)

## API testing (external URL)
```
API=https://f2f5ba7c-df0a-45ee-b569-0c1e34954380.preview.emergentagent.com
# login
TOKEN=$(curl -s -X POST $API/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"demo@gymbro.app","password":"demo1234"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
# me
curl -s $API/api/me -H "Authorization: Bearer $TOKEN"
# sessions for month
curl -s "$API/api/sessions?month=2026-07" -H "Authorization: Bearer $TOKEN"
# next session
curl -s $API/api/sessions/next -H "Authorization: Bearer $TOKEN"
# progress
curl -s "$API/api/progress/muscle?muscle=Pecho" -H "Authorization: Bearer $TOKEN"
curl -s "$API/api/progress?exercise=Press%20banca" -H "Authorization: Bearer $TOKEN"
```
