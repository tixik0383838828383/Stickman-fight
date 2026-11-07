'use strict';
// CombatSystem + DamageSystem + projectiles/zones.
(function(SD){
const U=SD.U,P=SD.Phys;
const dpart=(pt,x,y)=>{if(pt.ax===undefined)return Math.hypot(x-pt.x,y-pt.y)-pt.r;return U.segDist(x,y,pt.ax,pt.ay,pt.bx,pt.by).d-pt.r};
const PM={head:1.4,torso:1,arm:0.65,leg:0.75};
class Combat{
 constructor(game){this.game=game;this.depth=0}
 update(dt){
  const g=this.game;
  for(const a of g.fighters){if(!a.alive||!a.hitActive||a.state!=='atk')continue;this.checkAttack(a)}
 }
 sampleHitter(h){ // list of sample points with radius
  const pts=[];
  if(h.seg){for(let i=0;i<=4;i++){const k=i/4;pts.push([U.lerp(h.ax,h.bx,k),U.lerp(h.ay,h.by,k)]);pts.push([U.lerp(h.pax,h.pbx,k),U.lerp(h.pay,h.pby,k)]);pts.push([U.lerp((h.ax+h.pax)/2,(h.bx+h.pbx)/2,k),U.lerp((h.ay+h.pay)/2,(h.by+h.pby)/2,k)])}}
  else{pts.push([h.x,h.y],[h.px,h.py],[(h.x+h.px)/2,(h.y+h.py)/2])}
  return pts}
 checkAttack(a){
  const g=this.game,hs=a.hitters();if(!hs)return;const m=a.move;
  // weapon clash
  if(m.hitter==='weapon'&&a.main&&a.main.geom){
   for(const t of g.fighters){if(t===a||!t.alive||t.team===a.team||!t.hitActive||t.state!=='atk'||!t.main||!t.main.geom||a.hitSet.has('c'+t.id))continue;
    const A=a.main.geom,B=t.main.geom;if(U.segSegHit([A.bx,A.by,A.tx,A.ty],[B.bx,B.by,B.tx,B.ty])){this.clash(a,t,A,B);a.hitSet.add('c'+t.id);t.hitSet.add('c'+a.id)}}}
  // arena objects
  const A=g.arena;
  for(const h of hs){const pts=this.sampleHitter(h);
   for(const R of A.solids){if(!R.active||!(R.destructible||R.crate||R.crumble)||a.hitSet.has(R))continue;
    for(const p of pts){if(p[0]>R.x-h.r&&p[0]<R.x+R.w+h.r&&p[1]>R.y-h.r&&p[1]<R.y+R.h+h.r){a.hitSet.add(R);const dm=m.dmg*a.dmgMult*(m.kind==='heavy'?1.6:0.9);A.damageRect(R,dm,p[0],p[1],a);g.audio.play('hit',0.8);g.particles.sparks(p[0],p[1],6,'#ddd',200);break}}}}
  for(const t of g.fighters){
   if(t===a||!t.alive||t.team===a.team||a.hitSet.has(t.id))continue;
   if(t.invuln>0)continue;
   let best=null,bv=1e9,bpt=null;
   const parts=t.hurtParts();
   for(const h of hs){const pts=this.sampleHitter(h);
    for(const part of parts){for(const p of pts){const d=dpart(part,p[0],p[1])-h.r;if(d<0&&d<bv){bv=d;best=part;bpt=p}}}}
   if(best){a.hitSet.add(t.id);this.hit(a,t,best,bpt,m)}
  }
 }
 clash(a,t,A,B){const g=this.game;const x=(A.tx+B.tx)/2,y=(A.ty+B.ty)/2;g.particles.sparks(x,y,14,'#ffe9a0',380,0.35,3);g.particles.ring(x,y,40,'#fff',0.25,3);g.audio.play('clang');g.hitstop(0.07);g.shake(4);
  const pa=a.move.kind==='heavy'?2:1,pb=t.move.kind==='heavy'?2:1;a.gripStrain+=20*pb*t.main.def.mass;t.gripStrain+=20*pa*a.main.def.mass;
  if(pa>pb){t.stun=Math.max(t.stun,0.25);t.root.vx+=a.face*200}else if(pb>pa){a.stun=Math.max(a.stun,0.25);a.root.vx-=a.face*200}else{a.root.vx-=a.face*220;t.root.vx+=a.face*220}
  if(Math.random()<0.2*Math.max(pa,pb)&&(pa!==pb)){const loser=pa>pb?t:a;if(loser.main&&loser.gripStrain>20)this.disarm(loser,loser.main,'clash',pa>pb?a:t)}}
 // central hit resolution
 hit(a,t,part,pt,m){
  const g=this.game,cfg=g.cfg;
  const heavy=m.kind==='heavy';
  let dmg=m.dmg*a.dmgMult;
  if(m.hitter==='weapon'&&a.main)dmg*=SD.RARITY[a.main.rarity].dmg;
  if(m.hold!==undefined)dmg*=1+a.charge*0.7;
  if(a.counter)dmg*=1.4;
  dmg*=PM[part.t];
  dmg*=g.dmgScale;
  const dirx=m.radial||m.hitter==='all'||m.hitter==='body'?U.sign(t.P[0].x-a.P[0].x):a.face;
  const facingAtt=t.face===U.sign(a.P[0].x-t.P[0].x);
  const wdef=m.hitter==='weapon'&&a.main?a.main.def:null;
  // ---- block / parry ----
  if(t.blocking&&facingAtt&&t.state==='free'){
   if(t.parryT>0&&!heavy||t.parryT>0&&t.off&&t.off.def.reflect){this.parry(t,a,pt);return}
   const od=t.off?t.off.def:null;let red=od?od.block:0.7;let stc=od?od.stam:1;
   if(heavy)red-=0.15;
   if(od&&od.barrier){t.barrierHp=(t.barrierHp===undefined?60:t.barrierHp);}
   const after=dmg*(1-red)*t.incoming;
   t.hp-=after;t.stamina-=dmg*1.6*stc*(heavy?1.3:1);g.stats(a,'damage',after);
   g.particles.sparks(pt[0],pt[1],8,'#ffe9a0',260,0.3,3,null);g.particles.ring(pt[0],pt[1],24,'#fff',0.2,2);g.audio.play('block');g.hitstop(0.045);g.shake(2);
   t.root.vx+=dirx*m.kb[0]*0.35/(1+t.def.kbRes);t.counterT=0.6;a.energy+=0;t.addEnergy(after*0.3);a.addEnergy(after*0.3);
   if(after>0.5)g.particles.text(pt[0],pt[1]-20,Math.round(after),'#9cf',16);
   if(t.stamina<=0){t.stamina=0;t.blocking=false;t.state='stunned';t.stateT=0;t.stunDur=1.1;g.particles.text(t.P[2].x,t.P[2].y-30,'GUARD BREAK','#fc4',18);g.audio.play('clang');t.impulse(1,dirx*200,-60)}
   if(t.hp<=0)this.kill(t,a,'hit');
   a.lastHitConfirm=true;return}
  // ---- clean hit ----
  const fin=dmg*t.incoming;
  t.hp-=fin;g.stats(a,'damage',fin);g.stats(a,'hits',1);t.stats.taken+=fin;t.lastAttacker=a;
  a.lastHitConfirm=true;a.addEnergy(fin*0.9);t.addEnergy(fin*0.5);
  a.combo++;a.comboT=1.3;if(a.combo>a.stats.maxCombo)a.stats.maxCombo=a.combo;
  if(a.human){g.save.data.stats.maxCombo=Math.max(g.save.data.stats.maxCombo,a.combo);g.achieve('first_blood');if(a.combo>=5)g.achieve('combo5')}
  g.dmgEvent(a,t,fin,part.t);
  // knockback
  let kx=m.kb[0]*dirx,ky=m.kb[1];
  if(m.hitter==='all')ky=m.kb[1];
  const kbm=(cfg?cfg.knockback:1)*(1+(1-U.clamp(t.hp/t.maxHp,0,1))*0.4)*(1+(m.hold!==undefined?a.charge*0.5:0))*(wdef?wdef.kb:1)/(1+t.def.kbRes*1.5);
  kx*=kbm;ky*=kbm;
  if(t.hasFx('iron')){kx*=0.3;ky*=0.3}
  const mag=Math.hypot(kx,ky);
  t.poise-=fin*(part.t==='head'?1.7:1.2)*(heavy?1.8:1)*(100/(100+t.def.kbRes*120));
  const idx=part.t==='head'?2:part.t==='torso'?1:part.t==='arm'?(part.ax===t.P[1].x&&part.ay===t.P[1].y?5:6):10;
  // weapon effects
  if(wdef){
   if(wdef.burn){t.setFx('burn',3);t.dotT=0.2}
   if(wdef.slow){t.setFx('slow',3);g.particles.sparks(pt[0],pt[1],6,'#bff',200)}
   if(wdef.stun){t.stun=Math.max(t.stun,wdef.stun)}
   if(wdef.pull)this.applyEff(t,'pull',a);
   if(wdef.shock&&heavy){g.particles.ring(pt[0],pt[1],120,'#ffee55',0.3,5);g.particles.sparks(pt[0],pt[1],18,'#ffee55',500,0.4);g.audio.play('zap');this.areaDamage(pt[0],pt[1],120,wdef.shock,a,{kb:[320,-320],noSelf:true,eff:'stun',src:'shock'})}
   if(wdef.fx==='dark'){a.addEnergy(fin*0.4)}
   g.fxHit(wdef.fx,pt[0],pt[1],heavy,a.face)}
  else g.fxHit('blunt',pt[0],pt[1],heavy,a.face);
  if(a.hasFx('rhythm')){a.rhythmN=(a.rhythmN||0)+1;if(a.rhythmN%3===0){g.particles.ring(a.P[1].x,a.P[1].y,160,'#7f7',0.4,5);this.areaDamage(a.P[1].x,a.P[1].y,160,6,a,{kb:[300,-150],noSelf:true,src:'rhythm'})}}
  if(a.hasFx('form')&&Math.random()<0.5){g.proj.spawn({owner:a,type:'orb',x:a.P[6].x,y:a.P[6].y,dirx:a.face,diry:0,spd:1000,r:8,col:'#ff9a30',dmg:4,kb:[150,-50],life:0.6})}
  // disarm
  if(t.main){let ch=part.t==='arm'?0.28+fin/45:0.04;if(heavy)ch+=0.2;t.gripStrain+=fin*(part.t==='arm'?5:2)*(heavy?1.5:1);if(Math.random()<ch&&mag>200)this.disarm(t,t.main,'hit',a)}
  g.audio.play(heavy||mag>500?'hitheavy':'hit',heavy?0.9:1.1);g.hitstop(heavy?0.09:0.05);g.shake(heavy?7:2.5);t.flash=0.12;
  g.particles.text(pt[0]+U.rand(-8,8),pt[1]-24,Math.round(fin),part.t==='head'?'#ffd24a':'#fff',part.t==='head'?26:20);
  if(part.t==='head'&&fin>3)g.particles.text(pt[0],pt[1]-48,'HEAD','#ffd24a',13,0.6);
  // apply
  if(t.hp<=0){t.root.vx=kx;t.root.vy=ky-150;if(t.w>0.15){t.enterRagdoll(1)}t.P[idx].px-=kx*P.DT*0.5;t.P[idx].py-=ky*P.DT*0.5;this.kill(t,a,'hit');return}
  const air=t.airborne;
  const down=mag>640||t.poise<=0||m.trip&&part.t==='leg'||ky<-700||(air&&mag>300)||t.hasFx('slow')&&mag>520;
  if(down){t.root.vx=kx;t.root.vy=ky-(air?0:60);t.root.ground=null;t.poise=100;t.enterRagdoll(0.75+Math.min(0.9,mag/1600));
   const p0=t.P[0];p0.px=p0.x-kx*P.DT;p0.py=p0.y-(ky-60)*P.DT;t.impulse(idx,kx*0.6,ky*0.6)}
  else if(t.state==='free'||t.state==='hit'||t.state==='atk'||t.state==='cast'||t.state==='stunned'||t.state==='roll'){
   if(t.state==='atk'&&!heavy&&t.moveT<t.move.active[0]&&Math.random()<0.0){}
   t.state='hit';t.stateT=0;t.hitT=(m.stun||0.25)*(part.t==='head'?1.15:1);t.move=null;t.hitActive=false;t.w=Math.min(t.w,0.55);t.root.vx=kx;if(air)t.root.vy=Math.min(t.root.vy,ky);t.impulse(idx,kx*0.8,ky*0.5);t.impulse(2,kx*0.5,-120)}
  if(part.t==='leg'&&m.trip){g.particles.text(pt[0],pt[1]-40,'TRIP','#fff',14)}
 }
 parry(t,a,pt){const g=this.game;g.particles.ring(pt[0],pt[1],50,'#fff',0.3,4);g.particles.sparks(pt[0],pt[1],16,'#ffe66a',420,0.4,3);g.audio.play('parry');g.hitstop(0.12);g.shake(4);
  a.state='stunned';a.stateT=0;a.stunDur=0.7;a.move=null;a.hitActive=false;a.stamina=Math.max(0,a.stamina-20);a.root.vx=-a.face*220;
  t.counterT=0.9;t.addEnergy(15);t.parryT=0;t.stats.parries++;g.particles.text(t.P[2].x,t.P[2].y-34,'PARRY!','#ffe66a',20);
  if(t.human){g.save.data.stats.parries++;g.achieve('parry')}
  if(t.off&&t.off.def.reflect)g.particles.ring(pt[0],pt[1],70,'#9ef',0.3,3)}
 disarm(f,w,cause,by){const g=this.game;if(!f.main&&!f.off)return;SD.Weapons.drop(f,w,g,true);g.particles.text(f.P[6].x,f.P[6].y-30,'DISARMED','#ff8',16);g.particles.sparks(f.P[6].x,f.P[6].y,8,'#fff',250);
  const k=by||f.lastAttacker;if(k){k.stats.disarms++;if(k.human){g.save.data.stats.disarms++;g.achieve('disarm')}}}
 // damage over time / environmental
 dot(f,amount,color,src){if(!f.alive||f.invuln>0&&src!=='burn')return;const g=this.game;f.hp-=amount*g.dmgScale;f.flash=0.05;g.particles.text(f.P[2].x,f.P[2].y-30,Math.round(amount),color||'#fa5',14,0.6);g.stats(f.lastAttacker,'damage',amount);if(f.hp<=0)this.kill(f,f.lastAttacker,src||'dot')}
 hazardHit(f,spec,x,y,silent){const g=this.game;if(!f.alive||f.invuln>0)return;const d=g.cfg.instaKO?99999:spec.dmg*f.incoming*g.dmgScale;f.hp-=d;f.flash=0.12;f.stats.taken+=d;
  g.particles.text(x,y-20,Math.round(d),'#f84',20);g.particles.sparks(x,y,10,'#f84',300,0.4);g.audio.play(spec.src==='lava'?'fire':'hit');g.shake(3);
  if(f.hp<=0){f.root.vx=spec.kx;f.root.vy=spec.ky;this.kill(f,f.lastAttacker,spec.src);return}
  if(f.w>0.15){f.root.vx=spec.kx;f.root.vy=spec.ky;f.root.ground=null;f.enterRagdoll(0.9)}else{P.impulse(f.P[0],spec.kx,spec.ky)}}
 // direct damage (abilities, explosions, thrown): ignores blocks except stance modifiers
 direct(t,owner,dmg,kx,ky,o={}){
  const g=this.game;if(!t.alive||t.invuln>0)return false;
  let d=dmg*g.dmgScale;
  if(t.blocking&&o.blockable&&t.face===U.sign((owner?owner.P[0].x:t.P[0].x+1)-t.P[0].x)){const od=t.off?t.off.def:null;const red=od?od.block:0.6;
   if(od&&od.reflect&&o.proj){return 'reflect'}
   d*=(1-red);t.stamina-=d*1.5;kx*=0.3;ky*=0.2;g.audio.play('block');g.particles.sparks(t.P[1].x,t.P[1].y,8,'#ffe9a0',250);
   if(t.stamina<=0){t.stamina=0;t.state='stunned';t.stateT=0;t.stunDur=1;t.blocking=false}}
  d*=t.incoming;t.hp-=d;t.flash=0.12;t.stats.taken+=d;if(owner&&owner!==t){t.lastAttacker=owner;g.stats(owner,'damage',d);g.stats(owner,'hits',1);owner.addEnergy(d*0.6);owner.combo++;owner.comboT=1.3}
  t.addEnergy(d*0.4);
  g.particles.text(t.P[1].x+U.rand(-10,10),t.P[1].y-30,Math.round(d),o.color||'#fff',20);
  if(o.eff)this.applyEff(t,o.eff,owner);
  const kbm=(g.cfg?g.cfg.knockback:1)/(1+t.def.kbRes*1.5)*(t.hasFx('iron')?0.3:1);kx*=kbm;ky*=kbm;
  if(t.hp<=0){t.root.vx=kx;t.root.vy=ky;if(t.w>0.15)t.enterRagdoll(1);P.impulse(t.P[1],kx*0.6,ky*0.6);this.kill(t,owner,o.src||'ability');return true}
  const mag=Math.hypot(kx,ky);
  if(mag>260){t.root.vx=kx;t.root.vy=ky;t.root.ground=null;if(t.w>0.15)t.enterRagdoll(0.6+Math.min(1,mag/1500));const p0=t.P[0];p0.px=p0.x-kx*P.DT;p0.py=p0.y-ky*P.DT;t.impulse(1,kx*0.5,ky*0.5)}
  else if(t.state==='free'){t.state='hit';t.stateT=0;t.hitT=0.2;t.root.vx=kx}
  return true}
 applyEff(t,e,owner){const g=this.game;switch(e){case 'burn':t.setFx('burn',3);t.dotT=0.2;break;case 'slow':t.setFx('slow',3);break;case 'stun':t.stun=Math.max(t.stun,0.7);if(t.state==='free'||t.state==='atk'){t.state='stunned';t.stateT=0;t.stunDur=0.7;t.move=null;t.hitActive=false}break;case 'poison':t.setFx('poison',3);break;case 'lev':t.setFx('lev',2);t.root.vy=-350;t.root.ground=null;break;case 'net':t.setFx('slow',3);t.stun=Math.max(t.stun,0.5);t.root.vx*=0.2;break;case 'pull':if(owner){t.root.vx+=(owner.P[0].x-t.P[0].x>0?1:-1)*500}break}}
 areaDamage(x,y,r,dmg,owner,o={}){
  const g=this.game;
  for(const t of g.fighters){if(!t.alive)continue;if(owner&&t===owner&&o.noSelf)continue;if(owner&&t!==owner&&t.team===owner.team)continue;
   const cx=t.P[1].x,cy=t.P[1].y;const d=Math.hypot(cx-x,cy-y);if(d>r+24)continue;
   const fall=1-Math.min(1,d/(r+24))*0.5;const dx=cx-x,dy=cy-y,l=Math.hypot(dx,dy)||1;
   const kb=o.kb||[600,-500];const sx=(Math.abs(dx)<10?(Math.random()<0.5?-1:1):U.sign(dx));
   const self=owner&&t===owner?0.6:1;
   this.direct(t,owner,dmg*fall*self,sx*kb[0]*fall,(kb[1])*fall+dy/l*100,{eff:o.eff,src:o.src,color:o.color,blockable:o.blockable})}
  if(o.dust)g.particles.dust(x,y,6)
 }
 explosion(x,y,r,dmg,owner,src,xo={}){
  const g=this.game;if(this.depth>3)return;this.depth++;
  g.particles.ring(x,y,r,'#ffcc44',0.45,8);g.particles.ring(x,y,r*0.6,'#ff6622',0.35,6);g.particles.glow(x,y,r*0.9,'#ffaa33',0.35);g.particles.sparks(x,y,26,'#ffa030',600,0.7,5);g.particles.dust(x,y,10,'#555');g.audio.play('explode');g.shake(14);g.hitstop(0.1);
  this.areaDamage(x,y,r,dmg,owner,{kb:[900,-780],src:src||'explosion',color:'#fa4',noSelf:xo.noSelf});
  for(const R of g.arena.solids){if(!R.active)continue;const cx=U.clamp(x,R.x,R.x+R.w),cy=U.clamp(y,R.y,R.y+R.h);if(Math.hypot(cx-x,cy-y)<r){if(R.destructible||R.crate||R.crumble)g.arena.damageRect(R,dmg*(R.crumble?9:3),cx,cy,owner)}}
  this.depth--}
 kill(t,killer,cause){
  const g=this.game;if(!t.alive)return;t.hp=0;t.die();g.audio.play('ko');g.particles.sparks(t.P[1].x,t.P[1].y,18,'#fff',420,0.5);
  if(killer&&killer!==t){killer.stats.kills++;if(killer.human){g.save.data.stats.kills++}}
  if(cause==='ringout'&&killer&&killer.human){g.achieve('ringout');g.save.data.stats.ringouts++}
  if((cause==='tnt'||cause==='explosion')&&killer&&killer.human&&killer!==t)g.achieve('explode');
  g.onKill(t,killer,cause)}
 thrownCheck(w){const g=this.game,r=w.rigid,d=w.def,c=Math.cos(r.a)*d.len/2,s=Math.sin(r.a)*d.len/2;
  const seg=[r.x-c,r.y-s,r.x+c,r.y+s];
  for(const t of g.fighters){if(!t.alive||t===w.thrown.by&&w.thrown.t<0.35||t.invuln>0||w.hitSet.has(t.id))continue;
   if(w.thrown.by&&t.team===w.thrown.by.team)continue;
   for(const part of t.hurtParts()){let hit=false;for(let i=0;i<=4;i++){const x=U.lerp(seg[0],seg[2],i/4),y=U.lerp(seg[1],seg[3],i/4);if(dpart(part,x,y)<5){hit=true;break}}
    if(hit){w.hitSet.add(t.id);const sp=r.speed;const dm=Math.min(24,d.dmg*0.9+sp*0.006)*SD.RARITY[w.rarity].dmg*(part.t==='head'?1.3:1);
     const k=r.vx>0?1:-1;this.direct(t,w.thrown.by,dm,k*380,-200,{blockable:true,src:'thrown'});g.particles.sparks(r.x,r.y,10,'#fff',300);g.audio.play('hit');g.hitstop(0.05);r.vx*=-0.25;r.vy=-200;w.thrown=null;return}}}
 }
}
SD.Combat=Combat;

// ---------------- projectiles & zones ----------------
const PT={
 arrow:{spd:1300,g:420,r:5,col:'#c9a36a',stick:1,len:28,life:3},bolt:{spd:1600,g:150,r:5,col:'#bbb',stick:1,len:24,life:3},knife:{spd:1150,g:420,r:6,col:'#dde',spin:1,stick:1,life:3},
 energy:{spd:1400,g:0,r:7,col:'#37e0ff',glow:1,life:1.6,burst:1},magic:{spd:850,g:0,r:9,col:'#c070ff',glow:1,home:0.9,life:2,burst:1},orb:{spd:900,g:0,r:12,col:'#fff',glow:1,life:1.5,burst:1},
 tnt:{spd:650,g:900,r:13,col:'#ff4a30',sprite:'tnt',explodeR:125,tnt:1,life:1.7,burst:1,kb:[500,-500]},
 fireball:{spd:900,g:60,r:11,col:'#ff7a22',glow:1,explodeR:60,eff:'burn',life:1.6,burst:1,trail:1,kb:[420,-200]},
 pearl:{spd:800,g:700,r:9,col:'#2fb39a',sprite:'pearl',noExpl:1,life:1.6,pearl:1,kb:[40,-30]}
};
class Projectiles{
 constructor(game){this.game=game;this.list=[];this.zones=[];this.later=[]}
 reset(){this.list=[];this.zones=[];this.later=[]}
 spawn(o){const base=PT[o.type]||PT.orb;const p=Object.assign({},base,o);
  let dx=p.dirx!==undefined?p.dirx:p.vx,dy=p.diry!==undefined?p.diry:p.vy;const l=Math.hypot(dx,dy)||1;
  const spd=o.spd||base.spd;p.vx=dx/l*spd;p.vy=dy/l*spd;p.age=0;p.hit=new Set();p.team=p.owner?p.owner.team:-1;p.stuck=0;p.life=o.life||base.life||2;p.pierce=o.pierce||0;p.rot=Math.atan2(p.vy,p.vx);p.kb=p.kb||[260,-90];
  if(o.dmg===undefined)p.dmg=5;this.list.push(p);return p}
 zone(o){o.t=o.t||1;o.max=o.t;o.team=o.owner?o.owner.team:-1;o.age=0;o.hits={};this.zones.push(o);return o}
 beam(owner,x,y,ang,len,width,dmg,dur,col,o={}){return this.zone(Object.assign({kind:'beam',owner,x,y,ang,len,width,dmg,t:dur,col,kb:[500,-250],tick:0,follow:false},o))}
 after(t,fn){this.later.push({t,fn})}
 update(dt){
  const g=this.game,A=g.arena;
  for(let i=this.later.length-1;i>=0;i--){const l=this.later[i];l.t-=dt;if(l.t<=0){this.later.splice(i,1);l.fn()}}
  for(let i=this.list.length-1;i>=0;i--){const p=this.list[i];p.age+=dt;p.life-=dt;
   if(p.stuck>0){p.stuck-=dt;if(p.stuck<=0||p.life<=-3)this.list.splice(i,1);continue}
   if(p.life<=0){if(p.explodeR&&!p.noExpl)this.explode(p);if(p.onEnd)p.onEnd(p);this.list.splice(i,1);continue}
   if(p.home){let e=null,bd=700;for(const f of g.fighters){if(!f.alive||f.team===p.team)continue;const d=Math.hypot(f.P[1].x-p.x,f.P[1].y-p.y);if(d<bd){bd=d;e=f}}
    if(e){const sp=Math.hypot(p.vx,p.vy);let a=Math.atan2(p.vy,p.vx),ta=Math.atan2(e.P[1].y-p.y,e.P[1].x-p.x),da=ta-a;while(da>Math.PI)da-=6.283;while(da<-Math.PI)da+=6.283;a+=U.clamp(da,-p.home*dt*4,p.home*dt*4);p.vx=Math.cos(a)*sp;p.vy=Math.sin(a)*sp}}
   p.vy+=(p.g||0)*dt;
   const steps=Math.ceil(Math.hypot(p.vx,p.vy)*dt/12)||1;let dead=false;
   for(let s=0;s<steps&&!dead;s++){
    p.x+=p.vx*dt/steps;p.y+=p.vy*dt/steps;
    if(p.ground){const sup=P.supportAt(A,p.x,p.y-30,40);if(!sup||Math.abs(sup.y-p.gy)>60&&false){dead=true;break}p.y=sup.y-(p.h||16);p.gy=sup.y;
     // wall check
     for(const R of A.solids){if(!R.active||R.oneway)continue;if(p.x>R.x&&p.x<R.x+R.w&&p.y>R.y&&p.y<R.y+R.h-4){if(R.destructible||R.crate)A.damageRect(R,p.dmg*1.5,p.x,p.y,p.owner);dead=true;break}}
     if(p.x<0||p.x>A.W)dead=true;if(dead)break}
    else for(const R of A.solids){if(!R.active)continue;if(R.oneway&&!p.hitOneway)continue;
     if(p.x>R.x&&p.x<R.x+R.w&&p.y>R.y&&p.y<R.y+R.h){
      if(R.destructible||R.crate||R.crumble)A.damageRect(R,p.dmg*(p.explodeR?3:1.5),p.x,p.y,p.owner);
      if(p.stick){p.stuck=3;p.vx=p.vy=0;g.audio.play('hit',0.6,0.5);dead=false}
      else if(p.explodeR){this.explode(p);dead=true}else{g.particles.sparks(p.x,p.y,6,p.col,200,0.25);dead=true}
      break}}
    if(p.stuck||dead)break;
    if(p.x<-50||p.x>A.W+50||p.y>A.killY+100||p.y<-900){dead=true;break}
    // fighters
    for(const t of g.fighters){if(!t.alive||t.team===p.team||p.hit.has(t.id)||t.invuln>0)continue;
     const parts=t.hurtParts();let hp=null;for(const part of parts){if(dpart(part,p.x,p.y)<p.r){hp=part;break}}
     if(hp){p.hit.add(t.id);const res=this.hitFighter(p,t,hp);if(res==='reflect'){p.owner=t;p.team=t.team;p.vx*=-1;p.vy*=-1;p.hit.clear();p.rot+=Math.PI;g.particles.ring(p.x,p.y,36,'#9ef',0.3,3);g.audio.play('parry');break}
      if(p.pierce>0)p.pierce--;else{dead=true;break}}}
    // barrier from energy shield blocks
   }
   if(dead){if(p.explodeR&&!p.noExpl&&!p.stuck)this.explode(p);if(!p.stuck){if(p.onEnd)p.onEnd(p);this.list.splice(i,1)}}
   else if(!p.stuck){p.rot=Math.atan2(p.vy,p.vx);if(p.trail&&g.quality!=='low'&&Math.random()<0.7)g.particles.add({type:'smoke',x:p.x,y:p.y,vx:U.rand(-20,20),vy:U.rand(-20,20),life:0.25,size:p.r*0.6,color:p.col,drag:0.9})}
  }
  // zones
  for(let i=this.zones.length-1;i>=0;i--){const z=this.zones[i];z.t-=dt;z.age+=dt;
   if(z.follow&&z.owner){z.x=z.owner.P[1].x;z.y=z.owner.P[1].y}
   this.updateZone(z,dt);
   if(z.t<=0||z.dead){if(z.onEnd)z.onEnd(z);this.zones.splice(i,1)}}
 }
 hitFighter(p,t,part){
  const g=this.game,c=g.combat;let dm=p.dmg*(part.t==='head'?1.3:1);const k=p.vx>0?1:-1;
  const kb=[(p.kb[0])*k,p.kb[1]];
  if(p.type==='knife'||p.type==='arrow'||p.type==='bolt'){}
  const res=c.direct(t,p.owner,dm,kb[0],kb[1],{blockable:true,proj:true,eff:p.eff,color:p.col,src:'proj'});
  if(res==='reflect')return 'reflect';
  g.particles.sparks(p.x,p.y,8,p.col,260,0.3);g.audio.play(p.glow?'zap':'hit',1.2,0.8);g.hitstop(0.03);
  if(p.owner&&p.owner.human){}
  if(p.explodeR)this.explode(p);return true}
 explode(p){const g=this.game;p.noExpl=true;if(p.tnt){g.combat.explosion(p.x,p.y,p.explodeR,p.dmg,p.owner,'tnt',{noSelf:true});return}g.particles.ring(p.x,p.y,p.explodeR,p.col,0.3,4);g.particles.glow(p.x,p.y,p.explodeR,p.col,0.25);g.particles.sparks(p.x,p.y,10,p.col,300,0.4);g.audio.play('energy',0.8);
  g.combat.areaDamage(p.x,p.y,p.explodeR,p.dmg*0.6,p.owner,{kb:p.kb||[300,-200],noSelf:true,eff:p.eff,color:p.col,src:'proj'})}
 updateZone(z,dt){
  const g=this.game;
  switch(z.kind){
  case 'beam':{z.tick-=dt;if(z.tick<=0){z.tick=z.every||0.25;
    const ex=z.x+Math.cos(z.ang)*z.len,ey=z.y+Math.sin(z.ang)*z.len;
    for(const t of g.fighters){if(!t.alive||t.team===z.team)continue;let hit=false;for(const part of t.hurtParts()){const pc=part.ax===undefined?{x:part.x,y:part.y}:{x:(part.ax+part.bx)/2,y:(part.ay+part.by)/2};const d=U.segDist(pc.x,pc.y,z.x,z.y,ex,ey).d;if(d<z.width/2+part.r){hit=true;break}}
     if(hit){const k=Math.cos(z.ang)>=0?1:-1;g.combat.direct(t,z.owner,z.dmg,(z.kb[0])*(Math.abs(Math.cos(z.ang))>0.3?k:(t.P[0].x>z.x?1:-1)),z.kb[1],{src:'beam',color:z.col});g.particles.sparks(t.P[1].x,t.P[1].y,6,z.col,300)}}
    if(!z.nodestroy)for(const R of g.arena.solids){if(!R.active||!(R.destructible||R.crate))continue;const cx=R.x+R.w/2,cy=R.y+R.h/2;if(U.segDist(cx,cy,z.x,z.y,ex,ey).d<z.width/2+Math.max(R.w,R.h)/2)g.arena.damageRect(R,z.dmg*0.8,cx,cy,z.owner)}}
   break}
  case 'cloud':{z.tick=(z.tick||0)-dt;if(z.tick<=0){z.tick=0.3;for(const t of g.fighters){if(!t.alive)continue;if(Math.hypot(t.P[1].x-z.x,t.P[1].y-z.y)>z.r)continue;
     if(z.eff==='heal'){if(z.owner&&t.team===z.owner.team){t.hp=Math.min(t.maxHp,t.hp+3);g.particles.text(t.P[2].x,t.P[2].y-30,'+3','#6f6',14,0.5)}}
     else if(t.team!==z.team){if(z.eff==='lev'){t.setFx('lev',1.2);t.root.vy=Math.min(t.root.vy,-160);t.root.ground=null}else t.setFx(z.eff,1.2);if(z.eff==='poison')t.lastAttacker=z.owner}}}
   if(g.quality!=='low'&&Math.random()<0.5)g.particles.add({type:'smoke',x:z.x+U.rand(-z.r,z.r)*0.8,y:z.y+U.rand(-z.r*0.5,z.r*0.3),vy:-30,life:0.6,size:10,color:z.col,drag:0.95});break}
  case 'mine':{if(z.age>0.6){for(const t of g.fighters){if(!t.alive||t.team===z.team||t.invuln>0)continue;if(Math.hypot(t.P[0].x-z.x,t.P[0].y-z.y)<z.r+20&&t.P[10].y>z.y-40){z.dead=true;g.particles.ring(z.x,z.y,z.r*1.5,'#ff4',0.35,5);g.particles.sparks(z.x,z.y,20,'#fd4',450,0.5);g.audio.play('explode',1.2);g.shake(6);g.combat.areaDamage(z.x,z.y,z.r*1.5,z.dmg,z.owner,{kb:[400,-650],eff:'stun',src:'mine'});break}}}break}
  case 'turret':{z.tick=(z.tick||0)-dt;if(z.tick<=0){let e=null,bd=720;for(const t of g.fighters){if(!t.alive||t.team===z.team)continue;const d=Math.hypot(t.P[1].x-z.x,t.P[1].y-z.y);if(d<bd){bd=d;e=t}}
    if(e){z.tick=0.65;const a=Math.atan2(e.P[1].y-(z.y-24),e.P[1].x-z.x);z.ang=a;this.spawn({type:'orb',owner:z.owner,x:z.x,y:z.y-24,dirx:Math.cos(a),diry:Math.sin(a),spd:1100,r:5,col:'#ffe040',dmg:z.dmg,kb:[160,-60],life:0.9});g.audio.play('shoot',1.5)}else z.tick=0.2}break}
  case 'pulse':{z.tick=(z.tick||0)-dt;if(z.tick<=0){z.tick=0.6;g.particles.ring(z.x,z.y,z.r,z.col,0.45,6);g.particles.ring(z.x,z.y,z.r*0.6,'#fff',0.35,3);g.audio.play('energy',0.7);g.combat.areaDamage(z.x,z.y,z.r,z.dmg,z.owner,{kb:[450,-280],noSelf:true,src:'pulse',color:z.col})}break}
  case 'warn':break;
  }
 }
 draw(ctx){
  const g=this.game,t=g.time,low=g.quality==='low';
  for(const p of this.list){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);
   if(p.stuck>0&&p.stuck<0.5)ctx.globalAlpha=p.stuck*2;
   switch(p.type){
   case 'arrow':ctx.strokeStyle='#8a6a3a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-p.len,0);ctx.lineTo(0,0);ctx.stroke();ctx.fillStyle='#ddd';ctx.beginPath();ctx.moveTo(0,-4);ctx.lineTo(9,0);ctx.lineTo(0,4);ctx.fill();ctx.strokeStyle='#eee';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-p.len,-4);ctx.lineTo(-p.len+6,0);ctx.lineTo(-p.len,4);ctx.stroke();break;
   case 'bolt':ctx.strokeStyle='#555';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-p.len,0);ctx.lineTo(0,0);ctx.stroke();ctx.fillStyle='#ccc';ctx.beginPath();ctx.moveTo(0,-4);ctx.lineTo(10,0);ctx.lineTo(0,4);ctx.fill();break;
   case 'knife':{ctx.rotate(t*30);ctx.fillStyle='#dde';ctx.beginPath();ctx.moveTo(-8,-3);ctx.lineTo(10,-3);ctx.lineTo(18,0);ctx.lineTo(10,3);ctx.lineTo(-8,3);ctx.fill();ctx.fillStyle='#432';ctx.fillRect(-16,-3,8,6);break}
   default:{
    if(p.sprite){this.drawSprite(ctx,p,t);break}
    if(p.note){ctx.rotate(-p.rot);ctx.fillStyle=p.col;ctx.font='bold 26px Arial';ctx.textAlign='center';ctx.fillText('♪',0,8);break}
    if(!low){ctx.globalAlpha*=0.35;ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(0,0,p.r*2,0,6.3);ctx.fill();ctx.globalAlpha=1}
    ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(0,0,p.r,0,6.3);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,p.r*0.5,0,6.3);ctx.fill()}}
   ctx.restore()}
  for(const z of this.zones){const k=Math.max(0,z.t/z.max);
   switch(z.kind){
   case 'beam':{ctx.save();ctx.globalAlpha=Math.min(1,k*3);ctx.lineCap='round';const ex=z.x+Math.cos(z.ang)*z.len,ey=z.y+Math.sin(z.ang)*z.len;ctx.strokeStyle=z.col;ctx.lineWidth=z.width*(0.8+0.2*Math.sin(t*60));ctx.globalAlpha*=0.5;ctx.beginPath();ctx.moveTo(z.x,z.y);ctx.lineTo(ex,ey);ctx.stroke();ctx.globalAlpha=Math.min(1,k*3);ctx.strokeStyle='#fff';ctx.lineWidth=z.width*0.4;ctx.stroke();ctx.restore();break}
   case 'cloud':ctx.save();ctx.globalAlpha=0.25*Math.min(1,k*3);ctx.fillStyle=z.col;ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,6.3);ctx.fill();ctx.restore();break;
   case 'mine':ctx.save();ctx.translate(z.x,z.y);ctx.fillStyle='#444';ctx.beginPath();ctx.arc(0,0,9,Math.PI,0);ctx.fill();ctx.fillStyle=Math.floor(t*4)%2?'#f33':'#611';ctx.beginPath();ctx.arc(0,-4,3,0,6.3);ctx.fill();ctx.restore();break;
   case 'turret':ctx.save();ctx.translate(z.x,z.y);ctx.fillStyle='#555';ctx.fillRect(-14,-10,28,10);ctx.fillStyle='#ffd34a';ctx.fillRect(-9,-22,18,14);ctx.strokeStyle='#222';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,-16);ctx.lineTo(Math.cos(z.ang||0)*22,-16+Math.sin(z.ang||0)*22);ctx.stroke();ctx.restore();break;
   case 'warn':ctx.save();ctx.globalAlpha=0.3+0.3*Math.sin(t*30);ctx.fillStyle=z.col;ctx.fillRect(z.x-z.width/2,0,z.width,g.arena.H);ctx.restore();break;
   }}
 }
 drawSprite(ctx,p,t){switch(p.sprite){
  case 'wolf':case 'boar':{const s=p.sprite==='boar'?1.2:1;ctx.rotate(-p.rot);if(p.vx<0)ctx.scale(-1,1);ctx.scale(s,s);const run=Math.sin(t*28)*5;ctx.fillStyle=p.sprite==='boar'?'#7a4a2a':'#bbb';ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-12,22,10,0,0,6.3);ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(22,-18,10,8,0,0,6.3);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.fillRect(28,-14,5,3);ctx.fillStyle='#f22';ctx.fillRect(24,-21,3,3);
   ctx.lineWidth=4;ctx.strokeStyle=ctx.fillStyle='#999';for(const [x,o] of [[-14,run],[-8,-run],[10,-run],[16,run]]){ctx.beginPath();ctx.moveTo(x,-6);ctx.lineTo(x+o,2);ctx.stroke()}ctx.beginPath();ctx.moveTo(-22,-14);ctx.lineTo(-32,-22+run);ctx.stroke();break}
  case 'eagle':{ctx.rotate(-p.rot+Math.PI/2*0);ctx.fillStyle='#6a4a2a';ctx.strokeStyle='#000';ctx.lineWidth=2;const fl=Math.sin(t*30)*8;ctx.beginPath();ctx.moveTo(0,-16);ctx.lineTo(-28,fl);ctx.lineTo(0,-4);ctx.lineTo(28,fl);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(0,0,6,14,0,0,6.3);ctx.fill();ctx.stroke();ctx.fillStyle='#ffd';ctx.beginPath();ctx.arc(0,14,5,0,6.3);ctx.fill();break}
  case 'flame':ctx.rotate(-p.rot);ctx.fillStyle='#ff7a22';ctx.beginPath();ctx.moveTo(-14,0);ctx.quadraticCurveTo(-6,-28-Math.sin(t*30)*6,6,-6);ctx.quadraticCurveTo(10,-20,16,0);ctx.closePath();ctx.fill();ctx.fillStyle='#ffe066';ctx.beginPath();ctx.arc(0,-6,6,0,6.3);ctx.fill();break;
  case 'potion':ctx.rotate(t*12);ctx.fillStyle=p.col;ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,3,8,0,6.3);ctx.fill();ctx.stroke();ctx.fillRect(-3,-10,6,8);ctx.strokeRect(-3,-10,6,8);break;
  case 'bomb':ctx.rotate(-p.rot);ctx.fillStyle='#222';ctx.strokeStyle='#ffd34a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,9,0,6.3);ctx.fill();ctx.stroke();ctx.fillStyle=Math.floor(t*8)%2?'#f44':'#fa4';ctx.fillRect(-2,-14,4,6);break;
  case 'tnt':ctx.rotate(t*6);ctx.fillStyle='#d33';ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.fillRect(-11,-11,22,22);ctx.strokeRect(-11,-11,22,22);ctx.fillStyle='#fff';ctx.fillRect(-11,-4,22,8);ctx.fillStyle='#000';ctx.font='bold 8px sans-serif';ctx.textAlign='center';ctx.fillText('TNT',0,3);break;
  case 'pearl':ctx.fillStyle='#1c7a6a';ctx.strokeStyle='#8fffe0';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,9,0,6.3);ctx.fill();ctx.stroke();ctx.fillStyle='#8fffe0';ctx.beginPath();ctx.arc(-2,-2,3,0,6.3);ctx.fill();break;
  case 'net':ctx.strokeStyle='#ddd';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,16,0,6.3);ctx.moveTo(-16,0);ctx.lineTo(16,0);ctx.moveTo(0,-16);ctx.lineTo(0,16);ctx.stroke();break;
  case 'shock':ctx.rotate(-p.rot);ctx.strokeStyle=p.col;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-8,-30);ctx.lineTo(8,-30);ctx.closePath();ctx.stroke();break;
 }}
}
SD.Projectiles=Projectiles;
})(window.SD);
