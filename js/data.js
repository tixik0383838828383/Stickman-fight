'use strict';
(function(SD){
// ---------- Characters (colours come from the real .nodes header; stats/abilities are game design) ----------
// stats: hp, power, def(0..0.3 dmg reduction), kbRes, speed, jump, stamina, scale
SD.CHARS={
 second:{id:'second',name:'The Second Coming',rig:'The Second Coming',group:'AvA',style:'Скоростной боец. Быстрые удары и энергетические атаки.',
  hp:100,power:1.0,def:0.03,kbRes:0.1,speed:1.1,jump:1.05,stamina:100,scale:1,acc:{hair:'#ff741a',eyes:'#fff'},
  ab:{n:{id:'surge',name:'Surge',cost:25,cd:9,desc:'Ускорение +50% на 6 c'},f:{id:'estrike',name:'Energy Strike',cost:30,cd:6,desc:'Мощный энергетический удар'},a:{id:'skystrike',name:'Sky Strike',cost:25,cd:6,desc:'Пикирующая воздушная атака'},u:{id:'secondform',name:'Second Form',cost:100,cd:25,desc:'Усиленная форма 9 c'}}},
 chosen:{id:'chosen',name:'The Chosen One',rig:'The Chosen One',group:'AvA',style:'Энергия и огонь. Сбалансированный боец-маг.',
  hp:100,power:1.05,def:0.04,kbRes:0.12,speed:1.0,jump:1.0,stamina:100,scale:1,acc:{hair:'#222',eyes:'#fff',fire:1},
  ab:{n:{id:'ki',name:'Energy Blast',cost:25,cd:4,desc:'Энергетический шар'},f:{id:'empower',name:'Empower',cost:30,cd:10,desc:'Усиленные удары +35% на 7 c'},a:{id:'firerain',name:'Fire Rain',cost:30,cd:7,desc:'Огненный дождь в воздухе'},u:{id:'inferno',name:'Inferno',cost:100,cd:25,desc:'Огненная нова'}}},
 darklord:{id:'darklord',name:'The Dark Lord',rig:'The Dark Lord',group:'AvA',style:'Тяжёлый мечник. Тёмная энергия, медленный, но мощный.',
  hp:115,power:1.12,def:0.08,kbRes:0.3,speed:0.9,jump:0.95,stamina:105,scale:1.05,weapon:'darklord_sword',acc:{cape:'#7f0000',horns:1,eyes:'#f22'},
  ab:{n:{id:'darkorb',name:'Dark Orb',cost:30,cd:6,desc:'Тёмная энергия'},f:{id:'frenzy',name:'Blade Frenzy',cost:30,cd:10,desc:'Усиленные удары мечом 6 c'},a:{id:'shadowvolley',name:'Shadow Volley',cost:30,cd:7,desc:'Залп снарядов вниз'},u:{id:'annihilate',name:'Annihilation',cost:100,cd:28,desc:'Заряженный луч'}}},
 victim:{id:'victim',name:'Victim',rig:'Victim',group:'AvA',style:'Тактик. Ловушки и контроль пространства.',
  hp:95,power:0.95,def:0.02,kbRes:0.08,speed:1.05,jump:1.05,stamina:110,scale:0.97,acc:{hair:'#444',scarf:'#8a8a8a'},
  ab:{n:{id:'mine',name:'Mine',cost:25,cd:5,desc:'Ловушка-мина'},f:{id:'wall',name:'Barrier',cost:30,cd:9,desc:'Стена-блок на 5 c'},a:{id:'net',name:'Net Trap',cost:25,cd:8,desc:'Сеть замедляет врага'},u:{id:'minefield',name:'Minefield',cost:100,cd:25,desc:'Минное поле'}}},
 red:{id:'red',name:'Red',rig:'Red',group:'MC',style:'Агрессор с животными. Быстрые комбинации.',
  hp:100,power:1.08,def:0.02,kbRes:0.1,speed:1.08,jump:1.0,stamina:100,scale:1,acc:{},
  ab:{n:{id:'wolf',name:'Wolf Rush',cost:25,cd:6,desc:'Волк бежит вперёд'},f:{id:'rage',name:'Rage',cost:30,cd:10,desc:'+40% скорость атак, +20% урон 6 c'},a:{id:'eagle',name:'Eagle Dive',cost:25,cd:7,desc:'Орёл пикирует на врага'},u:{id:'stampede',name:'Stampede',cost:100,cd:25,desc:'Стадо животных'}}},
 blue:{id:'blue',name:'Blue',rig:'Blue',group:'MC',style:'Алхимик. Зелья с необычными эффектами.',
  hp:95,power:0.95,def:0.02,kbRes:0.08,speed:1.02,jump:1.0,stamina:105,scale:1,acc:{},
  ab:{n:{id:'potion',name:'Potion',cost:25,cd:5,desc:'Бросок зелья со случайным эффектом'},f:{id:'swift',name:'Swiftness',cost:30,cd:10,desc:'Скорость и прыжок 6 c'},a:{id:'splash',name:'Splash',cost:30,cd:7,desc:'Два зелья вниз'},u:{id:'elixir',name:'Elixir',cost:100,cd:30,desc:'Лечение 30% и сила 8 c'}}},
 green:{id:'green',name:'Green',rig:'Green',group:'MC',style:'Музыкант. Ритмичные звуковые волны.',
  hp:100,power:0.98,def:0.03,kbRes:0.1,speed:1.0,jump:1.0,stamina:100,scale:1,acc:{},
  ab:{n:{id:'soundwave',name:'Sound Wave',cost:25,cd:5,desc:'Звуковые ноты'},f:{id:'rhythm',name:'Rhythm',cost:30,cd:10,desc:'Ритм-комбо 6 c: удары излучают волны'},a:{id:'bassdrop',name:'Bass Drop',cost:30,cd:7,desc:'Бас-удар в воздухе'},u:{id:'concert',name:'Concert',cost:100,cd:25,desc:'Пульсирующие волны 5 c'}}},
 yellow:{id:'yellow',name:'Yellow',rig:'Yellow',group:'MC',style:'Инженер. Турели и дальние атаки.',
  hp:92,power:0.95,def:0.02,kbRes:0.06,speed:1.03,jump:1.0,stamina:100,scale:0.98,acc:{},
  ab:{n:{id:'turret',name:'Turret',cost:30,cd:9,desc:'Турель на 8 c'},f:{id:'laser',name:'Laser',cost:25,cd:5,desc:'Мгновенный лазер'},a:{id:'drone',name:'Drone Bombs',cost:30,cd:7,desc:'Бомбы с дрона'},u:{id:'orbital',name:'Orbital Beam',cost:100,cd:25,desc:'Орбитальный луч'}}},
 purple:{id:'purple',name:'Purple',rig:'Purple',group:'MC',style:'Манёвренный. Двойной прыжок, блинк, серии ударов.',
  hp:88,power:0.95,def:0.0,kbRes:0.04,speed:1.18,jump:1.1,stamina:100,scale:0.96,doubleJump:1,acc:{},
  ab:{n:{id:'blink',name:'Blink',cost:25,cd:6,desc:'Телепорт за спину врага'},f:{id:'dashslash',name:'Dash Slash',cost:25,cd:5,desc:'Рывок сквозь врага'},a:{id:'airdash',name:'Air Dash',cost:20,cd:4,desc:'Воздушный рывок'},u:{id:'flurry',name:'Flurry',cost:100,cd:22,desc:'Шквал ударов'}}},
 kingorange:{id:'kingorange',name:'King Orange',rig:'King Orange',group:'MC',style:'Тяжеловес в короне. Мощные удары и защита.',
  hp:130,power:1.15,def:0.1,kbRes:0.45,speed:0.82,jump:0.9,stamina:100,scale:1.14,acc:{cape:'#fccd03',crown:'#fccd03'},
  ab:{n:{id:'slam',name:'Ground Slam',cost:30,cd:7,desc:'Ударная волна'},f:{id:'ironwill',name:'Iron Will',cost:30,cd:11,desc:'Броня -50% урона 5 c'},a:{id:'meteor',name:'Meteor Drop',cost:30,cd:8,desc:'Падение-удар'},u:{id:'royalbeam',name:'Royal Beam',cost:100,cd:28,desc:'Королевский луч'}}}
};
SD.CHAR_ORDER=['second','chosen','darklord','victim','red','blue','green','yellow','purple','kingorange'];

SD.RARITY=[{id:0,name:'Обычное',color:'#bbbbbb',w:55,dmg:1,spd:1},{id:1,name:'Необычное',color:'#5fd35f',w:25,dmg:1.04,spd:1},{id:2,name:'Редкое',color:'#4aa3ff',w:12,dmg:1.08,spd:1.02},{id:3,name:'Эпическое',color:'#b05cff',w:6,dmg:1.12,spd:1.03},{id:4,name:'Легендарное',color:'#ffb62e',w:2,dmg:1.16,spd:1.05}];

// ---------- Weapons ----------
// style: slash|stab|smash|sweep|bow|xbow|knives|blaster|magic|shield|none ; slot: main|off
const W={};
function def(id,name,cat,o){W[id]=Object.assign({id,name,cat,len:90,pivot:0.12,mass:1,dmg:10,speed:1,kb:1,stam:1,style:'slash',two:false,slot:'main',fx:'blade',snd:'blade',w:10,sil:id,col:'#cfd6e0'},o)}
// Cold weapons
def('sword','Меч','Холодное',{len:95,dmg:10,speed:1.05,mass:1.0,col:'#d8dde6'});
def('longsword','Длинный меч','Холодное',{len:120,dmg:11,speed:0.95,mass:1.3,col:'#cfd8e8',pivot:0.1});
def('greatsword','Двуручный меч','Холодное',{len:150,dmg:15,speed:0.75,mass:2.2,two:true,kb:1.4,stam:1.5,col:'#c0c8d8',style:'slash2'});
def('katana','Катана','Холодное',{len:115,dmg:10,speed:1.25,mass:0.9,col:'#e8ecf2',style:'katana'});
def('axe','Топор','Холодное',{len:85,dmg:12,speed:0.95,mass:1.4,style:'smash',kb:1.2,fx:'blade',col:'#9aa'});
def('battleaxe','Боевой топор','Холодное',{len:120,dmg:16,speed:0.7,mass:2.3,two:true,style:'smash',kb:1.5,stam:1.6,col:'#aab'});
def('dagger','Кинжал','Холодное',{len:48,dmg:6,speed:1.6,mass:0.4,kb:0.5,stam:0.6,style:'dagger',col:'#dfe5ee'});
def('spear','Копьё','Холодное',{len:175,pivot:0.3,dmg:11,speed:1.0,mass:1.3,style:'stab',two:true,col:'#cbb'});
def('trident','Трезубец','Холодное',{len:160,pivot:0.3,dmg:12,speed:0.95,mass:1.4,style:'stab',two:true,col:'#5fc9c0'});
def('hammer','Молот','Холодное',{len:100,dmg:17,speed:0.65,mass:2.6,style:'smash',kb:1.7,stam:1.7,two:true,fx:'blunt',snd:'hitheavy',col:'#8a8f99'});
def('mace','Булава','Холодное',{len:75,dmg:11,speed:0.95,mass:1.5,style:'smash',kb:1.2,fx:'blunt',col:'#9a9aa4'});
def('scythe','Коса','Холодное',{len:150,pivot:0.25,dmg:13,speed:0.85,mass:1.8,style:'sweep',two:true,col:'#9a8fb0'});
def('club','Дубинка','Холодное',{len:70,dmg:8,speed:1.0,mass:1.2,style:'smash',kb:1.3,fx:'blunt',col:'#8a5a30'});
def('staff','Боевой посох','Холодное',{len:150,pivot:0.5,dmg:8,speed:1.2,mass:1.0,style:'sweep',two:true,kb:1.1,fx:'blunt',col:'#a07a4a'});
// Ranged
def('bow','Лук','Дальнобойное',{len:70,pivot:0.5,dmg:9,speed:1.0,mass:0.6,style:'bow',two:true,ammo:14,proj:'arrow',col:'#a0703a'});
def('crossbow','Арбалет','Дальнобойное',{len:60,pivot:0.4,dmg:13,speed:0.8,mass:1.0,style:'xbow',ammo:10,proj:'bolt',col:'#7a5a3a'});
def('knives','Метательные ножи','Дальнобойное',{len:30,pivot:0.5,dmg:6,speed:1.4,mass:0.3,style:'knives',ammo:8,proj:'knife',col:'#dfe5ee'});
def('blaster','Энергобластер','Дальнобойное',{len:55,pivot:0.3,dmg:7,speed:1.2,mass:0.8,style:'blaster',ammo:30,proj:'energy',col:'#37e0ff',fx:'energy',regen:1.2});
def('magicstaff','Магический посох','Дальнобойное',{len:130,pivot:0.4,dmg:10,speed:1.0,mass:0.9,style:'magic',ammo:20,proj:'magic',col:'#c070ff',fx:'magic',two:true,regen:0.8});
// Defense (offhand)
def('shield','Щит','Защита',{slot:'off',len:60,style:'shield',block:0.88,stam:0.5,col:'#8a6a3a',mass:1.2});
def('barrier','Энергетический барьер','Защита',{slot:'off',len:60,style:'shield',block:0.75,stam:0.4,col:'#37e0ff',fx:'energy',barrier:1,mass:0.5});
def('reflect','Отражающий щит','Защита',{slot:'off',len:60,style:'shield',block:0.7,stam:0.6,col:'#e8f4ff',reflect:1,mass:0.8});
// Special
def('lightsaber','Световой меч','Особое',{len:105,pivot:0.08,dmg:12,speed:1.3,mass:0.6,fx:'energy',snd:'zap',col:'#3ac8ff',glow:'#3ac8ff',w:4});
def('elecsword','Электрический меч','Особое',{len:100,dmg:11,speed:1.1,mass:1.0,fx:'elec',snd:'zap',col:'#ffee55',glow:'#ffee55',stun:0.25,w:4});
def('flamesword','Огненный меч','Особое',{len:105,dmg:11,speed:1.05,mass:1.0,fx:'fire',snd:'fire',col:'#ff7722',glow:'#ff6611',burn:1,w:4});
def('icesword','Ледяной меч','Особое',{len:105,dmg:11,speed:1.05,mass:1.0,fx:'ice',snd:'ice',col:'#9fe8ff',glow:'#9fe8ff',slow:1,w:4});
def('energyhammer','Энергетический молот','Особое',{len:105,dmg:18,speed:0.65,mass:2.0,style:'smash',two:true,kb:1.7,stam:1.6,fx:'energy',snd:'hitheavy',col:'#ff55dd',glow:'#ff55dd',w:3});
def('darklord_sword','Меч Dark Lord','Особое',{len:165,pivot:0.1,dmg:17,speed:0.8,mass:2.4,two:false,kb:1.5,stam:1.4,fx:'dark',snd:'hitheavy',col:'#222',glow:'#ff1a1a',style:'slash2',w:2,rig:'The Dark Lord Sword'});
// Minecraft category (pixel-art sprites drawn procedurally)
def('mc_diamond_sword','Алмазный меч','Minecraft',{len:100,dmg:12,speed:1.05,mass:1.0,mc:'sword',pal:['#4aedd9','#2ab5a5','#b8fff5'],w:8});
def('mc_netherite_sword','Незеритовый меч','Minecraft',{len:100,dmg:14,speed:1.0,mass:1.3,mc:'sword',pal:['#4a3f4a','#2a232a','#7a6a7a'],w:5});
def('mc_iron_sword','Железный меч','Minecraft',{len:100,dmg:10,speed:1.05,mass:1.0,mc:'sword',pal:['#d8d8d8','#9a9a9a','#fff'],w:14});
def('mc_diamond_axe','Алмазный топор','Minecraft',{len:95,dmg:14,speed:0.85,mass:1.5,style:'smash',kb:1.3,mc:'axe',pal:['#4aedd9','#2ab5a5','#b8fff5'],w:7});
def('mc_trident','Трезубец (MC)','Minecraft',{len:165,pivot:0.3,dmg:13,speed:0.95,mass:1.4,style:'stab',two:true,mc:'trident',pal:['#4fc9b5','#2a8a7a','#b8fff5'],w:5,thrown:1});
def('mc_bow','Лук (MC)','Minecraft',{len:75,pivot:0.5,dmg:9,speed:1.0,mass:0.6,style:'bow',two:true,ammo:14,proj:'arrow',mc:'bow',pal:['#8a5a2a','#c0e0c0','#fff'],w:8});
def('mc_crossbow','Арбалет (MC)','Minecraft',{len:70,pivot:0.4,dmg:14,speed:0.8,mass:1.0,style:'xbow',ammo:10,proj:'bolt',mc:'crossbow',pal:['#8a5a2a','#555','#ddd'],w:6});
def('mc_shield','Щит (MC)','Minecraft',{slot:'off',len:60,style:'shield',block:0.9,stam:0.5,mc:'shield',pal:['#a0703a','#d0d0d0','#6a4a22'],mass:1.2,w:8});
def('mc_mace','Булава (MC)','Minecraft',{len:90,dmg:16,speed:0.7,mass:2.2,style:'smash',kb:1.7,stam:1.5,fx:'blunt',snd:'hitheavy',mc:'mace',pal:['#6a6a72','#3a3a42','#a0a0aa'],w:5});
def('mc_pickaxe','Кирка','Minecraft',{len:95,dmg:11,speed:0.95,mass:1.4,style:'smash',mc:'pickaxe',pal:['#4aedd9','#2ab5a5','#8a5a2a'],w:8});
SD.WEAPONS=W;
SD.WEAPON_CATS=['Холодное','Дальнобойное','Защита','Особое','Minecraft'];
SD.rollRarity=()=>{let t=0;SD.RARITY.forEach(r=>t+=r.w);let x=Math.random()*t;for(const r of SD.RARITY){x-=r.w;if(x<=0)return r.id}return 0};
SD.rollWeapon=(excl)=>{const ids=Object.keys(W).filter(i=>i!=='darklord_sword'||Math.random()<0.25);let tot=0;ids.forEach(i=>tot+=W[i].w);let x=Math.random()*tot;for(const i of ids){x-=W[i].w;if(x<=0)return i}return 'sword'};
})(window.SD);
