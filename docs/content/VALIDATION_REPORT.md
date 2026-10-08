# Отчёт проверки контента

> Сгенерировано `node tools/content/build.ts` из `content/`. Не редактировать вручную.

**Итог:** ❌ ошибок: 129; предупреждений: 0.

## Что проверяется (сборка падает при ошибке)

- Предложение — отрезок текста до «.», «!», «?» или «…», за которым идёт пробел; подпись без точки — одно предложение.
- Слово — непрерывная последовательность букв и цифр Юникода; дефис и апостроф внутри оставляют одно слово («лапа-лопатка»); знаки препинания и тире словами не считаются; `{имя}` — одно слово (T04); «8:00» — два слова. Токенизатор сверяется с `tokenizeWords` из `@aegis/narrative`.
- Не больше 10 слов в предложении (все строки, включая подписи) и 1–3 предложения в реплике (Q24).
- Ровно 3 факта на дело; не больше 3 новых слов словарика на дело; каждое слово — минимум в 3 разных репликах на **каждом** проходимом маршруте (полный перебор состояний для нового и опытного профиля).
- Все ID существуют, уникальны и в допустимом формате; все ссылки (реплики, сцены, улики, мини-игры, навыки, награды) разрешаются; каждая строка в пакете озвучена (есть запись в манифесте).
- Не больше 3 вариантов выбора на экране в любом достижимом состоянии; больше — только страницами по 3 (Q11).
- Обращение к игроку без рода: эвристика + ручной разбор (`content/shared/gender-review.ts`).
- Текст совпадает с PM, либо есть запись в журнале изменений с верным «было» и номером редакции; новые строки помечены.
- Логика: после обязательных улик ровно один кандидат (своим решателем и `validateDeduction` из `@aegis/narrative`); ни одна улика не противоречит ответу; каждое неверное значение объяснено, и указанная улика **сама** его исключает (R03); ложные следы не являются уликами и объясняются на каждом маршруте, где появились; подсказки и «помоги заполнить» опираются только на открытые улики; к каждой обязательной улике ведёт точная подсказка клубка; кнопка версии не появляется раньше обязательных улик.
- Каждая сцена безопасна при повторном входе с начала (требование G).

## Пакеты

| Пакет | Строк | Предложений | Макс. слов | Кандидатов | Обяз. улик | Осталось | Неверных значений | Ложных следов | Состояний (новый/опытный) | Концовок | Макс. вариантов |
|---|---|---|---|---|---|---|---|---|---|---|---|
| prologue | 54 | 87 | 6 | 3 | 3 | 1 (aegis: 1) | 2 | 0 | 119 / 119 | 9 / 9 | 3 |
| case01-l1 | 181 | 262 | 8 | 27 | 3 | 1 (aegis: 1) | 6 | 3 | 65 / 65 | 4 / 4 | 3 |
| case01-l2 | 225 | 319 | 8 | 64 | 4 | 1 (aegis: 1) | 9 | 5 | 288 / 288 | 6 / 6 | 3 |
| case01-l3 | 267 | 383 | 8 | 100 | 5 | 1 (aegis: 1) | 11 | 7 | 840 / 840 | 12 / 12 | 3 |

## Словарик: минимум разных реплик на маршруте

- case01-l1: «улика» 3, «свидетель» 3, «версия» 3
- case01-l2: «улика» 3, «свидетель» 3, «версия» 3
- case01-l3: «улика» 3, «свидетель» 3, «версия» 3

Всего строк: 532; предложений: 730; максимум слов: 8.

Манифест озвучки: 532 записей, из них уникальных записей для студии: 514.

## Ошибки

- `CUTSCENE-ASSET` prologue: cutscene intro: unknown asset bg.intro-town
- `CUTSCENE-ASSET` prologue: cutscene intro: unknown asset bg.intro-bureau
- `CUTSCENE-RIG` prologue: cutscene intro: cast title: unknown rig prop.title-card
- `CUTSCENE-RIG` prologue: cutscene intro: cast garland: unknown rig prop.garland-100
- `CUTSCENE-RIG` prologue: cutscene intro: cast bunting: unknown rig prop.bunting
- `E:AEG-ANIM-0051` prologue: cutscene intro $.cast.title.rig: Unknown rig "prop.title-card".
- `E:AEG-ANIM-0051` prologue: cutscene intro $.cast.garland.rig: Unknown rig "prop.garland-100".
- `E:AEG-ANIM-0051` prologue: cutscene intro $.cast.bunting.rig: Unknown rig "prop.bunting".
- `E:AEG-ANIM-0051` prologue: cutscene intro $.steps[7].clip: Unknown clip "present".
- `E:AEG-ANIM-0051` prologue: cutscene intro $.steps[10].clip: Unknown clip "present".
- `E:AEG-ANIM-0051` prologue: cutscene intro $.steps[16].clip: Unknown clip "present".
- `CUTSCENE-RIG` prologue: cutscene p3.letter: cast beetle: unknown rig prop.postal-beetle
- `CUTSCENE-RIG` prologue: cutscene p3.letter: cast badge: unknown rig prop.badge-intern
- `E:AEG-ANIM-0051` prologue: cutscene p3.letter $.cast.beetle.rig: Unknown rig "prop.postal-beetle".
- `E:AEG-ANIM-0051` prologue: cutscene p3.letter $.cast.badge.rig: Unknown rig "prop.badge-intern".
- `E:AEG-ANIM-0051` prologue: cutscene p3.letter $.steps[10].clip: Unknown clip "flutter".
- `E:AEG-ANIM-0051` prologue: cutscene p3.letter $.steps[18].expression: Rig "khvosts" has no expression "happy".
- `E:AEG-ANIM-0051` prologue: cutscene p3.letter $.steps[19].expression: Rig "watsony" has no expression "happy".
- `E:AEG-ANIM-0051` prologue: cutscene p3.letter $.steps[22].clip: Unknown clip "present".
- `CUTSCENE-RIG` case01-l1: cutscene c1.shed.l1: cast box: unknown rig prop.box-pie
- `E:AEG-ANIM-0051` case01-l1: cutscene c1.shed.l1 $.cast.box.rig: Unknown rig "prop.box-pie".
- `E:AEG-ANIM-0051` case01-l1: cutscene c1.shed.l1 $.steps[4].clip: Unknown clip "present".
- `E:AEG-ANIM-0051` case01-l1: cutscene c1.shed.l1 $.steps[18].clip: Unknown clip "sniff".
- `E:AEG-ANIM-0051` case01-l1: cutscene c1.shed.l1 $.steps[19].expression: Rig "kartofan" has no expression "surprised".
- `E:AEG-ANIM-0051` case01-l1: cutscene c1.shed.l1 $.steps[21].expression: Rig "kartofan" has no expression "worried".
- `E:AEG-ANIM-0051` case01-l1: cutscene c1.shed.l1 $.steps[24].clip: Unknown clip "bow".
- `E:AEG-ANIM-0051` case01-l1: cutscene c1.shed.l1 $.steps[27].expression: Rig "pudding" has no expression "happy".
- `E:AEG-ANIM-0051` case01-l1: cutscene c1.shed.l1 $.steps[31].clip: Unknown clip "box-open".
- `E:AEG-ANIM-0051` case01-l1: cutscene c1.shed.l1 $.steps[34].clip: Unknown clip "shrug-shy".
- `E:AEG-ANIM-0051` case01-l1: cutscene c1.shed.l1 $.steps[37].expression: Rig "kartofan" has no expression "happy".
- `E:AEG-ANIM-0051` case01-l1: cutscene c1.shed.l1 $.steps[43].clip: Unknown clip "hover".
- `E:AEG-ANIM-0051` case01-l1: cutscene c1.shed.l1 $.steps[52].emote: Rig "khvosts" has no emote "nod".
- `E:AEG-ANIM-0051` case01-l1: cutscene c1.shed.l1 $.steps[56].emote: Rig "fitilyok" has no emote "joy".
- `E:AEG-ANIM-0051` case01-l1: cutscene c1.shed.l1 $.steps[58].clip: Unknown clip "bow".
- `E:AEG-ANIM-0051` case01-l1: cutscene c1.shed.l1 $.steps[61].expression: Rig "tyopa" has no expression "happy".
- `E:AEG-ANIM-0051` case01-l1: cutscene c1.shed.l1 $.steps[64].expression: Rig "khvosts" has no expression "happy".
- `CUTSCENE-ASSET` case01-l1: cutscene c1.oven: unknown asset bg.bakery-oven
- `CUTSCENE-RIG` case01-l1: cutscene c1.oven: cast pie: unknown rig prop.pie-baked
- `E:AEG-ANIM-0051` case01-l1: cutscene c1.oven $.cast.pie.rig: Unknown rig "prop.pie-baked".
- `E:AEG-ANIM-0051` case01-l1: cutscene c1.oven $.steps[15].clip: Unknown clip "present".
- `E:AEG-ANIM-0051` case01-l1: cutscene c1.oven $.steps[18].expression: Rig "tyopa" has no expression "happy".
- `E:AEG-ANIM-0051` case01-l1: cutscene c1.oven $.steps[21].emote: Rig "pudding" has no emote "joy".
- `CUTSCENE-RIG` case01-l1: cutscene c1.reward: cast badge: unknown rig prop.badge-pie-found
- `CUTSCENE-RIG` case01-l1: cutscene c1.reward: cast sticker: unknown rig prop.sticker-pie
- `CUTSCENE-RIG` case01-l1: cutscene c1.reward: cast basket: unknown rig prop.blueberry-basket
- `E:AEG-ANIM-0051` case01-l1: cutscene c1.reward $.cast.badge.rig: Unknown rig "prop.badge-pie-found".
- `E:AEG-ANIM-0051` case01-l1: cutscene c1.reward $.cast.sticker.rig: Unknown rig "prop.sticker-pie".
- `E:AEG-ANIM-0051` case01-l1: cutscene c1.reward $.cast.basket.rig: Unknown rig "prop.blueberry-basket".
- `E:AEG-ANIM-0051` case01-l1: cutscene c1.reward $.steps[9].expression: Rig "khvosts" has no expression "happy".
- `E:AEG-ANIM-0051` case01-l1: cutscene c1.reward $.steps[14].clip: Unknown clip "present".
- `E:AEG-ANIM-0051` case01-l1: cutscene c1.reward $.steps[22].clip: Unknown clip "present".
- `E:AEG-ANIM-0051` case01-l1: cutscene c1.reward $.steps[23].clip: Unknown clip "stars-1".
- `E:AEG-ANIM-0051` case01-l1: cutscene c1.reward $.steps[26].clip: Unknown clip "present".
- `E:AEG-ANIM-0051` case01-l1: cutscene c1.reward $.steps[28].emote: Rig "watsony" has no emote "joy".
- `CUTSCENE-RIG` case01-l2: cutscene c1.shed.l2: cast box: unknown rig prop.box-pie
- `E:AEG-ANIM-0051` case01-l2: cutscene c1.shed.l2 $.cast.box.rig: Unknown rig "prop.box-pie".
- `E:AEG-ANIM-0051` case01-l2: cutscene c1.shed.l2 $.steps[4].clip: Unknown clip "present".
- `E:AEG-ANIM-0051` case01-l2: cutscene c1.shed.l2 $.steps[18].clip: Unknown clip "sniff".
- `E:AEG-ANIM-0051` case01-l2: cutscene c1.shed.l2 $.steps[19].expression: Rig "kartofan" has no expression "surprised".
- `E:AEG-ANIM-0051` case01-l2: cutscene c1.shed.l2 $.steps[21].expression: Rig "kartofan" has no expression "worried".
- `E:AEG-ANIM-0051` case01-l2: cutscene c1.shed.l2 $.steps[24].clip: Unknown clip "bow".
- `E:AEG-ANIM-0051` case01-l2: cutscene c1.shed.l2 $.steps[27].expression: Rig "pudding" has no expression "happy".
- `E:AEG-ANIM-0051` case01-l2: cutscene c1.shed.l2 $.steps[31].clip: Unknown clip "box-open".
- `E:AEG-ANIM-0051` case01-l2: cutscene c1.shed.l2 $.steps[34].clip: Unknown clip "shrug-shy".
- `E:AEG-ANIM-0051` case01-l2: cutscene c1.shed.l2 $.steps[37].expression: Rig "kartofan" has no expression "happy".
- `E:AEG-ANIM-0051` case01-l2: cutscene c1.shed.l2 $.steps[43].clip: Unknown clip "hover".
- `E:AEG-ANIM-0051` case01-l2: cutscene c1.shed.l2 $.steps[50].clip: Unknown clip "hover".
- `E:AEG-ANIM-0051` case01-l2: cutscene c1.shed.l2 $.steps[56].emote: Rig "khvosts" has no emote "nod".
- `E:AEG-ANIM-0051` case01-l2: cutscene c1.shed.l2 $.steps[60].emote: Rig "fitilyok" has no emote "joy".
- `E:AEG-ANIM-0051` case01-l2: cutscene c1.shed.l2 $.steps[62].clip: Unknown clip "bow".
- `E:AEG-ANIM-0051` case01-l2: cutscene c1.shed.l2 $.steps[64].expression: Rig "stella" has no expression "happy".
- `E:AEG-ANIM-0051` case01-l2: cutscene c1.shed.l2 $.steps[67].expression: Rig "tyopa" has no expression "happy".
- `E:AEG-ANIM-0051` case01-l2: cutscene c1.shed.l2 $.steps[70].expression: Rig "khvosts" has no expression "happy".
- `CUTSCENE-ASSET` case01-l2: cutscene c1.oven: unknown asset bg.bakery-oven
- `CUTSCENE-RIG` case01-l2: cutscene c1.oven: cast pie: unknown rig prop.pie-baked
- `E:AEG-ANIM-0051` case01-l2: cutscene c1.oven $.cast.pie.rig: Unknown rig "prop.pie-baked".
- `E:AEG-ANIM-0051` case01-l2: cutscene c1.oven $.steps[15].clip: Unknown clip "present".
- `E:AEG-ANIM-0051` case01-l2: cutscene c1.oven $.steps[18].expression: Rig "tyopa" has no expression "happy".
- `E:AEG-ANIM-0051` case01-l2: cutscene c1.oven $.steps[21].emote: Rig "pudding" has no emote "joy".
- `CUTSCENE-RIG` case01-l2: cutscene c1.reward: cast badge: unknown rig prop.badge-pie-found
- `CUTSCENE-RIG` case01-l2: cutscene c1.reward: cast sticker: unknown rig prop.sticker-pie
- `CUTSCENE-RIG` case01-l2: cutscene c1.reward: cast basket: unknown rig prop.blueberry-basket
- `E:AEG-ANIM-0051` case01-l2: cutscene c1.reward $.cast.badge.rig: Unknown rig "prop.badge-pie-found".
- `E:AEG-ANIM-0051` case01-l2: cutscene c1.reward $.cast.sticker.rig: Unknown rig "prop.sticker-pie".
- `E:AEG-ANIM-0051` case01-l2: cutscene c1.reward $.cast.basket.rig: Unknown rig "prop.blueberry-basket".
- `E:AEG-ANIM-0051` case01-l2: cutscene c1.reward $.steps[9].expression: Rig "khvosts" has no expression "happy".
- `E:AEG-ANIM-0051` case01-l2: cutscene c1.reward $.steps[14].clip: Unknown clip "present".
- `E:AEG-ANIM-0051` case01-l2: cutscene c1.reward $.steps[22].clip: Unknown clip "present".
- `E:AEG-ANIM-0051` case01-l2: cutscene c1.reward $.steps[23].clip: Unknown clip "stars-2".
- `E:AEG-ANIM-0051` case01-l2: cutscene c1.reward $.steps[26].clip: Unknown clip "present".
- `E:AEG-ANIM-0051` case01-l2: cutscene c1.reward $.steps[28].emote: Rig "watsony" has no emote "joy".
- `CUTSCENE-RIG` case01-l3: cutscene c1.shed.l3: cast box: unknown rig prop.box-pie
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.shed.l3 $.cast.box.rig: Unknown rig "prop.box-pie".
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.shed.l3 $.steps[4].clip: Unknown clip "present".
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.shed.l3 $.steps[18].clip: Unknown clip "sniff".
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.shed.l3 $.steps[19].expression: Rig "kartofan" has no expression "surprised".
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.shed.l3 $.steps[21].expression: Rig "kartofan" has no expression "worried".
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.shed.l3 $.steps[24].clip: Unknown clip "bow".
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.shed.l3 $.steps[27].expression: Rig "pudding" has no expression "happy".
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.shed.l3 $.steps[31].clip: Unknown clip "box-open".
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.shed.l3 $.steps[34].clip: Unknown clip "shrug-shy".
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.shed.l3 $.steps[37].expression: Rig "kartofan" has no expression "happy".
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.shed.l3 $.steps[43].clip: Unknown clip "hover".
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.shed.l3 $.steps[50].clip: Unknown clip "hover".
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.shed.l3 $.steps[58].emote: Rig "khvosts" has no emote "nod".
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.shed.l3 $.steps[62].emote: Rig "fitilyok" has no emote "joy".
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.shed.l3 $.steps[64].clip: Unknown clip "bow".
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.shed.l3 $.steps[66].expression: Rig "stella" has no expression "happy".
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.shed.l3 $.steps[69].clip: Unknown clip "shrug-shy".
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.shed.l3 $.steps[72].emote: Rig "pudding" has no emote "joy".
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.shed.l3 $.steps[75].expression: Rig "khvosts" has no expression "happy".
- `CUTSCENE-ASSET` case01-l3: cutscene c1.oven: unknown asset bg.bakery-oven
- `CUTSCENE-RIG` case01-l3: cutscene c1.oven: cast pie: unknown rig prop.pie-baked
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.oven $.cast.pie.rig: Unknown rig "prop.pie-baked".
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.oven $.steps[15].clip: Unknown clip "present".
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.oven $.steps[18].expression: Rig "tyopa" has no expression "happy".
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.oven $.steps[21].emote: Rig "pudding" has no emote "joy".
- `CUTSCENE-RIG` case01-l3: cutscene c1.reward: cast badge: unknown rig prop.badge-pie-found
- `CUTSCENE-RIG` case01-l3: cutscene c1.reward: cast sticker: unknown rig prop.sticker-pie
- `CUTSCENE-RIG` case01-l3: cutscene c1.reward: cast basket: unknown rig prop.blueberry-basket
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.reward $.cast.badge.rig: Unknown rig "prop.badge-pie-found".
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.reward $.cast.sticker.rig: Unknown rig "prop.sticker-pie".
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.reward $.cast.basket.rig: Unknown rig "prop.blueberry-basket".
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.reward $.steps[9].expression: Rig "khvosts" has no expression "happy".
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.reward $.steps[14].clip: Unknown clip "present".
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.reward $.steps[22].clip: Unknown clip "present".
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.reward $.steps[23].clip: Unknown clip "stars-3".
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.reward $.steps[26].clip: Unknown clip "present".
- `E:AEG-ANIM-0051` case01-l3: cutscene c1.reward $.steps[28].emote: Rig "watsony" has no emote "joy".

## Предупреждения

Нет.

