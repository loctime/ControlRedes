import { getStoredHandle, pickFolderHandle, reconnectFolderHandle } from './lib/folder-handle.js';
import { verifyLogins } from './lib/login-checks.js';
import { getState, mergeState } from './lib/state.js';

const serverStatusEl = document.querySelector('#server-status');
const serverDetailEl = document.querySelector('#server-detail');
const folderNameEl = document.querySelector('#folder-name');
const folderStatusEl = document.querySelector('#folder-status');
const instagramStatusEl = document.querySelector('#instagram-status');
const linkedinStatusEl = document.querySelector('#linkedin-status');
const loginDetailEl = document.querySelector('#login-detail');

const refreshServerButton = document.querySelector('#refresh-server');
const pickFolderButton = document.querySelector('#pick-folder');
const reconnectFolderButton = document.querySelector('#reconnect-folder');
const checkLoginsButton = document.querySelector('#check-logins');

function setStatusPill(element, label, kind) {
  element.textContent = label;
  element.className = `status-pill ${kind}`;
}

function formatRelativeTime(value) {
  if (!value) {
    return 'sin timestamp';
  }

  const diffMs = Date.now() - new Date(value).getTime();
  const diffSeconds = Math.max(0, Math.round(diffMs / 1000));
  return `hace ${diffSeconds}s`;
}

function renderServer(state) {
  if (state.server?.reachable) {
    setStatusPill(serverStatusEl, 'Server reachable', 'status-ok');
    serverDetailEl.textContent = `Pipeline: ${state.pipeline} | Archivos pendientes: ${state.pendingFiles.length} | Snapshot ${formatRelativeTime(state.lastStatusAt)}`;
    return;
  }

  if (state.server?.lastError) {
    setStatusPill(serverStatusEl, 'Server offline', 'status-error');
    serverDetailEl.textContent = state.server.lastError;
    return;
  }

  setStatusPill(serverStatusEl, 'Waiting for poll', 'status-unknown');
  serverDetailEl.textContent = 'El service worker todavia no confirmo conexion con localhost:3333.';
}

function renderFolder(state) {
  folderNameEl.textContent = state.folderName || 'Ninguna carpeta conectada.';

  if (state.folderPermission === 'granted') {
    setStatusPill(folderStatusEl, 'Folder ready', 'status-ok');
  } else if (state.folderPermission === 'prompt') {
    setStatusPill(folderStatusEl, 'Reconnect folder', 'status-warn');
  } else if (state.folderPermission === 'missing') {
    setStatusPill(folderStatusEl, 'Not configured', 'status-unknown');
  } else {
    setStatusPill(folderStatusEl, 'Folder unavailable', 'status-error');
  }
}

function renderLoginChecks(state) {
  const instagram = state.loginChecks?.instagram?.status || 'unknown';
  const linkedin = state.loginChecks?.linkedin?.status || 'unknown';

  const mapStatus = (value) => {
    if (value === 'logged_in') {
      return ['Logged in', 'status-ok'];
    }
    if (value === 'logged_out') {
      return ['Logged out', 'status-warn'];
    }
    if (value === 'error') {
      return ['Error', 'status-error'];
    }
    return ['Unknown', 'status-unknown'];
  };

  const [instagramLabel, instagramKind] = mapStatus(instagram);
  const [linkedinLabel, linkedinKind] = mapStatus(linkedin);
  setStatusPill(instagramStatusEl, instagramLabel, instagramKind);
  setStatusPill(linkedinStatusEl, linkedinLabel, linkedinKind);

  if (state.loginChecks?.lastCheckedAt) {
    loginDetailEl.textContent = `Ultima verificacion ${formatRelativeTime(state.loginChecks.lastCheckedAt)}.`;
  } else {
    loginDetailEl.textContent = 'Todavia no se corrio la verificacion.';
  }
}

async function render() {
  const state = await getState();
  renderServer(state);
  renderFolder(state);
  renderLoginChecks(state);
}

async function refreshServerSnapshot() {
  refreshServerButton.disabled = true;
  await chrome.runtime.sendMessage({ type: 'gsd:poll-now' });
  await render();
  refreshServerButton.disabled = false;
}

async function selectFolder() {
  pickFolderButton.disabled = true;
  try {
    const handle = await pickFolderHandle();
    await mergeState({
      folderName: handle.name,
      folderPermission: 'granted',
      folderLastCheckedAt: new Date().toISOString(),
    });
  } finally {
    pickFolderButton.disabled = false;
    await render();
  }
}

async function reconnectFolder() {
  reconnectFolderButton.disabled = true;
  try {
    const handle = await reconnectFolderHandle();
    const permission = handle ? await handle.queryPermission({ mode: 'readwrite' }) : 'missing';
    await mergeState({
      folderName: handle?.name || null,
      folderPermission: handle ? permission : 'missing',
      folderLastCheckedAt: new Date().toISOString(),
    });
  } finally {
    reconnectFolderButton.disabled = false;
    await render();
  }
}

async function bootstrapFolderState() {
  const handle = await getStoredHandle();
  if (!handle) {
    await mergeState({
      folderName: null,
      folderPermission: 'missing',
    });
    return;
  }

  const permission = await handle.queryPermission({ mode: 'readwrite' });
  await mergeState({
    folderName: handle.name,
    folderPermission: permission,
    folderLastCheckedAt: new Date().toISOString(),
  });
}

async function runLoginChecks() {
  checkLoginsButton.disabled = true;
  try {
    const result = await verifyLogins();
    await mergeState({
      loginChecks: result,
    });
  } finally {
    checkLoginsButton.disabled = false;
    await render();
  }
}

refreshServerButton.addEventListener('click', () => {
  refreshServerSnapshot().catch((error) => console.error('[popup] refresh failed:', error));
});

pickFolderButton.addEventListener('click', () => {
  selectFolder().catch((error) => console.error('[popup] folder pick failed:', error));
});

reconnectFolderButton.addEventListener('click', () => {
  reconnectFolder().catch((error) => console.error('[popup] folder reconnect failed:', error));
});

checkLoginsButton.addEventListener('click', () => {
  runLoginChecks().catch((error) => console.error('[popup] login checks failed:', error));
});

Promise.all([
  chrome.runtime.sendMessage({ type: 'gsd:ensure-alarm' }),
  bootstrapFolderState(),
]).finally(() => {
  refreshServerSnapshot()
    .catch(() => {})
    .finally(() => {
      render().catch((error) => console.error('[popup] render failed:', error));
    });
});
