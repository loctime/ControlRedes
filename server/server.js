'use strict';

require('dotenv').config();

const express = require('express');
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const { initBot, sendStatus } = require('./telegram');
const { runPipeline } = require('./lifecycle');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3333;
const WATCH_DIR = path.resolve(__dirname, '..', 'nuevas-publicaciones');
const ARCHIVE_DIR = path.resolve(__dirname, '..', 'publicaciones-anteriores');

const state = {
  pipeline: 'idle',
  pendingFiles: [],
  activeFile: null,
  chatId: process.env.CHAT_ID || null,
};

[WATCH_DIR, ARCHIVE_DIR].forEach((dir) => {
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

app.post('/api/video-ready', (req, res) => {
  res.json({ received: true });
});

app.post('/api/publish-complete', (req, res) => {
  res.json({ received: true });
});

let bot = null;

app.listen(PORT, () => {
  console.log(`Server running on localhost:${PORT} | Watching nuevas-publicaciones/`);
  bot = initBot(state, async (files, chatId) => {
    await runPipeline(files, state, sendStatus, bot, chatId);
  });
});

module.exports = { app, state, watcher, getBot: () => bot, sendStatus, runPipeline };
