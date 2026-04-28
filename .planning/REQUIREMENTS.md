# Requirements: SocialPublisher Chrome Extension

**Defined:** 2026-04-27
**Core Value:** Publicar en todas las redes con un solo mensaje de Telegram - sin abrir cada red, sin subir archivos a mano, sin friccion.

## v1 Requirements

### Infrastructure

- [x] **INFRA-01**: El servidor Node.js local corre en segundo plano y expone una API REST en localhost:3333
- [x] **INFRA-02**: El servidor inicia el watcher de `nuevas-publicaciones/` automaticamente al arrancar
- [x] **INFRA-03**: La extension Chrome (MV3) se instala localmente con todos los permisos declarados en manifest.json
- [x] **INFRA-04**: El Service Worker mantiene su estado de trabajo en `chrome.storage.local` para sobrevivir interrupciones

### Setup

- [ ] **SETUP-01**: El usuario puede seleccionar la carpeta `nuevas-publicaciones/` desde el popup de la extension (File System Access API)
- [ ] **SETUP-02**: El usuario puede reconectar la carpeta si el permiso se pierde entre sesiones del browser
- [x] **SETUP-03**: La extension verifica si el usuario esta logueado en Instagram y LinkedIn antes de iniciar la publicacion

### Telegram

- [x] **TELE-01**: El servidor hace long-polling al bot de Telegram y recibe el comando "publica lo nuevo"
- [x] **TELE-02**: El bot envia status updates durante el pipeline ("Grabando post.html...", "Publicando en Instagram...", "Completado ✓")

### Recording

- [ ] **REC-01**: La extension carga cada HTML en Chrome para renderizarlo (tab oculto u Offscreen Document)
- [ ] **REC-02**: La grabacion se detiene cuando el HTML emite `window.parent.postMessage({ type: "gsd:done" }, "*")`
- [ ] **REC-03**: La grabacion incluye un buffer de segundos extra despues del evento de fin de animacion
- [ ] **REC-04**: Si el HTML no emite el evento, la grabacion se detiene despues de un timeout configurable (default: 60s)
- [ ] **REC-05**: El video se graba a resolucion 1080x1920 (9:16 vertical) fija
- [ ] **REC-06**: El video WebM se transcodifica a MP4 H.264+AAC via ffmpeg.wasm antes de publicar

### File Management

- [x] **FILE-01**: Cuando llega "publica lo nuevo", el servidor lista todos los HTMLs en `nuevas-publicaciones/`
- [x] **FILE-02**: El caption de cada post se lee desde `[nombre].caption.txt` en la misma carpeta que el HTML
- [x] **FILE-03**: Despues de publicar, el HTML se mueve a `publicaciones-anteriores/`
- [x] **FILE-04**: Se crea un archivo `.meta.json` junto al HTML movido con: fecha, plataformas publicadas, status por plataforma, video specs

### Publishing

- [ ] **PUB-01**: El video se publica en Instagram/Reels usando la sesion activa del browser
- [ ] **PUB-02**: El video se publica en LinkedIn usando la sesion activa del browser
- [ ] **PUB-03**: Si una plataforma falla, el pipeline continua con las demas sin abortar
- [ ] **PUB-04**: El caption del `.caption.txt` se incluye como texto del post en cada plataforma

## v2 Requirements

### Publishing (redes adicionales)

- **PUB-V2-01**: Publicacion en Facebook usando sesion activa del browser
- **PUB-V2-02**: Publicacion en X/Twitter usando sesion activa del browser

### Telegram (funcionalidad extendida)

- **TELE-V2-01**: El bot reporta el error especifico por plataforma cuando una publicacion falla
- **TELE-V2-02**: El bot responde a consultas de historial ("ultimas publicaciones")
- **TELE-V2-03**: El usuario puede elegir plataformas de destino por comando ("publica en instagram")

### Recording (formatos adicionales)

- **REC-V2-01**: Soporte para multiples aspect ratios (16:9, 1:1) configurables por proyecto
- **REC-V2-02**: Soporte para grabacion de HTML con CSS/JS animations sin canvas (tab-capture path completo)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Publicacion programada (scheduling) | Complejidad alta, no es el core value - se publica al instante |
| APIs oficiales de redes sociales (OAuth) | Requiere setup complejo por plataforma, el usuario prefiere sesiones activas |
| Generacion automatica de captions (AI) | Agrega dependencia LLM antes de validar el loop principal |
| Preview del video antes de publicar | El video es grabacion directa del HTML, se ve igual - no agrega valor |
| UI rica en el popup de extension | El control es por Telegram; el popup solo necesita setup y status |
| Generacion automatica de HTMLs desde plantillas | Los HTMLs los crea el usuario manualmente |
| Multi-plataforma simultanea (paralelo) | Publicacion secuencial es mas segura para evadir deteccion de bots |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Delivered |
| INFRA-02 | Phase 1 | Delivered |
| INFRA-03 | Phase 2 | Delivered |
| INFRA-04 | Phase 2 | Delivered |
| SETUP-01 | Phase 2 | Deferred to architecture review |
| SETUP-02 | Phase 2 | Deferred to architecture review |
| SETUP-03 | Phase 2 | Delivered |
| TELE-01 | Phase 1 | Delivered |
| TELE-02 | Phase 1 | Delivered |
| REC-01 | Phase 3 | Pending |
| REC-02 | Phase 3 | Pending |
| REC-03 | Phase 3 | Pending |
| REC-04 | Phase 3 | Pending |
| REC-05 | Phase 3 | Pending |
| REC-06 | Phase 3 | Pending |
| FILE-01 | Phase 1 | Delivered |
| FILE-02 | Phase 1 | Delivered |
| FILE-03 | Phase 1 | Delivered |
| FILE-04 | Phase 1 | Delivered |
| PUB-01 | Phase 4 | Pending |
| PUB-02 | Phase 4 | Pending |
| PUB-03 | Phase 4 | Pending |
| PUB-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0 yes

---
*Requirements defined: 2026-04-27*
*Last updated: 2026-04-28 - Phase 2 delivered with filesystem ownership clarified; pending live Chrome verification*
