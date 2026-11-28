// 6 樓・交易實驗室：模擬引擎驅動畫面＋即時讀數
// 所有 K 線都由「隨機種子」產生，是練習盤，不是任何真實商品的價格；價格單位只是「模擬點」。
// 獎勵只發站內薪水（虛擬點數），每天有上限。GM 模式可以完整操作，但不寫存檔、不發薪水。
export const LAB_REWARD = { dayCap: 100, perScore: 5 }; // 每局薪水＝分數 ÷ 5（最多 20），每天最多 100
export const LAB_ICON = {
  labsim: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/><circle cx="9" cy="7" r="2" fill="#2effc4" stroke="#2effc4"/><circle cx="15" cy="12" r="2" fill="#ffc85a" stroke="#ffc85a"/><circle cx="7" cy="17" r="2" fill="#2effc4" stroke="#2effc4"/></svg>',
  labdrill: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="2.4" fill="#2effc4" stroke="#2effc4"/></svg>',
  labwiki: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/><path d="M7.5 15h9" stroke="#2effc4"/></svg>',
};
const UP = '#ff5468', DN = '#2fd38a', CY = '#3ef2ff', GD = '#ffc85a', TL = '#2effc4', MG = '#ff7ae0';
const DEF = { vol: 5, trend: 5, depth: 5, sweep: 5 };
const PARAMS = [
  { k: 'vol', name: '波動度', min: 1, max: 10, desc: v => v <= 3 ? '波動小，K 線短，結構乾淨' : v >= 8 ? '波動大，影線長，假訊號變多' : '波動中等' },
  { k: 'trend', name: '趨勢強度', min: -10, max: 10, desc: v => Math.abs(v) < 2 ? '沒有方向，價格在區間來回' : `${v > 0 ? '偏多' : '偏空'}，${Math.abs(v) >= 7 ? '推進段明顯大於回檔' : '推進段略大於回檔'}` },
  { k: 'depth', name: '回檔深度', min: 1, max: 10, desc: v => v <= 3 ? '回檔淺，趨勢延續性強' : v >= 8 ? '回檔深，容易回測甚至破壞結構' : '回檔適中' },
  { k: 'sweep', name: '掃單頻率', min: 0, max: 10, desc: v => v <= 2 ? '很少刺破前高前低' : v >= 7 ? '常常先刺破前高前低再拉回' : '偶爾掃一下流動性' },
];

let C = null;
export function initLab(ctx) {
  C = ctx;
  if (new URLSearchParams(location.search).has('lobby')) window.__niumaLab = { gen, analyze, score: scoreTrade, get drill() { return DR; } }; // 測試用掛勾
}

/* ---------- 模擬引擎 ---------- */
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const newSeed = () => 100000 + Math.floor(Math.random() * 900000);
export function gen(seed, p = DEF, n = 72) {
  const r = rng(seed), bars = [];
  const unit = .22 + p.vol * .11; // 每根平均波幅（模擬點）
  const ranging = Math.abs(p.trend) < 2, tdir = p.trend >= 0 ? 1 : -1;
  let lastMag = unit * 4, price = 100, dir = ranging ? (r() < .5 ? 1 : -1) : tdir, impulse = true, prevHi = null, prevLo = null;
  while (bars.length < n) {
    const len = impulse ? 3 + Math.floor(r() * 4) : 2 + Math.floor(r() * 4);
    let mag;
    if (ranging) mag = unit * (3.4 + r() * 1.4);
    else mag = impulse ? unit * (2.6 + Math.abs(p.trend) * .75) * (.75 + r() * .5) : 0;
    if (!ranging && !impulse) mag = lastMag * (.22 + p.depth * .075) * (.8 + r() * .4);
    if (ranging && bars.length && !impulse) mag *= .85 + p.depth * .025;
    if (impulse) lastMag = mag;
    const legDir = ranging ? dir : impulse ? tdir : -tdir, step = mag / len;
    const sweepIt = r() < p.sweep / 13;
    for (let i = 0; i < len && bars.length < n; i++) {
      const o = price, noise = (r() - .5) * unit * 1.1;
      let c = o + legDir * step + noise;
      let h = Math.max(o, c) + r() * unit * .55, l = Math.min(o, c) - r() * unit * .55;
      if (i === len - 1 && sweepIt) { // 段落結尾刺破前一個高低點再收回（掃流動性）
        if (legDir > 0 && prevHi != null && prevHi - Math.max(o, c) < unit * 2.2) { h = Math.max(h, prevHi + unit * (.35 + r() * .5)); c = Math.min(c, prevHi - unit * (.1 + r() * .3)); if (c < o - unit) c = o - unit * .3; h = Math.max(h, o, c); }
        if (legDir < 0 && prevLo != null && Math.min(o, c) - prevLo < unit * 2.2) { l = Math.min(l, prevLo - unit * (.35 + r() * .5)); c = Math.max(c, prevLo + unit * (.1 + r() * .3)); if (c > o + unit) c = o + unit * .3; l = Math.min(l, o, c); }
      }
      bars.push({ o, h, l, c }); price = c;
    }
    const seg = bars.slice(-len);
    if (legDir > 0) prevHi = Math.max(...seg.map(b => b.h)); else prevLo = Math.min(...seg.map(b => b.l));
    impulse = !impulse; if (ranging) dir = -dir;
  }
  return bars;
}
export function analyze(bars, upto = bars.length) {
  const B = bars.slice(0, upto), K = 2, atr = B.reduce((a, b) => a + b.h - b.l, 0) / Math.max(1, B.length);
  const piv = [];
  for (let i = K; i < B.length - K; i++) {
    let hi = true, lo = true;
    for (let j = i - K; j <= i + K; j++) { if (j === i) continue; if (B[j].h > B[i].h || (j > i && B[j].h === B[i].h)) hi = false; if (B[j].l < B[i].l || (j > i && B[j].l === B[i].l)) lo = false; }
    if (hi) piv.push({ i, t: 'H', p: B[i].h }); if (lo) piv.push({ i, t: 'L', p: B[i].l });
  }
  let pH = null, pL = null; const lab = { HH: 0, LH: 0, HL: 0, LL: 0 };
  piv.forEach(v => { if (v.t === 'H') { v.k = pH == null ? null : v.p > pH.p ? 'HH' : 'LH'; pH = v; } else { v.k = pL == null ? null : v.p > pL.p ? 'HL' : 'LL'; pL = v; } if (v.k) lab[v.k]++; });
  // 依時間掃過：結構突破／轉折、掃流動性、二次突破
  const ev = [], sweeps = [], sb = [], levels = [];
  let lastH = null, lastL = null, trend = 0, pend = null;
  for (let i = 0; i < B.length; i++) {
    const b = B[i];
    piv.filter(v => v.i === i - K).forEach(v => { const L = { ...v, from: v.i, to: null, end: null }; levels.push(L); if (v.t === 'H') lastH = L; else lastL = L; });
    if (pend && i > pend.i1) {
      const d = pend.dir;
      if (i - pend.i1 > 16) pend = null;
      else if (d > 0) {
        if (!pend.pulled) { if (b.h > pend.peak && b.c >= b.o) pend.peak = b.h; else if (b.l <= pend.L + atr * .45 || b.c < pend.peak - atr * .8) { pend.pulled = true; pend.ext = b.l; } }
        else { pend.ext = Math.min(pend.ext, b.l); if (b.c < pend.L - atr * 1.2) pend = null; else if (b.c > pend.peak) { sb.push({ i, dir: 1, entry: b.c, stop: pend.ext - atr * .15 }); pend = null; } }
      } else {
        if (!pend.pulled) { if (b.l < pend.peak && b.c <= b.o) pend.peak = b.l; else if (b.h >= pend.L - atr * .45 || b.c > pend.peak + atr * .8) { pend.pulled = true; pend.ext = b.h; } }
        else { pend.ext = Math.max(pend.ext, b.h); if (b.c > pend.L + atr * 1.2) pend = null; else if (b.c < pend.peak) { sb.push({ i, dir: -1, entry: b.c, stop: pend.ext + atr * .15 }); pend = null; } }
      }
    }
    if (lastH && !lastH.end) {
      if (b.c > lastH.p) { lastH.end = 'break'; lastH.to = i; ev.push({ i, dir: 1, p: lastH.p, from: lastH.i, kind: trend < 0 ? '轉折' : '突破' }); trend = 1; pend = { dir: 1, L: lastH.p, i1: i, peak: b.h, pulled: false, ext: b.l }; }
      else if (b.h > lastH.p) { lastH.end = 'sweep'; lastH.to = i; sweeps.push({ i, dir: 1, p: lastH.p, tip: b.h }); }
    }
    if (lastL && !lastL.end) {
      if (b.c < lastL.p) { lastL.end = 'break'; lastL.to = i; ev.push({ i, dir: -1, p: lastL.p, from: lastL.i, kind: trend > 0 ? '轉折' : '突破' }); trend = -1; pend = { dir: -1, L: lastL.p, i1: i, peak: b.l, pulled: false, ext: b.h }; }
      else if (b.l < lastL.p) { lastL.end = 'sweep'; lastL.to = i; sweeps.push({ i, dir: -1, p: lastL.p, tip: b.l }); }
    }
  }
  const hs = piv.filter(v => v.t === 'H' && v.k), ls = piv.filter(v => v.t === 'L' && v.k);
  const lh = hs[hs.length - 1], ll = ls[ls.length - 1];
  let state = 'range';
  if (lh && ll && lh.k === 'HH' && ll.k === 'HL') state = 'up';
  else if (lh && ll && lh.k === 'LH' && ll.k === 'LL') state = 'down';
  const lastEv = ev[ev.length - 1];
  if (lastEv && lastEv.i > B.length - 8) state = lastEv.dir > 0 ? (state === 'down' ? 'turnUp' : 'up') : (state === 'up' ? 'turnDown' : 'down');
  return { piv, lab, ev, sweeps, sb, levels, atr, state };
}
const STATE_TXT = { up: '多頭結構', down: '空頭結構', range: '區間震盪', turnUp: '轉折向上', turnDown: '轉折向下' };
const STATE_COL = { up: UP, down: DN, range: GD, turnUp: UP, turnDown: DN };
const PIV_TXT = { HH: '更高高', LH: '更低高', HL: '更高低', LL: '更低低' };
const stateDir = s => (s === 'up' || s === 'turnUp' ? 1 : s === 'down' || s === 'turnDown' ? -1 : 0);

/* ---------- 繪圖 ---------- */
const FONT = () => getComputedStyle(document.body).fontFamily;
function pill(g, x, y, txt, col, size = 10, solid = false) {
  g.font = `800 ${size}px ${FONT()}`; const w = g.measureText(txt).width + 10, h = size + 7;
  g.fillStyle = solid ? col : 'rgba(4,12,24,.82)'; g.strokeStyle = col; g.lineWidth = 1;
  const rx = x - w / 2, ry = y - h / 2; g.beginPath(); g.roundRect ? g.roundRect(rx, ry, w, h, h / 2) : g.rect(rx, ry, w, h); g.fill(); g.stroke();
  g.fillStyle = solid ? '#03121a' : col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, x, y + .5);
}
function fit(cv) {
  const dpr = Math.min(2, devicePixelRatio || 1), W = cv.clientWidth || 340, H = cv.clientHeight || 220;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); return { g, W, H };
}
// opts: show {st, lq, sb}, slots, upto（只畫前幾根）, lines（演練的三條線）, future（未來區）, scan（掃描線位置 0~1）, trade
function draw(cv, bars, an, o = {}) {
  const { g, W, H } = fit(cv), show = o.show || { st: true, lq: true, sb: true };
  const upto = o.upto == null ? bars.length : o.upto, B = bars.slice(0, upto), slots = o.slots || bars.length;
  const padR = 44, padT = 16, padB = 18, cw = (W - padR - 6) / slots;
  const ext = [...B.map(b => b.h), ...B.map(b => b.l)]; (o.lines ? [o.lines.entry, o.lines.stop, o.lines.target] : []).forEach(v => ext.push(v));
  let hi = Math.max(...ext), lo = Math.min(...ext); const pad = (hi - lo) * .08 + .2; hi += pad; lo -= pad;
  if (o.range) { hi = o.range[0]; lo = o.range[1]; }
  const y = v => padT + (hi - v) / (hi - lo) * (H - padT - padB), x = i => 6 + i * cw + cw / 2;
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#04131c'); bg.addColorStop(1, '#020a12'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(46,255,196,.07)'; g.lineWidth = 1;
  for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(0, k * H / 6); g.lineTo(W - padR, k * H / 6); g.stroke(); }
  for (let k = 1; k < 10; k++) { g.beginPath(); g.moveTo(k * (W - padR) / 10, 0); g.lineTo(k * (W - padR) / 10, H); g.stroke(); }
  g.font = `600 9px ${FONT()}`; g.fillStyle = 'rgba(159,244,255,.45)'; g.textAlign = 'left'; g.textBaseline = 'middle';
  for (let k = 0; k <= 4; k++) { const v = hi - (hi - lo) * (k + .5) / 5; g.fillText(v.toFixed(1), W - padR + 4, y(v)); }
  if (o.future) { const fx = x(o.future) - cw / 2; const fg = g.createLinearGradient(fx, 0, W - padR, 0); fg.addColorStop(0, 'rgba(46,255,196,.10)'); fg.addColorStop(1, 'rgba(46,255,196,.02)'); g.fillStyle = fg; g.fillRect(fx, 0, W - padR - fx, H);
    g.setLineDash([3, 4]); g.strokeStyle = 'rgba(46,255,196,.45)'; g.beginPath(); g.moveTo(fx, 0); g.lineTo(fx, H); g.stroke(); g.setLineDash([]);
    if (upto <= o.future) { g.fillStyle = 'rgba(46,255,196,.55)'; g.font = `800 11px ${FONT()}`; g.textAlign = 'center'; g.fillText('未來走勢・隱藏中', (fx + W - padR) / 2, padT + 6); } }
  // 流動性：前高、前低水平線
  if (show.lq && an) an.levels.filter(L => L.from < upto).slice(-6).forEach(L => {
    const to = L.to != null && L.to < upto ? L.to : upto - 1, col = L.t === 'H' ? 'rgba(255,200,90,' : 'rgba(255,122,224,';
    g.setLineDash([5, 4]); g.strokeStyle = col + (L.end ? '.35)' : '.75)'); g.lineWidth = 1.2; g.beginPath(); g.moveTo(x(L.from), y(L.p)); g.lineTo(x(to) + (L.end ? 0 : cw * 2), y(L.p)); g.stroke(); g.setLineDash([]);
    if (!L.end) { g.fillStyle = col + '.9)'; g.font = `700 9px ${FONT()}`; g.textAlign = 'right'; g.textBaseline = L.t === 'H' ? 'bottom' : 'top'; g.fillText(L.t === 'H' ? '前高流動性' : '前低流動性', W - padR - 2, y(L.p) + (L.t === 'H' ? -2 : 2)); }
  });
  // K 線
  B.forEach((b, i) => {
    const up = b.c >= b.o, col = up ? UP : DN, X = x(i);
    g.strokeStyle = col; g.lineWidth = 1.2; g.beginPath(); g.moveTo(X, y(b.h)); g.lineTo(X, y(b.l)); g.stroke();
    const t = y(Math.max(b.o, b.c)), bt = y(Math.min(b.o, b.c)); g.fillStyle = col;
    if (i === upto - 1) { g.shadowColor = col; g.shadowBlur = 12; }
    g.fillRect(X - cw * .34, t, cw * .68, Math.max(1.5, bt - t)); g.shadowBlur = 0;
  });
  if (an && show.lq) an.sweeps.filter(s => s.i < upto).slice(-4).forEach(s => {
    const X = x(s.i), Y = y(s.tip); g.strokeStyle = MG; g.lineWidth = 1.5; g.beginPath(); g.arc(X, Y, 5, 0, 7); g.stroke();
    pill(g, X, Y + (s.dir > 0 ? -13 : 13), s.dir > 0 ? '掃前高' : '掃前低', MG, 9);
  });
  if (an && show.st) {
    an.piv.filter(v => v.k && v.i < upto - 2).slice(-7).forEach(v => { const up = v.k === 'HH' || v.k === 'HL'; pill(g, x(v.i), y(v.p) + (v.t === 'H' ? -11 : 11), PIV_TXT[v.k], up ? UP : DN, 8.5); });
    an.ev.filter(e => e.i < upto).slice(-3).forEach(e => {
      const col = e.dir > 0 ? UP : DN; g.strokeStyle = col; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x(e.from), y(e.p)); g.lineTo(x(e.i), y(e.p)); g.stroke();
      pill(g, (x(e.from) + x(e.i)) / 2, y(e.p) + (e.dir > 0 ? 9 : -9), e.kind === '轉折' ? (e.dir > 0 ? '轉折向上' : '轉折向下') : '結構突破', col, 8.5, e.kind === '轉折');
    });
  }
  if (an && show.sb) an.sb.filter(s => s.i < upto).slice(-3).forEach(s => {
    const X = x(s.i), b = B[s.i], Y = s.dir > 0 ? y(b.l) + 10 : y(b.h) - 10;
    g.fillStyle = GD; g.shadowColor = GD; g.shadowBlur = 10; g.beginPath();
    if (s.dir > 0) { g.moveTo(X, Y - 6); g.lineTo(X - 5, Y + 3); g.lineTo(X + 5, Y + 3); } else { g.moveTo(X, Y + 6); g.lineTo(X - 5, Y - 3); g.lineTo(X + 5, Y - 3); }
    g.fill(); g.shadowBlur = 0; pill(g, X, Y + (s.dir > 0 ? 14 : -14), '結構延續', GD, 9, true);
  });
  // 演練的進場／停損／目標
  if (o.lines) {
    const Lz = [['target', '目標', TL], ['entry', '進場', GD], ['stop', '停損', '#ff8a4c']];
    Lz.forEach(([k, n, col]) => { const Y = y(o.lines[k]); g.strokeStyle = col; g.lineWidth = o.drag === k ? 2.6 : 1.6; g.setLineDash(k === 'entry' ? [] : [7, 4]); g.beginPath(); g.moveTo(o.lineFrom != null ? x(o.lineFrom) : 0, Y); g.lineTo(W - padR, Y); g.stroke(); g.setLineDash([]);
      g.fillStyle = col; g.beginPath(); g.roundRect ? g.roundRect(W - padR, Y - 9, padR - 2, 18, 5) : g.rect(W - padR, Y - 9, padR - 2, 18); g.fill();
      g.fillStyle = '#04121a'; g.font = `800 9.5px ${FONT()}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(n, W - padR / 2 - 1, Y - .5);
      g.beginPath(); g.fillStyle = col; g.arc(W - padR - 12, Y, o.drag === k ? 7 : 5, 0, 7); g.fill(); });
    if (o.lines.side) { const top = Math.min(y(o.lines.entry), y(o.lines.target)), bot = Math.max(y(o.lines.entry), y(o.lines.target)); const fx = o.lineFrom != null ? x(o.lineFrom) : 0;
      g.fillStyle = 'rgba(46,255,196,.07)'; g.fillRect(fx, top, W - padR - fx, bot - top);
      const t2 = Math.min(y(o.lines.entry), y(o.lines.stop)), b2 = Math.max(y(o.lines.entry), y(o.lines.stop)); g.fillStyle = 'rgba(255,138,76,.08)'; g.fillRect(fx, t2, W - padR - fx, b2 - t2); }
  }
  if (o.trade) {
    const t = o.trade;
    if (t.fill != null && t.fill < upto) { pill(g, x(t.fill), y(t.entry) + (t.side > 0 ? 12 : -12), '成交', GD, 9, true); }
    if (t.exit != null && t.exit < upto) { const col = t.out === 'target' ? TL : t.out === 'stop' ? '#ff8a4c' : CY; g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.arc(x(t.exit), y(t.exitPx), 6, 0, 7); g.stroke(); }
  }
  if (o.scan != null) { const sx = o.scan * (W - padR); const sg = g.createLinearGradient(sx - 40, 0, sx, 0); sg.addColorStop(0, 'rgba(46,255,196,0)'); sg.addColorStop(1, 'rgba(46,255,196,.22)'); g.fillStyle = sg; g.fillRect(sx - 40, 0, 40, H); }
  return { y, x, hi, lo, inv: py => hi - (py - padT) / (H - padT - padB) * (hi - lo), padR, W, H };
}

/* ---------- 共用 ---------- */
const today = () => C.today();
function labState() { // 只在非 GM 時寫入
  const S = C.S; S.games = S.games || {};
  const L = S.games.lab = S.games.lab || { plays: 0, best: 0, total: 0, wins: 0, day: {} };
  if (!L.day || typeof L.day !== 'object') L.day = {};
  Object.keys(L.day).forEach(d => { if (d < addDaysStr(today(), -14)) delete L.day[d]; });
  return L;
}
function addDaysStr(d, n) { const t = new Date(d + 'T00:00:00'); t.setDate(t.getDate() + n); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; }
const earnedToday = () => { const L = ((C.S.games || {}).lab || {}); return ((L.day || {})[today()] || {}).coins | 0; };
const playedToday = () => { const L = ((C.S.games || {}).lab || {}); return ((L.day || {})[today()] || {}).plays | 0; };
export function labTodos(floor) { if (!C || C.isGM()) return {}; return { labdrill: floor === 'f6' && playedToday() === 0 }; }
const disc = '<p class="note lab-disc">模擬練習，非投資建議。K 線由隨機種子產生，不是真實行情；薪水是站內虛擬點數，不能換現金。</p>';
const gmTag = () => (C.isGM() ? '<p class="note lab-gm">GM 預覽：可以完整操作，不記錄成績、也不會發薪水。</p>' : '');
const f2 = v => (Math.round(v * 100) / 100).toFixed(2);

/* ---------- 參數實驗台 ---------- */
const SIM = { seed: newSeed(), p: { ...DEF }, show: { st: true, lq: true, sb: true }, prev: null };
function labsim(el, preset) {
  if (preset) { Object.assign(SIM.p, preset); SIM.seed = newSeed(); }
  el.dataset.lab = 'sim';
  el.innerHTML = `<div class="lab">
    <div class="lab-head"><span class="lab-live"><i></i>模擬引擎運轉中</span><span class="tag cyan" id="labSeed">種子 #${SIM.seed}</span></div>
    <div class="lab-screen"><canvas class="labcv" id="labcv"></canvas><div class="lab-scan"></div></div>
    <div class="lab-chips" role="group" aria-label="圖層">
      <button type="button" class="lab-chip${SIM.show.st ? ' on' : ''}" data-ly="st"><i style="background:${UP}"></i>市場結構</button>
      <button type="button" class="lab-chip${SIM.show.lq ? ' on' : ''}" data-ly="lq"><i style="background:${MG}"></i>流動性</button>
      </div>
    <div class="lab-read" id="labRead"></div>
    <div class="lab-sliders">${PARAMS.map(P => `<label class="lab-sl" data-k="${P.k}"><div class="row between"><span>${P.name}</span><b id="lv_${P.k}"></b></div>
      <input type="range" min="${P.min}" max="${P.max}" step="1" value="${SIM.p[P.k]}" data-p="${P.k}" aria-label="${P.name}"><small id="ld_${P.k}"></small></label>`).join('')}</div>
    <div class="row" style="gap:8px;margin-top:8px"><button class="btn cyan sm" id="labNew" style="flex:1">換一組種子</button><button class="btn ghost sm" id="labPlay" style="flex:1">重播走勢</button><button class="btn ghost sm" id="labReset" style="flex:1">恢復預設</button></div>
    <div class="card lab-explain" id="labExplain"></div>
    <button class="btn primary" id="labToDrill" style="width:100%">用這組參數去實戰演練</button>
    ${gmTag()}${disc}</div>`;
  const cv = el.querySelector('#labcv');
  let bars = gen(SIM.seed, SIM.p), an = analyze(bars), anim = null;
  const render = (upto, scan) => draw(cv, bars, an, { show: SIM.show, upto, scan });
  const morph = (from, to) => { // 參數改變時，K 線從舊形狀平滑變到新形狀
    cancelAnimationFrame(anim); const t0 = performance.now();
    const step = now => { const k = Math.min(1, (now - t0) / 320), e = 1 - Math.pow(1 - k, 3);
      const mix = to.map((b, i) => { const a = from[i] || b; return { o: a.o + (b.o - a.o) * e, h: a.h + (b.h - a.h) * e, l: a.l + (b.l - a.l) * e, c: a.c + (b.c - a.c) * e }; });
      draw(cv, mix, k < 1 ? null : an, { show: SIM.show }); if (k < 1) anim = requestAnimationFrame(step); };
    anim = requestAnimationFrame(step);
  };
  const replay = () => { cancelAnimationFrame(anim); let i = 8; const tick = () => { if (!cv.isConnected) return; render(i, i / bars.length); i++; if (i <= bars.length) anim = setTimeout(() => requestAnimationFrame(tick), 34); else render(); }; tick(); };
  const readout = () => {
    const s = an.state, last = bars[bars.length - 1];
    el.querySelector('#labRead').innerHTML = `
      <div class="lr"><small>結構狀態</small><b style="color:${STATE_COL[s]}">${STATE_TXT[s]}</b></div>
      <div class="lr"><small>高低點</small><b><span style="color:${UP}">高高 ${an.lab.HH}・高低 ${an.lab.HL}</span><br><span style="color:${DN}">低高 ${an.lab.LH}・低低 ${an.lab.LL}</span></b></div>
      <div class="lr"><small>流動性掃單</small><b style="color:${MG}">${an.sweeps.length} 次</b></div>
      <div class="lr"><small>結構突破／轉折</small><b>${an.ev.filter(e => e.kind === '突破').length}／${an.ev.filter(e => e.kind === '轉折').length}</b></div>
      <div class="lr"><small>平均波幅</small><b style="color:${TL}">${f2(an.atr)} 點</b></div>`;
    PARAMS.forEach(P => { const v = SIM.p[P.k]; el.querySelector('#lv_' + P.k).textContent = P.k === 'trend' && v > 0 ? '+' + v : v; el.querySelector('#ld_' + P.k).textContent = P.desc(v);
      const inp = el.querySelector(`[data-p=${P.k}]`); inp.style.setProperty('--pct', ((v - P.min) / (P.max - P.min) * 100) + '%'); });
    const tips = [];
    if (s === 'up' || s === 'turnUp') tips.push('目前高點、低點一路墊高，是<b style="color:var(--up)">多頭結構</b>；只要沒跌破最近的「更高低」，結構就還在。');
    else if (s === 'down' || s === 'turnDown') tips.push('目前高點、低點一路下移，是<b style="color:var(--down)">空頭結構</b>；站回最近的「更低高」之前，結構不算改變。');
    else tips.push('高低點沒有一致方向，屬於<b style="color:var(--gold)">區間震盪</b>；區間上下緣常是流動性堆積的地方。');
    if (an.sweeps.length) tips.push(`這段走勢有 ${an.sweeps.length} 次<b style="color:${MG}">刺破前高／前低又收回</b>，是典型的掃流動性，重點看收盤站不站得住。`);
    el.querySelector('#labExplain').innerHTML = `<b class="lab-et">實驗室解讀</b><p>${tips.join('</p><p>')}</p>`;
  };
  const rebuild = (smooth = true) => { const old = bars; bars = gen(SIM.seed, SIM.p); an = analyze(bars); el.querySelector('#labSeed').textContent = `種子 #${SIM.seed}`; readout(); smooth ? morph(old, bars) : render(); };
  requestAnimationFrame(() => { readout(); replay(); });
  el.querySelectorAll('[data-p]').forEach(inp => inp.oninput = () => { SIM.p[inp.dataset.p] = +inp.value; rebuild(true); });
  el.querySelectorAll('[data-ly]').forEach(b => b.onclick = () => { const k = b.dataset.ly; SIM.show[k] = !SIM.show[k]; b.classList.toggle('on', SIM.show[k]); render(); C.blip(880); });
  el.querySelector('#labNew').onclick = () => { SIM.seed = newSeed(); rebuild(true); C.blip(990); };
  el.querySelector('#labPlay').onclick = () => replay();
  el.querySelector('#labReset').onclick = () => { SIM.p = { ...DEF }; el.querySelectorAll('[data-p]').forEach(i => i.value = SIM.p[i.dataset.p]); rebuild(true); };
  el.querySelector('#labToDrill').onclick = () => C.open('labdrill', { p: { ...SIM.p } });
}

/* ---------- 實戰演練 ---------- */
const SHOWN = 42, FUT = 30;
let DR = null;
function newDrill(p) {
  const r = Math.random;
  const pp = p || { vol: 3 + Math.floor(r() * 5), trend: (r() < .5 ? -1 : 1) * (2 + Math.floor(r() * 7)), depth: 3 + Math.floor(r() * 5), sweep: 3 + Math.floor(r() * 6) };
  const seed = newSeed(), bars = gen(seed, pp, SHOWN + FUT), an0 = analyze(bars, SHOWN), last = bars[SHOWN - 1].c, side = stateDir(an0.state) || 1, a = an0.atr;
  DR = { seed, p: pp, bars, an0, side, phase: 'plan', lines: { entry: last, stop: last - side * a * 1.5, target: last + side * a * 3, side }, upto: SHOWN, res: null };
}
function rr(L) { const risk = Math.abs(L.entry - L.stop), rew = Math.abs(L.target - L.entry); return risk > 0 ? rew / risk : 0; }
function valid(L) { return L.side > 0 ? L.stop < L.entry && L.entry < L.target : L.target < L.entry && L.entry < L.stop; }
function simulate(D) {
  const { bars, lines: L } = D, s = L.side, last = bars[SHOWN - 1].c, near = Math.abs(L.entry - last) <= D.an0.atr * .05;
  let fill = null, exit = null, out = null, exitPx = null;
  for (let i = SHOWN; i < bars.length; i++) {
    const b = bars[i];
    if (fill == null) {
      if (near || (b.l <= L.entry && b.h >= L.entry)) { fill = i; if (near) L.entry = b.o; }
      else if ((s > 0 && L.entry > last && b.o > L.entry) || (s < 0 && L.entry < last && b.o < L.entry)) { fill = i; } // 跳空越過進場價：以開盤成交
      else continue;
      const hitStop = s > 0 ? b.l <= L.stop : b.h >= L.stop; if (hitStop) { exit = i; out = 'stop'; exitPx = L.stop; break; }
      continue;
    }
    const hs = s > 0 ? b.l <= L.stop : b.h >= L.stop, ht = s > 0 ? b.h >= L.target : b.l <= L.target;
    if (hs) { exit = i; out = 'stop'; exitPx = L.stop; break; } // 同一根同時碰到，保守算停損
    if (ht) { exit = i; out = 'target'; exitPx = L.target; break; }
  }
  if (fill == null) out = 'nofill';
  else if (exit == null) { exit = bars.length - 1; out = 'time'; exitPx = bars[exit].c; }
  const risk = Math.abs(L.entry - L.stop), pnl = fill == null ? 0 : (exitPx - L.entry) * s;
  return { fill, exit, out, exitPx, entry: L.entry, side: s, R: risk ? pnl / risk : 0, pnl };
}
export function scoreTrade(D, res) {
  const L = D.lines, a = D.an0.atr, R = rr(L), dist = Math.abs(L.entry - L.stop) / a, sd = stateDir(D.an0.state);
  const items = [];
  const rrS = R >= 2 ? 25 : R >= 1.5 ? 18 : R >= 1 ? 10 : 3;
  items.push({ n: '風報比', v: rrS, max: 25, t: `目標是停損的 ${R.toFixed(1)} 倍${R >= 2 ? '，賺賠比漂亮' : R >= 1 ? '，還可以再拉高一點' : '，賺得比賠得少，要小心'}` });
  const dS = dist >= .6 && dist <= 3 ? 20 : (dist >= .3 && dist < .6) || (dist > 3 && dist <= 5) ? 10 : 3;
  items.push({ n: '停損位置', v: dS, max: 20, t: dist < .6 ? '停損太近，正常波動就可能被掃掉' : dist > 3 ? '停損太遠，一次虧損會很大' : '停損距離合理，留了正常波動的空間' });
  const recentSb = D.an0.sb.some(s => s.dir === L.side && s.i >= SHOWN - 7);
  let tS = sd === L.side ? 20 : sd === 0 ? 10 : 3; if (recentSb) tS = Math.min(25, tS + 5);
  items.push({ n: '順著結構', v: tS, max: 25, t: (sd === L.side ? `順著${STATE_TXT[D.an0.state]}方向` : sd === 0 ? '區間震盪中，方向優勢較小' : `逆著${STATE_TXT[D.an0.state]}做`) + (recentSb ? '，而且剛出現二次突破訊號' : '') });
  const oS = res.out === 'target' ? 30 : res.out === 'time' ? (res.pnl > 0 ? 18 : 8) : res.out === 'nofill' ? 10 : 8;
  items.push({ n: '結果', v: oS, max: 30, t: res.out === 'target' ? `碰到目標，賺 ${res.R.toFixed(1)} 倍停損距離` : res.out === 'stop' ? '碰到停損，照計畫出場，賠 1 倍停損距離是事先算好的成本' : res.out === 'nofill' ? '價格沒到進場價，沒有成交，沒賺也沒賠' : `時間到以最後一根收盤出場，${res.R >= 0 ? '賺' : '賠'} ${Math.abs(res.R).toFixed(1)} 倍停損距離` });
  const score = Math.max(0, Math.min(100, items.reduce((s, i) => s + i.v, 0)));
  const grade = score >= 90 ? 'S' : score >= 75 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D';
  const gname = { S: '特優', A: '優秀', B: '良好', C: '及格', D: '再練' }[grade];
  return { score, grade, gname, items };
}
function labdrill(el, opt) {
  const seed = (Math.random() * 1e9) | 0;
  const bars = gen(seed);
  const cut = Math.max(24, bars.length - 16);
  const seen = bars.slice(0, cut);
  const rest = bars.slice(cut);
  const up = rest[rest.length - 1].c >= seen[seen.length - 1].c;
  let answered = false;
  const cvId = 'drCv';
  el.innerHTML = `<div class="row between"><b>結構觀察</b><span class="tag">只看結構，不練習進出場</span></div>
    <p class="note" style="margin:8px 0 0">看左邊這段走勢，判斷後面比較可能偏多還是偏空，再按播放對答案。這是看結構的練習，不設進場、停損或目標。</p>
    <canvas id="${cvId}" class="lab-cv" width="640" height="300" style="width:100%;margin-top:10px"></canvas>
    <div class="row" style="gap:8px;margin-top:10px">
      <button type="button" class="btn up" style="flex:1" data-side="1">偏多</button>
      <button type="button" class="btn down" style="flex:1" data-side="-1">偏空</button>
    </div>
    <div id="drRes"></div>
    ${disc}`;
  const cv = el.querySelector('#' + cvId);
  const an = analyze(seen, seen.length);
  draw(cv, seen, an, {});
  el.querySelectorAll('[data-side]').forEach(b => b.onclick = () => {
    if (answered) return; answered = true;
    el.querySelectorAll('[data-side]').forEach(x => x.disabled = true);
    const pickUp = b.dataset.side === '1';
    const ok = pickUp === up;
    const score = ok ? 100 : 40;
    draw(cv, bars, analyze(bars, bars.length), {});
    const coins = C.isGM() ? 0 : Math.min(20, Math.max(0, Math.floor(score / 5)));
    if (!C.isGM()) {
      const L = labState(), d = L.day[today()] || (L.day[today()] = { plays: 0, coins: 0, best: 0 });
      const room = Math.max(0, LAB_REWARD.dayCap - (d.coins | 0));
      const pay = Math.min(coins, room);
      d.plays++; d.coins = (d.coins | 0) + pay; d.best = Math.max(d.best | 0, score);
      L.plays++; L.total += score; L.best = Math.max(L.best | 0, score); if (ok) L.wins++;
      C.questLog('labPlays', 1, 'add'); C.questLog('labBest', score);
      if (pay) C.addXP(1, pay);
      C.save();
    }
    el.querySelector('#drRes').innerHTML = `<div class="card"><b>${ok ? '方向看對了' : '這段走勢跟判斷不一樣'}</b>　本局 ${score} 分
      <p class="note" style="margin:6px 0 0">後面實際收在「${up ? '偏多' : '偏空'}」。練的是把結構看清楚，不是預測或進出場。${C.isGM() ? 'GM 預覽不發薪水。' : ''}</p></div>
      <button type="button" class="btn primary" id="drAgain" style="width:100%;margin-top:8px">再觀察一局</button>`;
    el.querySelector('#drAgain').onclick = () => labdrill(el);
    C.toast(C.isGM() ? `GM 預覽：本局 ${score} 分（不發薪水）` : `結構觀察 ${score} 分`);
  });
}

function pathBars(pts, seed = 7) {
  const r = rng(seed), out = []; let p = pts[0][1];
  for (let k = 1; k < pts.length; k++) { const [n, to] = pts[k], st = (to - p) / n; for (let i = 0; i < n; i++) { const o = p, c = p + st + (r() - .5) * .25; out.push({ o, c, h: Math.max(o, c) + r() * .25, l: Math.min(o, c) - r() * .25 }); p = c; } }
  return out;
}
const CONCEPTS = [
  { id: 'st', name: '市場結構', col: UP, pts: [[0, 100], [4, 103], [3, 101.5], [4, 105], [3, 103.2], [4, 107], [3, 105], [4, 102]], show: { st: true }, preset: { trend: 7, depth: 4, sweep: 2, vol: 4 },
    txt: '高點一個比一個高、低點也一個比一個高，就是<b style="color:var(--up)">多頭結構</b>（更高高、更高低）。一旦收盤跌破最近的「更高低」，結構就可能<b>轉折</b>。空頭結構反過來看。' },
  { id: 'lq', name: '流動性', col: MG, pts: [[0, 100], [4, 104], [3, 101.5], [3, 104], [3, 101.6], [2, 104.6], [1, 103.5], [4, 100.4], [2, 101]], show: { lq: true }, preset: { trend: 0, depth: 6, sweep: 9, vol: 5 },
    txt: '前高、前低附近常堆著成交，也就是<b style="color:#ff7ae0">流動性</b>。價格常先刺破前高或前低再拉回；重點是<b>收盤站不站得住</b>，刺破又收回往往只是路過，不是結構真的轉了。' },
];
function labwiki(el) {
  el.dataset.lab = 'wiki';
  el.innerHTML = `<div class="lab"><p class="note" style="margin:0">交易實驗室的三個核心觀念。圖是示意走勢，看懂之後到參數實驗台自己調參數驗證。</p>
    ${CONCEPTS.map((c, i) => `<div class="card lab-concept" style="--cc:${c.col}"><div class="row between"><b><span class="lab-n">${i + 1}</span>${c.name}</b><button class="btn ghost sm" data-try="${c.id}">去實驗台試試</button></div>
      <canvas class="labcv mini" data-cv="${c.id}"></canvas><p>${c.txt}</p></div>`).join('')}
    ${gmTag()}${disc}</div>`;
  CONCEPTS.forEach(c => {
    const cv = el.querySelector(`[data-cv=${c.id}]`), bars = pathBars(c.pts), an = analyze(bars); let i = 4;
    const step = () => { if (!cv.isConnected) return; draw(cv, bars, an, { show: c.show, upto: i, slots: bars.length + 2 }); i++; if (i <= bars.length) setTimeout(() => requestAnimationFrame(step), 70); else setTimeout(() => { i = 4; cv.isConnected && step(); }, 2600); };
    requestAnimationFrame(step);
  });
  el.querySelectorAll('[data-try]').forEach(b => b.onclick = () => C.open('labsim', { preset: CONCEPTS.find(c => c.id === b.dataset.try).preset }));
}

export const LAB_RENDER = {
  labsim(el, opt) { labsim(el, opt && opt.preset); },
  labdrill(el, opt) { labdrill(el, opt); },
  labwiki(el) { labwiki(el); },
};
