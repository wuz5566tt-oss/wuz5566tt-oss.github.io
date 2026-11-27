// UI BOT ui-kit 加件接線（assets/ui-kit/ 只讀不改）：載入 HTML 片段、工位牆、工作證／薪資單分享圖。
// 聯絡方式：追蹤 IG 改為加入 LINE（ID wuzakakak）。不改 ui-kit 原檔，載入時改寫連結與封面。
import { drawIdCard as drawIdCardRaw, drawPayslip as drawPayslipRaw } from './ui-kit/js/share-draw.js';
export const LINE_ID = 'wuzakakak';
export const LINE_ADD = 'https://line.me/ti/p/~wuzakakak'; // 個人 LINE ID 加好友（~ 開頭）；不是官方帳號
// 來源：/workspace/teach-1115/raw/Wuta_20261112_155742_713_153.jpg（2026-11-12 上課中）→ 480×480 data URI 模組 assets/img/leo-headshot.js
// 動態載入；載入失敗就用內建的金色頭像剪影，不會出現破圖
const LEO_FALLBACK = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="#0d1022"/><circle cx="48" cy="38" r="17" fill="#ffd66b"/><path d="M14 94c4-24 20-32 34-32s30 8 34 32z" fill="#d4a84b"/></svg>');
export const LEO_HEAD = await import('./img/leo-headshot.js').then(m => m.default || LEO_FALLBACK, () => LEO_FALLBACK);
const headImg = new Image(); headImg.src = LEO_HEAD;

export function lineAddBtn(cls = 'btn primary sm', label = '加入 LINE') {
  return `<a class="${cls}" href="${LINE_ADD}" target="_blank" rel="noopener">${label}</a>`;
}
export function lineCtaHTML(msg = '想更深入？加入 LINE') {
  return `<div class="nm-line card row between cta"><img class="nm-line__av" src="${LEO_HEAD}" width="72" height="72" alt="董事長 LEO易凡 上課中">
    <div class="nm-line__txt"><b>${msg}</b><div class="note">LINE ID ${LINE_ID}　董事長 LEO易凡</div></div>
    ${lineAddBtn()}</div>`;
}

function rewriteContact(t) {
  return t
    .replace(/https:\/\/(?:www\.)?instagram\.com\/wuz200200/g, LINE_ADD)
    .replace(/https:\/\/(?:www\.)?threads\.net\/@wuz200200/g, LINE_ADD)
    .replace(/@wuz200200/g, 'LINE ' + LINE_ID)
    .replace(/IG 限動／Threads 引言/g, '加入 LINE')
    .replace(/限動封面/g, '董事長上課')
    .replace(/Threads 引言/g, '加入 LINE')
    .replace(/連結至 LINE wuzakakak。封面尚未提供，先用標示清楚的佔位框。/g, '點大頭即可加入 LINE。')
    .replace(/私訊『成長』領交易觀察模型/g, '加入 LINE ' + LINE_ID)
    .replace(/(src|href)="\/assets\/ui-kit\//g, '$1="assets/ui-kit/')
    .replace(/src="(?:\/)?assets\/ui-kit\/img\/(?:reels-cover|threads-quote)[^"]+"/g, () => `src="${LEO_HEAD}"`)
    .replace(/alt="封面待提供"/g, 'alt="董事長 LEO易凡 上課中"')
    .replace(/封面待提供/g, '董事長 LEO易凡 上課中')
    .replace(/aria-label="[^"]*"/g, (m) => m.replace(/Instagram|Threads|限動封面/g, '加入 LINE'));
}

const cache = {};
export async function snippet(name) {
  if (!cache[name]) cache[name] = fetch(`assets/ui-kit/snippets/${name}.html`).then(r => (r.ok ? r.text() : '')).then(t => rewriteContact(t.replace(/<!--[\s\S]*?-->/g, ''))).catch(() => '');
  return cache[name];
}
export function mountSnippet(el, name, where = 'beforeend') {
  const id = 'uk_' + name + '_' + Math.random().toString(36).slice(2, 7);
  el.insertAdjacentHTML(where, `<div class="uk-slot" id="${id}" data-uk-slot="${name}"></div>`);
  snippet(name).then(html => { const s = document.getElementById(id); if (s && html) s.innerHTML = html; });
}
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function deskWallHTML({ title, lit }) {
  const n = 8, on = Math.min(n, lit | 0);
  return `<section class="uk-root uk-deskwall" data-uk="desk-wall" aria-label="工位牆知識卡">
    <div class="uk-deskwall__title"><b>${esc(title || '實習牛馬')}</b><span>已收藏 ${lit | 0} 張</span></div>
    ${Array.from({ length: n }, (_, i) => `<div class="uk-deskwall__slot${i < on ? ' is-on' : ''}"${i < on ? ' title="已收藏"' : ''}></div>`).join('')}</section>`;
}

function paintLineFooter(g, bg) {
  g.save();
  g.fillStyle = bg;
  g.fillRect(160, 1488, 760, 220);
  const cx = 300, cy = 1608, r = 56;
  if (headImg.complete && headImg.naturalWidth) {
    g.save(); g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.clip();
    g.drawImage(headImg, cx - r, cy - r, r * 2, r * 2); g.restore();
  }
  g.strokeStyle = '#ffc85a'; g.lineWidth = 5; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.fillStyle = '#3ef2ff'; g.font = '700 36px "Clash Display","Noto Sans CJK TC","Noto Sans TC",sans-serif';
  g.fillText('加入 LINE', 390, 1594);
  g.fillStyle = '#ffd66b'; g.font = '700 34px "Clash Display","Noto Sans CJK TC","Noto Sans TC",sans-serif';
  g.fillText(LINE_ID, 390, 1648);
  g.restore();
}
export function drawIdCard(cv, st = {}) {
  drawIdCardRaw(cv, st);
  paintLineFooter(cv.getContext('2d'), '#0c0a07');
}
export function drawPayslip(cv, st = {}) {
  drawPayslipRaw(cv, st);
  paintLineFooter(cv.getContext('2d'), '#070b14');
}
export function paintAll(root, st) {
  root.querySelectorAll('canvas[data-share=id]').forEach(cv => drawIdCard(cv, st));
  root.querySelectorAll('canvas[data-share=payslip]').forEach(cv => drawPayslip(cv, st));
}
