import { retarget } from '../../tools/content/dsl.ts';
import type { VariantSource } from '../../tools/content/dsl.ts';
import {
  activity, and, baseRewards, cl, collections, commonComfort, commonCutscenes, eq, facts, factsScene, finalLightScene, fitilyokScene,
  glossary, goto, has, HUB, intended, introOffice, L, lightGame, menu, minigame, mopt, ne, not, opt, redHerringsBase, reveal, rewardScene,
  secretNote, seq, skill, soundGame, versionScene, where, what, who,
} from './common.ts';

const anyWhat = { op: 'in' as const, axis: 'what', values: ['training', 'broken', 'ghost', 'repair'] };

export const level2: VariantSource = {
  pack: 'case03-l2',
  kind: 'case',
  title: 'C3-TITLE',
  case: { number: 3, level: 2 },
  start: 'C3-0',
  scenes: [
    { id: 'C3-0', title: 'Контора: вечерний гость', location: 'office-evening', cast: ['khvosts', 'watsony', 'mouse'], presentation: 'cutscene', steps: [...introOffice(), goto('C3-L2-1')] },
    {
      id: 'C3-L2-1', title: 'Берег Медового пруда', location: 'honey-pond', cast: ['pudding', 'damka', 'khvosts', 'watsony'], presentation: 'dialogue',
      steps: [...seq('C3-1-', 1, 5), ...seq('C3-L2-1-', 1, 3), skill('lamp', [L('C3-1-06')]), ...seq('C3-1-', 7, 8), L('C3-L2-1-04'), ...seq('C3-1-', 9, 10), goto(HUB)],
    },
    {
      id: HUB, title: 'Медовый пруд: выбор', location: 'honey-pond', cast: ['khvosts', 'watsony', 'pudding', 'damka'], presentation: 'hub',
      steps: [
        { t: 'if', when: { all: [has.clue('c3-l2-sounds'), has.clue('c3-l2-room'), has.clue('c3-tracks'), has.clue('c3-log'), not(has.visited('C3-L2-7'))] }, then: [goto('C3-L2-7')], else: [] },
        menu('C3-L2-M', null, [
          mopt('sounds', 'C3-1-B01', 'C3-L2-2', { hideWhen: has.clue('c3-l2-sounds') }),
          mopt('door', 'C3-1-B02', 'C3-3', { hideWhen: has.visited('C3-3') }),
          mopt('fitilyok', 'C3-1-B03', 'C3-4', { hideWhen: { any: [has.visited('C3-4'), has.visited('C3-3')] }, optional: true }),
          mopt('room', 'C3-1-B04', 'C3-L2-4', { when: has.visited('C3-3'), hideWhen: has.clue('c3-l2-room') }),
          mopt('tracks', 'C3-1-B05', 'C3-L2-5', { when: has.visited('C3-3'), hideWhen: has.clue('c3-tracks') }),
          mopt('log', 'C3-1-B06', 'C3-L2-6', { when: has.clue('c3-l2-room'), hideWhen: has.clue('c3-log') }),
        ]),
      ],
    },
    {
      id: 'C3-L2-2', title: 'Услышь разницу: три раунда', location: 'pond-bank', cast: ['khvosts', 'watsony', 'mouse'], presentation: 'minigame',
      steps: [skill('sound-diff', [L('C3-2-01'), L('C3-2-02')]), minigame('c3l2-sound'), L('C3-L2-2-02'), ...seq('C3-2-', 6, 9), reveal('c3-l2-sounds'), goto(HUB)],
    },
    secretNote([L('C3-L2-3-01')]),
    fitilyokScene(),
    {
      id: 'C3-L2-4', title: 'Лупа наверху', location: 'lighthouse-room', cast: ['khvosts', 'watsony', 'damka'], presentation: 'minigame',
      steps: [skill('magnifier', [L('C3-5-01'), L('C3-L2-4-01')]), minigame('c3l2-magnifier'), ...seq('C3-5-', 6, 8), L('C3-L2-4-05'), reveal('c3-l2-room'), goto(HUB)],
    },
    {
      id: 'C3-L2-5', title: 'Кто наследил?', location: 'lighthouse-stairs', cast: ['khvosts', 'watsony'], presentation: 'minigame',
      steps: [skill('tracks', [L('C3-6-01')]), minigame('c3l2-tracks'), ...seq('C3-6-', 5, 6), reveal('c3-tracks'), goto(HUB)],
    },
    {
      id: 'C3-L2-6', title: 'Лента времени', location: 'lighthouse-room', cast: ['khvosts', 'watsony'], presentation: 'minigame',
      steps: [skill('timeline', [L('C3-L2-6-01'), L('C3-L2-6-02')], [L('C3-L2-6-03')]), minigame('c3l2-timeline'), ...seq('C3-L2-6-', 4, 6), reveal('c3-log'), goto(HUB)],
    },
    versionScene('C3-L2-7'),
    { id: 'C3-L2-8', title: 'Разрешение', location: 'lighthouse-room', cast: ['khvosts', 'watsony', 'pukhlik', 'damka'], presentation: 'cutscene', steps: [...seq('C3-8-', 1, 11), ...seq('C3-L2-8-', 1, 2), ...seq('C3-8-', 12, 16), goto('C3-L2-9')] },
    finalLightScene('C3-L2-9', 2, 'c3l2-light'),
    factsScene(),
    rewardScene(2),
  ],
  logic: {
    axes: [
      { id: 'who', title: 'C3-AX-who', values: [who.pukhlik, who.fitilyok, who.stella, who.damka] },
      { id: 'where', title: 'C3-AX-where', values: [where.top, where.shed, where.reeds, where.pier] },
      { id: 'what', title: 'C3-AX-what', values: [what.training, what.broken, what.ghost, what.repair] },
    ],
    intended,
    clues: [
      { id: 'c3-l2-sounds', title: 'C3-CL-l2-sounds', required: true, predicate: ne('what', 'ghost'), requires: [], source: 'C3-L2-2', summary: 'Запись слышит страницы, заслонку и капли; молоток не доказывает ремонт.' },
      { id: 'c3-l2-room', title: 'C3-CL-l2-room', required: true, predicate: and(eq('where', 'top'), eq('what', 'training'), ne('where', 'pier'), ne('what', 'broken'), ne('what', 'repair')), requires: ['c3-secret-note'], source: 'C3-L2-4', summary: 'Окно, шнурок, книга, воск и пыльные инструменты в верхней комнате.' },
      { id: 'c3-tracks', title: 'C3-CL-tracks', required: true, predicate: eq('who', 'pukhlik'), requires: ['c3-secret-note'], source: 'C3-L2-5', summary: 'Следы совы исключают Стеллу, Фитилька и Дамку.' },
      { id: 'c3-log', title: 'C3-CL-log', required: true, predicate: and(ne('who', 'damka'), ne('what', 'repair')), requires: ['c3-l2-room'], source: 'C3-L2-6', summary: 'Журнал показывает, что Дамка была дома, а дверь заперта с семи.' },
      { id: 'c3-fitilyok', title: 'C3-CL-fitilyok', required: false, predicate: ne('who', 'fitilyok'), requires: [], source: 'C3-4', summary: 'Фитилёк всю ночь зажигал фонари на улице.' },
      { id: 'c3-secret-note', title: 'C3-COL-secret-note', required: false, predicate: anyWhat, requires: [], source: 'C3-3', summary: 'Первая Тайная заметка: запах ромашки у весла Дамки.' },
    ],
    version: { button: 'UI-hud.version', available: has.visited('C3-L2-7'), onSolved: 'C3-L2-8' },
    wrongVersion: {
      intro: [cl('C3-7-04')],
      byValue: [
        { axis: 'who', value: 'fitilyok', clues: ['c3-tracks'], lines: [cl('C3-7-05')] },
        { axis: 'who', value: 'stella', clues: ['c3-tracks'], lines: [cl('C3-7-06')] },
        { axis: 'who', value: 'damka', clues: ['c3-log'], lines: [cl('C3-L2-7-01')] },
        { axis: 'where', value: 'shed', clues: ['c3-l2-room'], lines: [cl('C3-7-07')] },
        { axis: 'where', value: 'reeds', clues: ['c3-l2-room'], lines: [cl('C3-7-08')] },
        { axis: 'where', value: 'pier', clues: ['c3-l2-room'], lines: [cl('C3-L2-7-02')] },
        { axis: 'what', value: 'broken', clues: ['c3-l2-room'], lines: [cl('C3-7-09')] },
        { axis: 'what', value: 'ghost', clues: ['c3-l2-sounds'], lines: [cl('C3-7-10')] },
        { axis: 'what', value: 'repair', clues: ['c3-l2-room', 'c3-log'], lines: [cl('C3-L2-7-03')] },
      ],
      outro: [cl('C3-7-11')],
    },
    redHerrings: [...redHerringsBase, { id: 'rh-c3-damka-key', summary: 'Ключ у Дамки, но Пухлик влетел через окно.', presentedBy: ['C3-L2-1-01'], explainedBy: ['C3-L2-8-01', 'C3-L2-8-02'] }],
  },
  notebookHelp: {
    mode: 'suggest',
    marks: [
      { axis: 'who', value: 'pukhlik', mark: 'confirmed', clues: ['c3-tracks'], line: 'C3-NB-01' },
      { axis: 'who', value: 'fitilyok', mark: 'excluded', clues: ['c3-tracks'], line: 'C3-NB-02' },
      { axis: 'who', value: 'stella', mark: 'excluded', clues: ['c3-tracks'], line: 'C3-NB-03' },
      { axis: 'who', value: 'damka', mark: 'excluded', clues: ['c3-log'], line: 'C3-NB-10' },
      { axis: 'where', value: 'top', mark: 'confirmed', clues: ['c3-l2-room'], line: 'C3-NB-04' },
      { axis: 'where', value: 'shed', mark: 'excluded', clues: ['c3-l2-room'], line: 'C3-NB-05' },
      { axis: 'where', value: 'reeds', mark: 'excluded', clues: ['c3-l2-room'], line: 'C3-NB-06' },
      { axis: 'where', value: 'pier', mark: 'excluded', clues: ['c3-l2-room'], line: 'C3-NB-11' },
      { axis: 'what', value: 'training', mark: 'confirmed', clues: ['c3-l2-room'], line: 'C3-NB-07' },
      { axis: 'what', value: 'broken', mark: 'excluded', clues: ['c3-l2-room'], line: 'C3-NB-08' },
      { axis: 'what', value: 'ghost', mark: 'excluded', clues: ['c3-l2-sounds'], line: 'C3-NB-09' },
      { axis: 'what', value: 'repair', mark: 'excluded', clues: ['c3-l2-room', 'c3-log'], line: 'C3-NB-12' },
    ],
    pointers: [],
    nothing: 'UI-notebook.nothing',
  },
  hints: {
    klubok: { speaker: 'khvosts', precision: 'exact', allowance: 3, rules: [
      { id: 'C3-L2-H-01', when: not(has.clue('c3-l2-sounds')), cites: [] },
      { id: 'C3-L2-H-02', when: not(has.visited('C3-3')), cites: [] },
      { id: 'C3-L2-H-03', when: not(has.clue('c3-l2-room')), cites: [] },
      { id: 'C3-L2-H-04', when: not(has.clue('c3-log')), cites: [] },
      { id: 'C3-L2-H-05', when: not(has.clue('c3-tracks')), cites: [] },
    ], review: 'C3-L2-H-06', exhausted: 'UI-hint.klubokEmptyShell' },
    shell: { speaker: 'watsony', precision: 'vague', allowance: null, rules: [
      { id: 'C3-L2-R-01', when: not(has.clue('c3-l2-sounds')), cites: [] },
      { id: 'C3-L2-R-02', when: not(has.clue('c3-l2-room')), cites: [] },
      { id: 'C3-L2-R-03', when: not(has.clue('c3-log')), cites: [] },
    ], review: 'C3-L2-H-06', exhausted: null },
  },
  minigames: [
    soundGame('c3l2-sound', 2),
    { id: 'c3l2-magnifier', skill: 'magnifier', config: { kind: 'magnifier', targets: [
      { id: 'cord', label: 'C3-5-B01', required: true, reply: ['C3-5-02', 'C3-5-03'] },
      { id: 'book', label: 'C3-5-B02', required: true, reply: ['C3-5-04'] },
      { id: 'wax', label: 'C3-5-B03', required: true, reply: ['C3-5-05'] },
      { id: 'window', label: 'C3-5-B04', required: true, reply: ['C3-L2-4-02', 'C3-L2-4-03'] },
      { id: 'tools', label: 'C3-5-B05', required: true, reply: ['C3-L2-4-04'] },
    ], afterFirst: [], afterFirstSkill: null, assistAfterMisses: 3 } },
    { id: 'c3l2-tracks', skill: 'tracks', config: { kind: 'tracks', steps: [
      { id: 'owl1', prompt: null, pageSize: 3, options: [opt('magpie', 'C3-6-B01', false, 'C3-6-02'), opt('firefly', 'C3-6-B02', false, 'C3-6-03'), opt('owl', 'C3-6-B03', true, 'C3-6-04')] },
      { id: 'owl2', prompt: null, pageSize: 2, options: [opt('beaver', 'C3-6-B04', false, 'C3-L2-5-01'), opt('owl', 'C3-6-B03', true, 'C3-6-04')] },
    ], question: null } },
    { id: 'c3l2-timeline', skill: 'timeline', config: { kind: 'timeline', items: [
      { id: 't19', time: '19:00', label: 'C3-L2-6-B01' },
      { id: 't20', time: '20:00', label: 'C3-L2-6-B02' },
      { id: 't21', time: '21:00', label: 'C3-L2-6-B03' },
      { id: 't22', time: '22:00', label: 'C3-L2-6-B04' },
    ], solution: ['t19', 't20', 't21', 't22'], wrong: ['C3-L2-6-W01'] } },
    lightGame('c3l2-light', 2),
  ],
  facts, glossary, rewards: baseRewards(2), collections, activities: [activity], comfort: commonComfort, cutscenes: [], plannedCutscenes: retarget(commonCutscenes, { "C3-8": "C3-L2-8" }),
  decisions: [
    { id: 'C3L2-D1', text: 'Фраза про отсутствие молотка не исключает ремонт; ремонт исключают пыльные инструменты и журнал смотрителя.', ref: 'R03' },
    { id: 'C3L2-D2', text: 'Ошибка Дамки про закрытое окно оставлена добросовестной и исправляется в осмотре.', ref: 'D04' },
  ],
};
