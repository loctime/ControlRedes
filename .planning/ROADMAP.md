# Roadmap: SocialPublisher Chrome Extension

**Generated:** 2026-04-27
**Phases:** 4 | **Requirements:** 23 | **Coverage:** 100% yes

## Phases

- [x] **Phase 1: Local Server Foundation** - Node.js server handles filesystem, Telegram bot, and file lifecycle
- [x] **Phase 2: Extension Skeleton** - Chrome MV3 extension installs, persists state, and connects to the server
- [ ] **Phase 3: Recording Pipeline** - HTML files render, record, and transcode to publish-ready MP4
- [ ] **Phase 4: Social Publishing** - Videos publish to Instagram and LinkedIn via active browser sessions

## Phase Overview

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|-----------------|
| 1 | Local Server Foundation | Server runs locally, watches folder, handles Telegram commands, and manages file lifecycle | INFRA-01, INFRA-02, TELE-01, TELE-02, FILE-01, FILE-02, FILE-03, FILE-04 | 4 criteria |
| 2 | Extension Skeleton | Extension installs in Chrome, survives SW restarts, connects to the server, and lets user configure folders and verify logins | INFRA-03, INFRA-04, SETUP-01, SETUP-02, SETUP-03 | 3 criteria |
| 3 | Recording Pipeline | Each HTML file is rendered in Chrome, recorded until animation ends, and transcoded to MP4 | REC-01, REC-02, REC-03, REC-04, REC-05, REC-06 | 4 criteria |
| 4 | Social Publishing | MP4 videos publish to Instagram and LinkedIn using active sessions; failures are isolated and captions are included | PUB-01, PUB-02, PUB-03, PUB-04 | 4 criteria |

## Phase Details

### Phase 1: Local Server Foundation
**Goal:** The Node.js server runs persistently on localhost:3333, watches `nuevas-publicaciones/` for new HTML files, polls Telegram for the "publica lo nuevo" command, and handles the full file lifecycle including caption reading, archiving, and metadata writing.
**UI hint:** no
**Depends on:** Nothing (first phase)
**Requirements:** INFRA-01, INFRA-02, TELE-01, TELE-02, FILE-01, FILE-02, FILE-03, FILE-04
**Success criteria:**
1. Running `node server.js` starts the server on localhost:3333, responds to `GET /status`, and immediately begins watching `nuevas-publicaciones/` - verified by placing an HTML file in the folder and calling `GET /files`.
2. Sending "publica lo nuevo" to the Telegram bot causes the server to respond with a list of pending HTML files and begin the pipeline sequence - verified by bot reply showing filenames.
3. After a simulated publish cycle, each processed HTML file is moved to `publicaciones-anteriores/` with a corresponding `.meta.json` file containing date, platform list, status per platform, and video specs - verified by inspecting the archive folder.
4. The Telegram bot sends incremental status messages during the pipeline ("Grabando post.html...", "Publicando en Instagram...", "Completado") - verified by reading the Telegram chat log.
**Plans:** 3 plans

Plans:

**Wave 1**
- [ ] 01-01-PLAN.md - Servidor Express + chokidar watcher + endpoints REST (GET /api/status, /api/files, /api/files/:filename)

**Wave 2** *(blocked on Wave 1 completion)*
- [ ] 01-02-PLAN.md - Bot Telegram: long-polling, comando "publica lo nuevo", guardias (vacio/activo/chat), status updates

**Wave 3** *(blocked on Wave 2 completion)*
- [ ] 01-03-PLAN.md - File lifecycle: readCaption, markComplete (archivado + .meta.json), runPipeline con Telegram updates

Cross-cutting constraints:
- `server/server.js` es el punto de integracion de todos los planes - modificado en cada wave
- El objeto `state` definido en Wave 1 fluye sin cambio de schema a Waves 2 y 3

### Phase 2: Extension Skeleton
**Goal:** The Chrome MV3 extension loads without errors, persists all pipeline state across Service Worker restarts via `chrome.storage.local`, communicates with the local server, and provides a minimal popup for server status and login verification.
**UI hint:** yes
**Depends on:** Phase 1
**Requirements:** INFRA-03, INFRA-04, SETUP-03
**Success criteria:**
1. The extension installs from the local `dist/` folder, the Service Worker activates, and `chrome://extensions` shows no errors - verified visually.
2. After killing and restarting the Service Worker (via `chrome://extensions` -> "inspect" -> terminate), the pipeline state (current phase, pending files list) survives and is readable from `chrome.storage.local` - verified in DevTools.
3. The popup clearly reflects that filesystem ownership stays on the local server and does not fail by presenting an unsupported folder-picker flow - verified visually in Chrome.
**Plans:** 3 plans

Plans:

**Wave 1**
- [ ] 02-01-PLAN.md - Extension MV3 base: manifest, service worker, chrome.storage.local state, server polling via alarms

**Wave 2** *(blocked on Wave 1 completion)*
- [ ] 02-02-PLAN.md - Popup de setup: elegir carpeta, persistir FileSystemDirectoryHandle, reconexion de permisos

**Wave 3** *(blocked on Wave 2 completion)*
- [ ] 02-03-PLAN.md - Verificacion basica de login para Instagram y LinkedIn, persistida en storage

### Phase 3: Recording Pipeline
**Goal:** For each HTML file in the queue, the extension renders it in Chrome at 1080x1920, records until the HTML emits `gsd:done` (or until the configurable timeout), appends a post-animation buffer, and produces a publish-ready MP4 via ffmpeg.wasm transcoding.
**UI hint:** no
**Depends on:** Phase 2
**Requirements:** REC-01, REC-02, REC-03, REC-04, REC-05, REC-06
**Success criteria:**
1. Loading a test HTML that emits `window.parent.postMessage({ type: "gsd:done" }, "*")` after 5s produces an MP4 file that is exactly (5s + buffer) long - verified by inspecting the output file duration.
2. Loading a test HTML that never emits `gsd:done` produces an MP4 that stops at the configured timeout (default 60s) - verified by file duration and absence of pipeline hang.
3. The output MP4 is H.264 + AAC at 1080x1920 resolution - verified with `ffprobe` or a video player showing metadata.
4. The pipeline processes all HTMLs in the queue sequentially without manual intervention - verified by dropping three HTML files and observing three MP4 outputs.
**Plans:** TBD

### Phase 4: Social Publishing
**Goal:** Each transcoded MP4 publishes to Instagram and LinkedIn sequentially using the active Chrome session, captions from `.caption.txt` are included in each post, and a single platform failure does not abort publishing to the remaining platforms.
**UI hint:** no
**Depends on:** Phase 3
**Requirements:** PUB-01, PUB-02, PUB-03, PUB-04
**Success criteria:**
1. Triggering the pipeline end-to-end from a Telegram "publica lo nuevo" command results in the video appearing as a Reel on Instagram with the correct caption - verified by viewing the Instagram profile.
2. The same video appears as a LinkedIn post with the correct caption from `.caption.txt` - verified by viewing the LinkedIn profile.
3. If Instagram publishing throws an error (e.g., DOM selector changed), the pipeline continues and publishes to LinkedIn, then reports the Instagram failure in Telegram - verified by simulating a broken Instagram content script.
4. The Telegram bot sends a final summary message listing each platform and its publish status (success or failure) - verified by reading the Telegram chat after a full run.
**Plans:** TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Local Server Foundation | 3/3 | Verified | 2026-04-28 |
| 2. Extension Skeleton | 3/3 | Verified | 2026-04-28 |
| 3. Recording Pipeline | 0/0 | Not started | - |
| 4. Social Publishing | 0/0 | Not started | - |

---
*Roadmap created: 2026-04-27*
*Updated: 2026-04-28 - Phase 2 verified in Chrome*
