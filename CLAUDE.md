# SocialPublisher — Project Guide

## What This Is

Chrome Extension + Node.js local server that publishes HTML-rendered videos to Instagram and LinkedIn via Telegram bot commands. User places HTML files in `nuevas-publicaciones/`, sends "publica lo nuevo" to a Telegram bot, and the system records each HTML as video and publishes automatically.

## GSD Workflow

This project uses the GSD (Get Shit Done) workflow. Always follow this sequence:

1. `/gsd-discuss-phase N` — gather context and clarify approach before planning
2. `/gsd-plan-phase N` — break the phase into executable plans
3. `/gsd-execute-phase N` — execute plans with atomic commits
4. `/gsd-verify-work` — verify phase delivered what it promised

**Current state:** See `.planning/STATE.md`
**Roadmap:** See `.planning/ROADMAP.md`
**Requirements:** See `.planning/REQUIREMENTS.md`

## Architecture Overview

Two components:
- **`server/`** — Node.js/Express on localhost:3333. Handles: filesystem watcher, Telegram bot polling, file lifecycle (move + .meta.json), ffmpeg.wasm transcoding
- **`extension/`** — Chrome MV3. Handles: SW state machine, Offscreen Document for recording, content scripts for social media publishing

**Data flow:** Telegram command → server detects → extension SW polls → renders HTML → records → server transcodes → extension publishes → server archives

## Critical Constraints

- **Service Worker dies after ~30s** — all pipeline state MUST be persisted to `chrome.storage.local` before each step
- **MediaRecorder outputs WebM only** — ffmpeg.wasm transcoding to MP4 is mandatory (not optional)
- **Animation end detection** — HTML files MUST dispatch `window.parent.postMessage({ type: "gsd:done" }, "*")` when done; timeout fallback is 60s
- **Social publishing uses active sessions** — no OAuth, no official APIs; content scripts automate the browser UI

## File Structure Convention

```
nuevas-publicaciones/
  post.html          ← animation file
  post.caption.txt   ← caption text for the post

publicaciones-anteriores/
  post.html          ← archived after publishing
  post.meta.json     ← {date, platforms, status, videoSpecs}
```

## Development Notes

- Phase 3 (Recording) requires prototyping `chrome.tabCapture.getMediaStreamId` + Offscreen Document before implementing — this is the highest-risk API surface
- Phase 4 (Publishing) requires a throwaway Instagram/LinkedIn account for testing before touching production accounts
- Selector strategy for social platforms: ARIA attributes first (`aria-label`, `role`), CSS classes last resort

---
*Project initialized: 2026-04-27*
