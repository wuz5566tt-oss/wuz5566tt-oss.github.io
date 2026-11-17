// 程序生成的環境音樂（無外部音檔）
// 正式預設為 H 遊戲大廳（大調、有鼓點）；舊抒情預設改以 ?music=classic 聽
// ?music=a|b|c|d|e|f|g|h|classic 可切換；GM（?gm=1）沒有另外的配樂，與正式同一首 H
// 整段循環先算成 AudioBuffer，再用 looping BufferSource 播放，避免主執行緒
// （3D 繪製、手機分頁節流）來不及排程而卡頓。預設 H 帶 assets/audio 裡的小 mp3，
// 其他 ?music= 主題則用 OfflineAudioContext 預先算好。
let ctx = null, master = null, timer = null, on = false, gestureHook = null, nextT = 0, phrase = 0;
let loopBuf = null, loopSrc = null, bakePromise = null;

const BPM = 76;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const CYCLE = BAR * 8; // 四個和弦，各兩小節
const hz = m => 440 * Math.pow(2, (m - 69) / 12);

// I  Eb ／ V  Bb ／ vi Cm ／ IV Ab
const CHORDS = [
  [51, 55, 58, 63],
  [46, 50, 53, 58],
  [48, 51, 55, 60],
  [44, 48, 51, 56],
];
const BASS = [39, 34, 36, 32];

// 兩段對答旋律（單位：拍、音高、拍長），慢句、有呼吸
const PHRASES = [
  [
    [0, 67, 2], [2, 70, 1], [3, 72, 1], [4, 70, 2], [6, 67, 2],
    [8, 65, 2], [10, 67, 1], [11, 70, 1], [12, 65, 3],
    [16, 72, 2], [18, 70, 1], [19, 67, 1], [20, 68, 2], [22, 67, 2],
    [24, 65, 2], [26, 63, 1], [27, 65, 1], [28, 67, 4],
  ],
  [
    [0, 70, 2], [2, 72, 1], [3, 75, 1], [4, 72, 2], [6, 70, 2],
    [8, 67, 2], [10, 65, 1], [11, 67, 1], [12, 70, 2],
    [16, 72, 2], [18, 74, 1], [19, 75, 1], [20, 72, 2], [22, 70, 2],
    [24, 68, 2], [26, 67, 1], [27, 65, 1], [28, 63, 4],
  ],
];

export const MUSIC_OPTIONS = {
  a: {
    id: 'a',
    name: '窗邊柔光',
    filename: 'a-window-glow',
    feel: '慢板鋼琴與溫暖鋪底，像傍晚靠窗坐下，語氣柔、留白多，讓人願意多待一會兒。',
  },
  b: {
    id: 'b',
    name: '逆風前行',
    filename: 'b-against-the-wind',
    feel: '弦樂與鋼琴慢慢往上走，帶著明明逆著走、卻還是往前的溫度與決心。',
  },
  c: {
    id: 'c',
    name: '夜景城市',
    filename: 'c-city-night',
    feel: '溫柔 lo-fi 電鋼琴，像夜里看著城市燈火，節奏不趕，適合一邊逛大樓一邊放空。',
  },
  d: {
    id: 'd',
    name: '默默堅持',
    filename: 'd-hold-fast',
    feel: '偏電影配樂的輕柔進行，小調起、大調撐住，沉靜裡有股不放棄的力量。',
  },
  e: {
    id: 'e',
    name: '午後咖啡',
    filename: 'e-afternoon-cafe',
    feel: '帶一點搖擺的午後咖啡廳節奏，電鋼琴來回勾旋律，讓人想點杯咖啡再坐一會兒。',
  },
  f: {
    id: 'f',
    name: '城市漫遊',
    filename: 'f-city-stroll',
    feel: '明亮的城市流行節奏，彈性貝斯和短促和弦，像出門逛街、陽光正好、腳步輕快。',
  },
  g: {
    id: 'g',
    name: '度假微醺',
    filename: 'g-vacation-glow',
    feel: '輕快的熱帶節奏，四拍地鼓和馬林巴旋律，像午後海邊的開放式大廳，舒服又有動感。',
  },
  h: {
    id: 'h',
    name: '遊戲大廳',
    filename: 'h-game-lobby',
    feel: '輕快跳躍的大廳音樂，明朗好記的小句子，像走進舒適的遊戲大廳，心情立刻亮起來。',
  },
};

const THEMES = {
  a: {
    bpm: 66,
    padTail: 1.55,
    masterGain: 0.48,
    lowpass: 3400,
    lpQ: 0.65,
    delays: [[0.74, 0.24, 0.28], [1.36, 0.15, 0.18]],
    style: 'ballad',
    shimmer: true,
    swell: [1, 1, 0.92],
    chords: [
      [51, 55, 58, 63],
      [48, 51, 55, 60],
      [44, 48, 51, 56],
      [46, 50, 53, 58],
    ],
    bass: [39, 36, 32, 34],
    phrases: [
      [
        [0, 67, 3], [3, 65, 1], [4, 70, 2], [6, 67, 2],
        [8, 68, 2], [10, 67, 2], [12, 65, 2], [14, 63, 2],
        [16, 72, 2], [18, 70, 2], [20, 68, 3], [23, 70, 1],
        [24, 67, 2], [26, 65, 2], [28, 63, 4],
      ],
      [
        [0, 70, 2], [2, 72, 2], [4, 75, 3], [7, 74, 1],
        [8, 72, 2], [10, 70, 2], [12, 68, 3], [15, 67, 1],
        [16, 68, 2], [18, 70, 2], [20, 72, 2], [22, 70, 2],
        [24, 67, 3], [27, 65, 1], [28, 63, 4],
      ],
      [
        [0, 63, 4], [4, 67, 2], [6, 70, 2],
        [8, 67, 3], [11, 65, 1], [12, 63, 4],
        [16, 68, 2], [18, 65, 2], [20, 63, 2], [22, 65, 2],
        [24, 67, 2], [26, 65, 2], [28, 63, 4],
      ],
    ],
  },
  b: {
    bpm: 78,
    padTail: 1.45,
    masterGain: 0.5,
    lowpass: 3800,
    lpQ: 0.6,
    delays: [[0.52, 0.22, 0.26], [1.04, 0.14, 0.17]],
    style: 'hopeful',
    shimmer: true,
    swell: [0.88, 1, 1.08],
    chords: [
      [52, 55, 59, 64],
      [48, 52, 55, 60],
      [43, 47, 50, 55],
      [50, 54, 57, 62],
    ],
    bass: [40, 36, 43, 38],
    phrases: [
      [
        [0, 67, 2], [2, 71, 2], [4, 74, 3], [7, 72, 1],
        [8, 71, 2], [10, 72, 2], [12, 74, 2], [14, 76, 2],
        [16, 79, 3], [19, 76, 1], [20, 74, 2], [22, 71, 2],
        [24, 72, 2], [26, 74, 2], [28, 71, 4],
      ],
      [
        [0, 71, 2], [2, 74, 1], [3, 76, 1], [4, 79, 2], [6, 76, 2],
        [8, 74, 2], [10, 72, 2], [12, 71, 2], [14, 69, 2],
        [16, 71, 2], [18, 72, 1], [19, 74, 1], [20, 76, 3], [23, 74, 1],
        [24, 72, 2], [26, 71, 2], [28, 67, 4],
      ],
      [
        [0, 64, 3], [3, 67, 1], [4, 71, 2], [6, 69, 2],
        [8, 67, 3], [11, 64, 1], [12, 60, 4],
        [16, 62, 2], [18, 64, 2], [20, 67, 2], [22, 71, 2],
        [24, 69, 3], [27, 67, 1], [28, 66, 4],
      ],
    ],
  },
  c: {
    bpm: 72,
    padTail: 1.35,
    masterGain: 0.48,
    lowpass: 2600,
    lpQ: 0.7,
    delays: [[0.42, 0.22, 0.24], [0.84, 0.14, 0.16]],
    style: 'lofi',
    shimmer: false,
    swell: [1, 0.96, 1.02],
    chords: [
      [53, 57, 60, 65],
      [50, 53, 57, 62],
      [46, 50, 53, 58],
      [48, 52, 55, 60],
    ],
    bass: [41, 38, 34, 36],
    phrases: [
      [
        [0, 65, 2], [2, 69, 2], [4, 72, 4],
        [8, 69, 2], [10, 67, 2], [12, 65, 4],
        [16, 62, 2], [18, 65, 2], [20, 69, 3], [23, 67, 1],
        [24, 65, 2], [26, 64, 2], [28, 65, 4],
      ],
      [
        [0, 72, 3], [3, 69, 1], [4, 65, 4],
        [8, 69, 2], [10, 72, 2], [12, 74, 2], [14, 72, 2],
        [16, 70, 3], [19, 69, 1], [20, 65, 4],
        [24, 67, 2], [26, 64, 2], [28, 60, 4],
      ],
      [
        [0, 60, 4], [4, 65, 2], [6, 69, 2],
        [8, 65, 3], [11, 62, 1], [12, 57, 4],
        [16, 58, 2], [18, 62, 2], [20, 65, 4],
        [24, 64, 3], [27, 62, 1], [28, 60, 4],
      ],
    ],
  },
  d: {
    bpm: 70,
    padTail: 1.7,
    masterGain: 0.5,
    lowpass: 3400,
    lpQ: 0.62,
    delays: [[0.86, 0.26, 0.3], [1.68, 0.16, 0.2]],
    style: 'cinematic',
    shimmer: true,
    swell: [0.92, 1, 1.08],
    chords: [
      [48, 51, 55, 60],
      [44, 48, 51, 56],
      [51, 55, 58, 63],
      [46, 50, 53, 58],
    ],
    bass: [36, 32, 39, 34],
    phrases: [
      [
        [0, 67, 4], [4, 70, 2], [6, 72, 2],
        [8, 75, 3], [11, 72, 1], [12, 70, 2], [14, 68, 2],
        [16, 70, 2], [18, 72, 2], [20, 75, 2], [22, 77, 2],
        [24, 75, 2], [26, 74, 2], [28, 72, 4],
      ],
      [
        [0, 60, 2], [2, 63, 2], [4, 67, 3], [7, 70, 1],
        [8, 68, 2], [10, 67, 2], [12, 65, 2], [14, 63, 2],
        [16, 70, 2], [18, 72, 2], [20, 75, 3], [23, 74, 1],
        [24, 72, 2], [26, 70, 2], [28, 67, 4],
      ],
      [
        [0, 72, 3], [3, 70, 1], [4, 67, 4],
        [8, 68, 2], [10, 72, 2], [12, 75, 4],
        [16, 77, 2], [18, 75, 2], [20, 74, 2], [22, 70, 2],
        [24, 72, 3], [27, 70, 1], [28, 67, 4],
      ],
    ],
  },
  e: {
    bpm: 96,
    groove: true,
    style: 'cafe',
    swing: 0.7,
    masterGain: 0.46,
    lowpass: 10000,
    lpQ: 0.5,
    delays: [[0.19, 0.14, 0.16], [0.35, 0.08, 0.1]],
    compressor: true,
    chords: [
      [53, 57, 60, 64],
      [50, 54, 57, 60],
      [55, 59, 62, 65],
      [48, 52, 55, 58],
    ],
    bass: [41, 38, 43, 36],
    bassKind: 'round',
    bassLines: [
      [[0,41,4],[6,41,2],[8,43,2],[10,41,2],[12,45,2],[14,41,2],[16,41,4],[22,41,2],[24,45,2],[26,43,2],[28,41,2],[30,40,2]],
      [[0,38,4],[6,38,2],[8,42,2],[10,38,2],[12,45,2],[14,38,2],[16,38,4],[22,38,2],[24,42,2],[26,38,2],[28,40,2],[30,42,2]],
      [[0,43,4],[6,43,2],[8,47,2],[10,43,2],[12,50,2],[14,43,2],[16,43,4],[22,43,2],[24,47,2],[26,45,2],[28,43,2],[30,41,2]],
      [[0,36,4],[6,36,2],[8,40,2],[10,36,2],[12,43,2],[14,36,2],[16,36,4],[22,36,2],[24,40,2],[26,38,2],[28,36,2],[30,40,2]],
    ],
    drums: 'cafe',
    phrases: [
      [
        [0, 72, 0.5], [0.5, 74, 0.5], [1, 77, 1], [2, 74, 0.5], [2.5, 72, 0.5], [3, 69, 1],
        [4, 72, 0.5], [4.5, 69, 0.5], [5, 65, 1], [6, 67, 1], [7, 69, 1],
        [8, 74, 0.5], [8.5, 76, 0.5], [9, 74, 1], [10, 69, 1], [11, 66, 1],
        [12, 69, 0.5], [12.5, 66, 0.5], [13, 62, 1], [14, 64, 1], [15, 66, 1],
        [16, 71, 0.5], [16.5, 74, 0.5], [17, 79, 1], [18, 74, 1], [19, 71, 1],
        [20, 74, 0.5], [20.5, 71, 0.5], [21, 67, 1], [22, 69, 1], [23, 71, 1],
        [24, 72, 0.5], [24.5, 76, 0.5], [25, 72, 1], [26, 69, 1], [27, 67, 1],
        [28, 65, 1], [29, 67, 1], [30, 69, 1], [31, 70, 1],
      ],
      [
        [0, 77, 0.5], [0.5, 76, 0.5], [1, 74, 1], [2, 72, 1], [3, 69, 1],
        [4, 72, 0.5], [4.5, 74, 0.5], [5, 77, 1], [6, 74, 1], [7, 72, 1],
        [8, 76, 0.5], [8.5, 74, 0.5], [9, 69, 1], [10, 66, 1], [11, 69, 1],
        [12, 74, 1], [13, 76, 1], [14, 74, 1], [15, 69, 1],
        [16, 79, 0.5], [16.5, 76, 0.5], [17, 74, 1], [18, 71, 1], [19, 67, 1],
        [20, 71, 0.5], [20.5, 74, 0.5], [21, 79, 1], [22, 74, 1], [23, 71, 1],
        [24, 76, 1], [25, 72, 1], [26, 69, 1], [27, 67, 1],
        [28, 69, 1], [29, 67, 1], [30, 65, 1], [31, 67, 1],
      ],
      [
        [0, 72, 0.5], [0.5, 74, 0.5], [1, 72, 0.5], [1.5, 69, 0.5], [2, 72, 1], [3, 69, 1],
        [4, 65, 0.5], [4.5, 67, 0.5], [5, 69, 1], [6, 72, 1], [7, 74, 1],
        [8, 69, 0.5], [8.5, 74, 0.5], [9, 69, 0.5], [9.5, 66, 0.5], [10, 69, 1], [11, 66, 1],
        [12, 62, 0.5], [12.5, 66, 0.5], [13, 69, 1], [14, 74, 1], [15, 76, 1],
        [16, 71, 0.5], [16.5, 74, 0.5], [17, 71, 0.5], [17.5, 67, 0.5], [18, 71, 1], [19, 74, 1],
        [20, 79, 1], [21, 74, 1], [22, 71, 1], [23, 67, 1],
        [24, 72, 0.5], [24.5, 76, 0.5], [25, 72, 0.5], [25.5, 69, 0.5], [26, 67, 1], [27, 69, 1],
        [28, 72, 1], [29, 69, 1], [30, 67, 1], [31, 65, 1],
      ],
      [
        [0, 72, 0.5], [0.5, 74, 0.5], [1, 77, 1], [2, 74, 0.5], [2.5, 72, 0.5], [3, 69, 1],
        [4, 72, 0.5], [4.5, 69, 0.5], [5, 65, 1], [6, 67, 1], [7, 69, 1],
        [8, 74, 1], [9, 76, 0.5], [9.5, 74, 0.5], [10, 69, 1], [11, 66, 1],
        [12, 69, 1], [13, 62, 1], [14, 66, 1], [15, 69, 1],
        [16, 71, 0.5], [16.5, 74, 0.5], [17, 79, 1], [18, 76, 1], [19, 74, 1],
        [20, 71, 1], [21, 67, 1], [22, 69, 1], [23, 71, 1],
        [24, 72, 1], [25, 76, 1], [26, 72, 1], [27, 69, 1],
        [28, 67, 1], [29, 69, 1], [30, 70, 1], [31, 72, 1],
      ],
    ],
  },
  f: {
    bpm: 110,
    groove: true,
    style: 'citypop',
    swing: 0.16,
    masterGain: 0.48,
    lowpass: 12000,
    lpQ: 0.45,
    delays: [[0.16, 0.12, 0.14], [0.3, 0.07, 0.09]],
    compressor: true,
    chords: [
      [48, 52, 55, 60],
      [40, 44, 47, 52],
      [41, 45, 48, 53],
      [43, 47, 50, 55],
    ],
    bass: [36, 40, 41, 43],
    bassKind: 'slap',
    bassLines: [
      [[0,36,2],[2,36,1],[3,48,1],[4,36,2],[6,43,1],[7,36,1],[8,36,2],[10,48,2],[12,36,2],[14,35,1],[15,36,1],[16,36,2],[18,48,1],[19,36,1],[20,36,2],[22,43,2],[24,36,2],[26,40,2],[28,36,2],[30,38,1],[31,40,1]],
      [[0,40,2],[2,40,1],[3,52,1],[4,40,2],[6,47,1],[7,40,1],[8,40,2],[10,52,2],[12,40,2],[14,40,1],[15,42,1],[16,40,2],[18,52,1],[19,40,1],[20,40,2],[22,47,2],[24,40,2],[26,42,2],[28,40,2],[30,40,1],[31,41,1]],
      [[0,41,2],[2,41,1],[3,53,1],[4,41,2],[6,48,1],[7,41,1],[8,41,2],[10,53,2],[12,41,2],[14,40,1],[15,41,1],[16,41,2],[18,53,1],[19,41,1],[20,41,2],[22,48,2],[24,41,2],[26,43,2],[28,41,2],[30,42,1],[31,43,1]],
      [[0,43,2],[2,43,1],[3,55,1],[4,43,2],[6,50,1],[7,43,1],[8,43,2],[10,55,2],[12,43,2],[14,43,1],[15,45,1],[16,43,2],[18,55,1],[19,43,1],[20,43,2],[22,50,2],[24,43,2],[26,41,2],[28,43,2],[30,38,1],[31,36,1]],
    ],
    drums: 'citypop',
    phrases: [
      [
        [0.5, 72, 0.5], [1, 76, 0.5], [1.5, 79, 0.5], [2.5, 81, 0.5], [3, 79, 1],
        [4, 76, 1], [5, 72, 0.5], [5.5, 74, 0.5], [6, 76, 1], [7, 72, 1],
        [8.5, 76, 0.5], [9, 80, 0.5], [9.5, 83, 0.5], [10.5, 80, 0.5], [11, 76, 1],
        [12, 71, 1], [13, 68, 1], [14, 71, 1], [15, 76, 1],
        [16.5, 77, 0.5], [17, 81, 0.5], [17.5, 84, 0.5], [18.5, 81, 0.5], [19, 77, 1],
        [20, 72, 1], [21, 69, 1], [22, 72, 1], [23, 77, 1],
        [24.5, 79, 0.5], [25, 83, 0.5], [25.5, 79, 0.5], [26, 76, 1], [27, 74, 1],
        [28, 72, 1], [29, 74, 1], [30, 76, 1], [31, 79, 1],
      ],
      [
        [0, 79, 0.5], [0.5, 81, 0.5], [1, 84, 1], [2, 81, 0.5], [2.5, 79, 0.5], [3, 76, 1],
        [4, 79, 0.5], [4.5, 76, 0.5], [5, 72, 1], [6, 74, 1], [7, 76, 1],
        [8, 80, 0.5], [8.5, 83, 0.5], [9, 80, 1], [10, 76, 1], [11, 71, 1],
        [12, 76, 1], [13, 80, 1], [14, 76, 1], [15, 71, 1],
        [16, 77, 0.5], [16.5, 81, 0.5], [17, 84, 1], [18, 81, 1], [19, 77, 1],
        [20, 72, 0.5], [20.5, 76, 0.5], [21, 77, 1], [22, 81, 1], [23, 77, 1],
        [24, 79, 1], [25, 76, 1], [26, 74, 1], [27, 72, 1],
        [28, 74, 1], [29, 76, 1], [30, 74, 1], [31, 71, 1],
      ],
      [
        [0, 72, 0.5], [0.5, 76, 0.5], [1, 72, 0.5], [1.5, 67, 0.5], [2, 72, 1], [3, 76, 1],
        [4, 79, 0.5], [4.5, 76, 0.5], [5, 72, 1], [6, 69, 1], [7, 72, 1],
        [8, 76, 0.5], [8.5, 80, 0.5], [9, 76, 0.5], [9.5, 71, 0.5], [10, 76, 1], [11, 80, 1],
        [12, 83, 1], [13, 80, 1], [14, 76, 1], [15, 71, 1],
        [16, 77, 0.5], [16.5, 81, 0.5], [17, 77, 0.5], [17.5, 72, 0.5], [18, 77, 1], [19, 81, 1],
        [20, 84, 1], [21, 81, 1], [22, 77, 1], [23, 72, 1],
        [24, 79, 0.5], [24.5, 83, 0.5], [25, 79, 1], [26, 76, 1], [27, 74, 1],
        [28, 72, 1], [29, 76, 1], [30, 79, 1], [31, 81, 1],
      ],
      [
        [0.5, 72, 0.5], [1, 76, 0.5], [1.5, 79, 0.5], [2.5, 81, 0.5], [3, 79, 1],
        [4, 76, 1], [5.5, 74, 0.5], [6, 76, 1], [7, 79, 1],
        [8.5, 80, 0.5], [9, 83, 0.5], [9.5, 80, 0.5], [10, 76, 1], [11, 71, 1],
        [12, 76, 1], [13, 71, 1], [14, 68, 1], [15, 71, 1],
        [16.5, 77, 0.5], [17, 81, 1], [18, 84, 1], [19, 81, 1],
        [20, 77, 1], [21, 72, 1], [22, 76, 1], [23, 77, 1],
        [24, 79, 0.5], [24.5, 83, 0.5], [25, 79, 1], [26, 76, 1], [27, 74, 1],
        [28, 72, 1], [29, 74, 1], [30, 76, 0.5], [30.5, 74, 0.5], [31, 72, 1],
      ],
    ],
  },
  g: {
    bpm: 115,
    groove: true,
    style: 'tropical',
    swing: 0,
    masterGain: 0.48,
    lowpass: 12000,
    lpQ: 0.45,
    delays: [[0.26, 0.16, 0.18], [0.52, 0.1, 0.12]],
    compressor: true,
    chords: [
      [45, 49, 52, 57],
      [40, 44, 47, 52],
      [38, 42, 45, 50],
      [40, 44, 47, 52],
    ],
    bass: [33, 40, 38, 40],
    bassKind: 'house',
    bassLines: [
      [[0,33,2],[2,33,2],[4,33,2],[6,45,2],[8,33,2],[10,33,2],[12,33,2],[14,45,2],[16,33,2],[18,33,2],[20,33,2],[22,45,2],[24,33,2],[26,37,2],[28,33,2],[30,35,2]],
      [[0,40,2],[2,40,2],[4,40,2],[6,52,2],[8,40,2],[10,40,2],[12,40,2],[14,52,2],[16,40,2],[18,40,2],[20,40,2],[22,52,2],[24,40,2],[26,42,2],[28,40,2],[30,38,2]],
      [[0,38,2],[2,38,2],[4,38,2],[6,50,2],[8,38,2],[10,38,2],[12,38,2],[14,50,2],[16,38,2],[18,38,2],[20,38,2],[22,50,2],[24,38,2],[26,40,2],[28,38,2],[30,38,2]],
      [[0,40,2],[2,40,2],[4,40,2],[6,52,2],[8,40,2],[10,40,2],[12,40,2],[14,52,2],[16,40,2],[18,40,2],[20,40,2],[22,52,2],[24,40,2],[26,35,2],[28,40,2],[30,32,2]],
    ],
    drums: 'tropical',
    phrases: [
      [
        [0, 76, 0.5], [0.5, 78, 0.5], [1, 81, 1], [2, 78, 1], [3, 76, 1],
        [4, 73, 1], [5, 76, 1], [6, 69, 1], [7, 73, 1],
        [8, 76, 0.5], [8.5, 80, 0.5], [9, 83, 1], [10, 80, 1], [11, 76, 1],
        [12, 71, 1], [13, 73, 1], [14, 76, 1], [15, 80, 1],
        [16, 74, 0.5], [16.5, 78, 0.5], [17, 81, 1], [18, 78, 1], [19, 74, 1],
        [20, 69, 1], [21, 73, 1], [22, 74, 1], [23, 78, 1],
        [24, 76, 0.5], [24.5, 80, 0.5], [25, 76, 1], [26, 73, 1], [27, 71, 1],
        [28, 69, 1], [29, 73, 1], [30, 76, 1], [31, 78, 1],
      ],
      [
        [0, 81, 0.5], [0.5, 78, 0.5], [1, 76, 1], [2, 73, 1], [3, 76, 1],
        [4, 78, 0.5], [4.5, 81, 0.5], [5, 85, 1], [6, 81, 1], [7, 78, 1],
        [8, 80, 0.5], [8.5, 76, 0.5], [9, 71, 1], [10, 76, 1], [11, 80, 1],
        [12, 83, 1], [13, 80, 1], [14, 76, 1], [15, 71, 1],
        [16, 81, 0.5], [16.5, 78, 0.5], [17, 74, 1], [18, 69, 1], [19, 74, 1],
        [20, 78, 1], [21, 81, 1], [22, 78, 1], [23, 74, 1],
        [24, 76, 1], [25, 80, 1], [26, 76, 1], [27, 73, 1],
        [28, 71, 1], [29, 73, 1], [30, 76, 1], [31, 73, 1],
      ],
      [
        [0, 69, 0.5], [0.5, 73, 0.5], [1, 76, 0.5], [1.5, 78, 0.5], [2, 81, 1], [3, 78, 1],
        [4, 76, 0.5], [4.5, 73, 0.5], [5, 76, 1], [6, 69, 1], [7, 73, 1],
        [8, 71, 0.5], [8.5, 76, 0.5], [9, 80, 1], [10, 76, 1], [11, 71, 1],
        [12, 68, 1], [13, 71, 1], [14, 76, 1], [15, 80, 1],
        [16, 74, 0.5], [16.5, 69, 0.5], [17, 74, 1], [18, 78, 1], [19, 81, 1],
        [20, 78, 0.5], [20.5, 74, 0.5], [21, 69, 1], [22, 74, 1], [23, 78, 1],
        [24, 76, 1], [25, 73, 1], [26, 71, 1], [27, 73, 1],
        [28, 76, 1], [29, 78, 1], [30, 81, 1], [31, 78, 1],
      ],
      [
        [0, 76, 0.5], [0.5, 78, 0.5], [1, 81, 1], [2, 78, 1], [3, 76, 1],
        [4, 73, 0.5], [4.5, 76, 0.5], [5, 81, 1], [6, 85, 1], [7, 81, 1],
        [8, 80, 1], [9, 76, 1], [10, 80, 1], [11, 83, 1],
        [12, 80, 1], [13, 76, 1], [14, 71, 1], [15, 76, 1],
        [16, 78, 0.5], [16.5, 81, 0.5], [17, 78, 1], [18, 74, 1], [19, 69, 1],
        [20, 74, 1], [21, 78, 1], [22, 81, 1], [23, 78, 1],
        [24, 76, 0.5], [24.5, 80, 0.5], [25, 76, 1], [26, 73, 1], [27, 76, 1],
        [28, 73, 1], [29, 71, 1], [30, 69, 1], [31, 73, 1],
      ],
    ],
  },
  h: {
    bpm: 120,
    groove: true,
    style: 'lobby',
    swing: 0.12,
    masterGain: 0.48,
    lowpass: 13000,
    lpQ: 0.4,
    delays: [[0.15, 0.12, 0.13], [0.29, 0.07, 0.09]],
    compressor: true,
    chords: [
      [43, 47, 50, 55],
      [48, 52, 55, 60],
      [50, 54, 57, 62],
      [43, 47, 50, 55],
    ],
    bass: [43, 36, 38, 43],
    bassKind: 'bounce',
    bassLines: [
      [[0,43,2],[2,50,2],[4,55,2],[6,50,2],[8,43,2],[10,50,2],[12,55,2],[14,50,2],[16,43,2],[18,50,2],[20,55,2],[22,50,2],[24,43,2],[26,45,2],[28,47,2],[30,48,2]],
      [[0,36,2],[2,43,2],[4,48,2],[6,43,2],[8,36,2],[10,43,2],[12,48,2],[14,43,2],[16,36,2],[18,43,2],[20,48,2],[22,43,2],[24,36,2],[26,38,2],[28,40,2],[30,42,2]],
      [[0,38,2],[2,45,2],[4,50,2],[6,45,2],[8,38,2],[10,45,2],[12,50,2],[14,45,2],[16,38,2],[18,45,2],[20,50,2],[22,45,2],[24,38,2],[26,40,2],[28,42,2],[30,43,2]],
      [[0,43,2],[2,50,2],[4,55,2],[6,50,2],[8,43,2],[10,50,2],[12,55,2],[14,50,2],[16,43,2],[18,50,2],[20,55,2],[22,50,2],[24,43,2],[26,47,2],[28,50,2],[30,43,2]],
    ],
    drums: 'lobby',
    phrases: [
      [
        [0, 74, 0.5], [0.5, 76, 0.5], [1, 79, 1], [2, 76, 0.5], [2.5, 74, 0.5], [3, 71, 1],
        [4, 74, 0.5], [4.5, 71, 0.5], [5, 67, 1], [6, 69, 1], [7, 71, 1],
        [8, 72, 0.5], [8.5, 76, 0.5], [9, 79, 1], [10, 76, 1], [11, 72, 1],
        [12, 74, 1], [13, 72, 1], [14, 71, 1], [15, 69, 1],
        [16, 74, 0.5], [16.5, 78, 0.5], [17, 81, 1], [18, 78, 1], [19, 74, 1],
        [20, 76, 1], [21, 74, 1], [22, 71, 1], [23, 74, 1],
        [24, 79, 1], [25, 76, 1], [26, 74, 1], [27, 71, 1],
        [28, 74, 1], [29, 71, 1], [30, 69, 1], [31, 67, 1],
      ],
      [
        [0, 79, 0.5], [0.5, 76, 0.5], [1, 74, 1], [2, 71, 1], [3, 67, 1],
        [4, 71, 0.5], [4.5, 74, 0.5], [5, 79, 1], [6, 76, 1], [7, 74, 1],
        [8, 76, 0.5], [8.5, 79, 0.5], [9, 84, 1], [10, 79, 1], [11, 76, 1],
        [12, 72, 1], [13, 76, 1], [14, 79, 1], [15, 76, 1],
        [16, 78, 0.5], [16.5, 81, 0.5], [17, 86, 1], [18, 81, 1], [19, 78, 1],
        [20, 74, 1], [21, 78, 1], [22, 81, 1], [23, 78, 1],
        [24, 79, 0.5], [24.5, 83, 0.5], [25, 79, 1], [26, 74, 1], [27, 71, 1],
        [28, 74, 1], [29, 76, 1], [30, 74, 1], [31, 71, 1],
      ],
      [
        [0, 67, 0.5], [0.5, 71, 0.5], [1, 74, 0.5], [1.5, 76, 0.5], [2, 79, 1], [3, 76, 1],
        [4, 74, 0.5], [4.5, 71, 0.5], [5, 67, 1], [6, 69, 1], [7, 71, 1],
        [8, 72, 0.5], [8.5, 76, 0.5], [9, 72, 0.5], [9.5, 67, 0.5], [10, 72, 1], [11, 76, 1],
        [12, 79, 1], [13, 76, 1], [14, 72, 1], [15, 76, 1],
        [16, 74, 0.5], [16.5, 78, 0.5], [17, 74, 0.5], [17.5, 69, 0.5], [18, 74, 1], [19, 78, 1],
        [20, 81, 1], [21, 78, 1], [22, 74, 1], [23, 78, 1],
        [24, 79, 1], [25, 74, 1], [26, 71, 1], [27, 74, 1],
        [28, 76, 0.5], [28.5, 79, 0.5], [29, 76, 1], [30, 74, 1], [31, 71, 1],
      ],
      [
        [0, 74, 0.5], [0.5, 76, 0.5], [1, 79, 1], [2, 76, 0.5], [2.5, 74, 0.5], [3, 71, 1],
        [4, 74, 0.5], [4.5, 71, 0.5], [5, 67, 1], [6, 71, 1], [7, 74, 1],
        [8, 72, 0.5], [8.5, 76, 0.5], [9, 79, 1], [10, 84, 1], [11, 79, 1],
        [12, 76, 1], [13, 72, 1], [14, 76, 1], [15, 79, 1],
        [16, 81, 0.5], [16.5, 78, 0.5], [17, 74, 1], [18, 78, 1], [19, 81, 1],
        [20, 86, 1], [21, 81, 1], [22, 78, 1], [23, 74, 1],
        [24, 79, 0.5], [24.5, 83, 0.5], [25, 79, 1], [26, 76, 1], [27, 74, 1],
        [28, 71, 1], [29, 74, 1], [30, 76, 1], [31, 74, 1],
      ],
    ],
  },
};

function readThemeId() {
  try {
    const q = new URLSearchParams(location.search).get('music');
    if (!q) return 'h';
    const k = String(q).trim().toLowerCase();
    if (k === 'classic' || k === 'orig' || k === 'legacy') return 'classic';
    return THEMES[k] ? k : 'h';
  } catch {
    return 'h';
  }
}

const themeId = readThemeId();
const activeTheme = themeId === 'classic' ? null : (THEMES[themeId] || THEMES.h);

export function getActiveMusicTheme() { return themeId; }

function voice(midi, t, dur, gain, type, attack, detune = 1) {
  const o = ctx.createOscillator(), v = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(hz(midi) * detune, t);
  const a = Math.min(attack, dur * 0.4);
  const rel = Math.min(1.8, Math.max(0.55, dur * 0.45));
  v.gain.setValueAtTime(0, t);
  v.gain.linearRampToValueAtTime(gain, t + a);
  const hold = Math.max(a, dur * 0.58);
  v.gain.setValueAtTime(gain, t + hold);
  v.gain.linearRampToValueAtTime(0, t + dur + rel);
  o.connect(v); v.connect(master);
  o.start(t); o.stop(t + dur + rel + 0.08);
}

function padNote(midi, t, dur, g) {
  voice(midi, t, dur, g, 'sine', 1.35);
  voice(midi, t, dur, g * 0.32, 'triangle', 1.5, 1.002);
  voice(midi - 12, t, dur, g * 0.22, 'sine', 1.6);
}

function piano(midi, t, beats) {
  const dur = beats * BEAT * 0.96;
  const g = 0.072;
  voice(midi, t, dur, g, 'sine', 0.028);
  voice(midi, t, dur, g * 0.28, 'triangle', 0.04, 1.0015);
  voice(midi + 12, t, dur * 0.75, g * 0.07, 'sine', 0.06);
}

function shimmer(midi, t, dur) {
  // 極輕的高音亮片，慢起慢收，不是琶音
  voice(midi + 24, t, dur, 0.009, 'sine', 2.2, 1.003);
  voice(midi + 31, t + dur * 0.15, dur * 0.85, 0.006, 'sine', 2.4, 0.997);
}

function scheduleClassicAt(ac, dest, t0, phraseIdx) {
  const hold = BAR * 2 + 1.6;
  CHORDS.forEach((chord, i) => {
    const t = t0 + i * BAR * 2;
    chord.forEach((m, k) => {
      const g = k ? 0.028 : 0.036;
      tone(ac, dest, m, t, hold, g, 'sine', 1.35);
      tone(ac, dest, m, t, hold, g * 0.32, 'triangle', 1.5, 1.002);
      tone(ac, dest, m - 12, t, hold, g * 0.22, 'sine', 1.6);
    });
    tone(ac, dest, BASS[i], t, hold, 0.05, 'sine', 1.2);
    const top = chord[chord.length - 1];
    tone(ac, dest, top + 24, t, hold, 0.009, 'sine', 2.2, 1.003);
    tone(ac, dest, top + 31, t + hold * 0.15, hold * 0.85, 0.006, 'sine', 2.4, 0.997);
  });
  PHRASES[phraseIdx % PHRASES.length].forEach(([beat, midi, len]) => {
    const dur = len * BEAT * 0.96;
    const g = 0.072;
    const tt = t0 + beat * BEAT;
    tone(ac, dest, midi, tt, dur, g, 'sine', 0.028);
    tone(ac, dest, midi, tt, dur, g * 0.28, 'triangle', 0.04, 1.0015);
    tone(ac, dest, midi + 12, tt, dur * 0.75, g * 0.07, 'sine', 0.06);
  });
}

function scheduleCycle(t0) {
  scheduleClassicAt(ctx, master, t0, phrase);
  phrase++;
}

function tone(ac, dest, midi, t, dur, gain, type, attack, detune = 1, relScale = 1) {
  if (!ac || !dest || gain <= 0 || dur <= 0) return;
  const o = ac.createOscillator(), v = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(hz(midi) * detune, t);
  const a = Math.min(attack, Math.max(0.01, dur * 0.4));
  const rel = Math.min(2.1, Math.max(0.5, dur * 0.45)) * relScale;
  v.gain.setValueAtTime(0, Math.max(0, t));
  v.gain.linearRampToValueAtTime(gain, t + a);
  const hold = Math.max(a, dur * 0.58);
  v.gain.setValueAtTime(gain, t + hold);
  v.gain.linearRampToValueAtTime(0, t + dur + rel);
  o.connect(v); v.connect(dest);
  o.start(t); o.stop(t + dur + rel + 0.08);
}

function toneHz(ac, dest, freq, t, dur, gain, attack, relScale = 1) {
  if (!ac || !dest || gain <= 0 || dur <= 0 || freq <= 20) return;
  const o = ac.createOscillator(), v = ac.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(freq, t);
  const a = Math.min(Math.max(0.004, attack), Math.max(0.008, dur * 0.35));
  const rel = Math.min(2.0, Math.max(0.28, dur * 0.42)) * relScale;
  const hold = Math.max(a, dur * 0.42);
  v.gain.setValueAtTime(0, Math.max(0, t));
  v.gain.linearRampToValueAtTime(gain, t + a);
  v.gain.linearRampToValueAtTime(gain * 0.72, t + hold);
  v.gain.linearRampToValueAtTime(0, t + dur + rel);
  o.connect(v); v.connect(dest);
  o.start(t); o.stop(t + dur + rel + 0.08);
}

function pianoPartials(ac, dest, midi, t, dur, g, brightness = 1) {
  const f0 = hz(midi);
  toneHz(ac, dest, f0, t, Math.min(0.09, dur * 0.12), g * 0.22, 0.003, 0.22);
  const parts = [
    [1, 1.00, 0.010, 1.00],
    [2, 0.52, 0.012, 0.80],
    [3, 0.28, 0.014, 0.66],
    [4, 0.16, 0.016, 0.54],
    [5, 0.10, 0.018, 0.44],
    [6, 0.06, 0.020, 0.36],
    [8, 0.035, 0.022, 0.30],
  ];
  for (const [h, hg, atk, relS] of parts) {
    const durH = dur * Math.max(0.30, 1 - (h - 1) * 0.07);
    const gH = g * hg * (h === 1 ? 1 : brightness);
    toneHz(ac, dest, f0 * h, t, durH, gH, atk, relS);
  }
}

function padForStyle(ac, dest, style, midi, t, dur, g) {
  if (style === 'hopeful') {
    tone(ac, dest, midi, t, dur, g, 'sine', 1.7);
    tone(ac, dest, midi, t, dur, g * 0.36, 'triangle', 1.85, 1.003);
    tone(ac, dest, midi, t, dur, g * 0.24, 'sine', 1.9, 0.997);
    tone(ac, dest, midi + 12, t, dur, g * 0.1, 'sine', 2.0);
    tone(ac, dest, midi - 12, t, dur, g * 0.16, 'sine', 2.0);
  } else if (style === 'lofi') {
    tone(ac, dest, midi, t, dur, g * 0.85, 'sine', 1.5);
    tone(ac, dest, midi, t, dur, g * 0.2, 'triangle', 1.7, 1.0018);
    tone(ac, dest, midi + 12, t, dur, g * 0.08, 'sine', 1.6);
    tone(ac, dest, midi - 12, t, dur, g * 0.15, 'sine', 1.8);
  } else if (style === 'cinematic') {
    tone(ac, dest, midi, t, dur, g, 'sine', 1.85);
    tone(ac, dest, midi, t, dur, g * 0.34, 'triangle', 2.0, 1.0025);
    tone(ac, dest, midi, t, dur, g * 0.2, 'sine', 2.1, 0.9975);
    tone(ac, dest, midi + 12, t, dur, g * 0.09, 'sine', 2.2);
    tone(ac, dest, midi - 12, t, dur, g * 0.22, 'sine', 2.2);
  } else {
    tone(ac, dest, midi, t, dur, g, 'sine', 1.55);
    tone(ac, dest, midi, t, dur, g * 0.28, 'triangle', 1.7, 1.002);
    tone(ac, dest, midi + 12, t, dur, g * 0.08, 'sine', 1.8);
    tone(ac, dest, midi - 12, t, dur, g * 0.16, 'sine', 1.8);
  }
}

function melodyForStyle(ac, dest, style, midi, t, beats, beatDur, mul) {
  const dur = beats * beatDur * (style === 'lofi' ? 1.04 : 0.96);
  if (style === 'lofi') {
    const g = 0.10 * mul;
    const f0 = hz(midi);
    pianoPartials(ac, dest, midi, t, dur, g, 0.85);
    toneHz(ac, dest, f0 * 2, t, dur * 0.4, g * 0.22, 0.008, 0.4);
    toneHz(ac, dest, f0 * 3, t, dur * 0.18, g * 0.08, 0.006, 0.28);
  } else if (style === 'cinematic') {
    const g = 0.11 * mul;
    pianoPartials(ac, dest, midi, t, dur, g, 1.05);
    if (beats >= 2) tone(ac, dest, midi - 12, t, dur, g * 0.12, 'sine', 0.08);
    if (beats >= 2) tone(ac, dest, midi, t, dur * 1.08, g * 0.02, 'sine', 0.4, 1.002, 1.1);
  } else if (style === 'hopeful') {
    const g = 0.115 * mul;
    pianoPartials(ac, dest, midi, t, dur, g, 1.1);
    if (beats >= 2) tone(ac, dest, midi, t, dur * 1.08, g * 0.022, 'sine', 0.35, 1.002, 1.15);
  } else {
    const g = 0.115 * mul;
    pianoPartials(ac, dest, midi, t, dur, g, 1);
  }
}

function compForStyle(ac, dest, th, chord, bassMidi, t, bar, beat, mul) {
  const style = th.style;
  if (style === 'ballad') {
    const g = 0.02 * mul;
    [0, bar].forEach(off => {
      tone(ac, dest, chord[0] + 12, t + off, beat * 1.8, g, 'sine', 0.03);
      tone(ac, dest, chord[1] + 12, t + off + 0.12, beat * 1.6, g * 0.7, 'sine', 0.04);
      tone(ac, dest, chord[2] + 12, t + off + 0.24, beat * 1.5, g * 0.55, 'sine', 0.04);
    });
    tone(ac, dest, chord[2] + 12, t + beat * 3, beat * 1.4, 0.012 * mul, 'sine', 0.04);
    tone(ac, dest, chord[2] + 12, t + bar + beat * 3, beat * 1.4, 0.012 * mul, 'sine', 0.04);
  } else if (style === 'hopeful') {
    const steps = [chord[0] + 12, chord[2] + 12, chord[1] + 12, chord[3] || (chord[0] + 24)];
    for (let i = 0; i < 8; i++) {
      const m = steps[i % steps.length];
      tone(ac, dest, m, t + i * beat, beat * 0.9, 0.013 * mul, 'sine', 0.02);
    }
  } else if (style === 'lofi') {
    const g = 0.022 * mul;
    [0, bar].forEach(off => {
      tone(ac, dest, chord[0], t + off, beat * 2.4, g * 0.7, 'sine', 0.02);
      tone(ac, dest, chord[1], t + off, beat * 2.2, g, 'triangle', 0.025, 1.001);
      tone(ac, dest, chord[2], t + off, beat * 2.2, g * 0.85, 'sine', 0.025);
    });
  } else if (style === 'cinematic') {
    const g = 0.03 * mul;
    [0, bar].forEach(off => {
      tone(ac, dest, bassMidi + 12, t + off, beat * 1.8, g, 'sine', 0.04);
      tone(ac, dest, bassMidi + 24, t + off, beat * 1.5, g * 0.45, 'sine', 0.05);
    });
    tone(ac, dest, chord[2], t + beat * 3, beat * 1.3, 0.016 * mul, 'sine', 0.05);
    tone(ac, dest, chord[2], t + bar + beat * 3, beat * 1.3, 0.016 * mul, 'sine', 0.05);
  }
}


const noiseBufs = new WeakMap();
const noiseSrcs = new WeakMap();
function getNoise(ac) {
  let b = noiseBufs.get(ac);
  if (b) return b;
  const n = Math.ceil(ac.sampleRate * 1.8);
  b = ac.createBuffer(1, n, ac.sampleRate);
  const d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) {
    // mild brown-ish mix keeps hats less harsh than pure white
    const w = Math.random() * 2 - 1;
    last = last * 0.35 + w * 0.65;
    d[i] = last;
  }
  noiseBufs.set(ac, b);
  return b;
}
function sharedNoise(ac) {
  let src = noiseSrcs.get(ac);
  if (src) return src;
  src = ac.createBufferSource();
  src.buffer = getNoise(ac);
  src.loop = true;
  try { src.start(0); } catch (e) { try { src.start(); } catch (e2) {} }
  noiseSrcs.set(ac, src);
  return src;
}

function noiseBurst(ac, dest, t, dur, g, filterType, freq, q, pan) {
  if (g <= 0 || dur <= 0) return;
  const f = ac.createBiquadFilter();
  f.type = filterType;
  f.frequency.setValueAtTime(freq, t);
  f.Q.value = q || 1;
  const v = ac.createGain();
  v.gain.value = 0;
  v.gain.setValueAtTime(0, 0);
  v.gain.setValueAtTime(0, Math.max(0, t));
  v.gain.linearRampToValueAtTime(g, t + 0.003);
  v.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.01, dur));
  sharedNoise(ac).connect(f); f.connect(v);
  if (pan != null && ac.createStereoPanner) {
    const p = ac.createStereoPanner();
    p.pan.setValueAtTime(pan, t);
    v.connect(p); p.connect(dest);
  } else {
    v.connect(dest);
  }
}

function envOsc(ac, dest, freq, t, dur, g, type, atk, dec, startFreq) {
  if (g <= 0 || dur <= 0 || freq <= 0) return;
  const o = ac.createOscillator(), v = ac.createGain();
  o.type = type || 'sine';
  const f0 = startFreq || freq;
  o.frequency.setValueAtTime(f0, t);
  if (startFreq && startFreq !== freq) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq), t + Math.min(0.08, dec * 0.35));
  v.gain.setValueAtTime(0, Math.max(0, t));
  v.gain.linearRampToValueAtTime(g, t + Math.max(0.002, atk));
  v.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(atk + 0.01, dec));
  o.connect(v); v.connect(dest);
  o.start(t); o.stop(t + dec + 0.03);
}

function kick(ac, dest, t, g) {
  envOsc(ac, dest, 50, t, 0.34, g * 0.85, 'sine', 0.003, 0.36, 155);
  envOsc(ac, dest, 55, t, 0.2, g * 0.28, 'sine', 0.004, 0.22);
  envOsc(ac, dest, 85, t, 0.07, g * 0.2, 'triangle', 0.002, 0.07, 180);
  noiseBurst(ac, dest, t, 0.016, g * 0.1, 'highpass', 2200, 0.6);
}

function snare(ac, dest, t, g, ghost) {
  const m = ghost ? 0.28 : 1;
  envOsc(ac, dest, 190, t, 0.1, g * 0.32 * m, 'triangle', 0.002, 0.11, 230);
  envOsc(ac, dest, 180, t, 0.08, g * 0.18 * m, 'sine', 0.002, 0.09);
  noiseBurst(ac, dest, t, ghost ? 0.06 : 0.16, g * 0.7 * m, 'bandpass', 1800, 0.85);
  if (!ghost) noiseBurst(ac, dest, t, 0.05, g * 0.28, 'highpass', 7000, 0.6);
}

function clap(ac, dest, t, g) {
  [0, 0.011, 0.022, 0.04].forEach((off, i) => {
    const last = i === 3;
    noiseBurst(ac, dest, t + off, last ? 0.16 : 0.028, g * (last ? 0.85 : 0.45), 'bandpass', 1700, 0.9);
  });
}

function hat(ac, dest, t, g, open, pan) {
  noiseBurst(ac, dest, t, open ? 0.16 : 0.04, g, 'highpass', open ? 7800 : 9200, 0.75, pan);
}

function shaker(ac, dest, t, g, pan) {
  noiseBurst(ac, dest, t, 0.055, g, 'bandpass', 7000, 1.2, pan);
}

function woodblock(ac, dest, t, g) {
  envOsc(ac, dest, 890, t, 0.06, g, 'sine', 0.001, 0.055, 980);
  envOsc(ac, dest, 1780, t, 0.03, g * 0.3, 'sine', 0.001, 0.028);
}

function conga(ac, dest, t, g, high) {
  envOsc(ac, dest, high ? 220 : 165, t, 0.16, g, 'sine', 0.002, 0.18, high ? 280 : 210);
  noiseBurst(ac, dest, t, 0.04, g * 0.2, 'bandpass', 900, 1.2);
}

function grooveBass(ac, dest, midi, t, dur, g, kind) {
  const f = hz(midi);
  const dec = Math.max(0.08, dur);
  const flt = ac.createBiquadFilter();
  flt.type = 'lowpass';
  const v = ac.createGain();
  const o = ac.createOscillator();
  const sub = ac.createOscillator();
  const sv = ac.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(f, t);
  if (kind === 'slap') {
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f * 1.05, t);
    o.frequency.exponentialRampToValueAtTime(f, t + 0.03);
    flt.frequency.setValueAtTime(2200, t);
    flt.frequency.exponentialRampToValueAtTime(520, t + 0.07);
    flt.Q.value = 1.1;
    sv.gain.setValueAtTime(0, t);
    sv.gain.linearRampToValueAtTime(g * 0.7, t + 0.006);
    sv.gain.exponentialRampToValueAtTime(0.0001, t + dec);
  } else if (kind === 'house') {
    o.type = 'triangle';
    o.frequency.setValueAtTime(f, t);
    flt.frequency.setValueAtTime(900, t);
    flt.Q.value = 0.7;
    sv.gain.setValueAtTime(0, t);
    sv.gain.linearRampToValueAtTime(g * 0.85, t + 0.008);
    sv.gain.exponentialRampToValueAtTime(0.0001, t + dec * 0.95);
  } else if (kind === 'bounce') {
    o.type = 'triangle';
    o.frequency.setValueAtTime(f, t);
    flt.frequency.setValueAtTime(1400, t);
    flt.frequency.exponentialRampToValueAtTime(700, t + 0.05);
    sv.gain.setValueAtTime(0, t);
    sv.gain.linearRampToValueAtTime(g * 0.75, t + 0.006);
    sv.gain.exponentialRampToValueAtTime(0.0001, t + dec);
  } else {
    o.type = 'triangle';
    o.frequency.setValueAtTime(f, t);
    flt.frequency.setValueAtTime(1100, t);
    flt.Q.value = 0.8;
    sv.gain.setValueAtTime(0, t);
    sv.gain.linearRampToValueAtTime(g * 0.72, t + 0.008);
    sv.gain.exponentialRampToValueAtTime(0.0001, t + dec);
  }
  v.gain.setValueAtTime(0, t);
  v.gain.linearRampToValueAtTime(g * 0.55, t + 0.008);
  v.gain.exponentialRampToValueAtTime(0.0001, t + dec);
  o.connect(flt); flt.connect(v); v.connect(dest);
  sub.connect(sv); sv.connect(dest);
  o.start(t); o.stop(t + dec + 0.03);
  sub.start(t); sub.stop(t + dec + 0.03);
  if (kind === 'slap') envOsc(ac, dest, f * 2, t, 0.04, g * 0.12, 'square', 0.001, 0.035);
}

function rhodesHit(ac, dest, midi, t, dur, g) {
  const f = hz(midi);
  envOsc(ac, dest, f, t, dur, g, 'sine', 0.008, Math.max(0.18, dur * 0.9));
  envOsc(ac, dest, f * 2, t, dur * 0.45, g * 0.28, 'sine', 0.006, Math.max(0.1, dur * 0.4));
  envOsc(ac, dest, f * 3, t, dur * 0.18, g * 0.1, 'sine', 0.004, 0.1);
  envOsc(ac, dest, f, t, dur, g * 0.2, 'triangle', 0.01, Math.max(0.16, dur * 0.7));
}

function funkStab(ac, dest, midi, t, dur, g) {
  const f = hz(midi);
  const o = ac.createOscillator(), flt = ac.createBiquadFilter(), v = ac.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(f, t);
  flt.type = 'lowpass';
  flt.Q.value = 1.4;
  flt.frequency.setValueAtTime(3200, t);
  flt.frequency.exponentialRampToValueAtTime(500, t + Math.min(0.14, dur));
  v.gain.setValueAtTime(0, t);
  v.gain.linearRampToValueAtTime(g, t + 0.006);
  v.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.08, dur));
  o.connect(flt); flt.connect(v); v.connect(dest);
  o.start(t); o.stop(t + dur + 0.04);
  envOsc(ac, dest, f, t, dur, g * 0.35, 'triangle', 0.005, Math.max(0.08, dur * 0.8));
}

function marimbaHit(ac, dest, midi, t, dur, g) {
  const f = hz(midi);
  const dec = Math.max(0.22, dur * 0.7);
  envOsc(ac, dest, f, t, dec, g, 'sine', 0.003, dec);
  envOsc(ac, dest, f * 2, t, dec * 0.35, g * 0.45, 'sine', 0.002, dec * 0.35);
  envOsc(ac, dest, f * 4, t, dec * 0.14, g * 0.18, 'sine', 0.002, dec * 0.14);
  envOsc(ac, dest, f, t, 0.05, g * 0.15, 'triangle', 0.001, 0.05);
}

function malletHit(ac, dest, midi, t, dur, g) {
  const f = hz(midi);
  const dec = Math.max(0.2, dur * 0.65);
  envOsc(ac, dest, f, t, dec, g, 'sine', 0.002, dec);
  envOsc(ac, dest, f * 2, t, dec * 0.4, g * 0.4, 'sine', 0.002, dec * 0.4);
  envOsc(ac, dest, f * 3, t, dec * 0.16, g * 0.16, 'sine', 0.002, dec * 0.16);
  envOsc(ac, dest, f * 5, t, 0.06, g * 0.07, 'sine', 0.001, 0.055);
}

function softPad(ac, dest, midi, t, dur, g) {
  tone(ac, dest, midi, t, dur, g, 'sine', 0.45);
  tone(ac, dest, midi, t, dur, g * 0.25, 'triangle', 0.5, 1.003);
}

function swingBeats(beats, swing) {
  if (!swing) return beats;
  const s = beats * 4;
  const near = Math.round(s);
  if (Math.abs(s - near) > 0.08) return beats;
  if (near % 2 === 0) return beats;
  return beats + swing / 12;
}

function stepTime(t0, step, beatSec, swing) {
  const beats = (step % 2 === 1) ? (step - 1) * 0.25 + 0.25 + (swing || 0) / 12 : step * 0.25;
  return t0 + beats * beatSec;
}

const DRUMS = {
  cafe: {
    kick: [0, 6, 10, 16, 22, 24, 30],
    snare: [4, 12, 20, 28],
    ghost: [7, 14, 18, 26],
    hat16: true,
    open: [14, 30],
    shakerOff: true,
    clap: false,
  },
  citypop: {
    kick: [0, 4, 8, 12, 14, 16, 20, 24, 28, 30],
    snare: [4, 12, 20, 28],
    clapOn: [4, 12, 20, 28],
    hat16: true,
    open: [6, 14, 22, 30],
    shakerAll: true,
  },
  tropical: {
    kick: [0, 4, 8, 12, 16, 20, 24, 28],
    snare: [],
    clapOn: [4, 12, 20, 28],
    hat16: true,
    open: [14, 30],
    shakerAll: true,
    conga: [6, 10, 22, 26],
  },
  lobby: {
    kick: [0, 6, 8, 16, 22, 24],
    snare: [4, 12, 20, 28],
    hat8: true,
    hatOff: true,
    open: [14, 30],
    wood: [2, 10, 18, 26],
  },
};

function scheduleDrums(ac, dest, pat, t0, beatSec, swing, fill, gMul) {
  const m = gMul || 1;
  const kicks = pat.kick.slice();
  const snares = pat.snare.slice();
  if (fill) {
    [26, 27, 28, 29, 30, 31].forEach(s => snares.push(s));
    if (!kicks.includes(24)) kicks.push(24);
  }
  kicks.forEach(s => kick(ac, dest, stepTime(t0, s, beatSec, 0), 0.82 * m));
  snares.forEach(s => snare(ac, dest, stepTime(t0, s, beatSec, swing), fill && s >= 26 ? 0.38 * m : 0.48 * m, false));
  (pat.ghost || []).forEach(s => { if (!(fill && s >= 26)) snare(ac, dest, stepTime(t0, s, beatSec, swing), 0.48 * m, true); });
  (pat.clapOn || []).forEach(s => { if (!(fill && s >= 26)) clap(ac, dest, stepTime(t0, s, beatSec, swing), 0.36 * m); });
  if (pat.hat16) {
    for (let s = 0; s < 32; s++) {
      const open = (pat.open || []).includes(s);
      const accent = s % 2 === 0;
      hat(ac, dest, stepTime(t0, s, beatSec, swing), (open ? 0.08 : accent ? 0.055 : 0.034) * m, open, s % 2 ? 0.35 : -0.35);
    }
  }
  if (pat.hat8) {
    for (let s = 0; s < 32; s += 2) {
      const open = (pat.open || []).includes(s);
      hat(ac, dest, stepTime(t0, s, beatSec, swing), (open ? 0.065 : 0.042) * m, open, s % 4 ? 0.25 : -0.25);
    }
  }
  if (pat.hatOff) {
    for (let s = 1; s < 32; s += 2) hat(ac, dest, stepTime(t0, s, beatSec, swing), 0.028 * m, false, 0.4);
  }
  if (pat.shakerAll) {
    for (let s = 0; s < 32; s++) shaker(ac, dest, stepTime(t0, s, beatSec, swing), (s % 2 ? 0.028 : 0.018) * m, s % 2 ? 0.45 : -0.45);
  }
  if (pat.shakerOff) {
    for (let s = 1; s < 32; s += 2) shaker(ac, dest, stepTime(t0, s, beatSec, swing), 0.024 * m, s % 4 === 1 ? -0.4 : 0.4);
  }
  (pat.wood || []).forEach(s => woodblock(ac, dest, stepTime(t0, s, beatSec, swing), 0.16 * m));
  (pat.conga || []).forEach((s, i) => conga(ac, dest, stepTime(t0, s, beatSec, swing), 0.2 * m, i % 2 === 1));
}

function scheduleComps(ac, dest, th, chord, t0, beatSec, swing, style) {
  const steps = style === 'cafe' ? [4, 12, 20, 28]
    : style === 'citypop' ? [2, 4, 7, 12, 16, 20, 23, 28]
    : style === 'tropical' ? [2, 6, 10, 14, 18, 22, 26, 30]
    : [0, 8, 16, 24, 4, 12, 20, 28];
  const dur16 = style === 'citypop' ? 1.2 : style === 'tropical' ? 1.6 : style === 'lobby' ? 2 : 2.2;
  const g = style === 'citypop' ? 0.1 : style === 'tropical' ? 0.08 : style === 'lobby' ? 0.08 : 0.1;
  steps.forEach(s => {
    const t = stepTime(t0, s, beatSec, swing);
    const dur = dur16 * 0.25 * beatSec;
    chord.forEach((m, i) => {
      if (style === 'cafe') rhodesHit(ac, dest, m + 12, t, dur, g * (i ? 0.75 : 1));
      else if (style === 'citypop') funkStab(ac, dest, m + 12, t, dur, g * (i ? 0.7 : 1));
      else if (style === 'tropical') rhodesHit(ac, dest, m + 12, t, dur, g * 0.8 * (i ? 0.7 : 1));
      else malletHit(ac, dest, m + 12, t, dur * 0.8, g * (i ? 0.55 : 0.75));
    });
  });
}

function scheduleGrooveAt(ac, dest, th, t0, phraseIdx, opts = {}) {
  const beatSec = 60 / th.bpm;
  const bar = beatSec * 4;
  const swing = th.swing || 0;
  const pat = DRUMS[th.drums] || DRUMS.cafe;
  const style = th.style;
  th.chords.forEach((chord, i) => {
    const t = t0 + i * bar * 2;
    if (!opts.skipDrums) scheduleDrums(ac, dest, pat, t, beatSec, swing, !!(opts.fill && i === 3), 1);
    const line = (th.bassLines && th.bassLines[i]) || [];
    line.forEach(([step, midi, len]) => {
      const bt = stepTime(t, step, beatSec, swing);
      const dur = len * 0.25 * beatSec * 0.9;
      grooveBass(ac, dest, midi, bt, dur, 0.4, th.bassKind || 'round');
    });
    scheduleComps(ac, dest, th, chord, t, beatSec, swing, style);
    if (style === 'tropical' || style === 'lobby') {
      const hold = bar * 2 + 0.4;
      chord.forEach((m, k) => softPad(ac, dest, m, t, hold, (k ? 0.012 : 0.016)));
    }
    if (style === 'cafe') {
      const hold = bar * 2 + 0.3;
      chord.forEach((m, k) => softPad(ac, dest, m, t, hold, (k ? 0.01 : 0.014)));
    }
  });
  const hook = th.phrases[phraseIdx % th.phrases.length] || [];
  hook.forEach(([beats, midi, len]) => {
    const t = t0 + swingBeats(beats, swing) * beatSec;
    const dur = len * beatSec * 0.92;
    if (style === 'cafe') rhodesHit(ac, dest, midi, t, dur, 0.26);
    else if (style === 'citypop') {
      rhodesHit(ac, dest, midi, t, dur, 0.24);
      funkStab(ac, dest, midi, t, Math.min(dur, beatSec * 0.4), 0.06);
    } else if (style === 'tropical') marimbaHit(ac, dest, midi, t, dur, 0.26);
    else malletHit(ac, dest, midi, t, dur, 0.26);
  });
}

function scheduleThemeAt(ac, dest, th, t0, phraseIdx) {
  if (th.groove) { scheduleGrooveAt(ac, dest, th, t0, phraseIdx); return; }

  const beat = 60 / th.bpm;
  const bar = beat * 4;
  const hold = bar * 2 + th.padTail;
  const mul = (th.swell && th.swell[phraseIdx % th.swell.length]) || 1;
  th.chords.forEach((chord, i) => {
    const t = t0 + i * bar * 2;
    chord.forEach((m, k) => padForStyle(ac, dest, th.style, m, t, hold, (k ? 0.016 : 0.022) * mul));
    const bg = th.style === 'cinematic' ? 0.036 : th.style === 'hopeful' ? 0.032 : 0.03;
    tone(ac, dest, th.bass[i], t, hold, bg * mul, 'sine', 1.25);
    if (th.style === 'cinematic' || th.style === 'hopeful') {
      tone(ac, dest, th.bass[i], t, hold, bg * 0.22 * mul, 'triangle', 1.4, 1.001);
    }
    if (th.shimmer) {
      const top = chord[chord.length - 1];
      tone(ac, dest, top + 24, t, hold, 0.01 * mul, 'sine', 2.2, 1.003);
      tone(ac, dest, top + 31, t + hold * 0.15, hold * 0.85, 0.007 * mul, 'sine', 2.4, 0.997);
    }
    compForStyle(ac, dest, th, chord, th.bass[i], t, bar, beat, mul);
  });
  th.phrases[phraseIdx % th.phrases.length].forEach(([b, midi, len]) => {
    melodyForStyle(ac, dest, th.style, midi, t0 + b * beat, len, beat, mul);
  });
}

function buildLiveGraph(ac, th) {
  const gainNode = ac.createGain();
  gainNode.gain.value = 0;
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  if (!th) {
    lp.frequency.value = 2300; lp.Q.value = 0.65;
    const d1 = ac.createDelay(2); d1.delayTime.value = 0.62;
    const f1 = ac.createGain(); f1.gain.value = 0.26;
    const w1 = ac.createGain(); w1.gain.value = 0.3;
    const d2 = ac.createDelay(3); d2.delayTime.value = 1.18;
    const f2 = ac.createGain(); f2.gain.value = 0.16;
    const w2 = ac.createGain(); w2.gain.value = 0.18;
    gainNode.connect(lp);
    lp.connect(ac.destination);
    lp.connect(d1); d1.connect(f1); f1.connect(d1); d1.connect(w1); w1.connect(ac.destination);
    lp.connect(d2); d2.connect(f2); f2.connect(d2); d2.connect(w2); w2.connect(ac.destination);
    return gainNode;
  }
  lp.frequency.value = th.lowpass; lp.Q.value = th.lpQ;
  let out = lp;
  if (th.compressor || th.groove) {
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 8;
    comp.ratio.value = 4;
    comp.attack.value = 0.005;
    comp.release.value = 0.13;
    const shelf = ac.createBiquadFilter();
    shelf.type = 'highshelf';
    shelf.frequency.value = 5000;
    shelf.gain.value = 1.0;
    const mid = ac.createBiquadFilter();
    mid.type = 'peaking';
    mid.frequency.value = 2200;
    mid.Q.value = 0.85;
    mid.gain.value = 3.2;
    const low = ac.createBiquadFilter();
    low.type = 'lowshelf';
    low.frequency.value = 110;
    low.gain.value = 0.8;
    const lim = ac.createDynamicsCompressor();
    lim.threshold.value = -10;
    lim.knee.value = 3;
    lim.ratio.value = 10;
    lim.attack.value = 0.003;
    lim.release.value = 0.1;
    gainNode.connect(comp);
    comp.connect(mid);
    mid.connect(low);
    low.connect(lp);
    lp.connect(shelf);
    shelf.connect(lim);
    lim.connect(ac.destination);
    out = lim;
  } else {
    gainNode.connect(lp);
    lp.connect(ac.destination);
  }
  th.delays.forEach((cfg, i) => {
    const [delayTime, fb, wet] = cfg;
    const d = ac.createDelay(3); d.delayTime.value = delayTime;
    const f = ac.createGain(); f.gain.value = fb;
    const w = ac.createGain(); w.gain.value = wet;
    const pan = ac.createStereoPanner();
    pan.pan.value = i === 0 ? -0.32 : 0.32;
    out.connect(d); d.connect(f); f.connect(d); d.connect(w); w.connect(pan); pan.connect(ac.destination);
  });
  return gainNode;
}

function themeCycleLen(th) {
  return (60 / th.bpm) * 4 * 8;
}

function tick() {
  if (!on || !ctx) return;
  const now = ctx.currentTime;
  while (nextT < now + 1.4) {
    if (activeTheme) {
      scheduleThemeAt(ctx, master, activeTheme, nextT, phrase);
      phrase++;
      nextT += themeCycleLen(activeTheme);
    } else {
      scheduleCycle(nextT);
      nextT += CYCLE;
    }
  }
}

function ensureCtx() {
  if (ctx) return ctx;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  return ctx;
}

function stopLoop() {
  if (!loopSrc) return;
  try { loopSrc.stop(); } catch (_) {}
  try { loopSrc.disconnect(); } catch (_) {}
  loopSrc = null;
}

function startLoop() {
  stopLoop();
  if (!ctx || !loopBuf) return false;
  const src = ctx.createBufferSource();
  src.buffer = loopBuf;
  src.loop = true;
  src.loopStart = 0;
  src.loopEnd = loopBuf.duration;
  src.connect(master);
  src.start();
  loopSrc = src;
  return true;
}

function fadeTo(target, timeConst) {
  if (!master || !ctx) return;
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(master.gain.value || 0, now);
  master.gain.setTargetAtTime(target, now, timeConst);
}

function startFallback() {
  if (!ctx) return;
  phrase = 0;
  nextT = ctx.currentTime + 0.12;
  // fallback still needs the live instrument graph
  if (master) try { master.disconnect(); } catch (_) {}
  master = buildLiveGraph(ctx, activeTheme);
  fadeTo(activeTheme ? activeTheme.masterGain : 0.4, 1.15);
  tick();
  clearInterval(timer);
  timer = setInterval(tick, 500);
}

function startGraph() {
  if (on) return true;
  if (!ctx || ctx.state !== 'running') return false;
  on = true;
  const play = () => {
    if (!on) return;
    clearInterval(timer); timer = null;
    if (loopBuf) {
      fadeTo(1, 1.15);
      startLoop();
    } else {
      startFallback();
    }
  };
  if (loopBuf) play();
  else beginBake().then(play).catch(() => { loopBuf = null; play(); });
  return true;
}

export function isMusicOn() { return on; }
export function setMusic(wantOn) {
  ensureCtx();
  beginBake();
  if (!wantOn) {
    clearHook();
    fadeTo(0, 0.45);
    on = false;
    clearInterval(timer); timer = null;
    const src = loopSrc;
    if (src) setTimeout(() => { if (!on && loopSrc === src) stopLoop(); }, 1400);
    return false;
  }
  if (ctx.state === 'running') return startGraph();
  ctx.resume().then(() => startGraph()).catch(() => {});
  return startGraph();
}
export function toggleMusic() { return setMusic(!on); }
export function preferMusicOn(onStart) {
  const done = () => { clearHook(); onStart && onStart(true); };
  if (setMusic(true)) { done(); return true; }
  if (!gestureHook) {
    gestureHook = () => { if (setMusic(true)) done(); };
    window.addEventListener('pointerdown', gestureHook, true);
    window.addEventListener('keydown', gestureHook, true);
    window.addEventListener('touchstart', gestureHook, { capture: true, passive: true });
  }
  return false;
}
export function blip(freq = 659) {
  if (!ctx || !on) return;
  const t = ctx.currentTime;
  voice(69, t, 0.28, 0.04, 'sine', 0.02);
  voice(72, t + 0.05, 0.32, 0.025, 'sine', 0.03);
}

export function musicDebug() {
  return {
    themeId,
    on,
    usingLoop: !!(loopSrc && loopBuf),
    loopReady: !!loopBuf,
    duration: loopBuf ? loopBuf.duration : 0,
    sampleRate: loopBuf ? loopBuf.sampleRate : 0,
    channels: loopBuf ? loopBuf.numberOfChannels : 0,
    ctxState: ctx ? ctx.state : 'none',
    ctx,
    master,
    loopBuf,
    loopSrc,
  };
}

function clearHook() {
  if (!gestureHook) return;
  window.removeEventListener('pointerdown', gestureHook, true);
  window.removeEventListener('keydown', gestureHook, true);
  window.removeEventListener('touchstart', gestureHook, true);
  gestureHook = null;
}

function encodeWav(buffer) {
  const nCh = buffer.numberOfChannels;
  const rate = buffer.sampleRate;
  const n = buffer.length;
  const bytes = n * nCh * 2;
  const out = new ArrayBuffer(44 + bytes);
  const v = new DataView(out);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + bytes, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, nCh, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * nCh * 2, true);
  v.setUint16(32, nCh * 2, true); v.setUint16(34, 16, true); w(36, 'data');
  v.setUint32(40, bytes, true);
  const chs = Array.from({ length: nCh }, (_, i) => buffer.getChannelData(i));
  let o = 44;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < nCh; c++) {
      const x = Math.max(-1, Math.min(1, chs[c][i]));
      v.setInt16(o, x < 0 ? x * 0x8000 : x * 0x7fff, true);
      o += 2;
    }
  }
  return out;
}

function makeAudioBuffer(sampleRate, copies) {
  const length = copies[0].length, nCh = copies.length;
  if (typeof AudioBuffer === 'function') {
    try {
      const buf = new AudioBuffer({ length, numberOfChannels: nCh, sampleRate });
      copies.forEach((ch, i) => buf.copyToChannel(ch, i));
      return buf;
    } catch (_) {}
  }
  const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const tmp = new Offline(nCh, length, sampleRate);
  const buf = tmp.createBuffer(nCh, length, sampleRate);
  copies.forEach((ch, i) => buf.getChannelData(i).set(ch));
  return buf;
}

async function bakeThemeBuffer(id, { sampleRate = 44100, peakDb = -8 } = {}) {
  const isClassic = id === 'classic' || id === 'orig' || id === 'legacy' || id == null;
  const th = isClassic ? null : (THEMES[id] || null);
  if (!isClassic && !th) throw new Error('unknown theme: ' + id);
  const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const cycle = th ? themeCycleLen(th) : CYCLE;
  const nPhrases = th ? th.phrases.length : PHRASES.length;
  const loopLen = cycle * nPhrases;
  const warmup = (th && th.groove) ? cycle : loopLen;
  const tail = 4;
  const total = warmup + loopLen + tail;
  const ac = new Offline(2, Math.ceil(sampleRate * total), sampleRate);
  let drumNorm = null, drumFill = null;
  if (th && th.groove) {
    const beatSec = 60 / th.bpm;
    const bar2 = beatSec * 8;
    async function bake(fill) {
      const bakeAc = new Offline(2, Math.ceil(sampleRate * (bar2 + 0.45)), sampleRate);
      const g = bakeAc.createGain();
      g.gain.value = 1;
      g.connect(bakeAc.destination);
      sharedNoise(bakeAc);
      const pat = DRUMS[th.drums] || DRUMS.cafe;
      scheduleDrums(bakeAc, g, pat, 0, beatSec, th.swing || 0, fill, 1);
      return bakeAc.startRendering();
    }
    drumNorm = await bake(false);
    drumFill = await bake(true);
  }
  const dest = buildLiveGraph(ac, th);
  dest.gain.setValueAtTime(th ? th.masterGain : 0.4, 0);
  if (th && th.groove) sharedNoise(ac);
  const stampDrums = (t0, phraseIdx) => {
    if (!drumNorm) return;
    const beatSec = 60 / th.bpm;
    const bar2 = beatSec * 8;
    for (let i = 0; i < 4; i++) {
      const src = ac.createBufferSource();
      src.buffer = (phraseIdx % 4 === 3 && i === 3) ? drumFill : drumNorm;
      src.connect(dest);
      src.start(t0 + i * bar2);
    }
  };
  const sched = (t0, phraseIdx) => {
    if (!th) scheduleClassicAt(ac, dest, t0, phraseIdx);
    else if (th.groove) {
      stampDrums(t0, phraseIdx);
      scheduleGrooveAt(ac, dest, th, t0, phraseIdx, { skipDrums: true, fill: phraseIdx % 4 === 3 });
    } else {
      scheduleThemeAt(ac, dest, th, t0, phraseIdx);
    }
  };
  if (th && th.groove) {
    sched(0, nPhrases - 1);
  } else {
    for (let i = 0; i < nPhrases; i++) sched(i * cycle, i);
  }
  for (let i = 0; i < nPhrases; i++) sched(warmup + i * cycle, i);
  sched(warmup + loopLen, 0); // true continuation past the loop point
  const rendered = await ac.startRendering();
  const start = Math.round(warmup * sampleRate);
  const loopSamples = Math.round(loopLen * sampleRate);
  const fade = Math.round(0.03 * sampleRate);
  if (start + loopSamples + fade > rendered.length) throw new Error('render too short');
  const nCh = rendered.numberOfChannels;
  const copies = Array.from({ length: nCh }, (_, c) => {
    const src = rendered.getChannelData(c);
    const dst = new Float32Array(loopSamples);
    dst.set(src.subarray(start, start + loopSamples));
    // Front splice: first sample becomes the true next sample after the last,
    // then blends into the original start so the file loops without a click.
    for (let i = 0; i < fade; i++) {
      const a = 0.5 - 0.5 * Math.cos(Math.PI * (i / (fade - 1)));
      const cont = src[start + loopSamples + i];
      dst[i] = cont * (1 - a) + dst[i] * a;
    }
    return dst;
  });
  let peak = 0;
  for (const ch of copies) {
    for (let i = 0; i < ch.length; i++) {
      const a = Math.abs(ch[i]);
      if (a > peak) peak = a;
    }
  }
  const target = Math.pow(10, peakDb / 20);
  const mul = peak > 1e-6 ? Math.min(target / peak, 6) : 1;
  for (const ch of copies) {
    for (let i = 0; i < ch.length; i++) ch[i] *= mul;
  }
  return {
    buffer: makeAudioBuffer(sampleRate, copies),
    duration: loopLen,
    sampleRate,
    channels: nCh,
    id: isClassic ? 'classic' : id,
    peak,
    gain: mul,
  };
}

const BUNDLED = {
  h: { file: 'h-game-lobby.mp3', samples: 2822400, sampleRate: 44100 },
};

function trimToLoop(buf, expect) {
  if (!buf || !expect || buf.length === expect) return buf;
  if (buf.length < expect) return buf;
  const extra = buf.length - expect;
  const ch0 = buf.getChannelData(0);
  let bestOff = 0, best = Infinity;
  for (let off = 0; off <= extra; off++) {
    const s = Math.abs(ch0[off] - ch0[off + expect - 1]);
    if (s < best) { best = s; bestOff = off; }
  }
  const copies = [];
  for (let c = 0; c < buf.numberOfChannels; c++) {
    copies.push(buf.getChannelData(c).slice(bestOff, bestOff + expect));
  }
  return makeAudioBuffer(buf.sampleRate, copies);
}

async function loadBundledBuffer() {
  const spec = BUNDLED[themeId];
  if (!spec) return null;
  const url = new URL('./audio/' + spec.file, import.meta.url).href;
  const res = await fetch(url);
  if (!res.ok) return null;
  const ab = await res.arrayBuffer();
  ensureCtx();
  const decoded = await ctx.decodeAudioData(ab.slice(0));
  const expect = Math.round(spec.samples * (decoded.sampleRate / spec.sampleRate));
  return trimToLoop(decoded, expect);
}

function beginBake(sampleRate) {
  if (loopBuf) return Promise.resolve(loopBuf);
  if (bakePromise) return bakePromise;
  bakePromise = (async () => {
    try {
      const bundled = await loadBundledBuffer();
      if (bundled && bundled.length) {
        loopBuf = bundled;
        return loopBuf;
      }
    } catch (_) {}
    const rate = sampleRate || (ctx && ctx.sampleRate) || 44100;
    const baked = await bakeThemeBuffer(themeId, { sampleRate: rate });
    loopBuf = baked.buffer;
    return loopBuf;
  })().catch(err => {
    bakePromise = null;
    loopBuf = null;
    throw err;
  });
  return bakePromise;
}

export async function renderMusicTheme(id, { sampleRate = 44100, peakDb = -8 } = {}) {
  const baked = await bakeThemeBuffer(id, { sampleRate, peakDb });
  const wav = encodeWav(baked.buffer);
  const meta = MUSIC_OPTIONS[id];
  return {
    wav,
    duration: baked.duration,
    sampleRate: baked.sampleRate,
    channels: baked.channels,
    id: baked.id,
    peak: baked.peak,
    gain: baked.gain,
    name: meta ? meta.name : (baked.id === 'classic' ? '經典' : id),
    filename: meta ? meta.filename : id,
    feel: meta ? meta.feel : '',
  };
}

try { beginBake(); } catch (_) {}
