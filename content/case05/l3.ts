import { all, dir, goto, has, L, menu, minigame, not, opt as mopt, reveal, scene, seq, skill, when, type VariantSource, retarget } from '../../tools/content/dsl.ts';
import { activity, and, cl, comfort, commonCollections, commonCutscenes, commonDecisions, eq, facts, factsScene, finale, glossary, intended, intro0, ne, opt, rewardScene, rulesScene, secretNote, what, where, who } from './common.ts';

const HUB = 'C5-L3-HUB';

export const level3: VariantSource = {
  pack: 'case05-l3',
  kind: 'case',
  title: 'C5-TITLE',
  case: { number: 5, level: 3 },
  start: 'C5-L3-1',
  scenes: [
    scene({
      id: 'C5-L3-1', title: 'Завязка', location: 'library-entrance', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'dialogue',
      steps: [
        ...intro0(), dir('C5-L3-1-D01', 'Вечер. Пудинг отпирает дверь библиотеки.'),
        ...seq('C5-1-', 1, 3), L('C5-L2-1-01'), L('C5-L2-1-02'), ...seq('C5-L3-1-', 1, 3), L('C5-1-05'), L('C5-1-07'),
        skill('notebook', [dir('C5-L3-1-D02', 'Блокнот раскрывается: три колонки, до пяти строк.')]),
        skill('klubki', [L('C5-TUT-KLUBKI-01'), L('C5-TUT-KLUBKI-02')]),
        goto('C5-2'),
      ],
    }),
    scene({ id: 'C5-2', title: 'Холл: полка и Тайная заметка', location: 'library-hall', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'cutscene', steps: secretNote(HUB) }),
    scene({
      id: HUB, title: 'Библиотека: выбор', location: 'library-hall', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'hub',
      steps: [
        when(all(has.clue('c5-l3-search'), has.clue('c5-l3-sound'), has.clue('c5-l3-timeline'), has.clue('c5-l3-tracks'), has.clue('c5-l3-shelf'), not(has.visited('C5-L3-7'))), [goto('C5-L3-7')]),
        menu('C5-L3-M', null, [
          mopt('search', 'C5-2-B01', 'C5-L3-2', { hideWhen: has.visited('C5-L3-2') }),
          mopt('sound', 'C5-2-B02', 'C5-L3-3', { hideWhen: has.visited('C5-L3-3') }),
          mopt('timeline', 'C5-L2-3-B01', 'C5-L3-6', { when: has.clue('c5-l3-sound'), hideWhen: has.visited('C5-L3-6') }),
          mopt('tracks', 'C5-L3-4-B01', 'C5-L3-4', { when: has.clue('c5-l3-search'), hideWhen: has.visited('C5-L3-4') }),
          mopt('shelf', 'C5-6-B01', 'C5-L3-5', { when: has.clue('c5-l3-search'), hideWhen: has.visited('C5-L3-5') }),
        ]),
      ],
    }),
    scene({
      id: 'C5-L3-2', title: '«Лупа»', location: 'reading-room', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'minigame',
      steps: [skill('magnifier', [L('C5-L3-2-01')]), minigame('c5l3-search'), L('C5-L2-2-03'), L('C5-3-05'), L('C5-3-06'), L('C5-3-08'), L('C5-L3-2-04'), reveal('c5-l3-search'), goto(HUB)],
    }),
    scene({
      id: 'C5-L3-3', title: '«Услышь разницу»', location: 'reading-room', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'minigame',
      steps: [
        L('C5-4-01'), skill('sound-waves', [L('C5-4-02'), L('C5-SOUND-VIS')]),
        minigame('c5l3-sound'), ...seq('C5-4-', 6, 8), L('C5-L2-3-02'), L('C5-4-09'), reveal('c5-l3-sound'), L('C5-L2-3-03'), goto(HUB),
      ],
    }),
    scene({
      id: 'C5-L3-4', title: '«Кто наследил?» в зале', location: 'reading-room', cast: ['khvosts', 'watsony'], presentation: 'minigame',
      steps: [skill('tracks', [L('C5-L3-4-01')]), minigame('c5l3-tracks'), ...seq('C5-L3-4-', 5, 7), reveal('c5-l3-tracks'), goto(HUB)],
    }),
    scene({
      id: 'C5-L3-5', title: '«Тихая полка»', location: 'reading-room', cast: ['khvosts', 'watsony'], presentation: 'minigame',
      steps: [skill('quiet-shelf', seq('C5-6-', 1, 3)), L('C5-L3-5-01'), L('C5-L3-5-02'), minigame('c5l3-shelf'), ...seq('C5-6-', 5, 9), reveal('c5-l3-shelf'), goto(HUB)],
    }),
    scene({
      id: 'C5-L3-6', title: '«Лента времени»', location: 'reading-room', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'minigame',
      steps: [
        skill('timeline', [L('C5-L2-4-01'), L('C5-L2-4-02')], [L('C5-L2-4-03')]),
        L('C5-L2-4-04'),
        minigame('c5l3-timeline'),
        ...seq('C5-L2-4-', 5, 9), ...seq('C5-L3-6-', 1, 2),
        reveal('c5-l3-timeline'),
        goto(HUB),
      ],
    }),
    scene({ id: 'C5-L3-7', title: 'Версия', location: 'reading-room', cast: ['khvosts', 'watsony'], presentation: 'dialogue', steps: [...seq('C5-7-', 1, 2), goto(HUB)] }),
    finale('C5-L3-8', 'C5-L3-9', [L('C5-L2-7-01'), L('C5-L2-7-02'), L('C5-L2-7-03'), ...seq('C5-L3-8-', 1, 3)]),
    rulesScene('C5-L3-9', 'c5l3-rules', 3),
    factsScene('C5-11'),
    rewardScene(3),
  ],
  logic: {
    axes: [
      { id: 'who', title: 'C5-AX-who', values: [who.mice, who.fitilyok, who.kartofan, who.stella, who.pudding] },
      { id: 'where', title: 'C5-AX-where', values: [where.reading, where.basement, where.attic, where.storage, where.kids] },
      { id: 'what', title: 'C5-AX-what', values: [what.nightReading, what.moleTunnel, what.oldFloor, what.draft] },
    ],
    intended,
    clues: [
      { id: 'c5-l3-search', title: 'C5-CL-search', required: true, predicate: and(ne('where', 'basement'), ne('where', 'attic'), ne('where', 'storage'), ne('who', 'fitilyok')), requires: [], source: 'C5-L3-2', summary: 'Находки в зале; паутинка цела; тапочек у входа — ложный след.' },
      { id: 'c5-l3-sound', title: 'C5-CL-sound', required: true, predicate: and(ne('who', 'kartofan'), ne('what', 'mole-tunnel'), ne('what', 'old-floor'), ne('what', 'draft')), requires: [], source: 'C5-L3-3', summary: 'Быстрые шажки, не тапочки; нет рытья и качания двери.' },
      { id: 'c5-l3-timeline', title: 'C5-CL-timeline', required: true, predicate: and(ne('who', 'stella'), ne('who', 'pudding'), ne('what', 'draft')), requires: ['c5-l3-sound'], source: 'C5-L3-6', summary: 'Стелла утром, мэр дома пишет записи, форточка закрыта.' },
      { id: 'c5-l3-tracks', title: 'C5-CL-tracks', required: true, predicate: and(eq('where', 'reading'), ne('where', 'kids'), ne('who', 'pudding')), requires: ['c5-l3-search'], source: 'C5-L3-4', summary: 'Мышиные следы у стеллажа; детский уголок пуст; хомячьих следов нет.' },
      { id: 'c5-l3-shelf', title: 'C5-CL-shelf', required: true, predicate: and(eq('who', 'mice'), eq('what', 'night-reading')), requires: ['c5-l3-search'], source: 'C5-L3-5', summary: 'Журнал Ночной читальни с мышиными лапками.' },
    ],
    version: { button: 'UI-hud.version', available: has.visited('C5-L3-7'), onSolved: 'C5-L3-8' },
    wrongVersion: {
      intro: [cl('C5-7-03')],
      byValue: [
        { axis: 'who', value: 'fitilyok', clues: ['c5-l3-search'], lines: [cl('C5-7-04')] },
        { axis: 'who', value: 'kartofan', clues: ['c5-l3-sound'], lines: [cl('C5-7-05')] },
        { axis: 'who', value: 'stella', clues: ['c5-l3-timeline'], lines: [cl('C5-L2-6-01')] },
        { axis: 'who', value: 'pudding', clues: ['c5-l3-tracks'], lines: [cl('C5-L3-7-01')] },
        { axis: 'where', value: 'basement', clues: ['c5-l3-search'], lines: [cl('C5-7-06')] },
        { axis: 'where', value: 'attic', clues: ['c5-l3-search'], lines: [cl('C5-7-06')] },
        { axis: 'where', value: 'storage', clues: ['c5-l3-search'], lines: [cl('C5-L2-6-02')] },
        { axis: 'where', value: 'kids', clues: ['c5-l3-tracks'], lines: [cl('C5-L3-7-02')] },
        { axis: 'what', value: 'mole-tunnel', clues: ['c5-l3-sound'], lines: [cl('C5-7-05')] },
        { axis: 'what', value: 'old-floor', clues: ['c5-l3-sound'], lines: [cl('C5-7-07')] },
        { axis: 'what', value: 'draft', clues: ['c5-l3-sound'], lines: [cl('C5-L2-6-03')] },
      ],
      outro: [cl('C5-7-08')],
    },
    redHerrings: [
      { id: 'rh-c5-fitilyok', summary: 'Фонарик Фитилька — подарок мышатам.', presentedBy: ['C5-1-01', 'C5-3-03'], explainedBy: ['C5-8-12'] },
      { id: 'rh-c5-kartofan', summary: 'Кротового рытья не было.', presentedBy: ['C5-1-02'], explainedBy: ['C5-8-13'] },
      { id: 'rh-c5-old-floor', summary: 'Скрипели шажки, а не старая доска.', presentedBy: ['C5-1-03'], explainedBy: ['C5-8-14'] },
      { id: 'rh-c5-stella', summary: 'Газеты Стеллы утренние.', presentedBy: ['C5-L2-1-01'], explainedBy: ['C5-L2-7-01'] },
      { id: 'rh-c5-storage-draft', summary: 'Дверь хранилища и сквозняк не объясняют скрип.', presentedBy: ['C5-L2-1-02'], explainedBy: ['C5-L2-7-02'] },
      { id: 'rh-c5-sleepwalk', summary: 'Тапочек мэра у входа не означает ночную прогулку.', presentedBy: ['C5-L3-1-01', 'C5-L3-2-03'], explainedBy: ['C5-L3-8-01'] },
    ],
  },
  notebookHelp: {
    mode: 'point',
    marks: [
      { axis: 'who', value: 'mice', mark: 'confirmed', clues: ['c5-l3-shelf'], line: 'C5-NB-who-mice' },
      { axis: 'who', value: 'fitilyok', mark: 'excluded', clues: ['c5-l3-search'], line: 'C5-NB-who-fitilyok' },
      { axis: 'who', value: 'kartofan', mark: 'excluded', clues: ['c5-l3-sound'], line: 'C5-NB-who-kartofan' },
      { axis: 'who', value: 'stella', mark: 'excluded', clues: ['c5-l3-timeline'], line: 'C5-NB-who-stella' },
      { axis: 'who', value: 'pudding', mark: 'excluded', clues: ['c5-l3-tracks'], line: 'C5-NB-who-pudding' },
      { axis: 'where', value: 'reading', mark: 'confirmed', clues: ['c5-l3-tracks'], line: 'C5-NB-where-reading' },
      { axis: 'where', value: 'basement', mark: 'excluded', clues: ['c5-l3-search'], line: 'C5-NB-where-basement' },
      { axis: 'where', value: 'attic', mark: 'excluded', clues: ['c5-l3-search'], line: 'C5-NB-where-attic' },
      { axis: 'where', value: 'storage', mark: 'excluded', clues: ['c5-l3-search'], line: 'C5-NB-where-storage' },
      { axis: 'where', value: 'kids', mark: 'excluded', clues: ['c5-l3-tracks'], line: 'C5-NB-where-kids' },
      { axis: 'what', value: 'night-reading', mark: 'confirmed', clues: ['c5-l3-shelf'], line: 'C5-NB-what-reading' },
      { axis: 'what', value: 'mole-tunnel', mark: 'excluded', clues: ['c5-l3-sound'], line: 'C5-NB-what-mole' },
      { axis: 'what', value: 'old-floor', mark: 'excluded', clues: ['c5-l3-sound'], line: 'C5-NB-what-floor' },
      { axis: 'what', value: 'draft', mark: 'excluded', clues: ['c5-l3-timeline'], line: 'C5-NB-what-draft' },
    ],
    pointers: [
      { clue: 'c5-l3-search', line: 'C5-NB-point-search' },
      { clue: 'c5-l3-sound', line: 'C5-NB-point-sound' },
      { clue: 'c5-l3-timeline', line: 'C5-NB-point-timeline' },
      { clue: 'c5-l3-tracks', line: 'C5-NB-point-tracks' },
      { clue: 'c5-l3-shelf', line: 'C5-NB-point-shelf' },
    ],
    nothing: 'UI-notebook.nothing',
  },
  hints: {
    klubok: {
      speaker: 'khvosts', precision: 'exact', allowance: 3,
      rules: [
        { id: 'C5-L3-H-01', when: not(has.clue('c5-l3-search')), cites: [] },
        { id: 'C5-L3-H-02', when: all(has.clue('c5-l3-search'), not(has.clue('c5-l3-sound'))), cites: ['c5-l3-search'] },
        { id: 'C5-L3-H-03', when: all(has.clue('c5-l3-search'), not(has.clue('c5-l3-tracks'))), cites: ['c5-l3-search'] },
        { id: 'C5-L3-H-04', when: all(has.clue('c5-l3-sound'), not(has.clue('c5-l3-timeline'))), cites: ['c5-l3-sound'] },
        { id: 'C5-L3-H-05', when: all(has.clue('c5-l3-search'), not(has.clue('c5-l3-shelf'))), cites: ['c5-l3-search'] },
        { id: 'C5-L3-H-06', when: has.visited('C5-L3-7'), cites: ['c5-l3-search', 'c5-l3-sound', 'c5-l3-timeline', 'c5-l3-tracks', 'c5-l3-shelf'] },
      ],
      review: 'C5-L3-H-06',
      exhausted: 'UI-hint.klubokEmpty',
    },
    shell: null,
  },
  minigames: [
    {
      id: 'c5l3-search', skill: 'magnifier',
      config: { kind: 'magnifier', targets: [
        { id: 'thimbles', label: 'C5-3-B01', required: true, reply: ['C5-3-02'] },
        { id: 'lantern', label: 'C5-3-B02', required: true, reply: ['C5-3-03'] },
        { id: 'tiny-tracks', label: 'C5-3-B03', required: true, reply: ['C5-3-04'] },
        { id: 'web', label: 'C5-L2-2-B01', required: true, reply: ['C5-L2-2-02'] },
        { id: 'slipper', label: 'C5-L3-2-B01', required: true, reply: ['C5-L3-2-02', 'C5-L3-2-03'] },
      ], afterFirst: [], afterFirstSkill: null, assistAfterMisses: 3 },
    },
    {
      id: 'c5l3-sound', skill: 'sound-waves',
      config: { kind: 'staged', mechanic: 'sound-waves', description: 'Похожие визуальные образцы: шажки мышат, мягкие тапочки, старая доска.', lines: ['C5-4-04'],
        steps: [
          { id: 'steps', prompt: 'C5-SOUND-Q1', pageSize: 3, options: [opt('steps', 'C5-SOUND-B01', true, 'C5-4-03'), opt('slippers', 'C5-SOUND-B09', false, 'C5-L3-3-01'), opt('board', 'C5-SOUND-B03', false, 'C5-4-04')] },
          { id: 'squeak', prompt: 'C5-SOUND-Q2', pageSize: 3, options: [opt('squeak', 'C5-SOUND-B04', true, 'C5-4-05'), opt('wind', 'C5-SOUND-B05', false, 'C5-4-04'), opt('spoon', 'C5-SOUND-B06', false, 'C5-4-04')] },
          { id: 'door', prompt: 'C5-SOUND-Q3', pageSize: 3, options: [opt('door', 'C5-SOUND-B07', false, 'C5-4-04'), opt('steps', 'C5-SOUND-B01', true, 'C5-L2-3-01'), opt('branch', 'C5-SOUND-B08', false, 'C5-4-04')] },
        ] },
    },
    {
      id: 'c5l3-tracks', skill: 'tracks',
      config: { kind: 'tracks', steps: [
        { id: 'shelf', prompt: 'C5-L3-TRACK-Q1', pageSize: 3, options: [opt('mouse', 'C5-L3-TRACK-B01', true, 'C5-L3-4-02'), opt('hamster', 'C5-L3-TRACK-B02', false, 'C5-L3-4-03'), opt('mole', 'C5-L3-TRACK-B03', false, 'C5-L3-4-04')] },
      ], question: null },
    },
    {
      id: 'c5l3-shelf', skill: 'quiet-shelf',
      config: { kind: 'staged', mechanic: 'quiet-shelf', description: 'Девять книг: сортировка по второй и третьей букве для четырёх книг на К.', lines: ['C5-6-04'],
        steps: [
          { id: 'first', prompt: 'C5-BOOK-Q1', pageSize: 3, options: [opt('az', 'C5-BOOK-AZ', true), opt('yo', 'C5-BOOK-YO', false, 'C5-6-04'), opt('ko', 'C5-BOOK-KO', false, 'C5-6-04')] },
          { id: 'k1', prompt: 'C5-BOOK-Q3', pageSize: 3, options: [opt('ko', 'C5-BOOK-KO', true), opt('kon', 'C5-BOOK-KON', false, 'C5-6-04'), opt('kot', 'C5-BOOK-KOT', false, 'C5-6-04')] },
          { id: 'k2', prompt: 'C5-BOOK-Q2', pageSize: 3, options: [opt('kon', 'C5-BOOK-KON', true), opt('kot', 'C5-BOOK-KOT', false, 'C5-6-04'), opt('ku', 'C5-BOOK-KU', false, 'C5-6-04')] },
          { id: 'last', prompt: 'C5-BOOK-Q4', pageSize: 3, options: [opt('te', 'C5-BOOK-TE', false, 'C5-6-04'), opt('ts', 'C5-BOOK-TS', true), opt('re', 'C5-BOOK-RE', false, 'C5-6-04')] },
        ] },
    },
    {
      id: 'c5l3-timeline', skill: 'timeline',
      config: { kind: 'timeline', items: [
        { id: 't21', time: '21:00', label: 'C5-L2-TIME-21' },
        { id: 't22', time: '22:00', label: 'C5-L2-TIME-22' },
        { id: 't23', time: '23:00', label: 'C5-L3-TIME-23' },
        { id: 't03', time: '03:00', label: 'C5-L2-TIME-03' },
        { id: 't06', time: '06:00', label: 'C5-L2-TIME-06' },
      ], solution: ['t21', 't22', 't23', 't03', 't06'], wrong: ['C5-TIME-WRONG'] },
    },
    {
      id: 'c5l3-rules', skill: 'night-rules',
      config: { kind: 'staged', mechanic: 'night-rules', description: 'Выбор четырёх добрых правил из семи.', lines: ['C5-L3-9-01'],
        steps: [
          { id: 'r1', prompt: 'C5-RULE-Q1', pageSize: 3, options: [opt('whisper', 'C5-RULE-B01', true), opt('loud', 'C5-RULE-B04', false, 'C5-9-03'), opt('ask', 'C5-RULE-B05', false, 'C5-9-04')] },
          { id: 'r2', prompt: 'C5-RULE-Q2', pageSize: 3, options: [opt('books', 'C5-RULE-B02', true), opt('warn', 'C5-RULE-B06', true), opt('come', 'C5-RULE-B08', false, 'C5-L2-8-01')] },
          { id: 'r3', prompt: 'C5-RULE-Q3', pageSize: 3, options: [opt('lantern', 'C5-RULE-B03', true), opt('found', 'C5-RULE-B07', true, 'C5-L3-9-01'), opt('ask', 'C5-RULE-B05', false, 'C5-9-04')] },
          { id: 'r4', prompt: 'C5-RULE-Q4', pageSize: 3, options: [opt('found', 'C5-RULE-B07', true, 'C5-L3-9-01'), opt('books', 'C5-RULE-B02', true), opt('loud', 'C5-RULE-B04', false, 'C5-9-03')] },
        ] },
    },
  ],
  facts,
  glossary,
  rewards: ['rw-c5-badge', 'rw-c5-buttons-l3', 'rw-c5-sticker-l3', 'rw-c5-decor-shelf', 'rw-c5-activity', 'rw-c5-heart-rules', 'rw-c5-secret-note'],
  collections: commonCollections,
  activities: [activity],
  comfort,
  cutscenes: [], plannedCutscenes: retarget(commonCutscenes, { "C5-8": "C5-L3-8", "C5-9": "C5-L3-9" }),
  reserved: [],
  decisions: [...commonDecisions, { id: 'C5L3-D1', text: 'Тапочек мэра сохранён как ложный след: он исключается следами и записями, а мышата возвращают его в финале.', ref: 'D04, Q17' }],
};
