'use strict';
(function(SD){
const A=SD.Audio={ctx:null,master:null,sfx:null,noiseBuf:null,vol:0.7,sfxVol:1,last:{},
 init(){if(this.ctx)return;try{const C=window.AudioContext||window.webkitAudioContext;this.ctx=new C();this.master=this.ctx.createGain();this.sfx=this.ctx.createGain();this.sfx.connect(this.master);this.master.connect(this.ctx.destination);
  const n=this.ctx.sampleRate;this.noiseBuf=this.ctx.createBuffer(1,n,n);const d=this.noiseBuf.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;this.setVol(this.vol,this.sfxVol)}catch(e){this.ctx=null}},
 resume(){this.init();if(this.ctx&&this.ctx.state==='suspended')this.ctx.resume()},
 setVol(m,s){this.vol=m;this.sfxVol=s;if(this.master){this.master.gain.value=m;this.sfx.gain.value=s}},
 tone(type,f0,f1,dur,g,delay=0,dst){const c=this.ctx;if(!c)return;const t=c.currentTime+delay;const o=c.createOscillator(),v=c.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);v.gain.setValueAtTime(g,t);v.gain.exponentialRampToValueAtTime(0.001,t+dur);o.connect(v);v.connect(dst||this.sfx);o.start(t);o.stop(t+dur+0.02)},
 noise(dur,ft,f0,f1,g,delay=0,q=1){const c=this.ctx;if(!c)return;const t=c.currentTime+delay;const s=c.createBufferSource();s.buffer=this.noiseBuf;const f=c.createBiquadFilter();f.type=ft;f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const v=c.createGain();v.gain.setValueAtTime(g,t);v.gain.exponentialRampToValueAtTime(0.001,t+dur);s.connect(f);f.connect(v);v.connect(this.sfx);s.start(t,Math.random()*0.5);s.stop(t+dur+0.02)},
 play(name,p=1,v=1){if(!this.ctx||this.ctx.state!=='running')return;const now=performance.now();if(this.last[name]&&now-this.last[name]<35)return;this.last[name]=now;const r=0.92+Math.random()*0.16;p*=r;
  switch(name){
  case 'hit':this.noise(0.12,'lowpass',2500*p,300,0.5*v);this.tone('sine',160*p,50,0.14,0.6*v);break;
  case 'hitheavy':this.noise(0.25,'lowpass',3000*p,150,0.8*v);this.tone('sine',110*p,35,0.3,0.9*v);this.tone('square',200,60,0.1,0.15*v);break;
  case 'block':this.tone('square',900*p,500*p,0.09,0.2*v);this.noise(0.08,'bandpass',3000,1500,0.4*v,0,4);break;
  case 'parry':this.tone('triangle',1400,2400,0.15,0.4*v);this.tone('square',700,300,0.12,0.2*v);break;
  case 'swing':this.noise(0.14,'bandpass',500*p,2200*p,0.25*v,0,2);break;
  case 'blade':this.noise(0.18,'highpass',2000*p,6000*p,0.2*v);this.tone('sawtooth',1800*p,900,0.08,0.05*v);break;
  case 'clang':this.tone('square',1200*p,1100*p,0.2,0.18*v);this.tone('square',1900*p,1800*p,0.2,0.1*v);this.noise(0.1,'highpass',4000,3000,0.3*v);break;
  case 'fall':this.tone('sine',90,35,0.25,0.7*v);this.noise(0.2,'lowpass',800,100,0.5*v);break;
  case 'pickup':this.tone('triangle',500,800,0.08,0.3*v);this.tone('triangle',800,1200,0.1,0.3*v,0.07);break;
  case 'drop':this.tone('triangle',500,250,0.12,0.25*v);break;
  case 'jump':this.tone('sine',250*p,520*p,0.12,0.2*v);break;
  case 'ability':this.tone('sawtooth',200*p,900*p,0.35,0.22*v);this.noise(0.3,'bandpass',400,3000,0.2*v,0,2);break;
  case 'energy':this.tone('sine',700*p,300,0.25,0.3*v);this.tone('sawtooth',350*p,120,0.2,0.1*v);break;
  case 'explode':this.noise(0.7,'lowpass',2200,60,1.0*v);this.tone('sine',90,25,0.6,1*v);break;
  case 'shoot':this.noise(0.1,'bandpass',1200,400,0.3*v,0,2);this.tone('triangle',500*p,200,0.1,0.15*v);break;
  case 'break':this.noise(0.35,'lowpass',2500,200,0.7*v);this.tone('square',150,60,0.15,0.2*v);break;
  case 'win':[523,659,784,1047].forEach((f,i)=>this.tone('triangle',f,f,0.25,0.3,i*0.12));break;
  case 'lose':[400,330,262,196].forEach((f,i)=>this.tone('sawtooth',f,f*0.9,0.3,0.2,i*0.15));break;
  case 'ko':this.tone('sawtooth',300,40,0.7,0.5*v);this.noise(0.5,'lowpass',1500,100,0.6*v);break;
  case 'beep':this.tone('square',660*p,660*p,0.12,0.2*v);break;
  case 'go':this.tone('square',880,880,0.3,0.25*v);break;
  case 'click':this.tone('triangle',700,500,0.05,0.2*v);break;
  case 'zap':this.noise(0.2,'highpass',3000,8000,0.3*v);this.tone('sawtooth',1500,200,0.15,0.2*v);break;
  case 'fire':this.noise(0.35,'bandpass',600,200,0.35*v,0,1);break;
  case 'ice':this.tone('triangle',2000,3200,0.15,0.2*v);this.noise(0.15,'highpass',5000,7000,0.2*v);break;
  }}
};
})(window.SD);
