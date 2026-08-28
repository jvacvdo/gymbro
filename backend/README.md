# Backend — pendiente

Vacio a proposito. Este es el tramo que construye el agente de Emergent.

Stack objetivo: **FastAPI + MongoDB (motor)**, que es el stack nativo de Emergent.

## Modelos esperados

- `User` — email, username, password_hash, nombre, y perfil opcional
  (peso, altura, edad, sexo) + objetivo, experiencia y dias/semana del onboarding.
- `Exercise` — nombre, grupo muscular (ver `TAXONOMY` en el frontend).
- `Session` — usuario, fecha, estado (`entrenado` | `planificado`), lista de ejercicios.
- `SetLog` — sesion, ejercicio, serie, repeticiones, carga en kg.
- `TrainerClient` — relacion entrenador-cliente (pantallas de perfil).

## Endpoints esperados

| Metodo | Ruta | Uso en el frontend |
|---|---|---|
| POST | `/api/auth/register` | `RegisterScreen` (3 pasos) |
| POST | `/api/auth/login` | `LoginScreen` |
| GET | `/api/me` | `PerfilScreen` |
| GET | `/api/sessions?month=` | `HomeScreen` (calendario) |
| GET | `/api/sessions/next` | `HomeScreen` (proxima sesion) |
| POST | `/api/sessions` | `EntrenaScreen` / `WorkoutFlow` |
| POST | `/api/sessions/{id}/sets` | `WorkoutFlow` (registro de series) |
| GET | `/api/progress/muscle` | `HomeScreen` (historial muscular) |
| GET | `/api/progress` | `ProgresoScreen` |

La pestana social (`GymBroScreen`: conexiones, busqueda, sesion compartida)
queda fuera de la primera tanda.
