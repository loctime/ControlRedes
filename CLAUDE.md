# CLAUDE.md — ControlRedes

Chrome Extension + Node.js local server que publica videos (renderizados desde HTML) en Instagram y LinkedIn via comandos de Telegram. También tiene un sistema de creación de contenido HTML para redes sociales.

---

## Estructura del proyecto

```
ControlRedes/
├── server/                  ← Node.js/Express en localhost:3333
├── extension/               ← Chrome Extension MV3
├── context_ptojects/        ← Contexto de productos para generación de contenido
│   ├── SKILL_HTML_ADDS.md
│   ├── SKILL_HTML_CONTENIDO.md
│   ├── nuevas-publicaciones/
│   ├── publicaciones-anteriores/
│   └── [Producto]/info.md, colores.md, capturas/
└── .planning/
```

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

### Cuándo usarlo

- Usuario pide un ad, reel, carrusel, contenido educativo o publicidad para IG/LinkedIn.

### Dos skills disponibles

- **`context_ptojects/SKILL_HTML_ADDS.md`** → publicidades (objetivo: venta/conversión)
- **`context_ptojects/SKILL_HTML_CONTENIDO.md`** → contenido orgánico (objetivo: valor/educación)

En caso de duda preguntar: *"¿Querés que sea publicitario o contenido de valor?"*

### Cómo arrancar

1. Leer el skill correspondiente
2. Identificar el producto (si no lo dijo, listar carpetas en `context_ptojects/` y preguntar)
3. Leer `context_ptojects/[Producto]/info.md` y `colores.md`
4. Hacer mínimas preguntas → generar HTML + caption en un solo paso
5. Guardar en `context_ptojects/nuevas-publicaciones/[Producto]/`  
   Nombre: `[producto]-[tipo]-[tema]-[plataforma]-v[número].html` + `.txt`

### Fast Context Policy (control de costos)

- Leer SOLO `info.md` y `colores.md` del producto
- NO leer `capturas/` salvo que el usuario lo pida explícitamente
- NO leer `.planning/*` para tareas creativas
- NO leer ejemplos históricos salvo pedido explícito
- Máximo una pregunta de clarificación, luego generar

### Reglas generales de HTML

- Dimensiones: **1080×1920px** sin excepción
- Sin assets locales — solo Google Fonts, SVG e imágenes base64
- Siempre incluir la señal `gsd:done` en el JS

---

*Project initialized: 2026-04-27*
