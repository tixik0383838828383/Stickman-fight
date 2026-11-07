'use strict';
(function(SD){
// ---------- Characters (colours come from the real .nodes header; stats/abilities are game design) ----------
// stats: hp, power, def(0..0.3 dmg reduction), kbRes, speed, jump, stamina, scale
SD.CHARS={
 second:{id:'second',name:'The Second Coming',rig:'The Second Coming',group:'AvA / AvM',weapon:'pencil',
  lore:'Оранжевый стикмен-аниматор, главный герой серий Alan Becker. Рисует всё что угодно инструментом «Карандаш», стреляет из лазерного ружья и бьёт ударной волной электрогитары.',
  style:'Быстрый универсал: рисует стены, бьёт лазером, пикирует гитарой.',hp:100,power:1.0,def:0.03,kbRes:0.1,speed:1.1,jump:1.05,stamina:100,scale:1,acc:{hair:'#ff741a',eyes:'#fff'},
  ab:{n:{id:'pencil',name:'Pencil Tool',cost:25,cd:6,desc:'Рисует стену-блок перед собой на 5 с'},f:{id:'sclaser',name:'Laser Gun',cost:30,cd:6,desc:'Лазерный луч вперёд'},a:{id:'skystrike',name:'Guitar Slam',cost:25,cd:6,desc:'Пикирующий удар гитарой, ударная волна'},u:{id:'secondform',name:'Awakening',cost:100,cd:25,desc:'Усиленная форма на 9 c: скорость, урон, снаряды при ударах'}}},
 chosen:{id:'chosen',name:'The Chosen One',rig:'The Chosen One',group:'AvA',weapon:'none',
  lore:'«Избранный» — обладатель скрытых сил: пирокинез и лазерное зрение. Сражается голыми руками, усиливая удары огнём.',
  style:'Огненный маг: пирокинез и лазерное зрение.',hp:100,power:1.05,def:0.04,kbRes:0.12,speed:1.0,jump:1.0,stamina:100,scale:1,acc:{hair:'#222',eyes:'#fff',fire:1},
  ab:{n:{id:'ki',name:'Fireball',cost:25,cd:4,desc:'Огненный шар с поджогом'},f:{id:'cvision',name:'Laser Vision',cost:30,cd:6,desc:'Лазер из глаз'},a:{id:'firerain',name:'Fire Rain',cost:30,cd:7,desc:'Огненный дождь в воздухе'},u:{id:'inferno',name:'Inferno',cost:100,cd:25,desc:'Огненная нова вокруг'}}},
 darklord:{id:'darklord',name:'The Dark Lord',rig:'The Dark Lord',group:'AvA',weapon:'darklord_sword',
  lore:'Тёмный властелин с красным мечом. Тяжёлый и медленный, но каждый удар сметает противника; призывает тёмную энергию.',
  style:'Тяжёлый мечник: тёмная энергия и сингулярность.',hp:115,power:1.12,def:0.08,kbRes:0.3,speed:0.9,jump:0.95,stamina:105,scale:1.05,acc:{cape:'#7f0000',horns:1,eyes:'#f22'},
  ab:{n:{id:'darkorb',name:'Dark Orb',cost:30,cd:6,desc:'Тёмная сфера притягивает врага'},f:{id:'frenzy',name:'Blade Frenzy',cost:30,cd:10,desc:'Усиленные удары мечом 6 c'},a:{id:'shadowvolley',name:'Shadow Volley',cost:30,cd:7,desc:'Залп теней вниз'},u:{id:'annihilate',name:'Singularity',cost:100,cd:28,desc:'Заряженный луч уничтожения'}}},
 victim:{id:'victim',name:'Victim',rig:'Victim',group:'AvA',weapon:'sword',
  lore:'Тактик, который окружает себя ловушками, ракетными турелями и сюрикенами-клонами.',
  style:'Тактик: сюрикены, лассо, мины, турель.',hp:95,power:0.95,def:0.02,kbRes:0.08,speed:1.05,jump:1.05,stamina:110,scale:0.97,acc:{hair:'#444',scarf:'#8a8a8a'},
  ab:{n:{id:'shuriken',name:'Shuriken Clones',cost:25,cd:5,desc:'Веер из трёх сюрикенов'},f:{id:'lasso',name:'Lasso',cost:25,cd:7,desc:'Лассо: связывает врага'},a:{id:'mine',name:'Rocket Mine',cost:25,cd:5,desc:'Мина под ногами цели'},u:{id:'minefield',name:'Time Acceleration',cost:100,cd:25,desc:'Ряд мин под противником'}}},
 red:{id:'red',name:'Red',rig:'Red',group:'AvM',weapon:'mc_diamond_sword',
  lore:'Задорный задира Stick Gang. Дружит со свиньёй-героем, обожает TNT, а в ярости использует силу Херобрина.',
  style:'Агрессор: TNT, Героическая свинья, ярость.',hp:100,power:1.08,def:0.02,kbRes:0.1,speed:1.08,jump:1.0,stamina:100,scale:1,acc:{band:'#7a1010'},
  ab:{n:{id:'pig',name:'Heroic Pig',cost:25,cd:6,desc:'Свинья-герой несётся вперёд'},f:{id:'rage',name:'Rage',cost:30,cd:10,desc:'+скорость атак, +урон 6 c'},a:{id:'tntdrop',name:'TNT Drop',cost:30,cd:7,desc:'Бросок TNT вниз-вперёд'},u:{id:'herobrine',name:"Herobrine's Power",cost:100,cd:26,desc:'Телекинез: поднимает врага и швыряет об землю'}}},
 blue:{id:'blue',name:'Blue',rig:'Blue',group:'AvM',weapon:'mc_bow',
  lore:'Хитрый алхимик Stick Gang: зелья, стрелы и земляные укрепления.',
  style:'Алхимик: зелья, стрелы и земляная стена.',hp:95,power:0.95,def:0.02,kbRes:0.08,speed:1.02,jump:1.0,stamina:105,scale:1,acc:{},
  ab:{n:{id:'potion',name:'Potion',cost:25,cd:5,desc:'Зелье со случайным эффектом'},f:{id:'dirtwall',name:'Dirt Barrier',cost:30,cd:9,desc:'Земляная стена на 5 с'},a:{id:'splash',name:'Splash Potions',cost:30,cd:7,desc:'Два зелья вниз'},u:{id:'elixir',name:'Elixir',cost:100,cd:30,desc:'Лечение 30% и сила на 8 c'}}},
 green:{id:'green',name:'Green',rig:'Green',group:'AvM',weapon:'mc_pickaxe',
  lore:'Строитель и шахтёр Stick Gang: алмазная кирка, удочка-крюк, поршни и маяки.',
  style:'Строитель: крюк-удочка, поршень, кирка-пикирование.',hp:100,power:0.98,def:0.04,kbRes:0.12,speed:1.0,jump:1.0,stamina:100,scale:1,acc:{},
  ab:{n:{id:'hook',name:'Fishing Rod',cost:25,cd:5,desc:'Крюк притягивает врага к вам'},f:{id:'piston',name:'Piston Launch',cost:25,cd:7,desc:'Поршень подбрасывает врага вверх'},a:{id:'meteor',name:'Pickaxe Dive',cost:30,cd:8,desc:'Пикирующий удар кирки'},u:{id:'windmill',name:'Windmill',cost:100,cd:25,desc:'Вращающиеся лопасти 5 c вокруг'}}},
 yellow:{id:'yellow',name:'Yellow',rig:'Yellow',group:'AvM',weapon:'mc_crossbow',
  lore:'Инженер Stick Gang: раздатчики со стрелами, TNT и лучи маяков.',
  style:'Инженер: раздатчик, TNT, маяк.',hp:92,power:0.95,def:0.02,kbRes:0.06,speed:1.03,jump:1.0,stamina:100,scale:0.98,acc:{},
  ab:{n:{id:'turret',name:'Dispenser',cost:30,cd:9,desc:'Раздатчик стреляет стрелами 8 c'},f:{id:'tnt',name:'TNT',cost:30,cd:6,desc:'Бросает динамит'},a:{id:'drone',name:'TNT Rain',cost:30,cd:7,desc:'Бомбы сверху'},u:{id:'orbital',name:'Beacon Beam',cost:100,cd:25,desc:'Луч маяка с неба'}}},
 purple:{id:'purple',name:'Purple',rig:'Purple',group:'AvM',weapon:'mc_golden_sword',
  lore:'Король жителей и пиглинов: в короне, с элитрами и жемчугом Края. Ловкий, но хрупкий.',
  style:'Король-акробат: жемчуг Края, элитры, пиглины.',hp:88,power:0.95,def:0.0,kbRes:0.04,speed:1.18,jump:1.1,stamina:100,scale:0.96,doubleJump:1,acc:{crown:'#d4af37',cape:'#8a8fa0'},
  ab:{n:{id:'blink',name:'Ender Pearl',cost:25,cd:6,desc:'Телепорт за спину врага'},f:{id:'dashslash',name:'Gold Dash',cost:25,cd:5,desc:'Рывок мечом сквозь врага'},a:{id:'airdash',name:'Elytra Boost',cost:20,cd:4,desc:'Воздушный рывок'},u:{id:'brutes',name:'Piglin Brutes',cost:100,cd:25,desc:'Три пиглина-громилы бегут вперёд'}}},
 kingorange:{id:'kingorange',name:'King Orange',rig:'King Orange',group:'AvM',weapon:'mc_command_staff',
  lore:'Властелин с посохом командных блоков: удерживает врагов силой (Forcehold), запускает огненные шары и чёрные дыры.',
  style:'Тяжеловес-маг: посох командных блоков.',hp:130,power:1.15,def:0.1,kbRes:0.45,speed:0.82,jump:0.9,stamina:100,scale:1.14,acc:{cape:'#fccd03',crown:'#fccd03'},
  ab:{n:{id:'forcehold',name:'Forcehold',cost:30,cd:7,desc:'Удерживает врага в воздухе и швыряет вниз'},f:{id:'fireball',name:'Fireball',cost:25,cd:4,desc:'Огненный шар'},a:{id:'meteor',name:'Netherite Smash',cost:30,cd:8,desc:'Падение-удар'},u:{id:'royalbeam',name:'Command Beam',cost:100,cd:28,desc:'Мощный луч командного блока'}}}
};
SD.CHAR_ORDER=['second','red','blue','green','yellow','purple','kingorange','chosen','darklord','victim'];

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
// Animation vs. Minecraft (Alan Becker) — items seen in the series
const GOLD=['#f5d142','#c79a1c','#fff3a8'],DIA=['#4aedd9','#2ab5a5','#b8fff5'],IRON=['#d8d8d8','#9a9a9a','#fff'],NETH=['#4a3f4a','#2a232a','#7a6a7a'],STONE=['#8a8a8a','#5e5e5e','#bdbdbd'];
def('mc_stone_sword','Каменный меч','AvM',{len:98,dmg:9,speed:1.0,mass:1.1,mc:'sword',pal:STONE,w:14,desc:'Серия 27: меч скелета-стража Witton.'});
def('mc_iron_sword','Железный меч','AvM',{len:100,dmg:10,speed:1.05,mass:1.0,mc:'sword',pal:IRON,w:14,desc:'Серия 27: такими мечами вооружены клоны Стива.'});
def('mc_golden_sword','Золотой меч','AvM',{len:100,dmg:8,speed:1.3,mass:0.7,mc:'sword',pal:GOLD,w:10,desc:'Лёгкий и очень быстрый. Золото любят пиглины (серия 20).'});
def('mc_diamond_sword','Алмазный меч','AvM',{len:100,dmg:12,speed:1.05,mass:1.0,mc:'sword',pal:DIA,w:8,desc:'Серия 7 (PvP): основное оружие дуэли.'});
def('mc_netherite_sword','Незеритовый меч','AvM',{len:100,dmg:14,speed:1.0,mass:1.3,mc:'sword',pal:NETH,w:5,desc:'Самый мощный меч, огнеупорный.',burn:1});
def('mc_diamond_axe','Алмазный топор','AvM',{len:95,dmg:14,speed:0.85,mass:1.5,style:'smash',kb:1.3,mc:'axe',pal:DIA,w:7,desc:'Серия 12: из ловушки Кролика-убийцы. Тяжёлые удары.'});
def('mc_pickaxe','Алмазная кирка','AvM',{len:95,dmg:11,speed:0.95,mass:1.4,style:'smash',mc:'pickaxe',pal:['#4aedd9','#2ab5a5','#8a5a2a'],w:8,desc:'Серия 25: кирка Green. Ломает блоки и стены арены.'});
def('mc_shovel','Алмазная лопата','AvM',{len:100,dmg:9,speed:1.1,mass:1.0,style:'smash',kb:1.0,mc:'shovel',pal:DIA,w:9,desc:'Серия 25: лопата Green, отлично выбивает оружие.',stun:0.15});
def('mc_trident','Трезубец','AvM',{len:165,pivot:0.3,dmg:13,speed:0.95,mass:1.4,style:'stab',two:true,mc:'trident',pal:['#4fc9b5','#2a8a7a','#b8fff5'],w:5,thrown:1,fx:'elec',shock:14,desc:'Серии 13 и 16: призывает молнию. Сильный удар бьёт током вокруг.'});
def('mc_bow','Лук','AvM',{len:75,pivot:0.5,dmg:9,speed:1.0,mass:0.6,style:'bow',two:true,ammo:14,proj:'arrow',mc:'bow',pal:['#8a5a2a','#c0e0c0','#fff'],w:8,desc:'Серии 6, 7, 24: лук. Зарядка усиливает выстрел.'});
def('mc_crossbow','Арбалет','AvM',{len:70,pivot:0.4,dmg:14,speed:0.8,mass:1.0,style:'xbow',ammo:10,proj:'bolt',mc:'crossbow',pal:['#8a5a2a','#555','#ddd'],w:6,desc:'Оружие пиглинов (серии 20, 25): мощный болт.'});
def('mc_shield','Щит','AvM',{slot:'off',len:60,style:'shield',block:0.9,stam:0.5,mc:'shield',pal:['#a0703a','#d0d0d0','#6a4a22'],mass:1.2,w:8,desc:'Серия 7: щит в левой руке. Блокирует почти весь урон.'});
def('mc_mace','Булава','AvM',{len:90,dmg:16,speed:0.7,mass:2.2,style:'smash',kb:1.7,stam:1.5,fx:'blunt',snd:'hitheavy',mc:'mace',pal:['#6a6a72','#3a3a42','#a0a0aa'],w:5,desc:'Сокрушительные удары, огромный нокбэк.'});
def('mc_fishing_rod','Удочка','AvM',{len:140,pivot:0.2,dmg:5,speed:1.15,mass:0.6,style:'sweep',two:false,kb:0.5,mc:'rod',pal:['#8a5a2a','#ddd','#fff'],w:7,pull:1,desc:'Серии 8, 10, 14, 22, 25: крюк-захват. Удар притягивает врага к вам.'});
def('mc_tnt','TNT','AvM',{len:40,pivot:0.5,dmg:26,speed:1.0,mass:0.6,style:'knives',ammo:2,regen:0.25,proj:'tnt',mc:'tnt',pal:['#d33','#fff','#000'],w:7,desc:'Серии 1, 2, 7, 17: бросаемый динамит — взрывается при контакте. Заряды восстанавливаются.'});
def('mc_ender_pearl','Жемчуг Края','AvM',{len:30,pivot:0.5,dmg:3,speed:1.2,mass:0.3,style:'knives',ammo:3,regen:0.3,proj:'pearl',mc:'pearl',pal:['#1c7a6a','#0a4a40','#8fffe0'],w:6,desc:'Серии 7, 25: бросьте — и телепортируетесь туда, куда упал.'});
def('mc_fire_charge','Огненный заряд','AvM',{len:45,pivot:0.4,dmg:11,speed:1.0,mass:0.7,style:'blaster',ammo:12,regen:0.7,proj:'fireball',mc:'fire',pal:['#ff7a22','#c23a0a','#ffd24a'],w:6,fx:'fire',desc:'Огненные шары гастов и King Orange. Поджигают.'});
def('mc_command_staff','Посох командных блоков','AvM',{len:140,pivot:0.4,dmg:12,speed:1.0,mass:1.0,style:'magic',two:true,ammo:24,regen:1.0,proj:'magic',mc:'cmdstaff',pal:['#c07830','#6a4020','#f5b060'],w:2,fx:'magic',desc:'Серии 22–26: посох King Orange. Лучи энергии; сильный выстрел — веер из трёх.'});
def('mc_trophy','Кубок','AvM',{len:80,dmg:9,speed:1.0,mass:1.2,style:'smash',kb:1.4,fx:'blunt',mc:'trophy',pal:GOLD,w:6,desc:'Серия 17: им бьют как битой во время Build Battle.'});
// Alan Becker / Animator vs. Animation
def('pencil','Pencil Tool','Особое',{len:100,pivot:0.15,dmg:9,speed:1.35,mass:0.5,style:'stab',kb:0.7,stam:0.6,mc:'pencil',pal:['#ffd24a','#c8982a','#ffb0b0'],w:5,desc:'Инструмент The Second Coming — рисует и колет.'});
def('electric_guitar','Электрогитара','Особое',{len:95,dmg:12,speed:0.9,mass:1.4,style:'smash',kb:1.3,fx:'elec',shock:12,mc:'guitar',pal:['#c0392b','#7a1f16','#ddd'],w:4,desc:'Серия 16: гитара The Second Coming — сильный удар создаёт ударную волну.'});
SD.WEAPONS=W;
SD.WEAPON_CATS=['AvM','Холодное','Дальнобойное','Защита','Особое'];
SD.rollRarity=()=>{let t=0;SD.RARITY.forEach(r=>t+=r.w);let x=Math.random()*t;for(const r of SD.RARITY){x-=r.w;if(x<=0)return r.id}return 0};
SD.rollWeapon=(excl)=>{const ids=Object.keys(W).filter(i=>i!=='darklord_sword'||Math.random()<0.25);let tot=0;ids.forEach(i=>tot+=W[i].w);let x=Math.random()*tot;for(const i of ids){x-=W[i].w;if(x<=0)return i}return 'sword'};
})(window.SD);
