// 7 樓個人交易室、STAR史塔財商教室、2F 猜盤結算、榮譽牆文案（只發站內薪水；GM 不寫檔、不發薪水）
export const DESK_LEVELS = [
  { lv: 0, name: '紙箱', price: 0, blurb: '先有個位子，紙箱也能上班。' },
  { lv: 1, name: '折疊桌', price: 180, blurb: '有桌子，才像真正來上班。' },
  { lv: 2, name: '雙螢幕', price: 480, blurb: '左右各一屏，盤與筆記分開看。' },
  { lv: 3, name: '交易工作站', price: 1200, blurb: '三屏工作站，開始有交易室的樣子。' },
  { lv: 4, name: '頂樓交易室', price: 3000, blurb: '最高級外觀與金框，工位就地升級，不必擠進 68 樓。' },
];

export const GUESS_WIN = 30;
export const GUESS_STREAK_STEP = 10;
export const GUESS_STREAK_CAP = 30;
export const WEEK_PT = 1;

// 同期學員馬：工位等級固定、坐在自己桌前，面對桌子。desk / stand 為 [x, z]。
// 玩家工位在 J（x=0, z=-7.2）面向 -Z；學員桌排在兩側與左後方，不擋、不搶焦點。
export const CLASSMATE_SCALE = 0.9;
export const CLASSMATE_FACE = Math.PI; // 與玩家相同，面向桌子／螢幕（-Z）
export function deskChairZ(lv, scale = CLASSMATE_SCALE) {
  const ddesk = lv >= 3 ? 1.0 : 0.8;
  return scale * (ddesk / 2 + 0.35);
}
export const CLASSMATES = [
  {
    id: 'n_mate_fold', name: '同期學員 阿拓', gender: 'm', outfit: 'polo',
    lv: 1, deskName: '折疊桌',
    line: '在 STAR史塔財商才搞懂，先進場不如先把停損想清楚。',
    desk: [-3.65, -6.85],
  },
  {
    id: 'n_mate_dual', name: '同期學員 小晴', gender: 'f', outfit: 'blouse',
    lv: 2, deskName: '雙螢幕',
    line: '老師一直講，盤感是等來的，不是追來的。',
    desk: [3.65, -6.85],
  },
  {
    id: 'n_mate_work', name: '同期學員 柏毅', gender: 'm', outfit: 'vest',
    lv: 3, deskName: '交易工作站',
    line: '完整版教的是先把風險算清楚，不是天天猜方向。',
    desk: [-3.7, -9.65],
  },
];
CLASSMATES.forEach(c => {
  c.stand = [c.desk[0], c.desk[1] + deskChairZ(c.lv)];
  c.face = CLASSMATE_FACE;
});

export const DESK_ITEMS = [
  { id: 'cert-junior', slot: 'cert', name: '見習結業證書', how: '累積打卡 7 天', need: { days: 7 } },
  { id: 'cert-study', slot: 'cert', name: 'STAR史塔財商研修證書', how: '工位升到交易工作站', need: { desk: 3 } },
  { id: 'cup-streak', slot: 'cup', name: '晨會連對獎盃', how: '猜盤連對 5 天', need: { guessStreak: 5 } },
  { id: 'cup-top', slot: 'cup', name: '頂樓交易室獎盃', how: '工位升到頂樓交易室', need: { desk: 4 } },
];

export const SETTLE_TIPS = [
  '猜方向不如等結構確認',
  '真正好用的東西，往往簡單到讓人不想承認',
  '交易的盡頭不是技術，是概率',
  '止損不只是操作，止損是保命用的',
  '每天就是等、看、忍，大部分人受不了',
  '最危險的時候，是所有人都忘記風險的時候',
  '策略不等於執行，重點是做到',
  '知足，不亂追不屬於自己的行情',
];

export function normOffice(o) {
  const x = o && typeof o === 'object' ? o : {};
  const lv = Math.max(0, Math.min(4, x.lv | 0));
  const slots = x.slots && typeof x.slots === 'object' ? x.slots : {};
  return {
    lv,
    slots: { cup: typeof slots.cup === 'string' ? slots.cup : '', cert: typeof slots.cert === 'string' ? slots.cert : '' },
    guessStat: Object.assign({ streak: 0, best: 0 }, x.guessStat && typeof x.guessStat === 'object' ? x.guessStat : {}),
  };
}

export function nextDesk(office) {
  const lv = (office && office.lv) | 0;
  return DESK_LEVELS[lv + 1] || null;
}
export function deskOf(office) { return DESK_LEVELS[(office && office.lv) | 0] || DESK_LEVELS[0]; }

export function itemUnlocked(it, ctx) {
  const n = it.need || {};
  if (n.days && !(ctx.days >= n.days)) return false;
  if (n.desk && !((ctx.office.lv | 0) >= n.desk)) return false;
  if (n.guessStreak && !(((ctx.office.guessStat || {}).best | 0) >= n.guessStreak)) return false;
  return true;
}

export function guessPick(v) {
  if (v === 'up' || v === 'down') return v;
  if (v && typeof v === 'object' && (v.pick === 'up' || v.pick === 'down')) return v.pick;
  return '';
}

export function tipFor(date) {
  let h = 0;
  String(date || '').split('').forEach(c => { h = (h * 33 + c.charCodeAt(0)) >>> 0; });
  return SETTLE_TIPS[h % SETTLE_TIPS.length];
}

export const STAR_SLOGANS = [
  ['STAR史塔財商', '想學完整版，來 7 樓教室'],
  ['STAR史塔財商', '方法之上，只有正期望加風控'],
  ['董事長 LEO易凡', '先想好停損，再談進場'],
  ['STAR史塔財商', '練的是盤感，不是點位'],
];

export function boardLines(i) { return STAR_SLOGANS[i % STAR_SLOGANS.length]; }
