import {
  ALARM_NAME,
  ALARM_PERIOD_MINUTES,
  DEFAULT_PIPELINE_STATE,
  SERVER_URL,
} from './lib/constants.js';
import {
  ensureState,
  mergeState,
  setServerSnapshot,
  setServerStatus,
} from './lib/state.js';
import { fetchServerStatus } from './lib/server-api.js';

async function ensurePollingAlarm() {
  const alarm = await chrome.alarms.get(ALARM_NAME);
  if (!alarm) {
    await chrome.alarms.create(ALARM_NAME, {
      periodInMinutes: ALARM_PERIOD_MINUTES,
    });
  }
}

async function initializeExtension() {
  await ensureState({
    server: {
      url: SERVER_URL,
      reachable: false,
      lastError: null,
    },
    ...DEFAULT_PIPELINE_STATE,
  });
  await ensurePollingAlarm();
}

async function pollServerStatus() {
  try {
    const snapshot = await fetchServerStatus();
    await setServerSnapshot(snapshot);
    await setServerStatus({
      reachable: true,
      lastError: null,
      lastStatusAt: new Date().toISOString(),
    });
  } catch (error) {
    await mergeState({
      server: {
        url: SERVER_URL,
        reachable: false,
        lastError: error.message,
      },
      lastStatusAt: new Date().toISOString(),
    });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  initializeExtension().catch((error) => {
    console.error('[extension] install init failed:', error);
  });
});

chrome.runtime.onStartup.addListener(() => {
  initializeExtension().catch((error) => {
    console.error('[extension] startup init failed:', error);
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== ALARM_NAME) {
    return;
  }

  pollServerStatus().catch((error) => {
    console.error('[extension] polling failed:', error);
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'gsd:poll-now') {
    pollServerStatus()
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === 'gsd:ensure-alarm') {
    ensurePollingAlarm()
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  return false;
});

initializeExtension().catch((error) => {
  console.error('[extension] top-level init failed:', error);
});
