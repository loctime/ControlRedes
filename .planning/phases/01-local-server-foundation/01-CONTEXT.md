# Phase 1: Local Server Foundation - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers a Node.js/Express server (`server/`) that runs persistently on localhost:3333, watches `nuevas-publicaciones/` for HTML files, polls Telegram for the "publica lo nuevo" command, manages the full file lifecycle (caption reading, archiving, metadata writing), and sends Telegram status updates throughout the pipeline. This is the foundation layer that all subsequent phases (extension, recording, publishing) depend on.

</domain>

<decisions>
## Implementation Decisions

### Server ↔ Extension API
- **D-01:** Extension communicates with server via **REST polling** — not SSE or WebSocket. Extension calls `GET /status` and `GET /files` on a timer to check pipeline state.
- **D-02:** Server serves HTML files for rendering at `GET /files/:filename` via HTTP (localhost:3333). Extension opens `http://localhost:3333/files/post.html` in a tab to render and record it.
- **D-03:** Extension reports publish results to server via a POST endpoint. Server handles all filesystem operations: moves HTML to `publicaciones-anteriores/` and writes `.meta.json`. The extension never touches the filesystem directly.

### Server Startup & Operation
- **D-04:** Server started manually with `node server.js` (or `npm start`). No PM2 or Windows Service required in Phase 1.
- **D-05:** Startup output is minimal — log only: `"Server running on localhost:3333 | Watching nuevas-publicaciones/"`. After startup, log only Telegram events and errors (no per-poll noise).

### Bot Credentials & Configuration
- **D-06:** `BOT_TOKEN` and `CHAT_ID` are stored in a `.env` file inside `server/`. Loaded via dotenv at startup. `.env` is gitignored.
- **D-07:** Server only processes Telegram messages from the configured `CHAT_ID`. Messages from any other chat are silently ignored.

### Pipeline Trigger Logic
- **D-08:** "publica lo nuevo" triggers processing of **all `.html` files currently in `nuevas-publicaciones/`**, in alphabetical order. No tracking of "already seen" files — the folder state at command time is the truth.
- **D-09:** If the folder is empty when the command arrives, bot responds: `"No hay archivos nuevos"` and does nothing further.
- **D-10:** If a pipeline is already active when a second "publica lo nuevo" arrives, bot responds: `"Ya hay un pipeline activo"` and ignores the command. Only one pipeline runs at a time.

### Claude's Discretion
- File watcher library choice (chokidar vs native fs.watch) — Claude decides based on reliability on Windows.
- Telegram long-polling library (node-telegram-bot-api vs raw HTTP) — Claude decides based on maintenance status and simplicity.
- HTTP framework details (Express routing structure, middleware) — Claude decides following Node.js best practices.
- `.meta.json` schema structure beyond the required fields (date, platforms, status, videoSpecs) — Claude decides.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation
- `.planning/ROADMAP.md` — Phase 1 goal, requirements list (INFRA-01, INFRA-02, TELE-01, TELE-02, FILE-01–04), success criteria
- `.planning/REQUIREMENTS.md` — Full requirement definitions for all Phase 1 requirements
- `.planning/PROJECT.md` — Architecture overview, core value, key decisions, constraints

### Architecture Constraints
- `CLAUDE.md` — Critical constraints: file lifecycle conventions (nuevas-publicaciones/ → publicaciones-anteriores/ + .meta.json), data flow, server-extension split, .meta.json required fields

No external specs or ADRs — all architectural decisions are captured above and in the planning files.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — fresh project, no existing code.

### Established Patterns
- None — this phase establishes the foundational patterns for all subsequent phases.

### Integration Points
- `GET /status` and `GET /files` endpoints are the Phase 2 entry points — Phase 2 extension will poll these.
- `GET /files/:filename` endpoint is the Phase 3 entry point — Phase 3 extension opens this URL in a tab for recording.
- POST endpoint for publish results is the Phase 4 entry point — Phase 4 extension calls this after publishing each file.

</code_context>

<specifics>
## Specific Ideas

No specific UI or behavior references from discussion — all decisions were made fresh from options presented. Open to standard Node.js/Express approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Local Server Foundation*
*Context gathered: 2026-04-27*
