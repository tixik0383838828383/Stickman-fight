'use strict';
// Combat move tables: unarmed + per-weapon-style. Pose keyframes, hit windows, cancel windows, hold/charge.
(function(SD){
const U=SD.U,S=SD.STANCE,F=SD.POSE_FIELDS;
const M=SD.Moves={cache:{}};
M.sample=(m,t,base)=>{
 let prev=Object.assign({},base),pt=0;
 for(const k of m.keys){const kt=k[0],kp=k[1];const cur=kp==='base'?Object.assign({},base):Object.assign({},prev,kp);
  if(t<=kt){const q=kt>pt?U.smooth((t-pt)/(kt-pt)):1;const o={};for(const f of F)o[f]=prev[f]+(cur[f]-prev[f])*q;return o}
  prev=cur;pt=kt}
 return prev};
const mv=(o)=>Object.assign({kind:'light',dur:0.4,active:[0.1,0.2],hitter:'handR',dmg:5,kb:[150,-40],stun:0.22,stam:4,keys:[],part:null},o);
// ---------- unarmed ----------
const UN={
 light:[mv({id:'jab',dur:0.3,active:[0.07,0.16],cancel:0.15,hitter:'handR',dmg:5,kb:[150,-40],stam:4,lunge:70,keys:[[0.05,{shR:25,elR:125,lean:3,hpR:20}],[0.1,{shR:92,elR:4,lean:15,hpR:30,knR:22,hpL:-20}],[0.19,{}],[0.3,'base']],snd:'swing'}),
  mv({id:'cross',dur:0.34,active:[0.08,0.18],cancel:0.17,hitter:'handL',dmg:6,kb:[190,-50],stam:5,lunge:80,keys:[[0.05,{shL:20,elL:125,lean:0,shR:70,elR:90}],[0.11,{shL:90,elL:5,lean:18,hpL:-4,knL:10,hpR:20}],[0.2,{}],[0.34,'base']]}),
  mv({id:'kick',dur:0.5,active:[0.14,0.26],cancel:0.3,hitter:'footR',dmg:9,kb:[330,-140],stam:8,lunge:110,stun:0.3,keys:[[0.08,{lean:-6,hpR:62,knR:85,shL:60,shR:30}],[0.16,{lean:-16,hpR:92,knR:4,shL:20,elL:90,shR:70,hpL:-10,knL:5}],[0.28,{}],[0.5,'base']]})],
 heavy:mv({id:'power',kind:'heavy',dur:0.72,hold:0.24,chargeT:0.8,active:[0.34,0.46],hitter:'handR',dmg:14,kb:[540,-210],stun:0.4,stam:14,lunge:230,lungeAt:0.3,keys:[[0.12,{shR:-35,elR:80,lean:-8,hpR:8,hpL:-28,knL:20}],[0.24,{shR:-45,elR:95,lean:-14,hpR:6,knR:40}],[0.34,{shR:100,elR:0,lean:24,hpR:42,knR:20,hpL:-6,knL:8}],[0.46,{}],[0.72,'base']],snd:'swing'}),
 launcher:mv({id:'uppercut',kind:'heavy',dur:0.62,active:[0.16,0.28],hitter:'handR',dmg:11,kb:[110,-1000],stun:0.5,stam:12,lunge:90,keys:[[0.1,{shR:-20,elR:60,lean:10,hpR:60,knR:90,hpL:-30,knL:30}],[0.2,{shR:175,elR:0,lean:-6,hpR:10,knR:8,hpL:-6,knL:6}],[0.32,{}],[0.62,'base']]}),
 dash:mv({id:'shoulder',kind:'heavy',dur:0.6,active:[0.1,0.38],hitter:'body',dmg:13,kb:[600,-230],stun:0.4,stam:14,lunge:720,lungeAt:0.05,drag:0.95,keys:[[0.08,{lean:36,head:10,shR:100,elR:40,shL:90,elL:40,hpR:45,knR:30,hpL:-35,knL:20}],[0.4,{}],[0.6,'base']]}),
 airLight:mv({id:'airkick',air:true,dur:0.45,active:[0.08,0.3],hitter:'footR',dmg:8,kb:[300,220],stam:6,keys:[[0.08,{lean:-10,hpR:80,knR:20,shR:40,hpL:-10}],[0.3,{}],[0.45,'base']]}),
 airHeavy:mv({id:'slam',kind:'heavy',air:true,dur:0.6,active:[0.15,0.45],hitter:'handR',dmg:15,kb:[320,640],stam:12,diveDown:950,keys:[[0.1,{shR:170,elR:10,shL:170,elL:10,lean:-8}],[0.2,{shR:70,elR:10,shL:70,elL:10,lean:28}],[0.45,{}],[0.6,'base']]}),
 crLight:mv({id:'lowkick',dur:0.45,active:[0.1,0.28],hitter:'footR',dmg:6,kb:[210,-60],stam:6,trip:true,lunge:80,keys:[[0.08,{lean:30,hpR:75,knR:100,hpL:30,knL:80}],[0.16,{lean:34,hpR:88,knR:3,hpL:40,knL:90}],[0.3,{}],[0.45,'base']]}),
 crHeavy:mv({id:'spin',kind:'heavy',dur:0.7,active:[0.14,0.5],hitter:'all',dmg:10,kb:[450,-260],stam:14,hitR:13,keys:[[0.1,{lean:30,shL:90,elL:0,shR:90,elR:0,hpL:50,knL:60,hpR:80,knR:80}],[0.5,{rot:360,lean:20}],[0.62,{rot:360}],[0.7,{rot:360}]]}),
 counter:mv({id:'counter',dur:0.38,active:[0.07,0.18],cancel:0.2,hitter:'handR',dmg:9,kb:[470,-130],stam:5,lunge:140,keys:[[0.04,{shR:20,elR:120,lean:4}],[0.09,{shR:95,elR:0,lean:20,hpR:40}],[0.2,{}],[0.38,'base']]})
};
// ---------- weapon style generators ----------
function wmv(def,o){const m=mv(o);m.dmg=(o.dmgMul||1)*def.dmg;m.kb=[o.kb[0]*def.kb,o.kb[1]*(o.kb[1]<0?def.kb:1)];m.hitter='weapon';m.stam=(o.stam||6);m.hitR=null;m.snd=def.snd==='blade'?'blade':def.snd;return m}
const SK=(a,b)=>a; // helper
function slash(def,big){
 const k=big?1.2:1,sl=(t)=>t*k;
 const L1=wmv(def,{id:'cut1',dur:sl(0.46),active:[sl(0.13),sl(0.25)],cancel:sl(0.26),dmgMul:1,kb:[240,-90],stam:6,lunge:90,keys:[[sl(0.1),{shR:150,elR:15,wa:-115,lean:-2,hpR:20}],[sl(0.2),{shR:88,elR:4,wa:40,lean:15,hpR:34,knR:25}],[sl(0.32),{shR:70,elR:40,wa:55}],[sl(0.46),'base']]});
 const L2=wmv(def,{id:'cut2',dur:sl(0.46),active:[sl(0.11),sl(0.23)],cancel:sl(0.25),dmgMul:1,kb:[240,-110],stam:6,lunge:90,keys:[[sl(0.09),{shR:25,elR:35,wa:80,lean:6}],[sl(0.2),{shR:100,elR:0,wa:-50,lean:14}],[sl(0.34),{}],[sl(0.46),'base']]});
 const L3=wmv(def,{id:'thrust',dur:sl(0.54),active:[sl(0.14),sl(0.27)],cancel:sl(0.3),dmgMul:1.35,kb:[420,-150],stam:8,lunge:240,stun:0.32,keys:[[sl(0.1),{shR:40,elR:100,wa:-8,lean:2}],[sl(0.2),{shR:96,elR:0,wa:0,lean:20,hpR:42,knR:30,hpL:-24}],[sl(0.34),{}],[sl(0.54),'base']]});
 return {light:[L1,L2,L3],
 heavy:wmv(def,{id:'smash',kind:'heavy',dur:sl(0.8),hold:sl(0.28),chargeT:0.7,active:[sl(0.33),sl(0.47)],dmgMul:2,kb:[560,-380],stam:14,lunge:310,lungeAt:sl(0.3),stun:0.45,keys:[[sl(0.12),{shR:165,elR:5,wa:-140,lean:-12}],[sl(0.28),{shR:175,elR:0,wa:-155,lean:-16,hpR:10}],[sl(0.4),{shR:85,elR:0,wa:65,lean:26,hpR:44,knR:30}],[sl(0.55),{}],[sl(0.8),'base']]}),
 launcher:wmv(def,{id:'rising',kind:'heavy',dur:sl(0.6),active:[sl(0.14),sl(0.28)],dmgMul:1.2,kb:[140,-980],stam:12,lunge:80,keys:[[sl(0.1),{shR:20,elR:50,wa:90,lean:10,hpR:50,knR:80}],[sl(0.22),{shR:120,elR:0,wa:-85,lean:-4}],[sl(0.34),{}],[sl(0.6),'base']]}),
 dash:wmv(def,{id:'lunge',kind:'heavy',dur:sl(0.6),active:[sl(0.14),sl(0.38)],dmgMul:1.6,kb:[600,-200],stam:13,lunge:720,lungeAt:sl(0.06),drag:0.95,keys:[[sl(0.1),{shR:45,elR:90,wa:-6,lean:30}],[sl(0.2),{shR:98,elR:0,wa:0,lean:34,hpR:50}],[sl(0.45),{}],[sl(0.6),'base']]}),
 airLight:wmv(def,{id:'aircut',air:true,dur:0.5,active:[0.12,0.3],dmgMul:1,kb:[300,200],stam:7,keys:[[0.1,{shR:150,wa:-110}],[0.22,{shR:85,wa:35,lean:18}],[0.5,'base']]}),
 airHeavy:wmv(def,{id:'divecut',kind:'heavy',air:true,dur:0.6,active:[0.15,0.45],dmgMul:1.8,kb:[300,700],stam:12,diveDown:1000,keys:[[0.1,{shR:170,elR:5,wa:-135,lean:-6}],[0.2,{shR:80,elR:0,wa:70,lean:30}],[0.45,{}],[0.6,'base']]}),
 crLight:wmv(def,{id:'lowcut',dur:0.46,active:[0.12,0.26],dmgMul:0.9,kb:[220,-60],stam:6,trip:true,lunge:70,keys:[[0.1,{lean:30,hpR:70,knR:100,shR:40,wa:70}],[0.2,{shR:80,elR:0,wa:10,lean:35}],[0.46,'base']]}),
 crHeavy:wmv(def,{id:'whirl',kind:'heavy',dur:0.7,active:[0.14,0.5],dmgMul:1.2,kb:[460,-260],stam:14,keys:[[0.1,{lean:20,shR:90,elR:0,wa:-20}],[0.5,{wa:340,rot:360,lean:20}],[0.7,{wa:340,rot:360}]]}),
 counter:wmv(def,{id:'riposte',dur:0.4,active:[0.08,0.2],cancel:0.22,dmgMul:1.3,kb:[480,-140],stam:6,lunge:180,keys:[[0.05,{shR:40,elR:100,wa:-8}],[0.12,{shR:96,elR:0,wa:0,lean:22}],[0.2,{}],[0.4,'base']]})}}
function stab(def){const b=slash(def);const T=(id,wa,dm,dur)=>wmv(def,{id,dur,active:[0.12,0.26],cancel:0.28,dmgMul:dm,kb:[300,-90],stam:6,lunge:140,keys:[[0.09,{shR:20,elR:70,wa:wa-12,lean:0,hpR:18}],[0.18,{shR:96,elR:0,wa:wa,lean:18,hpR:38,knR:25,hpL:-22}],[0.3,{}],[0.46,'base']]});
 b.light=[T('thrust1',-8,1,0.46),T('thrust2',4,1,0.46),T('thrust3',-14,1.3,0.52)];
 b.heavy=wmv(def,{id:'impale',kind:'heavy',dur:0.8,hold:0.26,chargeT:0.7,active:[0.34,0.5],dmgMul:1.9,kb:[620,-260],stam:14,lunge:480,lungeAt:0.32,stun:0.45,keys:[[0.14,{shR:10,elR:80,wa:-10,lean:-6,hpR:6,hpL:-30}],[0.26,{shR:5,elR:90,wa:-8,lean:-10}],[0.36,{shR:97,elR:0,wa:0,lean:30,hpR:48,knR:28}],[0.55,{}],[0.8,'base']]});
 return b}
function smash(def){const b=slash(def);const sh=(t)=>({t,type:'shock'});
 b.light=[wmv(def,{id:'bash1',dur:0.6,active:[0.22,0.34],cancel:0.36,dmgMul:1,kb:[300,-120],stam:8,lunge:80,keys:[[0.16,{shR:165,elR:5,wa:-125,lean:-8}],[0.26,{shR:85,elR:0,wa:60,lean:20,hpR:36}],[0.4,{}],[0.6,'base']]}),
  wmv(def,{id:'bash2',dur:0.58,active:[0.2,0.32],cancel:0.34,dmgMul:1,kb:[320,-100],stam:8,lunge:80,keys:[[0.14,{shR:70,elR:30,wa:100,lean:-4}],[0.26,{shR:100,elR:0,wa:-40,lean:20}],[0.4,{}],[0.58,'base']]}),
  wmv(def,{id:'bash3',dur:0.72,active:[0.3,0.42],cancel:0.44,dmgMul:1.4,kb:[460,-260],stam:10,lunge:180,fire:[sh(0.34)],keys:[[0.2,{shR:170,elR:0,wa:-150,lean:-14}],[0.34,{shR:85,elR:0,wa:65,lean:26,hpR:40}],[0.5,{}],[0.72,'base']]})];
 b.heavy=wmv(def,{id:'crush',kind:'heavy',dur:1.0,hold:0.34,chargeT:0.9,active:[0.44,0.58],dmgMul:2.2,kb:[560,-420],stam:18,lunge:220,lungeAt:0.4,stun:0.55,fire:[sh(0.46)],keys:[[0.16,{shR:165,elR:5,wa:-135,lean:-12}],[0.34,{shR:178,elR:0,wa:-160,lean:-18,hpR:10}],[0.48,{shR:85,elR:0,wa:65,lean:28,hpR:44,knR:30}],[0.66,{}],[1.0,'base']]});return b}
function sweep(def){const b=slash(def);
 b.light=[wmv(def,{id:'sweep1',dur:0.5,active:[0.12,0.28],cancel:0.3,dmgMul:1,kb:[300,-100],stam:6,lunge:60,keys:[[0.1,{shR:60,elR:30,wa:100,lean:-4}],[0.24,{shR:96,elR:0,wa:-35,lean:16}],[0.5,'base']]}),
  wmv(def,{id:'sweep2',dur:0.5,active:[0.12,0.28],cancel:0.3,dmgMul:1,kb:[300,-100],stam:6,lunge:60,keys:[[0.1,{shR:100,elR:0,wa:-60,lean:0}],[0.24,{shR:70,elR:20,wa:70,lean:16}],[0.5,'base']]}),
  wmv(def,{id:'spin',dur:0.6,active:[0.1,0.42],cancel:0.44,dmgMul:1.2,kb:[420,-200],stam:9,keys:[[0.08,{shR:90,elR:0,wa:0}],[0.42,{wa:360,rot:360,lean:14}],[0.6,{wa:360,rot:360}]]})];
 b.heavy=wmv(def,{id:'cyclone',kind:'heavy',dur:0.9,hold:0.22,chargeT:0.7,active:[0.28,0.7],dmgMul:1.8,kb:[560,-300],stam:15,keys:[[0.2,{shR:120,elR:0,wa:-100,lean:-10}],[0.22,{}],[0.7,{wa:700,rot:720,lean:16}],[0.9,{wa:700,rot:720}]]});return b}
function dagger(def){const b=slash(def);const q=(id,wa,dm,dur,lng)=>wmv(def,{id,dur,active:[0.07,0.16],cancel:0.17,dmgMul:dm,kb:[170,-60],stam:3,lunge:lng||100,keys:[[0.05,{shR:30,elR:90,wa:wa-20,lean:4}],[0.1,{shR:96,elR:0,wa:wa,lean:16,hpR:30}],[0.16,{}],[dur,'base']]});
 b.light=[q('stab1',0,1,0.3),q('stab2',10,1,0.3),q('slice',-30,1.2,0.34),q('stab3',0,1.5,0.4,200)];return b}
function katana(def){const b=slash(def);b.dash.dur=0.5;b.dash.id='iai';b.dash.dmgMul=1.9;b.dash.dmg=def.dmg*1.9;b.dash.lunge=850;return b}
// ---------- ranged ----------
function ranged(def){
 const proj=def.proj,st=def.style;
 const pose=(wa,extra)=>Object.assign({shR:92,elR:0,wa,lean:12},extra||{});
 const shoot=(id,kind,o)=>Object.assign(mv({id,kind,dur:0.5,active:[99,99],hitter:'handR',dmg:0,stam:5,keys:[],noMelee:true}),o);
 const bow=st==='bow'||st==='xbow'; const wa=st==='bow'?-90:0;
 const L=shoot('shoot','light',{dur:st==='blaster'?0.24:st==='knives'?0.3:0.5,fire:[{t:st==='blaster'?0.08:st==='knives'?0.12:0.22,type:'shoot',spec:{power:1}}],stam:st==='knives'?3:5,
  keys:st==='knives'?[[0.06,{shR:20,elR:120,wa:-60}],[0.12,{shR:95,elR:5,wa:0,lean:16}],[0.3,'base']]:[[0.12,pose(wa,{shL:70,elL:80})],[st==='blaster'?0.2:0.4,{}],[st==='blaster'?0.24:0.5,'base']]});
 const H=shoot('charged','heavy',{dur:0.8,hold:0.2,chargeT:0.9,fire:[{t:0.42,type:'shoot',spec:{power:2.2,heavy:1}}],stam:12,
  keys:[[0.12,pose(wa,{shL:70,elL:80})],[0.2,pose(wa,{shL:40,elL:100,lean:6})],[0.5,{}],[0.8,'base']]});
 return {light:[L],heavy:H,launcher:H,dash:H,airLight:Object.assign({},L,{air:true}),airHeavy:Object.assign({},H,{air:true}),crLight:L,crHeavy:H,counter:L}}
M.set=(def)=>{
 if(!def)return UN;const c=M.cache;if(c[def.id])return c[def.id];let s;
 switch(def.style){case 'bow':case 'xbow':case 'knives':case 'blaster':case 'magic':s=ranged(def);break;
  case 'stab':s=stab(def);break;case 'smash':s=smash(def);break;case 'sweep':s=sweep(def);break;case 'dagger':s=dagger(def);break;case 'katana':s=katana(def);break;case 'slash2':s=slash(def,true);break;case 'shield':case 'none':s=UN;break;default:s=slash(def)}
 c[def.id]=s;return s};
M.pick=(f,kind,fromChain,preview)=>{
 const w=f.main,def=w?w.def:null;let set=M.set(def);
 const ranged=def&&['bow','xbow','knives','blaster','magic'].includes(def.style);
 if(ranged&&w.ammo<=0&&!(w.def.regen))set=UN;
 const chain=fromChain?f.chain:[];const grounded=preview?true:f.grounded;
 if(!fromChain&&!preview)f.chain=[];
 let m=null;
 if(kind==='light'){
  if(!grounded)m=set.airLight;
  else if(f.counterT>0&&!ranged)m=set.counter;
  else if(f.in.down&&f.crouching)m=set.crLight;
  else{let n=0;for(let i=chain.length-1;i>=0;i--){if(chain[i]==='light')n++;else break}m=set.light[n%set.light.length]}}
 else{
  if(!grounded)m=set.airHeavy;
  else if(f.crouching)m=set.crHeavy;
  else{let n=0;for(let i=chain.length-1;i>=0;i--){if(chain[i]==='light')n++;else break}
   if(n>=2&&!ranged)m=set.launcher;else if(f.running&&!ranged)m=set.dash;else m=set.heavy}}
 if(!m)return null;
 if(!preview&&kind==='heavy'&&f.stamina<m.stam*0.6)return null;
 return m};
// ---------- ability cast poses ----------
M.castPose=(ab,t,base,f)=>{const o=Object.assign({},base);const k=Math.min(1,t/Math.max(0.01,ab.at)),q=U.clamp((t-ab.at)/Math.max(0.01,ab.dur-ab.at),0,1);
 switch(ab.anim){
 case 'raise':Object.assign(o,{lean:-8,shL:U.lerp(40,170,k),elL:5,shR:U.lerp(55,170,k),elR:5,hpR:10,hpL:-10,knL:8,knR:8});if(t>ab.at)Object.assign(o,{lean:6,shL:100-80*q,shR:100-80*q});break;
 case 'slam':Object.assign(o,{lean:U.lerp(8,34,k),shL:U.lerp(40,170,Math.min(1,k*1.5)),shR:U.lerp(55,170,Math.min(1,k*1.5)),elL:0,elR:0,hpR:U.lerp(24,60,k),knR:70,hpL:-30,knL:50});if(t>ab.at)Object.assign(o,{lean:30,shL:60,shR:60,elL:0,elR:0});break;
 case 'dash':Object.assign(o,{lean:34,head:10,shL:-30,elL:30,shR:-20,elR:40,hpR:48,knR:40,hpL:-40,knL:30});break;
 case 'spin':Object.assign(o,{shL:90,elL:0,shR:90,elR:0,rot:U.smooth(q)*360,lean:10});break;
 case 'hold':Object.assign(o,{lean:-10,shL:U.lerp(40,150,Math.min(1,k)),elL:10,shR:U.lerp(55,150,Math.min(1,k)),elR:10,hpR:20,hpL:-24});if(t>ab.at)Object.assign(o,{shL:95,shR:95,elL:0,elR:0,lean:16});break;
 default:{Object.assign(o,{lean:U.lerp(8,-6,k),shR:U.lerp(55,-10,k),elR:U.lerp(85,100,k),shL:U.lerp(40,20,k)});if(t>=ab.at)Object.assign(o,{lean:18,shR:96,elR:0,shL:80,elL:20})}}
 return o};
})(window.SD);
