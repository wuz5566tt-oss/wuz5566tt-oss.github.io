// 資格與資格碼（訪客頁與驗證頁共用）
// 注意：簽章金鑰放在前端程式裡，只能擋一般人隨手改數字；懂技術的人仍可能偽造。
const SIGN_KEY = 'niuma-qual-v1-32bebc041718accfe4ea6f53607eb32d';
// ===== 解鎖門檻設定（只改這裡） =====
export const TARGET_DAYS = 30;   // 目標值系統＋5 樓目標值研究室
export const TW_DAYS = 7;        // 台指模型
export const MASTER_DAYS = 60;   // 掌門面試收徒
// 老闆定的階梯（由弱到強）：台美股戰報 < 美指模型 < 台指模型 < 目標值系統 < 掌門面試收徒
// 寫進資格碼的四項（依序）：美指、台指、目標值系統、掌門面試收徒；台美股戰報免登記
export const MODELS = [
  { id: 'us', name: '美指模型', need: 0, how: '第一天加入 LINE 進群就送' },
  { id: 'tw', name: '台指模型', need: TW_DAYS, how: `累積打卡 ${TW_DAYS} 天解鎖` },
  { id: 'target', name: '目標值系統', need: TARGET_DAYS, how: `累積打卡 ${TARGET_DAYS} 天解鎖，加入 LINE 領取` },
  { id: 'master', name: '掌門面試收徒', need: MASTER_DAYS, how: `最後一關・累積打卡 ${MASTER_DAYS} 天，加官方 LINE 申請面試` },
];
export const LADDER = [
  { name: '台美股戰報', where: '第 1 天', rule: '4 樓直接看，不用登記', need: 0 },
  { name: '美指模型', where: '第 1 天', rule: '加入 LINE 進群就送', need: 0 },
  { name: '台指模型', where: `第 ${TW_DAYS} 天`, rule: `累積打卡 ${TW_DAYS} 天解鎖`, need: TW_DAYS },
  { name: '目標值系統', where: `第 ${TARGET_DAYS} 天`, rule: `累積打卡 ${TARGET_DAYS} 天・5 樓目標值研究室`, need: TARGET_DAYS, best: true },
  { name: '掌門面試收徒', where: `第 ${MASTER_DAYS} 天`, rule: `累積打卡 ${MASTER_DAYS} 天・加官方 LINE 申請面試`, need: MASTER_DAYS, last: true },
];
export const RANK_NAMES = ['實習牛馬', '正職牛馬', '組長', '經理', '總監', '董事'];
export const VALID_DAYS = 30, RULE_MIN = 5;
const pad = (n, l = 2) => String(n).padStart(l, '0');
export const dstr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseD = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return dstr(d); };
const yymmdd = s => s ? s.slice(2, 4) + s.slice(5, 7) + s.slice(8, 10) : '000000';
const fromYY = t => t === '000000' ? null : `20${t.slice(0, 2)}-${t.slice(2, 4)}-${t.slice(4, 6)}`;

// 續用：到期前要再送出資格碼；該段 30 天裡每 7 天都打卡 5 天以上，才算達續用資格
// 暫停後，近 7 天再打卡 5 天以上 → 狀態 4「可重新啟動」（送出新資格碼，審核後加回並重算 30 天）
export function ruleOk(start, daysSet) {
  for (let j = 0; j < 4; j++) {
    let n = 0; for (let k = 0; k < 7; k++) if (daysSet.has(addDays(start, j * 7 + k))) n++;
    if (n < RULE_MIN) return false;
  }
  return true;
}
export function modelExpiry(claim, daysSet, today) {
  let exp = addDays(claim, VALID_DAYS), renew = 0;
  while (today >= exp && ruleOk(addDays(exp, -VALID_DAYS), daysSet)) { exp = addDays(exp, VALID_DAYS); renew++; }
  return { exp, renew, active: today < exp };
}
export function last7(daysSet, today) { let n = 0; for (let k = 0; k < 7; k++) if (daysSet.has(addDays(today, -k))) n++; return n; }

// 狀態：0 未達資格、1 可登記、2 有效、3 已到期（暫停）、4 可重新啟動
export const STATE_NAMES = ['未達資格', '可以登記領取', '有效', '已到期', '可重新啟動'];
export function modelStates(S, today, totalDays) {
  const set = new Set(S.days || []);
  const recent = last7(set, today);
  return MODELS.map(m => {
    const claim = (S.claims || {})[m.id];
    if (claim) {
      const e = modelExpiry(claim, set, today);
      if (e.active) return { ...m, claim, ...e, state: 2 };
      return { ...m, claim, ...e, state: recent >= RULE_MIN ? 4 : 3 };
    }
    return { ...m, state: totalDays >= m.need ? 1 : 0, short: Math.max(0, m.need - totalDays) };
  });
}

async function hmac8(msg) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(SIGN_KEY), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const b = new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(msg)));
  return pad((((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0) % 100000000, 8);
}
// 資格碼第 3 版：全數字 56 碼，七碼一組
export async function encodeQual({ vid, total, streak, rank, issued, models }) {
  let body = '3' + pad(vid, 6) + pad(Math.min(999, total), 3) + pad(Math.min(999, streak), 3) + String(rank) + yymmdd(issued);
  models.forEach(m => { body += String(m.state) + yymmdd(m.state >= 2 ? m.exp : null); });
  const all = body + await hmac8(body);
  return all.match(/.{1,7}/g).join('-');
}
export async function decodeQual(code) {
  const d = String(code || '').replace(/\D/g, '');
  const N = 20 + MODELS.length * 7 + 8;
  if (d.length === 49 && (d[0] === '1' || d[0] === '2')) return { ok: false, reason: '這是舊版資格碼，請對方重新產生一組' };
  if (d.length !== N || d[0] !== '3') return { ok: false, reason: `格式不對（應為 ${N} 位數字）` };
  const body = d.slice(0, N - 8), sig = d.slice(N - 8);
  const genuine = (await hmac8(body)) === sig;
  const out = { ok: true, genuine, vid: body.slice(1, 7), total: +body.slice(7, 10), streak: +body.slice(10, 13), rank: +body[13], issued: fromYY(body.slice(14, 20)), models: [] };
  for (let i = 0; i < MODELS.length; i++) { const p = body.slice(20 + i * 7, 27 + i * 7); out.models.push({ ...MODELS[i], state: +p[0], exp: fromYY(p.slice(1)) }); }
  return out;
}
