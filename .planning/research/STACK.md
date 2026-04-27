# Stack Research

**Project:** SocialPublisher Chrome Extension
**Researched:** 2026-04-27
**Overall confidence:** MEDIUM — training data through Aug 2025 was used as primary source due to tool restrictions (WebSearch, Bash, WebFetch denied). Key claims are based on stable, well-documented APIs, but social media automation sections are LOW confidence due to rapid UI changes.

---

## Recommended Stack

### Core Extension

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Manifest V3 | Current (Jan 2023+) | Extension runtime | Chrome Web Store has required MV3 since June 2024; MV2 extensions are disabled for new installs. No choice here. |
| Service Worker | — | Background logic (polling, orchestration) | Replaces background pages in MV3. Handles Telegram polling, coordinates recording/publishing pipeline. |
| Offscreen Document API | Chrome 109+ | DOM access from service worker | Service workers have no DOM. `chrome.offscreen` creates a hidden document that CAN run canvas, MediaRecorder, load iframes — critical for video recording. |
| Content Scripts | — | Injecting into social media tabs | Needed to interact with Instagram/Facebook/X/LinkedIn DOM once a tab is opened. |
| `chrome.tabs` API | — | Open and control tabs for publishing | Opens a social media tab, injects a content script to perform UI automation. |

**Confidence:** HIGH — MV3 architecture is well-documented and stable as of mid-2025.

**Critical MV3 constraint:** Service workers terminate after ~30 seconds of inactivity (Chrome can extend this for active ports/messages, but never indefinitely). The Telegram polling loop must use `chrome.alarms` to re-wake the service worker on a schedule, not a `setInterval` that will die silently.

---

### Video Recording

**Recommended approach: Offscreen Document + `chrome.tabCapture` stream piped to `MediaRecorder`**

#### How it works

1. A hidden offscreen document (`chrome.offscreen.createDocument`) loads the target HTML file inside an `<iframe>` (via a `blob:` URL or `file:` URL if the permission is granted, or via a local HTTP server).
2. The offscreen document calls `navigator.mediaDevices.getUserMedia` or receives a `MediaStream` from `chrome.tabCapture.capture()` started by the service worker.
3. `MediaRecorder` records the stream into `video/webm` chunks.
4. Animation-end detection listens for a custom `animationend` or `transitionend` event, a custom JS `window.postMessage('DONE')` signal the user adds to their HTML templates, or a configurable timeout (e.g., 30s default).

#### Why this approach over alternatives

| Approach | Works in MV3? | Quality | Notes |
|----------|--------------|---------|-------|
| `chrome.tabCapture` + `MediaRecorder` | YES (with offscreen doc) | HIGH — native GPU-composited render | Best quality; captures exactly what Chrome renders, including CSS animations, WebGL, video |
| `html2canvas` + `canvas.captureStream()` | YES | MEDIUM — software render | Misses CSS animations, pseudo-elements, web fonts may not load. Not suitable for animation-heavy content. |
| Puppeteer (headless) | NO — requires Node.js process | HIGH | Not usable inside an extension; would require a native messaging host running a separate Node process. Major added complexity. |
| `getDisplayMedia` (screen capture) | Requires user gesture each time | HIGH | Unsuitable for automation — pops a system picker every recording session. |
| `chrome.desktopCapture` | Requires user gesture each time | HIGH | Same problem as `getDisplayMedia`. |

**Confidence:** MEDIUM-HIGH. `chrome.tabCapture` has been stable in MV3 but has a specific constraint: `chrome.tabCapture.capture()` can only be called from an extension context that is handling a user gesture OR via `chrome.tabCapture.getMediaStreamId()` which allows the stream ID to be passed to an offscreen document. Verify this flow in a prototype — this is the technically riskiest part of the whole system.

**`getMediaStreamId` flow (the correct MV3 pattern):**
```
service worker
  → chrome.tabCapture.getMediaStreamId({ targetTabId })
  → sends streamId to offscreen document via chrome.runtime.sendMessage
offscreen document
  → navigator.mediaDevices.getUserMedia({ video: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId } } })
  → MediaRecorder records the stream
```

**Animation-end detection strategy:** Require HTML files to call `window.postMessage({ type: 'GSD_DONE' }, '*')` when their animation completes. Offscreen document listens for this message. If no message arrives within `MAX_DURATION` (configurable, default 60s), recording stops automatically. This is simple, user-controlled, and reliable.

**Output format:** `video/webm; codecs=vp9` — the only format `MediaRecorder` guarantees in Chrome. For Instagram/Reels, MP4 (H.264) is preferred; transcode webm→mp4 using **ffmpeg.wasm** (`@ffmpeg/ffmpeg` v0.12+) running inside the offscreen document. Adds ~30MB to extension size — acceptable for this use case.

**`@ffmpeg/ffmpeg` version:** 0.12.x (uses SharedArrayBuffer — requires `Cross-Origin-Opener-Policy: same-origin` headers, which offscreen documents satisfy). Confirm compatibility in prototype.

---

### File System Access

**Recommended approach: File System Access API with a persisted `FileSystemDirectoryHandle`**

#### Why not Native Messaging Host

| Criterion | File System Access API | Native Messaging Host |
|-----------|----------------------|----------------------|
| Setup friction | User picks folder once, handle persisted in `chrome.storage.local` | Must install a separate binary/script on OS, register it in Windows registry or JSON manifest file |
| Cross-platform | Works on all OSes Chrome runs on | Requires OS-specific install per machine |
| MV3 compatibility | YES — works in offscreen documents and content scripts (not service workers directly) | YES — `chrome.runtime.connectNative` works in service workers |
| Security model | User explicitly grants folder access; permission persists across sessions via `IndexedDB` | Binary has full OS-level access to filesystem |
| Maintenance | Zero — browser API | Must maintain and distribute the native binary |

**Verdict:** File System Access API is the right choice. The user grants access to `nuevas-publicaciones/` once via a folder picker (`window.showDirectoryPicker()`). The returned `FileSystemDirectoryHandle` is serialized and stored in `IndexedDB` (via the `idb` library or raw IndexedDB). On next extension start, the handle is retrieved and `handle.requestPermission({ mode: 'readwrite' })` re-verifies access without re-prompting if the user hasn't revoked it.

**Why not a simple `<input type="file">` or drag-and-drop:** Those return `File` objects with no persistent directory watching capability. Directory handles allow iterating `nuevas-publicaciones/`, detecting new files, and moving processed files to `publicaciones-anteriores/` — all required by the project.

**Constraint:** `window.showDirectoryPicker()` requires a user gesture. The initial setup must happen via a popup or options page (not a service worker). After that first grant, the persisted handle works without user interaction.

**Confidence:** HIGH — File System Access API is well-documented and stable. Directory handle persistence via IndexedDB is a well-established pattern documented by the Chrome team.

**Libraries:**
- `idb` v8.x — thin Promise wrapper over IndexedDB for storing the handle. ~1.5KB gzipped.
- No other dependencies needed for file system work.

---

### Telegram Bot Integration

**Recommended approach: Long-polling via `chrome.alarms` + `fetch` in service worker**

#### How polling works

Telegram Bot API provides two methods:
- **`getUpdates` with `offset` and `timeout`** — long-polling, holds connection open for up to `timeout` seconds (max 100s recommended).
- **Webhooks** — requires a public HTTPS endpoint; not applicable here (extension has no server).

**MV3 service worker constraint:** Service workers cannot hold a long-lived connection open. A 100-second fetch will be terminated by the browser. The correct pattern is:

```
chrome.alarms.create('telegram-poll', { periodInMinutes: 1 })

onAlarm → fetch https://api.telegram.org/bot{TOKEN}/getUpdates?offset={lastUpdateId+1}&timeout=25
         → parse commands
         → update lastUpdateId in chrome.storage.local
         → trigger publishing pipeline if command matches
```

Use `timeout=25` (seconds) so the fetch completes well within the ~30s service worker budget. At worst, command latency is 25s + 1min alarm interval ≈ 85s. For the use case (manual trigger, not real-time), this is acceptable.

**Alternative — chrome.alarms at 1-minute interval with short timeout=0 polling:** Even simpler, just poll with no long-polling timeout. Latency becomes ~1 minute worst-case. Simpler, more reliable in MV3.

**Bot token storage:** Store `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in `chrome.storage.local` (not `sync` — sync has size limits and syncs across devices which may be unwanted). Expose a simple options page to configure them.

**Command parsing:** Match message text against known commands (e.g., `/publish`, `/status`). Respond via `sendMessage` API call.

**Confidence:** HIGH — Telegram Bot API getUpdates is stable and well-documented. The chrome.alarms MV3 pattern for service worker keep-alive is the official Chrome-recommended approach.

**No third-party Telegram library needed** — the Bot API is simple HTTP; direct `fetch` calls are cleaner than adding a dependency. Use typed wrappers if desired, but avoid heavy Node.js-oriented libraries like `node-telegram-bot-api` which assume Node runtime.

---

### Social Media Publishing

This is the highest-risk, lowest-confidence section. All four platforms actively fight automation and change their UI/internal APIs frequently. The approach is browser automation via content scripts injecting into authenticated tabs — effectively scripted UI interaction, not official API calls.

**General architecture for all networks:**

```
service worker
  → chrome.tabs.create({ url: 'https://www.instagram.com/...', active: false })
  → wait for tab to reach target URL (chrome.tabs.onUpdated)
  → chrome.scripting.executeScript({ target: { tabId }, files: ['content/instagram-publisher.js'] })
content script
  → manipulates DOM to upload video and submit post
  → posts completion/failure back via chrome.runtime.sendMessage
```

**Why `active: false` tabs:** Background tabs don't require the user to see them, reducing disruption.

**Important constraint:** `chrome.scripting.executeScript` requires the `scripting` permission and host permissions for the target domain (e.g., `*://www.instagram.com/*`). All four domains must be listed in `host_permissions` in `manifest.json`.

---

#### Instagram (Reels)

**Approach:** Open `https://www.instagram.com` (already authenticated), find the "New post" / "Create" button via DOM query, trigger the file upload input with a `DataTransfer` object containing the video blob, proceed through the modal steps (select "Reel", add caption if needed, publish).

**Key challenge:** Instagram's upload input accepts files via a hidden `<input type="file">`. Injecting a file into it requires creating a `File` object from the blob and dispatching it as a `DataTransfer`. This is a known but fragile technique — Instagram's React state may not respond to synthetic events in the same way. May require simulating native events or using `Object.defineProperty` tricks.

**Format requirement:** Instagram Reels requires MP4 (H.264 + AAC). The webm→mp4 ffmpeg.wasm transcode is mandatory here.

**Confidence:** LOW — Instagram actively detects automation. This will require significant prototyping and will break periodically.

---

#### Facebook

**Approach:** Open `https://www.facebook.com`, navigate to the user's page or profile, find the "Photo/Video" or "Reel" creation entry point, upload via the file input injection technique.

**Key challenge:** Facebook's internal structure varies between personal profiles, pages, and groups. The user will need to specify which destination. The DOM structure uses deeply nested generated class names that change frequently.

**Confidence:** LOW — Same fragility as Instagram (Meta family). Shares many internal patterns since both are Meta properties.

---

#### X / Twitter

**Approach:** Open `https://x.com` (or `https://twitter.com` — both work), click the compose button, attach the video via file input injection, fill in tweet text if any, submit.

**Key advantage over Meta:** Twitter/X's post composition UI is more stable and their file input is more accessible to automation. The `<input type="file" accept="video/*">` is present and has been reliably injectable.

**Video format:** MP4 (H.264) up to 512MB, max 2m20s for regular accounts. The ffmpeg.wasm transcode from webm is again required.

**Confidence:** MEDIUM — X's UI is relatively more automation-friendly than Meta. Still will break on major UI redesigns.

---

#### LinkedIn

**Approach:** Open `https://www.linkedin.com`, trigger the "Start a post" flow, select "Video" attachment, inject file via DataTransfer, fill title/description, publish.

**Key challenge:** LinkedIn has aggressive bot detection (similar to Cloudflare challenges) on automated interactions. DOM interactions must mimic real user behavior (mouse events before clicks, realistic timing).

**Confidence:** LOW — LinkedIn's bot detection is among the most aggressive of the four platforms.

---

**Cross-platform recommendation for content script timing:**

Use `MutationObserver` + timeout-based step sequencing rather than fixed `setTimeout` chains. Each step waits for the expected DOM element to appear before proceeding. This handles variable page load speeds and reduces false failures.

**Helper library consideration:** `playwright` or `puppeteer` are NOT usable inside a Chrome extension. Do NOT attempt to bundle them. Write thin, purpose-built content script automators per network.

---

## What NOT to Use

### Do NOT use background pages (MV2)
MV2 is deprecated and disabled for new installs on the Chrome Web Store since June 2024. Any MV2-only advice found online is outdated. Do not follow it.

### Do NOT use `setInterval` / `setTimeout` for Telegram polling in the service worker
Service workers terminate after inactivity. `setInterval` silently dies when the worker is terminated. Use `chrome.alarms` exclusively for recurring background tasks.

### Do NOT use `getDisplayMedia` or `chrome.desktopCapture` for video recording
Both require a user gesture (system-level prompt) every single recording session. They cannot be automated programmatically. They are suitable for user-initiated screen recording tools, not automated pipelines.

### Do NOT use `html2canvas` for animation capture
`html2canvas` does a software-rendered DOM snapshot, not a real browser render. It misses CSS animations, `@keyframes`, `canvas` elements, WebGL, video backgrounds, pseudo-elements (`::before`, `::after`), and custom fonts that haven't loaded. For animation-heavy HTML content (the core use case here), the output will look broken.

### Do NOT bundle Puppeteer or Playwright inside the extension
These are Node.js tools that spawn headless browser processes. They cannot run in a browser extension context. If a headless rendering pipeline is ever needed, it belongs in a native messaging host (separate process), not in the extension itself — and that adds significant operational complexity.

### Do NOT use `eval()` or `new Function()` with remote code
MV3 prohibits this via Content Security Policy. Any dynamic code execution attempt will silently fail or throw. All logic must be statically bundled.

### Do NOT use `chrome.storage.sync` for credentials or large video blobs
`chrome.storage.sync` has a 100KB total quota and syncs across Chrome profiles. Store bot tokens in `chrome.storage.local`. Store video blobs in `IndexedDB` (no practical size limit beyond disk space).

### Do NOT use official Instagram/Facebook Graph API, Twitter API v2, or LinkedIn API
The project explicitly avoids OAuth APIs for valid reasons (no server, no token management). However, be aware: if the browser-session automation approach becomes too fragile over time, migrating to official APIs is the principled fallback. The architecture should keep the publishing layer modular enough to swap implementations.

### Do NOT use `XMLHttpRequest` for Telegram polling
`fetch` is available in MV3 service workers and is the standard. XHR is legacy and adds no benefit.

---

## Open Questions

These are unresolved questions that require hands-on prototyping to answer definitively. Training data cannot substitute for testing.

1. **`chrome.tabCapture.getMediaStreamId` + offscreen document flow** — Does this work in the current stable Chrome build (126+)? The API was added but some edge cases around offscreen document access to tab streams have had bugs. Prototype this first — it's the core recording mechanism and there is no good fallback.

2. **ffmpeg.wasm in an offscreen document** — `@ffmpeg/ffmpeg` 0.12 requires `SharedArrayBuffer`, which requires cross-origin isolation headers (`COOP`/`COEP`). Offscreen documents in extensions may or may not satisfy these requirements without explicit header configuration. Test whether `crossOriginIsolated` is `true` inside an offscreen document. If not, `@ffmpeg/ffmpeg` 0.11.x (which uses a different threading model) or a WASM-based alternative may be needed.

3. **File System Access API handle persistence across service worker restarts** — `FileSystemDirectoryHandle` can be stored in IndexedDB, but requesting permission on a persisted handle from a service worker (no DOM) is documented as requiring a user gesture. Test whether a handle granted in the popup context can be re-used in the service worker without re-prompting. If not, the offscreen document may need to serve as the intermediary for file I/O.

4. **Instagram file input injection reliability** — Meta has been known to add checks that detect synthetic `DataTransfer` events. Test whether the standard `Object.defineProperty` injection trick for file inputs works on the current Instagram web app.

5. **LinkedIn bot detection bypassing** — LinkedIn may require simulated mouse movement events (e.g., `mousemove`, `mouseenter`) before `click` events to pass basic bot detection. Determine what level of event simulation is required to reliably open the post modal.

6. **Background tab rendering fidelity** — When a tab is opened as `active: false`, Chrome may throttle rendering (reduced frame rate, paused requestAnimationFrame). If the source HTML is loaded for recording in a background tab, animation timing may be incorrect. Test whether the offscreen document approach (which is a dedicated document, not a background tab) avoids this throttling.

7. **Service worker lifetime during long recording sessions** — Recording a 60-second animation via an offscreen document: does the service worker stay alive for the full duration if it has an open message port to the offscreen document? Use `chrome.runtime.connect` (long-lived port) to keep the service worker alive during active recording sessions.

---

## Sources

- Chrome Developers — Manifest V3 overview: https://developer.chrome.com/docs/extensions/mv3/intro/
- Chrome Developers — Offscreen Documents API: https://developer.chrome.com/docs/extensions/reference/offscreen/
- Chrome Developers — `chrome.tabCapture`: https://developer.chrome.com/docs/extensions/reference/tabCapture/
- Chrome Developers — `chrome.alarms`: https://developer.chrome.com/docs/extensions/reference/alarms/
- Chrome Developers — File System Access API: https://developer.chrome.com/docs/capabilities/web-apis/file-system-access
- Chrome Developers — Service worker lifecycle: https://developer.chrome.com/docs/extensions/mv3/service_workers/
- Telegram Bot API — getUpdates: https://core.telegram.org/bots/api#getupdates
- ffmpeg.wasm — `@ffmpeg/ffmpeg` 0.12: https://ffmpegwasm.netlify.app/
- MDN — MediaRecorder: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
- MDN — File System Access API: https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API

**Confidence note:** All claims above are based on training data (cutoff Aug 2025). External fetch tools were unavailable during research. The architecture recommendations are based on well-established, stable APIs with HIGH confidence. Social media automation (Instagram, Facebook, LinkedIn, X) recommendations are LOW-MEDIUM confidence due to rapid platform UI changes that training data cannot reflect accurately. Mandatory prototyping is flagged in Open Questions.

---
*Researched: 2026-04-27*
