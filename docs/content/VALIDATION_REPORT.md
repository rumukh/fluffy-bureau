# Отчёт проверки контента

> Сгенерировано `node tools/content/build.ts` из `content/`. Не редактировать вручную.

**Итог:** ❌ ошибок: 20; предупреждений: 0.

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
| case02-l1 | 165 | 238 | 8 | 27 | 3 | 1 (aegis: 1) | 6 | 3 | 61 / 61 | 4 / 4 | 3 |
| case02-l2 | 209 | 300 | 9 | 64 | 4 | 1 (aegis: 1) | 9 | 4 | 78 / 78 | 4 / 4 | 3 |
| case02-l3 | 234 | 326 | 9 | 100 | 5 | 1 (aegis: 1) | 11 | 5 | 69 / 69 | 4 / 4 | 3 |
| case03-l1 | 180 | 271 | 9 | 27 | 3 | 1 (aegis: 1) | 6 | 3 | 66 / 66 | 2 / 2 | 3 |
| case03-l2 | 225 | 338 | 9 | 64 | 4 | 1 (aegis: 1) | 9 | 4 | 90 / 90 | 2 / 2 | 3 |
| case03-l3 | 261 | 385 | 9 | 100 | 5 | 1 (aegis: 1) | 11 | 5 | 62 / 62 | 1 / 1 | 3 |
| case04-l1 | 164 | 251 | 8 | 27 | 3 | 1 (aegis: 1) | 6 | 3 | 39 / 39 | 2 / 2 | 3 |
| case04-l2 | 206 | 313 | 8 | 64 | 4 | 1 (aegis: 1) | 9 | 5 | 51 / 51 | 2 / 2 | 3 |
| case04-l3 | 241 | 363 | 8 | 100 | 5 | 1 (aegis: 1) | 11 | 7 | 83 / 83 | 2 / 2 | 3 |
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

Всего строк: 2482; предложений: 3683; максимум слов: 9.

Манифест озвучки: 2482 записей, из них уникальных записей для студии: 2304.

## Ошибки

- `STAGED` case02-l1: c2l1-cipher: production packs need a dedicated minigame kind, not the generic placeholder (U12)
- `STAGED` case02-l1: c2l1-postal: production packs need a dedicated minigame kind, not the generic placeholder (U12)
- `STAGED` case02-l2: c2l2-cipher: production packs need a dedicated minigame kind, not the generic placeholder (U12)
- `STAGED` case02-l2: c2l2-postal: production packs need a dedicated minigame kind, not the generic placeholder (U12)
- `STAGED` case02-l3: c2l3-cipher: production packs need a dedicated minigame kind, not the generic placeholder (U12)
- `STAGED` case02-l3: c2l3-postal: production packs need a dedicated minigame kind, not the generic placeholder (U12)
- `STAGED` case03-l1: c3l1-sound: production packs need a dedicated minigame kind, not the generic placeholder (U12)
- `STAGED` case03-l1: c3l1-light: production packs need a dedicated minigame kind, not the generic placeholder (U12)
- `STAGED` case03-l2: c3l2-sound: production packs need a dedicated minigame kind, not the generic placeholder (U12)
- `STAGED` case03-l2: c3l2-light: production packs need a dedicated minigame kind, not the generic placeholder (U12)
- `STAGED` case03-l3: c3l3-sound: production packs need a dedicated minigame kind, not the generic placeholder (U12)
- `STAGED` case03-l3: c3l3-blink: production packs need a dedicated minigame kind, not the generic placeholder (U12)
- `STAGED` case03-l3: c3l3-light: production packs need a dedicated minigame kind, not the generic placeholder (U12)
- `STAGED` case04-l1: c4l1-dreams: production packs need a dedicated minigame kind, not the generic placeholder (U12)
- `STAGED` case04-l1: c4l1-tea: production packs need a dedicated minigame kind, not the generic placeholder (U12)
- `STAGED` case04-l2: c4l2-dreams: production packs need a dedicated minigame kind, not the generic placeholder (U12)
- `STAGED` case04-l2: c4l2-tea: production packs need a dedicated minigame kind, not the generic placeholder (U12)
- `STAGED` case04-l3: c4l3-cart: production packs need a dedicated minigame kind, not the generic placeholder (U12)
- `STAGED` case04-l3: c4l3-dreams: production packs need a dedicated minigame kind, not the generic placeholder (U12)
- `STAGED` case04-l3: c4l3-tea: production packs need a dedicated minigame kind, not the generic placeholder (U12)

## Предупреждения

Нет.

