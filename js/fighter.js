'use strict';
// CharacterController + RagdollController + pose animation (SpriteAnimationController equivalent for rigs).
(function(SD){
const U=SD.U,P=SD.Phys,D=Math.PI/180;
const FIELDS=['lean','head','shL','elL','shR','elR','hpL','knL','hpR','knR','wa','rot'];
const STANCE={lean:8,head:-4,shL:40,elL:95,shR:55,elR:85,hpL:-14,knL:12,hpR:24,knR:30,wa:-40,rot:0};
SD.STANCE=STANCE;SD.POSE_FIELDS=FIELDS;
const BONES=[[0,1,'torso'],[1,2,'headD'],[1,3,'ua'],[3,4,'fa'],[1,5,'ua'],[5,6,'fa'],[0,7,'th'],[7,8,'sh'],[0,9,'th'],[9,10,'sh']];
const KBASE=[1,0.9,0.7,0.6,0.7,0.6,0.7,0.7,0.8,0.7,0.85];
const GRAV=2000;
let UID=1;
const NOIN={x:0,jump:false,jumpHeld:false,down:false,light:false,heavy:false,heavyHeld:false,lightHeld:false,block:false,ability:false,throw:false,interact:false};
SD.NOIN=NOIN;

function ik(sx,sy,tx,ty,a,b,bend){let dx=tx-sx,dy=ty-sy;let d=Math.hypot(dx,dy);const maxd=a+b-0.5;if(d>maxd){dx*=maxd/d;dy*=maxd/d;d=maxd}if(d<1e-3)d=1e-3;
 const ca=(a*a+d*d-b*b)/(2*a*d);const ang=Math.acos(U.clamp(ca,-1,1))*bend;const base=Math.atan2(dy,dx);
 const ex=sx+Math.cos(base+ang)*a,ey=sy+Math.sin(base+ang)*a;return [ex,ey,sx+dx,sy+dy]}

class Fighter{
 constructor(game,charId,o={}){
  this.game=game;this.id=UID++;this.def=SD.CHARS[charId]||o.customDef;this.cid=charId;this.name=o.name||this.def.name;this.team=o.team===undefined?this.id:o.team;
  this.ctrl=o.ctrl||null;this.isBot=!!o.bot;this.slot=o.slot||0;this.human=!!o.human;
  const d=this.def,s=d.scale*(o.scale||1);this.s=s;
  this.L={torso:46*s,headD:24*s,headR:11*s,ua:26*s,fa:25*s,th:32*s,sh:32*s};
  this.color=o.color||d.color||(SD.RigImporter.rigs[d.rig+' SF.nodes']?SD.RigImporter.toProfile(SD.RigImporter.rigs[d.rig+' SF.nodes']).color:'#888');
  if(this.color==='#000000')this.color='#1c1c1c';
  this.lw=8*s;
  this.maxHp=Math.round(d.hp*(o.hpMult||1));this.hp=this.maxHp;this.maxSt=d.stamina;this.stamina=this.maxSt;this.energy=0;this.poise=100;
  this.P=[];for(let i=0;i<11;i++)this.P.push({x:0,y:0,px:0,py:0,drop:0});
  this.T=[];this.Tp=[];for(let i=0;i<11;i++){this.T.push([0,0]);this.Tp.push([0,0])}
  this.limp=new Array(11).fill(0);
  this.root={x:0,y:0,vx:0,vy:0,ground:null,coyote:0};this.footOff=64*s;this.face=1;this.alive=true;this.state='free';this.stateT=0;this.w=1;
  this.pose=Object.assign({},STANCE);this.phase=0;this.runT=0;this.crouching=false;this.blocking=false;
  this.in=NOIN;this.buf={light:0,heavy:0,jump:0,ability:0,throw:0,interact:0,blockP:0};this.prevBlock=false;
  this.main=null;this.off=null;this.fx={};this.cd={};this.timers={};
  this.invuln=0;this.flash=0;this.stun=0;this.parryT=0;this.counterT=0;this.rollCd=0;this.dropT=0;this.jumps=0;this.downT=0;this.hitT=0;this.castT=0;
  this.move=null;this.moveT=0;this.hitSet=new Set();this.chain=[];this.chainT=0;this.charge=0;this.holdDone=false;this.firedEv=0;this.lungeDone=false;this.hitActive=false;this.lastHitConfirm=false;
  this.stats={hits:0,damage:0,taken:0,kills:0,maxCombo:0,disarms:0,parries:0};this.combo=0;this.comboT=0;this.lastAttacker=null;
  this.hpMultKb=1;this.chains=[];this.trail=[];this.gripStrain=0;this.dust=0;this.wasGround=true;this.spawnT=0;this.ringOut=false;this.pickedTypes=new Set();
  this.dmgMul=1;this.spdMul=1;this.atkSpd=1;this.armor=0;this.ghost=0;this.maxcombo=0;
  this.hooks=[];this.setupChains();
 }
 setupChains(){const a=this.def.acc||{};this.chains=[];const mk=(anchor,n,seg,w0,w1,col,k)=>({anchor,n,seg:seg*this.s,w0:w0*this.s,w1:w1*this.s,col,k,nodes:[]});
  if(a.cape)this.chains.push(mk('chest',7,13,18,4,a.cape,'cape'));
  if(a.scarf)this.chains.push(mk('head',6,10,6,2,a.scarf,'scarf'));
  if(a.hair)this.chains.push(mk('head',4,8,5,1.5,a.hair,'hair'));
  this.chains.forEach(c=>{for(let i=0;i<c.n;i++)c.nodes.push({x:0,y:0,px:0,py:0})})}
 // ------------- placement / reset -------------
 place(x,y,face){this.face=face;this.root.x=x;this.root.y=y;this.root.vx=this.root.vy=0;this.root.ground=null;this.state='free';this.w=1;this.alive=true;this.hp=this.maxHp;this.stamina=this.maxSt;this.poise=100;this.fx={};this.invuln=0.5;this.move=null;this.stun=0;this.ringOut=false;this.combo=0;
  const pose=this.pose;const fk=this.fk(pose,x,y);for(let i=0;i<11;i++){const p=this.P[i];p.x=p.px=fk[i][0];p.y=p.py=fk[i][1];this.T[i]=fk[i].slice();this.Tp[i]=fk[i].slice()}
  this.chains.forEach(c=>c.nodes.forEach(n=>{n.x=n.px=x;n.y=n.py=y}))}
 // ------------- kinematics -------------
 fk(p,ox,oy){const f=this.face,L=this.L,out=new Array(11);const dv=a=>[Math.sin(a*D)*f,Math.cos(a*D)],uv=a=>[Math.sin(a*D)*f,-Math.cos(a*D)];
  const pel=[0,0];let v=uv(p.lean);const ch=[v[0]*L.torso,v[1]*L.torso];v=uv(p.lean+p.head);const hd=[ch[0]+v[0]*L.headD,ch[1]+v[1]*L.headD];
  const arm=(sh,el)=>{let a=dv(sh);const e=[ch[0]+a[0]*L.ua,ch[1]+a[1]*L.ua];a=dv(sh+el);return [e,[e[0]+a[0]*L.fa,e[1]+a[1]*L.fa]]};
  const leg=(hp,kn)=>{let a=dv(hp);const k=[a[0]*L.th,a[1]*L.th];a=dv(hp-kn);return [k,[k[0]+a[0]*L.sh,k[1]+a[1]*L.sh]]};
  const aL=arm(p.shL,p.elL),aR=arm(p.shR,p.elR),lL=leg(p.hpL,p.knL),lR=leg(p.hpR,p.knR);
  const raw=[pel,ch,hd,aL[0],aL[1],aR[0],aR[1],lL[0],lL[1],lR[0],lR[1]];
  const r=p.rot*D*f,c=Math.cos(r),s=Math.sin(r);
  for(let i=0;i<11;i++){const q=raw[i];out[i]=r?[ox+q[0]*c-q[1]*s,oy+q[0]*s+q[1]*c]:[ox+q[0],oy+q[1]]}
  return out}
 calcFootOff(p){const f=this.fk(p,0,0);return Math.max(f[8][1],f[10][1])+3}
 get x(){return this.P[0].x}get y(){return this.P[0].y}
 get cx(){return this.P[1].x}get cy(){return this.P[1].y}
 get grounded(){return !!this.root.ground&&this.w>0.15}
 get airborne(){return !this.root.ground||this.w<=0.15}
 get bodyUp(){return (this.L.torso+this.L.headD+this.L.headR)*0.98}
 hurtParts(){const P=this.P,s=this.s;return [{t:'head',x:P[2].x,y:P[2].y,r:this.L.headR+3},{t:'torso',ax:P[0].x,ay:P[0].y,bx:P[1].x,by:P[1].y,r:11*s},
  {t:'arm',ax:P[1].x,ay:P[1].y,bx:P[3].x,by:P[3].y,r:6*s},{t:'arm',ax:P[3].x,ay:P[3].y,bx:P[4].x,by:P[4].y,r:6*s},{t:'arm',ax:P[1].x,ay:P[1].y,bx:P[5].x,by:P[5].y,r:6*s},{t:'arm',ax:P[5].x,ay:P[5].y,bx:P[6].x,by:P[6].y,r:7*s},
  {t:'leg',ax:P[0].x,ay:P[0].y,bx:P[7].x,by:P[7].y,r:7*s},{t:'leg',ax:P[7].x,ay:P[7].y,bx:P[8].x,by:P[8].y,r:6*s},{t:'leg',ax:P[0].x,ay:P[0].y,bx:P[9].x,by:P[9].y,r:7*s},{t:'leg',ax:P[9].x,ay:P[9].y,bx:P[10].x,by:P[10].y,r:6*s}]}
 // ------------- helpers -------------
 hasFx(k){return (this.fx[k]||0)>0}
 setFx(k,t){this.fx[k]=Math.max(this.fx[k]||0,t)}
 get speedMul(){let m=this.def.speed*this.spdMul;if(this.hasFx('haste'))m*=1.5;if(this.hasFx('swift'))m*=1.4;if(this.hasFx('slow'))m*=0.55;if(this.hasFx('form'))m*=1.25;return m}
 get dmgMult(){let m=this.def.power*this.dmgMul;if(this.hasFx('empower'))m*=1.35;if(this.hasFx('rage'))m*=1.2;if(this.hasFx('form'))m*=1.25;if(this.hasFx('frenzy'))m*=1.3;if(this.hasFx('power'))m*=1.3;return m}
 get atkSpeed(){let m=this.atkSpd;if(this.hasFx('haste'))m*=1.3;if(this.hasFx('rage'))m*=1.4;if(this.hasFx('form'))m*=1.2;if(this.hasFx('rhythm'))m*=1.15;if(this.hasFx('slow'))m*=0.8;const w=this.main;if(w&&w.def.style!=='none')m*=w.def.speed*SD.RARITY[w.rarity].spd;return m}
 get incoming(){let m=1-this.def.def;if(this.hasFx('iron'))m*=0.5;if(this.hasFx('form'))m*=0.85;return m}
 get stunned(){return this.stun>0}
 addEnergy(v){this.energy=Math.min(100,this.energy+v)}
 impulse(i,ix,iy){P.impulse(this.P[i],ix,iy);this.limp[i]=Math.min(1,this.limp[i]+0.8)}
 // ------------- main update -------------
 update(dt,game){
  const A=game.arena,root=this.root;
  for(const k in this.fx){this.fx[k]-=dt;if(this.fx[k]<=0)delete this.fx[k]}
  for(const k in this.cd)if(this.cd[k]>0)this.cd[k]-=dt;
  this.invuln-=dt;this.flash-=dt;this.stun-=dt;this.parryT-=dt;this.counterT-=dt;this.rollCd-=dt;this.dropT-=dt;this.comboT-=dt;this.spawnT+=dt;
  if(this.comboT<=0)this.combo=0;
  for(let i=0;i<11;i++)if(this.limp[i]>0)this.limp[i]=Math.max(0,this.limp[i]-dt*2.5);
  for(const k in this.buf)this.buf[k]-=dt;
  if(this.gripStrain>0)this.gripStrain=Math.max(0,this.gripStrain-dt*60);
  // status effects
  if(this.alive){
   if(this.hasFx('burn')){this.dotT=(this.dotT||0)-dt;if(this.dotT<=0){this.dotT=0.5;game.combat.dot(this,3,'#ff8a22')}if(Math.random()<0.3)game.particles.add({type:'spark',x:this.P[1].x+U.rand(-8,8),y:this.P[1].y+U.rand(-20,10),vy:-80,life:0.4,size:4,color:'#ff9a30'})}
   if(this.hasFx('poison')){this.dotT2=(this.dotT2||0)-dt;if(this.dotT2<=0){this.dotT2=0.6;game.combat.dot(this,2,'#7f3'); }}
   if(this.hasFx('regen'))this.hp=Math.min(this.maxHp,this.hp+8*dt);
   const blk=this.blocking;this.stamina=Math.min(this.maxSt,this.stamina+(blk?10:(this.state==='atk'?8:30))*dt);
   this.addEnergy(1.5*dt);
  }
  for(let i=this.hooks.length-1;i>=0;i--){if(this.hooks[i](this,dt,game))this.hooks.splice(i,1)}
  // input
  let inp=this.ctrl&&this.alive&&!game.inputLock?this.ctrl.poll(this,game,dt):NOIN;this.in=inp;
  if(inp.light)this.buf.light=0.22;if(inp.heavy)this.buf.heavy=0.22;if(inp.jump)this.buf.jump=0.12;if(inp.ability)this.buf.ability=0.2;if(inp.throw)this.buf.throw=0.2;if(inp.interact)this.buf.interact=0.2;
  const blockP=inp.block&&!this.prevBlock;this.prevBlock=inp.block;
  if(this.alive)this.stateMachine(dt,game,blockP);
  // control-mode root physics
  if(this.w>0.15&&this.alive)this.rootPhysics(dt,game);
  else this.syncRootToPelvis(dt);
  if(!this.alive&&this.w>0.15){this.w=Math.max(0,this.w-dt*4)}
  // pose
  this.updatePose(dt,game);
  this.stepParticles(dt,game);
  this.updateChains(dt,game);
  if(this.main)SD.Weapons.updateHeld(this,this.main,dt,game);
  if(this.off)SD.Weapons.updateHeld(this,this.off,dt,game);
  // ring out
  if(this.alive&&this.P[0].y>A.killY){this.ringOut=true;game.combat.kill(this,this.lastAttacker,'ringout')}
 }
 // ------------- state machine -------------
 stateMachine(dt,game,blockP){
  const inp=this.in,root=this.root;this.stateT+=dt;
  switch(this.state){
  case 'free':{
   this.crouching=inp.down&&this.grounded;
   this.blocking=inp.block&&this.grounded&&this.stun<=0&&!!(this.stamina>0);
   if(blockP&&this.grounded&&this.stun<=0){
     if(inp.x*this.face<0&&this.rollCd<=0&&this.stamina>=10){this.startDodge();return}
     this.parryT=0.16}
   this.autoFace(game);
   this.locomotion(dt,game);
   // actions
   if(this.stun>0)break;
   if(this.buf.interact>0){this.buf.interact=0;game.items.interact(this)}
   if(this.buf.throw>0){this.buf.throw=0;SD.Weapons.throwHeld(this,game)}
   if(this.buf.ability>0&&SD.Abilities.tryCast(this,game)){this.buf.ability=0;break}
   if(inp.down&&inp.x!==0&&this.grounded&&this.rollCd<=0&&this.stamina>=15&&(this.buf.light<=0&&this.buf.heavy<=0)&&!this.blocking){this.startRoll();break}
   if(this.buf.heavy>0){const m=SD.Moves.pick(this,'heavy');if(m){this.buf.heavy=0;this.startMove(m);break}}
   if(this.buf.light>0){const m=SD.Moves.pick(this,'light');if(m){this.buf.light=0;this.startMove(m);break}}
   break}
  case 'atk':this.updateAttack(dt,game);break;
  case 'cast':this.updateCast(dt,game);break;
  case 'roll':this.moveGeneric(dt,this.rollDir*(this.state==='roll'?500:0),game);if(this.stateT>0.42)this.toFree();break;
  case 'dodge':if(this.stateT>0.28)this.toFree();break;
  case 'hit':{this.w=U.approach(this.w,0.6,dt*6);this.hitT-=dt;this.root.vx*=Math.pow(0.9,dt*60);if(this.hitT<=0){this.toFree()}break}
  case 'stunned':this.w=U.approach(this.w,0.5,dt*5);if(this.stateT>this.stunDur)this.toFree();break;
  case 'down':{this.downT-=dt;
    const p=this.P[0],sp=Math.hypot(p.x-p.px,p.y-p.py)/dt;
    const onG=this.groundedRag;
    if(this.downT<=0&&onG&&sp<140)this.startGetUp();
    else if(this.downT<-3)this.startGetUp();break}
  case 'getup':{this.w=Math.min(1,this.stateT/0.6);if(this.stateT>0.65){this.toFree();this.invuln=Math.max(this.invuln,0.35)}break}
  case 'victory':this.autoFace(game);this.locomotion(dt,game,true);break;
  }
 }
 toFree(){const rr=((this.pose.rot%360)+360)%360;this.pose.rot=rr>180?rr-360:rr;this.state='free';this.stateT=0;this.move=null;this.hitActive=false;this.w=Math.max(this.w,0.6);this.charge=0}
 autoFace(game){if(this.airborne&&this.root.vy<-200&&false)return;const e=game.nearestEnemy(this);if(e&&Math.abs(e.P[0].x-this.P[0].x)>14)this.face=e.P[0].x>this.P[0].x?1:-1;else if(!e&&this.in.x)this.face=U.sign(this.in.x)}
 locomotion(dt,game,still){
  const r=this.root,inp=this.in,A=game.arena;
  let spd=250*this.speedMul;const sf=r.ground&&r.ground.fric!==undefined?r.ground.fric:1;
  const grounded=this.grounded;
  if(this.blocking)spd*=0.35;if(this.crouching)spd*=0.4;
  const mx=still||this.stun>0?0:inp.x;
  const fwd=mx*this.face>0;
  if(fwd&&grounded&&!this.blocking&&!this.crouching)this.runT=Math.min(1,this.runT+dt*2.5);else if(!mx||!fwd)this.runT=Math.max(0,this.runT-dt*3);
  this.running=this.runT>0.75;
  if(this.running)spd*=1.5;else if(mx&&!fwd)spd*=0.8;
  const tvx=mx*spd;
  const acc=grounded?Math.max(500,3200*sf):1500;
  if(mx!==0)r.vx=U.approach(r.vx,tvx,acc*dt);else r.vx=U.approach(r.vx,0,grounded?Math.max(250,2600*sf)*dt:150*dt);
  // jump
  r.coyote-=dt;if(grounded)r.coyote=0.1,this.jumps=0;
  if(this.buf.jump>0&&!still&&this.stun<=0){
   if(this.crouching&&r.ground&&r.ground.oneway){this.dropT=0.28;this.buf.jump=0;r.ground=null;r.vy=100}
   else if(r.coyote>0){this.doJump(game);this.buf.jump=0}
   else if(this.def.doubleJump&&this.jumps<1){this.jumps=1;this.doJump(game,true);this.buf.jump=0}}
  if(!inp.jumpHeld&&r.vy<-350&&!this.jumpCut&&this.jumpActive){r.vy*=0.55;this.jumpCut=true}
 }
 doJump(game,air){const r=this.root;r.vy=-880*this.def.jump*(this.hasFx('swift')?1.12:1)*(game.cfg&&game.cfg.gravity?Math.sqrt(game.cfg.gravity):1);r.ground=null;r.coyote=0;this.jumpCut=false;this.jumpActive=true;game.audio.play('jump',air?1.4:1);game.particles.dust(r.x,r.y+this.footOff,air?4:7);if(air)game.particles.ring(r.x,r.y+30,30,'#fff',0.25,2);this.stamina=Math.max(0,this.stamina-3)}
 moveGeneric(dt,tvx,game){this.root.vx=U.approach(this.root.vx,tvx,4000*dt)}
 startRoll(){this.state='roll';this.stateT=0;this.rollDir=U.sign(this.in.x);this.rollCd=0.9;this.invuln=0.34;this.stamina-=15;this.root.vx=this.rollDir*500;this.game.audio.play('swing',0.7);this.game.particles.dust(this.root.x,this.root.y+this.footOff,5)}
 startDodge(){this.state='dodge';this.stateT=0;this.rollCd=0.7;this.invuln=0.24;this.stamina-=10;this.root.vx=-this.face*380;this.game.audio.play('swing',1.3);this.game.particles.dust(this.root.x,this.root.y+this.footOff,4)}
 // ------------- attacks -------------
 startMove(m){
  const now=this.game.time;
  if(this.chainT<now-0.9)this.chain=[];
  this.chain.push(m.kind||'x');if(this.chain.length>4)this.chain.shift();
  this.move=m;this.moveT=0;this.state='atk';this.stateT=0;this.hitSet=new Set();this.charge=0;this.holdDone=!(m.hold!==undefined);this.firedEv=0;this.lungeDone=false;this.hitActive=false;this.lastHitConfirm=false;
  this.stamina=Math.max(0,this.stamina-(m.stam||5)*(this.main?this.main.def.stam:1));
  this.holdKey=m.kind==='heavy'?'heavyHeld':'lightHeld';
  this.counter=this.counterT>0;if(this.counter)this.counterT=0;
  this.game.audio.play(m.snd||(this.main?(this.main.def.style==='smash'?'swing':'swing'):'swing'),m.kind==='heavy'?0.8:1.1);
  if(m.air)this.jumpActive=false;
 }
 updateAttack(dt,game){
  const m=this.move,inp=this.in;
  const spd=this.atkSpeed*(m.spd||1)*(this.counter?1.25:1);
  if(!this.holdDone&&this.moveT>=m.hold){this.autoFace(game);if(inp[this.holdKey]&&this.charge<1&&!this.stun>0){this.charge=Math.min(1,this.charge+dt/(m.chargeT||0.8));this.moveT=m.hold;this.chargeFx(game);return}else this.holdDone=true;}
  const prev=this.moveT;this.moveT+=dt*spd;
  if(!this.lungeDone&&this.moveT>=(m.lungeAt||0)){this.lungeDone=true;if(m.lunge){this.root.vx=this.face*m.lunge*(this.hasFx('slow')?0.6:1)}if(m.vy){this.root.vy=m.vy;this.root.ground=null}}
  this.hitActive=this.moveT>=m.active[0]&&this.moveT<=m.active[1];
  if(m.drag!==undefined&&this.root.ground)this.root.vx*=Math.pow(m.drag,dt*60);
  if(m.diveDown&&this.hitActive&&!this.root.ground){this.root.vy=Math.max(this.root.vy,m.diveDown)}
  if(m.fire){while(this.firedEv<m.fire.length&&this.moveT>=m.fire[this.firedEv].t){const ev=m.fire[this.firedEv++];SD.Weapons.fireEvent(this,ev,game)}}
  if(m.onLand&&this.root.ground&&this.moveT>0.15&&!this.landed){this.landed=true;m.onLand(this,game)}
  // chaining / cancels
  const cw=m.cancel!==undefined?m.cancel:m.dur*0.6;
  if(this.moveT>=cw){
   if(this.buf.heavy>0){const n=SD.Moves.pick(this,'heavy',true);if(n){this.buf.heavy=0;this.chainT=game.time;this.startMove(n);return}}
   if(this.buf.light>0){const n=SD.Moves.pick(this,'light',true);if(n){this.buf.light=0;this.chainT=game.time;this.startMove(n);return}}
   if(this.buf.ability>0&&(this.lastHitConfirm||this.moveT>m.active[1])&&SD.Abilities.tryCast(this,game)){this.buf.ability=0;return}
   if(this.moveT>m.active[1]){
    if(inp.block&&this.grounded&&this.stamina>0){this.toFree();this.parryT=0;return}
    if(this.buf.jump>0&&this.grounded){this.toFree();return}
    if(inp.down&&inp.x&&this.rollCd<=0&&this.stamina>=15&&this.grounded){this.toFree();this.startRoll();return}}}
  if(this.moveT>=m.dur){this.chainT=game.time;this.landed=false;this.toFree();return}
  this.autoFaceLight(game);
 }
 autoFaceLight(){}
 chargeFx(game){if(Math.random()<0.5)game.particles.add({type:'spark',x:this.P[6].x+U.rand(-12,12),y:this.P[6].y+U.rand(-12,12),vy:-40,life:0.3,size:3,color:this.charge>0.9?'#ffee66':'#fff'})}
 // current hit segments for active attack
 hitters(){const m=this.move;if(!m||!this.hitActive)return null;const P=this.P,out=[];const r=m.hitR||11*this.s;
  for(const h of m.hitter.split('+')){
   if(h==='handR')out.push({x:P[6].x,y:P[6].y,px:P[6].px,py:P[6].py,r});
   else if(h==='handL')out.push({x:P[4].x,y:P[4].y,px:P[4].px,py:P[4].py,r});
   else if(h==='footR')out.push({x:P[10].x,y:P[10].y,px:P[10].px,py:P[10].py,r:r*1.1});
   else if(h==='footL')out.push({x:P[8].x,y:P[8].y,px:P[8].px,py:P[8].py,r:r*1.1});
   else if(h==='kneeR')out.push({x:P[9].x,y:P[9].y,px:P[9].px,py:P[9].py,r});
   else if(h==='body')out.push({x:P[1].x,y:P[1].y,px:P[1].px,py:P[1].py,r:r*1.3},{x:P[2].x,y:P[2].y,px:P[2].px,py:P[2].py,r:r*1.1});
   else if(h==='weapon'&&this.main){const g=this.main.geom;if(g)out.push({seg:true,ax:g.bx,ay:g.by,bx:g.tx,by:g.ty,pax:g.pbx,pay:g.pby,pbx:g.ptx,pby:g.pty,r:(this.main.def.w||8)*0.5+4,wpn:true})}
   else if(h==='all'){for(const i of [4,6,8,10])out.push({x:P[i].x,y:P[i].y,px:P[i].px,py:P[i].py,r:r})}
  }return out}
 // ------------- abilities -------------
 startCast(ab,key,ctx){this.state='cast';this.stateT=0;this.castT=0;this.ab=ab;this.abKey=key;this.abFired=false;this.abCtx=ctx||{};this.invuln=Math.max(this.invuln,ab.invuln||0);this.move=null;this.hitActive=false}
 updateCast(dt,game){const ab=this.ab;this.castT+=dt;
  if(ab.hold&&!this.abFired){this.root.vx*=0.9;this.chargeFx(game)}
  if(!this.abFired&&this.castT>=ab.at){this.abFired=true;SD.Abilities.run(this,game,ab)}
  if(this.castT>=ab.dur){this.toFree()}}
 // ------------- hit reactions -------------
 enterRagdoll(dur){if(!this.alive)return;if(this.state==='down'){this.downT=Math.max(this.downT,dur*0.6);return}
  this.state='down';this.stateT=0;this.downT=dur;this.w=0;this.move=null;this.hitActive=false;this.groundedRag=false;
  const p=this.P[0];p.x=this.root.x;p.y=this.root.y;p.px=p.x-this.root.vx*P.DT;p.py=p.y-this.root.vy*P.DT;
  if(this.main&&Math.random()<0.45)SD.Weapons.drop(this,this.main,this.game,true);}
 startGetUp(){this.state='getup';this.stateT=0;this.w=0.2;const p=this.P[0];this.root.x=p.x;this.root.y=p.y;this.root.vx=0;this.root.vy=0;this.root.ground=null;this.poise=100;this.game.audio.play('jump',0.6);const e=this.game.nearestEnemy(this);if(e)this.face=e.P[0].x>p.x?1:-1;this.getupSnap=this.P.map(p=>[p.x,p.y])}
 die(){this.alive=false;this.state='dead';this.w=0;this.move=null;this.hitActive=false;this.blocking=false;if(this.main)SD.Weapons.drop(this,this.main,this.game,true);if(this.off)SD.Weapons.drop(this,this.off,this.game,true);const p=this.P[0];p.px=p.x-this.root.vx*P.DT;p.py=p.y-this.root.vy*P.DT}
 // ------------- root physics -------------
 rootPhysics(dt,game){
  const r=this.root,A=game.arena,hw=13*this.s;
  const g=GRAV*game.gravity*(this.hasFx('lev')?0.18:1)*(this.state==='atk'&&this.move&&this.move.floaty?0.35:1);
  r.vy=Math.min(r.vy+g*dt,1900);
  if(this.state==='atk'&&this.move&&this.move.hover&&this.moveT<this.move.hover&&!r.ground){r.vy=Math.min(r.vy,40)}
  const tfo=this.calcFootOff(this.pose);this.footOff+=(tfo-this.footOff)*Math.min(1,dt*20);
  const fo=this.footOff,up=this.bodyUp;
  // moving platform carry
  if(r.ground&&r.ground.vx){r.x+=r.ground.vx*dt}
  const oldBottom=r.y+fo;
  r.x+=r.vx*dt;
  for(const R of A.solids){if(!R.active||R.oneway)continue;
   const top=r.y-up,bot=r.y+fo;if(bot<=R.y+6||top>=R.y+R.h-2)continue;
   if(r.x+hw>R.x&&r.x-hw<R.x+R.w){ if(r.x<R.x+R.w/2){r.x=R.x-hw}else{r.x=R.x+R.w+hw}r.vx=0}}
  if(r.x<hw){r.x=hw;r.vx=Math.max(0,r.vx)}if(r.x>A.W-hw){r.x=A.W-hw;r.vx=Math.min(0,r.vx)}
  r.y+=r.vy*dt;
  let landed=null;const bot=r.y+fo;
  if(r.vy>=0){for(const R of A.solids){if(!R.active)continue;if(R.oneway&&this.dropT>0)continue;
    if(r.x<R.x-hw+5||r.x>R.x+R.w+hw-5)continue;
    if(bot>=R.y&&oldBottom<=R.y+(R.oneway?6:10)+Math.max(0,r.vy*dt)&&(R.oneway||bot<R.y+R.h)){if(!landed||R.y<landed.y)landed=R}}
   if(landed){r.y=landed.y-fo;if(r.vy>600&&!r.ground){this.landFx(game,r.vy)}r.vy=0;r.ground=landed;this.jumpActive=false}else r.ground=null}
  else{r.ground=null;const top=r.y-up;for(const R of A.solids){if(!R.active||R.oneway)continue;if(r.x>R.x-hw+4&&r.x<R.x+R.w+hw-4&&top<R.y+R.h&&top-r.vy*dt>=R.y+R.h-8){r.y=R.y+R.h+up;r.vy=0;break}}}
  // standing-still stick to ground edge tolerance
  if(!landed&&this.wasGround&&r.vy>0&&r.vy<g*dt*2){}
  this.wasGround=!!r.ground;
 }
 landFx(game,vy){game.particles.dust(this.root.x,this.root.y+this.footOff,Math.min(10,vy/150|0));game.audio.play('fall',1.4,Math.min(1,vy/1400)*0.6)}
 syncRootToPelvis(dt){const p=this.P[0],r=this.root;r.x=p.x;r.y=p.y;r.vx=(p.x-p.px)/dt;r.vy=(p.y-p.py)/dt;r.ground=null}
 // ------------- pose -------------
 desiredPose(dt,game){
  const st=this.state,r=this.root,S=STANCE,out=Object.assign({},S);const t=game.time;
  const speed=Math.abs(r.vx);
  const armed=this.main?SD.Weapons.holdPose(this.main.def):null;
  if(armed)Object.assign(out,armed);
  let rate=16;
  if(st==='atk'&&this.move){rate=70;return {pose:SD.Moves.sample(this.move,this.moveT,out),rate}}
  if(st==='cast'){rate=40;return {pose:SD.Moves.castPose(this.ab,this.castT,out,this),rate}}
  if(st==='roll'){const k=this.stateT/0.42;Object.assign(out,{lean:35,head:10,shL:80,elL:120,shR:80,elR:120,hpL:70,knL:110,hpR:70,knR:110,rot:360*k*this.rollDir*this.face*1});rate=50;return {pose:out,rate}}
  if(st==='dodge'){Object.assign(out,{lean:-22,head:-10,shL:30,elL:100,shR:20,elR:100,hpL:-30,knL:20,hpR:5,knR:25});rate=40;return {pose:out,rate}}
  if(st==='hit'||st==='stunned'){Object.assign(out,{lean:-16,head:-26,shL:-20,elL:40,shR:10,elR:50,hpL:-20,knL:20,hpR:14,knR:35});rate=30;return {pose:out,rate}}
  if(st==='getup'){const k=U.smooth(this.stateT/0.6);Object.assign(out,{lean:U.lerp(80,out.lean,k),head:0,shL:U.lerp(-40,out.shL,k),elL:U.lerp(30,out.elL,k),shR:U.lerp(-20,out.shR,k),elR:U.lerp(30,out.elR,k),hpL:U.lerp(80,out.hpL,k),knL:U.lerp(120,out.knL,k),hpR:U.lerp(100,out.hpR,k),knR:U.lerp(130,out.knR,k)});rate=18;return {pose:out,rate}}
  if(st==='victory'){const b=Math.abs(Math.sin(t*6));Object.assign(out,{lean:-4,head:-8,shL:170+Math.sin(t*10)*10,elL:5,shR:170-Math.sin(t*10)*10,elR:5,hpL:-8,knL:6,hpR:8,knR:6});out.__bob=b*14;rate=20;return {pose:out,rate}}
  const grounded=this.grounded;
  if(!grounded){
   if(r.vy<0)Object.assign(out,{lean:4,head:-6,shL:100,elL:60,shR:110,elR:60,hpL:20,knL:70,hpR:65,knR:85});
   else Object.assign(out,{lean:6,head:0,shL:100,elL:30,shR:120,elR:30,hpL:-25,knL:30,hpR:35,knR:15});
   rate=14}
  else{
   if(this.crouching)Object.assign(out,{lean:22,head:-14,hpL:42,knL:100,hpR:68,knR:105,shL:50,elL:100,shR:62,elR:90});
   else if(speed>20){const run=this.running;const f=this.face;const sgn=r.vx*f>=0?1:-1;this.phase+=dt*(run?13:9)*(speed/260)*0.9*sgn*(sgn>0?1:-1);const ph=this.phase;const A=run?48:32,sn=Math.sin(ph),cs=Math.cos(ph);
    Object.assign(out,{hpR:22+A*sn,knR:30+(run?40:22)*Math.max(0,cs),hpL:-14-A*sn,knL:12+(run?40:22)*Math.max(0,-cs),lean:run?18:10});
    if(run){out.shL=40-40*sn;out.elL=70;out.shR=armed?out.shR:40+40*sn;out.elR=armed?out.elR:70}else{out.shL+=sn*6;if(!armed)out.shR-=sn*6}}
   else{const b=Math.sin(t*3+this.id);out.lean+=b*1.2;out.shR+=b*2;out.shL-=b*2;out.kn=0}
   if(this.blocking)Object.assign(out,{lean:2,head:-4,shL:62,elL:96,shR:48,elR:100,hpL:-16,knL:14,hpR:20,knR:20});
  }
  return {pose:out,rate}
 }
 updatePose(dt,game){
  if(this.w<=0.15&&this.state!=='getup')return;
  const d=this.desiredPose(dt,game);const k=1-Math.exp(-dt*d.rate);const p=this.pose;
  for(const f of FIELDS)p[f]+=(d.pose[f]-p[f])*k;
  this.bob=d.pose.__bob||0;
 }
 // ------------- particles / ragdoll -------------
 stepParticles(dt,game){
  const A=game.arena,Pp=this.P,r=this.root;
  const w=this.alive?this.w:0;
  const origin=[r.x,r.y-(this.bob||0)];
  // IK for two-handed weapon
  const fk=this.fk(this.pose,origin[0],origin[1]);
  if(this.main&&this.main.def.two&&!this.off&&this.state!=='down'&&this.main.geom){const g=this.main.geom,wd=this.main.def,dx=Math.cos(g.ang),dy=Math.sin(g.ang);const gx=fk[6][0]+dx*wd.len*0.32,gy=fk[6][1]+dy*wd.len*0.32;const res=ik(fk[1][0],fk[1][1],gx,gy,this.L.ua,this.L.fa,this.face>0?1:-1);fk[3]=[res[0],res[1]];fk[4]=[res[2],res[3]]}
  for(let i=0;i<11;i++){this.Tp[i]=this.T[i];this.T[i]=fk[i]}
  const g=GRAV*game.gravity;const rag=w<=0.6;
  const kp=U.smooth((w-0.1)/0.35);
  const atk=this.state==='atk'&&this.hitActive;
  for(let i=0;i<11;i++){const p=Pp[i];
   if(i===0&&w>0.15){ // pelvis follows root
    p.px=p.x;p.py=p.y;const kk=Math.max(0.3,kp);p.x+=(r.x-p.x)*kk;p.y+=(r.y-p.y)*kk;p.px+=(r.x-r.vx*P.DT-p.px)*kk;p.py+=(r.y-r.vy*P.DT-p.py)*kk;continue}
   P.integrate(p,g*(1-w*0.9),this.alive?0.985:0.99);
   if(w>0.02){let k=KBASE[i]*w*(1-this.limp[i]*0.92);if(atk&&(i===4||i===6||i===8||i===10||i===5||i===9))k=Math.min(1,k*1.4);if(this.state==='getup')k*=0.9;if(i>0){k=Math.min(0.98,k);p.x+=(this.T[i][0]-p.x)*k;p.y+=(this.T[i][1]-p.y)*k;p.px+=(this.Tp[i][0]-p.px)*k;p.py+=(this.Tp[i][1]-p.py)*k}}
  }
  for(let it=0;it<3;it++){for(const [a,b,key] of BONES){const A_=Pp[a],B_=Pp[b],len=this.L[key];let dx=B_.x-A_.x,dy=B_.y-A_.y,d=Math.hypot(dx,dy)||1e-4;const diff=(d-len)/d;
    const wa=a===0&&w>0.5?0.1:0.5,wb=1-wa;A_.x+=dx*diff*wa;A_.y+=dy*diff*wa;B_.x-=dx*diff*wb;B_.y-=dy*diff*wb}
   // limit head to torso, keep limbs from folding fully in ragdoll
   if(rag){const a=Pp[2],b=Pp[0];const dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy)||1;const mn=(this.L.torso+this.L.headD)*0.35;if(d<mn){const k=(mn-d)/d*0.5;a.x+=dx*k;a.y+=dy*k;b.x-=dx*k;b.y-=dy*k}}}
  if(rag){const info={impact:0,ground:null};
   for(let i=0;i<11;i++){const p=Pp[i];p.drop=this.dropT>0?1:0;P.collideParticle(A,p,i===2?this.L.headR:4,0.18,0.12,info)}
   if(info.ground)this.groundedRag=true;else this.groundedRag=false;
   if(this.w<=0.15&&info.impact>520&&this.alive!==false)this.impactEvent(info.impact,game,info);
   else if(!this.alive&&info.impact>420)game.particles.dust(Pp[0].x,Pp[0].y+10,3);
  }
 }
 impactEvent(speed,game,info){
  if(this.impactCd>game.time)return;this.impactCd=game.time+0.25;
  const p=this.P[0];const wall=Math.abs(info.nx)>0.6;
  const dmg=Math.min(14,(speed-520)*0.012)*(wall?1.2:0.7);
  game.particles.dust(p.x,p.y+(wall?0:12),Math.min(10,speed/120|0),'#ccc');game.particles.ring(p.x,p.y+10,Math.min(70,speed/12),'#fff',0.25,2);
  game.audio.play(wall?'hitheavy':'fall',0.9,Math.min(1,speed/1400));game.shake(Math.min(8,speed/200));
  if(dmg>0.5&&this.hp>0)game.combat.dot(this,dmg,'#fff',wall?'wall':'ground');
 }
 // ------------- cape/scarf/hair chains -------------
 updateChains(dt,game){
  for(const c of this.chains){const a=c.anchor==='chest'?this.P[1]:this.P[2];const f=this.face;
   const ax=a.x-f*(c.k==='cape'?5:2)*this.s,ay=a.y+(c.k==='cape'?3:-2)*this.s;const n=c.nodes;
   n[0].x=ax;n[0].y=ay;n[0].px=ax;n[0].py=ay;
   const wind=(c.k==='hair'?-f*60:-f*30)+Math.sin(game.time*3+this.id)*20;
   for(let i=1;i<n.length;i++){const p=n[i];const vx=(p.x-p.px)*0.95,vy=(p.y-p.py)*0.95;p.px=p.x;p.py=p.y;p.x+=vx+wind*dt*dt*60;p.y+=vy+(c.k==='hair'?500:900)*dt*dt;}
   for(let it=0;it<2;it++){for(let i=1;i<n.length;i++){const a2=n[i-1],b=n[i];let dx=b.x-a2.x,dy=b.y-a2.y,d=Math.hypot(dx,dy)||1e-4;const df=(d-c.seg)/d;if(i===1){b.x-=dx*df;b.y-=dy*df}else{a2.x+=dx*df*0.5;a2.y+=dy*df*0.5;b.x-=dx*df*0.5;b.y-=dy*df*0.5}}n[0].x=ax;n[0].y=ay}
   if(game.arena&&c.k==='cape')for(let i=1;i<n.length;i++){const R=P.supportAt(game.arena,n[i].x,n[i].y-4,2);if(R&&n[i].y>R.y-1&&Math.abs(n[i].y-R.y)<25){n[i].y=R.y-1}}
  }}
 // ------------- rendering -------------
 draw(ctx,game){
  if(!this.alive&&this.state==='gone')return;
  const t=game.time,P=this.P,s=this.s,col=this.color,lw=this.lw;
  const blink=this.invuln>0&&this.state!=='roll'&&this.state!=='dodge'&&this.spawnT>0.5&&Math.floor(t*20)%2===0;
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  if(blink)ctx.globalAlpha=0.45;if(this.state==='roll'||this.state==='dodge')ctx.globalAlpha=0.7;
  if(this.ghost>0)ctx.globalAlpha=0.5;
  // shadow
  const r=this.root;if(this.grounded&&game.quality!=='low'&&r.ground){ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(r.x,r.ground.y+1,26*s,5,0,0,6.3);ctx.fill()}
  // aura for buffs
  if(game.quality!=='low'){const au=this.hasFx('form')?'#ff9a30':this.hasFx('empower')?'#ffd24a':this.hasFx('frenzy')?'#ff2a2a':this.hasFx('rage')?'#ff4a4a':this.hasFx('iron')?'#fccd03':this.hasFx('swift')||this.hasFx('haste')?'#6ff':this.hasFx('rhythm')?'#7f7':this.hasFx('power')?'#f6f':this.hasFx('slow')?'#9cf':this.hasFx('poison')?'#7c3':null;
   if(au){ctx.globalAlpha*=0.25+0.1*Math.sin(t*10);ctx.fillStyle=au;ctx.beginPath();ctx.ellipse((P[0].x+P[1].x)/2,(P[0].y+P[1].y)/2-4,40*s,70*s,0,0,6.3);ctx.fill();ctx.globalAlpha=blink?0.45:1}}
  const flash=this.flash>0;const body=flash?'#ffffff':col;const dark=flash?'#ddd':U.shade(col,-0.3);
  const seg=(pts,c,w)=>{ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);ctx.strokeStyle=c;ctx.lineWidth=w;ctx.stroke()};
  const limb=(pts,c)=>{seg(pts,'#000',lw+4);seg(pts,c,lw)};
  // chains (cape behind)
  for(const c of this.chains)if(c.k==='cape')this.drawChain(ctx,c,flash);
  // back off-hand arm + back leg
  limb([P[1],P[3],P[4]],dark);limb([P[0],P[7],P[8]],dark);
  // off item (shield)
  if(this.off)SD.Weapons.drawHeld(ctx,this,this.off,game);
  limb([P[0],P[9],P[10]],body);
  limb([P[0],P[1]],body);
  // head
  const hr=this.L.headR;ctx.beginPath();ctx.arc(P[2].x,P[2].y,hr+2,0,6.3);ctx.fillStyle='#000';ctx.fill();ctx.beginPath();ctx.arc(P[2].x,P[2].y,hr-1,0,6.3);ctx.fillStyle=body;ctx.fill();
  this.drawHead(ctx,hr,flash);
  for(const c of this.chains)if(c.k!=='cape')this.drawChain(ctx,c,flash);
  // front arm + weapon
  limb([P[1],P[5],P[6]],body);
  if(this.main)SD.Weapons.drawHeld(ctx,this,this.main,game);
  // fists
  ctx.fillStyle=flash?'#fff':col;
  if(this.hasFx('burn')||this.def.acc&&this.def.acc.fire){ctx.fillStyle='#ff8a22';ctx.globalAlpha*=0.7;ctx.beginPath();ctx.arc(P[6].x,P[6].y,6*s,0,6.3);ctx.fill()}
  ctx.restore();
 }
 drawHead(ctx,hr,flash){const P=this.P,f=this.face,h=P[2],a=this.def.acc||{};const ang=Math.atan2(P[2].y-P[1].y,P[2].x-P[1].x);
  ctx.save();ctx.translate(h.x,h.y);
  // eyes
  const ec=a.eyes||(this.color==='#1c1c1c'?'#fff':'#111');ctx.fillStyle=flash?'#000':ec;ctx.beginPath();ctx.arc(f*hr*0.45,-hr*0.1,hr*0.18,0,6.3);ctx.arc(f*hr*0.05,-hr*0.1,hr*0.15,0,6.3);ctx.fill();
  if(a.crown){ctx.fillStyle=a.crown;ctx.strokeStyle='#000';ctx.lineWidth=1.5;ctx.beginPath();const y0=-hr+1,w=hr*0.9;ctx.moveTo(-w,y0);ctx.lineTo(-w,y0-hr*0.9);ctx.lineTo(-w/2,y0-hr*0.4);ctx.lineTo(0,y0-hr*1.1);ctx.lineTo(w/2,y0-hr*0.4);ctx.lineTo(w,y0-hr*0.9);ctx.lineTo(w,y0);ctx.closePath();ctx.fill();ctx.stroke()}
  if(a.horns){ctx.fillStyle='#222';ctx.strokeStyle='#600';ctx.lineWidth=1.5;for(const sx of [-1,1]){ctx.beginPath();ctx.moveTo(sx*hr*0.5,-hr*0.8);ctx.quadraticCurveTo(sx*hr*1.3,-hr*1.3,sx*hr*0.9,-hr*2);ctx.lineTo(sx*hr*0.2,-hr*0.9);ctx.fill();ctx.stroke()}}
  ctx.restore()}
 drawChain(ctx,c,flash){const n=c.nodes;if(c.k==='cape'){ctx.beginPath();const pts=[];for(let i=0;i<n.length;i++){const k=i/(n.length-1),w=(c.w0+(c.w1-c.w0)*k)*0.5;pts.push([n[i].x,n[i].y,w])}
  ctx.moveTo(pts[0][0],pts[0][1]-pts[0][2]);for(let i=0;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]-pts[i][2]*(i?1:0.2));for(let i=pts.length-1;i>=0;i--)ctx.lineTo(pts[i][0],pts[i][1]+pts[i][2]);ctx.closePath();ctx.fillStyle=flash?'#fff':c.col;ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.stroke()}
  else{ctx.beginPath();ctx.moveTo(n[0].x,n[0].y);for(let i=1;i<n.length;i++)ctx.lineTo(n[i].x,n[i].y);ctx.strokeStyle='#000';ctx.lineWidth=c.w0+3;ctx.stroke();ctx.strokeStyle=flash?'#fff':c.col;ctx.lineWidth=c.w0;ctx.stroke()}}
}
SD.Fighter=Fighter;SD.ik=ik;

// Animated preview (menus): same pose/draw code without world physics
class PreviewFighter extends Fighter{
 constructor(game,charId,weapon,o){super(game,charId,o);this.pv=true;if(weapon&&weapon!=='none'){this.main=SD.Weapons.create(weapon,0);this.main.owner=this}this.place(0,0,1);this.pt=0}
 update(dt,game){this.pt+=dt;const t=this.pt,k=t%6;this.state='free';this.root.x=0;this.root.y=0;this.footOff=this.calcFootOff(this.pose);
  let mv=null;
  if(k>3.2&&k<4.3&&this.main!==undefined){this.state='atk';if(!this.move||this.pvk!==Math.floor(t/6)){this.pvk=Math.floor(t/6);const m=SD.Moves.pick(this,'light',false,true);this.move=m;this.moveT=0}this.moveT+=dt*this.atkSpeed;if(this.moveT>this.move.dur)this.moveT=this.move.dur*0.99}
  else if(k>4.6&&k<5.6){this.state='victory'}
  else this.move=null;
  this.root.vx=k>1.2&&k<2.6?160:0;
  const d=this.desiredPose(dt,game);const kk=1-Math.exp(-dt*d.rate);for(const f of FIELDS)this.pose[f]+=(d.pose[f]-this.pose[f])*kk;this.bob=d.pose.__bob||0;
  if(this.main)SD.Weapons.updateHeld(this,this.main,dt,game);
  const fk=this.fk(this.pose,0,-this.footOff-(this.bob||0)+0);
  for(let i=0;i<11;i++){this.P[i].px=this.P[i].x;this.P[i].py=this.P[i].y;this.P[i].x=fk[i][0];this.P[i].y=fk[i][1]}
  if(this.main&&this.main.def.two&&this.main.geom){const g=this.main.geom,wd=this.main.def;const gx=fk[6][0]+Math.cos(g.ang)*wd.len*0.32,gy=fk[6][1]+Math.sin(g.ang)*wd.len*0.32;const res=ik(fk[1][0],fk[1][1],gx,gy,this.L.ua,this.L.fa,this.face>0?1:-1);this.P[3].x=res[0];this.P[3].y=res[1];this.P[4].x=res[2];this.P[4].y=res[3]}
  this.updateChains(dt,game)}
 get grounded(){return true}
}
SD.PreviewFighter=PreviewFighter;
})(window.SD);
