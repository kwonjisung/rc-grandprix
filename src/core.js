//#CORE
const TAU=Math.PI*2,GRAV=980,STEP=1/120;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
const wrapA=a=>{while(a>Math.PI)a-=TAU;while(a<-Math.PI)a+=TAU;return a;};
const sstep=f=>f*f*(3-2*f);

// 직각 코너 경로 → 제어점 (코너 앞뒤 r만큼 떨어진 두 점)
function rectPath(corners,r,w){
  const n=corners.length,out=[];
  for(let i=0;i<n;i++){const p=corners[(i-1+n)%n],c=corners[i],q=corners[(i+1)%n];
    let ax=c[0]-p[0],ay=c[1]-p[1],bx=q[0]-c[0],by=q[1]-c[1];const la=Math.hypot(ax,ay),lb=Math.hypot(bx,by);ax/=la;ay/=la;bx/=lb;by/=lb;
    const cw=c[3]||w,cz=c[2]||0;
    if(Math.abs(ax*by-ay*bx)<0.05){out.push([c[0],c[1],cz,cw]);continue;}
    out.push([c[0]-ax*r,c[1]-ay*r,cz,cw],[c[0]+bx*r,c[1]+by*r,cz,cw]);}
  return out;
}

function buildTrack(def){
  const C=def.ctrl,n=C.length,raw=[],SM=40;
  for(let i=0;i<n;i++){
    const p0=C[(i-1+n)%n],p1=C[i],p2=C[(i+1)%n],p3=C[(i+2)%n];
    for(let k=0;k<SM;k++){
      const t=k/SM,t2=t*t,t3=t2*t,v=[];
      for(let j=0;j<4;j++)v.push(0.5*(2*p1[j]+(-p0[j]+p2[j])*t+(2*p0[j]-5*p1[j]+4*p2[j]-p3[j])*t2+(-p0[j]+3*p1[j]-3*p2[j]+p3[j])*t3));
      raw.push(v);
    }
  }
  // 호 길이 기준 균일 재샘플링 (간격 12)
  const RN=raw.length,cum=[0];for(let i=1;i<=RN;i++){const a=raw[i-1],b=raw[i%RN];cum.push(cum[i-1]+Math.hypot(b[0]-a[0],b[1]-a[1]));}
  const total=cum[RN],N=Math.round(total/12),P=[];let j=0;
  for(let k=0;k<N;k++){const s=k*total/N;while(cum[j+1]<s)j++;const a=raw[j],b=raw[(j+1)%RN],t=(s-cum[j])/((cum[j+1]-cum[j])||1);
    P.push({x:lerp(a[0],b[0],t),y:lerp(a[1],b[1],t),zb:Math.max(0,lerp(a[2],b[2],t)),w:lerp(a[3],b[3],t)});}
  let s=0;
  for(let i=0;i<N;i++){const a=P[i],b=P[(i+1)%N],dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy);a.s=s;a.len=L;a.tx=dx/L;a.ty=dy/L;s+=L;}
  for(let i=0;i<N;i++){const a=P[i],p=P[(i-1+N)%N];let nx=a.tx+p.tx,ny=a.ty+p.ty;const l=Math.hypot(nx,ny)||1;a.nx=-ny/l;a.ny=nx/l;}
  const T=Object.assign({laps:3,falloff:60},def,{p:P,L:s});
  T.bumps=(def.bumps||[]).map(b=>({s0:b.s*s,prof:b.prof,end:b.prof[b.prof.length-1][0]}));
  T.tun=(def.tunnels||[]).map(t=>({s0:t[0]*s,s1:t[1]*s}));
  T.obstacles=def.obstacles||null;
  let mx=1e9,Mx=-1e9,my=1e9,My=-1e9,mz=0;
  for(const a of P){a.z=a.zb+bumpAt(T,a.s);a.tun=inTun(T,a.s);mz=Math.max(mz,a.z);mx=Math.min(mx,a.x-a.w);Mx=Math.max(Mx,a.x+a.w);my=Math.min(my,a.y-a.w);My=Math.max(My,a.y+a.w);}
  T.b={x0:mx,x1:Mx,y0:my,y1:My};T.maxZ=Math.max(1,mz);
  return T;
}
function bumpAt(T,s){
  let h=0;
  for(const b of T.bumps){let u=s-b.s0;u=((u%T.L)+T.L)%T.L;if(u>=b.end)continue;const pr=b.prof;
    for(let k=1;k<pr.length;k++){if(u<=pr[k][0]){const u0=pr[k-1][0],h0=pr[k-1][1],u1=pr[k][0],h1=pr[k][1];h+=h0+(h1-h0)*(u-u0)/((u1-u0)||1);break;}}}
  return h;
}
function inTun(T,s){for(const t of T.tun)if(s>=t.s0&&s<=t.s1)return true;return false;}
function locate(T,x,y,hint){
  const P=T.p,N=P.length;let best=1e18,bi=0,bt=0;
  const full=hint==null,cnt=full?N:37,st=full?0:hint-18;
  for(let k=0;k<cnt;k++){
    const i=((st+k)%N+N)%N,a=P[i],b=P[(i+1)%N],dx=b.x-a.x,dy=b.y-a.y;
    let t=((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy);t=t<0?0:t>1?1:t;
    const px=a.x+dx*t-x,py=a.y+dy*t-y,d2=px*px+py*py;if(d2<best){best=d2;bi=i;bt=t;}
  }
  const a=P[bi],b=P[(bi+1)%N];
  return{i:bi,t:bt,d:(a.tx*(y-a.y)-a.ty*(x-a.x)),w:a.w+(b.w-a.w)*bt,s:a.s+a.len*bt};
}
function trackZ(T,l){const P=T.p,a=P[l.i],b=P[(l.i+1)%P.length];return a.zb+(b.zb-a.zb)*l.t+bumpAt(T,l.s);}
// 노면 높이: 트랙 밖은 falloff로 내려가고, 협곡 벽·터널 벽이 솟는다
function groundAt(T,l,noTun){
  const zt=trackZ(T,l),ex=Math.abs(l.d)-l.w/2;if(ex<=0)return zt;
  if(!noTun&&T.tun.length&&ex>2&&inTun(T,l.s))return zt+90;
  const f=clamp(1-ex/T.falloff,0,1);let h=zt*sstep(f);
  const cy=T.canyon;if(cy&&ex>cy.from)h=Math.max(h,cy.h*sstep(clamp((ex-cy.from)/cy.ramp,0,1)));
  return h;
}
function Hxy(T,x,y,h){return groundAt(T,locate(T,x,y,h));}
// 지형 메시용 높이: 겹치는 구간(다리)도 아래 길이 보이도록 모든 구간을 본다
function terrainH(T,x,y){
  const P=T.p,N=P.length,rng=T.falloff+(T.canyon?T.canyon.from+T.canyon.ramp:0)+30;
  let onMin=1e9,offMax=-1e9,exMin=1e9,any=false;
  for(let i=0;i<N;i++){const a=P[i],b=P[(i+1)%N],dx=b.x-a.x,dy=b.y-a.y;
    let t=((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy);t=t<0?0:t>1?1:t;const px=a.x+dx*t,py=a.y+dy*t,d=Math.hypot(x-px,y-py),w=a.w+(b.w-a.w)*t,ex=d-w/2;
    if(ex>rng)continue;
    const l={i,t,d,w,s:a.s+a.len*t},h=groundAt(T,l,true);any=true;exMin=Math.min(exMin,ex);
    if(ex<=0)onMin=Math.min(onMin,h);else offMax=Math.max(offMax,h);}
  if(!any)return{h:T.canyon?T.canyon.h:0,ex:1e9};
  return{h:onMin<1e9?onMin:offMax,ex:exMin};
}

function makeCar(T,idx,off,col,isAI,skill){
  const N=T.p.length;idx=((idx%N)+N)%N;const a=T.p[idx];
  const c={x:a.x+a.nx*off,y:a.y+a.ny*off,z:0,h:Math.atan2(a.ty,a.tx),vx:0,vy:0,vz:0,yaw:0,steer:0,air:false,airT:0,hint:idx,col,isAI,
    power:isAI?560*skill:610,top:isAI?520*skill:560,boostT:0,gauge:1,lane:off*0.4,lap:0,maxLap:0,s:a.s,prevS:a.s,lapStart:0,laps:[],done:false,finishT:0,
    pitch:0,pitchV:0,roll:0,rollV:0,gp:0,gr:0,slope:0,dist:0,land:0,stuck:0,slow:0,speed:0,vL:0,vF:0,drift:false,off:false,gz:0,flash:0,bump:0,
    resp:0,boosts:0,driftT:0,maxAir:0,spin:0,hits:0,hitJ:0,hitX:0,hitY:0};
  const l=locate(T,c.x,c.y,idx);c.z=groundAt(T,l);c.gz=c.z;c.s=l.s;c.prevS=l.s;c.loc=l;c.surf=T.surface(c.x,c.y,l);return c;
}
function respawn(c,T){
  const l=locate(T,c.x,c.y,c.hint),a=T.p[l.i];
  c.x=a.x;c.y=a.y;c.h=Math.atan2(a.ty,a.tx);c.vx=c.vy=c.vz=0;c.yaw=0;c.spin=0;c.air=false;c.z=a.zb+bumpAt(T,a.s);c.gz=c.z;c.stuck=0;c.slow=0;c.flash=1.2;c.s=a.s;c.prevS=a.s;c.hint=l.i;c.resp++;
}
function collideObs(c,T){
  for(const o of T.obstacles){const nx=clamp(c.x,o.x,o.x+o.w),ny=clamp(c.y,o.y,o.y+o.h);let dx=c.x-nx,dy=c.y-ny;const d=Math.hypot(dx,dy),r=20;
    if(d<r&&c.z<(o.hgt||40)+(o.z||0)){if(d<0.001){dx=0;dy=-1;}else{dx/=d;dy/=d;}c.x=nx+dx*r;c.y=ny+dy*r;const vn=c.vx*dx+c.vy*dy;if(vn<0){c.vx-=1.45*vn*dx;c.vy-=1.45*vn*dy;c.bump=Math.max(c.bump,-vn);}}}
}
function stepCar(c,inp,dt,T,racing){
  let l=locate(T,c.x,c.y,c.hint);c.hint=l.i;
  const sf=T.surface(c.x,c.y,l);c.surf=sf;
  const fx=Math.cos(c.h),fy=Math.sin(c.h);
  let vF=c.vx*fx+c.vy*fy,vL=-c.vx*fy+c.vy*fx;const vF0=vF;
  const ts=inp.steer||0;c.steer+=(ts-c.steer)*Math.min(1,dt*(ts===0?10:6.5));
  const gas=racing&&inp.gas,brk=racing&&inp.brake,hand=racing&&!!inp.hand;c.hand=hand;c.gas=gas;
  const bo=c.boostT>0;c.boostT=Math.max(0,c.boostT-dt);const PW=c.power*(bo?(c.boostM||2.4):1),TP=c.top*(bo?1.45:1);
  if(!c.air){
    let acc=0;
    if(gas||bo)acc+=PW*clamp(1-vF/TP,0,1.3);
    if(brk)acc+=vF>15?-1250:-c.power*0.55*clamp(1+vF/(c.top*0.35),0,1);
    acc-=vF*sf.drag*(c.off&&c.offM?c.offM:1);
    vF+=acc*dt;
    if(!gas&&!brk){const r=Math.min(Math.abs(vF),70*dt);vF-=Math.sign(vF)*r;}
    const sp=Math.abs(vF);
    const grip=sf.grip*(c.gripM||1)*(hand?0.2:1)*(sp<60?2:1);
    const k=Math.exp(-grip*dt),lost=vL*(1-k);vL*=k;
    if(sp>30)vF+=Math.abs(lost)*0.22*Math.sign(vF);
    if(hand)vF*=Math.exp(-0.55*dt);
    let yt=c.steer*Math.sign(vF)*Math.min(1,sp/70)*3.1/(1+sp/700);
    if(hand)yt*=1.55;
    c.yaw+=(yt-c.yaw)*Math.min(1,dt*(hand?5:12));
  }else{c.yaw+=(c.steer*0.9-c.yaw)*Math.min(1,dt*1.2);}
  c.h+=(c.yaw+c.spin)*dt;c.spin*=Math.exp(-dt*(c.air?0.6:2.6));
  c.vx=vF*fx-vL*fy;c.vy=vF*fy+vL*fx;
  if(!c.air){
    const e=5,h=c.hint;
    let gx=(Hxy(T,c.x+e,c.y,h)-Hxy(T,c.x-e,c.y,h))/(2*e),gy=(Hxy(T,c.x,c.y+e,h)-Hxy(T,c.x,c.y-e,h))/(2*e);
    const gm=Math.hypot(gx,gy);if(gm>0.7){gx*=0.7/gm;gy*=0.7/gm;}
    c.vx-=GRAV*0.62*gx*dt;c.vy-=GRAV*0.62*gy*dt;
    const nfx=Math.cos(c.h),nfy=Math.sin(c.h),gF=gx*nfx+gy*nfy,gR=-gx*nfy+gy*nfx;c.slope=gF;
    c.gp+=(Math.atan(gF)-c.gp)*Math.min(1,dt*14);c.gr+=(-Math.atan(gR)-c.gr)*Math.min(1,dt*14);
  }else{c.vx*=1-0.08*dt;c.vy*=1-0.08*dt;if(c.airT>0.25)c.gp+=(-0.12-c.gp)*dt*1.2;}
  const ox=c.x,oy=c.y;c.x+=c.vx*dt;c.y+=c.vy*dt;
  if(T.obstacles)collideObs(c,T);
  l=locate(T,c.x,c.y,c.hint);c.hint=l.i;
  let gz=groundAt(T,l);
  if(gz-c.z>10){c.x=ox;c.y=oy;c.bump=Math.max(c.bump,c.speed*0.6);c.vx*=-0.3;c.vy*=-0.3;l=locate(T,c.x,c.y,c.hint);c.hint=l.i;gz=groundAt(T,l);}
  c.gz=gz;
  if(c.air){
    c.vz-=GRAV*dt;c.z+=c.vz*dt;c.airT+=dt;
    if(c.z<=gz){const imp=-c.vz;c.z=gz;if(imp>(c.susp||340)){c.vz=imp*0.22;c.z+=0.01;}else{c.air=false;c.vz=0;}c.land=Math.max(c.land,imp);c.pitchV-=imp*(c.susp?0.0018:0.0035);}
  }else{
    const vzg=Math.min(500,(gz-c.z)/dt);
    if(vzg<c.vz-GRAV*dt-22){c.air=true;c.airT=0;c.vz-=GRAV*dt;c.z+=c.vz*dt;if(c.z<gz){c.z=gz;c.air=false;c.vz=vzg;}}
    else{c.vz=vzg;c.z=gz;}
  }
  const tz=trackZ(T,l);
  if(T.tun.length&&inTun(T,l.s)&&c.z>tz+55){c.z=tz+55;if(c.vz>0)c.vz=0;}
  const aL=(vF-vF0)/dt;
  const pt=clamp(aL*0.00016,-0.09,0.09),rt=clamp(c.yaw*vF*0.00016,-0.12,0.12);
  c.pitchV+=((pt-c.pitch)*160-c.pitchV*11)*dt;c.pitch+=c.pitchV*dt;
  c.rollV+=((rt-c.roll)*160-c.rollV*11)*dt;c.roll+=c.rollV*dt;
  c.speed=Math.hypot(c.vx,c.vy);c.vL=vL;c.vF=vF;
  c.drift=!c.air&&Math.abs(vL)>50&&c.speed>110;
  c.dist+=c.speed*dt;
  c.prevS=c.s;c.s=l.s;c.loc=l;
  const ex=Math.abs(l.d)-l.w/2;c.off=ex>0;
  if(ex>l.w*1.5||(!c.air&&tz-c.z>40&&ex>0)||c.z<-200)c.stuck+=dt;else c.stuck=0;
  if(c.isAI&&racing&&c.speed<25)c.slow+=dt;else c.slow=0;
  if(c.stuck>0.8||c.slow>2.5)respawn(c,T);
  c.flash=Math.max(0,c.flash-dt);
}
function aiInput(c,T,t){
  const N=T.p.length,sp=c.speed,look=5+Math.floor(sp/55);
  const a=T.p[(c.hint+look)%N],b=T.p[(c.hint+look+14)%N];
  const lane=c.lane*Math.cos(t*0.35+c.lane);
  const want=Math.atan2(a.y+a.ny*lane-c.y,a.x+a.nx*lane-c.x),diff=wrapA(want-c.h);
  const turn=Math.abs(wrapA(Math.atan2(b.ty,b.tx)-Math.atan2(a.ty,a.tx)));
  const slip=c.surf?c.surf.grip<3:false,lim=slip?0.5:0.6;
  return{steer:clamp(diff*2.6,-1,1),gas:!(turn>0.45&&sp>c.top*lim)&&(Math.abs(diff)<1.2||sp<130),brake:(turn>0.75&&sp>c.top*(lim+0.08))||(Math.abs(diff)>1.4&&sp>150),hand:false};
}
// 차 충돌: 회전한 직사각형(OBB) 두 개를 분리축으로 검사하고, 접촉점 기준 충격량으로 밀고 돌린다
const CAR_HX=27,CAR_HY=14.5,CAR_I=(4*CAR_HX*CAR_HX+4*CAR_HY*CAR_HY)/12,CAR_E=0.45,CAR_MU=0.35;
function carCorners(c){const fx=Math.cos(c.h),fy=Math.sin(c.h),out=[];for(const sx of[1,-1])for(const sy of[1,-1])out.push([c.x+fx*CAR_HX*sx-fy*CAR_HY*sy,c.y+fy*CAR_HX*sx+fx*CAR_HY*sy]);return out;}
function collidePair(a,b){
  if(Math.abs(a.z-b.z)>22)return 0;const dx=b.x-a.x,dy=b.y-a.y;if(dx*dx+dy*dy>70*70)return 0;
  const ax=[Math.cos(a.h),Math.sin(a.h)],ay=[-ax[1],ax[0]],bxv=[Math.cos(b.h),Math.sin(b.h)],byv=[-bxv[1],bxv[0]];
  let best=1e9,nx=0,ny=0;
  for(const n of[ax,ay,bxv,byv]){const ra=CAR_HX*Math.abs(ax[0]*n[0]+ax[1]*n[1])+CAR_HY*Math.abs(ay[0]*n[0]+ay[1]*n[1]);
    const rb=CAR_HX*Math.abs(bxv[0]*n[0]+bxv[1]*n[1])+CAR_HY*Math.abs(byv[0]*n[0]+byv[1]*n[1]);const d=dx*n[0]+dy*n[1],ov=ra+rb-Math.abs(d);
    if(ov<=0)return 0;if(ov<best){best=ov;const sg=d<0?-1:1;nx=n[0]*sg;ny=n[1]*sg;}}
  // 접촉점: 서로 상대 쪽으로 가장 깊이 들어간 꼭짓점의 중간
  let pa=null,pb=null,ma=-1e9,mb=-1e9;for(const q of carCorners(a)){const v=(q[0]-a.x)*nx+(q[1]-a.y)*ny;if(v>ma){ma=v;pa=q;}}for(const q of carCorners(b)){const v=-((q[0]-b.x)*nx+(q[1]-b.y)*ny);if(v>mb){mb=v;pb=q;}}
  const cx=(pa[0]+pb[0])/2,cy=(pa[1]+pb[1])/2;
  const Ma=a.mass||1,Mb=b.mass||1,wa0=Mb/(Ma+Mb),wb0=Ma/(Ma+Mb);a.x-=nx*(best*wa0+0.3);a.y-=ny*(best*wa0+0.3);b.x+=nx*(best*wb0+0.3);b.y+=ny*(best*wb0+0.3);
  const rax=cx-a.x,ray=cy-a.y,rbx=cx-b.x,rby=cy-b.y,wa=a.yaw+a.spin,wb=b.yaw+b.spin;
  const vax=a.vx-wa*ray,vay=a.vy+wa*rax,vbx=b.vx-wb*rby,vby=b.vy+wb*rbx,rvx=vbx-vax,rvy=vby-vay,vn=rvx*nx+rvy*ny;
  if(vn>=0)return 0;
  const raN=rax*ny-ray*nx,rbN=rbx*ny-rby*nx,j=-(1+CAR_E)*vn/(1/Ma+1/Mb+raN*raN/(CAR_I*Ma)+rbN*rbN/(CAR_I*Mb));
  let tx=rvx-vn*nx,ty=rvy-vn*ny;const tl=Math.hypot(tx,ty);let jt=0;if(tl>1){tx/=tl;ty/=tl;const vt=rvx*tx+rvy*ty;jt=clamp(-vt/(1/Ma+1/Mb),-CAR_MU*j,CAR_MU*j);}else{tx=ty=0;}
  const Ix=j*nx+jt*tx,Iy=j*ny+jt*ty;
  a.vx-=Ix/Ma;a.vy-=Iy/Ma;b.vx+=Ix/Mb;b.vy+=Iy/Mb;
  a.spin=clamp(a.spin-(rax*Iy-ray*Ix)/(CAR_I*Ma)*1.6,-6,6);b.spin=clamp(b.spin+(rbx*Iy-rby*Ix)/(CAR_I*Mb)*1.6,-6,6);
  for(const c of[a,b]){const jj=j/(c.mass||1);c.bump=Math.max(c.bump,jj);if(jj>c.hitJ){c.hitJ=jj;c.hitX=cx;c.hitY=cy;}}
  return j;
}
function collideCars(cs){
  for(let it=0;it<2;it++)for(let i=0;i<cs.length;i++)for(let j=i+1;j<cs.length;j++){const J=collidePair(cs[i],cs[j]);if(J>60&&it===0){cs[i].hits++;cs[j].hits++;}}
}
// 랩 카운트 (게임과 시뮬레이션 공용)
function lapTick(c,T,t){const ds=c.s-c.prevS;
  if(ds<-T.L/2){c.lap++;if(c.lap>c.maxLap){c.maxLap=c.lap;if(c.lap===1)c.lapStart=t;else{c.laps.push(t-c.lapStart);c.lapStart=t;}if(c.lap>T.laps&&!c.done){c.done=true;c.finishT=t;return true;}}}
  else if(ds>T.L/2)c.lap--;return false;}
// 기준 기록: 실력 1.0 AI가 혼자 달린 시간
function parTime(T){
  const N=T.p.length,c=makeCar(T,N-2,0,{},true,1.0);let t=0;
  while(t<300){t+=STEP;stepCar(c,aiInput(c,T,t),STEP,T,true);if(lapTick(c,T,t))return{t,resp:c.resp};}
  return{t:300,resp:c.resp};
}

// ---- 코스 ----
const onTrack=(l,m)=>Math.abs(l.d)<=l.w/2+(m||4);
const SF={
  asphalt:{grip:8.5,drag:0.32,name:'아스팔트'},grass:{grip:3.2,drag:1.5,name:'잔디'},
  dirt:{grip:4.3,drag:0.42,name:'흙길'},field:{grip:2.6,drag:1.6,name:'풀밭'},
  plastic:{grip:7.2,drag:0.3,name:'플라스틱 트랙'},desk:{grip:5,drag:0.9,name:'책상'},
  walk:{grip:5,drag:1.2,name:'보도블록'},
  snow:{grip:2.7,drag:0.36,name:'다져진 눈길'},ice:{grip:1.1,drag:0.15,name:'빙판'},deep:{grip:2,drag:2.3,name:'깊은 눈'},
  sand:{grip:3.7,drag:0.55,name:'단단한 모래'},soft:{grip:2.4,drag:2.1,name:'푹신한 모래'},sea:{grip:1.8,drag:3.6,name:'바닷물'},
  redDirt:{grip:4.6,drag:0.4,name:'붉은 흙길'},gravel:{grip:3,drag:1.5,name:'자갈밭'},
  stone:{grip:6.5,drag:0.35,name:'돌길'},lawn:{grip:4,drag:1.4,name:'잔디밭'},
  site:{grip:3.8,drag:0.5,name:'공사장 자갈'},mud:{grip:2.2,drag:2.4,name:'진흙'},
  steel:{grip:2.3,drag:0.22,name:'젖은 철판'},dock:{grip:4.4,drag:1.3,name:'부두 콘크리트'},canal:{grip:1.6,drag:3.8,name:'운하 물'},
};
const ICE=[[700,0,190],[1080,425,150],[300,860,170],[900,1300,160]];
const COURSES={
  park:{ctrl:[[0,0,0,170],[600,0,0,170],[1050,60,0,160],[1250,330,0,160],[1080,600,0,160],[720,560,0,160],[480,700,0,160],[560,980,0,160],[930,1030,0,160],[1300,950,0,160],[1600,1100,0,160],[1560,1400,0,160],[1100,1500,0,160],[450,1470,0,160],[-150,1380,0,160],[-450,1100,0,160],[-380,700,0,160],[-560,380,0,160],[-420,90,0,165]],
    falloff:50,laps:2,bumps:[{s:0.04,prof:[[0,0],[90,45],[210,45],[280,0]]},{s:0.3,prof:[[0,0],[30,10],[60,0],[90,10],[120,0],[150,10],[180,0],[210,10],[240,0]]},
      {s:0.55,prof:[[0,0],[70,40],[80,0],[170,0],[190,36],[290,0]]},{s:0.82,prof:[[0,0],[60,30],[66,0]]}],
    surface:(x,y,l)=>onTrack(l)?SF.dirt:SF.field},
  arcade:{ctrl:rectPath([[600,0,0],[1300,0,0],[1300,450,0],[850,450,40],[850,900,0],[1700,900,0],[1700,1400,0],[750,1400,70],[-200,1400,0],[-200,700,0],[350,700,0],[350,350,0],[0,350,0],[0,0,0]],95,170),
    falloff:110,laps:2,bumps:[{s:0.6,prof:[[0,0],[80,26],[90,0]]}],surface:(x,y,l)=>onTrack(l)?SF.asphalt:SF.walk},
  toy:{ctrl:(()=>{const o=[],a=1250,n=18;for(let k=0;k<n;k++){const t=3*Math.PI/2+0.2+k*TAU/n,s=Math.sin(t),c=Math.cos(t),d=1+s*s;
      const e=Math.cos(t-Math.PI/2);o.push([a*c/d,a*s*c/d*1.25,e>0?90*Math.pow(e,0.8):0,140]);}return o;})(),
    falloff:10,bumps:[{s:0.15,prof:[[0,0],[20,6],[40,0],[60,6],[80,0]]}],surface:(x,y,l)=>onTrack(l)?SF.plastic:SF.desk},
  hill:{ctrl:[[0,0,0,190],[800,-50,0,190],[1500,100,40,180],[1900,450,110,175],[1800,850,150,175],[1400,950,120,175],[1100,750,80,175],[800,850,60,180],[700,1200,30,180],[1000,1500,0,180],[700,1750,0,185],[0,1700,40,185],[-600,1500,110,180],[-950,1050,150,175],[-800,550,90,180],[-500,200,20,185]],
    falloff:180,laps:2,tunnels:[[0.79,0.87]],bumps:[{s:0.25,prof:[[0,0],[120,30],[200,0]]},{s:0.6,prof:[[0,0],[30,8],[60,0],[90,8],[120,0],[150,8],[180,0]]}],
    surface:(x,y,l)=>onTrack(l)?SF.asphalt:SF.grass},
  room:{ctrl:[[0,0,0,150],[600,0,0,150],[1000,250,0,140],[1000,700,0,140],[700,950,0,150],[300,900,0,150],[0,1100,0,150],[-400,1050,0,150],[-650,700,0,150],[-550,250,0,150]],
    falloff:30,tunnels:[[0.6,0.7]],bumps:[{s:0.16,prof:[[0,0],[70,26],[120,26],[126,0]]},{s:0.47,prof:[[0,0],[60,18],[66,0]]}],
    obstacles:[{x:190,y:450,w:130,h:80,kind:'cat'},{x:620,y:420,w:60,h:60,kind:'block',t:'A'},{x:-300,y:470,w:90,h:90,kind:'box'},{x:1260,y:860,w:60,h:60,kind:'block',t:'B'},{x:-860,y:380,w:70,h:70,kind:'block',t:'C'}],
    surface:(x,y,l)=>{let s;if(x>-700&&x<300&&y>650&&y<1350)s={grip:10,drag:0.95,name:'러그'};else if(x>550&&x<1300&&y>-250&&y<550)s={grip:2.0,drag:0.25,name:'주방 타일'};else s={grip:4.0,drag:0.3,name:'원목 마루'};
      if(!onTrack(l,8))s={grip:s.grip,drag:s.drag+1.6,name:s.name+' (선 밖)'};return s;}},
  snow:{ctrl:[[0,0,120,170],[500,0,120,170],[1000,0,110,170],[1210,120,100,165],[1230,330,95,165],[1030,425,90,165],[550,425,75,165],[200,430,65,165],[40,560,60,165],[60,760,55,165],[240,860,45,165],[700,860,35,165],[1080,870,25,165],[1260,1000,20,165],[1240,1220,15,165],[1040,1300,10,165],[550,1300,0,165],[80,1300,0,170],[-250,1200,10,170],[-360,900,40,170],[-360,500,80,170],[-290,150,110,170]],
    falloff:60,laps:2,ice:ICE,surface:(x,y,l)=>{if(!onTrack(l))return SF.deep;for(const c of ICE)if((x-c[0])**2+(y-c[1])**2<c[2]*c[2])return SF.ice;return SF.snow;}},
  beach:{ctrl:[[0,0,0,180],[600,-80,0,180],[1200,0,0,180],[1700,-150,0,175],[2100,0,0,175],[2250,350,0,170],[2000,650,0,175],[1500,620,0,175],[1100,780,0,175],[700,660,0,175],[300,820,0,175],[-100,720,0,175],[-350,420,0,175],[-300,120,0,180]],
    falloff:40,shore:930,bumps:[{s:0.13,prof:[[0,0],[100,34],[115,0]]},{s:0.33,prof:[[0,0],[90,30],[100,0]]},{s:0.7,prof:[[0,0],[40,14],[80,0],[120,14],[160,0]]}],
    surface:(x,y,l)=>onTrack(l)?SF.sand:(y+Math.sin(x*0.004)*40>930?SF.sea:SF.soft)},
  canyon:{ctrl:[[0,0,0,185],[500,-50,0,185],[850,100,4,180],[900,400,9,180],[650,550,10,180],[400,450,10,180],[150,600,9,180],[200,900,5,180],[550,1000,4,180],[900,900,4,180],[1200,1050,7,180],[1250,1350,12,180],[900,1500,16,180],[400,1450,14,180],[0,1300,10,180],[-300,1050,7,180],[-250,700,4,180],[-450,400,2,180],[-350,100,0,185]],
    falloff:30,laps:2,canyon:{h:70,from:40,ramp:22},tunnels:[[0.62,0.7]],bumps:[{s:0.4,prof:[[0,0],[70,28],[80,0]]}],surface:(x,y,l)=>onTrack(l)?SF.redDirt:SF.gravel},
  garden:{ctrl:[[0,0,0,150],[500,0,0,150],[800,150,0,145],[750,450,0,145],[450,500,0,145],[300,750,0,145],[550,950,0,145],[900,850,0,145],[1150,650,0,145],[1450,700,0,145],[1550,1000,0,145],[1300,1250,0,145],[800,1300,0,145],[300,1250,0,145],[-100,1100,0,145],[-150,750,0,145],[-400,500,0,145],[-350,150,0,150]],
    falloff:30,laps:2,bumps:[{s:0.2,prof:[[0,0],[8,9],[16,0]]},{s:0.45,prof:[[0,0],[8,9],[16,0]]},{s:0.62,prof:[[0,0],[80,32],[90,0]]},{s:0.85,prof:[[0,0],[8,9],[16,0]]}],
    obstacles:[{x:980,y:330,w:60,h:60,kind:'pot'},{x:150,y:430,w:60,h:60,kind:'pot'},{x:1250,y:900,w:70,h:70,kind:'pot'},{x:500,y:1110,w:80,h:50,kind:'can'},{x:-330,y:880,w:60,h:60,kind:'pot'}],
    surface:(x,y,l)=>onTrack(l)?SF.stone:SF.lawn},
  site:{ctrl:[[0,0,0,170],[700,0,0,170],[1300,0,0,170],[1700,200,20,165],[1750,600,60,165],[1500,900,60,165],[1000,850,60,165],[650,1000,40,165],[700,1300,0,165],[300,1450,0,165],[-200,1300,0,165],[-350,900,0,165],[-150,600,0,165],[-450,300,0,165],[-300,50,0,170]],
    falloff:60,laps:2,tunnels:[[0.74,0.81]],bumps:[{s:0.08,prof:[[0,0],[80,34],[92,0]]},{s:0.39,prof:[[0,0],[6,-58],[110,-58],[270,0]]},{s:0.9,prof:[[0,0],[60,24],[110,24],[170,0]]}],
    obstacles:[{x:1050,y:-70,w:24,h:24,kind:'cone',hgt:24},{x:1150,y:40,w:24,h:24,kind:'cone',hgt:24},{x:1250,y:-50,w:24,h:24,kind:'cone',hgt:24},{x:-360,y:1080,w:40,h:40,kind:'barrel'},{x:-250,y:840,w:40,h:40,kind:'barrel'}],
    surface:(x,y,l)=>onTrack(l)?SF.site:SF.mud},
  harbor:{ctrl:[[0,0,0,175],[780,0,0,175],[1430,-52,0,175],[1885,195,0,175],[1950,650,0,175],[1625,975,0,175],[1040,1040,0,175],[520,910,0,175],[130,1105,0,175],[-325,1066,0,175],[-650,780,0,175],[-676,325,0,175],[-455,65,0,175]],
    falloff:50,laps:3,shore:1290,canal:[700,810],steel:[[1780,2160,380,900],[-900,-560,450,900]],tunnels:[[0.5,0.57]],
    bumps:[{s:0.09,prof:[[0,0],[90,34],[96,-30],[176,-30],[270,0]]},{s:0.64,prof:[[0,0],[10,8],[20,0],[60,0],[70,8],[80,0]]},{s:0.86,prof:[[0,0],[60,26],[66,0]]}],
    surface:(x,y,l)=>{if(x>700&&x<810&&y>-260&&y<260)return SF.canal;if(!onTrack(l))return y>1290?SF.sea:SF.dock;
      for(const r of COURSES.harbor.steel)if(x>r[0]&&x<r[1]&&y>r[2]&&y<r[3])return SF.steel;return SF.asphalt;}},
};
//#ENDCORE
