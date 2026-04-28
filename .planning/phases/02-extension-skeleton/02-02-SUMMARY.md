# 02-02 Summary

## Popup Setup UI

- Added a minimal popup with sections for:
  - local server status
  - source folder status
  - login status
- Added actions:
  - `Seleccionar carpeta`
  - `Reconectar carpeta`
  - `Actualizar`

## Folder Handle Persistence

- Implemented IndexedDB-backed persistence in `extension/lib/folder-handle.js`.
- The popup stores and restores a `FileSystemDirectoryHandle` without relying on `chrome.storage.local`.
- Permission state is synchronized back into `chrome.storage.local` so the service worker can observe it.

## Reconnect Behavior

- When no folder exists, popup shows `Not configured`.
- When permission falls back to prompt, popup shows `Reconnect folder`.
- When permission is active, popup shows `Folder ready`.

## Deviations

- The popup is intentionally utilitarian rather than polished. The priority was setup clarity and Phase 3 readiness, not final UX styling.
