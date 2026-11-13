// ---- 디테일 자동차 (차고 스튜디오 시안 A~E) ----
(function(){
const V2=(x,y)=>new THREE.Vector2(x,y);
// ---- 스튜디오 반사맵 ----
function studioEnv(){
  const faces=[];for(let i=0;i<6;i++){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
    if(i===2){x.fillStyle='#e8ecf0';x.fillRect(0,0,128,128);x.fillStyle='#ffffff';x.fillRect(20,40,88,48);}
    else if(i===3){x.fillStyle='#202327';x.fillRect(0,0,128,128);}
    else{const g=x.createLinearGradient(0,0,0,128);g.addColorStop(0,'#c9d0d8');g.addColorStop(.45,'#7d858e');g.addColorStop(.55,'#2c3036');g.addColorStop(1,'#1a1c20');x.fillStyle=g;x.fillRect(0,0,128,128);
      x.fillStyle='rgba(255,255,255,.85)';x.fillRect(i%2?18:72,22,34,24);}
    faces.push(c);}
  const t=new THREE.CubeTexture(faces);t.needsUpdate=true;return t;
}
const ENV=studioEnv();
function carbonTex(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.fillStyle='#16171a';x.fillRect(0,0,64,64);
  for(let i=0;i<8;i++)for(let j=0;j<8;j++){x.fillStyle=(i+j)%2?'#26282c':'#1c1d21';x.fillRect(i*8,j*8,8,4);x.fillStyle=(i+j)%2?'#1c1d21':'#26282c';x.fillRect(i*8,j*8+4,8,4);}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,3);return t;}
const CARBON=carbonTex();
const M={
  paint:(c,o)=>new THREE.MeshPhongMaterial(Object.assign({color:c,shininess:90,specular:0x555555,envMap:ENV,combine:THREE.MixOperation,reflectivity:.28},o||{})),
  carbon:()=>new THREE.MeshPhongMaterial({color:0xffffff,map:CARBON,shininess:60,specular:0x333333}),
  black:()=>new THREE.MeshPhongMaterial({color:0x111214,shininess:20}),
  rubber:()=>new THREE.MeshPhongMaterial({color:0x17181a,shininess:8,specular:0x111111}),
  metal:(c)=>new THREE.MeshPhongMaterial({color:c,shininess:120,specular:0xaaaaaa,envMap:ENV,combine:THREE.MixOperation,reflectivity:.55}),
  glass:()=>new THREE.MeshPhongMaterial({color:0x0b1016,shininess:140,specular:0x888888,envMap:ENV,combine:THREE.MixOperation,reflectivity:.6}),
  glow:(c)=>new THREE.MeshBasicMaterial({color:c}),
};

// ---- 차체: 옆모습 곡선을 폭만큼 밀어낸 몸통 + 휠 아치 ----
function profileShape(sp){
  const s=new THREE.Shape(),t=sp.top;s.moveTo(t[0][0],t[0][1]);s.splineThru(t.slice(1).map(p=>V2(p[0],p[1])));
  const R=sp.R,cy=R,yb=sp.yb,r=R+1.5,a0=-Math.asin(Math.min(.95,(cy-yb)/r));
  const [xr,xf]=sp.axles;
  s.lineTo(xf+r*Math.cos(a0),yb);s.absarc(xf,cy,r,a0,Math.PI-a0,false);
  s.lineTo(xr+r*Math.cos(a0),yb);s.absarc(xr,cy,r,a0,Math.PI-a0,false);
  s.lineTo(t[0][0],t[0][1]);return s;
}
function bodyGeo(sp){
  const b=1.6,geo=new THREE.ExtrudeGeometry(profileShape(sp),{depth:sp.W-2*b,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:4,curveSegments:28,steps:1});
  geo.translate(0,0,-(sp.W-2*b)/2);geo.computeBoundingBox();const bb=geo.boundingBox,w=bb.max.x-bb.min.x,h=bb.max.y-bb.min.y;
  const pos=geo.attributes.position,nor=geo.attributes.normal,uv=geo.attributes.uv;
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),nz=nor.getZ(i);
    if(Math.abs(nz)>.6){let u=(x-bb.min.x)/w;if(nz<0)u=1-u;uv.setXY(i,u,(y-bb.min.y)/h);}
    else uv.setXY(i,(x-bb.min.x)/w,(z+sp.W/2)/sp.W);}
  uv.needsUpdate=true;return{geo,bb,w,h};
}
// 캔버스 데칼 도구
function decalCanvas(cw,ch){const c=document.createElement('canvas');c.width=cw;c.height=ch;return c;}
function painter(ctx,cw,ch,bb,w,h){
  return{ctx,cw,ch,
    P:(x,y)=>[(x-bb.min.x)/w*cw,ch-(y-bb.min.y)/h*ch],
    U:u=>u*cw,Vv:v=>(1-v)*ch,
    poly(pts,col){ctx.fillStyle=col;ctx.beginPath();pts.forEach((p,i)=>{const X=p[0]*cw,Y=(1-p[1])*ch;i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);});ctx.closePath();ctx.fill();},
    band(v0,v1,col,u0=0,u1=1){ctx.fillStyle=col;ctx.fillRect(u0*cw,(1-v1)*ch,(u1-u0)*cw,(v1-v0)*ch);},
    text(t,u,v,size,col,font,align,italic){ctx.fillStyle=col;ctx.font=`${italic?'italic ':''}700 ${size*ch}px ${font||'"Chakra Petch",sans-serif'}`;ctx.textAlign=align||'center';ctx.textBaseline='middle';ctx.fillText(t,u*cw,(1-v)*ch);},
  };
}
function windowPaint(p,win,frame){const ctx=p.ctx;ctx.beginPath();win.forEach((q,i)=>{const [X,Y]=p.P(q[0],q[1]);i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);});ctx.closePath();
  const ys=win.map(q=>p.P(q[0],q[1])[1]),g=ctx.createLinearGradient(0,Math.min(...ys),0,Math.max(...ys));g.addColorStop(0,'#2a3440');g.addColorStop(.35,'#0c1117');g.addColorStop(1,'#05080b');ctx.fillStyle=g;ctx.fill();
  ctx.lineWidth=frame?6:4;ctx.strokeStyle=frame||'#0a0b0d';ctx.stroke();
  ctx.save();ctx.clip();ctx.fillStyle='rgba(255,255,255,.10)';const [X0,Y0]=p.P(win[0][0],win[0][1]);ctx.beginPath();ctx.moveTo(X0+40,Y0);ctx.lineTo(X0+120,Y0-200);ctx.lineTo(X0+170,Y0-200);ctx.lineTo(X0+90,Y0);ctx.fill();ctx.restore();}
function panelLines(p,xs,ytop,ybot){const ctx=p.ctx;ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=2.5;for(const x of xs){const [X,Y1]=p.P(x,ytop),[,Y2]=p.P(x,ybot);ctx.beginPath();ctx.moveTo(X,Y1);ctx.lineTo(X,Y2);ctx.stroke();}}
function roundel(p,u,v,r,bg,ring,num,col,font){const ctx=p.ctx,X=u*p.cw,Y=(1-v)*p.ch,R=r*p.ch;ctx.fillStyle=bg;ctx.beginPath();ctx.arc(X,Y,R,0,7);ctx.fill();if(ring){ctx.lineWidth=R*.14;ctx.strokeStyle=ring;ctx.stroke();}
  ctx.fillStyle=col;ctx.font=`700 ${R*1.15}px ${font||'"Chakra Petch",sans-serif'}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(num,X,Y+R*.06);}

// ---- 부품 ----
function wheel(sp,style){
  const g=new THREE.Group(),R=sp.R,tw=sp.tw,r=1.4;
  const tire=new THREE.Mesh(new THREE.CylinderGeometry(R-0.2,R-0.2,tw-2*r,36,1,true),M.rubber());tire.rotation.x=Math.PI/2;g.add(tire);
  for(const s of[1,-1]){const tor=new THREE.Mesh(new THREE.TorusGeometry(R-r,r,10,36),M.rubber());tor.position.z=s*(tw/2-r);g.add(tor);}
  const side=new THREE.Mesh(new THREE.RingGeometry(R*.64,R-r,36),M.rubber());side.position.z=tw/2+0.01;g.add(side);
  const rimMat=M.metal(style.rim);
  const rimBarrel=new THREE.Mesh(new THREE.CylinderGeometry(R*.64,R*.64,tw-0.8,32,1,true),M.metal(0x2a2c30));rimBarrel.rotation.x=Math.PI/2;g.add(rimBarrel);
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(R*.48,R*.48,0.5,32),M.metal(0x8d9298));disc.rotation.x=Math.PI/2;disc.position.z=tw/2-1.6;g.add(disc);
  const cal=new THREE.Mesh(new THREE.BoxGeometry(2.2,1.6,1.2),M.paint(style.caliper,{envMap:null}));cal.position.set(0,R*.4,tw/2-1.3);g.add(cal);
  const n=style.spokes||6,face=new THREE.Group();face.position.z=tw/2-0.25;g.add(face);
  for(let i=0;i<n;i++){const sk=new THREE.Mesh(new THREE.BoxGeometry(style.thin?0.35:0.9,R*.6,0.7),rimMat);const a=i/n*Math.PI*2;sk.position.set(Math.sin(a)*R*.3,Math.cos(a)*R*.3,0);sk.rotation.z=-a;face.add(sk);}
  const lip=new THREE.Mesh(new THREE.TorusGeometry(R*.63,0.32,8,36),rimMat);face.add(lip);
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(R*.14,R*.14,1,16),rimMat);hub.rotation.x=Math.PI/2;face.add(hub);
  const nut=new THREE.Mesh(new THREE.CylinderGeometry(R*.07,R*.07,1.3,6),M.paint(style.caliper,{envMap:null}));nut.rotation.x=Math.PI/2;face.add(nut);
  g.userData.face=face;return g;
}
function box(w,h,d,mat,x,y,z,parent,rz){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);if(rz)m.rotation.z=rz;m.castShadow=true;parent.add(m);return m;}
function slab(a,b,width,thick,lift,mat,parent){const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy),nx=-dy/L,ny=dx/L;const m=new THREE.Mesh(new THREE.BoxGeometry(L,thick,width),mat);m.position.set((a[0]+b[0])/2+nx*lift,(a[1]+b[1])/2+ny*lift,0);m.rotation.z=Math.atan2(dy,dx);m.castShadow=true;parent.add(m);return m;}
function wingFoil(chord,span,mat){const s=new THREE.Shape();s.moveTo(0,0);s.quadraticCurveTo(chord*.4,1.1,chord,0.5);s.lineTo(chord,0.9);s.quadraticCurveTo(chord*.35,1.9,0,0.7);s.lineTo(0,0);
  const g=new THREE.ExtrudeGeometry(s,{depth:span,bevelEnabled:false,curveSegments:12});g.translate(-chord,0,-span/2);const m=new THREE.Mesh(g,mat);m.castShadow=true;return m;}
function cyl(r,h,mat,x,y,z,parent,axis){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,20),mat);if(axis==='x')m.rotation.z=Math.PI/2;if(axis==='z')m.rotation.x=Math.PI/2;m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}

// ---- 시안 5종 ----
const DESIGNS=[
 {k:'A',name:'미드나잇 GT',cls:'번개 · 기본형',desc:'긴 보닛과 패스트백 지붕, 큰 리어 윙을 단 GT 레이서. 짙은 남색 바탕에 주황 핀스트라이프 두 줄만 넣어 절제했어요.',
  sw:[['#1b2a44','미드나잇 네이비'],['#ff6a1a','시그널 오렌지'],['#1a1b1e','카본'],['#4b4f56','건메탈 휠']],parts:['패스트백 지붕','리어 윙 + 엔드플레이트','카본 스플리터','디퓨저 핀 4개','6스포크 휠'],
  sp:{W:22,R:6.8,tw:6,yb:5.1,axles:[-14,14],top:[[-22,5.1],[-22.6,10],[-21.2,13.6],[-16,15.2],[-9,19.6],[-3,21],[3,20.6],[8.5,16.2],[16,14.2],[21,11.6],[22.6,8],[22,5.1]],
   win:[[-12.5,15.9],[-6.5,19.6],[2.4,19.9],[7,16.3]],ws:[[3,20.6],[8.5,16.2]],rw:[[-14.5,16.4],[-8.6,19.9]],
   body:0x1b2a44,wheel:{rim:0x4b4f56,caliper:0xff6a1a,spokes:6},
   paint(p,S){p.band(0,1,'#1b2a44');p.band(0,.17,'#121a2a');p.band(.43,.452,'#ff6a1a',.04,.97);p.band(.405,.415,'#ff6a1a',.04,.97);
     windowPaint(p,S.win);panelLines(p,[-12.4,7],15.6,6.4);roundel(p,.5,.3,.14,'#f3f4f6',null,'07','#1b2a44');
     p.text('PUFF MOTORSPORT',.26,.26,.07,'#e9edf2');p.text('RC·GP',.78,.3,.075,'#ff6a1a');p.text('1:10 TOURING',.86,.12,.045,'#8f9bb0');},
   paintTop(p){p.band(0,1,'#1b2a44');p.band(.4,.43,'#ff6a1a');p.band(.57,.6,'#ff6a1a');},
   extras(g,S,mat){const w=wingFoil(7,S.W+3,mat.carbon);w.position.set(-16.2,22.4,0);g.add(w);for(const z of[-6,6])box(0.8,5.6,0.8,mat.carbon,-19,19.4,z,g);
     for(const s of[1,-1])box(7.6,4.2,0.5,mat.carbon,-19.6,22.6,s*(S.W/2+1.7),g);}}},
 {k:'B',name:'실버 프로토',cls:'드리프트킹 · 낮고 긴 형',desc:'르망 프로토타입처럼 바닥에 붙은 낮고 긴 차체에 둥근 캐노피와 상어 지느러미. 은색 바탕에 페트롤 청록 한 줄기가 앞에서 뒤로 휘어 올라가요.',
  sw:[['#c9ced3','리퀴드 실버'],['#0f6e78','페트롤 틸'],['#111214','블랙'],['#d9dde1','폴리시드 휠']],parts:['버블 캐노피','샤크 핀','일체형 테일 윙','프런트 다이브 플레인','메시 휠'],
  sp:{W:22,R:6.4,tw:6,yb:4.7,axles:[-15,15],top:[[-24,4.7],[-24.6,10.6],[-22,12.8],[-14,13.4],[-8,14.8],[-5,18.8],[0,20.4],[5,18.9],[9.2,14.2],[16,11.6],[22,9.2],[24.6,6.6],[24,4.7]],
   win:[[-4.4,15.6],[-0.4,19.4],[4.4,18.2],[7.6,14.8]],ws:[[5,18.9],[9.2,14.2]],
   body:0xc9ced3,wheel:{rim:0xd9dde1,caliper:0x0f6e78,spokes:12,thin:true},
   paint(p,S){p.band(0,1,'#c9ced3');p.band(0,.14,'#16181b');p.poly([[.58,.14],[1,.14],[1,.34],[.38,.62],[0,.62],[0,.48],[.32,.48]],'#0f6e78');p.poly([[0,.62],[.38,.62],[.36,.66],[0,.66]],'#111214');
     windowPaint(p,S.win);ctxRect(p,.4,.5,.16,.3,'#f4f5f6');p.text('23',.48,.35,.22,'#111214');p.text('ENDURANCE · 24H',.2,.24,.06,'#2a2d31');p.text('PUFF',.86,.48,.07,'#ffffff');},
   paintTop(p){p.band(0,1,'#c9ced3');p.band(.45,.55,'#0f6e78');p.band(.43,.45,'#111214');p.band(.55,.57,'#111214');},
   extras(g,S,mat){const fin=new THREE.Shape();fin.moveTo(-22,12.6);fin.lineTo(-8,14.6);fin.lineTo(-7,17.8);fin.lineTo(-20,16.6);fin.lineTo(-22,12.6);
     const fm=new THREE.Mesh(new THREE.ExtrudeGeometry(fin,{depth:0.6,bevelEnabled:false}),mat.body);fm.position.z=-0.3;fm.castShadow=true;g.add(fm);
     const w=wingFoil(6,S.W+2,mat.carbon);w.position.set(-19,16.6,0);g.add(w);for(const s of[1,-1]){box(7,4,0.5,mat.carbon,-21.6,15.4,s*(S.W/2+1.2),g);box(3,0.4,2.4,mat.carbon,22,7.6,s*(S.W/2-1),g,-0.25);}}}},
 {k:'C',name:'랠리 해치',cls:'불도저 · 넓고 단단한 형',desc:'짧고 높은 해치백에 지붕 스포일러, 루프 스쿠프, 보닛 위 보조등 4개, 머드플랩. 흰 바탕에 빨강 하키스틱 줄무늬와 흑연색 아래 테두리.',
  sw:[['#eef0ee','펄 화이트'],['#d8262f','시그널 레드'],['#2a2d31','그라파이트'],['#f2f2f2','화이트 휠']],parts:['지붕 스포일러','루프 스쿠프','보조등 4개','머드플랩','오프셋 줄무늬'],
  sp:{W:23,R:7,tw:6.6,yb:5.4,axles:[-12,12],top:[[-19,5.4],[-19.6,12],[-18.6,19.6],[-16,21.8],[0,22.4],[4,21.4],[10,15.6],[17.6,13.6],[20.4,10],[20,5.4]],
   win:[[-16.2,15.6],[-15.2,20.6],[2.6,20.8],[8.2,15.8]],ws:[[4,21.4],[10,15.6]],rw:[[-18.6,19.6],[-16,21.8]],
   body:0xeef0ee,wheel:{rim:0xf2f2f2,caliper:0xd8262f,spokes:5},
   paint(p,S){p.band(0,1,'#eef0ee');p.band(0,.13,'#2a2d31');p.poly([[0,.52],[.1,.52],[.28,.17],[1,.17],[1,.31],[.34,.31],[.17,.66],[0,.66]],'#d8262f');p.poly([[.17,.66],[.34,.31],[.37,.31],[.2,.66]],'#2a2d31');
     windowPaint(p,S.win);panelLines(p,[-3.5,8.2],15.4,6.4);roundel(p,.62,.47,.12,'#ffffff','#d8262f','5','#2a2d31');p.text('RALLY PUFF',.6,.24,.065,'#ffffff');p.text('GRAVEL TEAM',.84,.66,.05,'#2a2d31');},
   paintTop(p){p.band(0,1,'#eef0ee');p.band(.6,.7,'#d8262f');p.band(.7,.73,'#2a2d31');},
   extras(g,S,mat){box(5,0.8,S.W-2,mat.carbon,-17.6,22.4,0,g,-0.15);box(5,1.6,6,mat.black,-2,23.2,0,g);
     for(let i=0;i<4;i++){cyl(1.2,1,mat.chrome,15.2,15.6,(i-1.5)*3.8,g,'x');cyl(0.95,1.1,mat.glowW,15.4,15.6,(i-1.5)*3.8,g,'x');}
     box(0.6,1,S.W-4,mat.black,14.6,14.6,0,g);for(const x of[-12,12])for(const s of[1,-1])box(0.4,4,4,mat.black,x-8.4,3.6,s*(S.W/2-1.4),g);}}},
 {k:'D',name:'그라파이트 드리프트',cls:'로켓 · 가볍고 빠른 형',desc:'넓은 오버펜더와 덕테일, 높이 솟은 스완넥 윙의 드리프트 쿠페. 무광 흑연색 위에 라임 사선 데칼과 이탤릭 번호로 속도감을 냈어요.',
  sw:[['#2b2e33','무광 그라파이트'],['#c6ff3d','네온 라임'],['#f2f3f4','화이트'],['#9ea3aa','새틴 휠']],parts:['오버펜더','덕테일','스완넥 윙','사이드 덕트','5스포크 휠'],
  sp:{W:25,R:6.8,tw:7,yb:5,axles:[-14,14],top:[[-21,5],[-21.6,11],[-20.6,15.8],[-15,15.6],[-11,19],[-4,21],[3,20.5],[8,16.4],[16,14.6],[21,12],[22,8],[21.6,5]],
   win:[[-10,16.6],[-4,20],[2.5,19.8],[7,16.6]],ws:[[3,20.5],[8,16.4]],rw:[[-15,15.6],[-11,19]],
   body:0x2b2e33,matte:true,wheel:{rim:0x9ea3aa,caliper:0xc6ff3d,spokes:5},
   paint(p,S){p.band(0,1,'#2b2e33');for(let i=0;i<3;i++)p.poly([[.06+i*.07,.2],[.1+i*.07,.2],[.2+i*.07,.62],[.16+i*.07,.62]],'#c6ff3d');p.band(.15,.165,'#c6ff3d',.3,.95);
     windowPaint(p,S.win);p.text('88',.56,.38,.3,'#c6ff3d','"Chakra Petch",sans-serif','center',true);p.text('SIDEWAYS CLUB',.82,.26,.055,'#f2f3f4');p.text('PUFF',.3,.08,.05,'#9ea3aa');},
   paintTop(p){p.band(0,1,'#2b2e33');p.band(.3,.33,'#c6ff3d');p.band(.35,.36,'#f2f3f4');},
   extras(g,S,mat,g0){const w=wingFoil(7,S.W+2,mat.carbon);w.position.set(-14.6,25.4,0);g.add(w);for(const z of[-5,5]){box(0.6,6.6,0.6,mat.carbon,-18.6,21.6,z,g,0.25);}
     for(const s of[1,-1])box(7,4.4,0.5,mat.carbon,-18,25.4,s*(S.W/2+1.2),g);
     for(const x of[-14,14])for(const s of[1,-1]){const f=new THREE.Mesh(new THREE.TorusGeometry(S.R+1.9,0.9,6,20,Math.PI),mat.black);f.position.set(x,S.R,s*(S.W/2+0.3));f.castShadow=true;g0.add(f);}
     for(const s of[1,-1])box(4,1.6,0.4,mat.black,4.5,10.5,s*(S.W/2+0.15),g);}}},
 {k:'E',name:'클래식 그린',cls:'시즌 한정 · 클래식',desc:'1960년대 내구 레이서처럼 둥근 앞코와 동그란 헤드램프, 흰 번호 원판. 짙은 레이싱 그린에 아이보리 두 줄과 금색 휠로 품위를 줬어요.',
  sw:[['#0f3b2a','레이싱 그린'],['#efe6cf','아이보리'],['#c9a24a','골드 휠'],['#d7d9dc','크롬']],parts:['둥근 헤드램프','크롬 범퍼','덕테일','번호 원판','골드 메시 휠'],
  sp:{W:21,R:6.6,tw:5.6,yb:5,axles:[-14,14.5],top:[[-21,5],[-22,9],[-21,13],[-16,15],[-8,16],[-5,20],[2,20.5],[6,17],[12,15],[19,13.6],[22.6,10.6],[23,7],[22,5]],
   win:[[-4.5,16.6],[-3.6,19.6],[1.8,19.9],[5,16.8]],ws:[[2,20.5],[6,17]],
   body:0x0f3b2a,wheel:{rim:0xc9a24a,caliper:0x2a2a2a,spokes:16,thin:true},
   paint(p,S){p.band(0,1,'#0f3b2a');p.band(.3,.315,'#efe6cf',.03,.97);windowPaint(p,S.win,'#d7d9dc');roundel(p,.5,.42,.16,'#ffffff',null,'4','#111111','"Bodoni Moda",serif');
     p.text('GRAND PRIX',.2,.42,.065,'#efe6cf','"Bodoni Moda",serif');p.text('PUFF & CO.',.82,.42,.05,'#c9a24a','"Bodoni Moda",serif');},
   paintTop(p){p.band(0,1,'#0f3b2a');p.band(.38,.46,'#efe6cf');p.band(.54,.62,'#efe6cf');},
   extras(g,S,mat){for(const s of[1,-1]){cyl(1.8,1,mat.chrome,21.6,11,s*6.2,g,'x');cyl(1.4,1.2,mat.glowW,21.8,11,s*6.2,g,'x');}box(1.2,1,S.W+1,mat.chrome,23,6.4,0,g);box(1.2,1,S.W+1,mat.chrome,-22.4,6.6,0,g);
     box(3,0.6,S.W-3,mat.body,-20.4,15.4,0,g,0.3);}}},
];
function ctxRect(p,u,v,w,h,col){p.ctx.fillStyle=col;p.ctx.fillRect(u*p.cw,(1-v-h)*p.ch,w*p.cw,h*p.ch);}

const SQ=0.7;

function buildCar(D){
  const S=D.sp;
  if(!S._sq){S._sq=1;const ym=y=>y>S.yb?S.yb+(y-S.yb)*SQ:y,mp=a=>a.map(p=>[p[0],ym(p[1])]);S.top=mp(S.top);S.win=mp(S.win);S.ws=mp(S.ws);if(S.rw)S.rw=mp(S.rw);}
  const root=new THREE.Group(),inner=new THREE.Group(),g=new THREE.Group();inner.scale.setScalar(0.85);root.add(inner);inner.add(g);
  if(!S._tex){const {bb,w,h}=bodyGeo(S);const sc=decalCanvas(1024,Math.round(1024*h/w)),sp=painter(sc.getContext('2d'),sc.width,sc.height,bb,w,h);S.paint(sp,S);
    const tc=decalCanvas(1024,256),tp=painter(tc.getContext('2d'),1024,256,bb,w,h);S.paintTop(tp);S._tex=[new THREE.CanvasTexture(sc),new THREE.CanvasTexture(tc)];S._tex.forEach(t=>t.anisotropy=4);}
  const {geo}=bodyGeo(S);
  const opts=S.matte?{shininess:14,specular:0x222222,reflectivity:.06}:{};
  const body=new THREE.Mesh(geo,[M.paint(0xffffff,Object.assign({map:S._tex[0]},opts)),M.paint(0xffffff,Object.assign({map:S._tex[1]},opts))]);body.castShadow=true;g.add(body);
  const mat={carbon:M.carbon(),black:M.black(),chrome:M.metal(0xd7d9dc),glowW:M.glow(0xfff6d8),body:M.paint(S.body,opts)};
  slab(S.ws[0],S.ws[1],S.W*0.8,0.5,0.75,M.glass(),g);if(S.rw)slab(S.rw[0],S.rw[1],S.W*0.76,0.5,0.75,M.glass(),g);
  const [xr,xf]=S.axles,front=Math.max(...S.top.map(p=>p[0])),rear=Math.min(...S.top.map(p=>p[0]));
  box(xf-xr+10,1.2,S.W-3,mat.black,(xr+xf)/2,S.yb-1.4,0,g);box(5,0.7,S.W+1.5,mat.carbon,front-1.4,S.yb-0.9,0,g);
  for(const s of[1,-1])box(xf-xr-2*(S.R+2),1.4,1,mat.carbon,(xr+xf)/2,S.yb+0.4,s*(S.W/2+0.2),g);
  box(4,1.6,S.W-6,mat.carbon,rear+1.6,S.yb-0.2,0,g);for(let i=0;i<4;i++)box(4,2.4,0.3,mat.carbon,rear+1.6,S.yb-0.4,(i-1.5)*3.6,g);
  for(const s of[1,-1])cyl(0.7,2.4,mat.chrome,rear-0.4,S.yb+1.2,s*3.4,g,'x');
  const fy=S.top.find(p=>p[0]>front-3&&p[1]>S.yb+2)||[front,S.yb+5];
  if(D.k!=='E')for(const s of[1,-1])box(0.6,1.1,4.2,mat.glowW,front-0.2,fy[1]-0.4,s*(S.W/2-3.4),g);
  box(0.5,1,S.W-4,M.glow(0xff2a2a),rear-0.1,S.top[2][1]-1.2,0,g);
  for(const s of[1,-1]){box(1.6,1.1,2.2,mat.body,S.ws[1][0]-1.4,S.ws[1][1]+0.4,s*(S.W/2+0.8),g);}
  const gx=new THREE.Group();gx.scale.y=SQ;gx.position.y=S.yb*(1-SQ);g.add(gx);S.extras(gx,S,mat,g);
  const wheels=[],fronts=[];
  for(const x of S.axles)for(const s of[1,-1]){const piv=new THREE.Group();piv.position.set(x,S.R,s*(S.W/2-S.tw/2+1.6));inner.add(piv);
    const flip=new THREE.Group();if(s<0)flip.rotation.y=Math.PI;piv.add(flip);const wh=wheel(S,S.wheel);wh.position.set(0,0,0);wh.userData.sgn=s<0?-1:1;flip.add(wh);wheels.push(wh);if(x>0)fronts.push(piv);}
  root.traverse(o=>{if(o.isMesh)o.castShadow=true;});
  return{g:root,body:g,wheels,fronts,cab:new THREE.Group()};
}

const KIND={std:'A',low:'B',wide:'C',rocket:'D'};
window.CAR_DESIGNS=DESIGNS;
window.carMesh=function(col,Sc,kind){const k=KIND[kind]||kind||'A',D=DESIGNS.find(d=>d.k===k)||DESIGNS[0];const m=buildCar(D);m.g.scale.setScalar(Sc);return m;};
})();
