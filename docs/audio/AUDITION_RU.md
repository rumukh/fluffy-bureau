# Проба голосов и словарь произношений

**Версия:** 1, 8 октября 2026 года. **Workstream A.** Уведомление PM по Q30 и T06: работа не останавливается,
голос любой роли можно заменить позже — пересинтез автоматический.

## Как слушать

Файлы лежат рядом: `docs/audio/audition/shell/`. У каждой роли два варианта: **a** — выбран по умолчанию,
**b** — запасной. Чтобы сменить голос, достаточно ответить «роль → b» (или назвать другой голос).

Все голоса — готовые нейронные голоса Azure AI Speech (коммерческое использование по условиям Microsoft).
Русских голосов в сервисе три (Светлана, Дмитрий, Дарья); остальные роли озвучены многоязычными голосами,
говорящими по-русски. Все они проверены распознаванием речи на русском и выдают события формы рта (виземы),
по которым двигаются губы героев. Громкость выровнена: −18 LUFS, пик не выше −1,5 dBTP.

Обращение к игроку в озвучке — «пушинка» (Q28).

## Роли

| Роль | Вариант a (по умолчанию) | Вариант b | Настройка a | Фразы |
|---|---|---|---|---|
| Рассказчик | `ru-RU-SvetlanaNeural` | `en-GB-AdaMultilingualNeural` | высота -2%, темп -6% | 1. «Осмотреть скамейку.» — [a](audition/shell/AUD-narrator-1a.14e642954d.mp3), [b](audition/shell/AUD-narrator-1b.706a636eca.mp3)<br>2. «А ты знал? Кроты видят плохо. Зато отлично чуют и осязают носом.» — [a](audition/shell/AUD-narrator-2a.96ddbb67d8.mp3), [b](audition/shell/AUD-narrator-2b.f7fc0f1205.mp3)<br>3. «Шерлок Хвостс, Ватсони, Пудинг, Тёпа, Картофан, Фитилёк, Стелла, Шуршики, Дамка и Пухлик. Городок Пушистино.» — [a](audition/shell/AUD-narrator-3a.f943a43456.mp3), [b](audition/shell/AUD-narrator-3b.96183c8524.mp3) |
| Шерлок Хвостс | `ru-RU-DmitryNeural` | `en-US-DustinMultilingualNeural` | высота -10%, темп -8% | 1. «Я Шерлок Хвостс. Когда думаю, пускаю пузыри.» — [a](audition/shell/AUD-khvosts-1a.ad50f8e6c1.mp3), [b](audition/shell/AUD-khvosts-1b.d26f2c9796.mp3)<br>2. «Не суди по виду, пушинка. Суди по уликам.» — [a](audition/shell/AUD-khvosts-2a.4b02ca5d2a.mp3), [b](audition/shell/AUD-khvosts-2b.da3fdd12e6.mp3)<br>3. «Элементарно, пушинка! Дело раскрыто!» — [a](audition/shell/AUD-khvosts-3a.1e01d60c9b.mp3), [b](audition/shell/AUD-khvosts-3b.3d728e17eb.mp3) |
| Доктор Ватсони | `ru-RU-DariyaNeural` | `en-US-LolaMultilingualNeural` | высота +4%, темп -2% | 1. «Записала, пушинка! Не забуду… кажется.» — [a](audition/shell/AUD-watsony-1a.8a73075893.mp3), [b](audition/shell/AUD-watsony-1b.9164fa607f.mp3)<br>2. «Версия не подтвердилась! Зато вспомним кое-что.» — [a](audition/shell/AUD-watsony-2a.1e0f8d27f1.mp3), [b](audition/shell/AUD-watsony-2b.025deaef0c.mp3) |
| Мэр Пудинг | `en-US-DerekMultilingualNeural` | `en-US-BrandonMultilingualNeural` | высота +8%, темп +6% | 1. «Беда! Мой черничный пирог пропал!» — [a](audition/shell/AUD-pudding-1a.04a68b3682.mp3), [b](audition/shell/AUD-pudding-1b.0f56dfd2df.mp3)<br>2. «Пирог в щёки не влезет. Он большой!» — [a](audition/shell/AUD-pudding-2a.bf93ec5f46.mp3), [b](audition/shell/AUD-pudding-2b.d99052997f.mp3) |
| Енот Тёпа | `en-US-AndrewMultilingualNeural` | `en-US-SteffanMultilingualNeural` | высота +2%, темп -6% | 1. «Вы тоже думаете, что это я?» — [a](audition/shell/AUD-tyopa-1a.51f15f52ad.mp3), [b](audition/shell/AUD-tyopa-1b.1f5d711df1.mp3)<br>2. «Лапы синие от мыла. Я варю черничное мыло к празднику.» — [a](audition/shell/AUD-tyopa-2a.bf14e3a6a4.mp3), [b](audition/shell/AUD-tyopa-2b.478e200275.mp3) |
| Крот Картофан | `en-US-OnyxTurboMultilingualNeural` | `en-US-BrianMultilingualNeural` | высота -4%, темп -12% | 1. «Гости? Ой, я вас плохо вижу.» — [a](audition/shell/AUD-kartofan-1a.a0349766a0.mp3), [b](audition/shell/AUD-kartofan-1b.69729e84de.mp3)<br>2. «А взял чужую. Перепутал!» — [a](audition/shell/AUD-kartofan-2a.93974a0fc7.mp3), [b](audition/shell/AUD-kartofan-2b.0368ba644e.mp3) |
| Сорока Стелла | `es-ES-XimenaMultilingualNeural` | `en-US-ShimmerTurboMultilingualNeural` | высота +8%, темп +8% | 1. «А ещё я видела Тёпу с коробкой!» — [a](audition/shell/AUD-stella-1a.5368d8b3ab.mp3), [b](audition/shell/AUD-stella-1b.b6419d56e9.mp3)<br>2. «Это же коробка с мылом. Я ошиблась!» — [a](audition/shell/AUD-stella-2a.41edd32429.mp3), [b](audition/shell/AUD-stella-2b.8ac4d46ab8.mp3) |
| Светлячок Фитилёк | `en-US-FableTurboMultilingualNeural` | `en-US-AlloyTurboMultilingualNeural` | высота +16%, темп +6% | 1. «Правда! Я светил ему всё утро.» — [a](audition/shell/AUD-fitilyok-1a.998a2aa28f.mp3), [b](audition/shell/AUD-fitilyok-1b.0a878ebbc3.mp3) |
| Мышата Шуршики | `zh-CN-XiaoyouMultilingualNeural` | `en-US-LolaMultilingualNeural` | высота +6%, темп +4% | 1. «Мы ничего не брали! Только крошки.» — [a](audition/shell/AUD-mouse-1a.01a219b67f.mp3), [b](audition/shell/AUD-mouse-1b.71f0d1380b.mp3)<br>2. «А можно нам тоже пирога?» — [a](audition/shell/AUD-mouse-2a.db4e9be522.mp3), [b](audition/shell/AUD-mouse-2b.70a9667b0f.mp3) |
| Бобёрша Дамка | `en-GB-AdaMultilingualNeural` | `es-MX-DaliaMultilingualNeural` | высота +0%, темп +0% | 1. «Здравствуй, пушинка! Я Дамка, смотритель маяка.» — [a](audition/shell/AUD-damka-1a.cea8dac695.mp3), [b](audition/shell/AUD-damka-1b.7360b931ff.mp3) |
| Совёнок Пухлик | `en-US-CoraMultilingualNeural` | `zh-CN-XiaoyuMultilingualNeural` | высота +14%, темп -4% | 1. «Здравствуй, пушинка! Я Пухлик. Я тренируюсь по ночам.» — [a](audition/shell/AUD-pukhlik-1a.edb4331d35.mp3), [b](audition/shell/AUD-pukhlik-1b.c648bbae71.mp3) |

Дамка и Пухлик в Этапе 1 не говорят; их пробы нужны только для выбора голоса заранее.

## Словарь произношений

Ударение задаёт словарь C (`hint`), A переводит его в МФА для тега `<phoneme>`. Проверка «часового» варианта
(на месте имени закодировано другое слово) показала, что все выбранные голоса читают МФА из разметки.

| Имя | Ударение | Формы и МФА |
|---|---|---|
| Хвостс | Хво́стс | хвостс [ˈxvosts], хвостса [ˈxvostsə], хвостсу [ˈxvostsʊ], хвостсом [ˈxvostsəm] |
| Ватсони | Ватсо́ни | ватсони [vɐtˈsonʲɪ] |
| Шерлок | Ше́рлок | шерлок [ˈʂɛrlək] |
| Пудинг | Пу́динг | пудинг [ˈpudʲɪnk], пудинга [ˈpudʲɪnɡə], пудингу [ˈpudʲɪnɡʊ], пудингом [ˈpudʲɪnɡəm] |
| Тёпа | Тёпа | тёпа [ˈtʲopə], тёпы [ˈtʲopɨ], тёпу [ˈtʲopʊ], тёпе [ˈtʲopʲɪ], тёпой [ˈtʲopəj] |
| Картофан | Картофа́н | картофан [kərtɐˈfan], картофана [kərtɐˈfanə], картофану [kərtɐˈfanʊ], картофаном [kərtɐˈfanəm] |
| Фитилёк | Фитилёк | фитилёк [fʲɪtʲɪˈlʲok], фитилька [fʲɪtʲɪlʲˈka], фитильку [fʲɪtʲɪlʲˈku], фитильком [fʲɪtʲɪlʲˈkom] |
| Стелла | Сте́лла | стелла [ˈstɛlːə], стеллы [ˈstɛlːɨ], стелле [ˈstɛlːɪ], стеллу [ˈstɛlːʊ], стеллой [ˈstɛlːəj] |
| Шуршики | Шу́ршики | шуршики [ˈʂurʂɨkʲɪ], шуршиков [ˈʂurʂɨkəf], шуршикам [ˈʂurʂɨkəm] |
| Дамка | Да́мка | дамка [ˈdamkə], дамки [ˈdamkʲɪ], дамке [ˈdamkʲɪ], дамку [ˈdamkʊ] |
| Пухлик | Пу́хлик | пухлик [ˈpuxlʲɪk], пухлика [ˈpuxlʲɪkə], пухлику [ˈpuxlʲɪkʊ] |
| Пушистино | Пуши́стино | пушистино [pʊˈʂɨstʲɪnə] |
| пушинка | пуши́нка | пушинка [pʊˈʂɨnkə] |

## Что проверить на слух

- Имена с непривычным звучанием: Хвостс (один слог), Ватсони, Картофан, Фитилёк, Шуршики.
- Нет ли у многоязычных голосов заметного акцента (Пудинг, Тёпа, Картофан, Стелла, Фитилёк, мышата).
- Тембры разных героев не путаются между собой.

Автоматическая проверка распознаванием не заменяет прослушивание: оценки ударения она не даёт.
