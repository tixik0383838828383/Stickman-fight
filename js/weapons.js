'use strict';
// WeaponController: weapon instances, held physics (spring + breakable grip), free rigid bodies, pickups, drawing.
(function(SD){
const U=SD.U,P=SD.Phys,W=SD.WEAPONS;
const Wp=SD.Weapons={};
Wp.create=(id,rarity)=>{const d=W[id];if(!d)return null;return {def:d,id,rarity:rarity||0,ammo:d.ammo||0,owner:null,held:null,geom:null,ang:0,angV:0,rigid:null,life:0,noPick:0,thrown:null,hitSet:new Set(),trail:[],inst:Math.random()}};
Wp.holdPose=(d)=>{switch(d.style){case 'stab':return {shR:60,elR:60,wa:-18};case 'smash':return {shR:62,elR:80,wa:-78};case 'sweep':return {shR:60,elR:60,wa:-70};case 'bow':return {shR:92,elR:0,wa:-90,lean:12};case 'xbow':return {shR:92,elR:0,wa:-2,lean:12};case 'blaster':return {shR:85,elR:10,wa:0,lean:10};case 'magic':return {shR:60,elR:60,wa:-82};case 'knives':return {shR:55,elR:85,wa:-70};case 'dagger':return {shR:60,elR:90,wa:-35};case 'katana':return {shR:50,elR:80,wa:-30};case 'shield':return null;default:return {shR:55,elR:80,wa:-48}}};
const angDiff=(a,b)=>{let d=a-b;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return d};
Wp.updateHeld=(f,w,dt,game)=>{
 const d=w.def,g=w.geom;const pg=g;
 if(w.held==='main'){
  const hand=f.P[6];const wa=f.pose.wa*Math.PI/180;const target=Math.atan2(Math.sin(wa),f.face*Math.cos(wa));
  if(!w.geom)w.ang=target;
  const active=f.hitActive;const k=active?3000:1000,c=active?90:46;
  const err=angDiff(target,w.ang);w.angV+=(err*k-w.angV*c)*dt;w.angV=U.clamp(w.angV,-70,70);w.ang+=w.angV*dt;
  const dx=Math.cos(w.ang),dy=Math.sin(w.ang),a=d.pivot*d.len,b=(1-d.pivot)*d.len;
  const ng={bx:hand.x-dx*a,by:hand.y-dy*a,tx:hand.x+dx*b,ty:hand.y+dy*b,ang:w.ang,hx:hand.x,hy:hand.y};
  if(pg){ng.pbx=pg.bx;ng.pby=pg.by;ng.ptx=pg.tx;ng.pty=pg.ty}else{ng.pbx=ng.bx;ng.pby=ng.by;ng.ptx=ng.tx;ng.pty=ng.ty}
  w.geom=ng;
  if(d.regen&&w.ammo<d.ammo)w.ammo=Math.min(d.ammo,w.ammo+d.regen*dt);
  // trail
  if(game.quality!=='low'){const sp=Math.hypot(ng.tx-ng.ptx,ng.ty-ng.pty)/dt;if(sp>500){w.trail.push({x:ng.tx,y:ng.ty,bx:ng.bx,by:ng.by,t:0.14})}}
  for(const t of w.trail)t.t-=dt;while(w.trail.length&&w.trail[0].t<=0)w.trail.shift();
  if(f.gripStrain>40+d.mass*45&&f.alive){f.gripStrain=0;game.combat.disarm(f,w,'strain')}
  if(d.glow&&game.quality!=='low'&&Math.random()<0.25&&d.fx==='fire')game.particles.add({type:'spark',x:ng.tx,y:ng.ty,vy:-90,life:0.35,size:4,color:'#ff9a30'});
  if(d.fx==='elec'&&Math.random()<0.15)game.particles.add({type:'spark',x:ng.tx,y:ng.ty,vx:U.rand(-80,80),vy:U.rand(-80,80),life:0.15,size:3,color:'#ffee66'});
 }else{
  const hand=f.P[4],el=f.P[3];const a=Math.atan2(hand.y-el.y,hand.x-el.x);const fa=f.face;
  w.ang=a;const nx=hand.x+fa*14,ny=hand.y-6;w.geom={bx:hand.x,by:hand.y,tx:nx,ty:ny,ang:a,cx:hand.x+fa*12,cy:hand.y-4,hx:hand.x,hy:hand.y};
  if(d.regen&&w.ammo<d.ammo)w.ammo=Math.min(d.ammo,w.ammo+d.regen*dt);
 }
};
Wp.drop=(f,w,game,knocked)=>{
 if(!w||!w.owner)return;const g=w.geom||{bx:f.P[6].x,by:f.P[6].y,tx:f.P[6].x+20,ty:f.P[6].y};
 const d=w.def;const r=new P.Rigid(d.len,Math.max(0.4,d.mass));r.x=(g.bx+g.tx)/2;r.y=(g.by+g.ty)/2;r.a=Math.atan2(g.ty-g.by,g.tx-g.bx);
 const hp=f.P[w.held==='main'?6:4];r.vx=(hp.x-hp.px)/P.DT*0.5+U.rand(-120,120)-f.face*(knocked?100:0);r.vy=(hp.y-hp.py)/P.DT*0.5-(knocked?380:120);r.w=U.rand(-9,9)*(knocked?1.3:1);
 w.rigid=r;w.owner=null;w.noPick=0.5;w.life=25;w.trail=[];w.thrown=null;
 if(w.held==='main')f.main=null;else f.off=null;w.held=null;w.geom=null;
 game.items.list.push(w);game.audio.play('drop');
};
Wp.throwHeld=(f,game)=>{
 const w=f.main||f.off;if(!w||!w.owner)return;const d=w.def;
 const g=w.geom;if(!g)return;const e=game.nearestEnemy(f);let ang=f.face>0?-0.08:Math.PI+0.08;
 if(e){const tx=e.P[1].x-f.P[1].x,ty=e.P[1].y-f.P[1].y;const a=Math.atan2(ty,tx),da=Math.abs(angDiff(a,f.face>0?0:Math.PI));if(da<0.5)ang=a-0.04}
 const sp=d.thrown?1250:950;const owner=f;Wp.drop(f,w,game,false);const r=w.rigid;
 r.vx=Math.cos(ang)*sp;r.vy=Math.sin(ang)*sp-60;r.w=(f.face>0?1:-1)*(d.style==='stab'?0:22);r.a=d.style==='stab'||d.thrown?ang:r.a;
 w.thrown={by:owner,t:0};w.hitSet=new Set();w.noPick=0.3;f.addEnergy(0);game.audio.play('swing',1.4);
};
// -------- events fired by moves --------
Wp.aim=(f,from)=>{const base=f.face>0?0:Math.PI;const e=f.game.nearestEnemy(f);if(!e)return base;const t=e.P[1];const a=Math.atan2(t.y-from.y,t.x-from.x);return Math.abs(angDiff(a,base))<0.6?a:base};
Wp.fireEvent=(f,ev,game)=>{
 if(ev.type==='shoot'){const w=f.main;if(!w){return}const d=w.def;if(d.ammo&&w.ammo<(ev.spec.heavy?2:1)){game.audio.play('click');return}
  if(d.ammo)w.ammo-=ev.spec.heavy?2:1;const g=w.geom;const ox=g.tx,oy=g.ty;let ang=Wp.aim(f,{x:ox,y:oy});
  const pw=ev.spec.power*(1+f.charge*0.6);const base=d.dmg*SD.RARITY[w.rarity].dmg*f.dmgMult;
  const mk=(a,extra)=>game.proj.spawn(Object.assign({type:d.proj,x:ox,y:oy,vx:Math.cos(a),vy:Math.sin(a),dmg:base*pw,owner:f,power:pw,heavy:ev.spec.heavy,rar:w.rarity,fxName:d.fx},extra||{}));
  if(d.style==='knives'){if(ev.spec.heavy){for(let i=-1;i<=1;i++)mk(ang+i*0.16)}else mk(ang)}
  else if(d.style==='magic'&&ev.spec.heavy){for(let i=-1;i<=1;i++)mk(ang+i*0.22)}
  else mk(ang);
  game.audio.play(d.style==='blaster'||d.style==='magic'?'energy':'shoot',d.style==='bow'?1.2:1);
  game.particles.sparks(ox,oy,4,d.col,200,0.2,3,ang,0.8)}
 else if(ev.type==='shock'){const w=f.main;if(!w||!w.geom)return;const g=w.geom;const A=game.arena;const sup=P.supportAt(A,g.tx,g.ty-30,40);const gy=sup?sup.y:Math.max(g.ty,f.root.y+f.footOff);
  const dm=w.def.dmg*f.dmgMult*0.7;game.particles.ring(g.tx,gy,100,'#fff',0.35,5);game.particles.dust(g.tx,gy,10);game.shake(7);game.audio.play('hitheavy',0.7);
  game.combat.areaDamage(g.tx,gy-10,110,dm,f,{kb:[420,-380],noSelf:true,src:'shock',dust:true});if(sup&&(sup.destructible||sup.crate))A.damageRect(sup,dm*1.5,g.tx,gy,f)}
 else if(ev.type==='fn'){ev.fn(f,game)}
};
// ---------- drawing ----------
const mcCache={};
function mcSprite(d){const key=d.id;if(mcCache[key])return mcCache[key];const c=document.createElement('canvas');c.width=c.height=16;const x=c.getContext('2d');const [m,dk,li]=d.pal;const px=(a,b,col)=>{x.fillStyle=col;x.fillRect(a,b,1,1)};
 const diag=(x0,y0,x1,y1,col,th)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));for(let i=0;i<=n;i++){const a=Math.round(x0+(x1-x0)*i/n),b=Math.round(y0+(y1-y0)*i/n);px(a,b,col);if(th>1)px(a+1,b,col)}};
 const brown='#7a4f24';
 switch(d.mc){
 case 'sword':diag(1,14,3,12,brown,1);diag(5,10,13,2,m,2);diag(6,10,14,2,li,1);diag(4,10,14,1,dk,1);for(let i=0;i<5;i++){px(2+i,13-i+(i>0?0:0),dk)}diag(2,9,6,13,'#555',1);diag(5,11,13,3,m,1);break;
 case 'axe':diag(2,13,11,4,brown,1);for(let a=8;a<=14;a++)for(let b=1;b<=7;b++){if((a-8)+(b-1)<10&&a-b>=1)px(a,b,m)}for(let a=8;a<=14;a++)px(a,1+(a-8)%2,li);px(14,2,dk);px(14,3,dk);px(13,4,dk);break;
 case 'pickaxe':diag(2,13,11,4,brown,1);for(let a=4;a<=14;a++)px(a,Math.round(3-Math.sin((a-4)/10*Math.PI)*-0+ (Math.abs(a-9)*0.35)),m);for(let a=4;a<=14;a++)px(a,Math.round(2+(Math.abs(a-9)*0.45)),dk);px(3,6,m);px(14,6,m);px(15,7,dk);px(2,7,dk);break;
 case 'mace':diag(1,14,9,6,brown,1);for(let a=9;a<=14;a++)for(let b=1;b<=6;b++)px(a,b,(a+b)%3===0?li:m);for(const [a,b] of [[8,3],[15,3],[11,0],[11,7],[8,0],[15,6]])px(a,b,dk);break;
 case 'trident':diag(1,14,12,3,brown,1);diag(8,1,15,8,m,1);for(const [a,b] of [[11,1],[12,0],[14,2],[15,3],[10,2],[14,4],[13,3]])px(a,b,li);diag(9,2,14,7,m,1);px(13,0,m);px(15,2,m);px(12,1,m);px(15,5,dk);break;
 case 'bow':for(let i=0;i<16;i++){const a=Math.round(5+Math.sin(i/15*Math.PI)*6);px(a,i,m);px(a+1,i,dk)}for(let i=1;i<15;i++)px(3,i,'#ddd');px(5,0,m);px(5,15,m);px(6,7,brown);px(7,8,brown);break;
 case 'crossbow':for(let i=2;i<14;i++)px(i,8,brown);px(2,7,dk);px(12,7,dk);for(let i=1;i<15;i++)px(11-Math.round(Math.abs(i-8)*0.4),i,m);for(let i=2;i<14;i+=1)if(i%1===0)px(11,i,'#ddd');px(13,8,li);px(14,8,li);break;
 case 'shield':for(let a=3;a<=12;a++)for(let b=1;b<=14;b++){const edge=a===3||a===12||b===1||b===14;if(b>10&&Math.abs(a-7.5)>(14-b)*1.4+0.5)continue;px(a,b,edge?dk:(a<8?m:li))}for(let a=6;a<=9;a++)for(let b=5;b<=8;b++)px(a,b,dk);break;
 }
 mcCache[key]=c;return c}
function glowStroke(c,x0,y0,x1,y1,w,col,ga){c.lineCap='round';c.globalAlpha=ga;c.strokeStyle=col;c.lineWidth=w*2.6;c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();c.globalAlpha=1;c.lineWidth=w;c.stroke();c.strokeStyle='#fff';c.lineWidth=w*0.35;c.globalAlpha=0.9;c.stroke();c.globalAlpha=1}
// draw weapon in local space; origin = grip, +x = forward
Wp.drawShape=(c,d,t,rar,q)=>{
 const L=d.len,pv=d.pivot,a=-pv*L,b=(1-pv)*L,col=d.col,low=q==='low';
 c.lineCap='round';c.lineJoin='round';
 if(d.mc){const sp=mcSprite(d);c.imageSmoothingEnabled=false;
  if(d.mc==='bow'||d.mc==='crossbow'){c.save();c.rotate(d.mc==='bow'?Math.PI/2:Math.PI/4*0);if(d.mc==='bow'){const s=L/16;c.drawImage(sp,-8*s,-8*s,16*s,16*s)}else{c.rotate(0);const s=L/16;c.drawImage(sp,-6*s,-8*s,16*s,16*s)}c.restore()}
  else if(d.mc==='shield'){const s=L/16*1.1;c.drawImage(sp,-8*s,-8*s,16*s,16*s)}
  else{c.save();c.translate((0.5-pv)*L,0);c.rotate(Math.PI/4);const s=L/22.6;c.scale(s,s);c.drawImage(sp,-8,-8,16,16);c.restore()}
  return}
 const id=d.id,st=d.style;
 const hilt=()=>{c.strokeStyle='#4a3020';c.lineWidth=5;c.beginPath();c.moveTo(a,0);c.lineTo(0,0);c.stroke();c.strokeStyle='#bb9';c.lineWidth=3;c.beginPath();c.moveTo(0,-8);c.lineTo(0,8);c.stroke()};
 if(d.glow&&id!=='darklord_sword'){hilt();const gc=d.glow;glowStroke(c,2,0,b,0,id==='energyhammer'?0:7,gc,low?0.15:0.3);
  if(id==='energyhammer'){c.strokeStyle='#5a3a5a';c.lineWidth=5;c.beginPath();c.moveTo(a,0);c.lineTo(b-24,0);c.stroke();c.fillStyle=gc;c.globalAlpha=0.35;c.beginPath();c.arc(b-14,0,24,0,6.3);c.fill();c.globalAlpha=1;c.fillStyle='#ff9af0';c.fillRect(b-34,-16,36,32);c.fillStyle='#fff';c.fillRect(b-30,-12,28,24);}
  if(d.fx==='elec'){c.strokeStyle='#fff';c.lineWidth=2;c.beginPath();c.moveTo(10,0);for(let x=20;x<b;x+=12)c.lineTo(x,Math.sin(t*40+x)*8);c.stroke()}
  if(d.fx==='fire'){c.fillStyle='rgba(255,200,60,.8)';for(let x=10;x<b;x+=10){c.beginPath();c.arc(x,-5+Math.sin(t*20+x)*3,3.5,0,6.3);c.fill()}}
  if(d.fx==='ice'){c.fillStyle='#fff';for(let x=14;x<b;x+=16){c.beginPath();c.moveTo(x,-5);c.lineTo(x+5,-12);c.lineTo(x+8,-5);c.fill()}}
  return}
 switch(id){
 case 'darklord_sword':{c.strokeStyle='#2a1010';c.lineWidth=7;c.beginPath();c.moveTo(a,0);c.lineTo(0,0);c.stroke();c.strokeStyle='#600';c.lineWidth=4;c.beginPath();c.moveTo(0,-14);c.lineTo(0,14);c.stroke();
  c.fillStyle='#14080c';c.strokeStyle='#ff1a1a';c.lineWidth=2;c.beginPath();c.moveTo(2,-9);c.lineTo(b*0.5,-12);c.lineTo(b*0.75,-9);c.lineTo(b,0);c.lineTo(b*0.75,9);c.lineTo(b*0.5,12);c.lineTo(2,9);c.closePath();c.fill();c.stroke();
  c.strokeStyle='rgba(255,40,40,.8)';c.lineWidth=2;c.beginPath();c.moveTo(8,0);c.lineTo(b*0.9,0);c.stroke();if(!low){c.globalAlpha=0.25+0.1*Math.sin(t*8);c.strokeStyle='#f22';c.lineWidth=18;c.beginPath();c.moveTo(10,0);c.lineTo(b*0.9,0);c.stroke();c.globalAlpha=1}break}
 case 'sword':case 'longsword':case 'greatsword':{hilt();c.fillStyle=col;c.strokeStyle='#556';c.lineWidth=1.5;const w=id==='greatsword'?13:id==='longsword'?9:8;c.beginPath();c.moveTo(0,-w/2);c.lineTo(b-w,-w/2);c.lineTo(b,0);c.lineTo(b-w,w/2);c.lineTo(0,w/2);c.closePath();c.fill();c.stroke();c.strokeStyle='#fff';c.lineWidth=1;c.beginPath();c.moveTo(4,0);c.lineTo(b-w,0);c.stroke();break}
 case 'katana':{c.strokeStyle='#222';c.lineWidth=5;c.beginPath();c.moveTo(a,0);c.lineTo(-2,0);c.stroke();c.fillStyle='#c8a030';c.fillRect(-3,-6,5,12);c.fillStyle=col;c.strokeStyle='#667';c.lineWidth=1.2;c.beginPath();c.moveTo(2,-3);c.quadraticCurveTo(b*0.6,-9,b,-7);c.lineTo(b-2,-3);c.quadraticCurveTo(b*0.6,-1,2,3);c.closePath();c.fill();c.stroke();break}
 case 'dagger':{c.strokeStyle='#432';c.lineWidth=5;c.beginPath();c.moveTo(a,0);c.lineTo(0,0);c.stroke();c.fillStyle='#999';c.fillRect(-1,-6,3,12);c.fillStyle=col;c.beginPath();c.moveTo(2,-4);c.lineTo(b-8,-4);c.lineTo(b,0);c.lineTo(b-8,4);c.lineTo(2,4);c.fill();break}
 case 'axe':case 'battleaxe':{c.strokeStyle='#6a4a2a';c.lineWidth=5;c.beginPath();c.moveTo(a,0);c.lineTo(b,0);c.stroke();c.fillStyle=col;c.strokeStyle='#445';c.lineWidth=1.5;const hw=id==='battleaxe'?26:20,hx=b-12;c.beginPath();c.moveTo(hx-8,0);c.lineTo(hx-4,-hw);c.quadraticCurveTo(hx+14,-hw*0.5,hx+10,0);c.closePath();c.fill();c.stroke();if(id==='battleaxe'){c.beginPath();c.moveTo(hx-8,0);c.lineTo(hx-4,hw);c.quadraticCurveTo(hx+14,hw*0.5,hx+10,0);c.closePath();c.fill();c.stroke()}break}
 case 'spear':case 'trident':{c.strokeStyle='#7a5a3a';c.lineWidth=4;c.beginPath();c.moveTo(a,0);c.lineTo(b-18,0);c.stroke();c.fillStyle=col;c.strokeStyle='#446';c.lineWidth=1.5;
  if(id==='spear'){c.beginPath();c.moveTo(b-24,-6);c.lineTo(b,0);c.lineTo(b-24,6);c.lineTo(b-18,0);c.closePath();c.fill();c.stroke()}
  else{c.strokeStyle=col;c.lineWidth=3.5;c.beginPath();c.moveTo(b-26,0);c.lineTo(b,0);c.moveTo(b-30,-12);c.lineTo(b-26,-12);c.lineTo(b-22,-12);c.lineTo(b-8,-12);c.moveTo(b-26,-12);c.lineTo(b-26,12);c.moveTo(b-26,12);c.lineTo(b-8,12);c.moveTo(b-8,-12);c.lineTo(b+2,-12);c.moveTo(b-8,12);c.lineTo(b+2,12);c.stroke()}break}
 case 'hammer':case 'mace':case 'club':{c.strokeStyle=id==='club'?col:'#6a4a2a';c.lineWidth=id==='club'?9:5;c.beginPath();c.moveTo(a,0);c.lineTo(b-14,0);c.stroke();
  if(id==='hammer'){c.fillStyle=col;c.strokeStyle='#333';c.lineWidth=2;c.fillRect(b-30,-17,36,34);c.strokeRect(b-30,-17,36,34);c.fillStyle='#bbc';c.fillRect(b-27,-14,6,28)}
  else if(id==='mace'){c.fillStyle=col;c.strokeStyle='#333';c.lineWidth=2;c.beginPath();c.arc(b-8,0,14,0,6.3);c.fill();c.stroke();c.fillStyle='#ccd';for(let i=0;i<8;i++){const an=i/8*6.28;c.beginPath();c.arc(b-8+Math.cos(an)*14,Math.sin(an)*14,3.5,0,6.3);c.fill()}}
  else{c.fillStyle=col;c.strokeStyle='#432';c.lineWidth=2;c.beginPath();c.moveTo(b-30,-6);c.lineTo(b,-11);c.lineTo(b,11);c.lineTo(b-30,6);c.closePath();c.fill();c.stroke()}break}
 case 'scythe':{c.strokeStyle='#5a4030';c.lineWidth=5;c.beginPath();c.moveTo(a,0);c.lineTo(b,0);c.stroke();c.fillStyle='#bbb';c.strokeStyle='#445';c.lineWidth=1.5;c.beginPath();c.moveTo(b,-2);c.quadraticCurveTo(b+22,-6,b+20,-40);c.quadraticCurveTo(b+2,-26,b-30,-10);c.lineTo(b-30,-4);c.closePath();c.fill();c.stroke();break}
 case 'staff':{c.strokeStyle='#a07a4a';c.lineWidth=6;c.beginPath();c.moveTo(a,0);c.lineTo(b,0);c.stroke();c.strokeStyle='#555';c.lineWidth=7;c.beginPath();c.moveTo(a,0);c.lineTo(a+10,0);c.moveTo(b-10,0);c.lineTo(b,0);c.stroke();break}
 case 'magicstaff':{c.strokeStyle='#5a3a6a';c.lineWidth=5;c.beginPath();c.moveTo(a,0);c.lineTo(b-10,0);c.stroke();c.fillStyle='#c070ff';c.beginPath();c.arc(b,0,9+Math.sin(t*6)*1.5,0,6.3);c.fill();if(!low){c.globalAlpha=0.3;c.beginPath();c.arc(b,0,18,0,6.3);c.fill();c.globalAlpha=1}c.fillStyle='#fff';c.beginPath();c.arc(b+2,-2,3,0,6.3);c.fill();break}
 case 'bow':{c.strokeStyle='#a0703a';c.lineWidth=5;c.beginPath();c.moveTo(0,-L/2);c.quadraticCurveTo(L*0.3,0,0,L/2);c.stroke();c.strokeStyle='#eee';c.lineWidth=1.5;c.beginPath();c.moveTo(0,-L/2);c.lineTo(-4,0);c.lineTo(0,L/2);c.stroke();break}
 case 'crossbow':{c.strokeStyle='#7a5a3a';c.lineWidth=6;c.beginPath();c.moveTo(a,0);c.lineTo(b,0);c.stroke();c.strokeStyle='#444';c.lineWidth=4;c.beginPath();c.moveTo(b-14,-18);c.quadraticCurveTo(b-4,0,b-14,18);c.stroke();c.strokeStyle='#ddd';c.lineWidth=1.5;c.beginPath();c.moveTo(b-14,-18);c.lineTo(b-24,0);c.lineTo(b-14,18);c.stroke();break}
 case 'knives':{c.fillStyle=col;c.beginPath();c.moveTo(-8,-3);c.lineTo(12,-3);c.lineTo(22,0);c.lineTo(12,3);c.lineTo(-8,3);c.fill();c.fillStyle='#432';c.fillRect(-18,-3,10,6);break}
 case 'blaster':{c.fillStyle='#444';c.strokeStyle='#222';c.lineWidth=1.5;c.fillRect(a,-6,b-a-10,12);c.strokeRect(a,-6,b-a-10,12);c.fillStyle=col;c.fillRect(b-12,-3,16,6);c.globalAlpha=0.4;c.beginPath();c.arc(b+4,0,8,0,6.3);c.fill();c.globalAlpha=1;c.fillStyle='#333';c.fillRect(a+4,6,8,14);break}
 case 'shield':{c.fillStyle='#8a6a3a';c.strokeStyle='#432';c.lineWidth=3;c.beginPath();c.moveTo(-6,-28);c.lineTo(8,-28);c.lineTo(8,10);c.lineTo(0,28);c.lineTo(-6,10);c.closePath();c.fill();c.stroke();c.fillStyle='#ccb';c.beginPath();c.arc(1,-8,6,0,6.3);c.fill();break}
 case 'reflect':{c.fillStyle='#dfeeff';c.strokeStyle='#789';c.lineWidth=3;c.beginPath();c.ellipse(1,0,9,28,0,0,6.3);c.fill();c.stroke();c.fillStyle='rgba(255,255,255,.7)';c.beginPath();c.ellipse(-1,-8,3,12,0.2,0,6.3);c.fill();break}
 case 'barrier':{c.fillStyle='#223';c.strokeStyle='#37e0ff';c.lineWidth=2;c.fillRect(-4,-9,8,18);c.strokeRect(-4,-9,8,18);c.fillStyle='#37e0ff';c.beginPath();c.arc(0,0,3,0,6.3);c.fill();break}
 default:hilt();c.fillStyle=col;c.fillRect(0,-4,b,8)}
};
Wp.drawHeld=(ctx,f,w,game)=>{
 const g=w.geom;if(!g)return;const d=w.def;
 // trail
 if(w.trail.length>1&&w.held==='main'){ctx.save();for(let i=1;i<w.trail.length;i++){const a=w.trail[i-1],b=w.trail[i];ctx.globalAlpha=Math.max(0,b.t/0.14)*0.5;ctx.fillStyle=d.glow||'#fff';ctx.beginPath();ctx.moveTo(a.bx,a.by);ctx.lineTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(b.bx,b.by);ctx.fill()}ctx.restore()}
 ctx.save();
 if(w.held==='off'){
  if(d.slot==='off'){const blocking=f.blocking;ctx.translate(g.hx+f.face*(blocking?12:6),g.hy-(blocking?8:0));if(f.face<0)ctx.scale(-1,1);ctx.rotate(blocking?0:0.1);
   if(d.barrier&&blocking){ctx.strokeStyle='rgba(55,224,255,.7)';ctx.lineWidth=5;ctx.beginPath();ctx.arc(-4,-4,44,-1.2,1.2);ctx.stroke();ctx.fillStyle='rgba(55,224,255,.15)';ctx.beginPath();ctx.arc(-4,-4,44,-1.2,1.2);ctx.fill()}
   Wp.drawShape(ctx,d,game.time,w.rarity,game.quality)}
 }else{
  ctx.translate(g.hx,g.hy);ctx.rotate(g.ang);Wp.drawShape(ctx,d,game.time,w.rarity,game.quality)}
 ctx.restore();
 if(w.rarity>=3&&game.quality!=='low'&&w.held==='main'){ctx.save();ctx.globalAlpha=0.3;ctx.strokeStyle=SD.RARITY[w.rarity].color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(g.bx,g.by);ctx.lineTo(g.tx,g.ty);ctx.stroke();ctx.restore()}
};
Wp.drawFree=(ctx,w,game,near)=>{
 const r=w.rigid;if(!r)return;const d=w.def,rc=SD.RARITY[w.rarity].color;
 const blink=w.life<5&&Math.floor(game.time*8)%2===0;if(blink)return;
 ctx.save();ctx.translate(r.x,r.y);
 if(w.rarity>0&&game.quality!=='low'){ctx.globalAlpha=0.28+0.1*Math.sin(game.time*4);ctx.fillStyle=rc;ctx.beginPath();ctx.arc(0,0,d.len*0.5+14,0,6.3);ctx.fill();ctx.globalAlpha=1;if(r.still>0.3){ctx.fillStyle=rc;ctx.globalAlpha=0.35;ctx.fillRect(-2,-90,4,90);ctx.globalAlpha=1}}
 ctx.rotate(r.a);ctx.translate(-(0.5-d.pivot)*d.len,0);Wp.drawShape(ctx,d,game.time,w.rarity,game.quality);ctx.restore();
 if(near){ctx.save();ctx.font='bold 14px Arial';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#000';ctx.strokeText(d.name,r.x,r.y-34);ctx.fillStyle=rc;ctx.fillText(d.name,r.x,r.y-34);ctx.restore()}
};
// ---------- item manager ----------
class Items{
 constructor(game){this.game=game;this.list=[];this.timer=0}
 reset(){this.list=[]}
 spawn(x,y,id,o={}){id=id||SD.rollWeapon();const w=Wp.create(id,o.rarity!==undefined?o.rarity:SD.rollRarity());const d=w.def;const r=new P.Rigid(d.len,Math.max(0.4,d.mass));r.x=x;r.y=y;r.a=U.rand(-0.5,0.5);r.vx=o.vx||0;r.vy=o.vy||0;r.w=U.rand(-4,4);w.rigid=r;w.life=o.life||28;w.noPick=0.2;this.list.push(w);return w}
 update(dt){
  const g=this.game,A=g.arena;
  for(let i=this.list.length-1;i>=0;i--){const w=this.list[i],r=w.rigid;w.life-=dt;w.noPick-=dt;
   r.step(dt,A,SD.Phys.GRAVITY*g.gravity);
   if(w.thrown){w.thrown.t+=dt;if(r.speed<260||w.thrown.t>2.2)w.thrown=null;else g.combat.thrownCheck(w)}
   if(r.y>A.killY+200||w.life<=0){this.list.splice(i,1)}
   if(r.lastImpact>500&&g.quality!=='low')g.audio.play('drop',1);
  }
 }
 nearest(f,range=95){let best=null,bd=range;const p=f.P[0];for(const w of this.list){if(w.noPick>0)continue;const r=w.rigid;const d=Math.hypot(r.x-p.x,r.y-(p.y+10));if(d<bd){bd=d;best=w}}return best}
 interact(f){const w=this.nearest(f);if(w){this.equip(f,w);return true}
  if(f.main||f.off){Wp.drop(f,f.main||f.off,this.game,false);return true}return false}
 equip(f,w){const g=this.game,d=w.def;const i=this.list.indexOf(w);if(i>=0)this.list.splice(i,1);
  if(d.slot==='off'){if(f.off)Wp.drop(f,f.off,g,false);if(f.main&&f.main.def.two)Wp.drop(f,f.main,g,false);f.off=w;w.held='off'}
  else{if(f.main)Wp.drop(f,f.main,g,false);if(d.two&&f.off)Wp.drop(f,f.off,g,false);f.main=w;w.held='main'}
  w.owner=f;w.rigid=null;w.geom=null;w.thrown=null;w.trail=[];w.life=0;f.pickedTypes.add(w.id);g.audio.play('pickup');g.particles.ring(f.P[6].x,f.P[6].y,30,SD.RARITY[w.rarity].color,0.3,3);
  if(f.human&&f.pickedTypes.size>=10)g.achieve('allweapons')}
 give(f,id,rarity){const w=Wp.create(id,rarity||0);if(!w)return;const d=w.def;
  if(d.slot==='off'){f.off=w;w.held='off'}else{f.main=w;w.held='main'}w.owner=f;f.pickedTypes.add(id)}
 draw(ctx){const g=this.game;for(const w of this.list){let near=false;for(const f of g.fighters){if(f.alive&&Math.hypot(f.P[0].x-w.rigid.x,f.P[0].y-w.rigid.y)<110){near=true;break}}Wp.drawFree(ctx,w,g,near)}}
}
SD.Items=Items;
})(window.SD);
