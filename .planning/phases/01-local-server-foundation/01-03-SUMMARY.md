# 01-03 Summary

## lifecycle.js Functions

- `readCaption(filename)`: reads `[name].caption.txt` from `nuevas-publicaciones/`, falling back to the HTML basename.
- `markComplete(filename, platforms, status, videoSpecs)`: moves the HTML into `publicaciones-anteriores/` and writes `[name].meta.json`.
- `runPipeline(files, state, sendStatusFn, bot, chatId)`: Phase 1 pipeline loop with Telegram progress messages and archive bookkeeping.

## Integration Path

- `server/telegram.js` now calls `onTrigger(files, fromChatId)` without `await` after acknowledging the command.
- `server/server.js` passes `runPipeline(files, state, sendStatus, bot, chatId)` into that callback.

## Why sendStatus Is Injected

- Passing `sendStatusFn` as a parameter keeps `lifecycle.js` decoupled from Telegram internals, which makes local verification simpler and avoids a direct dependency.

## Telegram Messages Sent

- `Grabando {filename}...`
- `Publicando en Instagram...`
- `Publicando en LinkedIn...`
- `Completado ✓`
- `Error en pipeline: ...` on failure

## .meta.json Schema Written

```json
{
  "date": "ISO8601",
  "platforms": ["instagram", "linkedin"],
  "status": "success | partial | failed",
  "videoSpecs": {
    "width": 1080,
    "height": 1920,
    "fps": 30,
    "codec": "h264",
    "duration": 0
  }
}
```

## Deviations

- The Phase 1 pipeline uses placeholder video specs and publish stubs because real recording and DOM publishing belong to Phases 3 and 4.
