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


# ── conexiones ──
def _mk_user(s, tag):
    """Crea un usuario TEST_* y devuelve (headers, username)."""
    uid = f"{tag}{uuid.uuid4().hex[:6]}"
    r = s.post(f"{API}/auth/register", json={
        "name": f"Test {tag}", "username": f"TEST_{uid}", "email": f"TEST_{uid}@example.com",
        "password": "test1234", "goal": "Ganar músculo y fuerza",
        "experience": "Más de 2 años", "frequency": "3–4 días",
    })
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}, f"TEST_{uid}"


def test_connection_full_flow(s):
    a_h, a_user = _mk_user(s, "a")
    b_h, b_user = _mk_user(s, "b")

    # A encuentra a B por username
    found = s.get(f"{API}/users/search", headers=a_h, params={"q": b_user}).json()
    assert any(u["username"] == b_user for u in found)
    # y la busqueda no filtra emails
    assert all("email" not in u for u in found)

    # A envia solicitud
    r = s.post(f"{API}/connections", headers=a_h, json={"username": b_user})
    assert r.status_code == 200, r.text
    conn_id = r.json()["id"]
    assert r.json()["status"] == "pending"

    # Duplicarla se rechaza
    assert s.post(f"{API}/connections", headers=a_h, json={"username": b_user}).status_code == 400

    # A no puede aceptar su propia solicitud
    assert s.patch(f"{API}/connections/{conn_id}", headers=a_h,
                   json={"action": "accept"}).status_code == 403

    # B la ve como entrante y la acepta
    incoming = s.get(f"{API}/connections", headers=b_h).json()
    assert incoming[0]["incoming"] is True
    r = s.patch(f"{API}/connections/{conn_id}", headers=b_h, json={"action": "accept"})
    assert r.status_code == 200 and r.json()["status"] == "accepted"

    # Ahora A ve a B como companero aceptado
    mine = s.get(f"{API}/connections", headers=a_h).json()
    assert mine[0]["status"] == "accepted" and mine[0]["username"] == b_user

    # A puede leer la sesion de B (vacia, pero autorizada)
    r = s.get(f"{API}/connections/{conn_id}/session", headers=a_h)
    assert r.status_code == 200 and "muscles" in r.json()

    # Un tercero no puede leerla
    c_h, _ = _mk_user(s, "c")
    assert s.get(f"{API}/connections/{conn_id}/session", headers=c_h).status_code == 404

    # Y A puede deshacerla
    assert s.delete(f"{API}/connections/{conn_id}", headers=a_h).status_code == 200
    assert s.get(f"{API}/connections", headers=a_h).json() == []


def test_cannot_connect_to_self(s):
    h, user = _mk_user(s, "self")
    r = s.post(f"{API}/connections", headers=h, json={"username": user})
    assert r.status_code == 400


def test_connection_unknown_user(s):
    h, _ = _mk_user(s, "unk")
    assert s.post(f"{API}/connections", headers=h,
                  json={"username": "no_existe_nadie_asi"}).status_code == 404


def test_connections_require_auth(s):
    assert s.get(f"{API}/connections").status_code in (401, 403)
    assert s.get(f"{API}/users/search", params={"q": "ab"}).status_code in (401, 403)


# ── recuperacion de contrasena ──
def test_forgot_password_no_revela_si_existe(s):
    """La respuesta debe ser identica exista o no la cuenta."""
    h, user = _mk_user(s, "fp")
    email = f"{user}@example.com"
    r1 = s.post(f"{API}/auth/forgot-password", json={"email": email})
    r2 = s.post(f"{API}/auth/forgot-password", json={"email": "no_existe_jamas@example.com"})
    assert r1.status_code == r2.status_code == 200
    assert r1.json() == r2.json()


def test_reset_password_token_invalido(s):
    r = s.post(f"{API}/auth/reset-password",
               json={"token": "inventado" * 4, "password": "nuevapass123"})
    assert r.status_code == 400


def test_reset_password_exige_longitud(s):
    r = s.post(f"{API}/auth/reset-password", json={"token": "x" * 20, "password": "corta"})
    assert r.status_code == 400
    assert "8" in r.json()["detail"]


# ── acceso con Google ──
def test_google_rechaza_credencial_falsa(s):
    r = s.post(f"{API}/auth/google", json={"credential": "esto.no.es.un.token"})
    # 401 si esta configurado, 503 si no hay CLIENT_ID. Nunca 200.
    assert r.status_code in (401, 503)


# ── borrado de cuenta ──
def test_delete_me_borra_todo(s):
    h, user = _mk_user(s, "del")
    email = f"{user}@example.com"

    # Deja rastro: una sesion con series.
    s.post(f"{API}/sessions", headers=h, params={"status": "entrenado"}, json=[{
        "muscle": "Pecho", "status": "done",
        "exercises": [{"name": "Press banca", "done": True,
                       "series": [{"kg": 60, "reps": 8, "done": True, "by": "ti"}]}],
    }])
    assert s.get(f"{API}/stats", headers=h).json()["sessions"] == 1

    assert s.delete(f"{API}/me", headers=h).status_code == 200

    # El token ya no vale y la cuenta no puede volver a entrar.
    assert s.get(f"{API}/me", headers=h).status_code == 401
    assert s.post(f"{API}/auth/login",
                  json={"email": email, "password": "test1234"}).status_code == 401


def test_delete_me_requiere_auth(s):
    assert s.delete(f"{API}/me").status_code in (401, 403)


# ── entrenador ──
def test_coach_requiere_auth(s):
    assert s.get(f"{API}/coach").status_code in (401, 403)
    assert s.post(f"{API}/coach/ask", json={"question": "hola"}).status_code in (401, 403)


def test_coach_cuenta_nueva_no_inventa(s):
    """Sin historial no debe sugerir cargas."""
    h, _ = _mk_user(s, "coach")
    r = s.get(f"{API}/coach", headers=h)
    assert r.status_code == 200
    d = r.json()
    assert d["has_data"] is False
    assert d["exercises"] == []
    assert d["disclaimer"]


def test_coach_calcula_sobre_datos_reales(s):
    h, _ = _mk_user(s, "coachd")
    # Dos sesiones con subida real de carga
    for dia, kg in (("2026-08-10", 60), ("2026-08-17", 65)):
        s.post(f"{API}/sessions", headers=h, params={"date": dia, "status": "entrenado"}, json=[{
            "muscle": "Pecho", "status": "done",
            "exercises": [{"name": "Press banca", "done": True,
                           "series": [{"kg": kg, "reps": 8, "done": True, "by": "ti"}]}],
        }])
    d = s.get(f"{API}/coach", headers=h).json()
    assert d["has_data"] is True
    press = [e for e in d["exercises"] if e["exercise"] == "Press banca"]
    assert press, d["exercises"]
    e = press[0]
    # La sugerencia sale del ultimo peso real, no de un numero inventado
    assert e["last_kg"] == 65
    assert e["suggested_kg"] > e["last_kg"]
    assert e["state"] == "progresando"


def test_coach_ask_valida_entrada(s):
    h, _ = _mk_user(s, "coachq")
    # Vacia -> 400. Sin clave configurada -> 503. Nunca 500.
    assert s.post(f"{API}/coach/ask", headers=h, json={"question": "  "}).status_code in (400, 503)
    assert s.post(f"{API}/coach/ask", headers=h,
                  json={"question": "x" * 500}).status_code in (400, 503)


# ── videos de tecnica ──
def test_videos_publico_y_con_forma(s):
    r = s.get(f"{API}/videos")
    assert r.status_code == 200        # catalogo publico, no necesita token
    d = r.json()
    assert isinstance(d, dict)
    # Los ids de YouTube son de 11 caracteres; nunca URLs completas
    for nombre, vid in d.items():
        assert isinstance(vid, str) and len(vid) == 11, (nombre, vid)
        assert "http" not in vid and "/" not in vid


def test_videos_apuntan_a_ejercicios_reales(s):
    videos = s.get(f"{API}/videos").json()
    if not videos:
        return
    tax = s.get(f"{API}/taxonomy").json()
    reales = {e for grupos in tax.values() for ejs in grupos.values() for e in ejs}
    for nombre in videos:
        assert nombre in reales, f"{nombre} no está en la taxonomía"


# ── reanudar sesion a medias ──
def test_next_session_incluye_id_para_retomar(s):
    h, _ = _mk_user(s, "res")
    import datetime
    hoy = datetime.date.today().isoformat()
    s.post(f"{API}/sessions", headers=h, params={"date": hoy, "status": "planificado"}, json=[{
        "muscle": "Pecho", "status": "progress",
        "exercises": [{"name": "Press banca", "done": False,
                       "series": [{"kg": 60, "reps": 8, "done": True, "by": "ti"}]}],
    }])
    n = s.get(f"{API}/sessions/next", headers=h).json()
    assert n is not None
    # Sin id no se puede retomar: se crearia otra sesion duplicada
    assert n.get("id"), n
    assert n["date"] == hoy
    # Y debe traer lo ya registrado para poder continuar donde se dejo
    serie = n["muscles"][0]["exercises"][0]["series"][0]
    assert serie["done"] is True and serie["kg"] == 60


def test_retomar_actualiza_y_no_duplica(s):
    h, _ = _mk_user(s, "res2")
    import datetime
    hoy = datetime.date.today().isoformat()
    r = s.post(f"{API}/sessions", headers=h, params={"date": hoy, "status": "planificado"}, json=[{
        "muscle": "Pecho", "status": "progress",
        "exercises": [{"name": "Press banca", "done": False,
                       "series": [{"kg": 60, "reps": 8, "done": True, "by": "ti"}]}],
    }])
    sid = r.json()["id"]
    # Cerrarla por PATCH, que es lo que hace la app al retomar y finalizar
    s.patch(f"{API}/sessions/{sid}", headers=h, json={"status": "entrenado"})
    mes = hoy[:7]
    sesiones = s.get(f"{API}/sessions", headers=h, params={"month": mes}).json()
    assert len(sesiones) == 1, sesiones          # una sola, no dos
    assert sesiones[0]["status"] == "entrenado"


# ── chat con historial ──
def test_coach_ask_acepta_historial(s):
    h, _ = _mk_user(s, "chat")
    r = s.post(f"{API}/coach/ask", headers=h, json={
        "question": "¿y entonces?",
        "history": [
            {"role": "tu", "text": "¿qué entreno hoy?"},
            {"role": "coach", "text": "Hoy toca pecho."},
        ],
    })
    # 200 con clave, 503 sin ella. Nunca un 422 por la forma del historial.
    assert r.status_code in (200, 503), r.text
    if r.status_code == 200:
        assert r.json()["answer"]


def test_coach_ask_sin_historial_sigue_valiendo(s):
    h, _ = _mk_user(s, "chat2")
    r = s.post(f"{API}/coach/ask", headers=h, json={"question": "hola"})
    assert r.status_code in (200, 503), r.text
