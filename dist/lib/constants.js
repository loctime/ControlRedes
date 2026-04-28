export const SERVER_URL = 'http://localhost:3333';
export const SERVER_STATUS_ENDPOINT = `${SERVER_URL}/api/status`;
export const SERVER_FILE_ENDPOINT = `${SERVER_URL}/api/files`;
export const ALARM_NAME = 'gsd-status-poll';
export const ALARM_PERIOD_MINUTES = 0.1;
export const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';
export const RECORDING_WIDTH = 1080;
export const RECORDING_HEIGHT = 1920;
export const DEFAULT_RECORDING_TIMEOUT_MS = 60000;
export const DEFAULT_RECORDING_BUFFER_MS = 1500;

export const DEFAULT_PIPELINE_STATE = {
  pipeline: 'idle',
  pendingFiles: [],
  activeFile: null,
  lastStatusAt: null,
  folderName: 'server-managed',
  folderPermission: 'server_owned',
  folderLastCheckedAt: null,
  folderError: null,
  loginChecks: {
    instagram: { status: 'unknown', checkedAt: null },
    linkedin: { status: 'unknown', checkedAt: null },
    lastCheckedAt: null,
  },
  recordingQueue: {
    status: 'idle',
    startedAt: null,
    finishedAt: null,
    processed: 0,
    total: 0,
    failures: 0,
    lastError: null,
  },
  recordingSession: {
    id: null,
    file: null,
    tabId: null,
    phase: 'idle',
    status: 'idle',
    startedAt: null,
    updatedAt: null,
    width: RECORDING_WIDTH,
    height: RECORDING_HEIGHT,
    timeoutMs: DEFAULT_RECORDING_TIMEOUT_MS,
    bufferMs: DEFAULT_RECORDING_BUFFER_MS,
    stopReason: null,
    endedAt: null,
    lastError: null,
  },
};
