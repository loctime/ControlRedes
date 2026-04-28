# Phase 3: Recording Pipeline - Context

**Gathered:** 2026-04-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 delivers the end-to-end recording pipeline in the Chrome extension: load each pending HTML from the local server, render at 1080x1920, record until `gsd:done` or timeout, add post-animation buffer, transcode WebM to MP4 (H.264 + AAC), and report each result back to the server.

This phase does **not** publish to Instagram/LinkedIn (Phase 4), but it must produce stable publish-ready MP4 artifacts and sequentially process the queue.

</domain>

<decisions>
## Implementation Decisions

### Recording Architecture
- **D-01:** Use `chrome.offscreen` as the long-running worker for recording and transcoding.
- **D-02:** Use `chrome.tabCapture.getMediaStreamId` from service worker and consume stream in offscreen document via `getUserMedia`.
- **D-03:** Render source HTML in a normal Chrome tab from `http://localhost:3333/publicaciones/:filename` to avoid extension CSP issues with user HTML.
- **D-04:** Process one file at a time (strict sequential pipeline).

### Stop Conditions
- **D-05:** Primary stop signal is `window.parent.postMessage({ type: "gsd:done" }, "*")` from the rendered HTML.
- **D-06:** Timeout fallback is configurable, default 60s.
- **D-07:** Add configurable post-done buffer before stopping capture.

### State & Resilience
- **D-08:** Persist pipeline step state in `chrome.storage.local` before and after each critical step to survive SW restart.
- **D-09:** Persist per-file outcome (success/failure, timings, specs) for audit and resume behavior.

### Video Output
- **D-10:** MediaRecorder captures WebM only; transcode to MP4 with ffmpeg.wasm in offscreen document.
- **D-11:** Output target is 1080x1920, H.264 video + AAC audio.

</decisions>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md` - Phase 3 goal, requirements, success criteria
- `.planning/REQUIREMENTS.md` - REC-01..REC-06
- `.planning/STATE.md` - current project position
- `AGENTS.md` - hard constraints for SW lifecycle, offscreen, and recording contract
- `.planning/research/STACK.md` - tabCapture/offscreen/ffmpeg design notes
- `.planning/research/PITFALLS.md` - high-risk failure modes to mitigate in this phase

</canonical_refs>

<code_context>
## Existing Code Insights

### Available Integration Points
- `extension/service-worker.js` already initializes storage and polling alarm.
- `extension/lib/state.js` already provides mergeable persistent state helpers.
- `extension/lib/server-api.js` already fetches server status.
- Server API already exists for status and file serving.

### Missing Pieces
- No offscreen document assets yet.
- No recording orchestration state machine yet.
- No ffmpeg.wasm integration yet.
- No `/api/video-ready` reporting client in extension yet.

</code_context>

<specifics>
## Specific Ideas

- Keep recording orchestration in a dedicated module (`lib/recording-pipeline.js`) to isolate complexity from generic SW polling.
- Use explicit message contracts between SW and offscreen (`gsd:record-start`, `gsd:record-progress`, `gsd:record-complete`, `gsd:record-failed`).
- Keep per-file temp artifacts names deterministic for easier retries and debugging.

</specifics>

<deferred>
## Deferred Ideas

- Social DOM automation and selector resilience (Phase 4).
- Multi-ratio rendering or per-project output profiles (v2).

</deferred>

---

*Phase: 3-Recording Pipeline*
*Context gathered: 2026-04-28*