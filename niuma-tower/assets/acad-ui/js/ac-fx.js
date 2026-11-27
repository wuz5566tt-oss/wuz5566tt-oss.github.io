// 視覺特效：背景、主視覺能量球、卡片全息傾斜、收卡爆光、數字跳動。
// 效能規則：鎖 30fps、DPR 上限 1.5、離開畫面或分頁隱藏就停、減少動態時只畫一張靜態畫面。
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const coarse = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
const DPR = Math.min(devicePixelRatio || 1, 1.5);
const FRAME = 1000 / 30;

/** 30fps 迴圈，可見時才跑 */
function loop(el, draw) {
  let raf = 0, last = 0, onScreen = true, t0 = performance.now();
  const tick = now => {
    raf = requestAnimationFrame(tick);
    if (now - last < FRAME) return;
    last = now; draw((now - t0) / 1000);
  };
  const sync = () => {
    const run = onScreen && !document.hidden && !reduced;
    if (run && !raf) raf = requestAnimationFrame(tick);
    if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
  };
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); }).observe(el);
  document.addEventListener('visibilitychange', sync);
  draw(0); sync();
}
function fit(cv) {
  const r = cv.getBoundingClientRect();
  cv.width = Math.max(1, r.width * DPR); cv.height = Math.max(1, r.height * DPR);
  return { w: cv.width, h: cv.height };
}

// ---- 背景：透視網格地板＋漂浮粒子＋光暈（粒子用格子分桶連線） ----
export function background(cv) {
  const ctx = cv.getContext('2d');
  let W, H, pts = [];
  const N = coarse ? 28 : 64;
  const resize = () => {
    ({ w: W, h: H } = fit(cv));
    pts = Array.from({ length: N }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25 * DPR, vy: (Math.random() - .5) * .25 * DPR, r: (Math.random() * 1.4 + .4) * DPR }));
  };
  resize(); addEventListener('resize', resize);
  const link = 120 * DPR;
  loop(cv, t => {
    ctx.clearRect(0, 0, W, H);
    // 地平線網格
    const hz = H * .62;
    ctx.strokeStyle = 'rgba(34,211,238,.10)'; ctx.lineWidth = 1 * DPR;
    for (let i = -14; i <= 14; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 18 * DPR, hz); ctx.lineTo(W / 2 + i * 160 * DPR, H); ctx.stroke(); }
    const off = (t * 18) % 40;
    for (let j = 0; j < 12; j++) { const k = (j * 40 + off) / 480; const y = hz + (H - hz) * k * k; ctx.globalAlpha = Math.min(1, k * 2.2); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.globalAlpha = 1;
    // 粒子
    const cell = new Map();
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1;
      const key = `${(p.x / link) | 0},${(p.y / link) | 0}`; (cell.get(key) || cell.set(key, []).get(key)).push(p);
    }
    ctx.lineWidth = .7 * DPR;
    for (const p of pts) {
      const cx = (p.x / link) | 0, cy = (p.y / link) | 0;
      for (let dx = 0; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        for (const q of cell.get(`${cx + dx},${cy + dy}`) || []) {
          if (q === p || (dx === 0 && q.x < p.x)) continue;
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < link) { ctx.strokeStyle = `rgba(167,139,250,${(1 - d / link) * .22})`; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
        }
      }
      ctx.fillStyle = 'rgba(190,240,255,.75)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
    }
  });
}

// ---- 主視覺：STAR 能量核心（電漿環＋軌道粒子＋脈動） ----
export function orb(cv) {
  const ctx = cv.getContext('2d');
  let W, H; const resize = () => ({ w: W, h: H } = fit(cv)); resize(); addEventListener('resize', resize);
  let boost = 0; cv.addEventListener('pointerdown', () => boost = 1);
  const sats = Array.from({ length: coarse ? 26 : 60 }, (_, i) => ({ a: Math.random() * 7, r: .58 + Math.random() * .36, s: (.2 + Math.random() * .5) * (i % 2 ? 1 : -1), z: Math.random() }));
  loop(cv, t => {
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) * .5;
    ctx.clearRect(0, 0, W, H);
    boost *= .94; const pulse = 1 + Math.sin(t * 2) * .03 + boost * .08;
    let g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * .62 * pulse);
    g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.18, 'rgba(120,235,255,.85)'); g.addColorStop(.5, 'rgba(110,80,240,.45)'); g.addColorStop(1, 'rgba(10,10,40,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * .62 * pulse, 0, 7); ctx.fill();
    // 電漿條紋
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 3; k++) {
      ctx.strokeStyle = k === 1 ? 'rgba(167,139,250,.55)' : 'rgba(34,211,238,.5)'; ctx.lineWidth = (2.2 - k * .5) * DPR;
      ctx.beginPath();
      for (let i = 0; i <= 90; i++) {
        const a = i / 90 * Math.PI * 2, rr = R * (.36 + .05 * Math.sin(a * (3 + k) + t * (1.3 + k * .4)) + .03 * Math.sin(a * 7 - t * 2));
        const x = cx + Math.cos(a) * rr * pulse, y = cy + Math.sin(a) * rr * pulse;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    // 光環
    for (const [rr, tilt, col, sp] of [[.74, .32, 'rgba(34,211,238,.55)', .4], [.86, -.22, 'rgba(167,139,250,.5)', -.3], [.95, .1, 'rgba(255,200,90,.35)', .2]]) {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * sp); ctx.scale(1, .34 + tilt * .2);
      ctx.strokeStyle = col; ctx.lineWidth = 1.4 * DPR; ctx.setLineDash([R * .5, R * .08]);
      ctx.beginPath(); ctx.arc(0, 0, R * rr, 0, 7); ctx.stroke(); ctx.restore();
    }
    ctx.setLineDash([]);
    for (const s of sats) {
      s.a += s.s * .02 * (1 + boost * 3);
      const x = cx + Math.cos(s.a) * R * s.r, y = cy + Math.sin(s.a) * R * s.r * .42;
      ctx.fillStyle = s.z > .5 ? 'rgba(180,245,255,.9)' : 'rgba(200,180,255,.85)';
      ctx.beginPath(); ctx.arc(x, y, (1 + s.z * 1.8) * DPR, 0, 7); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  });
}

// ---- 卡片：滑鼠／手指移動，光澤跟著跑＋微傾斜 ----
export function holo(root) {
  if (reduced) return;
  let pending = null;
  root.addEventListener('pointermove', e => {
    const el = e.target.closest('.ac-card'); if (!el || el.classList.contains('is-locked')) return;
    pending = { el, x: e.clientX, y: e.clientY };
    requestAnimationFrame(() => {
      if (!pending) return; const { el, x, y } = pending; pending = null;
      const r = el.getBoundingClientRect(); const px = (x - r.left) / r.width, py = (y - r.top) / r.height;
      el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`); el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
      el.style.setProperty('--rx', `${((.5 - py) * (coarse ? 6 : 12)).toFixed(2)}deg`); el.style.setProperty('--ry', `${((px - .5) * (coarse ? 8 : 16)).toFixed(2)}deg`);
      el.classList.add('is-hover');
    });
  });
  root.addEventListener('pointerout', e => {
    const el = e.target.closest('.ac-card'); if (!el || el.contains(e.relatedTarget)) return;
    el.classList.remove('is-hover'); el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg');
  });
}

// ---- 收卡：翻卡＋光爆粒子 ----
export function burst(el, colors = ['#22d3ee', '#a78bfa', '#ffd66b', '#ffffff']) {
  el.classList.remove('is-collecting'); void el.offsetWidth; el.classList.add('is-collecting');
  if (reduced) return;
  const r = el.getBoundingClientRect(), host = document.createElement('div');
  host.className = 'ac-burst'; host.style.left = `${r.left + r.width / 2}px`; host.style.top = `${r.top + r.height / 2}px`;
  const n = coarse ? 14 : 28;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('i'), a = i / n * Math.PI * 2, d = 90 + Math.random() * 120;
    s.style.setProperty('--tx', `${Math.cos(a) * d}px`); s.style.setProperty('--ty', `${Math.sin(a) * d}px`);
    s.style.background = colors[i % colors.length]; s.style.animationDelay = `${Math.random() * 120}ms`;
    host.appendChild(s);
  }
  document.body.appendChild(host); setTimeout(() => host.remove(), 1200);
}

// ---- 數字跳動：只有真的數字才跳，非數字直接顯示 ----
export function countUp(scope) {
  scope.querySelectorAll('[data-count]').forEach(el => {
    const to = Number(el.dataset.count);
    if (!Number.isFinite(to) || reduced || to === 0) { el.textContent = el.dataset.count; return; }
    const from = Number(el.dataset.from || 0), t0 = performance.now(), dur = 900;
    const step = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(from + (to - from) * e).toLocaleString('zh-TW'); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}

// ---- 標題解碼打字 ----
export function decode(el) {
  const text = el.dataset.text || el.textContent; el.dataset.text = text;
  if (reduced) { el.textContent = text; return; }
  const glyph = '01▮▯◆◇ΣΔ史塔牛馬'; let f = 0;
  const id = setInterval(() => {
    f++; el.textContent = [...text].map((ch, i) => (i < f / 2 ? ch : glyph[(Math.random() * glyph.length) | 0])).join('');
    if (f / 2 >= text.length) { clearInterval(id); el.textContent = text; }
  }, 40);
}
