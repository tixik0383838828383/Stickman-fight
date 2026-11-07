'use strict';
// Controllers: keyboard sets (rebindable), gamepads, per-player touch pads.
(function(SD){
const U=SD.U;
const down=new Set(),edges=new Set();
const mkTouch=()=>({x:0,y:0,jumpHeld:false,block:false,lightHeld:false,heavyHeld:false,ev:{light:false,heavy:false,ability:false,throw:false,interact:false,jump:false}});
const I=SD.Input={down,edges,touches:[mkTouch(),mkTouch(),mkTouch(),mkTouch()],touchActive:false,
 init(){
  addEventListener('keydown',e=>{if(e.target&&/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)&&!I.rebind)return;
   if(I.rebind){e.preventDefault();I.rebind(e.code);return}
   if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Tab'].includes(e.code)||/^Numpad/.test(e.code))e.preventDefault();
   if(!e.repeat){edges.add(e.code);if(I.onKey)I.onKey(e.code)}down.add(e.code)});
  addEventListener('keyup',e=>{down.delete(e.code)});
  addEventListener('blur',()=>{down.clear();edges.clear()});
 },
 pads(){const g=navigator.getGamepads?navigator.getGamepads():[];return Array.from(g).filter(Boolean)}};
I.touch=I.touches[0];
class KeyboardController{
 constructor(slot){this.slot=slot}
 poll(f,game){
  const k=SD.Save.data.settings.keys[this.slot],o=Object.assign({},SD.NOIN);
  const d=c=>down.has(k[c]),e=c=>edges.has(k[c]);
  o.x=(d('right')?1:0)-(d('left')?1:0);o.down=d('down');o.jumpHeld=d('jump');o.jump=e('jump');
  o.light=e('light');o.heavy=e('heavy');o.heavyHeld=d('heavy');o.lightHeld=d('light');o.block=d('block');o.ability=e('ability');o.throw=e('throw');o.interact=e('interact');
  for(const c of ['jump','light','heavy','ability','throw','interact'])edges.delete(k[c]);
  return o}
}
class TouchController{
 constructor(i){this.i=i;this.prevUp=false}
 poll(f,game){const t=I.touches[this.i],o=Object.assign({},SD.NOIN);
  o.x=t.x;o.down=t.y>0.55;o.jumpHeld=t.jumpHeld||t.y<-0.55;o.jump=t.ev.jump;o.light=t.ev.light;o.heavy=t.ev.heavy;o.heavyHeld=t.heavyHeld;o.lightHeld=t.lightHeld;o.block=t.block;o.ability=t.ev.ability;o.throw=t.ev.throw;o.interact=t.ev.interact;
  const up=t.y<-0.55;if(up&&!this.prevUp)o.jump=true;this.prevUp=up;
  for(const k in t.ev)t.ev[k]=false;return o}
}
class GamepadController{
 constructor(i){this.i=i;this.prev={}}
 poll(f,game){const o=Object.assign({},SD.NOIN);const gp=I.pads()[this.i];if(!gp)return o;
  const b=n=>!!(gp.buttons[n]&&gp.buttons[n].pressed),ax=gp.axes[0]||0,ay=gp.axes[1]||0;
  const edge=n=>{const v=b(n),p=this.prev[n];this.prev[n]=v;return v&&!p};
  o.x=Math.abs(ax)>0.35?Math.sign(ax):(b(15)?1:0)-(b(14)?1:0);o.down=ay>0.6||b(13);
  o.jumpHeld=b(0)||ay<-0.6||b(12);o.jump=edge(0)||(ay<-0.6&&!this.prevUp);this.prevUp=ay<-0.6;
  o.light=edge(2);o.heavy=edge(3);o.lightHeld=b(2);o.heavyHeld=b(3);o.block=b(1)||b(4)||b(6);o.ability=edge(5)||edge(7);o.throw=edge(8);o.interact=edge(9)||edge(10);
  return o}
}
I.KeyboardController=KeyboardController;I.TouchController=TouchController;I.GamepadController=GamepadController;
// controller ids: k1 (WASD) k2 (arrows) k3 (numpad) g0-g3 t0-t3 bot off
I.make=(id)=>{if(id==='k1'||id==='p1')return new KeyboardController('p1');if(id==='k2'||id==='p2')return new KeyboardController('p2');if(id==='k3'||id==='p3')return new KeyboardController('p3');
 if(id[0]==='g')return new GamepadController(+id[1]);if(id[0]==='t')return new TouchController(+id[1]);return null};
I.label=id=>({k1:'⌨ WASD',k2:'⌨ Стрелки',k3:'⌨ Numpad',g0:'🎮 Геймпад 1',g1:'🎮 Геймпад 2',g2:'🎮 Геймпад 3',g3:'🎮 Геймпад 4',t0:'📱 Сенсор 1',t1:'📱 Сенсор 2',t2:'📱 Сенсор 3',t3:'📱 Сенсор 4',bot:'🤖 Бот',off:'— Пусто'})[id]||id;
})(window.SD);
