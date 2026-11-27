// STAR史塔財商學院展覽館：畫面接線。
// 畫面、卡片樣式、動畫一律用 UI BOT 的元件（acad-ui/：academy.css、ac-ui.js 模板、ac-fx.js 特效、ac-widgets.js 複利計算機），不自己設計。
// 邏輯（闖關解鎖、計分、錯題本、每日 3 題、徽章）在 academy-logic.js；存檔／發薪／GM 在這裡接到遊戲本體（GM 不寫存檔、不發薪）。
import * as L from './academy-logic.js';
import * as UI from './acad-ui/js/ac-ui.js';
import * as FX from './acad-ui/js/ac-fx.js';
import { GLOSSARY } from './acad-ui/js/ac-glossary.js';
import { calcPanel, renderCalcResult } from './acad-ui/js/ac-widgets.js';
import { mountSnippet, drawIdCard, drawPayslip } from './uikit.js'; // UI BOT ui-kit 加件（特展預告、工作證、薪資單）
let X = null; // app.js 注入
const esc = UI.esc;
const IMG = 'assets/img/star-neon-512.webp'; // 與 acad-ui 內同一張圖（位元組相同），用站內既有檔
const qid = (cid, qi) => `${cid}_${qi + 1}`;
const parseQ = s => { const [cid, qi] = String(s).split('#'); return { cid, qi: +qi, id: qid(cid, +qi) }; };
const wrap = (html, cls = '') => `<div class="ac-root ac-host ac-inpanel ${cls}">${html}</div>`;
export function initAcademy(ctx) {
  X = ctx;
  FX.holo(document.body); // 卡片光澤跟著手指流動（UI BOT 特效，只綁一次）
  document.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('.ac-term');
    layer().querySelectorAll('.ac-pop').forEach(p => p.remove());
    if (!t) return;
    e.stopPropagation();
    const p = document.createElement('div'); p.className = 'ac-pop'; p.setAttribute('role', 'dialog');
    p.innerHTML = `<b>${esc(t.dataset.term)}</b>${esc(GLOSSARY[t.dataset.term] || '')}<small>小辭典・非投資建議</small>`;
    layer().appendChild(p);
    const r = t.getBoundingClientRect(), pw = Math.min(280, innerWidth - 24);
    p.style.left = `${Math.max(12, Math.min(innerWidth - pw - 12, r.left + r.width / 2 - pw / 2))}px`;
    p.style.top = `${r.bottom + 8 + 120 > innerHeight ? r.top - 8 - p.offsetHeight : r.bottom + 8}px`;
  }, true);
}
// 浮層（小辭典、收卡光爆、導覽）要在 .ac-root 裡才吃得到 UI BOT 的 CSS 變數
function layer() {
  let l = document.getElementById('acLayer');
  if (!l) { l = document.createElement('div'); l.id = 'acLayer'; l.className = 'ac-root ac-host'; document.body.appendChild(l); }
  return l;
}
export function acad() { const S = X.S; if (!S.academy || S.academy.v !== L.ACAD_VER) S.academy = L.normAcademy(S.academy); return S.academy; }
const gm = () => X.isGM();
const persist = () => { if (!gm()) X.save(); };
function pay(coins, el, why) {
  if (!coins) return;
  if (gm()) { X.toast(`GM 預覽：${why}（不發薪水）`); return; }
  X.addXP(1, coins, el); X.toast(`${why}・薪水 +${coins}`);
}
function burst(el) {
  if (!el) return;
  FX.burst(el);
  document.querySelectorAll('body > .ac-burst').forEach(h => layer().appendChild(h));
  X.blip(1318);
}
const NA = '<p class="ac-na">僅供學習，非投資建議。薪水是站內虛擬點數，不能換現金。</p>';

/* ---------- 答題後：點亮、關卡、館、發薪、存檔 ---------- */
function afterAnswer(res, root) {
  const A = acad();
  res.lit.forEach(id => { pay(L.payOnce(A, 'card:' + id, L.REWARD.card), null, `收下「${L.CARDS[id].title}」`); burst(root && root.querySelector(`.ac-viewer .ac-card[data-card="${id}"]`)); });
  res.levels.forEach(k => {
    const [h, l] = k.split('.'); const lv = L.hallById(h).levels.find(x => x.id === l); const b = L.BADGES.find(x => x.id === k);
    setTimeout(() => pay(L.payOnce(A, 'level:' + k, L.REWARD.level), null, `完成「${lv.name.replace(/^第.關・/, '')}」${b ? '・徽章「' + b.name + '」' : ''}`), 900);
  });
  res.halls.forEach(h => { const b = L.BADGES.find(x => x.id === h); setTimeout(() => pay(L.payOnce(A, 'hall:' + h, L.REWARD.hall), null, `${L.hallById(h).name}全部收齊${b ? '・徽章「' + b.name + '」' : ''}`), 1800); });
  if (res.fixed) X.toast('錯題訂正成功，已從錯題本移除');
  persist(); X.refreshHud && X.refreshHud();
}

/* ---------- 入口大廳：3 題程度測驗 → 展覽館樓層 ---------- */
let placeAns = [];
const ringSvg = p => { const c = 2 * Math.PI * 32; return `<svg viewBox="0 0 74 74"><circle cx="37" cy="37" r="32" fill="none" stroke="rgba(120,220,255,.14)" stroke-width="5"/><circle cx="37" cy="37" r="32" fill="none" stroke="url(#ac-ringg)" stroke-width="5" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}"/></svg>`; };
const RINGDEF = '<svg width="0" height="0" style="position:absolute"><defs><linearGradient id="ac-ringg" x1="0" x2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset=".6" stop-color="#a78bfa"/><stop offset="1" stop-color="#ffd66b"/></linearGradient></defs></svg>';
const HALL_ICON = { intro: 'compound', ta: 'kline', mkt: 'globe', star: 'star' };
const qCard = id => { const q = L.QUESTIONS[id]; const c = L.CARDS[q.card]; return { c, qi: c.quiz.findIndex(x => x.id === id) }; };
function renderGate(el) {
  const A = acad();
  if (!A.place) {
    const i = placeAns.length;
    if (i >= L.PLACEMENT.length) { finishPlace(el, L.placeResult(placeAns)); return; }
    const { c, qi } = qCard(L.PLACEMENT[i]);
    const draw = st => {
      el.innerHTML = wrap(`<div class="ac-panel" data-mode="entrance"><p class="ac-kicker">入口分級 ${i + 1} / ${L.PLACEMENT.length}</p><h2 class="ac-h2">先看看你從哪一館開始</h2>
        <p class="ac-sub">3 題就好，不扣薪水、不進錯題本，只用來推薦起點。</p>${UI.progressBar(i, L.PLACEMENT.length, '程度測驗')}
        ${UI.question(c, qi, st).replace('答錯了，已放進錯題本，明天講師馬會再考你。', '答錯沒關係，程度測驗不進錯題本。')}
        <div class="ac-row" style="margin-top:14px">${st.result !== undefined ? `<button type="button" class="ac-btn" id="acPlaceNext">${i + 1 < L.PLACEMENT.length ? '下一題' : '看結果'}</button>` : ''}
        <button type="button" class="ac-btn ac-btn--ghost ac-btn--sm" id="acSkipPlace">先跳過，從入門館開始</button></div></div>${NA}`);
      el.querySelectorAll('.ac-opt').forEach(b => b.onclick = () => {
        if (placeAns.length > i) return;
        const v = +b.dataset.choice; placeAns.push(v); X.blip(v === c.quiz[qi].answer ? 988 : 440);
        draw({ result: v === c.quiz[qi].answer, choice: v });
        el.querySelectorAll('.ac-opt').forEach(o => o.disabled = true);
      });
      const nx = el.querySelector('#acPlaceNext'); nx && (nx.onclick = () => renderGate(el));
      el.querySelector('#acSkipPlace').onclick = () => finishPlace(el, { score: -1, to: 'intro' });
    };
    draw({}); return;
  }
  const P = A.place, tot = L.totalProgress(A);
  const booth = (id, name, sub, p, open, count) => `<button type="button" class="ac-booth${id === 'star' ? ' ac-booth--academy' : ''}${p >= 1 ? ' is-done' : ''}${open ? '' : ' is-locked'}" data-hall="${id}" data-booth="${id}">
    <div class="ac-booth__ring">${ringSvg(p)}${UI.icon(HALL_ICON[id])}</div><small>${P.to === id ? '推薦起點' : id === 'star' ? '學院' : '展館'}</small><b>${esc(name)}</b><p>${esc(sub)}</p><span class="ac-booth__count">${count}</span></button>`;
  el.innerHTML = wrap(`${RINGDEF}<div class="ac-hero__sign"><img src="${IMG}" alt=""><b>STAR史塔財商學院展覽館</b></div>
    <p class="ac-sub">${P.score >= 0 ? `程度測驗 ${P.score}/3，建議從<b>${P.to === 'ta' ? '技術分析館' : '入門觀念館'}</b>開始。` : '你選擇從入門觀念館開始。'}像逛美術館一樣，一館一個主題，答對三題就收下一張卡。</p>
    ${UI.progressBar(tot.lit, tot.total, '已收集知識卡')}
    <div class="ac-floor">${L.HALLS.map(h => { const p = L.hallProgress(A, h), open = L.hallOpen(A, h.id, gm());
      return booth(h.id, h.name, open ? h.desc : h.id === 'mkt' ? '入門館第三關或技術館收齊後開放' : '先完成程度測驗', p.total ? p.lit / p.total : 0, open, open ? `${p.lit}/${p.total}` : '🔒'); }).join('')}
      ${booth('star', 'STAR史塔財商 學院展位', '「1、5共振」展位', 0, true, '<span class="ac-sample">內容準備中</span>')}</div>
    <div class="ac-row" style="margin-top:14px"><button type="button" class="ac-btn ac-btn--sm" data-acgo="ac_book">知識卡圖鑑</button><button type="button" class="ac-btn ac-btn--ghost ac-btn--sm" data-acgo="acwrong">錯題本（${L.wrongList(A).length}）</button><button type="button" class="ac-btn ac-btn--ghost ac-btn--sm" id="acRePlace">重做程度測驗</button></div>${NA}`);
  el.querySelectorAll('[data-hall]').forEach(b => b.onclick = () => { const id = b.dataset.hall; if (id !== 'star' && !L.hallOpen(acad(), id, gm())) { X.toast('這個館還沒開放'); return; } X.goZone(id === 'star' ? 'ac_star' : 'ac_' + id); });
  el.querySelectorAll('[data-acgo]').forEach(b => b.onclick = () => X.open(b.dataset.acgo));
  el.querySelector('#acRePlace').onclick = () => { placeAns = []; acad().place = null; renderGate(el); };
}
function finishPlace(el, r) {
  const A = acad(); A.place = { score: r.score, to: r.to, date: X.today() }; placeAns = [];
  pay(L.payOnce(A, 'place', L.REWARD.place), null, '完成程度測驗');
  persist();
  const name = r.to === 'ta' ? '技術分析館' : '入門觀念館';
  el.innerHTML = wrap(`<div class="ac-panel" data-mode="entrance-result"><p class="ac-kicker">分級結果</p><h2 class="ac-h2">建議從「${name}」開始</h2>
    <p class="ac-sub">${r.score >= 0 ? `答對 ${r.score} / 3 題。` : ''}${r.to === 'ta' ? '基本觀念都懂了，直接去看圖表名詞。入門館也隨時可以逛。' : '先打底：認識工具 → 學會算錢 → 看懂風險，後面會更順。'}</p>
    <div class="ac-row"><button type="button" class="ac-btn" id="acGoRec">帶我去${name}</button><button type="button" class="ac-btn ac-btn--ghost" id="acGateHome">回入口大廳</button></div></div>`);
  el.querySelector('#acGoRec').onclick = () => X.goZone('ac_' + r.to);
  el.querySelector('#acGateHome').onclick = () => renderGate(el);
}

/* ---------- 館：路線圖、進度條、卡片列表、大卡、30 秒小測驗、示範工具 ---------- */
const view = { card: {}, flipped: false, wrong: {}, lecTab: 'today' };
function curCard(A, h) {
  const ids = L.hallCards(h);
  if (view.card[h.id] && ids.includes(view.card[h.id])) return view.card[h.id];
  return ids.find(id => L.cardOpen(A, id, gm()) && !L.cardDone(A, id)) || ids[0];
}
function renderHall(el, hallId, opt) {
  const A = acad(), h = L.hallById(hallId);
  if (!L.hallOpen(A, hallId, gm())) {
    el.innerHTML = wrap(`<div class="ac-panel ac-lock"><p class="ac-kicker">${esc(h.en)}</p><h2 class="ac-h2">${esc(h.name)}還沒開放</h2><p class="ac-sub">${A.place ? '入門觀念館第三關「看懂風險」收齊，或技術分析館收齊，就會開放。' : '先到入口大廳做 3 題程度測驗。'}</p><button type="button" class="ac-btn" id="acToGate">前往入口大廳</button></div>`);
    el.querySelector('#acToGate').onclick = () => X.goZone('ac_gate'); return;
  }
  if (opt && opt.card && L.CARDS[opt.card]) { view.card[hallId] = opt.card; view.flipped = false; }
  const cid = curCard(A, h); view.card[hallId] = cid;
  const c = L.CARDS[cid], lv = h.levels.find(l => l.id === c.level), p = L.hallProgress(A, h);
  const locked = !L.cardOpen(A, cid, gm()), isVs = lv.layout === 'vs';
  // 路線圖：多關的館顯示關卡，單一關的館（技術館）顯示每張卡
  const nodes = h.levels.length > 1
    ? h.levels.map((l, i) => ({ key: l.cards[0], name: l.name.replace(/^第.關・/, ''), label: h.id === 'intro' && i < 3 ? `第 ${i + 1} 關・` : '', done: L.levelDone(A, l), open: L.levelOpen(A, h.id, l.id, gm()), on: l === lv, sub: `${l.cards.filter(x => L.cardDone(A, x)).length}/${l.cards.length} 張` }))
    : L.hallCards(h).map((id, i) => ({ key: id, name: L.CARDS[id].title.split(/[：（]/)[0], label: '', done: L.cardDone(A, id), open: L.cardOpen(A, id, gm()), on: id === cid, sub: `第 ${i + 1} 站` }));
  const route = `<div class="ac-route">${nodes.map((n, i) => `<button type="button" class="ac-route__node${n.on ? ' is-on' : ''}${n.done ? ' is-done' : ''}${n.open ? '' : ' is-locked'}" data-node="${n.key}">
    <span class="ac-route__num">${n.done ? '✓' : n.open ? i + 1 : '🔒'}</span><span class="ac-route__txt"><b>${esc(n.label)}<wbr>${esc(n.name)}</b><small>${n.sub}${n.open ? '' : '・完成上一關解鎖'}</small></span></button>`).join('')}</div>`;
  const list = lv.cards;
  const quiz = locked ? `<div class="ac-panel ac-quiz"><div class="ac-empty">🔒 先收下前一張卡，這張就會打開。</div></div>`
    : `<div class="ac-panel ac-quiz" data-mode="hall"><h3>30 秒小測驗・${c.quiz.length} 題</h3><p class="ac-sub">${L.cardDone(A, cid) ? '已收藏，收進知識卡圖鑑了。' : `全對就收下這張卡（薪水 +${L.REWARD.card}）；答錯會進錯題本，講師馬明天再考你。`}</p>
       ${c.quiz.map((q, qi) => UI.question(c, qi, qState(A, q))).join('')}${L.cardDone(A, cid) ? nextCardBtn(A, c) : ''}</div>`;
  const tool = lv.tool === 'compound' || (h.id === 'intro' && L.levelOpen(A, 'intro', 'money', gm()) && lv.id !== 'index') ? 'compound' : lv.tool === 'ma' ? 'ma' : '';
  el.innerHTML = wrap(`<div class="ac-hallhead"><div><p class="ac-kicker">${esc(lv.name)}${gm() ? ' <span class="ac-chip ac-chip--ur">GM 全開預覽</span>' : ''}</p><p class="ac-sub" style="margin:0">${esc(h.desc)}</p></div>
    ${UI.progressBar(p.lit, p.total, '本館收集進度')}</div>
    ${route}${isVs ? '<div class="ac-cmpstrip"><div>左邊：<b>個股</b>，一家公司的事自己扛</div><div>右邊：<b>大盤</b>，很多公司一起分攤</div></div>' : ''}
    <div class="ac-stage">
      <div class="ac-list">${list.map(id => UI.miniCard(L.CARDS[id], { collected: L.cardDone(A, id), locked: !L.cardOpen(A, id, gm()), active: id === cid })).join('')}</div>
      <div class="ac-viewer">${UI.card(c, { collected: L.cardDone(A, cid), locked, compare: isVs, flipped: view.flipped })}
        <div class="ac-viewer__nav"><button type="button" class="ac-arrow" data-step="-1" aria-label="上一張" ${list.indexOf(cid) ? '' : 'disabled'}>‹</button><span>${list.indexOf(cid) + 1} / ${list.length}</span><button type="button" class="ac-arrow" data-step="1" aria-label="下一張" ${list.indexOf(cid) < list.length - 1 ? '' : 'disabled'}>›</button></div>
        <p class="cr-more">想更深入？私訊『成長』</p></div>
      ${quiz}</div>
    ${tool === 'compound' ? `<div data-tool="compound">${calcPanel()}</div>` : tool === 'ma' ? maPanel() : ''}
    <p class="ac-na">${h.id === 'mkt' ? '卡片數字都照資料檔的真實日期與數據。' : ''}僅供學習，非投資建議。</p>`, 'ac-hall-' + h.id);
  const go = id => { view.card[hallId] = id; view.flipped = false; renderHall(el, hallId); el.scrollTop = 0; };
  el.querySelectorAll('[data-goto]').forEach(b => b.onclick = () => go(b.dataset.goto));
  el.querySelectorAll('[data-node]').forEach(b => b.onclick = () => { if (b.classList.contains('is-locked')) { X.toast('完成上一關就會開放'); return; } go(b.dataset.node); });
  el.querySelectorAll('[data-step]').forEach(b => b.onclick = () => { const j = list.indexOf(cid) + +b.dataset.step; if (list[j]) go(list[j]); });
  el.querySelectorAll('.ac-card [data-act="flip"]').forEach(b => b.onclick = ev => { ev.stopPropagation(); view.flipped = !view.flipped; b.closest('.ac-card').classList.toggle('is-flipped', view.flipped); });
  el.querySelectorAll('.ac-quiz .ac-opt').forEach(b => b.onclick = () => {
    const k = parseQ(b.dataset.q), A2 = acad();
    if (A2.ok.includes(k.id)) return;
    const v = +b.dataset.choice, res = L.answer(A2, k.id, v, X.today());
    if (res.right) delete view.wrong[k.id]; else view.wrong[k.id] = v;
    X.blip(res.right ? 988 : 440);
    renderHall(el, hallId); afterAnswer(res, el);
  });
  const nx = el.querySelector('#acNextCard'); nx && (nx.onclick = () => go(nx.dataset.next));
  const bh = el.querySelector('#acBackHall'); bh && (bh.onclick = () => X.goZone('ac_gate'));
  if (tool === 'compound') mountCalc(el);
  if (tool === 'ma') mountMA(el);
  FX.countUp(el);
}
function qState(A, q) {
  if (A.ok.includes(q.id)) return { result: true };
  return view.wrong[q.id] === undefined ? {} : { result: false, choice: view.wrong[q.id] };
}
function nextCardBtn(A, c) {
  const h = L.hallById(c.hall), lv = h.levels.find(l => l.id === c.level), i = lv.cards.indexOf(c.id);
  const nx = lv.cards.slice(i + 1).concat(lv.cards.slice(0, i)).find(id => !L.cardDone(A, id));
  if (nx) return `<button type="button" class="ac-btn" id="acNextCard" data-next="${nx}" style="width:100%;margin-top:12px">下一張：${esc(L.CARDS[nx].title)}</button>`;
  const nl = h.levels[h.levels.indexOf(lv) + 1];
  if (nl && L.levelOpen(A, h.id, nl.id, gm())) return `<button type="button" class="ac-btn" id="acNextCard" data-next="${nl.cards[0]}" style="width:100%;margin-top:12px">下一關：${esc(nl.name.replace(/^第.關・/, ''))}</button>`;
  return `<button type="button" class="ac-btn ac-btn--gold" id="acBackHall" style="width:100%;margin-top:12px">本關收齊！回入口大廳看其他館</button>`;
}
/* 複利計算機：UI BOT 的 calcPanel＋renderCalcResult，預填卡片的示範數字 */
let calcVal = { P: '1000000', N: '20', R: '6' };
function mountCalc(el) {
  const host = el.querySelector('[data-tool="compound"]'); if (!host) return;
  const k = host.querySelector('.ac-kicker'); k && k.insertAdjacentHTML('beforeend', ' <span class="ac-sample">示範</span>');
  const $ = s => host.querySelector(s);
  $('#acP').value = calcVal.P; $('#acN').value = calcVal.N; $('#acR').value = calcVal.R;
  const run = animate => {
    const P = Number($('#acP').value.replace(/,/g, '')), N = Number($('#acN').value), R = Number($('#acR').value), err = $('#acErr');
    if (!(P > 0)) return err.textContent = '本金要大於 0';
    if (!Number.isInteger(N) || N < 1 || N > 60) return err.textContent = '年數請輸入 1 到 60 的整數';
    if ($('#acR').value.trim() === '' || !Number.isFinite(R) || R < -50 || R > 50) return err.textContent = '年報酬率請輸入 -50 到 50';
    err.textContent = ''; calcVal = { P: $('#acP').value, N: String(N), R: String(R) };
    renderCalcResult($('#acCalcOut'), P, N, R, animate);
  };
  $('#acCalcGo').onclick = () => run(true);
  host.querySelectorAll('.ac-input').forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') run(true); }));
  run(false);
}
/* 均線示範：假資料 K 線＋可拖動天數（UI BOT 沒有這個元件，用它的 ac-panel／ac-field 樣式組） */
function maPanel() {
  return `<div class="ac-panel ac-ma" data-tool="ma"><p class="ac-kicker">均線示範 <span class="ac-sample">示範・假資料</span></p><h3 class="ac-h2" style="font-size:1.1rem">拖動看均線變化</h3>
    <canvas class="ac-calc__chart ac-ma__cv" width="640" height="300" aria-label="示範 K 線與均線"></canvas>
    <label class="ac-field"><span>均線天數：<b class="ac-ma-n">5</b> 日</span><input type="range" min="3" max="30" value="5" class="ac-ma-range"></label>
    <p class="ac-na" style="margin:0">K 線是隨機產生的練習資料，不是任何商品的真實行情。天數越長，線越平滑、反應越慢。</p></div>`;
}
function mountMA(el) {
  const host = el.querySelector('[data-tool="ma"]'); if (!host) return;
  let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  let p = 100; const K = Array.from({ length: 60 }, (_, i) => { const o = p, c = o + Math.sin(i / 6) * 2.2 + (r() - .5) * 4; const k = { o, c, h: Math.max(o, c) + r() * 1.6, l: Math.min(o, c) - r() * 1.6 }; p = c; return k; });
  const cv = host.querySelector('canvas'), sl = host.querySelector('.ac-ma-range');
  const draw = () => {
    const n = +sl.value; host.querySelector('.ac-ma-n').textContent = n;
    const c = cv.getContext('2d'), w = cv.width, h = cv.height; c.clearRect(0, 0, w, h);
    const hi = Math.max(...K.map(k => k.h)), lo = Math.min(...K.map(k => k.l)), Y = v => 14 + (hi - v) / (hi - lo) * (h - 28), cw = (w - 20) / K.length;
    K.forEach((k, i) => { const up = k.c >= k.o, col = up ? '#ff5468' : '#2fd38a', x = 10 + i * cw + cw / 2; c.strokeStyle = col; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, Y(k.h)); c.lineTo(x, Y(k.l)); c.stroke(); c.fillStyle = col; const t0 = Y(Math.max(k.o, k.c)); c.fillRect(x - cw * .3, t0, cw * .6, Math.max(2, Y(Math.min(k.o, k.c)) - t0)); });
    c.strokeStyle = '#22d3ee'; c.lineWidth = 3; c.shadowColor = '#22d3ee'; c.shadowBlur = 8; c.beginPath(); let st = false;
    K.forEach((k, i) => { if (i < n - 1) return; const avg = K.slice(i - n + 1, i + 1).reduce((a, b) => a + b.c, 0) / n; const x = 10 + i * cw + cw / 2; st ? c.lineTo(x, Y(avg)) : (c.moveTo(x, Y(avg)), st = true); }); c.stroke(); c.shadowBlur = 0;
    c.fillStyle = '#9ff3ff'; c.font = '700 18px sans-serif'; c.fillText(`${n} 日均線（示範）`, 16, 26);
  };
  sl.addEventListener('input', draw); draw();
}

/* ---------- 學院展位（1、5共振：內容準備中）＋語錄牆（留空）＋私訊「成長」 ---------- */
function renderStar(el) {
  el.innerHTML = wrap(`<div class="ac-hallhead"><div><p class="ac-kicker">學院展位</p><h2 class="ac-h2">STAR史塔財商 學院展位</h2><p class="ac-sub" style="margin:0">「1、5共振」展位內容準備中。</p></div></div>
    <div class="ac-star__exhibit" id="acExhibit"></div>
    <div class="ac-wall"><div class="ac-panel"><p class="ac-kicker">最後一區</p><h3 class="ac-h2" style="font-size:1.15rem">董事長 LEO易凡 語錄牆</h3>
      <div class="ac-quotes"><div class="ac-quote">內容準備中</div><div class="ac-quote">內容準備中</div><div class="ac-quote">內容準備中</div></div></div></div>
    ${X.ctaHTML()}${NA}`);
  X.bindCta(el);
  mountSnippet(el.querySelector('#acExhibit'), 'exhibit-15'); // 1、5共振特展預告（剪影＋特展即將開幕＋內容準備中）
}

/* ---------- 知識卡圖鑑＋徽章／稱號 ---------- */
function renderBook(el) {
  const A = acad(), tot = L.totalProgress(A), got = L.badgesOf(A);
  el.innerHTML = wrap(`<div class="ac-dexhead"><div class="ac-badgecard">${UI.niuma('guide')}<div><small>我的工牌</small><b>${esc(A.title || '實習牛馬')}</b><p>收集 ${tot.lit} / ${tot.total} 張・連續打卡 ${X.streak()} 天・徽章 ${got.length} 枚</p><p style="color:#8fa3c4">拿到的徽章點一下就能當稱號</p></div></div>
    <div class="ac-panel">${UI.progressBar(tot.lit, tot.total, '全部知識卡')}<div style="height:14px"></div>
      <div class="ac-badges">${L.BADGES.map(b => { const on = got.some(x => x.id === b.id), cur = A.title === b.name;
        return `<button type="button" class="ac-badgebtn${on ? ' is-on' : ''}${cur ? ' is-cur' : ''}" data-badge="${esc(b.name)}" ${on ? '' : 'disabled'}>${UI.badge({ name: b.name, hint: on ? (cur ? '使用中・再點取消' : '點一下當稱號') : b.how, got: on })}</button>`; }).join('')}</div></div></div>
    <div class="ac-dex">${L.HALLS.map(h => { const p = L.hallProgress(A, h);
      return `<div class="ac-dex__h"><b>${esc(h.name)}</b><span>${p.lit}/${p.total}</span></div>` + L.hallCards(h).map(id => L.cardDone(A, id)
        ? `<div class="ac-dexcard" data-open="${id}">${UI.card(L.CARDS[id], { collected: true, compare: !!L.CARDS[id].compare })}</div>`
        : `<div class="ac-ghost" data-open="${id}"><div><b>？</b>${esc(L.CARDS[id].title)}<br>尚未收藏</div></div>`).join(''); }).join('')}</div>
    <div class="ac-row" style="margin-top:14px"><button type="button" class="ac-btn ac-btn--gold ac-btn--sm" data-acgo="acshare">分享成績圖</button><button type="button" class="ac-btn ac-btn--ghost ac-btn--sm" data-acgo="acwrong">錯題本</button></div>
    <p class="ac-na">卡片稀有度：青＝精良、紫＝稀有、金＝傳說、彩虹＝學院限定。僅供學習，非投資建議。</p>`);
  el.querySelectorAll('[data-badge]').forEach(b => b.onclick = () => { const A2 = acad(); A2.title = A2.title === b.dataset.badge ? '' : b.dataset.badge; persist(); renderBook(el); X.toast(A2.title ? `稱號：${A2.title}` : '已取消稱號'); });
  el.querySelectorAll('[data-open]').forEach(c => c.onclick = ev => {
    if (ev.target.closest('[data-act="flip"]')) { ev.stopPropagation(); c.querySelector('.ac-card') && c.querySelector('.ac-card').classList.toggle('is-flipped'); return; }
    const cd = L.CARDS[c.dataset.open]; if (!L.hallOpen(acad(), cd.hall, gm())) { X.toast('這個館還沒開放'); return; }
    if (!L.cardOpen(acad(), cd.id, gm())) { X.toast('先收下前一張卡'); return; }
    X.open('ac_' + cd.hall, { card: cd.id });
  });
  el.querySelectorAll('[data-acgo]').forEach(b => b.onclick = () => X.open(b.dataset.acgo));
  FX.countUp(el);
}

/* ---------- 錯題本 ---------- */
function wrongRows(A) {
  const td = X.today(), wl = L.wrongList(A);
  return wl.length ? wl.map(w => { const c = L.CARDS[w.q.card];
    return `<div class="ac-mist"><div><b>${esc(w.q.q)}</b><small>出自「${esc(c.title)}」・${w.date < td ? '今天講師馬會考' : '明天講師馬再考'}</small><small class="ac-mist__ans">正解：${'ABC'[w.q.answer]}．${esc(w.q.options[w.q.answer])}</small></div>
      <button type="button" class="ac-btn ac-btn--sm ac-btn--ghost" data-back="${c.id}">回展位</button></div>`; }).join('')
    : '<div class="ac-empty">錯題本是空的，很棒！</div>';
}
function bindBack(el) { el.querySelectorAll('[data-back]').forEach(b => b.onclick = () => { const c = L.CARDS[b.dataset.back]; if (!L.hallOpen(acad(), c.hall, gm())) { X.toast('這個館還沒開放'); return; } X.open('ac_' + c.hall, { card: c.id }); }); }
function renderWrong(el) {
  el.innerHTML = wrap(`<div class="ac-panel"><p class="ac-kicker">錯題本</p><p class="ac-sub">答錯的題目收在這裡。<b>隔天</b>到 7 樓找講師馬，每日 3 題會優先重考；答對就移出錯題本。</p>${wrongRows(acad())}</div>${NA}`);
  bindBack(el);
}

/* ---------- 講師馬每日 3 題 ---------- */
export function renderLecturerQuiz(el, n) {
  const A = acad(), td = X.today(), d = L.ensureDaily(A, td), sc = L.dailyScore(d), all = L.dailyAllDone(d), coins = L.dailyCoins(sc);
  const wl = L.wrongList(A);
  const body = view.lecTab === 'book' ? wrongRows(A) : d.ids.map((id, i) => {
    const { c, qi } = qCard(id), a = d.ans[i], st = a >= 0 ? { result: a === c.quiz[qi].answer, choice: a } : {};
    let qh = UI.question(c, qi, st);
    if (a >= 0) qh = qh.replace(/<button type="button" class="ac-opt/g, '<button type="button" disabled class="ac-opt');
    return `<div class="ac-dq" data-dq="${i}"><div class="ac-dq__src">第 ${i + 1} 題・出自 ${esc(L.hallById(c.hall).name)}「${esc(c.title)}」${(d.re || []).includes(id) ? '<em>錯題複習</em>' : ''}</div>${qh}</div>`;
  }).join('');
  el.innerHTML = wrap(`<div class="ac-door"><div class="ac-door__gate"><div>${UI.niuma('teacher')}</div><div><small>7 樓・工位旁</small><b>${esc(n.name)}</b><p class="ac-sub" style="margin:4px 0 0;font-size:.82rem">每天 3 題，題目都出自展覽館的卡。答錯的題，我明天再考你。</p></div></div>
    <div><div class="ac-tabs"><button type="button" class="ac-tab${view.lecTab === 'today' ? ' is-on' : ''}" data-tab="today">今日三題</button><button type="button" class="ac-tab${view.lecTab === 'book' ? ' is-on' : ''}" data-tab="book">錯題本（${wl.length}）</button></div>
    <div class="ac-panel" data-mode="daily">${view.lecTab === 'today' ? UI.progressBar(d.ans.filter(v => v >= 0).length, 3, `今日 3 題・${td}`) : ''}${body}
      ${view.lecTab === 'today' && all ? `<div class="ac-kpi ac-dq__score"><small>今日成績</small><b>${sc}</b><em>/ 3</em></div>
        <button type="button" class="ac-btn ac-btn--gold" id="acClaimDaily" style="width:100%" ${d.claimed || !coins ? 'disabled' : ''}>${d.claimed ? '今天已領，明天再來' : coins ? `領取薪水 +${coins}` : '今天沒答對，明天再來'}</button>` : ''}
      ${NA}</div>
    <div class="ac-row" style="margin-top:12px"><button type="button" class="ac-btn ac-btn--ghost ac-btn--sm" id="acLecShare">分享成績圖</button><button type="button" class="ac-btn ac-btn--ghost ac-btn--sm" id="acLecHall">去 8 樓展覽館</button></div></div></div>`);
  el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { view.lecTab = b.dataset.tab; renderLecturerQuiz(el, n); });
  el.querySelectorAll('[data-dq] .ac-opt').forEach(b => b.onclick = () => {
    const i = +b.closest('[data-dq]').dataset.dq, d2 = L.ensureDaily(acad(), X.today()); if (d2.ans[i] >= 0) return;
    const id = d2.ids[i], wasDue = (d2.re || []).includes(id);
    d2.ans[i] = +b.dataset.choice;
    const res = L.answer(acad(), id, d2.ans[i], X.today(), { retest: wasDue });
    X.blip(res.right ? 988 : 440);
    if (L.dailyAllDone(d2)) acad().hist[X.today()] = L.dailyScore(d2);
    renderLecturerQuiz(el, n); afterAnswer(res, el);
  });
  const cl = el.querySelector('#acClaimDaily'); cl && (cl.onclick = () => {
    const d2 = L.ensureDaily(acad(), X.today()); if (d2.claimed || !L.dailyAllDone(d2)) return;
    const c = L.dailyCoins(L.dailyScore(d2)); if (!c) return;
    if (gm()) { X.toast('GM 預覽：每日 3 題（不發薪水）'); return; }
    d2.claimed = true; persist(); pay(c, cl, `講師馬每日 3 題 ${L.dailyScore(d2)}/3`); renderLecturerQuiz(el, n);
  });
  bindBack(el);
  el.querySelector('#acLecShare').onclick = () => X.open('acshare');
  el.querySelector('#acLecHall').onclick = () => { X.close(); X.rideTo('f8'); };
  persist();
}

/* ---------- 一鍵分享成績圖（9:16，畫風照 UI BOT drawShare，欄位依老闆規格） ---------- */
export function shareStats() {
  const A = acad(), td = X.today(), d = A.daily && A.daily.date === td ? A.daily : null;
  return { streak: X.streak(), month: X.monthDays(), quiz: d && L.dailyAllDone(d) ? `${L.dailyScore(d)}/3` : d ? `${d.ans.filter(v => v >= 0).length}/3 作答中` : '尚未作答',
    cards: A.lit.length, total: Object.keys(L.CARDS).length, title: A.title || '實習牛馬', badges: L.badgesOf(A).length, coins: X.isGM() ? 0 : (X.S.coins | 0), date: td };
}
export function drawShare(cv, st) {
  const W = 1080, H = 1920; cv.width = W; cv.height = H; const x = cv.getContext('2d');
  const F = '"Noto Sans CJK TC","Noto Sans TC","PingFang TC",sans-serif', D = `"AC Clash",${F}`;
  let g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0a0f24'); g.addColorStop(1, '#04060c'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  for (const [cx, cy, r, c] of [[880, 260, 520, 'rgba(124,92,255,.35)'], [120, 1500, 560, 'rgba(34,211,238,.22)']]) { g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, c); g.addColorStop(1, 'transparent'); x.fillStyle = g; x.fillRect(0, 0, W, H); }
  x.strokeStyle = 'rgba(34,211,238,.12)'; x.lineWidth = 2;
  for (let i = -10; i <= 10; i++) { x.beginPath(); x.moveTo(540 + i * 30, 1420); x.lineTo(540 + i * 260, H); x.stroke(); }
  for (let j = 0; j < 9; j++) { const y = 1420 + Math.pow(j / 8, 2) * 500; x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
  x.strokeStyle = 'rgba(255,214,107,.7)'; x.lineWidth = 4; x.strokeRect(40, 40, W - 80, H - 80);
  x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  x.fillStyle = '#ffd66b'; x.font = `700 44px ${D}`; x.fillText('STAR史塔財商', 540, 170);
  x.fillStyle = '#fff'; x.font = `900 100px ${F}`; x.shadowColor = '#22d3ee'; x.shadowBlur = 30; x.fillText('牛馬交易上班日', 540, 300); x.shadowBlur = 0;
  x.fillStyle = '#9ff3ff'; x.font = `600 34px ${F}`; x.fillText(`我的上班成績・${st.date}`, 540, 370);
  // 知識卡進度環
  const R = 170, cx = 540, cy = 640, p = st.total ? st.cards / st.total : 0;
  x.lineWidth = 28; x.strokeStyle = 'rgba(255,255,255,.08)'; x.beginPath(); x.arc(cx, cy, R, 0, 7); x.stroke();
  g = x.createLinearGradient(cx - R, cy, cx + R, cy); g.addColorStop(0, '#22d3ee'); g.addColorStop(.6, '#a78bfa'); g.addColorStop(1, '#ffd66b');
  x.strokeStyle = g; x.lineCap = 'round'; x.shadowColor = '#22d3ee'; x.shadowBlur = 30; x.beginPath(); x.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(p, .002)); x.stroke(); x.shadowBlur = 0; x.lineCap = 'butt';
  x.fillStyle = '#fff'; x.font = `700 120px ${D}`; x.fillText(String(st.cards), cx, cy + 30);
  x.fillStyle = '#8fa3c4'; x.font = `600 34px ${F}`; x.fillText(`/ ${st.total} 張知識卡`, cx, cy + 90);
  const box = (y, label, val, col) => {
    x.fillStyle = 'rgba(255,255,255,.05)'; x.strokeStyle = 'rgba(120,220,255,.3)'; x.lineWidth = 2;
    x.beginPath(); x.roundRect ? x.roundRect(140, y, 800, 130, 28) : x.rect(140, y, 800, 130); x.fill(); x.stroke();
    x.textAlign = 'left'; x.fillStyle = '#8fa3c4'; x.font = `500 34px ${F}`; x.fillText(label, 190, y + 78);
    x.textAlign = 'right'; x.fillStyle = col; x.font = `700 ${val.length > 7 ? 44 : 56}px ${D}`; x.fillText(val, 890, y + 84); x.textAlign = 'center';
  };
  box(900, '稱號', st.title, '#c9b8ff'); box(1050, '連續打卡', `${st.streak} 天`, '#9ff3ff'); box(1200, '本月打卡', `${st.month} 天`, '#9ff3ff'); box(1350, '今日講師馬測驗', st.quiz, '#ffd66b');
  x.fillStyle = '#fff'; x.font = `700 44px ${F}`; x.fillText('想學完整版？來 STAR史塔財商', 540, 1600);
  x.fillStyle = '#ffd66b'; x.font = `700 40px ${F}`; x.fillText('私訊「成長」', 540, 1666);
  x.fillStyle = '#5d6f90'; x.font = `400 28px ${F}`; x.fillText('薪水為站內虛擬點數・僅供學習，非投資建議', 540, 1800);
  return cv;
}
let shareKind = 'score';
const SHARE_KINDS = { score: ['成績圖', 'niuma-score'], id: ['工作證', 'niuma-id'], payslip: ['薪資單', 'niuma-payslip'] };
function paintShare(cv, st) {
  if (shareKind === 'id') drawIdCard(cv, st); else if (shareKind === 'payslip') drawPayslip(cv, st); else drawShare(cv, st);
  return cv;
}
function renderShare(el) {
  const st = shareStats(), fn = `${SHARE_KINDS[shareKind][1]}-${st.date}.png`;
  el.innerHTML = wrap(`<div class="ac-share"><canvas class="ac-share__img" id="acShareCv" width="1080" height="1920" aria-label="成績圖預覽"></canvas>
    <div class="ac-panel"><p class="ac-kicker">9:16 直式</p><h2 class="ac-h2">一鍵分享${SHARE_KINDS[shareKind][0]}</h2>
      <div class="ac-tabs" style="margin:8px 0 10px">${Object.entries(SHARE_KINDS).map(([k, [n]]) => `<button type="button" class="ac-tab${k === shareKind ? ' is-on' : ''}" data-share-kind="${k}">${n}</button>`).join('')}</div>
      <p class="ac-sub">${shareKind === 'payslip' ? '薪資單上的薪水是站內虛擬點數，不能換現金。' : '連續打卡、本月打卡、今日測驗、知識卡數會自動帶進圖裡。'}圖片只在你的手機產生，不會上傳。</p>
      <div class="ac-row"><button type="button" class="ac-btn ac-btn--gold" id="acShareGo">分享</button><a class="ac-btn ac-btn--ghost" id="acShareDl" download="${fn}">下載圖片</a></div>
      <p class="ac-na">圖上只放學習進度，不放任何價位或報酬。非投資建議。</p></div></div>`);
  const cv = paintShare(el.querySelector('#acShareCv'), st);
  const redraw = () => { paintShare(cv, st); el.querySelector('#acShareDl').href = cv.toDataURL('image/png'); };
  el.querySelectorAll('[data-share-kind]').forEach(b => b.onclick = () => { shareKind = b.dataset.shareKind; renderShare(el); });
  el.querySelector('#acShareDl').href = cv.toDataURL('image/png');
  document.fonts && document.fonts.load('700 40px "AC Clash"').then(redraw).catch(() => {});
  el.querySelector('#acShareGo').onclick = async () => {
    const dl = el.querySelector('#acShareDl');
    try {
      const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
      const file = new File([blob], fn, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: '牛馬交易上班日', text: '我的上班成績｜STAR史塔財商・非投資建議' }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    dl.click(); X.toast('已下載成績圖');
  };
}

/* ---------- 選單（學院入口＋重看導覽） ---------- */
function renderMenu(el) {
  const A = acad(), tot = L.totalProgress(A), d = A.daily && A.daily.date === X.today() ? A.daily : null;
  const item = (m, ic, b, s) => `<button type="button" class="ac-menuitem" data-m="${m}">${UI.icon(ic)}<span><b>${b}</b><small>${s}</small></span></button>`;
  el.innerHTML = wrap(`<div class="ac-panel">${UI.progressBar(tot.lit, tot.total, '知識卡')}</div>
    <div class="ac-menu">${item('hall', 'star', '8 樓・STAR史塔財商學院展覽館', '入門觀念館・技術分析館・市場觀察館')}
    ${item('lec', 'eye', '講師馬每日 3 題', d && L.dailyAllDone(d) ? `今日 ${L.dailyScore(d)}/3${d.claimed ? '・已領' : ''}` : '7 樓工位旁')}
    ${item('ac_book', 'basket', '知識卡圖鑑', `${tot.lit}/${tot.total} 張・徽章 ${L.badgesOf(A).length}`)}
    ${item('acwrong', 'receipt', '錯題本', `${L.wrongList(A).length} 題`)}
    ${item('acshare', 'flow', '分享成績圖／工作證／薪資單', '9:16 直式圖片')}
    ${item('ukwall', 'eye', '外牆影音看板', 'IG 限動・Threads @wuz200200')}
    ${item('tour', 'compound', '重看 30 秒新手導覽', '打卡・工位・講師馬・展覽館・知識卡')}</div>`);
  el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => {
    const m = b.dataset.m;
    if (m === 'hall') { X.close(); X.rideTo('f8'); }
    else if (m === 'lec') X.goNpc('n_lec_f7');
    else if (m === 'tour') { X.close(); startTour(true); }
    else X.open(m);
  });
}

/* ---------- 30 秒新手導覽（UI BOT ac-tour 樣式；不擋操作） ---------- */
const TOUR = [
  { k: '打卡', t: '每天先打卡', p: '1 樓櫃台小美幫你打卡領薪水，連續越久領越多。' },
  { k: '工位', t: '升級你的工位', p: '7 樓個人交易室，用薪水把紙箱一路升到頂樓交易室、買小擺設。' },
  { k: '講師馬', t: '講師馬每日 3 題', p: '7 樓工位旁的講師馬每天出 3 題，答對領薪水，答錯明天再考。' },
  { k: '展覽館', t: '8 樓學院展覽館', p: '進門 3 題程度測驗，帶你去入門觀念館或技術分析館闖關。' },
  { k: '知識卡', t: '收集精品知識卡', p: '每張卡 3 題小考，全對就收進圖鑑，收齊一關拿徽章。' },
];
let tourT = null;
export function shouldTour(hasProgress) { return !gm() && !acad().tour && !hasProgress; }
export function startTour(manual = false, onDone) {
  endTour(false);
  const el = document.createElement('div'); el.id = 'acTour'; el.className = 'ac-tour'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', '新手導覽');
  layer().appendChild(el);
  let i = 0; const STEP = 6000;
  const next = () => { i++; i < TOUR.length ? show() : endTour(true, onDone); };
  const show = () => {
    const s = TOUR[i];
    el.innerHTML = `<div class="ac-tour__box ac-tour__box--dock">${UI.niuma('guide')}<div class="ac-tour__card"><p class="ac-kicker">30 秒新手導覽・${i + 1}/${TOUR.length}・${s.k}</p><b>${s.t}</b><p>${s.p}</p>
      <div class="ac-tour__bar"><i></i></div><div class="ac-tour__btns"><button type="button" class="ac-linkbtn" id="acTourSkip">跳過</button><small>約 ${Math.round((TOUR.length - i) * STEP / 1000)} 秒</small><button type="button" class="ac-btn ac-btn--sm" id="acTourNext">${i + 1 < TOUR.length ? '下一步' : '開始上班'}</button></div></div></div>`;
    const bar = el.querySelector('.ac-tour__bar i'); bar.style.transition = 'none'; bar.style.width = '0';
    requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.transition = `width ${STEP}ms linear`; bar.style.width = '100%'; }));
    el.querySelector('#acTourSkip').onclick = () => endTour(true, onDone);
    el.querySelector('#acTourNext').onclick = next;
    clearTimeout(tourT); tourT = setTimeout(next, STEP);
  };
  show();
}
export function endTour(mark = true, onDone) {
  clearTimeout(tourT); const el = document.getElementById('acTour'); if (el) el.remove();
  if (mark) { const A = acad(); if (!A.tour) { A.tour = true; persist(); } if (onDone) onDone(); }
}

export const ACAD_RENDER = {
  ac_gate: renderGate, ac_intro: (el, o) => renderHall(el, 'intro', o), ac_ta: (el, o) => renderHall(el, 'ta', o), ac_mkt: (el, o) => renderHall(el, 'mkt', o),
  ac_star: renderStar, ac_book: renderBook, acwrong: renderWrong, acshare: renderShare, acmenu: renderMenu,
};
export function acadTodos() {
  const A = acad(), d = A.daily && A.daily.date === X.today() ? A.daily : null;
  return { ac_gate: !A.place, acmenu: !(d && (d.claimed || (L.dailyAllDone(d) && !L.dailyScore(d)))) };
}
