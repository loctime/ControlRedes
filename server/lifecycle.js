'use strict';

const fs = require('fs');
const path = require('path');
const { renderHtmlToVideo } = require('./renderer');

const WATCH_DIR = path.resolve(__dirname, '..', 'nuevas-publicaciones');
const ARCHIVE_DIR = path.resolve(__dirname, '..', 'publicaciones-anteriores');
const VIDEOS_DIR = path.resolve(__dirname, '..', 'videos-generados');

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
  if (!Array.isArray(files) || files.length === 0) {
    await sendStatusFn(bot, chatId, 'No hay archivos nuevos');
    state.pipeline = 'idle';
    state.activeFile = null;
    return;
  }

  await sendStatusFn(bot, chatId, `Pipeline activo: ${files.length} archivo(s) en cola.`);

  try {
    for (const filename of files) {
      state.activeFile = filename;
      await sendStatusFn(bot, chatId, `Grabando ${filename}...`);

      const basename = filename.replace(/\.html$/i, '');
      const outputPath = path.join(VIDEOS_DIR, `${basename}.mp4`);
      const htmlUrl = `http://localhost:3333/api/files/${encodeURIComponent(filename)}`;

      const specs = await renderHtmlToVideo({
        htmlUrl,
        outputPath,
        width: 1080,
        height: 1920,
        fps: 30,
        timeoutSeconds: 60,
        bufferSeconds: 1.5,
      });

      state.pendingFiles = state.pendingFiles.filter((file) => file !== filename);
      markComplete(filename, ['instagram', 'linkedin'], 'success', specs);

      await sendStatusFn(bot, chatId, `Video listo: ${path.basename(outputPath)}`);
    }

    await sendStatusFn(bot, chatId, 'Completado ✓');
  } catch (error) {
    await sendStatusFn(bot, chatId, `Error en pipeline: ${error.message}`);
    throw error;
  } finally {
    state.pipeline = 'idle';
    state.activeFile = null;
  }
}

module.exports = { readCaption, markComplete, runPipeline };
