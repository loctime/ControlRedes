'use strict';

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const { pickThreeByPrompt, getAudioAbsPath, ensureLibraryDir } = require('./audio-library');

const WATCH_DIR = path.resolve(__dirname, '..', 'nuevas-publicaciones');
const COMMAND_TRIGGER = 'publica lo nuevo';

function initBot(state, onTrigger) {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    console.error('[Telegram] BOT_TOKEN no configurado - bot desactivado');
    return null;
  }

  ensureLibraryDir();
  const pendingAudioChoiceByChat = new Map();
  const bot = new TelegramBot(token, { polling: true });

  bot.setMyCommands([
    { command: '/start', description: 'Mostrar menu' },
    { command: '/publicar', description: 'Publicar lo nuevo' },
    { command: '/sonido', description: 'Elegir audio por prompt' },
  ]).catch((err) => console.error('[Telegram] Error al configurar comandos:', err.message));

  bot.on('message', async (msg) => {
    const fromChatId = String(msg.chat.id);
    const allowedChatId = String(state.chatId);
    if (fromChatId !== allowedChatId) {
      return;
    }

    const rawText = String(msg.text || '').trim();
    const text = rawText.toLowerCase();

    if (/^[123]$/.test(text) && pendingAudioChoiceByChat.has(fromChatId)) {
      const choice = Number(text) - 1;
      const pending = pendingAudioChoiceByChat.get(fromChatId);
      const selected = pending.options[choice];
      if (!selected) {
        await bot.sendMessage(fromChatId, 'Opcion invalida. Responde 1, 2 o 3.');
        return;
      }

      const srcPath = getAudioAbsPath(selected.file);
      const ext = path.extname(selected.file).toLowerCase() || '.mp3';
      const outPath = path.join(WATCH_DIR, `${pending.baseName}${ext}`);
      fs.copyFileSync(srcPath, outPath);
      pendingAudioChoiceByChat.delete(fromChatId);

      await bot.sendMessage(
        fromChatId,
        `Audio seleccionado para ${pending.baseName}.html:\n${selected.file}\nGuardado como ${path.basename(outPath)}`
      );
      return;
    }

    if (text.startsWith('/sonido')) {
      const payload = rawText.slice('/sonido'.length).trim();
      const parts = payload.split('|');
      if (parts.length < 2) {
        await bot.sendMessage(
          fromChatId,
          'Uso: /sonido nombre-post | prompt\nEj: /sonido promo-luz | ambiente de voces suave corporativo'
        );
        return;
      }

      const baseName = String(parts[0] || '').trim().replace(/\.html$/i, '');
      const prompt = String(parts.slice(1).join('|') || '').trim();
      if (!baseName || !prompt) {
        await bot.sendMessage(fromChatId, 'Faltan datos. Uso: /sonido nombre-post | prompt');
        return;
      }

      const options = pickThreeByPrompt(prompt);
      if (options.length === 0) {
        await bot.sendMessage(
          fromChatId,
          'No hay audios en audio-library/. Agrega archivos mp3/wav/ogg/m4a/aac.'
        );
        return;
      }

      pendingAudioChoiceByChat.set(fromChatId, { baseName, options });
      await bot.sendMessage(
        fromChatId,
        `Te envio ${options.length} opciones para ${baseName}.html. Responde 1, 2 o 3.`
      );

      for (let i = 0; i < options.length; i += 1) {
        const option = options[i];
        const audioPath = getAudioAbsPath(option.file);
        const caption = `${i + 1}. ${option.file}${option.description ? `\n${option.description}` : ''}`;
        await bot.sendAudio(fromChatId, audioPath, { caption });
      }
      return;
    }

    if (text === '/start' || text === 'menu' || text === 'menú') {
      await bot.sendMessage(fromChatId, 'Selecciona una accion:', {
        reply_markup: {
          keyboard: [
            [{ text: 'Publica lo nuevo' }],
          ],
          resize_keyboard: true,
          is_persistent: true,
        },
      });
      return;
    }

    const isPublishCommand =
      text === COMMAND_TRIGGER ||
      text === 'publica lo nuevo' ||
      text === '/publicar';

    if (!isPublishCommand) {
      return;
    }

    if (state.pipeline !== 'idle') {
      await bot.sendMessage(fromChatId, 'Ya hay un pipeline activo');
      return;
    }

    const files = fs.readdirSync(WATCH_DIR)
      .filter((filename) => filename.endsWith('.html'))
      .sort();

    if (files.length === 0) {
      await bot.sendMessage(fromChatId, 'No hay archivos nuevos');
      return;
    }

    state.pipeline = 'server_rendering';
    state.pendingFiles = [...files];
    state.activeFile = null;

    const list = files.map((file, index) => `${index + 1}. ${file}`).join('\n');
    await bot.sendMessage(fromChatId, `Iniciando pipeline para ${files.length} archivo(s):\n${list}`);

    if (onTrigger) {
      onTrigger(files, fromChatId).catch((err) => {
        console.error('[Telegram] Error en pipeline callback:', err.message);
      });
    }
  });

  bot.on('polling_error', (err) => {
    console.error('[Telegram] Polling error:', err.message);
  });

  return bot;
}

async function sendStatus(bot, chatId, text) {
  if (!bot || !chatId) {
    return;
  }
  try {
    await bot.sendMessage(String(chatId), text);
  } catch (err) {
    console.error('[Telegram] Error enviando status:', err.message);
  }
}

module.exports = { initBot, sendStatus };

