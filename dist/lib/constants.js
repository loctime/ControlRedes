export const SERVER_URL = 'http://localhost:3333';
export const SERVER_STATUS_ENDPOINT = `${SERVER_URL}/api/status`;
export const ALARM_NAME = 'gsd-status-poll';
export const ALARM_PERIOD_MINUTES = 0.1;

export const DEFAULT_PIPELINE_STATE = {
  pipeline: 'idle',
  pendingFiles: [],
  activeFile: null,
  lastStatusAt: null,
  folderName: null,
  folderPermission: 'missing',
  folderLastCheckedAt: null,
  loginChecks: {
    instagram: { status: 'unknown', checkedAt: null },
    linkedin: { status: 'unknown', checkedAt: null },
    lastCheckedAt: null,
  },
};
