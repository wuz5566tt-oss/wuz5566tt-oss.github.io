// 老闆藍圖（11/27）：新手（入職第一天、新手禮包、捏自己的牛馬）｜每天（下班複盤 1 題、突發行情、每週前十本機版）｜展覽（華爾街歷史、大盤比個股、0050 定期定額示範、準備中展廳）｜置入（戰報看板）
// 規則：薪水＝站內虛擬點數，不能換現金；GM 模式只預覽，不存檔、不發薪水；不做 A股；不帶單、不喊點位、非投資建議。
import { lineCtaHTML } from './uikit.js';
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
    look: { hair: pick('hair', lk.hair), tie: pick('tie', lk.tie), badge: pick('badge', lk.badge) },
    lookSet: !!o.lookSet,
    offq: obj(o.offq), // { 'YYYY-MM-DD': { m, ans, ok, paid } }
    flash: Array.isArray(o.flash) ? o.flash.filter(x => typeof x === 'string').slice(-60) : [], // 已讀的突發行情 key
  };
}
export const lookColor = (k, v) => { const x = LOOK_OPT[k].find(y => y[0] === v); return x ? x[2] : null; };

/* ---------- 真實事件（來源記在這裡，畫面不顯示來源網址） ---------- */
// 華爾街歷史展廳：雷曼、GE 為公開歷史；NVDA 取自本公司美股戰報 2026-11-23（Reuters、CNBC、每日經濟新聞）
export const WALL_ST = [
  { date: '2008/9/15', title: '雷曼兄弟聲請破產保護', big: '美國史上最大破產案', body: '成立 158 年的投資銀行雷曼兄弟（Lehman Brothers）聲請破產保護，申報資產約 6,390 億美元。當天道瓊工業指數下跌 504 點（-4.42%），全球金融海嘯全面爆發。', lesson: '再大的公司都可能倒下；買進一籃子的指數，單一公司出事時，傷害會被分散。' },
  { date: '2018/6/26', title: '奇異 GE 被移出道瓊工業指數', big: '最後一檔 1896 年創始成分股離場', body: '奇異（GE）是 1896 年道瓊工業指數最早的成分股之一，自 1907 年起連續留在指數裡超過一百年。2018/6/26 起被移出，由沃爾格林（Walgreens Boots Alliance）取代。', lesson: '指數會定期汰弱留強、換掉成分股；持有指數的人不用自己動手換股。' },
  { date: '2026/11/23', title: '輝達 NVDA 單日 +31.48%', big: '收 165.05 美元', body: '輝達董事會宣布黃仁勳即日復任執行長，股價單日大漲 31.48%，單日市值增加約 9,520 億美元，創紀錄。那斯達克指數同日上漲 6.51%。', lesson: '個股單日波動可以比指數大好幾倍；漲得快，跌起來也一樣快（隔天 11/24 輝達 -5.86%）。' },
];
// 大盤比個股對比牆：本公司美股戰報 2026-11-24（MarketWatch、Investopedia；指數取自開獎資料）
export const VS_WALL = [
  { date: '2026/11/24', stock: { name: '美光 MU', pct: -11.01, close: '629.79 美元', why: 'BNP Paribas 降評至中立' }, index: { name: '那斯達克綜合指數 ^IXIC', pct: -1.48, close: '23,733.54' } },
];
/* ---------- 小工具 ---------- */
const md = d => `${+d.slice(5, 7)}/${+d.slice(8, 10)}`;
const fmt = (n, dp = 2) => Number(n).toLocaleString('zh-TW', { minimumFractionDigits: dp, maximumFractionDigits: dp });
const pctTxt = v => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;
const MKN = { tw: '台股加權指數', us: '那斯達克綜合指數 ^IXIC' };
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
  const k = K(), st = onboardSteps(), n = st.filter(s => s.done).length, all = n === st.length, gm = C.isGM();
  el.innerHTML = `<div class="card"><div class="row between"><b>入職第一天清單</b><span class="tag ${all ? 'cyan' : ''}">${n} / ${st.length}</span></div>
      <p class="note" style="margin:6px 0 0">四件事做完，就發「正式錄取」徽章＋薪水 ${REWARD_C.badge}。</p>
      <div class="bar" style="margin-top:8px"><i style="width:${n / st.length * 100}%"></i></div></div>
    <ol class="floors cr-steps">${st.map(s => `<li class="${s.done ? 'here' : ''}" data-step="${s.id}"><b>${s.done ? '✓' : '・'}</b><span>${s.name}<br><small class="note">${s.hint}</small></span><em class="st">${s.done ? '完成' : `<button type="button" class="btn ghost sm" data-crgo="${s.go}">去做</button>`}</em></li>`).join('')}</ol>
    <div class="card cr-badge ${k.badge ? 'on' : ''}"><div class="row between"><b>「正式錄取」徽章</b><span class="tag ${k.badge ? 'cyan' : ''}">${k.badge ? `已取得・${md(k.badge)}` : all ? '可以領取' : '未取得'}</span></div>
      ${!k.badge ? `<button type="button" class="btn primary" id="crBadge" style="width:100%;margin-top:8px" ${all ? '' : 'disabled'}>${all ? `領取徽章＋薪水 ${REWARD_C.badge}` : '四件事做完才能領'}</button>` : '<p class="note" style="margin:6px 0 0">恭喜轉正！明天開始就是正式牛馬了。</p>'}</div>
    <div class="card"><div class="row between"><b>新手禮包</b><span class="tag">${k.gift ? `已領・${md(k.gift)}` : '一人一次'}</span></div>
      <p class="note" style="margin:6px 0 0">薪水 ${REWARD_C.gift}＋解鎖「金色工牌」（在捏自己的牛馬裡換）。</p>
      ${k.gift ? '' : '<button type="button" class="btn cyan" id="crGift" style="width:100%;margin-top:8px">打開新手禮包</button>'}</div>
    <button type="button" class="btn ghost" id="crLook" style="width:100%">捏自己的牛馬（髮型・領帶・工牌顏色）</button>
    <p class="note">${gm ? 'GM 預覽：可以看全部流程，不會存檔、也不會發薪水。' : '薪水是站內虛擬點數，只能在站內使用，不能換現金。'}</p>`;
  el.querySelectorAll('[data-crgo]').forEach(b => b.onclick = () => C.goZone(b.dataset.crgo));
  const bb = el.querySelector('#crBadge');
  bb && (bb.onclick = () => { if (bb.disabled || gmStop()) return; const kk = K(); if (kk.badge) return; if (!onboardSteps().every(s => s.done)) { C.toast('四件事還沒做完'); return; }
    bb.disabled = true; kk.badge = C.today(); pay(REWARD_C.badge, 5, bb, `恭喜「正式錄取」！薪水 +${REWARD_C.badge}`); C.celebrate && C.celebrate(); again(el, onboard, 500); });
  const gb = el.querySelector('#crGift');
  gb && (gb.onclick = () => { if (gb.disabled || gmStop()) return; const kk = K(); if (kk.gift) return; gb.disabled = true; kk.gift = C.today(); pay(REWARD_C.gift, 2, gb, `新手禮包：薪水 +${REWARD_C.gift}，金色工牌已解鎖`); again(el, onboard, 500); });
  el.querySelector('#crLook').onclick = () => C.open('mynm');
}
/* ---------- 捏自己的牛馬 ---------- */
function mynm(el) {
  const k = K(), gm = C.isGM(), eq = (C.equipped && C.equipped()) || {};
  const cur = C.lookDraft || (C.lookDraft = { ...k.look });
  const sw = (key, label) => `<div class="field"><label>${label}</label><div class="moods cr-opts">${LOOK_OPT[key].map(([v, n, col, need]) => {
    const locked = need === 'gift' && !k.gift && !gm;
    return `<button type="button" data-lk="${key}" data-lv="${v}" class="${cur[key] === v ? 'sel' : ''}" ${locked ? 'disabled title="新手禮包解鎖"' : ''}>${col != null ? `<i class="cr-dot" style="background:#${col.toString(16).padStart(6, '0')}"></i>` : ''}${n}${locked ? '🔒' : ''}</button>`; }).join('')}</div></div>`;
  el.innerHTML = `<p style="margin:0">捏一隻自己的牛馬。改完按「存下造型」，3D 場景裡的你會馬上換。</p>
    ${sw('hair', '髮型')}${sw('tie', '領帶顏色')}${sw('badge', '工牌顏色')}
    ${eq.tie ? '<p class="note">你現在有穿服裝店的領帶，領帶顏色要脫下那條才看得到。</p>' : ''}
    <button type="button" class="btn primary" id="lkSave" style="width:100%">${gm ? 'GM 預覽（不存檔）' : '存下造型'}</button>
    <button type="button" class="btn ghost sm" id="lkReset" style="width:100%;margin-top:6px">回到預設</button>
    <p class="note">換造型不用花薪水。${gm ? 'GM 預覽：只改畫面，重新整理就回來。' : ''}</p>`;
  el.querySelectorAll('[data-lk]').forEach(b => b.onclick = () => { if (b.disabled) return; cur[b.dataset.lk] = b.dataset.lv; C.setLook(cur); mynm(el); });
  el.querySelector('#lkReset').onclick = () => { Object.assign(cur, DEFAULT_LOOK); C.setLook(cur); mynm(el); };
  el.querySelector('#lkSave').onclick = () => {
    if (gm) { C.setLook(cur); C.toast('GM 預覽：造型只在這次畫面生效，不存檔'); return; }
    const kk = K(); kk.look = { ...cur }; kk.lookSet = true; C.lookDraft = null; C.save(); C.setLook(kk.look); C.blip(988); C.toast('造型已存下'); C.refreshHud(); };
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

/* ---------- 每週前十（本機版） ---------- */
const COLLEAGUES = ['晨會主持 Kevin', '同期學員 阿拓', '同期學員 小晴', '同期學員 柏毅', '行政小芳', '戰報編輯阿哲', '數據分析師小陳', '量化助理 Rex', '風控官阿凱', '茶水間阿姨', 'K線教練老周', '閃避教官小莉'];
export function weeklyBoard() {
  const wk = C.weekKey(), day = Math.min(5, ((new Date().getDay() + 6) % 7) + 1); // 週一=1，週末算 5 天
  const npc = COLLEAGUES.map(n => ({ name: n, pts: Math.round((hash(wk + n) % 31) * day / 5) * 10, npc: true }));
  const rows = npc.concat([{ name: '你', pts: C.weekPts(), me: true }]).sort((a, b) => b.pts - a.pts || (a.me ? -1 : b.me ? 1 : 0));
  const pos = rows.findIndex(r => r.me) + 1;
  return { rows: rows.slice(0, 10), pos, me: rows[pos - 1], wk };
}
function leaderLocal(el) {
  const b = weeklyBoard(), inTop = b.pos <= 10;
  el.innerHTML = `<div class="card row between"><span>你本週猜盤積分</span><b class="stat" style="font-size:1.5rem">${b.me.pts} 分</b></div>
    <div class="card"><div class="row between"><b>本週前十（本機版）</b><span class="tag">${inTop ? `你第 ${b.pos} 名` : `你第 ${b.pos} 名・未進前十`}</span></div>
      <p class="note" style="margin:6px 0 0">${md(b.wk)} 起這一週。猜盤桌猜中一市場 +10 分。</p></div>
    <ol class="floors cr-week">${b.rows.map((r, i) => `<li class="${r.me ? 'here' : ''}"><b>#${i + 1}</b><span>${C.esc(r.name)}<br><small class="note">${r.me ? '真實成績' : 'NPC 同事'}</small></span><em class="st${r.me ? ' here' : ''}">${r.pts} 分</em></li>`).join('')}</ol>
    ${inTop ? '' : `<ol class="floors"><li class="here"><b>#${b.pos}</b><span>你<br><small class="note">真實成績</small></span><em class="st here">${b.me.pts} 分</em></li></ol>`}
    <div class="card"><div class="row between"><span>連對天數</span><b>${C.guessStat().streak || 0} 天</b></div><div class="row between" style="margin-top:8px"><span>最佳連對</span><b>${C.guessStat().best || 0} 天</b></div></div>
    <p class="note">本機版：只有「你」是真實成績，其他名字是大樓裡的 NPC 同事（不是真人玩家）。多人真實排名請看 1 樓財富榜、2 樓預測擂台。非投資建議。</p>`;
}

/* ---------- 3) 展覽 ---------- */
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
function warboard(el) {
  const R = C.PUBLIC_REPORTS || {}, a = (u, t, s) => u ? `<a class="screen" href="${u}" target="_blank" rel="noopener"><div class="row between"><h3>${t}</h3><span class="tag cyan">打開</span></div><div class="note">${s}</div></a>` : `<div class="screen lockedrow"><div class="row between"><h3>${t}</h3><span class="tag">準備中</span></div></div>`;
  el.innerHTML = `<p style="margin:0">每天收盤後更新的多空戰報，點下去直接看。</p>
    <div class="screens" style="margin-top:12px">${a(R.tw, '台股每日多空戰報', '每天收盤後更新')}${a(R.us, '美股（納斯達克）每日多空戰報', '美股收盤後更新')}</div>
    ${lineCtaHTML('想更深入？加入 LINE')}
    <p class="note">非投資建議。</p>`;
}

const IC = (p, c = '#3ef2ff') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">${p.replace(/STROKE/g, c)}</svg>`;
export const CAREER_PANELS = [
  { id: 'onboard', floor: 'lobby', name: '入職第一天', kicker: '新手清單・新手禮包' },
  { id: 'flash', floor: 'lobby', name: '突發行情', kicker: '真實收盤・單日漲跌 ≥ 3%' },
  { id: 'warboard', floor: 'lobby', name: '戰報看板', kicker: '台股・美股每日戰報' },
  { id: 'mynm', floor: '_ui', name: '捏自己的牛馬', kicker: '髮型・領帶・工牌顏色' },
  { id: 'offq', floor: 'f2', name: '下班複盤 1 題', kicker: '真實收盤出題' },
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
export const RENDER_CAREER = { onboard, mynm, offq, flash, warboard, ex_ws: exWs, ex_vs: exVs, ex_dca: exDca, ex_more: exMore, leaderLocal };
export function careerTodos(floor) {
  if (!C || C.isGM()) return {};
  const k = K(), t = C.tpe(), ev = flashEvents();
  return {
    onboard: floor === 'lobby' && (!k.gift || (!k.badge && onboardSteps().every(s => s.done))),
    flash: floor === 'lobby' && !!(ev[0] && !k.flash.includes(ev[0].key)),
    offq: floor === 'f2' && !k.offq[t.date] && !!offQuestion(),
  };
}
