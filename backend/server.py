"""GymBro backend — FastAPI + MongoDB (motor). Auth via JWT Bearer."""
import os
import re
import json
import hmac
import smtplib
import asyncio
import logging
import secrets
import hashlib
from email.message import EmailMessage
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

    # Acceso con Google. Sin CLIENT_ID el endpoint /auth/google responde 503
    # en vez de fingir que funciona.
    GOOGLE_CLIENT_ID: str = ""

    # Entrenador con IA. Sin clave, /coach sigue funcionando con el motor
    # de reglas; solo se apaga la parte que redacta en lenguaje natural.
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # Envio de correo para recuperar contrasena. Vale cualquier SMTP
    # (Gmail con contrasena de aplicacion, Resend, SendGrid...). Sin
    # SMTP_HOST el envio queda deshabilitado y se avisa por log.
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "GymBro <no-reply@gymbro.app>"
    # Base publica de la app, para construir el enlace del correo.
    APP_URL: str = "http://localhost:5173"
    RESET_TOKEN_MINUTES: int = 60


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
    # El frontend necesita saber si la cuenta tiene contrasena (para ofrecer
    # cambiarla) pero nunca el hash.
    doc["has_password"] = bool(doc.pop("password_hash", None))
    # Identificador interno de Google: no aporta nada al cliente y es
    # material de vinculacion de cuentas.
    doc.pop("google_sub", None)
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
    # Una cuenta creada con Google no tiene hash: entra por /auth/google.
    # El mensaje es el generico para no revelar por que via existe la cuenta.
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    if not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    return {"token": create_token(str(user["_id"])), "user": clean_user(user)}


# ── Recuperacion de contrasena ───────────────────────────
class ForgotIn(BaseModel):
    email: EmailStr


class ResetIn(BaseModel):
    token: str
    password: str


def _hash_token(raw: str) -> str:
    """El token viaja en el correo; en la base solo guardamos su hash.

    Si alguien lee la coleccion no puede usar los tokens pendientes, igual
    que con las contrasenas.
    """
    return hashlib.sha256(raw.encode()).hexdigest()


def _send_reset_email(to: str, name: str, link: str) -> None:
    """Envio sincrono; se llama desde un hilo para no bloquear el event loop."""
    msg = EmailMessage()
    msg["Subject"] = "Restablece tu contraseña de GymBro"
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to
    msg.set_content(
        f"Hola {name}:\n\n"
        f"Pediste restablecer tu contraseña de GymBro. Abre este enlace:\n\n"
        f"{link}\n\n"
        f"El enlace caduca en {settings.RESET_TOKEN_MINUTES} minutos y solo "
        f"sirve una vez.\n\n"
        f"Si no lo pediste tú, ignora este correo: tu contraseña no cambia.\n"
    )
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as s:
        s.starttls()
        if settings.SMTP_USER:
            s.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        s.send_message(msg)


@api.post("/auth/forgot-password")
async def forgot_password(body: ForgotIn):
    """Siempre responde igual, exista el email o no.

    Contestar "ese correo no existe" convierte el endpoint en un detector de
    quien tiene cuenta. La respuesta es identica en ambos casos.
    """
    generic = {"sent": True}
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not user.get("password_hash"):
        # Sin password_hash es una cuenta de Google: no hay contrasena que
        # restablecer, pero tampoco lo revelamos.
        return generic

    raw = secrets.token_urlsafe(32)
    await db.password_resets.insert_one(
        {
            "user_id": user["_id"],
            "token_hash": _hash_token(raw),
            "expires_at": datetime.now(timezone.utc)
            + timedelta(minutes=settings.RESET_TOKEN_MINUTES),
            "used": False,
        }
    )

    link = f"{settings.APP_URL.rstrip('/')}/?reset={raw}"
    if not settings.SMTP_HOST:
        logging.warning(
            "SMTP sin configurar: no se envio el correo de recuperacion a %s. "
            "Enlace generado: %s", body.email, link
        )
        return generic
    try:
        await asyncio.to_thread(
            _send_reset_email, user["email"], user.get("name", ""), link
        )
    except Exception:
        # Un fallo del proveedor no debe delatar si la cuenta existe.
        logging.exception("Fallo enviando el correo de recuperacion")
    return generic


@api.post("/auth/reset-password")
async def reset_password(body: ResetIn):
    if len(body.password) < 8:
        raise HTTPException(
            status_code=400, detail="La contraseña debe tener al menos 8 caracteres"
        )
    rec = await db.password_resets.find_one(
        {
            "token_hash": _hash_token(body.token),
            "used": False,
            "expires_at": {"$gt": datetime.now(timezone.utc)},
        }
    )
    if not rec:
        raise HTTPException(status_code=400, detail="El enlace no es válido o ya caducó")

    await db.users.update_one(
        {"_id": rec["user_id"]},
        {"$set": {"password_hash": hash_password(body.password)}},
    )
    await db.password_resets.update_one({"_id": rec["_id"]}, {"$set": {"used": True}})
    # Cualquier otro enlace pendiente deja de servir.
    await db.password_resets.update_many(
        {"user_id": rec["user_id"], "used": False}, {"$set": {"used": True}}
    )

    user = await db.users.find_one({"_id": rec["user_id"]})
    return {"token": create_token(str(user["_id"])), "user": clean_user(user)}


# ── Acceso con Google ────────────────────────────────────
class GoogleIn(BaseModel):
    credential: str


async def _unique_username(base: str) -> str:
    """Deriva un usuario libre a partir del correo de Google."""
    base = re.sub(r"[^a-z0-9_]", "", base.lower()) or "atleta"
    base = base[:20]
    if not await db.users.find_one({"username": base}):
        return base
    for _ in range(50):
        cand = f"{base}{secrets.randbelow(9000) + 1000}"
        if not await db.users.find_one({"username": cand}):
            return cand
    return f"{base}{secrets.token_hex(4)}"


@api.post("/auth/google")
async def google_auth(body: GoogleIn):
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=503, detail="El acceso con Google no está configurado"
        )
    # Import perezoso: sin GOOGLE_CLIENT_ID la libreria no hace falta.
    from google.oauth2 import id_token as google_id_token
    from google.auth.transport import requests as google_requests

    try:
        info = await asyncio.to_thread(
            google_id_token.verify_oauth2_token,
            body.credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Token de Google no válido")

    if not info.get("email_verified"):
        raise HTTPException(status_code=401, detail="Tu correo de Google no está verificado")

    email = info["email"].lower()
    user = await db.users.find_one({"email": email})
    if user:
        # Cuenta ya existente: se vincula con Google y se entra.
        if not user.get("google_sub"):
            await db.users.update_one(
                {"_id": user["_id"]}, {"$set": {"google_sub": info["sub"]}}
            )
        needs_onboarding = not user.get("goal")
        return {
            "token": create_token(str(user["_id"])),
            "user": clean_user(user),
            "needs_onboarding": needs_onboarding,
        }

    # Cuenta nueva. Google da nombre y correo, pero no objetivo ni
    # experiencia: eso se pregunta despues en el onboarding.
    doc = {
        "email": email,
        "username": await _unique_username(email.split("@")[0]),
        "password_hash": None,
        "google_sub": info["sub"],
        "name": info.get("name") or email.split("@")[0],
        "created_at": now_iso(),
        "weight": None, "height": None, "age": None, "sex": None,
        "goal": "", "experience": "", "frequency": "",
    }
    res = await db.users.insert_one(doc)
    doc["_id"] = res.inserted_id
    return {
        "token": create_token(str(res.inserted_id)),
        "user": clean_user(doc),
        "needs_onboarding": True,
    }


@api.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    return clean_user(user)


@api.delete("/me")
async def delete_me(user: dict = Depends(get_current_user)):
    """Borra la cuenta y todo lo que cuelga de ella. No hay vuelta atras."""
    uid = user["_id"]
    await db.sessions.delete_many({"user_id": uid})
    await db.setlogs.delete_many({"user_id": uid})
    await db.connections.delete_many(
        {"$or": [{"a_user_id": uid}, {"b_user_id": uid}]}
    )
    await db.password_resets.delete_many({"user_id": uid})
    await db.users.delete_one({"_id": uid})
    return {"deleted": True}


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


# ── Conexiones (GymBro / GymSis) ─────────────────────────
class ConnectionIn(BaseModel):
    username: str


class ConnectionAction(BaseModel):
    action: str  # accept | reject


def _peer_id(conn: dict, me):
    """El otro extremo de la conexion."""
    return conn["b_user_id"] if conn["a_user_id"] == me else conn["a_user_id"]


async def _trained_today(user_id) -> bool:
    return await db.sessions.find_one(
        {"user_id": user_id, "date": date.today().isoformat(), "status": "entrenado"}
    ) is not None


async def _shape_connection(conn: dict, me) -> dict:
    peer = await db.users.find_one({"_id": _peer_id(conn, me)})
    if not peer:
        return None
    last = await db.sessions.find_one(
        {"user_id": peer["_id"], "status": "entrenado"}, sort=[("date", -1)]
    )
    days = None
    if last:
        days = (date.today() - date.fromisoformat(last["date"])).days
    return {
        "id": str(conn["_id"]),
        "name": peer.get("name", ""),
        "username": peer.get("username", ""),
        "sex": peer.get("sex"),
        "status": conn["status"],
        # Quien envio la solicitud decide si el otro ve "aceptar" o "pendiente".
        "incoming": conn["requested_by"] != me,
        "today": await _trained_today(peer["_id"]),
        "days_since": days,
    }


@api.get("/users/search")
async def search_users(q: str = Query(..., min_length=2), user: dict = Depends(get_current_user)):
    """Busca por username o nombre. Nunca devuelve email: es una lista publica."""
    rx = {"$regex": re.escape(q), "$options": "i"}
    cursor = db.users.find(
        {"$or": [{"username": rx}, {"name": rx}], "_id": {"$ne": user["_id"]}}
    ).limit(20)
    found = [u async for u in cursor]

    # Marcar los que ya tienen conexion para no ofrecer "Agregar" dos veces.
    linked = {}
    async for c in db.connections.find(
        {"$or": [{"a_user_id": user["_id"]}, {"b_user_id": user["_id"]}]}
    ):
        linked[_peer_id(c, user["_id"])] = c["status"]

    return [
        {
            "name": u.get("name", ""),
            "username": u.get("username", ""),
            "sex": u.get("sex"),
            "connection": linked.get(u["_id"]),
        }
        for u in found
    ]


@api.get("/connections")
async def list_connections(user: dict = Depends(get_current_user)):
    cursor = db.connections.find(
        {"$or": [{"a_user_id": user["_id"]}, {"b_user_id": user["_id"]}]}
    )
    out = []
    async for c in cursor:
        shaped = await _shape_connection(c, user["_id"])
        if shaped:
            out.append(shaped)
    # Primero las solicitudes que esperan respuesta del usuario.
    out.sort(key=lambda x: (x["status"] == "accepted", not x["incoming"]))
    return out


@api.post("/connections")
async def create_connection(body: ConnectionIn, user: dict = Depends(get_current_user)):
    peer = await db.users.find_one({"username": body.username})
    if not peer:
        raise HTTPException(status_code=404, detail="No existe ese usuario")
    if peer["_id"] == user["_id"]:
        raise HTTPException(status_code=400, detail="No puedes conectarte contigo")
    existing = await db.connections.find_one(
        {
            "$or": [
                {"a_user_id": user["_id"], "b_user_id": peer["_id"]},
                {"a_user_id": peer["_id"], "b_user_id": user["_id"]},
            ]
        }
    )
    if existing:
        raise HTTPException(status_code=400, detail="Ya hay una solicitud con esa persona")
    doc = {
        "a_user_id": user["_id"],
        "b_user_id": peer["_id"],
        "status": "pending",
        "requested_by": user["_id"],
        "created_at": now_iso(),
    }
    res = await db.connections.insert_one(doc)
    doc["_id"] = res.inserted_id
    return await _shape_connection(doc, user["_id"])


@api.patch("/connections/{conn_id}")
async def respond_connection(
    conn_id: str, body: ConnectionAction, user: dict = Depends(get_current_user)
):
    try:
        oid = ObjectId(conn_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Conexión no encontrada")
    conn = await db.connections.find_one({"_id": oid})
    if not conn or user["_id"] not in (conn["a_user_id"], conn["b_user_id"]):
        raise HTTPException(status_code=404, detail="Conexión no encontrada")
    # Solo el destinatario responde: aceptar la propia solicitud la haria inutil.
    if conn["requested_by"] == user["_id"]:
        raise HTTPException(status_code=403, detail="Espera a que te respondan")
    if body.action == "accept":
        await db.connections.update_one({"_id": oid}, {"$set": {"status": "accepted"}})
        fresh = await db.connections.find_one({"_id": oid})
        return await _shape_connection(fresh, user["_id"])
    if body.action == "reject":
        await db.connections.delete_one({"_id": oid})
        return {"deleted": True}
    raise HTTPException(status_code=400, detail="Acción no válida")


@api.delete("/connections/{conn_id}")
async def delete_connection(conn_id: str, user: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(conn_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Conexión no encontrada")
    res = await db.connections.delete_one(
        {"_id": oid, "$or": [{"a_user_id": user["_id"]}, {"b_user_id": user["_id"]}]}
    )
    if not res.deleted_count:
        raise HTTPException(status_code=404, detail="Conexión no encontrada")
    return {"deleted": True}


@api.get("/connections/{conn_id}/session")
async def connection_session(conn_id: str, user: dict = Depends(get_current_user)):
    """Sesion de hoy del companero. Solo si la conexion esta aceptada."""
    try:
        oid = ObjectId(conn_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Conexión no encontrada")
    conn = await db.connections.find_one({"_id": oid, "status": "accepted"})
    if not conn or user["_id"] not in (conn["a_user_id"], conn["b_user_id"]):
        raise HTTPException(status_code=404, detail="Conexión no encontrada")
    peer_id = _peer_id(conn, user["_id"])
    s = await db.sessions.find_one(
        {"user_id": peer_id, "date": date.today().isoformat()}, sort=[("date", -1)]
    )
    peer = await db.users.find_one({"_id": peer_id})
    if not s:
        return {"name": peer.get("name", ""), "muscles": [], "date": date.today().isoformat()}
    return {
        "name": peer.get("name", ""),
        "date": s["date"],
        "status": s["status"],
        "muscles": s.get("muscles", []),
    }


# ── Entrenador ───────────────────────────────────────────
# Dos capas. El motor de reglas calcula sobre los numeros reales del usuario
# y siempre responde. Gemini solo redacta encima: si no hay clave o falla,
# el consejo sigue saliendo. Un modelo de lenguaje suelto se inventa las
# cargas, asi que nunca decide el peso: lo decide la regla.

DESCARGO = (
    "Estas sugerencias salen de tu propio historial, no de un profesional. "
    "Si tienes molestias o una condición médica, consulta antes con un "
    "especialista."
)


def _incremento(grupo: str) -> float:
    """Salto de carga razonable segun el tren. Las piernas admiten mas."""
    return 5.0 if grupo == "Tren Inferior" else 2.5


async def _grupo_de_musculo(muscle: str) -> str:
    ex = await db.exercises.find_one({"muscle": muscle})
    return ex.get("group", "Tren Superior") if ex else "Tren Superior"


async def _consejo_ejercicio(user_id, exercise: str) -> Optional[dict]:
    """Que peso tocaria hoy en un ejercicio, y por que."""
    rows = await _per_session_stats(user_id, {"exercise_name": exercise})
    if not rows:
        return None
    maxes = [r["max_kg"] for r in rows]
    ultimo = maxes[-1]

    log = await db.setlogs.find_one(
        {"user_id": user_id, "exercise_name": exercise, "done": True},
        sort=[("date", -1), ("kg", -1)],
    )
    muscle = log.get("muscle", "") if log else ""
    paso = _incremento(await _grupo_de_musculo(muscle))

    # Mismo criterio que /progress: sin subida en las ultimas 3 sesiones.
    estancado = False
    if len(maxes) >= 4:
        estancado = max(maxes[-3:]) <= max(maxes[:-3])

    if estancado:
        return {
            "exercise": exercise, "muscle": muscle, "last_kg": round(ultimo, 1),
            "suggested_kg": round(ultimo * 0.9 / 2.5) * 2.5,
            "state": "estancado",
            "reason": (
                f"Llevas 3 sesiones sin superar los {round(ultimo,1)} kg. "
                f"Baja un 10% esta semana y céntrate en completar todas las "
                f"repeticiones; la subida suele volver sola."
            ),
        }
    if len(maxes) == 1:
        return {
            "exercise": exercise, "muscle": muscle, "last_kg": round(ultimo, 1),
            "suggested_kg": round(ultimo, 1), "state": "nuevo",
            "reason": "Solo tienes una sesión con este ejercicio. Repite la misma carga para tener con qué comparar.",
        }
    return {
        "exercise": exercise, "muscle": muscle, "last_kg": round(ultimo, 1),
        "suggested_kg": round(ultimo + paso, 1), "state": "progresando",
        "reason": (
            f"Vienes subiendo: de {round(maxes[0],1)} a {round(ultimo,1)} kg. "
            f"Prueba {round(ultimo + paso,1)} kg manteniendo las repeticiones."
        ),
    }


async def _resumen_entrenador(user: dict) -> dict:
    uid = user["_id"]
    hoy = date.today()

    # Que musculos se han tocado y cuando
    ultimo_por_musculo = {}
    cursor = db.sessions.find({"user_id": uid, "status": "entrenado"}, {"date": 1, "muscles": 1})
    async for s in cursor:
        for m in s.get("muscles", []):
            n = m.get("muscle")
            if not n:
                continue
            d = s["date"]
            if n not in ultimo_por_musculo or d > ultimo_por_musculo[n]:
                ultimo_por_musculo[n] = d

    if not ultimo_por_musculo:
        return {
            "has_data": False,
            "headline": "Todavía no hay nada que analizar.",
            "detail": "Registra tu primera sesión y aquí verás qué peso te toca en cada ejercicio.",
            "next_muscles": [], "exercises": [], "warnings": [],
        }

    dias = {n: (hoy - date.fromisoformat(d)).days for n, d in ultimo_por_musculo.items()}
    descansados = sorted(dias.items(), key=lambda x: -x[1])

    # Proxima sesion: lo que lleva mas tiempo sin tocarse, con 2 dias de margen
    proximos = [n for n, d in descansados if d >= 2][:2] or [descansados[0][0]]

    # Consejo por ejercicio de esos musculos
    consejos = []
    for mus in proximos:
        nombres = set()
        async for l in db.setlogs.find({"user_id": uid, "muscle": mus, "done": True}, {"exercise_name": 1}):
            nombres.add(l["exercise_name"])
        for nom in sorted(nombres):
            c = await _consejo_ejercicio(uid, nom)
            if c:
                consejos.append(c)

    avisos = []
    for n, d in descansados:
        if d >= 14:
            avisos.append(f"Llevas {d} días sin entrenar {n}.")
    estancados = [c["exercise"] for c in consejos if c["state"] == "estancado"]
    if estancados:
        avisos.append("Estancado en: " + ", ".join(estancados) + ".")

    ultimo_entreno = min(dias.values())
    if ultimo_entreno == 0:
        titular = "Ya has entrenado hoy. Buen trabajo."
    elif ultimo_entreno == 1:
        titular = "Entrenaste ayer. Hoy toca " + " y ".join(proximos) + "."
    elif ultimo_entreno >= 7:
        titular = f"Llevas {ultimo_entreno} días sin entrenar. Vuelve suave."
    else:
        titular = "Hoy toca " + " y ".join(proximos) + "."

    return {
        "has_data": True,
        "headline": titular,
        "detail": f"Es lo que llevas más tiempo sin trabajar ({descansados[0][1]} días).",
        "next_muscles": proximos,
        "exercises": consejos[:6],
        "warnings": avisos,
    }


def _pedir_a_gemini(prompt: str):
    """Devuelve (texto, motivo) con motivo en {ok, bloqueado, error}.

    Distinguir "no puedo responder a eso" de "el servicio esta caido" importa:
    al usuario se le dice una cosa u otra.
    """
    import urllib.request
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
    )
    cuerpo = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 800,
            # gemini-2.5-flash razona antes de responder y ese razonamiento
            # consume el presupuesto de salida. Sin esto la respuesta llegaba
            # cortada a media frase.
            "thinkingConfig": {"thinkingBudget": 0},
        },
    }).encode()
    req = urllib.request.Request(url, data=cuerpo, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            data = json.loads(r.read())
    except Exception:
        logging.exception("Gemini no respondio")
        return None, "error"

    cands = data.get("candidates") or []
    if not cands:
        # Filtro de seguridad de Google: la pregunta no se responde.
        return None, "bloqueado"
    cand = cands[0]
    partes = (cand.get("content") or {}).get("parts") or []
    texto = "".join(p.get("text", "") for p in partes).strip()
    if not texto:
        return None, "bloqueado" if cand.get("finishReason") == "SAFETY" else "error"
    return texto, "ok"


def _contexto(user: dict, resumen: dict) -> str:
    lineas = [
        f"Objetivo: {user.get('goal') or 'sin especificar'}",
        f"Experiencia: {user.get('experience') or 'sin especificar'}",
        f"Frecuencia: {user.get('frequency') or 'sin especificar'}",
        f"Situación: {resumen['headline']}",
    ]
    if resumen["exercises"]:
        lineas.append("Cargas calculadas para hoy (son fijas, no las cambies):")
        for c in resumen["exercises"]:
            lineas.append(
                f"- {c['exercise']}: última {c['last_kg']} kg, "
                f"toca {c['suggested_kg']} kg ({c['state']})"
            )
    if resumen["warnings"]:
        lineas.append("Avisos: " + " ".join(resumen["warnings"]))
    return "\n".join(lineas)


class CoachAsk(BaseModel):
    question: str


@api.get("/coach")
async def coach(user: dict = Depends(get_current_user)):
    """Consejo del dia. Siempre responde, con o sin Gemini."""
    resumen = await _resumen_entrenador(user)
    resumen["disclaimer"] = DESCARGO
    resumen["ai"] = False

    if resumen["has_data"] and settings.GEMINI_API_KEY:
        prompt = (
            "Eres un entrenador de gimnasio hablando en español de España, "
            "directo y sin florituras. Con estos datos reales de la persona, "
            "escribe 2 o 3 frases sobre qué hacer hoy y por qué.\n"
            "Reglas: no inventes pesos ni cifras distintas de las dadas. "
            "No des consejo médico ni de nutrición. No uses emojis. "
            "No saludes ni te despidas.\n\n" + _contexto(user, resumen)
        )
        texto, _motivo = await asyncio.to_thread(_pedir_a_gemini, prompt)
        if texto:
            resumen["ai_text"] = texto
            resumen["ai"] = True
    return resumen


@api.post("/coach/ask")
async def coach_ask(body: CoachAsk, user: dict = Depends(get_current_user)):
    pregunta = body.question.strip()
    if not pregunta:
        raise HTTPException(status_code=400, detail="Escribe una pregunta")
    if len(pregunta) > 400:
        raise HTTPException(status_code=400, detail="La pregunta es demasiado larga")
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=503, detail="El entrenador con IA no está configurado"
        )

    resumen = await _resumen_entrenador(user)
    prompt = (
        "Eres un entrenador de gimnasio hablando en español de España, "
        "directo y breve (máximo 5 frases). Nada de vocativos tipo "
        "'campeón' ni exclamaciones. Responde a la pregunta usando "
        "solo los datos reales que te doy.\n"
        "Reglas: no inventes cifras. Si no tienes el dato, dilo. No des "
        "consejo médico ni de nutrición: para eso remite a un profesional. "
        "No uses emojis.\n\n"
        + _contexto(user, resumen)
        + f"\n\nPregunta: {pregunta}"
    )
    texto, motivo = await asyncio.to_thread(_pedir_a_gemini, prompt)
    if motivo == "bloqueado":
        # Casi siempre son preguntas de salud. Se responde con criterio en
        # vez de con un error tecnico que no ayuda a nadie.
        return {
            "answer": (
                "No puedo ayudarte con eso. Si tienes dolor o una molestia, "
                "no es cuestión de ajustar la carga: habla con un médico o "
                "un fisioterapeuta antes de seguir entrenando esa zona."
            ),
            "disclaimer": DESCARGO,
        }
    if not texto:
        raise HTTPException(
            status_code=503, detail="El entrenador no está disponible ahora mismo"
        )
    return {"answer": texto, "disclaimer": DESCARGO}


@api.get("/videos")
async def videos():
    """Videos de tecnica por ejercicio. Los que falten los resuelve el
    frontend abriendo una busqueda en YouTube."""
    out = {}
    async for e in db.exercises.find({"video_id": {"$exists": True, "$ne": None}}):
        out[e["name"]] = e["video_id"]
    return out


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


def read_exercise_videos() -> dict:
    """Mapa ejercicio -> id de YouTube. Fichero opcional."""
    path = Path(__file__).resolve().parent / "exercise_videos.json"
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8")).get("videos", {})
    except Exception:
        logging.exception("exercise_videos.json ilegible")
        return {}


async def sync_exercise_videos():
    """Aplica los videos del fichero a la coleccion.

    Corre en cada arranque, no solo en la siembra: anadir un video nuevo al
    JSON no deberia obligar a borrar la coleccion de ejercicios.
    """
    for nombre, vid in read_exercise_videos().items():
        await db.exercises.update_many({"name": nombre}, {"$set": {"video_id": vid}})


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
        await db.connections.delete_many(
            {"$or": [{"a_user_id": u["_id"]}, {"b_user_id": u["_id"]}]}
        )
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
    await db.connections.create_index([("a_user_id", 1), ("b_user_id", 1)])
    await db.connections.create_index("b_user_id")
    await db.password_resets.create_index("token_hash")
    # Mongo borra solo los tokens caducados: no acumulamos enlaces vivos.
    await db.password_resets.create_index("expires_at", expireAfterSeconds=0)
    await seed_exercises()
    await sync_exercise_videos()
    await seed_demo()


app.include_router(api)
