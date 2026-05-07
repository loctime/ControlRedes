# CLAUDE.md — ControlRedes

Chrome Extension + Node.js local server que publica videos (renderizados desde HTML) en Instagram y LinkedIn via comandos de Telegram. También tiene un sistema de creación de contenido HTML para redes sociales.

---

## Estructura del proyecto

```
ControlRedes/
├── server/                        ← Node.js/Express en localhost:3333
├── extension/                     ← Chrome Extension MV3
├── dist/                          ← Build output de la extensión
├── audio-library/                 ← Audios genéricos reutilizables
│
├── context_ptojects/              ← Todo el contexto/fuente de cada producto (NO se publica desde aquí)
│   ├── SKILL_HTML_ADDS.md         ← Skill para generar publicidades
│   ├── SKILL_HTML_CONTENIDO.md    ← Skill para generar contenido orgánico
│   ├── ControlAudit/
│   │   ├── info.md, colores.md
│   │   └── ejemplos_ads/          ← Referencia visual (no son publicaciones)
│   └── ControlBun/
│       ├── info.md, colores.md, controlbun.md
│       ├── uploads/               ← Imágenes de referencia del producto
│       ├── scraps/                ← Borradores
│       └── app/                   ← App React de ControlBun (video.html, placas.html, JSX, CSS)
│           ├── video.html         ← Depende de los JSX de esta misma carpeta
│           ├── placas.html        ← Depende de los JSX de esta misma carpeta
│           ├── animations.jsx, brand.css, logo.jsx, etc.
│
├── nuevas-publicaciones/          ← ÚNICA zona del watcher — PLANA, sin subcarpetas
│   └── [producto]-[tipo]-[tema]-[plataforma]-v[N].html  ← HTML auto-contenido listo para publicar
│       [producto]-[tipo]-[tema]-[plataforma]-v[N].caption.txt
│
├── publicaciones-anteriores/      ← Posts ya publicados (HTML + .meta.json)
├── videos-generados/              ← MP4 generados
└── .planning/
```

### Dos tipos de HTML, una sola zona de publicación

**Flow A — Claude genera (auto-contenido):** HTML sin dependencias externas, se pone directo en `nuevas-publicaciones/`.

**Flow B — Claude Design (con dependencias):** HTML que usa JSX/CSS de `context_ptojects/ControlBun/app/`. Los archivos fuente viven en `app/`. Cuando esté listo para publicar, el HTML debe referenciar sus deps via URL absoluta del servidor local:
```html
<link rel="stylesheet" href="http://localhost:3333/project/context_ptojects/ControlBun/app/brand.css"/>
<script type="text/babel" src="http://localhost:3333/project/context_ptojects/ControlBun/app/animations.jsx"></script>
```
Luego copiás solo el HTML a `nuevas-publicaciones/` — el servidor sirve las deps automáticamente.

---

## Modo 1 — Desarrollo (Chrome Extension + Server)

### GSD Workflow

1. `/gsd-discuss-phase N` — gather context and clarify approach before planning
2. `/gsd-plan-phase N` — break the phase into executable plans
3. `/gsd-execute-phase N` — execute plans with atomic commits
4. `/gsd-verify-work` — verify phase delivered what it promised

**Planning mode:** `yolo` / `coarse` granularity  
**Current state:** `.planning/STATE.md` | **Roadmap:** `.planning/ROADMAP.md`

### Arquitectura

- **`server/`** — Node.js/Express en `localhost:3333`. Filesystem watcher, Telegram bot long-polling, lifecycle de archivos, ffmpeg.wasm transcoding.
- **`extension/`** — Chrome MV3. SW state machine polling `/api/status`, Offscreen Document para renderizar HTML + grabar video, content scripts para automatizar IG/LinkedIn.

**Data flow:**
```
Telegram "publica lo nuevo"
  → Server → Extension SW → Offscreen Document (HTML → MP4)
  → Server → Content Scripts (publica en IG/LinkedIn)
  → Server (archiva HTML, escribe .meta.json) → Telegram confirmación
```

**Server API:**
- `GET /api/status` — posts pendientes y estado del pipeline
- `GET /publicaciones/:filename` — sirve HTMLs para la extensión
- `POST /api/video-ready` — extensión sube MP4 transcodificado
- `POST /api/publish-complete` — extensión reporta resultado

### Tech Stack

**Server:** Node.js, Express, dotenv, chokidar, node-telegram-bot-api  
**Extension:** MV3, `chrome.storage.local`, `chrome.alarms`, `chrome.offscreen`, `chrome.tabCapture`, `@ffmpeg/ffmpeg` v0.12.x

### Restricciones críticas

- **Service Worker muere a los ~30s** — todo el estado DEBE persistirse en `chrome.storage.local` antes de cada paso.
- **MediaRecorder solo produce WebM** — transcoding a MP4 con ffmpeg.wasm es obligatorio (Instagram rechaza WebM).
- **HTML debe disparar `gsd:done`** — `window.parent.postMessage({ type: "gsd:done" }, "*")` al terminar; fallback de 60s.
- **Un solo Offscreen Document** — Chrome solo permite uno por extensión.
- **Telegram polling mínimo** — 6 segundos en MV3.
- **Publicación secuencial** — una plataforma a la vez; aislar fallos sin bloquear las demás.

### Audio Ready Gate (NO negociable)

Cuando haya audio embebido, NO enviar `gsd:done` hasta que el audio esté listo:

```javascript
let audioReady = false;
buildAudio().then(b64 => {
  window.__GSD_EMBED_AUDIO_BASE64 = b64;
  window.__GSD_EMBED_AUDIO_MIME = 'audio/wav';
  audioReady = true;
});
setTimeout(() => {
  const wait = () => {
    if (audioReady) { window.parent.postMessage({ type: 'gsd:done' }, '*'); }
    else { setTimeout(wait, 100); }
  };
  wait();
}, DURACION_MS);
```

### File Structure Convention

```
nuevas-publicaciones/post.html + post.caption.txt
publicaciones-anteriores/post.html + post.meta.json
```
`.meta.json`: `{ date: ISO8601, platforms: string[], status: "success"|"partial"|"failed", videoSpecs: { width, height, fps, codec, duration } }`

---

## Modo 2 — Creación de contenido HTML para redes

Los skills `html-ads` y `html-contenido` manejan la técnica. Este bloque solo agrega el contexto específico de ControlRedes.

### Contexto de producto disponible

```
context_ptojects/
├── ControlAudit/   → info.md, colores.md
└── ControlBun/     → info.md, colores.md, controlbun.md
```

Si el usuario no dice qué producto, listar las carpetas y preguntar. Si lo dice, ir directo a leer `info.md` y `colores.md` de esa carpeta — nada más.

**Fast Context Policy:**
- Leer SOLO `info.md` + `colores.md` del producto pedido
- NO leer `capturas/`, `ejemplos_ads/`, ni `.planning/` salvo pedido explícito

### Dónde guardar

```
nuevas-publicaciones/
├── [producto]-[tipo]-[tema]-[plataforma]-v[N].html
└── [producto]-[tipo]-[tema]-[plataforma]-v[N].caption.txt
```

Ejemplo: `controlaudit-ads-accidentes-instagram-v2.html`

---

*Project initialized: 2026-04-27*
