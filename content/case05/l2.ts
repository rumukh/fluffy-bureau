import { all, dir, goto, has, L, menu, minigame, not, opt as mopt, reveal, scene, seq, skill, when, type VariantSource, retarget } from '../../tools/content/dsl.ts';
import { activity, and, cl, comfort, commonCollections, commonCutscenes, commonDecisions, eq, facts, factsScene, finale, glossary, intended, intro0, ne, opt, rewardScene, rulesScene, secretNote, what, where, who } from './common.ts';

const HUB = 'C5-L2-HUB';

export const level2: VariantSource = {
  pack: 'case05-l2',
  kind: 'case',
  title: 'C5-TITLE',
  case: { number: 5, level: 2 },
  start: 'C5-L2-1',
  scenes: [
    scene({
      id: 'C5-L2-1', title: 'Завязка', location: 'library-entrance', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'dialogue',
      steps: [
        ...intro0(), dir('C5-L2-1-D01', 'Вечер. Пудинг отпирает дверь библиотеки.'),
        ...seq('C5-1-', 1, 3), ...seq('C5-L2-1-', 1, 4), L('C5-1-05'), L('C5-1-07'),
        skill('notebook', [dir('C5-L2-1-D02', 'Блокнот раскрывается: три колонки, по четыре строки.')]),
        skill('klubki', [L('C5-TUT-KLUBKI-01'), L('C5-TUT-KLUBKI-02')]),
        goto('C5-2'),
      ],
    }),
    scene({ id: 'C5-2', title: 'Холл: полка и Тайная заметка', location: 'library-hall', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'cutscene', steps: secretNote(HUB) }),
    scene({
      id: HUB, title: 'Библиотека: выбор', location: 'library-hall', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'hub',
      steps: [
        when(all(has.clue('c5-l2-search'), has.clue('c5-l2-sound'), has.clue('c5-l2-timeline'), has.clue('c5-l2-shelf'), not(has.visited('C5-L2-6'))), [goto('C5-L2-6')]),
        menu('C5-L2-M', null, [
          mopt('search', 'C5-2-B01', 'C5-L2-2', { hideWhen: has.visited('C5-L2-2') }),
          mopt('sound', 'C5-2-B02', 'C5-L2-3', { hideWhen: has.visited('C5-L2-3') }),
          mopt('fitilyok', 'C5-2-B03', 'C5-5', { hideWhen: has.visited('C5-5'), optional: true }),
          mopt('timeline', 'C5-L2-3-B01', 'C5-L2-4', { when: has.clue('c5-l2-sound'), hideWhen: has.visited('C5-L2-4') }),
          mopt('shelf', 'C5-6-B01', 'C5-L2-5', { when: has.clue('c5-l2-search'), hideWhen: has.visited('C5-L2-5') }),
        ]),
      ],
    }),
    scene({
      id: 'C5-L2-2', title: '«Лупа»', location: 'reading-room', cast: ['khvosts', 'watsony'], presentation: 'minigame',
      steps: [skill('magnifier', [L('C5-L2-2-01')]), minigame('c5l2-search'), ...seq('C5-3-', 5, 8), reveal('c5-l2-search'), goto(HUB)],
    }),
    scene({
      id: 'C5-L2-3', title: '«Услышь разницу»', location: 'reading-room', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'minigame',
      steps: [
        L('C5-4-01'), skill('sound-waves', [L('C5-4-02'), L('C5-SOUND-VIS')]),
        minigame('c5l2-sound'),
        ...seq('C5-4-', 6, 8), L('C5-L2-3-02'), L('C5-4-09'), reveal('c5-l2-sound'), L('C5-L2-3-03'), goto(HUB),
      ],
    }),
    scene({
      id: 'C5-L2-4', title: '«Лента времени»: записи мэра', location: 'reading-room', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'minigame',
      steps: [
        skill('timeline', [L('C5-L2-4-01'), L('C5-L2-4-02')], [L('C5-L2-4-03')]),
        L('C5-L2-4-04'),
        minigame('c5l2-timeline'),
        ...seq('C5-L2-4-', 5, 9),
        reveal('c5-l2-timeline'),
        goto(HUB),
      ],
    }),
    scene({
      id: 'C5-L2-5', title: '«Тихая полка»', location: 'reading-room', cast: ['khvosts', 'watsony'], presentation: 'minigame',
      steps: [skill('quiet-shelf', seq('C5-6-', 1, 3)), L('C5-L2-5-02'), minigame('c5l2-shelf'), ...seq('C5-6-', 5, 9), reveal('c5-l2-shelf'), goto(HUB)],
    }),
    scene({ id: 'C5-5', title: 'Фитилёк', location: 'library-window', cast: ['fitilyok', 'watsony'], presentation: 'dialogue', steps: [...seq('C5-5-', 1, 3), goto(HUB)] }),
    scene({ id: 'C5-L2-6', title: 'Версия', location: 'reading-room', cast: ['khvosts', 'watsony'], presentation: 'dialogue', steps: [...seq('C5-7-', 1, 2), goto(HUB)] }),
    finale('C5-L2-7', 'C5-L2-8', [L('C5-L2-7-01'), L('C5-L2-7-02'), L('C5-L2-7-03')]),
    rulesScene('C5-L2-8', 'c5l2-rules', 2),
    factsScene('C5-11'),
    rewardScene(2),
  ],
  logic: {
    axes: [
      { id: 'who', title: 'C5-AX-who', values: [who.mice, who.fitilyok, who.kartofan, who.stella] },
      { id: 'where', title: 'C5-AX-where', values: [where.reading, where.basement, where.attic, where.storage] },
      { id: 'what', title: 'C5-AX-what', values: [what.nightReading, what.moleTunnel, what.oldFloor, what.draft] },
    ],
    intended,
    clues: [
      { id: 'c5-l2-search', title: 'C5-CL-search', required: true, predicate: and(eq('where', 'reading'), ne('where', 'storage'), ne('who', 'fitilyok')), requires: [], source: 'C5-L2-2', summary: 'Находки в зале; паутинка хранилища целая; пыльцы нет.' },
      { id: 'c5-l2-sound', title: 'C5-CL-sound', required: true, predicate: and(ne('who', 'kartofan'), ne('what', 'mole-tunnel'), ne('what', 'old-floor'), ne('what', 'draft')), requires: [], source: 'C5-L2-3', summary: 'Слышны шажки и писк; нет рытья, старой доски и качания двери.' },
      { id: 'c5-l2-timeline', title: 'C5-CL-timeline', required: true, predicate: and(ne('who', 'stella'), ne('what', 'draft')), requires: ['c5-l2-sound'], source: 'C5-L2-4', summary: 'Скрип ночью; Стелла утром; форточку закрыли до скрипа.' },
      { id: 'c5-l2-shelf', title: 'C5-CL-shelf', required: true, predicate: and(eq('who', 'mice'), eq('what', 'night-reading')), requires: ['c5-l2-search'], source: 'C5-L2-5', summary: 'Журнал Ночной читальни с мышиными лапками.' },
    ],
    version: { button: 'UI-hud.version', available: has.visited('C5-L2-6'), onSolved: 'C5-L2-7' },
    wrongVersion: {
      intro: [cl('C5-7-03')],
      byValue: [
        { axis: 'who', value: 'fitilyok', clues: ['c5-l2-search'], lines: [cl('C5-7-04')] },
        { axis: 'who', value: 'kartofan', clues: ['c5-l2-sound'], lines: [cl('C5-7-05')] },
        { axis: 'who', value: 'stella', clues: ['c5-l2-timeline'], lines: [cl('C5-L2-6-01')] },
        { axis: 'where', value: 'basement', clues: ['c5-l2-search'], lines: [cl('C5-7-06')] },
        { axis: 'where', value: 'attic', clues: ['c5-l2-search'], lines: [cl('C5-7-06')] },
        { axis: 'where', value: 'storage', clues: ['c5-l2-search'], lines: [cl('C5-L2-6-02')] },
        { axis: 'what', value: 'mole-tunnel', clues: ['c5-l2-sound'], lines: [cl('C5-7-05')] },
        { axis: 'what', value: 'old-floor', clues: ['c5-l2-sound'], lines: [cl('C5-7-07')] },
        { axis: 'what', value: 'draft', clues: ['c5-l2-sound'], lines: [cl('C5-L2-6-03')] },
      ],
      outro: [cl('C5-7-08')],
    },
    redHerrings: [
      { id: 'rh-c5-fitilyok', summary: 'Фонарик Фитилька — подарок мышатам.', presentedBy: ['C5-1-01', 'C5-3-03', 'C5-5-02'], explainedBy: ['C5-8-12'] },
      { id: 'rh-c5-kartofan', summary: 'Кротового рытья не было.', presentedBy: ['C5-1-02'], explainedBy: ['C5-8-13'] },
      { id: 'rh-c5-old-floor', summary: 'Скрипели шажки, а не старая доска.', presentedBy: ['C5-1-03'], explainedBy: ['C5-8-14'] },
      { id: 'rh-c5-stella', summary: 'Газеты Стеллы утренние.', presentedBy: ['C5-L2-1-01'], explainedBy: ['C5-L2-7-01'] },
      { id: 'rh-c5-storage-draft', summary: 'Дверь хранилища и сквозняк не объясняют скрип.', presentedBy: ['C5-L2-1-02'], explainedBy: ['C5-L2-7-02'] },
    ],
  },
  notebookHelp: {
    mode: 'suggest',
    marks: [
      { axis: 'who', value: 'mice', mark: 'confirmed', clues: ['c5-l2-shelf'], line: 'C5-NB-who-mice' },
      { axis: 'who', value: 'fitilyok', mark: 'excluded', clues: ['c5-l2-search'], line: 'C5-NB-who-fitilyok' },
      { axis: 'who', value: 'kartofan', mark: 'excluded', clues: ['c5-l2-sound'], line: 'C5-NB-who-kartofan' },
      { axis: 'who', value: 'stella', mark: 'excluded', clues: ['c5-l2-timeline'], line: 'C5-NB-who-stella' },
      { axis: 'where', value: 'reading', mark: 'confirmed', clues: ['c5-l2-search'], line: 'C5-NB-where-reading' },
      { axis: 'where', value: 'basement', mark: 'excluded', clues: ['c5-l2-search'], line: 'C5-NB-where-basement' },
      { axis: 'where', value: 'attic', mark: 'excluded', clues: ['c5-l2-search'], line: 'C5-NB-where-attic' },
      { axis: 'where', value: 'storage', mark: 'excluded', clues: ['c5-l2-search'], line: 'C5-NB-where-storage' },
      { axis: 'what', value: 'night-reading', mark: 'confirmed', clues: ['c5-l2-shelf'], line: 'C5-NB-what-reading' },
      { axis: 'what', value: 'mole-tunnel', mark: 'excluded', clues: ['c5-l2-sound'], line: 'C5-NB-what-mole' },
      { axis: 'what', value: 'old-floor', mark: 'excluded', clues: ['c5-l2-sound'], line: 'C5-NB-what-floor' },
      { axis: 'what', value: 'draft', mark: 'excluded', clues: ['c5-l2-timeline'], line: 'C5-NB-what-draft' },
    ],
    pointers: [],
    nothing: 'UI-notebook.nothing',
  },
  hints: {
    klubok: {
      speaker: 'khvosts', precision: 'exact', allowance: 3,
      rules: [
        { id: 'C5-L2-H-01', when: not(has.clue('c5-l2-search')), cites: [] },
        { id: 'C5-L2-H-02', when: all(has.clue('c5-l2-search'), not(has.clue('c5-l2-sound'))), cites: ['c5-l2-search'] },
        { id: 'C5-L2-H-03', when: all(has.clue('c5-l2-sound'), not(has.clue('c5-l2-timeline'))), cites: ['c5-l2-sound'] },
        { id: 'C5-L2-H-04', when: all(has.clue('c5-l2-search'), not(has.clue('c5-l2-shelf'))), cites: ['c5-l2-search'] },
        { id: 'C5-L2-H-05', when: has.visited('C5-L2-6'), cites: ['c5-l2-search', 'c5-l2-sound', 'c5-l2-timeline', 'c5-l2-shelf'] },
      ],
      review: 'C5-L2-H-05',
      exhausted: 'UI-hint.klubokEmptyShell',
    },
    shell: {
      speaker: 'watsony', precision: 'vague', allowance: null,
      rules: [
        { id: 'C5-L2-R-01', when: all(has.clue('c5-l2-search'), not(has.clue('c5-l2-shelf'))), cites: ['c5-l2-search'] },
        { id: 'C5-L2-R-02', when: all(has.clue('c5-l2-search'), not(has.clue('c5-l2-sound'))), cites: ['c5-l2-search'] },
        { id: 'C5-L2-R-03', when: all(has.clue('c5-l2-sound'), not(has.clue('c5-l2-timeline'))), cites: ['c5-l2-sound'] },
      ],
      review: 'C5-L2-R-03',
      exhausted: null,
    },
  },
  minigames: [
    {
      id: 'c5l2-search', skill: 'magnifier',
      config: { kind: 'magnifier', targets: [
        { id: 'thimbles', label: 'C5-3-B01', required: true, reply: ['C5-3-02'] },
        { id: 'lantern', label: 'C5-3-B02', required: true, reply: ['C5-3-03'] },
        { id: 'tiny-tracks', label: 'C5-3-B03', required: true, reply: ['C5-3-04'] },
        { id: 'web', label: 'C5-L2-2-B01', required: true, reply: ['C5-L2-2-02', 'C5-L2-2-03'] },
      ], afterFirst: [], afterFirstSkill: null, assistAfterMisses: 3 },
    },
    {
      id: 'c5l2-sound', skill: 'sound-waves',
      config: { kind: 'staged', mechanic: 'sound-waves', description: 'Три раунда визуального сравнения звуковых волн.', lines: ['C5-4-04'],
        steps: [
          { id: 'steps', prompt: 'C5-SOUND-Q1', pageSize: 3, options: [opt('steps', 'C5-SOUND-B01', true, 'C5-4-03'), opt('dig', 'C5-SOUND-B02', false, 'C5-4-04'), opt('board', 'C5-SOUND-B03', false, 'C5-4-04')] },
          { id: 'squeak', prompt: 'C5-SOUND-Q2', pageSize: 3, options: [opt('squeak', 'C5-SOUND-B04', true, 'C5-4-05'), opt('wind', 'C5-SOUND-B05', false, 'C5-4-04'), opt('spoon', 'C5-SOUND-B06', false, 'C5-4-04')] },
          { id: 'door', prompt: 'C5-SOUND-Q3', pageSize: 3, options: [opt('door', 'C5-SOUND-B07', false, 'C5-4-04'), opt('steps', 'C5-SOUND-B01', true, 'C5-L2-3-01'), opt('branch', 'C5-SOUND-B08', false, 'C5-4-04')] },
        ] },
    },
    {
      id: 'c5l2-timeline', skill: 'timeline',
      config: { kind: 'timeline', items: [
        { id: 't21', time: '21:00', label: 'C5-L2-TIME-21' },
        { id: 't22', time: '22:00', label: 'C5-L2-TIME-22' },
        { id: 't03', time: '03:00', label: 'C5-L2-TIME-03' },
        { id: 't06', time: '06:00', label: 'C5-L2-TIME-06' },
      ], solution: ['t21', 't22', 't03', 't06'], wrong: ['C5-TIME-WRONG'] },
    },
    {
      id: 'c5l2-shelf', skill: 'quiet-shelf',
      config: { kind: 'staged', mechanic: 'quiet-shelf', description: 'Семь книг, сравнение второй буквы для двух книг на К.', lines: ['C5-6-04'],
        steps: [
          { id: 'first', prompt: 'C5-BOOK-Q1', pageSize: 3, options: [opt('az', 'C5-BOOK-AZ', true), opt('yo', 'C5-BOOK-YO', false, 'C5-6-04'), opt('ko', 'C5-BOOK-KO', false, 'C5-6-04')] },
          { id: 'k-order', prompt: 'C5-BOOK-Q3', pageSize: 3, options: [opt('ko', 'C5-BOOK-KO', true), opt('ku', 'C5-BOOK-KU', false, 'C5-6-04'), opt('re', 'C5-BOOK-RE', false, 'C5-6-04')] },
          { id: 'last', prompt: 'C5-BOOK-Q4', pageSize: 3, options: [opt('te', 'C5-BOOK-TE', false, 'C5-6-04'), opt('ts', 'C5-BOOK-TS', true), opt('re', 'C5-BOOK-RE', false, 'C5-6-04')] },
        ] },
    },
    {
      id: 'c5l2-rules', skill: 'night-rules',
      config: { kind: 'staged', mechanic: 'night-rules', description: 'Выбор трёх добрых правил из шести.', lines: [],
        steps: [
          { id: 'r1', prompt: 'C5-RULE-Q1', pageSize: 3, options: [opt('whisper', 'C5-RULE-B01', true), opt('loud', 'C5-RULE-B04', false, 'C5-9-03'), opt('ask', 'C5-RULE-B05', false, 'C5-9-04')] },
          { id: 'r2', prompt: 'C5-RULE-Q2', pageSize: 3, options: [opt('books', 'C5-RULE-B02', true), opt('warn', 'C5-RULE-B06', true), opt('come', 'C5-RULE-B06', false, 'C5-L2-8-01')] },
          { id: 'r3', prompt: 'C5-RULE-Q3', pageSize: 3, options: [opt('lantern', 'C5-RULE-B03', true), opt('whisper', 'C5-RULE-B01', true), opt('ask', 'C5-RULE-B05', false, 'C5-9-04')] },
        ] },
    },
  ],
  facts,
  glossary,
  rewards: ['rw-c5-badge', 'rw-c5-buttons-l2', 'rw-c5-sticker-l2', 'rw-c5-decor-shelf', 'rw-c5-activity', 'rw-c5-heart-rules', 'rw-c5-secret-note'],
  collections: commonCollections,
  activities: [activity],
  comfort,
  cutscenes: [], plannedCutscenes: retarget(commonCutscenes, { "C5-8": "C5-L2-7", "C5-9": "C5-L2-8" }),
  reserved: [],
  decisions: [...commonDecisions, { id: 'C5L2-D1', text: 'Добросовестная ошибка мэра про полночь оставлена в сцене ленты времени, но не нужна для единственного решения.', ref: 'D04, Q17' }],
};
