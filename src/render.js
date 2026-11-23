// ---- 3D 렌더러 ----
function puffTexture(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),gr=x.createRadialGradient(32,32,2,32,32,30);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);}
const CAM_NAMES={overview:'전체 조망 시점',drone:'드론 추격 시점',chase:'낮은 추격 시점',stand:'조종대 시점',cockpit:'운전자 시점'};
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
      const th=terrainH(T,wx,wy),ex=th.ex;let h=opt.flatGround?0:th.h;
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
    const zAt=(a,off)=>{const ex=Math.abs(off)-a.w/2;if(ex<=0)return a.z;const f=clamp(1-ex/foAt(T,a.s),0,1);return a.z*sstep(f);};
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
    else if(ed==='parking'){const st=i=>P[i].zb>3&&!P[i].tun?null:((i>>1)%2?'#f2c230':'#2a2b2e');ribbon(a=>a.w/2,a=>a.w/2+12,1.6,st,true);ribbon(a=>-a.w/2-12,a=>-a.w/2,1.6,st,true);}
    else if(ed==='mine'){const gz=i=>{const f=P[i].s/T.L;return T.gorge&&f>T.gorge.s0-0.004&&f<T.gorge.s1+0.004;};
      // 땅 위는 석탄 흙 둔덕, 나무 다리 위는 낮은 나무 턱(난간은 없음)
      ribbon(a=>a.w/2,a=>a.w/2+18,1.2,i=>gz(i)?null:opt.berm);ribbon(a=>-a.w/2-18,a=>-a.w/2,1.2,i=>gz(i)?null:opt.berm);
      ribbon(a=>a.w/2,a=>a.w/2+7,3.2,i=>gz(i)?'#4a3420':null,true);ribbon(a=>-a.w/2-7,a=>-a.w/2,3.2,i=>gz(i)?'#4a3420':null,true);
      ribbon(a=>-a.w/2-7,a=>a.w/2+7,-6,i=>gz(i)?'#3a2a1a':null,true);}
    else if(ed==='volcano'){const gz=i=>{const f=P[i].s/T.L;return T.gorge&&f>T.gorge.s0-0.004&&f<T.gorge.s1+0.004;};
      // 땅 위는 검은 현무암 둔덕, 돌다리 위는 낮은 돌 턱(난간 없음) + 다리 아래 돌판
      ribbon(a=>a.w/2,a=>a.w/2+18,1.2,i=>gz(i)?null:opt.berm);ribbon(a=>-a.w/2-18,a=>-a.w/2,1.2,i=>gz(i)?null:opt.berm);
      ribbon(a=>a.w/2,a=>a.w/2+8,3.4,i=>gz(i)?((i>>1)%2?'#4a4340':'#3c3634'):null,true);ribbon(a=>-a.w/2-8,a=>-a.w/2,3.4,i=>gz(i)?((i>>1)%2?'#4a4340':'#3c3634'):null,true);
      ribbon(a=>-a.w/2-8,a=>a.w/2+8,-7,i=>gz(i)?'#241e1c':null,true);}
    else if(ed==='dock'){ribbon(a=>a.w/2,a=>a.w/2+12,1.6,stripe('#f2c230','#30343b'));ribbon(a=>-a.w/2-12,a=>-a.w/2,1.6,stripe('#f2c230','#30343b'));}
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
    // 운하 물 (도개교 아래)
    if(T.canal){const cw=new THREE.Mesh(new THREE.PlaneGeometry((T.canal[1]-T.canal[0]+40)*S,560*S),new THREE.MeshLambertMaterial({color:0x2a6f9a,transparent:true,opacity:0.85}));cw.rotation.x=-Math.PI/2;cw.position.set((T.canal[0]+T.canal[1])/2*S,-20*S,0);sc.add(cw);this.canalW=cw;
      // 도개교: 들린 다리 끝의 탑 두 개와 위쪽 빔
      const bb=T.bumps[0],l0=T.p.find(q=>q.s>=bb.s0+90)||T.p[0],ang=-Math.atan2(l0.ty,l0.tx),tm=lam(0x8c2f24),dm=lam(0x30343b);
      for(const sd of[1,-1]){const o=sd*(l0.w/2+22);addMesh(new THREE.BoxGeometry(22*S,140*S,22*S),tm,(l0.x+l0.nx*o)*S,(l0.z+70)*S,(l0.y+l0.ny*o)*S).rotation.y=ang;
        const cb=addMesh(new THREE.BoxGeometry(36*S,30*S,30*S),dm,(l0.x+l0.nx*o-l0.tx*14)*S,(l0.z+150)*S,(l0.y+l0.ny*o-l0.ty*14)*S);cb.rotation.y=ang;}
      const bm2=addMesh(new THREE.BoxGeometry(14*S,12*S,(l0.w+66)*S),tm,l0.x*S,(l0.z+134)*S,l0.y*S);bm2.rotation.y=ang;
      for(const sd of[1,-1])for(let q=0;q<3;q++){const o=sd*(l0.w/2+6),pp=T.p.find(z=>z.s>=bb.s0+q*30)||l0;addMesh(new THREE.CylinderGeometry(3*S,3*S,22*S,8),lam(q%2?0x111111:0xf2c230),(pp.x+pp.nx*o)*S,(pp.z+11)*S,(pp.y+pp.ny*o)*S);}}
    // 가로등 (밤 항구)
    if(opt.lamps){const pm2=lam(0x3a3f47),hm=new THREE.MeshBasicMaterial({color:0xffd27a}),gm=new THREE.MeshBasicMaterial({color:0xffc260,transparent:true,opacity:0.18,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-5,polygonOffsetUnits:-5});
      if(!this.lamps){this.lamps=[];this.lampDark=lam(0x2a2d33);}
      for(let i=3;i<N;i+=10){const a=P[i];if(a.tun||a.z<-4||(opt.garage&&a.zb>3))continue;const sd=(i/10|0)%2?1:-1,o=sd*(a.w/2+30),x=a.x+a.nx*o,y=a.y+a.ny*o,z=zAt(a,o);
        // 가로등: 밑동(stump) + 윗부분(top, 밑동 위에서 꺾이거나 통째로 날아감)
        const base=new THREE.Group();base.position.set(x*S,z*S,y*S);sc.add(base);
        const mk=(geo,mat,px,py,pz,par)=>{const m=new THREE.Mesh(geo,mat);m.position.set(px,py,pz);m.castShadow=true;par.add(m);return m;};
        mk(new THREE.CylinderGeometry(2.8*S,3*S,16*S,8),pm2,0,8*S,0,base);
        const top=new THREE.Group();top.position.y=16*S;base.add(top);
        mk(new THREE.CylinderGeometry(2.2*S,2.8*S,64*S,8),pm2,0,32*S,0,top);
        const ax=-a.nx*sd,ay=-a.ny*sd;const arm=mk(new THREE.BoxGeometry(3*S,3*S,26*S),pm2,ax*12*S,64*S,ay*12*S,top);arm.rotation.y=-Math.atan2(a.ny,a.nx)+Math.PI/2;
        const head=mk(new THREE.BoxGeometry(10*S,4*S,10*S),hm,ax*24*S,62*S,ay*24*S,top);
        const pool=new THREE.Mesh(new THREE.CircleGeometry(58*S,20),gm);pool.rotation.x=-Math.PI/2;pool.position.set((x-a.nx*sd*30)*S,(a.z+2.4)*S,(y-a.ny*sd*30)*S);sc.add(pool);
        this.lamps.push({x,y,z,base,top,head,pool,st:0});}}
    // 주차빌딩: 층마다 창이 뚫린 외벽, 난간, 다리 구간 바닥판과 기둥, 가운데 계단실과 네온 간판
    if(opt.garage){const fac=[],fcol=[],cl=new THREE.Color(),RO=20,el=a=>a.zb>3&&!a.tun,lr=(()=>{let q=11;return()=>(q=(q*48271)%2147483647)/2147483647;})();
      const quad=(A,B,z0a,z1a,z0b,z1b,col)=>{cl.set(col);const q=[[A[0],z1a,A[1]],[B[0],z1b,B[1]],[A[0],z0a,A[1]],[B[0],z0b,B[1]]];for(const t of[q[0],q[2],q[1],q[1],q[2],q[3]]){fac.push(t[0]*S,t[1]*S,t[2]*S);fcol.push(cl.r,cl.g,cl.b);}};
      for(let i=0;i<N;i++){const a=P[i],b=P[(i+1)%N];if(!el(a)&&!el(b))continue;
        for(const sd of[1,-1]){const o=a.w/2+RO,A=[a.x+a.nx*o*sd,a.y+a.ny*o*sd],B=[b.x+b.nx*o*sd,b.y+b.ny*o*sd];
          quad(A,B,a.z,a.z+15,b.z,b.z+15,'#c9c4ba');quad(A,B,a.z+15,a.z+18,b.z+15,b.z+18,'#e9e4da');
          const lit=lr()<0.3;
          if(under[i])quad(A,B,a.z-14,a.z,b.z-14,b.z,'#9e998f');
          else for(let f=0;f<a.z-2;f+=34){const top=Math.min(a.z,f+34),z0=f,z1=f+10,z2=Math.min(top,f+30);quad(A,B,z0,z1,z0,z1,'#a9a49b');if(z2>z1)quad(A,B,z1,z2,z1,z2,lit&&f>0?'#ffd27a':((i>>2)%2?'#2b3540':'#34404c'));if(top>z2)quad(A,B,z2,top,z2,top,'#a9a49b');}}}
      const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.Float32BufferAttribute(fac,3));fg.setAttribute('color',new THREE.Float32BufferAttribute(fcol,3));fg.computeVertexNormals();
      const fm=new THREE.Mesh(fg,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}));fm.castShadow=true;fm.receiveShadow=true;sc.add(fm);
      // 난간과 길 사이 바닥(평평하게) + 다리 아래 바닥판
      ribbon(a=>a.w/2,a=>a.w/2+RO,1.5,i=>el(P[i])?'#8d8f94':null,true);ribbon(a=>-a.w/2-RO,a=>-a.w/2,1.5,i=>el(P[i])?'#8d8f94':null,true);
      ribbon(a=>-a.w/2-RO,a=>a.w/2+RO,-14,i=>under[i]?'#8a857c':null,true);
      const pm=lam(0xb3aea4);for(let i=0;i<N;i+=5){const a=P[i];if(!under[i])continue;for(const sd of[1,-1]){const o=sd*(a.w/2+8);addMesh(new THREE.BoxGeometry(14*S,(a.z-14)*S,14*S),pm,(a.x+a.nx*o)*S,(a.z-14)/2*S,(a.y+a.ny*o)*S);}}
      // 가운데 계단실 + 물탱크 + 네온 P 간판
      const [gx,gy,gh]=opt.garage;addMesh(new THREE.BoxGeometry(150*S,gh*S,150*S),lam(0xb9b4aa),gx*S,gh/2*S,gy*S);addMesh(new THREE.BoxGeometry(160*S,8*S,160*S),lam(0xe2ddd2),gx*S,(gh+4)*S,gy*S);
      for(let k=0;k<4;k++)addMesh(new THREE.BoxGeometry(152*S,18*S,152*S),lam(k%2?0x2b3540:0xffd27a),gx*S,(30+k*40)*S,gy*S,false);
      for(const dx of[-35,35]){addMesh(new THREE.CylinderGeometry(22*S,22*S,40*S,16),lam(0x6f8fa8),(gx+dx)*S,(gh+28)*S,gy*S);addMesh(new THREE.CylinderGeometry(23*S,23*S,4*S,16),lam(0x4f6b80),(gx+dx)*S,(gh+49)*S,gy*S);}
      const cv=document.createElement('canvas');cv.width=256;cv.height=128;const x2=cv.getContext('2d');x2.fillStyle='#0f1a3a';x2.fillRect(0,0,256,128);x2.strokeStyle='#5fd0ff';x2.lineWidth=8;x2.strokeRect(8,8,240,112);
      x2.fillStyle='#5fd0ff';x2.font='900 92px sans-serif';x2.textAlign='center';x2.textBaseline='middle';x2.fillText('P',70,68);x2.fillStyle='#ff5fa8';x2.font='800 40px sans-serif';x2.fillText('주차',172,50);x2.fillStyle='#ffe066';x2.font='700 26px sans-serif';x2.fillText('24H',172,94);
      const sm=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cv),side:THREE.DoubleSide});for(const r of[0,Math.PI/2]){const sg=new THREE.Mesh(new THREE.PlaneGeometry(130*S,65*S),sm);sg.position.set(gx*S,(gh+95)*S,gy*S);sg.rotation.y=r;sc.add(sg);}
      for(const sd of[-1,1])addMesh(new THREE.BoxGeometry(4*S,40*S,4*S),lam(0x30343b),(gx+sd*40)*S,(gh+60)*S,gy*S);}
    // 폐광: 트레슬 다리 버팀목, 골짜기 개울, 광차 레일 건널목, 권양탑, 갱도 랜턴
    if(opt.mine){const rand0=(()=>{let q=13;return()=>(q=(q*16807)%2147483647)/2147483647;})(),mo=opt.mine,wd=lam(0x5a3d24),wd2=lam(0x6b4a2e),stl=lam(0x6d7177),G=T.gorge;
      const inG=a=>{const f=a.s/T.L;return f>G.s0-0.01&&f<G.s1+0.01&&a.zb>6;};
      const beam=(x0,y0,z0,x1,y1,z1,t,m)=>{const A=new THREE.Vector3(x0*S,z0*S,y0*S),B=new THREE.Vector3(x1*S,z1*S,y1*S),L=A.distanceTo(B),b=new THREE.Mesh(new THREE.BoxGeometry(t*S,L,t*S),m);b.position.copy(A).add(B).multiplyScalar(.5);b.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.clone().sub(A).normalize());b.castShadow=true;sc.add(b);return b;};
      for(let i=0;i<N;i+=5){const a=P[i];if(!inG(a))continue;const z=a.z-6,o=a.w/2-8,L1=[a.x+a.nx*o,a.y+a.ny*o],R1=[a.x-a.nx*o,a.y-a.ny*o],O1=[a.x+a.nx*(o+26),a.y+a.ny*(o+26)],O2=[a.x-a.nx*(o+26),a.y-a.ny*(o+26)];
        // 기둥 둘 + 바깥으로 벌어진 버팀 다리 + 가로대 + X자 가새
        beam(L1[0],L1[1],-10,L1[0],L1[1],z,7,wd);beam(R1[0],R1[1],-10,R1[0],R1[1],z,7,wd);beam(O1[0],O1[1],-10,L1[0],L1[1],z*0.9,5,wd2);beam(O2[0],O2[1],-10,R1[0],R1[1],z*0.9,5,wd2);
        beam(L1[0],L1[1],z-2,R1[0],R1[1],z-2,7,wd2);for(const f of[0.5])beam(L1[0],L1[1],z*f,R1[0],R1[1],z*f,5,wd2);
        beam(L1[0],L1[1],z*0.08,R1[0],R1[1],z*0.5,4,wd2);beam(R1[0],R1[1],z*0.08,L1[0],L1[1],z*0.5,4,wd2);beam(L1[0],L1[1],z*0.5,R1[0],R1[1],z*0.95,4,wd2);beam(R1[0],R1[1],z*0.5,L1[0],L1[1],z*0.95,4,wd2);}
      // 골짜기 바닥 개울과 바위
      if(mo.river){const[[x0,x1],[y0,y1]]=mo.river,rw=new THREE.Mesh(new THREE.PlaneGeometry((x1-x0)*S,(y1-y0)*S),new THREE.MeshLambertMaterial({color:0x4f7d8c,transparent:true,opacity:0.85}));rw.rotation.x=-Math.PI/2;rw.position.set((x0+x1)/2*S,-2*S,(y0+y1)/2*S);sc.add(rw);
        const rk=lam(0x6f6a64);for(let k=0;k<26;k++){const y=lerp(y0,y1,rand0()),sd=rand0()<0.5?x0-10:x1+10;addMesh(new THREE.DodecahedronGeometry((8+rand0()*14)*S,0),rk,(sd+(rand0()-0.5)*30)*S,0,y*S);}}
      // 광차 레일 건널목 + 광차
      if(mo.cart!=null){const a=P[Math.round(mo.cart*N)%N],ang=-Math.atan2(a.ny,a.nx),rl=a.w+300;
        for(const q of[-11,11]){const r=addMesh(new THREE.BoxGeometry(rl*S,3*S,3*S),stl,(a.x+a.tx*q)*S,(a.z+2.6)*S,(a.y+a.ty*q)*S);r.rotation.y=ang;}
        for(let k=-rl/2;k<=rl/2;k+=16){const x=a.x+a.nx*k,y=a.y+a.ny*k,ex=Math.abs(k)-a.w/2;if(ex<0)continue;const t=addMesh(new THREE.BoxGeometry(5*S,2*S,34*S),wd,x*S,(a.z*sstep(clamp(1-ex/foAt(T,a.s),0,1))+1)*S,y*S);t.rotation.y=ang+Math.PI/2;}
        const cx=a.x+a.nx*(a.w/2+90),cy=a.y+a.ny*(a.w/2+90),cz=a.z*sstep(clamp(1-90/foAt(T,a.s),0,1)),cg=new THREE.Group();cg.position.set(cx*S,cz*S,cy*S);cg.rotation.y=ang;cg.scale.setScalar(S);sc.add(cg);
        const bx=(w,h,d,c,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),lam(c));m.position.set(x,y,z);m.castShadow=true;cg.add(m);return m;};
        bx(40,18,26,0x7a4a2a,0,16,0);bx(42,3,28,0x3a3d42,0,25,0);bx(36,6,22,0x1c1a19,0,27,0);for(const x of[-12,12])for(const z of[-11,11]){const w=new THREE.Mesh(new THREE.CylinderGeometry(5,5,3,12),lam(0x2a2c30));w.rotation.x=Math.PI/2;w.position.set(x,6,z);cg.add(w);}}
      // 권양탑(광산 탑): 철골 A자 탑 + 큰 바퀴
      if(mo.headframe){const[hx,hy]=mo.headframe,hz=Hxy(T,hx,hy,null),hg=new THREE.Group();hg.position.set(hx*S,hz*S,hy*S);hg.scale.setScalar(S);sc.add(hg);const fm=lam(0x8a3a24);
        const lg=(x0,z0,y0,x1,z1,y1,t)=>{const A=new THREE.Vector3(x0,y0,z0),B=new THREE.Vector3(x1,y1,z1),L=A.distanceTo(B),b=new THREE.Mesh(new THREE.BoxGeometry(t,L,t),fm);b.position.copy(A).add(B).multiplyScalar(.5);b.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.clone().sub(A).normalize());b.castShadow=true;hg.add(b);};
        for(const z of[-30,30]){lg(-40,z,0,-12,z*0.4,190,6);lg(40,z,0,12,z*0.4,190,6);for(let h=40;h<180;h+=45)lg(-40+h*0.147,z*(1-h/316),h,40-h*0.147,z*(1-h/316),h,4);}
        lg(-60,0,0,-8,0,170,7);const wh=new THREE.Mesh(new THREE.TorusGeometry(26,3,8,24),lam(0x2a2c30));wh.position.set(0,196,0);hg.add(wh);for(let k=0;k<6;k++){const sp=new THREE.Mesh(new THREE.BoxGeometry(2,50,2),lam(0x2a2c30));sp.position.set(0,196,0);sp.rotation.z=k*Math.PI/6;hg.add(sp);}
        const sh=new THREE.Mesh(new THREE.BoxGeometry(110,46,80),lam(0x6b5a48));sh.position.set(-90,23,0);sh.castShadow=true;hg.add(sh);const rf=new THREE.Mesh(new THREE.BoxGeometry(118,6,88),lam(0x3a3129));rf.position.set(-90,49,0);hg.add(rf);}
      // 랜턴: 나무 기둥에 매단 따뜻한 등 + 바닥 불빛
      const lm=new THREE.MeshBasicMaterial({color:0xffc46a}),gm=new THREE.MeshBasicMaterial({color:0xffb04a,transparent:true,opacity:0.2,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-5,polygonOffsetUnits:-5});
      for(let i=6;i<N;i+=11){const a=P[i];const sd=(i/11|0)%2?1:-1,o=sd*(a.w/2+(inG(a)?-4:26)),x=a.x+a.nx*o,y=a.y+a.ny*o,z=a.tun||inG(a)?a.z:zAt(a,o);
        if(a.tun){addMesh(new THREE.BoxGeometry(6*S,6*S,6*S),lm,x*S,(a.z+70)*S,y*S,false);continue;}
        // 나무 기둥 랜턴: 밑동 + 윗부분(부딪히면 꺾이거나 날아감 — 가로등과 같은 처리)
        if(!this.lamps){this.lamps=[];this.lampDark=lam(0x2a2d33);}
        const base=new THREE.Group();base.position.set(x*S,z*S,y*S);sc.add(base);
        const mk=(geo,mat,px,py,pz,par)=>{const m=new THREE.Mesh(geo,mat);m.position.set(px,py,pz);m.castShadow=true;par.add(m);return m;};
        mk(new THREE.BoxGeometry(5.6*S,14*S,5.6*S),wd,0,7*S,0,base);
        const top=new THREE.Group();top.position.y=14*S;base.add(top);
        mk(new THREE.BoxGeometry(5*S,48*S,5*S),wd,0,24*S,0,top);
        const ax=-a.nx*sd,ay=-a.ny*sd;const arm=mk(new THREE.BoxGeometry(22*S,4*S,4*S),wd,ax*9*S,46*S,ay*9*S,top);arm.rotation.y=-Math.atan2(a.ny,a.nx);
        const head=mk(new THREE.BoxGeometry(7*S,10*S,7*S),lm,ax*18*S,38*S,ay*18*S,top);
        const pool=new THREE.Mesh(new THREE.CircleGeometry(46*S,18),gm);pool.rotation.x=-Math.PI/2;pool.position.set((x-a.nx*sd*24)*S,(a.z+2.4)*S,(y-a.ny*sd*24)*S);sc.add(pool);
        this.lamps.push({x,y,z,base,top,head,pool,st:0});}}
    // 화산섬: 분화구 산 + 용암(강·웅덩이·분화구) + 연기 + 돌다리 기둥 + 용암 동굴 빛 틈
    if(opt.volcano){const rnd=(()=>{let q=29;return()=>(q=(q*16807)%2147483647)/2147483647;})();
      const lvM=new THREE.MeshBasicMaterial({color:0xff7a1a});this.lavaM=lvM;const lvG=new THREE.MeshBasicMaterial({color:0xff5a14,transparent:true,opacity:0.35,depthWrite:false});
      const pl=(x0,x1,y0,y1,z,m,pad)=>{const w=new THREE.Mesh(new THREE.PlaneGeometry((x1-x0+2*(pad||0))*S,(y1-y0+2*(pad||0))*S),m);w.rotation.x=-Math.PI/2;w.position.set((x0+x1)/2*S,z*S,(y0+y1)/2*S);sc.add(w);return w;};
      for(const R of[T.river,[T.pool[0],T.pool[1],T.pool[2],T.pool[3]]]){const[x0,x1,y0,y1]=R;pl(x0,x1,y0,y1,1.2,lvM);pl(x0,x1,y0,y1,1.6,lvG,10);
        const ck=lam(0x2a201d);for(let k=0;k<14;k++){const b=addMesh(new THREE.DodecahedronGeometry((6+rnd()*10)*S,0),ck,lerp(x0,x1,rnd())*S,2*S,lerp(y0,y1,rnd())*S,false);b.scale.y=0.4;}}
      // 분화구 산: 거친 원뿔 + 꼭대기 용암 + 붉은 테두리
      const[ccx,ccy,cr,chh]=T.crater,cg=new THREE.ConeGeometry(cr*S,chh*S,22,6,true),cp=cg.attributes.position;
      for(let k=0;k<cp.count;k++){const y=cp.getY(k);if(y<chh*S/2-0.01){const f=1+(rnd()-0.5)*0.14;cp.setX(k,cp.getX(k)*f);cp.setZ(k,cp.getZ(k)*f);}}cg.computeVertexNormals();
      const cone=addMesh(cg,lam(0x3a2e2a),ccx*S,chh/2*S,ccy*S);cone.scale.set(1,1,1);
      const top=new THREE.Mesh(new THREE.CircleGeometry(cr*0.3*S,20),lvM);top.rotation.x=-Math.PI/2;top.position.set(ccx*S,(chh*0.72)*S,ccy*S);sc.add(top);
      const lip=addMesh(new THREE.TorusGeometry(cr*0.3*S,8*S,6,20),lam(0x5a2a1e),ccx*S,(chh*0.72)*S,ccy*S,false);lip.rotation.x=Math.PI/2;
      // 산허리를 흘러내리는 용암 줄기 두 개
      for(const a0 of[0.6,2.4]){for(let k=0;k<6;k++){const t=k/6,r=lerp(cr*0.3,cr*0.95,t),h=lerp(chh*0.72,chh*0.04,t);const st=addMesh(new THREE.BoxGeometry(14*S,3*S,(cr*0.12)*S),lvM,(ccx+Math.cos(a0+t*0.3)*r)*S,(h+2)*S,(ccy+Math.sin(a0+t*0.3)*r)*S,false);st.rotation.y=-(a0+t*0.3);st.rotation.z=0;}}
      // 분화구 연기 (매 프레임 위로 피어오름)
      const tex=puffTexture();this.smoke=[];for(let k=0;k<9;k++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false,color:0x8a7f7a,opacity:0.5}));sc.add(sp);this.smoke.push({sp,ph:k/9});}
      this.smokeAt=[ccx*S,chh*0.72*S,ccy*S];
      // 돌다리 아래 현무암 기둥
      const bm=lam(0x2c2624);for(let i=0;i<N;i+=4){const a=P[i],f=a.s/T.L;if(!(f>T.gorge.s0&&f<T.gorge.s1))continue;for(const sd of[1,-1]){const o=sd*(a.w/2-14);addMesh(new THREE.CylinderGeometry(9*S,11*S,a.z*S,6),bm,(a.x+a.nx*o)*S,a.z/2*S,(a.y+a.ny*o)*S);}}
      // 용암 동굴: 벽 아래 붉게 빛나는 틈 + 동굴을 덮는 바위 둔덕
      const gm2=new THREE.MeshBasicMaterial({color:0xff6a1a});for(let i=0;i<N;i++){const a=P[i];if(!a.tun||i%3)continue;const ang=-Math.atan2(a.ty,a.tx);for(const sd of[1,-1]){const o=sd*(a.w/2+1.5),m=addMesh(new THREE.BoxGeometry(a.len*3*S,3*S,2*S),gm2,(a.x+a.nx*o)*S,(a.z+8+((i/3)%2)*14)*S,(a.y+a.ny*o)*S,false);m.rotation.y=ang;}}
      const rk=lam(0x2e2522);for(let i=0;i<N;i+=3){const a=P[i];if(!a.tun)continue;for(const sd of[1,-1]){const o=sd*(a.w/2+60+rnd()*30);const r=addMesh(new THREE.DodecahedronGeometry((50+rnd()*30)*S,0),rk,(a.x+a.nx*o)*S,(a.z+30)*S,(a.y+a.ny*o)*S);r.rotation.set(rnd(),rnd(),rnd());}}}
    // 빙판
    if(T.ice){const im=new THREE.MeshLambertMaterial({color:0xbfe6ff,transparent:true,opacity:0.6,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4});for(const c of T.ice){const l=locate(T,c[0],c[1],null),z=trackZ(T,l);const d=new THREE.Mesh(new THREE.CircleGeometry(c[2]*0.8*S,28),im);d.rotation.x=-Math.PI/2;d.position.set(c[0]*S,(z+2.2)*S,c[1]*S);sc.add(d);}}
    // 소품
    const rand=(()=>{let s=7;return()=>(s=(s*16807)%2147483647)/2147483647;})();
    const tt=opt.trees===true?'pine':opt.trees;
    if(tt){const MK={
        pine:()=>{const g=new THREE.Group(),c1=new THREE.Mesh(new THREE.ConeGeometry(30,95,7),lam(rand()<0.5?0x3d7a3c:0x2f6533));c1.position.y=73;c1.castShadow=true;const t1=new THREE.Mesh(new THREE.CylinderGeometry(5,6,26,6),lam(0x6b4a2e));t1.position.y=13;g.add(c1,t1);return g;},
        snow:()=>{const g=new THREE.Group(),c1=new THREE.Mesh(new THREE.ConeGeometry(30,95,7),lam(0x2f5a45));c1.position.y=73;c1.castShadow=true;const c2=new THREE.Mesh(new THREE.ConeGeometry(17,40,7),lam(0xf4f8fb));c2.position.y=104;const t1=new THREE.Mesh(new THREE.CylinderGeometry(5,6,26,6),lam(0x5a4030));t1.position.y=13;g.add(c1,c2,t1);return g;},
        cactus:()=>{const g=new THREE.Group(),m=lam(0x4f7a3a),b=new THREE.Mesh(new THREE.CylinderGeometry(9,10,80,8),m);b.position.y=40;b.castShadow=true;g.add(b);for(const sd of[-1,1]){const a=new THREE.Mesh(new THREE.CylinderGeometry(6,6,30,8),m);a.position.set(sd*16,50+sd*8,0);a.castShadow=true;const e=new THREE.Mesh(new THREE.CylinderGeometry(6,6,16,8),m);e.rotation.z=Math.PI/2;e.position.set(sd*9,36+sd*8,0);g.add(a,e);}return g;},
        palm:()=>{const g=new THREE.Group(),t=new THREE.Mesh(new THREE.CylinderGeometry(4,6,90,6),lam(0x8a6a44));t.position.y=45;t.rotation.z=0.12;t.castShadow=true;g.add(t);for(let k=0;k<6;k++){const l=new THREE.Mesh(new THREE.BoxGeometry(60,3,14),lam(k%2?0x3f8f3a:0x4fa646));l.position.set(Math.cos(k)*24+5,92,Math.sin(k)*24);l.rotation.y=-k;l.rotation.z=-0.35;l.castShadow=true;g.add(l);}return g;},
        bush:()=>{const g=new THREE.Group(),colr=[0x3f8a3c,0x4e9c48,0x357a35][(rand()*3)|0];for(let k=0;k<3;k++){const b=new THREE.Mesh(new THREE.SphereGeometry(20+rand()*10,9,7),lam(colr));b.position.set((k-1)*18,20,rand()*10-5);b.castShadow=true;g.add(b);}if(rand()<0.6){const f=new THREE.Mesh(new THREE.SphereGeometry(7,6,5),lam([0xf2667a,0xffd34d,0xffffff][(rand()*3)|0]));f.position.set(0,42,0);g.add(f);}return g;},
        port:()=>{const g=new THREE.Group(),CC=[0xb8432f,0x2e6da4,0xe2b33c,0x3c8d5a,0xd9822b,0x8a8f96,0x1f6f78];
          if(rand()<0.12){const cm=lam(0xf2c230);for(const x of[-40,40])for(const z of[-30,30]){const lg=new THREE.Mesh(new THREE.BoxGeometry(8,170,8),cm);lg.position.set(x,85,z);lg.castShadow=true;g.add(lg);}
            const bm=new THREE.Mesh(new THREE.BoxGeometry(260,14,16),cm);bm.position.set(60,176,0);bm.castShadow=true;g.add(bm);const cab=new THREE.Mesh(new THREE.BoxGeometry(26,20,24),lam(0x30343b));cab.position.set(20,162,0);g.add(cab);
            const ro=new THREE.Mesh(new THREE.BoxGeometry(2,70,2),lam(0x222222));ro.position.set(150,135,0);g.add(ro);const hk=new THREE.Mesh(new THREE.BoxGeometry(14,8,14),lam(0x222222));hk.position.set(150,98,0);g.add(hk);return g;}
          const cols=1+(rand()*2|0),h=1+(rand()*3|0);for(let cI=0;cI<cols;cI++)for(let k=0;k<h-(cI&&rand()<0.5?1:0);k++){const cb=new THREE.Mesh(new THREE.BoxGeometry(120,44,46),lam(CC[(rand()*CC.length)|0]));cb.position.set(0,22+k*45,cI*48);cb.castShadow=true;g.add(cb);
            for(let r=-2;r<=2;r++){const rib=new THREE.Mesh(new THREE.BoxGeometry(3,40,47),lam(0x000000));rib.material.transparent=true;rib.material.opacity=0.18;rib.position.set(r*22,22+k*45,cI*48);g.add(rib);}}return g;},
        tower:()=>{const g=new THREE.Group();if(!this._winTex){this._winTex=[0,1,2].map(v=>{const c=document.createElement('canvas');c.width=64;c.height=128;const x=c.getContext('2d');x.fillStyle=['#5d6470','#7a7268','#4c5560'][v];x.fillRect(0,0,64,128);
              for(let r=0;r<8;r++)for(let q=0;q<4;q++){x.fillStyle=rand()<0.35?'#ffd27a':(rand()<0.5?'#22303c':'#2c3a48');x.fillRect(4+q*15,6+r*15,10,9);}const t=new THREE.CanvasTexture(c);return t;});}
          const w=80+rand()*90,d=80+rand()*90,h=140+rand()*320,m=new THREE.MeshLambertMaterial({map:this._winTex[(rand()*3)|0]});const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.y=h/2;b.castShadow=true;g.add(b);
          const tp=new THREE.Mesh(new THREE.BoxGeometry(w+6,6,d+6),lam(0x3a3d44));tp.position.y=h+3;g.add(tp);
          if(rand()<0.35){const nc=[0xff5fa8,0x5fd0ff,0xffe066][(rand()*3)|0],sg=new THREE.Mesh(new THREE.BoxGeometry(w*0.7,22,3),new THREE.MeshBasicMaterial({color:nc}));sg.position.set(0,h+26,d/2);g.add(sg);}
          else if(rand()<0.5){const wt=new THREE.Mesh(new THREE.CylinderGeometry(16,16,30,12),lam(0x6f8fa8));wt.position.set(w*0.2,h+21,0);g.add(wt);}
          return g;},
        volcanic:()=>{if(rand()<0.3)return MK.palm();const g=new THREE.Group(),n=3+(rand()*4|0);for(let k=0;k<n;k++){const h=30+rand()*70,c=new THREE.Mesh(new THREE.CylinderGeometry(10,11,h,6),lam(rand()<0.5?0x2e2826:0x3a3330));c.position.set((rand()-0.5)*40,h/2,(rand()-0.5)*40);c.castShadow=true;g.add(c);
          const t=new THREE.Mesh(new THREE.CylinderGeometry(10,10,2,6),lam(0x554c48));t.position.set(c.position.x,h+1,c.position.z);g.add(t);}return g;},
        piles:()=>{const g=new THREE.Group(),p=new THREE.Mesh(new THREE.ConeGeometry(60+rand()*30,50+rand()*20,9),lam(rand()<0.5?0xb89a6a:0x9a8a74));p.position.y=28;p.castShadow=true;g.add(p);return g;}},mk=MK[tt];
      const cnt=opt.treeCount||70;
      for(let k=0,tries=0;k<cnt&&tries<1500;tries++){const x=lerp(bx0+200,bx1-200,rand()),y=lerp(by0+200,by1-200,rand());if(opt.sea&&y>T.shore-60)continue;if(T.canal&&x>T.canal[0]-90&&x<T.canal[1]+90&&Math.abs(y)<340)continue;if(opt.propsOut&&x>T.b.x0-60&&x<T.b.x1+60&&y>T.b.y0-60&&y<T.b.y1+60)continue;const th=terrainH(T,x,y);if(th.ex<T.falloff+40+(opt.treeGap||0)+(T.canyon?T.canyon.from+T.canyon.ramp:0))continue;
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
  // ---- 가로등 충돌: 차 속도는 그대로, 느리면 밑동 위에서 꺾여 쓰러지고 빠르면 윗부분이 통째로 날아간다 ----
  hitLamp(g,L,c){const S=this.S,v=Math.hypot(c.vx,c.vy);let dx=c.vx/(v||1),dy=c.vy/(v||1);if(v<20){dx=Math.cos(c.h);dy=Math.sin(c.h);}
    L.axis=new THREE.Vector3(dy,0,-dx).normalize();L.head.material=this.lampDark;L.pool.visible=false;L.ang=0;L.t=0;
    if(v<300){L.st=1;L.av=2.2+v/140;L.angMax=1.42+Math.random()*0.08;}
    else{L.st=2;const wp=new THREE.Vector3();L.top.getWorldPosition(wp);this.sc.attach(L.top);L.top.quaternion.identity();
      L.px=wp.x/S;L.py=wp.z/S;L.pz=wp.y/S;L.vx=c.vx*1.15+(Math.random()-0.5)*80;L.vy=c.vy*1.15+(Math.random()-0.5)*80;L.vz=200+v*0.4;L.spin=5+v/90;L.rot=0;}
    if(typeof puff==='function'){for(let k=0;k<9;k++){const a=Math.random()*TAU;puff(L.x,L.y,L.z+10+Math.random()*20,k%3?'#9aa0a8':'#ffd27a',6+Math.random()*6,0.7,Math.cos(a)*70+c.vx*0.2,Math.sin(a)*70+c.vy*0.2,60+Math.random()*80,null);}}
    if(c===g.player){g.shake=Math.max(g.shake||0,v<300?4:9);if(typeof AU!=='undefined'){AU.thump(Math.min(400,v));if(v>=300&&AU.crash)AU.crash(v);}}},
  updLamps(g,dt){if(!this.lamps)return;const S=this.S,q=new THREE.Quaternion();
    for(const L of this.lamps){
      if(L.st===0){for(const c of g.cars){const dx=c.x-L.x,dy=c.y-L.y;if(dx*dx+dy*dy<15*15&&Math.abs(c.z-L.z)<34){this.hitLamp(g,L,c);break;}}continue;}
      L.t+=dt;
      if(L.st===1){L.av+=dt*7;L.ang+=L.av*dt;if(L.ang>=L.angMax){L.ang=L.angMax;if(L.av>1.2&&!L.bounced){L.av=-L.av*0.28;L.bounced=true;}else{L.av=0;L.st=3;}}
        L.top.quaternion.setFromAxisAngle(L.axis,L.ang);}
      else if(L.st===2){L.vz-=900*dt;L.px+=L.vx*dt;L.py+=L.vy*dt;L.pz+=L.vz*dt;L.rot+=L.spin*dt;
        const gz=Hxy(g.T,L.px,L.py,null)+3;
        if(L.pz<gz){L.pz=gz;if(L.vz<-140){L.vz*=-0.3;L.vx*=0.6;L.vy*=0.6;L.spin*=0.5;}else{L.vz=0;L.vx*=0.86;L.vy*=0.86;const tgt=Math.PI/2+Math.round((L.rot-Math.PI/2)/Math.PI)*Math.PI;L.rot+=(tgt-L.rot)*Math.min(1,dt*8);L.spin*=0.8;if(Math.hypot(L.vx,L.vy)<6&&Math.abs(tgt-L.rot)<0.02){L.rot=tgt;L.st=3;}}}
        L.top.position.set(L.px*S,L.pz*S,L.py*S);L.top.quaternion.setFromAxisAngle(L.axis,L.rot);}
    }},
  draw(g,dt){this.updLamps(g,dt);
    const S=this.S,r=this.r,view=r.domElement.parentNode,W=view.clientWidth,H=view.clientHeight;
    if(this._w!==W||this._h!==H){r.setSize(W,H,false);this.cam.aspect=W/H;this.cam.updateProjectionMatrix();this._w=W;this._h=H;}
    const mode=this.camMode,ov=mode==='overview',vs=ov?1.8:1.4;
    g.cars.forEach((c,k)=>{const m=this.meshes[k];m.g.position.set(c.x*S,c.z*S,c.y*S);m.g.rotation.y=-c.h;m.g.rotation.z=c.gp;m.g.rotation.x=c.gr;
      m.body.rotation.z=c.pitch;m.body.rotation.x=c.roll;m.body.position.y=c.air?-1.5:0;
      m.fronts.forEach(f=>f.rotation.y=-c.steer*0.5);m.wheels.forEach(w=>w.rotation.z=-c.dist/6.5*(w.userData.sgn||1));
      m.g.scale.setScalar(S*vs);
      m.g.visible=mode==='cockpit'&&k===this.pi?false:!(c.flash>0&&((c.flash*10)|0)%2===0);});
    const p=g.player,k=1-Math.exp(-dt*5);
    if(this._ov!==ov){this._ov=ov;this._ovInit=0;const c2=this.dl.shadow.camera,e=ov?80:35;c2.left=c2.bottom=-e;c2.right=c2.top=e;c2.far=ov?400:200;c2.updateProjectionMatrix();this.sc.fog.near=ov?400:70;this.sc.fog.far=ov?1400:this.opt.fogFar;}
    this.mark.visible=ov;if(ov){this.mark.position.set(p.x*S,(p.z+75+Math.sin(performance.now()/180)*6)*S,p.y*S);}
    if(mode==='cockpit'){
      const pm=this.meshes[this.pi];this.sc.updateMatrixWorld(true);const v=new THREE.Vector3(2,pm.eye||14.5,0);pm.body.localToWorld(v);this.cam.position.copy(v);
      if(!this._qy)this._qy=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-Math.PI/2);const q=new THREE.Quaternion();pm.body.getWorldQuaternion(q);this.cam.quaternion.copy(q).multiply(this._qy);
      if(g.shake)this.cam.rotateZ((Math.random()-0.5)*g.shake*0.002);
      const asp=this.cam.aspect||1,base=asp>=1?72:Math.min(92,2*Math.atan(Math.tan(39/57.3)/asp)*57.3);this.cam.fov=lerp(this.cam.fov,base+Math.min(p.speed,700)*0.003+(p.boostT>0?2.5:0),0.06);this.cam.updateProjectionMatrix();
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
    }else if(mode==='cine'){
      const cn=g.cine,u=clamp(cn.t/cn.dur,0,1),e=u*u*(3-2*u);
      if(this.ch==null||cn.cut)this.ch=p.h;this.ch+=wrapA(p.h-this.ch)*Math.min(1,dt*4);
      const dx=Math.cos(this.ch),dy=Math.sin(this.ch),nx=-dy,ny=dx;let cx,cy,up,fov,lz=10;
      if(cn.type==='sweep'){const th=this.ch+Math.PI*0.55+u*1.5,R=lerp(560,230,e);cx=p.x+Math.cos(th)*R;cy=p.y+Math.sin(th)*R;up=lerp(430,130,e);fov=50;}
      else if(cn.type==='side'){const a=lerp(-110,90,u);cx=p.x+nx*175+dx*a;cy=p.y+ny*175+dy*a;up=30;fov=40;lz=8;}
      else if(cn.type==='rear'){cx=p.x-dx*95+nx*16;cy=p.y-dy*95+ny*16;up=30;fov=60;lz=14;}
      else if(cn.type==='front'){const a=lerp(260,130,e);cx=p.x+dx*a-nx*30;cy=p.y+dy*a-ny*30;up=22;fov=42;lz=9;}
      else{const th=this.ch+Math.PI*1.2+cn.t*0.18;cx=p.x+Math.cos(th)*430;cy=p.y+Math.sin(th)*430;up=300;fov=48;}
      if(cn.type!=='sweep'&&cn.type!=='title')[cx,cy]=this.inWall(g,cx,cy,p.hint);
      const gz=Hxy(g.T,cx,cy,null),cz=Math.max(gz+12,p.z+up*(cn.type==='side'||cn.type==='front'?0.6:1),gz+up);
      const want=new THREE.Vector3(cx*S,cz*S,cy*S),look=new THREE.Vector3(p.x*S,(p.z+lz)*S,p.y*S);
      if(cn.cut){this.cp.copy(want);this.lt.copy(look);this.cam.fov=fov;cn.cut=false;}else{this.cp.lerp(want,Math.min(1,dt*7));this.lt.lerp(look,Math.min(1,dt*9));this.cam.fov=lerp(this.cam.fov,fov,0.08);}
    }else if(mode==='stand'){
      const[sx,sy,sz]=this.opt.stand,base=Hxy(g.T,sx,sy,null);this.cp.set(sx*S,(base+sz+18)*S,sy*S);
      this.lt.lerp(new THREE.Vector3(p.x*S,(p.z+8)*S,p.y*S),Math.min(1,dt*6));
      const d=Math.hypot(p.x-sx,p.y-sy,p.z-base-sz);this.cam.fov=lerp(this.cam.fov,clamp(Math.atan(150/d)*2*57.3,16,60),0.05);
    }else{
      const CM={drone:{back:150,up:125,ahead:110,lz:0,fov:52,turn:3},chase:{back:100,up:46,ahead:40,lz:12,fov:60,turn:6}}[mode];
      let tx=Math.cos(p.h),ty=Math.sin(p.h);if(p.speed>80&&p.vF>0){tx=tx*0.6+p.vx/p.speed*0.4;ty=ty*0.6+p.vy/p.speed*0.4;}
      if(g.T.canyon&&p.loc){const a=g.T.p[p.loc.i],ex=Math.abs(p.loc.d)-p.loc.w/2;if(ex>0){let ta=Math.atan2(a.ty,a.tx);if(Math.cos(ta-Math.atan2(ty,tx))<0)ta+=Math.PI;const w=clamp(ex/(g.T.canyon.from-10),0,1)*0.7;const hh=Math.atan2(ty,tx)+wrapA(ta-Math.atan2(ty,tx))*w;tx=Math.cos(hh);ty=Math.sin(hh);}}
      if(this.ch==null)this.ch=p.h;this.ch+=wrapA(Math.atan2(ty,tx)-this.ch)*Math.min(1,dt*CM.turn);
      const dx=Math.cos(this.ch),dy=Math.sin(this.ch);
      let cx=p.x-dx*CM.back,cy=p.y-dy*CM.back;[cx,cy]=this.inWall(g,cx,cy,p.hint);const T=g.T,cg=(x,y)=>groundAt(T,locate(T,x,y,null),true),gz=cg(cx,cy);let cz=Math.max(p.z,gz)+CM.up;
      // 터널 근처: 카메라를 지붕 아래로 내려 터널 벽·지붕이 차를 가리지 않게
      if(T.tun.length){const lc=locate(T,cx,cy,p.hint),inT=inTun(T,lc.s)||(p.loc&&inTun(T,p.loc.s));if(inT)cz=Math.min(cz,trackZ(T,lc)+62);}
      this.cp.lerp(new THREE.Vector3(cx*S,cz*S,cy*S),k);const mg=(cg(this.cp.x/S,this.cp.z/S)+14)*S;if(this.cp.y<mg)this.cp.y=mg;
      let ax=p.x+dx*CM.ahead,ay=p.y+dy*CM.ahead;[ax,ay]=this.inWall(g,ax,ay,p.hint,g.T.canyon?g.T.canyon.from-12:0);
      this.lt.lerp(new THREE.Vector3(ax*S,(p.z+CM.lz)*S,ay*S),Math.min(1,k*2));
      this.cam.fov=lerp(this.cam.fov,CM.fov+p.speed*0.018,0.05);
    }
    if(mode!=='cockpit'){const sh=g.shake*0.004;this.cam.position.set(this.cp.x+(Math.random()-0.5)*sh,this.cp.y+(Math.random()-0.5)*sh,this.cp.z);this.cam.lookAt(this.lt);this.cam.updateProjectionMatrix();}
    if(!ov){this.dl.position.set(p.x*S+25,p.z*S+60,p.y*S+15);this.dl.target.position.set(p.x*S,p.z*S,p.y*S);}
    if(this.canalW)this.canalW.position.y=(-20+Math.sin(performance.now()/600)*0.8)*S;
    if(this.lavaM){const t=performance.now()/600;this.lavaM.color.setRGB(1,0.42+Math.sin(t)*0.06+Math.sin(t*2.7)*0.03,0.1);}
    if(this.smoke){const t=performance.now()/1000,[sx,sy,sz]=this.smokeAt;for(const q of this.smoke){const u=(t*0.12+q.ph)%1;q.sp.position.set(sx+Math.sin(q.ph*9+t*0.3)*u*1.5,sy+u*9,sz+u*2.5);const sc2=(1.5+u*6);q.sp.scale.set(sc2,sc2,1);q.sp.material.opacity=0.55*(1-u);}}
    if(this.sea)this.sea.position.y=(1+Math.sin(performance.now()/700)*0.8)*S;
    const ck=mode==='cockpit';for(let i=0;i<this.spr.length;i++){const s=this.spr[i],q=g.parts[i];if(!q||(ck&&q.o===p)){s.visible=false;continue;}s.visible=true;s.position.set(q.x*S,(q.z+q.r*0.4)*S,q.y*S);const sc=q.r*2.2*S*(ov?1.6:1);s.scale.set(sc,sc,1);s.material.color.set(q.col);s.material.opacity=(q.life/q.max)*0.6;}
    r.render(this.sc,this.cam);
    this.drawMirrors(ck,W,H);
  },
  // 협곡에서는 카메라가 바위 벽 속으로 들어가지 않도록 길 쪽으로 당긴다
  // 터널 구간에서는 카메라가 터널 벽(소파·바위 등) 속에 들어가지 않도록 터널 안쪽으로 당긴다
  inWall(g,x,y,hint,lim0){const T=g.T,cy=T.canyon;if(!cy&&!T.tun.length)return[x,y];const l=locate(T,x,y,hint);
    if(T.tun.length&&inTun(T,l.s)){const ex=Math.abs(l.d)-l.w/2,lim=-14;if(ex<=lim)return[x,y];const a=T.p[l.i],sg=l.d<0?-1:1;return[x+a.ty*sg*(ex-lim),y-a.tx*sg*(ex-lim)];}
    if(!cy)return[x,y];const lim=lim0==null?8:lim0,ex=Math.abs(l.d)-l.w/2;
    if(ex<=lim)return[x,y];const a=T.p[l.i],sg=l.d<0?-1:1;return[x+a.ty*sg*(ex-lim),y-a.tx*sg*(ex-lim)];},
  // 차 안 시점 사이드미러: 장면을 좌우 반전해 뒤쪽을 작은 화면에 그린다
  mirrorRects(W,H){
    const co=matchMedia('(pointer:coarse)').matches;
    if(H>W){const w=Math.round(Math.min(W*0.2,86)),h=Math.round(w*0.46);return[[22,214,w,h],[W-22-w,214,w,h]];}
    if(co&&H<500){const w=Math.round(Math.min(W*0.085,74)),h=Math.round(w*0.48),cx=W/2,pw=262;return[[cx-pw/2-10-w,26,w,h],[cx+pw/2+10,26,w,h]];}
    const w=Math.round(Math.min(W*0.12,150)),h=Math.round(w*0.46),y=Math.round(H*0.5),m=Math.round(W*0.06);return[[m,y,w,h],[W-m-w,y,w,h]];
  },
  drawMirrors(on,W,H){
    const view=this.r.domElement.parentNode;
    if(!this.mf){this.mf=[0,1].map(()=>{const d=document.createElement('div');d.className='mirrorF';d.hidden=true;view.appendChild(d);return d;});
      this.mc=new THREE.PerspectiveCamera(30,2,0.5,900);}
    if(!on){if(this._mOn){this.mf.forEach(d=>d.hidden=true);this._mOn=false;}return;}
    const R=this.mirrorRects(W,H),key=W+'x'+H;
    if(!this._mOn||this._mKey!==key){this._mOn=true;this._mKey=key;R.forEach((q,i)=>{const d=this.mf[i];d.hidden=false;Object.assign(d.style,{left:(q[0]-3)+'px',top:(q[1]-3)+'px',width:(q[2]+6)+'px',height:(q[3]+6)+'px'});});}
    const r=this.r,sc=this.sc,mc=this.mc,pm=this.meshes[this.pi],au=r.shadowMap.autoUpdate;
    const P=R.map((q,i)=>{const s=i?1:-1;return[pm.body.localToWorld(new THREE.Vector3(3,13,s*11)),pm.body.localToWorld(new THREE.Vector3(-80,7,s*30))];});
    r.shadowMap.autoUpdate=false;sc.scale.x=-1;r.setScissorTest(true);
    R.forEach((q,i)=>{const pos=P[i][0],tg=P[i][1];
      mc.aspect=q[2]/q[3];mc.position.set(-pos.x,pos.y,pos.z);mc.up.set(0,1,0);mc.lookAt(-tg.x,tg.y,tg.z);mc.updateProjectionMatrix();
      const y=H-q[1]-q[3];r.setViewport(q[0],y,q[2],q[3]);r.setScissor(q[0],y,q[2],q[3]);r.render(sc,mc);});
    sc.scale.x=1;sc.updateMatrixWorld(true);r.setScissorTest(false);r.setViewport(0,0,W,H);r.shadowMap.autoUpdate=au;
  },
  cycleCam(){const L=[...this.opt.cams,'cockpit'];const n=L[(L.indexOf(this.camMode)+1)%L.length];this.setMode(n);return CAM_NAMES[n];},
  toggleCockpit(){if(this.camMode==='cockpit'){this.setMode(this.prevMode);return CAM_NAMES[this.prevMode];}this.setMode('cockpit');return CAM_NAMES.cockpit;},
  dispose(){if(this.mf)this.mf.forEach(d=>d.remove());this.r.dispose();this.r.domElement.remove();}
  };
}
