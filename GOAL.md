# SpotPack — Goals & Vision

> ¿Qué estamos construyendo, para quién, y por qué?

---

## Problema

Las convenciones furry publican sus schedules como imágenes (PNG/JPEG). Cada asistente tiene que:

- Hacer zoom y scroll en una imagen enorme en el celular
- Recordar de memoria en qué salón y a qué hora está cada actividad que le interesa
- Coordinar con amigos manualmente ("¿a cuál vas? ¿dónde estás?")

No hay una forma liviana, rápida y gratuita de consultar el schedule y armar una agenda personal.

---

## Solución

**SpotPack** digitaliza el schedule de la convención en una web app progresiva:

1. **Un organizador** sube la imagen del schedule → IA extrae los datos
2. **Todos los asistentes** acceden al schedule como una web app interactiva
3. Cada persona marca las actividades que le interesan (agenda personal)
4. A futuro: grupos de amigos comparten sus agendas para coordinar

Sin app nativa, sin cuenta obligatoria, sin costo.

---

## Usuarios

| Rol | Necesidad | Frecuencia |
|-----|-----------|------------|
| **Asistente** | Ver el schedule, filtrar por día/sala/categoría, marcar actividades | Cada 30-60 min durante la convención |
| **Organizador** | Subir la imagen del schedule, crear el evento, gestionar API keys | 1-2 veces por evento |
| **Amigo (futuro)** | Ver la agenda de su grupo, saber dónde está cada uno | Cada 15-30 min durante la convención |

---

## Principios

1. **Cero fricción.** Abrís la URL y ves el schedule. Sin registro, sin app, sin login.
2. **Carga instantánea.** La información se cachea en el dispositivo. La segunda visita no toca la red.
3. **Resiste 5k usuarios concurrentes.** Sin degradación, sin costos sorpresa.
4. **Mobile-first.** El 95% del uso es en celular, en una convención, con señal irregular.
5. **Offline-friendly.** Si perdés señal, tu agenda sigue funcionando con datos cacheados.
6. **Costo $0/mes.** Infraestructura gratuita para el volumen esperado (Cloudflare free tier).
7. **Privacidad.** Tu agenda personal vive en tu dispositivo (localStorage). No hay tracking, no hay cuentas.

---

## Scope

### 🔴 Fase 1: Solo Mode (MVP — en plan actual)

El asistente individual. Sin colaboración.

| Feature | Descripción |
|---------|-------------|
| Explorar eventos | Lista de convenciones disponibles |
| Ver schedule | Actividades por día, filtros (categoría, sala, +18) |
| Vista grilla | Room × time matrix |
| Importar schedule | Organizador sube imagen → IA extrae → items |
| Crear/editar/eliminar evento | Organizador gestiona eventos |
| Agenda personal | Marcar/desmarcar actividades (localStorage) |
| Conflict detection | Avisa si dos actividades se solapan |
| Offline | Datos cacheados, service worker |
| API keys | Organizadores autentican con x-api-key |

**Stack:** Cloudflare Pages + Pages Functions + R2 + MiMo V2.5  
**Costo:** $0/mes  
**Usuarios:** 5k concurrentes

### 🟢 Fase 2: Group Mode (documentado, no construido)

El grupo de amigos. Colaboración en tiempo real.

> ⚠️ **No se construye ahora.** Requiere auth de usuarios, base de datos relacional y sync en tiempo real.
> Es un proyecto separado que se planeará cuando la Fase 1 esté en producción.

Ver sección [Group Mode](#group-mode-fase-2) abajo para el análisis completo.

---

## Métricas de éxito (Fase 1)

- [ ] Un organizador puede crear un evento y subir una imagen de schedule
- [ ] 5k asistentes pueden ver el schedule simultáneamente sin degradación
- [ ] La segunda carga de la página no hace requests de red (cache localStorage)
- [ ] Un asistente puede filtrar, buscar, y marcar su agenda sin conexión
- [ ] Costo de infraestructura: $0/mes
- [ ] Tiempo de carga inicial: < 2 segundos

---

## No-Goals (explícitamente fuera de scope)

- ❌ App nativa (iOS/Android). Es una PWA.
- ❌ Login de asistentes. No hay cuentas de usuario en Fase 1.
- ❌ Notificaciones push.
- ❌ Sincronización entre dispositivos del mismo usuario.
- ❌ Edición colaborativa de schedules.
- ❌ Analytics o tracking de usuarios.
- ❌ Monetización (anuncios, premium, suscripciones).

---

## Group Mode (Fase 2)

> 📋 Documentado para referencia futura. No se construye ahora.

### Visión

Un grupo de amigos crea un "Pack" con un código de invitación. Cada miembro comparte su agenda. El grupo ve un timeline unificado con las actividades de todos, y puede consultar "¿dónde está X ahora mismo?".

### Funcionalidades planeadas

| Feature | Descripción |
|---------|-------------|
| Crear Pack | Un usuario crea un grupo, recibe un código de invitación |
| Unirse a Pack | Otros usuarios ingresan el código y se suman |
| Agenda compartida | Timeline unificado con colores por miembro |
| "¿Dónde está X?" | Consultar la actividad actual de un miembro específico |
| Conflictos grupales | Alertas si dos miembros tienen actividades que se solapan |

### Impacto arquitectónico

Group Mode requiere capacidades que la Fase 1 no necesita:

| Necesidad | Fase 1 | Fase 2 |
|-----------|--------|--------|
| Identidad de usuario | ❌ No existe | ✅ Login/registro |
| Attending state | localStorage | Servidor (visible para otros) |
| Sincronización | No aplica | Near-real-time |
| Grupos/Packs | No existe | Crear, unirse, miembros |
| Base de datos | JSON en R2 | Relacional (D1 o PostgreSQL) |
| Real-time | No necesita | WebSocket, polling o Realtime |

### Posibles stacks para Fase 2

**Opción A: Cloudflare D1 + polling**
- D1 (SQLite) para packs, miembros, attending
- Frontend pollea cada 30s
- Sigue en Cloudflare, costo mínimo
- Más simple, menos "real-time"

**Opción B: Cloudflare Durable Objects**
- Un DO por pack, WebSocket nativo
- Real-time real, estado en memoria
- Más complejo, arquitectura de actores

**Opción C: Supabase para la capa colaborativa**
- Auth + Realtime + PostgreSQL
- Mantiene R2/Cloudflare para los eventos
- $25/mes, dos providers

### API endpoints planeados

**Privacy:** Todos los packs son privados. Solo ves los packs donde sos miembro. La única forma de entrar a un pack es con el código de invitación.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/packs` | user | Listar mis packs (donde soy miembro) |
| POST | `/api/packs` | user | Crear pack |
| GET | `/api/packs/{id}` | member | Ver pack con miembros y agendas |
| PATCH | `/api/packs/{id}` | owner | Editar pack |
| DELETE | `/api/packs/{id}` | owner | Eliminar pack |
| POST | `/api/packs/join?pack-code={code}` | user | Unirse con código de invitación |
| POST | `/api/packs/{id}/import-agenda` | member | Importar "mi agenda" existente al pack |
| DELETE | `/api/packs/{id}/members/{userId}` | owner | Echar miembro |
| DELETE | `/api/packs/{id}/members/me` | member | Salir del pack |
| GET | `/api/packs/{id}/agenda` | member | Agenda colaborativa (merge) |
| POST | `/api/packs/{id}/attending` | member | Marcar "voy" |
| DELETE | `/api/packs/{id}/attending/{itemId}` | member | Desmarcar |

### Preguntas abiertas (para resolver antes de construir)

- ¿Los usuarios se autentican con email, alias, o magic link?
- ¿La agenda compartida es opcional? (¿puedo estar en un Pack sin compartir todo?)
- ¿Un usuario puede estar en múltiples Packs?
- ¿El creador del Pack es admin? ¿Puede echar miembros?
- ¿Los Packs persisten entre convenciones o son efímeros?
