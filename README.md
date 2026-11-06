# STICKMAN DUEL ARENA

HTML5 (Canvas 2D + Web Audio + localStorage) физический файтинг со стикменами. ПК и мобильные.

## Запуск
Откройте `index.html` в браузере (Chrome/Edge/Firefox/Safari) — сервер не нужен. Для телефона: выложите папку на любой хостинг/GitHub Pages или упакуйте в APK («HTML to APK»). Сенсорное управление включается автоматически (или в Настройках).

## Структура
```
index.html  style.css
js/  util save audio rig rigdata physics data arena fighter moves weapons combat abilities ai input game ui main
assets/rigs/*.nodes   — исходные риги (+ README_ASSET_GUIDE.txt)
```
`rigdata.js` — те же .nodes в base64 (чтобы игра работала с file://). Риги читает `js/rig.js` (RigImporter).

## Управление
P1: A/D, W прыжок, S присесть, F лёгкая, G сильная, H блок, E способность (E+→ вперёд, в воздухе, E+↓ ультимейт при 100 энергии), Q бросок оружия, R взять/бросить. P2: стрелки, K, L, J, O, U, I. Все клавиши переназначаются в Настройках. Esc/P — пауза, T — сброс тренировки. Перекат: ↓+движение; уклонение: назад+блок; парирование — блок прямо перед ударом.
Мобильные: джойстик (вверх = прыжок), Прыжок, Удар, Сильн., Блок, Спец, Взять, Бросок; мультитач.

## Режимы
1v1, 1vBOT (4 уровня: Новичок/Обычный/Опытный/Мастер), Tournament (7 боёв), Survival (волны), Weapon Chaos, Team Battle (2×2/3×3), Free Fight / Редактор боя (2–6 бойцов, HP, скорость, гравитация, отбрасывание, сохранение конфигов), Training (манекен, DPS, выдача оружия).

## Анимации
Idle, Walk, Run, Jump, Fall, Light (цепочка), Heavy (с зарядкой), Kick/Launcher, Air/Crouch/Dash-атаки, Block, Parry, Dodge, Roll, Hit, Knockback, Knockdown, GetUp, Death (рэгдолл), Victory, Cast. Реализованы процедурно: ключевые позы + FK + Verlet-рэгдолл (гибрид активного рэгдолла), оружие меняет набор ударов по стилю (slash/stab/smash/sweep/dagger/katana/ranged).

## Важно (честно)
- Из .nodes надёжно извлекаются цвета, число узлов и акценты; геометрия скелета/кадры Stick Nodes не декодированы. Персонажи рисуются собственным скелетом в цветах реальных ригов (количество узлов и акцентов влияет на внешний вид). Импорт PNG-атласов не реализован.
- Загрузка своего .nodes: Выбор персонажа → «Импорт .nodes» (риги с >100 узлов считаются оружием).
- Тестирование: автоматически в headless Chromium (все режимы, 12 арен, 40 способностей, 38 видов оружия, подбор/бросок, сохранение, касание). Субъективную «играбельность» и баланс стоит проверить руками — возможны шероховатости.

## Как добавить
- **Персонаж:** положить `.nodes` в `assets/rigs`, перегенерировать `js/rigdata.js` (base64), добавить запись в `SD.CHARS` и `SD.CHAR_ORDER` в `js/data.js` (статы + 4 способности `n/f/a/u`; реализации — в `FN` в `js/abilities.js`, тайминги — `AB`).
- **Оружие:** строка `def(id,имя,категория,{len,pivot,dmg,speed,mass,style,two,col,...})` в `js/data.js`; стиль ударов — `js/moves.js`, отрисовка — `Weapons.drawShape` в `js/weapons.js`.
- **Арена:** запись в `SD.ARENAS` (`js/arena.js`): палитра, `solids`, `spawns`, опасности.

## Роспись по персонажам
| Персонаж | Риг (.nodes) | Узлов | Стиль | Способности (E / E+→ / E в воздухе / E+↓) |
|---|---|---|---|---|
| The Second Coming | The Second Coming SF.nodes | см. Credits | Скоростной боец. Быстрые удары и энергетические атаки. | Surge / Energy Strike / Sky Strike / Second Form |
| The Chosen One | The Chosen One SF.nodes | см. Credits | Энергия и огонь. Сбалансированный боец-маг. | Energy Blast / Empower / Fire Rain / Inferno |
| The Dark Lord | The Dark Lord SF.nodes | см. Credits | Тяжёлый мечник. Тёмная энергия, медленный, но мощный. | Dark Orb / Blade Frenzy / Shadow Volley / Annihilation |
| Victim | Victim SF.nodes | см. Credits | Тактик. Ловушки и контроль пространства. | Mine / Barrier / Net Trap / Minefield |
| Red | Red SF.nodes | см. Credits | Агрессор с животными. Быстрые комбинации. | Wolf Rush / Rage / Eagle Dive / Stampede |
| Blue | Blue SF.nodes | см. Credits | Алхимик. Зелья с необычными эффектами. | Potion / Swiftness / Splash / Elixir |
| Green | Green SF.nodes | см. Credits | Музыкант. Ритмичные звуковые волны. | Sound Wave / Rhythm / Bass Drop / Concert |
| Yellow | Yellow SF.nodes | см. Credits | Инженер. Турели и дальние атаки. | Turret / Laser / Drone Bombs / Orbital Beam |
| Purple | Purple SF.nodes | см. Credits | Манёвренный. Двойной прыжок, блинк, серии ударов. | Blink / Dash Slash / Air Dash / Flurry |
| King Orange | King Orange SF.nodes | см. Credits | Тяжеловес в короне. Мощные удары и защита. | Ground Slam / Iron Will / Meteor Drop / Royal Beam |

## Оружие
| Оружие | Категория | Урон | Длина |
|---|---|---|---|
| Меч (sword) | Холодное | 10 | 95 |
| Длинный меч (longsword) | Холодное | 11 | 120 |
| Двуручный меч (greatsword) | Холодное | 15 | 150 |
| Катана (katana) | Холодное | 10 | 115 |
| Топор (axe) | Холодное | 12 | 85 |
| Боевой топор (battleaxe) | Холодное | 16 | 120 |
| Кинжал (dagger) | Холодное | 6 | 48 |
| Копьё (spear) | Холодное | 11 | 175 |
| Трезубец (trident) | Холодное | 12 | 160 |
| Молот (hammer) | Холодное | 17 | 100 |
| Булава (mace) | Холодное | 11 | 75 |
| Коса (scythe) | Холодное | 13 | 150 |
| Дубинка (club) | Холодное | 8 | 70 |
| Боевой посох (staff) | Холодное | 8 | 150 |
| Лук (bow) | Дальнобойное | 9 | 70 |
| Арбалет (crossbow) | Дальнобойное | 13 | 60 |
| Метательные ножи (knives) | Дальнобойное | 6 | 30 |
| Энергобластер (blaster) | Дальнобойное | 7 | 55 |
| Магический посох (magicstaff) | Дальнобойное | 10 | 130 |
| Щит (shield) | Защита | 10 | 60 |
| Энергетический барьер (barrier) | Защита | 10 | 60 |
| Отражающий щит (reflect) | Защита | 10 | 60 |
| Световой меч (lightsaber) | Особое | 12 | 105 |
| Электрический меч (elecsword) | Особое | 11 | 100 |
| Огненный меч (flamesword) | Особое | 11 | 105 |
| Ледяной меч (icesword) | Особое | 11 | 105 |
| Энергетический молот (energyhammer) | Особое | 18 | 105 |
| Меч Dark Lord (darklord_sword) | Особое | 17 | 165 |
| Алмазный меч (mc_diamond_sword) | Minecraft | 12 | 100 |
| Незеритовый меч (mc_netherite_sword) | Minecraft | 14 | 100 |
| Железный меч (mc_iron_sword) | Minecraft | 10 | 100 |
| Алмазный топор (mc_diamond_axe) | Minecraft | 14 | 95 |
| Трезубец (MC) (mc_trident) | Minecraft | 13 | 165 |
| Лук (MC) (mc_bow) | Minecraft | 9 | 75 |
| Арбалет (MC) (mc_crossbow) | Minecraft | 14 | 70 |
| Щит (MC) (mc_shield) | Minecraft | 10 | 60 |
| Булава (MC) (mc_mace) | Minecraft | 16 | 90 |
| Кирка (mc_pickaxe) | Minecraft | 11 | 95 |

## Арены
| Арена | Описание |
|---|---|
| Тренировочная площадка | Ровная площадка с сеткой. |
| Каменная арена | Колонны, факелы и разрушаемые стены. |
| Minecraft-платформа | Блочный остров с TNT. |
| Лес | Деревья, брёвна и деревянные ящики. |
| Пещера | Падающие сталактиты, кристаллы. |
| Ледяная арена | Скользкий лёд. |
| Лавовая арена | Острова над лавой. Лава жжёт и подбрасывает. |
| Небесные платформы | Парящие острова. Падение — вылет. |
| Футуристическая арена | Неон, движущиеся платформы, прыжковые панели. |
| Разрушающийся мост | Доски мостa рушатся. Под ним пропасть. |
| Арена с ловушками | Шипы, пилы, падающие блоки. |
| Финальная арена | Разрушаемый пол над лавой, взрывные ящики. |

## Сборка
- **Один HTML-файл:** `python3 tools/build_single.py` → `Stickman-Duel-Arena.html` (уже лежит в репозитории, работает офлайн).
- **APK:** GitHub Actions (`.github/workflows/build-apk.yml`, Capacitor, debug APK, ландшафт, полный экран). Запускается при push в `main` или вручную (Actions → Run workflow). Готовые файлы — в Artifacts запуска: `Stickman-Duel-Arena-apk` и `Stickman-Duel-Arena-html`.
