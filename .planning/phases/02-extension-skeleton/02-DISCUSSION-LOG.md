# Phase 2 Discussion Log

**Date:** 2026-04-28

## Outcome

- Keep the roadmap order as defined.
- Treat Phase 2 as an enabling phase for Phase 3, not as a detour into publishing logic.
- Prioritize:
  - installable MV3 skeleton
  - persistent state in `chrome.storage.local`
  - popup-based folder setup and reconnect flow
  - basic server connectivity
  - lightweight login checks only

## Explicit Non-Goals

- No real HTML recording yet
- No offscreen recording pipeline yet
- No DOM automation for publishing yet

## Rationale

Recording HTML -> MP4 is more important than social publishing for project risk reduction, but it still depends on the extension shell existing first. Therefore Phase 2 should stay small and unblock Phase 3 as quickly as possible.
