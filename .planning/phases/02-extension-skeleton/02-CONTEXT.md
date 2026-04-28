# Phase 2: Extension Skeleton - Context

**Gathered:** 2026-04-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 delivers the first installable Chrome MV3 extension under `extension/` and `dist/`. The extension must install without errors, persist pipeline state in `chrome.storage.local`, connect to the Phase 1 server on `localhost:3333`, and provide a minimal popup for folder selection/reconnection plus login checks for Instagram and LinkedIn.

This phase does **not** implement HTML recording or social publishing. It exists to establish the MV3 runtime, persistence model, setup UX, and server connectivity that Phase 3 and Phase 4 build on.

</domain>

<decisions>
## Implementation Decisions

### Architecture
- **D-01:** Use a plain MV3 extension structure (`manifest.json`, service worker, popup, shared modules) rather than adding a bundler immediately. Keep build friction minimal in this phase.
- **D-02:** Use `chrome.storage.local` as the source of truth for all pipeline/runtime state. Treat the service worker as disposable.
- **D-03:** Use `chrome.alarms` for polling the local server. Do not use `setInterval` in the service worker.
- **D-04:** Keep the popup intentionally small: folder setup, server connection status, and login verification status only.

### Filesystem Setup
- **D-05:** Folder selection happens from the popup using `window.showDirectoryPicker()` because it requires a user gesture.
- **D-06:** Persist the `FileSystemDirectoryHandle` in IndexedDB, not `chrome.storage.local`.
- **D-07:** The popup must surface a clear reconnect state when permission is lost between sessions.

### Server Connectivity
- **D-08:** Phase 2 consumes the Phase 1 server contract as-is:
  - `GET /api/status`
  - `GET /api/files`
  - `GET /api/files/:filename`
- **D-09:** The extension polls `GET /api/status` every 6 seconds via `chrome.alarms`, matching the MV3-friendly cadence already assumed in project docs.

### Login Checks
- **D-10:** Login verification in this phase is a lightweight pre-flight check only. It should detect whether Instagram and LinkedIn appear logged in, but should not automate posting or mutate platform state.

</decisions>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md` - Phase 2 goal, requirements, success criteria
- `.planning/REQUIREMENTS.md` - INFRA-03, INFRA-04, SETUP-01, SETUP-02, SETUP-03
- `.planning/PROJECT.md` - project constraints and evolution guidance
- `AGENTS.md` / `CLAUDE.md` - MV3 constraints, polling expectations, server-extension split
- `.planning/research/STACK.md` - MV3, alarms, offscreen, filesystem, Telegram architecture research
- `.planning/research/PITFALLS.md` - SW restart, storage, folder permission pitfalls

</canonical_refs>

<code_context>
## Existing Code Insights

### Available Integration Points
- `server/server.js` exposes the Phase 1 server contract and is already verified live.
- `GET /api/status` returns `{ pipeline, pendingFiles, activeFile }`.
- `GET /api/files` returns `{ files }`.
- `GET /api/files/:filename` serves HTML for future Phase 3 recording.

### Missing Pieces
- No `extension/` directory exists yet.
- No `dist/` build output exists yet.
- No IndexedDB helper, popup UI, or service worker logic exists yet.

</code_context>

<specifics>
## Specific Ideas

- Keep the popup UI utilitarian, not polished. The main job is setup clarity, not design.
- Prefer small shared modules for storage, server polling, and login checks so Phase 3 can reuse them.
- Leave an obvious seam for an offscreen document later, but do not force it into Phase 2 unless a stub helps reduce later churn.

</specifics>

<deferred>
## Deferred Ideas

- Offscreen document implementation for recording is Phase 3.
- ffmpeg.wasm integration is Phase 3.
- DOM automation for publishing is Phase 4.
- Multi-platform configuration UI is out of scope for this phase.

</deferred>

---

*Phase: 2-Extension Skeleton*
*Context gathered: 2026-04-28*
