// Web Audio API Sound Engine for Sports Hub

let audioCtx: AudioContext | null = null;

export const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Standard fitness timer triple beep
export const playTimerBeep = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const playBeep = (timeOffset: number, freq: number) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + timeOffset);
    gainNode.gain.setValueAtTime(0, ctx.currentTime + timeOffset);
    gainNode.gain.linearRampToValueAtTime(0.7, ctx.currentTime + timeOffset + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + 0.35);
    osc.start(ctx.currentTime + timeOffset);
    osc.stop(ctx.currentTime + timeOffset + 0.35);
  };

  playBeep(0, 880);
  playBeep(0.18, 880);
  playBeep(0.36, 1174.66); // D6 note
};

// Resonant Boxing Bell (Gong)
export const playBoxingBell = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const freqs = [659.25, 880, 1318.51, 1760]; // Harmonics for brass bell
  const now = ctx.currentTime;

  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    // Strike decay
    const amp = 0.4 / (idx + 1);
    gain.gain.setValueAtTime(amp, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.8);
  });
};

// 10-Second Warning Wooden Clapper (Boxing / MMA standard)
export const playTenSecondClapper = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const strike = (timeOffset: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, ctx.currentTime + timeOffset);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + timeOffset + 0.08);

    gain.gain.setValueAtTime(0.8, ctx.currentTime + timeOffset);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + timeOffset);
    osc.stop(ctx.currentTime + timeOffset + 0.09);
  };

  // Double wooden clap: "knock-knock"
  strike(0);
  strike(0.12);
};

// Referee Match Whistle (Wrestling / Running start)
export const playWhistle = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(2400, now);
  osc.frequency.linearRampToValueAtTime(2600, now + 0.1);
  osc.frequency.linearRampToValueAtTime(2350, now + 0.4);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.6, now + 0.05);
  gain.gain.linearRampToValueAtTime(0.4, now + 0.35);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.5);
};

// High Precision Running Cadence Click (160-190 SPM)
export const playCadenceClick = (isAccent: boolean = false) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(isAccent ? 1200 : 800, now);

  gain.gain.setValueAtTime(isAccent ? 0.4 : 0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.03);
};

// Chiptune Coin Collect Sound 🪙
export const playCoinSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(987.77, now); // B5
  osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

  gain.gain.setValueAtTime(0.5, now);
  gain.gain.setValueAtTime(0.5, now + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.35);
};
