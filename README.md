# SpotPack 🐆

> Tu agenda de convenciones, sin complicaciones.

SpotPack digitaliza schedules de convenciones furry. Un organizador sube la imagen del schedule, la IA extrae las actividades, y los asistentes acceden como una web app interactiva.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Vite + Svelte 5 + Tailwind CSS v4 |
| Backend | Cloudflare Pages Functions |
| Storage | Cloudflare R2 (JSON, zero egress) |
| AI | MiMo V2.5 via OpenCode Zen |

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/
```

## API

Ver [docs/api.md](docs/api.md) — 3 secciones: General (público), Manage (API key), Packs (Fase 2).

## Licencia

MIT © dshagaa
