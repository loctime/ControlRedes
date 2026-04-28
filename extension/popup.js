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
  folderNameEl.textContent = 'Gestionada por el server local.';
  setStatusPill(folderStatusEl, 'Server-owned', 'status-ok');
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

checkLoginsButton.addEventListener('click', () => {
  runLoginChecks().catch((error) => console.error('[popup] login checks failed:', error));
});

Promise.all([
  chrome.runtime.sendMessage({ type: 'gsd:ensure-alarm' }),
  mergeState({
    folderName: 'server-managed',
    folderPermission: 'server_owned',
    folderLastCheckedAt: new Date().toISOString(),
    folderError: null,
  }),
]).finally(() => {
  refreshServerSnapshot()
    .catch(() => {})
    .finally(() => {
      render().catch((error) => console.error('[popup] render failed:', error));
    });
});
