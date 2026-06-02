// CS: Better — Procedural Audio (Web Audio API)
// All sounds synthesized. Punchy, varied, zero assets.

let audioCtx = null;
let masterGain = null;
let enabled = true;

function initAudio() {
  if (audioCtx) return audioCtx;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.85;
    masterGain.connect(audioCtx.destination);
    // Resume on first gesture is handled by caller
  } catch (e) {
    console.warn('Audio not available');
    enabled = false;
  }
  return audioCtx;
}

function setMasterVolume(v) {
  if (masterGain) masterGain.gain.value = Math.max(0.05, Math.min(1, v));
}

function resumeAudio() {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function createNoiseBuffer(duration = 0.8, sampleRate = 44100) {
  const buffer = audioCtx.createBuffer(1, duration * sampleRate, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

let noiseBuffer = null;

function playNoise(duration, volume, filterFreq, type = 'bandpass', attack = 0.001, decay = 0.2) {
  if (!enabled || !audioCtx) return;
  if (!noiseBuffer) noiseBuffer = createNoiseBuffer(1.2);

  const src = audioCtx.createBufferSource();
  src.buffer = noiseBuffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = filterFreq || 800;

  const gain = audioCtx.createGain();
  const now = audioCtx.currentTime;

  gain.gain.value = 0;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + attack);
  gain.gain.linearRampToValueAtTime(0.0001, now + attack + decay);

  const finalGain = audioCtx.createGain();
  finalGain.gain.value = 0.6;

  src.connect(filter);
  filter.connect(gain);
  gain.connect(finalGain);
  finalGain.connect(masterGain);

  src.start(now);
  src.stop(now + attack + decay + 0.05);
}

function playTone(freq, duration, volume, wave = 'sine', attack = 0.002, decay = 0.18, freqEnd = null) {
  if (!enabled || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  osc.type = wave;
  osc.frequency.value = freq;

  const gain = audioCtx.createGain();
  const now = audioCtx.currentTime;

  gain.gain.value = 0;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + attack);
  gain.gain.linearRampToValueAtTime(0.0001, now + duration);

  if (freqEnd) {
    osc.frequency.linearRampToValueAtTime(freqEnd, now + duration * 0.9);
  }

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 3800;

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  osc.start(now);
  osc.stop(now + duration + 0.03);
}

// === WEAPON SOUNDS ===

function playGunshot(weaponKey) {
  if (!audioCtx) initAudio();
  resumeAudio();
  if (!enabled) return;

  const w = weaponKey.toLowerCase();

  if (w.includes('ak') || w === 'ak47') {
    // AK: heavy body + sharp crack + tail
    playTone(58, 0.32, 0.9, 'sine', 0.001, 0.38);
    playTone(122, 0.18, 0.65, 'sawtooth', 0.001, 0.22);
    playNoise(0.18, 0.55, 1450, 'bandpass', 0.001, 0.19);
    playNoise(0.55, 0.32, 520, 'lowpass', 0.002, 0.42);
    // slight variation
    setTimeout(() => playTone(47 + Math.random()*6, 0.21, 0.35, 'sine', 0.001, 0.28), 18);
  } else if (w.includes('m4') || w.includes('rifle')) {
    playTone(82, 0.26, 0.75, 'sawtooth', 0.001, 0.3);
    playTone(164, 0.14, 0.5, 'sine', 0.001, 0.16);
    playNoise(0.14, 0.48, 1680, 'bandpass', 0.001, 0.15);
  } else if (w.includes('awp') || w.includes('sniper')) {
    // Big boom
    playTone(38, 0.55, 1.1, 'sine', 0.001, 0.72);
    playTone(71, 0.38, 0.8, 'sawtooth', 0.001, 0.48);
    playNoise(0.42, 0.9, 620, 'lowpass', 0.001, 0.65);
    playNoise(0.9, 0.4, 2100, 'bandpass', 0.002, 0.3);
  } else if (w.includes('glock') || w.includes('pistol') || w.includes('usp')) {
    // Snappy pistol
    playTone(148, 0.09, 0.7, 'square', 0.0005, 0.12);
    playNoise(0.07, 0.65, 2100, 'highpass', 0.0005, 0.09);
    playTone(82, 0.13, 0.35, 'sine', 0.001, 0.11);
  } else {
    // Generic
    playTone(90, 0.18, 0.6, 'sawtooth', 0.001, 0.22);
    playNoise(0.12, 0.5, 1200, 'bandpass', 0.001, 0.16);
  }
}

function playReload(weaponKey) {
  if (!audioCtx) initAudio();
  resumeAudio();
  const w = (weaponKey || '').toLowerCase();
  if (w.includes('awp')) {
    playTone(420, 0.08, 0.3, 'sine');
    setTimeout(() => playTone(210, 0.22, 0.55, 'sine', 0.01, 0.3), 160);
    setTimeout(() => playNoise(0.12, 0.4, 780, 'lowpass'), 340);
  } else {
    playNoise(0.09, 0.35, 920, 'bandpass');
    setTimeout(() => playTone(380, 0.05, 0.25), 90);
    setTimeout(() => playNoise(0.07, 0.28, 650), 210);
  }
}

function playHit(isHeadshot = false, hasArmor = true) {
  if (!audioCtx) initAudio();
  resumeAudio();
  if (isHeadshot) {
    playTone(980, 0.04, 0.8, 'square', 0.0001, 0.06);
    playTone(1640, 0.03, 0.4, 'sine', 0.0001, 0.04);
    playNoise(0.05, 0.7, 2400, 'bandpass', 0.0001, 0.05);
  } else if (hasArmor) {
    playTone(620, 0.03, 0.55, 'square');
    playNoise(0.04, 0.6, 1350, 'bandpass', 0.0005, 0.04);
  } else {
    playTone(320, 0.05, 0.5, 'sine');
    playNoise(0.06, 0.55, 980, 'lowpass');
  }
}

function playFootstep(speed = 1, isCrouch = false) {
  if (!audioCtx) initAudio();
  resumeAudio();
  const vol = isCrouch ? 0.18 : 0.32;
  const dur = isCrouch ? 0.07 : 0.055;
  playNoise(dur, vol, 420 + (speed - 1) * 80, 'lowpass', 0.001, dur * 1.1);
}

function playJumpLand() {
  if (!audioCtx) initAudio();
  resumeAudio();
  playNoise(0.11, 0.45, 310, 'lowpass', 0.001, 0.14);
  setTimeout(() => playNoise(0.05, 0.25, 180, 'lowpass'), 55);
}

function playPlantBeep() {
  if (!audioCtx) initAudio();
  resumeAudio();
  playTone(880, 0.06, 0.4, 'sine');
}

function playDefuseBeep() {
  if (!audioCtx) initAudio();
  resumeAudio();
  playTone(1240, 0.04, 0.35, 'square');
}

function playWinSound(isCTWin) {
  if (!audioCtx) initAudio();
  resumeAudio();
  if (isCTWin) {
    playTone(680, 0.18, 0.6);
    setTimeout(() => playTone(920, 0.26, 0.5), 120);
  } else {
    playTone(420, 0.22, 0.7);
    setTimeout(() => playTone(310, 0.32, 0.55), 90);
  }
}

function playBuySound(success = true) {
  if (!audioCtx) initAudio();
  resumeAudio();
  if (success) {
    playTone(780, 0.04, 0.3);
    setTimeout(() => playTone(1240, 0.05, 0.25), 45);
  } else {
    playTone(180, 0.12, 0.4, 'square');
  }
}

function playError() {
  if (!audioCtx) initAudio();
  resumeAudio();
  playTone(140, 0.09, 0.35, 'sawtooth');
}

window.CSAudio = {
  init: initAudio,
  resume: resumeAudio,
  setVolume: setMasterVolume,
  gunshot: playGunshot,
  reload: playReload,
  hit: playHit,
  footstep: playFootstep,
  land: playJumpLand,
  plant: playPlantBeep,
  defuse: playDefuseBeep,
  win: playWinSound,
  buy: playBuySound,
  error: playError
};
