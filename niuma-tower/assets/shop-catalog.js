/* 服裝店目錄：舊商品 id 不可改，以免已購買與備份碼失效。 */
export const TABS = [
  { id: 'new', name: '新品上新' },
  { id: 'set', name: '套裝' },
  { id: 'glasses', name: '墨鏡' },
  { id: 'hat', name: '帽子' },
  { id: 'clothes', name: '衣服' },
  { id: 'pants', name: '褲子' },
  { id: 'shoes', name: '鞋子' },
  { id: 'jewelry', name: '首飾' },
];

export const cssHex = n => '#' + ((n >>> 0) & 0xffffff).toString(16).padStart(6, '0');

const I = (id, cats, slot, name, price, look = {}, extra = {}) => ({
  id, cats: Array.isArray(cats) ? cats : [cats], slot, name, price, look, ...extra,
});

const N = ['new'];
const G = 'glasses', H = 'hat', C = 'clothes', P = 'pants', S = 'shoes', J = 'jewelry', SET = 'set';

export const SHOP = [
  /* ---- 墨鏡（含舊 id） ---- */
  I('glasses-thin', G, 'glasses', '細框眼鏡', 15, { type: 'glasses', shape: 'thin', color: 0x2a2a2a, color2: 0x888888, metal: .6 }),
  I('glasses-round', G, 'glasses', '圓框眼鏡', 20, { type: 'glasses', shape: 'round', color: 0x2a2a2a, metal: .5 }),
  I('glasses-square', G, 'glasses', '方框墨鏡', 25, { type: 'glasses', shape: 'square', color: 0x111111, metal: .7 }),
  I('glasses-tea', G, 'glasses', '茶色墨鏡', 35, { type: 'glasses', shape: 'square', color: 0x3a2a18, lens: 0x3a2410, metal: .5 }),
  I('glasses-night', G, 'glasses', '夜視墨鏡', 45, { type: 'glasses', shape: 'sport', color: 0x0a1a0a, lens: 0x1a4a20, metal: .4 }),
  I('glasses-silver', G, 'glasses', '銀框墨鏡', 80, { type: 'glasses', shape: 'square', color: 0xc0c8d4, metal: .9 }),
  I('glasses-cyan', G, 'glasses', '青框墨鏡', 90, { type: 'glasses', shape: 'square', color: 0x1aa9c9, metal: .7 }),
  I('glasses-black', G, 'glasses', '墨鏡', 100, { type: 'glasses', shape: 'square', color: 0x111111, metal: .8 }),
  I('glasses-red', G, 'glasses', '紅框墨鏡', 110, { type: 'glasses', shape: 'square', color: 0x8a2030, metal: .6 }),
  I('glasses-half', G, 'glasses', '半框墨鏡', 120, { type: 'glasses', shape: 'half', color: 0x222222, metal: .7 }),
  I('glasses-aviator', G, 'glasses', '飛行員墨鏡', 130, { type: 'glasses', shape: 'aviator', color: 0xc0c8d4, lens: 0x111118, metal: .85 }),
  I('glasses-gold', G, 'glasses', '金框墨鏡', 140, { type: 'glasses', shape: 'square', color: 0xd9a441, metal: .8 }),
  I('glasses-titan', G, 'glasses', '鈦金屬墨鏡', 280, { type: 'glasses', shape: 'thin', color: 0x8a9098, metal: .95 }),
  I('glasses-star', G, 'glasses', '星光墨鏡', 360, { type: 'glasses', shape: 'round', color: 0x9b7dff, metal: .7 }),
  I('glasses-neon', G, 'glasses', '霓虹墨鏡', 420, { type: 'glasses', shape: 'sport', color: 0x3ef2ff, metal: .6 }),
  I('glasses-mirror', G, 'glasses', '鏡面墨鏡', 500, { type: 'glasses', shape: 'aviator', color: 0x8899aa, lens: 0x445566, metal: 1 }),
  I('glasses-gem', G, 'glasses', '寶石墨鏡', 680, { type: 'glasses', shape: 'round', color: 0xb8e0ff, metal: .8 }),
  I('glasses-crystal', G, 'glasses', '水晶墨鏡', 980, { type: 'glasses', shape: 'round', color: 0xe8f4ff, metal: .85 }),
  I('glasses-dragon', G, 'glasses', '龍鱗墨鏡', 1280, { type: 'glasses', shape: 'sport', color: 0x7a1a1a, metal: .55 }),
  I('kline-glasses', [G, ...N], 'glasses', 'K線眼鏡', 1680, { type: 'glasses', shape: 'square', color: 0x0b1220, lens: 0x111118, pattern: 'kline', metal: .7 }, { series: 'kline', featured: true }),
  I('kline-glasses-gold', [G, ...N], 'glasses', '金色K線眼鏡', 2180, { type: 'glasses', shape: 'square', color: 0xd9a441, lens: 0x1a1408, pattern: 'kline-gold', metal: .9 }, { series: 'kline', featured: true }),
  I('yageo-glasses', [G, ...N], 'glasses', '國巨 2327 綠油油眼鏡', 0, { type: 'glasses', shape: 'square', color: 0x0a3d28, lens: 0x062316, pattern: 'yageo', metal: .6 }, { series: 'yageo', badge: '首發免費', featured: true }),
  I('tsmc-glasses', [G, ...N], 'glasses', '台積電 2330 漲停眼鏡', 0, { type: 'glasses', shape: 'square', color: 0x3a1014, lens: 0x2a080c, pattern: 'tsmc', metal: .6 }, { series: 'tsmc', badge: '首發免費', featured: true }),

  /* ---- 帽子（含舊 id） ---- */
  I('hat-knit', H, 'hat', '針織毛帽', 12, { type: 'hat', shape: 'beanie', color: 0x3a4a5a }),
  I('hat-sport', H, 'hat', '運動帽', 18, { type: 'hat', shape: 'cap', color: 0x2a4a7a }),
  I('hat-beret', H, 'hat', '貝雷帽', 28, { type: 'hat', shape: 'beret', color: 0x5a1a2a }),
  I('hat-bucket', H, 'hat', '漁夫帽', 32, { type: 'hat', shape: 'bucket', color: 0xb8a074 }),
  I('hat-newsboy', H, 'hat', '報童帽', 40, { type: 'hat', shape: 'newsboy', color: 0x3a2a18 }),
  I('hat-wide', H, 'hat', '寬簷帽', 70, { type: 'hat', shape: 'wide', color: 0x6b3f1c }),
  I('hat-cap', H, 'hat', '便帽', 90, { type: 'hat', shape: 'cap', color: 0x1a2744 }),
  I('hat-felt', H, 'hat', '毛呢帽', 100, { type: 'hat', shape: 'bowler', color: 0x4a3020 }),
  I('hat-bowler', H, 'hat', '紳士帽', 120, { type: 'hat', shape: 'bowler', color: 0x161616 }),
  I('hat-leather', H, 'hat', '皮帽', 140, { type: 'hat', shape: 'cap', color: 0x2a120c }),
  I('hat-tophat', H, 'hat', '紳士高帽', 160, { type: 'hat', shape: 'tophat', color: 0x151515 }),
  I('hat-wool', H, 'hat', '絨毛帽', 200, { type: 'hat', shape: 'beanie', color: 0x4a2a6a }),
  I('hat-gold', H, 'hat', '金邊帽', 320, { type: 'hat', shape: 'bowler', color: 0x161616, color2: 0xd9a441, metal: .5 }),
  I('hat-cyan', H, 'hat', '青色絨帽', 380, { type: 'hat', shape: 'beanie', color: 0x1aa9c9 }),
  I('hat-velvet', H, 'hat', '紅絲絨帽', 450, { type: 'hat', shape: 'beret', color: 0x8a2030, rough: .7 }),
  I('hat-crown', H, 'hat', '禮冠帽', 600, { type: 'hat', shape: 'crown', color: 0xd9a441, metal: .9 }),
  I('hat-star', H, 'hat', '星冕帽', 980, { type: 'hat', shape: 'crown', color: 0x9b7dff, metal: .7 }),
  I('hat-dragon', H, 'hat', '龍角帽', 1200, { type: 'hat', shape: 'tophat', color: 0x7a1a1a, color2: 0xd9a441 }),
  I('hat-neon', H, 'hat', '霓虹帽', 1500, { type: 'hat', shape: 'cap', color: 0x3ef2ff, metal: .4 }),
  I('hat-crystal', H, 'hat', '水晶冠', 1880, { type: 'hat', shape: 'crown', color: 0xb8e0ff, metal: .85 }),
  I('hat-bull', H, 'hat', '金牛禮帽', 2200, { type: 'hat', shape: 'tophat', color: 0xd9a441, metal: .95 }),
  I('yageo-hat', [H, ...N], 'hat', '國巨 2327 綠油油帽', 0, { type: 'hat', shape: 'cap', color: 0x0a3d28, color2: 0x2fd38a, pattern: 'yageo' }, { series: 'yageo', badge: '首發免費', featured: true }),
  I('tsmc-hat', [H, ...N], 'hat', '台積電 2330 漲停紅棒帽', 0, { type: 'hat', shape: 'candle', color: 0xff3a4c, color2: 0xffe3a0, pattern: 'tsmc' }, { series: 'tsmc', badge: '首發免費', featured: true }),

  /* ---- 衣服：外套／襯衫／領帶／披風（含舊 id） ---- */
  I('tie-black', C, 'tie', '黑色領帶', 10, { type: 'tie', shape: 'tie', color: 0x151515 }),
  I('jacket-white-shirt', C, 'jacket', '白襯衫', 18, { type: 'jacket', shape: 'shirt', color: 0xf2f5fb, rough: .6 }),
  I('tie-silver', C, 'tie', '銀色領結', 22, { type: 'tie', shape: 'bow', color: 0xc0c8d4, metal: .8 }),
  I('jacket-gray', C, 'jacket', '灰色衛衣', 25, { type: 'jacket', shape: 'hoodie', color: 0x6a7380 }),
  I('tie-navy', C, 'tie', '藏青領結', 30, { type: 'tie', shape: 'bow', color: 0x1a2744 }),
  I('jacket-denim', C, 'jacket', '牛仔外套', 35, { type: 'jacket', shape: 'denim', color: 0x2a4a7a }),
  I('tie-gold', C, 'tie', '金色領帶', 40, { type: 'tie', shape: 'tie', color: 0xd9a441, metal: .4 }),
  I('tie-cyan', C, 'tie', '青色領帶', 40, { type: 'tie', shape: 'tie', color: 0x1aa9c9, metal: .4 }),
  I('tie-red', C, 'tie', '紅色領帶', 40, { type: 'tie', shape: 'tie', color: 0x8a2030, metal: .4 }),
  I('jacket-khaki', C, 'jacket', '卡其外套', 50, { type: 'jacket', shape: 'suit', color: 0xb8a074 }),
  I('tie-purple', C, 'tie', '紫色領帶', 55, { type: 'tie', shape: 'tie', color: 0x4a2a6a }),
  I('jacket-navy', C, 'jacket', '藏青西裝外套', 80, { type: 'jacket', shape: 'suit', color: 0x1a2744 }),
  I('jacket-black', C, 'jacket', '黑色西裝外套', 80, { type: 'jacket', shape: 'suit', color: 0x151515 }),
  I('jacket-wine', C, 'jacket', '酒紅西裝', 120, { type: 'jacket', shape: 'suit', color: 0x5a1a2a }),
  I('cape-black', C, 'cape', '黑色披風', 150, { type: 'cape', color: 0x151515 }),
  I('jacket-ivory', C, 'jacket', '白色西裝', 160, { type: 'jacket', shape: 'suit', color: 0xe8e0c8 }),
  I('cape-cyan', C, 'cape', '青色披風', 180, { type: 'cape', color: 0x1aa9c9, metal: .35 }),
  I('jacket-purple', C, 'jacket', '紫色西裝', 200, { type: 'jacket', shape: 'suit', color: 0x4a2a6a }),
  I('cape-red', C, 'cape', '紅色披風', 200, { type: 'cape', color: 0x8a2030 }),
  I('cape-gold', C, 'cape', '金色披風', 220, { type: 'cape', color: 0xd9a441, metal: .35 }),
  I('jacket-stripe', C, 'jacket', '青紋襯衫', 260, { type: 'jacket', shape: 'shirt', color: 0x1aa9c9, color2: 0xf2f5fb }),
  I('jacket-goldbtn', C, 'jacket', '金釦西裝', 400, { type: 'jacket', shape: 'suit', color: 0x1a2744, color2: 0xd9a441, metal: .4 }),
  I('jacket-velvet', C, 'jacket', '絲絨外套', 560, { type: 'jacket', shape: 'suit', color: 0x2a1030, rough: .7 }),
  I('jacket-star', C, 'jacket', '星光西裝', 880, { type: 'jacket', shape: 'suit', color: 0x2a1a4a, color2: 0x9b7dff, metal: .4 }),
  I('cape-star', C, 'cape', '星光披風', 900, { type: 'cape', color: 0x9b7dff, metal: .4 }),
  I('jacket-dragon', C, 'jacket', '龍紋外套', 1280, { type: 'jacket', shape: 'suit', color: 0x7a1a1a, color2: 0xd9a441, metal: .35 }),
  I('jacket-neon', C, 'jacket', '霓虹夾克', 1600, { type: 'jacket', shape: 'hoodie', color: 0x0a2a30, color2: 0x3ef2ff, metal: .45 }),
  I('kline-jacket', [C, ...N], 'jacket', 'K線衣服', 1880, { type: 'jacket', shape: 'suit', color: 0x0b1220, pattern: 'kline', metal: .3 }, { series: 'kline', featured: true }),
  I('kline-jacket-gold', [C, ...N], 'jacket', '金色K線衣服', 2480, { type: 'jacket', shape: 'suit', color: 0x3a2a10, color2: 0xd9a441, pattern: 'kline-gold', metal: .5 }, { series: 'kline', featured: true }),
  I('yageo-jacket', [C, ...N], 'jacket', '國巨 2327 綠油油衣服', 0, { type: 'jacket', shape: 'suit', color: 0x0a3d28, color2: 0x2fd38a, pattern: 'yageo' }, { series: 'yageo', badge: '首發免費', featured: true }),
  I('tsmc-jacket', [C, ...N], 'jacket', '台積電 2330 漲停衣服', 0, { type: 'jacket', shape: 'suit', color: 0x3a1014, color2: 0xff3a4c, pattern: 'tsmc' }, { series: 'tsmc', badge: '首發免費', featured: true }),

  /* ---- 褲子 ---- */
  I('pants-khaki', P, 'pants', '卡其長褲', 12, { type: 'pants', color: 0xb8a074 }),
  I('pants-brown', P, 'pants', '褐色長褲', 15, { type: 'pants', color: 0x6b3f1c }),
  I('pants-jean', P, 'pants', '深藍牛仔褲', 18, { type: 'pants', color: 0x1a3358 }),
  I('pants-olive', P, 'pants', '軍綠長褲', 22, { type: 'pants', color: 0x3a4a20 }),
  I('pants-gray', P, 'pants', '灰色休閒褲', 25, { type: 'pants', color: 0x7a8499 }),
  I('pants-black', P, 'pants', '黑色長褲', 30, { type: 'pants', color: 0x151515 }),
  I('pants-navy', P, 'pants', '藏青西褲', 40, { type: 'pants', color: 0x1a2744 }),
  I('pants-chino', P, 'pants', '卡其西褲', 60, { type: 'pants', color: 0xc2b280 }),
  I('pants-white', P, 'pants', '白色長褲', 80, { type: 'pants', color: 0xf2f5fb }),
  I('pants-work', P, 'pants', '深綠工作褲', 100, { type: 'pants', color: 0x1a5c38 }),
  I('pants-wine', P, 'pants', '酒紅西褲', 140, { type: 'pants', color: 0x5a1a2a }),
  I('pants-stripe', P, 'pants', '條紋西褲', 180, { type: 'pants', color: 0x1a2744, color2: 0xe8eef6, pattern: 'stripe' }),
  I('pants-leather', P, 'pants', '皮質長褲', 280, { type: 'pants', color: 0x1a120c, rough: .4, metal: .2 }),
  I('pants-velvet', P, 'pants', '絲絨長褲', 360, { type: 'pants', color: 0x2a1030, rough: .7 }),
  I('pants-gold', P, 'pants', '金邊西褲', 480, { type: 'pants', color: 0x151515, color2: 0xd9a441 }),
  I('pants-cyan', P, 'pants', '青光長褲', 620, { type: 'pants', color: 0x1aa9c9, metal: .25 }),
  I('pants-star', P, 'pants', '星紋長褲', 800, { type: 'pants', color: 0x2a1a4a, color2: 0x9b7dff }),
  I('pants-dragon', P, 'pants', '龍鱗長褲', 1180, { type: 'pants', color: 0x7a1a1a, color2: 0xd9a441 }),
  I('pants-neon', P, 'pants', '霓虹長褲', 1500, { type: 'pants', color: 0x0a2a30, color2: 0x3ef2ff, metal: .35 }),
  I('kline-pants', [P, ...N], 'pants', 'K線褲子', 1780, { type: 'pants', color: 0x0b1220, pattern: 'kline' }, { series: 'kline', featured: true }),
  I('kline-pants-gold', [P, ...N], 'pants', '金色K線褲子', 2280, { type: 'pants', color: 0x3a2a10, color2: 0xd9a441, pattern: 'kline-gold' }, { series: 'kline', featured: true }),
  I('yageo-pants', [P, ...N], 'pants', '國巨 2327 綠油油褲子', 0, { type: 'pants', color: 0x0a3d28, color2: 0x2fd38a, pattern: 'yageo' }, { series: 'yageo', badge: '首發免費', featured: true }),
  I('tsmc-pants', [P, ...N], 'pants', '台積電 2330 漲停褲子', 0, { type: 'pants', color: 0x3a1014, color2: 0xff3a4c, pattern: 'tsmc' }, { series: 'tsmc', badge: '首發免費', featured: true }),

  /* ---- 鞋子 ---- */
  I('shoes-canvas', S, 'shoes', '帆布鞋', 10, { type: 'shoes', shape: 'sneaker', color: 0xe8e0c8, color2: 0xf2f5fb }),
  I('shoes-white-sn', S, 'shoes', '白運動鞋', 16, { type: 'shoes', shape: 'sneaker', color: 0xf2f5fb }),
  I('shoes-gray', S, 'shoes', '灰色運動鞋', 20, { type: 'shoes', shape: 'sneaker', color: 0x7a8499 }),
  I('shoes-black', S, 'shoes', '黑皮鞋', 24, { type: 'shoes', shape: 'oxford', color: 0x111111 }),
  I('shoes-brown', S, 'shoes', '棕色皮鞋', 32, { type: 'shoes', shape: 'oxford', color: 0x6b3f1c }),
  I('shoes-loafer', S, 'shoes', '懶人鞋', 40, { type: 'shoes', shape: 'loafer', color: 0x3a2a18 }),
  I('shoes-work', S, 'shoes', '工裝靴', 50, { type: 'shoes', shape: 'boot', color: 0x4a3020 }),
  I('shoes-navy', S, 'shoes', '藏青皮鞋', 70, { type: 'shoes', shape: 'oxford', color: 0x1a2744 }),
  I('shoes-boot', S, 'shoes', '高跟短靴', 90, { type: 'shoes', shape: 'boot', color: 0x151515 }),
  I('shoes-oxford', S, 'shoes', '牛津鞋', 110, { type: 'shoes', shape: 'oxford', color: 0x1a120c }),
  I('shoes-derby', S, 'shoes', '德比鞋', 130, { type: 'shoes', shape: 'oxford', color: 0x3a2a18 }),
  I('shoes-white', S, 'shoes', '白紳士鞋', 160, { type: 'shoes', shape: 'oxford', color: 0xe8e0c8 }),
  I('shoes-gold', S, 'shoes', '金釦皮鞋', 280, { type: 'shoes', shape: 'oxford', color: 0x151515, color2: 0xd9a441, metal: .45 }),
  I('shoes-cyan', S, 'shoes', '青光皮鞋', 360, { type: 'shoes', shape: 'oxford', color: 0x1aa9c9, metal: .3 }),
  I('shoes-redsole', S, 'shoes', '紅底皮鞋', 450, { type: 'shoes', shape: 'oxford', color: 0x151515, color2: 0x8a2030 }),
  I('shoes-velvet', S, 'shoes', '絲絨短靴', 580, { type: 'shoes', shape: 'boot', color: 0x2a1030, rough: .7 }),
  I('shoes-star', S, 'shoes', '星光皮鞋', 820, { type: 'shoes', shape: 'oxford', color: 0x9b7dff, metal: .4 }),
  I('shoes-dragon', S, 'shoes', '龍紋靴', 1200, { type: 'shoes', shape: 'boot', color: 0x7a1a1a, color2: 0xd9a441 }),
  I('shoes-neon', S, 'shoes', '霓虹鞋', 1550, { type: 'shoes', shape: 'sneaker', color: 0x3ef2ff, metal: .4 }),
  I('kline-shoes', [S, ...N], 'shoes', 'K線鞋', 1880, { type: 'shoes', shape: 'oxford', color: 0x0b1220, pattern: 'kline' }, { series: 'kline', featured: true }),
  I('kline-shoes-gold', [S, ...N], 'shoes', '金色K線鞋', 2380, { type: 'shoes', shape: 'oxford', color: 0x3a2a10, color2: 0xd9a441, pattern: 'kline-gold', metal: .45 }, { series: 'kline', featured: true }),
  I('yageo-shoes', [S, ...N], 'shoes', '國巨 2327 綠油油鞋', 0, { type: 'shoes', shape: 'oxford', color: 0x0a3d28, color2: 0x2fd38a, pattern: 'yageo' }, { series: 'yageo', badge: '首發免費', featured: true }),
  I('tsmc-shoes', [S, ...N], 'shoes', '台積電 2330 漲停鞋', 0, { type: 'shoes', shape: 'oxford', color: 0x3a1014, color2: 0xff3a4c, pattern: 'tsmc' }, { series: 'tsmc', badge: '首發免費', featured: true }),

  /* ---- 首飾：項鍊／金鍊／戒指／手錶／耳環／牛角（含舊 id） ---- */
  I('ring-silver', J, 'ring', '銀戒', 10, { type: 'ring', color: 0xc0c8d4, metal: .95 }),
  I('earring-silver', J, 'earring', '銀耳環', 14, { type: 'earring', color: 0xc0c8d4, metal: .95 }),
  I('watch-plastic', J, 'watch', '塑膠手錶', 15, { type: 'watch', color: 0x2a4a7a, color2: 0x111111 }),
  I('necklace-silver', J, 'necklace', '細銀鍊', 16, { type: 'necklace', shape: 'thin', color: 0xc0c8d4, metal: .95 }),
  I('necklace-cord', J, 'necklace', '黑繩項鍊', 18, { type: 'necklace', shape: 'cord', color: 0x111111 }),
  I('necklace-gold-thin', J, 'necklace', '金細鍊', 30, { type: 'necklace', shape: 'thin', color: 0xd9a441, metal: .95 }),
  I('earring-gold', J, 'earring', '金耳環', 35, { type: 'earring', color: 0xd9a441, metal: .95 }),
  I('ring-gold', J, 'ring', '金戒', 40, { type: 'ring', color: 0xd9a441, metal: .95 }),
  I('necklace-silver-p', J, 'necklace', '銀墜項鍊', 45, { type: 'necklace', shape: 'pendant', color: 0xc0c8d4, metal: .9 }),
  I('watch-silver', J, 'watch', '銀殼手錶', 50, { type: 'watch', color: 0xc0c8d4, color2: 0x111111, metal: .9 }),
  I('necklace-lock', J, 'necklace', '金鎖項鍊', 80, { type: 'necklace', shape: 'pendant', color: 0xd9a441, metal: .95 }),
  I('watch-black', J, 'watch', '黑錶', 90, { type: 'watch', color: 0x111111, color2: 0x3ef2ff, metal: .7 }),
  I('earring-cyan', J, 'earring', '青晶耳環', 120, { type: 'earring', color: 0x1aa9c9, metal: .7 }),
  I('ring-gem', J, 'ring', '寶石戒', 180, { type: 'ring', color: 0xd9a441, color2: 0x3ef2ff, metal: .9 }),
  I('necklace-chain', J, 'necklace', '粗金鍊', 200, { type: 'necklace', shape: 'thick', color: 0xd9a441, metal: .95 }),
  I('watch-gold', J, 'watch', '金錶', 220, { type: 'watch', color: 0xd9a441, color2: 0x111111, metal: .95 }),
  I('horns-gold', J, 'horns', '金色牛角', 280, { type: 'horns', color: 0xffd56a, metal: 1 }),
  I('horns-cyan', J, 'horns', '青色牛角', 320, { type: 'horns', color: 0x1aa9c9, metal: .8 }),
  I('necklace-cyan', J, 'necklace', '青晶項鍊', 360, { type: 'necklace', shape: 'pendant', color: 0x1aa9c9, metal: .7 }),
  I('watch-cyan', J, 'watch', '青光錶', 400, { type: 'watch', color: 0x1aa9c9, color2: 0x0b1220, metal: .7 }),
  I('earring-star', J, 'earring', '星光耳環', 500, { type: 'earring', color: 0x9b7dff, metal: .8 }),
  I('necklace-gem', J, 'necklace', '寶石項鍊', 680, { type: 'necklace', shape: 'pendant', color: 0xb8e0ff, color2: 0xd9a441, metal: .85 }),
  I('ring-dragon', J, 'ring', '龍戒', 800, { type: 'ring', color: 0x7a1a1a, color2: 0xd9a441, metal: .8 }),
  I('horns-neon', J, 'horns', '霓虹牛角', 900, { type: 'horns', color: 0x3ef2ff, metal: .6 }),
  I('necklace-dragon', J, 'necklace', '龍墜項鍊', 1280, { type: 'necklace', shape: 'pendant', color: 0x7a1a1a, color2: 0xd9a441, metal: .7 }),
  I('horns-star', J, 'horns', '星光牛角', 1500, { type: 'horns', color: 0x9b7dff, metal: .7 }),
  I('kline-watch', [J, ...N], 'watch', 'K線手錶', 1680, { type: 'watch', color: 0x0b1220, color2: 0x2fd38a, pattern: 'kline', metal: .6 }, { series: 'kline', featured: true }),
  I('kline-watch-gold', [J, ...N], 'watch', '金色K線手錶', 2180, { type: 'watch', color: 0xd9a441, color2: 0x0b1220, pattern: 'kline-gold', metal: .9 }, { series: 'kline', featured: true }),
  I('yageo-watch', [J, ...N], 'watch', '國巨 2327 綠油油手錶', 0, { type: 'watch', color: 0x0a3d28, color2: 0x2fd38a, pattern: 'yageo', metal: .5 }, { series: 'yageo', badge: '首發免費', featured: true }),
  I('yageo-necklace', [J, ...N], 'necklace', '國巨 2327 綠油油項鍊', 0, { type: 'necklace', shape: 'chip', color: 0x1a6b44, color2: 0xb8ffd4, pattern: 'yageo', metal: .6 }, { series: 'yageo', badge: '首發免費', featured: true }),
  I('tsmc-watch', [J, ...N], 'watch', '台積電 2330 漲停手錶', 0, { type: 'watch', color: 0x3a1014, color2: 0xff3a4c, pattern: 'tsmc', metal: .5 }, { series: 'tsmc', badge: '首發免費', featured: true }),
  I('tsmc-necklace', [J, ...N], 'necklace', '台積電 2330 漲停項鍊', 0, { type: 'necklace', shape: 'candle', color: 0xff3a4c, color2: 0xffe3a0, pattern: 'tsmc', metal: .6 }, { series: 'tsmc', badge: '首發免費', featured: true }),

  /* ---- 高階：鎏光敘物飾品（站內虛擬裝扮，用站內薪水兌換；不是實品販售） ---- */
  I('lg-necklace-first', [J, ...N], 'necklace', '鎏光敘物・首發款項鍊', 6800, { type: 'necklace', shape: 'pendant', color: 0xe6c27a, color2: 0xf3efe6, metal: .95 }, { series: 'liuguang', badge: '高階', featured: true }),
  I('lg-necklace-cross', [J, ...N], 'necklace', '鎏光敘物・十字項鍊', 8800, { type: 'necklace', shape: 'cross', color: 0xd9b25f, color2: 0xe9edf2, metal: .95 }, { series: 'liuguang', badge: '高階', featured: true }),

  /* ---- 套裝 ---- */
  I('set-yageo', [SET, ...N], 'set', '國巨（2327）跌停・綠油油套裝', 0, { color: 0x2fd38a, pattern: 'yageo' }, {
    series: 'yageo', badge: '首發免費', featured: true,
    pieces: { glasses: 'yageo-glasses', hat: 'yageo-hat', jacket: 'yageo-jacket', pants: 'yageo-pants', shoes: 'yageo-shoes', watch: 'yageo-watch', necklace: 'yageo-necklace' },
  }),
  I('set-tsmc', [SET, ...N], 'set', '漲停板套裝', 0, { color: 0xff3a4c, pattern: 'tsmc' }, {
    series: 'tsmc', badge: '首發免費', featured: true,
    pieces: { glasses: 'tsmc-glasses', hat: 'tsmc-hat', jacket: 'tsmc-jacket', pants: 'tsmc-pants', shoes: 'tsmc-shoes', watch: 'tsmc-watch', necklace: 'tsmc-necklace' },
  }),
  I('set-navy', SET, 'set', '藏青通勤套裝', 240, { color: 0x1a2744 }, {
    pieces: { jacket: 'jacket-navy', tie: 'tie-gold', pants: 'pants-navy', shoes: 'shoes-navy', glasses: 'glasses-black' },
  }),
  I('set-black', SET, 'set', '闇黑紳士套裝', 520, { color: 0x151515 }, {
    pieces: { jacket: 'jacket-black', tie: 'tie-black', pants: 'pants-black', shoes: 'shoes-black', hat: 'hat-bowler', cape: 'cape-black' },
  }),
  I('set-cyan', SET, 'set', '青色交易套裝', 980, { color: 0x1aa9c9 }, {
    pieces: { jacket: 'jacket-stripe', tie: 'tie-cyan', pants: 'pants-cyan', shoes: 'shoes-cyan', glasses: 'glasses-cyan', cape: 'cape-cyan' },
  }),
  I('set-gold', SET, 'set', '金色夜宴套裝', 1280, { color: 0xd9a441 }, {
    pieces: { jacket: 'jacket-goldbtn', tie: 'tie-gold', pants: 'pants-gold', shoes: 'shoes-gold', glasses: 'glasses-gold', cape: 'cape-gold', horns: 'horns-gold' },
  }),
  I('set-star', SET, 'set', '星光套裝', 3600, { color: 0x9b7dff }, {
    pieces: { jacket: 'jacket-star', pants: 'pants-star', shoes: 'shoes-star', hat: 'hat-star', earring: 'earring-star', cape: 'cape-star', horns: 'horns-star' },
  }),
  I('set-dragon', SET, 'set', '龍紋套裝', 5200, { color: 0x7a1a1a }, {
    pieces: { jacket: 'jacket-dragon', pants: 'pants-dragon', shoes: 'shoes-dragon', hat: 'hat-dragon', necklace: 'necklace-dragon', ring: 'ring-dragon', glasses: 'glasses-dragon' },
  }),
  I('set-neon', SET, 'set', '霓虹套裝', 6200, { color: 0x3ef2ff }, {
    pieces: { jacket: 'jacket-neon', pants: 'pants-neon', shoes: 'shoes-neon', hat: 'hat-neon', glasses: 'glasses-neon', horns: 'horns-neon' },
  }),
  I('set-kline', [SET, ...N], 'set', 'K線套裝', 7800, { color: 0x0b1220, pattern: 'kline' }, {
    series: 'kline', featured: true,
    pieces: { glasses: 'kline-glasses', jacket: 'kline-jacket', pants: 'kline-pants', shoes: 'kline-shoes', watch: 'kline-watch' },
  }),
  I('set-kline-gold', [SET, ...N], 'set', '金色K線套裝', 9800, { color: 0xd9a441, pattern: 'kline-gold' }, {
    series: 'kline', featured: true,
    pieces: { glasses: 'kline-glasses-gold', jacket: 'kline-jacket-gold', pants: 'kline-pants-gold', shoes: 'kline-shoes-gold', watch: 'kline-watch-gold' },
  }),
];

const MAP = new Map(SHOP.map(it => [it.id, it]));
export const itemById = id => MAP.get(id);
export function itemsInTab(tab) {
  return SHOP.filter(it => it.cats.includes(tab)).slice().sort((a, b) => a.price - b.price || a.name.localeCompare(b.name, 'zh-Hant'));
}
export const OLD_IDS = ['jacket-navy','jacket-black','tie-gold','tie-cyan','tie-red','hat-cap','hat-bowler','glasses-black','glasses-gold','cape-cyan','cape-gold','horns-gold'];
