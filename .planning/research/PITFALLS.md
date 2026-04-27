# Pitfalls Research

**Project:** Chrome Extension — HTML-to-Video Social Publisher
**Domain:** Chrome Extension MV3 / MediaRecorder / Social Media Automation / Telegram Bot
**Confidence note:** All findings drawn from Chrome platform docs, MDN, and community
knowledge through August 2025 cutoff. External tools unavailable during this research
session; critical claims are flagged with confidence levels.

---

## Critical Pitfalls

---

### SW-1: Service Worker Killed Mid-Recording or Mid-Publication
**Risk level:** High
**Confidence:** HIGH (documented Chrome behavior, stable since MV3 launch)

**What goes wrong:**
Chrome's MV3 service worker (SW) is killed after ~30 seconds of inactivity. "Inactivity"
means no open event listener, no pending promise, no active port. If the SW coordinates
a recording session or a social media posting sequence that runs longer than 30 s without
a Chrome API event keeping it alive, state is silently lost. A recording can be orphaned
mid-file; a posting sequence can abort after Instagram but before LinkedIn.

The 5-minute hard cap (after Chrome 116: effectively removed for offscreen documents and
some native messaging cases, but still applies to arbitrary SW execution) means even
"keepalive" hacks have limits.

**Warning signs:**
- Console logs in SW stop mid-sequence without an error
- `chrome.storage` entries show "in-progress" state that never resolves
- Posting appears to work on some platforms but not others, non-deterministically
- `chrome.runtime.onSuspend` fires unexpectedly during long operations

**Prevention:**
1. Never store workflow state only in SW memory. Persist every step to `chrome.storage.local`
   so the workflow can resume if the SW restarts.
2. Use an **Offscreen Document** (available since Chrome 109) to do long-running work —
   it persists as long as it is open and the SW can message it. The recording and DOM
   rendering should live in the offscreen document, not in the SW.
3. Keep the SW alive only for coordination (send message → receive ack → update storage).
4. For Telegram polling, do NOT run the poll loop in the SW. Run it from the offscreen
   document or a side panel page.
5. Use `chrome.alarms` API for periodic work instead of `setInterval` in the SW.

**Phase:** Foundation / Architecture phase — this dictates the entire component boundary
design. Getting it wrong forces a structural rewrite.

---

### SW-2: No Persistent Background Page — All In-Memory State Lost on SW Restart
**Risk level:** High
**Confidence:** HIGH

**What goes wrong:**
MV3 replaced persistent background pages with non-persistent service workers. Any
variable, Map, Set, or object stored in SW scope is gone when Chrome kills the SW.
This is a fundamental behavioral difference from MV2. Developers migrating patterns
from MV2 (or writing extension code as if a background page exists) will encounter
silent data loss: job queues, session tokens cached in memory, recording state, etc.

**Warning signs:**
- A variable initialized at SW startup is `undefined` in a later event handler
- A `Map` used as an in-memory job queue loses items between browser sessions
- Auth tokens or cookies stored as variables disappear

**Prevention:**
1. Treat the SW as stateless. Every function must re-read state from `chrome.storage.local`
   at the start and write back at the end.
2. Use a simple job queue in `chrome.storage.local`:
   ```json
   { "queue": [{ "id": "...", "platform": "instagram", "status": "pending" }] }
   ```
3. Design all handlers as idempotent: re-running a step that already completed should
   be a no-op, not a duplicate post.

**Phase:** Foundation phase. Storage schema must be designed before any feature work.

---

### SW-3: chrome.tabCapture Requires Foreground Permission and Has MV3 Restrictions
**Risk level:** High
**Confidence:** HIGH

**What goes wrong:**
`chrome.tabCapture.capture()` in MV3 can only be called from a user gesture context
(popup, action click) or from within specific APIs. It cannot be called directly from
the SW in response to a Telegram message. The captured `MediaStream` is also tied to
the calling context's lifetime — if the SW dies, the stream dies.

Additionally, `tabCapture` requires the `"tabCapture"` permission AND the tab being
captured must be in the foreground (visible) for the capture to start. A background tab
silently fails or produces a black frame depending on Chrome version.

**Warning signs:**
- `chrome.tabCapture.capture` returns `undefined` stream with no error
- Capture works in popup testing but fails when triggered from Telegram poll
- Video output is a black screen

**Prevention:**
1. Use **Offscreen Document** with `chrome.tabCapture` + `getUserMedia({video: {mandatory:
   {chromeMediaSource: 'tab'}}})` pattern, OR use `chrome.desktopCapture` for a broader
   surface.
2. The recommended MV3 pattern: popup (or action) starts the recording by opening an
   offscreen document, passing the stream ID from `tabCapture` to it via message.
3. Use `chrome.offscreen.createDocument()` with reason `TAB_CAPTURE`.
4. Ensure the HTML preview tab is brought to the foreground before capture starts.

**Phase:** Recording pipeline phase. Test this in a minimal proof-of-concept before
building any UI around it.

---

### CSP-1: Content Security Policy Blocks Inline Scripts in Extension Pages
**Risk level:** High
**Confidence:** HIGH

**What goes wrong:**
MV3 enforces a strict Content Security Policy on extension pages (popup, options,
offscreen document). `eval()`, `new Function()`, and inline event handlers (`onclick=`)
are blocked. HTML animation files that rely on inline `<script>` tags or dynamic code
evaluation will fail to execute when loaded inside an extension page or offscreen
document.

If the local HTML files contain animation logic in inline scripts, those scripts will be
silently blocked. The HTML renders but animations don't play, producing a static video.

**Warning signs:**
- Browser console shows: `Refused to execute inline script because it violates the
  following Content Security Policy directive: "script-src 'self'"`
- Animations visible when opening HTML file directly in browser, but static when
  loaded inside extension context
- `animationend` / `transitionend` events never fire

**Prevention:**
1. Load HTML animation files in a **regular Chrome tab** (via `chrome.tabs.create`),
   not inside an extension page. Regular tabs are not subject to extension CSP.
2. The offscreen document should only host the MediaRecorder; the HTML being recorded
   should live in a regular tab that gets captured.
3. If the offscreen document approach is required, inject a content script into the tab
   instead of loading the HTML as a page in the extension.
4. Document that user HTML files must not rely on `eval()` or `new Function()` —
   add a validation step that warns the user.

**Phase:** Recording pipeline phase (proof-of-concept required).

---

### REC-1: Animation End Detection is Unreliable
**Risk level:** High
**Confidence:** MEDIUM-HIGH (well-known problem, multiple approaches exist)

**What goes wrong:**
There is no single reliable signal for "this HTML animation has finished playing."
Common approaches fail:

- `animationend` event: only fires for CSS animations, not JS-driven animations
  (GSAP, requestAnimationFrame loops, Lottie, Three.js, canvas animations). Also fires
  once per element per animation name — a page with 20 animated elements fires 20 events.
- `transitionend`: same limitation, only CSS transitions.
- Fixed timeout: races — too short cuts off animations, too long wastes disk space.
- `requestIdleCallback`: fires when the thread is idle, not when animation is "done".
- Checking `document.timeline`: non-trivial, does not account for JS animations.

If detection fires too early, the video is cut off mid-animation. If it fires too late,
the video has a dead tail of static frames that looks unprofessional.

**Warning signs:**
- Videos systematically end N seconds before the animation completes
- Videos have a long static tail after animation ends
- Works for CSS animations but fails for JS animations

**Prevention:**
1. Use a **cooperative protocol**: require HTML animation files to call
   `window.dispatchEvent(new CustomEvent('animation-complete'))` when done. This is the
   only 100% reliable signal.
2. As a fallback, inject a content script that:
   a. Listens for `animationend` on `document` with `{capture: true}`
   b. Also listens for `window.animation-complete`
   c. Uses a configurable timeout (default 10s, user-adjustable) as the last resort
   d. Once any signal fires, waits 500ms extra to capture final frame, then stops
3. For Lottie files: the `lottie` object exposes an `onComplete` callback — detect
   the Lottie script and hook into it via content script injection.
4. Surface the timeout setting in the UI so users can tune it per animation.

**Phase:** Recording pipeline phase. Requires dedicated sub-task for animation signal
protocol design.

---

### REC-2: MediaRecorder Codec Fragmentation and Platform Rejection
**Risk level:** High
**Confidence:** HIGH

**What goes wrong:**
`MediaRecorder` defaults vary by Chrome version and OS:
- Chrome on Windows defaults to `video/webm; codecs=vp8` or `vp9`
- Chrome on macOS may prefer `vp9`
- `H.264` is available via `video/webm; codecs=h264` on some systems but not all
- `video/mp4` output is NOT supported by MediaRecorder in Chrome (as of Chrome 126;
  Chrome 130+ has experimental mp4 support but it is not stable)

Social media platforms have strict upload requirements:
- Instagram Reels: MP4 (H.264 + AAC), 9:16 aspect ratio, max 90s, min 500ms
- Facebook: MP4 preferred, WebM accepted but may transcode poorly
- X/Twitter: MP4 (H.264), max 512MB, max 2m20s
- LinkedIn: MP4 (H.264) strongly preferred, max 5GB, max 10 min

Uploading a `video/webm; codecs=vp9` file directly to Instagram's web upload dialog
will either be rejected outright or result in a failed upload with a generic error.

**Warning signs:**
- Upload dialog shows "unsupported format" after file is submitted
- Upload appears to succeed but video never processes (stays in "processing" forever)
- Works on macOS but not Windows or vice versa

**Prevention:**
1. Always explicitly specify the codec: `new MediaRecorder(stream, { mimeType:
   'video/webm;codecs=h264' })` and check `MediaRecorder.isTypeSupported()` first.
2. Use `ffmpeg.wasm` (WebAssembly FFmpeg) in an offscreen document to transcode
   the WebM output to MP4 (H.264 + AAC) before upload. This is the standard approach
   for browser-based video tools.
3. Fall back chain: `h264 webm → vp9 webm → vp8 webm` for recording, always
   transcode to MP4 for upload.
4. Note: `ffmpeg.wasm` is ~25MB download. Cache it in `chrome.storage` or use a
   CDN with a service worker cache.

**Phase:** Recording pipeline phase + Upload pipeline phase. ffmpeg.wasm integration
is a significant dependency that must be planned upfront.

---

### REC-3: Memory Exhaustion During Long Recordings
**Risk level:** Medium-High
**Confidence:** HIGH

**What goes wrong:**
`MediaRecorder` collects `Blob` chunks in memory via the `ondataavailable` event.
For a 60-second 1080p recording at ~2 Mbps, this is ~15MB in memory — manageable.
But for longer recordings (5+ minutes) or high-resolution captures, this becomes
hundreds of MB. Chrome extension pages have no special memory allowance; the offscreen
document shares the browser's renderer process limits.

Additionally, `Blob.arrayBuffer()` creates a full in-memory copy when you need to
process the blob. Doing `new Blob(chunks)` where `chunks` is an array of many small
blobs causes garbage collection pressure.

**Warning signs:**
- Chrome tab crashes with "Aw, Snap!" during recording
- `performance.memory.usedJSHeapSize` grows unboundedly
- Recording works for 30s files but fails for 90s files

**Prevention:**
1. Stream chunks to the **File System Access API** (`FileSystemWritableFileStream`) as
   they arrive instead of accumulating in memory. Write each `ondataavailable` chunk
   directly to disk.
2. Set `timeslice` on `MediaRecorder.start(timeslice)` to get frequent small chunks
   (e.g., 1000ms) rather than one giant blob at the end.
3. Cap recording at a platform-appropriate maximum (90s for Instagram Reels, etc.)
   and enforce it in the UI.
4. After recording, read back from the file for transcoding rather than keeping the
   blob in memory.

**Phase:** Recording pipeline phase.

---

### REC-4: Cross-Origin Blocking When Loading Local HTML Files
**Risk level:** Medium
**Confidence:** HIGH

**What goes wrong:**
HTML files loaded via `file://` URIs are subject to Chrome's strict same-origin policy.
A `file://` page cannot make `XMLHttpRequest` or `fetch` calls to other `file://` URLs
in different directories. CSS `@import`, JS `import`, and `<img src>` with relative paths
may fail depending on how the file is opened.

When loaded via the File System Access API and displayed in a tab (as a blob URL or
injected into an extension page), relative resource paths (`./assets/logo.png`,
`./style.css`) break because the base URL is the blob URL, not the original file path.

**Warning signs:**
- Animation assets (images, fonts, sub-scripts) fail to load: 404 errors in console
- CSS imports missing, causing layout collapse
- Works when user opens file directly in browser but breaks in extension

**Prevention:**
1. When reading a directory of HTML + assets via File System Access API, read ALL
   assets into memory and rewrite resource URLs to blob URLs before injecting/displaying.
2. Use the `showDirectoryPicker()` API (not `showOpenFilePicker()`) so the extension
   has access to the entire animation folder including assets.
3. Intercept network requests in the content script / offscreen document using a
   `Service Worker` registered for the tab's scope, or use `chrome.declarativeNetRequest`
   to redirect `file://` asset requests to extension-served blob URLs.
4. Validate all `<link>`, `<script src>`, `<img src>` paths at load time and warn
   the user if assets are missing.

**Phase:** File loading phase + Recording pipeline phase.

---

### SOC-1: Instagram Anti-Bot Detection Triggered by DOM Automation
**Risk level:** High
**Confidence:** MEDIUM (Instagram's detection changes frequently; patterns are well-documented
but specific thresholds are not published)

**What goes wrong:**
Instagram's web frontend actively detects automation and responds with:
- Temporary action blocks ("This action was blocked. Please try again later.")
- Login challenges (CAPTCHA, phone verification)
- Account suspension in severe cases
- Silent failures where uploads appear to succeed but are never published

Known triggers:
- Posting at inhuman speed (< 1s between UI interactions)
- Using `element.click()` directly instead of synthetic mouse events with proper
  coordinates and timing
- Navigating to upload URLs directly without prior browsing behavior
- Consistent patterns in session timing (always posting at exactly the same intervals)
- Missing standard browser headers or `navigator.webdriver` being `true`

**Warning signs:**
- Upload succeeds in manual testing but fails in automated runs
- Account receives "We detected unusual activity" emails after extension use
- "Action blocked" modals appear
- Upload dialog closes without confirmation after file selection

**Prevention:**
1. **Never set `navigator.webdriver`** — content scripts run in the page context where
   this flag is already `false` for normal Chrome, but verify no devtools protocol
   commands are setting it.
2. Use realistic interaction timing: add random delays between UI steps (500ms–2000ms,
   jittered, not uniform).
3. Simulate human-like mouse events using `MouseEvent` with screen coordinates:
   ```javascript
   element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: x, clientY: y }))
   element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: x, clientY: y }))
   element.dispatchEvent(new MouseEvent('mouseup',   { bubbles: true, clientX: x, clientY: y }))
   element.dispatchEvent(new MouseEvent('click',     { bubbles: true, clientX: x, clientY: y }))
   ```
4. Do not navigate directly to `instagram.com/create/` — navigate to the home feed
   first, then trigger the upload button naturally.
5. Rate limit: no more than 1 post per 10 minutes from the extension. Instagram's
   informal limit for new-ish accounts is ~10 posts/day.
6. Implement exponential backoff on "action blocked" errors, with user notification.
7. Test on a dedicated throwaway account before using on production accounts.

**Phase:** Social publishing phase. Requires dedicated hardening sprint.

---

### SOC-2: Brittle CSS/XPath Selectors Break on Platform UI Updates
**Risk level:** High
**Confidence:** HIGH

**What goes wrong:**
Instagram, Facebook, X, and LinkedIn deploy frontend updates continuously without
versioning or notice. A selector like `button[data-testid="upload-button"]` or
`div._acas` stops working overnight. The extension silently fails, or worse, clicks the
wrong element.

This is the #1 cause of maintenance burden for social media automation tools.

**Warning signs:**
- Extension worked yesterday, fails today with no code changes
- "Element not found" errors logged from content scripts
- Wrong element is interacted with (e.g., the wrong button gets clicked)

**Prevention:**
1. **Multi-signal selector strategy**: never rely on a single selector. Use an ordered
   fallback chain:
   ```javascript
   const selectors = [
     '[data-testid="upload-photo-icon"]',       // test ID (most stable)
     'button[aria-label="New post"]',            // ARIA label (stable)
     'svg[aria-label="New post"]',               // SVG aria
     'button.x1ypdohk',                          // class (least stable, last resort)
   ];
   const el = selectors.reduce((found, sel) => found || document.querySelector(sel), null);
   ```
2. Use **ARIA attributes** (`aria-label`, `role`, `aria-describedby`) as primary
   selectors — they are tied to accessibility contracts and change less frequently
   than visual class names.
3. Add selector health checks: on extension startup, verify each platform's critical
   selectors resolve to at least one element. Log failures to `chrome.storage` for the
   user to see.
4. Design the selector registry as a configuration object (not hardcoded), updatable
   via a remote config fetch or a simple JSON file, so fixes can be deployed without
   a full extension update.
5. Build a "report broken" mechanism in the UI so users can signal failures.

**Phase:** Social publishing phase. Selector resilience must be a first-class concern,
not an afterthought.

---

### SOC-3: Session Not Logged In — Silent Failure or Wrong Navigation
**Risk level:** Medium-High
**Confidence:** HIGH

**What goes wrong:**
The extension assumes the user is already logged into each platform. When they are not:
- Content script may navigate to the login page and not detect this
- Upload logic runs against the login form, producing confusing errors
- The extension may submit credentials accidentally if the page has a username field

**Warning signs:**
- Automation detects the upload dialog but finds no "create post" button
- URL contains `/login`, `/accounts/login`, or `/session` during automation
- `document.cookie` is empty or lacks the expected session cookie name

**Prevention:**
1. Add a **pre-flight session check** before each platform interaction:
   - Instagram: check for `window._sharedData?.config?.viewer` or the presence of
     the home feed nav element
   - Facebook: check `document.querySelector('[aria-label="Facebook"]')` nav presence
     and absence of login form
   - X: check for `[data-testid="SideNav_AccountSwitcher_Button"]`
   - LinkedIn: check for `#global-nav` presence
2. If not logged in, pause the job and notify the user via a Chrome notification:
   `chrome.notifications.create()` with a "Log in to [Platform]" action button.
3. Provide a "Check sessions" button in the popup that runs pre-flight checks for
   all platforms and shows a traffic-light status.

**Phase:** Social publishing phase (foundation task before platform-specific logic).

---

### SOC-4: CORS and CSP Block Content Script Actions on Social Platforms
**Risk level:** Medium
**Confidence:** HIGH

**What goes wrong:**
Content scripts injected into Instagram/Facebook/X/LinkedIn pages run in an isolated
world with the page's DOM accessible, but:

1. **CSP on the platform page** may block dynamically injected `<script>` tags or
   blob URLs used to pass video data. Facebook in particular has an aggressive CSP
   that blocks `blob:` sources.
2. **CORS** blocks fetch requests made FROM the content script TO the platform's
   own API endpoints if those endpoints require first-party cookies that the fetch
   doesn't carry (cross-origin credentials restrictions).
3. **Programmatic file input assignment**: setting `input.files` via a `DataTransfer`
   object (the standard workaround for programmatic file uploads) may be blocked
   by platform JS that validates the File object's origin.

**Warning signs:**
- `Content Security Policy` errors in the console when content script runs
- File input accepts the file but upload progress never starts
- Fetch requests to the platform API fail with CORS errors from content script

**Prevention:**
1. Pass the video file as a `File` object constructed in the content script itself
   (not from the SW) using a `DataTransfer` workaround:
   ```javascript
   const dt = new DataTransfer();
   dt.items.add(new File([videoBlob], 'video.mp4', { type: 'video/mp4' }));
   fileInput.files = dt.files;
   fileInput.dispatchEvent(new Event('change', { bubbles: true }));
   ```
2. For blob data passing from SW → content script, use `chrome.runtime.sendMessage`
   with `ArrayBuffer` (transferable), not a blob URL.
3. Do not inject `<script>` tags into platform pages; use `chrome.scripting.executeScript`
   with the `world: 'MAIN'` option only when absolutely necessary to access page globals.
4. Handle upload via the platform's actual UI (drag-and-drop into the upload zone or
   file input) rather than API calls from the content script.

**Phase:** Social publishing phase.

---

### TEL-1: Telegram Polling Fails When Service Worker Sleeps
**Risk level:** High
**Confidence:** HIGH

**What goes wrong:**
Telegram bot polling (`getUpdates` long-poll with `timeout=25`) requires a persistent
connection or repeated HTTP requests. If this runs in the SW:
- The SW sleeps after 30s of no Chrome API events
- Long-polling with `timeout=25` keeps the fetch alive, which should keep the SW alive
  via an open fetch, but Chrome does NOT guarantee this — an idle SW with only an
  open fetch (no Chrome API event) can still be killed
- After wake-up, the SW must reconnect and may miss updates that were delivered during
  the sleep window (they accumulate at Telegram's server, but `offset` management is
  required to retrieve them correctly)

**Warning signs:**
- Telegram commands are sometimes processed immediately, sometimes after 30-60s delay
- Duplicate processing of the same update (offset not persisted)
- Console shows "SW restarted" coinciding with missed Telegram messages

**Prevention:**
1. Move Telegram polling entirely to an **Offscreen Document**. The offscreen document
   persists as long as it's open and the extension is running.
2. Use `chrome.alarms` to wake the SW every 25 seconds and trigger a Telegram
   `getUpdates` call with `timeout=0` (non-blocking), then go back to sleep. This is
   the only reliable SW-based approach.
3. Persist `lastUpdateId` (the Telegram offset) to `chrome.storage.local` after every
   processed update. On reconnect, read this value and pass `offset = lastUpdateId + 1`
   to avoid re-processing.
4. If the offscreen document approach is used, implement a heartbeat that re-creates
   the offscreen document if `chrome.offscreen.hasDocument()` returns false.
5. Implement a dead-letter queue: updates that arrive but cannot be processed
   immediately (because a job is already running) are queued in `chrome.storage.local`.

**Phase:** Telegram integration phase.

---

### TEL-2: Chrome Closes Mid-Publication — Job State Corrupt
**Risk level:** Medium
**Confidence:** HIGH

**What goes wrong:**
If Chrome is closed (or crashes) while a multi-platform publication is in progress:
- The job may have posted to Instagram but not LinkedIn
- The video file may have been uploaded to one platform and is now in draft state
- On next Chrome launch, the extension has no record of what was published and what was not
- Running the same job again results in duplicate posts

**Warning signs:**
- User reports double-posts on some platforms
- Extension shows "in progress" jobs that never complete after Chrome restart
- Storage contains stale "running" job status

**Prevention:**
1. Use a **per-step write-ahead log** in `chrome.storage.local`:
   ```json
   {
     "job_abc": {
       "status": "in_progress",
       "steps": {
         "instagram": "completed",
         "facebook": "completed",
         "twitter": "pending",
         "linkedin": "pending"
       }
     }
   }
   ```
2. On extension startup (`chrome.runtime.onInstalled` and `chrome.runtime.onStartup`),
   scan for jobs with `status: "in_progress"` and resume from the first `"pending"` step.
3. Each step must be idempotent — check if a post already exists before re-submitting.
   (For Instagram/FB, this is hard; at minimum, add a confirmation dialog: "Job was
   interrupted. Resume? Instagram may already have been posted.")
4. For posted-but-unconfirmed steps, mark as `"needs_verification"` and prompt the user
   to manually check rather than blindly re-posting.

**Phase:** Orchestration/job management phase. Must be designed before platform
publishing logic is built.

---

### FS-1: File System Access API Permissions Not Persisted Between Sessions
**Risk level:** Medium-High
**Confidence:** HIGH

**What goes wrong:**
`FileSystemDirectoryHandle` obtained via `showDirectoryPicker()` is not automatically
persistent. If stored in `chrome.storage.local`, the serialized handle loses its
permission grant after the browser session ends. On the next session, calling
`handle.requestPermission({ mode: 'read' })` is required — but this requires a user
gesture (a button click). It cannot be called from the SW or from an automated flow.

This means every time Chrome restarts, the user must click a button to re-grant
folder access before the extension can use it, which breaks unattended/scheduled
publishing flows.

**Warning signs:**
- "Permission denied" errors on folder access after browser restart
- `handle.queryPermission()` returns `"prompt"` instead of `"granted"`
- Automation works in the same session but fails after closing and reopening Chrome

**Prevention:**
1. Store the `FileSystemDirectoryHandle` in IndexedDB (not `chrome.storage`) — the
   File System Access API spec allows handles to survive serialization in IndexedDB
   and be restored in a new session (permission state is NOT preserved, but the handle
   object is).
2. On extension startup, check `handle.queryPermission()`. If it returns `"prompt"`,
   show a prominent UI prompt to the user asking them to click to restore access.
3. Design the UX to expect this: show a "Reconnect folder" button in the popup that
   is visually prominent when the permission is not active.
4. Document this limitation clearly in the extension's onboarding flow.
5. For completely unattended operation: consider using the `downloads` API with a
   known path instead of File System Access, as `chrome.downloads` can access the
   user's Downloads folder without requiring a picker each session.

**Phase:** File loading phase.

---

### FS-2: Source Folder Moved, Renamed, or Deleted
**Risk level:** Medium
**Confidence:** HIGH

**What goes wrong:**
A stored `FileSystemDirectoryHandle` becomes invalid if the underlying folder is moved,
renamed, or deleted. The handle does not automatically update its path. Calls on the
stale handle throw `NotFoundError` or `NotAllowedError` with no clear message to
the user. A queued publication job may be waiting to read a file that no longer exists.

**Warning signs:**
- `handle.getFileHandle()` throws `DOMException: NotFoundError`
- Jobs stay in "pending" indefinitely
- No user-facing error is shown

**Prevention:**
1. Validate the folder handle before starting any job: attempt to read a sentinel
   file or use `handle.resolve()` to confirm the handle is still valid.
2. On validation failure, mark all pending jobs as `"needs_relink"` and notify the
   user to re-select the folder.
3. Store the last-known folder path (as a string) in storage alongside the handle,
   so the error message can tell the user which folder to look for.
4. Implement graceful job failure: if a file is missing at job execution time, fail
   the job with a clear error rather than retrying indefinitely.

**Phase:** File loading phase.

---

### MV3-1: No Blocking webRequest in MV3 — Cannot Intercept/Modify Platform Requests
**Risk level:** Medium
**Confidence:** HIGH

**What goes wrong:**
MV3 removed `webRequest` blocking mode. Extensions can observe network requests but
cannot modify or block them synchronously. `declarativeNetRequest` is the replacement,
but it requires pre-declared rules and cannot dynamically respond to response bodies.

This matters for the social publishing flow if the implementation relies on intercepting
XHR/fetch responses from the platform (e.g., reading the upload success response to
get a media ID). Such response interception is no longer possible.

**Warning signs:**
- Attempting to use `webRequest.onBeforeRequest` with `blocking` returns a permission
  error or is silently ignored

**Prevention:**
1. Do not rely on network interception for upload confirmation. Instead, monitor the
   DOM for success indicators (the "Post shared" toast, the post appearing in the feed,
   etc.).
2. Use `chrome.webRequest.onCompleted` (non-blocking, still available) to detect when
   specific API calls complete, then trigger a DOM check.
3. Design confirmation logic around visual DOM signals, not network payloads.

**Phase:** Social publishing phase.

---

### MV3-2: eval() and Remote Code Execution Blocked in Extension Context
**Risk level:** Low-Medium
**Confidence:** HIGH

**What goes wrong:**
MV3 forbids `eval()`, `new Function()`, and fetching remote code for execution in
any extension page. This affects:
- Animation files that use `eval` internally (older JS animation libraries)
- Any attempt to load a CDN-hosted library at runtime in the extension context
- Template literal abuse that indirectly calls eval

**Warning signs:**
- Console: `EvalError: Refused to evaluate a string as JavaScript`
- An animation library silently fails

**Prevention:**
1. All libraries must be bundled with the extension at install time, not fetched from CDN.
2. User HTML animation files that use `eval` internally will fail if loaded in extension
   pages — route them through regular tabs (see CSP-1).
3. Audit all dependencies for indirect `eval` usage before bundling.

**Phase:** Foundation phase (build toolchain setup).

---

## Prioritized Risk List

Ordered by **likelihood × impact** for this specific project.

| Rank | Pitfall | Likelihood | Impact | Mitigation Priority |
|------|---------|-----------|--------|---------------------|
| 1 | **SW-1** Service worker killed mid-recording/posting | Very High | Critical (data loss, silent failure) | Must solve in architecture phase |
| 2 | **REC-2** MediaRecorder codec → platform rejects video | High | Critical (core feature broken) | Requires ffmpeg.wasm from day 1 |
| 3 | **SOC-2** Platform UI changes break selectors | High | High (feature stops working silently) | Resilient selector system required |
| 4 | **REC-1** Animation end detection unreliable | High | High (videos cut off or too long) | Cooperative protocol + fallbacks |
| 5 | **TEL-1** Telegram polling fails when SW sleeps | High | High (trigger mechanism broken) | Use offscreen doc + alarms |

**Next-tier risks requiring phase-specific mitigation:**
- CSP-1 (extension CSP blocks animation JS) — affects all users with inline-script HTML
- SOC-1 (Instagram anti-bot detection) — affects reliability of core publishing feature
- FS-1 (permission not persisted) — affects UX of every launch after initial setup

---

## Summary Table: Pitfall → Phase Mapping

| Pitfall | ID | Affects Phase |
|---------|----|---------------|
| SW killed mid-operation | SW-1 | Architecture / Foundation |
| In-memory state lost | SW-2 | Foundation |
| tabCapture restrictions | SW-3 | Recording pipeline |
| Extension CSP blocks HTML | CSP-1 | Recording pipeline |
| Animation end detection | REC-1 | Recording pipeline |
| Codec/format rejection | REC-2 | Recording + Upload pipeline |
| Memory exhaustion | REC-3 | Recording pipeline |
| Cross-origin local files | REC-4 | File loading + Recording |
| Instagram anti-bot | SOC-1 | Social publishing |
| Brittle selectors | SOC-2 | Social publishing |
| Session not logged in | SOC-3 | Social publishing |
| CORS/CSP in content scripts | SOC-4 | Social publishing |
| Telegram polling sleeps | TEL-1 | Telegram integration |
| Mid-publication Chrome close | TEL-2 | Orchestration/job management |
| FS permission not persistent | FS-1 | File loading |
| Source folder moved/deleted | FS-2 | File loading |
| No blocking webRequest | MV3-1 | Social publishing |
| eval() blocked | MV3-2 | Foundation |

---

*Researched: 2026-04-27*
*Confidence sources: Chrome Extension MV3 documentation (through August 2025 cutoff),
MDN MediaRecorder API, File System Access API spec, documented social platform
automation patterns. External tools (WebSearch, WebFetch, Bash) were unavailable
during this session; claims are drawn from training knowledge only. Items marked
MEDIUM confidence should be verified against current platform behavior before
implementation.*
