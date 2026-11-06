'use strict';
// BotAI: 4 levels. Produces the same input struct as a human.
(function(SD){
const U=SD.U,P=SD.Phys;
const LV=[
 {name:'Новичок',react:0.5,aggr:0.25,block:0.15,dodge:0,combo:1,ability:0.05,pickup:0.3,parry:0,hazard:0.6,wait:0.9},
 {name:'Обычный',react:0.3,aggr:0.5,block:0.45,dodge:0.1,combo:2,ability:0.3,pickup:0.7,parry:0,hazard:0.85,wait:0.5},
 {name:'Опытный',react:0.17,aggr:0.7,block:0.65,dodge:0.35,combo:3,ability:0.6,pickup:0.9,parry:0.3,hazard:0.97,wait:0.3},
 {name:'Мастер',react:0.08,aggr:0.85,block:0.85,dodge:0.55,combo:4,ability:0.9,pickup:1,parry:0.65,hazard:1,wait:0.15}];
SD.BOT_LEVELS=LV;
const mk=()=>({x:0,jump:false,jumpHeld:false,down:false,light:false,heavy:false,heavyHeld:false,lightHeld:false,block:false,ability:false,throw:false,interact:false});
class BotController{
 constructor(level){this.lv=LV[U.clamp(level,0,3)];this.level=level;this.t=0;this.thinkT=0;this.hold={};this.plan='approach';this.planT=0;this.cmd=mk();this.comboLeft=0;this.atkCd=0;this.strafe=1;this.strafeT=0;this.dodgeCd=0;this.seenAtk=null;this.jumpCd=0;this.wantItem=null;this.dummy=null;this.blockT=0;this.rollT=0;this.heavyHold=0}
 setLevel(l){this.level=l;this.lv=LV[U.clamp(l,0,3)]}
 // edge check: is there ground ahead?
 groundAhead(f,game,dx,dist=70){const x=f.P[0].x+dx*dist,A=game.arena;const s=P.supportAt(A,x,f.root.y+f.footOff-20,60);return s}
 hazardAt(game,x,y){for(const h of game.arena.hazards)if(x>h.x&&x<h.x+h.w&&y>h.y-60)return true;return false}
 weaponReach(f){const w=f.main;if(!w)return 78;const d=w.def;if(['bow','xbow','knives','blaster','magic'].includes(d.style)&&(w.ammo>0||d.regen))return 520;return d.len*(1-d.pivot)+52}
 poll(f,game,dt){
  const lv=this.lv,c=this.cmd;this.t+=dt;
  c.jump=c.light=c.heavy=c.ability=c.throw=c.interact=false;
  this.atkCd-=dt;this.dodgeCd-=dt;this.jumpCd-=dt;this.thinkT-=dt;this.strafeT-=dt;
  const e=game.nearestEnemy(f,true);
  if(this.dummy)return this.dummyPoll(f,game,dt,e);
  if(!e){c.x=0;c.block=false;return c}
  const dx=e.P[0].x-f.P[0].x,dy=e.P[0].y-f.P[0].y,adx=Math.abs(dx),sx=U.sign(dx);
  const reach=this.weaponReach(f),ranged=reach>300;
  const eReach=e.main?(ranged?300:e.main.def.len+50):78;
  // release timed holds
  if(this.blockT>0){this.blockT-=dt;c.block=true;if(this.blockT<=0)c.block=false}
  if(this.heavyHold>0){this.heavyHold-=dt;c.heavyHeld=true;if(this.heavyHold<=0)c.heavyHeld=false}
  c.down=false;
  // ---- reactions (latency modelled by react time) ----
  if(this.thinkT<=0){
   this.thinkT=lv.react*U.rand(0.7,1.3);
   this.react(f,e,game,dx,adx,sx,reach,eReach);
  }
  // ---- movement ----
  let want=0;
  switch(this.plan){
   case 'approach':want=sx;if(adx<reach*0.8)want=0;if(ranged&&adx<260)want=-sx;break;
   case 'retreat':want=-sx;break;
   case 'strafe':want=this.strafe;break;
   case 'item':{const it=this.wantItem;if(it&&game.items.list.includes(it)){const ix=it.rigid.x-f.P[0].x;want=Math.abs(ix)>40?U.sign(ix):0;if(Math.abs(ix)<=70&&Math.abs(it.rigid.y-f.P[0].y)<120){c.interact=true;this.plan='approach';this.wantItem=null}else if(it.rigid.y<f.P[0].y-110&&this.jumpCd<=0&&f.grounded){c.jump=true;c.jumpHeld=true;this.jumpCd=0.8}}else this.plan='approach';break}
   case 'defend':want=0;break;
   case 'wait':want=adx>reach+60?sx*0.5:0;break;
  }
  // stay stationary for ranged weapons when in range, keep distance
  // edges and hazards
  if(want!==0){
   const g=this.groundAhead(f,game,want,60);const hz=this.hazardAt(game,f.P[0].x+want*60,f.root.y+f.footOff+10);
   if(!g||hz){
    // gap: jump if landing exists beyond and we want to chase, else stop
    const far=this.groundAhead(f,game,want,230);
    if(far&&!hz&&f.grounded&&this.jumpCd<=0&&Math.random()<lv.hazard+0.05&&this.plan!=='retreat'){c.jump=true;c.jumpHeld=true;this.jumpCd=0.7}
    else if(Math.random()<lv.hazard)want=0}}
  // jump to reach higher enemy / platform; jump over low obstacles
  if(f.grounded&&this.jumpCd<=0){
   if(dy<-110&&adx<260&&Math.random()<0.04+lv.aggr*0.04){c.jump=true;c.jumpHeld=true;this.jumpCd=0.9}
   const blocked=want!==0&&game.arena.solids.some(R=>R.active&&!R.oneway&&R.y<f.root.y+f.footOff-8&&R.y>f.root.y-80&&f.P[0].x+want*40>R.x&&f.P[0].x+want*40<R.x+R.w&&R.h>0&&R.y+R.h>f.root.y);
   if(blocked){c.jump=true;c.jumpHeld=true;this.jumpCd=0.7}
  }
  c.jumpHeld=c.jumpHeld&&!f.grounded||c.jump;
  // incoming projectiles
  for(const p of game.proj.list){if(p.team===f.team||p.stuck)continue;const tx=(f.P[1].x-p.x)/(p.vx||1e-3);if(tx>0&&tx<0.35&&Math.abs(p.y+p.vy*tx-f.P[1].y)<60&&this.dodgeCd<=0&&Math.random()<lv.block+0.2){if(Math.random()<0.5&&f.grounded&&this.jumpCd<=0){c.jump=true;c.jumpHeld=true;this.jumpCd=0.6}else{this.blockT=0.35}this.dodgeCd=0.5}}
  c.x=want;
  // ---- attacks ----
  if(this.atkCd<=0&&f.state==='free'&&!this.blockT){
   const inRange=adx<reach&&Math.abs(dy)<(ranged?200:130);
   const wantAtk=inRange&&Math.random()<lv.aggr*(dt*60)*0.12+0.02;
   if(wantAtk&&this.plan!=='retreat'){
    if(ranged){ // keep distance; shoot
      c.light=true;this.atkCd=lv.wait*0.8+0.3;if(lv.combo>2&&Math.random()<0.25){c.heavy=true;this.heavyHold=0.35;c.heavyHeld=true;c.light=false}}
    else{
     const roll=Math.random();
     if(roll<0.25*lv.aggr&&lv.combo>=2&&f.stamina>25){c.heavy=true;this.heavyHold=lv.combo>=3?0.25:0;c.heavyHeld=this.heavyHold>0;this.atkCd=lv.wait+0.5}
     else{c.light=true;this.comboLeft=Math.min(lv.combo-1,Math.floor(Math.random()*lv.combo));this.atkCd=0.22;this.comboCd=true}}}
  }
  else if(f.state==='atk'&&this.comboLeft>0&&f.moveT>(f.move.cancel||f.move.dur*0.6)-0.03&&f.hitActive===false){c.light=true;this.comboLeft--;if(this.comboLeft===0&&lv.combo>=3&&Math.random()<0.5){c.light=false;c.heavy=true}}
  // ability
  if(f.state==='free'&&f.energy>=30&&Math.random()<lv.ability*0.02&&adx<650){const ab=f.def.ab;let slot=!f.grounded?'a':'n';if(f.grounded&&adx>200&&Math.random()<0.5)slot='f';if(f.energy>=100&&f.grounded&&Math.random()<0.7&&lv.combo>=2){slot='u'}
   c.ability=true;c.down=slot==='u';c.x=slot==='f'?sx:(slot==='n'?0:c.x)}
  // item pickup
  if(f.state==='free'&&game.cfg&&game.cfg.pickups!==false&&this.plan!=='item'&&(!f.main||game.time%7<0.03)&&Math.random()<lv.pickup*0.03){const it=game.items.nearest({P:[{x:f.P[0].x,y:f.P[0].y}]},520);if(it&&(!f.main||(it.def.slot==='off'&&!f.off))){if(Math.abs(it.rigid.y-f.P[0].y)<260){this.plan='item';this.wantItem=it;this.planT=3}}}
  if(this.plan==='item'){this.planT-=dt;if(this.planT<=0)this.plan='approach'}
  // throw weapon when out of ammo / lucky
  if(f.main&&f.main.def.ammo&&f.main.ammo<=0&&!f.main.def.regen&&Math.random()<0.02)c.throw=true;
  return c}
 react(f,e,game,dx,adx,sx,reach,eReach){
  const lv=this.lv,c=this.cmd;
  // enemy attack tells
  const ea=e.state==='atk'&&e.move&&!e.move.noMelee;
  if(ea&&adx<eReach+40&&Math.abs(e.facing||0)>=0&&e.face===-sx&&f.state==='free'){
   const toActive=e.move.active[0]-e.moveT;
   if(toActive<0.35&&toActive>-0.05){
    const r=Math.random();
    if(f.grounded&&r<lv.parry&&toActive<0.2){this.blockT=0;c.block=false;this.pressBlock=true;this.blockT=0.25;this.parryNow=true}
    else if(r<lv.block){this.blockT=0.3+Math.random()*0.2;this.plan='defend';this.planT=0.3}
    else if(r<lv.block+lv.dodge&&this.dodgeCd<=0&&f.stamina>15){c.down=true;this.rollT=0.1;this.dodgeCd=1;this.plan='retreat';this.planT=0.3;this.cmd.x=-sx}
    this.thinkT=0.12;return}}
  // punish recovery
  if(lv.combo>=3&&e.state==='atk'&&e.moveT>e.move.active[1]&&adx<reach+10&&this.atkCd<=0){this.cmd.light=true;this.atkCd=0.4}
  // choose plan
  this.planT-=this.lv.react;
  const hpLow=f.hp/f.maxHp<0.3;
  if(f.stamina<20&&adx<reach*1.5){this.plan='retreat';this.planT=0.7}
  else if(this.plan==='item')return;
  else{const r=Math.random();
   if(adx>reach*0.9)this.plan=r<0.85?'approach':'strafe';
   else{if(r<lv.aggr*0.5)this.plan='approach';else if(r<lv.aggr*0.5+0.2)this.plan='strafe';else if(r<0.9)this.plan=lv.combo>=3&&adx<reach*0.5?'retreat':'wait';else this.plan='retreat';if(hpLow&&r<0.4)this.plan='retreat'}
   if(this.plan==='strafe'&&this.strafeT<=0){this.strafe=Math.random()<0.5?-1:1;this.strafeT=0.8}
   if(f.main&&['bow','xbow','knives','blaster','magic'].includes(f.main.def.style)){this.plan=adx<250?'retreat':'wait'}}
 }
 dummyPoll(f,game,dt,e){const c=this.cmd,b=this.dummy;c.x=0;c.block=false;c.down=false;
  switch(b.mode){
   case 'block':c.block=true;break;
   case 'crouch':c.down=true;break;
   case 'jump':if(f.grounded&&Math.random()<0.02){c.jump=true;c.jumpHeld=true}break;
   case 'walk':this.strafeT<=0&&(this.strafe=Math.random()<0.5?-1:1,this.strafeT=1.2);c.x=this.strafe;break;
   case 'attack':if(e&&f.state==='free'&&this.atkCd<=0){const dx=e.P[0].x-f.P[0].x;if(Math.abs(dx)>80)c.x=U.sign(dx);else{c.light=true;this.atkCd=0.8}}break;
   case 'bot':{const lvB=this.lv;this.dummy=null;const r=this.poll(f,game,dt);this.dummy=b;return r}
  }return c}
}
SD.BotController=BotController;
})(window.SD);
