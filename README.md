# SpotPack 🐆

> Tu agenda de convenciones, sin complicaciones.

SpotPack digitaliza schedules de convenciones furry. Un organizador sube la imagen del schedule, la IA extrae las actividades, y los asistentes acceden como una web app interactiva — sin instalar nada, sin crear cuenta.

**[GOAL.md](GOAL.md)** — visión y objetivos  
**[PLAN.md](PLAN.md)** — plan de implementación  
**[docs/architecture.md](docs/architecture.md)** — arquitectura  
**[docs/api.md](docs/api.md)** — referencia de API

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Vite + Alpine.js 3 + Tailwind CSS v4 |
| Backend | Cloudflare Pages Functions |
| Storage | Cloudflare R2 (JSON files, zero egress) |
| AI | MiMo V2.5 via OpenCode Zen |
| Auth | API keys (SHA-256) |
| Testing | Vitest + Playwright |

**Sin base de datos.** Los eventos y actividades son archivos JSON en R2.

---

## Desarrollo local

### Requisitos

- Node.js 20+
- Cuenta Cloudflare (free tier)
- Wrangler CLI (`npm install -g wrangler`)

### Setup

```bash
git clone git@github.com:dshagaa/spotpack.git
cd spotpack

# Instalar dependencias
npm install

# Variables de entorno (crear .dev.vars)
echo "OPENCODE_API_KEY=tu-key" > .dev.vars

# Iniciar servidor de desarrollo (frontend + API)
npm run dev
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:5173/api/*` (Vite proxy)

### Comandos

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Dev server con HMR |
| `npm run build` | Build de producción |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | E2E tests (Playwright) |
| `npx wrangler pages dev` | Dev server con Pages Functions |

---

## Deploy

```bash
# Build
npm run build

# Deploy a Cloudflare Pages
npx wrangler pages deploy dist

# O conectá el repo a Cloudflare Pages para auto-deploy en push a main
```

### Secrets en producción

```bash
wrangler secret put OPENCODE_API_KEY
```

### R2 bucket

```bash
wrangler r2 bucket create spotpack-data
```

---

## API

Toda la API vive en `/api/*` (mismo origen que el frontend), dividida en tres secciones:

| Sección | Auth | Qué hace |
|---------|------|----------|
| **General** | Ninguno | Consultar eventos y actividades (público) |
| **Manage** | API key | Crear, editar, eliminar eventos/actividades. Importar schedules. |
| **Packs** | Usuario (F2) | Grupos colaborativos — no construido aún |

**Endpoints públicos (General):**
- `GET /api/events` — listar eventos
- `GET /api/events/{id}` — ver evento con actividades

**Endpoints con API key (Manage):**
- `POST /api/events` — crear evento
- `PATCH /api/events/{id}` — editar evento
- `DELETE /api/events/{id}` — eliminar evento (maintainer)
- `POST /api/events/{id}/items` — agregar actividad manualmente
- `PATCH /api/events/{id}/items/{itemId}` — editar actividad
- `DELETE /api/events/{id}/items/{itemId}` — eliminar actividad (maintainer)
- `POST /api/import` — importar schedule desde imagen
- `POST /api/keys` — crear API key (maintainer)

Ver [docs/api.md](docs/api.md) para la referencia completa.

---

## Arquitectura de caché

```
localStorage (30 min) → CDN edge (5 min) → Pages Function → R2
```

- **1ª visita:** fetch de R2 → guarda en CDN + localStorage
- **2ª visita (< 30 min):** localStorage, cero red
- **Visitas siguientes:** CDN edge, sin pegar al origen

Para 5k usuarios concurrentes, el 99% de las requests nunca llegan a R2.

---

## Estructura del proyecto

```
spotpack/
├── index.html              # SPA entry point
├── src/                    # Frontend (Alpine.js)
│   ├── main.js
│   ├── api.js
│   ├── store.js
│   ├── lib/
│   └── components/
├── functions/              # API (Pages Functions)
│   ├── api/
│   └── _shared/
├── public/                 # Static assets + PWA
├── docs/                   # Documentación
├── prototype/              # Prototipo original (referencia)
├── wrangler.toml
├── GOAL.md                 # Visión y objetivos
├── PLAN.md                 # Plan de implementación
└── AGENTS.md               # Contexto para agentes AI
```

---

## Color palette

| Color | Hex | Uso |
|-------|-----|-----|
| Fondo | `#1A1025` | Página |
| Superficie | `#2D1B3D` | Cards, modales |
| Primario | `#E87D3E` | Botones, acentos (jaguar orange) |
| Peligro | `#F44336` | +18, eliminar |
| Advertencia | `#FFC107` | +16, conflictos |
| Éxito | `#4CAF50` | General, conectado |

---

## Licencia

MIT © Dshagaa
