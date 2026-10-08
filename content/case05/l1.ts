import { all, dir, goto, has, L, menu, minigame, not, opt as mopt, reveal, scene, seq, skill, when, type VariantSource } from '../../tools/content/dsl.ts';
import { and, cl, comfort, commonCollections, commonCutscenes, commonDecisions, eq, facts, factsScene, finale, glossary, intended, intro0, ne, opt, rewardScene, rulesScene, secretNote, what, where, who, activity } from './common.ts';

const HUB = 'C5-HUB';

export const level1: VariantSource = {
  pack: 'case05-l1',
  kind: 'case',
  title: 'C5-TITLE',
  case: { number: 5, level: 1 },
  start: 'C5-0',
  scenes: [
    scene({ id: 'C5-0', title: 'Контора: сонный мэр', location: 'office', cast: ['pudding', 'khvosts'], presentation: 'dialogue', steps: [...intro0(), goto('C5-1')] }),
    scene({
      id: 'C5-1', title: 'Вход в библиотеку', location: 'library-entrance', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'dialogue',
      steps: [
        dir('C5-1-D01', 'Вечер. Пудинг отпирает тяжёлую дверь библиотеки.'),
        ...seq('C5-1-', 1, 7),
        skill('notebook', [dir('C5-1-D02', 'Блокнот раскрывается: три колонки, по три строки.')]),
        skill('klubki', [L('C5-TUT-KLUBKI-01'), L('C5-TUT-KLUBKI-02')]),
        goto('C5-2'),
      ],
    }),
    scene({ id: 'C5-2', title: 'Холл: полка и Тайная заметка', location: 'library-hall', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'cutscene', steps: secretNote(HUB) }),
    scene({
      id: HUB, title: 'Библиотека: выбор', location: 'library-hall', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'hub',
      steps: [
        when(all(has.clue('c5-search'), has.clue('c5-sound'), has.clue('c5-shelf'), not(has.visited('C5-7'))), [goto('C5-7')]),
        menu('C5-M', null, [
          mopt('search', 'C5-2-B01', 'C5-3', { hideWhen: has.visited('C5-3') }),
          mopt('sound', 'C5-2-B02', 'C5-4', { hideWhen: has.visited('C5-4') }),
          mopt('fitilyok', 'C5-2-B03', 'C5-5', { hideWhen: has.visited('C5-5'), optional: true }),
          mopt('shelf', 'C5-6-B01', 'C5-6', { when: has.clue('c5-search'), hideWhen: has.visited('C5-6') }),
        ]),
      ],
    }),
    scene({
      id: 'C5-3', title: 'Читальный зал: «Лупа»', location: 'reading-room', cast: ['khvosts', 'watsony'], presentation: 'minigame',
      steps: [
        skill('magnifier', [L('C5-3-01')]),
        minigame('c5l1-search'),
        ...seq('C5-3-', 5, 8),
        reveal('c5-search'),
        goto(HUB),
      ],
    }),
    scene({
      id: 'C5-4', title: '«Услышь разницу»', location: 'reading-room', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'minigame',
      steps: [
        L('C5-4-01'), skill('sound-waves', [L('C5-4-02'), L('C5-SOUND-VIS')]),
        minigame('c5l1-sound'),
        ...seq('C5-4-', 6, 9),
        reveal('c5-sound'),
        goto(HUB),
      ],
    }),
    scene({ id: 'C5-5', title: 'Фитилёк', location: 'library-window', cast: ['fitilyok', 'watsony'], presentation: 'dialogue', steps: [...seq('C5-5-', 1, 3), goto(HUB)] }),
    scene({
      id: 'C5-6', title: '«Тихая полка»', location: 'reading-room', cast: ['khvosts', 'watsony'], presentation: 'minigame',
      steps: [
        skill('quiet-shelf', seq('C5-6-', 1, 3)),
        minigame('c5l1-shelf'),
        ...seq('C5-6-', 5, 9),
        reveal('c5-shelf'),
        goto(HUB),
      ],
    }),
    scene({ id: 'C5-7', title: 'Версия', location: 'reading-room', cast: ['khvosts', 'watsony'], presentation: 'dialogue', steps: [...seq('C5-7-', 1, 2), goto(HUB)] }),
    finale('C5-8', 'C5-9'),
    rulesScene('C5-9', 'c5l1-rules', 1),
    factsScene('C5-11'),
    rewardScene(1),
  ],
  logic: {
    axes: [
      { id: 'who', title: 'C5-AX-who', values: [who.mice, who.fitilyok, who.kartofan] },
      { id: 'where', title: 'C5-AX-where', values: [where.reading, where.basement, where.attic] },
      { id: 'what', title: 'C5-AX-what', values: [what.nightReading, what.moleTunnel, what.oldFloor] },
    ],
    intended,
    clues: [
      { id: 'c5-search', title: 'C5-CL-search', required: true, predicate: and(eq('where', 'reading'), ne('who', 'fitilyok')), requires: [], source: 'C5-3', summary: 'Подушечки, подаренный фонарик и следы без пыльцы находятся за дальним стеллажом.' },
      { id: 'c5-sound', title: 'C5-CL-sound', required: true, predicate: and(ne('who', 'kartofan'), ne('what', 'mole-tunnel'), ne('what', 'old-floor')), requires: [], source: 'C5-4', summary: 'На записи слышны быстрые шажки и писк; рытья и долгого скрипа доски нет.' },
      { id: 'c5-shelf', title: 'C5-CL-shelf', required: true, predicate: and(eq('who', 'mice'), eq('what', 'night-reading')), requires: ['c5-search'], source: 'C5-6', summary: 'Журнал Ночной читальни подписан мышиными лапками.' },
    ],
    version: { button: 'UI-hud.version', available: has.visited('C5-7'), onSolved: 'C5-8' },
    wrongVersion: {
      intro: [cl('C5-7-03')],
      byValue: [
        { axis: 'who', value: 'fitilyok', clues: ['c5-search'], lines: [cl('C5-7-04')] },
        { axis: 'who', value: 'kartofan', clues: ['c5-sound'], lines: [cl('C5-7-05')] },
        { axis: 'where', value: 'basement', clues: ['c5-search'], lines: [cl('C5-7-06')] },
        { axis: 'where', value: 'attic', clues: ['c5-search'], lines: [cl('C5-7-06')] },
        { axis: 'what', value: 'mole-tunnel', clues: ['c5-sound'], lines: [cl('C5-7-05')] },
        { axis: 'what', value: 'old-floor', clues: ['c5-sound'], lines: [cl('C5-7-07')] },
      ],
      outro: [cl('C5-7-08')],
    },
    redHerrings: [
      { id: 'rh-c5-fitilyok', summary: 'Фонарик Фитилька похож на след светлячка; это подарок мышатам.', presentedBy: ['C5-1-01', 'C5-3-03', 'C5-5-02'], explainedBy: ['C5-8-12'] },
      { id: 'rh-c5-kartofan', summary: 'Мэр предполагает кротовый ход; рытья нет.', presentedBy: ['C5-1-02'], explainedBy: ['C5-8-13'] },
      { id: 'rh-c5-old-floor', summary: 'Старый пол мог бы скрипеть сам, но звук похож на шажки.', presentedBy: ['C5-1-03'], explainedBy: ['C5-8-14'] },
    ],
  },
  notebookHelp: {
    mode: 'suggest',
    marks: [
      { axis: 'who', value: 'mice', mark: 'confirmed', clues: ['c5-shelf'], line: 'C5-NB-who-mice' },
      { axis: 'who', value: 'fitilyok', mark: 'excluded', clues: ['c5-search'], line: 'C5-NB-who-fitilyok' },
      { axis: 'who', value: 'kartofan', mark: 'excluded', clues: ['c5-sound'], line: 'C5-NB-who-kartofan' },
      { axis: 'where', value: 'reading', mark: 'confirmed', clues: ['c5-search'], line: 'C5-NB-where-reading' },
      { axis: 'where', value: 'basement', mark: 'excluded', clues: ['c5-search'], line: 'C5-NB-where-basement' },
      { axis: 'where', value: 'attic', mark: 'excluded', clues: ['c5-search'], line: 'C5-NB-where-attic' },
      { axis: 'what', value: 'night-reading', mark: 'confirmed', clues: ['c5-shelf'], line: 'C5-NB-what-reading' },
      { axis: 'what', value: 'mole-tunnel', mark: 'excluded', clues: ['c5-sound'], line: 'C5-NB-what-mole' },
      { axis: 'what', value: 'old-floor', mark: 'excluded', clues: ['c5-sound'], line: 'C5-NB-what-floor' },
    ],
    pointers: [],
    nothing: 'UI-notebook.nothing',
  },
  hints: {
    klubok: {
      speaker: 'khvosts', precision: 'exact', allowance: 3,
      rules: [
        { id: 'C5-H-01', when: not(has.clue('c5-search')), cites: [] },
        { id: 'C5-H-02', when: all(has.clue('c5-search'), not(has.clue('c5-sound'))), cites: ['c5-search'] },
        { id: 'C5-H-03', when: all(has.clue('c5-search'), not(has.clue('c5-shelf'))), cites: ['c5-search'] },
        { id: 'C5-H-06', when: has.visited('C5-7'), cites: ['c5-search', 'c5-sound', 'c5-shelf'] },
      ],
      review: 'C5-H-04',
      exhausted: 'UI-hint.klubokEmptyShell',
    },
    shell: {
      speaker: 'watsony', precision: 'exact', allowance: null,
      rules: [
        { id: 'C5-R-01', when: not(has.clue('c5-search')), cites: [] },
        { id: 'C5-R-02', when: all(has.clue('c5-search'), not(has.clue('c5-sound'))), cites: ['c5-search'] },
        { id: 'C5-R-03', when: all(has.clue('c5-search'), not(has.clue('c5-shelf'))), cites: ['c5-search'] },
        { id: 'C5-R-04', when: has.visited('C5-7'), cites: ['c5-search', 'c5-sound', 'c5-shelf'] },
      ],
      review: 'C5-R-04',
      exhausted: null,
    },
  },
  minigames: [
    {
      id: 'c5l1-search', skill: 'magnifier',
      config: { kind: 'magnifier', targets: [
        { id: 'thimbles', label: 'C5-3-B01', required: true, reply: ['C5-3-02'] },
        { id: 'lantern', label: 'C5-3-B02', required: true, reply: ['C5-3-03'] },
        { id: 'tiny-tracks', label: 'C5-3-B03', required: true, reply: ['C5-3-04'] },
      ], afterFirst: [], afterFirstSkill: null, assistAfterMisses: 3 },
    },
    {
      id: 'c5l1-sound', skill: 'sound-waves',
      config: { kind: 'staged', mechanic: 'sound-waves', description: 'Беззвучное сравнение волн: длинный/короткий, высокий/низкий, частый/редкий.', lines: ['C5-4-04'],
        steps: [
          { id: 'steps', prompt: 'C5-SOUND-Q1', pageSize: 3, options: [opt('steps', 'C5-SOUND-B01', true, 'C5-4-03'), opt('dig', 'C5-SOUND-B02', false, 'C5-4-04'), opt('board', 'C5-SOUND-B03', false, 'C5-4-04')] },
          { id: 'squeak', prompt: 'C5-SOUND-Q2', pageSize: 3, options: [opt('squeak', 'C5-SOUND-B04', true, 'C5-4-05'), opt('wind', 'C5-SOUND-B05', false, 'C5-4-04'), opt('spoon', 'C5-SOUND-B06', false, 'C5-4-04')] },
        ] },
    },
    {
      id: 'c5l1-shelf', skill: 'quiet-shelf',
      config: { kind: 'staged', mechanic: 'quiet-shelf', description: 'Выбор следующей книги по алфавиту, не больше трёх карточек на шаг.', lines: ['C5-6-04'],
        steps: [
          { id: 'first', prompt: 'C5-BOOK-Q1', pageSize: 3, options: [opt('az', 'C5-BOOK-AZ', true), opt('yo', 'C5-BOOK-YO', false, 'C5-6-04'), opt('ko', 'C5-BOOK-KO', false, 'C5-6-04')] },
          { id: 'second', prompt: 'C5-BOOK-Q2', pageSize: 3, options: [opt('yo', 'C5-BOOK-YO', true), opt('re', 'C5-BOOK-RE', false, 'C5-6-04'), opt('te', 'C5-BOOK-TE', false, 'C5-6-04')] },
          { id: 'last', prompt: 'C5-BOOK-Q4', pageSize: 3, options: [opt('ko', 'C5-BOOK-KO', false, 'C5-6-04'), opt('re', 'C5-BOOK-RE', false, 'C5-6-04'), opt('te', 'C5-BOOK-TE', true)] },
        ] },
    },
    {
      id: 'c5l1-rules', skill: 'night-rules',
      config: { kind: 'staged', mechanic: 'night-rules', description: 'Выбор добрых правил Ночной библиотеки.', lines: [],
        steps: [
          { id: 'r1', prompt: 'C5-RULE-Q1', pageSize: 3, options: [opt('whisper', 'C5-RULE-B01', true), opt('loud', 'C5-RULE-B04', false, 'C5-9-03'), opt('ask', 'C5-RULE-B05', false, 'C5-9-04')] },
          { id: 'r2', prompt: 'C5-RULE-Q2', pageSize: 3, options: [opt('books', 'C5-RULE-B02', true), opt('lantern', 'C5-RULE-B03', true), opt('loud', 'C5-RULE-B04', false, 'C5-9-03')] },
          { id: 'r3', prompt: 'C5-RULE-Q3', pageSize: 3, options: [opt('lantern', 'C5-RULE-B03', true), opt('whisper', 'C5-RULE-B01', true), opt('ask', 'C5-RULE-B05', false, 'C5-9-04')] },
        ] },
    },
  ],
  facts,
  glossary,
  rewards: ['rw-c5-badge', 'rw-c5-buttons-l1', 'rw-c5-sticker-l1', 'rw-c5-decor-shelf', 'rw-c5-activity', 'rw-c5-heart-rules', 'rw-c5-secret-note'],
  collections: commonCollections,
  activities: [activity],
  comfort,
  cutscenes: [], plannedCutscenes: commonCutscenes,
  reserved: [],
  decisions: [
    ...commonDecisions,
    { id: 'C5L1-D1', text: 'Фитилёк оставлен необязательной сценой; его ложный след всё равно объясняется в финале, если был предъявлен.', ref: 'Q16, Q17' },
  ],
};
