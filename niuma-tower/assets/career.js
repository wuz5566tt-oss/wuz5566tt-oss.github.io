// 老闆藍圖（11/27）：新手（入職第一天、新手禮包、捏自己的牛馬）｜每天（下班複盤 1 題、突發行情、每週前十本機版）｜展覽（華爾街歷史、大盤比個股、0050 定期定額示範、準備中展廳）｜置入（戰報看板）
// 規則：薪水＝站內虛擬點數，不能換現金；GM 模式只預覽，不存檔、不發薪水；不做 A股；不帶單、不喊點位、非投資建議。
import { lineCtaHTML } from './uikit.js';
import { hallById, hallDone, hallCards, normAcademy, CARDS, FIRST_CARD } from './academy-logic.js';
export const CAREER_VER = 1;
export const REWARD_C = { badge: 100, gift: 200, offq: 20, flash: 10 };
export const LOOK_OPT = {
  hair: [['none', '原味'], ['bangs', '瀏海'], ['slick', '油頭'], ['spiky', '刺蝟頭'], ['curly', '小捲毛']],
  tie: [['gold', '金色', 0xffc85a], ['red', '紅色', 0xff4d5e], ['navy', '藏青', 0x3b5bdb], ['green', '綠色', 0x2fd38a], ['purple', '紫色', 0x9b7dff]],
  badge: [['cyan', '青色', 0x3ef2ff], ['red', '紅色', 0xff4d5e], ['white', '白色', 0xf2f5fb], ['purple', '紫色', 0x9b7dff], ['gold', '金色（新手禮包）', 0xffd66b, 'gift']],
};
export const DEFAULT_LOOK = { hair: 'none', tie: 'gold', badge: 'cyan' };
export function normCareer(c) {
  const o = c && typeof c === 'object' ? c : {};
  const obj = x => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
  const lk = obj(o.look), pick = (k, v) => (LOOK_OPT[k].some(x => x[0] === v) ? v : DEFAULT_LOOK[k]);
  return {
    v: CAREER_VER,
    badge: typeof o.badge === 'string' ? o.badge : null, // 「正式錄取」徽章取得日
    gift: typeof o.gift === 'string' ? o.gift : null, // 新手禮包領取日
    look: { hair: pick('hair', lk.hair), tie: pick('tie', lk.tie), badge: pick('badge', lk.badge), name: typeof lk.name === 'string' ? lk.name.trim().slice(0, 10) : '' },
    lookSet: !!o.lookSet,
    lookIntro: !!o.lookIntro, // 新帳號已做完第一次捏臉（主線第 1 步）
    offq: obj(o.offq), // { 'YYYY-MM-DD': { m, ans, ok, paid } }
    flash: Array.isArray(o.flash) ? o.flash.filter(x => typeof x === 'string').slice(-60) : [], // 已讀的突發行情 key
    reportDays: Array.isArray(o.reportDays) ? o.reportDays.filter(d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)).slice(-90) : [],
    testHook: !!o.testHook, // 本機 QA 測試進度帳號：不上正式榜
  };
}
export const lookColor = (k, v) => { const x = LOOK_OPT[k].find(y => y[0] === v); return x ? x[2] : null; };
export function horseName(S) {
  const n = S && S.career && S.career.look && S.career.look.name;
  if (n && String(n).trim()) return String(n).trim().slice(0, 10);
  const nick = S && S.fin && S.fin.nick;
  if (nick && String(nick).trim()) return String(nick).trim().slice(0, 10);
  return '牛馬' + String((S && S.vid) || '0000').slice(-4);
}
export function reportsViewedOn(S, todayStr) {
  return !!((S && S.career && S.career.reportDays) || []).includes(todayStr);
}


/* ---------- 一條主線（總經理 10 步表）：一次只亮當下那一件，做完才開下一件 ---------- */
export function isDay1(S, todayStr) {
  return (S.days || []).filter(Boolean).every(d => d >= todayStr);
}
export function needsLook(S) {
  const c = S.career || {};
  if (c.lookSet) return false;
  if ((S.days || []).length || (S.coins | 0) > 0) return false;
  return true;
}
export const QUEST_STEPS = [
  { id: 'look', n: 1, title: '捏一隻自己的牛馬', hint: '選好再開始後面的任務', go: 'mynm' },
  { id: 'us', n: 2, title: '接引櫃台加 LINE，領美指模型', hint: '加入 ID wuzakakak，當天領取美指模型。', go: 'guide' },
  { id: 'checkin', n: 3, title: '第一次打卡，領薪水', hint: '到 1 樓打卡櫃台上班打卡。', go: 'checkin' },
  { id: 'card', n: 4, title: '領第一張知識卡「學交易是學生存」', hint: '回接引櫃台直接領取這張生存課第一張，不必先上 8 樓。', go: 'guide' },
  { id: 'guess', n: 5, title: '上 2 樓猜一次盤', hint: '只猜方向，不給點位。做完提示「明天先來晨會」。', go: 'guess' },
  { id: 'intro', n: 6, title: '回來打卡、晨會，把學院入門館學完', hint: '每天先打卡、晨會猜盤、再去 4 樓看今日戰報，然後把入門館學完（含生存課另外兩張：「平時靠紀律」「恐慌時再進場有價資產」）。', go: 'ac_gate' },
  { id: 'tw', n: 7, title: '打卡滿 7 天，領台指模型', hint: '到 1 樓接引櫃台領取。', go: 'guide' },
  { id: 'halls', n: 8, title: '學完技術分析館和市場觀察館', hint: '到 8 樓學院繼續學。', go: 'ac_gate' },
  { id: 'target', n: 9, title: '打卡滿 30 天，上 5 樓領目標值系統', hint: '到 5 樓研究室領取，並在那裡產生資格碼。', go: 'target' },
  { id: 'master', n: 10, title: '打卡滿 60 天，走官方 LINE 申請掌門面試', hint: '把資格碼傳給助理小編，申請拜師。', go: 'guide' },
];
const PATH_MILESTONES = [
  { id: 'us', when: '今天', name: '美指模型', hint: '加 LINE（ID wuzakakak）當天領取' },
  { id: 'tw', when: '打卡 7 天', name: '台指模型', hint: '連續來上班，到接引櫃台領取' },
  { id: 'target', when: '打卡 30 天', name: '目標值系統', hint: '到 5 樓研究室領取，並在那裡產生資格碼' },
  { id: 'master', when: '打卡 60 天', name: '申請拜師', hint: '走官方 LINE 申請掌門面試，成為徒弟' },
];
export function hallComplete(S, id) {
  try {
    const A = normAcademy(S.academy);
    const h = hallById(id);
    return !!(h && hallDone(A, h));
  } catch { return false; }
}
const hasGuessPick = v => v && (typeof v === 'string' || v.pick);
const guessedToday = (S, todayStr) => {
  const bag = (S && S.guesses) || {};
  if (Object.values(bag[todayStr] || {}).some(hasGuessPick)) return true;
  return Object.values(bag).some(rec => rec && Object.values(rec).some(v => v && v.placedOn === todayStr && hasGuessPick(v)));
};
function pack(step, extra) {
  const q = QUEST_STEPS.find(s => s.n === step);
  return { id: q.id, step, title: q.title, go: q.go, next: q.hint, milestone: step <= 5 ? 'us' : step <= 7 ? 'tw' : step <= 9 ? 'target' : 'master', ...extra };
}
export function currentPath(S, todayStr) {
  const n = new Set((S.days || []).filter(Boolean)).size;
  const claims = S.claims || {};
  const A = S.academy || {};
  const gotCard = (A.lit || []).includes(FIRST_CARD);
  const gotUs = !!claims.us;
  const checkedToday = (S.days || []).includes(todayStr);
  const day1 = isDay1(S, todayStr);
  const guessed = guessedToday(S, todayStr);
  const introDone = hallComplete(S, 'intro');
  const taDone = hallComplete(S, 'ta');
  const mktDone = hallComplete(S, 'mkt');

  if (needsLook(S)) return pack(1, { next: '先捏一隻自己的牛馬，選好再開始後面的任務。服裝店不是必做。' });
  if (!gotUs) return pack(2);
  if (!checkedToday && (day1 || n === 0)) return pack(3);
  if (!gotCard) return pack(4);
  if (day1 && !guessed) return pack(5, { next: '到 2 樓猜盤桌猜一次台股。只猜方向，不給點位。' });
  if (day1) return pack(5, { id: 'wait', title: '明天先來晨會', go: null, waiting: true,
    next: '今天的入職完成了。明天先來晨會，並繼續走「領取與拜師之路」。' });

  // 成長：先當天打卡、晨會、看今日戰報，再走當下那一步（戰報不是第 11 步，每天像打卡一樣刷新）
  const growStep = () => (!introDone ? 6 : (n < 7 || !claims.tw) ? (n >= 7 && !claims.tw ? 7 : 6) : (!taDone || !mktDone) ? 8 : (n < 30 || !claims.target) ? (n >= 30 && !claims.target ? 9 : 8) : (n < 60 || !claims.master) ? (n >= 60 && !claims.master ? 10 : 9) : 10);
  if (!checkedToday) return pack(growStep(), {
    id: 'checkin', title: '先打卡', go: 'checkin', next: '先到 1 樓打卡櫃台上班，再繼續今天的學習。' });
  if (!guessed) return pack(growStep() === 6 ? 6 : growStep(), { id: 'guess', title: '晨會猜盤', go: 'guess', next: '到 2 樓猜盤桌猜一次。只猜方向，不給點位。' });
  if (!reportsViewedOn(S, todayStr)) {
    const panic = C && C.isPanicDay && C.isPanicDay();
    if (panic) return pack(growStep(), { id: 'panic', title: '今日恐慌課', go: 'panic',
      next: '市場明顯動盪。去看生存課第三張「恐慌時再進場有價資產」，並看當天台股、美股戰報。這不是進場訊號，也不保證這時買會賺。' });
    return pack(growStep(), { id: 'reports', title: '去 4 樓看今日戰報', go: 'reports',
      next: '到 4 樓戰報樓看今天的台股、美股每日戰報。休市會標明，並帶上一個交易日的日期。非投資建議。' });
  }

  if (!introDone) return pack(6, { next: A.place ? '到 8 樓學院把入門觀念館學完（含生存課另外兩張卡）。' : '到 8 樓學院入口大廳做程度測驗，再把入門館學完（含生存課另外兩張卡）。' });
  if (n < 7 || !claims.tw) {
    if (n >= 7 && !claims.tw) return pack(7, { next: '累積打卡 7 天已達成。到 1 樓接引櫃台領取台指模型。' });
    return pack(6, { id: 'continue', title: '繼續學知識', go: 'ac_gate',
      next: `入門館已學完。下一個里程碑：再打卡 ${7 - n} 天，領取台指模型。` });
  }
  if (!taDone || !mktDone) {
    const miss = [!taDone && '技術分析館', !mktDone && '市場觀察館'].filter(Boolean).join('和');
    return pack(8, { next: `到 8 樓學院把${miss}學完。` });
  }
  if (n < 30 || !claims.target) {
    if (n >= 30 && !claims.target) return pack(9, { next: '累積打卡 30 天已達成。到 5 樓目標值研究室領取，並在那裡產生資格碼。' });
    return pack(8, { id: 'continue', title: '繼續學知識', go: 'ac_gate',
      next: `技術館和市場館已學完。下一個里程碑：再打卡 ${30 - n} 天，上 5 樓領取目標值系統。` });
  }
  if (n < 60 || !claims.master) {
    if (n >= 60 && !claims.master) return pack(10, { next: '累積打卡 60 天已達成。請加官方 LINE，申請掌門面試，把資格碼傳給助理小編。' });
    return pack(9, { id: 'continue', title: '繼續學知識', go: 'ac_gate',
      next: `再打卡 ${60 - n} 天，即可走官方 LINE 申請掌門面試。` });
  }
  return pack(10, { id: 'done', title: '已申請拜師', done: true, next: '你已走到申請拜師。請透過官方 LINE 完成掌門面試。' });
}
export function pathMilestones() { return PATH_MILESTONES; }


/* ---------- 真實事件（來源記在這裡，畫面不顯示來源網址） ---------- */
// 華爾街歷史展廳：雷曼、GE 為公開歷史；NVDA 取自本公司美股戰報 2026-11-23（Reuters、CNBC、每日經濟新聞）
export const WALL_ST = [
  { date: '2008/9/15', title: '雷曼兄弟聲請破產保護', big: '美國史上最大破產案', body: '成立 158 年的投資銀行雷曼兄弟（Lehman Brothers）聲請破產保護，申報資產約 6,390 億美元。當天道瓊工業指數下跌 504 點（-4.42%），全球金融海嘯全面爆發。', lesson: '再大的公司都可能倒下；買進一籃子的指數，單一公司出事時，傷害會被分散。' },
  { date: '2018/6/26', title: '奇異 GE 被移出道瓊工業指數', big: '最後一檔 1896 年創始成分股離場', body: '奇異（GE）是 1896 年道瓊工業指數最早的成分股之一，自 1907 年起連續留在指數裡超過一百年。2018/6/26 起被移出，由沃爾格林（Walgreens Boots Alliance）取代。', lesson: '指數會定期汰弱留強、換掉成分股；持有指數的人不用自己動手換股。' },
  { date: '2026/11/23', title: '輝達 NVDA 單日 +31.48%', big: '收 165.05 美元', body: '輝達董事會宣布黃仁勳即日復任執行長，股價單日大漲 31.48%，單日市值增加約 9,520 億美元，創紀錄。那斯達克指數同日上漲 6.51%。', lesson: '個股單日波動可以比指數大好幾倍；漲得快，跌起來也一樣快（隔天 11/24 輝達 -5.86%）。' },
];
// 大盤比個股對比牆：本公司美股戰報 2026-11-24（MarketWatch、Investopedia；指數取自開獎資料）
export const VS_WALL = [
  { date: '2026/11/24', stock: { name: '美光 MU', pct: -11.01, close: '629.79 美元', why: 'BNP Paribas 降評至中立' }, index: { name: '那斯達克綜合指數（^IXIC）', pct: -1.48, close: '23,733.54' } },
];
/* ---------- 小工具 ---------- */
const md = d => `${+d.slice(5, 7)}/${+d.slice(8, 10)}`;
const fmt = (n, dp = 2) => Number(n).toLocaleString('zh-TW', { minimumFractionDigits: dp, maximumFractionDigits: dp });
const pctTxt = v => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;
export const MKT_TITLE = { tw: '台股加權指數', us: '那斯達克綜合指數（^IXIC）' };
const MKN = MKT_TITLE;
const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

let C = null;
export function initCareer(ctx) { C = ctx; }
const K = () => { const c = C.S.career; if (!c || c.v !== CAREER_VER || !c.look || !c.offq || !Array.isArray(c.flash)) C.S.career = normCareer(c); return C.S.career; }; // 同一個物件，避免中途被換掉
const gmStop = () => C.block('GM 模式只能預覽，不會記錄、也不會發薪水');
function pay(coins, xp, el, msg) { if (coins || xp) C.addXP(xp | 0, coins | 0, el); else C.save(); C.blip(1046); C.toast(msg); }
const again = (el, fn, ms = 0) => setTimeout(() => { if (el.isConnected) fn(el); }, ms);

/* ---------- 1) 入職第一天清單＋新手禮包 ---------- */
export function onboardSteps() {
  const S = C.S, A = S.academy || {}, eq = (C.equipped && C.equipped()) || {};
  const guessed = Object.values(S.guesses || {}).some(d => d && Object.values(d).some(v => v && (typeof v === 'string' || v.pick)));
  return [
    { id: 'checkin', name: '打卡上班', hint: '1 樓打卡櫃台', done: (S.days || []).length > 0, go: 'checkin' },
    { id: 'meet', name: '晨會答 1 題', hint: '2 樓猜盤桌猜一次台股或美股', done: guessed, go: 'guess' },
    { id: 'card', name: '去學院收 1 張卡', hint: '8 樓學院展覽館', done: (A.lit || []).length > 0, go: 'ac_gate' },
    { id: 'outfit', name: '換 1 件裝扮', hint: '服裝店，或下面「捏自己的牛馬」', done: Object.values(eq).some(Boolean) || K().lookSet, go: 'shop' },
  ];
}
function onboard(el) {
  const k = K(), gm = C.isGM(), cur = currentPath(C.S, C.today());
  const claims = C.S.claims || {};
  const step = cur.step || 1;
  const lis = QUEST_STEPS.map(q => {
    const cls = q.n < step || (cur.done && q.n <= 10) && !(cur.waiting && q.n === 5 && step === 5) ? 'is-done'
      : (q.n === step && !cur.waiting) ? 'is-now'
      : (cur.waiting && q.n === 5 && q.n === step) ? 'is-done'
      : 'is-later';
    const done = cls === 'is-done' || (cur.waiting && q.n <= 5);
    const now = !cur.waiting && !cur.done && q.n === step;
    return `<li class="${now ? 'is-now' : done ? 'is-done' : 'is-later'}"><b>${q.title}</b></li>`;
  }).join('');
  const goBtn = cur.go && !cur.waiting && !cur.done ? `<button type="button" class="btn primary" id="crGo" style="width:100%;margin-top:10px">去做：${cur.title}</button>` : '';
  const showPath = cur.waiting || !isDay1(C.S, C.today()) || cur.done || (cur.step || 0) >= 6;
  const pathLis = PATH_MILESTONES.map(m => {
    const got = m.id === 'master' ? !!claims.master : !!claims[m.id];
    const now = cur.milestone === m.id;
    return `<li class="${now ? 'is-now' : (got ? 'is-done' : '')}"><em>${m.when}</em><b>${m.name}</b><span>${m.hint}</span></li>`;
  }).join('');
  el.innerHTML = `<section class="uk-root uk-quest" data-uk="quest" data-step="${step}" aria-label="任務指引">
      <header class="uk-plaque"><small>新手任務</small><b>現在要做這一件</b></header>
      <div class="uk-quest__now"><em>第 ${step} 步</em><b>${cur.waiting ? '明天先來晨會' : cur.title}</b><span>${cur.next}</span></div>
      ${goBtn}
      ${cur.waiting ? '<div class="uk-onboard__done"><b>明天先來晨會</b><p>並看見「領取與拜師之路」進度。</p></div>' : ''}
      ${cur.done ? '<div class="uk-onboard__done"><b>已申請拜師</b><p>請走官方 LINE 完成掌門面試</p></div>' : ''}
      <ol class="uk-quest__list">${lis}</ol>
      <p class="uk-note">服裝店隨時可換裝扮，不是必做任務。一次只做眼前這一件。內容僅供學習，非投資建議。</p>
    </section>
    ${showPath ? `<section class="uk-root uk-path" data-uk="master-path" aria-label="領取與拜師之路" style="margin-top:12px">
      <header class="uk-plaque"><small>一樓大廳</small><b>領取與拜師之路</b></header>
      <p class="uk-f1__lead">模型是工具，生存靠紀律，最後才拜師。</p>
      <ol class="uk-path__list">${pathLis}</ol>
    </section>` : ''}
    <p class="note" style="margin:12px 0 0">${gm ? 'GM 預覽：可以走完全程，不會存檔、也不會發薪水。' : '薪水是站內虛擬點數，不能換現金。'}</p>
    ${k.gift ? '' : `<button type="button" class="btn ghost sm" id="crGift" style="width:100%;margin-top:8px">打開新手禮包（可選）</button>`}
    <button type="button" class="btn ghost sm" id="crLook" style="width:100%;margin-top:6px">捏自己的牛馬</button>`;
  const gb = el.querySelector('#crGo');
  gb && (gb.onclick = () => C.goZone ? C.goZone(cur.go) : C.open(cur.go));
  const gift = el.querySelector('#crGift');
  gift && (gift.onclick = () => { if (gift.disabled || gmStop()) return; const kk = K(); if (kk.gift) return; gift.disabled = true; kk.gift = C.today(); pay(REWARD_C.gift, 2, gift, `新手禮包：薪水 +${REWARD_C.gift}，金色工牌已解鎖`); again(el, onboard, 500); });
  el.querySelector('#crLook').onclick = () => C.open('mynm');
}

function mynm(el) {
  const k = K(), gm = C.isGM(), eq = (C.equipped && C.equipped()) || {};
  const cur = C.lookDraft || (C.lookDraft = { ...k.look });
  const sw = (key, label) => `<div class="field"><label>${label}</label><div class="moods cr-opts">${LOOK_OPT[key].map(([v, n, col, need]) => {
    const locked = need === 'gift' && !k.gift && !gm;
    return `<button type="button" data-lk="${key}" data-lv="${v}" class="${cur[key] === v ? 'sel' : ''}" ${locked ? 'disabled title="新手禮包解鎖"' : ''}>${col != null ? `<i class="cr-dot" style="background:#${col.toString(16).padStart(6, '0')}"></i>` : ''}${n}${locked ? '🔒' : ''}</button>`; }).join('')}</div></div>`;
  const intro = (C.needsLookIntro && C.needsLookIntro()) || (C.needsLook && C.needsLook(C.S));
  const nm = cur.name || k.look.name || '';
  el.innerHTML = `<p style="margin:0">${intro ? '先選好自己的牛馬，存下造型再開始後面的任務。這是主線第 1 步，服裝店不是必做。' : '捏一隻自己的牛馬。改完按「存下造型」，3D 場景裡的你會馬上換。'}</p>
    <div class="field"><label>牛馬名字（榜上只用這個，可之後再改）</label>
      <input id="lkName" class="passin" lang="zh-Hant" autocomplete="off" autocapitalize="off" spellcheck="false" value="${C.esc(nm)}" placeholder="例如：小牛馬" style="width:100%"></div>
    ${sw('hair', '髮型')}${sw('tie', '領帶顏色')}${sw('badge', '工牌顏色')}
    ${eq.tie ? '<p class="note">你現在有穿服裝店的領帶，領帶顏色要脫下那條才看得到。</p>' : ''}
    <button type="button" class="btn primary" id="lkSave" style="width:100%">${intro ? (gm ? '存下並開始入職（GM 不存檔）' : '存下造型，開始入職') : (gm ? 'GM 預覽（不存檔）' : '存下造型')}</button>
    <button type="button" class="btn ghost sm" id="lkReset" style="width:100%;margin-top:6px">回到預設</button>
    <p class="note">換造型不用花薪水。1 樓服裝店之後都在。${gm ? 'GM 預覽：只改畫面，重新整理就回來。' : ''}</p>`;
  const readName = () => {
    const nameEl = el.querySelector('#lkName');
    if (nameEl) cur.name = String(nameEl.value || '').trim().slice(0, 10);
  };
  const nameInp = el.querySelector('#lkName');
  if (nameInp) {
    let composing = false;
    nameInp.addEventListener('compositionstart', () => { composing = true; });
    nameInp.addEventListener('compositionend', () => { composing = false; readName(); });
    nameInp.addEventListener('input', ev => { if (ev.isComposing || composing) return; readName(); });
  }
  el.querySelectorAll('[data-lk]').forEach(b => b.onclick = () => { if (b.disabled) return; readName(); cur[b.dataset.lk] = b.dataset.lv; C.setLook(cur); mynm(el); });
  el.querySelector('#lkReset').onclick = () => { readName(); Object.assign(cur, DEFAULT_LOOK); C.setLook(cur); mynm(el); };
  const finishIntro = () => { if (intro && C.afterLookIntro) C.afterLookIntro(); };
  el.querySelector('#lkSave').onclick = () => {
    readName();
    if (gm) { C.setLook(cur); C.toast('GM 預覽：造型只在這次畫面生效，不存檔'); finishIntro(); return; }
    const kk = K();
    kk.look = { hair: cur.hair, tie: cur.tie, badge: cur.badge, name: cur.name || '' };
    kk.lookSet = true;
    C.lookDraft = { ...kk.look };
    C.save();
    C.setLook(kk.look);
    C.blip(988);
    C.toast('造型已存下');
    C.refreshHud();
    finishIntro();
  };
}

/* ---------- 2) 下班複盤 1 題（題目由真實收盤資料產生） ---------- */
function lastResult(t, m) {
  const R = C.results(); if (!R || !R.results) return null;
  const ds = Object.keys(R.results).filter(d => R.results[d][m] && d <= t.date && (d < t.date || C.settled(d, m))).sort();
  const d = ds[ds.length - 1]; return d ? { d, r: R.results[d][m] } : null;
}
export function offQuestion() {
  const t = C.tpe(), m = hash(t.date) % 2 ? 'us' : 'tw', x = lastResult(t, m) || lastResult(t, m === 'tw' ? 'us' : 'tw');
  if (!x) return null;
  const mk = x.r === (C.results().results[x.d].tw) ? 'tw' : 'us';
  const kind = hash(t.date + 'k') % 2;
  if (!kind) {
    const opts = ['收紅（上漲）', '收黑（下跌）', '平盤'], ans = x.r.dir === 'up' ? 0 : x.r.dir === 'down' ? 1 : 2;
    return { m: mk, d: x.d, q: `${md(x.d)} ${MKN[mk]}收盤是？`, opts, ans, explain: `${md(x.d)} 收 ${fmt(x.r.close)}，${x.r.chg >= 0 ? '漲' : '跌'} ${fmt(Math.abs(x.r.chg))} 點（${pctTxt(x.r.pct)}）。收紅、收黑看的是和前一個交易日收盤比。` };
  }
  const p = x.r.pct, a = Math.abs(p), alt = [a < 1 ? a + 2 : a / 3, a + (a < 2 ? 3 : a)].map(v => Math.round(v * 100) / 100);
  const vals = [a, ...alt].map(v => (p < 0 ? -v : v)); const order = [0, 1, 2].sort((i, j) => hash(t.date + i) - hash(t.date + j));
  return { m: mk, d: x.d, q: `${md(x.d)} ${MKN[mk]}的漲跌幅最接近哪一個？`, opts: order.map(i => pctTxt(vals[i])), ans: order.indexOf(0), explain: `實際是 ${pctTxt(p)}（收 ${fmt(x.r.close)}）。漲跌幅＝（今天收盤－前一天收盤）÷ 前一天收盤。` };
}
function offq(el) {
  const t = C.tpe(), k = K(), mine = k.offq[t.date], q = offQuestion(), gm = C.isGM();
  if (!q) { el.innerHTML = '<div class="card coming"><b>待開獎</b><p class="note" style="margin:6px 0 0">還沒有收盤資料，晚點再來。</p></div>'; return; }
  const done = mine && mine.ans != null;
  el.innerHTML = `<div class="card"><div class="row between"><b>下班複盤 1 題（${md(t.date)}）</b><span class="tag">${done ? (mine.ok ? `答對 +${mine.paid || 0}` : '答錯') : `答對 +${REWARD_C.offq}`}</span></div>
      <p class="note" style="margin:6px 0 0">每天 1 題，用真實收盤資料出題。只複盤發生過的事，不猜明天。</p></div>
    <div class="card cr-q"><b>${q.q}</b>
      ${q.opts.map((o, i) => `<button type="button" class="btn ${done ? (i === q.ans ? 'up sel' : i === mine.ans ? 'down' : 'ghost') : 'ghost'}" data-oq="${i}" style="width:100%;margin-top:8px;justify-content:flex-start" ${done ? 'disabled' : ''}>${'ABC'[i]}．${o}</button>`).join('')}
      ${done ? `<p class="note" style="margin:10px 0 0">${mine.ok ? '答對了！' : `正解是 ${'ABC'[q.ans]}。`}${q.explain}</p>` : ''}</div>
    <p class="note">${gm ? 'GM 預覽：可以作答看解析，不存檔、不發薪水。' : '薪水是站內虛擬點數，不能換現金。'}非投資建議。</p>`;
  el.querySelectorAll('[data-oq]').forEach(b => b.onclick = () => {
    if (b.disabled) return; const i = +b.dataset.oq, ok = i === q.ans, t2 = C.tpe();
    if (gm) { C.gmOffq = { [t2.date]: { ans: i, ok, paid: 0 } }; renderGM(el, q, i); return; }
    const kk = K(); if (kk.offq[t2.date]) return;
    kk.offq[t2.date] = { m: q.m, d: q.d, ans: i, ok, paid: ok ? REWARD_C.offq : 0 };
    Object.keys(kk.offq).sort().slice(0, -30).forEach(d => delete kk.offq[d]);
    if (ok) pay(REWARD_C.offq, 2, b, `下班複盤答對，薪水 +${REWARD_C.offq}`); else { C.save(); C.toast('答錯了，看一下解析'); }
    offq(el); C.refreshHud();
  });
}
function renderGM(el, q, i) {
  el.querySelectorAll('[data-oq]').forEach((b, j) => { b.disabled = true; b.className = `btn ${j === q.ans ? 'up sel' : j === i ? 'down' : 'ghost'}`; });
  el.querySelector('.cr-q').insertAdjacentHTML('beforeend', `<p class="note" style="margin:10px 0 0">${i === q.ans ? '答對了！' : `正解是 ${'ABC'[q.ans]}。`}${q.explain}（GM 預覽不存檔）</p>`);
}

/* ---------- 突發行情事件（真實收盤資料：單日漲跌 ≥ 3%） ---------- */
export function flashEvents() {
  const R = C.results(); if (!R || !R.results) return [];
  const t = C.tpe(), out = [];
  Object.keys(R.results).sort().reverse().forEach(d => ['tw', 'us'].forEach(m => {
    const r = R.results[d][m]; if (!r || Math.abs(r.pct) < 3) return; if (d === t.date && !C.settled(d, m)) return;
    out.push({ key: `${d}:${m}`, d, m, r });
  }));
  return out.slice(0, 12);
}
function flash(el) {
  const ev = flashEvents(), k = K(), gm = C.isGM(), top = ev[0];
  if (!ev.length) { el.innerHTML = '<div class="card coming"><b>最近沒有突發行情</b><p class="note" style="margin:6px 0 0">單日漲跌超過 3% 才會出現在這裡。</p></div>'; return; }
  const row = e => `<li class="${k.flash.includes(e.key) ? '' : 'here'}"><b>${md(e.d)}</b><span>${MKN[e.m]}${e.r.pct < 0 ? '跌' : '漲'} ${Math.abs(e.r.pct).toFixed(2)}%<br><small class="note">收 ${fmt(e.r.close)}（${e.r.chg >= 0 ? '+' : ''}${fmt(e.r.chg)} 點）</small></span><em class="st" style="color:${e.r.pct < 0 ? 'var(--down)' : 'var(--up)'}">${pctTxt(e.r.pct)}</em></li>`;
  const read = k.flash.includes(top.key);
  el.innerHTML = `<div class="card cr-flash ${top.r.pct < 0 ? 'dn' : 'upc'}"><span class="tag">突發行情</span>
      <h3 style="margin:8px 0 4px">${md(top.d)} ${MKN[top.m]}${top.r.pct < 0 ? '跌' : '漲'} ${Math.abs(top.r.pct).toFixed(2)}%</h3>
      <p style="margin:0">收 ${fmt(top.r.close)}，${top.r.chg >= 0 ? '漲' : '跌'} ${fmt(Math.abs(top.r.chg))} 點。</p>
      <p class="note" style="margin:8px 0 0">大波動的日子，先看清楚發生什麼，再回頭檢查自己的部位大小和停損計畫。這裡只記錄事實，不預測明天。</p>
      ${read ? '<p class="note" style="margin:8px 0 0">已讀</p>' : `<button type="button" class="btn primary" id="flRead" style="width:100%;margin-top:10px">看完了・薪水 +${REWARD_C.flash}</button>`}</div>
    <h3 style="margin:14px 0 4px;font-size:1rem">最近的大波動（單日漲跌 ≥ 3%）</h3><ol class="floors">${ev.map(row).join('')}</ol>
    <p class="note">資料：開獎用的同一份真實收盤資料。只做台股和美股。${gm ? 'GM 預覽：不存檔、不發薪水。' : ''}非投資建議。</p>`;
  const b = el.querySelector('#flRead');
  b && (b.onclick = () => { if (b.disabled || gmStop()) return; const kk = K(); if (kk.flash.includes(top.key)) return; b.disabled = true; kk.flash.push(top.key); pay(REWARD_C.flash, 1, b, `突發行情看完了，薪水 +${REWARD_C.flash}`); again(el, flash, 500); C.refreshHud(); });
}

/* ---------- 本週猜盤總榜（2 樓與 4 樓同一張榜、同一總分；只用真實玩家成績，不編造名單） ---------- */
export function fmtWeekMark(m) {
  if (!m || (!m.n && !m.pending)) return '—';
  if (!m.n && m.pending) return '已猜・待開獎';
  const core = `對 ${m.win | 0}／錯 ${m.lose | 0}`;
  return m.pending ? core + '・另有待開獎' : core;
}
export function weeklyBoard() {
  const pts = (C.weekPts && C.weekPts()) || 0, st = (C.guessStat && C.guessStat()) || {};
  const name = horseName(C.S);
  const marks = (C.weekMarks && C.weekMarks()) || { tw: { win: 0, lose: 0, n: 0, pending: 0 }, us: { win: 0, lose: 0, n: 0, pending: 0 } };
  // 現有 Supabase board 沒有本週猜盤欄位。未接通前不編造其他玩家，也不把空榜自己寫成第一名。
  const remote = (C.weekBoardRows && C.weekBoardRows()) || { hooked: false, rows: [], status: 'unhooked' };
  const rows = Array.isArray(remote.rows) ? remote.rows.filter(r => r && r.name) : [];
  const hooked = !!remote.hooked && remote.status !== 'offline' && remote.status !== 'unhooked';
  let pos = null, ahead = null;
  if (hooked && rows.length) {
    const i = rows.findIndex(r => r.me);
    pos = i >= 0 ? i + 1 : null;
    if (i > 0) ahead = rows[i - 1];
  }
  return { hooked, status: remote.status || (hooked ? 'ok' : 'unhooked'), me: { name, pts, me: true, streak: st.streak || 0, best: st.best || 0, rank: pos, tw: marks.tw, us: marks.us }, wk: C.weekKey && C.weekKey(), rows, pos, ahead };
}
function weekRowCells(r) {
  const tw = r.twLabel || fmtWeekMark(r.tw);
  const us = r.usLabel || fmtWeekMark(r.us);
  return `<span>台股 ${tw}</span><span>美股 ${us}</span><span>${r.pts | 0} 分</span>`;
}
export function weekBoardHTML(place) {
  const b = weeklyBoard();
  const where = place === 'f4' ? '四樓大廳螢幕' : '2 樓晨會室';
  const list = (b.hooked && b.rows.length)
    ? b.rows.slice(0, 10).map((r, i) => `<li data-rank="${i + 1}" class="${r.me ? 'is-me' : ''}"><i>${i + 1}</i><b>${C.esc(r.name)}</b>${weekRowCells(r)}</li>`).join('')
    : '<li class="uk-board__empty">還沒有人上榜</li>';
  const rankTxt = b.pos ? `第 ${b.pos} 名` : '名次 —';
  const gapTxt = (b.ahead && Number.isFinite(b.ahead.pts))
    ? `跟前一名差 ${Math.max(0, (b.ahead.pts | 0) - (b.me.pts | 0))} 分`
    : '跟前一名差 — 分';
  const note = b.status === 'offline'
    ? '榜單暫時連不上，先顯示自己的真實積分，不編造其他名次。開獎只用當天真實收盤。非投資建議。'
    : (b.hooked
      ? '每一列可見台股對錯、美股對錯和總分。只猜一個市場也能上榜。榜上只用捏臉後的牛馬名字，開獎用當天真實收盤。非投資建議。'
      : '這是唯一的猜盤總榜：同一週台股加權與那斯達克綜合指數（^IXIC）的對錯加進同一總分，只猜一個也能上榜。每一列可見台股對錯、美股對錯和總分。多人週榜還沒接上現有伺服器，先顯示你自己的真實成績，不拿假名字撐場面，空榜只寫還沒有人上榜，並附自己的分數與名次（或 —）。開獎用當天真實收盤。非投資建議。');
  return `<section class="uk-root uk-board" data-uk="week-board" aria-label="本週猜盤總榜">
    <header class="uk-board__bar"><small>${where}</small><b>本週猜盤總榜</b><span>2 樓與 4 樓同一張榜</span></header>
    <p class="uk-board__lead">同一週猜台股加權、那斯達克綜合指數（^IXIC），對錯分數加進同一總分。只猜其中一個也能上榜。每一列可見台股對錯、美股對錯和總分。榜上只用捏臉後的牛馬名字。</p>
    <ol class="uk-board__list" data-uk-board>${list}</ol>
    <div class="uk-board__me"><span>我的本週成績</span><b class="uk-board__name">${C.esc(b.me.name)}</b><b data-uk-week-rank>${rankTxt}</b><span data-uk-tw>台股 ${fmtWeekMark(b.me.tw)}</span><span data-uk-us>美股 ${fmtWeekMark(b.me.us)}</span><b data-uk-week-pts>總分 ${b.me.pts | 0}</b><b data-uk-streak>連對 ${b.me.streak || 0} 天</b><em data-uk-gap>${gapTxt}</em></div>
    <p class="uk-note">${note}</p>
  </section>`;
}
function leaderLocal(el) {
  el.innerHTML = weekBoardHTML('f2');
}


function exWs(el) {
  el.innerHTML = `<p style="margin:0">三個真實發生過的日子，看懂「個股可能倒、指數會換股」。</p>
    ${WALL_ST.map((e, i) => `<div class="card cr-ex" data-ex="${i}"><div class="row between"><span class="tag cyan">${e.date}</span><span class="tag">${e.big}</span></div>
      <h3 style="margin:8px 0 4px">${e.title}</h3><p style="margin:0">${e.body}</p>
      <p class="note" style="margin:8px 0 0">展廳筆記：${e.lesson}</p></div>`).join('')}
    <p class="note">僅供學習，非投資建議。</p>`;
}
function exVs(el) {
  const bar = (v, mx) => `<div class="cr-bar"><i style="width:${Math.min(100, Math.abs(v) / mx * 100)}%;background:${v < 0 ? 'var(--down)' : 'var(--up)'}"></i></div>`;
  el.innerHTML = `<p style="margin:0">同一天，個股和大盤差多少？</p>
    ${VS_WALL.map(w => { const mx = Math.max(Math.abs(w.stock.pct), Math.abs(w.index.pct)); return `<div class="card cr-vs"><span class="tag cyan">${w.date}</span>
      <div class="cr-vsrow"><b>${w.stock.name}</b><em style="color:var(--down)">${pctTxt(w.stock.pct)}</em></div>${bar(w.stock.pct, mx)}<p class="note" style="margin:2px 0 8px">收 ${w.stock.close}・${w.stock.why}</p>
      <div class="cr-vsrow"><b>${w.index.name}</b><em style="color:var(--down)">${pctTxt(w.index.pct)}</em></div>${bar(w.index.pct, mx)}<p class="note" style="margin:2px 0 0">收 ${w.index.close}</p>
      <p style="margin:10px 0 0">單一個股一天跌了 ${Math.abs(w.stock.pct).toFixed(2)}%，大約是指數的 ${(w.stock.pct / w.index.pct).toFixed(1)} 倍。</p></div>`; }).join('')}
    <p class="note">想看更多左右對照，去入門觀念館「為什麼大盤比個股好做」。僅供學習，非投資建議。</p>`;
}
export function dcaDemo(prices, amt = 10000) {
  const e = prices && Array.isArray(prices.etfs) && prices.etfs.find(x => x.code === '0050');
  const cl = e && e.close && typeof e.close === 'object' ? e.close : null; if (!cl) return null;
  const ds = Object.keys(cl).filter(d => Number.isFinite(cl[d])).sort(); if (ds.length < 30) return null;
  const buys = []; let prevM = '';
  ds.forEach(d => { const m = d.slice(0, 7); if (m !== prevM) { prevM = m; const px = cl[d], sh = Math.floor(amt / px); if (sh > 0) buys.push({ d, px, sh, cost: Math.round(sh * px) }); } });
  if (buys.length < 2) return null;
  const last = ds[ds.length - 1], lp = cl[last], sh = buys.reduce((a, b) => a + b.sh, 0), cost = buys.reduce((a, b) => a + b.cost, 0), val = Math.round(sh * lp);
  return { buys, last, lp, sh, cost, val, ret: (val - cost) / cost * 100, amt, from: ds[0] };
}
function exDca(el) {
  const r = dcaDemo(C.prices());
  if (!r) { el.innerHTML = `<div class="card coming"><span class="tag">示範</span><b style="display:block;margin-top:6px">0050 定期定額示範・準備中</b><p class="note" style="margin:6px 0 0">還沒有 0050 的真實歷史價，資料到位才會顯示，不用假數字。</p></div>`; return; }
  el.innerHTML = `<div class="card"><div class="row between"><b>0050 定期定額示範</b><span class="tag cyan">示範</span></div>
      <p class="note" style="margin:6px 0 0">假設每個月第一個交易日買 ${r.amt.toLocaleString('zh-TW')} 元的元大台灣50（0050），用零股買整數股。價格是真實收盤價，未計手續費與稅。</p></div>
    <ol class="floors cr-dca">${r.buys.map(b => `<li><b>${md(b.d)}</b><span>收盤 ${fmt(b.px)}<br><small class="note">買 ${b.sh} 股・${b.cost.toLocaleString('zh-TW')} 元</small></span><em class="st">${b.sh} 股</em></li>`).join('')}</ol>
    <div class="card"><div class="row between"><span>累積股數</span><b>${r.sh} 股</b></div>
      <div class="row between" style="margin-top:6px"><span>投入成本</span><b>${r.cost.toLocaleString('zh-TW')} 元</b></div>
      <div class="row between" style="margin-top:6px"><span>${md(r.last)} 收盤 ${fmt(r.lp)} 的市值</span><b>${r.val.toLocaleString('zh-TW')} 元</b></div>
      <div class="row between" style="margin-top:6px"><span>示範期間報酬</span><b style="color:${r.ret >= 0 ? 'var(--up)' : 'var(--down)'}">${pctTxt(r.ret)}</b></div></div>
    <p class="note">示範只有 ${r.buys.length} 個月，時間太短、不代表未來。定期定額的重點是紀律和時間，不是挑時機。僅供學習，非投資建議。</p>`;
}
function exMore(el) {
  el.innerHTML = `<div class="card coming"><b>模型實盤展廳</b><p class="note" style="margin:6px 0 0">準備中</p></div>
    <div class="card coming"><b>學員成果牆</b><p class="note" style="margin:6px 0 0">準備中</p></div>
    <p class="note">內容整理好才會公開，不放假數字。</p>`;
}

/* ---------- 4) 置入：大廳戰報看板（只連台股、美股固定戰報網址） ---------- */
function fmtClose(n) { return Number(n).toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function sessionLine(s) {
  if (!s) return '尚無收盤資料';
  const move = s.pct > 0 ? '上漲' : s.pct < 0 ? '下跌' : '平盤';
  return `收 ${fmtClose(s.close)}，${move} ${Math.abs(s.pct).toFixed(2)}%。`;
}
export function reportTickerHTML(rows, { day1 = false } = {}) {
  const item = (row) => {
    if (!row || !row.s) return `<a class="uk-ticker__row" href="${row && row.href || '#'}" target="_blank" rel="noopener"><em>尚無資料</em><span class="uk-ticker__mkt">${row && row.name || ''}</span><span class="uk-ticker__line">尚無收盤資料，不編造數字。</span></a>`;
    const s = row.s;
    const tag = s.closed ? `${s.label}・上一個交易日 ${s.date.slice(5).replace('-', '/')}` : s.label;
    const chg = `${s.pct > 0 ? '+' : ''}${s.pct.toFixed(2)}%`;
    return `<a class="uk-ticker__row" href="${row.href}" target="_blank" rel="noopener" data-mkt="${row.id}" data-go="${day1 ? 'report-link' : 'floor-4'}">
      <em>${tag}</em>
      <span class="uk-ticker__mkt">${row.name}</span>
      <span class="uk-ticker__val">${fmtClose(s.close)}</span>
      <span class="uk-ticker__chg">${chg}</span>
      <span class="uk-ticker__line">${sessionLine(s)}</span>
    </a>`;
  };
  return `<section class="uk-root uk-ticker" data-uk="f1-report" aria-label="今日戰報">
    <header class="uk-plaque"><small>一樓大廳</small><b>今日戰報</b></header>
    <p class="uk-f1__lead">${day1 ? '每天有新分析。第一天可見，不是必做；第二天起再上 4 樓看完整內容。' : '每天有新分析。點這一行上 4 樓看完整戰報。'}</p>
    ${rows.map(item).join('')}
    <p class="uk-note">學交易是學生存。平時靠紀律，恐慌時再進場有價資產。這不是進場指令，不保證獲利。休市會標明並附上一個交易日的日期與數字，不拿舊數字假裝今天。公開樓層只放台股與美股。非投資建議。</p>
  </section>`;
}
export function reportAnalysisHTML(rows) {
  const card = (row) => {
    const s = row.s;
    if (!s) return `<article class="uk-analysis__card" data-mkt="${row.id}"><em>${row.name}</em><b>${row.name}</b><p class="uk-analysis__sum">尚無收盤資料，不編造數字。</p></article>`;
    const dayTxt = s.date.slice(5).replace('-', '/');
    const tag = s.closed ? `${s.label}・上一個交易日 ${dayTxt}` : s.label;
    return `<article class="uk-analysis__card" data-mkt="${row.id}">
      <em>${tag}</em>
      <b>${row.name}</b>
      <p class="uk-analysis__meta"><span>${dayTxt}</span>　<span>${fmtClose(s.close)}</span>　<span>${s.pct > 0 ? '+' : ''}${s.pct.toFixed(2)}%</span></p>
      <p class="uk-analysis__sum">${sessionLine(s)}</p>
      <a class="uk-cta uk-cta--gold" href="${row.href}" target="_blank" rel="noopener">看完整戰報</a>
    </article>`;
  };
  return `<section class="uk-root uk-analysis" data-uk="f4-analysis" aria-label="今日分析已更新">
    <header class="uk-plaque"><small>四樓戰報樓</small><b>今日分析已更新</b></header>
    <p class="uk-f1__lead">台股、美股分開看。看完即可完成今日戰報任務。學交易是學生存：平時靠紀律，恐慌時再進場有價資產。這不是進場指令，不保證獲利。</p>
    <div class="uk-analysis__grid">${rows.map(card).join('')}</div>
    <p class="uk-note">休市顯示上一個交易日並標明日期。不做個股財報拆解。公開樓層只放台股與美股。非投資建議。</p>
  </section>`;
}
export function reportRows() {
  const R = C.PUBLIC_REPORTS || {};
  const session = C.lastSession || (() => null);
  const todayStr = C.today();
  return [
    { id: 'tw', name: MKT_TITLE.tw, href: R.tw, s: session('tw', todayStr) },
    { id: 'us', name: MKT_TITLE.us, href: R.us, s: session('us', todayStr) },
  ];
}
function warboard(el) {
  const paint = () => {
    if (!el.isConnected) return;
    const day1 = isDay1(C.S, C.today());
    el.innerHTML = reportTickerHTML(reportRows(), { day1 });
    if (!day1) {
      el.querySelectorAll('[data-go="floor-4"]').forEach(a => {
        a.addEventListener('click', ev => { ev.preventDefault(); C.goZone && C.goZone('reports'); });
      });
    }
  };
  el.innerHTML = '<p class="note">載入今日戰報…</p>';
  if (C.ensureResults) C.ensureResults().then(paint, paint); else paint();
}
function panicDay(el) {
  el.innerHTML = `<section class="uk-root uk-panic" data-uk="panic-day" aria-label="今日恐慌課">
    <header class="uk-plaque"><small>今日事件</small><b>今日恐慌課</b></header>
    <p class="uk-panic__lead">市場明顯動盪。先把觀念看完，不要跟著慌。</p>
    <p class="uk-panic__body">現在帶你去看生存課第三張「恐慌時再進場有價資產」，並看當天戰報。這不是進場訊號，也不保證這時買會賺。</p>
    <div class="uk-panic__actions">
      <button type="button" class="uk-cta uk-cta--gold" id="pkCard">去看第三張卡</button>
      <button type="button" class="uk-cta" id="pkRep">看今日戰報</button>
    </div>
    <p class="uk-note">沒先把紀律和觀念學起來，恐慌來了也只是跟著摔。非投資建議。</p>
  </section>`;
  const card = el.querySelector('#pkCard');
  card && (card.onclick = () => C.open && C.open('ac_intro', { card: 'sv3', panic: true }));
  const rep = el.querySelector('#pkRep');
  rep && (rep.onclick = () => C.goZone && C.goZone('reports'));
}

const IC = (p, c = '#3ef2ff') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">${p.replace(/STROKE/g, c)}</svg>`;
export const CAREER_PANELS = [
  { id: 'onboard', floor: 'lobby', name: '領取與拜師之路', kicker: '領模型・學知識・拜師' },
  { id: 'flash', floor: 'lobby', name: '突發行情', kicker: '真實收盤・單日漲跌 ≥ 3%' },
  { id: 'warboard', floor: 'lobby', name: '戰報看板', kicker: '台股・美股每日戰報' },
  { id: 'panic', floor: '_ui', name: '今日恐慌課', kicker: '生存課第三張・當日戰報' },

  { id: 'mynm', floor: '_ui', name: '捏自己的牛馬', kicker: '髮型・領帶・工牌顏色' },
  { id: 'offq', floor: 'f2', name: '下班複盤 1 題', kicker: '真實收盤出題', hidden: true }, // 這輪先不放公開選單，程式後備保留
  { id: 'ex_ws', floor: 'f8', name: '華爾街歷史展廳', kicker: '雷曼・GE・NVDA' },
  { id: 'ex_vs', floor: 'f8', name: '大盤比個股對比牆', kicker: '同一天差多少' },
  { id: 'ex_dca', floor: 'f8', name: '0050 定期定額示範', kicker: '示範・真實收盤價' },
  { id: 'ex_more', floor: 'f8', name: '模型實盤・學員成果', kicker: '準備中' },
];
export const CAREER_ICON = {
  onboard: IC('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="m9 9 2 2 4-4M9 15h6" stroke="STROKE"/>', '#ffc85a'),
  flash: IC('<path d="M13 2 5 14h6l-1 8 8-12h-6z" stroke="STROKE"/>', '#ff5468'),
  warboard: IC('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="m6 12 3-3 3 2 5-5" stroke="STROKE"/><path d="M9 20h6"/>'),
  mynm: IC('<circle cx="12" cy="9" r="5"/><path d="M5 21c1-4 4-6 7-6s6 2 7 6" stroke="STROKE"/>', '#ffc85a'),
  offq: IC('<path d="M18 14a6 6 0 1 1-7-9 5 5 0 0 0 7 9z" stroke="STROKE"/><path d="M4 20h16"/>', '#ffc85a'),
  ex_ws: IC('<path d="M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10M2 10l10-6 10 6z" stroke="STROKE"/>', '#ffc85a'),
  ex_vs: IC('<path d="M6 20V6M18 20v-9" stroke="STROKE"/><path d="M3 20h18"/>'),
  ex_dca: IC('<circle cx="12" cy="12" r="8"/><path d="M8 14l3-3 2 2 3-4" stroke="STROKE"/>', '#2fd38a'),
  ex_more: IC('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 12h8M12 8v8" stroke="STROKE"/>', '#9b7dff'),
};
export const RENDER_CAREER = { onboard, mynm, offq, flash, warboard, panic: panicDay, ex_ws: exWs, ex_vs: exVs, ex_dca: exDca, ex_more: exMore, leaderLocal };
export function careerTodos(floor) {
  if (!C || C.isGM()) return {};
  const k = K(), t = C.tpe(), ev = flashEvents();
  const cur = currentPath(C.S, C.today());
  const actionable = cur && cur.go && !cur.waiting && !cur.done && cur.id !== 'continue';
  const needReport = !isDay1(C.S, C.today()) && cur && (cur.id === 'reports' || cur.id === 'panic');
  return {
    onboard: floor === 'lobby' && actionable,
    warboard: floor === 'lobby' && needReport,
    flash: floor === 'lobby' && !!(ev[0] && !k.flash.includes(ev[0].key)),
    offq: false, // 這輪不在公開選單出現，也不掛紅點
  };
}
