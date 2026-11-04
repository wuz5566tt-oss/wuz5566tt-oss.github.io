// 重慶夜景 · procedural Chongqing night skyline (no external assets)
// addChongqing(T, scene, {z, scale, mobile}) -> update(t)
export function addChongqing(T,S,o={}){
const Z=o.z??-150,K=o.scale??1,mob=!!o.mobile,G=new T.Group();S.add(G);
let sd=20261104;const r=()=>(sd=(sd*16807)%2147483647)/2147483647;
// ---------- sky gradient (deep indigo -> magenta city glow) ----------
{const c=document.createElement('canvas');c.width=4;c.height=512;const g=c.getContext('2d');const gr=g.createLinearGradient(0,0,0,512);
 gr.addColorStop(0,'#03051a');gr.addColorStop(.45,'#0c1440');gr.addColorStop(.7,'#2a1d4e');gr.addColorStop(.86,'#6a2f5a');gr.addColorStop(1,'#d0704a');
 g.fillStyle=gr;g.fillRect(0,0,4,512);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;S.background=t}
if(S.fog){S.fog.near=Math.max(S.fog.near,60);S.fog.far=Math.max(S.fog.far,230);S.fog.color.set(0x1c1838)}
// ---------- skyline layer texture: R=body, G=window, B=seed ----------
function layer(w,h,opt){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 const hill=x=>h*(opt.hillBase+opt.hillAmp*(.5+.5*Math.sin(x/w*Math.PI*opt.hillF+opt.ph))*(.7+.3*Math.sin(x/w*17+opt.ph)));
 g.fillStyle='rgb(255,0,0)';g.beginPath();g.moveTo(0,h);for(let x=0;x<=w;x+=8)g.lineTo(x,h-hill(x));g.lineTo(w,h);g.fill();
 const win=(x,y,bw,bh,dens,ws=opt.ws)=>{for(let yy=y+ws*1.5;yy<y+bh-ws;yy+=ws*2)for(let xx=x+ws;xx<x+bw-ws;xx+=ws*1.8){if(r()>dens)continue;g.fillStyle=`rgb(255,255,${1+(r()*254|0)})`;g.fillRect(xx|0,yy|0,Math.max(1,ws*.9|0),Math.max(1,ws|0))}};
 let x=0;while(x<w){const bw=opt.bw[0]+r()*opt.bw[1],bh=opt.bh[0]+Math.pow(r(),1.6)*opt.bh[1],base=h-hill(x+bw/2)+6,top=base-bh;
  g.fillStyle='rgb(255,0,0)';g.fillRect(x,top,bw,bh+20);
  if(r()<.35){g.beginPath();g.moveTo(x,top);g.lineTo(x+bw/2,top-bw*.5*r());g.lineTo(x+bw,top);g.fill()}         // pointed crown
  if(r()<.25)g.fillRect(x+bw/2-1,top-bh*.18,2,bh*.18);                                                         // antenna
  win(x,top,bw,bh,opt.dens);x+=bw+(r()<.3?r()*opt.gap:0)}
 (opt.extra||(()=>{}))(g,w,h,win,hill);
 const t=new T.CanvasTexture(c);t.magFilter=T.NearestFilter;t.minFilter=T.LinearFilter;t.generateMipmaps=false;return t}
const VS=`varying vec2 vU;varying vec3 vW;void main(){vU=uv;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`;
const HASH=`float h1(float n){return fract(sin(n*127.1)*43758.5453);}`;
const skyMat=(tex,body,haze,lit,warm)=>new T.ShaderMaterial({transparent:true,depthWrite:false,fog:false,
 uniforms:{map:{value:tex},uT:{value:0},body:{value:new T.Color(body)},haze:{value:new T.Color(0x3a2a5a)},hz:{value:haze},lit:{value:lit},warm:{value:warm}},
 vertexShader:VS,fragmentShader:`${HASH}uniform sampler2D map;uniform float uT,hz,lit,warm;uniform vec3 body,haze;varying vec2 vU;
 void main(){vec4 s=texture2D(map,vU);if(s.r<.5)discard;vec3 c=body;
  if(s.g>.5){float sd=s.b*255.;float rate=.04+.12*h1(sd+3.);float st=floor(uT*rate+h1(sd)*9.);float on=step(1.-lit,h1(sd*1.37+st*7.1));
   float tw=.85+.15*sin(uT*(2.+h1(sd)*4.)+sd);vec3 wc=mix(vec3(.62,.82,1.),vec3(1.,.78,.42),step(1.-warm,h1(sd+11.)));
   c=mix(c,wc*1.25*tw,on);}
  float fogk=hz*(1.-smoothstep(.0,.55,vU.y));c=mix(c,haze,fogk);gl_FragColor=vec4(c,1.);}`});
const W0=520*K;
const L=[
 {z:Z-40,w:W0*1.25,h:95*K,y:-2,body:0x0e1030,hz:.65,lit:.35,warm:.45,o:{hillBase:.12,hillAmp:.32,hillF:3,ph:1.3,bw:[18,30],bh:[30,110],dens:.35,gap:14,ws:3}},
 {z:Z-18,w:W0*1.1,h:110*K,y:-2,body:0x0a0b22,hz:.45,lit:.45,warm:.5,o:{hillBase:.06,hillAmp:.22,hillF:4,ph:.4,bw:[22,40],bh:[60,240],dens:.5,gap:10,ws:3.5}},
 {z:Z,w:W0,h:120*K,y:-1,body:0x06071a,hz:.25,lit:.55,warm:.6,o:{hillBase:.04,hillAmp:.14,hillF:2,ph:2.1,bw:[26,46],bh:[80,330],dens:.62,gap:8,ws:4,
  extra:(g,w,h,win,hill)=>{
  }}},
];
const mats=[];
L.forEach((l,i)=>{const tex=layer(4096,1024,l.o),m=skyMat(tex,l.body,l.hz,l.lit,l.warm);mats.push(m);
 const p=new T.Mesh(new T.PlaneGeometry(l.w,l.w/4),m);p.position.set(0,l.y+l.w/8+(o.skyY??0),l.z);p.renderOrder=-10+i;G.add(p)});
// ---------- river (長江 / 嘉陵江) with reflections + shimmer ----------
const rz0=o.riverNear??-100,rz1=Z+4,rd=rz0-rz1;
const river=new T.Mesh(new T.PlaneGeometry(W0*1.6,rd,1,1),new T.ShaderMaterial({fog:false,transparent:false,uniforms:{uT:{value:0}},vertexShader:VS,
 fragmentShader:`${HASH}uniform float uT;varying vec2 vU;varying vec3 vW;
 float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=h1(i.x+i.y*57.),b=h1(i.x+1.+i.y*57.),c=h1(i.x+(i.y+1.)*57.),d=h1(i.x+1.+(i.y+1.)*57.);return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
 void main(){float far=1.-vU.y; vec3 c=mix(vec3(.04,.06,.14),vec3(.16,.10,.26),pow(vU.y,1.5));
  float x=vW.x; float col=floor(x/3.2); float wave=n2(vec2(x*.25,vW.z*1.6+uT*1.2))*.6+n2(vec2(x*.9,vW.z*4.-uT*2.))*.4;
  float streak=step(.5,h1(col))*(.35+.65*smoothstep(.0,1.,vU.y));float sh=smoothstep(.55,.95,wave);
  vec3 lc=mix(vec3(.55,.8,1.),vec3(1.,.72,.38),step(.45,h1(col+5.)));
  c+=lc*streak*sh*(.55+.45*sin(uT*3.+col))*.9;
  c+=vec3(.9,.5,.7)*.10*smoothstep(.6,1.,vU.y)*(.6+.4*wave);
  gl_FragColor=vec4(c,1.);}`}));
river.rotation.x=-Math.PI/2;river.position.set(0,-.55,(rz0+rz1)/2);G.add(river);
// near embankment strip with warm lamp dots
{const g=new T.BoxGeometry(W0*1.6,.6,2);const m=new T.MeshBasicMaterial({color:0x14121c});const e=new T.Mesh(g,m);e.position.set(0,-.3,rz0-1);G.add(e);
 const pg=new T.BufferGeometry(),pp=[];for(let x=-W0*.8;x<W0*.8;x+=3)pp.push(x,.4,rz0-1.9);pg.setAttribute('position',new T.Float32BufferAttribute(pp,3));
 G.add(new T.Points(pg,new T.PointsMaterial({color:0xffc878,size:.9,fog:false})))}
// ---------- cable-stay bridge (千廝門 style) with light strings ----------
{const bz=(rz0+rz1)/2-6,bm=new T.MeshBasicMaterial({color:0xc8282a,fog:false}),lm=new T.LineBasicMaterial({color:0xff6a50,transparent:true,opacity:.75,fog:false});
 const deck=new T.Mesh(new T.BoxGeometry(260,1.2,3),bm);deck.position.set(-30,6,bz);G.add(deck);
 const dl=new T.Mesh(new T.BoxGeometry(260,.25,.2),new T.MeshBasicMaterial({color:0xff4a3a,fog:false}));dl.position.set(-30,5.3,bz+1.6);G.add(dl);
 [-150,40].forEach(tx=>{const tw=new T.Mesh(new T.BoxGeometry(2,36,2),bm);tw.position.set(tx,18,bz);G.add(tw);
  const pts=[];for(let k=1;k<=10;k++){pts.push(new T.Vector3(tx,34,bz+1.1),new T.Vector3(tx-k*5.5,6.5,bz+1.1),new T.Vector3(tx,34,bz+1.1),new T.Vector3(tx+k*5.5,6.5,bz+1.1))}
  G.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(pts),lm))});
 for(let x=-150;x<=100;x+=20){const p=new T.Mesh(new T.BoxGeometry(1.4,6,1.4),bm);p.position.set(x,3,bz);G.add(p)}}
// ---------- light rail (輕軌) on elevated track, passing through ----------
const rail={g:new T.Group(),v:mob?16:22,span:W0*.7};
{const tz=o.trackZ??(rz0-12),ty=o.trackY??11,bm=new T.MeshBasicMaterial({color:0x1c1a2c,fog:false});
 const beam=new T.Mesh(new T.BoxGeometry(W0*1.4,.9,1.2),bm);beam.position.set(0,ty-1.2,tz);G.add(beam);
 for(let x=-W0*.7;x<W0*.7;x+=18){const p=new T.Mesh(new T.BoxGeometry(1,ty,1),bm);p.position.set(x,ty/2-1.6,tz);G.add(p)}
 const c=document.createElement('canvas');c.width=256;c.height=32;const g=c.getContext('2d');g.fillStyle='#d8dde8';g.fillRect(0,0,256,32);g.fillStyle='#c0262a';g.fillRect(0,22,256,4);
 for(let x=10;x<250;x+=22){g.fillStyle='#fff1c8';g.fillRect(x,6,16,12)}const tt=new T.CanvasTexture(c);tt.colorSpace=T.SRGBColorSpace;
 const cm=new T.MeshBasicMaterial({map:tt,fog:false,toneMapped:false});
 for(let k=0;k<6;k++){const car=new T.Mesh(new T.BoxGeometry(7.6,2.2,1.8),cm);car.position.set(-k*8,0,0);rail.g.add(car)}
 const head=new T.PointLight(0xfff0c0,30,28,1.5);head.position.set(5,0,1.5);rail.g.add(head);
 rail.g.position.set(-rail.span,ty+.3,tz);G.add(rail.g)}
// ---------- boats: white lit yachts + colourful river cruise boats ----------
const boats=[],fleet=[];
{const B=(w,h,d,m,x,y,z,p)=>{const k=new T.Mesh(new T.BoxGeometry(w,h,d),m);k.position.set(x,y,z);p.add(k);return k},
  E=c=>new T.MeshBasicMaterial({color:c,fog:false,toneMapped:false});
 const white=E(0xe8ecf2),dark=E(0x1a1c26),win=E(0xffe3a8),blue=E(0xffefd2),red=E(0xffe8c0),grn=E(0xffe8c0);
 function yacht(){const g=new T.Group();
  B(9,1.1,2.4,white,0,0,0,g);const bow=new T.Mesh(new T.ConeGeometry(1.2,2.6,4),white);bow.rotation.z=-Math.PI/2;bow.rotation.x=Math.PI/4;bow.scale.set(1,1,.42/.42);bow.position.set(5.6,0,0);g.add(bow);
  B(5.2,1,2,white,-.6,1,0,g);B(5,.22,2.04,blue,-.6,1.05,0,g);B(2.8,.8,1.7,white,-1.2,1.9,0,g);B(2.6,.25,1.76,win,-1.2,1.95,0,g);
  B(9.2,.08,2.5,win,0,.58,0,g);// deck light line
  for(let k=-4;k<=4;k+=1.6)B(.12,.12,.12,win,k,.7,1.22,g);
  B(.08,1.6,.08,white,-1.2,3,0,g);B(.1,.1,.1,red,-1.2,3.8,0,g);return [g,0xffe6c0]}
 function cruise(col){const g=new T.Group(),lc=E(col);
  B(16,1.4,4,dark,0,0,0,g);B(16.2,.18,4.1,lc,0,.72,0,g);
  B(13,1.3,3.6,dark,-.5,1.4,0,g);B(12.6,.5,3.66,win,-.5,1.45,0,g);B(13.2,.12,3.8,lc,-.5,2.08,0,g);
  B(9,1.1,3,dark,-1,2.6,0,g);B(8.6,.4,3.06,lc,-1,2.65,0,g);B(9.2,.12,3.2,win,-1,3.18,0,g);
  for(let k=-6;k<=6;k+=1.5)B(.2,.2,.2,k%3?lc:win,k,3.4,0,g);return [g,col]}
 const specs=mob?[['y',-40,-42,.5],['y',30,-60,-.4],['y',-8,-78,.3]]:[['y',-60,-42,.5],['y',40,-54,-.4],['y',-20,-72,.35],['y',70,-86,-.45]];
 specs.forEach((s,i)=>{const [g,col]=s[0]=='y'?yacht():cruise(s[1]);const o2=s[0]=='y'?1:2,x=s[o2],z=s[o2+1],v=s[o2+2];
  if(v<0)g.rotation.y=Math.PI;g.scale.setScalar(.8);g.position.set(x,-.35,z);
  const rf=new T.Mesh(new T.PlaneGeometry(3,14),new T.MeshBasicMaterial({color:col,transparent:true,opacity:.18,blending:T.AdditiveBlending,depthWrite:false,fog:false}));rf.rotation.x=-Math.PI/2;rf.position.set(0,-.5,4);rf.scale.x=s[0]=='y'?2.6:4.8;g.add(rf);
  g.userData={v:v*3,lim:110,ph:i*1.7,rf};G.add(g);fleet.push(g)})}
// ---------- twinkling stars ----------
const sg=new T.BufferGeometry(),sp=[],sph=[];for(let i=0;i<(mob?500:1100);i++){sp.push((r()-.5)*700,60+r()*160,Z-60-r()*80);sph.push(r()*100)}
sg.setAttribute('position',new T.Float32BufferAttribute(sp,3));sg.setAttribute('ph',new T.Float32BufferAttribute(sph,1));
const starM=new T.ShaderMaterial({transparent:true,depthWrite:false,fog:false,blending:T.AdditiveBlending,uniforms:{uT:{value:0},px:{value:Math.min(devicePixelRatio,2)}},
 vertexShader:`attribute float ph;uniform float uT,px;varying float a;void main(){a=.35+.65*pow(.5+.5*sin(uT*(.6+fract(ph*.37)*2.4)+ph),3.);vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=(1.2+2.2*fract(ph*.71))*px;gl_Position=projectionMatrix*mv;}`,
 fragmentShader:`varying float a;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(vec3(.85,.9,1.),a*(1.-d*2.));}`});
G.add(new T.Points(sg,starM));
// ---------- drifting soft fog banks ----------
const fogs=[];{const c=document.createElement('canvas');c.width=256;c.height=64;const g=c.getContext('2d');const gr=g.createRadialGradient(128,32,4,128,32,128);gr.addColorStop(0,'rgba(170,150,210,.55)');gr.addColorStop(1,'rgba(170,150,210,0)');g.fillStyle=gr;g.fillRect(0,0,256,64);
 const ft=new T.CanvasTexture(c);for(let i=0;i<(mob?5:9);i++){const m=new T.Mesh(new T.PlaneGeometry(160,26),new T.MeshBasicMaterial({map:ft,transparent:true,opacity:.22+r()*.15,depthWrite:false,fog:false}));
  m.position.set((r()-.5)*400,4+r()*14,rz0-10-r()*(rd+30));m.userData.v=(r()-.5)*2;G.add(m);fogs.push(m)}}
// ---------- update ----------
return t=>{fleet.forEach(b=>{const u=b.userData;b.position.x+=u.v*.016;if(b.position.x>u.lim)b.position.x=-u.lim;if(b.position.x<-u.lim)b.position.x=u.lim;b.position.y=-.35+Math.sin(t*1.1+u.ph)*.06;u.rf.material.opacity=.15+.05*Math.sin(t*2+u.ph)});mats.forEach(m=>m.uniforms.uT.value=t);river.material.uniforms.uT.value=t;starM.uniforms.uT.value=t;
 rail.g.position.x=((t*rail.v+(o.trainPhase??0))%(rail.span*2+60))-rail.span-30;
 boats.forEach(b=>{if(o.boatX){b.position.x=b.userData.x0+Math.sin(t*.05+b.userData.x0)*12}else{b.position.x+=b.userData.v*.016;if(b.position.x>W0*.6)b.position.x=-W0*.6;if(b.position.x<-W0*.6)b.position.x=W0*.6;}b.position.y=-.3+Math.sin(t*1.2+b.position.z)*.08;b.userData.glow.material.opacity=.3+.1*Math.sin(t*2+b.position.z)});
 fogs.forEach(f=>{f.position.x+=f.userData.v*.016;if(Math.abs(f.position.x)>230)f.userData.v*=-1})}}
