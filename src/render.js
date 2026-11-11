// ---- 3D 렌더러 ----
function puffTexture(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),gr=x.createRadialGradient(32,32,2,32,32,30);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);}
// 차 모양: std 기본 · low 낮고 긴 드리프트카 · wide 넓고 무거운 불도저 · rocket 로켓 부스터
function carMesh(col,S,kind){
  kind=kind||'std';const K={std:{bw:20,len:38,wr:6.5,low:0,wb:13,tr:11.5},low:{bw:20,len:42,wr:6,low:-2.5,wb:14,tr:11.5},wide:{bw:27,len:40,wr:8,low:1.5,wb:13.5,tr:14.5},rocket:{bw:19,len:38,wr:6.2,low:0,wb:13,tr:11}}[kind];
  const lam=c=>new THREE.MeshLambertMaterial({color:c}),g=new THREE.Group(),body=new THREE.Group();g.rotation.order='YZX';g.add(body);
  const add=(geo,mat,x,y,z,par)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;(par||body).add(m);return m;};
  const L=K.len,W=K.bw,y0=K.low+(K.wr-6.5);
  add(new THREE.BoxGeometry(L,6,W),lam(col.dark),0,9+y0,0);add(new THREE.BoxGeometry(L-4,6,W-2),lam(col.body),1,14+y0,0);
  const cab=add(new THREE.BoxGeometry(kind==='low'?12:14,kind==='low'?5:7,W-7),lam(col.light),-4,(kind==='low'?19:20)+y0,0);
  const sp=kind==='low'?7:5;add(new THREE.BoxGeometry(sp,1.6,W+2),lam(col.dark),-L/2+1,24+y0+(kind==='low'?2:0),0);
  add(new THREE.BoxGeometry(1.5,7,1.5),lam(0x222222),-L/2+2,20+y0,W*0.3);add(new THREE.BoxGeometry(1.5,7,1.5),lam(0x222222),-L/2+2,20+y0,-W*0.3);
  add(new THREE.BoxGeometry(2,3,W-6),lam(0xfff3c4),L/2,13+y0,0);
  if(kind==='wide'){add(new THREE.BoxGeometry(3,8,W+2),lam(0x2a2a2e),L/2+2,10+y0,0);add(new THREE.BoxGeometry(2,2,W+2),lam(0xbbbbbb),L/2+3.5,15+y0,0);}
  if(kind==='rocket'){const r=new THREE.Mesh(new THREE.CylinderGeometry(4,4,16,12),lam(0xdddddd));r.rotation.z=Math.PI/2;r.position.set(-L/2-4,18+y0,0);r.castShadow=true;body.add(r);
    const f=new THREE.Mesh(new THREE.ConeGeometry(3.6,8,12),new THREE.MeshBasicMaterial({color:0xff9a2a}));f.rotation.z=Math.PI/2;f.position.set(-L/2-15,18+y0,0);body.add(f);}
  const wg=new THREE.CylinderGeometry(K.wr,K.wr,kind==='wide'?8:6,14);wg.rotateX(Math.PI/2);const wm=lam(0x18181b),wheels=[],fronts=[];
  for(const[x,z]of[[K.wb,K.tr],[K.wb,-K.tr],[-K.wb,K.tr],[-K.wb,-K.tr]]){const piv=new THREE.Group();piv.position.set(x,K.wr,z);g.add(piv);const w=new THREE.Mesh(wg,wm);w.castShadow=true;piv.add(w);
    const hub=new THREE.Mesh(new THREE.BoxGeometry(6,2,(kind==='wide'?8:6)+0.4),lam(0xbbbbbb));w.add(hub);wheels.push(w);if(x>0)fronts.push(piv);}
  g.scale.setScalar(S);return{g,body,wheels,fronts,cab};
}
const CAM_NAMES={overview:'전체 조망 시점',drone:'드론 추격 시점',chase:'낮은 추격 시점',stand:'조종대 시점',cockpit:'차 안 시점'};
function make3D(opt){
  return{
  init(view,g){
    const T=g.T,P=T.p,N=P.length,S=0.05;this.S=S;this.opt=opt;this.camMode=opt.cams[0];this.prevMode=this.camMode;this.ch=null;
    const r=new THREE.WebGLRenderer({antialias:true});r.setPixelRatio(Math.min(2,window.devicePixelRatio||1));r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFSoftShadowMap;
    view.appendChild(r.domElement);this.r=r;
    const sc=new THREE.Scene();sc.background=new THREE.Color(opt.sky);sc.fog=new THREE.Fog(opt.sky,70,opt.fogFar);this.sc=sc;
    this.cam=new THREE.PerspectiveCamera(60,1,0.5,2000);sc.add(this.cam);
    sc.add(new THREE.HemisphereLight(opt.hemiSky,opt.hemiGround,opt.hemiI||0.75));
    const dl=new THREE.DirectionalLight(opt.sun,opt.sunI||0.85);dl.castShadow=true;dl.shadow.mapSize.set(2048,2048);const sc2=dl.shadow.camera;sc2.left=-35;sc2.right=35;sc2.top=35;sc2.bottom=-35;sc2.near=1;sc2.far=200;sc.add(dl);sc.add(dl.target);this.dl=dl;
    const lam=c=>new THREE.MeshLambertMaterial({color:c});
    const addMesh=(geo,mat,x,y,z,shadow)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);if(shadow!==false){m.castShadow=true;m.receiveShadow=true;}sc.add(m);return m;};
    // 지형
    const m=650,bx0=T.b.x0-m,bx1=T.b.x1+m,by0=T.b.y0-m,by1=T.b.y1+m,RES=opt.terrRes||150,nx=RES,ny=Math.round(RES*(by1-by0)/(bx1-bx0));
    const geo=new THREE.PlaneGeometry((bx1-bx0)*S,(by1-by0)*S,nx,ny);geo.rotateX(-Math.PI/2);
    const pos=geo.attributes.position,cols=[],cx=(bx0+bx1)/2,cy=(by0+by1)/2,cA=new THREE.Color(),gA=new THREE.Color(...opt.grass),eA=new THREE.Color(...opt.edge),rA=opt.rock?new THREE.Color(...opt.rock):null;
    for(let k=0;k<pos.count;k++){
      const wx=pos.getX(k)/S+cx,wy=pos.getZ(k)/S+cy;pos.setX(k,wx*S);pos.setZ(k,wy*S);
      const th=terrainH(T,wx,wy),ex=th.ex;let h=th.h;
      if(ex<0)h-=6;else if(ex<20)h-=6*(1-ex/20);
      const far=ex-T.falloff-60;if(far>0&&opt.hills)h+=(Math.sin(wx*0.004)*Math.cos(wy*0.005)*45+Math.sin(wx*0.011+wy*0.007)*14+30)*Math.min(1,far/260)*opt.hills;
      pos.setY(k,h*S);
      const nz=(Math.sin(wx*0.05)*Math.sin(wy*0.043)+1)*0.04;cA.copy(gA).offsetHSL(0,0,nz-0.04);if(ex<40)cA.lerp(eA,clamp(1-ex/40,0,1)*0.8);
      if(rA&&T.canyon)cA.lerp(rA,clamp(h/T.canyon.h,0,1));
      cols.push(cA.r,cA.g,cA.b);
    }
    let tmat;
    if(opt.paint){for(let k=0;k<cols.length;k++)cols[k]=1;const cv=document.createElement('canvas'),ar=(by1-by0)/(bx1-bx0);cv.width=2048;cv.height=Math.min(2048,Math.round(2048*ar));const K=cv.width/(bx1-bx0),c2=cv.getContext('2d');
      const KY=cv.height/(by1-by0);c2.setTransform(K,0,0,KY,-bx0*K,-by0*KY);opt.paint(c2,bx0,bx1,by0,by1,T);const tx=new THREE.CanvasTexture(cv);tx.anisotropy=4;tmat=new THREE.MeshLambertMaterial({map:tx,vertexColors:true});}
    else tmat=new THREE.MeshLambertMaterial({vertexColors:true});
    geo.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));geo.computeVertexNormals();
    const ter=new THREE.Mesh(geo,tmat);ter.receiveShadow=true;sc.add(ter);
    // 다리(입체교차) 아래 구간 표시: 다른 길이 아래를 지나는 곳
    const under=P.map((a,i)=>{if(a.z<25)return false;for(let j=0;j<N;j+=2){const b=P[j];const ds=Math.min(Math.abs(a.s-b.s),T.L-Math.abs(a.s-b.s));if(ds<a.w*2)continue;if(b.z<a.z-25&&Math.hypot(a.x-b.x,a.y-b.y)<(a.w+b.w)/2+10)return true;}return false;});
    // 리본(트랙/연석)
    const zAt=(a,off)=>{const ex=Math.abs(off)-a.w/2;if(ex<=0)return a.z;const f=clamp(1-ex/T.falloff,0,1);return a.z*sstep(f);};
    const ribbon=(o0,o1,lift,colFn,flat)=>{const v=[],c=[],col=new THREE.Color();
      for(let i=0;i<N;i++){const a=P[i],b=P[(i+1)%N],q=[];
        for(const[pnt,o]of[[a,o0(a)],[a,o1(a)],[b,o0(b)],[b,o1(b)]])q.push([(pnt.x+pnt.nx*o)*S,((flat?pnt.z:zAt(pnt,o))+lift)*S,(pnt.y+pnt.ny*o)*S]);
        const cc=colFn(i);if(cc==null)continue;col.set(cc);for(const t of[q[0],q[2],q[1],q[1],q[2],q[3]]){v.push(...t);c.push(col.r,col.g,col.b);}}
      const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.Float32BufferAttribute(v,3));gg.setAttribute('color',new THREE.Float32BufferAttribute(c,3));gg.computeVertexNormals();
      const mm=new THREE.Mesh(gg,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));mm.receiveShadow=true;sc.add(mm);return mm;};
    const wall=(sd,colr,topFn,botFn,skip)=>{const v=[],c=[],cl=new THREE.Color(colr);for(let i=0;i<N;i++){if(skip&&skip(i))continue;const a=P[i],b=P[(i+1)%N];const A=[(a.x+a.nx*a.w/2*sd)*S,(a.y+a.ny*a.w/2*sd)*S],B=[(b.x+b.nx*b.w/2*sd)*S,(b.y+b.ny*b.w/2*sd)*S];
        const q=[[A[0],topFn(a)*S,A[1]],[B[0],topFn(b)*S,B[1]],[A[0],botFn(a)*S,A[1]],[B[0],botFn(b)*S,B[1]]];for(const t of[q[0],q[2],q[1],q[1],q[2],q[3]]){v.push(...t);c.push(cl.r,cl.g,cl.b);}}
      const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.Float32BufferAttribute(v,3));gg.setAttribute('color',new THREE.Float32BufferAttribute(c,3));gg.computeVertexNormals();const wm=new THREE.Mesh(gg,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}));wm.castShadow=true;wm.receiveShadow=true;sc.add(wm);};
    ribbon(a=>-a.w/2,a=>a.w/2,1.5,opt.roadFn?i=>opt.roadFn(i,P,T):i=>i<2?(i%2?'#202020':'#f4f4f4'):(P[i].z-P[i].zb>2?opt.rampCol:(i%6<3?opt.road:opt.road2)));
    const ed=opt.edge2||'berm',stripe=(c1,c2)=>i=>(i>>1)%2?c1:c2;
    if(ed==='kerb'){ribbon(a=>a.w/2,a=>a.w/2+14,1.6,stripe('#d8322d','#f4f1ea'));ribbon(a=>-a.w/2-14,a=>-a.w/2,1.6,stripe('#d8322d','#f4f1ea'));}
    else if(ed==='hazard'){ribbon(a=>a.w/2,a=>a.w/2+14,1.6,stripe('#f2c230','#26262a'));ribbon(a=>-a.w/2-14,a=>-a.w/2,1.6,stripe('#f2c230','#26262a'));}
    else if(ed==='brick'){ribbon(a=>a.w/2,a=>a.w/2+16,1.7,stripe('#9b4b35','#b45c42'));ribbon(a=>-a.w/2-16,a=>-a.w/2,1.7,stripe('#9b4b35','#b45c42'));}
    else if(ed==='plastic'){ribbon(a=>a.w/2-8,a=>a.w/2,1.7,stripe('#e8433c','#ffffff'));ribbon(a=>-a.w/2,a=>-a.w/2+8,1.7,stripe('#e8433c','#ffffff'));
      for(const sd of[1,-1])wall(sd,sd>0?'#b9542f':'#d26a3e',a=>a.z+1.5,()=>-2,i=>{const a=P[i],b=P[(i+1)%N];return(a.z<2&&b.z<2)||under[i];});
      ribbon(a=>-a.w/2,a=>a.w/2,-7,i=>under[i]?'#a9472a':null,true);}
    else if(ed==='tape'){ribbon(a=>a.w/2-6,a=>a.w/2+6,1.8,()=>'#ecdca9');ribbon(a=>-a.w/2-6,a=>-a.w/2+6,1.8,()=>'#ecdca9');}
    else{ribbon(a=>a.w/2,a=>a.w/2+20,1.2,()=>opt.berm);ribbon(a=>-a.w/2-20,a=>-a.w/2,1.2,()=>opt.berm);}
    // 터널
    if(T.tun.length){const tc=opt.tunnel||{wall:0x7d7468,roof:0x5f574d,portal:0x9a9083};const wm=lam(tc.wall),pm=lam(tc.portal),rm=new THREE.MeshLambertMaterial({color:tc.roof,transparent:true,opacity:0.55,depthWrite:false});
      for(let i=0;i<N;i++){const a=P[i],b=P[(i+1)%N];if(!a.tun)continue;const ang=-Math.atan2(a.ty,a.tx),mx=(a.x+b.x)/2,my=(a.y+b.y)/2,z=(a.z+b.z)/2,L=a.len+1.5;
        for(const sd of[1,-1]){const o=sd*(a.w/2+14),w1=addMesh(new THREE.BoxGeometry(L*S,84*S,26*S),wm,(mx+a.nx*o)*S,(z+42)*S,(my+a.ny*o)*S);w1.rotation.y=ang;}
        const rf=addMesh(new THREE.BoxGeometry(L*S,10*S,(a.w+54)*S),rm,mx*S,(z+88)*S,my*S,false);rf.rotation.y=ang;rf.renderOrder=2;
        if(tc.ribs&&i%4===0){const rb=addMesh(new THREE.BoxGeometry(4*S,12*S,(a.w+60)*S),pm,mx*S,(z+90)*S,my*S);rb.rotation.y=ang;}
        const pa=P[(i-1+N)%N],nb=P[(i+1)%N];
        if(!pa.tun||!nb.tun){for(const sd of[1,-1]){const o=sd*(a.w/2+20),pl=addMesh(new THREE.BoxGeometry(18*S,104*S,40*S),pm,(a.x+a.nx*o)*S,(a.z+52)*S,(a.y+a.ny*o)*S);pl.rotation.y=ang;}
          const li=addMesh(new THREE.BoxGeometry(18*S,18*S,(a.w+80)*S),pm,a.x*S,(a.z+100)*S,a.y*S);li.rotation.y=ang;}}}
    // 미로 블록 (오락실)
    if(opt.maze){const bg=new THREE.BoxGeometry(130*S,34*S,130*S),bm=lam(0x141c55),tm=lam(0x2c3a99);for(let gx=Math.ceil(bx0/170)*170;gx<bx1;gx+=170)for(let gy=Math.ceil(by0/170)*170;gy<by1;gy+=170){const l=locate(T,gx+85,gy+85,null);if(Math.abs(l.d)-l.w/2<110)continue;
      addMesh(bg,bm,(gx+85)*S,17*S,(gy+85)*S);addMesh(new THREE.BoxGeometry(130*S,2*S,130*S),tm,(gx+85)*S,35*S,(gy+85)*S,false);}}
    // 바다
    if(opt.sea){const sw=new THREE.Mesh(new THREE.PlaneGeometry((bx1-bx0)*S,(by1-T.shore)*S),new THREE.MeshLambertMaterial({color:opt.sea,transparent:true,opacity:0.82}));sw.rotation.x=-Math.PI/2;sw.position.set(cx*S,1*S,((T.shore+by1)/2+20)*S);sc.add(sw);this.sea=sw;}
    // 빙판
    if(T.ice){const im=new THREE.MeshLambertMaterial({color:0xbfe6ff,transparent:true,opacity:0.6,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4});for(const c of T.ice){const l=locate(T,c[0],c[1],null),z=trackZ(T,l);const d=new THREE.Mesh(new THREE.CircleGeometry(c[2]*0.8*S,28),im);d.rotation.x=-Math.PI/2;d.position.set(c[0]*S,(z+2.2)*S,c[1]*S);sc.add(d);}}
    // 소품
    const rand=(()=>{let s=7;return()=>(s=(s*16807)%2147483647)/2147483647;})();
    const tt=opt.trees===true?'pine':opt.trees;
    if(tt){const mk={
        pine:()=>{const g=new THREE.Group(),c1=new THREE.Mesh(new THREE.ConeGeometry(30,95,7),lam(rand()<0.5?0x3d7a3c:0x2f6533));c1.position.y=73;c1.castShadow=true;const t1=new THREE.Mesh(new THREE.CylinderGeometry(5,6,26,6),lam(0x6b4a2e));t1.position.y=13;g.add(c1,t1);return g;},
        snow:()=>{const g=new THREE.Group(),c1=new THREE.Mesh(new THREE.ConeGeometry(30,95,7),lam(0x2f5a45));c1.position.y=73;c1.castShadow=true;const c2=new THREE.Mesh(new THREE.ConeGeometry(17,40,7),lam(0xf4f8fb));c2.position.y=104;const t1=new THREE.Mesh(new THREE.CylinderGeometry(5,6,26,6),lam(0x5a4030));t1.position.y=13;g.add(c1,c2,t1);return g;},
        cactus:()=>{const g=new THREE.Group(),m=lam(0x4f7a3a),b=new THREE.Mesh(new THREE.CylinderGeometry(9,10,80,8),m);b.position.y=40;b.castShadow=true;g.add(b);for(const sd of[-1,1]){const a=new THREE.Mesh(new THREE.CylinderGeometry(6,6,30,8),m);a.position.set(sd*16,50+sd*8,0);a.castShadow=true;const e=new THREE.Mesh(new THREE.CylinderGeometry(6,6,16,8),m);e.rotation.z=Math.PI/2;e.position.set(sd*9,36+sd*8,0);g.add(a,e);}return g;},
        palm:()=>{const g=new THREE.Group(),t=new THREE.Mesh(new THREE.CylinderGeometry(4,6,90,6),lam(0x8a6a44));t.position.y=45;t.rotation.z=0.12;t.castShadow=true;g.add(t);for(let k=0;k<6;k++){const l=new THREE.Mesh(new THREE.BoxGeometry(60,3,14),lam(k%2?0x3f8f3a:0x4fa646));l.position.set(Math.cos(k)*24+5,92,Math.sin(k)*24);l.rotation.y=-k;l.rotation.z=-0.35;l.castShadow=true;g.add(l);}return g;},
        bush:()=>{const g=new THREE.Group(),colr=[0x3f8a3c,0x4e9c48,0x357a35][(rand()*3)|0];for(let k=0;k<3;k++){const b=new THREE.Mesh(new THREE.SphereGeometry(20+rand()*10,9,7),lam(colr));b.position.set((k-1)*18,20,rand()*10-5);b.castShadow=true;g.add(b);}if(rand()<0.6){const f=new THREE.Mesh(new THREE.SphereGeometry(7,6,5),lam([0xf2667a,0xffd34d,0xffffff][(rand()*3)|0]));f.position.set(0,42,0);g.add(f);}return g;},
        piles:()=>{const g=new THREE.Group(),p=new THREE.Mesh(new THREE.ConeGeometry(60+rand()*30,50+rand()*20,9),lam(rand()<0.5?0xb89a6a:0x9a8a74));p.position.y=28;p.castShadow=true;g.add(p);return g;}}[tt];
      const cnt=opt.treeCount||70;
      for(let k=0,tries=0;k<cnt&&tries<1500;tries++){const x=lerp(bx0+200,bx1-200,rand()),y=lerp(by0+200,by1-200,rand());if(opt.sea&&y>T.shore-60)continue;const th=terrainH(T,x,y);if(th.ex<T.falloff+40+(T.canyon?T.canyon.from+T.canyon.ramp:0))continue;
        const gT=mk();gT.scale.setScalar(S*(0.8+rand()*0.7));gT.rotation.y=rand()*TAU;gT.position.set(x*S,th.h*S,y*S);sc.add(gT);k++;}}
    if(opt.tires){const tg=new THREE.TorusGeometry(9*S,4*S,6,12),tm=lam(0x1f1f22),tm2=lam(0xeeeeee);
      for(let i=0;i<N;i+=7){const a=P[i];if(a.tun)continue;for(const sd of[1,-1]){if((i/7+(sd>0?0:1))%2)continue;const o=sd*(a.w/2+34);const x=a.x+a.nx*o,y=a.y+a.ny*o;const z=zAt(a,o);for(let k=0;k<2;k++){const t=new THREE.Mesh(tg,k?tm2:tm);t.rotation.x=Math.PI/2;t.position.set(x*S,(z+4+k*8)*S,y*S);t.castShadow=true;sc.add(t);}}}}
    // 출발 게이트
    {const a=P[0],mat=lam(opt.gate);for(const sd of[1,-1]){const o=sd*(a.w/2+24);addMesh(new THREE.BoxGeometry(6*S,90*S,6*S),mat,(a.x+a.nx*o)*S,(a.z+45)*S,(a.y+a.ny*o)*S);}
      const bm=addMesh(new THREE.BoxGeometry(8*S,14*S,(a.w+60)*S),mat,a.x*S,(a.z+92)*S,a.y*S);bm.rotation.y=-Math.atan2(a.ty,a.tx);
      const ck=document.createElement('canvas');ck.width=64;ck.height=8;const cx2=ck.getContext('2d');for(let k=0;k<16;k++)for(let r2=0;r2<2;r2++){cx2.fillStyle=(k+r2)%2?'#111':'#fff';cx2.fillRect(k*4,r2*4,4,4);}
      const fl=new THREE.Mesh(new THREE.PlaneGeometry(16*S,a.w*S),new THREE.MeshLambertMaterial({map:new THREE.CanvasTexture(ck),polygonOffset:true,polygonOffsetFactor:-6,polygonOffsetUnits:-6}));fl.rotation.x=-Math.PI/2;fl.rotation.z=-Math.atan2(a.ty,a.tx)-Math.PI/2;fl.position.set(a.x*S,(a.z+2)*S,a.y*S);fl.material.map.magFilter=THREE.NearestFilter;sc.add(fl);}
    // 장애물
    if(T.obstacles)for(const o of T.obstacles){const gz0=Hxy(T,o.x+o.w/2,o.y+o.h/2,null),ox=(o.x+o.w/2)*S,oy=(o.y+o.h/2)*S;
      const bx=(w,h,d,col,x,y,z)=>addMesh(new THREE.BoxGeometry(w*S,h*S,d*S),lam(col),ox+x*S,(gz0+y)*S,oy+z*S);
      const cyl=(r1,r2,h,col,x,y,z,seg)=>addMesh(new THREE.CylinderGeometry(r1*S,r2*S,h*S,seg||14),lam(col),ox+x*S,(gz0+y)*S,oy+z*S);
      const k=o.kind;
      if(k==='cat'){bx(o.w*0.8,34,o.h*0.85,0xe39a4c,-8,17,0);const hd=addMesh(new THREE.SphereGeometry(26*S,12,10),lam(0xe39a4c),ox+(o.w/2-12)*S,(gz0+36)*S,oy);
        for(const sd of[-1,1])addMesh(new THREE.ConeGeometry(9*S,18*S,4),lam(0xd0843a),ox+(o.w/2-14)*S,(gz0+64)*S,oy+sd*13*S);for(let q=-2;q<=2;q++)bx(6,2,o.h*0.86,0xb8692a,q*18-8,35,0);bx(60,12,12,0xe39a4c,-o.w/2-20,8,o.h/2-10);}
      else if(k==='box'){bx(o.w,60,o.h,0x8e5a32,0,30,0);bx(o.w+4,6,o.h+4,0x5f391d,0,60,0);}
      else if(k==='block')bx(o.w,o.w,o.h,{A:0xd64545,B:0x2f7ad6,C:0x2f9e5b}[o.t]||0xd6a12f,0,o.w/2,0);
      else if(k==='pot'){cyl(o.w/2,o.w/2*0.75,36,0xc0623a,0,18,0);cyl(o.w/2+3,o.w/2+3,6,0xa84f2d,0,36,0);const b=addMesh(new THREE.SphereGeometry(o.w*0.42*S,10,8),lam(0x4e9c48),ox,(gz0+52)*S,oy);for(let q=0;q<4;q++)addMesh(new THREE.SphereGeometry(6*S,6,5),lam([0xf2667a,0xffd34d,0xb86ee8,0xffffff][q]),ox+Math.cos(q*1.6)*14*S,(gz0+66)*S,oy+Math.sin(q*1.6)*14*S);}
      else if(k==='can'){bx(o.w*0.7,34,o.h,0x2f8fd6,0,17,0);cyl(5,5,50,0x2f8fd6,o.w/2,30,0,8).rotation.z=-0.9;bx(8,24,8,0x226ea6,-o.w*0.2,44,0);}
      else if(k==='cone'){cyl(2,13,26,0xff6a1a,0,13,0,12);cyl(9,10,4,0xffffff,0,12,0,12);bx(30,3,30,0x222222,0,1.5,0);}
      else if(k==='barrel'){cyl(o.w/2,o.w/2,46,0x2f6ad6,0,23,0);cyl(o.w/2+1,o.w/2+1,5,0xf2c230,0,14,0);cyl(o.w/2+1,o.w/2+1,5,0xf2c230,0,34,0);}
      else bx(o.w,40,o.h,0xd9b45a,0,20,0);}
    if(!opt.stand)opt.stand=[(T.b.x0+T.b.x1)/2,(T.b.y0+T.b.y1)/2,190];
    if(opt.standMesh){const[sx,sy,sz]=opt.stand,base=Hxy(T,sx,sy,null);addMesh(new THREE.BoxGeometry(70*S,(sz-30)*S,50*S),lam(0x8a7a64),sx*S,(base+(sz-30)/2)*S,sy*S);addMesh(new THREE.BoxGeometry(74*S,4*S,54*S),lam(0xd8c9a8),sx*S,(base+sz-10)*S,sy*S,false);}
    // 자동차
    this.mark=new THREE.Mesh(new THREE.ConeGeometry(9*S,22*S,4),new THREE.MeshBasicMaterial({color:0xffe14a}));this.mark.rotation.x=Math.PI;this.mark.scale.setScalar(2.4);sc.add(this.mark);
    this.meshes=g.cars.map(c=>this.mkCar(c.col,c.kind));this.meshes.forEach(m=>sc.add(m.g));this.pi=g.cars.indexOf(g.player);
    // 먼지
    const tex=puffTexture();this.spr=[];for(let k=0;k<160;k++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false,color:0xffffff}));s.visible=false;sc.add(s);this.spr.push(s);}
    const p=g.player;this.cp=new THREE.Vector3(p.x*S,(p.z+60)*S,p.y*S);this.lt=new THREE.Vector3(p.x*S,p.z*S,p.y*S);
  },
  mkCar(col,kind){return carMesh(col,this.S,kind);},
  setMode(mode){
    const was=this.camMode;if(was===mode)return;
    if(mode==='cockpit'||was==='cockpit'){const pm=this.meshes[this.pi];
      if(mode==='cockpit'){this.cam.near=0.05;pm.cab.visible=false;}
      else{this.cam.near=0.5;pm.cab.visible=true;this.ch=null;}
      this.cam.updateProjectionMatrix();}
    if(mode!=='replay'&&mode!=='cockpit')this.prevMode=mode;
    this.camMode=mode;this._ov=null;
  },
  draw(g,dt){
    const S=this.S,r=this.r,view=r.domElement.parentNode,W=view.clientWidth,H=view.clientHeight;
    if(this._w!==W||this._h!==H){r.setSize(W,H,false);this.cam.aspect=W/H;this.cam.updateProjectionMatrix();this._w=W;this._h=H;}
    const mode=this.camMode,ov=mode==='overview',vs=ov?1.8:1.4;
    g.cars.forEach((c,k)=>{const m=this.meshes[k];m.g.position.set(c.x*S,c.z*S,c.y*S);m.g.rotation.y=-c.h;m.g.rotation.z=c.gp;m.g.rotation.x=c.gr;
      m.body.rotation.z=c.pitch;m.body.rotation.x=c.roll;m.body.position.y=c.air?-1.5:0;
      m.fronts.forEach(f=>f.rotation.y=-c.steer*0.5);m.wheels.forEach(w=>w.rotation.z=-c.dist/6.5);
      m.g.scale.setScalar(S*vs);
      m.g.visible=mode==='cockpit'&&k===this.pi?false:!(c.flash>0&&((c.flash*10)|0)%2===0);});
    const p=g.player,k=1-Math.exp(-dt*5);
    if(this._ov!==ov){this._ov=ov;this._ovInit=0;const c2=this.dl.shadow.camera,e=ov?80:35;c2.left=c2.bottom=-e;c2.right=c2.top=e;c2.far=ov?400:200;c2.updateProjectionMatrix();this.sc.fog.near=ov?400:70;this.sc.fog.far=ov?1400:this.opt.fogFar;}
    this.mark.visible=ov;if(ov){this.mark.position.set(p.x*S,(p.z+75+Math.sin(performance.now()/180)*6)*S,p.y*S);}
    if(mode==='cockpit'){
      const pm=this.meshes[this.pi];pm.g.updateMatrixWorld(true);const v=new THREE.Vector3(1,17,0);pm.body.localToWorld(v);this.cam.position.copy(v);
      if(!this._qy)this._qy=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-Math.PI/2);const q=new THREE.Quaternion();pm.body.getWorldQuaternion(q);this.cam.quaternion.copy(q).multiply(this._qy);
      if(g.shake)this.cam.rotateZ((Math.random()-0.5)*g.shake*0.002);
      this.cam.fov=lerp(this.cam.fov,74+p.speed*0.02+(p.boostT>0?8:0),0.08);this.cam.updateProjectionMatrix();
    }else if(ov){
      const az=0.42,el=40/57.3,ux=Math.sin(az),uy=Math.cos(az),rx=uy,ry=-ux,b=g.T.b,cx=(b.x0+b.x1)/2,cy=(b.y0+b.y1)/2;
      if(!this.ext){let hw=0,hn=0,hf2=0;for(const q of g.T.p){const dx=q.x-cx,dy=q.y-cy,a=Math.abs(dx*rx+dy*ry)+q.w/2,f=dx*ux+dy*uy;hw=Math.max(hw,a);hn=Math.max(hn,f+q.w/2);hf2=Math.max(hf2,-f+q.w/2);}this.ext={hw,hn,hf:hf2};}
      const asp=W/H,vf=44/57.3,hfv=2*Math.atan(Math.tan(vf/2)*asp),E=this.ext,hh=(E.hn+E.hf)/2,off=(E.hn-E.hf)/2;
      const need=Math.max(E.hw/Math.tan(hfv/2)*1.42,(hh*Math.sin(el)+100)/Math.tan(vf/2)*1.5);
      const fx=cx+ux*(off+hh*0.12)+(p.x-cx)*0.08,fy=cy+uy*off+(p.y-cy)*0.08;
      this.cp.lerp(new THREE.Vector3((fx+ux*need*Math.cos(el))*S,need*Math.sin(el)*S,(fy+uy*need*Math.cos(el))*S),this._ovInit?k*0.5:1);
      this.lt.lerp(new THREE.Vector3(fx*S,0,fy*S),this._ovInit?k*0.5:1);this._ovInit=1;this.cam.fov=lerp(this.cam.fov,44,0.08);
      this.dl.position.set(cx*S+60,150,cy*S+30);this.dl.target.position.set(cx*S,0,cy*S);
    }else if(mode==='replay'){
      const rp=g.rp,air=p.air;const want=p.h+Math.PI+Math.sin(rp.t*0.35)*1.0+(air?0.6:0);if(rp.ct==null||rp.cut)rp.ct=want;rp.ct+=wrapA(want-rp.ct)*Math.min(1,dt*1.2);const th=rp.ct,R=air?240:290+Math.sin(rp.t*0.7)*40,hgt=air?150:185+Math.sin(rp.t*0.5)*30;
      const tx=p.x+Math.cos(th)*R,ty=p.y+Math.sin(th)*R,gz=Hxy(g.T,tx,ty,null);
      this.cp.lerp(new THREE.Vector3(tx*S,(Math.max(gz,p.z)+hgt+Math.sin(rp.t*2.3)*3)*S,ty*S),rp.cut?1:Math.min(1,dt*2.5));
      this.lt.lerp(new THREE.Vector3(p.x*S,(p.z+10)*S,p.y*S),rp.cut?1:Math.min(1,dt*6));rp.cut=false;
      this.cam.fov=lerp(this.cam.fov,air?54:50,0.05);
    }else if(mode==='stand'){
      const[sx,sy,sz]=this.opt.stand,base=Hxy(g.T,sx,sy,null);this.cp.set(sx*S,(base+sz+18)*S,sy*S);
      this.lt.lerp(new THREE.Vector3(p.x*S,(p.z+8)*S,p.y*S),Math.min(1,dt*6));
      const d=Math.hypot(p.x-sx,p.y-sy,p.z-base-sz);this.cam.fov=lerp(this.cam.fov,clamp(Math.atan(150/d)*2*57.3,16,60),0.05);
    }else{
      const CM={drone:{back:150,up:125,ahead:110,lz:0,fov:52,turn:3},chase:{back:100,up:46,ahead:40,lz:12,fov:60,turn:6}}[mode];
      let tx=Math.cos(p.h),ty=Math.sin(p.h);if(p.speed>80&&p.vF>0){tx=tx*0.6+p.vx/p.speed*0.4;ty=ty*0.6+p.vy/p.speed*0.4;}
      if(this.ch==null)this.ch=p.h;this.ch+=wrapA(Math.atan2(ty,tx)-this.ch)*Math.min(1,dt*CM.turn);
      const dx=Math.cos(this.ch),dy=Math.sin(this.ch);
      const cx=p.x-dx*CM.back,cy=p.y-dy*CM.back,gz=Hxy(g.T,cx,cy,null);const cz=Math.max(p.z,gz)+CM.up;
      this.cp.lerp(new THREE.Vector3(cx*S,cz*S,cy*S),k);const mg=(Hxy(g.T,this.cp.x/S,this.cp.z/S,null)+14)*S;if(this.cp.y<mg)this.cp.y=mg;
      this.lt.lerp(new THREE.Vector3((p.x+dx*CM.ahead)*S,(p.z+CM.lz)*S,(p.y+dy*CM.ahead)*S),Math.min(1,k*2));
      this.cam.fov=lerp(this.cam.fov,CM.fov+p.speed*0.018,0.05);
    }
    if(mode!=='cockpit'){const sh=g.shake*0.004;this.cam.position.set(this.cp.x+(Math.random()-0.5)*sh,this.cp.y+(Math.random()-0.5)*sh,this.cp.z);this.cam.lookAt(this.lt);this.cam.updateProjectionMatrix();}
    if(!ov){this.dl.position.set(p.x*S+25,p.z*S+60,p.y*S+15);this.dl.target.position.set(p.x*S,p.z*S,p.y*S);}
    if(this.sea)this.sea.position.y=(1+Math.sin(performance.now()/700)*0.8)*S;
    const ck=mode==='cockpit';for(let i=0;i<this.spr.length;i++){const s=this.spr[i],q=g.parts[i];if(!q||(ck&&q.o===p)){s.visible=false;continue;}s.visible=true;s.position.set(q.x*S,(q.z+q.r*0.4)*S,q.y*S);const sc=q.r*2.2*S*(ov?1.6:1);s.scale.set(sc,sc,1);s.material.color.set(q.col);s.material.opacity=(q.life/q.max)*0.6;}
    r.render(this.sc,this.cam);
  },
  cycleCam(){const L=this.opt.cams;const base=this.camMode==='cockpit'?this.prevMode:this.camMode;const n=L[(L.indexOf(base)+1)%L.length];this.setMode(n);return CAM_NAMES[n];},
  toggleCockpit(){if(this.camMode==='cockpit'){this.setMode(this.prevMode);return CAM_NAMES[this.prevMode];}this.setMode('cockpit');return CAM_NAMES.cockpit;},
  dispose(){this.r.dispose();this.r.domElement.remove();}
  };
}
