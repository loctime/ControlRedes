# Requirements: SocialPublisher Chrome Extension

**Defined:** 2026-04-27
**Core Value:** Publicar en todas las redes con un solo mensaje de Telegram — sin abrir cada red, sin subir archivos a mano, sin fricción.

## v1 Requirements

### Infrastructure

- [ ] **INFRA-01**: El servidor Node.js local corre en segundo plano y expone una API REST en localhost:3333
- [ ] **INFRA-02**: El servidor inicia el watcher de `nuevas-publicaciones/` automáticamente al arrancar
- [ ] **INFRA-03**: La extensión Chrome (MV3) se instala localmente con todos los permisos declarados en manifest.json
- [ ] **INFRA-04**: El Service Worker mantiene su estado de trabajo en `chrome.storage.local` para sobrevivir interrupciones

### Setup

- [ ] **SETUP-01**: El usuario puede seleccionar la carpeta `nuevas-publicaciones/` desde el popup de la extensión (File System Access API)
- [ ] **SETUP-02**: El usuario puede reconectar la carpeta si el permiso se pierde entre sesiones del browser
- [ ] **SETUP-03**: La extensión verifica si el usuario está logueado en Instagram y LinkedIn antes de iniciar la publicación

### Telegram

- [ ] **TELE-01**: El servidor hace long-polling al bot de Telegram y recibe el comando "publica lo nuevo"
- [ ] **TELE-02**: El bot envía status updates durante el pipeline ("Grabando post.html...", "Publicando en Instagram...", "Completado ✓")

### Recording

- [ ] **REC-01**: La extensión carga cada HTML en Chrome para renderizarlo (tab oculto u Offscreen Document)
- [ ] **REC-02**: La grabación se detiene cuando el HTML emite `window.parent.postMessage({ type: "gsd:done" }, "*")`
- [ ] **REC-03**: La grabación incluye un buffer de segundos extra después del evento de fin de animación
- [ ] **REC-04**: Si el HTML no emite el evento, la grabación se detiene después de un timeout configurable (default: 60s)
- [ ] **REC-05**: El video se graba a resolución 1080x1920 (9:16 vertical) fija
- [ ] **REC-06**: El video WebM se transcodifica a MP4 H.264+AAC via ffmpeg.wasm antes de publicar

### File Management

- [ ] **FILE-01**: Cuando llega "publica lo nuevo", el servidor lista todos los HTMLs en `nuevas-publicaciones/`
- [ ] **FILE-02**: El caption de cada post se lee desde `[nombre].caption.txt` en la misma carpeta que el HTML
- [ ] **FILE-03**: Después de publicar, el HTML se mueve a `publicaciones-anteriores/`
- [ ] **FILE-04**: Se crea un archivo `.meta.json` junto al HTML movido con: fecha, plataformas publicadas, status por plataforma, video specs

### Publishing

- [ ] **PUB-01**: El video se publica en Instagram/Reels usando la sesión activa del browser
- [ ] **PUB-02**: El video se publica en LinkedIn usando la sesión activa del browser
- [ ] **PUB-03**: Si una plataforma falla, el pipeline continúa con las demás sin abortar
- [ ] **PUB-04**: El caption del `.caption.txt` se incluye como texto del post en cada plataforma

## v2 Requirements

### Publishing (redes adicionales)

- **PUB-V2-01**: Publicación en Facebook usando sesión activa del browser
- **PUB-V2-02**: Publicación en X/Twitter usando sesión activa del browser

### Telegram (funcionalidad extendida)

- **TELE-V2-01**: El bot reporta el error específico por plataforma cuando una publicación falla
- **TELE-V2-02**: El bot responde a consultas de historial ("últimas publicaciones")
- **TELE-V2-03**: El usuario puede elegir plataformas de destino por comando ("publica en instagram")

### Recording (formatos adicionales)

- **REC-V2-01**: Soporte para múltiples aspect ratios (16:9, 1:1) configurables por proyecto
- **REC-V2-02**: Soporte para grabación de HTML con CSS/JS animations sin canvas (tab-capture path completo)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Publicación programada (scheduling) | Complejidad alta, no es el core value — se publica al instante |
| APIs oficiales de redes sociales (OAuth) | Requiere setup complejo por plataforma, el usuario prefiere sesiones activas |
| Generación automática de captions (AI) | Agrega dependencia LLM antes de validar el loop principal |
| Preview del video antes de publicar | El video es grabación directa del HTML, se ve igual — no agrega valor |
| UI rica en el popup de extensión | El control es por Telegram; el popup solo necesita setup y status |
| Generación automática de HTMLs desde plantillas | Los HTMLs los crea el usuario manualmente |
| Multi-plataforma simultánea (paralelo) | Publicación secuencial es más segura para evadir detección de bots |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Pending |
| INFRA-02 | Phase 1 | Pending |
| INFRA-03 | Phase 2 | Pending |
| INFRA-04 | Phase 2 | Pending |
| SETUP-01 | Phase 2 | Pending |
| SETUP-02 | Phase 2 | Pending |
| SETUP-03 | Phase 2 | Pending |
| TELE-01 | Phase 1 | Pending |
| TELE-02 | Phase 1 | Pending |
| REC-01 | Phase 3 | Pending |
| REC-02 | Phase 3 | Pending |
| REC-03 | Phase 3 | Pending |
| REC-04 | Phase 3 | Pending |
| REC-05 | Phase 3 | Pending |
| REC-06 | Phase 3 | Pending |
| FILE-01 | Phase 1 | Pending |
| FILE-02 | Phase 1 | Pending |
| FILE-03 | Phase 1 | Pending |
| FILE-04 | Phase 1 | Pending |
| PUB-01 | Phase 4 | Pending |
| PUB-02 | Phase 4 | Pending |
| PUB-03 | Phase 4 | Pending |
| PUB-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-27*
*Last updated: 2026-04-27 — roadmap created (4 phases)*
