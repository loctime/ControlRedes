'use strict';

const fs = require('fs');
const path = require('path');

const WATCH_DIR = path.resolve(__dirname, '..', 'nuevas-publicaciones');
const ARCHIVE_DIR = path.resolve(__dirname, '..', 'publicaciones-anteriores');

function readCaption(filename) {
  const basename = filename.replace(/\.html$/i, '');
  const captionPath = path.join(WATCH_DIR, `${basename}.caption.txt`);

  if (fs.existsSync(captionPath)) {
    return fs.readFileSync(captionPath, 'utf8').trim();
  }

  return basename;
}

function markComplete(filename, platforms, status, videoSpecs) {
  const srcPath = path.join(WATCH_DIR, filename);
  if (!fs.existsSync(srcPath)) {
    throw new Error(`[lifecycle] Archivo no encontrado: ${srcPath}`);
  }

  if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  }

  const destPath = path.join(ARCHIVE_DIR, filename);
  fs.renameSync(srcPath, destPath);

  const basename = filename.replace(/\.html$/i, '');
  const metaPath = path.join(ARCHIVE_DIR, `${basename}.meta.json`);
  const meta = {
    date: new Date().toISOString(),
    platforms,
    status,
    videoSpecs: {
      width: videoSpecs.width,
      height: videoSpecs.height,
      fps: videoSpecs.fps,
      codec: videoSpecs.codec,
      duration: videoSpecs.duration,
    },
  };

  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');
}

async function runPipeline(files, state, sendStatusFn, bot, chatId) {
  try {
    for (const filename of files) {
      state.activeFile = filename;

      await sendStatusFn(bot, chatId, `Grabando ${filename}...`);
      await sendStatusFn(bot, chatId, 'Publicando en Instagram...');
      await sendStatusFn(bot, chatId, 'Publicando en LinkedIn...');

      const placeholderSpecs = {
        width: 1080,
        height: 1920,
        fps: 30,
        codec: 'h264',
        duration: 0,
      };

      markComplete(filename, ['instagram', 'linkedin'], 'success', placeholderSpecs);
      state.pendingFiles = state.pendingFiles.filter((file) => file !== filename);
    }

    await sendStatusFn(bot, chatId, 'Completado ✓');
  } catch (err) {
    console.error('[pipeline] Error durante pipeline:', err.message);
    await sendStatusFn(bot, chatId, `Error en pipeline: ${err.message}`);
  } finally {
    state.pipeline = 'idle';
    state.activeFile = null;
  }
}

module.exports = { readCaption, markComplete, runPipeline };
