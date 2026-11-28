// STAR史塔財商學院展覽館：存檔正規化與闖關／計分／錯題本／徽章邏輯（純函式，不碰畫面）
// 存檔 S.academy = { v, place, ok, lit, wrong, paid, daily, hist, tour, title }
import { ACAD_DATA } from './academy-data.js';
import { SURVIVE_CARDS, SURVIVE_LEVEL, SURVIVE_IDS } from './survival-data.js';
export const ACAD_VER = 1;
export const REWARD = { card: 20, level: 50, hall: 100, place: 30, dailyEach: 20, dailyBonus: 10 };
const D = ACAD_DATA;
export const CARDS = D.cards;
Object.assign(CARDS, SURVIVE_CARDS);
const introHall = D.halls.find(h => h.id === 'intro');
if (introHall && !introHall.levels.some(l => l.id === 'survive')) {
  introHall.levels.push(SURVIVE_LEVEL);
  introHall.desc = '先記住：學交易是學生存。平時靠紀律，恐慌時再進場有價資產。這不是進場指令，不保證獲利。' + introHall.desc;
}
export const FIRST_CARD = 'sv1';
export const HALLS = D.halls;
export const STAR = D.star; // 學院展位「1、5共振」（內容準備中，不出題）
export { SURVIVE_IDS, SURVIVE_LEVEL };
export const QUESTIONS = {};
Object.values(CARDS).forEach(c => c.quiz.forEach(q => { QUESTIONS[q.id] = { ...q, card: c.id }; }));
export const BANK = Object.keys(QUESTIONS);
export const PLACEMENT = D.placement.filter(id => QUESTIONS[id]);
const isDate = d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
const uniqStr = (a, ok) => [...new Set((Array.isArray(a) ? a : []).filter(x => typeof x === 'string' && ok(x)))];

export function normAcademy(a) {
  const x = a && typeof a === 'object' && !Array.isArray(a) ? a : {};
  const place = x.place && typeof x.place === 'object' && (x.place.to === 'intro' || x.place.to === 'ta')
    ? { score: Math.max(-1, Math.min(3, x.place.score | 0)), to: x.place.to, date: isDate(x.place.date) ? x.place.date : null } : null;
  const wrong = {};
  if (x.wrong && typeof x.wrong === 'object') Object.entries(x.wrong).forEach(([k, v]) => { if (QUESTIONS[k] && isDate(v)) wrong[k] = v; });
  let daily = null;
  if (x.daily && typeof x.daily === 'object' && isDate(x.daily.date) && Array.isArray(x.daily.ids)) {
    const ids = x.daily.ids.filter(id => QUESTIONS[id]).slice(0, 3);
    if (ids.length) daily = { date: x.daily.date, ids, ans: ids.map((_, i) => { const v = Array.isArray(x.daily.ans) ? x.daily.ans[i] : -1; return Number.isInteger(v) && v >= 0 && v <= 2 ? v : -1; }), claimed: !!x.daily.claimed, re: Array.isArray(x.daily.re) ? x.daily.re.filter(id => ids.includes(id)) : [] };
  }
  const hist = {};
  if (x.hist && typeof x.hist === 'object') Object.entries(x.hist).filter(([k]) => isDate(k)).sort().slice(-60).forEach(([k, v]) => { hist[k] = Math.max(0, Math.min(3, v | 0)); });
  const ok = uniqStr(x.ok, k => !!QUESTIONS[k]);
  const lit = uniqStr(x.lit, k => !!CARDS[k]);
  return { v: ACAD_VER, place, ok, lit, wrong, paid: uniqStr(x.paid, () => true), daily, hist, tour: !!x.tour, title: typeof x.title === 'string' ? x.title : '' };
}

/* ---------- 闖關解鎖 ---------- */
export const hallById = id => HALLS.find(h => h.id === id);
export const cardDone = (A, id) => A.lit.includes(id);
export const levelDone = (A, lv) => lv.cards.length > 0 && lv.cards.every(id => cardDone(A, id));
export const hallDone = (A, h) => h.levels.every(lv => levelDone(A, lv));
export const hallCards = h => h.levels.flatMap(lv => lv.cards);
export function hallOpen(A, hallId, gm = false) {
  if (gm) return true;
  if (!A.place) return false;
  if (hallId === 'intro' || hallId === 'ta') return true;
  if (hallId === 'mkt') { const I = hallById('intro'), T = hallById('ta'); return levelDone(A, I.levels.find(l => l.id === 'risk')) || hallDone(A, T); }
  return true;
}
export function levelOpen(A, hallId, levelId, gm = false) {
  if (gm) return true;
  if (!hallOpen(A, hallId)) return false;
  const h = hallById(hallId); const i = h.levels.findIndex(l => l.id === levelId);
  if (i < 0) return false;
  if (hallId !== 'intro') return true; // 入門館依序三關＋大盤區；其他館各區同時開
  if (levelId === 'survive') return true; // 生存課在入門館內，不擋住原四關
  return i === 0 || levelDone(A, h.levels[i - 1]);
}
export function cardOpen(A, cardId, gm = false, { panic = false } = {}) {
  if (gm) return true;
  const c = CARDS[cardId]; if (!c) return false;
  if (cardId === 'sv3' && panic) return true; // 今日恐慌課可直接看第三張；不是進場指令
  if (!levelOpen(A, c.hall, c.level)) return false;
  const lv = hallById(c.hall).levels.find(l => l.id === c.level);
  if (lv.layout === 'vs') return true; // 左右對照區一次全開
  const i = lv.cards.indexOf(cardId);
  return i === 0 || cardDone(A, lv.cards[i - 1]);
}

/* ---------- 程度測驗 ---------- */
export function placeResult(answers) {
  const score = PLACEMENT.reduce((n, id, i) => n + (answers[i] === QUESTIONS[id].answer ? 1 : 0), 0);
  return { score, to: score >= 2 ? 'ta' : 'intro' };
}

/* ---------- 答題（展位小考與講師馬共用） ---------- */
// 回傳 { right, lit:[新點亮卡], levels:[新完成關卡], halls:[新完成館], fixed:是否訂正錯題 }
export function answer(A, qid, choice, today, { retest = false } = {}) {
  const q = QUESTIONS[qid]; if (!q) return null;
  const right = choice === q.answer;
  const before = snapshotDone(A);
  let fixed = false;
  if (right) {
    if (!A.ok.includes(qid)) A.ok.push(qid);
    if (retest && A.wrong[qid] && A.wrong[qid] < today) { delete A.wrong[qid]; fixed = true; }
  } else {
    A.wrong[qid] = today; // 答錯（或重考又錯）→ 從今天重算，隔天講師馬再考
  }
  const c = CARDS[q.card];
  if (c.quiz.every(x => A.ok.includes(x.id)) && !A.lit.includes(c.id)) A.lit.push(c.id);
  const after = snapshotDone(A);
  return { right, q, fixed, lit: after.cards.filter(x => !before.cards.includes(x)), levels: after.levels.filter(x => !before.levels.includes(x)), halls: after.halls.filter(x => !before.halls.includes(x)) };
}
function snapshotDone(A) {
  const levels = [], halls = [];
  HALLS.forEach(h => { h.levels.forEach(lv => { if (levelDone(A, lv)) levels.push(h.id + '.' + lv.id); }); if (hallDone(A, h)) halls.push(h.id); });
  return { cards: A.lit.slice(), levels, halls };
}
// 獎勵只發一次：key 記在 paid；回傳這次該發的薪水
export function payOnce(A, key, coins) { if (A.paid.includes(key)) return 0; A.paid.push(key); return coins; }

/* ---------- 錯題本 ---------- */
export const wrongList = A => Object.entries(A.wrong).sort((a, b) => (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0)).map(([id, d]) => ({ id, date: d, q: QUESTIONS[id] }));
export const wrongDue = (A, today) => wrongList(A).filter(w => w.date < today);

/* ---------- 講師馬每日 3 題（依本機日期） ---------- */
const hash = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
export function pickDaily(A, today) {
  const ids = wrongDue(A, today).slice(0, 3).map(w => w.id);
  for (let k = 0; ids.length < 3 && k < 400; k++) {
    const id = BANK[hash(today + ':' + k) % BANK.length];
    if (!ids.includes(id) && !(A.wrong[id] === today)) ids.push(id);
  }
  return ids;
}
export function ensureDaily(A, today) {
  if (!A.daily || A.daily.date !== today) { const due = wrongDue(A, today).map(w => w.id), ids = pickDaily(A, today); A.daily = { date: today, ids, ans: [-1, -1, -1], claimed: false, re: ids.filter(id => due.includes(id)) }; }
  return A.daily;
}
export const dailyScore = d => (d ? d.ids.reduce((n, id, i) => n + (d.ans[i] === QUESTIONS[id].answer ? 1 : 0), 0) : 0);
export const dailyAllDone = d => !!d && d.ans.every(v => v >= 0);
export const dailyCoins = score => score * REWARD.dailyEach + (score === 3 ? REWARD.dailyBonus : 0);

/* ---------- 徽章／稱號 ---------- */
export const BADGES = [
  { id: 'intro.tools', name: '工具入門', how: '入門館第一關全亮' },
  { id: 'intro.money', name: '算錢達人', how: '入門館第二關全亮' },
  { id: 'intro.risk', name: '風險意識', how: '入門館第三關全亮' },
  { id: 'intro.index', name: '大盤派', how: '「為什麼大盤比個股好做」全亮' },
  { id: 'ta', name: '看圖學徒', how: '技術分析館全亮' },
  { id: 'mkt', name: '市場觀察員', how: '市場觀察館全亮' },
  { id: 'all', name: '學院全制霸', how: '三館全部點亮' },
  { id: 'streak3', name: '講師馬好學生', how: '講師馬每日 3 題拿滿分 3 天' },
];
export function badgesOf(A) {
  const got = new Set();
  HALLS.forEach(h => { h.levels.forEach(lv => { if (levelDone(A, lv)) got.add(h.id + '.' + lv.id); }); if (hallDone(A, h)) got.add(h.id); });
  if (HALLS.every(h => hallDone(A, h))) got.add('all');
  if (Object.values(A.hist).filter(v => v === 3).length >= 3) got.add('streak3');
  return BADGES.filter(b => got.has(b.id));
}
export function hallProgress(A, h) { const ids = hallCards(h); return { lit: ids.filter(id => cardDone(A, id)).length, total: ids.length }; }
export const totalProgress = A => ({ lit: A.lit.length, total: Object.keys(CARDS).length });

/* ---------- 複利（UI BOT ac-widgets.js 的計算機用；只用玩家輸入的數字） ---------- */
export function compound(principal, years, ratePct) {
  const r = ratePct / 100, pts = [];
  for (let y = 0; y <= years; y++) pts.push(principal * Math.pow(1 + r, y));
  return { final: pts[years], gain: pts[years] - principal, pts };
}
