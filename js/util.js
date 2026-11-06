'use strict';
window.SD = window.SD || {};
(function(SD){
const U = SD.U = {};
U.clamp=(v,a,b)=>v<a?a:(v>b?b:v);
U.lerp=(a,b,t)=>a+(b-a)*t;
U.rand=(a,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a);
U.irand=(a,b)=>Math.floor(U.rand(a,b+1));
U.pick=a=>a[Math.floor(Math.random()*a.length)];
U.sign=v=>v<0?-1:1;
U.rad=d=>d*Math.PI/180;
U.smooth=t=>{t=U.clamp(t,0,1);return t*t*(3-2*t)};
U.approach=(v,t,d)=>v<t?Math.min(v+d,t):Math.max(v-d,t);
U.segDist=(px,py,ax,ay,bx,by)=>{
  const dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy;
  let t=l2>0?((px-ax)*dx+(py-ay)*dy)/l2:0; t=t<0?0:t>1?1:t;
  const cx=ax+dx*t,cy=ay+dy*t; return {d:Math.hypot(px-cx,py-cy),t,cx,cy};
};
U.segSegHit=(a,b,c,d)=>{ // each is [x1,y1,x2,y2]
  const o=(ax,ay,bx,by,cx,cy)=>(by-ay)*(cx-bx)-(bx-ax)*(cy-by);
  const s=(p,q,r)=>{const v=o(p[0],p[1],q[0],q[1],r[0],r[1]);return v>0?1:v<0?2:0};
  const P=[a[0],a[1]],Q=[a[2],a[3]],R=[b[0],b[1]],S=[b[2],b[3]];
  return s(P,Q,R)!==s(P,Q,S)&&s(R,S,P)!==s(R,S,Q);
};
U.hex2rgb=h=>{h=h.replace('#','');return [parseInt(h.substr(0,2),16),parseInt(h.substr(2,2),16),parseInt(h.substr(4,2),16)]};
U.rgb2hex=(r,g,b)=>'#'+[r,g,b].map(v=>('0'+Math.round(U.clamp(v,0,255)).toString(16)).slice(-2)).join('');
U.shade=(h,f)=>{const [r,g,b]=U.hex2rgb(h);return f>=0?U.rgb2hex(r+(255-r)*f,g+(255-g)*f,b+(255-b)*f):U.rgb2hex(r*(1+f),g*(1+f),b*(1+f))};
U.rgba=(h,a)=>{const [r,g,b]=U.hex2rgb(h);return `rgba(${r},${g},${b},${a})`};
U.mix=(a,b,t)=>{const A=U.hex2rgb(a),B=U.hex2rgb(b);return U.rgb2hex(A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t,A[2]+(B[2]-A[2])*t)};
U.fmtTime=s=>{s=Math.max(0,Math.floor(s));return Math.floor(s/60)+':'+('0'+(s%60)).slice(-2)};
})(window.SD);
