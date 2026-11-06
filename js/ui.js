'use strict';
// UIManager: menus, character/weapon/arena selection, settings, editor, results, touch controls.
(function(SD){
const U=SD.U,S=SD.Save;
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pg={time:0,quality:'medium',arena:null,combat:{},particles:{add(){},ring(){},sparks(){}},nearestEnemy:()=>null,audio:SD.Audio};
const UI=SD.UI={s:{screen:'main',tab:'p1',wcat:0,off:false,mode:null},prev:new Map(),raf:0,lastT:0};
const CHAR_LOCK={yellow:1,purple:2,victim:3,chosen:5,kingorange:7,darklord:10};
const ARENA_LOCK={cave:1,ice:2,lava:3,sky:4,future:5,bridge:6,traps:8,final:10};
const MODE_INFO={versus:['1 VS 1','Два игрока на одной клавиатуре. Лучший из 3 раундов.'],bot:['1 VS BOT','Бой против компьютера. Выберите сложность.'],tournament:['Tournament','Турнирная сетка: 7 боёв, соперники всё сильнее. Финал — до 2 побед.'],survival:['Survival','Волны врагов. Побеждайте как можно больше — между волнами восстанавливается часть здоровья.'],chaos:['Weapon Chaos','Оружие постоянно падает с неба в случайных местах. 1 против 2 ботов.'],team:['Team Battle','Команды 2×2 или 3×3. Вы с союзниками-ботами против команды врага.'],free:['Free Fight','Настраиваемая свалка каждый за себя (2–6 бойцов) — см. «Редактор боя».'],training:['Training','Манекен с настройкой поведения, урон и DPS на экране, перезапуск и выдача оружия.']};
UI.game=null;
UI.init=function(game){
 this.game=game;this.root=$('#ui');
 this.root.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(!el)return;SD.Audio.resume();SD.Audio.play('click');this.act(el.dataset.act,el.dataset.v,el)});
 this.root.addEventListener('input',e=>{const el=e.target;if(el.dataset.inp)this.inp(el.dataset.inp,el)});
 this.root.addEventListener('change',e=>{const el=e.target;if(el.dataset.chg)this.inp(el.dataset.chg,el,true)});
 SD.Input.onKey=code=>{if(code==='Escape'||code==='KeyP'){if(game.running)game.pause()}if(code==='KeyT'&&game.running&&game.cfg.mode==='training')this.trainReset();};
 document.addEventListener('pointerdown',()=>SD.Audio.resume(),{once:false});
 this.initTouch();this.show('main');
 const tick=t=>{const dt=Math.min(0.05,(t-this.lastT)/1000||0);this.lastT=t;this.previewTick(dt);requestAnimationFrame(tick)};requestAnimationFrame(tick);
};
UI.toast=function(t){const d=document.createElement('div');d.className='toastItem';d.textContent=t;$('#toast').appendChild(d);setTimeout(()=>d.remove(),4200)};
UI.hideOverlay=function(){this.root.classList.add('hidden');this.root.innerHTML=''};
UI.show=function(name){this.s.screen=name;this.root.classList.remove('hidden');this.prev.clear();this.root.innerHTML=(this['r_'+name]?this['r_'+name]():'');document.body.classList.toggle('playing',false);$('#trainPanel').innerHTML='';$('#trainPanel').classList.add('hidden')};
UI.rerender=function(){const sc=this.root.querySelector('.scroll'),st=sc?sc.scrollTop:0;this.show(this.s.screen);const n=this.root.querySelector('.scroll');if(n)n.scrollTop=st};
const back='<button class="btn small" data-act="show" data-v="main">← Меню</button>';
const cfg=()=>UI.game.cfg;
UI.r_main=function(){const c=cfg();return `<div class="center"><h1 class="title">STICKMAN<br><span>DUEL ARENA</span></h1>
 <div class="sub">Режим: <b>${MODE_INFO[c.mode][0]}</b> · Арена: <b>${SD.ARENAS[c.arena].name}</b> · ${SD.CHARS[c.p1.char].name}</div>
 <div class="menu">
 <button class="btn big" data-act="play">▶ Play</button>
 <button class="btn" data-act="show" data-v="chars">Character Selection</button>
 <button class="btn" data-act="show" data-v="modes">Game Modes</button>
 <button class="btn" data-act="show" data-v="arenas">Arena Selection</button>
 <button class="btn" data-act="show" data-v="weapons">Weapon Selection</button>
 <button class="btn" data-act="show" data-v="editor">Редактор боя</button>
 <button class="btn" data-act="show" data-v="training">Training</button>
 <button class="btn" data-act="show" data-v="settings">Settings</button>
 <button class="btn" data-act="show" data-v="stats">Статистика и достижения</button>
 <button class="btn" data-act="show" data-v="credits">Credits</button></div></div>`};
// ---------- characters ----------
const bar=(v,max,col)=>`<div class="sbar"><i style="width:${Math.min(100,v/max*100)}%;background:${col}"></i></div>`;
UI.charCard=function(id,sel,lock){const c=SD.CHARS[id],rig=SD.RigImporter.rigs[c.rig+' SF.nodes'],col=rig?SD.RigImporter.toProfile(rig).color:'#888';
 return `<div class="card ${sel?'sel':''} ${lock?'lock':''}" data-act="pickchar" data-v="${id}"><canvas data-pc="${id}" width="120" height="150"></canvas><div class="cn"><i class="dot" style="background:${col}"></i>${esc(c.name)}</div>${lock?`<div class="lk">🔒 ${lock} поб.</div>`:''}</div>`};
UI.r_chars=function(){const c=cfg(),tab=this.s.tab,cur=tab==='bot'?c.bot.char:c[tab].char;
 const tabs=['p1','p2','bot'].map(t=>`<button class="tab ${tab===t?'on':''}" data-act="tab" data-v="${t}">${{p1:'Игрок 1',p2:'Игрок 2',bot:'Соперник (бот)'}[t]}</button>`).join('');
 const ids=SD.CHAR_ORDER;const grid=ids.map(id=>this.charCard(id,id===cur,S.isCharUnlocked(id)?0:CHAR_LOCK[id])).join('')+(tab==='bot'?`<div class="card ${cur==='rand'?'sel':''}" data-act="pickchar" data-v="rand"><div class="big">?</div><div class="cn">Случайный</div></div>`:'');
 const cd=SD.CHARS[cur==='rand'?'second':cur];const rig=SD.RigImporter.rigs[cd.rig+' SF.nodes'];
 const ab=cd.ab;
 const abl=[['n','E','нейтрально'],['f','E + →','вперёд'],['a','E в воздухе','воздух'],['u','E + ↓','ультимейт (100 энергии)']].map(([k,key,lab])=>`<div class="ab"><b>${esc(ab[k].name)}</b> <span class="k">${key}</span><br><small>${esc(ab[k].desc)} · ${ab[k].cost} эн.</small></div>`).join('');
 return `<div class="panel"><div class="hdr">${back}<h2>Выбор персонажа</h2><div class="tabs">${tabs}</div></div>
 <div class="two"><div class="scroll grid">${grid}</div>
 <div class="detail"><canvas data-pc="${cur==='rand'?'second':cur}" data-big="1" width="260" height="300"></canvas><h3>${esc(cur==='rand'?'Случайный боец':cd.name)}</h3><p class="muted">${esc(cd.style)}</p>
 <div class="stats"><span>Здоровье</span>${bar(cd.hp,130,'#46d36a')}<span>Сила</span>${bar(cd.power,1.2,'#e8453c')}<span>Защита</span>${bar(cd.def,0.12,'#4aa3ff')}<span>Скорость</span>${bar(cd.speed,1.2,'#ffd24a')}<span>Прыжок</span>${bar(cd.jump,1.1,'#9f6')}<span>Выносл.</span>${bar(cd.stamina,110,'#4ac3ff')}<span>Сопр. отбр.</span>${bar(cd.kbRes,0.5,'#c8a')}</div>
 <div class="abl">${abl}</div><p class="tiny muted">Риг: ${esc(cd.rig)} SF.nodes · узлов: ${rig?rig.nodeCount:'?'}${rig&&rig.accents.length?' · акцент '+rig.accents[0]:''}</p>
 <label class="imp">Импорт .nodes<input type="file" accept=".nodes" data-chg="import"></label></div></div></div>`};
// ---------- modes ----------
UI.r_modes=function(){const c=cfg();const cards=Object.keys(MODE_INFO).map(m=>`<div class="card wide ${c.mode===m?'sel':''}" data-act="pickmode" data-v="${m}"><h3>${MODE_INFO[m][0]}</h3><p>${MODE_INFO[m][1]}</p></div>`).join('');
 const lvl=SD.BOT_LEVELS.map((l,i)=>`<option value="${i}" ${c.botLevel===i?'selected':''}>${l.name}</option>`).join('');
 return `<div class="panel"><div class="hdr">${back}<h2>Режимы игры</h2></div><div class="scroll"><div class="grid2">${cards}</div>
 <div class="opts"><label>Сложность ботов <select data-chg="botLevel">${lvl}</select></label>
 <label>Раундов до победы <select data-chg="rounds">${[1,2,3].map(n=>`<option ${c.rounds===n?'selected':''}>${n}</option>`).join('')}</select></label>
 <label>Время раунда <select data-chg="time">${[30,60,90,0].map(n=>`<option value="${n}" ${c.time===n?'selected':''}>${n?n+' c':'∞'}</option>`).join('')}</select></label>
 <label>Команда <select data-chg="teamSize">${[2,3].map(n=>`<option value="${n}" ${c.teamSize===n?'selected':''}>${n} × ${n}</option>`).join('')}</select></label></div>
 <button class="btn big" data-act="play">▶ Начать: ${MODE_INFO[c.mode][0]}</button></div></div>`};
// ---------- arenas ----------
UI.r_arenas=function(){const c=cfg();const cards=SD.ARENA_ORDER.map(id=>{const a=SD.ARENAS[id],lock=S.isArenaUnlocked(id)?0:ARENA_LOCK[id];const p=a.pal;return `<div class="card wide ${c.arena===id?'sel':''} ${lock?'lock':''}" data-act="pickarena" data-v="${id}"><div class="ap" style="background:linear-gradient(${p.sky1},${p.sky2})"><i style="background:${p.top}"></i></div><h3>${esc(a.name)}</h3><p>${esc(a.desc)}</p>${lock?`<div class="lk">🔒 ${lock} поб.</div>`:''}</div>`}).join('');
 return `<div class="panel"><div class="hdr">${back}<h2>Выбор арены</h2></div><div class="scroll"><div class="grid2">${cards}</div></div></div>`};
// ---------- weapons ----------
UI.r_weapons=function(){const c=cfg(),tab=this.s.tab,sl=tab==='bot'?c.bot:c[tab],off=this.s.off;
 const tabs=['p1','p2','bot'].map(t=>`<button class="tab ${tab===t?'on':''}" data-act="tab" data-v="${t}">${{p1:'Игрок 1',p2:'Игрок 2',bot:'Бот'}[t]}</button>`).join('');
 const cat=SD.WEAPON_CATS[this.s.wcat];const cats=SD.WEAPON_CATS.map((n,i)=>`<button class="tab ${this.s.wcat===i?'on':''}" data-act="wcat" data-v="${i}">${n}</button>`).join('');
 const list=Object.values(SD.WEAPONS).filter(w=>w.cat===cat);
 const cur=off?sl.off:sl.weapon;
 const items=list.map(w=>{const dis=(w.slot==='off')!==off;return `<div class="card wep ${cur===w.id?'sel':''} ${dis?'dim':''}" data-act="pickweapon" data-v="${w.id}"><canvas data-pw="${w.id}" width="150" height="50"></canvas><div class="cn">${esc(w.name)}</div><small>Урон ${w.dmg||'—'} · Длина ${w.len} · Скор. ${w.speed.toFixed(2)}${w.two?' · 2 руки':''}${w.slot==='off'?' · off-hand':''}</small></div>`}).join('');
 const none=`<div class="card ${cur==='none'?'sel':''}" data-act="pickweapon" data-v="none"><div class="big">∅</div><div class="cn">Без оружия</div></div>`+(off?'':`<div class="card ${cur==='auto'?'sel':''}" data-act="pickweapon" data-v="auto"><div class="big">★</div><div class="cn">По умолчанию</div></div><div class="card ${cur==='random'?'sel':''}" data-act="pickweapon" data-v="random"><div class="big">🎲</div><div class="cn">Случайное</div></div>`);
 return `<div class="panel"><div class="hdr">${back}<h2>Выбор оружия</h2><div class="tabs">${tabs}</div></div>
 <div class="hdr"><div class="tabs">${cats}</div><div class="tabs"><button class="tab ${!off?'on':''}" data-act="slot" data-v="0">Основная рука</button><button class="tab ${off?'on':''}" data-act="slot" data-v="1">Вторая рука (щиты)</button></div></div>
 <div class="scroll grid">${none}${items}</div></div>`};
// ---------- settings ----------
const KEYNAMES={left:'Влево',right:'Вправо',jump:'Прыжок',down:'Присесть',light:'Быстрая атака',heavy:'Сильная атака',block:'Блок',ability:'Способность',throw:'Бросок оружия',interact:'Взять/бросить оружие'};
UI.r_settings=function(){const st=S.data.settings,keys=st.keys;
 const kt=p=>`<table class="keys">${Object.keys(KEYNAMES).map(a=>`<tr><td>${KEYNAMES[a]}</td><td><button class="btn small key" data-act="rebind" data-v="${p}.${a}">${esc(keys[p][a].replace('Key','').replace('Arrow','↔'))}</button></td></tr>`).join('')}</table>`;
 return `<div class="panel"><div class="hdr">${back}<h2>Настройки</h2></div><div class="scroll">
 <div class="opts"><label>Общая громкость <input type="range" min="0" max="1" step="0.05" value="${st.master}" data-inp="master"></label>
 <label>Громкость эффектов <input type="range" min="0" max="1" step="0.05" value="${st.sfx}" data-inp="sfx"></label>
 <label>Качество эффектов <select data-chg="quality">${['auto','high','medium','low'].map(q=>`<option value="${q}" ${st.quality===q?'selected':''}>${{auto:'Авто',high:'Высокое',medium:'Среднее',low:'Низкое (слабые устройства)'}[q]}</option>`).join('')}</select></label>
 <label>Тряска экрана <input type="checkbox" ${st.shake?'checked':''} data-chg="shake"></label>
 <label>Сенсорное управление <select data-chg="touch">${['auto','on','off'].map(q=>`<option value="${q}" ${st.touch===q?'selected':''}>${{auto:'Авто',on:'Всегда',off:'Выкл'}[q]}</option>`).join('')}</select></label></div>
 <h3>Управление (нажмите кнопку и затем клавишу)</h3><div class="two"><div><h4>Игрок 1</h4>${kt('p1')}</div><div><h4>Игрок 2</h4>${kt('p2')}</div></div>
 <p class="muted">Общие: Esc / P — пауза · T — перезапуск в тренировке. Перекат: ↓ + движение. Уклонение: назад + блок. Парирование: блок прямо перед ударом.</p>
 <div class="opts"><button class="btn small" data-act="defkeys">Сбросить клавиши</button><button class="btn small" data-act="unlockall">Открыть всё</button><button class="btn small danger" data-act="resetsave">Сбросить прогресс</button></div></div></div>`};
UI.r_credits=function(){const rows=SD.CHAR_ORDER.map(id=>{const c=SD.CHARS[id],r=SD.RigImporter.rigs[c.rig+' SF.nodes'];const p=r?SD.RigImporter.toProfile(r):{};return `<tr><td>${esc(c.rig)} SF.nodes</td><td>${r?r.nodeCount:'-'}</td><td><i class="dot" style="background:${p.color}"></i>${p.rawColor||''}</td><td>${r&&r.accents.length?r.accents.join(', '):'—'}</td></tr>`}).join('');
 const sw=SD.RigImporter.rigs['The Dark Lord Sword SF.nodes'];
 return `<div class="panel"><div class="hdr">${back}<h2>Credits</h2></div><div class="scroll"><p>Stickman Duel Arena — HTML5 Canvas 2D · Web Audio API · localStorage. Персонажи основаны на ригах Alan Becker Character Pack (.nodes), предоставленных пользователем.</p>
 <p class="muted">Файлы .nodes читаются встроенным RigImporter (цвета, структура узлов, акценты). Геометрия скелета и анимации — собственная игровая интерпретация: PNG-кадры/спрайтшиты из Stick Nodes в пакете отсутствовали.</p>
 <table class="keys"><tr><th>Риг</th><th>Узлов</th><th>Цвет</th><th>Акценты</th></tr>${rows}<tr><td>The Dark Lord Sword SF.nodes</td><td>${sw?sw.nodeCount:'-'}</td><td>оружие</td><td>${sw?sw.accents.join(', '):''}</td></tr></table></div></div>`};
UI.r_stats=function(){const d=S.data,st=d.stats;const ach=Object.keys(SD.ACHIEVEMENTS).map(k=>`<div class="ach ${d.achievements[k]?'got':''}">${d.achievements[k]?'🏆':'🔒'} ${esc(SD.ACHIEVEMENTS[k])}</div>`).join('');
 return `<div class="panel"><div class="hdr">${back}<h2>Статистика</h2></div><div class="scroll"><table class="keys"><tr><td>Матчей</td><td>${st.matches}</td></tr><tr><td>Побед</td><td>${st.wins}</td></tr><tr><td>Попаданий</td><td>${Math.round(st.hits)}</td></tr><tr><td>Урона нанесено</td><td>${Math.round(st.damage)}</td></tr><tr><td>Убийств</td><td>${st.kills}</td></tr><tr><td>Макс. комбо</td><td>${st.maxCombo}</td></tr><tr><td>Парирований</td><td>${st.parries}</td></tr><tr><td>Выбито оружия</td><td>${st.disarms}</td></tr><tr><td>Рекорд Survival (убийств)</td><td>${d.records.survivalBest}</td></tr><tr><td>Побед в турнире</td><td>${d.records.tournamentWins}</td></tr><tr><td>Открыто бойцов</td><td>${d.unlockedChars.length}/10</td></tr><tr><td>Открыто арен</td><td>${d.unlockedArenas.length}/12</td></tr></table><h3>Достижения</h3>${ach}</div></div>`};
// ---------- training ----------
UI.r_training=function(){const c=cfg();const dm=[['stand','Стоит'],['block','Блокирует'],['crouch','Присел'],['jump','Прыгает'],['walk','Ходит'],['attack','Атакует'],['bot','Полный бот']].map(([v,n])=>`<option value="${v}" ${c.dummy===v?'selected':''}>${n}</option>`).join('');
 return `<div class="panel"><div class="hdr">${back}<h2>Training</h2></div><div class="scroll"><p class="muted">Тренировочный режим: манекен с настройкой поведения, урон/DPS на экране, перезапуск (T), выдача оружия кнопкой во время боя.</p>
 <div class="opts"><label>Поведение манекена <select data-chg="dummy">${dm}</select></label><label>Бесконечное здоровье манекена <input type="checkbox" ${c.infHp?'checked':''} data-chg="infHp"></label></div>
 <p>Ваш боец: <b>${esc(SD.CHARS[c.p1.char].name)}</b> · Манекен: <b>${esc(SD.CHARS[c.p2.char].name)}</b> · Арена: <b>${esc(SD.ARENAS[c.arena].name)}</b></p>
 <div class="opts"><button class="btn" data-act="show" data-v="chars">Выбрать бойцов</button><button class="btn" data-act="show" data-v="weapons">Оружие</button><button class="btn" data-act="show" data-v="arenas">Арена</button></div>
 <button class="btn big" data-act="starttrain">▶ Начать тренировку</button></div></div>`};
// ---------- editor ----------
UI.r_editor=function(){const c=cfg();const sl=c.fslots;const charOpt=sel=>SD.CHAR_ORDER.map(id=>`<option value="${id}" ${sel===id?'selected':''}>${SD.CHARS[id].name}</option>`).join('')+`<option value="rand" ${sel==='rand'?'selected':''}>Случайный</option>`;
 const wOpt=sel=>`<option value="none" ${sel==='none'?'selected':''}>Без оружия</option><option value="auto" ${sel==='auto'?'selected':''}>По умолч.</option><option value="random" ${sel==='random'?'selected':''}>Случайное</option>`+Object.values(SD.WEAPONS).filter(w=>w.slot==='main').map(w=>`<option value="${w.id}" ${sel===w.id?'selected':''}>${w.name}</option>`).join('');
 const rows=sl.slice(0,c.count).map((s,i)=>`<tr><td>${i+1}</td><td><select data-chg="fs.${i}.char">${charOpt(s.char)}</select></td><td><select data-chg="fs.${i}.weapon">${wOpt(s.weapon)}</select></td><td><select data-chg="fs.${i}.ctrl">${[['p1','Игрок 1'],['p2','Игрок 2'],['bot','Бот']].map(([v,n])=>`<option value="${v}" ${s.ctrl===v?'selected':''}>${n}</option>`).join('')}</select></td><td><select data-chg="fs.${i}.team">${[1,2,3,4,5,6].map(t=>`<option ${s.team===t?'selected':''}>${t}</option>`).join('')}</select></td></tr>`).join('');
 const sld=(k,l,min,max,step,fmt)=>`<label>${l}: <b>${fmt(c[k])}</b><input type="range" min="${min}" max="${max}" step="${step}" value="${c[k]}" data-inp="cfg.${k}"></label>`;
 const saved=Object.keys(S.data.configs).map(n=>`<div class="saved"><b>${esc(n)}</b><button class="btn small" data-act="loadcfg" data-v="${esc(n)}">Загрузить</button><button class="btn small danger" data-act="delcfg" data-v="${esc(n)}">✕</button></div>`).join('')||'<p class="muted">Нет сохранённых конфигураций.</p>';
 return `<div class="panel"><div class="hdr">${back}<h2>Редактор боя</h2></div><div class="scroll">
 <div class="opts"><label>Количество бойцов <select data-chg="count">${[2,3,4,5,6].map(n=>`<option ${c.count===n?'selected':''}>${n}</option>`).join('')}</select></label>
 <label>Арена <select data-chg="arena">${SD.ARENA_ORDER.map(id=>`<option value="${id}" ${c.arena===id?'selected':''} ${S.isArenaUnlocked(id)?'':'disabled'}>${SD.ARENAS[id].name}${S.isArenaUnlocked(id)?'':' 🔒'}</option>`).join('')}</select></label>
 <label>Сложность ботов <select data-chg="botLevel">${SD.BOT_LEVELS.map((l,i)=>`<option value="${i}" ${c.botLevel===i?'selected':''}>${l.name}</option>`).join('')}</select></label></div>
 <table class="keys ed"><tr><th>#</th><th>Боец</th><th>Оружие</th><th>Управление</th><th>Команда</th></tr>${rows}</table>
 <div class="opts">${sld('hp','Здоровье %',25,300,5,v=>v+'%')}${sld('speed','Скорость боя',0.5,1.5,0.05,v=>v.toFixed(2)+'×')}${sld('gravity','Гравитация',0.4,1.6,0.05,v=>v.toFixed(2)+'×')}${sld('knockback','Сила отбрасывания',0.5,2.5,0.1,v=>v.toFixed(1)+'×')}
 <label>Подбор оружия <input type="checkbox" ${c.pickups?'checked':''} data-chg="pickups"></label><label>Разрушаемость <input type="checkbox" ${c.destruct?'checked':''} data-chg="destruct"></label></div>
 <div class="opts"><input id="cfgname" placeholder="Название конфигурации" maxlength="24"><button class="btn small" data-act="savecfg">💾 Сохранить</button></div>${saved}
 <button class="btn big" data-act="startfree">⚔ В бой!</button></div></div>`};
// ---------- results / pause / bracket ----------
UI.showResults=function(d,game){const m=game.m;const rows=d.fighters.map(f=>`<tr class="${f.team===d.win?'win':''}"><td>${esc(f.name)}</td><td>${f.hits}</td><td>${f.damage}</td><td>${f.maxCombo}</td></tr>`).join('');
 const wf=d.fighters.find(f=>f.team===d.win),lf=d.fighters.filter(f=>f.team!==d.win);
 const title=d.mode==='survival'?`Выживание: волна ${d.wave}`:d.win===null?'Ничья':(d.humanWon?'ПОБЕДА!':'ПОРАЖЕНИЕ');
 const sub=d.mode==='survival'?`Убито врагов: <b>${d.kills}</b> · Рекорд: <b>${d.record}</b>`:(wf?`Победитель: <b>${esc(wf.name)}</b> · Проигравший: <b>${esc(lf.map(x=>x.name).join(', '))}</b>`:'');
 this.root.classList.remove('hidden');document.body.classList.remove('playing');
 this.root.innerHTML=`<div class="center"><div class="resbox"><h1 class="${d.humanWon?'win':'lose'}">${title}</h1><p>${sub}</p><p>Длительность боя: <b>${U.fmtTime(d.duration)}</b></p>
 <table class="keys"><tr><th>Боец</th><th>Попаданий</th><th>Урон</th><th>Макс. комбо</th></tr>${rows}</table>${d.unlocked&&d.unlocked.length?`<p class="unl">🔓 Открыто: ${d.unlocked.map(esc).join(', ')}</p>`:''}
 <div class="menu row"><button class="btn big" data-act="rematch">Реванш</button><button class="btn" data-act="show" data-v="chars">Выбор персонажей</button><button class="btn" data-act="tomenu">В меню</button></div></div></div>`;
 $('#trainPanel').classList.add('hidden')};
UI.showBracket=function(game){const m=game.m;this.root.classList.remove('hidden');
 const rows=m.bracket.map((b,i)=>`<div class="br ${i<m.bi?'done':i===m.bi?'cur':''}">${i<m.bi?'✔':i===m.bi?'▶':'•'} Бой ${i+1}: ${esc(SD.CHARS[b.char].name)} <small>(${SD.BOT_LEVELS[b.level].name})</small></div>`).join('');
 this.root.innerHTML=`<div class="center"><div class="resbox"><h1 class="win">Бой ${m.bi+1} выигран!</h1><p>Турнирная сетка:</p>${rows}<div class="menu row"><button class="btn big" data-act="nextbracket">Следующий бой →</button><button class="btn" data-act="tomenu">Выйти</button></div></div></div>`};
UI.onPause=function(p){if(p){this.root.classList.remove('hidden');this.root.innerHTML=`<div class="center"><div class="resbox"><h1>Пауза</h1><div class="menu"><button class="btn big" data-act="resume">Продолжить</button><button class="btn" data-act="restart">Рестарт</button><label class="pl">Громкость <input type="range" min="0" max="1" step="0.05" value="${S.data.settings.master}" data-inp="master"></label><button class="btn" data-act="tomenu">В главное меню</button></div><p class="muted tiny">P1: A/D ходьба, W прыжок, S присесть, F/G атаки, H блок, E способность (вперёд/в воздухе/вниз+E — разные), Q бросок, R взять/бросить<br>P2: стрелки, K/L, J, O, U, I</p></div></div>`}else this.hideOverlay()};
UI.onMatchStart=function(game){this.hideOverlay();document.body.classList.add('playing');this.setupTouch();this.trainPanel(game)};
UI.onMatchStop=function(){document.body.classList.remove('playing');$('#trainPanel').classList.add('hidden')};
UI.trainPanel=function(game){const p=$('#trainPanel');if(game.cfg.mode!=='training'){p.classList.add('hidden');return}p.classList.remove('hidden');
 const wl=Object.values(SD.WEAPONS).map(w=>`<option value="${w.id}">${w.name}</option>`).join('');
 p.innerHTML=`<select id="tdm">${[['stand','Стоит'],['block','Блокирует'],['crouch','Присел'],['jump','Прыгает'],['walk','Ходит'],['attack','Атакует'],['bot','Полный бот']].map(([v,n])=>`<option value="${v}" ${game.train.dummy===v?'selected':''}>${n}</option>`).join('')}</select><button data-tr="reset">↺ Сброс (T)</button><select id="tw">${wl}</select><button data-tr="spawn">+ Оружие</button><button data-tr="exit">Меню</button>`;
 p.onclick=e=>{const b=e.target.closest('button');if(!b)return;const a=b.dataset.tr;if(a==='reset')this.trainReset();if(a==='spawn'){const f=game.fighters[0];game.items.spawn(f.root.x+f.face*120,f.root.y-60,$('#tw').value,{rarity:0,life:60})}if(a==='exit')this.act('tomenu')};
 p.onchange=e=>{if(e.target.id==='tdm'){game.train.dummy=e.target.value;game.cfg.dummy=e.target.value;if(game.fighters[1]&&game.fighters[1].ctrl.dummy)game.fighters[1].ctrl.dummy.mode=e.target.value}}};
UI.trainReset=function(){const g=this.game;g.train.total=0;g.train.hits=0;g.train.last=0;g.train.dps=[];g.placeAll();g.fighters.forEach((f,i)=>{f.main=null;f.off=null;g.loadout(f,i?{weapon:g.cfg.p2.weapon,off:g.cfg.p2.off}:{weapon:g.cfg.p1.weapon,off:g.cfg.p1.off})});g.items.reset();g.proj.reset()};
// ---------- actions ----------
UI.act=function(a,v,el){const g=this.game,c=g.cfg;
 switch(a){
 case 'show':this.show(v);break;
 case 'play':if(c.mode==='training'&&false){}g.start(c);S.data.last=JSON.parse(JSON.stringify(c));S.save();break;
 case 'starttrain':c.mode='training';g.start(c);break;
 case 'startfree':c.mode='free';g.start(c);break;
 case 'tab':this.s.tab=v;this.rerender();break;
 case 'wcat':this.s.wcat=+v;this.rerender();break;
 case 'slot':this.s.off=v==='1';this.rerender();break;
 case 'pickchar':{if(v!=='rand'&&!S.isCharUnlocked(v)){this.toast('Персонаж заблокирован — выигрывайте матчи');return}const t=this.s.tab;(t==='bot'?c.bot:c[t]).char=v;if(t==='p1'||t==='p2'){const i=c.fslots.findIndex(s=>s.ctrl===t);if(i>=0)c.fslots[i].char=v}this.rerender();break}
 case 'pickmode':c.mode=v;if(v==='tournament')c.rounds=1;if(v==='versus'||v==='bot')c.rounds=Math.max(c.rounds,2);this.rerender();S.data.last=c;S.save();break;
 case 'pickarena':if(!S.isArenaUnlocked(v)){this.toast('Арена заблокирована — выигрывайте матчи');return}c.arena=v;this.rerender();break;
 case 'pickweapon':{const t=this.s.tab,sl=t==='bot'?c.bot:c[t];const w=SD.WEAPONS[v];if(v!=='none'&&v!=='auto'&&v!=='random'&&(w.slot==='off')!==this.s.off){this.toast(this.s.off?'Выберите щит':'Это оружие для основной руки');return}if(this.s.off)sl.off=v;else sl.weapon=v;this.rerender();break}
 case 'resume':g.pause(false);break;
 case 'restart':g.paused=false;this.hideOverlay();g.restart();break;
 case 'rematch':g.restart();break;
 case 'tomenu':g.paused=false;g.stop();this.show('main');break;
 case 'nextbracket':g.nextBracket();break;
 case 'rebind':{const [p,k]=v.split('.');el.textContent='…';SD.Input.rebind=code=>{SD.Input.rebind=null;if(code!=='Escape'){S.data.settings.keys[p][k]=code;S.save()}this.rerender()};break}
 case 'defkeys':S.data.settings.keys=JSON.parse(JSON.stringify(S.defaultKeys));S.save();this.rerender();break;
 case 'unlockall':S.unlockAll();this.toast('Всё открыто');this.rerender();break;
 case 'resetsave':if(confirm('Сбросить весь прогресс?')){S.reset();this.rerender()}break;
 case 'savecfg':{const n=($('#cfgname').value||'Бой '+(Object.keys(S.data.configs).length+1)).trim();S.data.configs[n]=JSON.parse(JSON.stringify(c));S.save();this.rerender();this.toast('Сохранено: '+n);break}
 case 'loadcfg':{const o=S.data.configs[v];if(o){Object.assign(g.cfg,JSON.parse(JSON.stringify(o)));this.rerender();this.toast('Загружено')}break}
 case 'delcfg':delete S.data.configs[v];S.save();this.rerender();break;
 }};
UI.inp=function(k,el,chg){const g=this.game,c=g.cfg,st=S.data.settings;let v=el.type==='checkbox'?el.checked:el.value;
 if(k==='master'){st.master=+v;SD.Audio.setVol(st.master,st.sfx);S.save();return}
 if(k==='sfx'){st.sfx=+v;SD.Audio.setVol(st.master,st.sfx);S.save();return}
 if(k==='quality'){st.quality=v;S.save();g.setQuality(v);return}
 if(k==='shake'){st.shake=v;S.save();return}
 if(k==='touch'){st.touch=v;S.save();this.setupTouch();return}
 if(k==='import'){const f=el.files[0];if(f)SD.RigImporter.importFile(f,(err,rig,name)=>{if(err){this.toast('Ошибка импорта: '+err.error);return}this.importRig(rig,name)});return}
 if(k.startsWith('cfg.')){const kk=k.slice(4);c[kk]=+v;const lab=el.parentElement.querySelector('b');if(lab)lab.textContent=({hp:v+'%',speed:(+v).toFixed(2)+'×',gravity:(+v).toFixed(2)+'×',knockback:(+v).toFixed(1)+'×'})[kk];return}
 if(k.startsWith('fs.')){const [,i,f]=k.split('.');const s=c.fslots[+i];s[f]=f==='team'?+v:v;if(f==='ctrl'&&(v==='p1'||v==='p2'))c.fslots.forEach((o,j)=>{if(j!==+i&&o.ctrl===v)o.ctrl='bot'});if(chg)this.rerender();return}
 if(['botLevel','rounds','time','teamSize','count'].includes(k)){c[k]=+v;if(k==='count')while(c.fslots.length<c.count)c.fslots.push({char:'rand',weapon:'auto',ctrl:'bot',team:c.fslots.length+1});if(chg)this.rerender();return}
 if(k==='arena'){c.arena=v;return}
 if(k==='dummy'||k==='infHp'||k==='pickups'||k==='destruct'){c[k]=v;return}
};
UI.importRig=function(rig,name){const prof=SD.RigImporter.toProfile(rig,name);
 if(rig.nodeCount>100){ // looks like a weapon rig
  const id='imp_'+name.replace(/\W/g,'_').toLowerCase();SD.WEAPONS[id]=Object.assign({},SD.WEAPONS.sword,{id,name:name+' (импорт)',cat:'Особое',col:prof.color==='#222222'?(prof.accent||'#ff2222'):prof.color,glow:prof.accent||prof.color,dmg:16,len:130,speed:0.85,w:5,sil:id});this.toast('Оружие импортировано: '+name);return}
 const id='imp_'+name.replace(/\W/g,'_').toLowerCase();SD.CHARS[id]={id,name:name+' (импорт)',rig:name,group:'IMP',style:'Импортированный риг: цвет и дополнительные узлы из .nodes.',hp:100,power:1,def:0.03,kbRes:0.1,speed:1,jump:1,stamina:100,scale:1,color:prof.color,acc:prof.extraNodes>=20&&prof.accent?{cape:prof.accent}:{hair:prof.color},ab:JSON.parse(JSON.stringify(SD.CHARS.second.ab))};
 SD.RigImporter.rigs[name+' SF.nodes']=rig;SD.CHAR_ORDER.push(id);S.data.unlockedChars.push(id);this.toast('Персонаж импортирован: '+name);this.rerender()};
// ---------- previews ----------
UI.previewTick=function(dt){
 pg.time+=dt;const cs=this.root.querySelectorAll('canvas[data-pc],canvas[data-pw]');
 cs.forEach(cv=>{const ctx=cv.getContext('2d');ctx.clearRect(0,0,cv.width,cv.height);
  if(cv.dataset.pc){let pf=this.prev.get(cv);if(!pf){const sl=this.s.tab==='bot'?this.game.cfg.bot:this.game.cfg[this.s.tab]||this.game.cfg.p1;pf=new SD.PreviewFighter(pg,cv.dataset.pc,this.s.screen==='chars'&&cv.dataset.big?sl.weapon==='auto'?SD.CHARS[cv.dataset.pc].weapon:sl.weapon:SD.CHARS[cv.dataset.pc].weapon,{});this.prev.set(cv,pf)}
   pf.update(dt,pg);ctx.save();const sc=cv.height/175;ctx.translate(cv.width/2,cv.height*0.92);ctx.scale(sc,sc);pf.draw(ctx,pg);ctx.restore()}
  else{const d=SD.WEAPONS[cv.dataset.pw];ctx.save();const sc=Math.min(1.4,(cv.width-20)/(d.len*1.1),(cv.height-6)/50);ctx.translate(cv.width/2-(0.5-d.pivot)*d.len*sc,cv.height/2);ctx.scale(sc,sc);if(d.slot==='off'||d.style==='bow'){ctx.rotate(0)}else ctx.rotate(0);SD.Weapons.drawShape(ctx,d,pg.time,0,'medium');ctx.restore()}
 })};
// ---------- touch controls ----------
UI.initTouch=function(){
 const T=SD.Input.touch,el=$('#touch');const joy=$('#joy'),knob=$('#knob');let jid=null,jc=null;
 const jr=()=>Math.max(40,Math.min(innerWidth,innerHeight)*0.11);
 const jmove=e=>{if(e.pointerId!==jid)return;const r=jr();let dx=e.clientX-jc[0],dy=e.clientY-jc[1];const l=Math.hypot(dx,dy);if(l>r){dx*=r/l;dy*=r/l}knob.style.transform=`translate(${dx}px,${dy}px)`;T.x=Math.abs(dx)>r*0.3?Math.sign(dx):0;T.y=dy/r;T.jumpHeld=dy<-r*0.55};
 joy.addEventListener('pointerdown',e=>{e.preventDefault();jid=e.pointerId;joy.setPointerCapture(jid);const rc=joy.getBoundingClientRect();jc=[rc.left+rc.width/2,rc.top+rc.height/2];jmove(e);SD.Audio.resume()});
 joy.addEventListener('pointermove',jmove);
 const jend=e=>{if(e.pointerId!==jid)return;jid=null;knob.style.transform='';T.x=0;T.y=0;T.jumpHeld=false};joy.addEventListener('pointerup',jend);joy.addEventListener('pointercancel',jend);
 el.querySelectorAll('[data-b]').forEach(b=>{const k=b.dataset.b;
  b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);b.classList.add('on');SD.Audio.resume();
   if(k==='block')T.block=true;else if(k==='light'){T.ev.light=true;T.lightHeld=true}else if(k==='heavy'){T.ev.heavy=true;T.heavyHeld=true}else if(k==='jump'){T.ev.jump=true;T.jumpHeld=true}else if(k==='pause'){UI.game.pause()}else T.ev[k]=true});
  const up=e=>{b.classList.remove('on');if(k==='block')T.block=false;if(k==='light')T.lightHeld=false;if(k==='heavy')T.heavyHeld=false;if(k==='jump')T.jumpHeld=false};b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up)});
 ['gesturestart','dblclick','contextmenu'].forEach(n=>el.addEventListener(n,e=>e.preventDefault()));
};
UI.setupTouch=function(){const st=S.data.settings.touch;const touchy='ontouchstart' in window||(window.matchMedia&&matchMedia('(pointer:coarse)').matches);const on=st==='on'||(st==='auto'&&touchy);SD.Input.touch.active=on;document.body.classList.toggle('touchon',on)};
})(window.SD);
