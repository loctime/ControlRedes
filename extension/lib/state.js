import { DEFAULT_PIPELINE_STATE, SERVER_URL } from './constants.js';

const STATE_KEY = 'gsdExtensionState';

function mergeObjects(base, patch) {
  const output = { ...base };

  for (const [key, value] of Object.entries(patch)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      base[key] &&
      typeof base[key] === 'object' &&
      !Array.isArray(base[key])
    ) {
      output[key] = mergeObjects(base[key], value);
    } else {
      output[key] = value;
    }
  }

  return output;
}

export async function getState() {
  const stored = await chrome.storage.local.get(STATE_KEY);
  return mergeObjects(
    {
      server: {
        url: SERVER_URL,
        reachable: false,
        lastError: null,
      },
      ...DEFAULT_PIPELINE_STATE,
    },
    stored[STATE_KEY] || {}
  );
}

export async function saveState(nextState) {
  await chrome.storage.local.set({ [STATE_KEY]: nextState });
  return nextState;
}

export async function ensureState(initialState) {
  const existing = await getState();
  const merged = mergeObjects(existing, initialState);
  await saveState(merged);
  return merged;
}

export async function mergeState(patch) {
  const current = await getState();
  const nextState = mergeObjects(current, patch);
  await saveState(nextState);
  return nextState;
}

export async function setServerSnapshot(snapshot) {
  return mergeState({
    pipeline: snapshot.pipeline ?? 'idle',
    pendingFiles: Array.isArray(snapshot.pendingFiles) ? snapshot.pendingFiles : [],
    activeFile: snapshot.activeFile ?? null,
  });
}

export async function setServerStatus(serverPatch) {
  return mergeState({
    server: serverPatch,
  });
}

export async function setRecordingSession(recordingSessionPatch) {
  return mergeState({
    recordingSession: recordingSessionPatch,
  });
}
