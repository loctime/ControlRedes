# SocialPublisher — Chrome Extension

## What This Is

Extensión de Chrome que automatiza la publicación de contenido en redes sociales. El usuario crea archivos HTML (animaciones, slides, contenido dinámico) y los pone en una carpeta local; al mandarle "publica lo nuevo" a un bot de Telegram, la extensión toma cada HTML, lo renderiza, graba el video hasta que termina la animación, y publica en todas las redes conectadas (Instagram, Facebook, X/Twitter, LinkedIn) usando las sesiones activas del browser.

## Core Value

Publicar en todas las redes con un solo mensaje de Telegram — sin abrir cada red, sin subir archivos a mano, sin fricción.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] La extensión detecta y lee archivos HTML de la carpeta `nuevas-publicaciones/`
- [ ] La extensión hace polling al bot de Telegram y recibe el comando "publica lo nuevo"
- [ ] Cada HTML se renderiza en el browser y se graba como video hasta que termina la animación
- [ ] El video incluye un buffer de segundos extra al final para no cortar la animación
- [ ] El video se publica en Instagram/Reels usando la sesión activa de Chrome
- [ ] El video se publica en Facebook usando la sesión activa de Chrome
- [ ] El video se publica en X (Twitter) usando la sesión activa de Chrome
- [ ] El video se publica en LinkedIn usando la sesión activa de Chrome
- [ ] Una vez publicado, el HTML se mueve a `publicaciones-anteriores/` con metadata del post
- [ ] El bot de Telegram confirma cuando todos los posts fueron publicados exitosamente

### Out of Scope

- Preview del video antes de publicar — el video es grabación directa del HTML, se ve igual
- Selección de redes por publicación — siempre publica en todas las redes conectadas
- Generación automática de HTMLs desde plantillas — los HTMLs los crea el usuario manualmente
- Programación de publicaciones — se publica en el momento que llega el comando
- Publicación de imágenes estáticas — el formato de salida es siempre video

## Context

- El usuario crea los HTMLs manualmente (animaciones CSS/JS, slides, contenido mixto)
- Las cuentas de redes sociales ya están logueadas en Chrome — no se usan APIs externas
- El control total de la extensión es via Telegram bot (no hay UI de extensión para publicar)
- La detección del fin de animación requiere escuchar eventos CSS/JS o usar un timeout configurable
- Acceso al sistema de archivos local desde Chrome requiere File System Access API o un servidor nativo ligero

## Constraints

- **Compatibilidad**: Chrome extension Manifest V3 — sin eval, service workers en lugar de background pages
- **File system**: Chrome no puede leer el filesystem directamente sin permiso explícito del usuario (File System Access API) o un native messaging host
- **Social media**: Publicar vía sesión del browser es web scraping/automation — puede romperse si las redes cambian su UI; no se usan APIs oficiales
- **Video recording**: La grabación del HTML debe correr dentro del contexto del browser (MediaRecorder + canvas o tab capture)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Control via Telegram bot (no UI) | El usuario prefiere operar todo desde Telegram sin abrir Chrome | — Pending |
| Publicar con sesiones activas (no APIs) | Evita configurar OAuth/tokens por cada red social | — Pending |
| Carpeta entrada/salida para HTMLs | Flujo claro: nuevas-publicaciones → publicaciones-anteriores con metadata | — Pending |
| Grabar hasta fin de animación + buffer | Más natural que duración fija; el HTML define implícitamente su duración | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-27 after initialization*
