// ---- 자동차 ----
const CARS=[
 {id:'bolt',name:'번개',design:'미드나잇 GT',kind:'A',col:{body:'#2b4a7c',dark:'#ff6a1a',light:'#9fb6d8',mid:'#1b2a44'},power:610,top:560,grip:1,mass:1,boost:2.4,desc:'남색 GT 레이서. 모든 능력이 고른 기본 차라 처음 달리는 코스에 잘 맞아요.'},
 {id:'drift',name:'드리프트킹',design:'실버 프로토',kind:'B',col:{body:'#c9ced3',dark:'#0f6e78',light:'#eef1f3',mid:'#9aa1a8'},power:600,top:605,grip:0.8,mass:0.95,boost:2.4,desc:'낮고 긴 은색 프로토타입. 꼬리가 잘 흐르고 최고 속도가 높아요. 코너는 미끄러뜨려 도세요.'},
 {id:'dozer',name:'불도저',design:'랠리 해치',kind:'C',col:{body:'#eef0ee',dark:'#d8262f',light:'#ffffff',mid:'#2a2d31'},power:560,top:540,grip:1.15,mass:1.6,boost:2.2,desc:'짧고 단단한 랠리 해치. 무거워서 부딪히면 상대가 튕겨 나가요. 가속은 느리지만 잘 붙어요.'},
 {id:'rocket',name:'로켓',design:'그라파이트 드리프트',kind:'D',col:{body:'#4a4e55',dark:'#c6ff3d',light:'#8a8f96',mid:'#2b2e33'},power:680,top:545,grip:0.95,mass:0.8,boost:3.0,desc:'가벼운 드리프트 쿠페. 출발이 빠르고 방구 부스터가 가장 세지만 부딪히면 잘 밀려요.'},
 {id:'classic',name:'클래식',design:'클래식 그린',kind:'E',col:{body:'#1f5c43',dark:'#efe6cf',light:'#5d8f78',mid:'#0f3b2a'},power:630,top:575,grip:1.05,mass:0.9,boost:2.3,desc:'둥근 앞코의 클래식 레이서. 조금 가볍고 잘 붙어서 굽은 길이 많은 코스에서 편해요.'},
 {id:'scarab',name:'스카라브',design:'데저트 버기',kind:'F',col:{body:'#c9a66b',dark:'#ff7a1a',light:'#f1e6c8',mid:'#2a2724'},power:600,top:530,grip:1,mass:1.15,boost:2.4,offM:0.4,susp:520,desc:'롤케이지를 드러낸 오프로드 버기. 최고 속도는 낮지만 길 밖 잔디·모래·진흙에서 덜 느려지고, 높은 점프도 튀지 않고 착지해요.'},
];
const STAT_DEF=[['최고 속도',c=>(c.top-520)/100],['가속',c=>(c.power-540)/160],['접지력',c=>(c.grip-0.7)/0.5],['무게',c=>(c.mass-0.7)/1.0],['방구 부스터',c=>(c.boost-2)/1.1],['험로 주행',c=>c.offM?(1-c.offM)/0.7:0.1]];
const SEL={car:0,course:0,load(){try{const s=JSON.parse(localStorage.getItem('rcgp-sel')||'{}');if(s.car>=0&&s.car<CARS.length)this.car=s.car;if(s.course>=0&&s.course<VARIANTS.length)this.course=s.course;}catch(_){}},save(){try{localStorage.setItem('rcgp-sel',JSON.stringify({car:this.car,course:this.course}));}catch(_){}}};
SEL.load();

// ---- 모바일 디오라마 코스 선택 ----
const TT={park:['#d7e8c6','#1d2a14','#6f9a4c','#4f7a34','#a5764c','#6a4529'],arcade:['#0c1230','#eef0ff','#141d52','#070b24','#cfd3e6','#e8433c'],toy:['#dff1e7','#14302a','#a8dcc1','#6fae8c','#f0d8a6','#e8433c'],
  hill:['#a9d2ec','#10202a','#5f9a4a','#4a7a3a','#45474c','#e8433c'],room:['#3a281a','#fbeedd','#b98252','#7d4f2c','#b98252','#ecdca9'],snow:['#d9e8f4','#14243a','#eef3f8','#b8c8d8','#8fa3ba','#ffffff'],
  beach:['#bfe4f2','#0f2a3a','#ecd6a4','#c9ad74','#dcbb85','#a9874f'],canyon:['#f3c08a','#3a1608','#a8532f','#7a3a1f','#c0703f','#5f2a14'],garden:['#cfe9f7','#14301a','#6fae4e','#4f8a3a','#bdb6a8','#9b4b35'],site:['#e9d9b8','#2a2010','#9a8b70','#6e6250','#8f877a','#f2c230'],harbor:['#1b2742','#eef2ff','#4a515c','#2c323b','#3b3f46','#f2c230']};
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
{let sx=null,sy=0;const st=$('#mmStage');st.addEventListener('pointerdown',e=>{sx=e.clientX;sy=e.clientY;});
  st.addEventListener('pointerup',e=>{if(sx==null)return;const dx=e.clientX-sx,dy=e.clientY-sy;sx=null;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy))ttGo(ttIdx+(dx<0?1:-1));});
  st.addEventListener('pointercancel',()=>{sx=null;});}
function setMobile(){document.body.classList.add('mobile');document.body.classList.toggle('fine',!matchMedia('(pointer:coarse)').matches);}
addEventListener('keydown',e=>{if(G||GX.open||!$('#verModal').hidden)return;if(e.code==='ArrowLeft'||e.code==='KeyA'){ttGo(ttIdx-1);}else if(e.code==='ArrowRight'||e.code==='KeyD'){ttGo(ttIdx+1);}else if(e.code==='Enter'||e.code==='Space'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)$('#mmGo').click();}});
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
    GX.turn.rotation.y+=0.008;if(GX.mesh)GX.mesh.wheels.forEach(w=>w.rotation.z-=0.04);r.render(sc,GX.cam);GX.raf=requestAnimationFrame(loop);};
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
