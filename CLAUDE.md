# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Chrome Extension + Node.js local server that publishes HTML-rendered videos to Instagram and LinkedIn via Telegram bot commands. User places HTML files in `nuevas-publicaciones/`, sends "publica lo nuevo" to a Telegram bot, and the system records each HTML as video and publishes automatically.

## GSD Workflow

This project uses the GSD (Get Shit Done) workflow. Always follow this sequence:

1. `/gsd-discuss-phase N` — gather context and clarify approach before planning
2. `/gsd-plan-phase N` — break the phase into executable plans
3. `/gsd-execute-phase N` — execute plans with atomic commits
4. `/gsd-verify-work` — verify phase delivered what it promised

**Planning mode:** `yolo` / `coarse` granularity (move fast, high-level phases)  
**Current state:** See `.planning/STATE.md`  
**Roadmap:** See `.planning/ROADMAP.md`  
**Requirements:** See `.planning/REQUIREMENTS.md`

## Architecture Overview

Two components, built in order (server first, then extension):

- **`server/`** — Node.js/Express on `localhost:3333`. Handles: filesystem watcher (`chokidar` or `fs.watch`, TBD), Telegram bot long-polling, file lifecycle (move + `.meta.json`), ffmpeg.wasm transcoding. Uses `dotenv` for env vars.
- **`extension/`** — Chrome MV3. Handles: SW state machine polling `/api/status`, Offscreen Document for HTML rendering + video recording + ffmpeg.wasm transcoding, content scripts for social media UI automation.

**Data flow:**
```
Telegram "publica lo nuevo"
  → Server (long-polls Bot API)
  → Extension SW (polls GET /api/status every 6s via chrome.alarms)
  → Offscreen Document (renders HTML in iframe → MediaRecorder → ffmpeg.wasm → MP4)
  → Server (POST /api/video-ready → saves file)
  → Content Scripts (automate IG/LinkedIn DOM → publish)
  → Server (moves HTML → publicaciones-anteriores/, writes .meta.json)
  → Telegram confirmation
```

**Server API contract (Phase 1 defines, Phase 2+ consumes):**
- `GET /api/status` — returns pending posts and current pipeline state
- `GET /publicaciones/:filename` — serves HTML files for extension to render
- `POST /api/video-ready` — extension uploads transcoded MP4
- `POST /api/publish-complete` — extension reports publish result

## Tech Stack

**Server (Phase 1):** Node.js, Express, dotenv, chokidar (decision deferred to Claude), node-telegram-bot-api or raw fetch (decision deferred)

**Extension (Phases 2–4):** Manifest V3, `chrome.storage.local`, `chrome.alarms`, `chrome.offscreen`, `chrome.tabCapture`, `chrome.scripting`, IndexedDB (for persisted `FileSystemDirectoryHandle`), `@ffmpeg/ffmpeg` v0.12.x (wasm)

**Social publishing:** Content script DOM automation using active browser sessions — no OAuth, no official APIs. Use ARIA attributes first (`aria-label`, `role`), CSS classes only as last resort.

## Critical Constraints

- **Service Worker dies after ~30s** — ALL pipeline state MUST be persisted to `chrome.storage.local` before each step. SW cannot be kept alive with `setInterval`.
- **MediaRecorder outputs WebM only** — ffmpeg.wasm transcoding to MP4 is mandatory from Phase 3 Day 1 (Instagram rejects WebM).
- **Animation end detection** — HTML files MUST dispatch `window.parent.postMessage({ type: "gsd:done" }, "*")` when done; 60s timeout fallback only.
- **One Offscreen Document limit** — Chrome allows only one per extension at a time.
- **Telegram polling minimum interval** — 6 seconds in MV3 (chrome.alarms floor).
- **Sequential platform publishing** — One platform at a time; each failure must be isolated without blocking others.

## File Structure Convention

```
nuevas-publicaciones/
  post.html             ← animation file
  post.caption.txt      ← caption text (optional, falls back to filename)

publicaciones-anteriores/
  post.html             ← archived after publishing
  post.meta.json        ← {date, platforms, status, videoSpecs}
```

`.meta.json` schema: `{ date: ISO8601, platforms: string[], status: "success"|"partial"|"failed", videoSpecs: { width, height, fps, codec, duration } }`

## Development Notes

## Embedded Audio Contract (HTML -> MP4)

- Preferred audio mode is now embedded audio generated in HTML (Web Audio API), not external sidecar files.
- Each animated HTML that wants sound must:
  1. Generate audio in JS (for example with Web Audio API).
  2. Encode/export that audio as base64 (`audio/wav` recommended).
  3. Set:
     - `window.__GSD_EMBED_AUDIO_BASE64 = <base64>`
     - `window.__GSD_EMBED_AUDIO_MIME = "audio/wav"`
  4. Only after setting those values, send:
     - `window.parent.postMessage({ type: "gsd:done" }, "*")`
- If those fields are missing, renderer falls back to silent audio.
- Keep existing `gsd:done` timing contract unchanged.

- **Phase 3 (Recording)** is highest-risk: prototype `chrome.tabCapture.getMediaStreamId` + Offscreen Document before implementing. Seven open questions documented in `.planning/research/STACK.md`.
- **Phase 4 (Publishing)** requires a throwaway Instagram/LinkedIn account for testing before touching production accounts.
- **Top pitfalls** (full list in `.planning/research/PITFALLS.md`): SW killed mid-recording, codec mismatch on platform upload, platform UI selector fragility, animation-end detection unreliable, Telegram polling gaps.
- Library choices within Phase 1 (chokidar vs fs.watch, which Telegram client) are left to Claude's discretion — document the decision in a commit message.

---
*Project initialized: 2026-04-27*
