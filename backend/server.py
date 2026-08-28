"""GymBro backend — FastAPI + MongoDB (motor). Auth via JWT Bearer."""
import os
import re
import json
from datetime import datetime, timezone, date, timedelta
from pathlib import Path
from typing import Optional, List

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Body, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from bson.errors import InvalidId
from jose import jwt, JWTError
from passlib.context import CryptContext


# ── Config ───────────────────────────────────────────────
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    MONGO_URL: str
    DB_NAME: str = "gymbro"
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_DAYS: int = 30
    CORS_ORIGINS: str = "http://localhost:5173"


settings = Settings()

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

client = AsyncIOMotorClient(settings.MONGO_URL)
db = client[settings.DB_NAME]

app = FastAPI(title="GymBro API")

origins = {o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()}
origins.add("http://localhost:5173")
if os.environ.get("APP_URL"):
    origins.add(os.environ["APP_URL"])

# El frontend vive en Vercel, que asigna un dominio distinto a cada
# despliegue (gymbro-<hash>-<equipo>.vercel.app). Enumerarlos a mano es
# inviable, asi que se permiten por patron ademas de la lista explicita.
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(origins),
    allow_origin_regex=r"https://[a-z0-9-]+\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = APIRouter(prefix="/api")
bearer = HTTPBearer(auto_error=False)


# ── Helpers ──────────────────────────────────────────────
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(p: str) -> str:
    return pwd.hash(p)


def verify_password(p: str, h: str) -> bool:
    try:
        return pwd.verify(p, h)
    except Exception:
        return False


def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=settings.JWT_EXPIRE_DAYS),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def clean_user(doc: dict) -> dict:
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    doc.pop("password_hash", None)
    return doc


async def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
) -> dict:
    if creds is None:
        raise HTTPException(status_code=401, detail="No autenticado")
    try:
        payload = jwt.decode(
            creds.credentials, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        uid = payload["sub"]
        user = await db.users.find_one({"_id": ObjectId(uid)})
    except (JWTError, InvalidId, KeyError):
        raise HTTPException(status_code=401, detail="Token inválido")
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user


# ── Schemas ──────────────────────────────────────────────
class RegisterIn(BaseModel):
    name: str
    username: str
    email: EmailStr
    password: str
    goal: str
    experience: str
    frequency: str
    weight: Optional[float] = None
    height: Optional[float] = None
    age: Optional[int] = None
    sex: Optional[str] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ProfilePatch(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    age: Optional[int] = None
    sex: Optional[str] = None
    goal: Optional[str] = None
    experience: Optional[str] = None
    frequency: Optional[str] = None


class SeriesIn(BaseModel):
    kg: float = 0
    reps: int = 0
    done: bool = False
    by: str = "ti"


class ExerciseIn(BaseModel):
    name: str
    done: bool = False
    series: List[SeriesIn] = []


class MuscleIn(BaseModel):
    muscle: str
    status: str = "pending"
    exercises: List[ExerciseIn] = []


# ── Auth endpoints ───────────────────────────────────────
@api.post("/auth/register")
async def register(body: RegisterIn):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    if await db.users.find_one({"username": body.username}):
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    doc = {
        "email": email,
        "username": body.username,
        "password_hash": hash_password(body.password),
        "name": body.name,
        "created_at": now_iso(),
        "weight": body.weight,
        "height": body.height,
        "age": body.age,
        "sex": body.sex,
        "goal": body.goal,
        "experience": body.experience,
        "frequency": body.frequency,
    }
    res = await db.users.insert_one(doc)
    doc["_id"] = res.inserted_id
    return {"token": create_token(str(res.inserted_id)), "user": clean_user(doc)}


@api.post("/auth/login")
async def login(body: LoginIn):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    return {"token": create_token(str(user["_id"])), "user": clean_user(user)}


@api.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    return clean_user(user)


@api.patch("/me")
async def patch_me(body: ProfilePatch, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
    if "username" in updates:
        clash = await db.users.find_one(
            {"username": updates["username"], "_id": {"$ne": user["_id"]}}
        )
        if clash:
            raise HTTPException(status_code=400, detail="El usuario ya existe")
    if updates:
        await db.users.update_one({"_id": user["_id"]}, {"$set": updates})
    fresh = await db.users.find_one({"_id": user["_id"]})
    return clean_user(fresh)


# ── Taxonomy ─────────────────────────────────────────────
@api.get("/taxonomy")
async def get_taxonomy():
    tree: dict = {}
    cursor = db.exercises.find({}).sort("order", 1)
    async for ex in cursor:
        tree.setdefault(ex["group"], {})
        tree[ex["group"]].setdefault(ex["muscle"], [])
        tree[ex["group"]][ex["muscle"]].append(ex["name"])
    return tree


# ── Sessions ─────────────────────────────────────────────
def _count_exercises(muscles: List[dict]) -> int:
    return sum(len(m.get("exercises", [])) for m in muscles)


def _count_series(muscles: List[dict]) -> int:
    return sum(
        len(e.get("series", []))
        for m in muscles
        for e in m.get("exercises", [])
    )


def _signed(value, unit: str = "") -> str:
    """Formatea un delta con su signo real. Evita el '+-31%' que salia de
    anteponer '+' a un numero ya negativo."""
    sign = "+" if value > 0 else ("-" if value < 0 else "")
    return f"{sign}{abs(value)}{unit}"


def _session_volume(muscles: List[dict]) -> float:
    return sum(
        s.get("kg", 0) * s.get("reps", 0)
        for m in muscles
        for e in m.get("exercises", [])
        for s in e.get("series", [])
    )


async def _write_setlogs(user_id, session_id, dt: str, muscles: List[dict]):
    await db.setlogs.delete_many({"session_id": session_id})
    logs = []
    for m in muscles:
        for e in m.get("exercises", []):
            for idx, s in enumerate(e.get("series", [])):
                if s.get("done"):
                    logs.append(
                        {
                            "user_id": user_id,
                            "session_id": session_id,
                            "exercise_name": e["name"],
                            "muscle": m["muscle"],
                            "set_index": idx,
                            "kg": s.get("kg", 0),
                            "reps": s.get("reps", 0),
                            "done": True,
                            "by": s.get("by", "ti"),
                            "date": dt,
                        }
                    )
    if logs:
        await db.setlogs.insert_many(logs)


@api.get("/sessions")
async def list_sessions(
    month: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
    user: dict = Depends(get_current_user),
):
    cursor = db.sessions.find(
        {"user_id": user["_id"], "date": {"$regex": f"^{month}"}}
    ).sort("date", 1)
    return [{"date": s["date"], "status": s["status"]} async for s in cursor]


@api.get("/sessions/next")
async def next_session(user: dict = Depends(get_current_user)):
    s = await db.sessions.find_one(
        {"user_id": user["_id"], "status": "planificado"}, sort=[("date", 1)]
    )
    if not s:
        return None
    muscles = s.get("muscles", [])
    n_ex = _count_exercises(muscles)
    n_series = _count_series(muscles)
    planned_vol = _session_volume(muscles)

    # Comparar contra la ultima sesion entrenada que comparta musculo. Medir
    # un dia de espalda contra uno de pecho no dice nada, y si la ultima
    # sesion es de otro grupo el porcentaje se dispara.
    planned_muscles = {m.get("muscle") for m in muscles}
    est_pct = 0
    cursor = (
        db.sessions.find({"user_id": user["_id"], "status": "entrenado"})
        .sort("date", -1)
        .limit(20)
    )
    async for prev in cursor:
        prev_muscles = {m.get("muscle") for m in prev.get("muscles", [])}
        if not (planned_muscles & prev_muscles):
            continue
        prev_vol = _session_volume(prev.get("muscles", []))
        if prev_vol > 0:
            # Acotado: un porcentaje de tres cifras es siempre ruido de datos,
            # no una senal util para el usuario.
            est_pct = max(-99, min(99, round((planned_vol - prev_vol) / prev_vol * 100)))
        break

    return {
        "date": s["date"],
        "muscles": muscles,
        "exercise_count": n_ex,
        "est_minutes": max(n_series * 4, n_ex * 10),
        "est_volume_pct": est_pct,
    }


@api.post("/sessions")
async def create_session(
    muscles: List[MuscleIn] = Body(...),
    date_q: Optional[str] = Query(None, alias="date"),
    status: Optional[str] = Query(None),
    user: dict = Depends(get_current_user),
):
    m = [x.model_dump() for x in muscles]
    any_done = any(
        s.get("done") for mu in m for e in mu["exercises"] for s in e["series"]
    )
    doc = {
        "user_id": user["_id"],
        "date": date_q or date.today().isoformat(),
        "status": status or ("entrenado" if any_done else "planificado"),
        "muscles": m,
    }
    res = await db.sessions.insert_one(doc)
    await _write_setlogs(user["_id"], res.inserted_id, doc["date"], m)
    doc["_id"] = res.inserted_id
    doc["id"] = str(res.inserted_id)
    doc.pop("_id")
    doc["user_id"] = str(doc["user_id"])
    return doc


@api.patch("/sessions/{session_id}")
async def update_session(
    session_id: str,
    muscles: Optional[List[MuscleIn]] = Body(None, embed=True),
    status: Optional[str] = Body(None, embed=True),
    user: dict = Depends(get_current_user),
):
    try:
        oid = ObjectId(session_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="ID inválido")
    s = await db.sessions.find_one({"_id": oid, "user_id": user["_id"]})
    if not s:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")

    updates = {}
    if muscles is not None:
        updates["muscles"] = [x.model_dump() for x in muscles]
    if status is not None:
        updates["status"] = status
    if updates:
        await db.sessions.update_one({"_id": oid}, {"$set": updates})

    fresh = await db.sessions.find_one({"_id": oid})
    await _write_setlogs(user["_id"], oid, fresh["date"], fresh.get("muscles", []))
    fresh["id"] = str(fresh.pop("_id"))
    fresh["user_id"] = str(fresh["user_id"])
    return fresh


# ── Progress ─────────────────────────────────────────────
async def _per_session_stats(user_id, match: dict):
    """Return list of {date, max_kg, volume, top} per session ordered by date."""
    pipeline = [
        {"$match": {"user_id": user_id, **match, "done": True}},
        {
            "$group": {
                "_id": "$session_id",
                "date": {"$first": "$date"},
                "max_kg": {"$max": "$kg"},
                "volume": {"$sum": {"$multiply": ["$kg", "$reps"]}},
            }
        },
        {"$sort": {"date": 1}},
    ]
    return [row async for row in db.setlogs.aggregate(pipeline)]


@api.get("/progress/muscle")
async def progress_muscle(
    muscle: str = Query(...), user: dict = Depends(get_current_user)
):
    rows = await _per_session_stats(user["_id"], {"muscle": muscle})
    return {"points": [round(r["max_kg"], 1) for r in rows], "unit": "kg"}


@api.get("/progress")
async def progress_exercise(
    exercise: str = Query(...), user: dict = Depends(get_current_user)
):
    rows = await _per_session_stats(user["_id"], {"exercise_name": exercise})
    maxes = [r["max_kg"] for r in rows]

    # chart: exactly 7 numbers (max load per period)
    if len(maxes) >= 7:
        chart = [round(x, 1) for x in maxes[-7:]]
    elif maxes:
        pad = [round(maxes[0], 1)] * (7 - len(maxes))
        chart = pad + [round(x, 1) for x in maxes]
    else:
        chart = [0, 0, 0, 0, 0, 0, 0]

    # records
    records = []
    if rows:
        cur_max = max(maxes)
        prev_max = max(maxes[:-1]) if len(maxes) > 1 else 0
        records.append(["1RM", f"{round(cur_max,1)} kg", _signed(round(cur_max - prev_max, 1), " kg")])

        vols = [r["volume"] for r in rows]
        cur_vol = vols[-1]
        prev_vol = vols[-2] if len(vols) > 1 else 0
        vdelta = round((cur_vol - prev_vol) / prev_vol * 100) if prev_vol else 0
        records.append(["Vol. máx", f"{round(max(vols)):,} kg", _signed(vdelta, "%")])

        # reps máx at the top weight of the last session
        top_set = await db.setlogs.find_one(
            {"user_id": user["_id"], "exercise_name": exercise, "done": True},
            sort=[("date", -1), ("kg", -1), ("reps", -1)],
        )
        if top_set:
            # Delta real contra el mejor registro anterior a ese peso. Antes
            # era un "+1" fijo, es decir un dato inventado.
            prev_best = await db.setlogs.find(
                {
                    "user_id": user["_id"],
                    "exercise_name": exercise,
                    "done": True,
                    "kg": top_set["kg"],
                    "date": {"$lt": top_set["date"]},
                }
            ).sort("reps", -1).limit(1).to_list(1)
            delta = _signed(top_set["reps"] - prev_best[0]["reps"]) if prev_best else ""
            records.append(
                ["Reps máx", f"{top_set['reps']} @ {round(top_set['kg'])}kg", delta]
            )

    # stagnating: max load has not risen in the last 3 sessions
    stagnating = False
    if len(maxes) >= 4:
        before_peak = max(maxes[:-3])
        last3_peak = max(maxes[-3:])
        stagnating = last3_peak <= before_peak

    return {
        "chart": chart,
        "records": records,
        "stagnating": stagnating,
        "sessions": len(rows),
    }


# ── Stats ────────────────────────────────────────────────
def _streak_weeks(dates: List[str]) -> int:
    """Semanas consecutivas con al menos una sesion entrenada.

    Una racha diaria no dice nada en una app de gimnasio: nadie entrena los
    siete dias. Lo que el usuario reconoce como "no faltar" es no saltarse
    ninguna semana, asi que contamos semanas ISO hacia atras desde la actual.
    Si la ultima sesion es de hace mas de una semana, la racha esta rota.
    """
    if not dates:
        return 0
    weeks = {date.fromisoformat(d).isocalendar()[:2] for d in dates}
    today = datetime.now(timezone.utc).date()
    cursor = today
    # Tolerancia de una semana: entrenar el lunes no deberia romper la racha
    # solo porque aun no ha habido sesion en la semana en curso.
    if cursor.isocalendar()[:2] not in weeks:
        cursor -= timedelta(weeks=1)
    streak = 0
    while cursor.isocalendar()[:2] in weeks:
        streak += 1
        cursor -= timedelta(weeks=1)
    return streak


@api.get("/stats")
async def stats(user: dict = Depends(get_current_user)):
    """Resumen del atleta para la pantalla de perfil."""
    cursor = db.sessions.find(
        {"user_id": user["_id"], "status": "entrenado"}, {"date": 1}
    )
    dates = [s["date"] async for s in cursor]

    agg = db.setlogs.aggregate(
        [
            {"$match": {"user_id": user["_id"], "done": True}},
            {"$group": {"_id": None, "vol": {"$sum": {"$multiply": ["$kg", "$reps"]}}}},
        ]
    )
    volume = 0.0
    async for row in agg:
        volume = row["vol"]

    return {
        "sessions": len(dates),
        "volume_kg": round(volume),
        "streak_weeks": _streak_weeks(dates),
    }


@api.get("/health")
async def health():
    return {"status": "ok"}


# ── Seeding ──────────────────────────────────────────────
def read_taxonomy_from_frontend() -> dict:
    """Read the TAXONOMY constant from frontend/src/screens/shared.jsx."""
    path = (
        Path(__file__).resolve().parent.parent
        / "frontend"
        / "src"
        / "screens"
        / "shared.jsx"
    )
    text = path.read_text(encoding="utf-8")
    start = text.index("const TAXONOMY")
    brace = text.index("{", start)
    depth = 0
    end = brace
    for i in range(brace, len(text)):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    block = text[brace:end]
    block = block.replace("'", '"')
    block = re.sub(r",(\s*[}\]])", r"\1", block)  # drop trailing commas
    return json.loads(block)


async def seed_exercises():
    if await db.exercises.count_documents({}) > 0:
        return
    taxonomy = read_taxonomy_from_frontend()
    docs, order = [], 0
    for group, muscles in taxonomy.items():
        for muscle, names in muscles.items():
            for name in names:
                docs.append(
                    {"name": name, "muscle": muscle, "group": group, "order": order}
                )
                order += 1
    if docs:
        await db.exercises.insert_many(docs)


def _mk_series(kg, reps, n=3, by="ti"):
    return [{"kg": kg, "reps": reps, "done": True, "by": by} for _ in range(n)]


async def seed_demo():
    """Siembra el usuario demo de forma idempotente.

    Antes salia por la puerta de atras si el usuario ya existia, asi que los
    datos que dejaban las pruebas se acumulaban encima y falseaban graficas y
    porcentajes. Ahora se rehacen sus sesiones en cada arranque. Solo afecta a
    datos de demo y de test, nunca a cuentas reales.
    """
    demo_email = "demo@gymbro.app"

    # Restos de ejecuciones de tests: usuarios TEST_* y todo lo suyo.
    async for u in db.users.find({"email": {"$regex": "^TEST_"}}):
        await db.sessions.delete_many({"user_id": u["_id"]})
        await db.setlogs.delete_many({"user_id": u["_id"]})
        await db.users.delete_one({"_id": u["_id"]})

    existing = await db.users.find_one({"email": demo_email})
    if existing:
        # Se conserva la cuenta (y su contrasena); se rehace su historial.
        await db.sessions.delete_many({"user_id": existing["_id"]})
        await db.setlogs.delete_many({"user_id": existing["_id"]})
        await db.users.delete_one({"_id": existing["_id"]})

    user = {
        "email": demo_email,
        "username": "demo",
        "password_hash": hash_password("demo1234"),
        "name": "Alex Demo",
        "created_at": now_iso(),
        "weight": 78,
        "height": 180,
        "age": 28,
        "sex": "M",
        "goal": "Hipertrofia",
        "experience": "Intermedio",
        "frequency": "4 días/semana",
    }
    uid = (await db.users.insert_one(user)).inserted_id

    # Trained sessions: progressive Press banca, stagnant Extensión en polea
    bench = [80, 84, 88, 92, 96, 100]
    incl = [40, 44, 48, 52, 56, 60]
    tri = [30, 30, 30, 30, 30, 30]  # stagnant
    trained_days = [1, 3, 6, 8, 10, 13]
    for i, day in enumerate(trained_days):
        dt = f"2026-07-{day:02d}"
        muscles = [
            {
                "muscle": "Pecho",
                "status": "done",
                "exercises": [
                    {"name": "Press banca", "done": True, "series": _mk_series(bench[i], 8)},
                    {"name": "Press inclinado", "done": True, "series": _mk_series(incl[i], 10)},
                ],
            },
            {
                "muscle": "Tríceps",
                "status": "done",
                "exercises": [
                    {"name": "Extensión en polea", "done": True, "series": _mk_series(tri[i], 12)},
                ],
            },
        ]
        sid = (
            await db.sessions.insert_one(
                {"user_id": uid, "date": dt, "status": "entrenado", "muscles": muscles}
            )
        ).inserted_id
        await _write_setlogs(uid, sid, dt, muscles)

    # Planned future sessions
    planned = {
        15: [("Espalda", ["Jalón al pecho", "Remo con barra", "Dominadas"]), ("Bíceps", ["Curl con barra", "Curl martillo"])],
        17: [("Cuádriceps", ["Sentadilla", "Prensa de pierna", "Zancadas"]), ("Glúteos", ["Hip thrust"])],
        20: [("Hombros", ["Press militar", "Elevaciones laterales", "Pájaros"])],
        22: [("Abdominales", ["Crunch", "Plancha", "Elevación de piernas"])],
    }
    for day, groups in planned.items():
        dt = f"2026-07-{day:02d}"
        muscles = [
            {
                "muscle": mus,
                "status": "pending",
                "exercises": [
                    {"name": ex, "done": False, "series": [
                        {"kg": 60, "reps": 8, "done": False, "by": "ti"},
                        {"kg": 80, "reps": 6, "done": False, "by": "ti"},
                    ]} for ex in exs
                ],
            }
            for mus, exs in groups
        ]
        await db.sessions.insert_one(
            {"user_id": uid, "date": dt, "status": "planificado", "muscles": muscles}
        )


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)
    await db.sessions.create_index([("user_id", 1), ("date", 1)])
    await db.setlogs.create_index([("user_id", 1), ("exercise_name", 1)])
    await db.setlogs.create_index([("user_id", 1), ("muscle", 1)])
    await seed_exercises()
    await seed_demo()


app.include_router(api)
