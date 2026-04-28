'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const https = require('https');
const { chromium } = require('playwright');
const ffmpegPath = require('ffmpeg-static');

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runFfmpegFromFrames({ framesPattern, fps, outputPath, audioPath = null }) {
  return new Promise((resolve, reject) => {
    const hasAudio = Boolean(audioPath && fs.existsSync(audioPath));
    const args = [
      '-y',
      '-framerate', String(fps),
      '-i', framesPattern,
    ];

    if (hasAudio) {
      args.push('-i', audioPath);
    } else {
      args.push('-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100');
    }

    args.push(
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-af', 'loudnorm=I=-14:LRA=11:TP=-1.5',
      '-movflags', '+faststart',
      '-shortest',
      outputPath
    );

    const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`ffmpeg failed (${code}): ${stderr.slice(-500)}`));
    });
  });
}

function downloadToFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const req = client.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        downloadToFile(res.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`audio download failed: HTTP ${res.statusCode}`));
        return;
      }
      const out = fs.createWriteStream(destPath);
      res.pipe(out);
      out.on('finish', () => out.close(resolve));
      out.on('error', reject);
    });
    req.on('error', reject);
  });
}

function extensionFromMime(mime) {
  const type = String(mime || '').toLowerCase();
  if (type.includes('wav')) return '.wav';
  if (type.includes('mpeg') || type.includes('mp3')) return '.mp3';
  if (type.includes('ogg')) return '.ogg';
  if (type.includes('aac')) return '.aac';
  if (type.includes('m4a') || type.includes('mp4')) return '.m4a';
  return '.webm';
}

async function renderHtmlToVideo({
  htmlUrl,
  outputPath,
  companionAudioPath = null,
  width = 1080,
  height = 1920,
  fps = 30,
  timeoutSeconds = 60,
  bufferSeconds = 1.5,
}) {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'controlredes-frames-'));
  const framePattern = path.join(tmpRoot, 'frame_%06d.png');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width, height },
  });
  const page = await context.newPage();
  let exposedInjectedAudio = null;

  try {
    await page.exposeFunction('__gsdInjectAudio', async (payload) => {
      if (!payload || typeof payload !== 'object') {
        return;
      }
      if (typeof payload.base64 === 'string' && payload.base64.length > 0) {
        exposedInjectedAudio = {
          base64: payload.base64,
          mime: typeof payload.mime === 'string' ? payload.mime : 'audio/webm',
        };
      }
    });

    await page.addInitScript(() => {
      window.__GSD_DONE = false;
      window.__GSD_AUDIO_BASE64 = null;
      window.__GSD_AUDIO_MIME = 'audio/webm';
      window.__GSD_EMBED_AUDIO_BASE64 = null;
      window.__GSD_EMBED_AUDIO_MIME = null;

      window.addEventListener('message', (event) => {
        if (event?.data?.type === 'gsd:done') {
          if (typeof event.data.audioData === 'string' && event.data.audioData.length > 0) {
            window.__GSD_AUDIO_BASE64 = event.data.audioData;
          }
          if (typeof event.data.audioMime === 'string' && event.data.audioMime.length > 0) {
            window.__GSD_AUDIO_MIME = event.data.audioMime;
          }
          window.__GSD_DONE = true;
        }
      });
    });

    console.log(`[renderer] opening ${htmlUrl}`);
    await page.goto(htmlUrl, { waitUntil: 'networkidle', timeout: 30000 });
    page.on('pageerror', (error) => {
      console.warn(`[renderer][pageerror] ${error.message}`);
    });

    let mixedAudioPath = null;
    const pageAudioSources = await page.evaluate(() => {
      const direct = Array.from(document.querySelectorAll('audio')).map((el) => el.currentSrc || el.src || '');
      const sourceTags = Array.from(document.querySelectorAll('audio source')).map((el) => el.src || '');
      const candidates = [...direct, ...sourceTags]
        .filter(Boolean);
      return Array.from(new Set(candidates));
    });
    console.log(`[renderer] detected ${pageAudioSources.length} audio source(s) in HTML`);
    if (pageAudioSources.length > 0) {
      const firstAudio = pageAudioSources[0];
      let extension = '.audio';
      try {
        extension = path.extname(new URL(firstAudio, htmlUrl).pathname || '') || '.audio';
      } catch (_) {
        // no-op
      }
      const absoluteAudioUrl = new URL(firstAudio, htmlUrl).toString();
      const downloadedAudioPath = path.join(tmpRoot, `source_audio${extension}`);
      console.log(`[renderer] downloading audio from ${absoluteAudioUrl}`);
      await downloadToFile(absoluteAudioUrl, downloadedAudioPath).catch((error) => {
        console.warn(`[renderer] audio download failed: ${error.message}`);
        return null;
      });
      if (fs.existsSync(downloadedAudioPath)) {
        console.log(`[renderer] audio downloaded: ${downloadedAudioPath}`);
        mixedAudioPath = downloadedAudioPath;
      }
    }
    if (!mixedAudioPath && companionAudioPath && fs.existsSync(companionAudioPath)) {
      mixedAudioPath = companionAudioPath;
      console.log(`[renderer] using companion audio file: ${companionAudioPath}`);
    }

    const captureRect = await page.evaluate(() => {
      function isVisible(el) {
        const style = window.getComputedStyle(el);
        if (!style || style.display === 'none' || style.visibility === 'hidden') {
          return false;
        }
        const rect = el.getBoundingClientRect();
        return rect.width > 2 && rect.height > 2 && style.opacity !== '0';
      }

      function sanitizeRect(rect, vw, vh) {
        const x = Math.max(0, Math.floor(rect.left));
        const y = Math.max(0, Math.floor(rect.top));
        const right = Math.min(vw, Math.ceil(rect.right));
        const bottom = Math.min(vh, Math.ceil(rect.bottom));
        let w = Math.max(2, right - x);
        let h = Math.max(2, bottom - y);

        // H.264 yuv420p requires even dimensions.
        if (w % 2 !== 0) w -= 1;
        if (h % 2 !== 0) h -= 1;
        if (w < 2) w = 2;
        if (h < 2) h = 2;

        return { x, y, width: w, height: h };
      }

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const explicitRoot =
        document.querySelector('[data-gsd-capture-root]') ||
        document.querySelector('#gsd-capture-root');
      if (explicitRoot && isVisible(explicitRoot)) {
        return sanitizeRect(explicitRoot.getBoundingClientRect(), vw, vh);
      }

      const mediaNodes = Array.from(document.querySelectorAll('canvas, video, svg'));
      const mediaVisible = mediaNodes.filter(isVisible);
      if (mediaVisible.length > 0) {
        const union = mediaVisible.reduce(
          (acc, el) => {
            const r = el.getBoundingClientRect();
            acc.left = Math.min(acc.left, r.left);
            acc.top = Math.min(acc.top, r.top);
            acc.right = Math.max(acc.right, r.right);
            acc.bottom = Math.max(acc.bottom, r.bottom);
            return acc;
          },
          { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity }
        );
        return sanitizeRect(
          {
            left: union.left,
            top: union.top,
            right: union.right,
            bottom: union.bottom,
          },
          vw,
          vh
        );
      }

      const bodyChildren = Array.from(document.body ? document.body.children : []);
      const candidates = bodyChildren
        .filter(isVisible)
        .map((el) => {
          const rect = el.getBoundingClientRect();
          return {
            rect,
            area: rect.width * rect.height,
            fullAreaRatio: (rect.width * rect.height) / (vw * vh),
          };
        })
        // remove giant full-screen backgrounds/wrappers
        .filter((item) => item.fullAreaRatio < 0.92)
        .sort((a, b) => b.area - a.area);

      if (candidates.length > 0) {
        return sanitizeRect(candidates[0].rect, vw, vh);
      }

      return { x: 0, y: 0, width: vw - (vw % 2), height: vh - (vh % 2) };
    });

    const frameIntervalMs = Math.max(20, Math.floor(1000 / fps));
    const captureStart = Date.now();
    let doneAt = null;
    let frameIndex = 1;

    while (true) {
      const framePath = path.join(tmpRoot, `frame_${String(frameIndex).padStart(6, '0')}.png`);
      await page.screenshot({
        path: framePath,
        type: 'png',
        clip: captureRect,
      });
      frameIndex += 1;

      const now = Date.now();
      const elapsed = (now - captureStart) / 1000;
      if (!doneAt) {
        const isDone = await page.evaluate(() => Boolean(window.__GSD_DONE));
        if (isDone) {
          doneAt = now;
        }
        if (elapsed >= timeoutSeconds) {
          doneAt = now;
        }
      } else if ((now - doneAt) / 1000 >= bufferSeconds) {
        break;
      }

      await delay(frameIntervalMs);
    }

    if (!mixedAudioPath) {
      let injectedAudio = await page.evaluate(() => ({
        base64: window.__GSD_AUDIO_BASE64,
        mime: window.__GSD_AUDIO_MIME,
        embedBase64: window.__GSD_EMBED_AUDIO_BASE64,
        embedMime: window.__GSD_EMBED_AUDIO_MIME,
      }));
      if ((!injectedAudio || !injectedAudio.base64) && injectedAudio && injectedAudio.embedBase64) {
        injectedAudio = {
          base64: injectedAudio.embedBase64,
          mime: injectedAudio.embedMime || 'audio/webm',
        };
      }
      if ((!injectedAudio || !injectedAudio.base64) && exposedInjectedAudio) {
        injectedAudio = exposedInjectedAudio;
      }
      if (injectedAudio && injectedAudio.base64) {
        const injectedAudioPath = path.join(
          tmpRoot,
          `injected_audio${extensionFromMime(injectedAudio.mime)}`
        );
        fs.writeFileSync(injectedAudioPath, Buffer.from(injectedAudio.base64, 'base64'));
        mixedAudioPath = injectedAudioPath;
        console.log(`[renderer] using injected HTML audio (${injectedAudio.mime || 'audio/webm'})`);
      } else {
        console.log('[renderer] no injected HTML audio payload found');
      }
    }

    if (!mixedAudioPath) {
      console.log('[renderer] no audio found; exporting with silent fallback');
    }

    await runFfmpegFromFrames({
      framesPattern: framePattern,
      fps,
      outputPath,
      audioPath: mixedAudioPath,
    });
    console.log(`[renderer] exported mp4: ${outputPath}`);

    const durationSeconds = Math.max(1, Math.round((Date.now() - captureStart) / 1000));
    return {
      width: captureRect.width,
      height: captureRect.height,
      fps,
      codec: 'h264+aac',
      duration: durationSeconds,
      outputPath,
    };
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
    try {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    } catch (_) {
      // no-op
    }
  }
}

module.exports = { renderHtmlToVideo };
