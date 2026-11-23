// ---- 자동차 ----
const CARS=[
 {id:'bolt',name:'번개',design:'미드나잇 GT',kind:'A',col:{body:'#2b4a7c',dark:'#ff6a1a',light:'#9fb6d8',mid:'#1b2a44'},power:610,top:560,grip:1,mass:1,boost:2.4,desc:'남색 GT 레이서. 모든 능력이 고른 기본 차라 처음 달리는 코스에 잘 맞아요.'},
 {id:'drift',name:'드리프트킹',design:'실버 프로토',kind:'B',col:{body:'#c9ced3',dark:'#0f6e78',light:'#eef1f3',mid:'#9aa1a8'},power:600,top:605,grip:0.8,mass:0.95,boost:2.4,desc:'낮고 긴 은색 프로토타입. 꼬리가 잘 흐르고 최고 속도가 높아요. 코너는 미끄러뜨려 도세요.'},
 {id:'dozer',name:'불도저',design:'랠리 해치',kind:'C',col:{body:'#eef0ee',dark:'#d8262f',light:'#ffffff',mid:'#2a2d31'},power:560,top:540,grip:1.15,mass:1.6,boost:2.2,desc:'짧고 단단한 랠리 해치. 무거워서 부딪히면 상대가 튕겨 나가요. 가속은 느리지만 잘 붙어요.'},
 {id:'rocket',name:'로켓',design:'그라파이트 드리프트',kind:'D',col:{body:'#4a4e55',dark:'#c6ff3d',light:'#8a8f96',mid:'#2b2e33'},power:680,top:545,grip:0.95,mass:0.8,boost:3.0,desc:'가벼운 드리프트 쿠페. 출발이 빠르고 방구 부스터가 가장 세지만 부딪히면 잘 밀려요.'},
 {id:'classic',name:'클래식',design:'클래식 그린',kind:'E',col:{body:'#1f5c43',dark:'#efe6cf',light:'#5d8f78',mid:'#0f3b2a'},power:630,top:575,grip:1.05,mass:0.9,boost:2.3,desc:'둥근 앞코의 클래식 레이서. 조금 가볍고 잘 붙어서 굽은 길이 많은 코스에서 편해요.'},
 {id:'scarab',name:'스카라브',design:'데저트 버기',kind:'F',col:{body:'#c9a66b',dark:'#ff7a1a',light:'#f1e6c8',mid:'#2a2724'},power:600,top:530,grip:1,mass:1.15,boost:2.4,offM:0.4,susp:520,desc:'롤케이지를 드러낸 오프로드 버기. 최고 속도는 낮지만 길 밖 잔디·모래·진흙에서 덜 느려지고, 높은 점프도 튀지 않고 착지해요.'},
 {id:'stinger',name:'스팅어',design:'오픈휠 포뮬러',kind:'G',col:{body:'#b5121b',dark:'#16171a',light:'#f2f2f2',mid:'#7a0d13'},power:645,top:595,grip:1.25,mass:0.75,boost:2.3,offM:1.7,desc:'바퀴가 드러난 오픈휠 포뮬러. 접지력이 가장 좋아 코너를 빠르게 돌고 최고 속도도 높지만, 길 밖 잔디·모래에서는 크게 느려지고 가벼워서 부딪히면 잘 튕겨요.'},
 {id:'bigfoot',name:'빅풋',design:'미니 몬스터 트럭',kind:'H',col:{body:'#3a3f46',dark:'#ffc21a',light:'#c9ccd1',mid:'#16171a'},power:555,top:535,grip:0.85,mass:1.75,boost:2.5,offM:0.3,susp:640,desc:'커다란 타이어의 미니 몬스터 트럭. 가장 무거워서 부딪히면 상대를 밀어내고, 높은 점프도 출렁이며 안정적으로 착지해요. 길 밖 흙·자갈에서도 거의 느려지지 않지만, 출발이 느리고 코너에서 잘 미끄러져요.'},
 {id:'spark',name:'스파크',design:'레이싱 고카트',kind:'I',col:{body:'#eceef0',dark:'#14284b',light:'#d7ff2f',mid:'#2b2d31'},power:700,top:510,grip:1.1,mass:0.65,boost:2.2,offM:1.9,gaugeM:1.5,desc:'바닥에 붙은 레이싱 고카트. 출발이 가장 빠르고 방구 게이지가 1.5배 빨리 차서 부스터를 자주 써요. 최고 속도는 가장 낮고, 가벼워서 잘 밀리며 길 밖에서는 많이 느려져요.'},
];
const STAT_DEF=[['최고 속도',c=>(c.top-520)/100],['가속',c=>(c.power-540)/160],['접지력',c=>(c.grip-0.7)/0.5],['무게',c=>(c.mass-0.7)/1.0],['방구 부스터',c=>(c.boost-2)/1.1],['험로 주행',c=>c.offM?(1-c.offM)/0.7:0.1],['부스터 충전',c=>((c.gaugeM||1)-0.75)/0.85]];
const SEL={car:0,course:0,load(){try{const s=JSON.parse(localStorage.getItem('rcgp-sel')||'{}');if(s.car>=0&&s.car<CARS.length)this.car=s.car;if(s.course>=0&&s.course<VARIANTS.length)this.course=s.course;}catch(_){}},save(){try{localStorage.setItem('rcgp-sel',JSON.stringify({car:this.car,course:this.course}));}catch(_){}}};
SEL.load();

// ---- 모바일 디오라마 코스 선택 ----
const TT={volcano:['#f2c3a8','#2a1410','#3d302c','#241c19','#6a5d58','#ff5a1a'],park:['#d7e8c6','#1d2a14','#6f9a4c','#4f7a34','#a5764c','#6a4529'],arcade:['#0c1230','#eef0ff','#141d52','#070b24','#cfd3e6','#e8433c'],toy:['#dff1e7','#14302a','#a8dcc1','#6fae8c','#f0d8a6','#e8433c'],
  hill:['#a9d2ec','#10202a','#5f9a4a','#4a7a3a','#45474c','#e8433c'],room:['#3a281a','#fbeedd','#b98252','#7d4f2c','#b98252','#ecdca9'],snow:['#d9e8f4','#14243a','#eef3f8','#b8c8d8','#8fa3ba','#ffffff'],
  beach:['#bfe4f2','#0f2a3a','#ecd6a4','#c9ad74','#dcbb85','#a9874f'],canyon:['#f3c08a','#3a1608','#a8532f','#7a3a1f','#c0703f','#5f2a14'],garden:['#cfe9f7','#14301a','#6fae4e','#4f8a3a','#bdb6a8','#9b4b35'],site:['#e9d9b8','#2a2010','#9a8b70','#6e6250','#8f877a','#f2c230'],harbor:['#1b2742','#eef2ff','#4a515c','#2c323b','#3b3f46','#f2c230'],parking:['#f3c3a4','#2a1a24','#8d9097','#5d6068','#3a3c41','#f2c230'],mine:['#b7bfc3','#1e1a17','#6f675c','#4a433b','#3e3833','#d9a441']};
const pathCache={};
function trackSvg(id){
  if(pathCache[id])return pathCache[id];const T=getTrack(id),b=T.b,W=b.x1-b.x0,H=b.y1-b.y0,s=Math.min(100/W,70/H),ox=(100-W*s)/2,oy=(70-H*s)/2,P=T.p,st=Math.max(1,P.length/90|0);
  const f=p=>((ox+(p.x-b.x0)*s).toFixed(1)+' '+(oy+(p.y-b.y0)*s).toFixed(1));let d='',tun='',inT=false;
  for(let i=0;i<P.length;i+=st){d+=(i?' L':'M')+f(P[i]);if(P[i].tun){tun+=(inT?' L':' M')+f(P[i]);inT=true;}else inT=false;}
  const c=TT[id];return pathCache[id]=`<svg viewBox="0 0 100 70" aria-hidden="true"><path d="${d} Z" fill="none" stroke="${c[5]}" stroke-width="7.5" stroke-linejoin="round"/><path d="${d} Z" fill="none" stroke="${c[4]}" stroke-width="5" stroke-linejoin="round"/>${tun?`<path d="${tun}" fill="none" stroke="rgba(20,16,12,.75)" stroke-width="8" stroke-linecap="round"/>`:''}<circle cx="${f(P[0]).split(' ')[0]}" cy="${f(P[0]).split(' ')[1]}" r="2.6" fill="#fff" stroke="#111" stroke-width=".8"/></svg>`;
}
function tileHTML(id){const c=TT[id];return`<div class="tt-board" style="background:${c[2]};box-shadow:0 10px 0 ${c[3]},0 22px 0 rgba(0,0,0,.18),0 40px 40px rgba(0,0,0,.25)">${trackSvg(id)}</div>`;}
let ttIdx=SEL.course;
function ttRender(dir){
  const n=VARIANTS.length,V=VARIANTS[ttIdx],c=TT[V.id],r=REC.data[V.id];
  $('#mmenu').style.setProperty('--mm-bg',c[0]);$('#mmenu').style.setProperty('--mm-ink',c[1]);
  $('#ttPrev').innerHTML=tileHTML(VARIANTS[(ttIdx-1+n)%n].id);$('#ttNext').innerHTML=tileHTML(VARIANTS[(ttIdx+1)%n].id);
  const cur=$('#ttCur');cur.innerHTML=tileHTML(V.id);cur.setAttribute('aria-label',`${ttIdx+1}번 코스 ${V.name} 선택됨`);
  if(dir){cur.classList.remove('in-l','in-r');void cur.offsetWidth;cur.classList.add(dir>0?'in-r':'in-l');}
  $('#mmCount').textContent=`COURSE ${String(ttIdx+1).padStart(2,'0')} / ${n}`;
  $('#mmName').textContent=V.name;
  $('#mmMeta').innerHTML=`<span>${V.tags.join(' · ')}</span>`+(r&&r.best!=null?`<span>최고 <b>${fmt(r.best)}</b></span><span class="gr" data-g="${r.bestGrade||''}">${r.bestGrade||''}</span>`:'<span class="none">아직 기록 없음</span>');
  $('#mmDots').innerHTML=VARIANTS.map((v,i)=>`<i${i===ttIdx?' class="on"':''}></i>`).join('');
  const done=VARIANTS.filter(v=>REC.data[v.id]&&REC.data[v.id].best!=null).length;$('#mmRecSum').textContent=`완주 ${done} / ${n}`;
}
function ttGo(i,silent){const n=VARIANTS.length,d=i-ttIdx;ttIdx=((i%n)+n)%n;SEL.course=ttIdx;SEL.save();ttRender(silent?0:(d>0||d<-n/2?1:-1));}
$('#mmPrev').onclick=()=>ttGo(ttIdx-1);$('#mmNext').onclick=()=>ttGo(ttIdx+1);$('#ttPrev').onclick=()=>ttGo(ttIdx-1);$('#ttNext').onclick=()=>ttGo(ttIdx+1);
$('#mmGo').onclick=()=>{if(!window.THREE){$('#mmGo').textContent='3D 엔진을 불러오지 못했어요';return;}openGarage(ttIdx);};
// 좌우로 밀어서 넘기기 (손가락을 따라 움직이고, 충분히 밀면 다음/이전으로)
function addSwipe(el,{onDrag,onEnd}){
  let id=null,sx=0,sy=0,dx=0,horiz=null,t0=0,moved=false;
  el.addEventListener('pointerdown',e=>{if(e.button>0)return;id=e.pointerId;sx=e.clientX;sy=e.clientY;dx=0;horiz=null;moved=false;t0=performance.now();});
  el.addEventListener('pointermove',e=>{if(e.pointerId!==id)return;const mx=e.clientX-sx,my=e.clientY-sy;
    if(horiz===null&&Math.hypot(mx,my)>8){horiz=Math.abs(mx)>Math.abs(my);if(horiz){try{el.setPointerCapture(id);}catch(_){}}}
    if(horiz){dx=mx;moved=true;onDrag(dx);}});
  const end=e=>{if(e.pointerId!==id)return;id=null;if(!horiz){return;}
    const v=dx/Math.max(1,performance.now()-t0),W=el.clientWidth||innerWidth,go=Math.abs(dx)>Math.min(90,W*0.18)||(Math.abs(dx)>30&&Math.abs(v)>0.45);
    onEnd(go?(dx<0?1:-1):0);horiz=null;};
  el.addEventListener('pointerup',end);el.addEventListener('pointercancel',e=>{if(e.pointerId!==id)return;id=null;if(horiz)onEnd(0);horiz=null;});
  el.addEventListener('click',e=>{if(moved){e.stopPropagation();e.preventDefault();moved=false;}},true);
}
addSwipe($('#mmStage'),{
  onDrag:dx=>{const c=$('#ttCur');c.classList.remove('in-l','in-r');c.style.transition='none';c.style.transform=`translate(calc(-50% + ${dx}px),-50%) rotate(${dx*0.01}deg)`;c.style.opacity=String(Math.max(0.35,1-Math.abs(dx)/600));},
  onEnd:d=>{const c=$('#ttCur');c.style.transition='';c.style.transform='';c.style.opacity='';if(d)ttGo(ttIdx+d);}
});
function setMobile(){document.body.classList.add('mobile');document.body.classList.toggle('fine',!matchMedia('(pointer:coarse)').matches);}
addEventListener('keydown',e=>{if(G||GX.open||INTRO.open||!$('#nameDlg').hidden||!$('#verModal').hidden)return;if(e.code==='ArrowLeft'||e.code==='KeyA'){ttGo(ttIdx-1);}else if(e.code==='ArrowRight'||e.code==='KeyD'){ttGo(ttIdx+1);}else if(e.code==='Enter'||e.code==='Space'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)$('#mmGo').click();}});
addEventListener('resize',setMobile);setMobile();ttRender();

// ---- 차고 (자동차 선택) ----
const GX={open:false,vi:0,ci:SEL.car,r:null,raf:0};
function openGarage(vi){
  GX.vi=vi;GX.ci=SEL.car;GX.open=true;GX.t0=performance.now();const V=VARIANTS[vi],c=TT[V.id];
  $('#garage').hidden=false;$('#garage').style.setProperty('--gx-bg',c[0]);$('#garage').style.setProperty('--gx-ink',c[1]);
  $('#gCourse').textContent=`COURSE ${String(vi+1).padStart(2,'0')} · ${V.name}`;
  $('#gPick').innerHTML=CARS.map((k,i)=>`<button type="button" class="gchip" id="gchip-${i}" aria-label="${k.name}" style="--c:${k.col.body};--d:${k.col.dark}"><i></i><span>${k.name}</span></button>`).join('');
  CARS.forEach((k,i)=>{$('#gchip-'+i).onclick=()=>gxSet(i);});
  gxScene(c);gxSet(GX.ci);
}
function closeGarage(){if(!GX.open)return;GX.open=false;$('#garage').hidden=true;cancelAnimationFrame(GX.raf);if(GX.r){GX.r.dispose();GX.r.domElement.remove();GX.r=null;}}
function gxScene(c){
  if(GX.r){GX.r.dispose();GX.r.domElement.remove();}
  const r=new THREE.WebGLRenderer({antialias:true,alpha:true});r.setPixelRatio(Math.min(2,devicePixelRatio||1));r.shadowMap.enabled=true;$('#gView').appendChild(r.domElement);GX.r=r;
  const sc=new THREE.Scene();GX.sc=sc;sc.add(new THREE.HemisphereLight(0xffffff,0x667766,0.75));const dl=new THREE.DirectionalLight(0xffffff,0.75);dl.position.set(3,6,4);dl.castShadow=true;sc.add(dl);
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(2.6,2.6,0.35,48),new THREE.MeshLambertMaterial({color:c[2]}));disc.position.y=-0.18;disc.receiveShadow=true;sc.add(disc);
  const rim=new THREE.Mesh(new THREE.CylinderGeometry(2.68,2.68,0.3,48),new THREE.MeshLambertMaterial({color:c[3]}));rim.position.y=-0.42;sc.add(rim);
  GX.turn=new THREE.Group();sc.add(GX.turn);
  GX.cam=new THREE.PerspectiveCamera(36,1,0.1,50);GX.cam.position.set(0,2.6,5.6);GX.cam.lookAt(0,0.45,0);
  const loop=()=>{if(!GX.open)return;const v=$('#gView'),W=v.clientWidth,H=v.clientHeight;if(GX._w!==W||GX._h!==H){r.setSize(W,H,false);const asp=W/H,dd=(matchMedia('(pointer:coarse)').matches?5.0:6.6)*Math.max(1,1.35/asp);GX.cam.aspect=asp;GX.cam.position.set(0,dd*0.46,dd);GX.cam.lookAt(0,0.4,0);GX.cam.updateProjectionMatrix();GX._w=W;GX._h=H;}
    GX.turn.rotation.y+=0.008;{const W=$('#gView').clientWidth||1,tx=(GX.drag||0)/W*5.5;GX.slide=(GX.slide||0)*0.82;GX.turn.position.x+=(tx+GX.slide-GX.turn.position.x)*0.35;}if(GX.mesh)GX.mesh.wheels.forEach(w=>w.rotation.z-=0.04);r.render(sc,GX.cam);GX.raf=requestAnimationFrame(loop);};
  GX._w=0;cancelAnimationFrame(GX.raf);GX.raf=requestAnimationFrame(loop);
}
function gxSet(i){
  GX.ci=((i%CARS.length)+CARS.length)%CARS.length;const k=CARS[GX.ci];
  if(GX.mesh)GX.turn.remove(GX.mesh.g);GX.mesh=carMesh(k.col,0.05,k.kind);GX.mesh.g.rotation.y=-0.6;GX.turn.add(GX.mesh.g);
  $('#gNo').textContent=`CAR ${GX.ci+1} / ${CARS.length} · ${k.design}`;$('#gName').textContent=k.name;$('#gDesc').textContent=k.desc;
  $('#gStats').innerHTML=STAT_DEF.map(s=>{const v=clamp(s[1](k),0.08,1);return`<div class="gs"><span>${s[0]}</span><i><u style="width:${(v*100).toFixed(0)}%"></u></i></div>`;}).join('');
  CARS.forEach((_,j)=>{const b=$('#gchip-'+j);b.classList.toggle('on',j===GX.ci);b.setAttribute('aria-pressed',j===GX.ci?'true':'false');});
}
$('#gPrev').onclick=()=>gxSet(GX.ci-1);$('#gNext').onclick=()=>gxSet(GX.ci+1);
addSwipe($('#gView'),{onDrag:dx=>{GX.drag=dx;},onEnd:d=>{GX.drag=0;if(d){gxSet(GX.ci+d);GX.slide=d*2.6;}}});
$('#gBack').onclick=closeGarage;
$('#gGo').onclick=()=>{SEL.car=GX.ci;SEL.course=GX.vi;SEL.save();startGame(GX.vi,GX.ci);};
addEventListener('keydown',e=>{if(!GX.open||e.repeat||performance.now()-GX.t0<250)return;if(e.code==='ArrowLeft')gxSet(GX.ci-1);else if(e.code==='ArrowRight')gxSet(GX.ci+1);else if(e.code==='Enter'||e.code==='Space'){e.preventDefault();$('#gGo').click();}else if(e.code==='Escape')closeGarage();});

// ---- 버전 정보 ----
$('#verBtn').onclick=()=>{$('#verModal').hidden=false;$('#verClose').focus();};
$('#verClose').onclick=()=>{$('#verModal').hidden=true;};
$('#verModal').addEventListener('pointerdown',e=>{if(e.target.id==='verModal')$('#verModal').hidden=true;});
document.querySelectorAll('.vtab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.vtab').forEach(x=>x.setAttribute('aria-selected',x===b?'true':'false'));document.querySelectorAll('.vpane').forEach(p=>p.hidden=p.id!==b.dataset.p);});
addEventListener('keydown',e=>{if(e.code==='Escape'&&!$('#verModal').hidden)$('#verModal').hidden=true;});

REC.init(()=>{renderCards();ttRender();});
if(document.fonts)['700 40px "Chakra Petch"','italic 700 40px "Chakra Petch"','700 40px "Bodoni Moda"'].forEach(f=>document.fonts.load(f).catch(()=>{}));

// ---- 인트로 A: 드론 시네마 하이라이트 — 무작위 코스에서 AI 4대를 실제로 달리게 하고, 리플레이 카메라로 컷을 나눠 보여준 뒤 코스 고르기로 ----
const INTRO={open:false};
(function(){
  const el=$('#intro');if(!el)return;
  if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  const SHOTS=[['sweep','드론 스윕',2.6,1],['side','슬로모 사이드',2.4,0.45],['rear','방구 부스터 클로즈업',2.1,1],['front','정면 돌파',1.9,1],['title','',2.6,1]];
  let raf=0,done=false,si=-1,st=0,clock=0,lastTs=0,acc2=0;
  const finish=()=>{if(done)return;done=true;INTRO.open=false;el.classList.add('out');cancelAnimationFrame(raf);
    $('#mmenu').hidden=false;$('#verBtn').hidden=false;askNameIfNeeded();
    setTimeout(()=>{el.hidden=true;if(G&&G.intro){if(REND)REND.dispose();REND=null;G=null;$('#stage').hidden=true;$('#view').innerHTML='';$('#bang').classList.remove('pop');}},520);};
  try{
    const vi=Math.floor(Math.random()*VARIANTS.length),V=VARIANTS[vi],T=getTrack(V.id),N=T.p.length,sp=Math.max(2,Math.round(50/(T.L/N)));
    const grid=[0,1,2,3].map(k=>CARS[(vi+k)%CARS.length]);
    const cars=grid.map((d,k)=>{const c=makeCar(T,Math.round(N-2-(k>>1)*sp*1.4),k%2?-45:45,d.col,true,[0.97,0.95,0.96,0.93][k]);Object.assign(c,{kind:d.kind,name:d.name,power:d.power,top:d.top,gripM:d.grip,mass:d.mass});return c;});
    G={intro:true,V,vi,ci:0,T,cars,player:cars[0],parts:[],skids:[],t:0,state:'race',count:0,shake:0,order:[],rec:[],recAcc:0,ranks:[],finishShow:0,cine:null};
    for(let i=0;i<Math.round(1.6/STEP);i++)update(STEP);
    $('#menu').hidden=true;$('#mmenu').hidden=true;$('#verBtn').hidden=true;$('#stage').hidden=false;$('#hud').hidden=true;$('#touch').classList.add('off');$('#replayUI').hidden=true;$('#result').hidden=true;$('#hint').hidden=true;$('#count').textContent='';$('#pauseOv').hidden=true;
    $('#cockpitFrame').toggleAttribute('hidden',true);$('#wheelWrap').hidden=true;$('#stage').classList.remove('cockpit');$('#view').innerHTML='';
    REND=V.R();REND.init($('#view'),G);REND.setMode('cine');
    $('#ciCourse').textContent=`COURSE ${String(vi+1).padStart(2,'0')} · ${V.name}`;
  }catch(err){console.warn('intro',err);G=null;REND=null;$('#stage').hidden=true;$('#mmenu').hidden=false;$('#verBtn').hidden=false;return;}
  INTRO.open=true;el.hidden=false;
  const rank=()=>G.cars.slice().sort((a,b)=>progressOf(b,G.T)-progressOf(a,G.T));
  const nextShot=()=>{si++;st=0;if(si>=SHOTS.length){finish();return;}
    const[type,label,dur]=SHOTS[si],R=rank();
    const focus=type==='sweep'?R[0]:type==='side'?R[1]:type==='rear'?R[2]:type==='front'?R[0]:R[1];
    G.player=focus;G.cine={type,t:0,dur,cut:true};
    if(type==='rear'){focus.gauge=1;focus.boostT=0;fireBoost(focus);}
    $('#ciShot').textContent=type==='title'?'':`SHOT ${si+1} · ${label}`;
    el.classList.remove('cut');void el.offsetWidth;if(si>0&&type!=='title')el.classList.add('cut');
    el.classList.toggle('end',type==='title');};
  nextShot();
  const tick=ts=>{if(done||!G||!G.intro)return;const real=Math.min(0.25,lastTs?(ts-lastTs)/1000:0.016),dt=Math.min(0.05,real);lastTs=ts;
    const sh=SHOTS[si],air=G.player.air,scale=sh[0]==='title'?1:air?0.3:sh[3];
    const tag=scale<1?`SLOW-MO ${scale}×`:'';$('#ciTag').hidden=!tag;if(tag)$('#ciTag').textContent=tag;
    acc2+=dt*scale;while(acc2>=STEP){update(STEP);acc2-=STEP;}
    st+=real;clock+=real*scale;G.cine.t=st;
    const f=Math.floor((clock%1)*30);$('#ciTc').textContent=`00:${String(Math.floor(clock/60)).padStart(2,'0')}:${String(Math.floor(clock%60)).padStart(2,'0')}:${String(f).padStart(2,'0')}`;
    REND.draw(G,dt*Math.max(scale,0.5));
    if(st>=sh[2])nextShot();
    raf=requestAnimationFrame(tick);};
  raf=requestAnimationFrame(tick);
  el.addEventListener('click',finish);
  addEventListener('keydown',e=>{if(!INTRO.open)return;e.preventDefault();e.stopImmediatePropagation();finish();},true);
})();

// 휴대폰인데 브라우저가 '데스크톱 사이트'로 열어 화면 폭이 PC처럼 넓을 때 안내
if(matchMedia('(pointer:coarse)').matches&&innerWidth>820&&screen.width&&screen.width<600){$('#dskWarn').hidden=false;$('#dskClose').onclick=()=>{$('#dskWarn').hidden=true;};}

// ---- 전체화면: 브라우저는 사용자의 첫 터치·클릭·키 입력 때만 허락하므로, 첫 입력과 출발 버튼에서 요청 ----
function goFull(){const d=document.documentElement,f=d.requestFullscreen||d.webkitRequestFullscreen;
  if(!f||document.fullscreenElement||document.webkitFullscreenElement)return;
  try{const r=f.call(d,{navigationUI:'hide'});if(r&&r.catch)r.catch(()=>{});}catch(_){}}
{const first=()=>{goFull();removeEventListener('pointerdown',first,true);removeEventListener('keydown',first,true);};
 addEventListener('pointerdown',first,true);addEventListener('keydown',first,true);}
{const g=$('#gGo').onclick;$('#gGo').onclick=()=>{goFull();g();};}

// ---- 드라이버 이름: 인트로가 끝나면 처음 한 번 묻고(추천 이름 미리 채움), 메뉴 위 이름표를 눌러 언제든 변경 ----
function randName(){const A=['번개','씽씽','부릉','뿡뿡','쌩쌩','질주','회오리','로켓','바람','불꽃','흙먼지','미끄럼'],B=['바퀴','레이서','드리프터','꼬마차','부스터','엔진','타이어','핸들','머플러','RC킹'];
  return A[Math.random()*A.length|0]+B[Math.random()*B.length|0]+(10+Math.random()*90|0);}
function showName(){$('#nameTxt').textContent=PLAYER.name||'드라이버';}
function askName(){const d=$('#nameDlg'),i=$('#nameIn');i.value=PLAYER.name||randName();d.hidden=false;setTimeout(()=>{try{i.focus();i.select();}catch(_){}},60);}
function askNameIfNeeded(){if(!PLAYER.name)askName();}
$('#nameDice').onclick=()=>{$('#nameIn').value=randName();$('#nameIn').focus();};
$('#nameForm').addEventListener('submit',e=>{e.preventDefault();const v=$('#nameIn').value.replace(/\s+/g,' ').trim().slice(0,10)||randName();PLAYER.setName(v);showName();$('#nameDlg').hidden=true;});
$('#nameChip').onclick=askName;
showName();
if(!INTRO.open)askNameIfNeeded();
