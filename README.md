# GymBro

App movil de entrenamiento. Frontend y backend construidos y conectados.

## Estado

| Parte | Estado |
|---|---|
| Inicio, Entrena, Progreso, Perfil | **Conectados** a datos reales del usuario |
| GymBro (social) | **Conectado** — buscar, solicitar, aceptar, ver sesion del companero |
| Modo Trainer | **Bloqueado** — pendiente del plan de pago |
| Planes | **Informativos** — sin pasarela de cobro todavia |

## Antes de aceptar usuarios reales

La base de datos es un MongoDB **local del contenedor**, sin backups ni
replica. Un reinicio normal la conserva, pero una reconstruccion del entorno
la borra sin recuperacion. **Hace falta apuntar `MONGO_URL` a una MongoDB
gestionada (Atlas) y configurar copias antes de abrir el registro.**

## Despliegue

Un `git push` **no** actualiza el preview de Emergent: su workspace es una
copia aparte. Hay que pedirle al agente que haga `git fetch` + `reset --hard
origin/main`, `yarn build` y `supervisorctl restart all`.

## Stack

- **Frontend:** React 18.3.1 + Vite
- **Backend (objetivo):** FastAPI + MongoDB

## Arranque

```bash
cd frontend
npm install
npm run dev
```

## Arquitectura del frontend — leer antes de tocar nada

El frontend viene de un design system entregado como prototipo, y **conserva su
patron original a proposito**: no es el estilo idiomatico de React moderno.

- Los archivos de `src/screens/` estan **portados byte a byte** desde el design
  system. Registran sus componentes en un objeto global `window.GB` en vez de
  usar `export`. No los conviertas a modulos ES: son la fuente de verdad del
  diseno y cualquier reescritura introduce deriva visual.
- `src/globals.js` define `window.React` y `window.GB` y **debe importarse el
  primero**. El orden de imports en `src/main.jsx` replica el orden de `<script>`
  del prototipo original y es significativo.
- `vite.config.js` usa el **runtime JSX clasico** (`React.createElement`) porque
  el prototipo se escribio contra React global + Babel standalone.
- El theming vive en `src/theme.css` como variables `--gb-*`, con modo claro y
  oscuro. Los tokens del design system (`src/ds/tokens/`) son la capa de marca.
  Ambas coexisten; no las fusiones.

## Pantallas

| Archivo | Contiene |
|---|---|
| `screens/shared.jsx` | Primitivas: `Icon`, `TabBar`, `Calendar`, `ProgressRing`, `Field`, `PrimaryBtn`, `LineChart`, `TAXONOMY` |
| `screens/auth.jsx` | `WelcomeScreen`, `LoginScreen`, `RegisterScreen` (3 pasos) |
| `screens/home.jsx` | `HomeScreen` — calendario, proxima sesion, historial muscular |
| `screens/entrena.jsx` | `EntrenaScreen`, `WorkoutFlow` — registro de series |
| `screens/progreso.jsx` | `ProgresoScreen` — graficas de carga |
| `screens/perfil.jsx` | `PerfilScreen`, `PlanScreen`, `TrainerView`, `ClientDashboard` |
| `screens/gymbro.jsx` | `GymBroScreen` — social, conexiones |

## Lo que falta

- **Modo Trainer**: `TrainerView` y `ClientDashboard` se retiraron porque
  mostraban clientes inventados. Recuperables del historial de git.
- **Pagos**: la pantalla de planes es informativa; no hay pasarela.
- **Escaneo de QR**: se muestra el codigo propio, pero no se escanea.
- **Notificaciones, Unidades y Privacidad**: avisan de que no estan listas.

## Licencia de fuentes

`frontend/src/ds/assets/fonts/` contiene **versiones Trial** de Suisse Intl y
GT Super. Sirven para desarrollo. **Antes de desplegar en publico hay que
comprar las licencias o sustituirlas.**
