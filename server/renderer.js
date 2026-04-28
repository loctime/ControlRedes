'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');
const ffmpegPath = require('ffmpeg-static');

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runFfmpegFromFrames({ framesPattern, fps, outputPath }) {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-framerate', String(fps),
      '-i', framesPattern,
      '-f', 'lavfi',
      '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-shortest',
      outputPath,
    ];

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

async function renderHtmlToVideo({
  htmlUrl,
  outputPath,
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

  try {
    await page.addInitScript(() => {
      window.__GSD_DONE = false;
      window.addEventListener('message', (event) => {
        if (event?.data?.type === 'gsd:done') {
          window.__GSD_DONE = true;
        }
      });
    });

    await page.goto(htmlUrl, { waitUntil: 'networkidle', timeout: 30000 });

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

    await runFfmpegFromFrames({
      framesPattern: framePattern,
      fps,
      outputPath,
    });

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
