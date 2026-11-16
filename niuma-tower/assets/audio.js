// 程序生成的抒情環境音樂（無外部音檔）：約 76 拍，F 大調色彩的降 E 大調 I–V–vi–IV
let ctx = null, master = null, timer = null, on = false, gestureHook = null, nextT = 0, phrase = 0;

const BPM = 76;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const CYCLE = BAR * 8; // 四個和弦，各兩小節
const hz = m => 440 * Math.pow(2, (m - 69) / 12);

// I  Eb ／ V  Bb ／ vi Cm ／ IV Ab
const CHORDS = [
  [51, 55, 58, 63],
  [46, 50, 53, 58],
  [48, 51, 55, 60],
  [44, 48, 51, 56],
];
const BASS = [39, 34, 36, 32];

// 兩段對答旋律（單位：拍、音高、拍長），慢句、有呼吸
const PHRASES = [
  [
    [0, 67, 2], [2, 70, 1], [3, 72, 1], [4, 70, 2], [6, 67, 2],
    [8, 65, 2], [10, 67, 1], [11, 70, 1], [12, 65, 3],
    [16, 72, 2], [18, 70, 1], [19, 67, 1], [20, 68, 2], [22, 67, 2],
    [24, 65, 2], [26, 63, 1], [27, 65, 1], [28, 67, 4],
  ],
  [
    [0, 70, 2], [2, 72, 1], [3, 75, 1], [4, 72, 2], [6, 70, 2],
    [8, 67, 2], [10, 65, 1], [11, 67, 1], [12, 70, 2],
    [16, 72, 2], [18, 74, 1], [19, 75, 1], [20, 72, 2], [22, 70, 2],
    [24, 68, 2], [26, 67, 1], [27, 65, 1], [28, 63, 4],
  ],
];

function voice(midi, t, dur, gain, type, attack, detune = 1) {
  const o = ctx.createOscillator(), v = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(hz(midi) * detune, t);
  const a = Math.min(attack, dur * 0.4);
  const rel = Math.min(1.8, Math.max(0.55, dur * 0.45));
  v.gain.setValueAtTime(0, t);
  v.gain.linearRampToValueAtTime(gain, t + a);
  const hold = Math.max(a, dur * 0.58);
  v.gain.setValueAtTime(gain, t + hold);
  v.gain.linearRampToValueAtTime(0, t + dur + rel);
  o.connect(v); v.connect(master);
  o.start(t); o.stop(t + dur + rel + 0.08);
}

function padNote(midi, t, dur, g) {
  voice(midi, t, dur, g, 'sine', 1.35);
  voice(midi, t, dur, g * 0.32, 'triangle', 1.5, 1.002);
  voice(midi - 12, t, dur, g * 0.22, 'sine', 1.6);
}

function piano(midi, t, beats) {
  const dur = beats * BEAT * 0.96;
  const g = 0.072;
  voice(midi, t, dur, g, 'sine', 0.028);
  voice(midi, t, dur, g * 0.28, 'triangle', 0.04, 1.0015);
  voice(midi + 12, t, dur * 0.75, g * 0.07, 'sine', 0.06);
}

function shimmer(midi, t, dur) {
  // 極輕的高音亮片，慢起慢收，不是琶音
  voice(midi + 24, t, dur, 0.009, 'sine', 2.2, 1.003);
  voice(midi + 31, t + dur * 0.15, dur * 0.85, 0.006, 'sine', 2.4, 0.997);
}

function scheduleCycle(t0) {
  const hold = BAR * 2 + 1.6;
  CHORDS.forEach((chord, i) => {
    const t = t0 + i * BAR * 2;
    chord.forEach((m, k) => padNote(m, t, hold, k ? 0.028 : 0.036));
    voice(BASS[i], t, hold, 0.05, 'sine', 1.2);
    shimmer(chord[chord.length - 1], t, hold);
  });
  PHRASES[phrase % PHRASES.length].forEach(([beat, midi, len]) => {
    piano(midi, t0 + beat * BEAT, len);
  });
  phrase++;
}

function tick() {
  if (!on || !ctx) return;
  const now = ctx.currentTime;
  while (nextT < now + 1.4) {
    scheduleCycle(nextT);
    nextT += CYCLE;
  }
}

function ensureCtx() {
  if (ctx) return ctx;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); master.gain.value = 0;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2300; lp.Q.value = 0.65;
  const d1 = ctx.createDelay(2); d1.delayTime.value = 0.62;
  const f1 = ctx.createGain(); f1.gain.value = 0.26;
  const w1 = ctx.createGain(); w1.gain.value = 0.3;
  const d2 = ctx.createDelay(3); d2.delayTime.value = 1.18;
  const f2 = ctx.createGain(); f2.gain.value = 0.16;
  const w2 = ctx.createGain(); w2.gain.value = 0.18;
  master.connect(lp);
  lp.connect(ctx.destination);
  lp.connect(d1); d1.connect(f1); f1.connect(d1); d1.connect(w1); w1.connect(ctx.destination);
  lp.connect(d2); d2.connect(f2); f2.connect(d2); d2.connect(w2); w2.connect(ctx.destination);
  return ctx;
}
function clearHook() {
  if (!gestureHook) return;
  window.removeEventListener('pointerdown', gestureHook, true);
  window.removeEventListener('keydown', gestureHook, true);
  window.removeEventListener('touchstart', gestureHook, true);
  gestureHook = null;
}
function startGraph() {
  if (on) return true;
  if (!ctx || ctx.state !== 'running') return false;
  on = true;
  phrase = 0;
  nextT = ctx.currentTime + 0.12;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setValueAtTime(master.gain.value || 0, ctx.currentTime);
  master.gain.setTargetAtTime(0.4, ctx.currentTime, 1.15);
  tick();
  clearInterval(timer);
  timer = setInterval(tick, 500);
  return true;
}
export function isMusicOn() { return on; }
export function setMusic(wantOn) {
  ensureCtx();
  if (!wantOn) {
    clearHook();
    if (master) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.45);
    }
    on = false;
    clearInterval(timer); timer = null;
    return false;
  }
  if (ctx.state === 'running') return startGraph();
  ctx.resume().then(() => startGraph()).catch(() => {});
  return startGraph();
}
export function toggleMusic() { return setMusic(!on); }
export function preferMusicOn(onStart) {
  const done = () => { clearHook(); onStart && onStart(true); };
  if (setMusic(true)) { done(); return true; }
  if (!gestureHook) {
    gestureHook = () => { if (setMusic(true)) done(); };
    window.addEventListener('pointerdown', gestureHook, true);
    window.addEventListener('keydown', gestureHook, true);
    window.addEventListener('touchstart', gestureHook, { capture: true, passive: true });
  }
  return false;
}
export function blip(freq = 659) {
  if (!ctx || !on) return;
  const t = ctx.currentTime;
  voice(69, t, 0.28, 0.04, 'sine', 0.02);
  voice(72, t + 0.05, 0.32, 0.025, 'sine', 0.03);
}
