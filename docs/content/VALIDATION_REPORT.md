# Отчёт проверки контента

> Сгенерировано `node tools/content/build.ts` из `content/`. Не редактировать вручную.

**Итог:** ✅ ошибок нет; предупреждений: 163.

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
| case02-l1 | 177 | 250 | 8 | 27 | 3 | 1 (aegis: 1) | 6 | 3 | 61 / 61 | 4 / 4 | 3 |
| case02-l2 | 225 | 316 | 9 | 64 | 4 | 1 (aegis: 1) | 9 | 4 | 78 / 78 | 4 / 4 | 3 |
| case02-l3 | 256 | 349 | 9 | 100 | 5 | 1 (aegis: 1) | 11 | 5 | 69 / 69 | 4 / 4 | 3 |
| case03-l1 | 176 | 267 | 9 | 27 | 3 | 1 (aegis: 1) | 6 | 3 | 66 / 66 | 2 / 2 | 3 |
| case03-l2 | 220 | 333 | 9 | 64 | 4 | 1 (aegis: 1) | 9 | 4 | 90 / 90 | 2 / 2 | 3 |
| case03-l3 | 252 | 376 | 9 | 100 | 5 | 1 (aegis: 1) | 11 | 5 | 62 / 62 | 1 / 1 | 3 |
| case04-l1 | 195 | 282 | 8 | 27 | 3 | 1 (aegis: 1) | 6 | 3 | 39 / 39 | 2 / 2 | 3 |
| case04-l2 | 235 | 342 | 8 | 64 | 4 | 1 (aegis: 1) | 9 | 5 | 51 / 51 | 2 / 2 | 3 |
| case04-l3 | 271 | 394 | 8 | 100 | 5 | 1 (aegis: 1) | 11 | 7 | 83 / 83 | 2 / 2 | 3 |
| case05-l1 | 170 | 257 | 8 | 27 | 3 | 1 (aegis: 1) | 6 | 3 | 62 / 62 | 4 / 4 | 3 |
| case05-l2 | 212 | 324 | 8 | 64 | 4 | 1 (aegis: 1) | 9 | 5 | 85 / 85 | 4 / 4 | 3 |
| case05-l3 | 248 | 376 | 8 | 100 | 5 | 1 (aegis: 1) | 11 | 6 | 62 / 62 | 2 / 2 | 3 |
| case06-l1 | 165 | 251 | 8 | 27 | 3 | 1 (aegis: 1) | 6 | 3 | 40 / 40 | 2 / 2 | 3 |
| case06-l2 | 193 | 299 | 8 | 64 | 4 | 1 (aegis: 1) | 9 | 5 | 41 / 41 | 2 / 2 | 3 |
| case06-l3 | 222 | 334 | 8 | 100 | 5 | 1 (aegis: 1) | 11 | 6 | 43 / 43 | 2 / 2 | 3 |
| case07-l1 | 185 | 291 | 8 | 27 | 3 | 1 (aegis: 1) | 6 | 3 | 119 / 119 | 6 / 6 | 3 |
| case07-l2 | 221 | 349 | 8 | 64 | 4 | 1 (aegis: 1) | 9 | 4 | 151 / 151 | 6 / 6 | 3 |
| case07-l3 | 252 | 393 | 8 | 100 | 5 | 1 (aegis: 1) | 11 | 5 | 183 / 183 | 6 / 6 | 3 |
| case08-l1 | 183 | 272 | 9 | 27 | 4 | 1 (aegis: 1) | 6 | 3 | 43 / 43 | 2 / 2 | 3 |
| case08-l2 | 213 | 319 | 9 | 64 | 4 | 1 (aegis: 1) | 9 | 4 | 43 / 43 | 2 / 2 | 3 |
| case08-l3 | 251 | 367 | 9 | 100 | 5 | 1 (aegis: 1) | 11 | 5 | 55 / 55 | 2 / 2 | 3 |

## Словарик: минимум разных реплик на маршруте

- case01-l1: «улика» 3, «свидетель» 3, «версия» 3
- case01-l2: «улика» 3, «свидетель» 3, «версия» 3
- case01-l3: «улика» 3, «свидетель» 3, «версия» 3
- case02-l1: «алиби» 3, «мотив» 3
- case02-l2: «алиби» 3, «мотив» 3
- case02-l3: «алиби» 3, «мотив» 3
- case03-l1: «дедукция» 3
- case03-l2: «дедукция» 3
- case03-l3: «дедукция» 3
- case04-l1: «подозреваемый» 3
- case04-l2: «подозреваемый» 3
- case04-l3: «подозреваемый» 3
- case05-l1: «гипотеза» 3
- case05-l2: «гипотеза» 3
- case05-l3: «гипотеза» 3
- case06-l1: «ориентир» 3
- case06-l2: «ориентир» 3
- case06-l3: «ориентир» 3
- case07-l1: «причина» 3, «следствие» 3
- case07-l2: «причина» 3, «следствие» 3
- case07-l3: «причина» 3, «следствие» 3

Всего строк: 2573; предложений: 3775; максимум слов: 9.

Манифест озвучки: 2642 записей, из них уникальных записей для студии: 2457.

## Ошибки

Нет.

## Предупреждения

- `ASSET-PENDING` case02-l1: cutscene c2.oak.l1: unknown asset bg.old-oak
- `ASSET-PENDING` case02-l1: cutscene c2.oak.l1: Unknown rig "prop.c2-dry-letters".
- `ASSET-PENDING` case02-l1: cutscene c2.oak.l1: Unknown rig "prop.c2-magpie-nest".
- `ASSET-PENDING` case02-l1: cutscene c2.exhibition.l1: unknown asset bg.town-square
- `ASSET-PENDING` case02-l1: cutscene c2.exhibition.l1: Unknown rig "prop.c2-letter-garland".
- `ASSET-PENDING` case02-l1: cutscene c2.reward.l1: Unknown rig "prop.badge-letters-saved".
- `ASSET-PENDING` case02-l1: cutscene c2.reward.l1: Unknown rig "prop.sticker-letters-1".
- `ASSET-PENDING` case02-l1: cutscene c2.reward.l1: Unknown rig "prop.c2-cipher-poster".
- `ASSET-PENDING` case02-l2: cutscene c2.oak.l2: unknown asset bg.old-oak
- `ASSET-PENDING` case02-l2: cutscene c2.oak.l2: Unknown rig "prop.c2-dry-letters".
- `ASSET-PENDING` case02-l2: cutscene c2.oak.l2: Unknown rig "prop.c2-magpie-nest".
- `ASSET-PENDING` case02-l2: cutscene c2.oak.l2: Unknown rig "damka".
- `ASSET-PENDING` case02-l2: cutscene c2.exhibition.l2: unknown asset bg.town-square
- `ASSET-PENDING` case02-l2: cutscene c2.exhibition.l2: Unknown rig "prop.c2-letter-garland".
- `ASSET-PENDING` case02-l2: cutscene c2.reward.l2: Unknown rig "prop.badge-letters-saved".
- `ASSET-PENDING` case02-l2: cutscene c2.reward.l2: Unknown rig "prop.sticker-letters-2".
- `ASSET-PENDING` case02-l2: cutscene c2.reward.l2: Unknown rig "prop.c2-cipher-poster".
- `ASSET-PENDING` case02-l3: cutscene c2.oak.l3: unknown asset bg.old-oak
- `ASSET-PENDING` case02-l3: cutscene c2.oak.l3: Unknown rig "prop.c2-dry-letters".
- `ASSET-PENDING` case02-l3: cutscene c2.oak.l3: Unknown rig "prop.c2-magpie-nest".
- `ASSET-PENDING` case02-l3: cutscene c2.oak.l3: Unknown rig "damka".
- `ASSET-PENDING` case02-l3: cutscene c2.exhibition.l3: unknown asset bg.town-square
- `ASSET-PENDING` case02-l3: cutscene c2.exhibition.l3: Unknown rig "prop.c2-letter-garland".
- `ASSET-PENDING` case02-l3: cutscene c2.reward.l3: Unknown rig "prop.badge-letters-saved".
- `ASSET-PENDING` case02-l3: cutscene c2.reward.l3: Unknown rig "prop.sticker-letters-3".
- `ASSET-PENDING` case02-l3: cutscene c2.reward.l3: Unknown rig "prop.c2-cipher-poster".
- `ASSET-PENDING` case03-l1: cutscene c3.intro.l1: unknown asset bg.office-evening
- `ASSET-PENDING` case03-l1: cutscene c3.intro.l1: Unknown rig "prop.firefly-lantern".
- `ASSET-PENDING` case03-l1: cutscene c3.note.l1: unknown asset bg.lighthouse-door
- `ASSET-PENDING` case03-l1: cutscene c3.note.l1: Unknown rig "damka".
- `ASSET-PENDING` case03-l1: cutscene c3.note.l1: Unknown rig "prop.paddle-repaired".
- `ASSET-PENDING` case03-l1: cutscene c3.note.l1: Unknown rig "prop.chamomile-note".
- `ASSET-PENDING` case03-l1: cutscene c3.reveal.l1: unknown asset bg.lighthouse-room
- `ASSET-PENDING` case03-l1: cutscene c3.reveal.l1: Unknown rig "pukhlik".
- `ASSET-PENDING` case03-l1: cutscene c3.reveal.l1: Unknown rig "damka".
- `ASSET-PENDING` case03-l1: cutscene c3.reveal.l1: Unknown rig "prop.light-code-book".
- `ASSET-PENDING` case03-l1: cutscene c3.reward.l1: Unknown rig "prop.badge-beacon".
- `ASSET-PENDING` case03-l1: cutscene c3.reward.l1: Unknown rig "prop.sticker-beacon-1".
- `ASSET-PENDING` case03-l1: cutscene c3.reward.l1: Unknown rig "prop.firefly-lamp".
- `ASSET-PENDING` case03-l1: C3-0 (stage actions): Unknown rig "prop.map-honey-lighthouse".
- `ASSET-PENDING` case03-l1: C3-1 (stage actions): Unknown rig "damka".
- `ASSET-PENDING` case03-l1: C3-3 (stage actions): Unknown rig "damka".
- `ASSET-PENDING` case03-l1: C3-3 (stage actions): Unknown rig "prop.notebook-secret-notes".
- `ASSET-PENDING` case03-l1: C3-3 (stage actions): Unknown rig "prop.chamomile-note".
- `ASSET-PENDING` case03-l1: C3-9 (stage actions): Unknown rig "pukhlik".
- `ASSET-PENDING` case03-l1: C3-9 (stage actions): Unknown rig "prop.light-signal-strip".
- `ASSET-PENDING` case03-l1: C3-10 (stage actions): Unknown rig "prop.fact-cards-c3".
- `ASSET-PENDING` case03-l2: cutscene c3.intro.l2: unknown asset bg.office-evening
- `ASSET-PENDING` case03-l2: cutscene c3.intro.l2: Unknown rig "prop.firefly-lantern".
- `ASSET-PENDING` case03-l2: cutscene c3.note.l2: unknown asset bg.lighthouse-door
- `ASSET-PENDING` case03-l2: cutscene c3.note.l2: Unknown rig "damka".
- `ASSET-PENDING` case03-l2: cutscene c3.note.l2: Unknown rig "prop.paddle-repaired".
- `ASSET-PENDING` case03-l2: cutscene c3.note.l2: Unknown rig "prop.chamomile-note".
- `ASSET-PENDING` case03-l2: cutscene c3.reveal.l2: unknown asset bg.lighthouse-room
- `ASSET-PENDING` case03-l2: cutscene c3.reveal.l2: Unknown rig "pukhlik".
- `ASSET-PENDING` case03-l2: cutscene c3.reveal.l2: Unknown rig "damka".
- `ASSET-PENDING` case03-l2: cutscene c3.reveal.l2: Unknown rig "prop.light-code-book".
- `ASSET-PENDING` case03-l2: cutscene c3.reward.l2: Unknown rig "prop.badge-beacon".
- `ASSET-PENDING` case03-l2: cutscene c3.reward.l2: Unknown rig "prop.sticker-beacon-2".
- `ASSET-PENDING` case03-l2: cutscene c3.reward.l2: Unknown rig "prop.firefly-lamp".
- `ASSET-PENDING` case03-l2: C3-0 (stage actions): Unknown rig "prop.map-honey-lighthouse".
- `ASSET-PENDING` case03-l2: C3-3 (stage actions): Unknown rig "damka".
- `ASSET-PENDING` case03-l2: C3-3 (stage actions): Unknown rig "prop.notebook-secret-notes".
- `ASSET-PENDING` case03-l2: C3-3 (stage actions): Unknown rig "prop.chamomile-note".
- `ASSET-PENDING` case03-l2: C3-L2-9 (stage actions): Unknown rig "pukhlik".
- `ASSET-PENDING` case03-l2: C3-L2-9 (stage actions): Unknown rig "prop.light-signal-strip".
- `ASSET-PENDING` case03-l2: C3-10 (stage actions): Unknown rig "prop.fact-cards-c3".
- `ASSET-PENDING` case03-l3: cutscene c3.intro.l3: unknown asset bg.office-evening
- `ASSET-PENDING` case03-l3: cutscene c3.intro.l3: Unknown rig "prop.firefly-lantern".
- `ASSET-PENDING` case03-l3: cutscene c3.note.l3: unknown asset bg.lighthouse-door
- `ASSET-PENDING` case03-l3: cutscene c3.note.l3: Unknown rig "damka".
- `ASSET-PENDING` case03-l3: cutscene c3.note.l3: Unknown rig "prop.paddle-repaired".
- `ASSET-PENDING` case03-l3: cutscene c3.note.l3: Unknown rig "prop.chamomile-note".
- `ASSET-PENDING` case03-l3: cutscene c3.reveal.l3: unknown asset bg.lighthouse-room
- `ASSET-PENDING` case03-l3: cutscene c3.reveal.l3: Unknown rig "pukhlik".
- `ASSET-PENDING` case03-l3: cutscene c3.reveal.l3: Unknown rig "damka".
- `ASSET-PENDING` case03-l3: cutscene c3.reveal.l3: Unknown rig "prop.light-code-book".
- `ASSET-PENDING` case03-l3: cutscene c3.reward.l3: Unknown rig "prop.badge-beacon".
- `ASSET-PENDING` case03-l3: cutscene c3.reward.l3: Unknown rig "prop.sticker-beacon-3".
- `ASSET-PENDING` case03-l3: cutscene c3.reward.l3: Unknown rig "prop.firefly-lamp".
- `ASSET-PENDING` case03-l3: C3-0 (stage actions): Unknown rig "prop.map-honey-lighthouse".
- `ASSET-PENDING` case03-l3: C3-3 (stage actions): Unknown rig "damka".
- `ASSET-PENDING` case03-l3: C3-3 (stage actions): Unknown rig "prop.notebook-secret-notes".
- `ASSET-PENDING` case03-l3: C3-3 (stage actions): Unknown rig "prop.chamomile-note".
- `ASSET-PENDING` case03-l3: C3-L3-11 (stage actions): Unknown rig "pukhlik".
- `ASSET-PENDING` case03-l3: C3-L3-11 (stage actions): Unknown rig "prop.light-signal-strip".
- `ASSET-PENDING` case03-l3: C3-10 (stage actions): Unknown rig "prop.fact-cards-c3".
- `ASSET-PENDING` case04-l1: cutscene c4.office.l1: Unknown rig "prop.empty-jam-jar".
- `ASSET-PENDING` case04-l1: cutscene c4.cellar.l1: unknown asset bg.mayor-cellar
- `ASSET-PENDING` case04-l1: cutscene c4.pantry.l1: unknown asset bg.office-pantry
- `ASSET-PENDING` case04-l1: cutscene c4.pantry.l1: Unknown rig "pukhlik".
- `ASSET-PENDING` case04-l1: cutscene c4.pantry.l1: Unknown rig "prop.jam-jars-c4".
- `ASSET-PENDING` case04-l1: cutscene c4.pantry.l1: Unknown rig "prop.note-khvosts".
- `ASSET-PENDING` case04-l1: cutscene c4.tea.l1: unknown asset bg.town-square-tea
- `ASSET-PENDING` case04-l1: cutscene c4.tea.l1: Unknown rig "pukhlik".
- `ASSET-PENDING` case04-l1: cutscene c4.tea.l1: Unknown rig "prop.tea-table-c4".
- `ASSET-PENDING` case04-l1: cutscene c4.reward.l1: Unknown rig "prop.badge-jam-c4".
- `ASSET-PENDING` case04-l1: cutscene c4.reward.l1: Unknown rig "prop.sticker-jam-c4-1".
- `ASSET-PENDING` case04-l1: cutscene c4.reward.l1: Unknown rig "prop.jam-jar-c4".
- `ASSET-PENDING` case04-l1: C4-5 (stage actions): Unknown rig "pukhlik".
- `ASSET-PENDING` case04-l1: C4-10 (stage actions): Unknown rig "prop.jam-jar-c4".
- `ASSET-PENDING` case04-l1: c4l1-dreams: unknown asset dream.c4.l1.door-stairs
- `ASSET-PENDING` case04-l1: c4l1-dreams: unknown asset dream.c4.l1.magnifier-sign
- `ASSET-PENDING` case04-l1: c4l1-dreams: unknown asset dream.c4.l1.old-umbrellas
- `ASSET-PENDING` case04-l1: c4l1-dreams: unknown asset dream.c4.l1.jars-ribbons
- `ASSET-PENDING` case04-l1: c4l1-dreams: unknown asset dream.c4.l1.jubilee-flag
- `ASSET-PENDING` case04-l1: c4l1-dreams: unknown asset dream.c4.l1.exclamation-note
- `ASSET-PENDING` case04-l1: c4l1-dreams: unknown asset dream.c4.l1.soap-bubbles
- `ASSET-PENDING` case04-l1: c4l1-dreams: unknown asset dream.c4.l1.muzzle-stripes
- `ASSET-PENDING` case04-l1: c4l1-dreams: unknown asset dream.c4.l1.detective-hat
- `ASSET-PENDING` case04-l2: cutscene c4.office.l2: Unknown rig "prop.empty-jam-jar".
- `ASSET-PENDING` case04-l2: cutscene c4.cellar.l2: unknown asset bg.mayor-cellar
- `ASSET-PENDING` case04-l2: cutscene c4.pantry.l2: unknown asset bg.office-pantry
- `ASSET-PENDING` case04-l2: cutscene c4.pantry.l2: Unknown rig "pukhlik".
- `ASSET-PENDING` case04-l2: cutscene c4.pantry.l2: Unknown rig "prop.jam-jars-c4".
- `ASSET-PENDING` case04-l2: cutscene c4.pantry.l2: Unknown rig "prop.note-khvosts".
- `ASSET-PENDING` case04-l2: cutscene c4.tea.l2: unknown asset bg.town-square-tea
- `ASSET-PENDING` case04-l2: cutscene c4.tea.l2: Unknown rig "pukhlik".
- `ASSET-PENDING` case04-l2: cutscene c4.tea.l2: Unknown rig "prop.tea-table-c4".
- `ASSET-PENDING` case04-l2: cutscene c4.reward.l2: Unknown rig "prop.badge-jam-c4".
- `ASSET-PENDING` case04-l2: cutscene c4.reward.l2: Unknown rig "prop.sticker-jam-c4-2".
- `ASSET-PENDING` case04-l2: cutscene c4.reward.l2: Unknown rig "prop.jam-jar-c4".
- `ASSET-PENDING` case04-l2: C4-10 (stage actions): Unknown rig "prop.jam-jar-c4".
- `ASSET-PENDING` case04-l2: c4l2-dreams: unknown asset dream.c4.l2.umbrellas-corner
- `ASSET-PENDING` case04-l2: c4l2-dreams: unknown asset dream.c4.l2.narrow-door
- `ASSET-PENDING` case04-l2: c4l2-dreams: unknown asset dream.c4.l2.stairs-overhead
- `ASSET-PENDING` case04-l2: c4l2-dreams: unknown asset dream.c4.l2.ribbon
- `ASSET-PENDING` case04-l2: c4l2-dreams: unknown asset dream.c4.l2.jubilee-flag
- `ASSET-PENDING` case04-l2: c4l2-dreams: unknown asset dream.c4.l2.exclamation-note
- `ASSET-PENDING` case04-l2: c4l2-dreams: unknown asset dream.c4.l2.bubble
- `ASSET-PENDING` case04-l2: c4l2-dreams: unknown asset dream.c4.l2.detective-hat
- `ASSET-PENDING` case04-l2: c4l2-dreams: unknown asset dream.c4.l2.muzzle-stripes
- `ASSET-PENDING` case04-l3: cutscene c4.office.l3: Unknown rig "prop.empty-jam-jar".
- `ASSET-PENDING` case04-l3: cutscene c4.cellar.l3: unknown asset bg.mayor-cellar
- `ASSET-PENDING` case04-l3: cutscene c4.pantry.l3: unknown asset bg.office-pantry
- `ASSET-PENDING` case04-l3: cutscene c4.pantry.l3: Unknown rig "pukhlik".
- `ASSET-PENDING` case04-l3: cutscene c4.pantry.l3: Unknown rig "prop.jam-jars-c4".
- `ASSET-PENDING` case04-l3: cutscene c4.pantry.l3: Unknown rig "prop.note-khvosts".
- `ASSET-PENDING` case04-l3: cutscene c4.tea.l3: unknown asset bg.town-square-tea
- `ASSET-PENDING` case04-l3: cutscene c4.tea.l3: Unknown rig "pukhlik".
- `ASSET-PENDING` case04-l3: cutscene c4.tea.l3: Unknown rig "prop.tea-table-c4".
- `ASSET-PENDING` case04-l3: cutscene c4.reward.l3: Unknown rig "prop.badge-jam-c4".
- `ASSET-PENDING` case04-l3: cutscene c4.reward.l3: Unknown rig "prop.sticker-jam-c4-3".
- `ASSET-PENDING` case04-l3: cutscene c4.reward.l3: Unknown rig "prop.jam-jar-c4".
- `ASSET-PENDING` case04-l3: C4-10 (stage actions): Unknown rig "prop.jam-jar-c4".
- `ASSET-PENDING` case04-l3: c4l3-cart: unknown asset compare.c4.cart-track
- `ASSET-PENDING` case04-l3: c4l3-dreams: unknown asset dream.c4.l3.umbrella-smell
- `ASSET-PENDING` case04-l3: c4l3-dreams: unknown asset dream.c4.l3.mouse-door
- `ASSET-PENDING` case04-l3: c4l3-dreams: unknown asset dream.c4.l3.creaking-stairs
- `ASSET-PENDING` case04-l3: c4l3-dreams: unknown asset dream.c4.l3.tied-ribbon
- `ASSET-PENDING` case04-l3: c4l3-dreams: unknown asset dream.c4.l3.circled-calendar
- `ASSET-PENDING` case04-l3: c4l3-dreams: unknown asset dream.c4.l3.hush-finger
- `ASSET-PENDING` case04-l3: c4l3-dreams: unknown asset dream.c4.l3.bubble
- `ASSET-PENDING` case04-l3: c4l3-dreams: unknown asset dream.c4.l3.magnifier
- `ASSET-PENDING` case04-l3: c4l3-dreams: unknown asset dream.c4.l3.office-key
- `ASSET-PENDING` cozy: scarf-stripes: unknown asset scarf.pattern.stripes
- `ASSET-PENDING` cozy: scarf-dots: unknown asset scarf.pattern.dots
- `ASSET-PENDING` cozy: scarf-hearts: unknown asset scarf.pattern.hearts
- `ASSET-PENDING` cozy: scarf-stars: unknown asset scarf.pattern.stars
- `ASSET-PENDING` cozy: decor-geranium: unknown asset decor.geranium
- `ASSET-PENDING` cozy: decor-firefly-lamp: unknown asset decor.firefly-lamp
- `ASSET-PENDING` cozy: decor-rug: unknown asset decor.rug-daisy
- `ASSET-PENDING` cozy: decor-trophy-shelf: unknown asset decor.trophy-shelf

