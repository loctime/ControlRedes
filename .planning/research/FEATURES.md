# Features Research

> **Confidence note:** WebSearch and WebFetch were unavailable in this session.
> Platform specs are drawn from training data (cutoff Aug 2025) cross-referenced
> against known-stable platform documentation. Specs flagged LOW confidence should
> be verified against official help centers before implementation.

---

## Platform Video Requirements

### Instagram / Reels

| Requirement | Specification | Confidence |
|-------------|--------------|------------|
| Aspect ratio | **9:16 required** for Reels (1080x1920 px) | HIGH |
| Resolution | 1080 x 1920 px minimum recommended | HIGH |
| Duration | 3 seconds – 90 seconds per Reel | HIGH |
| File size | Up to 1 GB | MEDIUM |
| Codec | H.264 video, AAC audio | HIGH |
| Container | MP4 or MOV | HIGH |
| Frame rate | 23–60 fps | HIGH |
| Max bitrate | ~3500 kbps for 1080p | MEDIUM |
| Caption limit | 2,200 characters | HIGH |
| Hashtags | Up to 30; 3–11 recommended for reach | MEDIUM |
| Cover image | Optional; pulled from video if not set | HIGH |

**Reels-specific notes:**
- 9:16 is non-negotiable. 1:1 and 4:5 content is cropped/pillarboxed by Instagram,
  so the recorder should default to 1080x1920 output.
- Audio track is strongly recommended for reach; silent videos surface less.
- The Graph API allows Reels uploads via `/me/video_reels` with a resumable
  upload flow. Requires `instagram_content_publish` permission scope.

---

### Facebook

| Requirement | Specification | Confidence |
|-------------|--------------|------------|
| Aspect ratio | 9:16, 16:9, 1:1, 4:5 all accepted | HIGH |
| Resolution | 1080 px minimum on shortest side | HIGH |
| Duration | Up to **4 hours** (pages/ads: 240 min) | HIGH |
| File size | Up to **10 GB** via API | HIGH |
| Codec | H.264 video, AAC audio | HIGH |
| Container | MP4 preferred; MOV accepted | HIGH |
| Frame rate | 24–60 fps | HIGH |
| Caption limit | 63,206 characters | HIGH |
| Reels (FB) | Same as Instagram Reels: 9:16, ≤90 s | HIGH |

**Facebook-specific notes:**
- Facebook Reels (separate from Instagram Reels) also accepts 9:16, ≤90 s.
- Regular video posts are much more permissive on duration and size.
- For a recording-from-HTML workflow the limiting factor is Instagram, so
  9:16 / ≤90 s / ≤1 GB should be the shared target to cover both IG and FB Reels.
- API: Graph API `/me/videos` with `published=true` or schedule with
  `scheduled_publish_time`.

---

### X / Twitter

| Requirement | Specification | Confidence |
|-------------|--------------|------------|
| Aspect ratio | 1:2.39 – 2.39:1 range accepted; 16:9 and 9:16 both work | HIGH |
| Resolution | 32x32 minimum, 1920x1200 maximum | HIGH |
| Duration | Up to **140 seconds** (≤2 min 20 s) | HIGH |
| File size | Up to **512 MB** | HIGH |
| Codec | H.264 (Baseline, Main, High), AAC audio | HIGH |
| Container | MP4 or MOV | HIGH |
| Frame rate | 40 fps max | MEDIUM |
| Caption limit | 280 characters (video takes ~23 chars for URL if native upload) | HIGH |
| Hashtags | 1–2 recommended; excessive hashtags reduce reach | MEDIUM |

**X-specific notes:**
- 512 MB file size is the hard cap for the v1.1 and v2 APIs as of 2024.
- Native video uploads (not URL embeds) require a chunked media upload
  via `POST media/upload` (INIT/APPEND/FINALIZE steps), then attach to tweet.
- 9:16 video will be letterboxed in the feed preview; 16:9 displays better
  in native player. For a Reels-first workflow, 9:16 still posts fine.
- Rate limit: 300 tweets per 15 min per user token; media uploads are separate.

---

### LinkedIn

| Requirement | Specification | Confidence |
|-------------|--------------|------------|
| Aspect ratio | 1:2.4 – 2.4:1 range; 9:16, 16:9, 1:1, 4:5 all accepted | HIGH |
| Resolution | 256x144 minimum; 4096x2304 maximum | HIGH |
| Duration | 3 seconds – **10 minutes** | HIGH |
| File size | Up to **5 GB** | HIGH |
| Codec | H.264 video, AAC audio | HIGH |
| Container | MP4 | HIGH |
| Frame rate | 10–60 fps | HIGH |
| Caption limit | 3,000 characters for post text | HIGH |
| Hashtags | 3–5 recommended | MEDIUM |

**LinkedIn-specific notes:**
- LinkedIn treats 9:16 natively as vertical video, especially in the mobile feed.
- API: LinkedIn Video API uses a two-step flow — register upload via
  `POST /rest/videos` (get upload URL), then PUT binary, then mark finalized.
  Requires `w_member_social` OAuth scope.
- Company page posts: use `author=urn:li:organization:{id}` instead of
  `author=urn:li:person:{id}`.

---

### Shared Recording Target (for HTML-to-video pipeline)

Given the constraints above, the recorder should produce **one canonical format**
that satisfies all four platforms:

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Container | MP4 | Universally accepted |
| Codec | H.264 + AAC | All four platforms require it |
| Resolution | 1080x1920 (9:16) | Instagram Reels hard requirement; accepted by all others |
| Duration | ≤90 seconds | Instagram Reels cap; all others are more permissive |
| File size | ≤500 MB | Conservative limit that fits under X's 512 MB hard cap |
| Frame rate | 30 fps | Safe middle ground; accepted everywhere |
| Audio | Required (silent optional) | Affects Instagram reach |

If a user's HTML content is natively landscape (16:9), the recorder should
either pillarbox it into 9:16 or allow a platform-specific override. See
Anti-Features for why multi-ratio exports are deferred to v2.

---

## Feature Categories

### Table Stakes

Features without which the tool cannot function or will feel broken to any user.

| Feature | Why Required | Notes |
|---------|-------------|-------|
| **Folder watcher for `nuevas-publicaciones/`** | Core trigger; without this nothing starts | Use `fs.watch` or chokidar in the extension's background service worker |
| **Telegram bot command parsing** | `"publica lo nuevo"` is the primary UX surface | Must parse Spanish-language commands; at minimum this one |
| **HTML-to-video recording** | The entire value proposition; no recording = no product | Chrome extension `tabCapture` + MediaRecorder API |
| **Multi-platform sequential publish** | Posts to IG, FB, X, LinkedIn in one command | Failure on one platform must not abort the rest |
| **Per-platform authentication storage** | OAuth tokens for each network must persist | Store encrypted in `chrome.storage.local` or OS keychain |
| **Caption/description per post** | Every platform requires text alongside video | Must be derivable from HTML metadata or a sidecar file |
| **Move processed files to `publicaciones-anteriores/`** | Users need to know what was published | Include metadata alongside the moved file |
| **Error reporting via Telegram** | User has no other feedback channel | Bot must reply with per-platform success/failure |
| **Telegram bot authentication** | Bot must only accept commands from the owner | Validate `chat_id` or use a private bot token |
| **Video format compliance** | Each platform rejects non-compliant videos silently | Must enforce: 9:16, H.264, ≤90 s, ≤500 MB |
| **Re-record / retry on encode failure** | Encoding can fail on complex HTML | Must detect failed MediaRecorder output and retry once |
| **Status feedback during long operations** | Recording 90s + 4 uploads can take 3–5 min | Bot should send "Grabando...", "Publicando en IG...", etc. |

---

### Differentiators

Features that provide competitive advantage or meaningfully improve the workflow,
but are not required for the tool to function in v1.

| Feature | Value | Complexity |
|---------|-------|------------|
| **Caption sidecar files** (`.caption.txt` alongside `.html`) | User controls caption per-platform per-post without editing HTML | Low |
| **Per-platform caption variants** (`.caption.instagram.txt`, `.caption.linkedin.txt`) | LinkedIn posts need more professional tone; X has 280-char limit | Low-Medium |
| **Hashtag file** (`.hashtags.txt` or YAML frontmatter) | Allows reuse of hashtag sets without duplicating text | Low |
| **Scheduled publication** (`"publica mañana a las 9"`) | Matches Buffer/Hootsuite's killer feature | Medium-High |
| **Platform selector** (`"publica en instagram y linkedin"`) | Avoid posting to X when content is IG-only | Medium |
| **Preview thumbnail selection** | LinkedIn and Facebook support custom thumbnails | Medium |
| **Silent-mode recording** (no audio channel) | HTML animations often have no audio; reducing file size is good | Low |
| **Dry-run command** (`"simula publicación"`) | Shows what would be posted without actually posting | Low |
| **Publication history Telegram query** (`"qué publiqué esta semana"`) | Bot answers from `publicaciones-anteriores/` metadata | Medium |
| **Duplicate detection** | Warns if the same HTML file has already been published | Low |
| **Multi-ratio export** (9:16 primary + 16:9 secondary) | Post landscape to LinkedIn, portrait to IG from same HTML | High |
| **Webhook / n8n integration** | Fire a webhook after each publication for external automation | Low |
| **Chrome extension popup UI** | Visual dashboard showing connected accounts and queue | Medium |

---

### Anti-Features (v1 Exclusions)

Things to deliberately NOT build in v1. Including them adds surface area that
delays shipping and creates maintenance debt before the core loop is validated.

| Anti-Feature | Why Skip | What to Do Instead |
|--------------|----------|--------------------|
| **Built-in caption editor / UI** | Adds UI complexity; sidecar text files are simpler and composable | Use `.caption.txt` sidecar convention |
| **Hashtag analytics** | Requires tracking API calls and storage; no value until post history exists | Defer to v3+ |
| **Multi-account per platform** | Doubles auth complexity; user has one brand | Support one account per platform |
| **Video editing (trim, splice)** | Not the tool's job; HTML defines the content | Record exactly what the HTML renders |
| **Direct story / carousel publishing** | Different API endpoints and UX conventions | Reels-only in v1 |
| **Pinterest, TikTok, YouTube Shorts** | Different APIs, auth flows, and video specs | Prove value on 4 platforms first |
| **Team collaboration / multi-user** | Adds access control, billing, sharing logic | Single-user Chrome extension |
| **Cloud storage sync (S3, Drive)** | `publicaciones-anteriores/` local folder is sufficient | Add if user requests it later |
| **AI caption generation** | Tempting but adds LLM API dependency and cost | User writes captions in sidecar files |
| **Analytics dashboard** | No value without historical data; platforms have native analytics | Defer; link to native analytics instead |
| **Built-in Telegram bot setup wizard** | Users can set up a bot via BotFather once; not worth building | Document it in README |
| **Automatic retry on platform API rate-limit** | Complex backoff logic; rate limits rarely hit for 1 user/day | Report error to user via Telegram, let them retry |

---

## Caption & Metadata

### What each platform needs at post time

| Platform | Required | Optional | Character Limit | Notes |
|----------|----------|----------|-----------------|-------|
| **Instagram** | Caption text | Hashtags, cover frame, alt text | 2,200 chars | Hashtags in caption or first comment; links in caption not clickable |
| **Facebook** | Post text | Hashtags, tags, location, cover thumb | 63,206 chars | First 477 chars shown before "See more"; links in text are clickable |
| **X / Twitter** | Tweet text | Alt text for media | 280 chars total | Count includes spaces; URL counts ~23 chars even if short |
| **LinkedIn** | Post text | Hashtags, thumbnail, article link | 3,000 chars | No link previews on video posts; hashtags in body text |

### Caption resolution order (recommended)

The system should look for captions in this priority order per post:

```
1. [filename].caption.[platform].txt   (e.g., intro.caption.instagram.txt)
2. [filename].caption.txt              (platform-agnostic caption)
3. HTML <meta name="description">      (fallback extracted from HTML head)
4. HTML <title>                        (last fallback; just the title)
5. Empty string                        (platform may reject; warn user)
```

### Per-platform caption handling

**Instagram:**
- Strip links (not clickable; waste characters).
- Append hashtag block from `.hashtags.txt` if present.
- If caption > 2,200 chars, truncate and warn via Telegram.

**Facebook:**
- Links are clickable; include CTA link if present in sidecar.
- No automatic hashtag injection needed (FB hashtags have less effect).

**X / Twitter:**
- Hard truncation at 280 chars minus the video attachment token (~23 chars).
- Effective limit: ~257 usable characters.
- Warn user via Telegram if caption source exceeds this.
- Do not append hashtags by default — they eat into character budget.

**LinkedIn:**
- Professional tone expected. Use the platform-specific caption if provided.
- Hashtags in body text (LinkedIn indexes them).
- 3,000 char limit is generous; rarely a problem.

---

## Publication Metadata Schema

When a processed HTML file is moved from `nuevas-publicaciones/` to
`publicaciones-anteriores/`, a companion `.json` sidecar should be written
alongside it.

### File naming convention

```
publicaciones-anteriores/
  2026-04-27_intro-animacion.html          ← original HTML
  2026-04-27_intro-animacion.mp4           ← recorded video (canonical 9:16)
  2026-04-27_intro-animacion.meta.json     ← publication metadata
  2026-04-27_intro-animacion.caption.txt   ← caption used (if sidecar existed)
```

### `.meta.json` schema

```json
{
  "schema_version": "1.0",
  "source_file": "intro-animacion.html",
  "source_hash": "sha256:abc123...",
  "recorded_at": "2026-04-27T09:12:34Z",
  "video_file": "2026-04-27_intro-animacion.mp4",
  "video": {
    "duration_seconds": 30,
    "width": 1080,
    "height": 1920,
    "fps": 30,
    "codec": "H.264",
    "size_bytes": 18432000
  },
  "triggered_by": "telegram",
  "telegram_chat_id": "123456789",
  "caption_source": "sidecar",
  "caption_used": "¡Nuevo lanzamiento! Conoce nuestra colección primavera. #moda #tendencias",
  "platforms": {
    "instagram": {
      "status": "published",
      "published_at": "2026-04-27T09:14:02Z",
      "post_id": "17854360229135492",
      "url": "https://www.instagram.com/reel/Cxyz...",
      "caption_chars": 68
    },
    "facebook": {
      "status": "published",
      "published_at": "2026-04-27T09:14:45Z",
      "post_id": "123456789_987654321",
      "url": "https://www.facebook.com/...",
      "caption_chars": 68
    },
    "twitter": {
      "status": "failed",
      "published_at": null,
      "post_id": null,
      "url": null,
      "error": "MediaUpload: file size 521 MB exceeds 512 MB limit",
      "caption_chars": 68
    },
    "linkedin": {
      "status": "published",
      "published_at": "2026-04-27T09:16:20Z",
      "post_id": "urn:li:ugcPost:7012345678901234567",
      "url": "https://www.linkedin.com/feed/update/...",
      "caption_chars": 68
    }
  }
}
```

### Status values for `platforms[n].status`

| Value | Meaning |
|-------|---------|
| `published` | Successfully posted; `post_id` and `url` are populated |
| `failed` | API call failed; `error` field contains reason |
| `skipped` | User excluded this platform in the command |
| `pending` | Queued for scheduled publication (v2 feature) |

### Why store the source hash

SHA-256 of the original HTML enables duplicate detection: if the user drops the
same HTML file again (perhaps renamed), the system can warn before re-publishing
the same content.

---

## Notes on Social Media Tool Ecosystem Patterns

The following patterns are drawn from Buffer, Hootsuite, Later, and Publer and
represent the baseline expectations users carry into any publishing tool.

**What users expect from a publishing tool (regardless of UI):**
1. "Post once, publish everywhere" — single action pushes to all connected platforms.
2. Confirmation of what was posted — link back to the live post or explicit success message.
3. Failure isolation — one platform failing does not silently kill the others.
4. A record of past posts — even a folder of files satisfies this expectation.
5. Auth stays connected — no manual re-auth every session (refresh token handling).

**What Buffer/Hootsuite do that this tool deliberately should not replicate:**
- Web UI for post composition (Telegram bot is the intentional alternative).
- Calendar / scheduling grid (deferred to v2).
- Team approval workflows (single-user tool).
- Per-post analytics (native platform analytics are sufficient).

**The key differentiator of this tool over SaaS alternatives:**
HTML-as-source-of-truth. No SaaS tool accepts HTML as input. This tool's unique
value is recording animated HTML content that cannot be composed in a generic
post editor. The Telegram-command UX further differentiates it from web-dashboard
tools by keeping the workflow in the messaging app the user already uses.

---

*Researched: 2026-04-27*
*Confidence: Platform video specs HIGH (training data, stable platform requirements). Ecosystem patterns HIGH (well-established category). API-specific details (endpoint paths, scope names) MEDIUM — verify against official API docs before implementation.*
