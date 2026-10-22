/**
 * Lightweight & Reliable Audio Engine for Live Quiz Countdown & Warnings
 * - Dual-layer playback: Ultra-fast Web Audio API + HTML5 Audio WAV fallback.
 * - Global user interaction auto-unlocking for browser autoplay compliance.
 * - 100% offline & client-side synthesized — zero external audio files, zero CORS or network latency.
 */

let audioCtx: AudioContext | null = null;
let audioUnlocked = false;

// Pre-cached HTML5 Audio elements for instant zero-latency fallback playback
const audioPool: Record<string, HTMLAudioElement> = {};

function createWavDataUri(sampleRate: number, durationSec: number, generateSample: (t: number) => number): string {
  if (typeof window === 'undefined') return '';
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  function writeString(v: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      v.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // 1 channel (mono)
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); // 16 bits
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * 2, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.max(-1, Math.min(1, generateSample(t)));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += 2;
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

function bellSample(t: number, freq: number, duration: number): number {
  if (t > duration) return 0;
  const env = Math.exp(-t * 9);
  const fundamental = Math.sin(2 * Math.PI * freq * t);
  const harmonic = Math.sin(2 * Math.PI * freq * 2 * t) * 0.25;
  return (fundamental + harmonic) * env * 0.5;
}

// Generate fallback WAV URIs lazily
const wavCache: Record<string, string> = {};

function getWavDataUri(key: string): string {
  if (wavCache[key]) return wavCache[key];
  if (typeof window === 'undefined') return '';

  const sampleRate = 22050;
  let uri = '';

  if (key === '5') {
    uri = createWavDataUri(sampleRate, 0.30, (t) => bellSample(t, 587.33, 0.30));
  } else if (key === '4') {
    uri = createWavDataUri(sampleRate, 0.30, (t) => bellSample(t, 659.25, 0.30));
  } else if (key === '3') {
    uri = createWavDataUri(sampleRate, 0.30, (t) => bellSample(t, 739.99, 0.30));
  } else if (key === '2') {
    uri = createWavDataUri(sampleRate, 0.35, (t) => {
      const p1 = bellSample(t, 880, 0.16);
      const p2 = t >= 0.11 ? bellSample(t - 0.11, 880, 0.22) : 0;
      return p1 + p2;
    });
  } else if (key === '1') {
    uri = createWavDataUri(sampleRate, 0.35, (t) => {
      const p1 = bellSample(t, 1046.5, 0.16);
      const p2 = t >= 0.11 ? bellSample(t - 0.11, 1046.5, 0.22) : 0;
      return p1 + p2;
    });
  } else if (key === 'reveal') {
    uri = createWavDataUri(sampleRate, 0.55, (t) => {
      const n1 = bellSample(t, 523.25, 0.22);
      const n2 = t >= 0.11 ? bellSample(t - 0.11, 659.25, 0.22) : 0;
      const n3 = t >= 0.22 ? bellSample(t - 0.22, 783.99, 0.22) : 0;
      const n4 = t >= 0.33 ? bellSample(t - 0.33, 1046.5, 0.22) : 0;
      return n1 + n2 + n3 + n4;
    });
  } else if (key === 'test') {
    uri = createWavDataUri(sampleRate, 0.40, (t) => {
      const n1 = bellSample(t, 659.25, 0.20);
      const n2 = t >= 0.12 ? bellSample(t - 0.12, 880, 0.26) : 0;
      return n1 + n2;
    });
  }

  wavCache[key] = uri;
  return uri;
}

function playWavFallback(key: string, volume = 0.6) {
  try {
    const uri = getWavDataUri(key);
    if (!uri) return;
    let audio = audioPool[key];
    if (!audio) {
      audio = new Audio(uri);
      audioPool[key] = audio;
    }
    audio.currentTime = 0;
    audio.volume = Math.max(0, Math.min(1, volume));
    const p = audio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        // Silently catch if autoplay is still pending user interaction
      });
    }
  } catch (err) {
    // Fail silently
  }
}

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

/**
 * Call on any user interaction (click, touch, keydown) to resume AudioContext.
 */
export function unlockAudio(): void {
  const ctx = getAudioContext();
  if (ctx) {
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        audioUnlocked = true;
      }).catch(() => {});
    } else if (ctx.state === 'running') {
      audioUnlocked = true;
    }
    // Silent buffer unlock for mobile & Safari
    try {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch (e) {}
  }
}

export function isAudioUnlocked(): boolean {
  return audioUnlocked;
}

// Global user interaction listener to automatically unlock audio as early as possible
if (typeof window !== 'undefined') {
  const unlockEvents = ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'click'];
  const handleInteraction = () => {
    unlockAudio();
  };
  unlockEvents.forEach((evt) => {
    window.addEventListener(evt, handleInteraction, { capture: true, passive: true });
  });
}

export function isQuizSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem('eduashram_live_quiz_sound');
  return stored === null ? true : stored === 'true';
}

export function setQuizSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('eduashram_live_quiz_sound', String(enabled));
}

function playWebAudioBell(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration = 0.28,
  peakGain = 0.32
) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const harmGain = ctx.createGain();

  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, startTime);

  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(freq * 2, startTime);

  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  harmGain.gain.setValueAtTime(0.25, startTime);

  osc1.connect(gain);
  osc2.connect(harmGain);
  harmGain.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(startTime);
  osc2.start(startTime);
  osc1.stop(startTime + duration + 0.04);
  osc2.stop(startTime + duration + 0.04);
}

/**
 * Play a light warning melodic note when the last 5 seconds are left (5, 4, 3, 2, 1).
 */
export function playCountdownWarningSound(remainingSeconds: number, forceEnabled?: boolean): void {
  const enabled = forceEnabled !== undefined ? forceEnabled : isQuizSoundEnabled();
  if (!enabled) return;

  const ctx = getAudioContext();
  let playedWebAudio = false;

  if (ctx) {
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    if (ctx.state === 'running') {
      try {
        const now = ctx.currentTime;
        if (remainingSeconds === 5) {
          playWebAudioBell(ctx, 587.33, now, 0.28, 0.30);
        } else if (remainingSeconds === 4) {
          playWebAudioBell(ctx, 659.25, now, 0.28, 0.30);
        } else if (remainingSeconds === 3) {
          playWebAudioBell(ctx, 739.99, now, 0.28, 0.32);
        } else if (remainingSeconds === 2) {
          playWebAudioBell(ctx, 880.00, now, 0.16, 0.30);
          playWebAudioBell(ctx, 880.00, now + 0.11, 0.20, 0.32);
        } else if (remainingSeconds === 1) {
          playWebAudioBell(ctx, 1046.50, now, 0.16, 0.32);
          playWebAudioBell(ctx, 1046.50, now + 0.11, 0.22, 0.35);
        }
        playedWebAudio = true;
      } catch (err) {
        playedWebAudio = false;
      }
    }
  }

  // If Web Audio was not yet running, fall back to HTML5 Audio with synthesized WAV
  if (!playedWebAudio && remainingSeconds >= 1 && remainingSeconds <= 5) {
    playWavFallback(String(remainingSeconds), 0.65);
  }
}

/**
 * Play a cheerful, soft reveal chime when timer reaches 0 and the answer reveals
 */
export function playAnswerRevealChime(forceEnabled?: boolean): void {
  const enabled = forceEnabled !== undefined ? forceEnabled : isQuizSoundEnabled();
  if (!enabled) return;

  const ctx = getAudioContext();
  let playedWebAudio = false;

  if (ctx) {
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    if (ctx.state === 'running') {
      try {
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          playWebAudioBell(ctx, freq, now + idx * 0.10, 0.24, 0.28);
        });
        playedWebAudio = true;
      } catch (err) {
        playedWebAudio = false;
      }
    }
  }

  if (!playedWebAudio) {
    playWavFallback('reveal', 0.65);
  }
}

/**
 * Play a quick pleasant test ping so the user can verify their audio works immediately.
 */
export function playTestSound(): void {
  unlockAudio();
  const ctx = getAudioContext();
  let playedWebAudio = false;

  if (ctx && ctx.state === 'running') {
    try {
      const now = ctx.currentTime;
      playWebAudioBell(ctx, 659.25, now, 0.20, 0.30);
      playWebAudioBell(ctx, 880.00, now + 0.12, 0.26, 0.32);
      playedWebAudio = true;
    } catch (err) {
      playedWebAudio = false;
    }
  }

  if (!playedWebAudio) {
    playWavFallback('test', 0.65);
  }
}
