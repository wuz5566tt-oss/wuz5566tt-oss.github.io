/* 9:16 工作證、薪資單。給 App BOT 在分享流程呼叫。不改 academy.js 既有 drawShare。 */
export function drawIdCard(cv, st = {}) {
  const w = 1080, h = 1920; cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  const F = '"Clash Display","Noto Sans CJK TC","Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';
  const bg = g.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#15110a'); bg.addColorStop(.55, '#0a0806'); bg.addColorStop(1, '#17120a');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  const rg = g.createRadialGradient(w / 2, 520, 40, w / 2, 520, 700);
  rg.addColorStop(0, 'rgba(255,200,90,.28)'); rg.addColorStop(1, 'rgba(255,200,90,0)');
  g.fillStyle = rg; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,200,90,.55)'; g.lineWidth = 8;
  g.strokeRect(60, 60, w - 120, h - 120);
  g.strokeStyle = 'rgba(62,242,255,.25)'; g.lineWidth = 2;
  g.strokeRect(84, 84, w - 168, h - 168);
  g.fillStyle = '#ffd66b'; g.font = '700 44px ' + F; g.textAlign = 'center';
  g.fillText('STAR史塔財商', 540, 200);
  g.fillStyle = '#8fa3c4'; g.font = '600 28px ' + F;
  g.fillText('學院工作證', 540, 250);
  // badge
  g.beginPath(); g.arc(540, 560, 180, 0, Math.PI * 2);
  g.fillStyle = '#1a140c'; g.fill();
  g.strokeStyle = '#ffc85a'; g.lineWidth = 8; g.stroke();
  g.fillStyle = '#ffe3a0'; g.font = '700 52px ' + F;
  g.fillText(st.title || '實習牛馬', 540, 575);
  g.fillStyle = '#e9f3ff'; g.font = '700 40px ' + F;
  g.fillText('已收藏知識卡  ' + (st.cards ?? 0) + ' / ' + (st.total ?? 0) + ' 張', 540, 900);
  g.fillText('連續打卡  ' + (st.streak ?? 0) + ' 天', 540, 980);
  g.fillStyle = '#8fa3c4'; g.font = '600 30px ' + F;
  g.fillText(st.date || '', 540, 1080);
  g.fillStyle = '#3ef2ff'; g.font = '700 36px ' + F;
  g.fillText('@wuz200200', 540, 1580);
  g.fillStyle = '#ffd66b'; g.font = '700 38px ' + F;
  g.fillText('私訊成長', 540, 1660);
  g.fillStyle = '#8fa3c4'; g.font = '600 24px ' + F;
  g.fillText('僅供學習，非投資建議', 540, 1760);
}

export function drawPayslip(cv, st = {}) {
  const w = 1080, h = 1920; cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  const F = '"Clash Display","Noto Sans CJK TC","Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';
  const bg = g.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#0b1220'); bg.addColorStop(1, '#070b14');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(62,242,255,.4)'; g.lineWidth = 6;
  g.strokeRect(60, 60, w - 120, h - 120);
  g.fillStyle = '#ffd66b'; g.font = '700 44px ' + F; g.textAlign = 'center';
  g.fillText('STAR史塔財商', 540, 200);
  g.fillStyle = '#3ef2ff'; g.font = '700 36px ' + F;
  g.fillText('站內薪資單', 540, 260);
  g.fillStyle = '#8fa3c4'; g.font = '600 28px ' + F;
  g.fillText(st.date || '', 540, 320);
  const rows = [
    ['稱號', st.title || '實習牛馬'],
    ['連續打卡', (st.streak ?? 0) + ' 天'],
    ['本月打卡', (st.month ?? 0) + ' 天'],
    ['知識卡', (st.cards ?? 0) + ' / ' + (st.total ?? 0) + ' 張'],
    ['今日講師馬', st.quiz || '尚未作答'],
    ['本日站內薪水', (st.coins ?? 0) + '（虛擬點數）'],
  ];
  rows.forEach((r, i) => {
    const y = 460 + i * 110;
    g.fillStyle = 'rgba(255,255,255,.04)';
    g.fillRect(140, y - 50, 800, 90);
    g.fillStyle = '#8fa3c4'; g.font = '600 30px ' + F; g.textAlign = 'left';
    g.fillText(r[0], 170, y + 5);
    g.fillStyle = '#ffe3a0'; g.font = '700 34px ' + F; g.textAlign = 'right';
    g.fillText(String(r[1]), 910, y + 5);
  });
  g.textAlign = 'center';
  g.fillStyle = '#8fa3c4'; g.font = '600 26px ' + F;
  g.fillText('薪水是站內虛擬點數，不能換現金。', 540, 1280);
  g.fillStyle = '#3ef2ff'; g.font = '700 36px ' + F;
  g.fillText('@wuz200200', 540, 1580);
  g.fillStyle = '#ffd66b'; g.font = '700 38px ' + F;
  g.fillText('私訊成長', 540, 1660);
  g.fillStyle = '#8fa3c4'; g.font = '600 24px ' + F;
  g.fillText('僅供學習，非投資建議', 540, 1760);
}

export function paintAll(root, st) {
  root.querySelectorAll('canvas[data-share=id]').forEach(cv => drawIdCard(cv, st));
  root.querySelectorAll('canvas[data-share=payslip]').forEach(cv => drawPayslip(cv, st));
}
