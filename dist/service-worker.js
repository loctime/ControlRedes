import {
  ALARM_NAME,
  ALARM_PERIOD_MINUTES,
  DEFAULT_PIPELINE_STATE,
  DEFAULT_RECORDING_BUFFER_MS,
  DEFAULT_RECORDING_TIMEOUT_MS,
  OFFSCREEN_DOCUMENT_PATH,
  RECORDING_HEIGHT,
  RECORDING_WIDTH,
  SERVER_FILE_ENDPOINT,
  SERVER_URL,
} from './lib/constants.js';
import {
  ensureState,
  getState,
  mergeState,
  setRecordingSession,
  setServerSnapshot,
  setServerStatus,
} from './lib/state.js';
import { fetchServerStatus, postExtensionLog } from './lib/server-api.js';
import { resolveRecordingTiming } from './lib/recording-timing.js';

let creatingOffscreenDocument = null;
const sessionWaiters = new Map();
let queueRunning = false;
let captureBlocked = false;

async function logToTelegram(level, message, details = {}) {
  try {
    await postExtensionLog({
      level,
      message,
      details,
      timestamp: new Date().toISOString(),
    });
  } catch (_) {
    // keep silent to avoid recursive failures
  }
}

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

async function hasOffscreenDocument() {
  if (!chrome.runtime.getContexts) {
    return false;
  }

  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)],
  });

  return contexts.length > 0;
}

async function ensureOffscreenDocument() {
  if (await hasOffscreenDocument()) {
    return;
  }

  if (creatingOffscreenDocument) {
    return creatingOffscreenDocument;
  }

  creatingOffscreenDocument = chrome.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT_PATH,
    reasons: ['USER_MEDIA', 'DISPLAY_MEDIA'],
    justification: 'Record HTML posts and transcode video in a long-lived context.',
  });

  try {
    await creatingOffscreenDocument;
  } finally {
    creatingOffscreenDocument = null;
  }
}

function createRecordingSessionId() {
  return `rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function waitForTabComplete(tabId, timeoutMs = 15000) {
  const existing = await chrome.tabs.get(tabId);
  if (existing.status === 'complete') {
    return;
  }

  await new Promise((resolve, reject) => {
    const timeoutHandle = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error(`tab ${tabId} did not complete loading within ${timeoutMs}ms`));
    }, timeoutMs);

    function listener(updatedTabId, changeInfo) {
      if (updatedTabId !== tabId) {
        return;
      }

      if (changeInfo.status === 'complete') {
        clearTimeout(timeoutHandle);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }

    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function startRecordingSession(filename) {
  if (!filename || typeof filename !== 'string') {
    throw new Error('filename is required');
  }

  await ensureOffscreenDocument();
  await logToTelegram('info', 'startRecordingSession: begin', { filename });

  const fileUrl = `${SERVER_FILE_ENDPOINT}/${encodeURIComponent(filename)}`;
  const tab = await chrome.tabs.create({
    url: fileUrl,
    active: true,
  });

  const sessionId = createRecordingSessionId();
  const startedAt = new Date().toISOString();
  const timing = resolveRecordingTiming({
    timeoutMs: DEFAULT_RECORDING_TIMEOUT_MS,
    bufferMs: DEFAULT_RECORDING_BUFFER_MS,
  });

  await setRecordingSession({
    id: sessionId,
    file: filename,
    tabId: tab.id,
    phase: 'tab-opened',
    status: 'starting',
    startedAt,
    updatedAt: startedAt,
    width: RECORDING_WIDTH,
    height: RECORDING_HEIGHT,
    timeoutMs: timing.timeoutMs,
    bufferMs: timing.bufferMs,
    stopReason: null,
    endedAt: null,
    lastError: null,
  });

  try {
    await logToTelegram('info', 'tab created', { filename, tabId: tab.id, fileUrl });
    await waitForTabComplete(tab.id, 20000);
    await logToTelegram('info', 'tab load complete', { filename, tabId: tab.id });

    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: tab.id,
    });
    await logToTelegram('info', 'stream id acquired', { filename, tabId: tab.id });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        if (window.__gsdDoneListenerInstalled) {
          return;
        }

        window.__gsdDoneListenerInstalled = true;
        window.addEventListener('message', (event) => {
          if (event?.data?.type !== 'gsd:done') {
            return;
          }

          chrome.runtime.sendMessage({
            type: 'gsd:recording-done-signal',
          });
        });
      },
    });

    const response = await chrome.runtime.sendMessage({
      type: 'gsd:offscreen:start-session',
      payload: {
        sessionId,
        file: filename,
        tabId: tab.id,
        url: fileUrl,
        width: RECORDING_WIDTH,
        height: RECORDING_HEIGHT,
        startedAt,
        timeoutMs: timing.timeoutMs,
        bufferMs: timing.bufferMs,
        streamId,
      },
    });

    if (!response?.ok) {
      throw new Error(response?.error || 'offscreen start-session failed');
    }
    await logToTelegram('info', 'offscreen session started', { filename, tabId: tab.id, sessionId });

    const updatedAt = new Date().toISOString();
    await setRecordingSession({
      id: sessionId,
      file: filename,
      tabId: tab.id,
      phase: 'offscreen-ready',
      status: 'running',
      startedAt,
      updatedAt,
      width: RECORDING_WIDTH,
      height: RECORDING_HEIGHT,
      timeoutMs: timing.timeoutMs,
      bufferMs: timing.bufferMs,
      stopReason: null,
      endedAt: null,
      lastError: null,
    });

    return sessionId;
  } catch (error) {
    await logToTelegram('error', 'startRecordingSession failed', {
      filename,
      tabId: tab?.id ?? null,
      error: error.message,
    });
    const updatedAt = new Date().toISOString();
    await setRecordingSession({
      id: sessionId,
      file: filename,
      tabId: tab.id,
      phase: 'failed',
      status: 'error',
      startedAt,
      updatedAt,
      width: RECORDING_WIDTH,
      height: RECORDING_HEIGHT,
      timeoutMs: timing.timeoutMs,
      bufferMs: timing.bufferMs,
      stopReason: null,
      endedAt: null,
      lastError: error.message,
    });

    try {
      if (typeof tab.id === 'number') {
        await chrome.tabs.remove(tab.id);
      }
    } catch (_) {
      // no-op
    }

    throw error;
  }
}

async function finishRecordingSession(payload = {}) {
  const state = await getState();
  const currentSession = state.recordingSession;
  const currentTabId = currentSession?.tabId;
  const endedAt = payload.endedAt || new Date().toISOString();

  await setRecordingSession({
    phase: 'completed',
    status: 'completed',
    stopReason: payload.stopReason || 'unknown',
    endedAt,
    updatedAt: endedAt,
    upload: payload.upload || null,
    lastError: null,
  });
  await logToTelegram('info', 'recording finished', {
    sessionId: payload.sessionId || null,
    file: payload.file || null,
    stopReason: payload.stopReason || 'unknown',
  });

  if (payload.sessionId && sessionWaiters.has(payload.sessionId)) {
    sessionWaiters.get(payload.sessionId)({
      ok: true,
      stopReason: payload.stopReason || 'unknown',
      endedAt,
    });
    sessionWaiters.delete(payload.sessionId);
  }

  if (typeof currentTabId === 'number') {
    try {
      await chrome.tabs.remove(currentTabId);
    } catch (_) {
      // no-op
    }
  }
}

async function failRecordingSession(errorMessage) {
  const state = await getState();
  const currentSession = state.recordingSession;
  const currentTabId = currentSession?.tabId;
  const updatedAt = new Date().toISOString();

  await setRecordingSession({
    phase: 'failed',
    status: 'error',
    updatedAt,
    lastError: errorMessage || 'unknown recording error',
  });
  await logToTelegram('error', 'recording failed', {
    error: errorMessage || 'unknown recording error',
  });

  if ((errorMessage || '').includes('Extension has not been invoked for the current page')) {
    captureBlocked = true;
    await mergeState({
      recordingQueue: {
        status: 'blocked',
        lastError: errorMessage,
      },
    });
    await logToTelegram(
      'error',
      'capture blocked by Chrome permission context',
      {
        action: 'Click the extension icon once on the HTML tab, then trigger pipeline again.',
      }
    );
  }

  const stateAfterFailure = await getState();
  const failedSessionId = stateAfterFailure.recordingSession?.id;
  if (failedSessionId && sessionWaiters.has(failedSessionId)) {
    sessionWaiters.get(failedSessionId)({
      ok: false,
      error: errorMessage || 'unknown recording error',
    });
    sessionWaiters.delete(failedSessionId);
  }

  if (typeof currentTabId === 'number') {
    try {
      await chrome.tabs.remove(currentTabId);
    } catch (_) {
      // no-op
    }
  }
}

async function runSequentialRecordingQueue() {
  if (captureBlocked) {
    return {
      ok: false,
      error: 'capture is blocked: extension invocation required on target page',
    };
  }

  if (queueRunning) {
    return { ok: false, error: 'queue already running' };
  }

  queueRunning = true;
  const startedAt = new Date().toISOString();
  await logToTelegram('info', 'recording queue started', { startedAt });

  await mergeState({
    pipeline: 'recording',
    recordingQueue: {
      status: 'running',
      startedAt,
      finishedAt: null,
      processed: 0,
      total: 0,
      failures: 0,
      lastError: null,
    },
  });

  try {
    const snapshot = await fetchServerStatus();
    const files = Array.isArray(snapshot.pendingFiles) ? snapshot.pendingFiles : [];
    let processed = 0;
    let failures = 0;

    await mergeState({
      recordingQueue: {
        status: 'running',
        startedAt,
        finishedAt: null,
        processed,
        total: files.length,
        failures,
        lastError: null,
      },
    });

    for (const file of files) {
      try {
        await logToTelegram('info', 'processing file', { file });
        const sessionId = await startRecordingSession(file);
        const sessionResult = await new Promise((resolve) => {
          sessionWaiters.set(sessionId, resolve);
        });
        if (!sessionResult?.ok) {
          failures += 1;
        }
      } catch (error) {
        failures += 1;
        await logToTelegram('error', 'file processing failed', {
          file,
          error: error.message,
        });
        if (error.message.includes('Extension has not been invoked for the current page')) {
          captureBlocked = true;
          await mergeState({
            recordingQueue: {
              status: 'blocked',
              lastError: error.message,
            },
          });
          break;
        }
      }

      processed += 1;
      await mergeState({
        recordingQueue: {
          status: 'running',
          startedAt,
          finishedAt: null,
          processed,
          total: files.length,
          failures,
          lastError: null,
        },
      });
    }

    await mergeState({
      pipeline: 'idle',
      recordingQueue: {
        status: 'completed',
        startedAt,
        finishedAt: new Date().toISOString(),
        processed,
        total: files.length,
        failures,
        lastError: null,
      },
    });
    await logToTelegram('info', 'recording queue completed', {
      processed,
      failures,
    });

    return { ok: true, processed, failures };
  } catch (error) {
    await mergeState({
      pipeline: 'idle',
      recordingQueue: {
        status: 'failed',
        finishedAt: new Date().toISOString(),
        lastError: error.message,
      },
    });
    await logToTelegram('error', 'recording queue failed', { error: error.message });
    return { ok: false, error: error.message };
  } finally {
    queueRunning = false;
  }
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

    if (snapshot.pipeline === 'active' && !queueRunning && !captureBlocked) {
      runSequentialRecordingQueue().catch((error) => {
        console.error('[extension] recording queue failed:', error);
      });
    }
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

  if (message?.type === 'gsd:ensure-offscreen') {
    ensureOffscreenDocument()
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === 'gsd:offscreen:ping') {
    sendResponse({ ok: true, source: 'service-worker' });
    return false;
  }

  if (message?.type === 'gsd:record-start') {
    startRecordingSession(message?.payload?.file)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === 'gsd:offscreen:ready') {
    setRecordingSession({
      phase: 'offscreen-ready',
      status: 'running',
      updatedAt: new Date().toISOString(),
      lastError: null,
    })
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === 'gsd:offscreen:error') {
    failRecordingSession(message?.payload?.error || 'unknown offscreen error')
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === 'gsd:recording-done-signal') {
    chrome.runtime
      .sendMessage({
        type: 'gsd:offscreen:mark-done',
      })
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === 'gsd:offscreen:recording-finished') {
    finishRecordingSession(message.payload)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === 'gsd:get-recording-session') {
    getState()
      .then((state) => sendResponse({ ok: true, recordingSession: state.recordingSession }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === 'gsd:process-recording-queue') {
    runSequentialRecordingQueue()
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === 'gsd:clear-capture-block') {
    captureBlocked = false;
    mergeState({
      recordingQueue: {
        status: 'idle',
        lastError: null,
      },
    })
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  return false;
});

initializeExtension().catch((error) => {
  console.error('[extension] top-level init failed:', error);
});
