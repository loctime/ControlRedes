export async function transcodeWebmToMp4(recordingResult) {
  return {
    ok: false,
    error: 'ffmpeg.wasm not wired yet in this wave',
    input: recordingResult || null,
  };
}
