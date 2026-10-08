import type { VariantSource } from '../../tools/content/dsl.ts';
import {
  act, activity, and, baseRewards, cl, collections, commonComfort, eq, facts, factsScene, fitilyokScene, finalLightScene, glossary,
  goto, has, HUB, intended, introOffice, L, lightGame, menu, minigame, mopt, ne, not, opt, redHerringsBase, reveal, rewardScene,
  sceneProps, secretNote, secretNotesPage, seq, skill, soundGame, versionScene, where, what, who, dir, cutscene,
} from './common.ts';
import { intro, note, reveal as revealCutscene, reward as rewardCutscene } from './cutscenes.ts';

const anyWhat = { op: 'in' as const, axis: 'what', values: ['training', 'broken', 'ghost'] };

export const level1: VariantSource = {
  pack: 'case03-l1',
  kind: 'case',
  title: 'C3-TITLE',
  case: { number: 3, level: 1 },
  start: 'C3-0',
  scenes: [
    { id: 'C3-0', title: 'Контора: вечерний гость', location: 'office-evening', cast: ['khvosts', 'watsony', 'mouse'], presentation: 'cutscene', props: sceneProps.map, steps: [cutscene('c3.intro.l1'), ...introOffice(), goto('C3-1')] },
    {
      id: 'C3-1', title: 'Берег Медового пруда', location: 'honey-pond', cast: ['pudding', 'damka', 'khvosts', 'watsony'], presentation: 'dialogue',
      steps: [
        dir('C3-1-D01', 'Сумерки с тёплыми фонарями; наверху маяка мигает огонёк.', null, [
          act.effect('glow', 1680, 520, 1.5),
          act.pose('pudding', { expression: 'worried', clip: 'look-around' }),
          act.pose('damka', { expression: 'worried', face: 'left' }),
        ]),
        ...seq('C3-1-', 1, 5),
        skill('lamp', [L('C3-1-06')]),
        skill('notebook', seq('C3-1-', 7, 10)),
        goto(HUB),
      ],
    },
    {
      id: HUB, title: 'Медовый пруд: выбор', location: 'honey-pond', cast: ['khvosts', 'watsony', 'pudding', 'damka'], presentation: 'hub',
      steps: [
        { t: 'if', when: { all: [has.clue('c3-sounds'), has.clue('c3-room'), has.clue('c3-tracks'), not(has.visited('C3-7'))] }, then: [goto('C3-7')], else: [] },
        menu('C3-M', null, [
          mopt('sounds', 'C3-1-B01', 'C3-2', { hideWhen: has.clue('c3-sounds') }),
          mopt('door', 'C3-1-B02', 'C3-3', { hideWhen: has.visited('C3-3') }),
          mopt('fitilyok', 'C3-1-B03', 'C3-4', { hideWhen: { any: [has.visited('C3-4'), has.visited('C3-3')] }, optional: true }),
          mopt('room', 'C3-1-B04', 'C3-5', { when: has.visited('C3-3'), hideWhen: has.clue('c3-room') }),
          mopt('tracks', 'C3-1-B05', 'C3-6', { when: has.visited('C3-3'), hideWhen: has.clue('c3-tracks') }),
        ]),
      ],
    },
    {
      id: 'C3-2', title: 'Услышь разницу', location: 'pond-bank', cast: ['khvosts', 'watsony', 'mouse'], presentation: 'minigame',
      steps: [
        skill('sound-diff', [L('C3-2-01'), L('C3-2-02')]),
        minigame('c3l1-sound'),
        ...seq('C3-2-', 6, 9),
        reveal('c3-sounds'),
        goto(HUB),
      ],
    },
    secretNote('c3.note.l1'),
    fitilyokScene(),
    {
      id: 'C3-5', title: 'Фонарная комната: Лупа', location: 'lighthouse-room', cast: ['khvosts', 'watsony', 'damka'], presentation: 'minigame',
      steps: [skill('magnifier', [L('C3-5-01')]), minigame('c3l1-magnifier'), ...seq('C3-5-', 6, 8), reveal('c3-room'), goto(HUB)],
    },
    {
      id: 'C3-6', title: 'Лестница: Кто наследил?', location: 'lighthouse-stairs', cast: ['khvosts', 'watsony'], presentation: 'minigame',
      steps: [skill('tracks', [L('C3-6-01')]), minigame('c3l1-tracks'), ...seq('C3-6-', 5, 6), reveal('c3-tracks'), goto(HUB)],
    },
    versionScene('C3-7'),
    {
      id: 'C3-8', title: 'Доброе разрешение', location: 'lighthouse-room', cast: ['khvosts', 'watsony', 'pukhlik', 'damka'], presentation: 'cutscene',
      steps: [cutscene('c3.reveal.l1'), goto('C3-9')],
    },
    finalLightScene('C3-9', 1, 'c3l1-light'),
    factsScene(),
    rewardScene(1, 'c3.reward.l1'),
  ],
  logic: {
    axes: [
      { id: 'who', title: 'C3-AX-who', values: [who.pukhlik, who.fitilyok, who.stella] },
      { id: 'where', title: 'C3-AX-where', values: [where.top, where.shed, where.reeds] },
      { id: 'what', title: 'C3-AX-what', values: [what.training, what.broken, what.ghost] },
    ],
    intended,
    clues: [
      { id: 'c3-sounds', title: 'C3-CL-sounds', required: true, predicate: ne('what', 'ghost'), requires: [], source: 'C3-2', summary: 'Запись слышит страницы и заслонку; призрак не объясняет книгу.' },
      { id: 'c3-room', title: 'C3-CL-room', required: true, predicate: and(eq('where', 'top'), eq('what', 'training'), ne('what', 'broken')), requires: ['c3-secret-note'], source: 'C3-5', summary: 'Шнурок, книга и исправный фонарь показывают верх маяка и тренировку сигналов.' },
      { id: 'c3-tracks', title: 'C3-CL-tracks', required: true, predicate: eq('who', 'pukhlik'), requires: ['c3-secret-note'], source: 'C3-6', summary: 'Два пальца вперёд и два назад — совиный след.' },
      { id: 'c3-fitilyok', title: 'C3-CL-fitilyok', required: false, predicate: ne('who', 'fitilyok'), requires: [], source: 'C3-4', summary: 'Фитилёк всю ночь зажигал фонари на улице.' },
      { id: 'c3-secret-note', title: 'C3-COL-secret-note', required: false, predicate: anyWhat, requires: [], source: 'C3-3', summary: 'Первая Тайная заметка: запах ромашки у весла Дамки.' },
    ],
    version: { button: 'UI-hud.version', available: has.visited('C3-7'), onSolved: 'C3-8' },
    wrongVersion: {
      intro: [cl('C3-7-04')],
      byValue: [
        { axis: 'who', value: 'fitilyok', clues: ['c3-tracks'], lines: [cl('C3-7-05')] },
        { axis: 'who', value: 'stella', clues: ['c3-tracks'], lines: [cl('C3-7-06')] },
        { axis: 'where', value: 'shed', clues: ['c3-room'], lines: [cl('C3-7-07')] },
        { axis: 'where', value: 'reeds', clues: ['c3-room'], lines: [cl('C3-7-08')] },
        { axis: 'what', value: 'broken', clues: ['c3-room'], lines: [cl('C3-7-09')] },
        { axis: 'what', value: 'ghost', clues: ['c3-sounds'], lines: [cl('C3-7-10')] },
      ],
      outro: [cl('C3-7-11')],
    },
    redHerrings: redHerringsBase,
  },
  notebookHelp: {
    mode: 'suggest',
    marks: [
      { axis: 'who', value: 'pukhlik', mark: 'confirmed', clues: ['c3-tracks'], line: 'C3-NB-01' },
      { axis: 'who', value: 'fitilyok', mark: 'excluded', clues: ['c3-tracks'], line: 'C3-NB-02' },
      { axis: 'who', value: 'stella', mark: 'excluded', clues: ['c3-tracks'], line: 'C3-NB-03' },
      { axis: 'where', value: 'top', mark: 'confirmed', clues: ['c3-room'], line: 'C3-NB-04' },
      { axis: 'where', value: 'shed', mark: 'excluded', clues: ['c3-room'], line: 'C3-NB-05' },
      { axis: 'where', value: 'reeds', mark: 'excluded', clues: ['c3-room'], line: 'C3-NB-06' },
      { axis: 'what', value: 'training', mark: 'confirmed', clues: ['c3-room'], line: 'C3-NB-07' },
      { axis: 'what', value: 'broken', mark: 'excluded', clues: ['c3-room'], line: 'C3-NB-08' },
      { axis: 'what', value: 'ghost', mark: 'excluded', clues: ['c3-sounds'], line: 'C3-NB-09' },
    ],
    pointers: [],
    nothing: 'UI-notebook.nothing',
  },
  hints: {
    klubok: {
      speaker: 'khvosts', precision: 'exact', allowance: 3,
      rules: [
        { id: 'C3-H-01', when: not(has.clue('c3-sounds')), cites: [] },
        { id: 'C3-H-02', when: not(has.visited('C3-3')), cites: [] },
        { id: 'C3-H-03', when: not(has.clue('c3-room')), cites: [] },
        { id: 'C3-H-04', when: not(has.clue('c3-tracks')), cites: [] },
      ],
      review: 'C3-H-05',
      exhausted: 'UI-hint.klubokEmptyShell',
    },
    shell: {
      speaker: 'watsony', precision: 'exact', allowance: null,
      rules: [
        { id: 'C3-R-01', when: not(has.clue('c3-sounds')), cites: [] },
        { id: 'C3-R-02', when: not(has.clue('c3-room')), cites: [] },
        { id: 'C3-R-03', when: not(has.clue('c3-tracks')), cites: [] },
      ],
      review: 'C3-H-05',
      exhausted: null,
    },
  },
  minigames: [
    soundGame('c3l1-sound', 1),
    {
      id: 'c3l1-magnifier', skill: 'magnifier',
      config: {
        kind: 'magnifier',
        targets: [
          { id: 'cord', label: 'C3-5-B01', required: true, reply: ['C3-5-02', 'C3-5-03'] },
          { id: 'book', label: 'C3-5-B02', required: true, reply: ['C3-5-04'] },
          { id: 'wax', label: 'C3-5-B03', required: true, reply: ['C3-5-05'] },
        ],
        afterFirst: [], afterFirstSkill: null, assistAfterMisses: 3,
      },
    },
    {
      id: 'c3l1-tracks', skill: 'tracks',
      config: { kind: 'tracks', steps: [{ id: 'owl', prompt: null, pageSize: 3, options: [opt('magpie', 'C3-6-B01', false, 'C3-6-02'), opt('firefly', 'C3-6-B02', false, 'C3-6-03'), opt('owl', 'C3-6-B03', true, 'C3-6-04')] }], question: null },
    },
    lightGame('c3l1-light', 1),
  ],
  facts,
  glossary,
  rewards: baseRewards(1),
  collections,
  activities: [activity],
  comfort: commonComfort,
  cutscenes: [intro(1, 'C3-1'), note(1), revealCutscene(1, 'C3-8'), rewardCutscene(1)],
  notebookPages: [secretNotesPage],
  decisions: [
    { id: 'C3L1-D1', text: 'C3-3 сделана обязательным шлюзом перед осмотром маяка и следов, чтобы Тайная заметка не пропускалась.', ref: 'D06, Q21' },
    { id: 'C3L1-D2', text: '«Услышь разницу» описана как staged-механика с визуальными волнами и иконками характера звука.', ref: 'Q31, R09' },
    { id: 'C3L1-D3', text: '«Азбука огоньков» хранится как игровой staged-ритм, не Морзе.', ref: 'D21' },
    { id: 'C3L1-T25', text: 'Ролики T25: вступление, тайная заметка, разрешение и награда. Игровые эффекты остаются шагами после роликов.', ref: 'T25' },
  ],
};
