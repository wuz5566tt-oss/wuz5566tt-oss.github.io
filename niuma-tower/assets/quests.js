// 每層樓 NPC 任務：資料與判斷（純函式，不碰畫面）
// kind: 'daily' 每日任務（依日期重置）／'once' 成就任務（一次性）
// reward: 目前只發站內薪水 coins（可附少量經驗 xp）；之後商店上架可加 items 等欄位，claim 時統一處理
// 3D：scene3d 的 world.setNpcs(floorId, npcs) 把 NPC 畫成「馬」（玩家是牛 → 牛馬大樓）
// gender: 'f' 女／'m' 男（依名字與職務判斷）；outfit: 服裝款式，對應 scene3d.js 的 NPC_OUTFIT；pose: 'desk' 手拿平板
export const QUEST_VER = 1;

export const NPCS = [
  // 1 樓・交易大廳
  { id: 'n_desk', floor: 'lobby', gender: 'f', outfit: 'reception', avatar: '👩‍💼', name: '櫃台小美', line: '每天準時打卡，是牛馬的基本功！', pose: 'desk',
    quest: { id: 'q_daily_checkin', kind: 'daily', title: '今天完成上班打卡', check: 'checkinToday', target: 1, reward: { coins: 30, xp: 2 } } },
  { id: 'n_fortune', floor: 'lobby', gender: 'm', outfit: 'traditional', avatar: '👴', name: '籤詩阿伯', line: '心法抽一支，今天下單前先冷靜一下。', pose: 'stand',
    quest: { id: 'q_daily_fortune', kind: 'daily', title: '抽一支今日心法', check: 'fortuneToday', target: 1, reward: { coins: 20, xp: 1 } } },
  { id: 'n_tailor', floor: 'lobby', gender: 'm', outfit: 'tailor', avatar: '🧵', name: '裁縫師阿德', line: '穿得體面，上班心情也會好一點。', pose: 'stand',
    quest: { id: 'q_once_buy', kind: 'once', title: '在服裝店用薪水買一件裝扮', check: 'paidItems', target: 1, reward: { coins: 120, xp: 5 } } },
  // 2 樓・晨會室
  { id: 'n_host', floor: 'f2', gender: 'm', outfit: 'suit', avatar: '👨‍🏫', name: '晨會主持 Kevin', line: '台股、美股都猜一下，練的是盤感，不是點位。', pose: 'stand',
    quest: { id: 'q_daily_guess', kind: 'daily', title: '今天台股、美股都猜完漲跌', check: 'guessToday', target: 2, reward: { coins: 40, xp: 2 } } },
  { id: 'n_tea', floor: 'f2', gender: 'f', outfit: 'apron', avatar: '☕', name: '茶水間阿姨', line: '連續來上班，阿姨就知道你是認真的。', pose: 'stand',
    quest: { id: 'q_once_streak3', kind: 'once', title: '連續打卡 3 天', check: 'streak', target: 3, reward: { coins: 150, xp: 5 } } },
  { id: 'n_admin', floor: 'f2', gender: 'f', outfit: 'office', avatar: '📒', name: '行政小芳', line: '累積打卡滿 7 天，三樓訓練場就開了喔。', pose: 'desk',
    quest: { id: 'q_once_days7', kind: 'once', title: '累積打卡 7 天', check: 'days', target: 7, reward: { coins: 200, xp: 8 } } },
  // 3 樓・訓練場
  { id: 'n_kcoach', floor: 'f3', gender: 'm', outfit: 'polo', avatar: '🕯️', name: 'K線教練老周', line: '別急，看清楚再猜下一根。', pose: 'stand',
    quest: { id: 'q_daily_kline', kind: 'daily', title: '今天玩完一局「看K線猜下一根」', check: 'klinePlaysToday', target: 1, reward: { coins: 40, xp: 2 } } },
  { id: 'n_dodge', floor: 'f3', gender: 'f', outfit: 'tracksuit', avatar: '🥷', name: '閃避教官小莉', line: '等收盤再判斷，假突破就騙不到你。', pose: 'stand',
    quest: { id: 'q_daily_fake3', kind: 'daily', title: '今天「躲假突破」單局躲過 3 次', check: 'fakeBestToday', target: 3, reward: { coins: 60, xp: 3 } } },
  { id: 'n_bear', floor: 'f3', gender: 'm', outfit: 'sport', avatar: '🏋️‍♂️', name: '體能教練大熊', line: '練功沒有捷徑，天天來就對了。', pose: 'stand',
    quest: { id: 'q_once_streak7', kind: 'once', title: '連續打卡 7 天', check: 'streak', target: 7, reward: { coins: 300, xp: 10 } } },
  // 4 樓・戰報與英雄榜
  { id: 'n_editor', floor: 'f4', gender: 'm', outfit: 'vest', avatar: '📰', name: '戰報編輯阿哲', line: '看圖的眼力，是一根一根練出來的。', pose: 'desk',
    quest: { id: 'q_once_kline4', kind: 'once', title: '「看K線猜下一根」單局答對 4 題', check: 'klineBest', target: 4, reward: { coins: 200, xp: 6 } } },
  { id: 'n_honor', floor: 'f4', gender: 'f', outfit: 'curator', avatar: '🏅', name: '榮譽牆管理員', line: '累積 14 天，名字就該上牆了。', pose: 'stand',
    quest: { id: 'q_once_days14', kind: 'once', title: '累積打卡 14 天', check: 'days', target: 14, reward: { coins: 350, xp: 10 } } },
  { id: 'n_hr', floor: 'f4', gender: 'f', outfit: 'skirtsuit', avatar: '👩‍💼', name: '人資主管 Amy', line: '升到組長，就不是菜鳥牛馬了。', pose: 'desk',
    quest: { id: 'q_once_rank2', kind: 'once', title: '職級升到「組長」', check: 'rank', target: 2, reward: { coins: 250, xp: 0 } } },
  // 5 樓・目標值研究室
  { id: 'n_lab', floor: 'f5', gender: 'm', outfit: 'labcoat', avatar: '🔭', name: '研究員林博士', line: '長期的紀律，比一次的好運重要。', pose: 'desk',
    quest: { id: 'q_once_streak14', kind: 'once', title: '連續打卡 14 天', check: 'streak', target: 14, reward: { coins: 500, xp: 15 } } },
  { id: 'n_data', floor: 'f5', gender: 'f', outfit: 'blouse', avatar: '📈', name: '數據分析師小陳', line: '樣本夠多，數據才有參考價值。', pose: 'desk',
    quest: { id: 'q_once_days60', kind: 'once', title: '累積打卡 60 天', check: 'days', target: 60, reward: { coins: 600, xp: 20 } } },
  { id: 'n_quant', floor: 'f5', gender: 'm', outfit: 'hoodie', avatar: '🎯', name: '量化助理 Rex', line: '反應快不夠，要等確認再動。', pose: 'stand',
    quest: { id: 'q_once_fake5', kind: 'once', title: '「躲假突破」單局躲過 5 次', check: 'fakeBest', target: 5, reward: { coins: 300, xp: 10 } } },
  // 6 樓・交易實驗室
  { id: 'n_labdir', floor: 'f6', gender: 'f', outfit: 'labcoatf', avatar: '🧪', name: '實驗室主任雅婷', line: '先想好停損，再談進場。', pose: 'desk',
    quest: { id: 'q_daily_lab', kind: 'daily', title: '今天完成一局「實戰演練」', check: 'labPlaysToday', target: 1, reward: { coins: 40, xp: 2 } } },
  { id: 'n_risk', floor: 'f6', gender: 'm', outfit: 'suit', avatar: '🛡️', name: '風控官阿凱', line: '風報比不到一比二，寧可不做。', pose: 'stand',
    quest: { id: 'q_once_lab80', kind: 'once', title: '「實戰演練」單局拿到 80 分', check: 'labBest', target: 80, reward: { coins: 300, xp: 10 } } },
  // 68 樓・自己人專區
  { id: 'n_steward', floor: 'insider', gender: 'm', outfit: 'robe', avatar: '📝', name: '執事堂執事', line: '下班前寫複盤，是自己人的日常。', pose: 'desk',
    quest: { id: 'q_daily_review', kind: 'daily', title: '今天寫下班複盤', check: 'reviewToday', target: 1, reward: { coins: 40, xp: 2 } } },
  { id: 'n_keeper', floor: 'insider', gender: 'f', outfit: 'hanfu', avatar: '📚', name: '藏經閣管理員', line: '複盤累積十篇，功力就看得出來。', pose: 'stand',
    quest: { id: 'q_once_review10', kind: 'once', title: '累積寫 10 天複盤', check: 'reviews', target: 10, reward: { coins: 400, xp: 10 } } },
  { id: 'n_senior', floor: 'insider', gender: 'm', outfit: 'gi', avatar: '🥋', name: '演武場師兄', line: '升到經理，才算真正站穩腳步。', pose: 'stand',
    quest: { id: 'q_once_rank3', kind: 'once', title: '職級升到「經理」', check: 'rank', target: 3, reward: { coins: 500, xp: 0 } } },
];
export const npcsOn = f => NPCS.filter(n => n.floor === f);
export const questById = id => { const n = NPCS.find(n => n.quest.id === id); return n ? n.quest : null; };

// 狀態：{ v, daily: { 'YYYY-MM-DD': [已領任務 id] }, done: [已領成就 id], day: { 'YYYY-MM-DD': { klinePlays, klineBest, fakeBest } } }
export function normQuests(q) {
  const o = q && typeof q === 'object' ? q : {};
  return {
    v: QUEST_VER,
    daily: o.daily && typeof o.daily === 'object' && !Array.isArray(o.daily) ? o.daily : {},
    done: Array.isArray(o.done) ? o.done.filter(x => typeof x === 'string') : [],
    day: o.day && typeof o.day === 'object' && !Array.isArray(o.day) ? o.day : {},
  };
}
// 只留最近 14 天的每日紀錄，避免存檔越長越大
export function pruneQuests(q, today) {
  const keep = k => k >= addDaysStr(today, -14);
  Object.keys(q.daily).forEach(k => { if (!keep(k)) delete q.daily[k]; });
  Object.keys(q.day).forEach(k => { if (!keep(k)) delete q.day[k]; });
  return q;
}
function addDaysStr(d, n) {
  const t = new Date(d + 'T00:00:00'); t.setDate(t.getDate() + n);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

// ctx 由 app.js 提供：{ S, today, days, streak, rank, paidItems }
const CHECKS = {
  checkinToday: c => (c.S.last === c.today ? 1 : 0),
  fortuneToday: c => (c.S.fortune && c.S.fortune.date === c.today ? 1 : 0),
  guessToday: c => Object.keys((c.S.guesses || {})[c.today] || {}).filter(k => k === 'tw' || k === 'us').length,
  reviewToday: c => ((c.S.reviews || {})[c.today] ? 1 : 0),
  klinePlaysToday: c => (dayLog(c).klinePlays | 0),
  fakeBestToday: c => (dayLog(c).fakeBest | 0),
  streak: c => c.streak | 0,
  days: c => c.days | 0,
  rank: c => c.rank | 0,
  paidItems: c => c.paidItems | 0,
  reviews: c => Object.keys(c.S.reviews || {}).length,
  klineBest: c => (((c.S.games || {}).kline || {}).best | 0),
  fakeBest: c => (((c.S.games || {}).fakeout || {}).best | 0),
  labPlaysToday: c => (dayLog(c).labPlays | 0),
  labBest: c => (((c.S.games || {}).lab || {}).best | 0),
};
function dayLog(c) { const q = c.S.quests; return (q && q.day && q.day[c.today]) || {}; }

export function claimed(q, quest, today) {
  if (quest.kind === 'daily') return ((q.daily || {})[today] || []).includes(quest.id);
  return (q.done || []).includes(quest.id);
}
export function evalQuest(quest, ctx) {
  const fn = CHECKS[quest.check];
  const raw = fn ? fn(ctx) : 0;
  const prog = Math.min(raw, quest.target);
  const got = claimed(ctx.S.quests, quest, ctx.today);
  return { prog, target: quest.target, done: prog >= quest.target, got, ready: prog >= quest.target && !got };
}
export function markClaimed(q, quest, today) {
  if (quest.kind === 'daily') { const a = q.daily[today] || (q.daily[today] = []); if (!a.includes(quest.id)) a.push(quest.id); }
  else if (!q.done.includes(quest.id)) q.done.push(quest.id);
}
export function rewardText(r) {
  const parts = [];
  if (r.coins) parts.push(`薪水 +${r.coins}`);
  if (r.xp) parts.push(`經驗 +${r.xp}`);
  return parts.join('・');
}
