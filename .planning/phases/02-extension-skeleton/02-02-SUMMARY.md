# 02-02 Summary

## Popup Setup UI

- Added a minimal popup with sections for:
  - local server status
  - source folder status
  - login status
- Added actions:
  - `Actualizar`

## Filesystem Ownership

- During verification, Chrome exposed that `window.showDirectoryPicker()` was not available in the extension flow being used.
- Rather than forcing a brittle workaround, Phase 2 was aligned with the real architecture: the Node server owns filesystem access.
- The popup now communicates `Server-owned` for the source folder instead of pretending the extension manages it directly.

## Resulting Behavior

- The popup no longer attempts to request direct folder access.
- The extension persists `folderPermission: 'server_owned'` to keep state coherent with the server-first design.
- This removes a false UX path while preserving the real integration boundary needed by Phase 3.

## Deviations

- The original plan mentioned direct folder selection/reconnect, but the verified browser behavior showed that path was not reliable in this extension context and not necessary for the current architecture.
