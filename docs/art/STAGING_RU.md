# Постановка роликов Этапа 1 (T25): что есть у художественной части

**Версия:** 1, 8 октября 2026 года. Для сценарной работы (C), которая пишет
`aegis-cutscene/1`, и игровой (G), которая их встраивает. Формат —
`docs/api/animation.md` в `rumukh/aegis-engine`.

Все ID ниже — ID ассетов из `assets/manifest.json`. Ролики, риги, клипы и пропы
проверены валидатором E (`aegis-animation validate`): 0 ошибок.

## 1. Сцена и кадр

- Логическая сцена 2560×1600, y вниз. Безопасная зона — 2100×1440 в центре
  (x 230–2330, y 80–1520): всё важное держать в ней.
- **Пол в интерьерах:** y ≈ 1450 (точка `to` у `enter` — это ступни героя).
- **Фитилёк летает:** y ≈ 900–1000, клип `hover`.
- Камера: встроенный `wide`. Для крупного плана —
  `{"to": {"x": …, "y": …, "zoom": 1.3}}`. Зум не больше 1,5: фоны 2560×1600 при
  большем увеличении теряют резкость.
- При спокойной анимации движок сам заменяет проезды на смену кадра.
- **Память:** в начале ролика фоны и состав загружаются вместе, бюджет — 128 МиБ раскодированных изображений (G). Один фон 2560×1600 занимает 16 МиБ, атлас героя — около 2 МиБ. Поэтому в одном ролике не больше 4 разных фонов, считая варианты «Лампы».

## 2. Актёры (риги)

| Rig ID | Кто | Рост в сцене, px | Выражения |
|---|---|---|---|
| `khvosts` | Шерлок Хвостс | ≈ 800 | neutral, surprised, worried, happy |
| `watsony` | Ватсони | ≈ 660 | то же |
| `pudding` | мэр Пудинг | ≈ 715 | то же |
| `tyopa` | Тёпа | ≈ 790 | то же |
| `kartofan` | Картофан | ≈ 650 | то же (у Картофана и Стеллы `surprised` и `worried` сделаны глазами) |
| `stella` | Стелла | ≈ 695 | то же |
| `fitilyok` | Фитилёк | ≈ 350 | то же |
| `mouse`, `mouse2` | мышата Шуршики (мальчик в кепке, девочка в платке) | ≈ 450 и 415 | то же |
| `avatar.<вид>` | игрок (`role: "avatar"` в cast) | ≈ 600 | то же |

- Размер уже задан в риге (масштаб покоя на части `body`), поэтому `scale` в
  ролике не нужен.
- У всех ригов есть эмоции `joy` (выражение `happy` и клип `cheer`) и `nod`.
- Части: `body`, `head`, `eyes`, `brows`, `mouth`; у аватара ещё `scarf`. Губы
  двигаются сами на шаге `line`.
- Поза тела одна: рук отдельно нет, жесты делаются клипами тела и головы.

## 3. Клипы (`assets/staging/clips/`)

| Clip ID | Длина | Что делает | Для кого |
|---|---|---|---|
| `nod` | 0,8 с | два кивка | все |
| `sniff` | 1,2 с | голова вверх, быстрые покачивания | Картофан нюхает коробку |
| `bow` | 1,0 с | поклон-извинение | Картофан, Пудинг |
| `cheer` | 0,8 с | подпрыгивание и наклон головы | радость |
| `shrug-shy` | 1,0 с | голова вниз, покачивание | смущение |
| `look-around` | 1,6 с | голова влево-вправо | вступление |
| `hover` | 1,6 с, петля, additive | парение | Фитилёк, Стелла, почтовый жук |
| `flutter` | 0,4 с, петля, additive | дрожание крылышек | почтовый жук |
| `present` | 1,2 с | появление с увеличением | значки, стикер, корзинка |
| `wobble` | 0,6 с | покачивание | любой проп |
| `box-open` | 1,0 с | коробка вздрагивает и открывается | только `prop.box-pie` |
| `stars-1`, `stars-2`, `stars-3` | 0,05 с | выбирает число звёзд | только `prop.sticker-pie` |

## 4. Пропы-куклы (`assets/staging/props/`)

| Rig ID | Что | Опорная точка |
|---|---|---|
| `prop.postal-beetle` | заводной почтовый жук с письмом | центр |
| `prop.letter` | письмо мэра с печатью | центр |
| `prop.badge-intern` | значок стажёра | центр |
| `prop.box-pie` | коробка мэра: `closed` → `open` клипом `box-open`; в окошке крышки виден пирог (R03). Клип возвращает вариант после конца, поэтому для «открыли и оставили» берите пару ниже | низ |
| `prop.box-pie-closed`, `prop.box-pie-open` | те же состояния отдельными ригами: `exit` закрытой и `enter` открытой в той же точке | низ |
| `prop.badge-pie-found` | значок-лапка «Пирог найден» | центр |
| `prop.sticker-pie-1`, `-2`, `-3` | стикер в альбом с ★, ★★, ★★★ (рекомендуется) | центр |
| `prop.sticker-pie` | тот же стикер, звёзды клипами `stars-N` (вариант держится только во время клипа) | центр |
| `prop.blueberry-basket` | корзинка черники для Конторы | низ |
| `prop.pie-baked` | готовый пирог | низ |
| `prop.garland-100` | гирлянда «100» к юбилею | центр |
| `prop.bunting` | флажки | центр |
| `prop.title-card` | название игры на ленте (около x 1280, y 420 над `bg.intro-town`) | центр |

Пропы ставятся шагом `enter` с `"walk": false`: из точки в ту же точку для
появления на месте или по дуге для полёта жука.

**На аватар:** `acc.badge.intern` и `acc.badge.pie-found` ставятся в якорь `badge`.
Шапки `acc.hat.*` есть, но в Этапе 1 профиль их не предлагает.

## 5. Фоны

| ID | Для чего |
|---|---|
| `bg.intro-town` | вступление: Пушистино на закате, флажки и фонари; верх неба свободен для названия |
| `bg.intro-bureau` | вступление: фасад бюро, вывеска-эмблема, круглое окно слева (пузыри Хвостса около x 300–700, y 300–600) |
| `bg.office` | P3 и C1-10; стол Ватсони слева, лампа справа (x ≈ 2180, y ≈ 870) |
| `bg.shed-exterior`, `bg.shed-window`, `bg.shed-interior` | сарай: приход, окошко с коробкой, разговор |
| `bg.bakery-interior` | «Пекарь» |
| `bg.bakery-oven` | по желанию C1-8: пирог в печи |

## 6. Эффекты (`assets/staging/fx/fx.atlas`)

G регистрирует эффекты по кадрам атласа:

| Эффект | Кадр |
|---|---|
| `bubbles` | `fx.atlas#bubble` |
| `sparkles` | `fx.atlas#sparkle` или `#star` |
| `fireflies` | `fx.atlas#firefly` |
| `confetti` | `fx.atlas#petal.honey`, `#petal.sage`, `#petal.rose` |
| `steam` | `fx.atlas#steam` |
| `glow` | `fx.atlas#glow` |
| `hearts` | `fx.atlas#heart` |

## 7. Музыка и звуки

- **Музыка:** `music.title-office` — вступление и Контора; `music.heartfelt` —
  извинение в сарае; `music.celebration-baking` — пекарня и награда. Вариант
  `-warm` включает G при «Лампе смелости».
- **Звуки:** `sfx.postal-beetle`, `sfx.letter-chime`, `sfx.bubbles`, `sfx.sparkle`,
  `sfx.reward`, `sfx.heart`, `sfx.oven`, `sfx.page-turn`, `sfx.footsteps`.

## 8. Проверка в предпросмотре E

`tools/assets/art/preview_manifest.py <папка роликов> <папка вывода>` собирает папку для лаборатории анимации E. Затем `npm run preview:labs -- --dir out\labs --consumer <папка вывода>` и адрес `/animation-lab/?manifest=../consumer/manifest.json`. `tools/assets/art/record_cutscene.mjs` проигрывает ролик, нажимает «Дальше» и сохраняет кадры.

Таблица эффектов для `createStage({ effects })` — в `preview_manifest.py` (`bubbles`, `sparkles`, `fireflies`, `confetti`, `steam`, `glow`, `hearts`).

## 9. Проверка валидатором

```powershell
node <aegis-engine>\packages\browser\bin\aegis-animation.mjs validate `
  assets\characters assets\avatar assets\staging <папка с роликами>
```


## 10. Этап 2 (дела 2–4)

### Актёры

| Rig ID | Кто | Рост в сцене, px | Выражения |
|---|---|---|---|
| `damka` | бобриха Дамка, инженер и смотритель маяка | ≈ 690 | neutral, surprised, worried, happy |
| `pukhlik` | совёнок Пухлик, ночной стажёр | ≈ 370 | то же |

Части и клипы те же, что у остальных (`body`, `head`, `eyes`, `brows`, `mouth`; `nod`, `cheer`,
`bow`, `shrug-shy`, `look-around`). Пухлик невысокий: ставьте его на пол (y ≈ 1450) или на
предмет; для полёта подходит `hover`.

### Пропы (ID из ASSET_REQUESTS C)

| Rig ID | Что | Опорная точка |
|---|---|---|
| `prop.badge-letters-saved`, `prop.badge-beacon`, `prop.badge-jam-c4` | значки дел 2, 3, 4 | центр |
| `prop.sticker-letters-1..3`, `prop.sticker-beacon-1..3`, `prop.sticker-jam-c4-1..3` | стикеры в альбом с 1–3 ★ | центр |
| `prop.c2-cipher-poster` | плакат шифра (буквы и кнопки) | центр |
| `prop.c2-dry-letters`, `prop.c2-letter-garland`, `prop.c2-magpie-nest` | сухие письма, гирлянда писем (ширина 1600), гнездо Стеллы | низ / центр / низ |
| `prop.chamomile-note`, `prop.note-khvosts` | записка с ромашкой, записка Хвостса | центр |
| `prop.firefly-lamp`, `prop.firefly-lantern` | лампа-звёздочка, фонарь светлячков | низ |
| `prop.light-code-book`, `prop.light-signal-strip` | книга «Азбука огоньков», полоса сигналов | центр |
| `prop.map-honey-lighthouse` | маяк для карты | низ |
| `prop.paddle-repaired` | починенное весло | центр |
| `prop.fact-cards-c3` | карточки фактов (светлячок, летучая мышь, сова) | центр |
| `prop.empty-jam-jar`, `prop.jam-jar-c4`, `prop.jam-jars-c4` | пустая банка, банка с бантом, двенадцать банок | низ |
| `prop.notebook-secret-notes` | тетрадь секретных записей | центр |
| `prop.tea-table-c4` | длинный стол чаепития с самоваром (ширина 1500) | низ |

### Фоны

| ID | Локация | Для чего |
|---|---|---|
| `bg.post-office` | post-office | хаб дела 2: доска с пуговицами слева, часы, круглое окно |
| `bg.post-porch`, `bg.post-clock` | post-porch, post-clock | крыльцо после ветра (лупа), почтовые часы |
| `bg.library-door` | library-door | библиотека «Тихая нора» и дверка Шуршиков |
| `bg.old-oak` | old-oak | гнездо высоко справа (x ≈ 1680–2020, y ≈ 40–340), дупло внизу у корней (x ≈ 1520–1780) |
| `bg.town-square` | town-square | Выставка писем под дубом (дело 2) |
| `bg.lamp-booth` | lamp-booth | будка фонарщика на рассвете |
| `bg.office-evening`, `bg.office-diary` | office-evening, office-diary | Контора вечером, стол Ватсони вечером |
| `bg.honey-pond`, `bg.pond-bank`, `bg.pond-night` | honey-pond, pond-bank, pond-night | пруд в сумерках с маяком (маяк x ≈ 1420–1560), берег, ночь для «Азбуки огоньков» |
| `bg.lighthouse-door`, `bg.lighthouse-room`, `bg.lighthouse-stairs` | одноимённые | дверь и лодка, комната фонаря, нижние ступени |
| `bg.mayor-cellar`, `bg.mayor-cellar-shelves`, `bg.cellar-steps`, `bg.mayor-cellar-entrance` | одноимённые | погреб мэра, полка с банками, ступени, вход в погреб |
| `bg.mayor-yard-carts` | mayor-yard-carts | двор ратуши с мягкой землёй |
| `bg.office-pantry` | office-pantry | кладовка Конторы с двенадцатью банками |
| `bg.town-square-tea` | tea-square | площадь с длинным столом (дело 4) |
| `bg.dream-mist` | dream-mist | туманный фон для карточек снов |

### Музыка

`music.dusk-lighthouse` (дело 3), `music.dreams` и `music.tea-party` (дело 4), у каждой есть `-warm`.
