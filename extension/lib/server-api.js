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
