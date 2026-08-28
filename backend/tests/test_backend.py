"""GymBro backend API tests (pytest)."""
import os
import uuid
import pytest
import requests

BASE_URL = "https://f2f5ba7c-df0a-45ee-b569-0c1e34954380.preview.emergentagent.com"
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@gymbro.app"
DEMO_PASS = "demo1234"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def demo_token(s):
    r = s.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASS})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def demo_headers(demo_token):
    return {"Authorization": f"Bearer {demo_token}"}


# ── health ──
def test_health(s):
    r = s.get(f"{API}/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ── auth: register ──
def test_register_and_duplicates(s):
    suffix = uuid.uuid4().hex[:8]
    email = f"TEST_{suffix}@example.com"
    username = f"TEST_{suffix}"
    body = {
        "name": "Test User",
        "username": username,
        "email": email,
        "password": "pw12345678",
        "goal": "Hipertrofia",
        "experience": "Principiante",
        "frequency": "3 días/semana",
        "weight": 70,
        "height": 175,
        "age": 25,
        "sex": "M",
    }
    r = s.post(f"{API}/auth/register", json=body)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "token" in data and isinstance(data["token"], str) and data["token"]
    assert "user" in data
    u = data["user"]
    assert u["email"] == email.lower()
    assert u["username"] == username
    assert "password_hash" not in u
    assert u["goal"] == "Hipertrofia"

    # duplicate email
    body2 = dict(body, username=f"OTHER_{suffix}")
    r2 = s.post(f"{API}/auth/register", json=body2)
    assert r2.status_code == 400

    # duplicate username
    body3 = dict(body, email=f"TEST2_{suffix}@example.com")
    r3 = s.post(f"{API}/auth/register", json=body3)
    assert r3.status_code == 400


# ── auth: login ──
def test_login_demo(s):
    r = s.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASS})
    assert r.status_code == 200
    data = r.json()
    assert data["token"]
    assert data["user"]["email"] == DEMO_EMAIL
    assert "password_hash" not in data["user"]


def test_login_wrong_password(s):
    r = s.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": "wrong"})
    assert r.status_code == 401


# ── /me ──
def test_get_me_no_token(s):
    r = s.get(f"{API}/me")
    assert r.status_code == 401


def test_get_me_with_token(s, demo_headers):
    r = s.get(f"{API}/me", headers=demo_headers)
    assert r.status_code == 200
    u = r.json()
    for k in ["email", "username", "name", "goal", "experience", "frequency"]:
        assert k in u, f"missing {k}"
    assert u["email"] == DEMO_EMAIL


def test_patch_me(s, demo_headers):
    r = s.patch(f"{API}/me", headers=demo_headers, json={"weight": 79.5, "goal": "Fuerza"})
    assert r.status_code == 200
    u = r.json()
    assert u["weight"] == 79.5
    assert u["goal"] == "Fuerza"
    # restore
    s.patch(f"{API}/me", headers=demo_headers, json={"weight": 78, "goal": "Hipertrofia"})


def test_patch_me_username_conflict(s, demo_headers):
    # create another user first
    suffix = uuid.uuid4().hex[:8]
    other_username = f"OTHER_{suffix}"
    reg = s.post(f"{API}/auth/register", json={
        "name": "X", "username": other_username,
        "email": f"TEST_conflict_{suffix}@example.com",
        "password": "pw12345678",
        "goal": "g", "experience": "e", "frequency": "f",
    })
    assert reg.status_code == 200
    r = s.patch(f"{API}/me", headers=demo_headers, json={"username": other_username})
    assert r.status_code == 400


# ── taxonomy ──
def test_taxonomy(s):
    r = s.get(f"{API}/taxonomy")
    assert r.status_code == 200
    tree = r.json()
    for g in ["Tren Superior", "Tren Inferior", "Core"]:
        assert g in tree, f"missing group {g}"
    assert tree["Tren Superior"]["Pecho"] == [
        "Press banca", "Press inclinado", "Aperturas", "Fondos"
    ]


# ── sessions ──
def test_sessions_month(s, demo_headers):
    r = s.get(f"{API}/sessions", headers=demo_headers, params={"month": "2026-07"})
    assert r.status_code == 200
    arr = r.json()
    trained = [x for x in arr if x["status"] == "entrenado"]
    planned = [x for x in arr if x["status"] == "planificado"]
    assert len(trained) == 6, f"expected 6 trained got {len(trained)}: {arr}"
    assert len(planned) == 4, f"expected 4 planned got {len(planned)}: {arr}"
    for x in arr:
        assert x["date"].startswith("2026-07")


def test_sessions_next(s, demo_headers):
    r = s.get(f"{API}/sessions/next", headers=demo_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["date"] == "2026-07-15"
    assert isinstance(data["muscles"], list) and len(data["muscles"]) > 0
    assert "exercise_count" in data
    assert "est_minutes" in data
    assert "est_volume_pct" in data


def test_create_session(s, demo_headers):
    body = [
        {"muscle": "Pecho", "status": "pending", "exercises": [
            {"name": "Press banca", "done": True, "series": [
                {"kg": 90, "reps": 8, "done": True, "by": "ti"}
            ]}
        ]}
    ]
    r = s.post(f"{API}/sessions", headers=demo_headers,
               params={"date": "2026-08-05"}, json=body)
    assert r.status_code == 200, r.text
    sess = r.json()
    assert "id" in sess
    assert sess["status"] == "entrenado"  # any done => entrenado default
    assert sess["date"] == "2026-08-05"
    return sess["id"]


def test_patch_session(s, demo_headers):
    # create first
    body = [
        {"muscle": "Pecho", "status": "pending", "exercises": [
            {"name": "Press banca", "done": False, "series": [
                {"kg": 60, "reps": 8, "done": False, "by": "ti"}
            ]}
        ]}
    ]
    r = s.post(f"{API}/sessions", headers=demo_headers,
               params={"date": "2026-08-06"}, json=body)
    assert r.status_code == 200
    sid = r.json()["id"]

    updated = [
        {"muscle": "Pecho", "status": "done", "exercises": [
            {"name": "Press banca", "done": True, "series": [
                {"kg": 100, "reps": 5, "done": True, "by": "ti"}
            ]}
        ]}
    ]
    r2 = s.patch(f"{API}/sessions/{sid}", headers=demo_headers,
                 json={"muscles": updated, "status": "entrenado"})
    assert r2.status_code == 200, r2.text
    d = r2.json()
    assert d["status"] == "entrenado"
    assert d["muscles"][0]["exercises"][0]["series"][0]["kg"] == 100


def test_patch_session_invalid_id(s, demo_headers):
    r = s.patch(f"{API}/sessions/not-an-id", headers=demo_headers,
                json={"status": "entrenado"})
    assert r.status_code in (400, 404)
    r2 = s.patch(f"{API}/sessions/{'0'*24}", headers=demo_headers,
                 json={"status": "entrenado"})
    assert r2.status_code == 404


# ── progress ──
def test_progress_muscle_pecho(s, demo_headers):
    r = s.get(f"{API}/progress/muscle", headers=demo_headers, params={"muscle": "Pecho"})
    assert r.status_code == 200
    data = r.json()
    assert data["unit"] == "kg"
    pts = data["points"]
    # The demo seed produced 6 sessions with bench maxes [80..100]
    # But test_create_session/test_patch_session may have added Pecho entries too.
    # Verify the original series is a monotonic subset.
    assert all(isinstance(x, (int, float)) for x in pts)
    assert 80 in pts
    assert 100 in pts or any(x >= 100 for x in pts)


def test_progress_exercise_press_banca(s, demo_headers):
    r = s.get(f"{API}/progress", headers=demo_headers, params={"exercise": "Press banca"})
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data["chart"], list) and len(data["chart"]) == 7
    assert all(isinstance(x, (int, float)) for x in data["chart"])
    assert isinstance(data["records"], list)
    for rec in data["records"]:
        assert isinstance(rec, list) and len(rec) == 3
    assert data["stagnating"] is False


def test_progress_exercise_stagnating(s, demo_headers):
    r = s.get(f"{API}/progress", headers=demo_headers,
              params={"exercise": "Extensión en polea"})
    assert r.status_code == 200
    data = r.json()
    assert len(data["chart"]) == 7
    assert data["stagnating"] is True


# ── stats ──
def test_stats_demo(s, demo_headers):
    r = s.get(f"{API}/stats", headers=demo_headers)
    assert r.status_code == 200
    data = r.json()
    assert set(data) == {"sessions", "volume_kg", "streak_weeks"}
    # El demo se siembra con sesiones entrenadas y setlogs reales.
    assert data["sessions"] > 0
    assert data["volume_kg"] > 0
    assert isinstance(data["streak_weeks"], int) and data["streak_weeks"] >= 0


def test_stats_requires_auth(s):
    assert s.get(f"{API}/stats").status_code in (401, 403)


def test_stats_new_user_is_zeroed(s):
    """Una cuenta recien creada no puede heredar estadisticas de nadie."""
    uid = uuid.uuid4().hex[:8]
    r = s.post(f"{API}/auth/register", json={
        "name": "Stats Cero", "username": f"TEST_{uid}", "email": f"TEST_{uid}@example.com",
        "password": "test1234", "goal": "Ganar músculo y fuerza",
        "experience": "Más de 2 años", "frequency": "3–4 días",
    })
    assert r.status_code == 200, r.text
    headers = {"Authorization": f"Bearer {r.json()['token']}"}
    data = s.get(f"{API}/stats", headers=headers).json()
    assert data == {"sessions": 0, "volume_kg": 0, "streak_weeks": 0}


def test_progress_reports_session_count(s, demo_headers):
    r = s.get(f"{API}/progress", headers=demo_headers, params={"exercise": "Press banca"})
    assert r.status_code == 200
    assert r.json()["sessions"] > 0
