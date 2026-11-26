import { toggleMusic, blip, preferMusicOn, isMusicOn } from './audio.js';
import { applyBrand, STAR_LOGO_UI, TOWER_NAME, EVENT_NAME, isCyber } from './brand.js';
import { encodeBackup, decodeBackup, applySnapshot, hasProgress } from './backup.js';
import { GM_HASH } from './gm.js';
import { SHOP, TABS, itemById, itemsInTab, cssHex } from './shop-catalog.js';
import { FIN_PANELS, FIN_ICON, RENDER_FIN, normFin, finTodos, initFin, finSync, marketResult, resultsInfo, ensureResults, tpe as tpeFin } from './fin.js';
import { DESK_LEVELS, DESK_ITEMS, DESK_DECOR, GUESS_WIN, GUESS_STREAK_STEP, GUESS_STREAK_CAP, WEEK_PT, normOffice, nextDesk, deskOf, itemUnlocked, guessPick, tipFor, decorOf, ownsDecor } from './office.js';
import { LAB_RENDER, LAB_ICON, initLab, labTodos } from './lab.js';
import { NPCS, npcsOn, questNpcsOn, questById, normQuests, pruneQuests, evalQuest, markClaimed, rewardText } from './quests.js';
export { SHOP };

/* ---------- 基本資料 ---------- */
import { GATE_HASH, SEALED } from './insider-data.js';
import { modelStates, encodeQual, last7, addDays, RULE_MIN, VALID_DAYS, LADDER, TARGET_DAYS, MASTER_DAYS } from './qual.js';
applyBrand();
const IG = 'https://instagram.com/wuz200200';
const LINE_OA = 'https://page.line.me/803kongz';
const LINE_OA_NAME = 'S.T.A.R 機構級交易系統';
// 公開戰報（陌生人也能看）；A股戰報與總控台只在 68 樓，連結加密在 insider-data.js
const PUBLIC_REPORTS = { tw: 'https://wuz5566tt-oss.github.io/tw-daily-report/', us: 'https://wuz5566tt-oss.github.io/nasdaq-daily-report/' };
const KEY = 'niuma-tower-v1';
const RANKS = [
  { name: '實習牛馬', xp: 0 }, { name: '正職牛馬', xp: 50 }, { name: '組長', xp: 150 },
  { name: '經理', xp: 350 }, { name: '總監', xp: 700 }, { name: '董事', xp: 1200 },
];
export const ICON = {
  checkin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8M8 12h5"/><path d="m9 16 2 2 4-4" stroke="#ffc85a"/></svg>',
  meeting: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><ellipse cx="12" cy="16" rx="8" ry="3"/><path d="m8 9 3-4 3 4" stroke="#ff5468"/><path d="m13 7 3 4 3-4" stroke="#2fd38a" transform="translate(-2 2)"/></svg>',
  fortune: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="5" y="3" width="14" height="18" rx="3"/><rect x="8" y="7" width="8" height="6" rx="1.5" stroke="#ffc85a"/><path d="M9 17h6"/></svg>',
  war: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="2" y="4" width="20" height="13" rx="2"/><path d="m5 13 4-4 3 3 5-5" stroke="#3ef2ff"/><path d="M9 21h6"/></svg>',
  elevator: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M12 3v18"/><path d="m7 10 1.5-2 1.5 2M14 8l1.5 2 1.5-2" stroke="#ffc85a"/></svg>',
  heroes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M7 4h10v5a5 5 0 0 1-10 0z" stroke="#ffc85a"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v3M8 20h8"/></svg>',
  review: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M18 14a6 6 0 1 1-7-9 5 5 0 0 0 7 9z" stroke="#ffc85a"/><path d="M4 20h16"/></svg>',
  boss: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M3 9h18l-2 11H5z"/><path d="m7 9 2-5 3 3 3-3 2 5" stroke="#ffc85a"/></svg>',
  hall: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5" stroke="#3ef2ff"/></svg>',
  library: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 5h4v15H4zM10 5h4v15h-4z"/><path d="m16 6 3.5-1 3 14-3.5 1z" stroke="#ffc85a"/></svg>',
  course: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c3 3 9 3 12 0v-5" stroke="#3ef2ff"/></svg>',
  arena: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M5 19 19 5M14 5h5v5" stroke="#ffc85a"/><path d="M5 5l5 5M19 19l-5-5"/></svg>',
  reports: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="2" y="4" width="9" height="7" rx="1.5"/><rect x="13" y="4" width="9" height="7" rx="1.5"/><rect x="7" y="13" width="10" height="7" rx="1.5" stroke="#3ef2ff"/></svg>',
  guide: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 5h16v11H9l-5 4z"/><path d="M9 10h6" stroke="#3ef2ff"/></svg>',
};
// 樓層：lobby＝一樓公開大廳（陌生人也看得到）；insider＝68 樓自己人專區（要暗號）
// slot＝在大廳的位置（立體版與平面版共用），兩層樓的格局相同
export const SLOTS = { A: [18, 74], B: [82, 74], C: [18, 55], D: [82, 55], E: [50, 74], F: [18, 37], G: [50, 37], H: [82, 37], J: [50, 58] };
// 樓層：need＝累積打卡天數門檻；pass＝要暗號
export const FLOORS = {
  lobby: { name: '1 樓・交易大廳', num: 1, need: 0 },
  f2: { name: '2 樓・晨會室', num: 2, need: 3 },
  f3: { name: '3 樓・訓練場', num: 3, need: 7 },
  f4: { name: '4 樓・戰報與榮譽牆', num: 4, need: 0 },
  f5: { name: '5 樓・目標值研究室', num: 5, need: TARGET_DAYS },
  f6: { name: '6 樓・交易實驗室', num: 6, need: 0 },
  f7: { name: '7 樓・個人交易室', num: 7, need: 0 },
  insider: { name: '68 樓・自己人專區', num: 68, pass: true },
};
const FLOOR_ORDER = ['insider', 'f7', 'f6', 'f5', 'f4', 'f3', 'f2', 'lobby'];
export const ZONES = [
  { id: 'checkin', floor: 'lobby', slot: 'A', name: '打卡櫃台', kicker: '每日上班', gold: true },
  { id: 'guide', floor: 'lobby', slot: 'B', name: '接引櫃台', kicker: '我的資格・新人報到', gold: true },
  { id: 'fortune', floor: 'lobby', slot: 'C', name: '心法籤機', kicker: '每日一籤', gold: true },
  { id: 'shop', floor: 'lobby', slot: 'D', name: '服裝店', kicker: '薪水換裝扮', gold: true },
  { id: 'directory', floor: 'lobby', slot: 'G', name: '樓層導覽', kicker: '各樓層開放狀態' },
  { id: 'backup', floor: '_ui', slot: 'A', name: '備份進度', kicker: '換機還原' },
  { id: 'guess', floor: 'f2', slot: 'D', name: '猜盤桌', kicker: '台股・美股猜漲跌' },
  { id: 'tea', floor: 'f2', slot: 'B', name: '咖啡吧', kicker: '晨會前來一杯', hidden: true },
  { id: 'leader', floor: 'f2', slot: 'G', name: '本週排行榜', kicker: '猜盤積分', gold: true },
  { id: 'kline', floor: 'f3', slot: 'C', name: '看K線猜下一根', kicker: '小遊戲' },
  { id: 'fakeout', floor: 'f3', slot: 'D', name: '躲假突破', kicker: '反應小遊戲', gold: true },
  { id: 'bag', floor: 'f3', slot: 'E', name: '訓練沙包', kicker: '連續來就對了', hidden: true },
  { id: 'tips', floor: 'f3', slot: 'G', name: '心法小提醒', kicker: '練完記一句' },
  { id: 'reports', floor: 'f4', slot: 'G', name: '戰報牆', kicker: '台股・美股每日戰報' },
  { id: 'heroes', floor: 'f4', slot: 'F', name: 'STAR史塔財商榮譽牆', kicker: 'STAR史塔財商', gold: true },
  { id: 'honor', floor: 'f4', slot: 'C', name: '職級榮譽牆', kicker: '升職之路', gold: true },
  { id: 'cta', floor: 'f4', slot: 'B', name: '私訊『成長』', kicker: '我的資格・加入自己人', gold: true },
  { id: 'target', floor: 'f5', slot: 'G', name: '目標值系統', kicker: '最高獎勵', gold: true },
  { id: 'cta5', type: 'cta', floor: 'f5', slot: 'B', flatSlot: 'E', name: '私訊『成長』', kicker: '領取目標值系統', gold: true },
  { id: 'labsim', floor: 'f6', slot: 'G', name: '參數實驗台', kicker: '拖動參數・看結構變化', gold: true },
  { id: 'labdrill', floor: 'f6', slot: 'D', name: '實戰演練', kicker: '進場・停損・目標評分', gold: true },
  { id: 'labwiki', floor: 'f6', slot: 'C', name: '概念圖鑑', kicker: '結構・流動性・二次突破' },
  { id: 'desk', floor: 'f7', slot: 'J', name: '我的工位', kicker: '用紙箱一路升到頂樓交易室', gold: true },
  { id: 'academy', floor: 'f7', slot: 'G', name: 'STAR史塔財商教室', kicker: 'STAR史塔財商', gold: true },
  { id: 'boss', floor: 'insider', slot: 'A', name: '掌門辦公室', kicker: '自己人專區', gold: true },
  { id: 'hall', floor: 'insider', slot: 'B', name: '執事堂', kicker: '公告與排程' },
  { id: 'library', floor: 'insider', slot: 'C', name: '藏經閣講義', kicker: '三卷九章', gold: true },
  { id: 'course', floor: 'insider', slot: 'D', name: 'STAR史塔財商教室入口', kicker: 'STAR史塔財商', gold: true },
  { id: 'review', floor: 'insider', slot: 'E', name: '下班複盤', kicker: '今日心得' },
  { id: 'arena', floor: 'insider', slot: 'F', name: '演武場', kicker: '實盤複盤', gold: true },
  { id: 'ireports', floor: 'insider', slot: 'G', name: '三市戰報室', kicker: 'A股戰報與總控台' },
  ...Object.keys(FLOORS).map(f => ({ id: 'lift_' + f, type: 'lift', floor: f, slot: 'H', name: '電梯', kicker: '各樓層' })),
];
const STATION_EXTRA = {
  reports: { title: '看戰報牆', close: '收起戰報牆', render: 'reports' },
  honor: { title: '看職級榮譽牆', close: '收起榮譽牆', render: 'honor' },
  cta: { title: '看我的資格', close: '收起資格說明', render: 'cta' },
  target: { title: '看目標值系統', close: '收起目標值系統', render: 'target' },
  library: { title: '看藏經閣講義', close: '收起講義', render: 'library' },
  arena: { title: '看演武場', close: '收起演武場', render: 'arena' },
};
const QUOTES = [
  '真正好用的東西，往往簡單到讓人不想承認',
  '多週期共振，才是真正敢下重注的時刻',
  '最痛苦的不是虧錢，是明知錯了還不願停手',
  '交易的盡頭不是技術，是概率',
  '方法之上，只有正期望加風控撐得住時間',
  '你不是不會方法，是你承受不了波動',
  '在山頂買入那不叫長期投資，那叫套牢',
  '止損不只是操作，止損是保命用的',
  '買在乏人問津，賣在人聲鼎沸',
  '市場不是慈善家',
  '市場最可怕的不是看錯方向，而是回不來',
  '虧一半之後，你要賺一倍才回得到原點',
  '你會緊張，是因為你正在面對不確定性',
  '穩定獲利的人，都是硬生生熬出來的',
  '卡住你的不是沒想通，是懂了卻做不到',
  '大周期是老闆，小周期只是打工的',
  '能賺多少，看你心裡扛不扛得住',
  '沒必要賺到最後一口',
  '市場做到最後，活著本身就是一種實力',
  '真正有用的東西，都很無聊',
  '每天就是等、看、忍，大部分人受不了',
  '最危險的時候，是所有人都忘記風險的時候',
  '只要你急著賺錢，你一定會放大風險',
  '交易到最後，拼的是這個人撐不撐得住',
  '知足，不亂追不屬於自己的行情',
  '認命，接受市場本來就不完美',
  '策略不等於執行，重點是做到',
  '大道至簡，盈虧同源',
];
const MARKETS = [{ id: 'tw', name: '台股' }, { id: 'us', name: '美股' }];
const MOODS = ['平靜', '開心', '焦慮', '後悔', '充實'];

ICON.directory = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h8M8 19h4" stroke="#3ef2ff"/></svg>';
ICON.kline = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M6 4v16M12 6v12M18 3v15"/><rect x="4.5" y="8" width="3" height="6" fill="#ff5468" stroke="#ff5468"/><rect x="10.5" y="9" width="3" height="5" fill="#2fd38a" stroke="#2fd38a"/><rect x="16.5" y="6" width="3" height="7" stroke="#ffc85a"/></svg>';
ICON.fakeout = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M3 9h18" stroke="#ffc85a" stroke-dasharray="3 2"/><path d="m3 17 5-4 4 2 3-9 2 10 4-2"/></svg>';
ICON.tips = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z" stroke="#ffc85a"/></svg>';
ICON.guess = ICON.meeting; ICON.leader = ICON.heroes; ICON.honor = ICON.elevator; ICON.cta = ICON.guide; ICON.ireports = ICON.reports;
ICON.target = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5" stroke="#ffc85a"/><circle cx="12" cy="12" r="1.5" fill="#ffc85a"/></svg>';
ICON.cta5 = ICON.guide;
ICON.shop = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M6 8 5 21h14L18 8M4 8h16"/><path d="M9 8a3 3 0 0 1 6 0" stroke="#ffc85a"/><path d="M9 13h3"/></svg>';
ICON.backup = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5" stroke="#3ef2ff"/></svg>';
Object.keys(FLOORS).forEach(f => ICON['lift_' + f] = ICON.elevator);
Object.assign(ICON, FIN_ICON, LAB_ICON);
ICON.quests = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M17 4v6M17 13v.5" stroke="#ffc85a" stroke-width="2.2"/></svg>';
ICON.desk = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 14h16v6H4z"/><path d="M8 14V8h8v6" stroke="#ffc85a"/><path d="M7 18h2M15 18h2"/></svg>';
ICON.academy = ICON.course;



/* ---------- GM 模式（?gm=1 + 通行證，進度與正式資料分開） ---------- */
const GM_SESSION = 'niuma-gm-v1';
let gm = null;
try { gm = JSON.parse(sessionStorage.getItem(GM_SESSION) || 'null'); } catch { gm = null; }
export const isGM = () => !!(gm && gm.on);
function writeGm(data) {
  gm = data;
  try { if (data) sessionStorage.setItem(GM_SESSION, JSON.stringify(data)); else sessionStorage.removeItem(GM_SESSION); } catch {}
}
function shopView() {
  if (isGM()) {
    if (!gm.eq || typeof gm.eq !== 'object') gm.eq = {};
    return { owned: SHOP.map(i => i.id), eq: gm.eq };
  }
  return shopState();
}
function blockGmProgress(msg = 'GM 模式不記錄打卡與進度，以免覆蓋正式資料') {
  if (!isGM()) return false;
  toast(msg);
  return true;
}

const shopState = () => {
  if (!S.shop || typeof S.shop !== 'object') S.shop = { owned: [], eq: {} };
  if (!Array.isArray(S.shop.owned)) S.shop.owned = [];
  if (!S.shop.eq || typeof S.shop.eq !== 'object') S.shop.eq = {};
  return S.shop;
};
const equipped = () => shopView().eq;
function wearAll() { world && world.setOutfit && world.setOutfit(equipped()); paintAvatars(); }
function paintAvatars() { document.querySelectorAll('[data-avatar]').forEach(a => { a.innerHTML = avatarSVG(equipped()); }); }


let shopTab = 'new';
function setPieces() {
  const st = shopState();
  const cur = itemById(st.eq.set);
  return cur && cur.pieces ? cur.pieces : null;
}
function matchSet(st) {
  for (const it of SHOP) {
    if (it.slot !== 'set' || !it.pieces) continue;
    if (Object.entries(it.pieces).every(([slot, id]) => st.eq[slot] === id)) return it.id;
  }
  return null;
}
function grantPieces(st, it) {
  if (!st.owned.includes(it.id)) st.owned.push(it.id);
  if (it.pieces) Object.values(it.pieces).forEach(id => { if (!st.owned.includes(id)) st.owned.push(id); });
}
function equipItem(st, it) {
  if (it.slot === 'set' && it.pieces) {
    Object.entries(it.pieces).forEach(([slot, id]) => { st.eq[slot] = id; });
    st.eq.set = it.id;
    return;
  }
  st.eq[it.slot] = it.id;
  const mid = matchSet(st);
  if (mid) st.eq.set = mid; else delete st.eq.set;
}
function unequipItem(st, it) {
  if (it.slot === 'set' && it.pieces) {
    Object.entries(it.pieces).forEach(([slot, id]) => { if (st.eq[slot] === id) delete st.eq[slot]; });
    delete st.eq.set;
    return;
  }
  if (st.eq[it.slot] === it.id) delete st.eq[it.slot];
  const mid = matchSet(st);
  if (mid) st.eq.set = mid; else delete st.eq.set;
}
function isOn(st, it) {
  if (it.slot === 'set') return st.eq.set === it.id || (it.pieces && Object.entries(it.pieces).every(([slot, id]) => st.eq[slot] === id));
  return st.eq[it.slot] === it.id;
}

/* ---------- 狀態 ---------- */
const pad = n => String(n).padStart(2, '0');
const dstr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => dstr(new Date());
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dstr(d); };
const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const fresh = () => ({ coins: 0, xp: 0, streak: 0, last: null, days: [], guesses: {}, fortune: null, reviews: {}, pref: {}, week: {}, claims: {}, vid: null, games: {}, shop: { owned: [], eq: {} }, bak: { seen: false, last: null, snooze: null, remindDays: 0 }, quests: normQuests(), fin: normFin(), office: normOffice() });
let S; try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { S = fresh(); }
const save = () => { if (isGM()) return; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };
if (!S.vid) { S.vid = String(100000 + Math.floor(Math.random() * 900000)); save(); }
const fixQuests = () => { S.quests = pruneQuests(normQuests(S.quests), today()); return S.quests; };
fixQuests();
S.fin = normFin(S.fin);
S.office = normOffice(S.office);
const QS = new URLSearchParams(location.search);
const realDays = () => new Set(S.days).size;
const effDays = () => Math.max(realDays(), QS.has('days') ? (+QS.get('days') || 0) : 0); // 隱藏測試參數 ?days=7
const floorOpen = f => isGM() ? true : (FLOORS[f].pass ? !!insiderLinks : effDays() >= FLOORS[f].need);
const weekKey = () => { const d = new Date(); const t = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)); return dstr(t); };
const weekPts = () => S.week[weekKey()] || 0;
function boardRows() {
  return [{ name: '你', pts: weekPts(), me: true, rank: 1 }];
}
function floorInfo() {
  return FLOOR_ORDER.map(f => { const F = FLOORS[f], open = floorOpen(f);
    return { id: f, num: F.num, name: F.name.split('・')[1], open, here: f === floor, status: open ? '已開放' : F.pass ? '需要暗號' : `再打卡 ${F.need - effDays()} 天解鎖` }; });
}
export const rankIndex = () => RANKS.reduce((a, r, i) => (S.xp >= r.xp ? i : a), 0);
const checkedToday = () => S.last === today();
const streakFromDays = () => {
  const set = new Set((S.days || []).filter(Boolean));
  const t = today(), y = yesterday();
  let cur = set.has(t) ? t : set.has(y) ? y : null;
  if (!cur) return 0;
  let n = 0;
  while (set.has(cur)) { n++; cur = addDays(cur, -1); }
  return n;
};
const streakNow = () => {
  const fromDays = streakFromDays();
  const stored = (S.last === today() || S.last === yesterday()) ? S.streak : 0;
  return Math.max(stored, fromDays);
};
if ((S.last === today() || S.last === yesterday()) && streakFromDays() > S.streak) {
  S.streak = streakFromDays();
  S.days = [...new Set((S.days || []).filter(Boolean))].sort().slice(-365);
  save();
}
const todos = () => ({
  checkin: !checkedToday(),
  guess: MARKETS.some(m => !(S.guesses[today()] || {})[m.id]),
  fortune: !(S.fortune && S.fortune.date === today()),
  review: !S.reviews[today()],
  quests: questReadyCount(floor) > 0,
  ...finTodos(floor),
  ...labTodos(floor),
});

/* ---------- 每層樓 NPC 任務 ---------- */
const paidItems = () => shopState().owned.filter(id => { const it = itemById(id); return it && it.price > 0; }).length;
const questCtx = () => ({ S, today: today(), days: realDays(), streak: streakNow(), rank: rankIndex(), paidItems: paidItems() });
function questReadyCount(f) {
  if (isGM() || !f) return 0;
  const c = questCtx();
  return npcsOn(f).filter(n => n.quest && evalQuest(n.quest, c).ready).length;
}
// 小遊戲當日紀錄（每日任務用）
function questLog(key, val, mode = 'max') {
  const q = fixQuests(), d = q.day[today()] || (q.day[today()] = {});
  d[key] = mode === 'add' ? (d[key] | 0) + val : Math.max(d[key] | 0, val);
}
const claiming = new Set();
// 給 3D 場景的 NPC 清單：pending＝還有未領任務（含 GM 預覽），ready＝可領取
function npcView(f) {
  const c = questCtx();
  return npcsOn(f).map(n => {
    const r = n.quest ? evalQuest(n.quest, c) : { got: true, ready: false };
    return { id: n.id, name: n.name, avatar: n.avatar, pose: n.pose, gender: n.gender, outfit: n.outfit, station: n.station || '', slot: n.slot || '', stand: n.stand || null, face: n.face != null ? n.face : null, pending: n.quest ? (isGM() || !r.got) : false, ready: !!(n.quest && !isGM() && r.ready) };
  });
}
let questFocus = null; // 點 3D NPC 時只顯示那一位的任務卡
let floor = 'lobby';
export const zonesOn = f => ZONES.filter(z => z.floor === f && !z.hidden);
const stationNpc = id => { const n = NPCS.find(x => x.station === id); return n ? n.id : null; };

/* ---------- 自己人暗號（只比對 SHA-256；連結用暗號加密，解得開才看得到） ---------- */
const GATE_SESSION = 'niuma-insider';
let insiderLinks = null;
const ub64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function sha256hex(t) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
async function unseal(phrase) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(phrase), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: ub64(SEALED.salt), iterations: SEALED.iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, true, ['decrypt']);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ub64(SEALED.iv) }, key, ub64(SEALED.ct));
  const raw = await crypto.subtle.exportKey('raw', key);
  try { sessionStorage.setItem(GATE_SESSION, btoa(String.fromCharCode(...new Uint8Array(raw)))); } catch {}
  return JSON.parse(new TextDecoder().decode(pt));
}
async function restoreInsider() {
  try {
    const k = sessionStorage.getItem(GATE_SESSION); if (!k) return false;
    const key = await crypto.subtle.importKey('raw', ub64(k), 'AES-GCM', false, ['decrypt']);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ub64(SEALED.iv) }, key, ub64(SEALED.ct));
    insiderLinks = JSON.parse(new TextDecoder().decode(pt)); return true;
  } catch { return false; }
}
async function tryPass(input) {
  const p = (input || '').trim().toUpperCase();
  if (!p || !(window.crypto && crypto.subtle)) return false;
  if (await sha256hex(p) !== GATE_HASH) return false;
  try { insiderLinks = await unseal(p); return true; } catch { return false; }
}
function lockInsider() { insiderLinks = null; try { sessionStorage.removeItem(GATE_SESSION); } catch {} }

/* ---------- 介面工具 ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let toastT;
export function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }
function coinBurst(from) {
  const target = $('#hudCoins').getBoundingClientRect();
  const r = from ? from.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
  for (let i = 0; i < 8; i++) {
    const c = document.createElement('i'); c.className = 'coinfly'; c.style.left = c.style.top = '0'; document.body.appendChild(c);
    const x0 = r.left + r.width / 2 + (Math.random() - .5) * 80, y0 = r.top + r.height / 2 + (Math.random() - .5) * 30;
    c.animate([{ transform: `translate(${x0}px,${y0}px) scale(.6)`, opacity: 0 }, { transform: `translate(${x0}px,${y0 - 40}px) scale(1)`, opacity: 1, offset: .3 }, { transform: `translate(${target.left}px,${target.top}px) scale(.5)`, opacity: .2 }], { duration: 900 + i * 60, easing: 'cubic-bezier(.5,0,.2,1)' }).onfinish = () => c.remove();
  }
}
function buildDock() {
  $('#dockTrack').innerHTML = `<button data-zone="quests">${ICON.quests}<span>任務</span></button>` + FIN_PANELS.filter(p => p.floor === floor).map(p => `<button data-zone="${p.id}" data-direct="1">${ICON[p.id]}<span>${p.name}</span></button>`).join('') + zonesOn(floor).map(z => `<button data-zone="${z.id}">${ICON[z.id]}<span>${z.name}</span></button>`).join('');
  $('#dockTrack').querySelectorAll('button').forEach(b => b.onclick = () => (b.dataset.zone === 'quests' || b.dataset.direct) ? openPanel(b.dataset.zone) : world && world.go(b.dataset.zone));
  $('#hudFloor').textContent = FLOORS[floor].name;
  document.body.dataset.floor = floor;
  refreshHud();
}
function refreshHud() {
  $('#hudCoins').textContent = isGM() ? '∞' : S.coins.toLocaleString('zh-TW');
  $('#hudRank').textContent = RANKS[rankIndex()].name;
  $('#hudStreak').textContent = streakNow();
  const td = todos();
  document.querySelectorAll('[data-zone]').forEach(el => {
    el.querySelectorAll('.dot, .new').forEach(d => d.remove());
    if (td[el.dataset.zone]) {
      const n = document.createElement('span');
      if (el.classList.contains('zlabel')) { n.className = 'new'; n.textContent = '●'; } else n.className = 'dot';
      el.appendChild(n);
    }
  });
  world && world.setRank && world.setRank(rankIndex(), RANKS[rankIndex()].name);
  world && world.refresh && world.refresh({ floors: floorInfo(), board: boardRows(), rank: rankIndex(), office: S.office });
  world && world.setNpcs && world.setNpcs(floor, npcView(floor)); // 3D 場景裡的任務 NPC（含可領標記）
  finSync(); // 排行榜同步（防抖、GM 不送、連不上也不影響）
}
function addXP(n, coins = 0, el) {
  if (isGM()) return;
  const before = rankIndex();
  S.xp += n; S.coins += coins; save();
  if (coins) coinBurst(el);
  if (rankIndex() > before) setTimeout(() => toast(`恭喜升職！你現在是「${RANKS[rankIndex()].name}」`), 900);
  refreshHud();
  maybeClaimFocused();
}

/* ---------- 面板 ---------- */

function buyDecor(id) {
  S.office = normOffice(S.office);
  const it = decorOf(id);
  if (!it) return { ok: false, why: 'no' };
  if (ownsDecor(S.office, it.id)) return { ok: false, why: 'owned' };
  if (!itemUnlocked(it, { days: realDays(), office: S.office })) return { ok: false, why: 'need' };
  const gm = isGM();
  if (gm) {
    S.office.decor.owned.push(it.id);
    if (it.kind === 'chair') S.office.decor.chair = it.id;
    toast(`GM 預覽：擺上「${it.name}」（不扣薪水）`);
    refreshHud();
    return { ok: true, gm: true };
  }
  if (blockGmProgress('GM 模式不能購買擺設')) return { ok: false, why: 'gm' };
  if ((S.coins | 0) < it.price) { toast('薪水不夠，先去打卡或完成任務'); return { ok: false, why: 'coins' }; }
  S.coins -= it.price;
  S.office.decor.owned.push(it.id);
  if (it.kind === 'chair') S.office.decor.chair = it.id;
  save();
  toast(`已擺上「${it.name}」，薪水 −${it.price}`);
  blip(1046);
  refreshHud();
  return { ok: true };
}
function equipDecorChair(id) {
  S.office = normOffice(S.office);
  const it = decorOf(id);
  if (!it || it.kind !== 'chair' || !ownsDecor(S.office, id)) return { ok: false, why: 'no' };
  S.office.decor.chair = id;
  if (isGM()) { toast(`GM 預覽：椅子換成「${it.name}」（不寫存檔）`); refreshHud(); return { ok: true, gm: true }; }
  if (blockGmProgress()) return { ok: false, why: 'gm' };
  save();
  toast(`工位椅子換成「${it.name}」`);
  refreshHud();
  return { ok: true };
}
function renderDesk(el) {
  S.office = normOffice(S.office);
  const off = S.office, cur = deskOf(off), nxt = nextDesk(off);
  const ctx = { days: realDays(), office: off };
  const items = DESK_ITEMS.map(it => {
    const ok = itemUnlocked(it, ctx);
    const on = off.slots[it.slot] === it.id;
    const btn = !ok ? `<span class="note">${it.how}</span>`
      : `<button type="button" class="btn ${on ? 'primary' : 'ghost'} sm" data-place="${it.id}" data-slot="${it.slot}">${on ? '展示中' : '放到工位'}</button>`;
    return `<div class="row between" style="margin-top:8px"><span>${it.name}${ok ? '' : '（未解鎖）'}</span>${btn}</div>`;
  }).join('');
  const gm = isGM();
  const upBtn = !nxt ? '<p class="note">已經是最高級「頂樓交易室」。金框與桌面就地升級，不用搬去 68 樓。</p>'
    : `<button type="button" class="btn primary" id="deskUp" style="width:100%">${gm ? 'GM 預覽升級為「' + nxt.name + '」（不扣薪水）' : '升級為「' + nxt.name + '」・薪水 ' + nxt.price}</button>`;
    const decorItems = DESK_DECOR.map(it => {
      const owned = ownsDecor(off, it.id);
      const unlocked = itemUnlocked(it, ctx);
      const needName = it.need && it.need.desk ? ((DESK_LEVELS[it.need.desk] || {}).name || '') : '';
      const equipped = it.kind === 'chair' && off.decor.chair === it.id;
      let action = '';
      if (owned && it.kind === 'chair') {
        action = equipped ? '<span class="tag">使用中</span>' : `<button type="button" class="btn ghost sm" data-equip="${it.id}">換成這個</button>`;
      } else if (owned) {
        action = '<span class="tag">已擺上</span>';
      } else if (!unlocked) {
        action = `<span class="note">需「${needName}」以上才能買</span>`;
      } else if (gm) {
        action = `<button type="button" class="btn primary sm" data-buy="${it.id}">GM 預覽購買（不扣薪水）</button>`;
      } else {
        action = `<button type="button" class="btn primary sm" data-buy="${it.id}">購買・薪水 ${it.price}</button>`;
      }
      return `<div class="decor-item${owned ? ' owned' : ''}" data-decor="${it.id}"><div class="row between"><b>${it.name}</b><span class="price">薪水 ${it.price}</span></div><p class="note" style="margin:6px 0 8px">${it.blurb}</p><div class="row between">${action}</div></div>`;
    }).join('');

  el.innerHTML = `<div class="card"><div class="row between"><b>我的工位</b><span class="tag">${cur.name}</span></div>
    <p class="note" style="margin:8px 0 0">${cur.blurb}</p>
    <p class="note" style="margin:8px 0 0">升級路線：${DESK_LEVELS.map(l => l.name).join(' → ')}。這是你自己的個人交易室；旁邊三位同期學員工位等級固定，方便你比較，不是全伺服器一人一桌。</p></div>
    ${upBtn}
    ${gm ? '<p class="note">GM 模式可以預覽每一級外觀，不會扣薪水、也不會存檔。</p>' : `<p class="note">目前薪水 ${S.coins}。升級只扣站內薪水，不能換現金。</p>`}
    <div class="card"><b>擺設格</b><p class="note" style="margin:6px 0 0">解鎖後可以把 STAR史塔財商獎盃、證書放到自己的桌子上。</p>${items}</div>
    <div class="card"><b>小擺設商店</b>
      <p class="note" style="margin:6px 0 8px">一次購買，買了就會出現在你的 3D 工位上。椅子三選一，換成新椅就會替掉預設椅；已買的椅子可免費換。只扣站內薪水，不能換現金。</p>
      <div class="decor-shop">${decorItems}</div>
      ${gm ? '<p class="note">GM 模式可以預覽擺設，不會扣薪水、也不會存檔。</p>' : ''}
    </div>
    <p class="note">同期學員是固定陳列的馬型 NPC，不是真實玩家名單。</p>`;
  const ub = el.querySelector('#deskUp');
  ub && (ub.onclick = () => {
    const n = nextDesk(S.office);
    if (!n) return;
    if (gm) { S.office.lv = n.lv; toast(`GM 預覽：工位看起來像「${n.name}」`); renderDesk(el); refreshHud(); return; }
    if (blockGmProgress('GM 模式不能升級工位')) return;
    if ((S.coins | 0) < n.price) { toast('薪水不夠，先去打卡或完成任務'); return; }
    S.coins -= n.price;
    S.office.lv = n.lv;
    save();
    toast(`工位升級為「${n.name}」，薪水 −${n.price}`);
    blip(1046);
    renderDesk(el);
    refreshHud();
  });
  el.querySelectorAll('[data-place]').forEach(b => b.onclick = () => {
    const it = DESK_ITEMS.find(x => x.id === b.dataset.place);
    if (!it || !itemUnlocked(it, { days: realDays(), office: S.office })) return;
    if (isGM()) { S.office.slots[it.slot] = S.office.slots[it.slot] === it.id ? '' : it.id; renderDesk(el); refreshHud(); return; }
    if (blockGmProgress()) return;
    S.office.slots[it.slot] = S.office.slots[it.slot] === it.id ? '' : it.id;
    save(); renderDesk(el); refreshHud();
  });
  el.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => {
    const r = buyDecor(b.dataset.buy);
    if (r && r.ok) { renderDesk(el); refreshHud(); }
  });
  el.querySelectorAll('[data-equip]').forEach(b => b.onclick = () => {
    const r = equipDecorChair(b.dataset.equip);
    if (r && r.ok) { renderDesk(el); refreshHud(); }
  });
}

const panel = $('#panel');
export function openPanel(id, opt) {
  if (typeof id === 'string' && !id.startsWith('npc:') && !(opt && opt.raw)) {
    const sid = stationNpc(id);
    if (sid) { openPanel('npc:' + sid, opt); return; }
  }
  const npcFocus = typeof id === 'string' && id.startsWith('npc:') ? NPCS.find(n => n.id === id.slice(4)) : null;
  questFocus = npcFocus ? npcFocus.id : null;
  const z = (npcFocus ? { id, type: 'quests', name: npcFocus.name, kicker: FLOORS[npcFocus.floor].name + '・在這裡完成' } : null) || ZONES.find(z => z.id === id) || (id === 'quests' ? { id, name: 'NPC 任務', kicker: FLOORS[floor].name } : null) || FIN_PANELS.find(p => p.id === id);
  if (!z) return;
  $('#panelKicker').textContent = z.kicker; $('#panelTitle').textContent = z.name;
  RENDER[z.type || id]($('#panelBody'), opt);
  panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false');
  const zp = document.getElementById('zonePrompt'); if (zp) zp.hidden = true;
  document.querySelectorAll('.dock button').forEach(b => b.classList.toggle('active', b.dataset.zone === id));
  world && world.onPanel && world.onPanel(true, id);
  blip(760);
}
export function closePanel() {
  const was = panel.classList.contains('open');
  panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true');
  document.querySelectorAll('.dock button').forEach(b => b.classList.remove('active'));
  was && world && world.onPanel && world.onPanel(false);
}
$('#panelClose').onclick = closePanel;
(() => { let y0 = null; panel.addEventListener('touchstart', e => { if (e.target.closest('.panel-head,.panel-grip')) y0 = e.touches[0].clientY; }, { passive: true });
  panel.addEventListener('touchend', e => { if (y0 !== null && e.changedTouches[0].clientY - y0 > 60) closePanel(); y0 = null; }); })();

const LOCK = '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#ffc85a" stroke-width="1.8" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/><circle cx="12" cy="16" r="1.4" fill="#ffc85a"/></svg>';
const comingCard = (title, note = '陸續更新中') => `<div class="card coming"><b>${title}</b><p class="note" style="margin:6px 0 0">${note}</p></div>`;
const ladderHTML = () => {
  const ri = rankIndex(), next = RANKS[ri + 1];
  const pct = next ? Math.round(((S.xp - RANKS[ri].xp) / (next.xp - RANKS[ri].xp)) * 100) : 100;
  return `<div class="card"><div class="row between"><span>目前職級</span><b style="color:var(--cyan);font-size:1.2rem">${RANKS[ri].name}</b></div>
    <div class="row between note" style="margin:8px 0 6px"><span>經驗值 ${S.xp}</span><span>${next ? `距離「${next.name}」還差 ${next.xp - S.xp}` : '已經登頂！'}</span></div><div class="bar"><i style="width:${pct}%"></i></div></div>
    <ol class="ladder">${RANKS.map((r, i) => `<li class="${i < ri ? 'got' : ''} ${i === ri ? 'cur' : ''}"><span>第 ${i + 1} 階・${r.name}</span><span>${r.xp} 經驗</span></li>`).join('')}</ol>
    <p class="note">升職方式：上班打卡 +10 起（連續越久越多）、晨會猜盤 +3、抽心法籤 +2、寫下班複盤 +5。猜中加分與各職級福利即將公開。</p>`;
};


let questTab = null;
let guiding = false;
async function goToQuestNpc(id) {
  const n = NPCS.find(x => x.id === id);
  if (!n || guiding) return;
  guiding = true;
  try {
    closePanel();
    if (n.floor !== floor) {
      if (!floorOpen(n.floor)) { toast('這層樓還沒解鎖'); return; }
      await ride(n.floor);
    }
    if (world && world.goNpc) world.goNpc(id);
    else openPanel('npc:' + id);
  } finally { guiding = false; }
}
function questCardHTML(n, r, { go = false, idAttr = '' } = {}) {
  const q = n.quest, daily = q.kind === 'daily';
  const pct = Math.round((r.prog / r.target) * 100);
  const btn = r.got ? `<button class="btn ghost sm" disabled>${daily ? '今天已領' : '已領取'}</button>`
    : r.ready ? `<button class="btn primary sm" data-claim="${q.id}">領取</button>`
    : (go ? `<button class="btn ghost sm" disabled>進行中</button>` : '');
  const goBtn = go ? `<button type="button" class="btn cyan sm" data-go-npc="${n.id}">前往</button>` : '';
  return `<div class="card" data-npc="${n.id}" data-action="${q.action || ''}"${idAttr}>
      <div class="row" style="align-items:flex-start;flex-wrap:nowrap">
        <div aria-hidden="true" style="flex:0 0 44px;height:44px;border-radius:12px;display:grid;place-items:center;font-size:1.6rem;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px var(--line)">${n.avatar}</div>
        <div style="flex:1;min-width:0"><div class="row between"><b>${n.name}</b><span class="tag${daily ? ' cyan' : ''}">${daily ? '每日任務' : '成就任務'}</span></div>
        <p class="note" style="margin:4px 0 0">「${n.line}」</p></div></div>
      <div class="row between" style="margin:10px 0 6px;flex-wrap:nowrap"><span>${q.title}</span><b style="color:var(--gold);white-space:nowrap">${r.prog}/${r.target}</b></div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <div class="row between" style="margin-top:10px"><span class="note">獎勵：${rewardText(q.reward)}</span><span class="row" style="gap:6px;flex-shrink:0">${goBtn}${btn}</span></div></div>`;
}
function refreshNpcQuestCard() {
  const el = document.getElementById('npcQuestCard');
  if (!el || !questFocus) return;
  const n = NPCS.find(x => x.id === questFocus); if (!n) return;
  const wrap = document.createElement('div');
  wrap.innerHTML = questCardHTML(n, evalQuest(n.quest, questCtx()), { idAttr: ' id="npcQuestCard"' });
  el.replaceWith(wrap.firstElementChild);
  bindQuestButtons(document.getElementById('panelBody'));
}
function maybeClaimFocused({ refreshCard = true, force = false } = {}) {
  if (isGM() || !questFocus) return false;
  if (!force && !panel.classList.contains('open')) return false;
  const n = NPCS.find(x => x.id === questFocus); if (!n || !n.quest) return false;
  const q = n.quest;
  if (claiming.has(q.id)) return false;
  const r = evalQuest(q, questCtx());
  if (!r.ready) return false;
  claiming.add(q.id);
  markClaimed(fixQuests(), q, today());
  const rw = q.reward || {};
  addXP(rw.xp | 0, rw.coins | 0);
  blip(1046);
  toast(`任務完成！${rewardText(rw)}`);
  if (refreshCard) refreshNpcQuestCard();
  setTimeout(() => claiming.delete(q.id), 600);
  return true;
}
function mountNpcAction(host, n, opt) {
  const act = (n.quest && n.quest.action) || '';
  host.dataset.action = act;
  if (act === 'rank') {
    host.innerHTML = `<div id="npcRank">${ladderHTML()}</div><div id="npcRankPunch"></div><p class="note">經驗來自打卡、心法、猜盤與複盤。達標後會在這裡自動發薪水。</p>`;
    RENDER.checkin(host.querySelector('#npcRankPunch'));
    return;
  }
  const fn = RENDER[act];
  if (fn) fn(host, opt);
  else host.innerHTML = '<p class="note">這項任務會隨著日常累積，達標後在這裡領取。</p>';
  const extra = STATION_EXTRA[n.station];
  if (extra && extra.render !== act && typeof RENDER[extra.render] === 'function') {
    const wrap = document.createElement('div');
    wrap.className = 'npc-station-extra';
    wrap.innerHTML = `<button type="button" class="btn ghost sm" data-station-extra="${extra.render}" style="width:100%;margin-top:8px">${extra.title}</button><div class="npc-station-body" hidden></div>`;
    host.appendChild(wrap);
    const btn = wrap.querySelector('[data-station-extra]'), body = wrap.querySelector('.npc-station-body');
    btn.onclick = ev => {
      ev.stopPropagation();
      const on = body.hidden;
      if (on && !body.dataset.ready) { RENDER[extra.render](body); body.dataset.ready = '1'; }
      body.hidden = !on;
      btn.textContent = on ? extra.close : extra.title;
    };
  }
}
function bindQuestButtons(el) {
  el.querySelectorAll('[data-qf]').forEach(b => b.onclick = ev => { ev.stopPropagation(); questTab = b.dataset.qf; renderQuests(el); });
  const qa = el.querySelector('#qAll'); qa && (qa.onclick = () => { questFocus = null; questTab = (NPCS.find(n => n.id === el.querySelector('[data-npc]')?.dataset.npc) || {}).floor || floor; $('#panelTitle').textContent = 'NPC 任務'; $('#panelKicker').textContent = FLOORS[questTab].name; renderQuests(el); });
  el.querySelectorAll('[data-go-npc]').forEach(b => b.onclick = ev => { ev.stopPropagation(); goToQuestNpc(b.dataset.goNpc); });
  el.querySelectorAll('.card[data-npc]').forEach(card => {
    card.onclick = ev => { if (ev.target.closest('button') || ev.target.closest('#npcAction')) return; if (questFocus === card.dataset.npc) return; goToQuestNpc(card.dataset.npc); };
  });
  el.querySelectorAll('[data-claim]').forEach(b => b.onclick = ev => {
    ev.stopPropagation();
    if (b.disabled) return;
    if (blockGmProgress('GM 模式只能預覽任務，不會發薪水')) return;
    const q = questById(b.dataset.claim);
    if (!q || claiming.has(q.id)) return;
    b.disabled = true; claiming.add(q.id);
    try {
      const r = evalQuest(q, questCtx());
      if (!r.ready) { toast(r.got ? '這個任務已經領過了' : '任務還沒完成'); return; }
      markClaimed(fixQuests(), q, today());
      const rw = q.reward || {};
      addXP(rw.xp | 0, rw.coins | 0, b);
      blip(1046);
      toast(`任務完成！${rewardText(rw)}`);
    } finally {
      setTimeout(() => { claiming.delete(q.id); if (el.isConnected && panel.classList.contains('open')) renderQuests(el); }, 600);
    }
  });
}
function academyCtaHTML() {
  return `<div class="card" style="margin-top:12px"><div class="row between"><b>想學完整版？來 STAR史塔財商</b><span class="tag">私訊「成長」</span></div>
    <p class="note" style="margin:8px 0 10px">課程介紹在 7 樓 STAR史塔財商教室。報名入口與全樓「私訊『成長』」相同，不會另開新網址。</p>
    <div class="row" style="gap:8px;flex-wrap:wrap">
      <button type="button" class="btn cyan sm" data-go-floor="f7">前往 7 樓教室</button>
      <button type="button" class="btn ghost sm" id="cpGrow">複製關鍵字「成長」</button>
      <a class="btn primary sm" href="${IG}" target="_blank" rel="noopener">前往 IG 私訊 @wuz200200</a>
    </div></div>`;
}
function bindAcademyCta(el) {
  const cp = el.querySelector('#cpGrow');
  cp && (cp.onclick = async ev => { ev.stopPropagation(); try { await navigator.clipboard.writeText('成長'); toast('已複製「成長」'); } catch { toast('請手動輸入「成長」'); } });
  el.querySelectorAll('[data-go-floor]').forEach(b => b.onclick = ev => { ev.stopPropagation(); const to = b.dataset.goFloor; closePanel(); if (floorOpen(to)) ride(to); else toast('這層樓還沒解鎖'); });
}
function renderLecturer(el, n) {
  el.innerHTML = `<div class="card"><div class="row" style="align-items:flex-start"><div aria-hidden="true" style="flex:0 0 44px;height:44px;border-radius:12px;display:grid;place-items:center;font-size:1.6rem;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px var(--line)">${n.avatar}</div>
    <div><b>${n.name}</b><p class="note" style="margin:6px 0 0">「${n.line}」</p><p class="note" style="margin:8px 0 0">${n.talk === 'classmate' ? '— 在 STAR史塔財商學到的。' : '— STAR史塔財商心法，出自董事長 LEO易凡 的教學精神。'}</p></div></div></div>
    ${academyCtaHTML()}
    <p class="note">薪水是站內虛擬點數，不能換現金。內容非投資建議。</p>`;
  bindAcademyCta(el);
}
function renderQuests(el, opt) {
  const gmv = isGM();
  const order = FLOOR_ORDER.slice().reverse();
  if (!gmv || !questTab || !FLOORS[questTab]) questTab = floor;
  const focusN = questFocus ? NPCS.find(n => n.id === questFocus) : null;
  if (focusN && focusN.talk && !focusN.quest) { renderLecturer(el, focusN); return; }
  if (focusN && !gmv) maybeClaimFocused({ refreshCard: false, force: true });
  const f = focusN ? focusN.floor : questTab, c = questCtx(), list = focusN ? (focusN.quest ? [focusN] : []) : questNpcsOn(f);
  const tabs = gmv && !focusN ? `<div class="shop-tabs" role="tablist">${order.map(id => `<button type="button" class="shop-tab${id === f ? ' on' : ''}" data-qf="${id}">${FLOORS[id].num}F</button>`).join('')}</div>` : '';
  const cards = list.map(n => questCardHTML(n, evalQuest(n.quest, c), { go: !focusN, idAttr: focusN ? ' id="npcQuestCard"' : '' })).join('');
  const intro = focusN
    ? (gmv ? '<p class="note" style="margin:0 0 4px">GM 預覽：可以在這裡看任務、試做動作，不會記錄進度、也不會發薪水。</p>' : '')
    : `<div class="card"><div class="row between"><b>${FLOORS[f].name}</b><span class="tag">${gmv ? 'GM 預覽' : '站內薪水'}</span></div>
    <p class="note" style="margin:8px 0 0">${gmv ? 'GM 模式可以預覽每一層的任務，點「前往」會走到站在櫃檯的 NPC，在對話裡直接做任務。不會記錄進度、也不會發薪水。' : '點任務或「前往」，角色會走到該任務的 NPC（就站在自己的櫃檯／機台），在對話裡直接完成並自動領薪水。每日任務每天換日重置，成就任務只能領一次。'}</p></div>`;
  el.innerHTML = `${intro}
    ${tabs}${cards || '<p class="note">這層樓的 NPC 還在路上。</p>'}
    ${focusN ? '<button class="btn ghost sm" id="qAll" style="width:100%">看這層全部任務</button><div id="npcAction" class="npc-action"></div>' : ''}
    <p class="note">薪水是站內虛擬點數，可在服裝店兌換裝扮；其他兌換內容即將公開。不能換現金。</p>`;
  if (focusN) mountNpcAction(el.querySelector('#npcAction'), focusN, opt);
  bindQuestButtons(el);
}

function renderShop(el) {
  const st = shopView();
  const tab = TABS.some(t => t.id === shopTab) ? shopTab : 'new';
  shopTab = tab;
  const list = itemsInTab(tab);
  const tabs = TABS.map(t => `<button type="button" class="shop-tab${t.id === tab ? ' on' : ''}" role="tab" aria-selected="${t.id === tab}" data-tab="${t.id}">${t.name}</button>`).join('');
  const cards = list.map(it => {
    const own = st.owned.includes(it.id) || (it.pieces && Object.values(it.pieces).every(id => st.owned.includes(id)));
    const on = isOn(st, it);
    const free = it.price === 0;
    const act = on ? '脫下' : own ? '穿上' : (free ? '免費領取' : `購買・${it.price.toLocaleString('zh-TW')}`);
    const price = own ? '已擁有' : (free ? (it.badge || '免費') : `${it.price.toLocaleString('zh-TW')} 薪水`);
    const badges = [
      it.badge ? `<em class="shop-badge free">${it.badge}</em>` : '',
      it.series === 'kline' ? `<em class="shop-badge kline">K線系列</em>` : '',
      it.series === 'yageo' ? `<em class="shop-badge yageo">國巨 2327</em>` : '',
      it.series === 'tsmc' ? `<em class="shop-badge tsmc">漲停 2330</em>` : '',
    ].join('');
    const sw = cssHex(it.look && it.look.color);
    const preview = it.series === 'yageo' ? `<div class="shop-preview yageo"><strong>國巨 2327</strong><em>跌停</em></div>`
      : it.series === 'tsmc' ? `<div class="shop-preview tsmc"><strong>台積電 2330</strong><em>漲停</em></div>` : '';
    return `<div class="shop-item${on ? ' on' : ''}${it.featured ? ' feat' : ''}${it.series === 'yageo' ? ' yageo' : ''}${it.series === 'tsmc' ? ' tsmc' : ''}" data-id="${it.id}">
      ${preview}
      <div class="shop-item-top"><i class="shop-swatch" style="background:${sw}"></i><b>${it.name}</b></div>
      ${badges ? `<div class="shop-badges">${badges}</div>` : ''}
      <span class="price${free && !own ? ' free' : ''}">${price}</span>
      <button class="btn ${own ? (on ? 'ghost' : 'cyan') : 'primary'} sm" data-shop="${it.id}">${act}</button>
    </div>`;
  }).join('');
  el.innerHTML = `<div class="card"><div class="row between"><b>服裝店</b><span class="tag">僅供裝扮</span></div>
    <p class="note" style="margin:8px 0 0">用薪水兌換裝扮，穿上或脫下都不會影響獎勵階梯或資格碼。各分類分開看，價錢由低到高。</p>
    <div class="row between" style="margin-top:8px"><span>你的薪水</span><b style="color:var(--gold)">${isGM() ? '∞' : S.coins.toLocaleString('zh-TW')}</b></div></div>
    <div class="shop-tabs" role="tablist">${tabs}</div>
    <div class="shop-grid">${cards || '<p class="note">這個分類暫時沒有商品。</p>'}</div>`;
  el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { shopTab = b.dataset.tab; renderShop(el); });
  const onTab = el.querySelector('.shop-tab.on');
  onTab && onTab.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'instant' });
  el.querySelectorAll('[data-shop]').forEach(b => b.onclick = ev => {
    const it = itemById(b.dataset.shop); if (!it) return;
    if (isGM()) {
      const st = shopView();
      if (isOn(st, it)) { unequipItem(st, it); toast(`已脫下「${it.name}」`); }
      else { equipItem(st, it); toast(`已穿上「${it.name}」`); }
      writeGm(gm); wearAll(); renderShop(el); return;
    }
    const st = shopState();
    const own = st.owned.includes(it.id) || (it.pieces && Object.values(it.pieces).every(id => st.owned.includes(id)));
    if (!own) {
      if (it.price > 0 && S.coins < it.price) { toast('薪水不夠，再去打卡賺一點吧'); return; }
      if (it.price > 0) S.coins -= it.price;
      grantPieces(st, it);
      equipItem(st, it); save(); blip(1046);
      toast(it.price === 0 ? `已免費領取「${it.name}」` : `已購買「${it.name}」`);
      if (it.price > 0) coinBurst(ev.target);
      refreshHud(); wearAll(); renderShop(el); maybeClaimFocused(); return;
    }
    if (isOn(st, it)) { unequipItem(st, it); toast(`已脫下「${it.name}」`); }
    else { equipItem(st, it); toast(`已穿上「${it.name}」`); }
    save(); wearAll(); renderShop(el);
  });
}
function bakReason(r) {
  return r === 'tampered' ? '這組備份碼被改過，無法還原'
    : r === 'old' ? '這組備份碼版本太舊，無法還原'
    : '這組備份碼無效，請檢查是否貼完整，或重新產生一組';
}
function markBakSnooze() { S.bak = Object.assign({ seen: false, last: null, snooze: null, remindDays: 0 }, S.bak || {}); S.bak.seen = true; S.bak.snooze = today(); S.bak.remindDays = realDays(); save(); }
function markBakDone() { markBakSnooze(); S.bak.last = today(); save(); }
function renderBackup(el) {
  el.innerHTML = `<div class="card"><div class="row between"><b>備份進度</b><span class="tag">換機用</span></div>
    <p class="note" style="margin:8px 0 10px">進度只存在這支手機。換手機或清除瀏覽器前，請先備份，再到新手機還原。</p>
    <button class="btn primary" id="mkBak" style="width:100%">備份進度</button>
    <textarea class="bak-code" id="bakCode" readonly hidden></textarea>
    <button class="btn ghost sm" id="cpBak" hidden style="margin-top:6px">複製備份碼</button></div>
    <div class="card"><b>還原進度</b>
      <p class="note">把備份碼貼在下面，確認後會覆蓋這支手機目前的進度。</p>
      <textarea class="bak-code" id="bakIn" placeholder="在這裡貼上備份碼"></textarea>
      <button class="btn cyan" id="doBak" style="width:100%">還原進度</button>
      <div class="bak-msg" id="bakMsg"></div>
      <div id="bakAsk" hidden style="margin-top:10px">
        <p>還原會覆蓋這支手機目前的進度，確定要還原嗎？</p>
        <div class="row" style="justify-content:center;gap:8px;flex-wrap:wrap;margin-top:8px">
          <button class="btn primary sm" id="bakYes">確定還原</button>
          <button class="btn ghost sm" id="bakNo">取消</button>
        </div>
      </div></div>`;
  const codeEl = el.querySelector('#bakCode'), cp = el.querySelector('#cpBak'), msg = el.querySelector('#bakMsg');
  const say = (txt, ok) => { msg.textContent = txt; msg.className = 'bak-msg ' + (ok ? 'ok' : 'bad'); };
  el.querySelector('#mkBak').onclick = async () => {
    if (blockGmProgress('GM 模式不能產生備份碼')) return;
    try {
      const code = await encodeBackup(S);
      codeEl.hidden = false; codeEl.value = code; cp.hidden = false; markBakDone(); say('備份碼已產生，請複製保存', true);
    } catch { say('這台裝置無法產生備份碼', false); }
  };
  cp.onclick = async () => { try { await navigator.clipboard.writeText(codeEl.value); toast('已複製備份碼'); } catch { toast('請長按備份碼複製'); } };
  let pending = null;
  const ask = el.querySelector('#bakAsk');
  el.querySelector('#doBak').onclick = async () => {
    if (blockGmProgress('GM 模式不能還原備份，以免覆蓋正式進度')) return;
    const raw = el.querySelector('#bakIn').value; ask.hidden = true; pending = null;
    const out = await decodeBackup(raw);
    if (!out.ok) { say(bakReason(out.reason), false); return; }
    pending = out.data;
    if (hasProgress(S)) { ask.hidden = false; say('請先確認是否覆蓋目前進度', true); return; }
    doRestore(out.data, say);
  };
  el.querySelector('#bakYes').onclick = () => { if (pending) doRestore(pending, say); ask.hidden = true; };
  el.querySelector('#bakNo').onclick = () => { pending = null; ask.hidden = true; say('已取消還原', true); };
}
function doRestore(data, say) {
  applySnapshot(S, data); fixQuests(); S.fin = normFin(S.fin); S.office = normOffice(S.office); save(); markBakDone(); refreshHud(); buildDock(); wearAll();
  say('進度已還原', true); toast('進度已還原');
}
function maybeRemind() {
  const b = S.bak || (S.bak = { seen: false, last: null, snooze: null, remindDays: 0 });
  if (b.snooze === today()) return;
  let show = false;
  if (!b.seen) show = true;
  else {
    const days = realDays();
    const age = b.last ? Math.round((Date.parse(today() + 'T00:00:00') - Date.parse(b.last + 'T00:00:00')) / 86400000) : 99;
    const milestone = days >= 7 && Math.floor(days / 7) > Math.floor((b.remindDays || 0) / 7);
    const stale = !b.last ? days >= 7 : age >= 7;
    if ((milestone || stale) && b.last !== today()) show = true;
  }
  if (!show) return;
  const tip = document.getElementById('bakTip'); if (!tip) return;
  tip.hidden = false;
  document.getElementById('bakNow').onclick = () => { tip.hidden = true; markBakSnooze(); openPanel('backup'); };
  document.getElementById('bakLater').onclick = () => { tip.hidden = true; markBakSnooze(); };
}

const RENDER = {
  checkin(el) {
    const done = checkedToday(), st = streakNow(), total = realDays();
    const broke = !done && S.last && S.last !== yesterday() && S.streak > 0;
    const cycle = done ? ((st - 1) % 7) + 1 : (st % 7) + 1;
    const days = Array.from({ length: 7 }, (_, i) => {
      const n = i + 1, isDone = done ? n <= cycle : n < cycle, isToday = n === cycle;
      return `<div class="day ${isDone ? 'done' : ''} ${isToday ? 'today' : ''} ${n === 7 ? 'big' : ''}"><b>第${n}天</b><div class="gift"></div><span style="font-size:.7rem">即將公開</span></div>`;
    }).join('');
    el.innerHTML = `
      <div class="card row between"><div><div class="note">連續打卡</div><div class="stat">${st}<small style="font-size:.9rem"> 天</small></div><div class="note" style="margin-top:2px">累積打卡 ${total} 天</div></div>
      <div style="text-align:right"><div class="note">累積薪水</div><div class="stat">${isGM() ? '∞' : S.coins.toLocaleString('zh-TW')}</div></div></div>
      <div class="punch"><button class="btn primary big" id="punch" ${done ? 'disabled' : ''}>${done ? '今天已打卡' : '上班打卡'}</button><div class="stamp ${done ? 'show' : ''}" id="stamp">已上班</div></div>
      <p class="note" style="text-align:center;margin:4px 0 0">${done ? '明天記得回來，斷簽就要重新累積喔' : broke ? `上次打卡是 ${S.last.slice(5).replace('-', '/')}，中間斷簽，連續天數已重新計算；累積天數和薪水都保留` : '每天打卡領薪水，連續七天有大禮'}</p>
      <h3 style="margin:16px 0 0;font-size:1rem">七日打卡獎勵 <span class="tag">即將公開</span></h3>
      <div class="track">${days}</div>
      <p class="note">薪水是站內虛擬點數，可在服裝店兌換裝扮；其他兌換內容即將公開。不能換現金。</p>`;
    const b = el.querySelector('#punch');
    b && (b.onclick = () => {
      if (blockGmProgress()) return;
      if (checkedToday() || b.disabled) return;
      b.disabled = true;
      const before = ['f2', 'f3'].filter(f => floorOpen(f));
      const prevStreak = streakNow();
      const y = S.last === yesterday() || prevStreak > 0;
      const wasBroke = !!S.last && !y && S.streak > 0;
      S.streak = y ? prevStreak + 1 : 1;
      S.last = today();
      S.days = [...new Set([...(S.days || []).filter(Boolean), today()])].sort().slice(-365);
      const c = ((S.streak - 1) % 7) + 1;
      el.querySelector('#stamp').classList.add('show'); blip(1046);
      addXP(10 + Math.min(S.streak, 7) * 2, 100 + c * 20, b);
      world && world.celebrate && world.celebrate('checkin');
      toast(wasBroke ? `打卡成功！薪水 +${100 + c * 20}（中間斷簽，連續天數重新計算）` : `打卡成功！薪水 +${100 + c * 20}`);
      const opened = ['f2', 'f3'].filter(f => floorOpen(f) && !before.includes(f));
      if (opened.length) setTimeout(() => toast(`恭喜！${FLOORS[opened[0]].name} 解鎖了`), 2700);
      setTimeout(() => RENDER.checkin(el), 700);
    });
  },
  fortune(el) {
    const has = S.fortune && S.fortune.date === today();
    el.innerHTML = `<div class="machine" id="mach"><div class="cab"><div class="win">${[12, 28, 44, 60, 76].map(l => `<i style="left:${l}%;animation-delay:${l * 3}ms"></i>`).join('')}</div><div class="slot"></div></div>
      <div class="slip ${has ? 'show' : ''}" id="slip">${has ? slipHTML(S.fortune.idx) : ''}</div></div>
      <div style="text-align:center;margin-top:8px"><button class="btn primary" id="draw" ${has ? 'disabled' : ''}>${has ? '今天已抽過，明天再來' : '搖一搖，抽今日心法'}</button></div>
      <p class="note" style="text-align:center">每日一籤，共 ${QUOTES.length} 籤，出自董事長 LEO易凡 的心法。</p>`;
    const b = el.querySelector('#draw');
    b && (b.onclick = () => {
      b.disabled = true; const m = el.querySelector('#mach'); m.classList.add('shake'); blip(660);
      world && world.celebrate && world.celebrate('fortune');
      setTimeout(() => {
        m.classList.remove('shake'); const idx = Math.floor(Math.random() * QUOTES.length);
        S.fortune = { date: today(), idx }; addXP(2, 0);
        const s = el.querySelector('#slip'); s.innerHTML = slipHTML(idx); requestAnimationFrame(() => s.classList.add('show')); blip(1175);
        b.textContent = '今天已抽過，明天再來';
      }, 1100);
    });
  },
  heroes(el) {
    const off = S.office, d = deskOf(off), st = off.guessStat || {};
    el.innerHTML = `<div class="card"><div class="row between"><b>STAR史塔財商榮譽牆</b><span class="tag">4 樓</span></div>
      <p class="note" style="margin:8px 0 0">這裡改掛 STAR史塔財商榮譽牆。週榜前十名上牆，要等伺服器有「本週猜盤」專屬榜之後才會列出真實玩家；現在先放你自己的成績，不編造名單、也不放未經證實的數字。</p></div>
      <div class="card"><div class="row between"><span>目前職級</span><b>${RANKS[rankIndex()].name}</b></div>
        <div class="row between" style="margin-top:8px"><span>工位</span><b>${d.name}</b></div>
        <div class="row between" style="margin-top:8px"><span>猜盤連對（最佳）</span><b>${st.streak || 0} 天（最佳 ${st.best || 0}）</b></div>
        <div class="row between" style="margin-top:8px"><span>本週猜盤積分</span><b>${weekPts()} 分</b></div></div>
      <p class="note">獎勵僅站內薪水，不能換現金。內容非投資建議。</p>`;
  },
  async guess(el) {
    const day = today();
    const raw = S.guesses[day] || (S.guesses[day] = {});
    await ensureResults();
    const meta = resultsInfo();
    const rows = MARKETS.map(m => {
      const pick = guessPick(raw[m.id]);
      const rec = raw[m.id] && typeof raw[m.id] === 'object' ? raw[m.id] : null;
      const r = marketResult(day, m.id);
      let reveal;
      if (!pick) reveal = '選一邊，先留下今天的看法。台北時間台股 14:00、美股等收盤資料出來後，依實際收盤開獎。';
      else if (rec && rec.settled) reveal = rec.win ? `已開獎：你猜「${pick === 'up' ? '看漲' : '看跌'}」，實際「${rec.settled === 'up' ? '收紅' : rec.settled === 'down' ? '收綠' : '平盤'}」，猜中了。` : `已開獎：你猜「${pick === 'up' ? '看漲' : '看跌'}」，實際「${rec.settled === 'up' ? '收紅' : rec.settled === 'down' ? '收綠' : '平盤'}」，沒猜中。平盤不算猜中。`;
      else if (r) reveal = `已選「${pick === 'up' ? '看漲' : '看跌'}」，收盤結果已到，可以開獎。`;
      else reveal = `已選「${pick === 'up' ? '看漲' : '看跌'}」，等真實收盤資料。`;
      return `<div class="card mkt"><h3>${m.name}</h3>
        <button class="btn up ${pick === 'up' ? 'sel' : ''}" data-m="${m.id}" data-v="up" ${pick ? 'disabled' : ''}>看漲</button>
        <button class="btn down ${pick === 'down' ? 'sel' : ''}" data-m="${m.id}" data-v="down" ${pick ? 'disabled' : ''}>看跌</button>
        <div class="reveal">${reveal}</div></div>`;
    }).join('');
    const ready = MARKETS.filter(m => {
      const rec = raw[m.id];
      const pick = guessPick(rec);
      return pick && !(rec && rec.settled) && marketResult(day, m.id);
    });
    const tip = tipFor(day);
    const st = (S.office.guessStat || {});
    el.innerHTML = `<p style="margin:0">晨會開始！猜猜今天台股、美股收盤是漲還是跌。只猜方向，不給點位，純粹練盤感。開獎用與「市場溫度計」同一套真實收盤資料，不編造數字。</p>${rows}
      ${ready.length ? `<button class="btn primary" id="gClaim" style="width:100%">開獎・領取薪水（${ready.length} 筆）</button>` : ''}
      <div class="card"><b>STAR史塔財商心法</b><p style="margin:8px 0 0">「${tip}」</p><p class="note" style="margin:8px 0 0">— 董事長 LEO易凡</p></div>
      <div class="card row between"><span>你本週積分</span><b class="stat" style="font-size:1.4rem">${weekPts()}</b></div>
      <p class="note">猜中一市場薪水 +${GUESS_WIN}；連對加成每段 +${GUESS_STREAK_STEP}，上限 +${GUESS_STREAK_CAP}。連對目前 ${st.streak || 0} 天（最佳 ${st.best || 0}）。開獎資料：${meta ? `${meta.source}，更新於 ${meta.updated}${meta.sample ? '（範例）' : ''}` : '讀取中或讀取失敗'}。平盤不算猜中。薪水是站內虛擬點數，不能換現金。非投資建議。</p>`;
    el.querySelectorAll('[data-v]').forEach(b => b.onclick = () => {
      const g = S.guesses[today()] || (S.guesses[today()] = {});
      if (guessPick(g[b.dataset.m])) return;
      g[b.dataset.m] = b.dataset.v;
      if (isGM()) { blip(880); RENDER.guess(el); return; }
      save(); addXP(3, 0); blip(880); RENDER.guess(el);
    });
    const cb = el.querySelector('#gClaim');
    cb && (cb.onclick = () => {
      if (blockGmProgress('GM 模式不能開獎領薪水')) return;
      const day2 = today();
      const g = S.guesses[day2] || (S.guesses[day2] = {});
      let wins = 0, n = 0, coins = 0;
      MARKETS.forEach(m => {
        const pick = guessPick(g[m.id]);
        const rec = g[m.id] && typeof g[m.id] === 'object' ? g[m.id] : null;
        const r = marketResult(day2, m.id);
        if (!pick || !r || (rec && rec.settled)) return;
        const win = pick === r.dir;
        g[m.id] = { pick, settled: r.dir, win, paid: 0 };
        n++; if (win) wins++;
      });
      if (!n) { toast('沒有可以開獎的盤'); return; }
      S.office = normOffice(S.office);
      const gs = S.office.guessStat;
      if (wins > 0) { gs.streak = (gs.streak | 0) + 1; gs.best = Math.max(gs.best | 0, gs.streak); }
      else gs.streak = 0;
      const bonus = wins ? Math.min(GUESS_STREAK_CAP, Math.max(0, (gs.streak - 1) * GUESS_STREAK_STEP)) : 0;
      coins = wins * GUESS_WIN + bonus;
      if (wins) S.week[weekKey()] = (S.week[weekKey()] || 0) + wins * WEEK_PT;
      addXP(0, coins, cb);
      toast(wins ? `開獎完成！猜中 ${wins} 筆，薪水 +${coins}${bonus ? `（含連對加成 +${bonus}）` : ''}` : '開獎完成，這次沒猜中。平盤也不算猜中。');
      refreshHud();
      RENDER.guess(el);
    });
  },
  leader(el) {
    el.innerHTML = `<div class="card row between"><span>你本週猜盤積分</span><b class="stat" style="font-size:1.5rem">${weekPts()} 分</b></div>
      <div class="card"><div class="row between"><span>連對天數</span><b>${(S.office.guessStat || {}).streak || 0} 天</b></div>
        <div class="row between" style="margin-top:8px"><span>最佳連對</span><b>${(S.office.guessStat || {}).best || 0} 天</b></div></div>
      <p class="note">積分在收盤開獎、猜中後才會加上（每市場 ${WEEK_PT} 分）。完整的多人週榜目前沒有對應的伺服器榜（現有榜是財富、預測擂台連勝／勝率、模擬資金），所以這裡只顯示你自己的成績，不會編造其他玩家。非投資建議。</p>`;
  },
  target(el) {
    const m = modelStates(S, today(), realDays()).find(x => x.id === 'target');
    const st = m.state === 0 ? `再打卡 ${m.short} 天` : m.state === 1 ? '可以登記領取' : m.state === 2 ? `有效・到期日 ${m.exp.replace(/-/g, '/')}` : m.state === 4 ? '可重新啟動' : '已到期';
    el.innerHTML = `<div class="card"><div class="row between"><b style="font-size:1.1rem">目標值系統</b><span class="tag">最高獎勵</span></div>
      <p style="margin:10px 0 0">目標值系統是「日K波動目標價」的量化重構版。畫面上的綠色與紅色線條，都是目標值演算會到的位置。</p>
      <p class="note" style="margin:8px 0 0">領取方式：累積打卡 ${TARGET_DAYS} 天後，按「產生資格碼」，再私訊給社群裡的助理小編審核。從登記那天起有效 ${VALID_DAYS} 天；續用與重新啟動見「領取與續用規則」。</p>
      <p class="note" style="margin:8px 0 0">以上僅供參考，不構成投資建議。</p>
      <div class="row between" style="margin-top:10px"><span>你的狀態</span><b>${st}</b></div></div>
      <div class="card"><b>範例圖</b>
        <div class="ex-ph"><span>即將公開</span></div>
        <p class="note">陸續更新中。</p></div>
      <button class="btn primary" id="toCta5" style="width:100%">去登記・私訊『成長』</button>`;
    el.querySelector('#toCta5').onclick = () => world ? world.go('cta5') : openPanel('cta5');
  },
  shop(el) { renderShop(el); },
  quests(el, opt) { renderQuests(el, opt); },
  ...RENDER_FIN,
  ...LAB_RENDER,
  backup(el) { renderBackup(el); },
  kline(el) { klineGame(el); },
  fakeout(el) { fakeoutGame(el); },
  tips(el) {
    el.innerHTML = `<p style="margin:0">每玩完一局訓練場小遊戲，就會送你一句董事長 LEO易凡 的心法。</p>
      <p class="note">心法共 ${QUOTES.length} 句，在遊戲結束時抽出。</p>`;
  },
  reports(el) { // 4 樓：台股、美股公開；A股在 68 樓
    const sp = seed => { let y = 20, d = ''; for (let i = 0; i <= 20; i++) { y = Math.max(4, Math.min(36, y + ((hash(seed + i) % 9) - 4))); d += `${i ? 'L' : 'M'}${i * 10},${y}`; } return `<svg class="spark" viewBox="0 0 200 40" preserveAspectRatio="none"><path d="${d}" fill="none" stroke="#3ef2ff" stroke-width="2"/></svg>`; };
    const a = (u, t, s, k) => `<a class="screen" href="${u}" target="_blank" rel="noopener"><div class="row between"><h3>${t}</h3><span class="tag cyan">打開</span></div>${sp(k)}<div class="note">${s}・線圖為示意</div></a>`;
    el.innerHTML = `<p style="margin:0">每天收盤後更新的多空戰報，點下去直接看。</p>
      <div class="screens" style="margin-top:12px">${a(PUBLIC_REPORTS.tw, '台股每日多空戰報', '每天收盤後更新', 'tw')}${a(PUBLIC_REPORTS.us, '美股（納斯達克）每日多空戰報', '美股收盤後更新', 'us')}
      <div class="screen lockedrow"><div class="row between"><h3>A股戰報</h3><span class="tag">68樓自己人專區</span></div><div class="note">搭電梯，輸入暗號上樓查看</div></div></div>
      <div class="card row between cta"><span>想加入自己人？私訊『成長』</span><a class="btn primary sm" href="${IG}" target="_blank" rel="noopener">前往 IG</a></div>`;
  },
  honor(el) { el.innerHTML = ladderHTML(); },
  cta(el) { guideHTML(el, true); },
  guide(el) { guideHTML(el, false); },
  directory(el) {
    el.innerHTML = `<p style="margin:0">${isGM() ? 'GM 預覽・全部樓層已開放' : `每天打卡累積天數，就能解鎖新樓層。你目前累積 <b style="color:var(--gold)">${effDays()}</b> 天。`}</p>${floorListHTML(false)}
      <button class="btn cyan" id="toLift" style="width:100%;margin-top:6px">走去電梯</button>${ladderBoardHTML()}`;
    el.querySelector('#toLift').onclick = () => world && world.go('lift_' + floor);
  },
  lift(el, err) {
    el.innerHTML = `<p style="margin:0">${isGM() ? 'GM 預覽・全部樓層已開放' : `要去哪一樓？累積打卡 <b style="color:var(--gold)">${effDays()}</b> 天。`}</p>${floorListHTML(true)}
      <form id="gateForm" class="card gate" autocomplete="off" ${err || el._showGate ? '' : 'hidden'}>
        <label class="note" for="pass">68 樓・請輸入自己人暗號</label>
        <div class="row" style="margin-top:6px"><input id="pass" class="passin ${err ? 'wrong' : ''}" type="password" autocapitalize="characters" spellcheck="false" placeholder="暗號"><button class="btn primary" type="submit">上樓</button></div>
        <div class="err">${err ? '暗號有誤，請向掌門確認' : ''}</div>
        <p class="note" style="margin:6px 0 0">還不是自己人？私訊「成長」申請開通。</p></form>
      ${insiderLinks ? '<button class="btn ghost sm" id="lockout" style="width:100%">登出自己人（這台裝置）</button>' : ''}`;
    el.querySelectorAll('[data-go]').forEach(b => b.onclick = () => {
      const f = b.dataset.go;
      if (f === 'insider' && !insiderLinks && !isGM()) { el._showGate = true; RENDER.lift(el); el.querySelector('#pass').focus(); return; }
      ride(f);
    });
    const f = el.querySelector('#gateForm');
    f.onsubmit = async e => {
      e.preventDefault(); const v = el.querySelector('#pass').value;
      const btn = f.querySelector('button'); btn.disabled = true; btn.textContent = '核對中';
      if (await tryPass(v)) { el._showGate = false; blip(1175); toast('暗號正確，歡迎自己人'); ride('insider'); }
      else { blip(330); RENDER.lift(el, true); el.querySelector('#pass').focus(); }
    };
    const lo = el.querySelector('#lockout'); lo && (lo.onclick = () => { lockInsider(); toast('已登出自己人'); floor === 'insider' ? ride('lobby') : RENDER.lift(el); });
  },
  /* ----- 68 樓・自己人專區 ----- */
  boss(el) {
    el.innerHTML = `<div class="card" style="text-align:center"><div class="ph-portrait"></div><b style="font-size:1.1rem">董事長 LEO易凡</b><div class="note">掌門辦公室</div></div>
      <h3 style="margin:14px 0 4px;font-size:1rem">本週掌門的話</h3>${comingCard('即將公開')}`;
  },
  hall(el) {
    el.innerHTML = `<p style="margin:0">執事堂負責公告、排程與自己人守則。</p>
      ${comingCard('公告與守則即將公開')}`;
  },
  library(el) {
    el.innerHTML = `<p style="margin:0">三卷九章講義，照順序讀。</p>${comingCard('講義即將公開')}`;
  },
  course(el) {
    el.innerHTML = `<div class="card"><div class="row between"><b>STAR史塔財商教室入口</b><span class="tag">68 樓</span></div>
      <p style="margin:8px 0 0">這裡從「傳功課程」改成 STAR史塔財商教室的入口。完整課程介紹在 7 樓教室，報名仍走全樓統一的私訊「成長」，不另開新網址。</p></div>
      ${academyCtaHTML()}
      <p class="note">內容非投資建議。</p>`;
    bindAcademyCta(el);
  },
  desk(el) { renderDesk(el); },
  academy(el) {
    el.innerHTML = `<div class="card"><div class="row between"><b>STAR史塔財商教室</b><span class="tag">7 樓</span></div>
      <p style="margin:10px 0 0">這裡是 7 樓的 STAR史塔財商教室。牆上會看到董事長 LEO易凡 的心法：先結構、再進場，先停損、再談目標。</p>
      <p class="note" style="margin:10px 0 0">教室提供課程介紹與報名入口。報名方式與全樓「私訊『成長』」相同。</p></div>
      ${academyCtaHTML()}
      <p class="note">內容非投資建議。薪水是站內虛擬點數，不能換現金。</p>`;
    bindAcademyCta(el);
  },
  arena(el) {
    el.innerHTML = `<p style="margin:0">演武場：實盤複盤片段，只看當時的判斷與結果，不帶單、不喊單。</p>${comingCard('即將公開')}`;
  },
  ireports(el) {
    const L = insiderLinks;
    if (!L && isGM()) { el.innerHTML = `<div class="card"><b>GM 預覽・自己人戰報</b><p class="note" style="margin:8px 0 0">這一區已開放預覽。正式的 A 股戰報與總控台連結仍要自己人暗號才會解開，GM 模式不會解開或改寫連結。</p></div>`; return; }
    if (!L) { el.innerHTML = `<div class="card">需要重新輸入暗號。</div>`; return; }
    const a = (u, t, s) => `<a class="screen" href="${u}" target="_blank" rel="noopener"><div class="row between"><h3>${t}</h3><span class="tag cyan">打開</span></div><div class="note">${s}</div></a>`;
    el.innerHTML = `<p style="margin:0">自己人專屬：A股戰報與公司總控台。台股、美股戰報在一樓也看得到。</p><div class="screens" style="margin-top:12px">
      ${a(L.cn, 'A股每日戰報', '交易日收盤後')}${a(L.twm, '台股盤前早報', '開盤前')}${a(PUBLIC_REPORTS.tw, '台股每日多空戰報', '每天收盤後更新')}${a(PUBLIC_REPORTS.us, '美股（納斯達克）每日多空戰報', '美股收盤後更新')}</div>
      <div style="text-align:center;margin-top:14px"><a class="btn cyan" href="${L.dash}" target="_blank" rel="noopener">打開公司總控台</a></div>`;
  },
  review(el) {
    const r = S.reviews[today()] || {};
    const hist = Object.keys(S.reviews).sort().reverse().slice(0, 7).filter(d => d !== today());
    el.innerHTML = `<p style="margin:0">下班前花一分鐘，寫下今天的盤後心得。只存在你自己的手機裡。</p>
      <div class="field"><label>今天的心情</label><div class="moods">${MOODS.map(m => `<button data-mood="${m}" class="${r.mood === m ? 'sel' : ''}">${m}</button>`).join('')}</div></div>
      <div class="field"><label for="rv1">今天做對的一件事</label><textarea id="rv1" maxlength="300">${esc(r.good || '')}</textarea></div>
      <div class="field"><label for="rv2">今天想改進的一件事</label><textarea id="rv2" maxlength="300">${esc(r.bad || '')}</textarea></div>
      <div class="field"><label for="rv3">明天的計畫</label><textarea id="rv3" maxlength="300">${esc(r.plan || '')}</textarea></div>
      <button class="btn primary" id="rvSave" style="width:100%">${S.reviews[today()] ? '更新今天的複盤' : '下班！存下複盤'}</button>
      ${hist.length ? `<div class="hist"><b>過去的複盤</b>${hist.map(d => `<div>${d.slice(5).replace('-', '/')}・${esc(S.reviews[d].mood || '')}・${esc((S.reviews[d].good || '').slice(0, 24))}</div>`).join('')}</div>` : ''}`;
    let mood = r.mood;
    el.querySelectorAll('[data-mood]').forEach(b => b.onclick = () => { mood = b.dataset.mood; el.querySelectorAll('[data-mood]').forEach(x => x.classList.toggle('sel', x === b)); });
    el.querySelector('#rvSave').onclick = e => {
      if (blockGmProgress()) return;
      const first = !S.reviews[today()];
      S.reviews[today()] = { mood, good: el.querySelector('#rv1').value, bad: el.querySelector('#rv2').value, plan: el.querySelector('#rv3').value };
      if (first) addXP(5, 30, e.target); else save();
      toast(first ? '辛苦了！下班複盤完成，薪水 +30' : '已更新今天的複盤'); RENDER.review(el);
    };
  },
};
function slipHTML(i) { return `<div class="no">第 ${i + 1}／${QUOTES.length} 籤・今日心法</div><p>${QUOTES[i]}</p><small>— 董事長 LEO易凡</small>`; }

/* ---------- 樓層清單 ---------- */
function floorListHTML(buttons) {
  return `<ol class="floors">${floorInfo().map(f => `<li class="${f.here ? 'here' : ''} ${f.open ? 'open' : 'locked'}">
    <b>${f.num}F</b><span>${FLOORS[f.id].name.split('・')[1]}</span>
    ${f.here ? '<em class="st here">你在這裡</em>' : f.open ? (buttons ? `<button class="btn cyan sm" data-go="${f.id}">前往</button>` : '<em class="st ok">已開放</em>')
      : f.id === 'insider' ? (buttons ? `<button class="btn ghost sm" data-go="insider">${LOCK_SM}輸入暗號</button>` : `<em class="st lock">${LOCK_SM}需要暗號</em>`)
      : `<em class="st lock">${LOCK_SM}${f.status}</em>`}</li>`).join('')}</ol>`;
}
const LOCK_SM = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" style="vertical-align:-2px;margin-right:3px"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

/* ---------- 我的資格（接引櫃台／4 樓） ---------- */
const STATE_TXT = ['未達資格', '可以登記領取', '有效', '已到期', '可重新啟動'];
function ladderBoardHTML() {
  const d = isGM() ? 9999 : realDays();
  return `<div class="card rladder"><div class="row between"><b style="font-size:1.05rem">獎勵階梯</b><span class="tag">${isGM() ? 'GM 預覽' : '由下往上越來越強'}</span></div>
    <ol>${LADDER.slice().reverse().map(r => { const ok = d >= r.need;
      return `<li class="${ok ? 'ok' : ''} ${r.best ? 'top' : ''} ${r.last ? 'last' : ''}"><span class="w">${r.where}</span><span class="n"><b><span class="ttl">${r.name}</span>${r.best ? '<em class="best">最高獎勵</em>' : ''}${r.last ? '<em class="lastb">最後一關</em>' : ''}</b><small>${r.rule}</small></span><span class="s">${ok ? '已解鎖' : `還差 ${r.need - d} 天`}</span></li>`; }).join('')}</ol>
    <p class="note">領取、續用與重新啟動的方式，見接引櫃台「我的資格」裡的「領取與續用規則」。</p></div>`;
}
function rulesCardHTML() {
  return `<div class="card rules" id="claimRules"><div class="row between"><b style="font-size:1.05rem">領取與續用規則</b><span class="tag">請先讀過</span></div>
    <ol>
      <li>要領取獎勵，請先按「產生資格碼」，再複製起來，私訊給社群裡的助理小編審核（聯絡方式以社群公告為準）。</li>
      <li>每項獎勵從登記日起有效 ${VALID_DAYS} 天。到期前請再送出一組新的資格碼；若沒有送出，視同未續用。</li>
      <li>${VALID_DAYS} 天到期時，未達資格的人（每 7 天打卡未滿 ${RULE_MIN} 天）會被移出群組。</li>
      <li>重新啟動：請繼續打卡，直到再次達到「7 天內打卡 ${RULE_MIN} 天以上」，再送出一組新的資格碼。審核通過後會加回群組，並重新起算 ${VALID_DAYS} 天。</li>
    </ol></div>`;
}
const lineOABtn = (cls = 'btn primary sm') => `<a class="${cls}" href="${LINE_OA}" target="_blank" rel="noopener">加官方 LINE</a>`;
function guideHTML(el, isCta) {
  const ms = modelStates(S, today(), isGM() ? 9999 : realDays()), l7 = last7(new Set(S.days), today());
  const master = ms.find(x => x.id === 'master');
  const masterSt = master.state === 0 ? `再打卡 ${master.short} 天可申請（累積 ${MASTER_DAYS} 天）` : master.state === 1 ? `累積 ${MASTER_DAYS} 天已達成，可以申請` : master.state === 2 ? `有效・到期日 ${master.exp.replace(/-/g, '/')}` : master.state === 4 ? '可重新啟動' : '已到期';
  const modelNote = m => m.state === 0 ? `再打卡 ${m.short} 天可領（累積 ${m.need} 天）`
    : m.state === 1 ? (m.need ? `累積 ${m.need} 天已達成，私訊「成長」後登記` : m.how)
    : m.state === 4 ? '已暫停，近 7 天已達標，可重新啟動'
    : `領取日 ${m.claim.replace(/-/g, '/')}${m.renew ? `・已續期 ${m.renew} 次` : ''}`;
  el.innerHTML = `<div class="card" style="text-align:center"><div class="note">第一天見面禮・私訊關鍵字</div><div class="kw">成長</div><div>私訊「成長」進群，就送「美指模型」</div>
      <div class="row" style="justify-content:center;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn ghost sm" id="cp">複製關鍵字</button><a class="btn primary sm" href="${IG}" target="_blank" rel="noopener">前往 IG 私訊 @wuz200200</a></div></div>
    ${ladderBoardHTML()}
    <div class="card qual"><div class="row between"><b style="font-size:1.05rem">我的資格</b><span class="tag cyan">訪客編號 ${S.vid}</span></div>
      <div class="qgrid"><div><small>累積打卡</small><b>${realDays()} 天</b></div><div><small>連續打卡</small><b>${streakNow()} 天</b></div><div><small>職級</small><b>${RANKS[rankIndex()].name}</b></div><div><small>近 7 天</small><b class="${l7 >= RULE_MIN ? 'ok' : 'warn'}">${l7}/7</b></div></div>
      <div class="qm s2"><div><b>台美股戰報</b><div class="note">4 樓，不用登記</div></div><div style="text-align:right"><span class="st">第一天就開放</span></div></div>
      ${ms.map(m => `<div class="qm s${m.state}"><div><b>${m.name}</b><div class="note">${modelNote(m)}</div></div>
        <div style="text-align:right">${m.state === 1 ? `<button class="btn primary sm" data-claim="${m.id}">登記領取</button>` : `<span class="st">${STATE_TXT[m.state]}</span>`}${m.state >= 2 ? `<div class="note">到期日 ${m.exp.replace(/-/g, '/')}</div>` : ''}</div></div>`).join('')}
      <div class="qual-actions">
        ${rulesCardHTML()}
        <div class="qcode"><small>資格碼</small><code id="qcode">請先按「產生資格碼」</code>
          <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn primary sm" id="genq">產生資格碼</button><button class="btn ghost sm" id="cpq" disabled>複製資格碼</button></div></div>
      </div></div>
    <div class="card master-cta" id="masterCta"><div class="row between"><b style="font-size:1.05rem">掌門面試收徒</b><span class="tag">最後一關</span></div>
      <p style="margin:10px 0 0">累積打卡 ${MASTER_DAYS} 天，取得面試拜師資格。請加官方 LINE「${LINE_OA_NAME}」，把資格碼傳給助理小編審核。</p>
      <div class="row between" style="margin:10px 0 12px"><span>你的狀態</span><b>${masterSt}</b></div>
      <div class="row" style="justify-content:center;gap:8px;flex-wrap:wrap">${master.state === 1 ? `<button class="btn ghost sm" data-claim="master">登記領取</button>` : ''}${lineOABtn('btn primary')}</div></div>
    <div class="card"><div class="row between"><b>備份與還原</b><span class="tag">換機用</span></div>
      <p class="note" style="margin:8px 0 10px">進度只存在這支手機。建議先備份，換手機再還原。</p>
      <button class="btn ghost" id="openBak" style="width:100%">打開備份進度</button></div>
    ${isCta ? '' : '<p class="note" style="text-align:center">打開 IG 後，私訊輸入「成長」就會收到；申請掌門面試請走官方 LINE。</p>'}`;
  el.querySelector('#cp').onclick = async () => { try { await navigator.clipboard.writeText('成長'); toast('已複製「成長」'); } catch { toast('請手動輸入「成長」'); } };
  const ob = el.querySelector('#openBak'); ob && (ob.onclick = () => openPanel('backup'));
  el.querySelectorAll('[data-claim]').forEach(b => b.onclick = () => { if (blockGmProgress('GM 模式不能登記領取')) return; S.claims[b.dataset.claim] = today(); save(); toast(`已登記領取，${VALID_DAYS} 天內有效`); guideHTML(el, isCta); });
  const q = el.querySelector('#qcode'), cpq = el.querySelector('#cpq'), genq = el.querySelector('#genq');
  const putCode = c => {
    q.textContent = c; cpq.disabled = false;
    cpq.onclick = async () => { try { await navigator.clipboard.writeText(c); toast('已複製資格碼'); } catch { toast('請長按資格碼複製'); } };
  };
  genq.onclick = () => {
    if (isGM()) { q.textContent = 'GM 模式不能產生資格碼'; toast('GM 模式不能產生資格碼'); return; }
    q.textContent = '產生中…'; cpq.disabled = true;
    encodeQual({ vid: S.vid, total: realDays(), streak: streakNow(), rank: rankIndex(), issued: today(), models: ms }).then(putCode)
      .catch(() => { q.textContent = '這個瀏覽器無法產生資格碼'; });
  };
}

/* ---------- 訓練場小遊戲 ---------- */
function tipCard() { const t = QUOTES[Math.floor(Math.random() * QUOTES.length)]; return `<div class="tipcard"><small>心法小提醒</small><p>${t}</p><small>— 董事長 LEO易凡</small></div>`; }
function rngCandles(n, seed) {
  let s = seed, p = 100; const r = () => (s = (s * 16807) % 2147483647) / 2147483647, out = [];
  for (let i = 0; i < n; i++) { const o = p, c = o + (r() - .5) * 6 + Math.sin(i / 3 + seed) * 1.2; out.push({ o, c, h: Math.max(o, c) + r() * 2.2, l: Math.min(o, c) - r() * 2.2 }); p = c; }
  return out;
}
function drawCandles(cv, cs, opts = {}) {
  const g = cv.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
  cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = '#04101e'; g.fillRect(0, 0, W, H);
  const all = cs.concat(opts.ghost ? [opts.ghost] : []); const hi = Math.max(...all.map(c => c.h), opts.line || -1e9) + 1, lo = Math.min(...all.map(c => c.l)) - 1;
  const y = v => 10 + (hi - v) / (hi - lo) * (H - 20), n = opts.slots || cs.length + 1, bw = W / n;
  g.strokeStyle = 'rgba(62,242,255,.08)'; for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(0, i * H / 5); g.lineTo(W, i * H / 5); g.stroke(); }
  if (opts.line) { g.setLineDash([6, 5]); g.strokeStyle = '#ffc85a'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, y(opts.line)); g.lineTo(W, y(opts.line)); g.stroke(); g.setLineDash([]); g.fillStyle = '#ffc85a'; g.font = `700 12px ${getComputedStyle(document.body).fontFamily}`; g.fillText('壓力線', 6, y(opts.line) - 6); }
  cs.forEach((c, i) => {
    const up = c.c >= c.o, x = i * bw + bw / 2, col = c.col || (up ? '#ff5468' : '#2fd38a');
    g.strokeStyle = col; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y(c.h)); g.lineTo(x, y(c.l)); g.stroke();
    g.fillStyle = col; const t = y(Math.max(c.o, c.c)), b = y(Math.min(c.o, c.c)); g.fillRect(x - bw * .32, t, bw * .64, Math.max(2, b - t));
  });
  if (opts.qmark) { const x = cs.length * bw + bw / 2; g.fillStyle = 'rgba(255,200,90,.9)'; g.font = `900 22px sans-serif`; g.textAlign = 'center'; g.fillText('？', x, H / 2); g.textAlign = 'left'; }
}
function klineGame(el) {
  const ROUNDS = 5; let round = 0, score = 0, seed = 1 + Math.floor(Math.random() * 1e6), cs = rngCandles(26, seed), shown = 18;
  el.innerHTML = `<div class="row between"><span class="tag">練習盤・隨機產生，不是真實行情</span><b id="kscore">第 1／${ROUNDS} 題・答對 0</b></div>
    <canvas class="kcv" id="kcv"></canvas>
    <p style="margin:6px 0;text-align:center">下一根 K 線會收紅還是收綠？</p>
    <div class="row" style="gap:8px"><button class="btn up" style="flex:1" data-k="up">收紅（漲）</button><button class="btn down" style="flex:1" data-k="down">收綠（跌）</button></div>
    <div id="kres" class="kres"></div>`;
  const cv = el.querySelector('#kcv'), draw = (q = true) => drawCandles(cv, cs.slice(0, shown), { slots: 24, qmark: q });
  requestAnimationFrame(() => draw());
  el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
    if (round >= ROUNDS) return; el.querySelectorAll('[data-k]').forEach(x => x.disabled = true);
    const nx = cs[shown], up = nx.c >= nx.o, ok = (b.dataset.k === 'up') === up; if (ok) score++;
    shown++; draw(false); blip(ok ? 1046 : 330); round++;
    el.querySelector('#kres').innerHTML = `<b class="${ok ? 'ok' : 'no'}">${ok ? '答對！' : '沒猜中'}</b>　這根${up ? '收紅' : '收綠'}`;
    el.querySelector('#kscore').textContent = `第 ${Math.min(round + 1, ROUNDS)}／${ROUNDS} 題・答對 ${score}`;
    setTimeout(() => {
      if (round < ROUNDS) { el.querySelectorAll('[data-k]').forEach(x => x.disabled = false); draw(); el.querySelector('#kres').innerHTML = ''; return; }
      const gain = score * 10; questLog('klinePlays', 1, 'add'); questLog('klineBest', score); addXP(score, gain); S.games = S.games || {}; const kg = S.games.kline = S.games.kline || { plays: 0, best: 0, total: 0 }; kg.plays++; kg.total += score; kg.best = Math.max(kg.best, score); save();
      el.querySelector('#kres').innerHTML = `<div class="card"><b>本局答對 ${score}／${ROUNDS}</b>　薪水 +${gain}<div class="note">隨機產生的 K 線本來就猜不準，這個遊戲練的是看圖習慣，不是預測。</div></div>${tipCard()}<button class="btn primary" id="again" style="width:100%">再玩一局</button>`;
      el.querySelector('#again').onclick = () => klineGame(el);
    }, 900);
  });
}
function fakeoutGame(el) {
  const ROUNDS = 8, LINE = 104; let round = 0, dodged = 0, fooled = 0, wrong = 0, rts = [], timer = 0, phase = 'ready', tFlash = 0, isFake = false;
  let cs = rngCandles(10, 7).map(c => ({ o: 98 + (c.o - 100) * .3, c: 98 + (c.c - 100) * .3, h: 98 + (c.h - 100) * .3, l: 98 + (c.l - 100) * .3 }));
  el.innerHTML = `<div class="row between"><span class="tag">練習盤・隨機產生</span><b id="fscore">躲過 0・被騙 0</b></div>
    <canvas class="kcv" id="fcv"></canvas><div id="fmsg" class="fmsg">K 線衝過壓力線後，如果又跌回來就是「假突破」，看到馬上按「躲！」<br>真突破就不要按。</div>
    <button class="btn primary big" id="fbtn" style="width:100%">開始</button><div id="fres"></div>`;
  const cv = el.querySelector('#fcv'), btn = el.querySelector('#fbtn'), msg = el.querySelector('#fmsg');
  const draw = () => drawCandles(cv, cs.slice(-12), { slots: 13, line: LINE });
  requestAnimationFrame(draw);
  const upd = () => el.querySelector('#fscore').textContent = `躲過 ${dodged}・被騙 ${fooled}${wrong ? `・誤躲 ${wrong}` : ''}`;
  function next() {
    if (!el.isConnected) return;
    if (round >= ROUNDS) return finish();
    round++; phase = 'rise'; isFake = Math.random() < .55; btn.textContent = '躲！'; btn.disabled = false;
    msg.textContent = `第 ${round}／${ROUNDS} 根・衝向壓力線…`;
    const o = cs[cs.length - 1].c, c = { o, c: o, h: o, l: o - .4 }; cs.push(c);
    const peak = LINE + 2 + Math.random() * 3, t0 = performance.now(), dur = 650 + Math.random() * 300;
    (function grow(t) {
      if (!el.isConnected) return;
      const k = Math.min(1, (t - t0) / dur); c.c = o + (peak - o) * k; c.h = Math.max(c.h, c.c); draw();
      if (k < 1) return requestAnimationFrame(grow);
      // 收盤：假突破跌回壓力線下，真突破站穩
      c.c = isFake ? LINE - 1.5 - Math.random() * 2 : peak - .3; c.col = null; draw();
      phase = 'judge'; tFlash = performance.now(); msg.innerHTML = isFake ? '<b class="no">跌回來了！</b>' : '<b class="ok">站穩了</b>';
      timer = setTimeout(() => { if (phase !== 'judge') return; if (isFake) { fooled++; msg.innerHTML = '<b class="no">被假突破騙了</b>'; } else msg.innerHTML = '<b class="ok">沒亂動，很好</b>'; phase = 'gap'; upd(); setTimeout(next, 650); }, 900);
    })(t0);
  }
  btn.onclick = () => {
    if (phase === 'ready' || phase === 'done') { round = dodged = fooled = wrong = 0; rts = []; el.querySelector('#fres').innerHTML = ''; upd(); next(); return; }
    if (phase === 'rise') { wrong++; msg.innerHTML = '<b class="no">太早了！還沒收盤</b>'; upd(); return; }
    if (phase !== 'judge') return;
    clearTimeout(timer); phase = 'gap';
    if (isFake) { dodged++; rts.push(performance.now() - tFlash); msg.innerHTML = `<b class="ok">躲過！</b> ${Math.round(rts[rts.length - 1])} 毫秒`; blip(1046); }
    else { wrong++; msg.innerHTML = '<b class="no">那是真突破，躲錯了</b>'; blip(330); }
    upd(); setTimeout(next, 650);
  };
  function finish() {
    phase = 'done'; btn.textContent = '再玩一局';
    const avg = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 0, gain = dodged * 8;
    questLog('fakeBest', dodged); addXP(dodged, gain); S.games = S.games || {}; const fg = S.games.fakeout = S.games.fakeout || { plays: 0, best: 0, dodged: 0 }; fg.plays++; fg.dodged += dodged; fg.best = Math.max(fg.best, dodged); save(); msg.textContent = '本局結束';
    el.querySelector('#fres').innerHTML = `<div class="card"><b>躲過 ${dodged}・被騙 ${fooled}・誤躲 ${wrong}</b>${avg ? `　平均反應 ${avg} 毫秒` : ''}<div class="note">薪水 +${gain}。遊戲是隨機產生的，練的是「等收盤再判斷」的習慣。</div></div>${tipCard()}`;
  }
}

/* ---------- 電梯（換樓層） ---------- */
let riding = false;
function rideOverlay(from, to) {
  const o = $('#ride'), num = $('#rideNum'), b = FLOORS[to];
  const n0 = FLOORS[from].num, n1 = b.num;
  $('#rideArrow').textContent = n1 > n0 ? '▲' : '▼'; $('#rideName').textContent = b.name;
  o.hidden = false; requestAnimationFrame(() => o.classList.add('show'));
  return new Promise(res => {
    const t0 = performance.now(), D = Math.min(1800, 900 + Math.abs(n1 - n0) * 60);
    (function tick(t) {
      const k = Math.min(1, (t - t0) / D), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      num.textContent = Math.round(n0 + (n1 - n0) * e);
      if (k < 1) requestAnimationFrame(tick); else res();
    })(t0);
  });
}
function hideRideOverlay() { const o = $('#ride'); o.classList.remove('show'); setTimeout(() => o.hidden = true, 400); }
async function ride(to) {
  if (riding || to === floor) return; riding = true; closePanel();
  if (!floorOpen(to)) { riding = false; toast('這層樓還沒解鎖'); return; }
  const from = floor;
  await world.ride(to, {
    async between() { await rideOverlay(from, to); floor = to; buildDock(); },
    after() { hideRideOverlay(); },
  });
  riding = false;
  toast(`歡迎來到 ${FLOORS[to].name}`);
}

/* ---------- 牛馬小人（平面版） ---------- */
function lookOf(slot, eq) { const it = itemById(eq[slot]); return it && it.look ? it.look : null; }
function klineMarks(x, y, pattern, n = 5) {
  if (!pattern || (pattern !== 'kline' && pattern !== 'kline-gold' && pattern !== 'green' && pattern !== 'yageo' && pattern !== 'tsmc')) return '';
  let s = '';
  for (let i = 0; i < n; i++) {
    const up = (pattern === 'green' || pattern === 'yageo') ? false : (pattern === 'tsmc' ? true : i % 3 !== 1);
    const fill = (pattern === 'green' || pattern === 'yageo') ? '#2fd38a' : (pattern === 'tsmc' || up) ? '#ff3a4c' : '#2fd38a';
    const h = 5 + (i % 3) * 3;
    s += `<rect x="${x + i * 4}" y="${y - (up ? h : 2)}" width="3" height="${h}" fill="${fill}"/>`;
  }
  return s;
}
function avatarSVG(eq = {}) {
  const jL = lookOf('jacket', eq), tL = lookOf('tie', eq), hL = lookOf('hat', eq), gL = lookOf('glasses', eq);
  const cL = lookOf('cape', eq), pL = lookOf('pants', eq), sL = lookOf('shoes', eq);
  const nL = lookOf('necklace', eq), wL = lookOf('watch', eq), rL = lookOf('ring', eq), eL = lookOf('earring', eq), hoL = lookOf('horns', eq);
  const jacket = jL ? cssHex(jL.color) : '#f2f5fb';
  const tie = tL ? cssHex(tL.color) : '#ffc85a';
  const horn = hoL ? cssHex(hoL.color) : '#f4e3c0';
  const cape = cL ? cssHex(cL.color) : '';
  const pants = pL ? cssHex(pL.color) : '#1d2640';
  const shoes = sL ? cssHex(sL.color) : '#111';
  const sleeve = jL ? jacket : '#e6ebf5';
  let hat = '';
  if (hL) {
    const hc = cssHex(hL.color);
    const sh = hL.shape;
    if (sh === 'candle') {
      const wick = cssHex(hL.color2 || 0xffe3a0);
      hat = `<rect x="41" y="-18" width="8" height="30" rx="1" fill="${hc}"/><rect x="43.5" y="-24" width="3" height="40" fill="${wick}"/>`;
    } else if (sh === 'cap') hat = `<rect x="18" y="2" width="54" height="12" rx="4" fill="${hc}"/><rect x="28" y="8" width="34" height="6" rx="2" fill="${hc}"/>`;
    else if (sh === 'beanie') hat = `<rect x="22" y="0" width="46" height="16" rx="8" fill="${hc}"/>`;
    else if (sh === 'beret') hat = `<ellipse cx="48" cy="8" rx="28" ry="9" fill="${hc}"/>`;
    else if (sh === 'bucket') hat = `<rect x="20" y="4" width="50" height="10" rx="3" fill="${hc}"/><rect x="14" y="12" width="62" height="5" rx="2" fill="${hc}"/>`;
    else if (sh === 'newsboy') hat = `<ellipse cx="45" cy="10" rx="26" ry="6" fill="${hc}"/><rect x="26" y="1" width="38" height="10" rx="6" fill="${hc}"/>`;
    else if (sh === 'wide' || sh === 'tophat') hat = `<ellipse cx="45" cy="${sh === 'tophat' ? 12 : 10}" rx="30" ry="6" fill="${hc}"/><rect x="28" y="${sh === 'tophat' ? -8 : 0}" width="34" height="${sh === 'tophat' ? 20 : 12}" rx="4" fill="${hc}"/>`;
    else if (sh === 'crown') hat = `<path d="M20 14 L28 2 L36 12 L45 0 L54 12 L62 2 L70 14 Z" fill="${hc}"/>`;
    else hat = `<ellipse cx="45" cy="10" rx="28" ry="7" fill="${hc}"/><rect x="24" y="0" width="42" height="12" rx="8" fill="${hc}"/>`;
  }
  const gStroke = gL ? cssHex(gL.color) : '#111';
  const gLens = gL && gL.lens ? cssHex(gL.lens) : '#111';
  const glasses = gL ? (gL.shape === 'round'
    ? `<circle cx="33" cy="26" r="7" fill="${gLens}" opacity=".75"/><circle cx="57" cy="26" r="7" fill="${gLens}" opacity=".75"/><path d="M40 26h10" stroke="${gStroke}" stroke-width="2"/>`
    : `<rect x="26" y="22" width="14" height="8" rx="${gL.shape === 'aviator' ? 6 : 2}" fill="${gLens}" opacity=".75"/><rect x="50" y="22" width="14" height="8" rx="${gL.shape === 'aviator' ? 6 : 2}" fill="${gLens}" opacity=".75"/><path d="M40 26h10" stroke="${gStroke}" stroke-width="2"/>`) : '';
  const neck = nL ? (nL.shape === 'thick'
    ? `<ellipse cx="45" cy="50" rx="12" ry="4" fill="none" stroke="${cssHex(nL.color)}" stroke-width="3"/>`
    : `<ellipse cx="45" cy="50" rx="11" ry="3.5" fill="none" stroke="${cssHex(nL.color)}" stroke-width="1.6"/>${nL.shape === 'pendant' ? `<circle cx="45" cy="55" r="2.4" fill="${cssHex(nL.color2 || nL.color)}"/>` : ''}`) : '';
  const watch = wL ? `<rect x="12" y="70" width="8" height="6" rx="1.5" fill="${cssHex(wL.color)}"/>` : '';
  const ring = rL ? `<circle cx="70" cy="80" r="2" fill="${cssHex(rL.color)}"/>` : '';
  const ear = eL ? `<circle cx="16" cy="28" r="2.2" fill="${cssHex(eL.color)}"/><circle cx="74" cy="28" r="2.2" fill="${cssHex(eL.color)}"/>` : '';
  const patJ = jL && jL.pattern ? (jL.pattern === 'yageo'
    ? `<text x="45" y="66" text-anchor="middle" font-size="10" font-weight="800" fill="#e9ffe9">國巨</text><text x="45" y="76" text-anchor="middle" font-size="9" font-weight="800" fill="#c8ffd8">2327</text><rect x="32" y="78" width="26" height="9" rx="3" fill="#2fd38a"/><text x="45" y="85" text-anchor="middle" font-size="6" font-weight="800" fill="#04180f">跌停</text>`
    : jL.pattern === 'tsmc'
    ? `<text x="45" y="66" text-anchor="middle" font-size="9" font-weight="800" fill="#fff6e8">台積電</text><text x="45" y="76" text-anchor="middle" font-size="8" font-weight="800" fill="#ffd68a">2330</text><rect x="32" y="78" width="26" height="9" rx="3" fill="#ff3a4c"/><text x="45" y="85" text-anchor="middle" font-size="6" font-weight="800" fill="#fff6e8">漲停</text>`
    : klineMarks(34, 66, jL.pattern)) : '';
  const patP = pL && pL.pattern ? klineMarks(32, 90, pL.pattern, 3) + klineMarks(49, 90, pL.pattern, 3) : '';
  const patS = sL && sL.pattern ? klineMarks(29, 102, sL.pattern, 3) + klineMarks(48, 102, sL.pattern, 3) : '';
  const patG = gL && gL.pattern ? klineMarks(28, 26, gL.pattern, 3) + klineMarks(52, 26, gL.pattern, 3) : '';
  const patW = wL && wL.pattern ? klineMarks(12, 72, wL.pattern, 2) : '';
  const tieShape = tL && tL.shape === 'bow' ? `<rect x="36" y="50" width="18" height="7" rx="2" fill="${tie}"/>` : `<path d="M45 50 l-5 6 5 22 5-22z" fill="${tie}"/>`;
  const vb = hL && hL.shape === 'candle' ? '0 -24 90 134' : '0 0 90 110';
  return `<div class="av-in"><svg viewBox="${vb}"><ellipse cx="45" cy="106" rx="22" ry="4" fill="#000" opacity=".35"/>
${cape ? `<path d="M22 52 q23 40 46 0 v36 q-23 16 -46 0z" fill="${cape}" opacity=".9"/>` : ''}
<rect x="31" y="78" width="11" height="22" rx="4" fill="${pants}"/><rect x="48" y="78" width="11" height="22" rx="4" fill="${pants}"/>
<rect x="29" y="98" width="15" height="8" rx="2" fill="${shoes}"/><rect x="46" y="98" width="15" height="8" rx="2" fill="${shoes}"/>
<rect x="24" y="48" width="42" height="36" rx="10" fill="${jacket}"/>${tieShape}<rect x="52" y="60" width="9" height="6" rx="1.5" fill="#3ef2ff"/>
<rect x="15" y="52" width="10" height="26" rx="5" fill="${sleeve}"/><rect x="65" y="52" width="10" height="26" rx="5" fill="${sleeve}"/>
${neck}${watch}${ring}
<path d="M22 18 q-12 -4 -14 -14 q10 4 18 8z" fill="${horn}"/><path d="M68 18 q12 -4 14 -14 q-10 4 -18 8z" fill="${horn}"/>
<ellipse cx="16" cy="28" rx="8" ry="4" fill="#8a5a33"/><ellipse cx="74" cy="28" rx="8" ry="4" fill="#8a5a33"/>${ear}
<rect x="20" y="10" width="50" height="40" rx="16" fill="#a8703f"/><rect x="28" y="32" width="34" height="18" rx="9" fill="#e9c49a"/>
<circle cx="37" cy="41" r="2.4" fill="#5b3a1e"/><circle cx="53" cy="41" r="2.4" fill="#5b3a1e"/><circle cx="34" cy="25" r="3.6" fill="#111"/><circle cx="56" cy="25" r="3.6" fill="#111"/><circle cx="35" cy="24" r="1.2" fill="#fff"/><circle cx="57" cy="24" r="1.2" fill="#fff"/>
${glasses}${patG}${hat}${patJ}${patP}${patS}${patW}</svg></div>`;
}
export const AVATAR_SVG = avatarSVG();

/* ---------- 平面版世界（2.5D，功能與樓層和立體版相同） ---------- */
function createFlat() {
  const root = $('#flat'), zonesEl = $('#flatZones'), av = $('#flatAvatar');
  root.hidden = false; document.body.classList.add('flat');
  paintAvatars();
  const draw = () => {
    root.dataset.floor = floor;
    $('#flatWallName').textContent = floor === 'lobby' ? '史塔金融大樓・交易大廳' : FLOORS[floor].name;
    zonesEl.innerHTML = zonesOn(floor).map(z => { const [x, y] = SLOTS[z.flatSlot || z.slot]; return `<button class="fzone ${z.gold ? 'gold' : ''} ${z.lock ? 'locked' : ''} ${z.slot === 'H' ? 'lift' : ''}" data-zone="${z.id}" style="left:${x}%;top:${y}%">${ICON[z.id]}${z.name}${z.lock ? '<em>僅限自己人</em>' : ''}</button>`; }).join('');
    zonesEl.querySelectorAll('.fzone').forEach(b => b.onclick = () => go(b.dataset.zone));
    refreshHud();
  };
  let pos = { x: 50, y: 90 };
  const place = p => { av.style.left = p.x + '%'; av.style.top = p.y + '%'; };
  place(pos);
  let busy = null;
  function walk(to) {
    return new Promise(res => {
      av.classList.toggle('flip', to.x < pos.x);
      const dist = Math.hypot((to.x - pos.x) * innerWidth / 100, (to.y - pos.y) * innerHeight / 100);
      const dur = Math.max(.3, dist / 260);
      av.style.transitionDuration = dur + 's'; av.classList.add('walking');
      requestAnimationFrame(() => place(to)); pos = to;
      setTimeout(() => { av.classList.remove('walking'); res(); }, dur * 1000);
    });
  }
  const spot = z => { const [x, y] = SLOTS[z.slot]; return { x: x + (x < 50 ? 10 : x > 50 ? -10 : 0), y: y + (x === 50 ? 9 : 5) }; };
  async function go(id) {
    const z = ZONES.find(z => z.id === id); closePanel();
    const tok = busy = {};
    await walk({ x: 50, y: 58 }); if (busy !== tok) return;
    await walk(spot(z)); if (busy !== tok) return;
    openPanel(id);
  }
  draw();
  const NPC_FLAT = [[28, 48], [72, 52], [36, 40]];
  async function goNpc(id) {
    const list = npcsOn(floor);
    const i = Math.max(0, list.findIndex(n => n.id === id));
    closePanel();
    const tok = busy = {};
    await walk({ x: 50, y: 58 }); if (busy !== tok) return;
    const [x, y] = NPC_FLAT[i % NPC_FLAT.length];
    await walk({ x, y }); if (busy !== tok) return;
    openPanel('npc:' + id);
  }
  return {
    kind: 'flat', go, goNpc,
    idle() { root.classList.add('intro'); },
    intro(caption) {
      return new Promise(res => {
        root.classList.add('intro'); requestAnimationFrame(() => root.classList.add('go'));
        caption('走進史塔金融大樓…');
        this._t = setTimeout(() => { this.enterDirect(); res(); }, 3000);
      });
    },
    enterDirect() { clearTimeout(this._t); root.classList.remove('intro', 'go'); draw(); pos = { x: 50, y: 90 }; place(pos); setTimeout(() => walk({ x: 50, y: 62 }), 50); },
    async ride(to, cb) {
      const lift = zonesEl.querySelector('.lift');
      const z = zonesOn(floor).find(z => z.slot === 'H');
      busy = {}; await walk({ x: 50, y: 58 }); await walk(spot(z));
      lift && lift.classList.add('closing'); await walk({ x: SLOTS.H[0], y: SLOTS.H[1] });
      av.style.opacity = 0;
      await cb.between();
      draw(); const lift2 = zonesEl.querySelector('.lift'); lift2 && lift2.classList.add('opening');
      pos = { x: SLOTS.H[0], y: SLOTS.H[1] }; av.style.transitionDuration = '0s'; place(pos);
      cb.after(); await new Promise(r => setTimeout(r, 250)); av.style.opacity = 1;
      await walk({ x: 50, y: 58 });
    },
    onPanel() {}, setRank() {}, celebrate() {},
    dispose() { root.hidden = true; document.body.classList.remove('flat'); root.classList.remove('intro', 'go'); },
  };
}

/* ---------- 模式判斷與切換 ---------- */
const qs = new URLSearchParams(location.search);
let world = null;
function weakDevice() {
  if (qs.has('force3d')) return false;
  const mem = navigator.deviceMemory, cores = navigator.hardwareConcurrency;
  if ((mem && mem <= 2) || (cores && cores <= 2)) return true;
  try { const c = document.createElement('canvas'); if (!(c.getContext('webgl2') || c.getContext('webgl'))) return true; } catch { return true; }
  return false;
}
function setModeLabel() {
  const flat = world && world.kind === 'flat';
  $('#modeLabel').textContent = flat ? '立體版' : '省電平面版';
  $('#btnMode').setAttribute('aria-label', flat ? '切換立體版' : '切換省電平面版');
}
const hooks = {
  go: id => world && world.go(id),
  open: id => openPanel(id),
  openNpc: id => openPanel('npc:' + id),
  stationNpc,
  floor: () => floor,
  outfit: () => equipped(),
  nearZone(z) {
    const b = document.getElementById('zonePrompt'); if (!b) return;
    if (!z || document.getElementById('panel').classList.contains('open')) { b.hidden = true; return; }
    b.hidden = false;
    if (z.id === 'desk' && world) {
      if (world.isSitting && world.isSitting()) {
        b.textContent = '起身';
        b.onclick = () => { world.standUp && world.standUp(); };
        return;
      }
      b.textContent = '坐下';
      b.onclick = () => { world.sitAtDesk && world.sitAtDesk(); };
      return;
    }
    b.textContent = z.id.startsWith('lift_') ? '打開電梯' : '打開' + z.name;
    b.onclick = () => world && world.go(z.id);
  },
  fallback(reason) { toast(reason || '已自動切換為省電平面版'); switchTo('flat', true); },
};
async function make(kind) {
  if (kind === 'flat') return createFlat();
  const m = await import('./scene3d.js');
  return m.create3D($('#gl'), { ...hooks, ZONES, ICON, autoFallback: !qs.has('force3d'), rank: () => [rankIndex(), RANKS[rankIndex()].name] });
}
let ready;
async function switchTo(kind, inLobby) {
  closePanel();
  if (world) { world.dispose(); world = null; }
  try { world = await make(kind); }
  catch (e) { console.warn('立體版啟動失敗，改用平面版', e); world = createFlat(); if (kind !== 'flat') toast('這台裝置跑不動立體版，已切換為省電平面版'); }
  setModeLabel(); buildDock();
  if (inLobby) { world.enterDirect(); showLobbyUI(); } else world.idle();
}
function showLobbyUI() {
  $('#start').classList.add('hide'); $('#introBar').hidden = true; $('#hud').hidden = false; $('#dock').hidden = false;
  const joy = document.getElementById('joy');
  if (joy) joy.hidden = !(world && world.kind === '3d');
  document.body.classList.toggle('play3d', !!(world && world.kind === '3d'));
  wearAll();
  setTimeout(maybeRemind, 700);
}
function bindJoy() {
  const root = document.getElementById('joy'); if (!root) return;
  const knob = document.getElementById('joyKnob');
  let pid = null, cx = 0, cy = 0;
  const apply = (x, y) => {
    const l = Math.hypot(x, y), m = l > 40 ? 40 / l : 1, nx = x * m / 40, ny = y * m / 40;
    knob.style.transform = `translate(${nx * 34}px,${ny * 34}px)`;
    world && world.setSteer && world.setSteer(nx, -ny);
  };
  const end = e => { if (pid == null || (e && e.pointerId !== pid)) return; pid = null; apply(0, 0); knob.style.transform = ''; };
  root.addEventListener('pointerdown', e => { pid = e.pointerId; const r = root.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; root.setPointerCapture(pid); apply(e.clientX - cx, e.clientY - cy); e.preventDefault(); });
  root.addEventListener('pointermove', e => { if (e.pointerId !== pid) return; apply(e.clientX - cx, e.clientY - cy); });
  root.addEventListener('pointerup', end); root.addEventListener('pointercancel', end);
}
bindJoy();
const shopBtn = document.getElementById('btnShop'); shopBtn && (shopBtn.onclick = () => openPanel('shop'));
const bakBtn = document.getElementById('btnBak'); bakBtn && (bakBtn.onclick = () => openPanel('backup'));
const skip = async () => { await ready; world.skipIntro ? world.skipIntro() : world.enterDirect(); showLobbyUI(); };

$('#btnStart').onclick = async () => {
  await ready;
  $('#start').classList.add('hide'); $('#introBar').hidden = false;
  await world.intro(t => $('#introCaption').textContent = t);
  showLobbyUI();
};
$('#btnDirect').onclick = skip;
$('#btnSkip').onclick = skip;
$('#btnMode').onclick = async () => {
  await ready;
  const toFlat = world.kind !== 'flat';
  S.pref.flat = toFlat; save();
  ready = switchTo(toFlat ? 'flat' : '3d', true);
  toast(toFlat ? '已切換為省電平面版' : '已切換為立體版');
};
function syncMusicBtn(playing) {
  $('#btnMusic').classList.toggle('on', !!playing);
  $('#musicLabel').textContent = playing ? '音樂開' : '音樂';
}
$('#btnMusic').onclick = () => {
  const on = toggleMusic();
  S.pref.music = on;
  save();
  syncMusicBtn(on);
};
if (S.pref.music !== false) {
  syncMusicBtn(true);
  preferMusicOn(() => syncMusicBtn(true));
} else syncMusicBtn(false);

const startFlat = qs.has('flat') || (!qs.has('force3d') && (S.pref.flat === true || (S.pref.flat == null && weakDevice())));

function syncGmUi() {
  let badge = document.getElementById('gmBadge');
  if (isGM()) {
    document.body.classList.add('gm');
    if (!badge) {
      const host = document.querySelector('.hud-left') || document.getElementById('hud');
      badge = document.createElement('div');
      badge.id = 'gmBadge';
      badge.className = 'chip gm-badge';
      badge.innerHTML = '<b>GM 董事長</b><small>董事長 LEO易凡</small><button type="button" class="btn ghost sm" id="gmOut">GM 登出</button>';
      host && host.appendChild(badge);
      document.getElementById('gmOut').onclick = logoutGm;
    }
  } else {
    document.body.classList.remove('gm');
    badge && badge.remove();
  }
  refreshHud();
  buildDock();
  wearAll();
  if (world && world.refresh) world.refresh({ floors: floorInfo(), board: boardRows(), rank: rankIndex(), office: S.office });
}
function logoutGm() {
  const here = floor;
  writeGm(null);
  try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch {}
  fixQuests();
  S.fin = normFin(S.fin);
  syncGmUi();
  toast('已離開 GM 模式');
  if (here !== 'lobby' && !floorOpen(here)) {
    if (world && world.ride) ride('lobby'); else { floor = 'lobby'; buildDock(); }
  }
}
function showGmPrompt() {
  if (document.getElementById('gmGate')) return;
  const el = document.createElement('div');
  el.id = 'gmGate';
  el.innerHTML = `<div class="gm-card"><p class="kicker">內部通道</p><b>請輸入通行證</b>
    <form id="gmForm" autocomplete="off">
      <input id="gmPass" class="passin" type="password" spellcheck="false" placeholder="通行證">
      <button class="btn primary" type="submit">進入</button>
    </form>
    <div class="err" id="gmErr" hidden>通行證不正確</div>
    <button type="button" class="btn ghost sm" id="gmCancel">取消</button></div>`;
  document.body.appendChild(el);
  const form = el.querySelector('#gmForm');
  const input = el.querySelector('#gmPass');
  el.querySelector('#gmCancel').onclick = () => el.remove();
  form.onsubmit = async ev => {
    ev.preventDefault();
    const v = (input.value || '').trim();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      if (await sha256hex(v) === GM_HASH) {
        writeGm({ on: true, eq: (gm && gm.eq) || {} });
        el.remove();
        syncGmUi();
        toast('GM 模式已開啟');
      } else {
        el.querySelector('#gmErr').hidden = false;
        input.classList.add('wrong');
        blip(330);
      }
    } finally { btn.disabled = false; }
  };
  setTimeout(() => input.focus(), 80);
}
function maybeGmGate() {
  if (isGM()) syncGmUi();
  const q = new URLSearchParams(location.search);
  if (q.get('gm') === '1' && !isGM()) showGmPrompt();
}

initFin({ get S() { return S; }, save, addXP, toast, blip, isGM, block: blockGmProgress, esc, refreshHud, PUBLIC_REPORTS,
  rankName: () => RANKS[rankIndex()].name, insider: () => insiderLinks });
initLab({ get S() { return S; }, save, addXP, toast, blip, isGM, questLog, today, refreshHud, open: (id, opt) => openPanel(id, opt) });
window.__niuma = { get world() { return world; }, get floor() { return floor; }, openPanel, closePanel, ride, goToQuestNpc, maybeClaimFocused, questLog, get ready() { return ready; }, SHOP, encodeBackup, decodeBackup, applySnapshot, maybeRemind, get isGM() { return isGM(); }, get office() { return S.office; }, get coins() { return S.coins; }, buyDecor, equipDecorChair, sitAtDesk: () => world && world.sitAtDesk && world.sitAtDesk(), standUp: () => world && world.standUp && world.standUp(), isSitting: () => !!(world && world.isSitting && world.isSitting()) };
ready = (async () => { await restoreInsider(); await switchTo(startFlat ? 'flat' : '3d', false); maybeGmGate(); })();
if (qs.has('lobby')) skip();
