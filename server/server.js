'use strict';

require('dotenv').config();

const express = require('express');
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { initBot, sendStatus } = require('./telegram');
const { runPipeline, markComplete } = require('./lifecycle');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3333;
const WATCH_DIR = path.resolve(__dirname, '..', 'nuevas-publicaciones');
const ARCHIVE_DIR = path.resolve(__dirname, '..', 'publicaciones-anteriores');
const VIDEOS_DIR = path.resolve(__dirname, '..', 'videos-generados');

const state = {
  pipeline: 'idle',
  pendingFiles: [],
  activeFile: null,
  chatId: process.env.CHAT_ID || null,
};

[WATCH_DIR, ARCHIVE_DIR, VIDEOS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const watcher = chokidar.watch('*.html', {
  cwd: WATCH_DIR,
  persistent: true,
  ignoreInitial: false,
  awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
});

watcher
  .on('add', (filename) => {
    if (!state.pendingFiles.includes(filename)) {
      state.pendingFiles.push(filename);
    }
  })
  .on('unlink', (filename) => {
    state.pendingFiles = state.pendingFiles.filter((file) => file !== filename);
  });

app.get('/api/status', (req, res) => {
  res.json({
    pipeline: state.pipeline,
    pendingFiles: [...state.pendingFiles].sort(),
    activeFile: state.activeFile,
  });
});

app.get('/api/files', (req, res) => {
  const files = fs.readdirSync(WATCH_DIR)
    .filter((filename) => filename.endsWith('.html'))
    .sort();

  res.json({ files });
});

app.get('/api/files/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filepath = path.resolve(WATCH_DIR, filename);

  if (!filepath.startsWith(WATCH_DIR + path.sep) && filepath !== WATCH_DIR) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'Not found' });
  }

  res.setHeader('Content-Type', 'text/html');
  return res.sendFile(filepath);
});

app.get('/api/assets/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filepath = path.resolve(WATCH_DIR, filename);

  if (!filepath.startsWith(WATCH_DIR + path.sep) && filepath !== WATCH_DIR) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'Not found' });
  }

  return res.sendFile(filepath);
});

const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/video-ready', upload.single('video'), async (req, res) => {
  try {
    const filename = path.basename(String(req.body.filename || ''));
    if (!filename || !filename.endsWith('.html')) {
      return res.status(400).json({ error: 'filename .html requerido' });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'archivo de video requerido' });
    }

    const baseName = filename.replace(/\.html$/i, '');
    const ext = req.file.mimetype.includes('webm') ? '.webm' : '.mp4';
    const outputName = `${baseName}${ext}`;
    const outputPath = path.join(VIDEOS_DIR, outputName);
    fs.writeFileSync(outputPath, req.file.buffer);

    const width = Number(req.body.width || 1080);
    const height = Number(req.body.height || 1920);
    const durationMs = Number(req.body.durationMs || 0);
    const videoSpecs = {
      width,
      height,
      fps: 30,
      codec: req.file.mimetype.includes('webm') ? 'vp8/vp9' : 'h264',
      duration: Number.isFinite(durationMs) ? Math.round(durationMs / 1000) : 0,
    };

    state.activeFile = filename;
    state.pendingFiles = state.pendingFiles.filter((file) => file !== filename);

    if (state.chatId && bot) {
      await sendStatus(bot, state.chatId, `Grabacion lista: ${outputName}`);
    }

    try {
      markComplete(filename, ['instagram', 'linkedin'], 'success', videoSpecs);
    } catch (error) {
      console.warn('[video-ready] No se pudo archivar HTML:', error.message);
    }

    if (state.pendingFiles.length === 0) {
      state.pipeline = 'idle';
      state.activeFile = null;
      if (state.chatId && bot) {
        await sendStatus(bot, state.chatId, 'Completado ?');
      }
    }

    return res.json({
      received: true,
      savedAs: outputName,
      path: outputPath,
    });
  } catch (error) {
    console.error('[video-ready] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/publish-complete', (req, res) => {
  res.json({ received: true });
});

app.post('/api/extension-log', async (req, res) => {
  try {
    const level = String(req.body?.level || 'info').toUpperCase();
    const message = String(req.body?.message || '').trim();
    const details = req.body?.details || {};

    if (!message) {
      return res.status(400).json({ error: 'message requerido' });
    }

    const detailText = JSON.stringify(details);
    const line = `[EXT ${level}] ${message}\n${detailText}`;
    console.log(line);

    if (state.chatId && bot) {
      await sendStatus(bot, state.chatId, line);
    }

    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

let bot = null;

app.listen(PORT, () => {
  console.log(`Server running on localhost:${PORT} | Watching nuevas-publicaciones/`);
  bot = initBot(state, async (files, chatId) => {
    await runPipeline(files, state, sendStatus, bot, chatId);
  });
});

module.exports = { app, state, watcher, getBot: () => bot, sendStatus, runPipeline };
