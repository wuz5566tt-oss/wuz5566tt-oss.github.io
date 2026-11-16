/* 品牌與外觀開關：只改這幾個常數就能換 Logo 或預設外牆，不必翻場景程式。
   STAR_LOGO_STYLE：'neon'＝霓虹上色版，'original'＝原圖。
   EXTERIOR_DEFAULT：'classic'＝現行外觀（預設），'cyber'＝賽博龐克接近街道。
   網址加 ?exterior=cyber 或 ?exterior=classic 可臨時預覽，不必改常數。 */
export const STAR_LOGO_STYLE = 'neon';
export const STAR_LOGO_UI = `./assets/img/star-${STAR_LOGO_STYLE}-512.webp`;
export const STAR_LOGO_ICON = `./assets/img/star-${STAR_LOGO_STYLE}-192.webp`;

export const TOWER_NAME = '史塔金融大樓';
export const EVENT_NAME = '牛馬交易上班日';

export const EXTERIOR_DEFAULT = 'classic';
export function exteriorMode() {
  try {
    const q = new URLSearchParams(location.search).get('exterior');
    if (q === 'cyber' || q === 'classic') return q;
  } catch {}
  return EXTERIOR_DEFAULT;
}
export const isCyber = () => exteriorMode() === 'cyber';

export function applyBrand() {
  const icon = STAR_LOGO_ICON, ui = STAR_LOGO_UI;
  const set = (sel, href) => { const el = document.querySelector(sel); if (el) el.href = href; };
  set('link[rel="icon"]', icon);
  set('link[rel="apple-touch-icon"]', icon);
  document.querySelectorAll('[data-star-logo]').forEach(img => { img.src = ui; img.alt = '史塔'; });
  document.title = document.title.replace(/史塔科技大樓/g, TOWER_NAME);
  document.body && document.body.classList.toggle('cyber', isCyber());
}
