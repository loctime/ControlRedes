# 01-02 Summary

## telegram.js Structure

- `initBot(state, onTrigger)`: boots long-polling, filters by `CHAT_ID`, validates the exact trigger, and starts the pipeline callback.
- `sendStatus(bot, chatId, text)`: safe status sender that swallows Telegram transport errors so the pipeline can continue.

## Guards Implemented

- Unauthorized chats are ignored silently.
- Non-matching messages are ignored silently.
- Empty queue replies with `No hay archivos nuevos`.
- Active pipeline replies with `Ya hay un pipeline activo`.

## server.js Changes

- Imported `initBot` and `sendStatus` from `server/telegram.js`.
- Added lazy `getBot: () => bot` export so later code can access the bot after startup.
- Kept startup log output unchanged while wiring Telegram initialization through `app.listen(...)`.

## Stub Endpoints

- `POST /api/video-ready` -> `{ received: true }`
- `POST /api/publish-complete` -> `{ received: true }`

## Deviations

- `initBot` was implemented with the `onTrigger` callback already in place so Wave 3 could attach the lifecycle pipeline without rewriting the module shape later.
