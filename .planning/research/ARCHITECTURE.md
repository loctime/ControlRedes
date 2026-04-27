# Architecture Research

## Component Overview

The system has two distinct runtime boundaries that must cooperate: the Chrome extension and a minimal local Node.js server. Understanding why both are necessary drives every other architectural decision.

### Chrome Extension Components

| Component | File | Responsibility | Can access DOM? | Persistent? |
|-----------|------|---------------|----------------|-------------|
| Service Worker | `background.js` | Central orchestrator. Receives messages from all components, drives the state machine (poll Telegram → dispatch render jobs → track publish status → confirm). | NO | No — wakes on events |
| Offscreen Document | `offscreen.html` + `offscreen.js` | Loads a local HTML file into a hidden iframe, waits for animation-end signal, captures the iframe's content via `MediaRecorder` + `captureStream()`, produces a Blob. Only one offscreen doc can exist at a time. | YES | Lives until explicitly closed |
| Content Scripts | `inject-instagram.js`, `inject-facebook.js`, etc. | Injected into the live social media tab. Automates the UI: clicks "New Post", drags the video file, fills caption, clicks Publish. Reads DOM, triggers events. | YES (only that tab's DOM) | Lives while tab exists |
| Side Panel / Popup | `sidepanel.html` | Status display only — shows current job queue, last publish results, connection state to local server. No control logic here. | YES (own document) | Lives while open |
| `manifest.json` | — | Declares all permissions, content script match patterns, offscreen reason, host permissions for social media sites and Telegram API. | — | — |

### Local Node.js Server (required — see section below)

| Component | Responsibility |
|-----------|---------------|
| `server.js` (Express, port 3333) | Watches `nuevas-publicaciones/` with `chokidar`. Exposes REST endpoints the extension polls. Moves files to `publicaciones-anteriores/` and writes metadata JSON. Handles file reads and returns base64 or data URLs back to the extension. |
| `telegram-poller.js` | Long-polls the Telegram Bot API (`getUpdates` loop). When "publica lo nuevo" arrives, sets a flag/queue that the extension reads via the REST endpoint. |

---

## Data Flow

The full pipeline, step by step:

```
1. USER sends "publica lo nuevo" to Telegram bot
       |
       v
2. LOCAL SERVER (telegram-poller.js) receives update via long-poll
   → Sets pendingPublish = true in server state
       |
       v
3. EXTENSION SERVICE WORKER (polls /api/status every 5s)
   → Detects pendingPublish = true
   → Calls GET /api/files → receives list of HTML filenames in nuevas-publicaciones/
       |
       v
4. SERVICE WORKER begins job loop: for each HTML file:
   a. Calls GET /api/file/:name → receives file content as data URL
   b. Creates offscreen document (if not already alive)
   c. Sends message { action: "render", dataUrl: "..." } to offscreen doc
       |
       v
5. OFFSCREEN DOCUMENT
   a. Creates hidden <iframe>, sets src to the data URL (or blob URL)
   b. Waits for animation-end signal:
      - Listens for window.postMessage({ type: "animationDone" }) from iframe
      - OR waits for configurable timeout (e.g. 10s) as fallback
   c. Calls iframe.contentWindow to get the MediaStream:
      - Uses HTMLCanvasElement.captureStream() if the HTML renders to canvas
      - OR uses chrome.tabCapture is NOT available in offscreen — must use canvas capture
   d. Starts MediaRecorder on the stream → collects chunks
   e. On animation-end + buffer delay → stops recorder → assembles Blob
   f. Sends { action: "recordingDone", blob: <ArrayBuffer> } back to service worker
       |
       v
6. SERVICE WORKER receives the video blob (as ArrayBuffer)
   → Posts it to local server: POST /api/save-video with filename
   → Local server writes MP4 to a temp folder, returns { videoPath }
       |
       v
7. SERVICE WORKER triggers publish sequence for each network:
   a. chrome.tabs.create({ url: "https://www.instagram.com" }) — or reuse existing tab
   b. Waits for tab to be "complete"
   c. chrome.scripting.executeScript({ tabId, files: ["inject-instagram.js"] })
      → Content script runs, automates the upload UI using the saved video path
         (video is fetched from local server as blob inside the content script)
   d. Content script postMessages progress/done back to service worker
   e. Repeat for Facebook, Twitter/X, LinkedIn
       |
       v
8. SERVICE WORKER calls POST /api/move-file to archive the HTML
   → Local server moves nuevas-publicaciones/foo.html → publicaciones-anteriores/foo.html
   → Writes foo.json metadata: { publishedAt, networks, videoPath }
       |
       v
9. LOCAL SERVER sends Telegram confirmation message via Bot API:
   "Publicado: foo.html → Instagram, Facebook, X, LinkedIn ✓"
```

---

## Chrome Extension Component Map

This table maps each concern to the exact Chrome mechanism that handles it. This is the most important section — get this wrong and you hit MV3 walls.

| Concern | Component | Mechanism | Constraint / Notes |
|---------|-----------|-----------|-------------------|
| Polling Telegram | Local server (Node.js) | `setInterval` + `fetch` to Telegram Bot API | Service workers sleep after 30s idle — cannot do reliable polling. The server stays alive. |
| Detecting new HTML files | Local server | `chokidar` filesystem watcher | Chrome has no filesystem watch API. `File System Access API` requires a user gesture to open a directory picker — not automatable headlessly. |
| Persisting command state between SW wakes | Service worker | `chrome.storage.local` | SW can die mid-job; store job queue in storage so it resumes on next wake. |
| Rendering HTML | Offscreen document | `<iframe src="blob:...">` inside offscreen.html | Offscreen docs have a full DOM. They cannot use `chrome.tabCapture` (that needs an active tab). Cannot open `file://` URLs directly from offscreen — must receive content as data URL from local server. |
| Recording rendered HTML as video | Offscreen document | `HTMLCanvasElement.captureStream()` + `MediaRecorder` | The HTML must cooperate by rendering to a `<canvas>` OR the offscreen doc must use `getDisplayMedia` / experimental capture. HIGH RISK — see Pitfalls. |
| Detecting animation end | Offscreen document + iframe | `window.addEventListener("message")` listening for a convention like `{ type: "gsd:done" }` posted by the HTML animation | Requires user's HTML files to include `window.parent.postMessage({ type: "gsd:done" }, "*")` at animation end. Fallback: configurable timeout. |
| Transferring video blob from offscreen to SW | Service worker + offscreen | `chrome.runtime.sendMessage` with ArrayBuffer | Blobs cannot cross the message channel — must convert to ArrayBuffer first. Size limit ~64MB for structured clone in Chrome. |
| Saving video to disk | Local server | POST endpoint receives ArrayBuffer, writes to `temp-videos/` | Extension cannot write to filesystem. Local server does it. |
| Navigating to social media site | Service worker | `chrome.tabs.create` or `chrome.tabs.update` | Needs `tabs` permission. Reuse existing logged-in tab if possible to avoid login prompts. |
| Automating social media UI | Content scripts | `chrome.scripting.executeScript` (dynamic injection) | Needs `scripting` permission + host_permissions for each domain. Content scripts CAN access the page DOM. They fetch the video blob from local server via `fetch("http://localhost:3333/api/video/...")`. |
| Simulating file upload on social media | Content script | `DataTransfer` + `dispatchEvent(new DragEvent(...))` or direct input.files setter | Some platforms validate file origin — may need to create a `File` object from the blob. HIGH RISK — platform-specific, fragile. |
| Reading/writing metadata | Local server | Writes JSON sidecar files in `publicaciones-anteriores/` | |
| Extension status display | Side panel | Reads `chrome.storage.local`, listens to `chrome.runtime.onMessage` | Use side panel (persistent) rather than popup (closes on click-away) for monitoring a long job. |
| Sending Telegram confirmation | Local server | `fetch` to Telegram Bot API `sendMessage` | Service worker could do this too, but local server already holds the bot token. |

---

## Build Order

Dependencies flow bottom-up: nothing can be tested without the layer below it working.

### Phase 1 — Local Server Foundation
Build first because everything else depends on it.

1. `server.js` — Express app, port 3333, CORS for `chrome-extension://` origin
2. `chokidar` watcher on `nuevas-publicaciones/` → populates in-memory file list
3. REST endpoints: `GET /api/status`, `GET /api/files`, `GET /api/file/:name` (returns base64), `POST /api/save-video`, `POST /api/move-file`
4. `telegram-poller.js` — getUpdates loop, sets pendingPublish flag, sends confirmation messages
5. Test with `curl` — verify all endpoints work before touching the extension

### Phase 2 — Extension Skeleton + Service Worker
6. `manifest.json` — minimum permissions: `offscreen`, `tabs`, `scripting`, `storage`, `nativeMessaging` (if needed), host_permissions for all 4 social domains + `http://localhost:3333/*`
7. Service worker with state machine: IDLE → POLLING → RENDERING → PUBLISHING → CONFIRMING
8. `chrome.storage.local` job queue — persist across SW sleep cycles
9. SW polls local server `/api/status` every 5s via `chrome.alarms` (alarms keep SW alive reliably)
10. Test: SW detects command from Telegram, logs file list

### Phase 3 — Offscreen Rendering + Recording
11. `offscreen.html` + `offscreen.js` — iframe loader
12. Animation-end protocol: define `window.parent.postMessage({ type: "gsd:done" }, "*")` convention
13. Canvas capture path: `canvas.captureStream(30)` → `MediaRecorder({ mimeType: "video/webm;codecs=vp9" })`
14. Timeout fallback path for HTMLs that don't post the done message
15. ArrayBuffer transfer back to SW
16. Test with a known canvas animation HTML

### Phase 4 — Instagram Publisher (first social network)
17. `inject-instagram.js` content script
18. Test upload flow manually first in DevTools console
19. Automate: navigate to /create/reels → click upload → set File on input → wait for processing → add caption → publish
20. Robust wait helpers: `waitForElement(selector, timeout)` utility

### Phase 5 — Remaining Social Networks
21. `inject-facebook.js`
22. `inject-twitter.js`
23. `inject-linkedin.js`
24. Each follows same pattern as Instagram but with platform-specific selectors

### Phase 6 — Side Panel + Integration
25. `sidepanel.html` — job queue display, network status indicators
26. End-to-end test: Telegram command → video recorded → all 4 networks published → HTML archived → Telegram confirmation

---

## Local Backend vs Pure Extension

**Verdict: A local Node.js server is mandatory, not optional.**

| Concern | Pure Extension | With Local Server |
|---------|---------------|-------------------|
| Filesystem watching | IMPOSSIBLE — no API for headless watch | `chokidar` works perfectly |
| Reading local files headlessly | IMPOSSIBLE — File System Access API requires user gesture per session | Server reads freely |
| Telegram polling reliability | FRAGILE — service workers sleep after 30s, alarms fire at most every minute | Server runs a tight loop 24/7 |
| Writing video to disk | IMPOSSIBLE | Server writes to temp folder |
| Archiving HTML + writing metadata | IMPOSSIBLE | Server moves files, writes JSON |
| Sending Telegram confirmations | Possible (SW can fetch) | Server already holds bot token — cleaner |
| Complexity | Requires Native Messaging Host (C++ binary registration) to access filesystem — far more complex | Simple Express server, ~200 lines |

The alternative to a local server is a **Native Messaging Host** — a compiled binary registered in the Windows registry that the extension pipes data to. This gives filesystem access but adds enormous complexity (binary compilation, installation step, Windows registry edit) and still doesn't solve the Telegram polling reliability problem. The local server is strictly better for this use case.

The local server should be packaged as a simple Node.js script with a `start.bat` / `npm start` launcher. The user runs it once; it stays alive in the background.

---

## Key Technical Boundaries

### What talks to what

```
Telegram Bot API
      |  (long-poll)
      v
[Local Server :3333]  <──────────────────────────────────────────┐
      |  GET /api/status (every 5s via chrome.alarms)            |
      |  GET /api/files                                           |
      |  GET /api/file/:name                                      |
      |  POST /api/save-video                                     |
      |  POST /api/move-file                                      |
      v                                                           |
[Service Worker]                                                  |
      |  chrome.runtime.sendMessage({ action:"render"... })       |
      v                                                           |
[Offscreen Document]                                              |
      |  chrome.runtime.sendMessage({ action:"recordingDone"...}) |
      v                                                           |
[Service Worker]                                                  |
      |  POST /api/save-video ──────────────────────────────────►|
      |                                                            |
      |  chrome.scripting.executeScript(tabId, inject-X.js)       |
      v                                                           |
[Content Script on instagram.com / etc.]                          |
      |  fetch("http://localhost:3333/api/video/:name") ─────────►|
      |  Automates DOM upload UI                                  |
      |  chrome.runtime.sendMessage({ action:"publishDone" })    |
      v                                                           |
[Service Worker]                                                  |
      |  POST /api/move-file ───────────────────────────────────►|
      └──────────────────────────────────────────────────────────┘
```

### Permission Requirements (manifest.json)

```json
{
  "permissions": [
    "offscreen",
    "tabs",
    "scripting",
    "storage",
    "alarms",
    "sidePanel"
  ],
  "host_permissions": [
    "http://localhost:3333/*",
    "https://www.instagram.com/*",
    "https://www.facebook.com/*",
    "https://twitter.com/*",
    "https://x.com/*",
    "https://www.linkedin.com/*",
    "https://api.telegram.org/*"
  ]
}
```

Note: `"activeTab"` is insufficient — the extension needs to inject scripts into tabs the user didn't just click. `"tabs"` + `"scripting"` + `host_permissions` is the correct MV3 pattern.

### Critical Constraints

**Service Worker sleep.** MV3 service workers terminate after ~30 seconds of inactivity. The fix is `chrome.alarms.create("poll", { periodInMinutes: 0.1 })` (minimum is 0.1 = 6 seconds in MV3) — the alarm fires the SW back awake. Store all in-progress job state in `chrome.storage.local` so the SW can resume after being killed mid-job.

**One offscreen document at a time.** Chrome enforces a limit of one offscreen document per extension. The SW must close it with `chrome.offscreen.closeDocument()` before creating a new one for the next HTML file.

**Offscreen document cannot use `chrome.tabCapture`.** `tabCapture` requires an active, user-visible tab. The offscreen approach must rely on the HTML rendering to a `<canvas>` element and calling `canvas.captureStream()`. This means the HTML files must render their animation onto a canvas. If they are pure CSS/HTML without canvas, you need a different strategy — see below.

**Recording pure CSS/HTML animations (no canvas).** If the HTML uses CSS animations (not canvas), `canvas.captureStream()` is not directly applicable. Options:
  - Option A: Use `html2canvas` library inside offscreen to rasterize each frame onto a canvas and record that canvas — works but adds CPU cost and may miss CSS transitions.
  - Option B: Open the HTML in a real tab (hidden/minimized), use `chrome.tabCapture.capture()` from the service worker to get a MediaStream of that tab, record it via an offscreen document that receives the stream. This is the architecturally correct path for general HTML but requires `tabCapture` permission and a visible tab.
  - Option C: Require all HTML files to use a `<canvas>` as their rendering surface. This is the cleanest constraint — document it clearly.

**Recommendation:** Start with Option C (canvas-only constraint) for Phase 1. Add Option B (tab capture) in a later phase if pure CSS HTMLs are needed. Tab capture is well-supported in MV3 and is the right long-term answer.

**Tab capture architecture (Option B detail):**
```
SW: chrome.tabs.create({ url: dataUrl, active: false })
SW: chrome.tabCapture.capture({ tabId, video: true, audio: false })
    → returns MediaStream
SW: Cannot hold MediaStream — must transfer to offscreen doc
    → Use chrome.runtime.sendMessage is not enough for streams
    → Use chrome.offscreen + DISPLAY_MEDIA or inject recorder into the tab itself
```
The cleanest MV3 pattern for tab capture + recording: inject a content script into the rendering tab, start `MediaRecorder` inside that content script (which has full DOM + stream access), collect chunks, send ArrayBuffer back to SW via `chrome.runtime.sendMessage`. The rendering tab becomes the recording context — no offscreen document needed for this path.

**Social media automation fragility.** Instagram, Facebook, X, and LinkedIn all use React/complex SPAs with obfuscated class names that change frequently. The content scripts must use semantic selectors (`aria-label`, `data-testid`, visible text) rather than class names. Each network needs its own update cadence.

**CORS on localhost server.** The extension origin is `chrome-extension://<id>`. The local server must set `Access-Control-Allow-Origin: *` (or the specific extension origin) on all responses, including POST endpoints.

**File upload in content scripts.** Social media upload inputs are often hidden. The correct technique is to get a reference to the `<input type="file">` element, create a `File` object from the video blob, use `Object.defineProperty(input, 'files', { value: new DataTransfer() with file })`, then dispatch a `change` event. React-based inputs may also require a synthetic event via `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ...)` — the React internal fiber approach. This is HIGH RISK and platform-specific.

---

## Architecture Decision Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Local server required | YES — Node.js + Express | Filesystem access, reliable polling, file I/O are impossible from extension alone |
| Telegram polling location | Local server | SW too unreliable; server runs 24/7 |
| HTML rendering location | Offscreen document (canvas) or injected tab content script | Offscreen for canvas HTML; tab capture for CSS HTML |
| Video recording mechanism | `canvas.captureStream()` + `MediaRecorder` in offscreen doc OR `MediaRecorder` in rendering tab content script | Both are HIGH confidence MV3-compatible paths |
| Social media automation | Content scripts injected dynamically via `chrome.scripting.executeScript` | Only way to access live logged-in sessions and DOM |
| State persistence | `chrome.storage.local` job queue | SW dies — must survive restarts |
| Extension-server communication | HTTP REST to `localhost:3333` | Simple, debuggable, no special Chrome APIs needed |
| SW keep-alive | `chrome.alarms` at 0.1min interval | Minimum interval in MV3; fires SW every ~6s |

---

*Researched: 2026-04-27*
*Confidence: HIGH for MV3 component boundaries and APIs (training data through Aug 2025, Chrome MV3 stable since 2023). MEDIUM for social media DOM automation specifics (platform UIs change). LOW for exact tab capture + offscreen stream handoff API shape — verify against current Chrome docs before implementing Phase 3.*
