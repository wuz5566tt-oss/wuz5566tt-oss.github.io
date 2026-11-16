// 程序生成的環境音樂（無外部音檔）
let ctx = null, master = null, timer = null, on = false;
const chords = [[57,64,69,72],[53,60,65,69],[55,62,67,71],[52,59,64,67]];
function note(f, t, dur, g, type='sine') {
  const o = ctx.createOscillator(), v = ctx.createGain();
  o.type = type; o.frequency.value = f;
  v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(g, t + dur * 0.35); v.gain.linearRampToValueAtTime(0, t + dur);
  o.connect(v); v.connect(master); o.start(t); o.stop(t + dur + 0.05);
}
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
let step = 0;
function schedule() {
  const t = ctx.currentTime + 0.05, c = chords[step % chords.length];
  c.forEach((m, i) => { note(hz(m - 12), t, 7.5, 0.05, 'triangle'); note(hz(m) * 1.003, t + i * 0.02, 7.5, 0.025, 'sine'); });
  for (let k = 0; k < 4; k++) note(hz(c[(k * 3 + step) % 4] + 12), t + 1 + k * 1.6, 1.6, 0.02, 'sine');
  step++;
}
export function toggleMusic() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
    const dl = ctx.createDelay(); dl.delayTime.value = 0.42; const fb = ctx.createGain(); fb.gain.value = 0.35;
    master.connect(lp); lp.connect(ctx.destination); lp.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(ctx.destination);
  }
  on = !on;
  if (on) { ctx.resume(); master.gain.setTargetAtTime(0.9, ctx.currentTime, 0.8); schedule(); timer = setInterval(schedule, 7000); }
  else { master.gain.setTargetAtTime(0, ctx.currentTime, 0.3); clearInterval(timer); }
  return on;
}
export function blip(freq = 880) {
  if (!ctx || !on) return;
  const t = ctx.currentTime; note(freq, t, 0.25, 0.08, 'triangle'); note(freq * 1.5, t + 0.08, 0.3, 0.06, 'sine');
}
