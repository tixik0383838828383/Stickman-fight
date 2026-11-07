'use strict';
// ArenaManager: 12 arenas, platforms, hazards, destructibles, explosive crates, movers, backgrounds.
(function(SD){
const U=SD.U;
const W=1500,H=844,GY=690;
const R=(x,y,w,h,o)=>Object.assign({x,y,w,h,active:true,oneway:false,type:'stone',fric:1},o||{});
const OW=(x,y,w,o)=>R(x,y,w,14,Object.assign({oneway:true},o||{}));
const DEF={};
function arena(id,name,o){DEF[id]=Object.assign({id,name,W,H,killY:1100,gy:GY,pal:{},friction:1,desc:''},o)}

arena('training','Тренировочная площадка',{desc:'Ровная площадка с сеткой.',pal:{sky1:'#2a3550',sky2:'#506a8a',solid:'#6b7684',top:'#9aa6b6',line:'#555f6c'},
 build(a){a.solids.push(R(0,GY,W,300,{type:'concrete'}),OW(260,540,260),OW(980,540,260));a.spawns=[330,1170,500,1000,700,800];}});
arena('stadium','Футбольный стадион',{desc:'Ровное поле, ворота и стены. Режим «Футбол».',pal:{sky1:'#14304a',sky2:'#4a86b0',solid:'#2e7a3a',top:'#58b04a',line:'#1f5a2a'},
 build(a){a.solids.push(R(0,GY,W,300,{type:'grass'}),R(-60,-600,60,1400,{type:'concrete'}),R(W,-600,60,1400,{type:'concrete'}));a.spawns=[420,1080,330,1170,250,1250]}});
arena('stone','Каменная арена',{desc:'Колонны, факелы и разрушаемые стены.',pal:{sky1:'#1d1a24',sky2:'#3b3040',solid:'#6f6a66',top:'#9a948c',line:'#4a4642'},
 build(a){a.solids.push(R(0,GY,W,300,{type:'stone'}),OW(120,540,240),OW(1140,540,240),OW(560,430,380));
  a.solids.push(R(730,GY-130,40,130,{type:'wall',destructible:true,hp:90,maxhp:90}));a.spawns=[300,1200,450,1050,600,900];a.crate(420,GY-44,false,true);a.crate(1040,GY-44,false,true)}});
arena('minecraft','Minecraft-платформа',{desc:'Блочный остров с TNT.',pal:{sky1:'#6fb3ff',sky2:'#bfe3ff',solid:'#7a5230',top:'#5aa63a',line:'#5a3a20'},
 build(a){a.solids.push(R(0,GY,W,300,{type:'grass'}),R(300,GY-60,60,60,{type:'grass'}),R(1140,GY-60,60,60,{type:'grass'}),OW(430,520,180,{type:'wood'}),OW(890,520,180,{type:'wood'}),R(660,430,180,40,{type:'grass'}));
  a.solids.push(R(740,GY-120,60,120,{type:'dirtwall',destructible:true,hp:70,maxhp:70}));a.spawns=[250,1250,500,1000,420,1080];a.crate(560,GY-44,true);a.crate(940,GY-44,true)}});
arena('forest','Лес',{desc:'Деревья, брёвна и деревянные ящики.',pal:{sky1:'#2e5a3a',sky2:'#8cc08a',solid:'#4a3a26',top:'#3f7a30',line:'#33281a'},
 build(a){a.solids.push(R(0,GY,W,300,{type:'grass'}),OW(200,560,240,{type:'wood'}),OW(1060,560,240,{type:'wood'}),OW(620,450,260,{type:'wood'}),R(700,GY-30,100,30,{type:'wood'}));a.spawns=[300,1200,500,1000,650,850];a.crate(430,GY-44,false,true);a.crate(1090,GY-44,false,true);a.crate(220,516,false,true)}});
arena('cave','Пещера',{desc:'Падающие сталактиты, кристаллы.',pal:{sky1:'#0c0a14',sky2:'#241a38',solid:'#3a3446',top:'#5a5068',line:'#251f30'},
 build(a){a.solids.push(R(0,GY,W,300,{type:'rock'}),R(0,0,60,GY,{type:'rock',vis:false}),OW(230,540,220,{type:'crystal'}),OW(1050,540,220,{type:'crystal'}),OW(610,420,280,{type:'crystal'}));a.spawns=[300,1200,500,1000,650,850];a.fallers=true;a.fallT=4;a.fallKind='stalactite';a.crate(700,GY-44,true)}});
arena('ice','Ледяная арена',{desc:'Скользкий лёд.',friction:0.12,pal:{sky1:'#7fc4e8',sky2:'#e6f6ff',solid:'#9fd4ea',top:'#e8fbff',line:'#6aaecc'},
 build(a){a.solids.push(R(0,GY,W,300,{type:'ice',fric:0.12}),OW(190,550,260,{type:'ice',fric:0.12}),OW(1050,550,260,{type:'ice',fric:0.12}),OW(620,430,260,{type:'ice',fric:0.12}));a.spawns=[300,1200,500,1000,650,850];a.crate(740,GY-44,false,true)}});
arena('lava','Лавовая арена',{desc:'Острова над лавой. Лава жжёт и подбрасывает.',killY:1050,pal:{sky1:'#2a0a08',sky2:'#a8340f',solid:'#3a2a28',top:'#6a4a40',line:'#241816'},
 build(a){a.solids.push(R(80,640,380,60,{type:'basalt'}),R(1040,640,380,60,{type:'basalt'}),R(570,560,360,50,{type:'basalt'}),OW(500,400,500,{type:'basalt'}));
  a.hazards.push({type:'lava',x:0,y:770,w:W,h:200,dps:30});a.spawns=[220,1280,650,850,300,1200];a.crate(250,596,false,true);a.crate(1200,596,false,true)}});
arena('sky','Небесные платформы',{desc:'Парящие острова. Падение — вылет.',killY:1000,pal:{sky1:'#4aa0ff',sky2:'#e8f6ff',solid:'#8a8f9a',top:'#7ad06a',line:'#6a707a'},
 build(a){a.solids.push(R(150,630,360,50,{type:'cloudrock'}),R(990,630,360,50,{type:'cloudrock'}),R(570,510,360,40,{type:'cloudrock',oneway:false}),OW(180,380,220),OW(1100,380,220));a.spawns=[280,1220,650,850,300,1200];a.crate(250,586,false,true)}});
arena('future','Футуристическая арена',{desc:'Неон, движущиеся платформы, прыжковые панели.',pal:{sky1:'#0a0620',sky2:'#2a0a50',solid:'#1a1a30',top:'#00e5ff',line:'#7a2aff'},
 build(a){a.solids.push(R(0,GY,W,300,{type:'metal'}),OW(180,540,200,{type:'metal'}),OW(1120,540,200,{type:'metal'}));
  a.solids.push(R(560,420,200,16,{type:'metal',oneway:true,mover:{x0:420,x1:880,y0:420,y1:420,spd:0.5,ph:0}}));
  a.solids.push(R(0,0,10,10,{active:false}));a.pads=[{x:60,y:GY-14,w:80,h:14},{x:1360,y:GY-14,w:80,h:14}];a.spawns=[330,1170,500,1000,650,850];a.crate(740,GY-44,true)}});
arena('bridge','Разрушающийся мост',{desc:'Доски мостa рушатся. Под ним пропасть.',killY:1000,pal:{sky1:'#d8a070',sky2:'#ffe6b8',solid:'#6a4a2a',top:'#8a6a3a',line:'#3a2a18'},
 build(a){a.solids.push(R(0,640,170,300,{type:'rock'}),R(1330,640,170,300,{type:'rock'}));for(let i=0;i<20;i++)a.solids.push(R(170+i*58,640,58,16,{type:'plank',crumble:true,cT:0,state:0}));a.spawns=[260,1240,500,1000,650,850];a.crate(80,596,true)}});
arena('traps','Арена с ловушками',{desc:'Шипы, пилы, падающие блоки.',pal:{sky1:'#1a1a1a',sky2:'#4a2a2a',solid:'#5a5a60',top:'#8a8a90',line:'#2a2a30'},
 build(a){a.solids.push(R(0,GY,420,300,{type:'metal'}),R(520,GY+60,200,300,{type:'metal'}),R(780,GY+60,200,300,{type:'metal'}),R(1080,GY,420,300,{type:'metal'}),R(420,GY,100,300,{type:'metal'}),R(980,GY,100,300,{type:'metal'}));
  a.hazards.push({type:'spikes',x:520,y:GY+30,w:200,h:30,dmg:14},{type:'spikes',x:780,y:GY+30,w:200,h:30,dmg:14});
  a.saws=[{x:200,y:GY-40,x0:100,x1:380,spd:90,dir:1,r:26,hit:{}},{x:1100,y:GY-40,x0:1120,x1:1400,spd:90,dir:-1,r:26,hit:{}}];
  a.solids.push(OW(560,520,380,{type:'metal'}));a.fallers=true;a.fallT=3.5;a.fallKind='block';a.spawns=[250,1250,450,1050,600,900];a.crate(120,GY-44,true);a.crate(1340,GY-44,true)}});
arena('final','Финальная арена',{desc:'Разрушаемый пол над лавой, взрывные ящики.',killY:1000,pal:{sky1:'#1a0010',sky2:'#6a0a2a',solid:'#3a2a3a',top:'#8a5a8a',line:'#1a0a1a'},
 build(a){a.solids.push(R(0,GY,300,300,{type:'obsidian'}),R(1200,GY,300,300,{type:'obsidian'}));
  [300,500,700,900,1100-0].slice(0,4).forEach((x,i)=>a.solids.push(R(300+i*225,GY,225,40,{type:'cracked',destructible:true,hp:130,maxhp:130,floor:true})));
  a.solids.push(OW(560,500,380,{type:'obsidian'}),OW(120,520,200,{type:'obsidian'}),OW(1180,520,200,{type:'obsidian'}));
  a.solids.push(R(180,GY-110,40,110,{type:'wall',destructible:true,hp:80,maxhp:80}),R(1280,GY-110,40,110,{type:'wall',destructible:true,hp:80,maxhp:80}));
  a.hazards.push({type:'lava',x:0,y:900,w:W,h:200,dps:40});a.fallers=true;a.fallT=6;a.fallKind='block';a.spawns=[220,1280,450,1050,650,850];a.crate(60,GY-44,true);a.crate(1396,GY-44,true)}});
SD.ARENAS=DEF;
SD.ARENA_ORDER=['training','stadium','stone','minecraft','forest','cave','ice','lava','sky','future','bridge','traps','final'];

class Arena{
 constructor(id,game,opts={}){this.def=DEF[id];this.id=id;this.game=game;this.W=W;this.H=H;this.killY=this.def.killY;this.gy=GY;this.friction=this.def.friction;this.pal=this.def.pal;
  this.solids=[];this.hazards=[];this.objs=[];this.pads=[];this.saws=[];this.spawns=[];this.fallers=false;this.fallT=5;this.fallTimer=3;this.time=0;this.destruct=opts.destruct!==false;
  this.def.build(this);
  this.solids.forEach(s=>{if(s.mover){s.bx=s.x;s.by=s.y}});
  if(!this.destruct)this.solids.forEach(s=>{if(s.destructible)s.destructible=false});
  this.seed=[];for(let i=0;i<60;i++)this.seed.push(Math.random());
  this.bgState=null;
 }
 crate(x,y,explosive,loot){const r=R(x,y,44,44,{type:explosive?'tnt':'crate',crate:true,hp:explosive?20:25,maxhp:25,explosive,loot:!!loot&&!explosive,vy:0,fric:1});this.solids.push(r);this.objs.push(r)}
 spawnPos(i,n){const xs=this.spawns;return {x:xs[i%xs.length],y:200}}
 randomDropX(){const c=this.solids.filter(s=>s.active&&!s.crate&&s.w>=120&&s.y<this.killY-100&&!s.vis===false);if(!c.length)return {x:W/2,y:-60};const s=U.pick(c);return {x:U.clamp(s.x+U.rand(20,s.w-20),30,W-30),y:-80}}
 // damage destructible rect / crate / crumble plank
 damageRect(Rc,dmg,hx,hy,owner){
  if(!Rc.active)return;
  if(Rc.crumble&&Rc.state===0){Rc.state=1;Rc.cT=0.55}
  if(!(Rc.destructible||Rc.crate))return;
  Rc.hp-=dmg;Rc.flash=0.12;const g=this.game;
  g.particles.debris(hx,hy,4,4,SD.Arena.col(this,Rc),4,150);
  if(Rc.hp<=0)this.breakRect(Rc,owner)
 }
 breakRect(Rc,owner){
  if(!Rc.active)return;Rc.active=false;const g=this.game;
  g.particles.debris(Rc.x,Rc.y,Rc.w,Rc.h,SD.Arena.col(this,Rc),Math.min(30,8+Rc.w*Rc.h/300|0),260);g.audio.play('break');
  if(Rc.explosive){g.combat.explosion(Rc.x+Rc.w/2,Rc.y+Rc.h/2,170,26,owner,'tnt')}
  else if(Rc.loot){g.items.spawn(Rc.x+Rc.w/2,Rc.y,null,{vy:-300})}
  if(Rc.type==='wall'||Rc.type==='dirtwall')g.shake(6);
 }
 nearestGround(x,y){const s=SD.Phys.supportAt(this,x,y-6,0);return s}
 update(dt){
  const g=this.game;this.time+=dt;
  // movers
  for(const s of this.solids){if(!s.active)continue;
   if(s.mover){const m=s.mover;m.ph+=dt*m.spd;const k=(Math.sin(m.ph)+1)/2;const nx=U.lerp(m.x0,m.x1,k),ny=U.lerp(m.y0,m.y1,k);s.vx=(nx-s.x)/dt;s.vy=(ny-s.y)/dt;s.x=nx;s.y=ny}
   if(s.flash>0)s.flash-=dt;
   if(s.crumble){if(s.state===1){s.cT-=dt;if(s.cT<=0){s.state=2;s.vy2=0}}else if(s.state===2){s.vy2+=1600*dt;s.y+=s.vy2*dt;if(s.y>1200)s.active=false;s.oneway=true;s.drop=1}
    else{for(const f of g.fighters)if(f.alive&&f.root.ground===s&&f.state!=='down'){s.cT+=dt;if(s.cT>0.9){s.state=1;s.cT=0.4}}}}
   if(s.crate){ // gravity for crates
    const sup=SD.Phys.supportAt(this,s.x+s.w/2,s.y+s.h,3);let rest=false;
    if(sup&&sup!==s&&sup.y<=s.y+s.h+1&&s.vy>=0&&s.y+s.h>=sup.y-1){s.y=sup.y-s.h;s.vy=0;rest=true}
    if(!rest){s.vy+=1800*dt;s.y+=s.vy*dt;for(const o of this.solids){if(o===s||!o.active||o.oneway&&s.vy<0)continue;if(s.x+s.w>o.x&&s.x<o.x+o.w&&s.y+s.h>o.y&&s.y+s.h-s.vy*dt<=o.y+6&&s.y<o.y){s.y=o.y-s.h;s.vy=0;break}}}
   }}
  // falling hazards
  if(this.fallers&&g.running){this.fallTimer-=dt;if(this.fallTimer<=0){this.fallTimer=this.fallT*U.rand(0.7,1.3);const tg=g.fighters.filter(f=>f.alive);const x=tg.length&&Math.random()<0.6?U.pick(tg).root.x+U.rand(-100,100):U.rand(120,W-120);
    this.objs.push({kind:'fall',x:U.clamp(x,60,W-60),y:-80,state:0,t:0.9,vy:0,type:this.fallKind,w:this.fallKind==='stalactite'?40:64,h:this.fallKind==='stalactite'?90:64})}}
  for(let i=this.objs.length-1;i>=0;i--){const o=this.objs[i];if(o.crate){if(!o.active)this.objs.splice(i,1);continue}
   if(o.kind==='fall'){
    if(o.state===0){o.t-=dt;o.y=-80;if(o.t<=0){o.state=1}}
    else if(o.state===1){o.vy=Math.min(1500,o.vy+2600*dt);const oy=o.y;o.y+=o.vy*dt;
     for(const f of g.fighters){if(!f.alive||f.invuln>0)continue;const p=f.P[1],q=f.P[2];for(const pt of [p,q,f.P[0]]){if(Math.abs(pt.x-o.x)<o.w/2+6&&pt.y>o.y-o.h/2&&pt.y<o.y+o.h/2+10){g.combat.hazardHit(f,{dmg:18,kx:Math.sign(pt.x-o.x||1)*300,ky:-250,src:'block'},pt.x,pt.y);o.state=2;o.t=0;break}}if(o.state===2)break}
     if(o.state===1){for(const s of this.solids){if(!s.active||s.oneway||s.crate&&false)continue;if(o.x>s.x&&o.x<s.x+s.w&&o.y+o.h/2>=s.y&&oy+o.h/2<=s.y+8){o.y=s.y-o.h/2;o.state=2;o.t=0;if(s.destructible||s.crate)this.damageRect(s,30,o.x,s.y,null);break}}}
     if(o.state===2){g.particles.debris(o.x-o.w/2,o.y,o.w,o.h/2,o.type==='block'?'#888':'#8a8090',10,260);g.audio.play('break');g.shake(5);g.particles.dust(o.x,o.y+o.h/2,6)}
     if(o.y>this.killY+100)this.objs.splice(i,1)}
    else if(o.state===2){this.objs.splice(i,1)}
   }}
  // saws
  for(const s of this.saws){s.x+=s.dir*s.spd*dt;if(s.x<s.x0||s.x>s.x1)s.dir*=-1;s.rot=(s.rot||0)+dt*14;
   for(const f of g.fighters){if(!f.alive||f.invuln>0)continue;for(const pt of [f.P[0],f.P[1],f.P[4],f.P[6],f.P[8],f.P[10]]){if(Math.hypot(pt.x-s.x,pt.y-s.y)<s.r+4){if(!(s.hit[f.id]>g.time)){s.hit[f.id]=g.time+0.6;g.combat.hazardHit(f,{dmg:9,kx:Math.sign(pt.x-s.x||1)*350,ky:-300,src:'saw'},pt.x,pt.y,true)}}}}}
  // hazards (lava / spikes)
  for(const hz of this.hazards){for(const f of g.fighters){if(!f.alive)continue;let inside=false,pt=f.P[0];
    for(const q of [f.P[0],f.P[8],f.P[10],f.P[1]]){if(q.x>hz.x&&q.x<hz.x+hz.w&&q.y>hz.y&&q.y<hz.y+hz.h){inside=true;pt=q;break}}
    if(!inside)continue;
    if(hz.type==='lava'){f.fx.burn=Math.max(f.fx.burn||0,2.5);if(!(f.lavaT>g.time)){f.lavaT=g.time+0.45;g.combat.hazardHit(f,{dmg:hz.dps*0.45,kx:U.rand(-200,200),ky:-950,src:'lava'},pt.x,pt.y,true);g.particles.sparks(pt.x,hz.y,14,'#ff8a22',380,0.7,4)}}
    else if(hz.type==='spikes'){if(!(f.spikeT>g.time)){f.spikeT=g.time+0.5;g.combat.hazardHit(f,{dmg:hz.dmg,kx:U.rand(-150,150),ky:-650,src:'spikes'},pt.x,pt.y,true)}}}}
  // jump pads
  for(const pd of this.pads){for(const f of g.fighters){if(!f.alive)continue;const r=f.root;if(f.w>0.15){const fy=r.y+f.footOff;if(r.x>pd.x&&r.x<pd.x+pd.w&&fy>pd.y-4&&fy<pd.y+30&&r.vy>=0){r.vy=-1350;r.ground=null;g.audio.play('jump',1.6);g.particles.ring(r.x,fy,40,'#00e5ff')}}else{const p=f.P[0];if(p.x>pd.x&&p.x<pd.x+pd.w&&p.y>pd.y-30&&p.y<pd.y+40){SD.Phys.impulse(p,0,-1400)}}}}
 }
};
// colour helper per solid type
SD.Arena=Arena;
const TC={stone:['#6f6a66','#9a948c'],concrete:['#5c6672','#8d99a8'],wall:['#807a74','#a8a29a'],grass:['#7a5230','#5aa63a'],dirtwall:['#7a5230','#946a40'],wood:['#8a6030','#a8783c'],crystal:['#4a3a70','#8a6ad0'],rock:['#3a3446','#5a5068'],ice:['#9fd4ea','#e8fbff'],basalt:['#3a2a28','#6a4a40'],cloudrock:['#8a8f9a','#7ad06a'],metal:['#1a1a30','#00e5ff'],plank:['#7a5a2a','#a07a3a'],obsidian:['#2a1a2a','#8a5a8a'],cracked:['#4a3a4a','#9a6a9a'],crate:['#9a7040','#c8a060'],tnt:['#b02a2a','#e04a3a']};
Arena.col=(a,R)=>(TC[R.type]||['#777','#aaa'])[0];
Arena.TC=TC;
// ------------- drawing -------------
Arena.prototype.drawSolids=function(ctx,t){
 const q=this.game.quality;
 for(const R of this.solids){if(!R.active||R.vis===false)continue;const c=TC[R.type]||TC.stone;
  ctx.save();
  if(R.state===1)ctx.translate(U.rand(-1.5,1.5),0);
  if(R.type==='tnt'||R.type==='crate'){ctx.fillStyle=c[0];ctx.fillRect(R.x,R.y,R.w,R.h);ctx.strokeStyle=c[1];ctx.lineWidth=3;ctx.strokeRect(R.x+2,R.y+2,R.w-4,R.h-4);
   if(R.type==='tnt'){ctx.fillStyle='#fff';ctx.font='bold 16px Arial';ctx.textAlign='center';ctx.fillText('TNT',R.x+R.w/2,R.y+R.h/2+6);ctx.fillStyle='#222';ctx.fillRect(R.x,R.y+R.h/2-12,R.w,3);ctx.fillRect(R.x,R.y+R.h/2+10,R.w,3)}
   else{ctx.beginPath();ctx.moveTo(R.x,R.y);ctx.lineTo(R.x+R.w,R.y+R.h);ctx.moveTo(R.x+R.w,R.y);ctx.lineTo(R.x,R.y+R.h);ctx.stroke()}}
  else if(R.oneway){ctx.fillStyle=c[1];ctx.fillRect(R.x,R.y,R.w,6);ctx.fillStyle=c[0];ctx.fillRect(R.x,R.y+6,R.w,R.h-6);
   if(this.id==='future'){ctx.fillStyle=c[1];ctx.globalAlpha=0.5;ctx.fillRect(R.x,R.y+R.h,R.w,3);ctx.globalAlpha=1}}
  else{ctx.fillStyle=c[0];ctx.fillRect(R.x,R.y,R.w,R.h);ctx.fillStyle=c[1];ctx.fillRect(R.x,R.y,R.w,Math.min(14,R.h));
   if(q!=='low'){ctx.strokeStyle=U.rgba('#000000',0.25);ctx.lineWidth=2;const step=R.type==='grass'||R.type==='dirtwall'?60:50;ctx.beginPath();for(let x=R.x;x<R.x+R.w;x+=step){ctx.moveTo(x,R.y+14);ctx.lineTo(x,Math.min(R.y+R.h,this.H+20))}for(let y=R.y+14+step;y<Math.min(R.y+R.h,this.H+20);y+=step){ctx.moveTo(R.x,y);ctx.lineTo(R.x+R.w,y)}ctx.stroke()}}
  if((R.destructible||R.crate)&&R.hp<R.maxhp){ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=2;const k=1-R.hp/R.maxhp;ctx.beginPath();const n=Math.ceil(k*5);for(let i=0;i<n;i++){const x=R.x+R.w*(0.15+0.7*((i*0.37)%1));ctx.moveTo(x,R.y);ctx.lineTo(x+8,R.y+Math.min(R.h,30));ctx.lineTo(x-4,R.y+Math.min(R.h,50))}ctx.stroke()}
  if(R.flash>0){ctx.fillStyle='rgba(255,255,255,.5)';ctx.fillRect(R.x,R.y,R.w,R.h)}
  ctx.restore()}
 for(const pd of this.pads){ctx.fillStyle='#00e5ff';ctx.fillRect(pd.x,pd.y,pd.w,pd.h);ctx.fillStyle='#fff';ctx.fillRect(pd.x+6,pd.y+3,pd.w-12,3)}
 for(const hz of this.hazards){if(hz.type==='lava'){const g=ctx.createLinearGradient(0,hz.y,0,hz.y+hz.h);g.addColorStop(0,'#ffb22a');g.addColorStop(0.2,'#ff4a12');g.addColorStop(1,'#7a0a00');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(hz.x-200,hz.y+hz.h);for(let x=hz.x-200;x<=hz.x+hz.w+200;x+=30)ctx.lineTo(x,hz.y+Math.sin(x*0.02+t*2)*6);ctx.lineTo(hz.x+hz.w+200,hz.y+hz.h);ctx.fill()}
  else if(hz.type==='spikes'){ctx.fillStyle='#ccd';for(let x=hz.x;x<hz.x+hz.w;x+=20){ctx.beginPath();ctx.moveTo(x,hz.y+hz.h);ctx.lineTo(x+10,hz.y);ctx.lineTo(x+20,hz.y+hz.h);ctx.fill()}}}
 for(const s of this.saws){ctx.strokeStyle='#444';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(s.x0,s.y);ctx.lineTo(s.x1,s.y);ctx.stroke();ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.rot||0);ctx.fillStyle='#ccd';ctx.beginPath();for(let i=0;i<16;i++){const a=i/16*6.283,r=i%2?s.r*0.8:s.r;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.fill();ctx.fillStyle='#555';ctx.beginPath();ctx.arc(0,0,6,0,6.3);ctx.fill();ctx.restore()}
 for(const o of this.objs){if(o.kind!=='fall')continue;
  if(o.state===0){ctx.fillStyle='rgba(255,60,60,'+(0.3+0.3*Math.sin(t*30))+')';ctx.fillRect(o.x-o.w/2,0,o.w,this.gy+60);}
  else if(o.state===1){ctx.save();ctx.translate(o.x,o.y);if(o.type==='stalactite'){ctx.fillStyle='#8a8090';ctx.beginPath();ctx.moveTo(-o.w/2,-o.h/2);ctx.lineTo(o.w/2,-o.h/2);ctx.lineTo(0,o.h/2);ctx.fill()}else{ctx.fillStyle='#777';ctx.fillRect(-o.w/2,-o.h/2,o.w,o.h);ctx.strokeStyle='#333';ctx.lineWidth=4;ctx.strokeRect(-o.w/2+2,-o.h/2+2,o.w-4,o.h-4)}ctx.restore()}}
};
// ---- backgrounds (screen space, parallax by camera x) ----
function grad(ctx,w,h,c1,c2){const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,c1);g.addColorStop(1,c2);ctx.fillStyle=g;ctx.fillRect(0,0,w,h)}
function hills(ctx,w,h,base,amp,col,par,cx,f=0.004,ph=0){ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(0,h);for(let x=0;x<=w;x+=20)ctx.lineTo(x,base+Math.sin((x+cx*par)*f+ph)*amp+Math.sin((x+cx*par)*f*2.3+ph)*amp*0.4);ctx.lineTo(w,h);ctx.fill()}
Arena.prototype.drawBG=function(ctx,w,h,cx,t,sc){
 const p=this.pal,id=this.id,S=this.seed,low=this.game.quality==='low';
 grad(ctx,w,h,p.sky1,p.sky2);
 const gy=h*0.8,u=w/1500;
 const trees=(col,n,par,sz)=>{ctx.fillStyle=col;for(let i=0;i<n;i++){const x=((i*w/n*1.0+S[i%60]*60-cx*par)%(w+200)+(w+200))%(w+200)-100;ctx.fillRect(x-sz*0.08,gy-sz,sz*0.16,sz);ctx.beginPath();ctx.arc(x,gy-sz,sz*0.45,0,6.3);ctx.fill()}};
 switch(id){
 case 'training':ctx.strokeStyle='rgba(255,255,255,.08)';ctx.lineWidth=1;for(let x=-(cx*0.2%60);x<w;x+=60){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}for(let y=0;y<h;y+=60){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}break;
 case 'stone':hills(ctx,w,h,h*0.5,20,'#26212c',0.1,cx);for(let i=0;i<6;i++){const x=((i*260-cx*0.3)%(w+260)+w+260)%(w+260)-100;ctx.fillStyle='#34303a';ctx.fillRect(x,h*0.18,60*u+20,h*0.65);ctx.fillStyle='#46414c';ctx.fillRect(x-10,h*0.16,60*u+40,14)}
  for(let i=0;i<4;i++){const x=w*(0.15+i*0.23);const fl=1+0.2*Math.sin(t*9+i*2);ctx.fillStyle='rgba(255,150,40,.25)';ctx.beginPath();ctx.arc(x,h*0.3,38*fl,0,6.3);ctx.fill();ctx.fillStyle='#ffb040';ctx.beginPath();ctx.arc(x,h*0.3,9*fl,0,6.3);ctx.fill()}break;
 case 'minecraft':ctx.fillStyle='#fff';for(let i=0;i<5;i++){const x=((i*400+t*14-cx*0.1)%(w+300)+w+300)%(w+300)-150,y=60+i*40;ctx.globalAlpha=.85;ctx.fillRect(x,y,160,34);ctx.fillRect(x+30,y-18,100,22)}ctx.globalAlpha=1;
  ctx.fillStyle='#ffe040';ctx.fillRect(w*0.8,50,70,70);for(let i=0;i<9;i++){const x=((i*170-cx*0.25)%(w+170)+w+170)%(w+170)-80,hh=70+S[i]*110;ctx.fillStyle='#4a8a3a';ctx.fillRect(x,gy-hh,150,hh+h);ctx.fillStyle='#5aa63a';ctx.fillRect(x,gy-hh,150,16)}break;
 case 'forest':hills(ctx,w,h,gy-80,25,'#2a5a35',0.15,cx);trees('#1e4a28',9,0.3,200);trees('#16381e',7,0.5,260);if(!low){ctx.fillStyle='rgba(255,255,160,.8)';for(let i=0;i<18;i++){const x=(S[i]*w+Math.sin(t+i)*30),y=h*0.4+S[i+20]*h*0.4+Math.cos(t*1.3+i)*20;ctx.fillRect(x,y,3,3)}}break;
 case 'cave':for(let i=0;i<14;i++){const x=((i*130+S[i]*40-cx*0.3)%(w+130)+w+130)%(w+130)-40,l=60+S[i]*140;ctx.fillStyle='#17121f';ctx.beginPath();ctx.moveTo(x-30,0);ctx.lineTo(x+30,0);ctx.lineTo(x,l);ctx.fill()}
  for(let i=0;i<9;i++){const x=((i*210+S[i+9]*80-cx*0.5)%(w+210)+w+210)%(w+210)-60;ctx.fillStyle='rgba(140,90,255,'+(0.4+0.2*Math.sin(t*2+i))+')';ctx.beginPath();ctx.moveTo(x,gy);ctx.lineTo(x+14,gy-60-S[i]*40);ctx.lineTo(x+28,gy);ctx.fill()}break;
 case 'ice':hills(ctx,w,h,gy-120,40,'#bfe6f5',0.1,cx,0.003);hills(ctx,w,h,gy-50,30,'#d8f2fa',0.25,cx,0.005,2);if(!low){ctx.fillStyle='#fff';for(let i=0;i<50;i++){const x=((S[i%60]*w+t*20*(0.5+S[i%60])-cx*0.1)%w+w)%w,y=((S[(i+7)%60]*h+t*50*(0.5+S[i%60]))%h);ctx.fillRect(x,y,3,3)}}break;
 case 'lava':hills(ctx,w,h,h*0.55,40,'#1a0806',0.1,cx,0.003);if(!low)for(let i=0;i<14;i++){const x=S[i]*w,y=((h-((t*40*(0.5+S[i])+S[i+14]*h)%h)));ctx.fillStyle='rgba(255,140,30,.8)';ctx.fillRect(x,y,4,4)}ctx.fillStyle='rgba(255,80,20,.25)';ctx.fillRect(0,h*0.85,w,h*0.2);break;
 case 'sky':for(let i=0;i<7;i++){const x=((i*300+t*(8+i*3)-cx*(0.1+i*0.03))%(w+400)+w+400)%(w+400)-200,y=h*0.15+S[i]*h*0.6;ctx.fillStyle='rgba(255,255,255,.85)';ctx.beginPath();ctx.arc(x,y,50,0,6.3);ctx.arc(x+50,y+10,40,0,6.3);ctx.arc(x-50,y+14,36,0,6.3);ctx.fill()}break;
 case 'future':ctx.strokeStyle='rgba(0,229,255,.35)';ctx.lineWidth=2;for(let i=-10;i<=10;i++){ctx.beginPath();ctx.moveTo(w/2+i*25,h*0.55);ctx.lineTo(w/2+i*200-cx*0.5,h);ctx.stroke()}for(let k=0;k<8;k++){const y=h*0.55+Math.pow(((k+t*0.6)%8)/8,2)*h*0.45;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
  for(let i=0;i<8;i++){const x=((i*220-cx*0.2)%(w+220)+w+220)%(w+220)-50,hh=100+S[i]*220;ctx.fillStyle='#120a30';ctx.fillRect(x,h*0.55-hh,70,hh);ctx.fillStyle='#ff2a9a';for(let y=h*0.55-hh+10;y<h*0.55-10;y+=28)if(S[(i*7+(y|0))%60]>0.4)ctx.fillRect(x+10,y,10,8)}break;
 case 'bridge':hills(ctx,w,h,gy-100,50,'#a8744a',0.1,cx,0.003);hills(ctx,w,h,gy-20,40,'#7a4a2a',0.3,cx,0.004,1);ctx.fillStyle='rgba(255,240,200,.9)';ctx.beginPath();ctx.arc(w*0.7,h*0.25,60,0,6.3);ctx.fill();break;
 case 'traps':ctx.fillStyle='#2a2020';for(let i=0;i<10;i++){const x=((i*170-cx*0.2)%(w+170)+w+170)%(w+170)-80;ctx.fillRect(x,0,90,h*0.8)}ctx.fillStyle='rgba(255,40,40,'+(0.4+0.3*Math.sin(t*4))+')';ctx.fillRect(0,0,w,8);ctx.fillRect(0,h*0.78,w,6);break;
 case 'final':ctx.fillStyle='rgba(255,60,60,.2)';ctx.beginPath();ctx.arc(w/2,h*0.35,h*0.28+Math.sin(t)*6,0,6.3);ctx.fill();hills(ctx,w,h,h*0.62,60,'#14000a',0.1,cx,0.0025);for(let i=0;i<6;i++){const x=((i*300-cx*0.3)%(w+300)+w+300)%(w+300)-100;ctx.fillStyle='#240818';ctx.fillRect(x,h*0.25,40,h);ctx.beginPath();ctx.moveTo(x-20,h*0.25);ctx.lineTo(x+20,h*0.1);ctx.lineTo(x+60,h*0.25);ctx.fill()}break;
 }
};
})(window.SD);
