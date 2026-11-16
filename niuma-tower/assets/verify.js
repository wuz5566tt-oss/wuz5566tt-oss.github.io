import { GATE_HASH } from './insider-data.js';
import { decodeQual, RANK_NAMES } from './qual.js';
const $ = s => document.querySelector(s);
const pad = n => String(n).padStart(2, '0');
const today = (() => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; })();
const fmt = s => s ? s.replace(/-/g, '/') : '—';
async function sha(t) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
const KEY = 'niuma-verify';
function openTool() { $('#gate').hidden = true; $('#tool').hidden = false; $('#code').focus(); }
try { if (sessionStorage.getItem(KEY) === 'ok') openTool(); } catch {}
$('#gate').onsubmit = async e => {
  e.preventDefault();
  if (await sha($('#pass').value.trim().toUpperCase()) === GATE_HASH) { try { sessionStorage.setItem(KEY, 'ok'); } catch {} openTool(); }
  else { $('#gerr').textContent = '暗號有誤'; $('#pass').classList.add('wrong'); }
};
const ST = ['未達資格', '可登記、尚未領取', '有效', '已到期', '可重新啟動'];
$('#go').onclick = async () => {
  const r = await decodeQual($('#code').value);
  if (!r.ok) { $('#out').innerHTML = `<div class="verdict bad">${r.reason}</div>`; return; }
  const restart = r.models.some(m => m.state === 4);
  const rows = r.models.map(m => {
    let live = '<span class="mute">—</span>';
    if (m.state === 4) live = '<span class="restart">可重新啟動</span>';
    else if (m.state === 3) live = '<span class="bad">今天已過期</span>';
    else if (m.state === 2 && m.exp) live = today < m.exp ? '<span class="ok">今天仍有效</span>' : '<span class="bad">今天已過期</span>';
    const st = m.state === 4 ? '<b class="restart">可重新啟動</b>' : (ST[m.state] || '未知');
    return `<tr class="${m.state === 4 ? 'restart-row' : ''}"><td>${m.name}</td><td>${st}</td><td>${fmt(m.exp)}</td><td>${live}</td></tr>`;
  }).join('');
  $('#out').innerHTML = `<div class="verdict ${r.genuine ? 'ok' : 'bad'}">${r.genuine ? '✓ 資格碼正確，沒有被改過' : '✕ 資格碼被改過或打錯，請勿採信'}</div>
    ${restart ? '<div class="verdict restart" id="restartFlag">可重新啟動：審核通過後請加回群組，並從今天重新起算 30 天。</div>' : ''}
    <div class="card"><table>
      <tr><th>訪客編號</th><td>${r.vid}</td></tr><tr><th>產生日期</th><td>${fmt(r.issued)}</td></tr>
      <tr><th>累積打卡</th><td>${r.total} 天</td></tr><tr><th>連續打卡</th><td>${r.streak} 天</td></tr>
      <tr><th>職級</th><td>${RANK_NAMES[r.rank] || '未知'}</td></tr></table></div>
    <div class="card"><table><tr><th>項目</th><th>資格</th><th>到期日</th><th>今天</th></tr>${rows}</table>
      <p class="note">台美股戰報免登記，不在資格碼裡。到期前要再送出新的資格碼才算續用；暫停後，近 7 天再打卡 5 天以上會顯示「可重新啟動」。</p></div>`;
};
