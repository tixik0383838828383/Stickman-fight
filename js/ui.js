'use strict';
// UI: main menu, lobby (1-4 players), encyclopedia, settings, results, per-player touch pads.
(function(SD){
const U=SD.U,S=SD.Save;
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pg={time:0,quality:'medium',arena:null,combat:{},particles:{add(){},ring(){},sparks(){}},nearestEnemy:()=>null,audio:SD.Audio};
const UI=SD.UI={s:{screen:'main',wiki:'chars',optsOpen:false,lobby:null},prev:new Map(),lastT:0};
const touchy=()=>('ontouchstart' in window)||(window.matchMedia&&matchMedia('(pointer:coarse)').matches);
const MODE=[ // id, title, icon, desc, min,max,bots,teams
 ['versus','Дуэль','⚔','Бой до победы: 1–4 игрока и боты. Каждый сам за себя.',2,4,1,0],
 ['team','Команды','🛡','Команды А и Б (до 6 бойцов).',4,6,1,'ab'],
 ['free','Свободный бой','💥','Все против всех, 2–6 бойцов, команды по желанию.',2,6,1,'num'],
 ['football','Футбол','⚽','Забейте мяч в ворота соперника. Команды А и Б.',2,6,1,'ab'],
 ['survival','Выживание','🏹','Волны врагов. Играйте до последнего. 1–4 игрока вместе.',1,4,0,0],
 ['zombie','Зомби','🧟','Волны зомби. После каждой волны выбирайте улучшение!',1,4,0,0],
 ['tournament','Турнир','🏆','7 боёв против всё более сильных бойцов.',1,1,0,0],
 ['chaos','Хаос оружия','🎲','Оружие падает с неба — подбирайте и сражайтесь.',2,4,1,0],
 ['training','Тренировка','🎯','Манекен, урон и DPS на экране, выдача оружия.',1,1,0,0]];
const MI=Object.fromEntries(MODE.map(m=>[m[0],m]));
const CTRLS=['k1','k2','k3','g0','g1','g2','g3','t0','t1','t2','t3'];
UI.game=null;
UI.init=function(game){
 this.game=game;this.root=$('#ui');
 this.root.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(!el)return;SD.Audio.resume();SD.Audio.play('click');this.act(el.dataset.act,el.dataset.v,el)});
 this.root.addEventListener('input',e=>{const el=e.target;if(el.dataset.inp)this.inp(el.dataset.inp,el)});
 this.root.addEventListener('change',e=>{const el=e.target;if(el.dataset.chg)this.inp(el.dataset.chg,el,true)});
 SD.Input.onKey=code=>{if(code==='Escape'||code==='KeyP'){if(game.running)game.pause()}if(code==='KeyT'&&game.running&&game.cfg.mode==='training')this.trainReset();};
 document.addEventListener('pointerdown',()=>SD.Audio.resume());
 this.fixSlots();this.show('main');
 const tick=t=>{const dt=Math.min(0.05,(t-this.lastT)/1000||0);this.lastT=t;this.previewTick(dt);requestAnimationFrame(tick)};requestAnimationFrame(tick);
};
UI.toast=function(t){const d=document.createElement('div');d.className='toastItem';d.textContent=t;$('#toast').appendChild(d);setTimeout(()=>d.remove(),4200)};
UI.hideOverlay=function(){this.root.classList.add('hidden');this.root.innerHTML=''};
UI.show=function(name){this.s.screen=name;this.root.classList.remove('hidden');this.prev.clear();this.root.innerHTML=(this['r_'+name]?this['r_'+name]():'');document.body.classList.remove('playing');$('#trainPanel').innerHTML='';$('#trainPanel').classList.add('hidden')};
UI.rerender=function(){const sc=this.root.querySelector('.scroll,.slots'),st=sc?sc.scrollLeft:0,sy=sc?sc.scrollTop:0;this.show(this.s.screen);const n=this.root.querySelector('.scroll,.slots');if(n){n.scrollLeft=st;n.scrollTop=sy}};
const cfg=()=>UI.game.cfg;
const back='<button class="btn small" data-act="show" data-v="main">← Меню</button>';
// make sure saved cfg is valid for the new slot model
UI.fixSlots=function(){const c=cfg();if(!c.slots||c.slots.length<6){c.slots=SD.defaultSlots()}
 c.slots.forEach((s,i)=>{if(!SD.CHARS[s.char]&&s.char!=='rand')s.char='second';if(s.weapon!=='auto'&&s.weapon!=='none'&&s.weapon!=='random'&&!SD.WEAPONS[s.weapon])s.weapon='auto';if(s.off!=='none'&&!SD.WEAPONS[s.off])s.off='none';if(!MODE.some(m=>m[0]===c.mode))c.mode='versus'})};
// ---------- main menu ----------
UI.r_main=function(){
 const tile=m=>`<button class="tile" data-act="lobby" data-v="${m[0]}:${Math.min(m[5],Math.max(m[4],m[0]==='football'||m[0]==='team'?2:1))}"><span class="ti">${m[2]}</span><b>${m[1]}</b></button>`;
 const pl=n=>`<button class="btn big pl${n}" data-act="lobby" data-v="versus:${n}"><span class="num">${n}</span>${['','игрок','игрока','игрока','игрока'][n]}</button>`;
 return `<div class="center main"><h1 class="title">STICKMAN<br><span>DUEL ARENA</span></h1>
 <div class="plrow">${[1,2,3,4].map(pl).join('')}</div>
 <div class="tiles">${['survival','zombie','football','team','tournament','chaos','free','training'].map(id=>tile(MI[id])).join('')}</div>
 <div class="menu row"><button class="btn" data-act="show" data-v="wiki">📖 Бойцы и оружие</button><button class="btn" data-act="show" data-v="settings">⚙ Настройки</button><button class="btn" data-act="show" data-v="stats">🏆 Статистика</button><button class="btn" data-act="show" data-v="credits">ℹ Credits</button></div></div>`};
// ---------- lobby ----------
UI.openLobby=function(mode,players){const c=cfg(),m=MI[mode];c.mode=mode;const useTouch=touchy();
 const hc=useTouch?['t0','t1','t2','t3']:['k1','k2','k3','g0'];
 let n=m[4];let humans=players;
 if(mode==='versus'){n=Math.max(2,Math.min(4,players))}
 else if(mode==='team'){n=4;humans=Math.min(players,4)}
 else if(mode==='free'){n=Math.max(3,players)}
 else if(mode==='football'){n=Math.max(2,Math.ceil(players/2)*2);if(players===1)n=2}
 else if(mode==='chaos'){n=Math.max(2,Math.min(4,players+1))}
 else n=Math.min(m[5],Math.max(m[4],players));
 c.count=n;if(!m[6]||m[5]===1)humans=Math.min(players,m[5]);
 const sl=c.slots;
 for(let i=0;i<6;i++){const s=sl[i];s.ctrl=i<n?(i<humans?hc[i]:'bot'):'off';if(m[6]===0&&i>=humans)s.ctrl=i<n&&i<humans?hc[i]:'off';
  if(mode==='survival'||mode==='zombie'){s.ctrl=i<players?hc[i]:'off'}
  s.team=m[7]==='ab'?(i%2)+1:(mode==='versus'||mode==='chaos'||mode==='free'?i+1:1);
  if(mode==='team')s.team=i<2?1:2}
 if(mode==='team'){sl[0].team=1;sl[1].team=1;sl[2].team=2;sl[3].team=2}
 if(c.arena==='stadium'&&mode!=='football')c.arena='training';
 if(mode==='football')c.arena='stadium';
 if(mode==='football'){c.time=90}else if(c.time===90&&c.mode!=='versus')c.time=60;
 this.s.optsOpen=false;this.show('lobby')};
const weaponIds=()=>{const cats=SD.WEAPON_CATS,ids=Object.values(SD.WEAPONS).filter(w=>w.slot==='main').sort((a,b)=>cats.indexOf(a.cat)-cats.indexOf(b.cat));return ids.map(w=>w.id)};
const offIds=()=>['none',...Object.values(SD.WEAPONS).filter(w=>w.slot==='off').map(w=>w.id)];
const wLabel=(s)=>s.weapon==='auto'?'По умолчанию':s.weapon==='none'?'Без оружия':s.weapon==='random'?'Случайное':SD.WEAPONS[s.weapon].name;
UI.slotCard=function(s,i,c,spec){
 const char=s.char==='rand'?null:SD.CHARS[s.char];const bot=s.ctrl==='bot';const dummy=c.mode==='training'&&i===1;
 const wid=s.weapon==='auto'?(char&&char.weapon)||'none':s.weapon;
 const team=spec[7]==='ab'?`<button class="chip t${s.team}" data-act="team" data-v="${i}">${s.team===1?'А':'Б'}</button>`:spec[7]==='num'?`<button class="chip t${s.team}" data-act="team" data-v="${i}">Ком.${s.team}</button>`:'';
 const ctl=dummy?'<span class="chip">🎯 Манекен</span>':`<button class="chip ctl ${bot?'bot':''}" data-act="ctrl" data-v="${i}">${esc(SD.Input.label(s.ctrl))}</button>`;
 const lvl=bot&&!dummy?`<button class="chip" data-act="level" data-v="${i}">${esc(SD.BOT_LEVELS[s.level!==undefined?s.level:c.botLevel].name)}</button>`:'';
 const offRow=(wid&&SD.WEAPONS[wid]&&SD.WEAPONS[wid].two)?'':`<div class="wrow"><button class="ar" data-act="off" data-v="${i}:-1">◀</button><span>${s.off==='none'?'Без щита':esc(SD.WEAPONS[s.off].name)}</span><button class="ar" data-act="off" data-v="${i}:1">▶</button></div>`;
 return `<div class="slot st${s.team}"><div class="sh"><b>${dummy?'Цель':'P'+(i+1)}</b>${ctl}${lvl}${team}</div>
 <div class="sp"><button class="ar" data-act="char" data-v="${i}:-1">◀</button><canvas data-pc="${s.char==='rand'?'second':s.char}" data-w="${wid}" width="150" height="170"></canvas><button class="ar" data-act="char" data-v="${i}:1">▶</button></div>
 <div class="sn">${s.char==='rand'?'🎲 Случайный':esc(char.name)}</div><div class="sd">${s.char==='rand'?'Случайный боец в начале раунда':esc(char.style)}</div>
 <div class="wrow"><button class="ar" data-act="wpn" data-v="${i}:-1">◀</button><span><b>${esc(wLabel(s))}</b></span><button class="ar" data-act="wpn" data-v="${i}:1">▶</button></div>
 <canvas class="wcv" data-pw="${wid&&SD.WEAPONS[wid]?wid:''}" width="170" height="40"></canvas>${offRow}</div>`};
UI.r_lobby=function(){const c=cfg(),spec=MI[c.mode],n=c.count;
 const shown=c.slots.slice(0,n);const A=SD.ARENAS[c.arena];const p=A.pal;
 const canAdd=n<spec[5],canDel=n>spec[4];
 const cards=shown.map((s,i)=>this.slotCard(s,i,c,spec)).join('');
 const optsModal=this.s.optsOpen?this.optsHtml(c,spec):'';
 return `<div class="lobby"><div class="lh">${back}<h2>${spec[2]} ${spec[1]}</h2><span class="ld">${esc(spec[3])}</span>
  <div class="mapsel"><button class="ar" data-act="map" data-v="-1">◀</button><div class="mp" style="background:linear-gradient(${p.sky1},${p.sky2})"><i style="background:${p.top}"></i><span>${esc(A.name)}</span></div><button class="ar" data-act="map" data-v="1">▶</button></div>
  <button class="btn small" data-act="opts">⚙ Настройки боя</button></div>
 <div class="slots">${cards}</div>
 <div class="lf">${spec[4]<spec[5]?`<div class="cnt"><button class="ar" data-act="cnt" data-v="-1" ${canDel?'':'disabled'}>−</button><span>Бойцов: <b>${n}</b></span><button class="ar" data-act="cnt" data-v="1" ${canAdd?'':'disabled'}>＋</button></div>`:''}
  <button class="btn small" data-act="savecfg">💾 Сохранить</button>${Object.keys(S.data.configs).length?`<select data-chg="loadcfg"><option value="">Загрузить сетап…</option>${Object.keys(S.data.configs).map(k=>`<option>${esc(k)}</option>`).join('')}</select>`:''}
  <button class="btn big go" data-act="play">▶ В БОЙ</button></div>${optsModal}</div>`};
UI.optsHtml=function(c,spec){
 const sel=(k,arr,fmt)=>`<select data-chg="o.${k}">${arr.map(v=>`<option value="${v}" ${c[k]==v?'selected':''}>${fmt?fmt(v):v}</option>`).join('')}</select>`;
 const chk=(k,l)=>`<label class="ck"><input type="checkbox" data-chg="o.${k}" ${c[k]?'checked':''}>${l}</label>`;
 const lvl=`<select data-chg="o.botLevel">${SD.BOT_LEVELS.map((l,i)=>`<option value="${i}" ${c.botLevel===i?'selected':''}>${l.name}</option>`).join('')}</select>`;
 const wave=c.mode==='survival'||c.mode==='zombie',tr=c.mode==='training';
 return `<div class="modal"><div class="mbox"><h3>Настройки боя</h3><div class="scroll">
  <div class="orow"><span>Сложность ботов</span>${lvl}</div>
  ${!wave&&!tr&&c.mode!=='football'&&c.mode!=='tournament'?`<div class="orow"><span>Раундов до победы</span>${sel('rounds',[1,2,3,5])}</div>`:''}
  ${c.mode==='football'?`<div class="orow"><span>Голов до победы</span>${sel('goals',[1,3,5,10])}</div>`:''}
  ${!wave&&!tr&&c.mode!=='tournament'?`<div class="orow"><span>Время раунда</span>${sel('time',[30,60,90,120,0],v=>v?v+' c':'∞')}</div>`:''}
  <div class="orow"><span>Здоровье бойцов</span>${sel('hp',[50,100,150,200,300],v=>v+'%')}</div>
  <div class="orow"><span>Скорость игры</span>${sel('speed',[0.7,0.85,1,1.15,1.3],v=>v+'×')}</div>
  <div class="orow"><span>Гравитация</span>${sel('gravity',[0.3,0.6,1,1.4],v=>v===1?'Обычная':v<1?'Низкая '+v+'×':'Высокая '+v+'×')}</div>
  <div class="orow"><span>Отбрасывание</span>${sel('knockback',[0.5,1,1.5,2.5],v=>v+'×')}</div>
  ${chk('instaKO','Мгновенный КО от лавы и шипов')}${chk('pickups','Оружие появляется на арене')}${chk('destruct','Разрушаемые объекты')}
  ${tr?`<div class="orow"><span>Манекен</span><select data-chg="o.dummy">${[['stand','Стоит'],['block','Блокирует'],['crouch','Присел'],['jump','Прыгает'],['walk','Ходит'],['attack','Атакует'],['bot','Полный бот']].map(([v,n])=>`<option value="${v}" ${c.dummy===v?'selected':''}>${n}</option>`).join('')}</select></div>${chk('infHp','Манекен не умирает')}`:''}
  </div><button class="btn big" data-act="opts">Готово</button></div></div>`};
// ---------- wiki ----------
const bar=(v,max,col)=>`<div class="sbar"><i style="width:${Math.min(100,v/max*100)}%;background:${col}"></i></div>`;
UI.r_wiki=function(){const tab=this.s.wiki;
 const tabs=`<div class="tabs"><button class="tab ${tab==='chars'?'on':''}" data-act="wiki" data-v="chars">Бойцы</button><button class="tab ${tab==='weapons'?'on':''}" data-act="wiki" data-v="weapons">Оружие</button></div>`;
 let body='';
 if(tab==='chars'){body=SD.CHAR_ORDER.map(id=>{const c=SD.CHARS[id],r=SD.RigImporter.rigs[c.rig+' SF.nodes'];const wn=c.weapon&&c.weapon!=='none'&&SD.WEAPONS[c.weapon]?SD.WEAPONS[c.weapon].name:'без оружия';
  const abl=[['n','E'],['f','E + →'],['a','E в воздухе'],['u','E + ↓ (100 энергии)']].map(([k,key])=>`<div class="ab"><b>${esc(c.ab[k].name)}</b> <span class="k">${key}</span><br><small>${esc(c.ab[k].desc)} · ${c.ab[k].cost} эн.</small></div>`).join('');
  return `<div class="wcard"><canvas data-pc="${id}" width="130" height="160"></canvas><div class="wb"><h3>${esc(c.name)} <small>${esc(c.group)}</small></h3><p>${esc(c.lore)}</p><p class="muted">Стартовое оружие: ${esc(wn)} · риг ${esc(c.rig)} (${r?r.nodeCount:'?'} узлов)</p>
  <div class="stats"><span>Здоровье</span>${bar(c.hp,130,'#46d36a')}<span>Сила</span>${bar(c.power,1.2,'#e8453c')}<span>Защита</span>${bar(c.def,0.12,'#4aa3ff')}<span>Скорость</span>${bar(c.speed,1.2,'#ffd24a')}<span>Прыжок</span>${bar(c.jump,1.1,'#9f6')}</div><div class="abl">${abl}</div></div></div>`}).join('')}
 else{body=SD.WEAPON_CATS.map(cat=>`<h3 class="cat">${esc(cat==='AvM'?'Animation vs. Minecraft':cat)}</h3>`+Object.values(SD.WEAPONS).filter(w=>w.cat===cat).map(w=>`<div class="wrow2"><canvas data-pw="${w.id}" width="150" height="46"></canvas><div><b>${esc(w.name)}</b> <small class="muted">${w.slot==='off'?'вторая рука · ':''}${w.two?'двуручное · ':''}${w.ammo?'дальний бой · ':''}урон ${w.dmg||'—'} · длина ${w.len}</small><p>${esc(w.desc||'')}</p></div></div>`).join('')).join('')}
 return `<div class="panel"><div class="hdr">${back}<h2>Бойцы и оружие</h2>${tabs}</div><div class="scroll">${body}</div></div>`};
// ---------- settings / stats / credits ----------
const KEYNAMES={left:'Влево',right:'Вправо',jump:'Прыжок',down:'Присесть / вниз',light:'Быстрая атака',heavy:'Сильная атака',block:'Блок',ability:'Способность',throw:'Бросок оружия',interact:'Взять / бросить'};
UI.r_settings=function(){const st=S.data.settings,keys=st.keys;
 const kt=p=>`<table class="keys">${Object.keys(KEYNAMES).map(a=>`<tr><td>${KEYNAMES[a]}</td><td><button class="btn small key" data-act="rebind" data-v="${p}.${a}">${esc(keys[p][a].replace('Key','').replace('Arrow','↔'))}</button></td></tr>`).join('')}</table>`;
 return `<div class="panel"><div class="hdr">${back}<h2>Настройки</h2></div><div class="scroll">
 <div class="opts"><label>Общая громкость <input type="range" min="0" max="1" step="0.05" value="${st.master}" data-inp="master"></label>
 <label>Громкость эффектов <input type="range" min="0" max="1" step="0.05" value="${st.sfx}" data-inp="sfx"></label>
 <label>Качество эффектов <select data-chg="quality">${['auto','high','medium','low'].map(q=>`<option value="${q}" ${st.quality===q?'selected':''}>${{auto:'Авто',high:'Высокое',medium:'Среднее',low:'Низкое (слабые устройства)'}[q]}</option>`).join('')}</select></label>
 <label>Тряска экрана <input type="checkbox" ${st.shake?'checked':''} data-chg="shake"></label></div>
 <h3>Клавиатура (нажмите кнопку, затем клавишу)</h3><div class="three"><div><h4>⌨ WASD (P1)</h4>${kt('p1')}</div><div><h4>⌨ Стрелки (P2)</h4>${kt('p2')}</div><div><h4>⌨ Numpad (P3)</h4>${kt('p3')}</div></div>
 <p class="muted">Геймпад: стик/крестовина — ход, A — прыжок, X — быстрая, Y — сильная, B/LB/LT — блок, RB/RT — способность, L3 — бросок, R3 — взять. Подключите геймпад и выберите его в слоте. Сенсор: у каждого игрока своя панель на экране. Esc / P — пауза, T — сброс тренировки.</p>
 <div class="opts"><button class="btn small" data-act="defkeys">Сбросить клавиши</button><button class="btn small" data-act="unlockall">Открыть всё</button><button class="btn small danger" data-act="resetsave">Сбросить прогресс</button></div></div></div>`};
UI.r_credits=function(){const rows=SD.CHAR_ORDER.map(id=>{const c=SD.CHARS[id],r=SD.RigImporter.rigs[c.rig+' SF.nodes'];const p=r?SD.RigImporter.toProfile(r):{};return `<tr><td>${esc(c.rig)} SF.nodes</td><td>${r?r.nodeCount:'-'}</td><td><i class="dot" style="background:${p.color}"></i>${p.rawColor||''}</td><td>${r&&r.accents.length?r.accents.join(', '):'—'}</td></tr>`}).join('');
 return `<div class="panel"><div class="hdr">${back}<h2>Credits</h2></div><div class="scroll"><p>Stickman Duel Arena — HTML5 Canvas 2D · Web Audio · localStorage. Персонажи и оружие вдохновлены вселенной Alan Becker (Animator vs. Animation, Animation vs. Minecraft); режимы и управление — по мотивам Supreme Duelist Stickman. Фанатский проект, не связан с авторами.</p>
 <p class="muted">Из файлов .nodes читаются цвета, число узлов и акценты; скелет и анимации — собственные (процедурные).</p><table class="keys"><tr><th>Риг</th><th>Узлов</th><th>Цвет</th><th>Акценты</th></tr>${rows}</table></div></div>`};
UI.r_stats=function(){const d=S.data,st=d.stats;const ach=Object.keys(SD.ACHIEVEMENTS).map(k=>`<div class="ach ${d.achievements[k]?'got':''}">${d.achievements[k]?'🏆':'🔒'} ${esc(SD.ACHIEVEMENTS[k])}</div>`).join('');
 return `<div class="panel"><div class="hdr">${back}<h2>Статистика</h2></div><div class="scroll"><table class="keys"><tr><td>Матчей</td><td>${st.matches}</td></tr><tr><td>Побед</td><td>${st.wins}</td></tr><tr><td>Попаданий</td><td>${Math.round(st.hits)}</td></tr><tr><td>Урона нанесено</td><td>${Math.round(st.damage)}</td></tr><tr><td>Убийств</td><td>${st.kills}</td></tr><tr><td>Макс. комбо</td><td>${st.maxCombo}</td></tr><tr><td>Парирований</td><td>${st.parries}</td></tr><tr><td>Выбито оружия</td><td>${st.disarms}</td></tr><tr><td>Рекорд Выживания</td><td>${d.records.survivalBest||0}</td></tr><tr><td>Рекорд Зомби</td><td>${d.records.zombieBest||0}</td></tr><tr><td>Побед в турнире</td><td>${d.records.tournamentWins}</td></tr></table><h3>Достижения</h3>${ach}</div></div>`};
// ---------- results / pause / bracket / upgrade ----------
UI.showResults=function(d,game){
 const rows=d.fighters.map(f=>`<tr class="${f.team===d.win?'win':''}"><td>${esc(f.name)}</td><td>${f.hits}</td><td>${f.damage}</td><td>${f.maxCombo}</td></tr>`).join('');
 const wf=d.fighters.find(f=>f.team===d.win);
 const wave=d.mode==='survival'||d.mode==='zombie';
 const title=wave?'Волна '+d.wave:d.win===null?'Ничья':(wf?esc(wf.name)+' побеждает!':'Победа');
 const sub=wave?`Убито врагов: <b>${d.kills}</b> · Рекорд: <b>${d.record}</b>`:'';
 this.root.classList.remove('hidden');document.body.classList.remove('playing');
 this.root.innerHTML=`<div class="center"><div class="resbox"><h1 class="${d.humanWon||wave?'win':'lose'}">${title}</h1><p>${sub}</p><p>Длительность боя: <b>${U.fmtTime(d.duration)}</b></p>
 <table class="keys"><tr><th>Боец</th><th>Попаданий</th><th>Урон</th><th>Макс. комбо</th></tr>${rows}</table>
 <div class="menu row"><button class="btn big" data-act="rematch">Реванш</button><button class="btn" data-act="lobbyback">Выбор бойцов</button><button class="btn" data-act="tomenu">В меню</button></div></div></div>`;
 $('#trainPanel').classList.add('hidden');this.hideTouch()};
UI.showBracket=function(game){const m=game.m;this.root.classList.remove('hidden');
 const rows=m.bracket.map((b,i)=>`<div class="br ${i<m.bi?'done':i===m.bi?'cur':''}">${i<m.bi?'✔':i===m.bi?'▶':'•'} Бой ${i+1}: ${esc(SD.CHARS[b.char].name)} <small>(${SD.BOT_LEVELS[b.level].name})</small></div>`).join('');
 this.root.innerHTML=`<div class="center"><div class="resbox"><h1 class="win">Бой ${m.bi+1} выигран!</h1><p>Турнирная сетка:</p>${rows}<div class="menu row"><button class="btn big" data-act="nextbracket">Следующий бой →</button><button class="btn" data-act="tomenu">Выйти</button></div></div></div>`};
UI.showUpgrade=function(game,opts){this.root.classList.remove('hidden');
 this.root.innerHTML=`<div class="center"><div class="resbox"><h1 class="win">Волна ${game.m.wave} пройдена!</h1><p>Выберите улучшение для всей команды:</p><div class="upg">${opts.map((o,i)=>`<button class="card up" data-act="upgrade" data-v="${i}"><h3>${esc(o.name)}</h3><p>${esc(o.desc)}</p></button>`).join('')}</div></div></div>`};
UI.onPause=function(p){if(p){this.root.classList.remove('hidden');this.root.innerHTML=`<div class="center"><div class="resbox"><h1>Пауза</h1><div class="menu"><button class="btn big" data-act="resume">Продолжить</button><button class="btn" data-act="restart">Рестарт</button><label class="pl">Громкость <input type="range" min="0" max="1" step="0.05" value="${S.data.settings.master}" data-inp="master"></label><button class="btn" data-act="lobbyback">Выбор бойцов</button><button class="btn" data-act="tomenu">В главное меню</button></div><p class="muted tiny">P1: A/D, W прыжок, S вниз, F/G атаки, H блок, E способность (E+→ / в воздухе / E+↓), Q бросок, R взять<br>P2: стрелки, K/L, J, O, U, I · P3: Numpad 4/8/6/5, 1/2, 3, 0, 7, 9</p></div></div>`;this.hideTouch()}else{this.hideOverlay();this.setupTouch()}};
UI.onMatchStart=function(game){this.hideOverlay();document.body.classList.add('playing');this.setupTouch();this.trainPanel(game)};
UI.onMatchStop=function(){document.body.classList.remove('playing');$('#trainPanel').classList.add('hidden');this.hideTouch()};
UI.trainPanel=function(game){const p=$('#trainPanel');if(game.cfg.mode!=='training'){p.classList.add('hidden');return}p.classList.remove('hidden');
 const wl=Object.values(SD.WEAPONS).map(w=>`<option value="${w.id}">${w.name}</option>`).join('');
 p.innerHTML=`<select id="tdm">${[['stand','Стоит'],['block','Блокирует'],['crouch','Присел'],['jump','Прыгает'],['walk','Ходит'],['attack','Атакует'],['bot','Полный бот']].map(([v,n])=>`<option value="${v}" ${game.train.dummy===v?'selected':''}>${n}</option>`).join('')}</select><button data-tr="reset">↺ Сброс (T)</button><select id="tw">${wl}</select><button data-tr="spawn">+ Оружие</button><button data-tr="exit">Меню</button>`;
 p.onclick=e=>{const b=e.target.closest('button');if(!b)return;const a=b.dataset.tr;if(a==='reset')this.trainReset();if(a==='spawn'){const f=game.fighters[0];game.items.spawn(f.root.x+f.face*120,f.root.y-60,$('#tw').value,{rarity:0,life:60})}if(a==='exit')this.act('tomenu')};
 p.onchange=e=>{if(e.target.id==='tdm'){game.train.dummy=e.target.value;game.cfg.dummy=e.target.value;if(game.fighters[1]&&game.fighters[1].ctrl.dummy)game.fighters[1].ctrl.dummy.mode=e.target.value}}};
UI.trainReset=function(){const g=this.game;g.train.total=0;g.train.hits=0;g.train.last=0;g.train.dps=[];g.placeAll();g.fighters.forEach(f=>{f.hp=f.maxHp;f.main=null;f.off=null;g.loadout(f,f.slotCfg||{weapon:'none',off:'none'})});g.items.reset();g.proj.reset()};
// ---------- actions ----------
const cyc=(arr,cur,d)=>{let i=arr.indexOf(cur);if(i<0)i=0;return arr[(i+d+arr.length)%arr.length]};
UI.act=function(a,v,el){const g=this.game,c=g.cfg;
 switch(a){
 case 'show':this.show(v);break;
 case 'lobby':{const [m,n]=v.split(':');this.openLobby(m,+n);break}
 case 'lobbyback':g.paused=false;g.stop();this.show('lobby');break;
 case 'wiki':this.s.wiki=v;this.rerender();break;
 case 'opts':this.s.optsOpen=!this.s.optsOpen;this.rerender();break;
 case 'play':{const act=c.slots.slice(0,c.count).filter(s=>s.ctrl!=='off'),hum=act.filter(s=>s.ctrl!=='bot'),ids=hum.map(s=>s.ctrl);
  if(!hum.length&&c.mode!=='versus'&&c.mode!=='free'&&c.mode!=='team'&&c.mode!=='football'){this.toast('Нужен хотя бы один игрок');return}
  if(new Set(ids).size!==ids.length){this.toast('Два игрока используют одно управление');return}
  c.slots.forEach((s,i)=>{if(i>=c.count)s.ctrl='off'});
  S.data.last=JSON.parse(JSON.stringify(c));S.save();g.start(c);break}
 case 'rematch':g.restart();break;
 case 'restart':g.paused=false;this.hideOverlay();g.restart();break;
 case 'resume':g.pause(false);break;
 case 'tomenu':g.paused=false;g.stop();this.show('main');break;
 case 'nextbracket':g.nextBracket();break;
 case 'upgrade':{const o=g.m.upg[+v];this.hideOverlay();g.applyUpgrade(o);break}
 case 'ctrl':{const i=+v,s=c.slots[i],spec=MI[c.mode];let opts=[...CTRLS];if(spec[6])opts.push('bot');if(c.mode!=='training'&&c.mode!=='tournament')opts.push('off');if(!spec[6]&&s.ctrl==='bot')s.ctrl='k1';
  const used=new Set(c.slots.slice(0,c.count).map((o,j)=>j===i?null:o.ctrl));let n=s.ctrl,tries=0;do{n=cyc(opts,n,1);tries++}while(used.has(n)&&n!=='bot'&&n!=='off'&&tries<20);s.ctrl=n;this.rerender();break}
 case 'level':{const i=+v,s=c.slots[i];s.level=((s.level!==undefined?s.level:c.botLevel)+1)%SD.BOT_LEVELS.length;this.rerender();break}
 case 'team':{const i=+v,s=c.slots[i],spec=MI[c.mode];s.team=spec[7]==='ab'?(s.team===1?2:1):(s.team%6)+1;this.rerender();break}
 case 'char':{const [i,d]=v.split(':').map(Number),s=c.slots[i];s.char=cyc([...SD.CHAR_ORDER,'rand'],s.char,d);this.rerender();break}
 case 'wpn':{const [i,d]=v.split(':').map(Number),s=c.slots[i];s.weapon=cyc(['auto','none','random',...weaponIds()],s.weapon,d);this.rerender();break}
 case 'off':{const [i,d]=v.split(':').map(Number),s=c.slots[i];s.off=cyc(offIds(),s.off,d);this.rerender();break}
 case 'map':{const ids=SD.ARENA_ORDER.filter(id=>c.mode==='football'?id==='stadium':id!=='stadium');c.arena=cyc(ids,c.arena,+v);this.rerender();break}
 case 'cnt':{const spec=MI[c.mode];const n=Math.max(spec[4],Math.min(spec[5],c.count+(+v)));if(n>c.count){const s=c.slots[n-1];if(s.ctrl==='off')s.ctrl=spec[6]?'bot':'k1'}else c.slots[c.count-1].ctrl='off';c.count=n;this.rerender();break}
 case 'rebind':{const [p,k]=v.split('.');el.textContent='…';SD.Input.rebind=code=>{SD.Input.rebind=null;if(code!=='Escape'){S.data.settings.keys[p][k]=code;S.save()}this.rerender()};break}
 case 'defkeys':S.data.settings.keys=JSON.parse(JSON.stringify(S.defaultKeys));S.save();this.rerender();break;
 case 'unlockall':S.unlockAll();this.toast('Всё открыто');break;
 case 'resetsave':if(confirm('Сбросить весь прогресс?')){S.reset();this.rerender()}break;
 case 'savecfg':{const n=prompt('Название сетапа:','Сетап '+(Object.keys(S.data.configs).length+1));if(n){S.data.configs[n]=JSON.parse(JSON.stringify(c));S.save();this.rerender();this.toast('Сохранено: '+n)}break}
 }};
UI.inp=function(k,el,chg){const g=this.game,c=g.cfg,st=S.data.settings;let v=el.type==='checkbox'?el.checked:el.value;
 if(k==='master'){st.master=+v;SD.Audio.setVol(st.master,st.sfx);S.save();return}
 if(k==='sfx'){st.sfx=+v;SD.Audio.setVol(st.master,st.sfx);S.save();return}
 if(k==='quality'){st.quality=v;S.save();g.setQuality(v);return}
 if(k==='shake'){st.shake=v;S.save();return}
 if(k==='loadcfg'){const o=S.data.configs[v];if(o){Object.assign(g.cfg,JSON.parse(JSON.stringify(o)));this.fixSlots();this.rerender();this.toast('Загружено')}return}
 if(k.startsWith('o.')){const kk=k.slice(2);c[kk]=el.type==='checkbox'?v:(isNaN(+v)?v:+v);return}
};
// ---------- previews ----------
UI.previewTick=function(dt){
 pg.time+=dt;if(!this.root||this.root.classList.contains('hidden'))return;const cs=this.root.querySelectorAll('canvas[data-pc],canvas[data-pw]');
 cs.forEach(cv=>{const ctx=cv.getContext('2d');ctx.clearRect(0,0,cv.width,cv.height);
  if(cv.dataset.pc){let pf=this.prev.get(cv);if(!pf){const id=cv.dataset.pc;let w=cv.dataset.w;if(!w)w=SD.CHARS[id].weapon;pf=new SD.PreviewFighter(pg,id,w==='none'||!SD.WEAPONS[w]?'none':w,{});this.prev.set(cv,pf)}
   pf.update(dt,pg);ctx.save();const sc=cv.height/175;ctx.translate(cv.width/2,cv.height*0.92);ctx.scale(sc,sc);pf.draw(ctx,pg);ctx.restore()}
  else if(cv.dataset.pw){const d=SD.WEAPONS[cv.dataset.pw];if(!d)return;ctx.save();const sc=Math.min(1.4,(cv.width-20)/(d.len*1.1),(cv.height-6)/50);ctx.translate(cv.width/2-(0.5-d.pivot)*d.len*sc,cv.height/2);ctx.scale(sc,sc);SD.Weapons.drawShape(ctx,d,pg.time,0,'medium');ctx.restore()}
 })};
// ---------- touch pads (one per touch player) ----------
UI.hideTouch=function(){const t=$('#touch');t.innerHTML='';SD.Input.touchActive=false;document.body.classList.remove('touchon')};
UI.setupTouch=function(){const g=this.game,t=$('#touch');t.innerHTML='';
 const act=g.running&&g.m?g.cfg.slots.filter(s=>s.ctrl&&s.ctrl[0]==='t'):[];
 const mode=g.cfg.mode;const list=(mode==='tournament'||mode==='training')?act.slice(0,1):act;
 if(!list.length){SD.Input.touchActive=false;document.body.classList.remove('touchon');return}
 SD.Input.touchActive=true;document.body.classList.add('touchon');
 const single=list.length===1;
 list.forEach((s,k)=>{const idx=+s.ctrl[1];t.appendChild(this.buildPad(idx,k,list.length,single))});
 const pb=document.createElement('button');pb.className='tb pause';pb.textContent='❚❚';pb.dataset.b='pause';t.appendChild(pb);this.bindButtons(t)};
UI.buildPad=function(idx,k,total,single){const T=SD.Input.touches[idx];const pad=document.createElement('div');
 const cls=single?'pos0 single':'pos'+k;pad.className='pad '+cls+(total>2?' small':'');pad.innerHTML=`<div class="joy"><div class="knob"></div></div><div class="pbtns"><button data-b="light" data-i="${idx}" class="tb">👊<small>Удар</small></button><button data-b="heavy" data-i="${idx}" class="tb">💥<small>Сильн.</small></button><button data-b="block" data-i="${idx}" class="tb">🛡<small>Блок</small></button><button data-b="ability" data-i="${idx}" class="tb">✨<small>Спец</small></button><button data-b="interact" data-i="${idx}" class="tb">✋<small>Взять</small></button><button data-b="throw" data-i="${idx}" class="tb">🎯<small>Бросок</small></button></div>`;
 const joy=pad.querySelector('.joy'),knob=pad.querySelector('.knob');let jid=null,jc=null;
 const jr=()=>joy.getBoundingClientRect().width*0.5;
 const jmove=e=>{if(e.pointerId!==jid)return;const r=jr();let dx=e.clientX-jc[0],dy=e.clientY-jc[1];const l=Math.hypot(dx,dy);if(l>r){dx*=r/l;dy*=r/l}knob.style.transform=`translate(${dx}px,${dy}px)`;T.x=Math.abs(dx)>r*0.3?Math.sign(dx):0;T.y=dy/r;T.jumpHeld=dy<-r*0.55};
 joy.addEventListener('pointerdown',e=>{e.preventDefault();jid=e.pointerId;joy.setPointerCapture(jid);const rc=joy.getBoundingClientRect();jc=[rc.left+rc.width/2,rc.top+rc.height/2];jmove(e);SD.Audio.resume()});
 joy.addEventListener('pointermove',jmove);
 const jend=e=>{if(e.pointerId!==jid)return;jid=null;knob.style.transform='';T.x=0;T.y=0;T.jumpHeld=false};joy.addEventListener('pointerup',jend);joy.addEventListener('pointercancel',jend);
 return pad};
UI.bindButtons=function(root){root.querySelectorAll('[data-b]').forEach(b=>{const k=b.dataset.b,T=SD.Input.touches[+b.dataset.i||0];
  b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);b.classList.add('on');SD.Audio.resume();
   if(k==='pause'){UI.game.pause();return}
   if(k==='block')T.block=true;else if(k==='light'){T.ev.light=true;T.lightHeld=true}else if(k==='heavy'){T.ev.heavy=true;T.heavyHeld=true}else T.ev[k]=true});
  const up=()=>{b.classList.remove('on');if(k==='pause')return;if(k==='block')T.block=false;if(k==='light')T.lightHeld=false;if(k==='heavy')T.heavyHeld=false};b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up)});
 ['gesturestart','dblclick','contextmenu'].forEach(n=>root.addEventListener(n,e=>e.preventDefault()))};
UI.initTouch=function(){};
})(window.SD);
