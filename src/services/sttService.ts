const PROXY_URL = 'http://localhost:3001';

let mediaRecorder: MediaRecorder | null = null;
let mediaStream: MediaStream | null = null;
let audioChunks: Blob[] = [];
let resolveRecording: ((blob: Blob) => void) | null = null;

export function isRecording(): boolean {
  return mediaRecorder !== null && mediaRecorder.state === 'recording';
}

export async function startRecording(): Promise<void> {
  if (isRecording()) return;

  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  audioChunks = [];

  mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'audio/webm' });

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      audioChunks.push(e.data);
    }
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(audioChunks, { type: 'audio/webm' });
    if (resolveRecording) {
      resolveRecording(blob);
      resolveRecording = null;
    }
    // Release mic
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      mediaStream = null;
    }
  };

  mediaRecorder.start();
}

export async function stopRecording(): Promise<string> {
  if (!mediaRecorder || mediaRecorder.state !== 'recording') {
    throw new Error('Not recording');
  }

  const blob = await new Promise<Blob>((resolve) => {
    resolveRecording = resolve;
    mediaRecorder!.stop();
  });

  mediaRecorder = null;

  // Send to proxy for transcription
  const form = new FormData();
  form.append('file', blob, 'recording.webm');

  const res = await fetch(`${PROXY_URL}/stt`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`STT request failed: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data.text;
}
