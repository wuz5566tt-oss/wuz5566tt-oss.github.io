// 金融小功能：1F 市場溫度計、玩家財富榜｜2F 預測擂台（台股・美股）｜4F 讀戰報抽考｜5F 模擬資金挑戰
// 薪水＝站內虛擬點數（獎金），不能換現金。GM 模式只能預覽，不寫進度、不發薪水。
import { backend } from './social.js';

export const FIN_VER = 1;
export const SIM_START = 1000000;
const MK = { tw: '台股', us: '美股', cn: 'A股' };
const MK_ORDER = ['tw', 'us']; // 老闆藍圖：不做 A股（舊存檔的 cn 紀錄保留、不再顯示）
// 下注截止（台北時間，分鐘）：台股 13:30 收盤、A股 15:00 收盤、美股 21:30 開盤前
const CUTOFF = { tw: 13 * 60 + 30, cn: 15 * 60, us: 21 * 60 + 30 };
// 可開獎時間（台北時間）：台股 14:00 後、A股 15:00 後；美股以資料檔出現結果為準
const SETTLE = { tw: 14 * 60, cn: 15 * 60, us: 0 };
export const REWARD = {
  thermoVote: 10, thermoWin: 50,
  arenaWin: 40, arenaStreakStep: 10, arenaStreakMax: 50,
  quizEach: 20, quizPerfect: 20,
  simFirst: 100, simMonth: 100, simMonthUp: 100,
};

export const FIN_PANELS = [
  { id: 'thermo', floor: 'lobby', name: '市場溫度計', kicker: '今日台股偏多還偏空' },
  { id: 'wealth', floor: 'lobby', name: '財富榜', kicker: '玩家總薪水排名', hidden: true },
  { id: 'predict', floor: 'f2', name: '預測擂台', kicker: '台股・美股猜漲跌', hidden: true },
  { id: 'quiz', floor: 'f4', name: '戰報抽考', kicker: '讀完戰報答 3 題', hidden: true },
  { id: 'sim', floor: 'f5', name: '模擬資金', kicker: '100 萬虛擬資金挑戰', hidden: true },
];
export const FIN_ICON = {
  thermo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z"/><circle cx="12" cy="17.5" r="1.6" fill="#ff5468" stroke="#ff5468"/><path d="M12 16V9" stroke="#ff5468"/></svg>',
  wealth: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M5 20V12M12 20V5M19 20v-6" stroke="#ffc85a"/><path d="M3 20h18"/></svg>',
  predict: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="m4 15 4-5 4 3 4-6 4 4"/><path d="m6 20 3-3M18 20l-3-3" stroke="#ffc85a"/></svg>',
  quiz: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 9a3 3 0 1 1 3 3v2" stroke="#3ef2ff"/><circle cx="12" cy="17.5" r=".6" fill="#3ef2ff"/></svg>',
  sim: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><path d="M12 7v10M9.5 9.5c0-1 1-1.6 2.5-1.6s2.5.7 2.5 1.7c0 2.4-5 1.2-5 3.8 0 1 1 1.7 2.5 1.7s2.5-.6 2.5-1.6" stroke="#ffc85a"/></svg>',
};

export function normFin(f) {
  const o = f && typeof f === 'object' ? f : {};
  const obj = x => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
  const sim = obj(o.sim);
  return {
    v: FIN_VER,
    nick: typeof o.nick === 'string' ? o.nick.slice(0, 10) : null,
    thermo: obj(o.thermo),
    arena: obj(o.arena),
    arenaStat: Object.assign({ streak: 0, best: 0, win: 0, n: 0 }, obj(o.arenaStat)),
    quiz: obj(o.quiz),
    sim: {
      cash: Number.isFinite(sim.cash) ? sim.cash : SIM_START,
      pos: obj(sim.pos),
      trades: Array.isArray(sim.trades) ? sim.trades : [],
      months: obj(sim.months),
      first: !!sim.first,
    },
  };
}

/* ---------- 時間（一律以台北時間判斷） ---------- */
export function marketResult(date, m) { return resultFor(date, m); }
export function resultsInfo() { return D.results; }
export function pricesInfo() { return D.prices; }
export async function ensureResults() { return load('results'); }
export function tpe(now = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short' }).formatToParts(now).map(x => [x.type, x.value]));
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
  return { date: `${p.year}-${p.month}-${p.day}`, min: (+p.hour) * 60 + (+p.minute), dow, hm: `${p.hour}:${p.minute}` };
}
const isWeekend = t => t.dow === 0 || t.dow === 6;
const canPick = (m, t = tpe()) => !isWeekend(t) && t.min < CUTOFF[m];
const md = d => d.slice(5).replace('-', '/');
const fmt = n => Math.round(n).toLocaleString('zh-TW');
const pctTxt = (v, dp = 2) => `${v > 0 ? '+' : ''}${v.toFixed(dp)}%`;
const pcol = v => (v > 0 ? 'var(--up)' : v < 0 ? 'var(--down)' : 'var(--mute)');
const dirTxt = d => (d === 'up' ? '偏多（漲）' : d === 'down' ? '偏空（跌）' : '平盤');

/* ---------- 資料（結果、價格、題庫） ---------- */
const D = { results: null, prices: null, quiz: null, err: {} };
async function load(kind) {
  if (D[kind]) return D[kind];
  try {
    D[kind] = await (kind === 'results' ? backend.loadResults() : kind === 'prices' ? backend.loadPrices() : backend.loadQuiz());
    D.err[kind] = null;
  } catch (e) { D.err[kind] = String(e && e.message || e); }
  return D[kind];
}
function resultFor(date, m, t = tpe()) {
  const r = D.results && D.results.results && D.results.results[date] && D.results.results[date][m];
  if (!r) return null;
  if (date === t.date && t.min < SETTLE[m]) return null; // 當天還沒到開獎時間
  return r;
}
export const PANIC_PCT = -3;
export function isClosedDay(m, todayStr, all) {
  const dow = new Date(todayStr + 'T12:00:00+08:00').getDay();
  if (dow === 0 || dow === 6) return true;
  const hol = (D.results && D.results.holidays && D.results.holidays[m]) || [];
  if (hol.includes(todayStr)) return true;
  const rec = all && all[todayStr] && all[todayStr][m];
  if (rec && rec.closed) return true;
  return false;
}
function addDate(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00+08:00');
  d.setDate(d.getDate() + n);
  return tpe(d).date;
}
/** 從 fromStr 起（含當天）下一個該市場開市日；週末與 holidays 會跳過。 */
export function nextOpenDate(m, fromStr) {
  const all = D.results && D.results.results;
  let d = fromStr;
  for (let i = 0; i < 14; i++) {
    if (!isClosedDay(m, d, all)) return d;
    d = addDate(d, 1);
  }
  return fromStr;
}

/** 該市場在 todayStr 當天（或休市／尚未收盤時的上一個交易日）的真實收盤。不編造數字。 */
export function lastSession(m, todayStr) {
  const all = D.results && D.results.results;
  if (!all || !todayStr) return null;
  const t = tpe();
  const dates = Object.keys(all).filter(d => d <= todayStr && all[d] && all[d][m] && !all[d][m].closed).sort();
  for (let i = dates.length - 1; i >= 0; i--) {
    const date = dates[i];
    if (date === todayStr && date === t.date && t.min < SETTLE[m]) continue;
    const r = all[date][m];
    if (!r || !Number.isFinite(r.close) || !Number.isFinite(r.pct)) continue;
    const closed = date !== todayStr;
    const label = closed ? (isClosedDay(m, todayStr, all) ? '休市' : '尚未收盤') : '今日已更新';
    return { date, close: r.close, chg: r.chg, pct: r.pct, dir: r.dir, closed, label };
  }
  return null;
}
export function isPanicSession(todayStr) {
  for (const m of ['tw', 'us']) {
    const s = lastSession(m, todayStr);
    if (s && !s.closed && typeof s.pct === 'number' && s.pct <= PANIC_PCT) return Object.assign({ market: m }, s);
  }
  return null;
}

let C = null; // app.js 傳進來的介面
const busy = new Set();
export function initFin(ctx) {
  C = ctx;
  backend.setGM(() => C.isGM());
  if (new URLSearchParams(location.search).has('lobby')) window.__niumaFinBackend = backend; // 測試用掛勾（只讀狀態／手動送出）
  Promise.all([load('results'), load('prices'), load('quiz')]).then(() => { C.refreshHud(); finSync(); });
}
// 把自己的成績同步到排行榜（social.js 會防抖、合併；GM 不會送）
export function finSync() {
  if (!C || C.isGM()) return;
  if (C.testHook && C.testHook()) return; // 測試進度帳號不上正式榜
  // 公開樓層只留本週猜盤總榜；週分數欄位等老闆核准後再接到現有專案。不再把財富／擂台連勝／勝率／模擬資金寫進正式榜。
  return;
  const st = F().arenaStat;
  if (!((C.S.coins | 0) > 0 || st.n > 0 || F().nick || F().sim.trades.length)) return; // 還沒開始玩就不上榜
  const snap = { nick: nickOf(), rank: C.rankName(), wealth: C.S.coins | 0, streak: st.streak | 0, best: st.best | 0, win: st.win | 0, n: st.n | 0 };
  if (D.prices && etfList().length && F().sim.trades.length) {
    const ds = allDates(), cur = ds[ds.length - 1], m = cur && cur.slice(0, 7);
    if (m) { const ms = monthStats(F().sim, m); snap.sim_month = m; snap.sim_ret = Math.round(ms.ret * 100) / 100; snap.sim_mdd = Math.round(ms.mdd * 100) / 100; }
  }
  backend.syncMe(snap);
}
const F = () => C.S.fin;
const gmBlock = () => C.block('GM 模式只能預覽，不會記錄、也不會發薪水');
function lockRun(key, btn, fn) {
  if (btn && btn.disabled) return;
  if (busy.has(key)) return;
  if (gmBlock()) return;
  busy.add(key); if (btn) btn.disabled = true;
  try { fn(); } finally { setTimeout(() => busy.delete(key), 600); }
}
function rerender(el, id) { setTimeout(() => { if (el.isConnected && el.dataset.fin === id) RENDER_FIN[id](el); }, 650); }
function pay(coins, xp, el, msg) {
  if (coins || xp) C.addXP(xp | 0, coins | 0, el); else C.save();
  C.blip(1046); C.toast(msg);
}
const liveTag = rows => rows && rows.status === 'offline' ? '<span class="tag">暫時離線</span>' : '<span class="tag cyan">真實玩家</span>';
const offNote = rows => rows && rows.status === 'offline' ? '<p class="note" data-sb="offline" style="margin:6px 0 0">排行榜暫時連不上，你的薪水和任務不受影響，稍後再看看。</p>' : '';
const gmNote = () => (C.isGM() ? '<p class="note" style="margin:6px 0 0">GM 預覽：只看排行榜，不會上傳任何資料。</p>' : '');

/* ---------- 待辦（dock 紅點） ---------- */
function thermoReady() { return Object.entries(F().thermo).filter(([d, v]) => v.pick && !v.settled && resultFor(d, 'tw')).map(([d]) => d); }
function arenaReady() {
  const out = [];
  Object.entries(F().arena).forEach(([d, day]) => MK_ORDER.forEach(m => { const v = day[m]; if (v && v.pick && !v.settled && resultFor(d, m)) out.push([d, m]); }));
  return out.sort((a, b) => (a[0] + MK_ORDER.indexOf(a[1])).localeCompare(b[0] + MK_ORDER.indexOf(b[1])));
}
export function finTodos(floor) {
  if (!C || C.isGM()) return {};
  const t = tpe(), f = F();
  return {
    thermo: floor === 'lobby' && ((canPick('tw', t) && !f.thermo[t.date]) || thermoReady().length > 0),
  };
}

/* ---------- 1F 今日市場溫度計 ---------- */
async function thermo(el) {
  el.dataset.fin = 'thermo';
  const t = tpe(), f = F(), mine = f.thermo[t.date];
  await load('results');
  if (el.dataset.fin !== 'thermo') return;
  const tally = await backend.getVoteTally(t.date, 'tw');
  const tot = tally.up + tally.down, upP = tot ? Math.round(tally.up / tot * 100) : 50;
  const open = canPick('tw', t);
  const ready = thermoReady();
  const hist = Object.keys(f.thermo).sort().reverse().slice(0, 5).map(d => {
    const v = f.thermo[d], r = resultFor(d, 'tw');
    const st = v.settled ? (v.win ? `<b style="color:var(--gold)">猜中 +${REWARD.thermoWin}</b>` : '<span class="note">沒猜中</span>') : r ? '<span class="tag">可開獎</span>' : '<span class="note">等收盤結果</span>';
    return `<li><b>${md(d)}</b><span>投 ${dirTxt(v.pick)}${r ? `・實際 ${dirTxt(r.dir)}` : ''}</span><em class="st">${st}</em></li>`;
  }).join('');
  el.innerHTML = `<div class="card"><div class="row between"><b>今日台股溫度計（${md(t.date)}）</b><span class="tag">${open ? `投票到 13:30` : isWeekend(t) ? '週末休市' : '今日已截止'}</span></div>
    <p class="note" style="margin:8px 0 0">${isWeekend(t) ? `今天台股休市，溫度計暫停投票。下一個交易日再猜當天收盤偏多或偏空。` : `每人每天一票，猜今天台股加權指數收盤偏多（漲）還是偏空（跌）。投票就有 ${REWARD.thermoVote} 薪水；台北時間 14:00 後依官方收盤開獎，猜中再加 ${REWARD.thermoWin}。只猜方向、不給點位。`}</p></div>
    <div class="card mkt"><h3>台股</h3>
      <button class="btn up ${mine && mine.pick === 'up' ? 'sel' : ''}" data-tv="up" ${mine || !open ? 'disabled' : ''}>偏多</button>
      <button class="btn down ${mine && mine.pick === 'down' ? 'sel' : ''}" data-tv="down" ${mine || !open ? 'disabled' : ''}>偏空</button></div>
    <div class="card"><div class="row between"><span>大家的溫度</span>${tally.offline ? '<span class="tag">暫時離線</span>' : '<span class="tag cyan">真實票數</span>'}</div>
      <div class="row between note" style="margin:8px 0 6px"><span style="color:var(--up)">偏多 ${upP}%（${tally.up} 票）</span><span style="color:var(--down)">偏空 ${100 - upP}%（${tally.down} 票）</span></div>
      <div class="bar"><i style="width:${upP}%"></i></div>
      <p class="note" style="margin:8px 0 0"${tally.offline ? ' data-sb="offline"' : ''}>${tally.offline ? '排行榜暫時連不上，票數稍後再更新；你的投票與薪水照常記錄。' : tot ? `目前共 ${tot} 位玩家投票。` : '今天還沒有人投票，搶頭香！'}</p></div>
    ${ready.length ? `<button class="btn primary" id="tClaim" style="width:100%">開獎・領取猜中獎金（${ready.length} 筆）</button>` : ''}
    ${hist ? `<h3 style="margin:14px 0 0;font-size:1rem">我的投票紀錄</h3><ol class="floors">${hist}</ol>` : ''}
    <p class="note">開獎資料：${D.results ? `${D.results.source}，更新於 ${D.results.updated}${D.results.sample ? '（範例）' : ''}` : '讀取失敗，稍後再試'}。平盤不算猜中。薪水是站內虛擬點數，不能換現金。非投資建議。</p>`;
  el.querySelectorAll('[data-tv]').forEach(b => b.onclick = () => lockRun('thermo-vote', b, () => {
    const t2 = tpe();
    if (F().thermo[t2.date]) { C.toast('今天已經投過票了'); return; }
    if (!canPick('tw', t2)) { C.toast('今天的投票已截止，明天再來'); return; }
    F().thermo[t2.date] = { pick: b.dataset.tv, at: Date.now() };
    backend.submitVote({ date: t2.date, market: 'tw', pick: b.dataset.tv }).then(r => { if (r && r.ok) rerender(el, 'thermo'); });
    pay(REWARD.thermoVote, 1, b, `已投票「${b.dataset.tv === 'up' ? '偏多' : '偏空'}」，薪水 +${REWARD.thermoVote}`);
    rerender(el, 'thermo');
  }));
  const cb = el.querySelector('#tClaim');
  cb && (cb.onclick = () => lockRun('thermo-claim', cb, () => {
    let win = 0, n = 0;
    thermoReady().forEach(d => { const v = F().thermo[d], r = resultFor(d, 'tw'); v.settled = r.dir; v.win = v.pick === r.dir; n++; if (v.win) win++; });
    if (!n) { C.toast('沒有可以開獎的投票'); return; }
    const coins = win * REWARD.thermoWin;
    pay(coins, win * 2, cb, win ? `猜中 ${win} 次，獎金 +${coins}` : '這次沒猜中，明天再試試');
    rerender(el, 'thermo');
  }));
}

/* ---------- 1F 玩家財富榜 ---------- */
const nickOf = () => F().nick || `牛馬${String(C.S.vid || '0000').slice(-4)}`;
function boardHTML(rows, val, sub) {
  return `<ol class="floors">${rows.map((r, i) => `<li class="${r.me ? 'here' : ''}"><b>${r.me && (r.unranked || rows.status === 'offline') ? '—' : '#' + (i + 1)}</b><span>${C.esc(r.me ? r.name + '（你）' : r.name)}<br><small class="note">${C.esc(r.rank || '')}${sub ? '・' + sub(r) : ''}</small></span><em class="st${r.me ? ' here' : ''}">${val(r)}</em></li>`).join('')}</ol>`;
}
// 和伺服器同一套規則（伺服器才是最後把關）
const BAD_NICK = /(幹你|幹妳|靠北|靠杯|操你|雞掰|機掰|雞巴|屌|婊|賤人|智障|白痴|白癡|去死|fuck|shit|bitch|dick|porn|sex|nazi|gm|admin|官方|管理員|客服|董事長|leo|易凡|http|www|\.com|\.tw|line|加賴|加我|帶單|喊單|飆股|保證獲利|穩賺)/i;
const nickOk = v => v.length >= 1 && v.length <= 10 && !BAD_NICK.test(v);
async function wealth(el) {
  finSync();
  el.dataset.fin = 'wealth';
  const me = { name: nickOf(), rank: C.rankName(), value: C.S.coins | 0 };
  const rows = await backend.getLeaderboard('wealth', me);
  if (el.dataset.fin !== 'wealth') return;
  const mine = rows.find(r => r.me), pos = rows.indexOf(mine) + 1;
  const posTxt = rows.status === 'offline' ? `${fmt(me.value)} 薪水` : mine && !mine.unranked ? `第 ${pos} 名・${fmt(mine.value)} 薪水` : `未進前 20 名・${fmt(me.value)} 薪水`;
  el.innerHTML = `<div class="card"><div class="row between"><b>玩家財富榜</b>${liveTag(rows)}</div>
    <p class="note" style="margin:8px 0 0">依目前薪水（站內資產）排名，前 20 名。上榜數字由伺服器檢查，每人每天最多增加 3,000，約 1 分鐘更新一次。</p>
    <div class="row between" style="margin-top:8px"><span>你的名次</span><b style="color:var(--gold)">${posTxt}</b></div>${offNote(rows)}${gmNote()}</div>
    ${boardHTML(rows, r => `${fmt(r.value)}`)}
    <div class="card"><label class="note" for="nick">我的暱稱（最多 10 個字）</label>
      <div class="row" style="margin-top:6px;flex-wrap:nowrap"><input id="nick" class="passin" maxlength="10" value="${C.esc(nickOf())}" style="flex:1;min-width:0"><button class="btn cyan sm" id="nickSave">儲存</button></div></div>
    <p class="note">薪水是站內虛擬點數，可在服裝店兌換裝扮，不能換現金。${C.isGM() ? 'GM 預覽：顯示的是正式存檔的薪水。' : ''}</p>`;
  const nb = el.querySelector('#nickSave');
  nb.onclick = () => lockRun('nick', nb, () => {
    const v = el.querySelector('#nick').value.replace(/[<>&"'\\/]/g, '').trim().slice(0, 10);
    if (!v) { C.toast('暱稱不能空白'); nb.disabled = false; return; }
    if (!nickOk(v)) { C.toast('這個暱稱不能用，換一個吧（不能用不雅字或冒充官方）'); nb.disabled = false; return; }
    F().nick = v; C.save(); C.toast('暱稱已儲存，排行榜稍後更新');
    finSync();
    rerender(el, 'wealth');
  });
}

/* ---------- 2F 預測擂台（台股・美股） ---------- */
async function predict(el, tab) {
  el.dataset.fin = 'predict';
  await load('results');
  if (el.dataset.fin !== 'predict') return;
  const t = tpe(), f = F(), day = f.arena[t.date] || {}, st = f.arenaStat;
  const rows = MK_ORDER.map(m => {
    const v = day[m], open = canPick(m, t);
    const cut = `${String(Math.floor(CUTOFF[m] / 60)).padStart(2, '0')}:${String(CUTOFF[m] % 60).padStart(2, '0')}`;
    return `<div class="card mkt"><h3>${MK[m]}<br><small class="note">${v ? `已猜${v.pick === 'up' ? '漲' : '跌'}` : open ? `${cut} 前可猜` : isWeekend(t) ? '週末休市' : '今日已截止'}</small></h3>
      <button class="btn up ${v && v.pick === 'up' ? 'sel' : ''}" data-am="${m}" data-av="up" ${v || !open ? 'disabled' : ''}>看漲</button>
      <button class="btn down ${v && v.pick === 'down' ? 'sel' : ''}" data-am="${m}" data-av="down" ${v || !open ? 'disabled' : ''}>看跌</button></div>`;
  }).join('');
  const ready = arenaReady();
  const rate = st.n ? Math.round(st.win / st.n * 1000) / 10 : 0;
  const kind = tab === 'rate' ? 'arena-rate' : 'arena-streak';
  finSync();
  const board = await backend.getLeaderboard(kind, { name: nickOf(), rank: C.rankName(), value: kind === 'arena-rate' ? rate : st.streak, extra: st });
  if (el.dataset.fin !== 'predict') return;
  el.innerHTML = `<div class="card"><div class="row between"><b>預測擂台（${md(t.date)}）</b><span class="tag">連勝有加成</span></div>
    <p class="note" style="margin:8px 0 0">台股、美股每天各猜一次漲跌，猜中 +${REWARD.arenaWin} 薪水；連勝第 2 場起每場再加 ${REWARD.arenaStreakStep}，最多加 ${REWARD.arenaStreakMax}。台股 14:00 後開獎，美股等收盤資料出來（約台北隔天清晨）。只猜方向、不給點位。</p></div>
    ${rows}
    <div class="card row between"><span>目前連勝 <b style="color:var(--gold)">${st.streak}</b>・最佳 ${st.best}</span><span>勝率 <b style="color:var(--cyan)">${st.n ? rate + '%' : '—'}</b>（${st.win}/${st.n}）</span></div>
    ${ready.length ? `<button class="btn primary" id="aClaim" style="width:100%">開獎・領取獎金（${ready.length} 場）</button>` : ''}
    <h3 style="margin:14px 0 0;font-size:1rem">擂台排行榜 ${liveTag(board)}</h3>${offNote(board)}${gmNote()}
    <div class="shop-tabs" role="tablist"><button type="button" class="shop-tab${kind === 'arena-streak' ? ' on' : ''}" data-at="streak">連勝</button><button type="button" class="shop-tab${kind === 'arena-rate' ? ' on' : ''}" data-at="rate">勝率</button></div>
    ${boardHTML(board, r => kind === 'arena-rate' ? `${r.value}%` : `${r.value} 連勝`, r => r.extra ? `${r.extra.win}/${r.extra.n} 場` : '')}
    ${kind === 'arena-rate' ? '<p class="note" style="margin:4px 0 0">勝率榜至少要開獎 5 場才會上榜。</p>' : ''}
    <p class="note">開獎資料：${D.results ? `${D.results.source}（台股加權、那斯達克），更新於 ${D.results.updated}` : '讀取失敗'}。平盤不算猜中。排行榜是真實玩家，每天最多計 3 場。非投資建議。</p>`;
  el.querySelectorAll('[data-at]').forEach(b => b.onclick = () => predict(el, b.dataset.at));
  el.querySelectorAll('[data-av]').forEach(b => b.onclick = () => lockRun('arena-' + b.dataset.am, b, () => {
    const t2 = tpe(), m = b.dataset.am, d = F().arena[t2.date] || (F().arena[t2.date] = {});
    if (d[m]) { C.toast('這個市場今天已經猜過了'); return; }
    if (!canPick(m, t2)) { C.toast(`${MK[m]}今天已截止`); return; }
    d[m] = { pick: b.dataset.av, at: Date.now() };
    C.save(); C.blip(880); C.toast(`已猜${MK[m]}${b.dataset.av === 'up' ? '漲' : '跌'}，等開獎`);
    rerender(el, 'predict');
  }));
  const cb = el.querySelector('#aClaim');
  cb && (cb.onclick = () => lockRun('arena-claim', cb, () => {
    const s = F().arenaStat; let coins = 0, win = 0, n = 0;
    arenaReady().forEach(([d, m]) => {
      const v = F().arena[d][m], r = resultFor(d, m); if (!r || v.settled) return;
      v.settled = r.dir; v.win = v.pick === r.dir; n++; s.n++;
      if (v.win) { win++; s.win++; s.streak++; s.best = Math.max(s.best, s.streak); v.paid = REWARD.arenaWin + Math.min((s.streak - 1) * REWARD.arenaStreakStep, REWARD.arenaStreakMax); coins += v.paid; }
      else { s.streak = 0; v.paid = 0; }
    });
    if (!n) { C.toast('沒有可以開獎的預測'); return; }
    pay(coins, win * 2, cb, win ? `開獎 ${n} 場、猜中 ${win} 場，獎金 +${coins}` : `開獎 ${n} 場，這次沒猜中`);
    finSync();
    rerender(el, 'predict');
  }));
}

/* ---------- 4F 讀戰報抽考 ---------- */
async function quiz(el) {
  el.dataset.fin = 'quiz';
  const Q = await load('quiz');
  if (el.dataset.fin !== 'quiz') return;
  const L = C.insider();
  const links = `<div class="screens" style="margin-top:10px">
    <a class="screen" href="${C.PUBLIC_REPORTS.tw}" target="_blank" rel="noopener"><div class="row between"><h3>台股每日多空戰報</h3><span class="tag cyan">打開</span></div><div class="note">每天收盤後更新</div></a>
    <a class="screen" href="${C.PUBLIC_REPORTS.us}" target="_blank" rel="noopener"><div class="row between"><h3>美股（納斯達克）每日多空戰報</h3><span class="tag cyan">打開</span></div><div class="note">美股收盤後更新</div></a>
    ${L ? `<a class="screen" href="${L.cn}" target="_blank" rel="noopener"><div class="row between"><h3>A股每日戰報</h3><span class="tag cyan">打開</span></div><div class="note">自己人專屬</div></a>
    <a class="screen" href="${L.dash}" target="_blank" rel="noopener"><div class="row between"><h3>公司總控台</h3><span class="tag cyan">打開</span></div><div class="note">自己人專屬</div></a>`
      : '<div class="screen lockedrow"><div class="row between"><h3>A股戰報・公司總控台</h3><span class="tag">68樓自己人專區</span></div><div class="note">輸入自己人暗號後，這裡也會出現連結</div></div>'}</div>`;
  if (!Q || !Array.isArray(Q.questions) || !Q.questions.length) {
    el.innerHTML = `<div class="card"><b>讀戰報抽考</b><p class="note" style="margin:8px 0 0">今天的題庫還沒準備好，先去看戰報吧。</p></div>${links}`; return;
  }
  const rec = F().quiz[Q.id], qs = Q.questions.slice(0, 3);
  const sel = el._sel && el._sel.id === Q.id ? el._sel.a : (el._sel = { id: Q.id, a: [] }).a;
  const body = qs.map((q, i) => `<div class="card"><b>第 ${i + 1} 題・${C.esc(q.q)}</b>
    <div class="moods" style="margin-top:8px;flex-wrap:wrap">${q.options.map((o, j) => {
      const picked = rec ? rec.ans[i] === j : sel[i] === j;
      const mark = rec ? (j === q.answer ? ' ✓' : picked ? ' ✗' : '') : '';
      return `<button data-qi="${i}" data-qo="${j}" class="${picked ? 'sel' : ''}" ${rec ? 'disabled' : ''}>${C.esc(o)}${mark}</button>`;
    }).join('')}</div>
    ${rec ? `<p class="note" style="margin:8px 0 0">出處：${C.esc(q.src || '')}</p>` : ''}</div>`).join('');
  el.innerHTML = `<div class="card"><div class="row between"><b>${C.esc(Q.title || '讀戰報抽考')}</b><span class="tag">${Q.sample ? '範例題' : '每期一次'}</span></div>
    <p class="note" style="margin:8px 0 0">先讀戰報再答 3 題，每答對一題 +${REWARD.quizEach} 薪水，全對再加 ${REWARD.quizPerfect}。題目數字都來自當天戰報原文${Q.sample ? '（本期為範例題）' : ''}。</p></div>
    ${links}${body}
    ${rec ? `<div class="card row between"><span>本期成績</span><b style="color:var(--gold)">${rec.score}/${qs.length}・薪水 +${rec.paid}</b></div>` : `<button class="btn primary" id="qSubmit" style="width:100%" ${sel.filter(x => x != null).length < qs.length ? 'disabled' : ''}>交卷</button>`}
    <p class="note">來源：${C.esc(Q.source || '')}。戰報內容僅供學習參考，非投資建議。</p>`;
  el.querySelectorAll('[data-qi]').forEach(b => b.onclick = () => { sel[+b.dataset.qi] = +b.dataset.qo; quiz(el); });
  const sb = el.querySelector('#qSubmit');
  sb && (sb.onclick = () => lockRun('quiz', sb, () => {
    if (F().quiz[Q.id]) { C.toast('這一期已經考過了'); return; }
    const ans = qs.map((_, i) => (sel[i] == null ? -1 : sel[i]));
    const score = qs.reduce((a, q, i) => a + (ans[i] === q.answer ? 1 : 0), 0);
    const coins = score * REWARD.quizEach + (score === qs.length ? REWARD.quizPerfect : 0);
    F().quiz[Q.id] = { ans, score, paid: coins, at: Date.now() };
    pay(coins, score, sb, `答對 ${score}/${qs.length}，薪水 +${coins}`);
    rerender(el, 'quiz');
  }));
}

/* ---------- 5F 模擬資金挑戰 ---------- */
function lastOnOrBefore(series, date) {
  let best = null;
  for (const d in series) if (d <= date && (!best || d > best)) best = d;
  return best ? series[best] : null;
}
function etfList() { return (D.prices && D.prices.etfs) || []; }
function fxAt(ccy, date) { if (ccy === 'TWD') return 1; return lastOnOrBefore(((D.prices || {}).fx || {})[ccy] || {}, date); }
function latest(e) { const d = Object.keys(e.close).sort().pop(); return { d, px: e.close[d], fx: fxAt(e.ccy, d) }; }
function allDates() { const s = new Set(); etfList().forEach(e => Object.keys(e.close).forEach(d => s.add(d))); return [...s].sort(); }
function equityAt(sim, date) {
  let cash = SIM_START; const pos = {};
  sim.trades.forEach(t => { if (t.d > date) return; const amt = t.qty * t.px * t.fx; if (t.side === 'buy') { cash -= amt; pos[t.code] = (pos[t.code] || 0) + t.qty; } else { cash += amt; pos[t.code] = (pos[t.code] || 0) - t.qty; } });
  let v = cash;
  etfList().forEach(e => { const q = pos[e.code]; if (!q) return; const px = lastOnOrBefore(e.close, date), fx = fxAt(e.ccy, date); if (px && fx) v += q * px * fx; });
  return v;
}
function monthStats(sim, month) {
  const ds = allDates(), before = ds.filter(d => d < month + '-01').pop();
  const base = before ? equityAt(sim, before) : SIM_START;
  const inM = ds.filter(d => d.slice(0, 7) === month);
  let peak = base, mdd = 0, last = base;
  inM.forEach(d => { const v = equityAt(sim, d); peak = Math.max(peak, v); mdd = Math.min(mdd, v / peak - 1); last = v; });
  return { base, last, ret: (last / base - 1) * 100, mdd: mdd * 100, end: inM[inM.length - 1] || null };
}
function simMonthsReady() {
  const f = F(); if (!D.prices || !f.sim.trades.length) return [];
  const cur = allDates().pop(); if (!cur) return [];
  const curM = cur.slice(0, 7), firstM = f.sim.trades.map(t => t.d).sort()[0].slice(0, 7);
  const ms = [...new Set(allDates().map(d => d.slice(0, 7)))].filter(m => m >= firstM && m < curM && !f.sim.months[m]);
  return ms;
}
async function sim(el) {
  el.dataset.fin = 'sim';
  const P = await load('prices');
  if (el.dataset.fin !== 'sim') return;
  const disc = '<p class="note" style="margin:8px 0 0"><b>非投資建議・虛擬資金・不能換現金。</b>只用來練習資產配置與風險控管，不提供任何買賣時機或價位建議。</p>';
  if (!P || !etfList().length) { el.innerHTML = `<div class="card"><b>模擬資金挑戰</b><p class="note" style="margin:8px 0 0">價格資料讀取失敗，稍後再試。</p>${disc}</div>`; return; }
  const s = F().sim, ds = allDates(), cur = ds[ds.length - 1], month = cur.slice(0, 7);
  const ms = monthStats(s, month), eq = equityAt(s, cur);
  const ready = simMonthsReady();
  finSync();
  const board = await backend.getLeaderboard('sim', { name: nickOf(), rank: C.rankName(), value: Math.round(ms.ret * 100) / 100, extra: { ret: ms.ret, mdd: ms.mdd } });
  if (el.dataset.fin !== 'sim') return;
  const cards = etfList().map(e => {
    const L = latest(e), q = s.pos[e.code] || 0, val = q * L.px * (L.fx || 0);
    return `<div class="card" data-etf="${e.code}"><div class="row between"><b>${e.name}（${e.code}）</b><span class="tag${e.ccy === 'TWD' ? '' : ' cyan'}">${e.ccy}</span></div>
      <div class="row between note" style="margin:6px 0"><span>${md(L.d)} 收盤 ${L.px.toLocaleString('zh-TW', { maximumFractionDigits: 3 })} ${e.ccy}${e.ccy !== 'TWD' ? `・匯率 ${L.fx}` : ''}</span><span>持有 ${fmt(q)} 股・約 ${fmt(val)} 元</span></div>
      <div class="row" style="flex-wrap:nowrap"><input class="passin" type="number" min="1" step="1" inputmode="numeric" placeholder="股數" data-qty="${e.code}" style="flex:1;min-width:0">
      <button class="btn up sm" data-buy="${e.code}">買進</button><button class="btn down sm" data-sell="${e.code}" ${q ? '' : 'disabled'}>賣出</button></div></div>`;
  }).join('');
  el.innerHTML = `<div class="card"><div class="row between"><b>模擬資金挑戰</b><span class="tag">虛擬 100 萬</span></div>
    <p class="note" style="margin:8px 0 0">每人 ${fmt(SIM_START)} 元虛擬資金（新台幣計），只能買賣下面 4 檔指數 ETF，以資料檔最近一個收盤價成交、外幣依當日匯率換算、不計手續費。每月用收盤價結算月報酬與最大回撤。</p>${disc}
    <div class="row between" style="margin-top:10px"><span>總資產</span><b style="color:var(--gold)">${fmt(eq)} 元</b></div>
    <div class="row between note" style="margin-top:4px"><span>現金 ${fmt(s.cash)} 元</span><span>結算日 ${md(cur)}</span></div>
    <div class="row between" style="margin-top:8px"><span>${month.slice(5)} 月報酬 <b style="color:${pcol(ms.ret)}">${pctTxt(ms.ret)}</b></span><span>最大回撤 <b style="color:${pcol(ms.mdd)}">${pctTxt(ms.mdd)}</b></span></div></div>
    ${ready.length ? `<button class="btn primary" id="sClaim" style="width:100%">領取月結算獎金（${ready.map(m => +m.slice(5) + ' 月').join('、')}）</button>` : ''}
    ${cards}
    <h3 style="margin:14px 0 0;font-size:1rem">本月報酬排行 ${liveTag(board)}</h3>${offNote(board)}${gmNote()}
    ${boardHTML(board, r => `<span style="color:${pcol(r.value)}">${pctTxt(+r.value)}</span>`, r => r.extra ? `回撤 ${pctTxt(r.extra.mdd)}` : '')}
    <p class="note">獎金：第一次交易 +${REWARD.simFirst}；每月結算有參加 +${REWARD.simMonth}，當月報酬為正再加 ${REWARD.simMonthUp}。價格：${C.esc(P.source)}，更新於 ${C.esc(P.updated)}${P.sample ? '（範例）' : ''}。排行榜是真實玩家本月報酬（伺服器只接受 -90% ～ +30% 之間）。</p>`;
  const qtyOf = code => { const v = Math.floor(+el.querySelector(`[data-qty="${code}"]`).value || 0); return v > 0 ? v : 0; };
  const trade = (code, side, b) => lockRun('sim-' + code, b, () => {
    const e = etfList().find(x => x.code === code), L = latest(e), qty = qtyOf(code), sm = F().sim;
    if (!qty) { C.toast('請輸入股數'); b.disabled = false; return; }
    if (!L.fx) { C.toast('匯率資料缺少，暫時不能交易'); b.disabled = false; return; }
    const amt = qty * L.px * L.fx;
    if (side === 'buy' && amt > sm.cash + 1e-6) { C.toast('虛擬現金不夠'); b.disabled = false; return; }
    if (side === 'sell' && qty > (sm.pos[code] || 0)) { C.toast('持有股數不夠'); b.disabled = false; return; }
    sm.cash = Math.round((sm.cash + (side === 'buy' ? -amt : amt)) * 100) / 100;
    sm.pos[code] = (sm.pos[code] || 0) + (side === 'buy' ? qty : -qty); if (!sm.pos[code]) delete sm.pos[code];
    sm.trades.push({ d: L.d, code, side, qty, px: L.px, fx: L.fx, at: Date.now() });
    if (sm.trades.length > 500) sm.trades = sm.trades.slice(-500);
    const first = !sm.first; if (first) sm.first = true;
    const msg = `${side === 'buy' ? '買進' : '賣出'} ${e.name}（${code}）${fmt(qty)} 股`;
    if (first) pay(REWARD.simFirst, 3, b, `${msg}・第一次交易獎金 +${REWARD.simFirst}`); else { C.save(); C.blip(880); C.toast(msg); }
    rerender(el, 'sim');
  });
  el.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => trade(b.dataset.buy, 'buy', b));
  el.querySelectorAll('[data-sell]').forEach(b => b.onclick = () => trade(b.dataset.sell, 'sell', b));
  const cb = el.querySelector('#sClaim');
  cb && (cb.onclick = () => lockRun('sim-claim', cb, () => {
    let coins = 0; const got = [];
    simMonthsReady().forEach(m => { const st = monthStats(F().sim, m), add = REWARD.simMonth + (st.ret > 0 ? REWARD.simMonthUp : 0); F().sim.months[m] = { ret: st.ret, mdd: st.mdd, paid: add }; coins += add; got.push(`${+m.slice(5)} 月 ${pctTxt(st.ret)}`); });
    if (!got.length) { C.toast('沒有可以領的月結算'); return; }
    pay(coins, 5, cb, `月結算：${got.join('、')}，獎金 +${coins}`);
    rerender(el, 'sim');
  }));
}

export const RENDER_FIN = { thermo, wealth, predict, quiz, sim };
export const __finTest = { tpe, D, monthStats, equityAt, backend };
