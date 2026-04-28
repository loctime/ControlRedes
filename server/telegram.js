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

  // Configurar los comandos que aparecen en el menú de Telegram (el botón con la barra /)
  bot.setMyCommands([
    { command: '/start', description: 'Mostrar menú de opciones' },
    { command: '/publicar', description: 'Publicar lo nuevo' }
  ]).catch(err => console.error('[Telegram] Error al configurar comandos:', err.message));

  bot.on('message', async (msg) => {
    const fromChatId = String(msg.chat.id);
    const allowedChatId = String(state.chatId);

    if (fromChatId !== allowedChatId) {
      return;
    }

    const text = (msg.text || '').trim().toLowerCase();
    
    // Mostrar un botón de teclado persistente
    if (text === '/start' || text === 'menu' || text === 'menú') {
      await bot.sendMessage(fromChatId, 'Selecciona una acción:', {
        reply_markup: {
          keyboard: [
            [{ text: '🚀 Publica lo nuevo' }]
          ],
          resize_keyboard: true,
          is_persistent: true
        }
      });
      return;
    }

    const isPublishCommand = 
      text === COMMAND_TRIGGER || 
      text === '🚀 publica lo nuevo' || 
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
