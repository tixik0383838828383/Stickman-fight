'use strict';
// GameEngine: loop, camera, match/mode logic, HUD.
(function(SD){
const U=SD.U,P=SD.Phys,STEP=1/60;
const MODE_NAMES={versus:'Дуэль',tournament:'Турнир',survival:'Выживание',zombie:'Зомби',chaos:'Хаос оружия',team:'Команды',free:'Свободный бой',football:'Футбол',training:'Тренировка'};
SD.MODE_NAMES=MODE_NAMES;
const SLOT_TEAMS=[1,2,3,4,5,6];
SD.defaultSlots=()=>[{ctrl:'k1',char:'second',weapon:'auto',off:'none',team:1},{ctrl:'bot',char:'red',weapon:'auto',off:'none',team:2},{ctrl:'off',char:'blue',weapon:'auto',off:'none',team:3},{ctrl:'off',char:'green',weapon:'auto',off:'none',team:4},{ctrl:'off',char:'yellow',weapon:'auto',off:'none',team:5},{ctrl:'off',char:'purple',weapon:'auto',off:'none',team:6}];
SD.defaultCfg=()=>({mode:'versus',arena:'training',slots:SD.defaultSlots(),botLevel:1,rounds:2,time:60,hp:100,speed:1,gravity:1,knockback:1,pickups:true,destruct:true,instaKO:false,goals:5,dummy:'stand',infHp:true});
class Game{
 constructor(canvas){
  this.canvas=canvas;this.ctx=canvas.getContext('2d');this.save=SD.Save;this.audio=SD.Audio;this.particles=new SD.ParticleSystem();this.combat=new SD.Combat(this);this.proj=new SD.Projectiles(this);this.items=new SD.Items(this);
  this.fighters=[];this.arena=null;this.time=0;this.running=false;this.paused=false;this.hitstopT=0;this.shakeAmt=0;this.slowmo=1;this.gravity=1;this.dmgScale=1;this.inputLock=false;this.cfg=SD.defaultCfg();this.m=null;
  this.cam={x:750,y:420,z:1};this.acc=0;this.last=0;this.fps=60;this.lowT=0;this.vw=1;this.vh=1;this.dpr=1;this.quality='high';this.menuBg=true;this.hudHp={};
  this.train={last:0,total:0,hits:0,dps:[],combo:0,dummy:'stand'};
  this.setQuality(this.save.data.settings.quality);this.resize();addEventListener('resize',()=>this.resize());
 }
 // ---------- infrastructure ----------
 setQuality(q){this.qSetting=q;if(q==='auto')q=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)?'medium':'high';this.quality=q;this.particles.setQuality(q);this.resize()}
 resize(){const dpr=Math.min(window.devicePixelRatio||1,this.quality==='low'?1:this.quality==='medium'?1.5:2);this.dpr=dpr;const w=innerWidth,h=innerHeight;this.canvas.width=w*dpr;this.canvas.height=h*dpr;this.canvas.style.width=w+'px';this.canvas.style.height=h+'px';this.vw=w;this.vh=h}
 shake(a){if(!this.save.data.settings.shake)return;this.shakeAmt=Math.min(18,Math.max(this.shakeAmt,a))}
 hitstop(t){this.hitstopT=Math.max(this.hitstopT,this.quality==='low'?t*0.5:t)}
 stats(a,k,v){if(!a)return;a.stats[k]=(a.stats[k]||0)+v;if(a.human&&this.save.data.stats[k]!==undefined)this.save.data.stats[k]+=v}
 achieve(id){if(this.save.ach(id)&&SD.UI)SD.UI.toast('🏆 Достижение: '+SD.ACHIEVEMENTS[id].split(' — ')[0])}
 nearestEnemy(f,any){let best=null,bd=1e9;for(const o of this.fighters){if(o===f||!o.alive||o.team===f.team)continue;const d=Math.abs(o.P[0].x-f.P[0].x)+Math.abs(o.P[0].y-f.P[0].y)*0.5;if(d<bd){bd=d;best=o}}return best}
 dmgEvent(a,t,dmg,part){if(this.cfg.mode==='training'&&a.human){const T=this.train;T.last=dmg;T.total+=dmg;T.hits++;T.combo=a.combo;T.dps.push([this.time,dmg])}}
 fxHit(fx,x,y,heavy,face){const p=this.particles,n=heavy?1.6:1;
  switch(fx){
  case 'fire':p.sparks(x,y,Math.round(12*n),'#ff8a22',380,0.5,4);p.glow(x,y,30*n,'#ff6611',0.2);break;
  case 'ice':p.sparks(x,y,Math.round(12*n),'#bff',320,0.5,4);p.ring(x,y,30*n,'#9fe8ff',0.25,3);break;
  case 'elec':p.sparks(x,y,Math.round(14*n),'#ffee55',480,0.3,3);for(let i=0;i<3;i++)p.slash(x,y,U.rand(0,6.28),U.rand(14,30),'#ffee55',0.15);break;
  case 'energy':case 'magic':p.sparks(x,y,Math.round(10*n),fx==='magic'?'#d9a0ff':'#7ff',350,0.4,3);p.ring(x,y,34*n,fx==='magic'?'#c070ff':'#37e0ff',0.3,4);p.glow(x,y,36*n,fx==='magic'?'#c070ff':'#37e0ff',0.2);break;
  case 'dark':p.sparks(x,y,Math.round(14*n),'#f22',420,0.5,4);p.ring(x,y,40*n,'#a0f',0.3,4);break;
  case 'blunt':p.ring(x,y,26*n,'#fff',0.22,3);p.sparks(x,y,Math.round(7*n),'#ffd',260,0.3,3);p.dust(x,y,3);break;
  default:p.slash(x,y,U.rand(-1,1)+(face>0?0:Math.PI),32*n,'#fff',0.16);p.sparks(x,y,Math.round(10*n),'#ffe9a0',380,0.35,3,face>0?0:Math.PI,2)}
 }
 // ---------- building fighters ----------
 mkCtrl(kind,level){const c=kind==='bot'?null:SD.Input.make(kind);return c||new SD.BotController(level)}
 loadout(f,slot){
  const def=f.def;let w=slot.weapon;
  if(w==='auto')w=def.weapon||'none';
  if(w==='random'){const ids=Object.keys(SD.WEAPONS).filter(i=>SD.WEAPONS[i].slot==='main');w=U.pick(ids)}
  if(w&&w!=='none')this.items.give(f,w,0);
  let o=slot.off;if(o&&o!=='none'&&SD.WEAPONS[o]&&!(f.main&&f.main.def.two))this.items.give(f,o,0)}
 mkFighter(slot,i,n,opts={}){
  const cfg=this.cfg;let cid=slot.char;if(cid==='rand'||!SD.CHARS[cid]){const ids=SD.CHAR_ORDER.filter(c=>!opts.avoid||c!==opts.avoid);cid=U.pick(ids)}
  const ctrl=this.mkCtrl(slot.ctrl,slot.level!==undefined?slot.level:cfg.botLevel);if(opts.color)opts.colorOv=opts.color;
  const f=new SD.Fighter(this,cid,{ctrl,bot:slot.ctrl==='bot',human:slot.ctrl!=='bot',team:slot.team,hpMult:(opts.hpMult||1)*cfg.hp/100,slot:i,name:slot.name,color:opts.color});f.slotCfg=slot;f.slotTag=slot.tag||null;
  if(slot.ctrl==='bot'&&!f.name.includes('(')){}
  this.loadout(f,slot);return f}
 placeAll(){const n=this.fighters.length;this.fighters.forEach((f,i)=>{const sp=this.arena.spawnPos(i,n);
   const x=n===2?(i===0?this.arena.spawns[0]:this.arena.spawns[1]):sp.x;f.place(x,this.arena.killY<1100&&false?0:sp.y,x<this.arena.W/2?1:-1)});
  this.fighters.forEach((f,i)=>{const e=this.nearestEnemy(f);if(e)f.face=e.root.x>f.root.x?1:-1})}
 // ---------- match control ----------
 start(cfg){
  this.cfg=cfg=Object.assign(SD.defaultCfg(),cfg);this.gravity=cfg.gravity||1;this.dmgScale=1;
  const m=this.m={mode:cfg.mode,state:'intro',t:0,round:1,wins:{},roundsToWin:cfg.rounds,timer:cfg.time,startTime:performance.now(),over:false,kills:0,wave:0,bracket:null,bi:0,names:{},totalTime:0,banner:'',bannerT:0,resp:{}};
  this.menuBg=false;this.running=true;this.paused=false;this.train={last:0,total:0,hits:0,dps:[],combo:0,dummy:cfg.dummy||'stand'};
  if(cfg.mode==='tournament'){m.roundsToWin=1;const ids=U.shuffle?null:null;const h0=(cfg.slots.find(x=>x.ctrl!=='bot'&&x.ctrl!=='off')||cfg.slots[0]).char;const pool=SD.CHAR_ORDER.filter(c=>c!==h0);for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
   m.bracket=[0,1,2,3,4,5,6].map(i=>({char:pool[i%pool.length],level:Math.min(3,Math.floor(i/2)+(cfg.botLevel>1?1:0)),won:false}));m.bi=0;m.roundsToWin=1}
  if(cfg.mode==='survival'||cfg.mode==='zombie'){m.roundsToWin=999}
  if(cfg.mode==='football'){m.roundsToWin=999;m.score={};m.goalT=0}
  if(cfg.mode==='training'||cfg.mode==='survival'||cfg.mode==='zombie')m.timer=0;
  this.beginRound(true);
  if(SD.UI)SD.UI.onMatchStart(this)}
 slotsForMode(){
  const cfg=this.cfg,m=this.m,mode=cfg.mode;
  const act=cfg.slots.map((s,i)=>Object.assign({},s,{tag:s.ctrl==='bot'?'CPU':'P'+(i+1),level:s.level!==undefined?s.level:cfg.botLevel})).filter(s=>s.ctrl!=='off');
  const humans=act.filter(s=>s.ctrl!=='bot');if(!humans.length&&mode!=='versus'&&mode!=='free'&&mode!=='team'&&mode!=='football')humans.push(Object.assign({},act[0]||cfg.slots[0],{ctrl:'k1',tag:'P1'}));
  const botSlot=(team,lvl,char)=>({char:char||'rand',weapon:'auto',off:'none',ctrl:'bot',team,level:lvl,tag:'CPU'});
  switch(mode){
   case 'tournament':{const b=m.bracket[m.bi];return [Object.assign({},humans[0],{team:1}),botSlot(2,b.level,b.char)]}
   case 'survival':case 'zombie':return humans.map(h=>Object.assign({},h,{team:1}));
   case 'chaos':return act.map(s=>Object.assign({},s,{weapon:'none',off:'none'}));
   case 'football':{let a=act;if(a.length<2)a=a.concat([botSlot(2,cfg.botLevel)]);return a.map(s=>Object.assign({},s,{weapon:'none',off:'none',team:s.team===1?1:2}))}
   case 'training':{const d=cfg.slots[1]&&cfg.slots[1].ctrl!=='off'?cfg.slots[1]:cfg.slots[0];return [Object.assign({},humans[0],{team:1}),{char:d.char,weapon:d.weapon,off:d.off,ctrl:'bot',team:2,level:1,tag:'DUMMY'}]}
   case 'versus':{let a=act.slice(0,4);if(a.length<2)a=a.concat([botSlot(2,cfg.botLevel)]);return a.map((s,i)=>Object.assign({},s,{team:s.team||i+1}))}
   default:{let a=act;if(a.length<2)a=a.concat([botSlot(2,cfg.botLevel)]);return a}
  }}
 beginRound(first){
  const cfg=this.cfg,m=this.m;
  this.arena=new SD.Arena(cfg.arena,this,{destruct:cfg.destruct});this.items.reset();this.proj.reset();this.particles.list.length=0;this.particles.texts.length=0;
  this.fighters=[];
  const slots=this.slotsForMode();const avoid=slots[0]&&slots[0].char;
  slots.forEach((s,i)=>{const f=this.mkFighter(s,i,slots.length,{avoid});this.fighters.push(f)});
  if(cfg.mode==='training'){const d=this.fighters[1];d.ctrl.dummy={mode:this.train.dummy}}
  // distinct names
  const cnt={};this.fighters.forEach((f,i)=>{let nm=f.def.name;f.name=(f.slotTag||'CPU')+' · '+nm});if(cfg.mode==='football'){this.dmgScale=0.12;this.ballInit()}else this.dmgScale=1;
  this.placeAll();if(cfg.mode==='football')this.footballPlace();
  m.state='intro';m.t=0;m.timer=cfg.mode==='training'||cfg.mode==='survival'?0:cfg.time;m.over=false;m.endT=0;m.elapsed=0;this.inputLock=true;this.slowmo=1;this.hudHp={};
  m.wave=0;m.waveT=0;m.itemT=cfg.mode==='chaos'?1:6;m.resp={};
  if(cfg.mode==='survival'||cfg.mode==='zombie'){this.spawnWave(1)}
  if(cfg.pickups!==false||cfg.mode==='chaos'){const n=cfg.mode==='chaos'?3:(cfg.mode==='training'?0:2);for(let i=0;i<n;i++){const d=this.arena.randomDropX();this.items.spawn(d.x,U.rand(100,300))}}
  this.cam.x=this.arena.W/2;this.cam.y=this.arena.H/2;this.cam.z=0.001;this.camSnap=true;
  this.audio.play('beep');m.cd=3;
 }
 spawnWave(n){const m=this.m,cfg=this.cfg,zomb=cfg.mode==='zombie';m.wave=n;m.waveT=0;
  const nh=Math.max(1,this.fighters.filter(f=>f.team===1).length);
  const cnt=zomb?Math.min(8,Math.floor((2+n*1.2)*(1+(nh-1)*0.5))):Math.min(1+Math.floor((n-1)/2),4)+(nh-1);
  const lvl=Math.min(3,Math.floor((n-1)/2));const avoid=this.fighters[0]&&this.fighters[0].cid;
  for(let i=0;i<cnt;i++){
   const f=this.mkFighter({char:'rand',weapon:zomb?'none':(Math.random()<0.4?'random':'auto'),off:'none',ctrl:'bot',team:2,level:zomb?Math.min(2,lvl):lvl},this.fighters.length,0,zomb?{color:'#6f9a5a',hpMult:0.55+n*0.07}:{avoid});
   f.name=zomb?'Зомби':'CPU · '+f.def.name;if(zomb){f.spdMul=0.82;f.zombie=true}
   const x=Math.random()<0.5?U.rand(120,380):U.rand(this.arena.W-380,this.arena.W-120);f.place(x,-100-i*80,x<this.arena.W/2?1:-1);f.invuln=1;this.fighters.push(f)}
  this.particles.text(this.arena.W/2,200,(zomb?'ЗОМБИ-ВОЛНА ':'ВОЛНА ')+n,zomb?'#8fdc6a':'#ffd24a',46,1.6);
  if(n>=5)this.achieve('surv5')}
 upgradeOptions(){const all=[
  {id:'hp',name:'+25% здоровья',desc:'Макс. HP ×1.25 и полное лечение',fn:f=>{f.maxHp*=1.25;f.hp=f.maxHp}},
  {id:'dmg',name:'+20% урона',desc:'Все атаки сильнее',fn:f=>{f.dmgMul*=1.2}},
  {id:'spd',name:'+12% скорости',desc:'Бегаете быстрее',fn:f=>{f.spdMul*=1.12}},
  {id:'atk',name:'+15% скорость атак',desc:'Удары быстрее',fn:f=>{f.atkSpd*=1.15}},
  {id:'heal',name:'Аптечка',desc:'Восстановить всё здоровье',fn:f=>{f.hp=f.maxHp}},
  {id:'energy',name:'Энергия',desc:'Энергия до 100',fn:f=>{f.energy=100}},
  {id:'armor',name:'Броня',desc:'Входящий урон −12%',fn:f=>{f.incoming*=0.88}},
  {id:'regen',name:'Регенерация',desc:'Лечение 8 с после каждой волны',fn:f=>{f.setFx('regen',8)}}];
  for(let i=all.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[all[i],all[j]]=[all[j],all[i]]}return all.slice(0,3)}
 applyUpgrade(o){for(const f of this.fighters)if(f.team===1&&f.alive)o.fn(f);this.particles.text(this.arena.W/2,240,o.name,'#8fdc6a',34,1.4);this.m.state='fight';this.inputLock=false;this.m.waveT=0;this.fighters=this.fighters.filter(f=>f.alive||f.team===1);this.spawnWave(this.m.wave+1)}
 // ---------- football ----------
 ballInit(){const A=this.arena;this.ball={x:A.W/2,y:300,vx:0,vy:0,r:26,rot:0,trail:[]}}
 footballPlace(){const A=this.arena,cnt={};this.fighters.forEach(f=>{const k=cnt[f.team]=(cnt[f.team]||0)+1;const left=f.team===1;f.place(left?A.W*0.5-170-(k-1)*90:A.W*0.5+170+(k-1)*90,200,left?1:-1)});this.ballInit()}
 ballStep(dt){const b=this.ball,A=this.arena,m=this.m;if(!b)return;
  if(m.goalT>0){m.goalT-=dt;if(m.goalT<=0){this.footballPlace();m.state='fight'}return}
  if(m.state==='intro')return;
  b.vy+=1500*dt*this.gravity;b.x+=b.vx*dt;b.y+=b.vy*dt;b.rot+=b.vx*dt/b.r;b.vx*=1-0.35*dt;
  if(b.y+b.r>A.gy){b.y=A.gy-b.r;if(b.vy>0){b.vy=b.vy>140?-b.vy*0.55:0}b.vx*=1-1.6*dt}
  if(b.y-b.r<0){b.y=b.r;b.vy=Math.abs(b.vy)*0.5}
  const gl=A.gy-190,inGoalY=b.y>gl;
  if(b.x<b.r&&!inGoalY){b.x=b.r;b.vx=Math.abs(b.vx)*0.6}else if(b.x>A.W-b.r&&!inGoalY){b.x=A.W-b.r;b.vx=-Math.abs(b.vx)*0.6}
  if(inGoalY&&b.y-b.r<gl){if(b.vy<0&&b.y-b.r<gl+4){b.vy=Math.abs(b.vy)*0.4;b.y=gl+b.r}}
  if(b.x<-10||b.x>A.W+10)this.goal(b.x<0?2:1);
  for(const f of this.fighters){if(!f.alive)continue;const pts=[f.P[1],f.P[2],f.P[4],f.P[6],f.P[8],f.P[10],f.P[0]];
   for(const q of pts){const dx=b.x-q.x,dy=b.y-q.y,d=Math.hypot(dx,dy);if(d<b.r+9&&d>0.01){const nx=dx/d,ny=dy/d;b.x=q.x+nx*(b.r+9);b.y=q.y+ny*(b.r+9);
     const vqx=(q.x-q.px)/dt+f.root.vx*0.3,vqy=(q.y-q.py)/dt;const vr=(vqx-b.vx)*nx+(vqy-b.vy)*ny;if(vr>0){b.vx+=nx*vr*1.15;b.vy+=ny*vr*1.15}
     b.vx+=f.root.vx*0.35;b.last=f.team;this.audio.play('click',0.7)}}
   const d2=Math.hypot(b.x-f.P[1].x,b.y-f.P[1].y);
   if(f.hitActive&&!f._bk&&d2<130&&Math.sign(b.x-f.root.x)===f.face){f._bk=true;const hv=f.move&&f.move.kind==='heavy';b.vx=f.face*(760+f.def.power*220+(hv?620:0));b.vy=-(260+(hv?200:0));b.last=f.team;this.audio.play('hit',0.8);this.shake(3);this.particles.ring(b.x,b.y,40,'#fff',0.2,3)}
   if(!f.hitActive)f._bk=false}
  const sp=Math.hypot(b.vx,b.vy);if(sp>1900){b.vx*=1900/sp;b.vy*=1900/sp}
  }
 goal(team){const m=this.m;if(m.goalT>0)return;m.score[team]=(m.score[team]||0)+1;m.goalT=2.2;m.state='goal';m.banner='ГОЛ!';m.bannerT=0;this.audio.play('win');this.shake(10);this.particles.sparks(this.ball.x<0?20:this.arena.W-20,this.arena.gy-90,40,'#ffd24a',700,0.9,5);this.slowmo=0.5;
  if(m.score[team]>=this.cfg.goals)this.endMatch(team,true)}
 drawFootball(ctx){const A=this.arena,b=this.ball,gl=A.gy-190;
  ctx.save();ctx.lineWidth=5;for(const [x,sx] of [[0,1],[A.W,-1]]){ctx.strokeStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.moveTo(x,A.gy);ctx.lineTo(x,gl);ctx.lineTo(x+sx*60,gl);ctx.stroke();ctx.lineWidth=1;ctx.strokeStyle='rgba(255,255,255,.35)';for(let i=0;i<=6;i++){ctx.beginPath();ctx.moveTo(x+sx*i*10,gl+(i?0:0));ctx.lineTo(x+sx*i*10,A.gy);ctx.stroke()}for(let j=0;j<=5;j++){ctx.beginPath();ctx.moveTo(x,gl+j*38);ctx.lineTo(x+sx*60,gl+j*38);ctx.stroke()}ctx.lineWidth=5}
  if(b){ctx.translate(b.x,b.y);ctx.rotate(b.rot);ctx.fillStyle='#fff';ctx.strokeStyle='#111';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,b.r,0,6.3);ctx.fill();ctx.stroke();ctx.fillStyle='#111';ctx.beginPath();for(let i=0;i<5;i++){const a=i/5*6.283-1.57;ctx.lineTo(Math.cos(a)*b.r*0.45,Math.sin(a)*b.r*0.45)}ctx.closePath();ctx.fill();for(let i=0;i<5;i++){const a=i/5*6.283-1.57;ctx.beginPath();ctx.moveTo(Math.cos(a)*b.r*0.45,Math.sin(a)*b.r*0.45);ctx.lineTo(Math.cos(a)*b.r,Math.sin(a)*b.r);ctx.stroke()}}
  ctx.restore()}
 restart(){this.start(this.cfg)}
 stop(){this.running=false;this.menuBg=true;this.arena=new SD.Arena(this.cfg.arena,this,{destruct:false});this.camSnap=true;this.m=null;this.fighters=[];this.items.reset();this.proj.reset();if(SD.UI)SD.UI.onMatchStop()}
 pause(v){if(!this.running||!this.m||this.m.state==='over')return;this.paused=v===undefined?!this.paused:v;if(SD.UI)SD.UI.onPause(this.paused)}
 // ---------- rounds ----------
 onKill(t,killer,cause){const m=this.m;if(!m)return;m.koT=0;this.slowmo=0.35;this.koFlash=0.5;
  if((this.cfg.mode==='survival'||this.cfg.mode==='zombie')&&t.team===2){m.kills++}}
 teamsAlive(){const s=new Set();for(const f of this.fighters)if(f.alive)s.add(f.team);return s}
 checkRound(dt){
  const m=this.m,cfg=this.cfg,mode=m.mode;
  if(mode==='training'){for(const f of this.fighters){if(!f.alive){m.resp[f.id]=(m.resp[f.id]||0)+dt;if(m.resp[f.id]>1.6){m.resp[f.id]=0;this.respawn(f)}}
    if(cfg.infHp&&f.alive&&f.team===2&&f.hp<f.maxHp*0.25)f.hp=f.maxHp}
   const p=this.fighters[0];if(p.alive){p.hp=Math.min(p.maxHp,p.hp+(p.hp<p.maxHp*0.3?30*dt:0))}return}
  if(m.state!=='fight')return;
  if(mode==='survival'||mode==='zombie'){
   const hum=this.fighters.filter(f=>f.team===1);const enemies=this.fighters.filter(f=>f.team===2&&f.alive).length;
   if(!hum.some(f=>f.alive)){this.endMatch(null,false);return}
   if(enemies===0){m.waveT+=dt;if(m.waveT>2.0){for(const p of hum){if(p.alive){p.hp=Math.min(p.maxHp,p.hp+p.maxHp*0.25);p.energy=Math.min(100,p.energy+30)}else this.respawn(p)}
     if(mode==='zombie'){m.state='upgrade';this.inputLock=true;m.upg=this.upgradeOptions();if(SD.UI)SD.UI.showUpgrade(this,m.upg)}
     else{this.fighters=this.fighters.filter(f=>f.alive||f.team===1);this.spawnWave(m.wave+1)}}}
   return}
  if(mode==='football'){
   if(m.state==='fight'||m.state==='goal'){for(const f of this.fighters){if(!f.alive){m.resp[f.id]=(m.resp[f.id]||0)+dt;if(m.resp[f.id]>1.5){m.resp[f.id]=0;this.respawn(f)}}}}
   if(m.state!=='fight')return;
   m.elapsed+=dt;if(m.timer>0){m.timer-=dt;if(m.timer<=0){m.timer=0;const s1=m.score[1]||0,s2=m.score[2]||0;this.endMatch(s1===s2?null:(s1>s2?1:2),true)}}
   return}
  m.elapsed+=dt;
  if(m.timer>0){m.timer-=dt;if(m.timer<=0){m.timer=0;
    const hp={};for(const f of this.fighters){hp[f.team]=(hp[f.team]||0)+(f.alive?f.hp/f.maxHp:0)}
    let best=null,bv=-1,tie=false;for(const t in hp){if(hp[t]>bv+1e-6){bv=hp[t];best=+t;tie=false}else if(Math.abs(hp[t]-bv)<1e-6)tie=true}
    this.endRound(tie?null:best,'time');return}}
  const alive=this.teamsAlive();
  if(alive.size<=1){this.endRound(alive.size?[...alive][0]:null,'ko')}
 }
 respawn(f){const A=this.arena;if(this.cfg.mode==='football'){f.place(f.team===1?A.W*0.4:A.W*0.6,200,f.team===1?1:-1)}else f.place(A.spawns[f.team===1?0:1],200,f.team===1?1:-1);f.hp=f.maxHp;f.energy=0;f.main=null;f.off=null;this.loadout(f,f.slotCfg||{weapon:'none',off:'none'})}
 endRound(team,why){const m=this.m;if(m.state!=='fight')return;m.state='roundend';m.endT=0;m.winTeam=team;
  if(team!==null){m.wins[team]=(m.wins[team]||0)+1}
  const w=this.fighters.find(f=>f.team===team&&f.alive);if(w&&team!==null){w.state='victory';w.stateT=0;w.move=null;w.hitActive=false;this.audio.play('win')}
  m.banner=team===null?'НИЧЬЯ':(why==='time'?'ВРЕМЯ!':'K.O.');m.bannerT=0;m.matchWinner=team!==null&&m.wins[team]>=m.roundsToWin?team:null}
 matchDone(team){const m=this.m;if(m.mode==='tournament'&&team===1&&m.bi<6){m.state='bracket';this.inputLock=true;if(SD.UI)SD.UI.showBracket(this)}else this.endMatch(team,true)}
 nextBracket(){const m=this.m;m.bi++;m.wins={};m.round=1;m.roundsToWin=m.bi===6?2:1;this.beginRound();if(SD.UI)SD.UI.hideOverlay()}
 endMatch(winTeam,won){const m=this.m;if(m.over)return;m.over=true;m.state='over';this.inputLock=true;
  const dur=(performance.now()-m.startTime)/1000;
  const data={mode:m.mode,win:winTeam,duration:dur,fighters:this.fighters.map(f=>({name:f.name,team:f.team,hits:Math.round(f.stats.hits),damage:Math.round(f.stats.damage),kills:f.stats.kills,alive:f.alive,human:f.human,cid:f.cid,maxCombo:f.stats.maxCombo})),wave:m.wave,kills:m.kills,wins:m.wins};
  const d=this.save.data;const humanWon=(m.mode==='survival'||m.mode==='zombie')?false:(winTeam!==null&&this.fighters.some(f=>f.human&&f.team===winTeam&&!(m.mode==='versus'&&f.ctrl instanceof SD.Input.KeyboardController&&false)));
  d.stats.matches++;
  data.humanWon=humanWon;let unlocked=[];
  if(m.mode==='survival'||m.mode==='zombie'){const key=m.mode==='zombie'?'zombieBest':'survivalBest';d.records[key]=d.records[key]||0;if(m.kills>d.records[key])d.records[key]=m.kills;data.record=d.records[key];data.win=null}
  if(m.mode==='tournament'&&humanWon&&m.bi>=6){d.records.tournamentWins++;this.achieve('tourney')}
  if(humanWon&&m.mode!=='training'){d.stats.wins++;if(d.stats.wins>=1)this.achieve('win1');if(d.stats.wins>=10)this.achieve('win10');if(!d.records.bestWinTime||dur<d.records.bestWinTime)d.records.bestWinTime=dur;unlocked=this.save.checkUnlocks()}
  data.unlocked=unlocked;this.save.save();this.audio.play(humanWon?'win':'lose');
  if(SD.UI)SD.UI.showResults(data,this)}
 // ---------- simulation ----------
 step(dt){
  if(this.hitstopT>0){this.hitstopT-=dt;this.particles.update(dt*0.3,this.arena);return}
  this.time+=dt;const m=this.m;if(!this.arena)return;
  if(m){
   if(m.state==='intro'){m.t+=dt;const c=3-m.t/0.8;const ci=Math.ceil(c);if(m.cd!==ci&&ci>=1&&ci<=3){m.cd=ci;this.audio.play('beep')}
    if(m.t>2.6){m.state='fight';this.inputLock=false;m.banner='FIGHT!';m.bannerT=0;this.audio.play('go')}}
   if(m.state==='roundend'){m.endT+=dt;if(m.endT>(m.koFast?1:2.6)){
     if(m.matchWinner!==null&&m.matchWinner!==undefined)this.matchDone(m.matchWinner);
     else{m.round++;this.beginRound()}}}
   if(m.bannerT<5)m.bannerT+=dt;
  }
  this.arena.update(dt);
  for(const f of this.fighters)f.update(dt,this);
  this.bodyCollide();
  if(m&&m.mode==='football')this.ballStep(dt);this.combat.update(dt);this.proj.update(dt);this.items.update(dt);this.particles.update(dt,this.arena);
  if(m&&this.running){this.checkRound(dt);this.itemSpawner(dt)}
  if(this.shakeAmt>0)this.shakeAmt=Math.max(0,this.shakeAmt-dt*40);
  if(this.slowmo<1)this.slowmo=Math.min(1,this.slowmo+dt*0.7);
  if(this.koFlash>0)this.koFlash-=dt;
 }
 itemSpawner(dt){const m=this.m,cfg=this.cfg;if(m.state!=='fight'||cfg.mode==='football'||cfg.pickups===false&&cfg.mode!=='chaos')return;
  m.itemT-=dt;if(m.itemT<=0){const chaos=cfg.mode==='chaos';m.itemT=chaos?2.6:13;const cap=chaos?9:4;if(this.items.list.length<cap){const d=this.arena.randomDropX();this.items.spawn(d.x,d.y)}}}
 bodyCollide(){const F=this.fighters;
  for(let i=0;i<F.length;i++){const a=F[i];if(!a.alive&&a.w===0&&false)continue;
   for(let j=i+1;j<F.length;j++){const b=F[j];
    if(a.w>0.15&&b.w>0.15&&a.alive&&b.alive){const dx=b.root.x-a.root.x,ov=28*(a.s+b.s)/2-Math.abs(dx);
     if(ov>0&&Math.abs(b.root.y-a.root.y)<70){const s=dx>=0?1:-1,push=ov*0.5;const aAir=!a.root.ground,bAir=!b.root.ground;
      if(!(a.state==='roll'||b.state==='roll')){a.root.x-=s*push;b.root.x+=s*push;if(Math.abs(a.root.vx-b.root.vx)>200){const t=a.root.vx;a.root.vx=a.root.vx*0.5+b.root.vx*0.5;b.root.vx=b.root.vx*0.5+t*0.5}}}}
    else{ // ragdoll body vs body
     for(const [ia,ib] of [[1,1],[0,0],[1,0],[0,1],[2,1],[1,2]]){const p=a.P[ia],q=b.P[ib];const dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy);const r=16;if(d<r&&d>0.01&&(a.w<0.5||b.w<0.5)){const k=(r-d)/d*0.5;p.x-=dx*k;p.y-=dy*k;q.x+=dx*k;q.y+=dy*k}}}
   }}}
 // ---------- main loop ----------
 frame(ts){
  const dt=Math.min(0.1,(ts-this.last)/1000||0);this.last=ts;
  this.fps+=(1/Math.max(dt,0.001)-this.fps)*0.05;
  if(this.qSetting==='auto'&&this.running&&!this.paused){if(this.fps<38){this.lowT+=dt;if(this.lowT>3){this.lowT=0;if(this.quality==='high'){this.quality='medium';this.particles.setQuality('medium')}else if(this.quality==='medium'){this.quality='low';this.particles.setQuality('low')}this.resize()}}else this.lowT=0}
  if(!this.paused){const sp=this.cfg.speed||1;this.acc+=dt*sp*this.slowmo;let n=0;while(this.acc>=STEP&&n<5){if(this.running||this.menuBg)this.step(STEP);this.acc-=STEP;n++}if(n===5)this.acc=0}
  this.render();requestAnimationFrame(t=>this.frame(t))
 }
 camUpdate(dt){
  const A=this.arena;if(!A)return;const cam=this.cam;
  const live=this.fighters.filter(f=>f.alive||f.state==='dead');let tx=A.W/2,ty=A.H/2,tz=this.vh/A.H;
  const zFull=Math.min(this.vw/A.W,this.vh/A.H);
  if(live.length&&this.running){let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;const al=live.filter(f=>f.alive);for(const f of (al.length?al:live)){x0=Math.min(x0,f.P[0].x);x1=Math.max(x1,f.P[0].x);y0=Math.min(y0,f.P[2].y);y1=Math.max(y1,f.P[10].y)}
   tx=(x0+x1)/2;ty=Math.min((y0+y1)/2,A.H);const rw=(x1-x0)+620,rh=(y1-y0)+420;tz=Math.min(this.vw/rw,this.vh/rh);tz=U.clamp(tz,zFull,zFull*2.0);
   const vh=this.vh/tz;ty=U.clamp(ty,vh/2-60,A.H-vh/2+60)}
  else tz=zFull;
  if(this.camSnap){cam.x=tx;cam.y=ty;cam.z=tz;this.camSnap=false}
  const k=1-Math.exp(-dt*5);cam.x+=(tx-cam.x)*k;cam.y+=(ty-cam.y)*k;cam.z+=(tz-cam.z)*k;
  const vw=this.vw/cam.z;cam.x=U.clamp(cam.x,Math.min(vw/2,A.W/2),Math.max(A.W-vw/2,A.W/2))}
 render(){
  const ctx=this.ctx,dpr=this.dpr,w=this.vw,h=this.vh;ctx.setTransform(dpr,0,0,dpr,0,0);
  if(!this.arena){ctx.fillStyle='#10141c';ctx.fillRect(0,0,w,h);return}
  this.camUpdate(1/60);
  const A=this.arena,cam=this.cam;
  A.drawBG(ctx,w,h,cam.x,this.time,cam.z);
  ctx.save();
  const sx=this.shakeAmt?U.rand(-1,1)*this.shakeAmt:0,sy=this.shakeAmt?U.rand(-1,1)*this.shakeAmt:0;
  ctx.translate(w/2+sx,h/2+sy);ctx.scale(cam.z,cam.z);ctx.translate(-cam.x,-cam.y);
  A.drawSolids(ctx,this.time);if(this.m&&this.m.mode==='football'&&this.running)this.drawFootball(ctx);
  this.items.draw(ctx);
  const order=this.fighters.slice().sort((a,b)=>(a.alive?1:0)-(b.alive?1:0));
  for(const f of order)f.draw(ctx,this);
  this.proj.draw(ctx);
  this.particles.draw(ctx);
  // training dummy marker etc.
  ctx.restore();
  if(this.koFlash>0){ctx.fillStyle='rgba(255,255,255,'+(this.koFlash*0.5)+')';ctx.fillRect(0,0,w,h)}
  if(this.running&&this.m)this.drawHUD(ctx,w,h)
 }
 // ---------- HUD ----------
 drawHUD(ctx,w,h){
  const m=this.m,F=this.fighters,u=Math.min(w/1100,h/620,1.25)*(w<700?1.15:1);
  ctx.save();ctx.textBaseline='middle';
  const bar=(x,y,bw,bh,v,col,back,flip)=>{ctx.fillStyle=back||'rgba(0,0,0,.55)';ctx.fillRect(x,y,bw,bh);const ww=bw*U.clamp(v,0,1);ctx.fillStyle=col;ctx.fillRect(flip?x+bw-ww:x,y,ww,bh)};
  const list=F.filter(f=>f.team!==undefined);
  const waves=m.mode==='survival'||m.mode==='zombie';const two=!waves&&list.length===2;
  const show=waves?list.filter(f=>f.team===1):list;
  const bw=two?Math.min(w*0.36,480*u):Math.min((w-20)/Math.max(show.length,2),230*u),bh=22*u;
  show.forEach((f,i)=>{
   let x,y=14*u,flip=false;
   if(two){flip=i===1;x=flip?w-bw-14*u:14*u}else{x=10+i*(bw+6*u);if(x+bw>w-6)return}
   if(waves&&show.length===1)x=14*u;
   const r=f.hp/f.maxHp;let gh=this.hudHp[f.id];if(gh===undefined||gh<r)gh=r;else gh=Math.max(r,gh-0.4/60);this.hudHp[f.id]=gh;
   bar(x,y,bw,bh,gh,'#fff',null,flip);bar(x,y,bw,bh,r,r>0.5?'#46d36a':r>0.25?'#f0c030':'#e8453c',null,flip);
   ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=2;ctx.strokeRect(x,y,bw,bh);
   ctx.font='bold '+13*u+'px Arial';ctx.fillStyle='#fff';ctx.textAlign=flip?'right':'left';ctx.fillText(f.name,flip?x+bw:x,y+bh+11*u);
   bar(x,y+bh+22*u,bw*0.7,6*u,f.stamina/f.maxSt,'#4ac3ff',null,flip&&false);
   // energy + ability slots
   const ey=y+bh+31*u;bar(x,ey,bw*0.7,7*u,f.energy/100,f.energy>=100?'#ffd24a':'#c070ff');
   ctx.font=(10*u)+'px Arial';const ab=f.def.ab;const keys=['n','f','a','u'];let ax=x;
   keys.forEach(k=>{const a=ab[k];const cd=f.cd[a.id]||0;const ok=f.energy>=a.cost&&cd<=0;ctx.fillStyle=ok?'rgba(255,255,255,.85)':'rgba(255,255,255,.25)';ctx.textAlign='left';const lab=(k==='n'?'●':k==='f'?'→':k==='a'?'↑':'↓')+a.name;const tw=ctx.measureText(lab).width;if(ax+tw>x+bw){return}ctx.fillText(lab,ax,ey+17*u);ax+=tw+8*u;if(cd>0){ctx.fillStyle='rgba(255,100,100,.8)';ctx.fillText(Math.ceil(cd)+'s',ax-6*u,ey+17*u)}});
   if(f.main){ctx.fillStyle=SD.RARITY[f.main.rarity].color;ctx.font='bold '+11*u+'px Arial';ctx.textAlign=flip?'right':'left';ctx.fillText(f.main.def.name+(f.main.def.ammo?' ('+Math.floor(f.main.ammo)+')':''),flip?x+bw:x,ey+30*u)}
   if(f.combo>=2&&f.human){ctx.fillStyle='#ffd24a';ctx.font='bold '+22*u+'px Arial';ctx.textAlign=flip?'right':'left';ctx.fillText(f.combo+' HIT',flip?x+bw:x,ey+54*u)}
  });
  // center: timer, round, arena
  ctx.textAlign='center';
  if(m.mode==='football'){ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(w/2-90*u,6*u,180*u,50*u);ctx.font='bold '+30*u+'px Arial';ctx.fillStyle='#fff';ctx.fillText((m.score[1]||0)+' : '+(m.score[2]||0),w/2,24*u);ctx.font='bold '+13*u+'px Arial';ctx.fillStyle='#ffd24a';ctx.fillText(m.timer>0?Math.ceil(m.timer)+' с':'',w/2,46*u)}
  else if(two){ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(w/2-34*u,10*u,68*u,34*u);ctx.fillStyle='#fff';ctx.font='bold '+24*u+'px Arial';ctx.fillText(m.timer>0?Math.ceil(m.timer):'∞',w/2,28*u);}
  ctx.font=(11*u)+'px Arial';ctx.fillStyle='rgba(255,255,255,.85)';
  let info=SD.MODE_NAMES[m.mode]+' · '+this.arena.def.name;
  if(m.mode==='tournament')info+=' · Бой '+(m.bi+1)+'/7';
  if(waves)info=(m.mode==='zombie'?'Зомби · ':'')+'Волна '+m.wave+' · Убито '+m.kills+' · Рекорд '+(this.save.data.records[m.mode==='zombie'?'zombieBest':'survivalBest']||0);
  if(m.mode==='football')info='Футбол · до '+this.cfg.goals+' голов · '+this.arena.def.name;
  if(m.roundsToWin<50&&m.mode!=='training'){const t1=m.wins[1]||0,t2=m.wins[2]||0;info+=' · Раунд '+m.round}
  ctx.fillText(info,w/2,(two||show.length<=1?56:116)*u);
  if(m.roundsToWin<50&&m.mode!=='training'&&two){const pip=(x,n,flip)=>{for(let i=0;i<m.roundsToWin;i++){ctx.fillStyle=i<n?'#ffd24a':'rgba(255,255,255,.25)';ctx.beginPath();ctx.arc(x+(flip?-1:1)*i*18*u,0,6*u,0,6.3);ctx.fill()}};
   ctx.save();ctx.translate(0,82*u);pip(14*u+8*u,m.wins[F[0].team]||0,false);pip(w-14*u-8*u,m.wins[F[1].team]||0,true);ctx.restore()}
  // training stats
  if(m.mode==='training'){const T=this.train;const now=this.time;T.dps=T.dps.filter(d=>now-d[0]<3);const dps=T.dps.reduce((s,d)=>s+d[1],0)/3;
   ctx.textAlign='left';ctx.font='bold '+13*u+'px Arial';ctx.fillStyle='#fff';const lines=['Последний урон: '+T.last.toFixed(1),'Всего урона: '+T.total.toFixed(0),'Попаданий: '+T.hits,'DPS (3с): '+dps.toFixed(1),'Комбо: '+T.combo];lines.forEach((l,i)=>ctx.fillText(l,14*u,(h*0.42)+i*17*u))}
  // banners
  if(m.state==='intro'){const c=3-Math.floor(m.t/0.8);if(c>=1){ctx.textAlign='center';ctx.font='bold '+110*u+'px Arial';ctx.lineWidth=8*u;ctx.strokeStyle='#000';ctx.strokeText(c,w/2,h*0.4);ctx.fillStyle='#fff';ctx.fillText(c,w/2,h*0.4)}}
  if(m.banner&&m.bannerT<1.6&&(m.state==='fight'||m.state==='roundend')){const k=Math.min(1,m.bannerT*5);ctx.globalAlpha=Math.min(1,(1.6-m.bannerT)*3);ctx.textAlign='center';ctx.font='bold '+(70+30*(1-k))*u+'px Arial';ctx.lineWidth=8*u;ctx.strokeStyle='#000';ctx.strokeText(m.banner,w/2,h*0.38);ctx.fillStyle=m.banner==='FIGHT!'?'#ffd24a':'#ff4a4a';ctx.fillText(m.banner,w/2,h*0.38);ctx.globalAlpha=1}
  if(m.state==='roundend'&&m.winTeam!==null&&m.winTeam!==undefined){const wf=F.find(f=>f.team===m.winTeam);if(wf){ctx.textAlign='center';ctx.font='bold '+28*u+'px Arial';ctx.lineWidth=5*u;ctx.strokeStyle='#000';ctx.strokeText(wf.name+' побеждает',w/2,h*0.5);ctx.fillStyle='#fff';ctx.fillText(wf.name+' побеждает',w/2,h*0.5)}}
  ctx.restore()}
}
SD.Game=Game;
})(window.SD);
