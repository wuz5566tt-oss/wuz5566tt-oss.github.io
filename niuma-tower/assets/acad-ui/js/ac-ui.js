// 畫面模板：只產生 HTML 字串，不存狀態。components.html 與主畫面共用。
import { GLOSSARY } from './ac-glossary.js';

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const RAR = { r: '精良', sr: '稀有', ssr: '傳說', ur: '學院限定' };
export const NOT_ADVICE = '非投資建議';

// ---- 圖示（線條風，stroke 跟著稀有度顏色） ----
const P = {
  compound: '<path d="M6 40c10 0 16-4 22-12s10-18 16-22"/><path d="M38 6h6v6"/><path d="M6 44h38" opacity=".4"/>',
  basket: '<path d="M8 20h34l-4 22H12z"/><path d="M16 20l6-12M34 20l-6-12"/><path d="M18 28v8M25 28v8M32 28v8"/>',
  yield: '<circle cx="25" cy="25" r="17"/><path d="M18 32l14-14"/><circle cx="19" cy="19" r="2.5"/><circle cx="31" cy="31" r="2.5"/>',
  div: '<circle cx="18" cy="30" r="10"/><path d="M28 30h16M36 22l8 8-8 8"/><path d="M18 24v12"/>',
  calendar: '<rect x="8" y="10" width="34" height="32" rx="4"/><path d="M8 19h34M17 6v8M33 6v8"/><path d="M16 27h4M24 27h4M32 27h4M16 34h4M24 34h4"/>',
  scale: '<path d="M25 8v34M14 42h22M10 16h30"/><path d="M10 16l-5 12h10zM40 16l-5 12h10z"/>',
  receipt: '<path d="M12 6h26v38l-4-3-4 3-4-3-4 3-4-3-6 3z"/><path d="M18 16h14M18 23h14M18 30h8"/>',
  pie: '<circle cx="25" cy="25" r="17"/><path d="M25 8v17h17"/><path d="M25 25L13 37"/>',
  drop: '<path d="M25 6c8 11 13 18 13 24a13 13 0 0 1-26 0c0-6 5-13 13-24z"/><path d="M19 31a6 6 0 0 0 6 6"/>',
  kline: '<path d="M14 6v38M25 10v30M36 4v36"/><rect x="10" y="14" width="8" height="18" rx="1"/><rect x="21" y="18" width="8" height="12" rx="1"/><rect x="32" y="10" width="8" height="20" rx="1"/>',
  sr: '<path d="M4 12h42M4 38h42" stroke-dasharray="4 3"/><path d="M6 30l8-14 8 18 8-20 8 16 6-10"/>',
  ma: '<path d="M4 34c8-2 10-14 18-14s10 10 18 6 6-12 6-12"/><path d="M4 26l6 4 6-10 6 8 6-6 6 12 6-14 6 6" opacity=".45"/>',
  volume: '<path d="M8 42V30M16 42V22M24 42V28M32 42V14M40 42V24"/><path d="M4 44h42" opacity=".4"/>',
  trend: '<path d="M6 40L44 12"/><path d="M8 34l6-8 6 4 8-12 6 4 8-12"/><circle cx="14" cy="34" r="2"/><circle cx="28" cy="26" r="2"/>',
  stairs: '<path d="M6 42h10v-8h10v-8h10v-8h8"/><path d="M6 32l10-6 10 2 10-10 8 2"/>',
  gap: '<rect x="10" y="26" width="8" height="14" rx="1"/><rect x="30" y="8" width="8" height="12" rx="1"/><path d="M14 22v22M34 4v20"/><path d="M18 24h12" stroke-dasharray="2 3"/>',
  cross: '<path d="M4 38C16 34 24 20 46 12"/><path d="M4 16c14 4 22 14 42 18" opacity=".5"/><circle cx="25" cy="24" r="4"/>',
  shield: '<path d="M25 5l16 6v12c0 11-7 18-16 22-9-4-16-11-16-22V11z"/><path d="M18 25l5 5 10-11"/>',
  broken: '<path d="M10 8h30v34H10z"/><path d="M10 22l10 4-6 6 12 4-4 6"/><path d="M28 16l12 6"/>',
  crown: '<path d="M8 36l-2-22 11 9 8-14 8 14 11-9-2 22z"/><path d="M8 42h34"/>',
  swap: '<path d="M10 18h28l-6-6M40 32H12l6 6"/>',
  coin: '<ellipse cx="25" cy="14" rx="15" ry="6"/><path d="M10 14v10c0 3 7 6 15 6s15-3 15-6V14"/><path d="M10 24v10c0 3 7 6 15 6s15-3 15-6V24"/>',
  star4: '<path d="M25 4l5 16 16 5-16 5-5 16-5-16-16-5 16-5z"/>',
  eye: '<path d="M4 25s8-14 21-14 21 14 21 14-8 14-21 14S4 25 4 25z"/><circle cx="25" cy="25" r="6"/>',
  weight: '<path d="M14 18h22l6 26H8z"/><circle cx="25" cy="11" r="5"/>',
  limit: '<path d="M6 8h38" stroke-dasharray="3 3"/><path d="M6 42l10-12 8 6 10-20 4 4"/><path d="M38 8v8"/>',
  margin: '<rect x="6" y="14" width="26" height="20" rx="3"/><path d="M32 24h12M38 18l6 6-6 6"/><path d="M14 24h10"/>',
  inst: '<path d="M6 18L25 6l19 12"/><path d="M10 20v18M20 20v18M30 20v18M40 20v18M6 42h38"/>',
  clock: '<circle cx="25" cy="25" r="18"/><path d="M25 13v12l8 6"/>',
  globe: '<circle cx="25" cy="25" r="18"/><path d="M7 25h36M25 7c6 6 6 30 0 36M25 7c-6 6-6 30 0 36"/>',
  gauge: '<path d="M7 36a18 18 0 1 1 36 0"/><path d="M25 36l10-12"/><circle cx="25" cy="36" r="3"/>',
  thermo: '<path d="M21 8a4 4 0 0 1 8 0v20a9 9 0 1 1-8 0z"/><path d="M25 18v16"/>',
  flow: '<path d="M6 16h30l-6-6M44 34H14l6 6"/><circle cx="40" cy="16" r="3"/><circle cx="10" cy="34" r="3"/>',
  flame: '<path d="M25 44c-9 0-14-6-14-13 0-9 9-12 9-22 6 4 8 9 8 13 3-2 4-5 4-8 5 5 7 11 7 17 0 7-5 13-14 13z"/>',
  star: '<path d="M25 4l6 13 14 2-10 10 2 14-12-7-12 7 2-14L5 19l14-2z"/>',
};
export const icon = (k, cls = 'ac-ico') => `<svg class="${cls}" viewBox="0 0 50 50" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[k] || P.star}</svg>`;

// ---- 小辭典：每個名詞只標第一次出現 ----
const TERMS = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
export function gloss(text) {
  let html = esc(text); const used = new Set();
  for (const t of TERMS) {
    if (used.has(t)) continue;
    const i = html.indexOf(esc(t));
    if (i === -1 || /<[^>]*$/.test(html.slice(0, i)) || html.slice(0, i).lastIndexOf('<button') > html.slice(0, i).lastIndexOf('</button>')) continue;
    html = html.slice(0, i) + `<button type="button" class="ac-term" data-term="${esc(t)}">${esc(t)}</button>` + html.slice(i + esc(t).length);
    used.add(t);
  }
  return html;
}

// ---- 牛馬（沿用大樓主角造型；variant: guide 帶路、teacher 講師馬） ----
export function niuma(variant = 'guide') {
  const teacher = variant === 'teacher';
  return `<svg class="ac-niuma" viewBox="0 -14 90 124" aria-hidden="true"><ellipse cx="45" cy="106" rx="22" ry="4" fill="#000" opacity=".35"/>
<rect x="31" y="78" width="11" height="22" rx="4" fill="#1d2640"/><rect x="48" y="78" width="11" height="22" rx="4" fill="#1d2640"/>
<rect x="29" y="98" width="15" height="8" rx="2" fill="#111"/><rect x="46" y="98" width="15" height="8" rx="2" fill="#111"/>
<rect x="24" y="48" width="42" height="36" rx="10" fill="${teacher ? '#2a2350' : '#f2f5fb'}"/><path d="M45 50 l-5 6 5 22 5-22z" fill="${teacher ? '#a78bfa' : '#ffc85a'}"/><rect x="52" y="60" width="9" height="6" rx="1.5" fill="#22d3ee"/>
<rect x="15" y="52" width="10" height="26" rx="5" fill="${teacher ? '#2a2350' : '#e6ebf5'}"/><rect x="65" y="52" width="10" height="26" rx="5" fill="${teacher ? '#2a2350' : '#e6ebf5'}"/>
<path d="M22 18 q-12 -4 -14 -14 q10 4 18 8z" fill="#f4e3c0"/><path d="M68 18 q12 -4 14 -14 q-10 4 -18 8z" fill="#f4e3c0"/>
<ellipse cx="16" cy="28" rx="8" ry="4" fill="#8a5a33"/><ellipse cx="74" cy="28" rx="8" ry="4" fill="#8a5a33"/>
<rect x="20" y="10" width="50" height="40" rx="16" fill="#a8703f"/><rect x="28" y="32" width="34" height="18" rx="9" fill="#e9c49a"/>
<circle cx="37" cy="41" r="2.4" fill="#5b3a1e"/><circle cx="53" cy="41" r="2.4" fill="#5b3a1e"/><circle cx="34" cy="25" r="3.6" fill="#111"/><circle cx="56" cy="25" r="3.6" fill="#111"/><circle cx="35" cy="24" r="1.2" fill="#fff"/><circle cx="57" cy="24" r="1.2" fill="#fff"/>
${teacher ? '<circle cx="34" cy="25" r="7" fill="none" stroke="#ffc85a" stroke-width="2"/><circle cx="56" cy="25" r="7" fill="none" stroke="#ffc85a" stroke-width="2"/><path d="M41 25h8" stroke="#ffc85a" stroke-width="2"/><path d="M18 8 L45 -4 L72 8 L45 18z" fill="#141a33" stroke="#a78bfa" stroke-width="1.5"/><path d="M66 10v12" stroke="#ffc85a" stroke-width="2"/><circle cx="66" cy="23" r="2.4" fill="#ffc85a"/>' : '<rect x="56" y="58" width="12" height="16" rx="2" fill="#22d3ee" opacity=".9"/><path d="M58 63h8M58 67h6" stroke="#05070d" stroke-width="1.4"/>'}
</svg>`;
}

// ---- 收藏卡 ----
function sparkles(n = 7) { return `<span class="ac-card__spark" aria-hidden="true">${'<i></i>'.repeat(n)}</span>`; }
export function cardFront(c, { compare = false } = {}) {
  const cmp = compare && c.compare ? `<div class="ac-cmp">
      <div class="ac-cmp__side ac-cmp__side--stock"><b>個股</b><p>${esc(c.compare.stock)}</p></div>
      <div class="ac-cmp__vs">VS</div>
      <div class="ac-cmp__side ac-cmp__side--index"><b>大盤</b><p>${esc(c.compare.index)}</p></div></div>` : '';
  return `<div class="ac-card__face ac-card__face--front">
    <div class="ac-card__top"><span class="ac-chip ac-chip--${c.tag === '進階' ? 'adv' : c.tag === '學院' ? 'ur' : 'new'}">${esc(c.tag)}</span>
      ${c.read ? `<span class="ac-card__time">約 ${c.read} 秒</span>` : ''}<span class="ac-card__rar">${RAR[c.rarity] || ''}</span></div>
    <div class="ac-card__art">${icon(c.icon, 'ac-ico ac-ico--big')}</div>
    <h3 class="ac-card__title">${esc(c.title)}</h3>
    ${cmp || `<p class="ac-card__lead">${gloss(c.lead)}</p>`}
    <div class="ac-card__foot"><span class="ac-card__na">${NOT_ADVICE}</span>${c.sample ? '' : '<button type="button" class="ac-card__flip" data-act="flip">翻面看例子 ↻</button>'}</div>
  </div>`;
}
export function cardBack(c) {
  return `<div class="ac-card__face ac-card__face--back">
    <div class="ac-card__top"><span class="ac-card__rar">${esc(c.title)}</span></div>
    <p class="ac-card__body">${gloss(c.body)}</p>
    ${c.example ? `<div class="ac-card__ex"><b>${esc(c.exLabel === '示範' ? '生活示範' : c.exLabel || '例子')}</b><p>${gloss(c.example)}</p></div>` : '<div class="ac-card__ex ac-card__ex--none"><p>這張卡沒有附例子，重點都在正面那一句。</p></div>'}
    <div class="ac-card__wm" aria-hidden="true">${icon(c.icon, 'ac-ico')}</div>
    <div class="ac-card__foot"><span class="ac-card__na">${NOT_ADVICE}</span><button type="button" class="ac-card__flip" data-act="flip">翻回正面 ↻</button></div>
  </div>`;
}
export function card(c, { collected = false, locked = false, compare = false, flipped = false } = {}) {
  return `<article class="ac-card ac-card--${c.rarity}${collected ? ' is-collected' : ''}${locked ? ' is-locked' : ''}${flipped ? ' is-flipped' : ''}${compare ? ' ac-card--cmp' : ''}" data-card="${c.id}" tabindex="0" aria-label="${esc(c.title)} 知識卡">
    <div class="ac-card__tilt"><div class="ac-card__inner">${cardFront(c, { compare })}${cardBack(c)}</div>
    <span class="ac-card__holo" aria-hidden="true"></span><span class="ac-card__glare" aria-hidden="true"></span>${sparkles()}
    ${collected ? '<span class="ac-card__stamp">已收藏</span>' : ''}${locked ? '<span class="ac-card__lock">🔒 完成上一關解鎖</span>' : ''}</div></article>`;
}
export function miniCard(c, { collected, locked, active } = {}) {
  return `<button type="button" class="ac-mini ac-mini--${c.rarity}${collected ? ' is-collected' : ''}${locked ? ' is-locked' : ''}${active ? ' is-active' : ''}" data-goto="${c.id}" aria-label="${esc(c.title)}">
    ${icon(c.icon)}<span>${esc(c.title)}</span>${collected ? '<i class="ac-mini__ok">✓</i>' : locked ? '<i class="ac-mini__ok">🔒</i>' : ''}</button>`;
}

// ---- 題目卡（展位底下 3 題、講師馬共用） ----
export function question(c, qi, state = {}) {
  const q = c.quiz[qi];
  const st = state.result; // undefined | true | false
  const opts = q.options.map((o, i) => {
    let cls = 'ac-opt';
    if (st !== undefined && i === q.answer) cls += ' is-right';
    if (st === false && i === state.choice) cls += ' is-wrong';
    return `<button type="button" class="${cls}" data-q="${c.id}#${qi}" data-choice="${i}" ${st === true ? 'disabled' : ''}><b>${'ABC'[i]}</b><span>${esc(o)}</span></button>`;
  }).join('');
  const fb = st === undefined ? '' : st
    ? `<p class="ac-fb ac-fb--ok">答對了！${esc(q.explain)}</p>`
    : `<p class="ac-fb ac-fb--ng">答錯了，已放進錯題本，明天講師馬會再考你。<br>解說：${esc(q.explain)}</p>`;
  return `<div class="ac-q${st === true ? ' is-done' : ''}" data-qwrap="${c.id}#${qi}"><p class="ac-q__t"><span>第 ${qi + 1} 題</span>${esc(q.q)}</p><div class="ac-q__opts">${opts}</div>${fb}</div>`;
}

export function progressBar(got, total, label = '') {
  const pct = total ? Math.round(got / total * 100) : 0;
  return `<div class="ac-prog" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${got}">
    <div class="ac-prog__row"><span>${esc(label)}</span><b><span data-count="${got}">${got}</span> / ${total}</b></div>
    <div class="ac-prog__bar"><i style="width:${pct}%"></i></div></div>`;
}
export function badge(b) {
  return `<div class="ac-badge${b.got ? ' is-got' : ''}" title="${esc(b.hint)}">${icon(b.got ? 'star' : 'shield', 'ac-ico')}<b>${esc(b.name)}</b><small>${esc(b.hint)}</small></div>`;
}
