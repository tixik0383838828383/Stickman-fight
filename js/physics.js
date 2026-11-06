'use strict';
// PhysicsEngine + CollisionSystem (world queries) + particle system.
(function(SD){
const U=SD.U;
const P=SD.Phys={DT:1/60,GRAVITY:2000,
 // Verlet integration of a particle {x,y,px,py}
 integrate(p,g,damp){const vx=(p.x-p.px)*damp,vy=(p.y-p.py)*damp;p.px=p.x;p.py=p.y;p.x+=vx;p.y+=vy+g*P.DT*P.DT},
 impulse(p,ix,iy){p.px-=ix*P.DT;p.py-=iy*P.DT},
 vel(p){return [(p.x-p.px)/P.DT,(p.y-p.py)/P.DT]},
 // Circle vs rect; returns contact or null
 contact(R,x,y,r,py){
  if(R.oneway){ if(x<R.x||x>R.x+R.w)return null; if(y+r>R.y&&py+r<=R.y+8&&y+r<R.y+R.h+r)return {nx:0,ny:-1,depth:y+r-R.y}; return null;}
  const cx=U.clamp(x,R.x,R.x+R.w),cy=U.clamp(y,R.y,R.y+R.h);const dx=x-cx,dy=y-cy,d2=dx*dx+dy*dy;
  if(d2>=r*r)return null;
  if(d2>1e-6){const d=Math.sqrt(d2);return {nx:dx/d,ny:dy/d,depth:r-d}}
  const l=x-R.x,rr=R.x+R.w-x,t=y-R.y,b=R.y+R.h-y,m=Math.min(l,rr,t,b);
  if(m===t)return {nx:0,ny:-1,depth:t+r};if(m===b)return {nx:0,ny:1,depth:b+r};if(m===l)return {nx:-1,ny:0,depth:l+r};return {nx:1,ny:0,depth:rr+r};
 },
 // Collide a Verlet particle with the world. info collects impact speed.
 collideParticle(world,p,r,rest,fric,info){
  const list=world.solids;
  for(let i=0;i<list.length;i++){const R=list[i];if(!R.active)continue;
   if(R.oneway&&(p.drop>0||p.y-p.py<0))continue;
   const c=P.contact(R,p.x,p.y,r,p.py);if(!c)continue;
   const vx=p.x-p.px,vy=p.y-p.py;const vn=vx*c.nx+vy*c.ny;
   p.x+=c.nx*c.depth;p.y+=c.ny*c.depth;
   let nvx=vx,nvy=vy;
   if(vn<0){nvx-=(1+rest)*vn*c.nx;nvy-=(1+rest)*vn*c.ny;if(info){const sp=-vn/P.DT;if(sp>info.impact){info.impact=sp;info.nx=c.nx;info.ny=c.ny}}}
   const tx=-c.ny,ty=c.nx,vt=nvx*tx+nvy*ty,f=Math.min(1,fric*(R.fric===undefined?1:R.fric));nvx-=vt*tx*f;nvy-=vt*ty*f;
   p.px=p.x-nvx;p.py=p.y-nvy;
   if(c.ny<-0.5){if(info){info.ground=R}if(R.vx)p.x+=R.vx*P.DT}
  }
  if(world.W){ if(p.x<r){p.x=r;p.px=p.x+Math.min(0,p.px-p.x)*-rest*0.0-0;if(info&&info.impact<1)info.wall=-1}else if(p.x>world.W-r){p.x=world.W-r}}
 },
 // find support (top of highest solid at/below y within x±hw); returns rect or null
 supportAt(world,x,y,tol){let best=null,by=1e9;for(const R of world.solids){if(!R.active)continue;if(x<R.x||x>R.x+R.w)continue;if(R.y>=y-tol&&R.y<by){by=R.y;best=R}}return best}
};

// Rigid stick: used for free weapons
class Rigid{
 constructor(len,mass){this.len=len;this.half=len/2;this.m=mass;this.I=mass*len*len/12;this.x=0;this.y=0;this.a=0;this.vx=0;this.vy=0;this.w=0;this.rest=0.28;this.still=0;this.grounded=false;this.lastImpact=0}
 pts(){const c=Math.cos(this.a)*this.half,s=Math.sin(this.a)*this.half;return [[this.x-c,this.y-s],[this.x+c,this.y+s],[this.x,this.y]]}
 step(dt,world,g){
  this.vy+=g*dt;this.x+=this.vx*dt;this.y+=this.vy*dt;this.a+=this.w*dt;this.grounded=false;this.lastImpact=0;
  for(let it=0;it<2;it++){const ps=this.pts();
   for(let k=0;k<3;k++){const [px,py]=ps[k];
    for(const R of world.solids){if(!R.active)continue;if(R.oneway&&this.vy<0)continue;
     const c=P.contact(R,px,py,3,py-this.vy*dt);if(!c)continue;
     const rx=px-this.x,ry=py-this.y;const vpx=this.vx-this.w*ry,vpy=this.vy+this.w*rx;const vn=vpx*c.nx+vpy*c.ny;
     this.x+=c.nx*c.depth*0.9;this.y+=c.ny*c.depth*0.9;
     if(vn<0){const rn=rx*c.ny-ry*c.nx;const j=-(1+this.rest)*vn/(1/this.m+rn*rn/this.I);
      this.vx+=j*c.nx/this.m;this.vy+=j*c.ny/this.m;this.w+=j*rn/this.I;
      const tx=-c.ny,ty=c.nx,vt=vpx*tx+vpy*ty,rt=rx*ty-ry*tx;let jt=-vt/(1/this.m+rt*rt/this.I)*0.5;const mx=0.6*j;jt=Math.max(-mx,Math.min(mx,jt));
      this.vx+=jt*tx/this.m;this.vy+=jt*ty/this.m;this.w+=jt*rt/this.I;this.lastImpact=Math.max(this.lastImpact,-vn)}
     if(c.ny<-0.5)this.grounded=true;
    }}}
  if(this.grounded){this.w*=0.92;this.vx*=0.97;if(Math.abs(this.vx)<8&&Math.abs(this.vy)<30&&Math.abs(this.w)<0.6){this.still+=dt}else this.still=0}else this.still=0;
  if(this.x<10){this.x=10;this.vx=Math.abs(this.vx)*0.5}if(world.W&&this.x>world.W-10){this.x=world.W-10;this.vx=-Math.abs(this.vx)*0.5}
 }
 get speed(){return Math.hypot(this.vx,this.vy)+Math.abs(this.w)*this.half*0.5}
}
P.Rigid=Rigid;

// ---------------- particle system ----------------
class Particles{
 constructor(){this.list=[];this.texts=[];this.max=500;this.enabled=true}
 setQuality(q){this.max=q==='low'?120:q==='medium'?300:600;this.q=q}
 add(o){if(this.list.length>=this.max){if(!o.big)return;this.list.shift()}o.life=o.life||0.5;o.max=o.life;o.size=o.size||3;o.vx=o.vx||0;o.vy=o.vy||0;o.g=o.g||0;o.drag=o.drag===undefined?0.98:o.drag;o.color=o.color||'#fff';o.rot=o.rot||0;o.vr=o.vr||0;this.list.push(o)}
 sparks(x,y,n,color,spd=300,life=0.4,size=3,dir=null,spread=Math.PI*2){if(this.q==='low')n=Math.ceil(n/2);for(let i=0;i<n;i++){const a=(dir===null?Math.random()*Math.PI*2:dir+(Math.random()-0.5)*spread),s=spd*(0.3+Math.random()*0.7);this.add({type:'spark',x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,g:500,life:life*(0.5+Math.random()*0.7),size:size*(0.5+Math.random()),color})}}
 dust(x,y,n=6,color='#bbb',spd=120){for(let i=0;i<n;i++){this.add({type:'smoke',x:x+U.rand(-10,10),y,vx:U.rand(-spd,spd),vy:U.rand(-spd*0.6,-10),g:-30,life:U.rand(0.3,0.7),size:U.rand(4,9),color,drag:0.94})}}
 ring(x,y,r,color,life=0.35,w=4){this.add({type:'ring',x,y,r0:6,r1:r,life,size:w,color,big:1})}
 slash(x,y,ang,len,color,life=0.18){this.add({type:'slash',x,y,rot:ang,r1:len,life,color,size:5,big:1})}
 glow(x,y,r,color,life=0.25){this.add({type:'glow',x,y,r1:r,life,color,big:1})}
 debris(x,y,w,h,color,n,spd=300){for(let i=0;i<n;i++)this.add({type:'debris',x:x+U.rand(0,w),y:y+U.rand(0,h),vx:U.rand(-spd,spd),vy:U.rand(-spd*1.2,-30),g:1400,life:U.rand(1.2,2.4),size:U.rand(4,10),color,rot:U.rand(0,6),vr:U.rand(-10,10),drag:0.995,big:1})}
 text(x,y,str,color='#fff',size=22,life=0.9){this.texts.push({x,y,str,color,size,life,max:life,vy:-70})}
 update(dt,world){
  const L=this.list;let w=0;
  for(let i=0;i<L.length;i++){const p=L[i];p.life-=dt;if(p.life<=0)continue;
   p.vy+=p.g*dt;p.vx*=Math.pow(p.drag,dt*60);p.vy*=Math.pow(p.drag,dt*60);p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt;
   if(p.type==='debris'&&world){for(const R of world.solids){if(!R.active||R.oneway)continue;if(p.x>R.x&&p.x<R.x+R.w&&p.y>R.y&&p.y<R.y+Math.min(R.h,30)&&p.vy>0){p.y=R.y;p.vy*=-0.35;p.vx*=0.7;p.vr*=0.6;break}}}
   L[w++]=p}
  L.length=w;
  for(let i=this.texts.length-1;i>=0;i--){const t=this.texts[i];t.life-=dt;t.y+=t.vy*dt;t.vy*=0.96;if(t.life<=0)this.texts.splice(i,1)}
 }
 draw(ctx){
  const lowq=this.q==='low';
  for(const p of this.list){const a=Math.max(0,p.life/p.max);
   switch(p.type){
   case 'spark':ctx.globalAlpha=a;ctx.fillStyle=p.color;ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);break;
   case 'smoke':ctx.globalAlpha=a*0.5;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size*(1.5-a*0.5),0,6.3);ctx.fill();break;
   case 'ring':{const t=1-a;ctx.globalAlpha=a;ctx.strokeStyle=p.color;ctx.lineWidth=p.size*a+1;ctx.beginPath();ctx.arc(p.x,p.y,p.r0+(p.r1-p.r0)*Math.sqrt(t),0,6.3);ctx.stroke();break}
   case 'slash':{ctx.globalAlpha=a;ctx.strokeStyle=p.color;ctx.lineWidth=p.size*a+1;ctx.beginPath();ctx.moveTo(p.x-Math.cos(p.rot)*p.r1,p.y-Math.sin(p.rot)*p.r1);ctx.lineTo(p.x+Math.cos(p.rot)*p.r1,p.y+Math.sin(p.rot)*p.r1);ctx.stroke();break}
   case 'glow':if(!lowq){ctx.globalAlpha=a*0.6;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r1*(1.2-a*0.4),0,6.3);ctx.fill()}break;
   case 'debris':ctx.globalAlpha=Math.min(1,a*2);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.color;ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*0.8);ctx.restore();break;
   }}
  ctx.globalAlpha=1;
  ctx.textAlign='center';
  for(const t of this.texts){const a=Math.min(1,t.life/t.max*1.6);ctx.globalAlpha=a;ctx.font='bold '+t.size+'px Arial';ctx.lineWidth=4;ctx.strokeStyle='#000';ctx.strokeText(t.str,t.x,t.y);ctx.fillStyle=t.color;ctx.fillText(t.str,t.x,t.y)}
  ctx.globalAlpha=1;
 }
}
SD.ParticleSystem=Particles;
})(window.SD);
