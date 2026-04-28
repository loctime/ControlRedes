import { SERVER_STATUS_ENDPOINT } from './constants.js';

export async function fetchServerStatus() {
  const response = await fetch(SERVER_STATUS_ENDPOINT, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Server status request failed: ${response.status}`);
  }

  return response.json();
}

export async function postVideoReady(payload) {
  const response = await fetch('http://localhost:3333/api/video-ready', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`video-ready request failed: ${response.status}`);
  }

  return response.json();
}

export async function postExtensionLog(payload) {
  const response = await fetch('http://localhost:3333/api/extension-log', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`extension-log request failed: ${response.status}`);
  }

  return response.json();
}
