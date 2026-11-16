import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { STAR_LOGO_UI, TOWER_NAME, EVENT_NAME, isCyber } from './brand.js';

/* 史塔金融大樓：低面數程序生成場景（無外部模型） */
const FONT = '"Noto Sans CJK TC","Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';
const C = { cyan: 0x3ef2ff, gold: 0xffc85a, up: 0xff5468, down: 0x2fd38a, navy: 0x0b1630 };
const HUB = new THREE.Vector3(0, 0, -7.5);
// 兩層樓共用同一格局：obj＝物件位置、spot＝小人站位、f＝面向
const SLOT = {
  A: { obj: [-7.6, -3.2], spot: [-5.5, -3.2], f: [-1, 0] },
  B: { obj: [7.6, -3.2], spot: [5.5, -3.2], f: [1, 0] },
  C: { obj: [-8.2, -8], spot: [-6.2, -8], f: [-1, 0] },
  D: { obj: [6.6, -8], spot: [4.5, -8], f: [1, 0] },
  E: { obj: [-7.4, -12.4], spot: [-5.2, -12.4], f: [-1, 0] },
  F: { obj: [8.9, -11.8], spot: [6.5, -11.8], f: [1, 0] },
  G: { obj: [0, -15.9], spot: [0, -12.2], f: [0, -1] },
  H: { obj: [7.2, -15.9], spot: [7.2, -13.9], f: [0, -1] },
};
const LIFT_IN = new THREE.Vector3(7.2, 0, -17.2);

export async function create3D(canvas, hooks) {
  const isDesk = matchMedia('(pointer:fine)').matches && innerWidth >= 900;
  let renderer;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  if (!renderer.getContext()) throw new Error('沒有 WebGL');
  let dprCap = 1.5;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, dprCap));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a1030, 0.0105);
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 900);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; scene.environment = env;

  /* ---------- 小工具 ---------- */
  const disposables = [];
  const keep = o => (disposables.push(o), o);
  const std = (color, o = {}) => keep(new THREE.MeshStandardMaterial({ color, roughness: .5, metalness: .3, envMapIntensity: .35, ...o }));
  const glow = (color, k = 1) => { const m = keep(new THREE.MeshBasicMaterial({ color })); m.color.multiplyScalar(k); return m; };
  const G = {}; // 共用幾何
  const boxGeo = keep(new THREE.BoxGeometry(1, 1, 1));
  function box(w, h, d, mat, x, y, z, parent, ry = 0) {
    const m = new THREE.Mesh(boxGeo, mat); m.scale.set(w, h, d); m.position.set(x, y, z); m.rotation.y = ry; parent.add(m); return m;
  }
  function rbox(w, h, d, r, mat, x, y, z, parent) {
    const m = new THREE.Mesh(keep(new RoundedBoxGeometry(w, h, d, 2, r)), mat); m.position.set(x, y, z); parent.add(m); return m;
  }
  function cyl(rt, rb, h, seg, mat, x, y, z, parent) {
    const m = new THREE.Mesh(keep(new THREE.CylinderGeometry(rt, rb, h, seg)), mat); m.position.set(x, y, z); parent.add(m); return m;
  }
  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h);
    const t = keep(new THREE.CanvasTexture(c)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t._g = g; t._c = c; return t;
  }
  function textTex(lines, { w = 1024, h = 256, bg = 'rgba(6,12,28,0.96)', color = '#ffc85a', size = 120, glowC = color, border = color, sub = '#9fdcff' } = {}) {
    return canvasTex(w, h, (g) => {
      if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
      if (border) { g.strokeStyle = border; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16); }
      g.textAlign = 'center'; g.textBaseline = 'middle';
      const L = Array.isArray(lines) ? lines : [lines];
      L.forEach((t, i) => {
        const s = i === 0 ? size : size * 0.42;
        g.font = `900 ${s}px ${FONT}`; g.shadowColor = glowC; g.shadowBlur = i === 0 ? 24 : 8;
        g.fillStyle = i === 0 ? color : sub;
        const y = L.length === 1 ? h / 2 : (i === 0 ? h * 0.42 : h * 0.8);
        g.fillText(t, w / 2, y);
      });
    });
  }
  function plane(w, h, tex, x, y, z, parent, ry = 0, basic = true) {
    const mat = keep(basic ? new THREE.MeshBasicMaterial({ map: tex, transparent: true }) : new THREE.MeshStandardMaterial({ map: tex }));
    const m = new THREE.Mesh(keep(new THREE.PlaneGeometry(w, h)), mat); m.position.set(x, y, z); m.rotation.y = ry; parent.add(m); return m;
  }
  const rng = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(42);

  const FX = { t: { value: 0 } }; // 特效共用時間
  /* ---------- 天空、星星、城市 ---------- */
  const world = new THREE.Group(); scene.add(world);
  const exterior = new THREE.Group(); world.add(exterior);
  const streetClassic = new THREE.Group(); exterior.add(streetClassic);
  const streetCyber = new THREE.Group(); exterior.add(streetCyber);
  const cityGroup = new THREE.Group(); exterior.add(cityGroup);
  const CYBER = isCyber();
  const liteCyber = CYBER && !isDesk;
  {
    const sky = new THREE.Mesh(keep(new THREE.SphereGeometry(500, 24, 12)), keep(new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color(0x01030a) }, mid: { value: new THREE.Color(0x0b1238) }, hor: { value: new THREE.Color(0x2a1d55) }, uT: FX.t },
      vertexShader: 'varying vec3 vp; void main(){ vp = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: `uniform vec3 top,mid,hor; uniform float uT; varying vec3 vp;
        void main(){ float h = vp.y; vec3 c = mix(hor, mid, smoothstep(-0.02, 0.18, h)); c = mix(c, top, smoothstep(0.18, 0.7, h));
          float a = atan(vp.z, vp.x);
          float band = sin(a * 3.0 + uT * .08 + sin(a * 7.0 + uT * .13) * .6) * .5 + .5;
          float y0 = .22 + .07 * sin(a * 2.0 + uT * .05);
          float ribbon = exp(-pow((h - y0) / .07, 2.)) * band;
          float ribbon2 = exp(-pow((h - y0 - .1) / .05, 2.)) * (sin(a * 5.0 - uT * .1) * .5 + .5);
          c += vec3(.1, .95, .8) * ribbon * .85 + vec3(.75, .3, 1.) * ribbon2 * .5;
          c += vec3(.25, .1, .45) * exp(-pow(h / .08, 2.)) * .5;
          gl_FragColor = vec4(c,1.); }`,
    })));
    streetClassic.add(sky);
    const n = 700, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const th = rng() * Math.PI * 2, ph = Math.acos(1 - rng() * 0.9); pos.set([Math.sin(ph) * Math.cos(th) * 420, Math.cos(ph) * 420, Math.sin(ph) * Math.sin(th) * 420], i * 3); }
    const sg = keep(new THREE.BufferGeometry()); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    streetClassic.add(new THREE.Points(sg, keep(new THREE.PointsMaterial({ color: 0xcfe6ff, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: .8 }))));
  }
  function windowsTex(cols, rows, seed, warm = .55) {
    let s = seed; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    return canvasTex(256, 512, (g, w, h) => {
      g.fillStyle = '#060b18'; g.fillRect(0, 0, w, h);
      const cw = w / cols, ch = h / rows;
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const v = r(); if (v < 0.52) { g.fillStyle = '#0d1630'; } else g.fillStyle = r() < warm ? `hsl(${36 + r() * 10},90%,${55 + r() * 25}%)` : `hsl(${188 + r() * 12},90%,${60 + r() * 20}%)`;
        g.globalAlpha = v < 0.52 ? 1 : 0.55 + r() * 0.45; g.fillRect(x * cw + cw * .14, y * ch + ch * .2, cw * .72, ch * .6);
      }
      g.globalAlpha = 1;
    });
  }
  {
    const tex = windowsTex(14, 44, 7, .6); tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    const mat = std(0x0a1022, { emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.5, map: tex, roughness: .7 });
    const count = 150, inst = new THREE.InstancedMesh(boxGeo, mat, count), m4 = new THREE.Matrix4();
    let k = 0;
    while (k < count) {
      const a = rng() * Math.PI * 2, r = 58 + rng() * 130, x = Math.cos(a) * r, z = Math.sin(a) * r - 10;
      if (z > 10 && Math.abs(x) < 22) continue;
      const w = 6 + rng() * 9, h = 12 + Math.pow(rng(), 1.6) * 70, d = 6 + rng() * 9;
      m4.compose(new THREE.Vector3(x, h / 2, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rng() * .5), new THREE.Vector3(w, h, d));
      inst.setMatrixAt(k++, m4);
    }
    cityGroup.add(inst);
    const ground = new THREE.Mesh(keep(new THREE.PlaneGeometry(600, 600)), std(0x060a16, { roughness: .9, metalness: 0 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; streetClassic.add(ground);
  }

  /* ---------- 廣場 ---------- */
  {
    const plazaTex = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#0c1326'; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(120,200,255,.10)'; g.lineWidth = 2;
      for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); }
    });
    plazaTex.wrapS = plazaTex.wrapT = THREE.RepeatWrapping; plazaTex.repeat.set(10, 7);
    const plaza = new THREE.Mesh(keep(new THREE.PlaneGeometry(60, 40)), std(0xffffff, { map: plazaTex, roughness: .35, metalness: .4, envMapIntensity: .5 }));
    plaza.rotation.x = -Math.PI / 2; plaza.position.set(0, 0, 14); streetClassic.add(plaza);
    // 走道與燈柱
    const walk = box(4.4, 0.04, 22, std(0x15203c, { roughness: .25, metalness: .6 }), 0, 0.02, 12, streetClassic);
    const strip = glow(C.cyan, 1.6);
    box(0.08, 0.05, 22, strip, -2.25, 0.05, 12, streetClassic); box(0.08, 0.05, 22, strip, 2.25, 0.05, 12, streetClassic);
    const bol = new THREE.InstancedMesh(keep(new THREE.CylinderGeometry(.09, .12, 1, 8)), std(0x1b2440, { metalness: .8, roughness: .3 }), 16);
    const cap = new THREE.InstancedMesh(keep(new THREE.CylinderGeometry(.1, .1, .12, 8)), glow(C.cyan, 2.2), 16);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < 8; i++) for (let s = 0; s < 2; s++) {
      const x = s ? 3 : -3, z = 3.5 + i * 2.6;
      bol.setMatrixAt(i * 2 + s, m4.makeTranslation(x, .5, z)); cap.setMatrixAt(i * 2 + s, m4.makeTranslation(x, 1.06, z));
    }
    streetClassic.add(bol, cap);
    // 金牛雕像
    const gm = std(0xd9a441, { metalness: 1, roughness: .28, envMapIntensity: 1.1, emissive: 0x2a1800 });
    const bull = new THREE.Group(); bull.position.set(-9.5, 0, 9); bull.rotation.y = 0.9; streetClassic.add(bull);
    cyl(2.2, 2.4, 1, 8, std(0x141c33, { metalness: .6 }), 0, .5, 0, bull);
    cyl(2.25, 2.25, .06, 32, glow(C.gold, 1.4), 0, 1.0, 0, bull);
    box(2.6, 1.3, 1.2, gm, 0, 2.4, 0, bull); box(1.1, 1.1, 1.05, gm, 1.55, 2.95, 0, bull);
    [[-1, -.4], [-1, .4], [1, -.4], [1, .4]].forEach(([x, z]) => box(.3, 1.1, .3, gm, x, 1.5, z, bull));
    const hornM = std(0xfff0c8, { metalness: .6, roughness: .3 });
    [-1, 1].forEach(s => { const h = cyl(.02, .12, .8, 6, hornM, 1.8, 3.65, s * .5, bull); h.rotation.x = s * -.7; });
    box(1, .12, .12, gm, -1.6, 2.7, 0, bull).rotation.z = -.6;
    // 廣告看板
    const pole = cyl(.15, .2, 7, 8, std(0x1b2440, { metalness: .8 }), 10, 3.5, 9, streetClassic);
    const bb = textTex(['今天也要準時上班', '牛馬交易上班日・每天打卡領薪水'], { w: 1024, h: 384, size: 110, color: '#ffe3a0', border: '#3ef2ff' });
    plane(6, 2.25, bb, 10, 7.8, 9, streetClassic, -0.5);
  }

  /* ---------- 大樓外觀 ---------- */
  const tower = new THREE.Group(); exterior.add(tower);
  const armor = std(0x1a2236, { metalness: .85, roughness: .32, envMapIntensity: .6 });
  const armor2 = std(0x2a3550, { metalness: .9, roughness: .25, envMapIntensity: .7 });
  const cyanGlow = glow(C.cyan, 2.0), goldGlow = glow(C.gold, 1.6);
  const spine = glow(C.cyan, 2.4);
  const tiers = [[6.6, 30, 18.8, 16.4], [30, 52, 15.6, 13.6], [52, 68, 11.6, 10.4]];
  tiers.forEach(([y0, y1, w, d], i) => {
    const h = y1 - y0, wt = windowsTex(10, 24, 11 + i * 5, .5); wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(w / 9, h / 11);
    const glass = std(0x0b1630, { metalness: .7, roughness: .22, envMapIntensity: .8, emissive: 0xffffff, emissiveMap: wt, emissiveIntensity: .75 });
    box(w, h, d, glass, 0, y0 + h / 2, -d / 2 - (16.4 - d) / 2, tower);
    const cz = -8.2;
    // 轉角裝甲柱
    [-1, 1].forEach(sx => [-1, 1].forEach(sz => {
      rbox(1.5, h + .4, 1.5, .18, armor, sx * (w / 2), y0 + h / 2, cz + sz * (d / 2), tower);
      box(.08, h, .08, cyanGlow, sx * (w / 2 - .78), y0 + h / 2, cz + sz * (d / 2 + .02) + (sz > 0 ? .76 : -.76), tower);
    }));
    // 金色腰帶與肩甲
    box(w + 1.8, .4, d + 1.8, goldGlow, 0, y1, cz, tower);
    box(w + 1.2, .9, d + 1.2, armor2, 0, y1 + .65, cz, tower);
    [-1, 1].forEach(sx => {
      const fin = new THREE.Mesh(keep(new THREE.CylinderGeometry(0, 1.6, 4.2, 3)), armor2);
      fin.position.set(sx * (w / 2 + .6), y1 - 1.6, cz); fin.rotation.z = sx * 0.25; fin.scale.set(.6, 1, 1.6); tower.add(fin);
      box(.08, 3.4, .08, cyanGlow, sx * (w / 2 + .95), y1 - 1.8, cz + d / 2 * .5, tower).rotation.z = sx * .25;
    });
  });
  // 正面光脊與 V 形面甲
  box(.3, 61, .12, spine, 0, 38, 0.08, tower);
  [-1, 1].forEach(s => { const b = box(.22, 5.2, .12, cyanGlow, s * 2.2, 11.4, 0.1, tower); b.rotation.z = s * 0.62; });
  [-1, 1].forEach(s => { const b = box(.16, 3.6, .12, goldGlow, s * 1.6, 25, 0.1, tower); b.rotation.z = s * 0.7; });
  // 皇冠與天線
  const crown = new THREE.Mesh(keep(new THREE.CylinderGeometry(2.2, 6.6, 8, 4)), armor2); crown.rotation.y = Math.PI / 4; crown.position.set(0, 73, -8.2); tower.add(crown);
  box(9.8, .3, 9.8, goldGlow, 0, 69.2, -8.2, tower);
  cyl(.12, .35, 18, 6, armor, 0, 85, -8.2, tower);
  const beacon = new THREE.Mesh(keep(new THREE.SphereGeometry(.5, 12, 8)), glow(0xff3355, 3)); beacon.position.set(0, 94.2, -8.2); tower.add(beacon);
  // 掃射探照燈
  const beamMat = keep(new THREE.MeshBasicMaterial({ color: 0x7fe8ff, transparent: true, opacity: .07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  const beams = [-1, 1].map(s => { const g = new THREE.Group(); g.position.set(s * 4, 70, -8.2); const c = new THREE.Mesh(keep(new THREE.CylinderGeometry(.3, 7, 90, 16, 1, true)), beamMat); c.position.y = 45; g.add(c); tower.add(g); return g; });
  // 招牌與雨遮
  const signTex = textTex(['史塔金融大樓', '牛馬交易上班日・交易大廳'], { w: 1024, h: 300, size: 132 });
  plane(9.4, 2.75, signTex, 0, 8.2, 0.12, tower);
  box(8.6, .3, 3.4, armor2, 0, 6.15, 1.7, tower);
  box(8.6, .06, .1, cyanGlow, 0, 5.98, 3.38, tower);
  [-1, 1].forEach(s => cyl(.14, .14, 6, 8, armor, s * 4.1, 3, 3.2, tower));
  // 無人機
  const drones = [0, 1, 2].map(i => { const d = new THREE.Group(); box(.8, .18, .8, armor2, 0, 0, 0, d); const l = new THREE.Mesh(keep(new THREE.SphereGeometry(.18, 8, 6)), glow(i === 1 ? C.gold : C.cyan, 3)); l.position.y = -.2; d.add(l); tower.add(d); return d; });

  // 正面招牌已改為金融大樓；Logo 掛在雨遮上方
  let logoMesh = null;
  {
    const tex = await new Promise(res => {
      const loader = new THREE.TextureLoader();
      loader.load(STAR_LOGO_UI, t => { t.colorSpace = THREE.SRGBColorSpace; keep(t); res(t); }, undefined, () => res(null));
    });
    if (tex) {
      const halo = new THREE.Mesh(keep(new THREE.CircleGeometry(1.55, 28)), keep(new THREE.MeshBasicMaterial({ color: 0x3ef2ff, transparent: true, opacity: .22, blending: THREE.AdditiveBlending, depthWrite: false })));
      halo.position.set(0, 11.15, 0.14); tower.add(halo);
      logoMesh = new THREE.Mesh(keep(new THREE.PlaneGeometry(2.55, 2.55)), keep(new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })));
      logoMesh.position.set(0, 11.15, 0.22); tower.add(logoMesh);
    }
  }

  /* ---------- 賽博龐克接近街道（?exterior=cyber；預設關閉） ---------- */
  const cyberFX = { rainGeo: null, rainArr: null, rainN: 0, boards: [], ticker: null, vents: [], trails: [], gate: null };
  {
    const g = streetCyber;
    const mag = glow(0xff4de6, 2.0), vio = glow(0x9b5cff, 1.8), cya = glow(0x3ef2ff, 2.0);
    const skyC = new THREE.Mesh(keep(new THREE.SphereGeometry(500, liteCyber ? 16 : 24, liteCyber ? 8 : 12)), keep(new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color(0x05010c) }, mid: { value: new THREE.Color(0x1a0836) }, hor: { value: new THREE.Color(0x4a1860) }, uT: FX.t },
      vertexShader: 'varying vec3 vp; void main(){ vp = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: `uniform vec3 top,mid,hor; uniform float uT; varying vec3 vp;
        void main(){ float h = vp.y; vec3 c = mix(hor, mid, smoothstep(-0.05, 0.16, h)); c = mix(c, top, smoothstep(0.16, 0.7, h));
          float a = atan(vp.z, vp.x);
          float ribbon = exp(-pow((h - .12 - .05*sin(a*2.+uT*.08)) / .06, 2.)) * (.5+.5*sin(a*4.+uT*.2));
          float ribbon2 = exp(-pow((h - .22) / .05, 2.)) * (.5+.5*sin(a*6.-uT*.16));
          c += vec3(1., .2, .85) * ribbon * .9 + vec3(.2, .9, 1.) * ribbon2 * .7;
          c += vec3(.5, .05, .3) * exp(-pow(h / .07, 2.)) * .7;
          gl_FragColor = vec4(c,1.); }`,
    })));
    g.add(skyC);
    // 濕地反射
    const wetTex = canvasTex(512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#07040f'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) {
        ctx.strokeStyle = i % 2 ? 'rgba(62,242,255,.08)' : 'rgba(255,77,230,.07)';
        ctx.lineWidth = 1 + (i % 3); ctx.beginPath();
        const y = (i * 37) % h; ctx.moveTo(0, y); ctx.lineTo(w, y + 8); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(180,120,255,.12)'; ctx.lineWidth = 2;
      for (let i = 0; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(i * 64, 0); ctx.lineTo(i * 64, h); ctx.stroke(); }
    });
    wetTex.wrapS = wetTex.wrapT = THREE.RepeatWrapping; wetTex.repeat.set(8, 8);
    const wet = new THREE.Mesh(keep(new THREE.PlaneGeometry(600, 600)), std(0x12081c, { map: wetTex, roughness: .12, metalness: .92, envMapIntensity: 1.25 }));
    wet.rotation.x = -Math.PI / 2; wet.position.y = -0.01; g.add(wet);
    // 霓虹走道與門口光門
    box(4.6, 0.04, 24, std(0x10081c, { roughness: .1, metalness: .95, envMapIntensity: 1.2 }), 0, 0.03, 13, g);
    box(0.1, 0.06, 24, mag, -2.3, 0.07, 13, g); box(0.1, 0.06, 24, cya, 2.3, 0.07, 13, g);
    box(5.2, 0.08, 0.12, vio, 0, 0.08, 2.4, g);
    const arch = new THREE.Group(); arch.position.set(0, 0, 2.15); g.add(arch);
    box(.16, 4.2, .16, mag, -2.5, 2.1, 0, arch); box(.16, 4.2, .16, cya, 2.5, 2.1, 0, arch);
    box(5.2, .16, .16, vio, 0, 4.2, 0, arch);
    box(5.4, .05, .05, cya, 0, 4.35, 0, arch);
    cyberFX.gate = arch;
    // 直式霓虹招牌
    const vsign = canvasTex(256, 1024, (ctx, w, h) => {
      ctx.fillStyle = 'rgba(8,2,16,0.0)'; ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(10,4,20,.82)'; ctx.fillRect(18, 20, w - 36, h - 40);
      ctx.strokeStyle = '#ff4de6'; ctx.lineWidth = 8; ctx.strokeRect(18, 20, w - 36, h - 40);
      ctx.strokeStyle = '#3ef2ff'; ctx.lineWidth = 2; ctx.strokeRect(30, 32, w - 60, h - 64);
      const chars = [...TOWER_NAME];
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffe6ff'; ctx.shadowColor = '#ff4de6'; ctx.shadowBlur = 18;
      ctx.font = `900 92px ${FONT}`;
      chars.forEach((ch, i) => ctx.fillText(ch, w / 2, 90 + i * (h - 160) / Math.max(1, chars.length - 1)));
      ctx.shadowBlur = 0;
    });
    plane(2.2, 9.4, vsign, 11.2, 14.2, 3.2, g, -0.35);
    box(.2, 10, .2, mag, 11.2, 14.2, 3.05, g);
    // 全息看板：K 線（無數字）＋箭號跑馬燈
    function mkCandleBoard() {
      const tex = canvasTex(512, 320, () => {});
      tex.userData.cs = Array.from({ length: 24 }, (_, i) => 140 + Math.sin(i * .5) * 30 + (i % 5) * 3);
      return tex;
    }
    function drawCyberBoard(tex, t) {
      const ctx = tex._g, w = 512, h = 320;
      ctx.fillStyle = 'rgba(8,2,20,.88)'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(62,242,255,.7)'; ctx.lineWidth = 3; ctx.strokeRect(6, 6, w - 12, h - 12);
      ctx.strokeStyle = 'rgba(255,77,230,.5)'; ctx.lineWidth = 1; ctx.strokeRect(14, 14, w - 28, h - 28);
      const cs = tex.userData.cs;
      const last = cs[cs.length - 1];
      cs.push(Math.max(80, Math.min(240, last + Math.sin(t * 1.3 + cs.length) * 8 + (Math.random() - .5) * 10))); cs.shift();
      const slot = (w - 40) / cs.length;
      for (let i = 0; i < cs.length; i++) {
        const up = i === 0 ? true : cs[i] >= cs[i - 1];
        const o = i === 0 ? cs[i] : cs[i - 1], c = cs[i];
        ctx.fillStyle = up ? '#ff4de6' : '#3ef2ff';
        const top = Math.min(o, c), bot = Math.max(o, c);
        ctx.fillRect(24 + i * slot + slot * .28, top, slot * .44, Math.max(4, bot - top));
        ctx.fillRect(24 + i * slot + slot * .48, top - 12, 2, (bot - top) + 24);
      }
      tex.needsUpdate = true;
    }
    const boardTex = mkCandleBoard();
    const b1 = plane(5.2, 3.2, boardTex, -6.8, 5.6, 13.2, g, 0.32);
    cyberFX.boards.push(boardTex);
    if (!liteCyber) {
      const boardTex2 = mkCandleBoard();
      plane(4.4, 2.7, boardTex2, 7.4, 6.2, 14.4, g, -0.38);
      cyberFX.boards.push(boardTex2);
    }
    const tickTex = canvasTex(1024, 128, () => {});
    cyberFX.ticker = tickTex;
    function drawTicker(tt) {
      const ctx = tickTex._g, w = 1024, h = 128;
      ctx.fillStyle = '#0a0416'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ff4de6'; ctx.fillRect(0, 0, w, 4); ctx.fillRect(0, h - 4, w, 4);
      const marks = ['▲', '▼', '◆', '▲', '▼', '◆', '▲', '▼'];
      ctx.font = `900 64px ${FONT}`; ctx.textBaseline = 'middle';
      const off = (tt * 80) % 280;
      for (let i = -1; i < 12; i++) {
        const ch = marks[(i + 8) % marks.length];
        ctx.fillStyle = ch === '▲' ? '#ff4de6' : ch === '▼' ? '#3ef2ff' : '#c890ff';
        ctx.fillText(ch, i * 140 - off + 40, h / 2);
      }
      tickTex.needsUpdate = true;
    }
    plane(10, 1.15, tickTex, 0, 4.55, 6.4, g, 0);
    // 蒸氣口
    const ventN = liteCyber ? 2 : 4;
    for (let i = 0; i < ventN; i++) {
      const s = i < 2 ? -1 : 1;
      const vg = new THREE.Group(); vg.position.set(s * (3.4 + (i % 2) * 1.2), 0.2, 3.6 + (i % 2) * 2);
      cyl(.18, .22, .3, 8, std(0x1a1228, { metalness: .6 }), 0, .15, 0, vg);
      const steam = new THREE.Mesh(keep(new THREE.PlaneGeometry(.7, 1.6)), keep(new THREE.MeshBasicMaterial({ color: 0xccaaff, transparent: true, opacity: .18, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })));
      steam.position.y = 1.1; vg.add(steam); g.add(vg); cyberFX.vents.push(steam);
    }
    // 飛光軌跡
    const trailN = liteCyber ? 2 : 5;
    for (let i = 0; i < trailN; i++) {
      const tr = box(0.08, 0.08, 2.8, i % 2 ? mag : cya, 0, 16, 20, g);
      tr.material = tr.material.clone(); tr.material.transparent = true; tr.material.opacity = .7; keep(tr.material);
      tr.userData.ph = i * 1.3; cyberFX.trails.push(tr);
    }
    // 雨水
    const rainN = liteCyber ? 80 : 320;
    const rainArr = new Float32Array(rainN * 3);
    for (let i = 0; i < rainN; i++) rainArr.set([(Math.random() - .5) * 50, Math.random() * 28, Math.random() * 40 + 2], i * 3);
    const rainGeo = keep(new THREE.BufferGeometry()); rainGeo.setAttribute('position', new THREE.BufferAttribute(rainArr, 3));
    const rainSprite = canvasTex(16, 48, (ctx, w, h) => {
      const grd = ctx.createLinearGradient(w / 2, 0, w / 2, h);
      grd.addColorStop(0, 'rgba(170,212,255,0)');
      grd.addColorStop(.4, 'rgba(190,225,255,.55)');
      grd.addColorStop(1, 'rgba(220,240,255,.95)');
      ctx.fillStyle = grd; ctx.fillRect(w / 2 - 1.5, 0, 3, h);
    });
    const rain = new THREE.Points(rainGeo, keep(new THREE.PointsMaterial({
      color: 0xc8e6ff, size: liteCyber ? 6 : 8, map: rainSprite, sizeAttenuation: false,
      transparent: true, opacity: .72, depthWrite: false, blending: THREE.AdditiveBlending,
    })));
    g.add(rain);
    cyberFX.rainGeo = rainGeo; cyberFX.rainArr = rainArr; cyberFX.rainN = rainN;
    // 大樓上再加一層洋紅飾帶（只在賽博模式看得到）
    const trim = new THREE.Group(); tower.add(trim); trim.visible = CYBER;
    box(19.2, .12, .12, mag, 0, 30, 0.16, trim);
    box(16, .12, .12, cya, 0, 52, 0.16, trim);
    box(.12, 20, .12, vio, -9.4, 20, 0.16, trim);
    box(.12, 20, .12, mag, 9.4, 20, 0.16, trim);
  }
  streetClassic.visible = !CYBER;
  streetCyber.visible = CYBER;


  /* ---------- 大廳外殼（兩層樓共用） ---------- */
  const hall = new THREE.Group(); world.add(hall);
  const W = 9, D = 16, H = 6.6;
  const PAL = {
    lobby: { acc: '62,242,255', hex: C.cyan, base: '#0b1224', emb: '史塔', fog: 0x0a1030, bg: null, back: C.cyan, wall: 0x111a2e },
    f2: { acc: '255,154,60', hex: 0xff9a3c, base: '#1c130c', emb: '晨會', fog: 0x1c1110, bg: 0x140b08, back: 0xff7a3c, wall: 0x2a1c14 },
    f3: { acc: '140,255,90', hex: 0x8cff5a, base: '#08160f', emb: '訓練', fog: 0x0a1a12, bg: 0x04100a, back: 0x5aff8c, wall: 0x0f2219 },
    f4: { acc: '255,77,109', hex: 0xff4d6d, base: '#1a0a10', emb: '榮耀', fog: 0x1a0a12, bg: 0x10050a, back: 0xff4d6d, wall: 0x2a1018 },
    f5: { acc: '120,170,255', hex: 0x78aaff, base: '#0a0f22', emb: '目標', fog: 0x0a1028, bg: 0x050818, back: 0xc890ff, wall: 0x141a36 },
    insider: { acc: '255,200,90', hex: C.gold, base: '#140f1e', emb: '自己人', fog: 0x120c1e, bg: 0x07060f, back: 0xb070ff, wall: 0x161226 },
  };
  const FNUM = { lobby: 1, f2: 2, f3: 3, f4: 4, f5: 5, insider: 68 };
  const floorTex = f => canvasTex(1024, 1024, (g, w, h) => {
    const P = PAL[f], acc = P.acc;
    g.fillStyle = P.base; g.fillRect(0, 0, w, h);
    if (f === 'f2') { for (let y = 0; y < 32; y++) { g.fillStyle = y % 2 ? 'rgba(255,190,120,.05)' : 'rgba(0,0,0,.15)'; g.fillRect(0, y * h / 32, w, h / 32); } }
    else for (let y = 0; y < 8; y++) for (let x = 0; x < 9; x++) { g.fillStyle = (x + y) % 2 ? 'rgba(255,255,255,.025)' : 'rgba(0,0,0,.12)'; g.fillRect(x * w / 9, y * h / 8, w / 9, h / 8); }
    g.strokeStyle = `rgba(${acc},.18)`; g.lineWidth = 2;
    for (let i = 0; i <= 9; i++) { g.beginPath(); g.moveTo(i * w / 9, 0); g.lineTo(i * w / 9, h); g.stroke(); }
    for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(0, i * h / 8); g.lineTo(w, i * h / 8); g.stroke(); }
    if (f === 'f3') { g.strokeStyle = `rgba(${acc},.6)`; g.lineWidth = 8; g.strokeRect(120, 120, w - 240, h - 200); g.beginPath(); g.moveTo(120, h * .47); g.lineTo(w - 120, h * .47); g.stroke(); }
    if (f === 'f4') { const gr = g.createLinearGradient(w / 2 - 110, 0, w / 2 + 110, 0); gr.addColorStop(0, 'rgba(150,20,40,.0)'); gr.addColorStop(.15, 'rgba(150,20,40,.75)'); gr.addColorStop(.85, 'rgba(150,20,40,.75)'); gr.addColorStop(1, 'rgba(150,20,40,0)'); g.fillStyle = gr; g.fillRect(w / 2 - 110, 0, 220, h); g.strokeStyle = 'rgba(255,200,90,.6)'; g.lineWidth = 4; g.strokeRect(w / 2 - 96, -10, 192, h + 20); }
    if (f === 'f5') { g.strokeStyle = `rgba(${acc},.35)`; g.lineWidth = 2; const R = 46; for (let yy = 0; yy < h + R; yy += R * 1.5) for (let xx = 0; xx < w + R; xx += R * 1.732) { const ox = ((yy / (R * 1.5)) % 2) * R * .866; g.beginPath(); for (let k = 0; k < 6; k++) { const an = Math.PI / 6 + k * Math.PI / 3; g[k ? 'lineTo' : 'moveTo'](xx + ox + R * Math.cos(an), yy + R * Math.sin(an)); } g.closePath(); g.stroke(); } }
    const cx = w / 2, cy = h * (7.5 / 16);
    g.strokeStyle = 'rgba(255,200,90,.75)'; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, 150, 0, 7); g.stroke();
    g.strokeStyle = `rgba(${acc},.55)`; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 185, 0, 7); g.stroke();
    g.fillStyle = 'rgba(255,200,90,.85)'; g.font = `900 70px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(P.emb, cx, cy);
  });
  const floorTexs = {}; Object.keys(PAL).forEach(f => floorTexs[f] = floorTex(f));
  const floorMat = std(0xffffff, { map: floorTexs.lobby, roughness: .34, metalness: .45, envMapIntensity: .6 });
  const fl = new THREE.Mesh(keep(new THREE.PlaneGeometry(W * 2, D)), floorMat); fl.rotation.x = -Math.PI / 2; fl.position.set(0, .03, -D / 2); hall.add(fl);
  const wallMat = std(0x111a2e, { roughness: .55, metalness: .5 });
  const ceilMat = std(0x0a1020, { roughness: .8 });
  box(W * 2 + .8, .3, D + .4, ceilMat, 0, H + .15, -D / 2, hall);
  box(.4, H, D, wallMat, -W - .2, H / 2, -D / 2, hall); box(.4, H, D, wallMat, W + .2, H / 2, -D / 2, hall);
  // 後牆（留電梯門洞 6.1~8.3）
  box(15.1 + .2, H, .4, wallMat, (-W + 6.1) / 2 - .1, H / 2, -D - .2, hall);
  box(.9, H, .4, wallMat, 8.75, H / 2, -D - .2, hall);
  box(2.2, H - 3.2, .4, wallMat, 7.2, 3.2 + (H - 3.2) / 2, -D - .2, hall);
  const accent = glow(C.cyan, 1.8); // 換樓層時換色
  for (let z = -1.5; z > -D; z -= 3) { box(.06, H - .6, .06, accent, -W + .02, H / 2, z, hall); box(.06, H - .6, .06, accent, W - .02, H / 2, z, hall); }
  box(W * 2, .08, .08, accent, 0, H - .1, -D + .05, hall);
  const ring = new THREE.Mesh(keep(new THREE.TorusGeometry(3, .07, 6, 64)), accent); ring.rotation.x = Math.PI / 2; ring.position.set(0, H - .05, -7.5); hall.add(ring);
  const ring2 = new THREE.Mesh(keep(new THREE.TorusGeometry(4.2, .04, 6, 64)), goldGlow); ring2.rotation.x = Math.PI / 2; ring2.position.set(0, H - .05, -7.5); hall.add(ring2);
  [-5.5, 5.5].forEach(x => box(.25, .05, 13, glow(0xdfefff, 1.2), x, H - .02, -8, hall));
  // 電梯車廂
  const cab = new THREE.Group(); hall.add(cab);
  const cabMat = std(0x2a2416, { metalness: .9, roughness: .3, envMapIntensity: .9 });
  box(2.4, .1, 2.2, cabMat, 7.2, 0, -17.4, cab); box(2.4, .1, 2.2, cabMat, 7.2, 3.3, -17.4, cab);
  box(.1, 3.3, 2.2, cabMat, 6.0, 1.65, -17.4, cab); box(.1, 3.3, 2.2, cabMat, 8.4, 1.65, -17.4, cab); box(2.4, 3.3, .1, cabMat, 7.2, 1.65, -18.5, cab);
  box(2, .05, .05, glow(0xfff1cf, 2), 7.2, 3.22, -17.4, cab);
  // 電梯門與框
  box(2.5, .14, .2, goldGlow, 7.2, 3.25, -15.95, hall); [-1, 1].forEach(s => box(.14, 3.3, .2, goldGlow, 7.2 + s * 1.18, 1.65, -15.95, hall));
  const doorMat = std(0x9aa6bf, { metalness: 1, roughness: .2, envMapIntensity: 1 });
  const liftL = box(1.1, 3.15, .08, doorMat, 6.65, 1.6, -15.9, hall), liftR = box(1.1, 3.15, .08, doorMat, 7.75, 1.6, -15.9, hall);
  const liftInd = canvasTex(512, 160, () => {}); plane(2.2, .7, liftInd, 7.2, 3.9, -15.88, hall);
  function drawInd(rankName) {
    const g = liftInd._g, w = 512, h = 160; g.clearRect(0, 0, w, h); g.fillStyle = '#070b16'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#ffc85a'; g.lineWidth = 4; g.strokeRect(4, 4, w - 8, h - 8);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffe3a0'; g.shadowColor = '#ffc85a'; g.shadowBlur = 16;
    g.font = `900 64px ${FONT}`; g.fillText(`${FNUM[floorNow]} 樓`, 130, h / 2);
    g.font = `800 40px ${FONT}`; g.fillStyle = '#9ff4ff'; g.shadowColor = '#3ef2ff'; g.fillText(rankName, 360, h / 2);
    liftInd.needsUpdate = true;
  }
  // 一樓正面玻璃與自動門
  const front = new THREE.Group(); hall.add(front);
  const glassMat = keep(new THREE.MeshStandardMaterial({ color: 0x8fe9ff, transparent: true, opacity: .14, roughness: .05, metalness: .2, depthWrite: false }));
  box(7.4, H, .08, glassMat, -5.3, H / 2, 0, front); box(7.4, H, .08, glassMat, 5.3, H / 2, 0, front);
  box(3.2, H - 3.4, .08, glassMat, 0, 3.4 + (H - 3.4) / 2, 0, front);
  [-1.6, 1.6].forEach(x => box(.12, 3.4, .14, cyanGlow, x, 1.7, 0, front)); box(3.32, .12, .14, cyanGlow, 0, 3.4, 0, front);
  for (let x = -8; x <= 8; x += 2.6) if (Math.abs(x) > 2) box(.08, H, .1, armor, x, H / 2, 0, front);
  const doorGlass = keep(new THREE.MeshStandardMaterial({ color: 0x9ff4ff, transparent: true, opacity: .28, roughness: .05, metalness: .5, depthWrite: false }));
  const doorL = box(1.6, 3.3, .06, doorGlass, -.8, 1.65, .02, front), doorR = box(1.6, 3.3, .06, doorGlass, .8, 1.65, .02, front);
  // 其他樓層正面：實牆＋夜景窗
  const insFront = new THREE.Group(); hall.add(insFront); insFront.visible = false;
  const viewTex = canvasTex(1024, 360, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#03050f'); gr.addColorStop(1, '#2a1d55'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    let s = 9; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 70; i++) { const bw = 10 + r() * 40, bh = 40 + r() * 220, x = r() * w; g.fillStyle = '#0a1024'; g.fillRect(x, h - bh, bw, bh); for (let k = 0; k < bh / 12; k++) if (r() > .5) { g.fillStyle = r() > .5 ? 'rgba(255,210,140,.8)' : 'rgba(150,230,255,.7)'; g.fillRect(x + 3 + r() * (bw - 6), h - bh + k * 12, 3, 4); } }
  });
  box(W * 2, H, .3, wallMat, 0, H / 2, .1, insFront).rotation.y = 0;
  plane(16, 3.4, viewTex, 0, 3.3, -.08, insFront, Math.PI, true);

  /* ---------- 夢幻特效：漂浮光點、地板發光邊框、掃描線、電梯光束 ---------- */
  const fxCol = { value: new THREE.Color(C.cyan) };
  { const n = isDesk ? 420 : 160, pos = new Float32Array(n * 3), sd = new Float32Array(n);
    for (let i = 0; i < n; i++) { pos.set([(rng() * 2 - 1) * (W - .5), rng() * H, -rng() * D], i * 3); sd[i] = rng(); }
    const g = keep(new THREE.BufferGeometry()); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('sd', new THREE.BufferAttribute(sd, 1));
    const m = keep(new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uT: FX.t, uC: fxCol, uS: { value: isDesk ? 70 : 90 } },
      vertexShader: `attribute float sd; uniform float uT, uS; varying float vA;
        void main(){ vec3 p = position; p.y = mod(p.y + uT * (.12 + sd * .25), ${H.toFixed(1)}); p.x += sin(uT * .5 + sd * 20.) * .3;
          vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
          gl_PointSize = uS * (.4 + sd) / -mv.z; vA = (.35 + .65 * (sin(uT * 2. + sd * 40.) * .5 + .5)) * smoothstep(0., .8, p.y) * smoothstep(${H.toFixed(1)}, ${(H - 1).toFixed(1)}, p.y); }`,
      fragmentShader: `uniform vec3 uC; varying float vA; void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, 0., d); gl_FragColor = vec4(mix(uC, vec3(1.), a * a * .6), a * vA); }`,
    }));
    const pts = new THREE.Points(g, m); pts.frustumCulled = false; hall.add(pts); }
  // 地板發光邊框
  { const e = .04; box(W * 2 - .4, .02, .07, accent, 0, e, -.4, hall); box(W * 2 - .4, .02, .07, accent, 0, e, -D + .4, hall);
    box(.07, .02, D - .8, accent, -W + .2, e, -D / 2, hall); box(.07, .02, D - .8, accent, W - .2, e, -D / 2, hall); }
  // 掃描線（沿地板往後掃）
  const scanMat = keep(new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uC: fxCol },
    vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform vec3 uC; varying vec2 vU; void main(){ float a = pow(1. - abs(vU.y - .5) * 2., 3.) * smoothstep(0., .15, vU.x) * smoothstep(1., .85, vU.x); gl_FragColor = vec4(uC, a * .55); }' }));
  const scan = new THREE.Mesh(keep(new THREE.PlaneGeometry(W * 2 - .4, .9)), scanMat); scan.rotation.x = -Math.PI / 2; scan.position.y = .05; hall.add(scan);
  // 光束（電梯門與一樓入口）
  const fxBeamMat = keep(new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, uniforms: { uT: FX.t, uC: { value: new THREE.Color(0xffd68a) } },
    vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform float uT; uniform vec3 uC; varying vec2 vU; void main(){ float stripe = fract(vU.y * 3. - uT * .6); float a = (1. - vU.y) * (.25 + .35 * smoothstep(.0, .25, stripe) * smoothstep(.5, .25, stripe)); gl_FragColor = vec4(uC, a * .8); }' }));
  const fxBeamGeo = keep(new THREE.CylinderGeometry(.9, 1.3, 3.6, 24, 1, true));
  const liftBeam = new THREE.Mesh(fxBeamGeo, fxBeamMat); liftBeam.position.set(7.2, 1.8, -14.9); hall.add(liftBeam);
  const fxBeamMat2 = fxBeamMat.clone(); fxBeamMat2.uniforms = { uT: FX.t, uC: { value: new THREE.Color(0x3ef2ff) } }; keep(fxBeamMat2);
  const doorBeam = new THREE.Mesh(fxBeamGeo, fxBeamMat2); doorBeam.scale.set(1.4, 1.1, 1); doorBeam.position.set(0, 1.95, 1.2); front.add(doorBeam);

  /* ---------- 文字招牌（牆上） ---------- */
  function wallSign(text, sub, slotKey, parent, gold = false, y = 4.8) {
    const s = SLOT[slotKey]; const [fx, fz] = s.f; const t = textTex(sub ? [text, sub] : text, { w: 768, h: 240, size: 104, color: gold ? '#ffd68a' : '#9ff4ff', border: gold ? '#ffc85a' : '#3ef2ff', glowC: gold ? '#ffc85a' : '#3ef2ff' });
    let x, z, ry;
    if (fx) { x = fx * (W - .05); z = s.obj[1]; ry = -fx * Math.PI / 2; } else { x = s.obj[0]; z = -D + .05; ry = 0; }
    return plane(2.8, .875, t, x, y, z, parent, ry);
  }

  /* ---------- 牛馬小人 ---------- */
  const avatar = new THREE.Group(); scene.add(avatar);
  const skin = std(0xa8703f, { roughness: .6, metalness: 0 }), snoutM = std(0xe9c49a, { roughness: .6, metalness: 0 });
  const shirt = std(0xf2f5fb, { roughness: .55, metalness: 0 }), pants = std(0x1d2640, { roughness: .6, metalness: 0 });
  const black = std(0x111111, { roughness: .3 }), hornM2 = std(0xf4e3c0, { roughness: .4 });
  const body = new THREE.Group(); avatar.add(body);
  const legs = [-1, 1].map(s => { const p = new THREE.Group(); p.position.set(s * .17, .78, 0); body.add(p); box(.24, .7, .26, pants, 0, -.35, 0, p); box(.27, .12, .38, black, 0, -.72, .05, p); return p; });
  rbox(.74, .78, .46, .14, shirt, 0, 1.17, 0, body);
  const defaultTie = box(.12, .5, .04, goldGlow, 0, 1.2, .24, body);
  const defaultBadge = box(.14, .09, .03, cyanGlow, .22, 1.3, .24, body);
  const arms = [-1, 1].map(s => { const p = new THREE.Group(); p.position.set(s * .47, 1.5, 0); body.add(p); box(.19, .62, .22, shirt, 0, -.3, 0, p); const hnd = new THREE.Mesh(keep(new THREE.SphereGeometry(.11, 8, 6)), skin); hnd.position.y = -.66; p.add(hnd); return p; });
  box(.42, .3, .12, std(0x6b3f1c, { roughness: .5 }), 0, -.82, .05, arms[1]);
  const head = new THREE.Group(); head.position.y = 1.95; body.add(head);
  rbox(.78, .62, .66, .2, skin, 0, 0, 0, head); rbox(.56, .3, .24, .1, snoutM, 0, -.14, .32, head);
  const defaultHorns = [];
  [-1, 1].forEach(s => {
    const e = new THREE.Mesh(keep(new THREE.SphereGeometry(.065, 8, 6)), black); e.position.set(s * .2, .07, .33); head.add(e);
    const hl = new THREE.Mesh(keep(new THREE.SphereGeometry(.02, 6, 4)), glow(0xffffff)); hl.position.set(s * .2 + .02, .1, .39); head.add(hl);
    const n = new THREE.Mesh(keep(new THREE.SphereGeometry(.035, 6, 4)), std(0x5b3a1e)); n.position.set(s * .1, -.13, .45); head.add(n);
    const ear = new THREE.Mesh(keep(new THREE.SphereGeometry(.14, 8, 6)), skin); ear.scale.set(1.6, .6, .8); ear.position.set(s * .5, .02, 0); head.add(ear);
    const hb = cyl(.07, .1, .28, 6, hornM2, s * .38, .3, 0, head); hb.rotation.z = s * -1.1;
    const ht = cyl(.01, .07, .3, 6, hornM2, s * .55, .48, 0, head); ht.rotation.z = s * -.35;
    defaultHorns.push(hb, ht);
  });
  const wearRoot = new THREE.Group(); body.add(wearRoot);
  const goldHornM = std(0xffd56a, { metalness: 1, roughness: .25, envMapIntensity: 1.1 });
  function applyOutfit(eq) {
    eq = eq || {};
    while (wearRoot.children.length) wearRoot.remove(wearRoot.children[0]);
    const col = { navy: 0x1a2744, black: 0x151515, gold: 0xd9a441, cyan: 0x1aa9c9, red: 0x8a2030 };
    defaultTie.visible = !eq.tie; defaultBadge.visible = !eq.tie;
    defaultHorns.forEach(h => h.visible = !eq.horns);
    if (eq.jacket) {
      const m = std(eq.jacket === 'jacket-black' ? col.black : col.navy, { roughness: .45, metalness: .25 });
      rbox(.86, .86, .56, .12, m, 0, 1.2, 0, wearRoot);
      box(.16, .7, .06, std(0xe8eef6, { roughness: .6 }), 0, 1.18, .28, wearRoot);
    }
    if (eq.tie) {
      const c = eq.tie === 'tie-cyan' ? col.cyan : eq.tie === 'tie-red' ? col.red : col.gold;
      box(.11, .5, .04, std(c, { metalness: .4, roughness: .35 }), 0, 1.2, .32, wearRoot);
    }
    if (eq.hat) {
      const hm = std(eq.hat === 'hat-cap' ? 0x1a2744 : 0x161616, { roughness: .4, metalness: .2 });
      if (eq.hat === 'hat-cap') { box(.7, .16, .7, hm, 0, 2.42, 0, wearRoot); box(.5, .06, .36, hm, 0, 2.36, .42, wearRoot); }
      else { cyl(.42, .4, .22, 16, hm, 0, 2.46, 0, wearRoot); const brim = cyl(.62, .62, .05, 20, hm, 0, 2.35, 0, wearRoot); }
    }
    if (eq.glasses) {
      const gm = std(eq.glasses === 'glasses-gold' ? col.gold : 0x111111, { metalness: .8, roughness: .25 });
      const lens = std(0x111118, { metalness: .9, roughness: .15, opacity: .85, transparent: true });
      box(.16, .02, .02, gm, 0, 2.04, .38, wearRoot);
      [-1, 1].forEach(s => { const l = new THREE.Mesh(keep(new THREE.CircleGeometry(.1, 12)), lens); l.position.set(s * .16, 2.02, .4); wearRoot.add(l); });
    }
    if (eq.cape) {
      const cm = std(eq.cape === 'cape-gold' ? col.gold : 0x1aa9c9, { roughness: .45, metalness: .35, side: THREE.DoubleSide });
      const cape = box(.9, 1.15, .06, cm, 0, 1.15, -.32, wearRoot); cape.rotation.x = .12; cape.userData.cape = true;
    }
    if (eq.horns) {
      [-1, 1].forEach(s => { const hb = cyl(.07, .1, .28, 6, goldHornM, s * .38, 2.25, 0, wearRoot); hb.rotation.z = s * -1.1; const ht = cyl(.01, .07, .3, 6, goldHornM, s * .55, 2.43, 0, wearRoot); ht.rotation.z = s * -.35; });
    }
    if (hooks.outfitReady) hooks.outfitReady();
  }
  const shadowTex = canvasTex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 4, 64, 64, 60); r.addColorStop(0, 'rgba(0,0,0,.55)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); });
  const shadow = new THREE.Mesh(keep(new THREE.PlaneGeometry(1.4, 1.4)), keep(new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }))); shadow.rotation.x = -Math.PI / 2; shadow.position.y = .05; avatar.add(shadow);
  avatar.scale.setScalar(1.05);

  /* ---------- 燈光 ---------- */
  scene.add(new THREE.HemisphereLight(0x7088cc, 0x0a0a18, .7));
  const moon = new THREE.DirectionalLight(0xa8c4ff, .9); moon.position.set(-30, 60, 40); scene.add(moon);
  const hubLight = new THREE.PointLight(0xfff0d8, 30, 22, 1.4); hubLight.position.set(0, 5.6, -7.5); scene.add(hubLight);
  const backL = new THREE.PointLight(C.cyan, 16, 16, 1.4); backL.position.set(-5, 4, -13); scene.add(backL);
  const backR = new THREE.PointLight(C.gold, 16, 16, 1.4); backR.position.set(5, 4, -13); scene.add(backR);
  const entL = new THREE.PointLight(0xffe2b0, 22, 14, 1.4); entL.position.set(0, 5, 3); scene.add(entL);

  /* ---------- 區域物件 ---------- */
  const floors = { lobby: new THREE.Group(), f2: new THREE.Group(), f3: new THREE.Group(), f4: new THREE.Group(), f5: new THREE.Group(), insider: new THREE.Group() };
  Object.values(floors).forEach(g => { hall.add(g); g.visible = false; });
  const zoneObj = {}; const hitBoxes = []; const publicScreens = [];
  const hitMat = keep(new THREE.MeshBasicMaterial({ visible: false }));
  function zoneGroup(id, slotKey, parent) {
    const g = new THREE.Group(); const s = SLOT[slotKey]; g.position.set(s.obj[0], 0, s.obj[1]); parent.add(g);
    const hb = new THREE.Mesh(boxGeo, hitMat); hb.scale.set(2.6, 3.4, 2.6); hb.position.y = 1.7; hb.userData.zone = id; hb.userData.fg = parent; g.add(hb); hitBoxes.push(hb);
    zoneObj[id] = g;
    const rg = new THREE.Mesh(keep(new THREE.RingGeometry(.55, .68, 40)), keep(new THREE.MeshBasicMaterial({ color: C.cyan, transparent: true, opacity: .5, depthWrite: false })));
    rg.rotation.x = -Math.PI / 2; rg.position.set(s.spot[0], .05, s.spot[1]); parent.add(rg); g.userData.ring = rg;
    return g;
  }
  const L = floors.lobby, F2 = floors.f2, F3 = floors.f3, F4 = floors.f4, F5 = floors.f5, I = floors.insider;
  const darkPanel = std(0x151d33, { metalness: .7, roughness: .35 });
  const goldM = std(0xd9a441, { metalness: 1, roughness: .28, envMapIntensity: 1.1 });
  const wood = std(0x3a2414, { roughness: .45, metalness: .1 });
  function plant(x, z, parent) {
    cyl(.45, .35, .7, 10, armor2, x, .35, z, parent);
    for (let i = 0; i < 5; i++) { const lf = new THREE.Mesh(keep(new THREE.ConeGeometry(.3, 1.6, 5)), std(0x1f6b4a, { roughness: .7, metalness: 0 })); lf.position.set(x + Math.cos(i * 1.3) * .2, 1.4, z + Math.sin(i * 1.3) * .2); lf.rotation.z = Math.cos(i * 1.3) * .3; parent.add(lf); }
  }
  function liveTex(name, seed) { const t = canvasTex(512, 320, () => {}); t.userData = { name, seed, pts: Array.from({ length: 40 }, (_, k) => 160 + Math.sin(k * .4 + seed) * 40) }; return t; }

  // ---- 1 樓：交易大廳 ----
  { const t = textTex(['68 樓・自己人專區', '搭電梯・輸入暗號上樓'], { w: 1024, h: 300, size: 96 }); plane(3.4, 1, t, -W + .05, 3.4, -12.4, L, Math.PI / 2); plant(-7.8, -10.6, L); }
  plant(7.8, -5.2, L); plant(7.8, -11.2, L);
  { const t = textTex(['每天打卡', '累積天數，解鎖新樓層'], { w: 1024, h: 300, size: 110, color: '#9ff4ff', border: '#3ef2ff', glowC: '#3ef2ff', sub: '#ffd68a' }); plane(3.4, 1, t, W - .05, 3.6, -8.2, L, -Math.PI / 2); }
  // 樓層導覽看板（動態）
  const dirTex = canvasTex(1024, 640, () => {});
  { const g = zoneGroup('directory', 'G', L); box(6.4, 4, .14, armor, 0, 3, .06, g); plane(6.2, 3.88, dirTex, 0, 3, .15, g); box(6.6, .1, .2, goldGlow, 0, 5.05, .08, g); }
  function drawDir(info) {
    const g = dirTex._g, w = 1024, h = 640; g.clearRect(0, 0, w, h); g.fillStyle = '#060c1c'; g.fillRect(0, 0, w, h);
    g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#ffe3a0'; g.font = `900 64px ${FONT}`; g.shadowColor = '#ffc85a'; g.shadowBlur = 16; g.fillText('樓層導覽', 48, 64); g.shadowBlur = 0;
    (info && info.floors || []).forEach((f, i) => {
      const y = 146 + i * 82; g.fillStyle = f.here ? 'rgba(62,242,255,.16)' : 'rgba(255,255,255,.04)'; g.fillRect(40, y - 35, w - 80, 70);
      g.fillStyle = '#ffd68a'; g.font = `900 46px ${FONT}`; g.fillText(f.num + 'F', 64, y);
      g.fillStyle = '#e9f3ff'; g.font = `800 40px ${FONT}`; g.fillText(f.name, 200, y);
      g.textAlign = 'right'; g.font = `700 32px ${FONT}`;
      g.fillStyle = f.here ? '#3ef2ff' : f.open ? '#2fd38a' : '#ffc85a'; g.fillText(f.here ? '你在這裡' : f.status, w - 64, y); g.textAlign = 'left';
    });
    dirTex.needsUpdate = true;
  }
  // 打卡櫃台
  { const g = zoneGroup('checkin', 'A', L);
    rbox(1.3, 1.1, 3.6, .12, darkPanel, 0, .55, 0, g); box(1.36, .06, 3.66, goldGlow, 0, 1.12, 0, g); box(.04, .08, 3.4, cyanGlow, .66, .7, 0, g);
    const clock = textTex(['上班打卡', '刷卡領薪水'], { w: 512, h: 300, size: 96, color: '#ffe3a0' });
    rbox(.5, .9, .3, .06, armor2, 0, 1.6, 0, g); plane(.42, .25, clock, .16, 1.75, 0, g, Math.PI / 2);
    wallSign('打卡櫃台', '每日上班・連續有獎', 'A', L, true);
    g.userData.coinSrc = new THREE.Vector3(-7.4, 2, -3.2); }
  // 接引櫃台
  { const g = zoneGroup('guide', 'B', L);
    cyl(1.1, 1.2, 1.05, 24, darkPanel, 0, .52, 0, g); cyl(1.15, 1.15, .06, 32, cyanGlow, 0, 1.06, 0, g);
    const holo = new THREE.Mesh(keep(new THREE.OctahedronGeometry(.42)), keep(new THREE.MeshBasicMaterial({ color: C.gold, wireframe: true }))); holo.position.y = 1.9; g.add(holo); g.userData.spin = holo;
    wallSign('接引櫃台', '私訊「成長」領取', 'B', L, true); }
  // 心法籤機
  { const g = zoneGroup('fortune', 'C', L);
    const cabm = std(0x3a1c22, { metalness: .6, roughness: .35 });
    const body = rbox(1.2, 2.6, 1.7, .12, cabm, 0, 1.3, 0, g); g.userData.shake = body;
    const scr = textTex(['心法籤', '每日一抽'], { w: 512, h: 420, size: 130, color: '#ffd68a' });
    plane(1.3, 1.05, scr, .62, 1.75, 0, g, Math.PI / 2);
    box(.04, .08, .9, goldGlow, .62, .8, 0, g); box(1.26, .06, 1.76, goldGlow, 0, 2.62, 0, g);
    wallSign('心法籤機', '每日一張心法籤', 'C', L, true, 4.9); }
  // 服裝店
  { const g = zoneGroup('shop', 'D', L);
    rbox(1.5, 2.4, 1.3, .08, std(0x3a2a18, { roughness: .4, metalness: .3 }), 0, 1.2, 0, g);
    box(1.56, .08, 1.36, goldGlow, 0, 2.42, 0, g);
    box(.04, 1.8, 1.1, cyanGlow, .74, 1.3, 0, g);
    rbox(.5, .9, .28, .06, std(0x1a2744, { roughness: .4 }), 0, 1.5, .7, g);
    rbox(.4, .2, .4, .04, std(0x111, { metalness: .3 }), 0, 2.15, .7, g);
    wallSign('服裝店', '薪水換裝扮', 'D', L, true); }

  // ---- 2 樓：晨會室（暖色晨光） ----
  // 晨會室
  { const g = zoneGroup('guess', 'D', F2);
    cyl(1.35, 1.35, .1, 32, darkPanel, 0, .8, 0, g); cyl(.25, .4, .8, 12, armor, 0, .4, 0, g); cyl(1.38, 1.38, .04, 48, cyanGlow, 0, .86, 0, g);
    [0, 1, 2, 3, 4].forEach(i => { const a = Math.PI * .5 + i * 1.256; rbox(.5, .7, .5, .08, armor2, Math.cos(a) * 1.9, .35, Math.sin(a) * 1.9, g); });
    const upA = new THREE.Mesh(keep(new THREE.ConeGeometry(.3, .6, 4)), glow(C.up, 1.6)); upA.position.set(-.35, 1.7, 0); g.add(upA);
    const dnA = new THREE.Mesh(keep(new THREE.ConeGeometry(.3, .6, 4)), glow(C.down, 1.4)); dnA.rotation.z = Math.PI; dnA.position.set(.35, 1.5, 0); g.add(dnA);
    g.userData.arrows = [upA, dnA];
    wallSign('猜盤桌', '台股・美股 猜漲跌', 'D', F2); }
  { const sun = canvasTex(1024, 360, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a1840'); gr.addColorStop(.6, '#ff8a3c'); gr.addColorStop(1, '#ffd08a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,240,200,.9)'; g.beginPath(); g.arc(w * .5, h * .78, 70, 0, 7); g.fill(); g.fillStyle = '#1a0f12'; for (let i = 0; i < 40; i++) { const bw = 14 + (i * 37 % 40), bh = 30 + (i * 53 % 150); g.fillRect(i * 26, h - bh, bw, bh); } });
    plane(7, 2.4, sun, -W + .05, 3.4, -5.5, F2, Math.PI / 2); }
  const leadTex = canvasTex(1024, 640, () => {});
  { const g = zoneGroup('leader', 'G', F2); box(6.4, 4, .14, armor, 0, 3, .06, g); plane(6.2, 3.88, leadTex, 0, 3, .15, g); box(6.6, .1, .2, glow(0xff9a3c, 1.6), 0, 5.05, .08, g); }
  function drawLeader(info) {
    const g = leadTex._g, w = 1024, h = 640; g.clearRect(0, 0, w, h); g.fillStyle = '#140a06'; g.fillRect(0, 0, w, h);
    g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#ffcf8a'; g.font = `900 60px ${FONT}`; g.fillText('本週猜盤排行榜', 48, 64);
    g.textAlign = 'right'; g.font = `600 28px ${FONT}`; g.fillStyle = 'rgba(255,207,138,.7)'; g.fillText('即將公開', w - 48, 64); g.textAlign = 'left';
    (info && info.board || []).slice(0, 6).forEach((r, i) => {
      const y = 150 + i * 80; g.fillStyle = r.me ? 'rgba(255,154,60,.25)' : 'rgba(255,255,255,.04)'; g.fillRect(40, y - 34, w - 80, 68);
      g.fillStyle = '#ffd68a'; g.font = `900 40px ${FONT}`; g.fillText(r.rank + '', 64, y);
      g.fillStyle = r.me ? '#fff' : '#e9d9c8'; g.font = `800 36px ${FONT}`; g.fillText(r.name, 150, y);
      g.textAlign = 'right'; g.fillStyle = '#ff9a3c'; g.fillText(r.pts + ' 分', w - 64, y); g.textAlign = 'left';
    });
    leadTex.needsUpdate = true;
  }
  { const g = new THREE.Group(); g.position.set(7.4, 0, -3.2); F2.add(g); rbox(1.2, 1.05, 3, .1, wood, 0, .52, 0, g); box(1.24, .05, 3.04, glow(0xff9a3c, 1.4), 0, 1.06, 0, g);
    rbox(.5, .7, .5, .08, armor2, 0, 1.4, -.8, g); [0, .3, .6].forEach(k => cyl(.1, .08, .2, 10, std(0xf2f5fb), 0, 1.16, .3 + k, g));
    wallSign('咖啡吧', '晨會前來一杯', 'B', F2, false, 4.6); }
  { const wb = textTex(['今日晨會', '一 打卡　二 猜盤　三 看戰報'], { w: 1024, h: 560, size: 120, color: '#ffcf8a', border: '#ff9a3c', glowC: '#ff9a3c', sub: '#fff' }); plane(3.2, 1.75, wb, -W + .05, 2.8, -12.2, F2, Math.PI / 2); }
  [[-3, -11], [3, -11], [-3, -4.5]].forEach(([x, z]) => rbox(.55, .5, .55, .1, std(0x5a3a22, { roughness: .6 }), x, .25, z, F2));

  // ---- 3 樓：訓練場（綠色球場） ----
  function arcade(id, slotKey, title, color, sub) {
    const g = zoneGroup(id, slotKey, F3); const sx = SLOT[slotKey].f[0];
    rbox(1.3, 2.7, 1.4, .14, std(0x10221a, { metalness: .6, roughness: .35 }), 0, 1.35, 0, g);
    const scr = canvasTex(512, 420, (c, w, h) => {
      c.fillStyle = '#03100a'; c.fillRect(0, 0, w, h);
      let y = 260; for (let i = 0; i < 14; i++) { const o = y, cl = o + (Math.sin(i * 1.9 + title.length) * 50); const up = cl < o; c.fillStyle = up ? '#ff5468' : '#2fd38a'; c.fillRect(30 + i * 32, Math.min(o, cl), 20, Math.max(6, Math.abs(cl - o))); c.fillRect(39 + i * 32, Math.min(o, cl) - 16, 2, Math.abs(cl - o) + 32); y = cl; }
      c.fillStyle = color; c.font = `900 56px ${FONT}`; c.textAlign = 'center'; c.shadowColor = color; c.shadowBlur = 14; c.fillText(title, w / 2, 70); c.shadowBlur = 0; c.font = `600 26px ${FONT}`; c.fillStyle = '#cfe'; c.fillText(sub, w / 2, h - 30);
    });
    plane(1.2, .98, scr, sx * -.71, 1.75, 0, g, sx < 0 ? Math.PI / 2 : -Math.PI / 2);
    box(.06, .06, 1.3, glow(0x8cff5a, 2), sx * -.68, .95, 0, g);
    [-1, 1].forEach(k => { const b = cyl(.08, .08, .08, 10, glow(k < 0 ? C.up : C.down, 2), sx * -.72, 1.1, k * .3, g); b.rotation.z = Math.PI / 2; });
    return g;
  }
  arcade('kline', 'C', '看K線猜下一根', '#8cff5a', '練習盤・隨機產生'); wallSign('看K線猜下一根', '小遊戲', 'C', F3, false, 4.9);
  arcade('fakeout', 'D', '躲假突破', '#ffc85a', '反應小遊戲'); wallSign('躲假突破', '反應小遊戲', 'D', F3, true, 4.9);
  { const g = zoneGroup('tips', 'G', F3); box(5.6, 3, .14, armor, 0, 2.9, .06, g);
    const t = textTex(['心法小提醒', '每玩完一局送一句董事長的心法'], { w: 1400, h: 760, size: 150, color: '#bfffa0', border: '#8cff5a', glowC: '#8cff5a', sub: '#ffd68a' }); plane(5.4, 2.9, t, 0, 2.9, .15, g); }
  [[-4, -4], [4, -4], [-4, -11], [4, -11]].forEach(([x, z]) => { const c = new THREE.Mesh(keep(new THREE.ConeGeometry(.25, .6, 8)), glow(0xffa63c, 1.2)); c.position.set(x, .3, z); F3.add(c); });
  [-1, 1].forEach(s => { const hb = new THREE.Group(); hb.position.set(s * 6.6, 0, -3.2); F3.add(hb); [-.8, .8].forEach(z => box(.08, 1, .08, armor2, 0, .5, z, hb)); box(.08, .08, 1.7, glow(0x8cff5a, 1.6), 0, 1, 0, hb); });
  { const bag = cyl(.4, .4, 1.4, 10, std(0x3a1414, { roughness: .6 }), -7.4, 2.2, -12.4, F3); cyl(.03, .03, 2, 4, armor, -7.4, 4.6, -12.4, F3); }
  { const t = textTex(['訓練場', '練盤感，不練運氣'], { w: 1024, h: 300, size: 120, color: '#bfffa0', border: '#8cff5a', glowC: '#8cff5a', sub: '#fff' }); plane(3.4, 1, t, W - .05, 3.8, -11.8, F3, -Math.PI / 2); }

  // ---- 4 樓：戰報與英雄榜（紅金殿堂） ----
  // 戰報牆（一樓：台股、美股公開，A股在 68 樓）
  { const g = zoneGroup('reports', 'G', F4);
    const lockTex = canvasTex(640, 400, (c, w, h) => {
      c.fillStyle = '#06101f'; c.fillRect(0, 0, w, h);
      c.strokeStyle = '#ffc85a'; c.lineWidth = 10; c.strokeRect(w / 2 - 44, 170, 88, 70); c.beginPath(); c.arc(w / 2, 170, 32, Math.PI, 0); c.stroke();
      c.fillStyle = '#ffe3a0'; c.textAlign = 'center'; c.font = `900 54px ${FONT}`; c.fillText('A股戰報', w / 2, 100); c.font = `700 34px ${FONT}`; c.fillStyle = '#9ff4ff'; c.fillText('68 樓・自己人專區', w / 2, 310);
    });
    ['台股', '美股'].forEach((n, i) => {
      box(3.5, 2.2, .12, armor, (i - 1) * 3.9, 2.9, .06, g);
      const t = canvasTex(512, 320, () => {}); t.userData = { name: n, seed: i * 7 + 1, pts: Array.from({ length: 40 }, (_, k) => 160 + Math.sin(k * .4 + i) * 40) };
      plane(3.3, 2.06, t, (i - 1) * 3.9, 2.9, .14, g); publicScreens.push(t);
    });
    box(3.5, 2.2, .12, armor, 3.9, 2.9, .06, g); plane(3.3, 2.06, lockTex, 3.9, 2.9, .14, g);
    const banner = textTex(['戰報牆', '台股・美股每日多空戰報｜A股在 68 樓自己人專區'], { w: 1400, h: 300, size: 120, color: '#9ff4ff', border: '#3ef2ff', glowC: '#3ef2ff', sub: '#ffd68a' });
    plane(6.5, 1.4, banner, 0, 5.0, .14, g); }
  // 英雄榜
  { const g = zoneGroup('heroes', 'F', F4);
    const t = canvasTex(1024, 640, (c, w, h) => {
      c.fillStyle = '#0d0a05'; c.fillRect(0, 0, w, h); c.strokeStyle = '#ffc85a'; c.lineWidth = 10; c.strokeRect(10, 10, w - 20, h - 20);
      c.fillStyle = '#ffd68a'; c.font = `900 96px ${FONT}`; c.textAlign = 'center'; c.shadowColor = '#ffc85a'; c.shadowBlur = 20; c.fillText('英雄榜', w / 2, 120); c.shadowBlur = 0;
      for (let i = 0; i < 6; i++) { const x = 90 + (i % 3) * 300, y = 180 + Math.floor(i / 3) * 210; c.strokeStyle = 'rgba(255,200,90,.6)'; c.lineWidth = 3; c.strokeRect(x, y, 240, 180); c.fillStyle = 'rgba(255,214,138,.75)'; c.font = `700 34px ${FONT}`; c.fillText('即將公開', x + 120, y + 100); }
    });
    plane(3.6, 2.25, t, -.04, 2.6, 0, g, -Math.PI / 2);
    box(.4, .08, 3, goldGlow, -.25, 1.25, 0, g);
    [-1, 0, 1].forEach(k => { const cup = cyl(.16, .08, .32, 10, std(0xd9a441, { metalness: 1, roughness: .25, envMapIntensity: 1.2 }), -.3, 1.48, k * .9, g); }); }
  { const g = zoneGroup('honor', 'C', F4);
    ['實習', '正職', '組長', '經理', '總監', '董事'].forEach((n, i) => {
      const hgt = .8 + i * .45, z = -1.5 + i * .6;
      const p = rbox(.5, hgt, .5, .08, goldM, .2, hgt / 2, z, g); p.userData.rankIdx = i; (g.userData.pillars = g.userData.pillars || []).push(p);
      const t = textTex(n, { w: 256, h: 128, size: 80, bg: null, border: null }); plane(.6, .3, t, .5, hgt + .3, z, g, Math.PI / 2);
    });
    wallSign('職級榮譽牆', '實習牛馬到董事', 'C', F4, true, 4.9); }
  { const g = zoneGroup('cta', 'B', F4);
    cyl(1.1, 1.2, 1.05, 24, darkPanel, 0, .52, 0, g); cyl(1.15, 1.15, .06, 32, glow(0xff4d6d, 1.8), 0, 1.06, 0, g);
    const holo = new THREE.Mesh(keep(new THREE.OctahedronGeometry(.42)), keep(new THREE.MeshBasicMaterial({ color: C.gold, wireframe: true }))); holo.position.y = 1.9; g.add(holo); g.userData.spin = holo;
    wallSign('私訊『成長』', '加入自己人', 'B', F4, true); }
  [[-6.5, -4.5], [-6.5, -11.5]].forEach(([x, z]) => { cyl(.35, .45, 1, 8, armor2, x, .5, z, F4); cyl(.28, .14, .5, 10, goldM, x, 1.25, z, F4); });

  // ---- 5 樓：目標值研究室（藍紫實驗室・六角地板・懸浮靶環） ----
  const f5Rings = [];
  { const g = zoneGroup('target', 'G', F5);
    rbox(2.4, .5, 2.4, .12, darkPanel, 0, .25, 1.2, g); cyl(1, 1, .06, 6, glow(0x78aaff, 2), 0, .52, 1.2, g);
    [1.6, 1.15, .7].forEach((r, i) => { const t = new THREE.Mesh(keep(new THREE.TorusGeometry(r, .05, 6, 6 + i * 0 + 48)), glow(i === 2 ? C.gold : 0x78aaff, 2.2)); t.position.set(0, 2.6, 1.2); g.add(t); f5Rings.push(t); });
    const core = new THREE.Mesh(keep(new THREE.IcosahedronGeometry(.26)), goldGlow); core.position.set(0, 2.6, 1.2); g.add(core);
    const t = textTex(['目標值系統', `打卡滿天數解鎖・私訊「成長」領取`], { w: 1400, h: 300, size: 120, color: '#c9dcff', border: '#78aaff', glowC: '#78aaff', sub: '#ffd68a' });
    box(6, 1.5, .12, armor, 0, 5, .06, g); plane(5.8, 1.3, t, 0, 5, .14, g); }
  // 兩側裝飾儀器（不可點選，用來平衡左右佈局）
  [[-8.2, -8], [6.6, -8]].forEach(([x, z]) => {
    rbox(.9, .7, .9, .08, std(0x1a2244, { metalness: .65, roughness: .35 }), x, .35, z, F5);
    cyl(.7, .7, .05, 6, glow(0x78aaff, 1.8), x, .72, z, F5);
    const crystal = new THREE.Mesh(keep(new THREE.OctahedronGeometry(.28)), glow(0xc890ff, 1.8));
    crystal.position.set(x, 1.25, z); F5.add(crystal);
  });
  { const g = zoneGroup('cta5', 'B', F5);
    cyl(1.1, 1.2, 1.05, 6, darkPanel, 0, .52, 0, g); cyl(1.15, 1.15, .06, 6, glow(0x78aaff, 1.8), 0, 1.06, 0, g);
    const holo = new THREE.Mesh(keep(new THREE.OctahedronGeometry(.42)), keep(new THREE.MeshBasicMaterial({ color: C.gold, wireframe: true }))); holo.position.y = 1.9; g.add(holo); g.userData.spin = holo;
    wallSign('私訊『成長』', '領取目標值系統', 'B', F5, true); }
  [[-6.6, -4.2], [-6.6, -11.6]].forEach(([x, z]) => { const p = new THREE.Mesh(keep(new THREE.CylinderGeometry(.35, .35, 2.4, 6)), keep(new THREE.MeshStandardMaterial({ color: 0x78aaff, transparent: true, opacity: .22, emissive: 0x2a3a88, emissiveIntensity: .8 }))); p.position.set(x, 1.2, z); F5.add(p); cyl(.4, .4, .1, 6, glow(0xc890ff, 1.6), x, .05, z, F5); });
  { const t = textTex(['目標值研究室', '最高獎勵在這裡'], { w: 1024, h: 300, size: 110, color: '#c9dcff', border: '#78aaff', glowC: '#78aaff', sub: '#ffd68a' }); plane(3.4, 1, t, -W + .05, 3.8, -11.8, F5, Math.PI / 2); }

  // 每層都有電梯
  [['lift_lobby', L], ['lift_f2', F2], ['lift_f3', F3], ['lift_f4', F4], ['lift_f5', F5], ['lift_insider', I]].forEach(([id, fg]) => { zoneGroup(id, 'H', fg); wallSign('電梯', '各樓層・職級', 'H', fg, true, 5.3); });

  // ---- 68 樓 ----
  { const g = zoneGroup('boss', 'A', I);
    rbox(1.4, .9, 3.2, .1, wood, 0, .45, 0, g); box(1.44, .05, 3.24, goldGlow, 0, .92, 0, g);
    rbox(.8, 1.5, .8, .15, std(0x1a1414, { roughness: .4 }), -.9, .75, 0, g);
    const plaque = textTex(['掌門辦公室', '董事長 LEO易凡'], { w: 768, h: 260, size: 100 }); plane(1.2, .4, plaque, .72, .62, 0, g, Math.PI / 2);
    wallSign('掌門辦公室', '董事長 LEO易凡', 'A', I, true); }
  { const g = zoneGroup('hall', 'B', I);
    rbox(1.3, 1, 3, .1, darkPanel, 0, .5, 0, g); box(1.34, .05, 3.04, cyanGlow, 0, 1.02, 0, g);
    const board = textTex(['公告欄', '即將公開'], { w: 768, h: 520, size: 110, color: '#9ff4ff', border: '#3ef2ff', glowC: '#3ef2ff', sub: '#ffd68a' });
    plane(2.4, 1.6, board, .25, 2.7, 0, g, -Math.PI / 2);
    wallSign('執事堂', '公告與排程', 'B', I, false, 4.9); }
  { const g = zoneGroup('library', 'C', I);
    [-1, 0, 1].forEach(k => { box(.7, 3.2, 1.1, wood, 0, 1.6, k * 1.15, g); for (let s = 0; s < 4; s++) { box(.72, .05, 1.12, goldGlow, .02, .55 + s * .75, k * 1.15, g); for (let b = 0; b < 5; b++) box(.4, .55, .12, std([0x7a2a2a, 0x2a4a7a, 0x6b5a2a, 0x2a6b4a][(b + s + k + 3) % 4], { roughness: .6 }), .1, .85 + s * .75, k * 1.15 - .4 + b * .2, g); } });
    wallSign('藏經閣講義', '三卷九章', 'C', I, true, 4.9); }
  { const g = zoneGroup('course', 'D', I);
    rbox(.7, 1.2, .6, .08, wood, 0, .6, 0, g); box(.74, .04, .64, goldGlow, 0, 1.22, 0, g);
    const scr = textTex(['傳功課程', '即將公開'], { w: 1024, h: 560, size: 120, color: '#9ff4ff', border: '#3ef2ff', glowC: '#3ef2ff', sub: '#ffd68a' });
    plane(3, 1.65, scr, 2.25, 3, 0, g, -Math.PI / 2);
    [0, 1, 2].forEach(i => rbox(.5, .45, .5, .08, armor2, -1.4, .22, -1 + i, g));
    wallSign('傳功課程', '影片課程', 'D', I, false, 5.3); }
  { const g = zoneGroup('review', 'E', I);
    rbox(1, .5, 2.6, .15, std(0x2a2040, { roughness: .7, metalness: 0 }), -.2, .3, 0, g); rbox(.35, .9, 2.6, .15, std(0x2a2040, { roughness: .7, metalness: 0 }), -.62, .7, 0, g);
    cyl(.35, .35, .5, 16, wood, .6, .25, 1.6, g); const lamp = new THREE.Mesh(keep(new THREE.SphereGeometry(.2, 12, 8)), glow(0xffd9a0, 2)); lamp.position.set(.6, .7, 1.6); g.add(lamp);
    const moonN = new THREE.Mesh(keep(new THREE.TorusGeometry(.5, .06, 6, 30, Math.PI * 1.3)), goldGlow); moonN.position.set(-.95, 2.8, 0); moonN.rotation.y = Math.PI / 2; g.add(moonN);
    wallSign('下班複盤', '寫下今天的心得', 'E', I, true, 4.4); }
  { const g = zoneGroup('arena', 'F', I);
    const mat = new THREE.Mesh(keep(new THREE.CircleGeometry(1.6, 8)), std(0x3a1414, { roughness: .6 })); mat.rotation.x = -Math.PI / 2; mat.position.set(-1.8, .04, 0); g.add(mat);
    const t = textTex(['演武場', '即將公開'], { w: 1024, h: 600, size: 120 });
    plane(3.4, 2, t, -.04, 2.7, 0, g, -Math.PI / 2); }
  // 三市戰報室（自己人）：會動的示意螢幕，連結只在面板裡
  const liveScreens = [];
  { const g = zoneGroup('ireports', 'G', I);
    ['A股', '總控台', '台股盤前'].forEach((n, i) => {
      box(3.5, 2.2, .12, armor, (i - 1) * 3.9, 2.9, .06, g);
      const t = canvasTex(512, 320, () => {}); t.userData = { name: n, seed: i * 7 + 1, pts: Array.from({ length: 40 }, (_, k) => 160 + Math.sin(k * .4 + i) * 40) };
      plane(3.3, 2.06, t, (i - 1) * 3.9, 2.9, .14, g); liveScreens.push(t);
    });
    const banner = textTex(['三市戰報室', '自己人專屬・A股戰報與總控台'], { w: 1400, h: 300, size: 120 });
    plane(6.5, 1.4, banner, 0, 5.0, .14, g); }
  function drawScreen(t, k) {
    const g = t._g, w = 512, h = 320, u = t.userData;
    u.pts.shift(); const last = u.pts[u.pts.length - 1]; u.pts.push(Math.max(70, Math.min(270, last + (Math.sin(k * 1.7 + u.seed) + (Math.random() - .5) * 1.2) * 14)));
    g.fillStyle = '#04101e'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(62,242,255,.12)'; g.lineWidth = 1; for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 50); g.lineTo(x, h); g.stroke(); }
    g.strokeStyle = '#3ef2ff'; g.lineWidth = 4; g.shadowColor = '#3ef2ff'; g.shadowBlur = 10; g.beginPath();
    u.pts.forEach((p, i) => { const x = i * (w / 39); i ? g.lineTo(x, p) : g.moveTo(x, p); }); g.stroke(); g.shadowBlur = 0;
    g.fillStyle = '#ffe3a0'; g.font = `900 40px ${FONT}`; g.textAlign = 'left'; g.fillText(u.name.endsWith('台') || u.name.endsWith('前') ? u.name : u.name + '戰報', 20, 42);
    g.fillStyle = 'rgba(159,244,255,.7)'; g.font = `600 22px ${FONT}`; g.textAlign = 'right'; g.fillText('示意畫面', w - 16, 36);
    t.needsUpdate = true;
  }
  const insDecor = [];
  { const t = textTex(['68', '自己人專區'], { w: 512, h: 512, size: 260, color: '#ffd68a' }); plane(1.7, 1.7, t, -7.2, 3.6, -D + .06, I); }

  /* ---------- 標籤（HTML） ---------- */
  const labelsEl = document.getElementById('labels');
  let labels = [];
  function buildLabels() {
    labelsEl.innerHTML = '';
    labels = hooks.ZONES.filter(z => z.floor === floorNow).map(z => {
      const b = document.createElement('button'); b.className = 'zlabel' + (z.gold ? ' gold' : ''); b.dataset.zone = z.id;
      b.innerHTML = `<i></i>${z.name}${z.lock ? '・鎖' : ''}`; b.onclick = () => api.go(z.id); labelsEl.appendChild(b);
      const s = SLOT[z.slot]; const anchor = new THREE.Vector3(s.obj[0] * (s.f[0] ? .86 : 1), z.slot === 'G' ? 4.2 : 3.4, z.slot === 'G' ? -14.5 : s.obj[1]);
      if (z.slot === 'H') anchor.set(7.2, 4.6, -15.6);
      return { el: b, anchor, z };
    });
  }

  /* ---------- 狀態 ---------- */
  let floorNow = hooks.floor ? hooks.floor() : 'lobby';
  let mode = 'orbit'; // orbit | intro | follow | zone | overview | ride
  let tAll = 0, introT = 0, introResolve = null, captionCb = null, captionStep = -1;
  let path = [], speed = 2.6, onArrive = null, walkPhase = 0, waveT = 0, jumpT = 0, faceTarget = null;
  let doorOpen = 0, liftOpen = 0, liftWant = 0, activeZone = null, panelOpen = false, viewShift = 0, viewShiftX = 0;
  const camPos = new THREE.Vector3(4, 8, 52), camLook = new THREE.Vector3(0, 25, -8);
  const camPosT = camPos.clone(), camLookT = camLook.clone();
  let camK = 2.2;
  avatar.position.set(0, 0, 13); avatar.rotation.y = Math.PI;

  function setFloorVisual(f) {
    floorNow = f; const P = PAL[f];
    Object.entries(floors).forEach(([k, g]) => g.visible = k === f);
    exterior.visible = f === 'lobby'; front.visible = f === 'lobby'; insFront.visible = f !== 'lobby';
    floorMat.map = floorTexs[f]; floorMat.needsUpdate = true;
    accent.color.set(P.hex).multiplyScalar(1.8); wallMat.color.set(P.wall);
    backL.color.set(P.back); fxCol.value.set(P.hex);
    scene.fog.color.set(CYBER && f === 'lobby' ? 0x1a0a28 : P.fog);
    scene.fog.density = (CYBER && f === 'lobby') ? 0.016 : 0.0105;
    scene.background = P.bg === null ? null : new THREE.Color(P.bg);
    entL.visible = f === 'lobby';
    hitBoxes.forEach(h => { h.userData.active = h.userData.fg === floors[f]; });
    const [ri, rn] = hooks.rank(); drawInd(rn); refresh(lastInfo);
    buildLabels();
  }
  let lastInfo = null;
  function refresh(info) {
    if (!info) return; lastInfo = info;
    drawDir(info); drawLeader(info);
    (zoneObj.honor.userData.pillars || []).forEach(p => { p.material = p.userData.rankIdx === info.rank ? goldGlow : goldM; });
  }
  setFloorVisual(floorNow);

  const fovFor = () => (camera.aspect < 0.8 ? 72 : camera.aspect < 1.2 ? 62 : 52);
  let orbitYaw = 0.55, orbitPitch = 0.48, orbitDist = 7.4, orbitIdle = 0, orbitDragging = false;
  let steerX = 0, steerY = 0, lastNear = undefined, didDrag = false, pinch0 = 0;
  const pointers = new Map(), held = new Set();
  const KEYMAP = { KeyW: 'u', ArrowUp: 'u', KeyS: 'd', ArrowDown: 'd', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r' };
  const pokeCam = () => { orbitIdle = 0; };
  function playCam() {
    const hz = Math.cos(orbitPitch) * orbitDist;
    camPosT.set(avatar.position.x + Math.sin(orbitYaw) * hz, Math.max(1.55, 1.15 + Math.sin(orbitPitch) * orbitDist), avatar.position.z + Math.cos(orbitYaw) * hz);
    camPosT.x = Math.max(-10.8, Math.min(10.8, camPosT.x));
    camPosT.z = Math.max(-18.5, Math.min(5, camPosT.z));
    camLookT.set(avatar.position.x, 1.25, avatar.position.z);
    camK = orbitDragging ? 10 : 3.3;
  }
  function overview() { mode = 'overview'; camK = 2.6; playCam(); }
  function clampHall(v) { v.x = Math.max(-8.3, Math.min(8.3, v.x)); v.z = Math.max(-15.3, Math.min(-.6, v.z)); v.y = Math.min(6.1, v.y); return v; }
  function clampAvatar(p) {
    if (mode === 'intro' || mode === 'ride' || mode === 'orbit') return p;
    p.x = Math.max(-7.55, Math.min(7.55, p.x)); p.z = Math.max(-14.55, Math.min(-0.95, p.z)); return p;
  }
  function zoneCam(slotKey) {
    const s = SLOT[slotKey], f = new THREE.Vector3(s.f[0], 0, s.f[1]), sp = new THREE.Vector3(s.spot[0], 0, s.spot[1]);
    const side = new THREE.Vector3(-f.z, 0, f.x), portrait = camera.aspect < 0.8;
    const dist = portrait ? 6.2 : 4.8, lat = slotKey === 'G' ? 0 : (portrait ? 2.6 : 1.8);
    camPosT.copy(sp).addScaledVector(f, -dist).addScaledVector(side, s.spot[1] < -10 ? -lat : lat).setY(portrait ? 4.4 : 3.3); clampHall(camPosT);
    camLookT.set(s.obj[0], 0, s.obj[1]).lerp(sp, slotKey === 'G' || slotKey === 'H' ? .55 : .35).setY(slotKey === 'G' ? 2.4 : 1.6);
    mode = 'zone'; camK = 2.6;
  }
  function walkTo(points, done) { path = points.map(p => p.clone()); onArrive = done || null; }
  function routeTo(target) {
    const p = avatar.position; const pts = [];
    if (p.distanceTo(target) > 3.6 && p.distanceTo(HUB) > 1) pts.push(HUB.clone());
    pts.push(target); return pts;
  }

  /* ---------- 主要 API ---------- */
  const api = {
    kind: '3d',
    _dbg: () => ({ x: avatar.position.x, z: avatar.position.z, mode, moving: path.length > 0, floor: floorNow, yaw: orbitYaw, pitch: orbitPitch, dist: orbitDist, cyber: CYBER }),
    setOutfit(eq) { applyOutfit(eq); },
    setSteer(x, y) { steerX = x; steerY = y; if (Math.hypot(x, y) > .08) pokeCam(); },
    setOrbit(o = {}) { if (o.yaw != null) orbitYaw = o.yaw; if (o.pitch != null) orbitPitch = o.pitch; if (o.dist != null) orbitDist = o.dist; pokeCam(); playCam(); camPos.copy(camPosT); camLook.copy(camLookT); },
    holdCam(px, py, pz, lx, ly, lz) {
      mode = 'hold'; camK = 24;
      camPosT.set(px, py, pz); camLookT.set(lx, ly, lz);
      camPos.copy(camPosT); camLook.copy(camLookT);
      labelsEl.style.display = 'none';
    },
    poke: pokeCam,
    idle() { mode = 'orbit'; labelsEl.style.display = 'none'; },
    intro(caption) {
      return new Promise(res => {
        captionCb = caption; introResolve = res; introT = 0; captionStep = -1; mode = 'intro';
        avatar.position.set(0, 0, 13.5); avatar.rotation.y = Math.PI; labelsEl.style.display = 'none';
        speed = 2.25; walkTo([new THREE.Vector3(0, 0, -6.6)], () => { faceTarget = 0; waveT = 1.4; });
      });
    },
    skipIntro() {
      const r = introResolve; introResolve = null; this.enterDirect(); r && r();
    },
    enterDirect() {
      if (floorNow !== hooks.floor()) setFloorVisual(hooks.floor());
      path = []; onArrive = null; speed = 2.6;
      avatar.position.set(0, 0, floorNow === 'lobby' ? -6.6 : -9); avatar.rotation.y = 0; faceTarget = 0;
      if (hooks.outfit) applyOutfit(hooks.outfit());
      overview(); camPos.copy(camPosT); camLook.copy(camLookT); labelsEl.style.display = '';
    },
    go(id) {
      if (mode === 'intro' || mode === 'ride') return;
      const z = hooks.ZONES.find(z => z.id === id); if (!z || z.floor !== floorNow) return;
      document.getElementById('panelClose').click();
      activeZone = id; const s = SLOT[z.slot];
      speed = 2.8; mode = 'follow'; camK = 2.2;
      walkTo(routeTo(new THREE.Vector3(s.spot[0], 0, s.spot[1])), () => {
        faceTarget = Math.atan2(s.f[0], s.f[1]);
        zoneCam(z.slot);
        if (z.slot === 'H') liftWant = 1;
        setTimeout(() => { if (activeZone === id) hooks.open(id); }, 380);
      });
    },
    ride(to, cb) {
      return new Promise(async res => {
        const s = SLOT.H; mode = 'follow'; activeZone = null; labelsEl.style.display = 'none';
        const wait = ms => new Promise(r => setTimeout(r, ms));
        const walkP = pts => new Promise(r => { speed = 2.6; walkTo(pts, r); });
        if (avatar.position.distanceTo(new THREE.Vector3(s.spot[0], 0, s.spot[1])) > .3) await walkP(routeTo(new THREE.Vector3(s.spot[0], 0, s.spot[1])));
        zoneCam('H'); mode = 'ride'; liftWant = 1; await wait(500);
        await walkP([LIFT_IN]); faceTarget = 0; await wait(350);
        liftWant = 0; await wait(700);
        await cb.between();
        setFloorVisual(to); labelsEl.style.display = 'none';
        avatar.position.copy(LIFT_IN); avatar.rotation.y = 0; zoneCam('H'); mode = 'ride'; camPos.copy(camPosT); camLook.copy(camLookT);
        cb.after(); await wait(350);
        liftWant = 1; await wait(650);
        await walkP([new THREE.Vector3(s.spot[0], 0, s.spot[1]), new THREE.Vector3(2.5, 0, -9.5)]);
        liftWant = 0; faceTarget = 0; overview(); labelsEl.style.display = '';
        res();
      });
    },
    onPanel(open, id) {
      panelOpen = open;
      if (!open) { activeZone = null; liftWant = 0; if (mode === 'zone') overview(); }
    },
    setRank(i, name) { drawInd(name); },
    refresh(info) { refresh(info); },
    celebrate(kind) {
      if (kind === 'checkin') { jumpT = .6; burst(new THREE.Vector3(-7.2, 1.8, -3.2)); }
      if (kind === 'fortune') { shakeT = 1.0; }
    },
    dispose() {
      cancelAnimationFrame(raf); removeEventListener('resize', onResize);
      canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('wheel', onWheel);
      removeEventListener('pointerup', onUp); removeEventListener('pointercancel', onUp);
      removeEventListener('keydown', onKey); removeEventListener('keyup', onKey);
      document.removeEventListener('visibilitychange', onVis);
      labelsEl.innerHTML = ''; labelsEl.style.display = '';
      scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
      disposables.forEach(d => d.dispose && d.dispose()); env.dispose(); pmrem.dispose();
      composer && composer.dispose && composer.dispose();
      renderer.renderLists.dispose(); renderer.dispose();
      const ctx = canvas.getContext('webgl2') || canvas.getContext('webgl'); ctx && ctx.clear && ctx.clear(ctx.COLOR_BUFFER_BIT);
    },
  };

  /* ---------- 金幣粒子 ---------- */
  const coins = []; let shakeT = 0;
  const coinGeo = keep(new THREE.CylinderGeometry(.14, .14, .04, 12)), coinMat = glow(C.gold, 1.8);
  function burst(p) { for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(coinGeo, coinMat); m.position.copy(p); m.userData.v = new THREE.Vector3((Math.random() - .5) * 3, 3 + Math.random() * 3, (Math.random() - .5) * 3); m.userData.t = 1.4; scene.add(m); coins.push(m); } }

  /* ---------- 後製光暈（只在電腦） ---------- */
  let composer = null, bloomOn = false;
  if (isDesk) {
    try {
      const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([
        import('three/addons/postprocessing/EffectComposer.js'), import('three/addons/postprocessing/RenderPass.js'),
        import('three/addons/postprocessing/UnrealBloomPass.js'), import('three/addons/postprocessing/OutputPass.js')]);
      composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
      composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), .6, .5, .9)); composer.addPass(new OutputPass());
      composer.setSize(innerWidth, innerHeight); bloomOn = true;
    } catch (e) { console.warn('光暈關閉', e); }
  }

  /* ---------- 互動（拖曳環繞、滾輪／雙指縮放、點地走路） ---------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let downAt = null;
  const onDown = e => {
    if (e.target.closest && e.target.closest('#joy,#zonePrompt,#panel,#dock,#hud,#bakTip')) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    downAt = [e.clientX, e.clientY]; didDrag = false;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };
  const onMove = e => {
    if (!pointers.has(e.pointerId)) return;
    const prev = pointers.get(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (mode === 'intro' || mode === 'ride' || mode === 'orbit') return;
    if (pointers.size === 2 && pinch0) {
      const [a, b] = [...pointers.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
      orbitDist = Math.max(3.6, Math.min(13, orbitDist * (pinch0 / Math.max(20, d)))); pinch0 = d; didDrag = true; pokeCam(); if (mode === 'zone') mode = 'follow'; return;
    }
    const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
    if (Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 8) {
      didDrag = true; orbitDragging = true; pokeCam();
      orbitYaw -= dx * 0.0055; orbitPitch = Math.max(0.16, Math.min(1.15, orbitPitch + dy * 0.004));
      if (mode === 'zone') mode = 'follow';
    }
  };
  const onUp = e => {
    pointers.delete(e.pointerId); orbitDragging = pointers.size > 0; if (pointers.size < 2) pinch0 = 0;
    if (e.type !== 'pointerup' && e.type !== 'pointercancel') return;
    if (!downAt) return;
    const tap = !didDrag && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) <= 8;
    downAt = null; didDrag = false;
    if (!tap || mode === 'intro' || mode === 'ride' || mode === 'orbit') return;
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(hitBoxes.filter(h => h.userData.active), false)[0];
    if (hit) return api.go(hit.object.userData.zone);
    const fh = ray.intersectObject(fl)[0];
    if (fh) { document.getElementById('panelClose').click(); mode = 'follow'; activeZone = null; const p = clampAvatar(fh.point.clone().setY(0)); walkTo([p], () => overview()); }
  };
  const onWheel = e => {
    if (mode === 'intro' || mode === 'ride' || mode === 'orbit') return;
    e.preventDefault(); orbitDist = Math.max(3.6, Math.min(13, orbitDist + e.deltaY * 0.01)); pokeCam(); if (mode === 'zone') mode = 'follow';
  };
  const onKey = e => {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    const k = KEYMAP[e.code]; if (!k) return;
    if (e.type === 'keydown') { held.add(k); pokeCam(); e.preventDefault(); } else held.delete(k);
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  addEventListener('pointerup', onUp); addEventListener('pointercancel', onUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  addEventListener('keydown', onKey); addEventListener('keyup', onKey);
  const onResize = () => {
    camera.aspect = innerWidth / innerHeight; camera.fov = fovFor(); camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false); composer && composer.setSize(innerWidth, innerHeight);
    if (mode === 'overview') overview();
  };
  addEventListener('resize', onResize); onResize();
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); hooks.fallback('立體畫面中斷，已切換為省電平面版'); }, { once: true });

  /* ---------- 效能監控：太慢就降級，再慢就切平面版 ---------- */
  let fpsFrames = 0, fpsTime = 0, fpsLevel = 0, fpsWarm = 0, visible = true;
  const onVis = () => { visible = !document.hidden; fpsFrames = 0; fpsTime = 0; };
  document.addEventListener('visibilitychange', onVis);
  function perf(dt) {
    if (!hooks.autoFallback || !visible) return;
    fpsWarm += dt; if (fpsWarm < 2) return;
    fpsFrames++; fpsTime += dt;
    if (fpsTime >= 3) {
      const fps = fpsFrames / fpsTime; fpsFrames = 0; fpsTime = 0;
      if (fps < 26 && fpsLevel === 0) { fpsLevel = 1; bloomOn = false; renderer.setPixelRatio(1); }
      else if (fps < 24 && fpsLevel === 1) { fpsLevel = 2; renderer.setPixelRatio(.75); }
      else if (fps < 18 && fpsLevel === 2) { fpsLevel = 3; hooks.fallback('偵測到畫面不順，已自動切換為省電平面版'); }
    }
  }

  /* ---------- 主迴圈 ---------- */
  const clock = new THREE.Clock(); let raf = 0, screenT = 0;
  const tmp = new THREE.Vector3(), lerpAng = (a, b, k) => { let d = ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI; return a + d * k; };
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function caption(i, t) { if (captionStep < i) { captionStep = i; captionCb && captionCb(t); } }
  function frame() {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), .05); tAll += dt; perf(dt); FX.t.value = tAll;
    scan.position.z = -((tAll * 3) % (D + 2)) + 1; liftBeam.scale.y = 1 + Math.sin(tAll * 2.4) * .04;
    // 小人移動
    let moving = false;
    if (path.length) {
      const tgt = path[0]; tmp.subVectors(tgt, avatar.position); tmp.y = 0; const d = tmp.length();
      if (d < .05) { path.shift(); if (!path.length) { const cb = onArrive; onArrive = null; cb && cb(); } }
      else { moving = true; const step = Math.min(d, speed * dt); avatar.position.addScaledVector(tmp.normalize(), step); avatar.rotation.y = lerpAng(avatar.rotation.y, Math.atan2(tmp.x, tmp.z), 1 - Math.exp(-dt * 12)); faceTarget = null; }
    } else if (mode !== 'intro' && mode !== 'ride' && mode !== 'orbit') {
      let ix = steerX, iz = steerY;
      if (held.has('u')) iz += 1; if (held.has('d')) iz -= 1; if (held.has('r')) ix += 1; if (held.has('l')) ix -= 1;
      const len = Math.hypot(ix, iz);
      if (len > .08) {
        pokeCam(); const n = Math.min(1, len); ix /= len; iz /= len;
        const fwdX = -Math.sin(orbitYaw), fwdZ = -Math.cos(orbitYaw), rightX = Math.cos(orbitYaw), rightZ = -Math.sin(orbitYaw);
        const dx = (fwdX * iz + rightX * ix) * 2.8 * dt * n, dz = (fwdZ * iz + rightZ * ix) * 2.8 * dt * n;
        avatar.position.x += dx; avatar.position.z += dz; clampAvatar(avatar.position);
        avatar.rotation.y = lerpAng(avatar.rotation.y, Math.atan2(dx, dz), 1 - Math.exp(-dt * 12));
        moving = true; faceTarget = null; if (mode === 'zone') mode = 'follow';
      } else if (faceTarget !== null) avatar.rotation.y = lerpAng(avatar.rotation.y, faceTarget, 1 - Math.exp(-dt * 8));
    } else if (faceTarget !== null) avatar.rotation.y = lerpAng(avatar.rotation.y, faceTarget, 1 - Math.exp(-dt * 8));
    if (hooks.nearZone && mode !== 'intro' && mode !== 'ride' && mode !== 'orbit') {
      let best = null, bd = 2.05;
      (hooks.ZONES || []).forEach(z => { if (z.floor !== floorNow) return; const s = SLOT[z.slot]; if (!s) return; const d = Math.hypot(avatar.position.x - s.spot[0], avatar.position.z - s.spot[1]); if (d < bd) { bd = d; best = z; } });
      const id = best && best.id; if (id !== lastNear) { lastNear = id; hooks.nearZone(best); }
    }
    walkPhase += dt * (moving ? speed * 3.6 : 0);
    const sw = moving ? Math.sin(walkPhase) : 0;
    legs[0].rotation.x = sw * .65; legs[1].rotation.x = -sw * .65;
    arms[0].rotation.x = -sw * .55; arms[1].rotation.x = sw * .55;
    if (waveT > 0) { waveT -= dt; arms[0].rotation.z = -2.5 + Math.sin(tAll * 14) * .35; } else arms[0].rotation.z *= .85;
    body.position.y = moving ? Math.abs(Math.sin(walkPhase)) * .07 : Math.sin(tAll * 2) * .012;
    head.rotation.z = moving ? Math.sin(walkPhase) * .05 : 0;
    if (jumpT > 0) { jumpT -= dt; body.position.y += Math.sin((1 - jumpT / .6) * Math.PI) * .6; }
    // 門
    const near = floorNow === 'lobby' && avatar.position.z < 6.5 && avatar.position.z > -3.2 ? 1 : 0;
    doorOpen += (near - doorOpen) * (1 - Math.exp(-dt * 5));
    doorL.position.x = -.8 - doorOpen * 1.55; doorR.position.x = .8 + doorOpen * 1.55;
    liftOpen += (liftWant - liftOpen) * (1 - Math.exp(-dt * 6));
    liftL.position.x = 6.65 - liftOpen * 1.0; liftR.position.x = 7.75 + liftOpen * 1.0;
    // 裝飾動畫
    beams.forEach((b, i) => { b.rotation.z = Math.sin(tAll * .35 + i * 2) * .35 + (i ? -.15 : .15); b.rotation.x = Math.cos(tAll * .3 + i) * .2; });
    drones.forEach((d, i) => { const a = tAll * (.25 + i * .07) + i * 2.1, r = 16 + i * 4; d.position.set(Math.cos(a) * r, 22 + i * 12 + Math.sin(tAll + i) * 1.5, -8.2 + Math.sin(a) * r); });
    if (CYBER && streetCyber.visible) {
      if (cyberFX.rainArr) {
        const arr = cyberFX.rainArr;
        for (let i = 0; i < cyberFX.rainN; i++) { arr[i * 3 + 1] -= (8 + (i % 5)) * dt; if (arr[i * 3 + 1] < 0) arr[i * 3 + 1] = 26 + Math.random() * 6; }
        cyberFX.rainGeo.attributes.position.needsUpdate = true;
      }
      if ((tAll * 4 | 0) !== ((tAll - dt) * 4 | 0)) cyberFX.boards.forEach(tx => { const cs = tx.userData.cs; if (!cs) return; const last = cs[cs.length - 1]; cs.push(Math.max(80, Math.min(240, last + Math.sin(tAll * 1.3 + cs.length) * 8 + (Math.random() - .5) * 10))); cs.shift();
        const ctx = tx._g, w = 512, h = 320; ctx.fillStyle = 'rgba(8,2,20,.88)'; ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(62,242,255,.7)'; ctx.lineWidth = 3; ctx.strokeRect(6, 6, w - 12, h - 12);
        ctx.strokeStyle = 'rgba(255,77,230,.5)'; ctx.lineWidth = 1; ctx.strokeRect(14, 14, w - 28, h - 28);
        const slot = (w - 40) / cs.length;
        for (let i = 0; i < cs.length; i++) { const o = i ? cs[i - 1] : cs[i], c = cs[i], up = c >= o; ctx.fillStyle = up ? '#ff4de6' : '#3ef2ff'; const top = Math.min(o, c), bot = Math.max(o, c); ctx.fillRect(24 + i * slot + slot * .28, top, slot * .44, Math.max(4, bot - top)); ctx.fillRect(24 + i * slot + slot * .48, top - 12, 2, (bot - top) + 24); }
        tx.needsUpdate = true;
      });
      if (cyberFX.ticker) {
        const ctx = cyberFX.ticker._g, w = 1024, h = 128; ctx.fillStyle = '#0a0416'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#ff4de6'; ctx.fillRect(0, 0, w, 4); ctx.fillRect(0, h - 4, w, 4);
        const marks = ['▲', '▼', '◆', '▲', '▼', '◆']; ctx.font = `900 64px ${FONT}`; ctx.textBaseline = 'middle';
        const off = (tAll * 80) % 280;
        for (let i = -1; i < 12; i++) { const ch = marks[(i + 6) % 6]; ctx.fillStyle = ch === '▲' ? '#ff4de6' : ch === '▼' ? '#3ef2ff' : '#c890ff'; ctx.fillText(ch, i * 140 - off + 40, h / 2); }
        cyberFX.ticker.needsUpdate = true;
      }
      cyberFX.vents.forEach((s, i) => { s.position.y = 1.0 + (tAll * .4 + i) % 1.2; s.material.opacity = .12 + Math.sin(tAll * 2 + i) * .08; });
      cyberFX.trails.forEach((tr, i) => { const a = tAll * (.35 + i * .05) + tr.userData.ph, r = 20 + i * 3; tr.position.set(Math.cos(a) * r, 14 + i * 3 + Math.sin(tAll * 2 + i), 8 + Math.sin(a) * r * .4); tr.rotation.y = a + 1.2; });
      if (logoMesh) logoMesh.scale.setScalar(1 + Math.sin(tAll * 2) * .02);
    }
    beacon.material.color.setRGB(3 * (0.4 + 0.6 * (Math.sin(tAll * 3) > .6)), .3, .5);
    spine.color.setRGB(.4, 1.8 + Math.sin(tAll * 2) * .6, 2 + Math.sin(tAll * 2) * .6);
    ring.rotation.z += dt * .2;
    f5Rings.forEach((r, i) => { r.rotation.x = tAll * (.5 + i * .3); r.rotation.y = tAll * (.4 - i * .2); });
    [zoneObj.guide, zoneObj.cta, zoneObj.cta5].forEach(gz => { gz.userData.spin.rotation.y += dt * 1.2; gz.userData.spin.position.y = 1.9 + Math.sin(tAll * 2) * .08; });
    zoneObj.guess.userData.arrows[0].position.y = 1.7 + Math.sin(tAll * 2) * .12; zoneObj.guess.userData.arrows[1].position.y = 1.5 - Math.sin(tAll * 2) * .12;
    zoneObj.guess.userData.arrows.forEach(a => a.rotation.y += dt);
    if (shakeT > 0) { shakeT -= dt; zoneObj.fortune.userData.shake.rotation.x = Math.sin(tAll * 50) * .05 * shakeT; }
    Object.entries(zoneObj).forEach(([id, g]) => { const r = g.userData.ring; if (r) { r.material.opacity = id === activeZone ? .9 : .28 + Math.sin(tAll * 3) * .12; r.scale.setScalar(id === activeZone ? 1 + Math.sin(tAll * 6) * .06 : 1); } });
    for (let i = coins.length - 1; i >= 0; i--) { const c = coins[i]; c.userData.t -= dt; c.userData.v.y -= 9 * dt; c.position.addScaledVector(c.userData.v, dt); c.rotation.x += dt * 8; if (c.userData.t <= 0) { scene.remove(c); coins.splice(i, 1); } }
    screenT += dt; if (screenT > .25) { screenT = 0; (floorNow === 'insider' ? liveScreens : publicScreens).forEach(t => drawScreen(t, tAll)); }
    // 鏡頭
    if (mode === 'orbit') {
      const a = tAll * .06; camPosT.set(Math.sin(a) * 30 + 4, 7 + Math.sin(tAll * .2) * 1.5, 44 + Math.cos(a) * 8); camLookT.set(0, 26, -8); camK = 1.5;
    } else if (mode === 'intro') {
      introT += dt;
      if (introT < 3.2) {
        const k = ease(Math.min(1, introT / 3.2));
        camPos.set(THREE.MathUtils.lerp(22, 2.2, k), THREE.MathUtils.lerp(30, 3.0, k), THREE.MathUtils.lerp(46, avatar.position.z + 6.4, k));
        camLook.set(0, THREE.MathUtils.lerp(34, 2.6, k), THREE.MathUtils.lerp(-8, avatar.position.z - 3, k));
        camPosT.copy(camPos); camLookT.copy(camLook);
        caption(0, '夜色中的史塔金融大樓');
      } else {
        caption(1, '牛馬準時上班中…');
        if (doorOpen > .2) caption(2, '感應門開啟');
        if (avatar.position.z < -.5) caption(3, '歡迎來到交易大廳');
        camPosT.set(avatar.position.x + .8, 2.8, avatar.position.z + 5.2); camLookT.set(avatar.position.x, 1.5, avatar.position.z - 4); camK = 3.5;
        if (!path.length && waveT < .2 && introResolve) { const r = introResolve; introResolve = null; overview(); labelsEl.style.display = ''; setTimeout(r, 200); }
      }
    } else if (mode === 'follow' || mode === 'overview') {
      if (!panelOpen && !orbitDragging && Math.hypot(steerX, steerY) < .08 && !held.size && !path.length) {
        orbitIdle += dt; if (orbitIdle > 4) orbitYaw += 0.18 * dt;
      } else pokeCam();
      playCam();
    }
    const k = 1 - Math.exp(-dt * camK);
    camPos.lerp(camPosT, k); camLook.lerp(camLookT, k);
    camera.position.copy(camPos); camera.lookAt(camLook);
    // 面板打開時把畫面往上（手機）或往左（電腦）推
    const narrow = innerWidth < 900;
    const vsT = panelOpen && narrow ? .26 : 0, vxT = panelOpen && !narrow ? .14 : 0;
    viewShift += (vsT - viewShift) * k; viewShiftX += (vxT - viewShiftX) * k;
    if (Math.abs(viewShift) > .002 || Math.abs(viewShiftX) > .002) camera.setViewOffset(innerWidth, innerHeight, innerWidth * viewShiftX, innerHeight * viewShift, innerWidth, innerHeight); else camera.clearViewOffset();
    // 標籤
    if (labelsEl.style.display !== 'none') {
      for (const l of labels) {
        tmp.copy(l.anchor).project(camera);
        const vis = tmp.z < 1 && Math.abs(tmp.x) < 1.1 && Math.abs(tmp.y) < 1.1 && !(panelOpen && l.z.id !== activeZone);
        l.el.classList.toggle('hidden', !vis);
        if (vis) l.el.style.transform = `translate(${(tmp.x * .5 + .5) * innerWidth}px,${(-tmp.y * .5 + .5) * innerHeight}px) translate(-50%,-100%)`;
      }
    }
    if (bloomOn && composer) composer.render(); else renderer.render(scene, camera);
  }
  if (hooks.outfit) applyOutfit(hooks.outfit());
  frame();
  return api;
}
