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

    const frameIntervalMs = Math.max(20, Math.floor(1000 / fps));
    const captureStart = Date.now();
    let doneAt = null;
    let frameIndex = 1;

    while (true) {
      const framePath = path.join(tmpRoot, `frame_${String(frameIndex).padStart(6, '0')}.png`);
      await page.screenshot({ path: framePath, type: 'png' });
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
      width,
      height,
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
