/* 品牌與外觀開關：只改這幾個常數就能換 Logo 或預設外牆，不必翻場景程式。
   STAR_LOGO_STYLE：
     'neon' / 'original'＝既有 webp；
     'crest'（或 a）＝金線紋章 logo-opt-a；
     'bars'（或 b）＝K 線幾何星標 logo-opt-b；
     'seal'（或 c）＝私行印記 logo-opt-c。
   EXTERIOR_DEFAULT：'classic'＝現行外觀（預設），'cyber'＝賽博龐克接近街道。
   網址加 ?exterior=cyber|classic 或 ?logo=crest|bars|seal 可臨時預覽，不必改常數。
   已選定 'seal'（私行印記）。網址 ?logo= 仍可臨時預覽其他款。 */
export const STAR_LOGO_STYLE = 'seal';

const LOGO_ALIAS = {
  neon: 'neon', original: 'original',
  a: 'crest', 'opt-a': 'crest', 'logo-opt-a': 'crest', crest: 'crest',
  b: 'bars',  'opt-b': 'bars',  'logo-opt-b': 'bars',  bars: 'bars',
  c: 'seal',  'opt-c': 'seal',  'logo-opt-c': 'seal',  seal: 'seal',
};

const LOGO_SRC = {
  neon:     { ui: './assets/img/star-neon-512.webp',     icon: './assets/img/star-neon-192.webp' },
  original: { ui: './assets/img/star-original-512.webp', icon: './assets/img/star-original-192.webp' },
  crest:    { ui: './brand/logo-opt-a.svg', icon: './brand/logo-opt-a.svg' },
  bars:     { ui: './brand/logo-opt-b.svg', icon: './brand/logo-opt-b.svg' },
  seal:     { ui: './assets/img/star-seal.svg', icon: './assets/img/star-seal-192.png' },
};

const PREMIUM = new Set(['crest', 'bars', 'seal']);

export function logoStyle() {
  try {
    const q = new URLSearchParams(location.search).get('logo');
    if (q) {
      const k = LOGO_ALIAS[String(q).toLowerCase()];
      if (k && LOGO_SRC[k]) return k;
    }
  } catch {}
  return LOGO_ALIAS[STAR_LOGO_STYLE] || STAR_LOGO_STYLE;
}

const _logo = LOGO_SRC[logoStyle()] || LOGO_SRC.neon;
export const STAR_LOGO_UI = _logo.ui;
export const STAR_LOGO_ICON = _logo.icon;

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

function iconType(href) {
  if (href.endsWith('.svg')) return 'image/svg+xml';
  if (href.endsWith('.png')) return 'image/png';
  if (href.endsWith('.webp')) return 'image/webp';
  return '';
}

export function applyBrand() {
  const style = logoStyle();
  const { icon, ui } = LOGO_SRC[style] || LOGO_SRC.neon;
  const setIcon = (sel, href) => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.href = href;
    const typ = iconType(href);
    if (typ) el.type = typ;
  };
  setIcon('link[rel="icon"]', icon);
  let apple = icon;
  try {
    apple = new URLSearchParams(location.search).get('gm') === '1'
      ? './assets/img/apple-touch-icon-gm.png'
      : './assets/img/apple-touch-icon.png';
  } catch {}
  setIcon('link[rel="apple-touch-icon"]', apple);
  document.querySelectorAll('[data-star-logo]').forEach(img => {
    // HUD / small badges use the contrast icon; start & tip keep the transparent mark
    img.src = img.classList.contains('hud-logo') ? icon : ui;
    img.alt = '史塔';
  });
  document.title = document.title.replace(/史塔科技大樓/g, TOWER_NAME);
  if (document.body) {
    document.body.classList.toggle('cyber', isCyber());
    document.body.classList.toggle('logo-premium', PREMIUM.has(style));
    document.body.classList.toggle('logo-crest', style === 'crest');
    document.body.classList.toggle('logo-bars', style === 'bars');
    document.body.classList.toggle('logo-seal', style === 'seal');
  }
}
