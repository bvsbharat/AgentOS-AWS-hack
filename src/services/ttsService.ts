const PROXY_URL = 'http://localhost:3001';

const VOICE_MAP: Record<string, string> = {
  developer: 'echo',
  designer: 'nova',
  analyst: 'onyx',
  writer: 'shimmer',
  manager: 'fable',
  researcher: 'sage',
};

let currentAudio: HTMLAudioElement | null = null;
let currentObjectUrl: string | null = null;

export function getVoiceForRole(role: string): string {
  return VOICE_MAP[role] || 'alloy';
}

export async function speak(text: string, voice: string, instructions?: string): Promise<void> {
  stop();

  const res = await fetch(`${PROXY_URL}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice, instructions }),
  });

  if (!res.ok) {
    throw new Error(`TTS request failed: ${res.status}`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  currentObjectUrl = url;

  const audio = new Audio(url);
  currentAudio = audio;

  audio.addEventListener('ended', cleanup);
  audio.addEventListener('error', cleanup);

  await audio.play();
}

export function stop(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    cleanup();
  }
}

export function isSpeaking(): boolean {
  return currentAudio !== null && !currentAudio.paused;
}

function cleanup(): void {
  if (currentAudio) {
    currentAudio.removeEventListener('ended', cleanup);
    currentAudio.removeEventListener('error', cleanup);
    currentAudio = null;
  }
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
}
