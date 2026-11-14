// ---- 코스 테마 ----
const COLS={
  me:{body:'#ffcf1f',dark:'#1f3fae',light:'#7fb6ff',mid:'#d9a90d'},
  r:{body:'#e8433c',dark:'#5a1412',light:'#ffc2b0',mid:'#b8302a'},
  g:{body:'#2fb36a',dark:'#103d24',light:'#c4f1d2',mid:'#228a50'},
  p:{body:'#ef6fb0',dark:'#4c1235',light:'#ffd3ea',mid:'#c4508d'},
};
const BASE={cams:['overview','drone','chase'],sky:'#f1c9a0',fogFar:300,hemiSky:0xffe6c8,hemiGround:0x5a4a30,sun:0xffd9a8,grass:[0.42,0.56,0.28],edge:[0.55,0.4,0.26],road:'#9b6a43',road2:'#93633d',rampCol:'#a97a50',berm:'#7c5332',edge2:'berm',trees:false,tires:false,hills:0,gate:0xff7a1a};
const opt3=x=>()=>make3D(Object.assign({},BASE,x||{}));
const gridLines=(c,x0,x1,y0,y1,step,col,lw)=>{c.strokeStyle=col;c.lineWidth=lw||4;c.beginPath();for(let x=Math.floor(x0/step)*step;x<x1;x+=step){c.moveTo(x,y0);c.lineTo(x,y1);}for(let y=Math.floor(y0/step)*step;y<y1;y+=step){c.moveTo(x0,y);c.lineTo(x1,y);}c.stroke();};
const paintGrid=(bg,line,step,blocks)=>(c,x0,x1,y0,y1)=>{c.fillStyle=bg;c.fillRect(x0,y0,x1-x0,y1-y0);if(blocks){c.fillStyle=blocks;for(let gx=Math.floor(x0/170)*170;gx<x1;gx+=170)for(let gy=Math.floor(y0/170)*170;gy<y1;gy+=170)c.fillRect(gx+10,gy+10,150,150);}gridLines(c,x0,x1,y0,y1,step,line);};
function paintRoom(c,x0,x1,y0,y1){
  c.fillStyle='#b98252';c.fillRect(x0,y0,x1-x0,y1-y0);c.fillStyle='rgba(255,230,190,.08)';for(let y=Math.floor(y0/92)*92;y<y1;y+=92)c.fillRect(x0,y,x1-x0,46);
  c.strokeStyle='rgba(70,40,20,.45)';c.lineWidth=3;c.beginPath();for(let y=Math.floor(y0/46)*46;y<y1;y+=46){c.moveTo(x0,y);c.lineTo(x1,y);const row=Math.round(y/46),off=((row*137)%5)*70;for(let x=Math.floor((x0-off)/350)*350+off;x<x1;x+=350){c.moveTo(x,y);c.lineTo(x,y+46);}}c.stroke();
  c.fillStyle='#dfe3e1';c.fillRect(550,-250,750,800);gridLines(c,550,1300,-250,550,62.5,'#a9b1ae',5);
  c.fillStyle='#4f6b8f';c.fillRect(-700,650,1000,700);c.strokeStyle='#e9d7b0';c.lineWidth=16;c.strokeRect(-660,690,920,620);c.lineWidth=5;c.strokeRect(-630,720,860,560);
  c.fillStyle='rgba(233,215,176,.4)';for(let gx=-560;gx<200;gx+=120)for(let gy=790;gy<1260;gy+=120){c.beginPath();c.moveTo(gx,gy-28);c.lineTo(gx+28,gy);c.lineTo(gx,gy+28);c.lineTo(gx-28,gy);c.fill();}
}
function paintBeach(c,x0,x1,y0,y1){
  c.fillStyle='#ecd6a4';c.fillRect(x0,y0,x1-x0,y1-y0);
  for(let i=0;i<900;i++){const x=x0+((i*733)%1000)/1000*(x1-x0),y=y0+((i*397)%1000)/1000*(y1-y0);c.fillStyle=i%3?'rgba(190,150,90,.18)':'rgba(255,255,255,.25)';c.fillRect(x,y,8,8);}
  c.fillStyle='#d9bd85';c.beginPath();c.moveTo(x0,880);for(let x=x0;x<=x1;x+=40)c.lineTo(x,880-Math.sin(x*0.004)*40);c.lineTo(x1,y1);c.lineTo(x0,y1);c.fill();
  c.strokeStyle='rgba(255,255,255,.9)';c.lineWidth=12;c.beginPath();for(let x=x0;x<=x1;x+=40){const y=925-Math.sin(x*0.004)*40;x===x0?c.moveTo(x,y):c.lineTo(x,y);}c.stroke();
}
function paintGarden(c,x0,x1,y0,y1){
  for(let x=Math.floor(x0/120)*120;x<x1;x+=120){c.fillStyle=(x/120)%2?'#6fae4e':'#64a347';c.fillRect(x,y0,120,y1-y0);}
  const beds=[[200,200,110],[1150,250,120],[1000,1050,100],[0,850,90],[1700,350,90],[-600,1100,100]];
  for(const b of beds){c.fillStyle='#7a5636';c.beginPath();c.arc(b[0],b[1],b[2],0,TAU);c.fill();for(let k=0;k<14;k++){c.fillStyle=['#f2667a','#ffd34d','#b86ee8','#ffffff'][k%4];c.beginPath();c.arc(b[0]+Math.cos(k*2.4)*b[2]*0.6,b[1]+Math.sin(k*2.4)*b[2]*0.6,12,0,TAU);c.fill();}}
  c.fillStyle='#5fa3d6';c.beginPath();c.ellipse(650,720,110,70,0,0,TAU);c.fill();c.strokeStyle='#9fc9e8';c.lineWidth=10;c.stroke();
}
function paintHarbor(c,x0,x1,y0,y1,T){
  c.fillStyle='#4a515c';c.fillRect(x0,y0,x1-x0,y1-y0);
  c.fillStyle='rgba(255,255,255,.035)';for(let x=Math.floor(x0/160)*160;x<x1;x+=320)c.fillRect(x,y0,160,y1-y0);
  c.strokeStyle='rgba(20,22,26,.5)';c.lineWidth=3;gridLines(c,x0,x1,y0,y1,160,'rgba(20,22,26,.45)',3);
  c.strokeStyle='rgba(242,194,48,.55)';c.lineWidth=8;c.setLineDash([60,40]);for(const y of[-420,1200]){c.beginPath();c.moveTo(x0,y);c.lineTo(x1,y);c.stroke();}c.setLineDash([]);
  c.fillStyle='rgba(242,194,48,.35)';for(let x=Math.floor(x0/300)*300;x<x1;x+=300)for(const y of[-520,1150])c.fillRect(x+20,y,180,24);
  const cn=T.canal;if(cn){c.fillStyle='#24384a';c.fillRect(cn[0]-30,y0,cn[1]-cn[0]+60,280-y0);c.fillStyle='#2a6f9a';c.fillRect(cn[0]-14,y0,cn[1]-cn[0]+28,266-y0);c.fillStyle='#7a828c';c.fillRect(cn[0]-30,266,cn[1]-cn[0]+60,14);}
  c.fillStyle='#7a828c';c.fillRect(x0,T.shore-30,x1-x0,30);c.fillStyle='#f2c230';for(let x=Math.floor(x0/120)*120;x<x1;x+=120)c.fillRect(x+40,T.shore-24,18,18);
}
const BOOKS=['#c0392b','#2e6da4','#e2b33c','#3c8d5a','#7d4ea3'];
const THUMB=(bg,road,edge,pat)=>({bg,road,edge,pat});
const VARIANTS=[
 {id:'park',name:'흙길 RC 파크',view:'테이블탑 · 더블 점프',desc:'RC 전용 흙길. 테이블탑과 더블 점프, 범프 구간이 이어지는 기본 코스예요.',tags:['흙길','점프 4곳','2랩'],dust:'#8b6a46',puff:'#b48a62',th:THUMB('#6f9a4c','#a5764c','#6a4529'),
  R:opt3({cams:['overview','drone','chase','stand'],stand:[420,1230,190],standMesh:true,trees:true,tires:true,hills:0.6})},
 {id:'arcade',name:'방구 클래식',view:'직각 코너 미로 시티',desc:'오락실 방구차의 파란 미로 도시. 직각 코너가 이어져서 드리프트로 꺾어야 빨라요.',tags:['아스팔트','직각 코너','2랩'],dust:'#8792c9',puff:'#ffd6e8',th:THUMB('#0c1230','#cfd3e6','#e8433c','grid'),
  R:opt3({sky:'#0c1230',fogFar:600,hemiSky:0x8fa6ff,hemiGround:0x101830,sun:0xcfd8ff,hemiI:0.55,sunI:0.6,paint:paintGrid('#0c1230','#1a2560',170,'#141d52'),maze:true,edge2:'kerb',gate:0xffcf1f,
   roadFn:(i,P,T)=>i<2?(i%2?'#111':'#fff'):`rgb(${lerp(70,222,P[i].z/T.maxZ)|0},${lerp(76,190,P[i].z/T.maxZ)|0},${lerp(98,104,P[i].z/T.maxZ)|0})`})},
 {id:'toy',name:'장난감 8자 트랙',view:'입체교차 다리',desc:'책상 위 플라스틱 8자 트랙. 가운데서 다리가 길을 넘어가고, 난간이 없어 밀리면 떨어져요.',tags:['플라스틱','8자 다리','3랩'],dust:'#c9c2a5',puff:'#ffffff',th:THUMB('#a8dcc1','#f0d8a6','#e8433c','grid'),
  R:opt3({sky:'#dff1e7',fogFar:700,hemiSky:0xffffff,hemiGround:0x7fae95,sun:0xfff6e6,hemiI:0.5,sunI:0.55,paint:paintGrid('#a8dcc1','#8fcbab',200),edge2:'plastic',gate:0xe8433c,
   roadFn:i=>i<2?(i%2?'#222':'#fbfbf6'):(i%2?'#f0d8a6':'#ecd29c')})},
 {id:'hill',name:'산악 터널 서킷',view:'고저차 · 산 터널',desc:'산을 오르내리는 아스팔트 서킷. 정상 크레스트에서 차가 뜨고, 산허리 돌 터널을 통과해요.',tags:['아스팔트','터널','2랩'],dust:'#c9c2a5',puff:'#dcd6cc',th:THUMB('#5f9a4a','#45474c','#e8433c'),
  R:opt3({sky:'#a9d2ec',fogFar:500,hemiSky:0xdff0ff,hemiGround:0x4a6a3a,sun:0xfff2d8,grass:[0.36,0.6,0.3],edge:[0.55,0.5,0.38],road:'#3f4146',road2:'#45474c',rampCol:'#55585e',edge2:'kerb',trees:true,hills:1,gate:0x1f3fae,tunnel:{wall:0x8a8072,roof:0x6d6458,portal:0xa89d8e}})},
 {id:'room',name:'거실 테이프 코스',view:'마루 · 러그 · 소파 터널',desc:'마스킹테이프로 그린 거실 코스. 바닥마다 미끄러짐이 다르고, 소파 밑 터널과 낮잠 자는 고양이가 있어요.',tags:['노면 3종','소파 터널','3랩'],dust:'#c9b9a5',puff:'#d9cfc2',th:THUMB('#b98252','#b98252','#ecdca9'),
  R:opt3({sky:'#2a1c12',fogFar:700,hemiSky:0xfff0dc,hemiGround:0x6b4a2e,sun:0xffe2b8,paint:paintRoom,edge2:'tape',gate:0xecdca9,tunnel:{wall:0x3e5f8a,roof:0x4a6fa0,portal:0x2f4a70,ribs:true},
   roadFn:(i,P)=>{const a=P[i],h=a.z-a.zb;if(i<2)return i%2?'#222':'#ecdca9';if(h>1.5)return BOOKS[Math.floor(h/7)%BOOKS.length];return null;}})},
 {id:'snow',name:'눈길 지그재그',view:'헤어핀 내리막 · 빙판',desc:'눈 덮인 산을 지그재그로 내려가요. 헤어핀 세 개와 반짝이는 빙판에서 아주 잘 미끄러져요.',tags:['눈길','빙판','2랩'],dust:'#ffffff',puff:'#ffffff',th:THUMB('#e9eff5','#8fa3ba','#c9d6e3'),
  R:opt3({sky:'#cfe3f3',fogFar:420,hemiSky:0xf2f8ff,hemiGround:0x8aa0b8,sun:0xffffff,hemiI:0.7,sunI:0.7,grass:[0.9,0.93,0.97],edge:[0.82,0.86,0.92],road:'#8fa3ba',road2:'#899db4',rampCol:'#9fb2c7',berm:'#c9d6e3',trees:'snow',hills:0.7,gate:0x2f6ad6})},
 {id:'beach',name:'해변 모래 언덕',view:'S자 해안선 · 모래 점프',desc:'바닷가를 따라 S자로 휘어지는 모래길. 모래 언덕 점프가 있고, 바다로 빠지면 확 느려져요.',tags:['모래','점프 2곳','3랩'],dust:'#e6cf9e',puff:'#f3e3bf',th:THUMB('#ecd6a4','#dcbb85','#b99560','sea'),
  R:opt3({sky:'#bfe4f2',fogFar:520,hemiSky:0xffffff,hemiGround:0xc9b07a,sun:0xfff3d6,hemiI:0.65,sunI:0.75,paint:paintBeach,sea:0x2f9fc9,road:'#e3c48f',road2:'#dcbb85',rampCol:'#e9cf9f',berm:'#c9a871',trees:'palm',treeCount:30,gate:0xff5a5a})},
 {id:'canyon',name:'붉은 협곡',view:'바위 벽 협곡 · 아치 터널',desc:'굽이치는 협곡 길. 양옆이 가파른 바위 벽이라 부딪히면 퉁 하고 막히고, 붉은 바위 아치 터널을 지나가요.',tags:['바위 벽','바위 터널','2랩'],dust:'#c27a4a',puff:'#d99a6c',th:THUMB('#a8532f','#c0703f','#7a3a1f'),
  R:opt3({sky:'#f3c08a',fogFar:460,hemiSky:0xffe2c2,hemiGround:0x7a3a20,sun:0xffd4a0,grass:[0.74,0.42,0.25],edge:[0.66,0.36,0.22],rock:[0.55,0.27,0.16],terrRes:240,road:'#c0703f',road2:'#b8683a',rampCol:'#cc7d4a',berm:'#8f4a28',trees:'cactus',treeCount:40,gate:0xffcf1f,tunnel:{wall:0x9a4a2a,roof:0x8a3f22,portal:0xb35a34}})},
 {id:'garden',name:'뒷마당 정원',view:'급커브 · 화분 · 호스',desc:'꽃밭 사이 돌길을 도는 짧은 급커브 코스. 화분과 물뿌리개를 피하고 호스 턱을 넘어요.',tags:['돌길','급커브','2랩'],dust:'#9c8f78',puff:'#e8f3df',th:THUMB('#6fae4e','#bdb6a8','#9b4b35'),
  R:opt3({sky:'#cfe9f7',fogFar:520,hemiSky:0xffffff,hemiGround:0x4f8a3a,sun:0xfff4dc,hemiI:0.65,sunI:0.75,paint:paintGarden,road:'#bdb6a8',road2:'#aaa396',rampCol:'#c9c2b4',edge2:'brick',trees:'bush',treeCount:45,gate:0x2f9e5b,
   roadFn:(i,P)=>i<2?(i%2?'#222':'#fff'):(P[i].z-P[i].zb>2?'#d3ccbd':['#bdb6a8','#b1aa9c','#c4bdae'][i%3])})},
 {id:'site',name:'공사장 점프',view:'구덩이 점프 · 파이프 터널',desc:'높은 흙더미 위를 달리다 구덩이를 뛰어넘고, 커다란 파이프 속을 통과하는 공사장 코스.',tags:['자갈','구덩이 점프','2랩'],dust:'#8d8273',puff:'#cfc6b6',th:THUMB('#9a8b70','#8f877a','#f2c230'),
  R:opt3({sky:'#e9d9b8',fogFar:460,hemiSky:0xfff2dc,hemiGround:0x6a5a40,sun:0xffe0b0,grass:[0.6,0.54,0.42],edge:[0.5,0.44,0.34],road:'#8f877a',road2:'#857d70',rampCol:'#9d9586',edge2:'hazard',trees:'piles',treeCount:24,gate:0xf2c230,tunnel:{wall:0xd9822b,roof:0xe0913a,portal:0xb86a1e,ribs:true}})},
 {id:'harbor',name:'항구 컨테이너 부두',view:'도개교 점프 · 컨테이너 터널',desc:'불 켜진 밤 항구. 들린 도개교로 운하를 뛰어넘고, 쌓인 컨테이너 속 터널을 지나요. 젖은 철판 구간은 아주 미끄러워요.',tags:['아스팔트·철판','도개교 점프','3랩'],dust:'#8a919c',puff:'#c9d2de',th:Object.assign(THUMB('#4a515c','#2f333a','#f2c230','sea'),{sea:'#1f4a6e'}),
  R:opt3({sky:'#1b2742',fogFar:560,hemiSky:0x9fb2e0,hemiGround:0x2a2a32,sun:0xffc988,hemiI:0.8,sunI:0.7,paint:paintHarbor,sea:0x1f4a6e,road:'#33373e',road2:'#2f333a',rampCol:'#c9a227',edge2:'dock',trees:'port',treeCount:40,lamps:true,gate:0xf2c230,
   tunnel:{wall:0xb8432f,roof:0x3a3f47,portal:0x2e6da4,ribs:true},
   roadFn:(i,P,T)=>{const a=P[i];if(i<2)return i%2?'#222':'#f4f4f4';if(a.z<-4)return null;if(a.z-a.zb>2)return i%2?'#c9a227':'#b8921f';for(const r of T.steel)if(a.x>r[0]&&a.x<r[1]&&a.y>r[2]&&a.y<r[3])return i%2?'#7d8590':'#6f7781';return i%6<3?'#33373e':'#2f333a';}})},
];
const VI=Object.fromEntries(VARIANTS.map((v,i)=>[v.id,i]));
const trackCache={};function getTrack(id){return trackCache[id]||(trackCache[id]=buildTrack(COURSES[id]));}
const HINT='왼손 W 가속 · S 브레이크 · Space 방구 · Shift 드리프트 / 오른손 ← → 조향. V는 차 안 시점, C는 시점 전환.';

// ---- 기록 저장 (계정 저장소, 없으면 이 브라우저) ----
const REC={data:{},db:null,uid:null,where:'local',
  load(){try{const s=localStorage.getItem('rcgp-records');if(s)this.data=JSON.parse(s)||{};}catch(_){}},
  saveLocal(){try{localStorage.setItem('rcgp-records',JSON.stringify(this.data));}catch(_){}},
  merge(a,b){if(!a)return b;if(!b)return a;const best=[a.best,b.best].filter(x=>x!=null);const hist=[...(a.hist||[]),...(b.hist||[])];const seen=new Set();
    const h=hist.filter(x=>{const k=x.d+'|'+x.t;if(seen.has(k))return false;seen.add(k);return true;}).sort((x,y)=>y.d-x.d).slice(0,8);
    const bs=Math.max(a.bestScore||0,b.bestScore||0);
    return{best:best.length?Math.min(...best):null,bestLap:Math.min(a.bestLap??1e9,b.bestLap??1e9),bestScore:bs,bestGrade:gradeOf(bs),plays:Math.max(a.plays||0,b.plays||0),hist:h};},
  async init(onReady){this.load();onReady();
    try{if(!window.claude||!window.claude.use)return;const[db,user]=await Promise.all([claude.use('db'),claude.use('user')]);if(!db||!user)return;const id=await user.id();if(!id)return;
      this.db=db;this.uid=id;this.where='account';
      const snap=await Promise.race([db.collection('data/users/'+id).get(),new Promise((_,rj)=>setTimeout(()=>rj('timeout'),10000))]);
      for(const d of snap.docs){const v=d.data();if(v&&VI[d.id]!=null)this.data[d.id]=this.merge(this.data[d.id],v);}
      this.saveLocal();onReady();}catch(_){if(!this.db)this.where='local';onReady();}},
  add(id,run){const r=this.data[id]||{best:null,bestLap:null,bestScore:0,bestGrade:null,plays:0,hist:[]};
    const isBest=r.best==null||run.t<r.best;
    r.plays=(r.plays||0)+1;if(isBest)r.best=run.t;if(r.bestLap==null||run.lap<r.bestLap)r.bestLap=run.lap;if(run.score>(r.bestScore||0)){r.bestScore=run.score;r.bestGrade=run.g;}
    r.hist=[{t:run.t,g:run.g,p:run.p,d:Date.now()},...(r.hist||[])].slice(0,8);this.data[id]=r;this.saveLocal();
    if(this.db)this.db.collection('data/users/'+this.uid).doc(id).set(r).catch(()=>{});
    return{rec:r,isBest};}
};

// ---- 오디오 ----
const AU={on:true,C:null,
  init(){if(this.C){this.C.resume&&this.C.resume();return;}const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const C=new AC();this.C=C;
    const mst=C.createGain();mst.gain.value=this.on?0.5:0;mst.connect(C.destination);this.mst=mst;
    const o1=C.createOscillator(),o2=C.createOscillator(),f=C.createBiquadFilter(),g=C.createGain(),wg=C.createGain();o1.type='sawtooth';o2.type='sine';f.type='lowpass';f.frequency.value=900;g.gain.value=0;wg.gain.value=0;
    o1.connect(f);f.connect(g);o2.connect(wg);g.connect(mst);wg.connect(mst);o1.start();o2.start();
    const nb=C.createBuffer(1,C.sampleRate,C.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    const ns=C.createBufferSource();ns.buffer=nb;ns.loop=true;const bp=C.createBiquadFilter();bp.type='bandpass';bp.frequency.value=2200;bp.Q.value=0.7;const ng=C.createGain();ng.gain.value=0;ns.connect(bp);bp.connect(ng);ng.connect(mst);ns.start();
    Object.assign(this,{o1,o2,g,wg,ng,bp});},
  update(p,quiet){if(!this.C)return;const t=this.C.currentTime,sp=p.speed,q=quiet?0.35:1;
    this.o1.frequency.setTargetAtTime(55+sp*0.42+(p.gas?18:0),t,0.06);this.o2.frequency.setTargetAtTime(300+sp*2.4,t,0.06);
    this.g.gain.setTargetAtTime((0.03+(p.gas?0.05:0.015))*q,t,0.08);this.wg.gain.setTargetAtTime((0.008+sp/560*0.025)*q,t,0.08);
    const sk=p.drift?Math.min(1,Math.abs(p.vL)/220)*(p.surf.grip<4?0.07:0.13)*q:0;this.bp.frequency.setTargetAtTime(p.surf.grip<4?900:2200,t,0.1);this.ng.gain.setTargetAtTime(sk,t,0.05);},
  thump(v){if(!this.C)return;const C=this.C,o=C.createOscillator(),g=C.createGain(),t=C.currentTime;o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(40,t+0.2);g.gain.setValueAtTime(Math.min(0.5,v/1200),t);g.gain.exponentialRampToValueAtTime(0.001,t+0.25);o.connect(g);g.connect(this.mst);o.start(t);o.stop(t+0.3);},
  fart(){if(!this.C)return;const C=this.C,t=C.currentTime,o=C.createOscillator(),lfo=C.createOscillator(),lg=C.createGain(),f=C.createBiquadFilter(),g=C.createGain();o.type='sawtooth';o.frequency.setValueAtTime(95,t);o.frequency.exponentialRampToValueAtTime(48,t+0.6);lfo.frequency.value=28;lg.gain.value=22;lfo.connect(lg);lg.connect(o.frequency);f.type='lowpass';f.frequency.value=420;f.Q.value=6;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.45,t+0.03);g.gain.exponentialRampToValueAtTime(0.0001,t+0.65);o.connect(f);f.connect(g);g.connect(this.mst);o.start(t);lfo.start(t);o.stop(t+0.7);lfo.stop(t+0.7);},
  fanfare(){if(!this.C)return;const C=this.C,t=C.currentTime;[523,659,784,1047].forEach((f,i)=>{const o=C.createOscillator(),g=C.createGain();o.type='square';o.frequency.value=f;g.gain.setValueAtTime(0.0001,t+i*0.12);g.gain.exponentialRampToValueAtTime(0.12,t+i*0.12+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t+i*0.12+(i===3?0.6:0.18));o.connect(g);g.connect(this.mst);o.start(t+i*0.12);o.stop(t+i*0.12+0.7);});},
  crash(j){if(!this.C)return;const C=this.C,t=C.currentTime;if(this._ct&&t-this._ct<0.12)return;this._ct=t;const b=C.createBuffer(1,C.sampleRate*0.25|0,C.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);const src=C.createBufferSource();src.buffer=b;const f=C.createBiquadFilter();f.type='bandpass';f.frequency.value=1400;f.Q.value=0.8;const g=C.createGain();g.gain.value=Math.min(0.6,j/500);src.connect(f);f.connect(g);g.connect(this.mst);src.start(t);},
  silence(){if(!this.C)return;const t=this.C.currentTime;this.g.gain.setTargetAtTime(0,t,0.05);this.wg.gain.setTargetAtTime(0,t,0.05);this.ng.gain.setTargetAtTime(0,t,0.05);},
  toggle(){this.on=!this.on;if(this.mst)this.mst.gain.value=this.on?0.5:0;}
};

// ---- 게임 ----
const $=s=>document.querySelector(s);
const keys={};let G=null,REND=null,last=0,acc=0,raf=0,resTimer=0;const touch={l:0,r:0,g:0,b:0,h:0,p:0};
const REC_DT=1/30,RF=11;

function startGame(vi,ci){
  if(ci==null)ci=SEL.car;const CAR=CARS[ci],V=VARIANTS[vi],T=getTrack(V.id),N=T.p.length;closeGarage();
  const sp=Math.max(2,Math.round(50/(T.L/N)));
  const others=CARS.filter((_,i)=>i!==ci),pick=[others[(vi)%others.length],others[(vi+1)%others.length],others[(vi+2)%others.length]];
  const grid=[[pick[0],0.97],[pick[1],0.95],[CAR,0],[pick[2],0.92]];
  const cars=grid.map((d,k)=>makeCar(T,Math.round(N-2-(k>>1)*sp*1.4),k%2?-45:45,d[0].col,k!==2,d[1]));
  grid.forEach((d,k)=>{cars[k].kind=d[0].kind;cars[k].name=k===2?('나 · '+CAR.name):d[0].name;});
  const pc=cars[2];Object.assign(pc,{power:CAR.power,top:CAR.top,gripM:CAR.grip,mass:CAR.mass,boostM:CAR.boost,offM:CAR.offM,susp:CAR.susp,kind:CAR.kind});
  G={V,vi,ci,T,cars,player:cars[2],parts:[],skids:[],t:0,state:'count',count:3.4,shake:0,order:[],rec:[],recAcc:0,ranks:[],finishShow:0};
  clearInterval(resTimer);
  $('#menu').hidden=true;$('#mmenu').hidden=true;$('#verBtn').hidden=true;$('#stage').hidden=false;$('#result').hidden=true;$('#replayUI').hidden=true;$('#hud').hidden=false;$('#touch').classList.remove('off');touch.g=0;$('#tZone').classList.remove('on');$('#view').innerHTML='';
$('#hint').textContent=(matchMedia('(pointer:coarse)').matches?'화면 아무 곳이나 누르고 있으면 전진 · ◀ ▶ 조향 · 방구 버튼으로 부스터':HINT)+(innerHeight>innerWidth?' 휴대폰을 가로로 돌리면 코스가 크게 보여요.':'');$('#hint').hidden=false;
  REND=V.R();REND.init($('#view'),G);syncCamBtns();hudInit(G);$('#pauseOv').hidden=true;
  AU.init();last=performance.now();acc=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);
}
function stopGame(){cancelAnimationFrame(raf);clearInterval(resTimer);if(REND)REND.dispose();const vi=G?G.vi:null;REND=null;G=null;AU.silence();$('#stage').hidden=true;$('#menu').hidden=false;$('#mmenu').hidden=false;$('#verBtn').hidden=false;renderCards();if(vi!=null)ttGo(vi,true);
  if(vi!=null){const el=document.getElementById('card-'+VARIANTS[vi].id);if(el){el.scrollIntoView({block:'center'});el.classList.add('just');setTimeout(()=>el.classList.remove('just'),1800);}}}
function playerInput(){return{steer:((keys.ArrowRight||keys.KeyD||touch.r)?1:0)-((keys.ArrowLeft||keys.KeyA||touch.l)?1:0),gas:!!(keys.KeyW||keys.ArrowUp||touch.g),brake:!!(keys.KeyS||keys.ArrowDown||touch.b),hand:!!(keys.ShiftLeft||keys.ShiftRight||touch.h),boost:!!(keys.Space||touch.p)};}
function fireBoost(c){if(c.gauge<0.333||c.boostT>0)return false;c.gauge=Math.max(0,c.gauge-1/3);c.boostT=0.9;c.boosts++;const fx=Math.cos(c.h),fy=Math.sin(c.h);for(let k=0;k<10;k++)puff(c.x-fx*20,c.y-fy*20,c.z+6,'#c9c46a',14+k,1.4,-fx*120+(Math.random()-0.5)*90,-fy*120+(Math.random()-0.5)*90,25,c);if(c===G.player){AU.fart();bang(Math.random()<0.5?'뿡!':'뿌우웅!');G.shake=Math.max(G.shake,8);}return true;}
function bang(t){const b=$('#bang');b.textContent=t;b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop');}
function puff(x,y,z,col,r,life,vx,vy,vz,o){if(G.parts.length>220)G.parts.shift();G.parts.push({x,y,z,col,r,life,max:life,vx:vx||0,vy:vy||0,vz:vz||0,gr:r*1.4,o});}
function carFx(g,c){
  const fx=Math.cos(c.h),fy=Math.sin(c.h);
  if(c.drift&&Math.random()<0.55){const s=Math.random()<0.5?1:-1;puff(c.x-fx*16-fy*10*s,c.y-fy*16+fx*10*s,c.z+3,g.V.puff,10,0.9,c.vx*0.1,c.vy*0.1,20,c);}
  if(c.boostT>0&&Math.random()<0.7)puff(c.x-fx*20,c.y-fy*20,c.z+6,'#c9c46a',12,1.1,-fx*60,-fy*60,15,c);
  if(c.off&&!c.air&&c.speed>140&&Math.random()<0.3)puff(c.x-fx*16,c.y-fy*16,c.z+2,g.V.dust,8,0.7,0,0,10,c);
}
function update(dt){
  const g=G,T=g.T;
  if(g.state==='replay'){replayStep(dt);return;}
  if(g.state==='count'){g.count-=dt;if(g.count<=0.4){g.state='race';g.t=0;}}
  const racing=g.state==='race',running=racing||g.state==='done';if(running)g.t+=dt;
  const pin=playerInput();if(pin.boost&&!g.pb&&racing)fireBoost(g.player);g.pb=pin.boost;
  for(const c of g.cars){
    const auto=c.isAI||c.done,inp=auto?aiInput(c,T,g.t):pin;
    if(running){c.gauge=Math.min(1,c.gauge+dt*0.07);if(c.isAI&&c.speed>220&&c.gauge>0.9&&Math.random()<0.004)fireBoost(c);}
    stepCar(c,inp,dt,T,running);
    if(lapTick(c,T,g.t))g.order.push(c);
    if(c.drift)c.driftT+=dt;if(c.air)c.maxAir=Math.max(c.maxAir,c.airT);
    carFx(g,c);
    if(c.land>160){for(let k=0;k<8;k++){const a=Math.random()*TAU;puff(c.x,c.y,c.z+2,g.V.puff,10,1,Math.cos(a)*90,Math.sin(a)*90,30,c);}if(c===g.player){g.shake=Math.min(30,c.land/18);AU.thump(c.land);}}
    if(c.bump>120&&c===g.player){g.shake=Math.max(g.shake,c.bump/30);AU.thump(c.bump*0.6);}
    c.land=0;c.bump=0;
  }
  collideCars(g.cars);
  for(const c of g.cars){if(c.hitJ>70){const n=Math.min(10,2+c.hitJ/40|0);for(let k=0;k<n;k++){const a=Math.random()*TAU,v=60+Math.random()*120;puff(c.hitX,c.hitY,c.z+10,k%2?'#fff3a6':'#ffffff',5+Math.random()*4,0.45,Math.cos(a)*v,Math.sin(a)*v,40);}
      if(c===g.player){g.shake=Math.max(g.shake,Math.min(26,c.hitJ/14));AU.thump(c.hitJ*1.4);AU.crash(c.hitJ);if(c.hitJ>170)bang('쾅!');}}c.hitJ=0;}
  for(const q of g.parts){q.life-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.z+=q.vz*dt;q.r+=q.gr*dt;q.vx*=0.96;q.vy*=0.96;}
  g.parts=g.parts.filter(q=>q.life>0);
  g.shake*=Math.exp(-dt*9);
  if(racing){g.recAcc+=dt;if(g.recAcc>=REC_DT){g.recAcc-=REC_DT;record(g);}}
  const p=g.player;
  if(p.done&&g.state==='race'){g.state='done';g.doneAt=g.t;record(g);AU.fanfare();}
  if(g.state==='done'&&g.t-g.doneAt>2.2)startReplay();
}

// ---- 기록 + 리플레이 ----
function record(g){const f=new Float32Array(g.cars.length*RF+2);f[0]=g.t;f[1]=rankOf(g.player);
  g.cars.forEach((c,k)=>{const o=2+k*RF;f[o]=c.x;f[o+1]=c.y;f[o+2]=c.z;f[o+3]=c.h;f[o+4]=c.gp;f[o+5]=c.gr;f[o+6]=c.pitch;f[o+7]=c.roll;f[o+8]=c.steer;f[o+9]=c.dist;
    f[o+10]=(c.drift?1:0)|(c.boostT>0?2:0)|(c.air?4:0)|(c.off?8:0);});g.rec.push(f);}
function pickHighlight(g){
  const R=g.rec,n=R.length,pi=2+g.cars.indexOf(g.player)*RF,win=Math.round(10/REC_DT);
  if(n<=win)return[0,n-1];
  const sc=R.map((f,i)=>{const fl=f[pi+10];let s=(fl&4?3:0)+(fl&2?1.5:0)+(fl&1?1:0);if(i>0&&R[i-1][1]>f[1])s+=25;if(i>0&&(R[i-1][pi+10]&4)&&!(fl&4))s+=6;return s;});
  let sum=0,best=-1,bi=0;for(let i=0;i<n;i++){sum+=sc[i];if(i>=win)sum-=sc[i-win];if(i>=win-1&&sum>best){best=sum;bi=i-win+1;}}
  return[bi,bi+win-1];
}
function startReplay(){
  const g=G;if(!g.hl)g.hl=pickHighlight(g);
  g.state='replay';g.rp={i:g.hl[0],f:0,t:0,theta:Math.random()*TAU,cut:true,len:g.hl[1]-g.hl[0]};g.parts=[];g.shake=0;
  REND.setMode('replay');syncCamBtns();
  $('#hud').hidden=true;$('#touch').classList.add('off');$('#result').hidden=true;$('#replayUI').hidden=false;$('#count').textContent='';clearInterval(resTimer);
  applyFrame(g,g.hl[0],0);
}
function applyFrame(g,i,f){const A=g.rec[i],B=g.rec[Math.min(i+1,g.hl[1])];
  g.cars.forEach((c,k)=>{const o=2+k*RF,L=j=>lerp(A[o+j],B[o+j],f);c.x=L(0);c.y=L(1);c.z=L(2);c.h=A[o+3]+wrapA(B[o+3]-A[o+3])*f;c.gp=L(4);c.gr=L(5);c.pitch=L(6);c.roll=L(7);c.steer=L(8);c.dist=L(9);
    const fl=A[o+10];c.drift=!!(fl&1);c.boostT=fl&2?0.1:0;c.air=!!(fl&4);c.off=!!(fl&8);c.flash=0;c.vx=(B[o]-A[o])/REC_DT;c.vy=(B[o+1]-A[o+1])/REC_DT;c.speed=Math.hypot(c.vx,c.vy);c.vF=c.speed;c.vL=c.drift?120:0;});}
function replayStep(dt){
  const g=G,rp=g.rp;if(rp.done){rp.theta+=dt*0.12;rp.t+=dt;return;}
  const rate=g.player.air?0.4:1;rp.t+=dt;rp.theta+=dt*(g.player.air?0.55:0.28);
  rp.f+=dt*rate/REC_DT;while(rp.f>=1){rp.f-=1;rp.i++;}
  if(rp.i>=g.hl[1]){rp.i=g.hl[1];rp.f=0;rp.done=true;applyFrame(g,rp.i,0);showResult();return;}
  applyFrame(g,rp.i,rp.f);for(const c of g.cars)carFx(g,c);
  for(const q of g.parts){q.life-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.z+=q.vz*dt;q.r+=q.gr*dt;q.vx*=0.96;q.vy*=0.96;}g.parts=g.parts.filter(q=>q.life>0);
  const pr=(rp.i-g.hl[0]+rp.f)/Math.max(1,rp.len);$('#rpBar').style.width=(pr*100).toFixed(1)+'%';
  const fl=g.rec[rp.i][2+g.cars.indexOf(g.player)*RF+10];$('#rpTag').textContent=fl&4?'점프!':fl&2?'방구 부스터':fl&1?'드리프트':'';
  $('#rpTime').textContent=fmt(g.rec[rp.i][0]);
}

// ---- 평가 ----
const parCache={};
function gradeOf(s){return s>=85?'S':s>=70?'A':s>=55?'B':s>=40?'C':'D';}
function evaluate(g){
  const p=g.player,pos=g.order.indexOf(p)+1||rankOf(p),id=g.V.id,par=parCache[id]||(parCache[id]=parTime(g.T).t);
  const sPos=[40,28,18,10][pos-1]||10,sTime=Math.round(35*clamp((par*1.25-p.finishT)/(par*0.35),0,1));
  const sTech=Math.round(Math.min(15,p.driftT*1.2+p.maxAir*10)),sPen=Math.min(15,p.resp*3);
  const score=clamp(sPos+sTime+sTech-sPen+10,0,100);return{pos,par,sPos,sTime,sTech,sPen,score,g:gradeOf(score)};
}
function showResult(){
  const g=G,p=g.player;
  if(!g.ev){g.ev=evaluate(g);const best=Math.min(...p.laps);g.saved=REC.add(g.V.id,{t:p.finishT,lap:best,score:g.ev.score,g:g.ev.g,p:g.ev.pos});}
  const e=g.ev,r=g.saved.rec,best=Math.min(...p.laps);
  $('#replayUI').hidden=true;
  $('#rName').textContent=`코스 ${g.vi+1} · ${g.V.name}`;$('#rPos').textContent=`${e.pos}위로 완주`;
  const gl=$('#rGrade');gl.textContent=e.g;gl.dataset.g=e.g;$('#rNew').hidden=!g.saved.isBest;
  $('#rRows').innerHTML=[['총 시간',fmt(p.finishT)],['기준 기록',fmt(e.par)],['베스트 랩',fmt(best)],...p.laps.map((l,i)=>[`${i+1}랩`,fmt(l)]),['드리프트',p.driftT.toFixed(1)+'초'],['최장 체공',p.maxAir.toFixed(2)+'초'],['방구 사용',p.boosts+'번'],['충돌',p.hits+'번'],['코스 복귀',p.resp+'번']].map(x=>`<span>${x[0]}</span><b>${x[1]}</b>`).join('');
  const bar=(lab,v,max,neg)=>`<div class="sc"><span>${lab}</span><i><u style="width:${(v/max*100).toFixed(0)}%"${neg?' class="neg"':''}></u></i><b>${neg?'−':'+'}${v}</b></div>`;
  $('#rScore').innerHTML=bar('순위',e.sPos,40)+bar('기록',e.sTime,35)+bar('드리프트·점프',e.sTech,15)+(e.sPen?bar('코스 이탈',e.sPen,15,true):'')+`<div class="tot">완주 보너스 +10 · 총점 <b>${e.score}</b></div>`;
  $('#rBest').innerHTML=`<div class="rb"><span>최고 기록</span><b>${fmt(r.best)}</b></div><div class="rb"><span>최고 등급</span><b>${r.bestGrade||'—'}</b></div><div class="rb"><span>플레이</span><b>${r.plays}회</b></div>`+
    `<ol class="hist">${(r.hist||[]).slice(0,5).map((h,i)=>`<li${i===0?' class="now"':''}><span>${new Date(h.d).toLocaleDateString('ko-KR',{month:'numeric',day:'numeric'})}</span><b>${fmt(h.t)}</b><em>${h.g}</em><i>${h.p}위</i></li>`).join('')}</ol>`+
    `<p class="where">${REC.where==='account'?'기록은 내 계정에 저장돼서 다른 기기에서도 이어져요.':'기록은 이 브라우저에 저장돼요.'}</p>`;
  $('#result').hidden=false;
  let n=20;const btn=$('#rBack');btn.textContent=`코스 선택으로 (${n})`;clearInterval(resTimer);
  resTimer=setInterval(()=>{n--;btn.textContent=`코스 선택으로 (${n})`;if(n<=0){clearInterval(resTimer);stopGame();}},1000);
}
function holdResult(){clearInterval(resTimer);$('#rBack').textContent='코스 선택으로';}
function rankOf(c){const g=G;const sc=x=>x.done?1e9-x.finishT:x.lap*g.T.L+x.s;return g.cars.filter(o=>sc(o)>sc(c)).length+1;}
const fmt=t=>{if(t==null||!isFinite(t))return'—';const m=Math.floor(t/60),s=t-m*60;return`${m}:${s<10?'0':''}${s.toFixed(2)}`;};
const CLOUD_D='M9 20 C4 20 2 16.5 4 13.5 C3 9 7.5 6.5 11 8.5 C12.5 4 19 3.5 21.5 7.5 C26 6.5 29.5 10 28 14 C31 16.5 29 20 25.5 20 Z';
const CLOUD_FULL=`<svg class="full" viewBox="0 0 32 22" aria-hidden="true"><path d="${CLOUD_D}" fill="#c9f07a" stroke="#2b1a0e" stroke-width="1.6"/><circle cx="13" cy="13.5" r="1.3" fill="#2b1a0e"/><circle cx="19" cy="13.5" r="1.3" fill="#2b1a0e"/><path d="M14 16.5 Q16 18 18 16.5" fill="none" stroke="#2b1a0e" stroke-width="1.2" stroke-linecap="round"/></svg>`;
const CLOUD_EMPTY=`<svg viewBox="0 0 32 22" aria-hidden="true"><path d="${CLOUD_D}" fill="rgba(255,255,255,.85)" stroke="#2b1a0e" stroke-width="1.6" stroke-dasharray="2 1.6"/><path d="M12 14 h2 M18 14 h2" stroke="#9a8a7a" stroke-width="1.4" stroke-linecap="round"/></svg>`;
function progressOf(c,T){return c.done?1e9-c.finishT*1000:c.lap*T.L+c.s;}
function hudInit(g){
  $('#hRows').innerHTML=g.cars.map((c,k)=>`<div class="tr${c===g.player?' me':''}" id="tr${k}"><b>${k+1}</b><i style="background:${c.col.body};box-shadow:inset 0 -4px 0 ${c.col.dark}"></i><span>${c.name}</span><em></em></div>`).join('');
  g.prevRank=0;g.hudAcc=1;g.chgT=0;g.pipsShown=-1;$('#hChg').className='';$('#hLapN').textContent=' / '+g.T.laps;
}
function hud(){
  const g=G,p=g.player,L=g.T.laps,T=g.T;
  $('#hLap').textContent=clamp(p.lap,1,L);
  $('#hTime').textContent=fmt(g.state==='count'?0:(p.done?p.finishT:g.t));$('#hBest').textContent=p.laps.length?fmt(Math.min(...p.laps)):'—';
  $('#hSpd').textContent=Math.round(p.speed*0.075);
  const sl=Math.round(p.slope*100);$('#hInfo').textContent=`${p.surf.name} · ${p.air?'공중':sl>2?`오르막 ${sl}%`:sl<-2?`내리막 ${-sl}%`:'평지'}`;
  const ang=Math.round(Math.abs(Math.atan2(p.vL,Math.max(1,Math.abs(p.vF))))*57.3);
  const pips=Math.min(3,Math.floor(p.gauge*3+1e-6));
  if(pips!==g.pipsShown){g.pipsShown=pips;$('#hClouds').innerHTML=CLOUD_FULL.repeat(pips)+CLOUD_EMPTY.repeat(3-pips);$('#hClouds').setAttribute('aria-label',`방구 게이지 3칸 중 ${pips}칸`);}
  $('#hBadge').textContent=p.boostT>0?'방구 부스터!':p.air&&p.airT>0.08?`AIR ${p.airT.toFixed(2)}s`:p.drift?`DRIFT ${ang}°`:'';
  // 순위 (0.15초마다)
  const now=performance.now();
  if(now-(g.hudLast||0)>150){g.hudLast=now;
    const order=[...g.cars].sort((a,b)=>progressOf(b,T)-progressOf(a,T)),lead=order[0],rank=order.indexOf(p)+1;
    const gapS=(a,b)=>{if(a.done&&b.done)return b.finishT-a.finishT;return Math.max(0,(progressOf(a,T)-progressOf(b,T))/Math.max(220,(a.speed+b.speed)/2));};
    order.forEach((c,i)=>{const el=document.getElementById('tr'+g.cars.indexOf(c));el.style.top=(i*23)+'px';el.querySelector('b').textContent=i+1;el.querySelector('em').textContent=c.done?'완주':i===0?'선두':'+'+Math.min(99,gapS(lead,c)).toFixed(2);});
    $('#hPos').textContent='P'+rank;
    $('#hDots').innerHTML=order.map(c=>`<i${c===p?' class="me"':''} style="background:${c.col.body}"></i>`).join('');$('#hDots').setAttribute('aria-label','현재 순서 '+order.map((c,i)=>(i+1)+'위 '+c.name).join(', '));
    const wait=g.state==='count';$('#hGapF').innerHTML=wait?'출발 <small>대기 중</small>':rank>1?`−${Math.min(99,gapS(order[rank-2],p)).toFixed(2)} <small>앞차</small>`:'선두 <small>달리는 중</small>';
    $('#hGapB').innerHTML=!wait&&rank<order.length?`+${Math.min(99,gapS(p,order[rank])).toFixed(2)} <small>뒤차</small>`:'';
    if(g.prevRank&&rank!==g.prevRank&&g.state==='race'){const up=rank<g.prevRank;const c=$('#hChg');c.className=up?'up':'down';c.textContent=up?`▲ ${g.prevRank}위 → ${rank}위`:`▼ ${g.prevRank}위 → ${rank}위`;g.chgT=now;const ps=$('#hPos');ps.classList.remove('pop');void ps.offsetWidth;ps.classList.add('pop');}
    if(g.chgT&&now-g.chgT>1800){$('#hChg').className='';g.chgT=0;}
    g.prevRank=rank;}
  const cd=$('#count');if(g.state==='count'){const n=Math.ceil(g.count-0.4);cd.textContent=n>0?n:'GO';}else if(g.state==='done')cd.textContent='FINISH!';else if(g.t<0.8)cd.textContent='GO';else cd.textContent='';
  if(g.t>(g.hintT||6))$('#hint').hidden=true;
  $('#wheel').style.transform=`rotate(${(p.steer*110).toFixed(1)}deg)`;
}
function setPause(on){if(!G||G.state==='replay'||G.state==='done'||!$('#result').hidden)return;G.paused=on;$('#pauseOv').hidden=!on;if(on){AU.silence();$('#pName').textContent=`코스 ${G.vi+1} · ${G.V.name}`;$('#pResume').focus();}for(const k in keys)keys[k]=false;}
function loop(ts){
  if(!G)return;const dt=Math.min(0.05,(ts-last)/1000);last=ts;acc+=dt;
  if(G.paused){acc=0;raf=requestAnimationFrame(loop);return;}
  while(acc>=STEP){update(STEP);acc-=STEP;if(!G)return;}
  REND.draw(G,dt);if(G.state!=='replay')hud();if(AU.on)AU.update(G.player,G.state==='replay');
  raf=requestAnimationFrame(loop);
}

// ---- 입력 ----
addEventListener('keydown',e=>{if(!G)return;keys[e.code]=true;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight'].includes(e.code))e.preventDefault();
  if(e.repeat)return;
  if(G.state==='replay'){if(e.code==='Space'||e.code==='Enter'||e.code==='Escape'){if(!G.rp.done){G.rp.done=true;showResult();}else if(e.code==='Escape')stopGame();}return;}
  if(G.paused){if(e.code==='Escape'||e.code==='KeyP')setPause(false);return;}
  if(e.code==='KeyR')respawn(G.player,G.T);
  if(e.code==='KeyC')camSwitch();
  if(e.code==='KeyV')cockpit();
  if(e.code==='KeyM')toggleSound();
  if(e.code==='Escape'||e.code==='KeyP')setPause(!G.paused);});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
{const z=$('#tZone'),ids=new Set();const up=e=>{ids.delete(e.pointerId);touch.g=ids.size?1:0;z.classList.toggle('on',!!ids.size);};
  z.addEventListener('pointerdown',e=>{e.preventDefault();ids.add(e.pointerId);touch.g=1;z.classList.add('on','used');try{z.setPointerCapture(e.pointerId);}catch(_){}});
  z.addEventListener('pointerup',up);z.addEventListener('pointercancel',up);z.addEventListener('lostpointercapture',up);}
for(const[id,k]of[['tL','l'],['tR','r'],['tB','b'],['tH','h'],['tP','p']]){const b=$('#'+id);
  const on=e=>{e.preventDefault();touch[k]=1;b.classList.add('on');try{b.setPointerCapture(e.pointerId);}catch(_){}},off=()=>{touch[k]=0;b.classList.remove('on');};
  b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('lostpointercapture',off);}
function flashHint(t){$('#hint').textContent=t;$('#hint').hidden=false;G.hintT=G.t+2;}
function syncCamBtns(){const ck=REND&&REND.camMode==='cockpit';$('#bCock').setAttribute('aria-label',ck?'밖에서 보기':'운전자 시점');$('#bCock').setAttribute('aria-pressed',ck?'true':'false');$('#wheelWrap').hidden=!ck;$('#cockpitFrame').toggleAttribute('hidden',!ck);$('#stage').classList.toggle('cockpit',!!ck);}
function camToast(t){const el=$('#camToast');el.textContent=t;el.classList.add('show');clearTimeout(camToast.tm);camToast.tm=setTimeout(()=>el.classList.remove('show'),1300);}
function camSwitch(){if(!REND||!G||G.state==='replay')return;camToast(REND.cycleCam());syncCamBtns();}
function cockpit(){if(!REND||!G||G.state==='replay')return;camToast(REND.toggleCockpit());syncCamBtns();}
function toggleSound(){AU.toggle();const b=$('#bSound');b.classList.toggle('muted',!AU.on);b.setAttribute('aria-pressed',AU.on?'true':'false');b.setAttribute('aria-label',AU.on?'소리 켜짐':'소리 꺼짐');}
$('#bSound').onclick=toggleSound;$('#bCam').onclick=camSwitch;$('#bCock').onclick=cockpit;$('#bPause').onclick=()=>setPause(true);$('#pResume').onclick=()=>setPause(false);$('#pMenu').onclick=()=>{G.paused=false;stopGame();};$('#pRestart').onclick=()=>{const v=G.vi,c=G.ci;G.paused=false;stopGame();startGame(v,c);};
$('#rBack').onclick=stopGame;$('#rAgain').onclick=()=>{const v=G.vi,c=G.ci;stopGame();startGame(v,c);};
$('#rReplay').onclick=()=>{holdResult();startReplay();};$('#rpSkip').onclick=()=>{if(G&&G.rp&&!G.rp.done){G.rp.done=true;showResult();}};
$('#result').addEventListener('pointerdown',e=>{if(e.target.closest('#rBack'))return;holdResult();});

// ---- 메뉴 카드 + 썸네일 ----
function thumb(cv,V){
  const T=getTrack(V.id),ctx=cv.getContext('2d'),W=cv.width=320,H=cv.height=240,b=T.b,s=Math.min((W-36)/(b.x1-b.x0),(H-36)/(b.y1-b.y0)),th=V.th;
  const tx=x=>18+(x-b.x0)*s+((W-36)-(b.x1-b.x0)*s)/2,ty=y=>18+(y-b.y0)*s+((H-36)-(b.y1-b.y0)*s)/2;
  ctx.fillStyle=th.bg;ctx.fillRect(0,0,W,H);
  if(th.pat==='grid'){ctx.strokeStyle='rgba(255,255,255,.12)';ctx.lineWidth=1;for(let x=0;x<W;x+=16){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}for(let y=0;y<H;y+=16){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}}
  if(th.pat==='sea'){ctx.fillStyle=th.sea||'#2f9fc9';ctx.fillRect(0,ty(T.shore||930),W,H);}
  ctx.lineJoin='round';ctx.lineCap='round';const P=T.p,N=P.length;
  const seg=(i,wd,col)=>{const a=P[i],c=P[(i+1)%N];ctx.strokeStyle=col;ctx.lineWidth=wd;ctx.beginPath();ctx.moveTo(tx(a.x),ty(a.y));ctx.lineTo(tx(c.x),ty(c.y));ctx.stroke();};
  const order=[...P.keys()].sort((i,j)=>P[i].z-P[j].z);
  for(const i of order){seg(i,15,P[i].z>20?'rgba(0,0,0,.45)':th.edge);seg(i,11,P[i].tun?'#2a2622':th.road);}
  const a0=P[0];ctx.save();ctx.translate(tx(a0.x),ty(a0.y));ctx.rotate(Math.atan2(a0.ty,a0.tx));for(let k=0;k<4;k++)for(let r2=0;r2<2;r2++){ctx.fillStyle=(k+r2)%2?'#111':'#fff';ctx.fillRect(r2*3-3,-6+k*3,3,3);}ctx.restore();
}
function renderCards(){
  for(const V of VARIANTS){const el=document.getElementById('card-'+V.id);if(!el)continue;const r=REC.data[V.id],box=el.querySelector('.rec');
    box.innerHTML=r&&r.best!=null?`<span>최고 <b>${fmt(r.best)}</b></span><span class="gr" data-g="${r.bestGrade||''}">${r.bestGrade||'—'}</span><span>${r.plays}회</span>`:'<span class="none">아직 기록 없음</span>';}
}
const cards=$('#cards');
VARIANTS.forEach((V,i)=>{
  const el=document.createElement('article');el.className='card';el.id='card-'+V.id;
  el.innerHTML=`<canvas aria-hidden="true"></canvas><div class="cbody"><div class="cid"><b>코스 ${String(i+1).padStart(2,'0')}</b><span>${V.view}</span></div><h2>${V.name}</h2><p>${V.desc}</p><div class="tags">${V.tags.map(t=>`<i>${t}</i>`).join('')}</div><div class="rec"></div><button class="go" type="button" id="go-${V.id}">달려보기</button></div>`;
  cards.appendChild(el);thumb(el.querySelector('canvas'),V);
  el.querySelector('.go').onclick=()=>{if(!window.THREE){el.querySelector('.go').textContent='3D 엔진을 불러오지 못했어요';return;}openGarage(i);};
});

