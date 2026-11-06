'use strict';
// Character abilities: neutral / forward / air / ultimate slots per fighter.
(function(SD){
const U=SD.U,P=SD.Phys;
const AB={ // timing table: at = cast moment, dur = total
 surge:{at:0.15,dur:0.4,anim:'raise'},estrike:{at:0.22,dur:0.5,anim:'blast'},skystrike:{at:0.05,dur:0.35,anim:'dash'},secondform:{at:0.5,dur:0.9,anim:'raise',invuln:0.9},
 ki:{at:0.2,dur:0.45,anim:'blast'},empower:{at:0.25,dur:0.5,anim:'raise'},firerain:{at:0.15,dur:0.45,anim:'raise'},inferno:{at:0.6,dur:1.1,anim:'hold',hold:1,invuln:1.1},
 darkorb:{at:0.3,dur:0.55,anim:'blast'},frenzy:{at:0.25,dur:0.5,anim:'raise'},shadowvolley:{at:0.15,dur:0.45,anim:'raise'},annihilate:{at:0.9,dur:1.5,anim:'hold',hold:1,invuln:1.5},
 mine:{at:0.2,dur:0.45,anim:'slam'},wall:{at:0.2,dur:0.5,anim:'slam'},net:{at:0.15,dur:0.4,anim:'blast'},minefield:{at:0.35,dur:0.8,anim:'raise',invuln:0.8},
 wolf:{at:0.2,dur:0.45,anim:'blast'},rage:{at:0.25,dur:0.5,anim:'raise'},eagle:{at:0.15,dur:0.4,anim:'raise'},stampede:{at:0.4,dur:0.9,anim:'raise',invuln:0.9},
 potion:{at:0.2,dur:0.45,anim:'blast'},swift:{at:0.2,dur:0.4,anim:'raise'},splash:{at:0.15,dur:0.4,anim:'raise'},elixir:{at:0.35,dur:0.8,anim:'raise',invuln:0.8},
 soundwave:{at:0.2,dur:0.5,anim:'blast'},rhythm:{at:0.2,dur:0.45,anim:'raise'},bassdrop:{at:0.05,dur:0.35,anim:'dash'},concert:{at:0.4,dur:0.9,anim:'raise',invuln:0.9},
 turret:{at:0.2,dur:0.5,anim:'slam'},laser:{at:0.2,dur:0.45,anim:'blast'},drone:{at:0.15,dur:0.4,anim:'raise'},orbital:{at:0.35,dur:0.8,anim:'raise'},
 blink:{at:0.05,dur:0.3,anim:'dash'},dashslash:{at:0.1,dur:0.4,anim:'dash'},airdash:{at:0.05,dur:0.3,anim:'dash'},flurry:{at:0.25,dur:0.9,anim:'spin',invuln:0.9},
 slam:{at:0.3,dur:0.6,anim:'slam'},ironwill:{at:0.25,dur:0.5,anim:'raise'},meteor:{at:0.05,dur:0.4,anim:'dash'},royalbeam:{at:0.8,dur:1.4,anim:'hold',hold:1,invuln:1.4}
};
const A=SD.Abilities={AB};
A.tryCast=(f,game)=>{
 const d=f.def.ab;if(!d||f.stun>0)return false;const inp=f.in;
 let key;if(!f.grounded)key='a';else if(inp.down)key='u';else if(inp.x*f.face>0)key='f';else key='n';
 const ab=d[key];if(!ab)return false;
 if(f.energy<ab.cost||(f.cd[ab.id]||0)>0){if(!f.abMsgT||f.abMsgT<game.time){f.abMsgT=game.time+0.6;game.particles.text(f.P[2].x,f.P[2].y-34,f.energy<ab.cost?'ENERGY':'COOLDOWN','#aaa',13,0.6);game.audio.play('click')}return false}
 f.energy-=ab.cost;f.cd[ab.id]=ab.cd;
 const t=AB[ab.id];f.startCast(Object.assign({},ab,t),key);
 game.particles.ring(f.P[1].x,f.P[1].y,50,f.color,0.3,3);game.audio.play('ability',key==='u'?0.7:1);
 return true};
A.run=(f,game,ab)=>{const fn=FN[ab.id];if(fn)fn(f,game,ab)};
const D=(f,v)=>v*f.dmgMult;
function enemy(f,game){return game.nearestEnemy(f)}
function groundY(game,x,y0){const s=P.supportAt(game.arena,x,y0,0);return s?s.y:game.arena.gy}
function hand(f){return f.P[6]}
function orb(f,game,o){return game.proj.spawn(Object.assign({owner:f,type:'orb',x:hand(f).x,y:hand(f).y,dirx:f.face,diry:0},o))}
function dive(f,game,o){f.root.vy=o.vy||1000;f.root.vx=f.face*(o.vx||400);f.root.ground=null;let t=1.2;f.invuln=Math.max(f.invuln,0.15);
 f.hooks.push((ff,dt,g)=>{t-=dt;ff.root.vy=Math.max(ff.root.vy,o.vy||1000);if(g.quality!=='low')g.particles.add({type:'smoke',x:ff.P[0].x,y:ff.P[0].y,life:0.25,size:8,color:o.col||'#fff',drag:0.9});
  if(ff.root.ground||t<=0||ff.w<0.15){if(ff.root.ground){const x=ff.root.x,y=ff.root.y+ff.footOff;g.particles.ring(x,y,o.r,o.col||'#fff',0.35,6);g.particles.dust(x,y,10);g.shake(8);g.audio.play('hitheavy');g.hitstop(0.06);g.combat.areaDamage(x,y-10,o.r,o.dmg,ff,{kb:[o.kb||450,-500],noSelf:true,src:'dive',color:o.col});const sup=ff.root.ground;if(sup&&(sup.destructible||sup.crate||sup.crumble))g.arena.damageRect(sup,o.dmg*2,x,y,ff)}return true}return false})}
function mine(f,game,x,y,dmg){game.proj.zone({kind:'mine',owner:f,x,y,r:55,t:25,dmg})}
function runner(f,game,sprite,o){return game.proj.spawn(Object.assign({owner:f,type:'orb',sprite,ground:1,h:2,x:f.P[0].x+f.face*40,y:f.root.y+f.footOff,gy:f.root.y+f.footOff,dirx:f.face,diry:0,spd:700,r:20,dmg:D(f,10),kb:[380,-240],life:1.5,pierce:0,glow:0},o))}
const FN={
 // Second Coming
 surge:(f,g)=>{f.setFx('haste',6);f.root.vx=f.face*600;g.particles.sparks(f.P[1].x,f.P[1].y,16,'#ff9a30',400,0.5)},
 estrike:(f,g)=>{orb(f,g,{spd:1150,r:17,col:'#ff9a30',dmg:D(f,17),kb:[720,-260],life:0.9,explodeR:60,trail:1,pierce:0});f.root.vx=f.face*300},
 skystrike:(f,g)=>dive(f,g,{vy:1100,vx:500,r:100,dmg:D(f,15),col:'#ff9a30'}),
 secondform:(f,g)=>{f.setFx('form',9);g.particles.ring(f.P[1].x,f.P[1].y,200,'#ff9a30',0.5,8);g.particles.sparks(f.P[1].x,f.P[1].y,30,'#ffd24a',500,0.6);g.shake(6)},
 // Chosen One
 ki:(f,g)=>orb(f,g,{spd:1300,r:13,col:'#8ff',dmg:D(f,12),kb:[450,-130],life:1,explodeR:50,trail:1}),
 empower:(f,g)=>{f.setFx('empower',7);g.particles.ring(f.P[1].x,f.P[1].y,90,'#ffd24a',0.4,5)},
 firerain:(f,g)=>{for(let i=0;i<3;i++)orb(f,g,{dirx:f.face*(0.35+i*0.25),diry:1,spd:850,r:11,col:'#ff7a22',dmg:D(f,8),kb:[300,-200],eff:'burn',life:1.2,explodeR:55,trail:1})},
 inferno:(f,g)=>{g.particles.ring(f.P[1].x,f.P[1].y,260,'#ff7a22',0.6,10);g.particles.glow(f.P[1].x,f.P[1].y,240,'#ff7a22',0.5);g.particles.sparks(f.P[1].x,f.P[1].y,40,'#ffaa33',700,0.8,5);g.shake(12);g.audio.play('explode');g.combat.areaDamage(f.P[1].x,f.P[1].y,260,D(f,26),f,{kb:[800,-600],noSelf:true,eff:'burn',src:'inferno',color:'#fa4'});f.setFx('empower',5)},
 // Dark Lord
 darkorb:(f,g)=>orb(f,g,{spd:650,r:20,col:'#a0f',dmg:D(f,14),kb:[500,-150],eff:'pull',life:1.6,explodeR:70,trail:1}),
 frenzy:(f,g)=>{f.setFx('frenzy',6);g.particles.ring(f.P[1].x,f.P[1].y,100,'#f22',0.4,6)},
 shadowvolley:(f,g)=>{for(let i=0;i<3;i++)orb(f,g,{dirx:f.face*(0.4+i*0.35),diry:1,spd:900,r:12,col:'#c0f',dmg:D(f,9),kb:[300,-150],life:1.1,trail:1})},
 annihilate:(f,g)=>{const h=hand(f);g.proj.beam(f,f.P[1].x,f.P[1].y-4,f.face>0?0:Math.PI,1500,80,D(f,20),0.55,'#ff2266',{kb:[700,-300],follow:true,every:0.2});g.shake(10);g.audio.play('explode',0.8)},
 // Victim
 mine:(f,g)=>mine(f,g,f.P[0].x+f.face*70,f.root.y+f.footOff,D(f,14)),
 wall:(f,g)=>{const x=f.P[0].x+f.face*110,gy=groundY(g,x,f.root.y);const R={x:x-18,y:gy-140,w:36,h:140,active:true,type:'wall',fric:1,destructible:true,hp:60,maxhp:60,tmp:true};g.arena.solids.push(R);g.proj.after(5,()=>{if(R.active){R.active=false;g.particles.debris(R.x,R.y,R.w,R.h,'#777',10)}});g.particles.dust(x,gy,10);g.audio.play('break',0.7)},
 net:(f,g)=>orb(f,g,{sprite:'net',spd:800,r:16,col:'#ddd',dmg:D(f,4),kb:[100,-50],eff:'net',life:1,g:500}),
 minefield:(f,g)=>{const e=enemy(f,g);const bx=e?e.P[0].x:f.P[0].x+f.face*300;for(let k=-2;k<=2;k++){const x=U.clamp(bx+k*95,60,g.arena.W-60);mine(f,g,x,groundY(g,x,0),D(f,13))}g.audio.play('break',0.8)},
 // Red
 wolf:(f,g)=>runner(f,g,'wolf',{}),
 rage:(f,g)=>{f.setFx('rage',6);g.particles.ring(f.P[1].x,f.P[1].y,100,'#f44',0.4,6)},
 eagle:(f,g)=>{const e=enemy(f,g);const x=e?e.P[0].x:f.P[0].x+f.face*300;g.proj.spawn({owner:f,type:'orb',sprite:'eagle',x:x+U.rand(-30,30),y:Math.min(f.root.y-380,100),dirx:0,diry:1,spd:1100,r:18,dmg:D(f,13),kb:[150,-420],life:1.4,explodeR:50,col:'#d9b28a'});g.audio.play('swing',1.6)},
 stampede:(f,g)=>{for(let i=0;i<3;i++)g.proj.after(i*0.22,()=>{if(f.alive)runner(f,g,i===1?'boar':'wolf',{dmg:D(f,9),spd:760+i*40})})},
 // Blue
 potion:(f,g)=>{const eff=U.pick(['slow','poison','lev','heal']);throwPotion(f,g,eff,f.face*560,-520)},
 swift:(f,g)=>{f.setFx('swift',6);g.particles.ring(f.P[1].x,f.P[1].y,80,'#6ff',0.4,5)},
 splash:(f,g)=>{throwPotion(f,g,U.pick(['slow','poison','lev']),f.face*300,200);throwPotion(f,g,U.pick(['slow','poison','lev']),f.face*520,100)},
 elixir:(f,g)=>{f.hp=Math.min(f.maxHp,f.hp+f.maxHp*0.3);f.setFx('power',8);f.setFx('regen',6);g.particles.text(f.P[2].x,f.P[2].y-30,'+'+Math.round(f.maxHp*0.3),'#6f6',22);g.particles.ring(f.P[1].x,f.P[1].y,120,'#6f6',0.5,6)},
 // Green
 soundwave:(f,g)=>{for(let i=-1;i<=1;i++)g.proj.after(Math.abs(i)*0.09+0.0,()=>{if(f.alive)g.proj.spawn({owner:f,type:'orb',note:1,x:f.P[6].x,y:f.P[6].y,dirx:f.face,diry:i*0.18,spd:950,r:14,col:'#7f7',dmg:D(f,5),kb:[220,-70],life:0.9,glow:0})})},
 rhythm:(f,g)=>{f.setFx('rhythm',6);g.particles.ring(f.P[1].x,f.P[1].y,90,'#7f7',0.4,5)},
 bassdrop:(f,g)=>dive(f,g,{vy:1050,vx:100,r:150,dmg:D(f,14),col:'#7f7',kb:520}),
 concert:(f,g)=>{g.proj.zone({kind:'pulse',owner:f,follow:true,x:f.P[1].x,y:f.P[1].y,r:240,t:5,dmg:D(f,8),col:'#7f7'})},
 // Yellow
 turret:(f,g)=>{const x=f.P[0].x+f.face*60;g.proj.zone({kind:'turret',owner:f,x,y:groundY(g,x,f.root.y),t:8,dmg:D(f,4),ang:f.face>0?0:Math.PI});g.audio.play('break',0.6)},
 laser:(f,g)=>{const a=SD.Weapons.aim(f,hand(f));g.proj.beam(f,hand(f).x,hand(f).y,a,950,14,D(f,13),0.15,'#ffe040',{every:0.1,kb:[300,-100]});g.audio.play('zap')},
 drone:(f,g)=>{for(let i=-1;i<=1;i++)g.proj.after((i+1)*0.12,()=>{if(f.alive)g.proj.spawn({owner:f,type:'orb',sprite:'bomb',x:f.P[1].x+f.face*i*50+f.face*30,y:f.P[1].y-20,dirx:f.face*0.3,diry:1,spd:600,g:900,r:10,dmg:D(f,10),kb:[300,-350],life:2,explodeR:75,col:'#ffd34a'})})},
 orbital:(f,g)=>{const e=enemy(f,g);const x=e?e.P[0].x:f.P[0].x+f.face*300;g.proj.zone({kind:'warn',owner:f,x,t:0.8,width:90,col:'rgba(255,230,60,0.6)',onEnd:()=>{g.proj.beam(f,x,-50,Math.PI/2,1200,90,D(f,35),0.35,'#ffe040',{kb:[0,-500],every:0.3,nodestroy:false});g.audio.play('explode',0.8);g.shake(10)}})},
 // Purple
 blink:(f,g)=>{const e=enemy(f,g);g.particles.ring(f.P[0].x,f.P[0].y,50,'#d92fd0',0.3,4);f.invuln=Math.max(f.invuln,0.3);
  if(e){const s=U.sign(e.P[0].x-f.P[0].x);f.root.x=U.clamp(e.P[0].x+s*70,30,g.arena.W-30);f.root.y=e.root.y;f.root.vy=0;f.face=-s;f.root.vx=0}else f.root.x=U.clamp(f.root.x+f.face*320,30,g.arena.W-30);
  g.particles.ring(f.root.x,f.root.y,50,'#d92fd0',0.3,4);g.particles.sparks(f.root.x,f.root.y,16,'#d92fd0',350,0.4);f.buf.light=0.4},
 dashslash:(f,g)=>{f.root.vx=f.face*900;f.invuln=Math.max(f.invuln,0.3);let t=0.3,done=new Set();f.hooks.push((ff,dt,gg)=>{t-=dt;ff.root.vx=ff.face*900;if(gg.quality!=='low')gg.particles.add({type:'smoke',x:ff.P[1].x,y:ff.P[1].y,life:0.3,size:9,color:'#d92fd0',drag:0.9});
  for(const e of gg.fighters){if(!e.alive||e.team===ff.team||done.has(e.id))continue;if(Math.hypot(e.P[1].x-ff.P[1].x,e.P[1].y-ff.P[1].y)<70){done.add(e.id);gg.combat.direct(e,ff,D(ff,13),ff.face*420,-300,{src:'dash',color:'#d92fd0'});gg.particles.slash(e.P[1].x,e.P[1].y,0.6,50,'#fff');gg.audio.play('blade');gg.hitstop(0.05)}}
  return t<=0}) },
 airdash:(f,g)=>{f.root.vx=f.face*950;f.root.vy=0;f.jumps=0;f.invuln=Math.max(f.invuln,0.2);let t=0.22;f.hooks.push((ff)=>{t-=1/60;ff.root.vy=Math.min(ff.root.vy,0);return t<=0});g.particles.ring(f.P[1].x,f.P[1].y,40,'#d92fd0',0.25,3)},
 flurry:(f,g)=>{const e=enemy(f,g);if(!e||Math.hypot(e.P[0].x-f.P[0].x,e.P[0].y-f.P[0].y)>420){f.root.vx=f.face*700;return}
  const s=U.sign(e.P[0].x-f.P[0].x);f.root.x=e.P[0].x-s*55;f.face=s;f.root.vy=-200;f.root.ground=null;let n=0,t=0;
  f.hooks.push((ff,dt,gg)=>{t-=dt;ff.root.vy=Math.min(ff.root.vy,60);ff.invuln=0.2;ff.root.vx=0;if(t<=0&&n<8){t=0.075;n++;if(e.alive){gg.particles.slash(e.P[1].x+U.rand(-20,20),e.P[1].y+U.rand(-20,20),U.rand(0,3),40,'#f6f');gg.audio.play('hit',1+n*0.04);const last=n===8;gg.combat.direct(e,ff,D(ff,last?8:3.5),ff.face*(last?250:20),last?-760:-30,{src:'flurry',color:'#f6f'});gg.shake(2)}}return n>=8});},
 // King Orange
 slam:(f,g)=>{const x=f.root.x,y=f.root.y+f.footOff;g.particles.ring(x,y,190,'#fccd03',0.4,8);g.particles.dust(x,y,14);g.shake(10);g.audio.play('hitheavy');g.combat.areaDamage(x,y-10,190,D(f,14),f,{kb:[460,-480],noSelf:true,src:'slam',color:'#fc4'});const s=f.root.ground;if(s&&(s.destructible||s.crate||s.crumble))g.arena.damageRect(s,D(f,28),x,y,f)},
 ironwill:(f,g)=>{f.setFx('iron',5);f.poise=100;g.particles.ring(f.P[1].x,f.P[1].y,90,'#fccd03',0.4,6)},
 meteor:(f,g)=>dive(f,g,{vy:1250,vx:150,r:170,dmg:D(f,20),col:'#fccd03',kb:600}),
 royalbeam:(f,g)=>{g.proj.beam(f,f.P[1].x,f.P[1].y-4,f.face>0?0:Math.PI,1500,90,D(f,19),0.5,'#fccd03',{kb:[800,-300],follow:true,every:0.22});g.shake(10);g.audio.play('explode',0.8)}
};
function throwPotion(f,g,eff,vx,vy){const cols={slow:'#6cf',poison:'#7c3',lev:'#fcf',heal:'#6f6'};
 const p=g.proj.spawn({owner:f,type:'orb',sprite:'potion',x:f.P[6].x,y:f.P[6].y,vx:vx,vy:vy,spd:Math.hypot(vx,vy),r:10,col:cols[eff],dmg:D(f,3),kb:[80,-50],life:2,g:1400,glow:0,noExpl:true,pot:eff});
 p.onLand=1}
// potions create a cloud when they hit something or run out
const origUpdate=SD.Projectiles.prototype.update;
SD.Projectiles.prototype.update=function(dt){
 const before=this.list.filter(p=>p.pot);origUpdate.call(this,dt);
 for(const p of before){if(!this.list.includes(p)&&!p.cloudDone){p.cloudDone=true;this.zone({kind:'cloud',owner:p.owner,x:p.x,y:p.y-10,r:95,t:4,eff:p.pot,col:p.col});this.game.audio.play('break',0.7);this.game.particles.ring(p.x,p.y,70,p.col,0.3,3)}}
};
})(window.SD);
