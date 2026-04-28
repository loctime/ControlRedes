'use strict';

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const WATCH_DIR = path.resolve(__dirname, '..', 'nuevas-publicaciones');
const COMMAND_TRIGGER = 'publica lo nuevo';

function initBot(state, onTrigger) {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    console.error('[Telegram] BOT_TOKEN no configurado - bot desactivado');
    return null;
  }

  const bot = new TelegramBot(token, { polling: true });

  bot.on('message', async (msg) => {
    const fromChatId = String(msg.chat.id);
    const allowedChatId = String(state.chatId);

    if (fromChatId !== allowedChatId) {
      return;
    }

    const text = (msg.text || '').trim().toLowerCase();
    if (text !== COMMAND_TRIGGER) {
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

    const lista = files.map((file, index) => `${index + 1}. ${file}`).join('\n');
    await bot.sendMessage(
      fromChatId,
      `Iniciando pipeline para ${files.length} archivo(s):\n${lista}`
    );

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
