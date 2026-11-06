'use strict';
// Keyboard (rebindable) + multi-touch controllers.
(function(SD){
const U=SD.U;
const down=new Set(),edges=new Set();
const I=SD.Input={down,edges,touch:{x:0,y:0,jumpHeld:false,block:false,lightHeld:false,heavyHeld:false,ev:{light:false,heavy:false,ability:false,throw:false,interact:false,jump:false},active:false},
 init(){
  addEventListener('keydown',e=>{if(e.target&&/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)&&!I.rebind)return;
   if(I.rebind){e.preventDefault();I.rebind(e.code);return}
   if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Tab'].includes(e.code))e.preventDefault();
   if(!e.repeat){edges.add(e.code);if(I.onKey)I.onKey(e.code)}down.add(e.code)});
  addEventListener('keyup',e=>{down.delete(e.code)});
  addEventListener('blur',()=>{down.clear();edges.clear()});
 }};
class KeyboardController{
 constructor(slot){this.slot=slot;this.hv=0;this.last=0}
 poll(f,game){
  const k=SD.Save.data.settings.keys[this.slot],o=Object.assign({},SD.NOIN);
  const d=c=>down.has(k[c]);const e=c=>{const v=edges.has(k[c]);return v};
  o.x=(d('right')?1:0)-(d('left')?1:0);o.down=d('down');o.jumpHeld=d('jump');o.jump=e('jump');
  o.light=e('light');o.heavy=e('heavy');o.heavyHeld=d('heavy');o.lightHeld=d('light');o.block=d('block');o.ability=e('ability');o.throw=e('throw');o.interact=e('interact');
  for(const c of ['jump','light','heavy','ability','throw','interact'])edges.delete(k[c]);
  return o}
}
class TouchController{
 poll(f,game){const t=I.touch,o=Object.assign({},SD.NOIN);
  o.x=t.x;o.down=t.y>0.55;o.jumpHeld=t.jumpHeld||t.y<-0.55;o.jump=t.ev.jump;o.light=t.ev.light;o.heavy=t.ev.heavy;o.heavyHeld=t.heavyHeld;o.lightHeld=t.lightHeld;o.block=t.block;o.ability=t.ev.ability;o.throw=t.ev.throw;o.interact=t.ev.interact;
  for(const k in t.ev)t.ev[k]=false;return o}
}
class Combined{ // P1: keyboard + touch
 constructor(slot){this.kb=new KeyboardController(slot);this.tc=new TouchController();this.prevUp=false}
 poll(f,game){const a=this.kb.poll(f,game);if(!I.touch.active)return a;const b=this.tc.poll(f,game);
  const upNow=I.touch.y<-0.55;if(upNow&&!this.prevUp)b.jump=true;this.prevUp=upNow;
  return {x:a.x||b.x,down:a.down||b.down,jumpHeld:a.jumpHeld||b.jumpHeld,jump:a.jump||b.jump,light:a.light||b.light,heavy:a.heavy||b.heavy,heavyHeld:a.heavyHeld||b.heavyHeld,lightHeld:a.lightHeld||b.lightHeld,block:a.block||b.block,ability:a.ability||b.ability,throw:a.throw||b.throw,interact:a.interact||b.interact}}
}
I.KeyboardController=KeyboardController;I.Combined=Combined;
})(window.SD);
