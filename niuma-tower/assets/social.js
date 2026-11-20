// 共用資料轉接層（Data Adapter）
// 排行榜、溫度計票數：Supabase 免費專案 niuma-tower（REST + 匿名登入，不載入額外套件）。
// 每日漲跌結果、ETF 收盤價、戰報題庫：讀 data/*.json（由平日排程更新，見 /workspace/scripts/niuma-fin-data.py）。
//
// 介面：
//   mode                         'remote' | 'local-mock'（?mock=1 測試用）
//   loadResults() / loadPrices() / loadQuiz()
//   setGM(fn)                    GM 模式：只讀不寫（不註冊、不上傳、不投票）
//   syncMe(snap)                 上傳自己的成績（合併、防抖，最快 15 秒一次；伺服器端另有夾限與限速）
//   submitVote({ date, market, pick })   → { ok, reason? }（伺服器一人一市場一天一票）
//   getVoteTally(date, market)   → { up, down, offline? }
//   getLeaderboard(kind, me)     → 陣列 [{ name, rank, value, extra, me }]，陣列上帶 .status：'ok' | 'offline'
//   status()                     → { online, auth: 'ok'|'off'|'none' }
//
// 安全：這裡只放 publishable key（公開金鑰，本來就可以放前端）；service_role／secret key 不可放進任何檔案。
// 每張表都開 RLS：任何人可讀排行榜；只能寫自己的那一列；投票只看得到自己的票、投了不能改。

const SB_URL = 'https://cryqjmwdqtyeiubpdlzn.supabase.co';
const SB_KEY = 'sb_publishable_kftbKBylMZYtr43huCr5jQ_sLeaZV3B';
const SESS_KEY = 'niuma-sb-session-v1';
const SENT_KEY = 'niuma-sb-sent-v1';
const BOARD_TTL = 60e3, TALLY_TTL = 30e3, DOWN_FOR = 60e3, MIN_GAP = 15e3, DEBOUNCE = 4e3, TIMEOUT = 6e3, TOP = 20;

const fileCache = {};
async function getJSON(path) {
  if (fileCache[path]) return fileCache[path];
  const p = fetch(path, { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  fileCache[path] = p.catch(e => { delete fileCache[path]; throw e; });
  return fileCache[path];
}
const files = {
  loadResults: () => getJSON('./data/market-results.json'),
  loadPrices: () => getJSON('./data/etf-prices.json'),
  loadQuiz: () => getJSON('./data/report-quiz.json'),
};
const lsGet = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
const lsSet = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const tpeMonth = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit' }).format(new Date()).slice(0, 7);

function remoteBackend() {
  let isGM = () => false;
  let downUntil = 0, authState = 'none', sess = lsGet(SESS_KEY), signing = null;
  const cache = new Map();
  let pending = null, timer = null, lastSend = 0, sending = false;

  async function call(path, { method = 'GET', body, auth = false, prefer } = {}) {
    if (Date.now() < downUntil) throw new Error('offline');
    const h = { apikey: SB_KEY, 'Content-Type': 'application/json' };
    if (auth) { const s = await session(); if (!s) throw new Error('noauth'); h.Authorization = 'Bearer ' + s.access_token; }
    if (prefer) h.Prefer = prefer;
    const ac = new AbortController(), to = setTimeout(() => ac.abort(), TIMEOUT);
    let r;
    try { r = await fetch(SB_URL + path, { method, headers: h, body: body == null ? undefined : JSON.stringify(body), signal: ac.signal, cache: 'no-store' }); }
    catch (e) { downUntil = Date.now() + DOWN_FOR; throw new Error('offline'); }
    finally { clearTimeout(to); }
    if (r.status >= 500 || r.status === 0) { downUntil = Date.now() + DOWN_FOR; throw new Error('offline'); }
    const txt = await r.text(); let data = null; try { data = txt ? JSON.parse(txt) : null; } catch { data = txt; }
    if (!r.ok) { const e = new Error((data && (data.message || data.msg || data.error_code)) || ('HTTP ' + r.status)); e.status = r.status; e.data = data; throw e; }
    return data;
  }
  function keep(s) {
    if (!s || !s.access_token) return null;
    sess = { access_token: s.access_token, refresh_token: s.refresh_token, expires_at: s.expires_at || (Math.floor(Date.now() / 1000) + (s.expires_in || 3600)), uid: (s.user && s.user.id) || s.uid };
    lsSet(SESS_KEY, sess); authState = 'ok'; return sess;
  }
  async function session() {
    if (isGM()) return null; // GM 不註冊、不登入
    if (sess && sess.access_token && sess.expires_at - 60 > Date.now() / 1000) { authState = 'ok'; return sess; }
    if (signing) return signing;
    signing = (async () => {
      try {
        if (sess && sess.refresh_token) {
          try { return keep(await call('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: sess.refresh_token } })); }
          catch (e) { if (e.message === 'offline') throw e; sess = null; lsSet(SESS_KEY, null); }
        }
        if (authState === 'off') return null;
        try { return keep(await call('/auth/v1/signup', { method: 'POST', body: { data: {} } })); } // 匿名登入（不需要 email、不需要真名）
        catch (e) { if (e.data && /anonymous/i.test(JSON.stringify(e.data))) authState = 'off'; throw e; }
      } finally { signing = null; }
    })();
    try { return await signing; } catch { return null; }
  }
  const myId = () => (sess && sess.uid) || null;
  function cached(key, ttl, fn) {
    const c = cache.get(key);
    if (c && Date.now() - c.t < ttl) return c.p;
    const p = fn(); cache.set(key, { t: Date.now(), p });
    p.catch(() => cache.delete(key));
    return p;
  }

  // ---- 上傳自己的成績：合併、防抖、相同就不送 ----
  function syncMe(snap) {
    if (isGM() || !snap) return;
    const last = lsGet(SENT_KEY) || {};
    const s = Object.assign({}, last.snap || {}, pending || {}, snap);
    if (snap.sim_month === undefined && last.snap) { s.sim_month = last.snap.sim_month; s.sim_ret = last.snap.sim_ret; s.sim_mdd = last.snap.sim_mdd; }
    pending = s;
    if (last.key === JSON.stringify(s) && last.uid === myId()) { pending = null; return; }
    clearTimeout(timer);
    const wait = Math.max(DEBOUNCE, lastSend + MIN_GAP - Date.now());
    timer = setTimeout(flush, wait);
  }
  async function flush() {
    if (!pending || sending || isGM()) return;
    sending = true; const s = pending; pending = null; lastSend = Date.now();
    try {
      await call('/rest/v1/rpc/submit_score', { method: 'POST', auth: true, body: {
        p_nick: s.nick, p_rank: s.rank, p_wealth: s.wealth | 0, p_streak: s.streak | 0, p_best: s.best | 0, p_win: s.win | 0, p_n: s.n | 0,
        p_sim_month: s.sim_month || null, p_sim_ret: +(s.sim_ret || 0).toFixed(2), p_sim_mdd: +(s.sim_mdd || 0).toFixed(2) } });
      lsSet(SENT_KEY, { key: JSON.stringify(s), snap: s, uid: myId(), at: Date.now() });
      [...cache.keys()].forEach(k => k.startsWith('b:') && cache.delete(k));
    } catch (e) {
      if (e.message === 'rate_limited') { pending = Object.assign({}, s, pending || {}); timer = setTimeout(flush, MIN_GAP); }
      else if (e.message === 'bad_nick') { lastBad = s.nick; }
      // 其他錯誤（離線、暫停）安靜略過，下次再送
    } finally { sending = false; }
  }
  let lastBad = null;

  const SEL = {
    wealth: { q: 'select=player_id,nick,rank,wealth&order=wealth.desc,updated_at.asc', v: r => r.wealth },
    'arena-streak': { q: 'select=player_id,nick,rank,arena_streak,arena_best,arena_win,arena_n&arena_n=gt.0&order=arena_streak.desc,arena_rate.desc', v: r => r.arena_streak },
    'arena-rate': { q: 'select=player_id,nick,rank,arena_rate,arena_win,arena_n&arena_n=gte.5&order=arena_rate.desc,arena_n.desc', v: r => +r.arena_rate },
    sim: { q: () => `select=player_id,nick,rank,sim_ret,sim_mdd&sim_month=eq.${tpeMonth()}&order=sim_ret.desc`, v: r => +r.sim_ret },
  };
  async function getLeaderboard(kind, me) {
    const S = SEL[kind]; let rows, status = 'ok';
    try {
      const q = typeof S.q === 'function' ? S.q() : S.q;
      const data = await cached('b:' + kind + ':' + q, BOARD_TTL, () => call(`/rest/v1/board?${q}&limit=${TOP}`));
      const id = myId();
      rows = data.map(r => ({ name: r.nick, rank: r.rank, value: S.v(r), me: !!id && r.player_id === id,
        extra: kind === 'sim' ? { ret: +r.sim_ret, mdd: +r.sim_mdd } : kind.startsWith('arena') ? { win: r.arena_win, n: r.arena_n } : null }));
    } catch { rows = []; status = 'offline'; }
    if (me && !rows.some(r => r.me)) rows.push({ ...me, me: true, unranked: status === 'ok' });
    rows.status = status;
    return rows;
  }
  async function getVoteTally(date, market) {
    try {
      const t = await cached(`t:${date}:${market}`, TALLY_TTL, () => call('/rest/v1/rpc/vote_tally', { method: 'POST', body: { d: date, m: market } }));
      return { up: +t.up || 0, down: +t.down || 0 };
    } catch { return { up: 0, down: 0, offline: true }; }
  }
  async function submitVote({ date, market, pick }) {
    if (isGM()) return { ok: false, reason: 'gm' };
    try {
      await call('/rest/v1/votes', { method: 'POST', auth: true, prefer: 'return=minimal', body: { vdate: date, market, pick } });
      cache.delete(`t:${date}:${market}`); return { ok: true };
    } catch (e) {
      if (e.status === 409) return { ok: false, reason: 'dup' };
      return { ok: false, reason: e.message };
    }
  }
  return {
    mode: 'remote', ...files,
    setGM(fn) { isGM = fn; },
    syncMe, submitVote, getVoteTally, getLeaderboard,
    status: () => ({ online: Date.now() >= downUntil, auth: authState, badNick: lastBad }),
    flushNow: () => { clearTimeout(timer); return flush(); },
    _id: myId,
  };
}

// 測試用（?mock=1）：完全不連網，排行榜只有自己
function mockBackend() {
  const VK = 'niuma-mock-votes-v1', votes = lsGet(VK) || {};
  return {
    mode: 'local-mock', ...files,
    setGM() {}, syncMe() {}, flushNow: async () => {},
    async submitVote({ date, market, pick }) { const k = date + ':' + market; if (votes[k]) return { ok: false, reason: 'dup' }; votes[k] = pick; lsSet(VK, votes); return { ok: true }; },
    async getVoteTally(date, market) { const v = votes[date + ':' + market]; return { up: v === 'up' ? 1 : 0, down: v === 'down' ? 1 : 0 }; },
    async getLeaderboard(kind, me) { const rows = me ? [{ ...me, me: true }] : []; rows.status = 'ok'; return rows; },
    status: () => ({ online: true, auth: 'mock' }),
  };
}

export const backend = new URLSearchParams(location.search).has('mock') ? mockBackend() : remoteBackend();
