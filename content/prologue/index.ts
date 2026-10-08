// Prologue «Первый день стажёра» (SCRIPT_PROLOGUE_CASE01_RU.md, P0–P3).
import {
  act, added, all, any, changed, cl, cutscene, dir, goto, has, L, lines, menu, minigame, not, opt, reveal, reward, scene,
  seq, set, skill, wait, when, end, type CaseSource,
} from '../../tools/content/dsl.ts';
import { intro, p3Letter } from '../cutscenes/index.ts';

const L_ = lines('prologue', 'dialogue', [
  ['P0-01', 'watsony', 'Ой, у нас пополнение! Сейчас запишу.', changed('Ой, новенький стажёр! Сейчас запишу.', '«Новенький» — обращение мужского рода к игроку; заменено нейтральным', 'R07, D05')],
  ['P0-02', 'watsony', 'Кто ты? Выбери себя.'],
  ['P0-03', 'watsony', 'Как тебя зовут?'],
  ['P0-04', 'watsony', 'Какого цвета твой шарфик?'],
  ['P0-05', 'watsony', 'Записала, {имя}! Не забуду… кажется.'],
  ['P1-01', 'khvosts', 'Добро пожаловать в Пушистое бюро, {имя}!'],
  ['P1-02', 'khvosts', 'Я Шерлок Хвостс. Когда думаю, пускаю пузыри.'],
  ['P1-03', 'khvosts', 'Сыщик замечает мелочи. Давай потренируемся!'],
  ['P1-04', 'khvosts', 'Нажми на то, что светится.'],
  ['P1-05', 'khvosts', 'Это лупа. Она делает мелочи большими.'],
  ['P1-06', 'khvosts', 'Это Блокнот сыщика. Там живут наши догадки.'],
  ['P1-07', 'khvosts', 'Заводной почтовый жук. Он носит письма.'],
  ['P1-08', 'watsony', 'Не слышно? Нажми ушко. Я повторю.'],
  ['P1-09', 'khvosts', 'А это лампа смелости.'],
  ['P1-10', 'khvosts', 'Станет неуютно — нажми её.'],
  ['P1-11', 'khvosts', 'Будет светло, тепло и спокойно.', { delivery: 'warm' }],
  ['P1-12', 'khvosts', 'Видишь? Лампа всегда рядом.', { delivery: 'warm' }],
  ['P2-01', 'watsony', 'Ой! Где мои очки? Ничего не вижу!', { delivery: 'worried' }],
  ['P2-02', 'khvosts', 'Твоё первое дело, {имя}. Найдём очки!'],
  ['P2-03', 'khvosts', 'В Блокноте три места. Где же очки?'],
  ['P2-04', 'khvosts', 'Крестик — точно нет. Галочка — точно да.'],
  ['P2-05', 'khvosts', 'Вопрос — пока не знаю. Это тоже честно.'],
  ['P2-06', 'khvosts', 'На полке только книги. Очков нет.'],
  ['P2-07', 'khvosts', 'Поставь крестик у полки.'],
  ['P2-08', 'khvosts', 'В чайнике тёплый чай. Очков нет.'],
  ['P2-09', 'khvosts', 'В зеркале Ватсони. На голове что-то блестит!', { delivery: 'excited' }],
  ['P2-10', 'khvosts', 'Всё проверено? Скажи Ватсони свою догадку.'],
  ['P2-11', 'watsony', 'На голове? Ой… и правда! Вот они!', { delivery: 'excited' }],
  ['P2-12', 'watsony', 'Спасибо, {имя}! Я бы искала до вечера.'],
  ['P2-13', 'khvosts', 'Элементарно, пушинка!'],
  ['P2-14', 'watsony', 'Отличная попытка! Запишем и подумаем.', { delivery: 'warm' }],
  ['P2-15', 'khvosts', 'Мы ещё не смотрели в зеркало.', { delivery: 'thinking' }],
  ['P2-16', 'khvosts', 'Что блестело в зеркале?', { delivery: 'thinking' }],
  ['P3-01', 'khvosts', 'Держи телефон-ракушку.'],
  ['P3-02', 'khvosts', 'Трудно — позвони Ватсони. Она подскажет.'],
  ['P3-03', 'watsony', 'Подскажу! Если не забуду…'],
  ['P3-04', 'khvosts', 'Нужен отдых? Нажми паузу. Мы всё запомним.', { delivery: 'warm' }],
  ['P3-05', 'khvosts', 'Письмо от мэра Пудинга. Читаю…'],
  ['P3-06', 'khvosts', 'Срочно! Пропал черничный пирог!', { delivery: 'excited' }],
  ['P3-07', 'khvosts', 'Настоящее дело, {имя}! Держи значок стажёра.'],
  ['P3-08', 'khvosts', 'Нажми на Пироговую улицу. Бежим!'],
  // Labels (R06)
  ['P-TITLE', 'narrator', 'Первый день стажёра', added('Название пролога как озвученная подпись', 'R06', { kind: 'label' })],
  ['P1-B01', 'narrator', 'Лупа', added('Подпись светящегося предмета', 'R06', { kind: 'label' })],
  ['P1-B02', 'narrator', 'Блокнот сыщика', added('Подпись светящегося предмета', 'R06', { kind: 'label' })],
  ['P1-B03', 'narrator', 'Почтовый жук', added('Подпись светящегося предмета', 'R06', { kind: 'label' })],
  ['P3-B01', 'narrator', 'Пироговая улица', added('Подпись места на карте', 'R06', { kind: 'label' })],
  ['P2-B03', 'narrator', 'Зеркало', added('Подпись предмета для осмотра', 'R06', { kind: 'label' })],
  ['P2-AX-where', 'narrator', 'Где?', added('Заголовок колонки Блокнота', 'R06', { kind: 'label' })],
  ['P2-AX-shelf', 'narrator', 'Полка', added('Значение колонки и подпись предмета', 'R06', { kind: 'label' })],
  ['P2-AX-teapot', 'narrator', 'Чайник', added('Значение колонки и подпись предмета', 'R06', { kind: 'label' })],
  ['P2-AX-head', 'narrator', 'Голова Ватсони', added('Значение колонки', 'R06', { kind: 'label' })],
  ['P2-CL-shelf', 'narrator', 'Полка: очков нет', added('Название улики в Блокноте', 'R06', { kind: 'label' })],
  ['P2-CL-teapot', 'narrator', 'Чайник: очков нет', added('Название улики в Блокноте', 'R06', { kind: 'label' })],
  ['P2-CL-mirror', 'narrator', 'Зеркало: на голове что-то блестит', added('Название улики в Блокноте', 'R06', { kind: 'label' })],
]);

const scenes = [
  scene({
    id: 'P0', title: 'Анкета стажёра', location: 'office-desk', cast: ['watsony'], presentation: 'dialogue',
    steps: [
      skill('intro', [cutscene('intro')], []),
      dir('P0-D01', 'Стол Ватсони в Конторе. Ватсони держит перо.', null, [act.pose('watsony', { clip: 'nod' })]),
      L('P0-01'), L('P0-02'), wait('avatar.species'), L('P0-03'), wait('avatar.name'), L('P0-04'), wait('avatar.scarf'), L('P0-05'),
      goto('P1'),
    ],
  }),
  scene({
    id: 'P1', title: 'Контора бюро', location: 'office', cast: ['khvosts', 'watsony'], presentation: 'dialogue',
    steps: [
      dir('P1-D01', 'Входит Шерлок Хвостс, вокруг него плывут мыльные пузыри.', null, [act.effect('bubbles', 1650, 700, 2.5), act.sfx('bubbles', 0.5)]),
      ...seq('P1-', 1, 3),
      skill('inspect', [dir('P1-D02', 'Три предмета мягко светятся.', null, [act.effect('sparkles', 560, 760, 2), act.sfx('sparkle', 0.5)]), L('P1-04'), minigame('p1-inspect')]),
      skill('lamp', [dir('P1-D03', 'В углу Конторы стоит лампа.'), ...seq('P1-', 9, 11), wait('lamp.on'), dir('P1-D04', 'Свет теплеет, музыка мягче. Нажать ещё раз — всё как было.'), wait('lamp.off'), L('P1-12')]),
      goto('P2'),
    ],
  }),
  scene({
    id: 'P2', title: 'Мини-дело «Где очки Ватсони?»', location: 'office', cast: ['khvosts', 'watsony'], presentation: 'dialogue',
    steps: [
      L('P2-01'), L('P2-02'),
      skill('notebook', [dir('P2-D01', 'Открывается Блокнот с одной колонкой «Где?».', null, [act.sfx('page-turn', 0.6)]), ...seq('P2-', 3, 5)]),
      goto('P2-HUB'),
    ],
  }),
  scene({
    id: 'P2-HUB', title: 'Осмотр Конторы', location: 'office', cast: ['khvosts', 'watsony'], presentation: 'hub',
    steps: [
      when(all(any(has.confirmed('where'), all(has.visited('P2-SHELF'), has.visited('P2-TEAPOT'), has.visited('P2-MIRROR'))), not(has.visited('P2-GUESS'))), [goto('P2-GUESS')]),
      menu('P2-M', null, [
        opt('shelf', 'P2-AX-shelf', 'P2-SHELF'),
        opt('teapot', 'P2-AX-teapot', 'P2-TEAPOT'),
        opt('mirror', 'P2-B03', 'P2-MIRROR'),
      ]),
    ],
  }),
  scene({
    id: 'P2-SHELF', title: 'Полка', location: 'office', cast: ['khvosts'], presentation: 'dialogue',
    steps: [L('P2-06'), when(not(has.flag('p2-shelf-seen')), [L('P2-07')]), set('p2-shelf-seen'), reveal('p-shelf'), goto('P2-HUB')],
  }),
  scene({
    id: 'P2-TEAPOT', title: 'Чайник', location: 'office', cast: ['khvosts'], presentation: 'dialogue',
    steps: [L('P2-08'), reveal('p-teapot'), goto('P2-HUB')],
  }),
  scene({
    id: 'P2-MIRROR', title: 'Зеркало', location: 'office', cast: ['khvosts', 'watsony'], presentation: 'dialogue',
    steps: [L('P2-09'), reveal('p-mirror'), goto('P2-HUB')],
  }),
  scene({
    id: 'P2-GUESS', title: 'Кнопка «Сказать догадку»', location: 'office', cast: ['khvosts'], presentation: 'dialogue',
    steps: [skill('guess', [L('P2-10')]), goto('P2-HUB')],
  }),
  scene({
    id: 'P2-WIN', title: 'Очки найдены', location: 'office', cast: ['khvosts', 'watsony'], presentation: 'dialogue',
    steps: [...seq('P2-', 11, 13), goto('P3')],
  }),
  scene({
    id: 'P3', title: 'Ракушка, пауза и первое письмо', location: 'office', cast: ['khvosts', 'watsony'], presentation: 'cutscene',
    steps: [
      skill('shell', seq('P3-', 1, 3)),
      skill('pause', [L('P3-04')]),
      cutscene('p3.letter'),
      reward('rw-prologue-badge'), reward('rw-prologue-title'), reward('rw-prologue-buttons'),
      skill('map', [dir('P3-D02', 'Открывается карта Пушистино. Активна только Пироговая улица.', null, [act.sfx('page-turn', 0.6)]), L('P3-08')]),
      goto('P3-MAP'),
    ],
  }),
  scene({
    id: 'P3-MAP', title: 'Карта Пушистино', location: 'map', cast: [], presentation: 'hub',
    steps: [menu('P3-M', null, [opt('pirogovaya', 'P3-B01', 'P3-END')])],
  }),
  scene({
    id: 'P3-END', title: 'Переход к делу №1', location: 'map', cast: [], presentation: 'dialogue',
    steps: [
      end(),
    ],
  }),
];

export const prologue: CaseSource = {
  id: 'prologue',
  lines: L_,
  variants: [
    {
      pack: 'prologue',
      kind: 'prologue',
      title: 'P-TITLE',
      case: null,
      start: 'P0',
      scenes,
      logic: {
        axes: [{ id: 'where', title: 'P2-AX-where', values: [
          { id: 'shelf', label: 'P2-AX-shelf' },
          { id: 'teapot', label: 'P2-AX-teapot' },
          { id: 'head', label: 'P2-AX-head' },
        ] }],
        intended: { where: 'head' },
        clues: [
          { id: 'p-shelf', title: 'P2-CL-shelf', required: true, predicate: { op: 'ne', axis: 'where', value: 'shelf' }, requires: [], source: 'P2-SHELF', summary: 'На полке только книги.' },
          { id: 'p-teapot', title: 'P2-CL-teapot', required: true, predicate: { op: 'ne', axis: 'where', value: 'teapot' }, requires: [], source: 'P2-TEAPOT', summary: 'В чайнике только чай.' },
          { id: 'p-mirror', title: 'P2-CL-mirror', required: true, predicate: { op: 'eq', axis: 'where', value: 'head' }, requires: [], source: 'P2-MIRROR', summary: 'В зеркале видно, что очки на голове Ватсони.' },
        ],
        version: {
          button: 'UI-hud.guess',
          available: any(has.confirmed('where'), all(has.visited('P2-SHELF'), has.visited('P2-TEAPOT'), has.visited('P2-MIRROR'))),
          onSolved: 'P2-WIN',
        },
        wrongVersion: {
          intro: [cl('P2-14')],
          byValue: [
            { axis: 'where', value: 'shelf', clues: ['p-shelf'], lines: [cl('P2-15', not(has.visited('P2-MIRROR'))), cl('P2-16', has.visited('P2-MIRROR'))] },
            { axis: 'where', value: 'teapot', clues: ['p-teapot'], lines: [cl('P2-15', not(has.visited('P2-MIRROR'))), cl('P2-16', has.visited('P2-MIRROR'))] },
          ],
          outro: [],
        },
        redHerrings: [],
      },
      notebookHelp: {
        mode: 'suggest',
        marks: [
          { axis: 'where', value: 'shelf', mark: 'excluded', clues: ['p-shelf'], line: 'P2-06' },
          { axis: 'where', value: 'teapot', mark: 'excluded', clues: ['p-teapot'], line: 'P2-08' },
          { axis: 'where', value: 'head', mark: 'confirmed', clues: ['p-mirror'], line: 'P2-09' },
        ],
        pointers: [],
        nothing: 'UI-notebook.nothing',
      },
      hints: null,
      minigames: [
        {
          id: 'p1-inspect',
          skill: 'inspect',
          config: {
            kind: 'magnifier',
            targets: [
              { id: 'magnifier', label: 'P1-B01', required: true, reply: ['P1-05'] },
              { id: 'notebook', label: 'P1-B02', required: true, reply: ['P1-06'] },
              { id: 'bug', label: 'P1-B03', required: true, reply: ['P1-07'] },
            ],
            afterFirst: ['P1-08'],
            afterFirstSkill: 'replay',
            assistAfterMisses: 3,
          },
        },
      ],
      facts: [],
      glossary: [],
      rewards: ['rw-prologue-badge', 'rw-prologue-title', 'rw-prologue-buttons'],
      collections: [],
      activities: [],
      comfort: [],
      cutscenes: [
        intro,
        p3Letter,
      ],
      decisions: [
        { id: 'P-D1', text: 'Реплика P1-08 и навык «повтор» привязаны к первому найденному предмету внутри осмотра (поле afterFirst мини-игры), как в сценарии.', ref: 'R09' },
        { id: 'P-D2', text: 'Кнопка «Сказать догадку» доступна, когда в колонке есть ✔ или осмотрены все три предмета; вводная P2-10 звучит один раз при первом появлении кнопки.', ref: 'Q14' },
        { id: 'P-D3', text: '«Помоги заполнить» в прологе предлагает стикеры, объясняя их репликами осмотра P2-06, P2-08, P2-09 (сложность 1 по D03).', ref: 'D03' },
        { id: 'P-D5', text: 'Ролики T25: вступление без слов (один раз на профиль, навык intro) в начале P0 и прилёт письма в P3 (P3-05…P3-07 звучат внутри ролика; награды выдаются шагами после него). Вход Хвостса в P1 остаётся обычной сценой диалога: T25 его не включает.', ref: 'T25' },
        { id: 'P-D4', text: 'Пролог не содержит фактов и слов словарика: это обучение, а не дело (правило «ровно 3 факта» применяется к делам).', ref: 'T01' },
      ],
    },
  ],
};

