// 8-bit Sound FX Engine powered by standard browser Web Audio API

let soundMuted = false;

export function toggleSound() {
  soundMuted = !soundMuted;
  return soundMuted;
}

export function isMuted() {
  return soundMuted;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  return AudioContextClass ? new AudioContextClass() : null;
}

export function playCoinSound() {
  if (soundMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "square";
  osc.frequency.setValueAtTime(523.25, now); // C5
  osc.frequency.setValueAtTime(659.25, now + 0.1); // E5

  gain.gain.setValueAtTime(0.05, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.35);
}

export function playPowerUp() {
  if (soundMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(330, now); // E4
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.4); // A5

  gain.gain.setValueAtTime(0.05, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.45);
}

export function playLevelUpSound() {
  if (soundMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  // Classic rising synth wave arpeggio
  osc.frequency.setValueAtTime(261.63, now); // C4
  osc.frequency.setValueAtTime(329.63, now + 0.1); // E4
  osc.frequency.setValueAtTime(392.00, now + 0.2); // G4
  osc.frequency.setValueAtTime(523.25, now + 0.3); // C5

  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.5);
}

export function playClickSound() {
  if (soundMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

  gain.gain.setValueAtTime(0.03, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.05);
}

export function playBuzzerSound() {
  if (soundMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(150, now);
  osc.frequency.linearRampToValueAtTime(90, now + 0.35);

  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.4);
}
