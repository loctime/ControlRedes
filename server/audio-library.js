'use strict';

const fs = require('fs');
const path = require('path');

const LIB_DIR = path.resolve(__dirname, '..', 'audio-library');
const INDEX_PATH = path.join(LIB_DIR, 'index.json');
const AUDIO_EXTS = new Set(['.mp3', '.wav', '.ogg', '.m4a', '.aac']);

function ensureLibraryDir() {
  if (!fs.existsSync(LIB_DIR)) {
    fs.mkdirSync(LIB_DIR, { recursive: true });
  }
}

function listFilesFallback() {
  ensureLibraryDir();
  return fs.readdirSync(LIB_DIR)
    .filter((name) => AUDIO_EXTS.has(path.extname(name).toLowerCase()))
    .map((name) => ({
      id: path.parse(name).name,
      file: name,
      tags: [],
      description: '',
    }));
}

function loadCatalog() {
  ensureLibraryDir();
  if (!fs.existsSync(INDEX_PATH)) {
    return listFilesFallback();
  }
  try {
    const raw = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
    if (!Array.isArray(raw)) {
      return listFilesFallback();
    }
    return raw
      .filter((item) => item && typeof item.file === 'string')
      .filter((item) => fs.existsSync(path.join(LIB_DIR, item.file)))
      .map((item) => ({
        id: String(item.id || path.parse(item.file).name),
        file: item.file,
        tags: Array.isArray(item.tags) ? item.tags.map((t) => String(t).toLowerCase()) : [],
        description: String(item.description || ''),
      }));
  } catch (_) {
    return listFilesFallback();
  }
}

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .split(/[^a-z0-9áéíóúñü]+/i)
    .filter(Boolean);
}

function scoreItem(item, tokens) {
  if (tokens.length === 0) {
    return 0;
  }
  const hay = `${item.id} ${item.file} ${item.description} ${item.tags.join(' ')}`.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (item.tags.includes(token)) score += 4;
    if (hay.includes(token)) score += 2;
  }
  return score;
}

function pickThreeByPrompt(prompt) {
  const catalog = loadCatalog();
  const tokens = tokenize(prompt);
  const ranked = catalog
    .map((item) => ({ item, score: scoreItem(item, tokens) }))
    .sort((a, b) => b.score - a.score || a.item.file.localeCompare(b.item.file))
    .slice(0, 3)
    .map((x) => x.item);
  return ranked;
}

function getAudioAbsPath(file) {
  return path.join(LIB_DIR, file);
}

module.exports = {
  LIB_DIR,
  INDEX_PATH,
  pickThreeByPrompt,
  getAudioAbsPath,
  ensureLibraryDir,
};

