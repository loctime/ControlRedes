# Phase 1: Local Server Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-27
**Phase:** 1-Local Server Foundation
**Areas discussed:** Server ↔ Extension API, Server persistence, Bot credentials & config, Pipeline trigger logic

---

## Server ↔ Extension API

### Q1: How does the extension get pipeline state from the server?

| Option | Description | Selected |
|--------|-------------|----------|
| REST polling | Extension calls GET /status and GET /files on a timer. Simple, stateless, easy to debug. | ✓ |
| Server-Sent Events | Server pushes events to the extension as they happen. Reactive but adds SSE connection management. | |
| WebSocket | Bidirectional channel. Overkill for this one-directional flow. | |

**User's choice:** REST polling
**Notes:** User initially asked "you mean how the extension uploads videos?" — clarified the architecture (server knows files, extension processes them). After clarification, chose REST polling.

### Q2: Who moves files to publicaciones-anteriores/ and writes .meta.json?

| Option | Description | Selected |
|--------|-------------|----------|
| El servidor | Extension reports results via POST; server handles move + .meta.json. Extension never touches filesystem. | ✓ |
| La extensión | Extension uses File System Access API to move files and write .meta.json. Adds permission complexity. | |

**User's choice:** El servidor
**Notes:** Clean server-first separation. Extension is stateless with respect to the filesystem.

### Q3: How does the HTML file reach the extension for rendering?

| Option | Description | Selected |
|--------|-------------|----------|
| Server serves via HTTP | Extension opens localhost:3333/files/post.html in a tab. Simple, server already runs locally. | ✓ |
| Extension reads filesystem | Extension uses File System Access API to read HTML directly. Requires prior folder permissions. | |

**User's choice:** Server serves via HTTP

---

## Server Persistence

### Q1: How does the server run on Windows?

| Option | Description | Selected |
|--------|-------------|----------|
| Manual node server.js | Open a terminal and run node server.js when publishing. Simple, no extra installs. | ✓ |
| PM2 | Process manager, auto-restart, can run as Windows service. Requires global PM2 install. | |
| Windows Service | Runs as system service, starts with Windows. Complex setup (node-windows or NSSM). | |

**User's choice:** Manual node server.js
**Notes:** Simplest approach for Phase 1. Can evolve to PM2 later if needed.

### Q2: What terminal output on startup?

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal | Only startup message + Telegram events/errors. | ✓ |
| Verbose | Log every Telegram poll, folder change, HTTP request. Useful for debugging. | |

**User's choice:** Minimal

---

## Bot Credentials & Config

### Q1: Where are BOT_TOKEN and CHAT_ID stored?

| Option | Description | Selected |
|--------|-------------|----------|
| .env file | BOT_TOKEN=xxx and CHAT_ID=yyy in server/.env. Loaded via dotenv. Gitignored. | ✓ |
| config.json | Values in server/config.json. Non-standard but functional. | |
| System env vars | Set at Windows level. No extra file but inconvenient to edit. | |

**User's choice:** .env file

### Q2: How is CHAT_ID determined?

| Option | Description | Selected |
|--------|-------------|----------|
| CHAT_ID in .env (fixed) | Server only responds to the configured chat. Prevents unauthorized access. | ✓ |
| Detect first user | Server accepts commands from any chat. Flexible but no security. | |

**User's choice:** Fixed CHAT_ID in .env

---

## Pipeline Trigger Logic

### Q1: Which files are processed on "publica lo nuevo"?

| Option | Description | Selected |
|--------|-------------|----------|
| Everything in the folder | All .html files in nuevas-publicaciones/ at command time, alphabetical order. | ✓ |
| Only new since last command | Server tracks which files were already seen. More complex to implement. | |

**User's choice:** Everything in the folder

### Q2: What if the folder is empty?

| Option | Description | Selected |
|--------|-------------|----------|
| Bot responds "No hay archivos nuevos" | Clear message in Telegram, server does nothing else. | ✓ |
| No response | Silence — user must assume no files. | |

**User's choice:** Bot responds "No hay archivos nuevos"

### Q3: What if a pipeline is already running?

| Option | Description | Selected |
|--------|-------------|----------|
| Bot responds "Ya hay un pipeline activo" | Ignores the command, notifies via Telegram. One pipeline at a time. | ✓ |
| Queue the command | Second command waits for first to finish. More complex for Phase 1. | |

**User's choice:** Bot responds "Ya hay un pipeline activo"

---

## Claude's Discretion

- File watcher library choice (chokidar vs native fs.watch)
- Telegram long-polling library (node-telegram-bot-api vs raw HTTP)
- Express routing and middleware structure
- `.meta.json` schema fields beyond required minimum

## Deferred Ideas

None — discussion stayed within phase scope.
