// UI BOT ui-kit 加件接線（assets/ui-kit/ 只讀不改）：載入 HTML 片段、工位牆、工作證／薪資單分享圖。
import { drawIdCard, drawPayslip } from './ui-kit/js/share-draw.js';
export { drawIdCard, drawPayslip };
const cache = {};
// 片段裡的圖片是根目錄絕對路徑（/assets/ui-kit/…），掛在子路徑（GitHub Pages）會失效 → 載入時改成相對路徑
export async function snippet(name) {
  if (!cache[name]) cache[name] = fetch(`assets/ui-kit/snippets/${name}.html`).then(r => (r.ok ? r.text() : '')).then(t => t.replace(/<!--[\s\S]*?-->/g, '').replace(/(src|href)="\/assets\/ui-kit\//g, '$1="assets/ui-kit/')).catch(() => '');
  return cache[name];
}
// 在 el 裡留一個位置，片段載好後補上（面板已換內容就不補）
export function mountSnippet(el, name, where = 'beforeend') {
  const id = 'uk_' + name + '_' + Math.random().toString(36).slice(2, 7);
  el.insertAdjacentHTML(where, `<div class="uk-slot" id="${id}" data-uk-slot="${name}"></div>`);
  snippet(name).then(html => { const s = document.getElementById(id); if (s && html) s.innerHTML = html; });
}
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// 工位牆（uk-deskwall）：用真實存檔資料產生，結構照 snippets/desk-wall.html
export function deskWallHTML({ title, lit }) {
  const n = 8, on = Math.min(n, lit | 0);
  return `<section class="uk-root uk-deskwall" data-uk="desk-wall" aria-label="工位牆知識卡">
    <div class="uk-deskwall__title"><b>${esc(title || '實習牛馬')}</b><span>已收藏 ${lit | 0} 張</span></div>
    ${Array.from({ length: n }, (_, i) => `<div class="uk-deskwall__slot${i < on ? ' is-on' : ''}"${i < on ? ' title="已收藏"' : ''}></div>`).join('')}</section>`;
}
