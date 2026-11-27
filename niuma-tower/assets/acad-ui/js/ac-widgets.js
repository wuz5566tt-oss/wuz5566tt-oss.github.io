// 可單獨使用的小元件：複利計算機、分享成績圖。components.html 與主畫面共用。
import { compound } from '../../academy-logic.js'; // 移植：原本取自 UI BOT 的 ac-store.js
import { reduced } from './ac-fx.js';
const fmt = n => Math.round(n).toLocaleString('zh-TW');

export function calcPanel() {
  return `<div class="ac-panel ac-calc" id="acCalc">
    <div><p class="ac-kicker">複利計算機</p><h3 class="ac-h2" style="font-size:1.1rem">自己算算看</h3><p class="ac-sub">只用你輸入的數字計算，不代表任何商品的報酬。</p>
      <label class="ac-field"><span>本金（元）</span><input class="ac-input" id="acP" inputmode="decimal" placeholder="輸入金額"></label>
      <label class="ac-field"><span>年數（1–60）</span><input class="ac-input" id="acN" inputmode="numeric" placeholder="輸入年數"></label>
      <label class="ac-field"><span>年報酬率（%）</span><input class="ac-input" id="acR" inputmode="decimal" placeholder="輸入百分比"></label>
      <button class="ac-btn" id="acCalcGo" style="width:100%">畫出曲線</button><p class="ac-err" id="acErr"></p></div>
    <div id="acCalcOut"><div class="ac-calc__empty">輸入三個數字後，這裡會畫出你的複利曲線</div></div>
    <p class="ac-na" style="grid-column:1/-1;margin:0">公式：本金 ×（1＋年報酬率）^年數。僅供學習，非投資建議。</p></div>`;
}

export function renderCalcResult(outEl, P, N, R, animate = true) {
  const out = compound(P, N, R);
  const W = 600, H = 220, pad = 34, max = Math.max(...out.pts, P), min = Math.min(...out.pts, P, 0);
  const x = i => pad + (i / N) * (W - pad - 10), y = v => H - 24 - ((v - min) / (max - min || 1)) * (H - 44);
  const line = out.pts.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(N)},${y(min)} L${x(0)},${y(min)} Z`;
  outEl.innerHTML = `
    <div class="ac-calc__out"><div><small>${N} 年後</small><b id="acFinal" data-value="${Math.round(out.final)}">${fmt(out.final)} 元</b></div><div><small>多出來的部分</small><b id="acGain" data-value="${Math.round(out.gain)}" style="color:${out.gain >= 0 ? '#7cffb2' : '#ff8a9a'}">${out.gain >= 0 ? '+' : ''}${fmt(out.gain)} 元</b></div></div>
    <svg class="ac-calc__chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="複利曲線">
      <defs><linearGradient id="acArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22d3ee" stop-opacity=".35"/><stop offset="1" stop-color="#a78bfa" stop-opacity="0"/></linearGradient></defs>
      <line x1="${pad}" x2="${W - 10}" y1="${y(P)}" y2="${y(P)}" stroke="rgba(255,214,107,.6)" stroke-dasharray="6 6"/>
      <text x="${pad + 4}" y="${y(P) - 6}" fill="#ffd66b" font-size="12">本金</text>
      <path d="${area}" fill="url(#acArea)"/>
      <path d="${line}" fill="none" stroke="#22d3ee" stroke-width="3" style="filter:drop-shadow(0 0 6px #22d3ee)${animate && !reduced ? `;stroke-dasharray:2000;stroke-dashoffset:2000;animation:ac-draw 1.2s cubic-bezier(.23,1,.32,1) forwards` : ''}"/>
      <circle cx="${x(N)}" cy="${y(out.final)}" r="5" fill="#fff" style="filter:drop-shadow(0 0 8px #a78bfa)"/>
      <text x="${pad}" y="${H - 6}" fill="#8fa3c4" font-size="12">第 0 年</text><text x="${W - 10}" y="${H - 6}" fill="#8fa3c4" font-size="12" text-anchor="end">第 ${N} 年</text>
    </svg>`;
}

export function drawShare(cv, d) {
  const x = cv.getContext('2d'), W = 1080, H = 1920, t = d, bs = d.badges;
  let g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0a0f24'); g.addColorStop(1, '#04060c'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  for (const [cx, cy, r, c] of [[880, 260, 520, 'rgba(124,92,255,.35)'], [120, 1500, 560, 'rgba(34,211,238,.22)']]) { g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, c); g.addColorStop(1, 'transparent'); x.fillStyle = g; x.fillRect(0, 0, W, H); }
  x.strokeStyle = 'rgba(34,211,238,.12)'; x.lineWidth = 2;
  for (let i = -10; i <= 10; i++) { x.beginPath(); x.moveTo(540 + i * 30, 1350); x.lineTo(540 + i * 260, H); x.stroke(); }
  for (let j = 0; j < 9; j++) { const y = 1350 + Math.pow(j / 8, 2) * 570; x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
  x.strokeStyle = 'rgba(255,214,107,.7)'; x.lineWidth = 4; x.strokeRect(40, 40, W - 80, H - 80);
  x.textAlign = 'center'; x.fillStyle = '#ffd66b'; x.font = '700 44px "AC Clash","Noto Sans CJK TC",sans-serif'; x.fillText('STAR 史塔財商學院', 540, 200);
  x.fillStyle = '#9ff3ff'; x.font = '600 30px "AC Clash",sans-serif'; x.fillText('牛馬學院展覽館・學習成績', 540, 258);
  const R = 230, cx = 540, cy = 640, p = t.total ? t.got / t.total : 0;
  x.lineWidth = 34; x.strokeStyle = 'rgba(255,255,255,.08)'; x.beginPath(); x.arc(cx, cy, R, 0, 7); x.stroke();
  g = x.createLinearGradient(cx - R, cy, cx + R, cy); g.addColorStop(0, '#22d3ee'); g.addColorStop(.6, '#a78bfa'); g.addColorStop(1, '#ffd66b');
  x.strokeStyle = g; x.lineCap = 'round'; x.shadowColor = '#22d3ee'; x.shadowBlur = 30; x.beginPath(); x.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(p, .002)); x.stroke(); x.shadowBlur = 0;
  x.fillStyle = '#fff'; x.font = '700 150px "AC Clash",sans-serif'; x.fillText(String(t.got), cx, cy + 30);
  x.fillStyle = '#8fa3c4'; x.font = '600 40px "AC Clash","Noto Sans CJK TC",sans-serif'; x.fillText(`/ ${t.total} 張知識卡`, cx, cy + 100);
  const box = (y, label, val, col) => {
    x.fillStyle = 'rgba(255,255,255,.05)'; x.strokeStyle = 'rgba(120,220,255,.3)'; x.lineWidth = 2;
    x.beginPath(); x.roundRect(140, y, 800, 150, 28); x.fill(); x.stroke();
    x.textAlign = 'left'; x.fillStyle = '#8fa3c4'; x.font = '500 34px "Noto Sans CJK TC",sans-serif'; x.fillText(label, 190, y + 90);
    x.textAlign = 'right'; x.fillStyle = col; x.font = '700 60px "AC Clash","Noto Sans CJK TC",sans-serif'; x.fillText(val, 890, y + 98); x.textAlign = 'center';
  };
  box(1000, '稱號', d.title, '#c9b8ff'); box(1180, '連續打卡', `${d.streak} 天`, '#9ff3ff'); box(1360, '獲得徽章', `${bs} 枚`, '#ffd66b');
  x.fillStyle = '#fff'; x.font = '700 46px "Noto Sans CJK TC",sans-serif'; x.fillText('一起來收集知識卡', 540, 1640);
  x.fillStyle = '#ffd66b'; x.font = '600 34px "Noto Sans CJK TC",sans-serif'; x.fillText('留言「成長」找 STAR 史塔財商學院', 540, 1700);
  x.fillStyle = '#5d6f90'; x.font = '400 26px "Noto Sans CJK TC",sans-serif'; x.fillText('僅供學習，非投資建議', 540, 1800);
}
