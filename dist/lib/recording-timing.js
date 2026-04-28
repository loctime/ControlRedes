import {
  DEFAULT_RECORDING_BUFFER_MS,
  DEFAULT_RECORDING_TIMEOUT_MS,
} from './constants.js';

function toValidMs(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

export function resolveRecordingTiming(input = {}) {
  return {
    timeoutMs: toValidMs(input.timeoutMs, DEFAULT_RECORDING_TIMEOUT_MS),
    bufferMs: toValidMs(input.bufferMs, DEFAULT_RECORDING_BUFFER_MS),
  };
}
