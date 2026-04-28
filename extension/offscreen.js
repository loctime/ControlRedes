const sessionState = {
  activeSession: null,
  timeoutHandle: null,
  completionHandle: null,
  mediaRecorder: null,
  mediaStream: null,
  chunks: [],
};

async function notifyServiceWorker(type, payload = {}) {
  try {
    await chrome.runtime.sendMessage({ type, payload });
  } catch (error) {
    console.error('[offscreen] failed to notify service worker:', error);
  }
}

function clearSessionTimers() {
  if (sessionState.timeoutHandle) {
    clearTimeout(sessionState.timeoutHandle);
    sessionState.timeoutHandle = null;
  }

  if (sessionState.completionHandle) {
    clearTimeout(sessionState.completionHandle);
    sessionState.completionHandle = null;
  }
}

function cleanupMedia() {
  if (sessionState.mediaRecorder) {
    sessionState.mediaRecorder.ondataavailable = null;
    sessionState.mediaRecorder.onstop = null;
    sessionState.mediaRecorder.onerror = null;
    sessionState.mediaRecorder = null;
  }

  if (sessionState.mediaStream) {
    for (const track of sessionState.mediaStream.getTracks()) {
      track.stop();
    }
    sessionState.mediaStream = null;
  }

  sessionState.chunks = [];
}

function setSessionStatus(status) {
  if (!sessionState.activeSession) {
    return;
  }

  sessionState.activeSession.status = status;
  sessionState.activeSession.updatedAt = new Date().toISOString();
}

function scheduleSessionCompletion(reason, bufferMs) {
  if (!sessionState.activeSession || sessionState.activeSession.status === 'completing') {
    return;
  }

  setSessionStatus('completing');
  sessionState.activeSession.stopReason = reason;

  const delay = Math.max(0, Number(bufferMs) || 0);
  sessionState.completionHandle = setTimeout(async () => {
    try {
      if (!sessionState.mediaRecorder) {
        throw new Error('media recorder not initialized');
      }

      const recordingBlob = await new Promise((resolve, reject) => {
        sessionState.mediaRecorder.onstop = () => {
          const blob = new Blob(sessionState.chunks, {
            type: sessionState.mediaRecorder.mimeType || 'video/webm',
          });
          resolve(blob);
        };
        sessionState.mediaRecorder.onerror = (event) => {
          reject(new Error(event?.error?.message || 'media recorder error'));
        };
        sessionState.mediaRecorder.stop();
      });

      const completedAt = new Date().toISOString();
      const filenameBase = (sessionState.activeSession.file || 'recording').replace(/\.html$/i, '');
      const outputFilename = `${filenameBase}.webm`;
      const formData = new FormData();
      formData.set('filename', sessionState.activeSession.file || '');
      formData.set('sessionId', sessionState.activeSession.sessionId || '');
      formData.set('stopReason', sessionState.activeSession.stopReason || 'unknown');
      formData.set('width', String(sessionState.activeSession.width || 1080));
      formData.set('height', String(sessionState.activeSession.height || 1920));
      formData.set('mimeType', recordingBlob.type || 'video/webm');
      formData.set('durationMs', String(Date.now() - new Date(sessionState.activeSession.startedAt).getTime()));
      formData.set('video', recordingBlob, outputFilename);

      const uploadResponse = await fetch('http://localhost:3333/api/video-ready', {
        method: 'POST',
        body: formData,
      });
      const uploadJson = await uploadResponse.json().catch(() => ({}));
      if (!uploadResponse.ok) {
        throw new Error(uploadJson?.error || `video-ready failed: ${uploadResponse.status}`);
      }

      const completedSession = {
        ...sessionState.activeSession,
        status: 'completed',
        endedAt: completedAt,
        updatedAt: completedAt,
      };

      clearSessionTimers();
      cleanupMedia();
      sessionState.activeSession = completedSession;

      await notifyServiceWorker('gsd:offscreen:recording-finished', {
        sessionId: completedSession.sessionId,
        file: completedSession.file,
        tabId: completedSession.tabId,
        stopReason: completedSession.stopReason,
        endedAt: completedAt,
        upload: uploadJson,
      });
    } catch (error) {
      clearSessionTimers();
      cleanupMedia();
      await notifyServiceWorker('gsd:offscreen:error', {
        error: error.message,
      });
    }
  }, delay);
}

function resolveRecorderMimeType() {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];

  for (const mimeType of candidates) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  return 'video/webm';
}

async function startMediaCaptureForSession(activeSession) {
  const constraints = {
    audio: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: activeSession.streamId,
      },
    },
    video: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: activeSession.streamId,
        minWidth: activeSession.width || 1080,
        maxWidth: activeSession.width || 1080,
        minHeight: activeSession.height || 1920,
        maxHeight: activeSession.height || 1920,
      },
    },
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  const mimeType = resolveRecorderMimeType();
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 5_000_000,
  });

  sessionState.mediaStream = stream;
  sessionState.mediaRecorder = recorder;
  sessionState.chunks = [];

  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      sessionState.chunks.push(event.data);
    }
  };

  recorder.start(1000);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'gsd:offscreen:ping') {
    sendResponse({ ok: true, source: 'offscreen' });
    return false;
  }

  if (message?.type === 'gsd:offscreen:start-session') {
    const payload = message.payload || {};
    sessionState.activeSession = {
      sessionId: payload.sessionId || null,
      file: payload.file || null,
      tabId: payload.tabId ?? null,
      url: payload.url || null,
      width: payload.width ?? null,
      height: payload.height ?? null,
      startedAt: payload.startedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'running',
      stopReason: null,
      timeoutMs: payload.timeoutMs ?? 60000,
      bufferMs: payload.bufferMs ?? 1500,
      streamId: payload.streamId || null,
    };

    if (!sessionState.activeSession.streamId) {
      sendResponse({ ok: false, error: 'missing streamId' });
      return false;
    }

    clearSessionTimers();
    cleanupMedia();

    startMediaCaptureForSession(sessionState.activeSession)
      .then(() => {
        const timeoutMs = Math.max(0, Number(sessionState.activeSession.timeoutMs) || 0);
        sessionState.timeoutHandle = setTimeout(() => {
          scheduleSessionCompletion('timeout', sessionState.activeSession?.bufferMs ?? 0);
        }, timeoutMs);

        notifyServiceWorker('gsd:offscreen:ready', {
          sessionId: sessionState.activeSession.sessionId,
          file: sessionState.activeSession.file,
          tabId: sessionState.activeSession.tabId,
          updatedAt: sessionState.activeSession.updatedAt,
        }).catch(() => {});

        sendResponse({
          ok: true,
          session: sessionState.activeSession,
        });
      })
      .catch((error) => {
        cleanupMedia();
        sendResponse({ ok: false, error: error.message });
      });
    return true;
  }

  if (message?.type === 'gsd:offscreen:mark-done') {
    if (!sessionState.activeSession) {
      sendResponse({ ok: false, error: 'no active session' });
      return false;
    }

    scheduleSessionCompletion('done_signal', sessionState.activeSession.bufferMs);
    sendResponse({ ok: true });
    return false;
  }

  if (message?.type === 'gsd:offscreen:cancel-session') {
    clearSessionTimers();
    cleanupMedia();
    setSessionStatus('cancelled');
    sendResponse({ ok: true });
    return false;
  }

  if (message?.type === 'gsd:offscreen:get-session') {
    sendResponse({ ok: true, session: sessionState.activeSession });
    return false;
  }

  return false;
});
