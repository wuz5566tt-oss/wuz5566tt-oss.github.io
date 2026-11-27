import { normOffice } from './office.js';
import { normAcademy } from './academy-logic.js';
import { normCareer } from './career.js';
// 進度備份碼：壓縮後以數字呈現，再用 HMAC 簽名（金鑰在前端，只能擋隨手改碼）
const BAK_KEY = 'niuma-bak-v1-7c3e9a1f0b24d8e55a91c4f6e2d0b387';
const VER = 1;

const enc = new TextEncoder(), dec = new TextDecoder();
const pad = (n, l = 8) => String(n).padStart(l, '0');

async function hmac8(msg) {
  const k = await crypto.subtle.importKey('raw', enc.encode(BAK_KEY), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const b = new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(msg)));
  return pad((((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0) % 100000000, 8);
}

async function deflateBytes(raw) {
  if (typeof CompressionStream === 'function') {
    const s = new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    return { flag: 1, bytes: new Uint8Array(await new Response(s).arrayBuffer()) };
  }
  return { flag: 0, bytes: raw };
}
async function inflateBytes(bytes) {
  if (typeof DecompressionStream !== 'function') throw new Error('no-inflate');
  const s = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(s).arrayBuffer());
}

function bytesToDigits(bytes) {
  let n = 0n;
  for (const b of bytes) n = (n << 8n) + BigInt(b);
  return n.toString(10);
}
function digitsToBytes(digits) {
  let n = BigInt(digits);
  if (n === 0n) return new Uint8Array([0]);
  const out = [];
  while (n > 0n) { out.push(Number(n & 255n)); n >>= 8n; }
  out.reverse();
  return new Uint8Array(out);
}
const group7 = s => s.replace(/(\d{7})(?=\d)/g, '$1-');

function packDays(days) {
  const xs = [...new Set((days || []).filter(Boolean))].sort();
  if (!xs.length) return '';
  const t0 = Date.parse(xs[0] + 'T00:00:00');
  const off = xs.map(d => Math.round((Date.parse(d + 'T00:00:00') - t0) / 86400000));
  return xs[0] + ':' + off.slice(1).map(n => n.toString(36)).join(',');
}
function unpackDays(s) {
  if (!s) return [];
  const [a, b] = String(s).split(':');
  const t0 = Date.parse(a + 'T00:00:00');
  const out = [a];
  if (b) b.split(',').forEach(x => {
    if (!x) return;
    const d = new Date(t0 + parseInt(x, 36) * 86400000);
    const m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
    out.push(`${d.getFullYear()}-${m}-${day}`);
  });
  return out;
}


/** 向下相容：把打卡日期清單整理好。沒有清單時只補 last（或今天已打的 last），不依連續天數虛構過去的日期。最多保留約 400 天。 */
export function normCheckinDays(S) {
  if (!S || typeof S !== 'object') return [];
  const ok = d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
  let days = Array.isArray(S.days) ? S.days.filter(ok) : [];
  if (!days.length && ok(S.last)) days = [S.last];
  S.days = [...new Set(days)].sort().slice(-400);
  return S.days;
}

function snapshot(S) {
  return {
    v: VER,
    vid: S.vid || null,
    coins: S.coins | 0,
    xp: S.xp | 0,
    streak: S.streak | 0,
    last: S.last || null,
    days: packDays(S.days),
    claims: S.claims || {},
    shop: S.shop || { owned: [], eq: {} },
    games: S.games || {},
    guesses: S.guesses || {},
    fortune: S.fortune || null,
    reviews: S.reviews || {},
    week: S.week || {},
    quests: S.quests || {},
    fin: S.fin || {},
    office: S.office || {},
    academy: S.academy || {},
    career: S.career || {},
  };
}

export function applySnapshot(S, data) {
  S.vid = data.vid || S.vid;
  S.coins = data.coins | 0;
  S.xp = data.xp | 0;
  S.streak = data.streak | 0;
  S.last = data.last || null;
  S.days = Array.isArray(data.days) ? data.days : unpackDays(data.days);
  normCheckinDays(S);
  S.claims = data.claims || {};
  S.shop = data.shop && typeof data.shop === 'object' ? data.shop : { owned: [], eq: {} };
  if (!Array.isArray(S.shop.owned)) S.shop.owned = [];
  if (!S.shop.eq || typeof S.shop.eq !== 'object') S.shop.eq = {};
  S.games = data.games || {};
  S.guesses = data.guesses || {};
  S.fortune = data.fortune || null;
  S.reviews = data.reviews || {};
  S.week = data.week || {};
  S.quests = data.quests && typeof data.quests === 'object' ? data.quests : { daily: {}, done: [], day: {} };
  S.fin = data.fin && typeof data.fin === 'object' ? data.fin : {};
  S.office = normOffice(data.office && typeof data.office === 'object' ? data.office : S.office || {});
  // 舊備份碼沒有 academy：保留這台裝置目前的學院進度
  S.academy = normAcademy(data.academy && typeof data.academy === 'object' ? data.academy : S.academy || {});
  // 舊備份碼沒有 career（入職清單、造型）：保留這台裝置目前的資料
  S.career = normCareer(data.career && typeof data.career === 'object' ? data.career : S.career || {});
}

export async function encodeBackup(S) {
  if (!(window.crypto && crypto.subtle)) throw new Error('no-crypto');
  const raw = enc.encode(JSON.stringify(snapshot(S)));
  const { flag, bytes } = await deflateBytes(raw);
  const payload = new Uint8Array(bytes.length + 1);
  payload[0] = flag;
  payload.set(bytes, 1);
  const body = bytesToDigits(payload);
  const sig = await hmac8(body);
  return '牛馬' + VER + '-' + group7(body + sig);
}

export async function decodeBackup(code) {
  const raw = String(code || '').trim().replace(/\s+/g, '');
  if (!raw) return { ok: false, reason: 'invalid' };
  const m = raw.match(/^牛馬(\d+)[-－]?([0-9-]+)$/);
  if (!m) {
    if (/^\d{7}-/.test(raw) || /^\d{49,}/.test(raw.replace(/\D/g, ''))) return { ok: false, reason: 'invalid' };
    return { ok: false, reason: 'invalid' };
  }
  const ver = +m[1];
  if (ver < VER) return { ok: false, reason: 'old' };
  if (ver > VER) return { ok: false, reason: 'old' };
  const digits = m[2].replace(/\D/g, '');
  if (digits.length <= 8) return { ok: false, reason: 'invalid' };
  const body = digits.slice(0, -8), sig = digits.slice(-8);
  let genuine = false;
  try { genuine = (await hmac8(body)) === sig; } catch { return { ok: false, reason: 'invalid' }; }
  if (!genuine) return { ok: false, reason: 'tampered' };
  try {
    const payload = digitsToBytes(body);
    if (!payload.length) return { ok: false, reason: 'invalid' };
    const flag = payload[0], rest = payload.slice(1);
    let jsonBytes = rest;
    if (flag === 1) jsonBytes = await inflateBytes(rest);
    else if (flag !== 0) return { ok: false, reason: 'old' };
    const data = JSON.parse(dec.decode(jsonBytes));
    if (!data || typeof data !== 'object') return { ok: false, reason: 'invalid' };
    if ((data.v | 0) < VER) return { ok: false, reason: 'old' };
    if ((data.v | 0) > VER) return { ok: false, reason: 'old' };
    data.days = Array.isArray(data.days) ? data.days : unpackDays(data.days);
    return { ok: true, data };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}

export function hasProgress(S) {
  return !!(S && ((S.days && S.days.length) || S.coins || S.xp || (S.shop && S.shop.owned && S.shop.owned.length) || (S.claims && Object.keys(S.claims).length)));
}
