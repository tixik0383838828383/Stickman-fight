'use strict';
(function(SD){
const KEY='stickman_duel_arena_v1';
const CHAR_UNLOCK=[['yellow',1],['purple',2],['victim',3],['chosen',5],['kingorange',7],['darklord',10]];
const ARENA_UNLOCK=[['cave',1],['ice',2],['lava',3],['sky',4],['future',5],['bridge',6],['traps',8],['final',10]];
const DEFAULT_KEYS={
 p1:{left:'KeyA',right:'KeyD',jump:'KeyW',down:'KeyS',light:'KeyF',heavy:'KeyG',block:'KeyH',ability:'KeyE',throw:'KeyQ',interact:'KeyR'},
 p2:{left:'ArrowLeft',right:'ArrowRight',jump:'ArrowUp',down:'ArrowDown',light:'KeyK',heavy:'KeyL',block:'KeyJ',ability:'KeyO',throw:'KeyU',interact:'KeyI'},
 p3:{left:'Numpad4',right:'Numpad6',jump:'Numpad8',down:'Numpad5',light:'Numpad1',heavy:'Numpad2',block:'Numpad3',ability:'Numpad0',throw:'Numpad7',interact:'Numpad9'}};
function defaults(){return {
 unlockedChars:['second','red','blue','green'],unlockedArenas:['training','stone','minecraft','forest'],
 settings:{master:0.7,sfx:1,quality:'auto',shake:true,touch:'auto',keys:JSON.parse(JSON.stringify(DEFAULT_KEYS))},
 records:{survivalBest:0,tournamentWins:0,bestWinTime:0},
 stats:{matches:0,wins:0,hits:0,damage:0,kills:0,rounds:0,parries:0,disarms:0,ringouts:0,maxCombo:0},
 configs:{},last:null,achievements:{},customChars:[]};}
const S=SD.Save={data:null,
 load(){try{const r=localStorage.getItem(KEY);const d=defaults();if(r){const o=JSON.parse(r);Object.assign(d,o);d.settings=Object.assign(defaults().settings,o.settings||{});d.settings.keys=Object.assign({},DEFAULT_KEYS,o.settings&&o.settings.keys||{});d.stats=Object.assign(defaults().stats,o.stats||{});d.records=Object.assign(defaults().records,o.records||{});}this.data=d}catch(e){this.data=defaults()}return this.data},
 save(){try{localStorage.setItem(KEY,JSON.stringify(this.data))}catch(e){}},
 reset(){this.data=defaults();this.save()},
 defaultKeys:DEFAULT_KEYS,
 isCharUnlocked(id){return this.data.unlockedChars.includes(id)},
 isArenaUnlocked(id){return this.data.unlockedArenas.includes(id)},
 unlockAll(){this.data.unlockedChars=Object.keys(SD.CHARS);this.data.unlockedArenas=Object.keys(SD.ARENAS);this.save()},
 checkUnlocks(){const w=this.data.stats.wins,out=[];
  CHAR_UNLOCK.forEach(([id,n])=>{if(w>=n&&!this.data.unlockedChars.includes(id)){this.data.unlockedChars.push(id);out.push('Боец: '+SD.CHARS[id].name)}});
  ARENA_UNLOCK.forEach(([id,n])=>{if(w>=n&&!this.data.unlockedArenas.includes(id)){this.data.unlockedArenas.push(id);out.push('Арена: '+SD.ARENAS[id].name)}});
  return out},
 ach(id){if(this.data.achievements[id])return false;this.data.achievements[id]=Date.now();this.save();return true}
};
SD.ACHIEVEMENTS={first_blood:'Первая кровь — нанеси первый удар',win1:'Победитель — выиграй матч',win10:'Ветеран — 10 побед',combo5:'Комбо x5',parry:'Идеальный парри',disarm:'Обезоружен!',ringout:'Выброшен за арену',surv5:'Выживание — дойди до 5-й волны',explode:'Взрывной финал — убей взрывом',tourney:'Чемпион турнира',allweapons:'Коллекционер — подбери 10 разных видов оружия'};
})(window.SD);
