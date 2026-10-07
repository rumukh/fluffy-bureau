import { all, cl, goto, has, L, Ls, menu, minigame, not, opt as mopt, reveal, reward, seq, skill, when, type VariantSource } from '../../tools/content/dsl.ts';
import { activityCard, and, baseDecisions, choice, commonCutscenes, eq, facts, factsScene, glossary, intended, intro0, intro1base, klubkiIntro, ne, notebookIntro, resolutionSteps, rewardScene, versionScene, what, where, who } from './common.ts';

const HUB = 'C2-HUB';
const allClues = all(has.clue('c2-lupa'), has.clue('c2-cipher'), has.clue('c2-cocoa'));

export const level1: VariantSource = {
  pack: 'case02-l1', kind: 'case', title: 'C2-TITLE', case: { number: 2, level: 1 }, start: 'C2-0',
  scenes: [
    { id: 'C2-0', title: 'Контора: письма не пришли', location: 'office', cast: ['khvosts', 'watsony', 'pudding'], presentation: 'cutscene', steps: [...intro0(), goto('C2-1')] },
    { id: 'C2-1', title: 'Завязка: крыльцо почты', location: 'post-office', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'dialogue', steps: [
      ...intro1base(), ...notebookIntro('C2-1-D03'), L('C2-1-11'), L('C2-1-12'), L('C2-1-13'), klubkiIntro(), goto(HUB),
    ] },
    { id: HUB, title: 'Почта: выбор', location: 'post-office', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'hub', steps: [
      when(all(allClues, not(has.visited('C2-6'))), [goto('C2-6')]),
      menu('C2-M', null, [
        mopt('porch', 'C2-1-B01', 'C2-2', { hideWhen: has.visited('C2-2') }),
        mopt('mice', 'C2-1-B02', 'C2-4', { hideWhen: has.visited('C2-4') }),
        mopt('mayor', 'C2-1-B03', 'C2-5', { hideWhen: has.visited('C2-5'), optional: true }),
        mopt('cipher', 'C2-2-B04', 'C2-3', { when: has.clue('c2-lupa'), hideWhen: has.visited('C2-3') }),
      ]),
    ] },
    { id: 'C2-2', title: 'Крыльцо: «Лупа»', location: 'post-porch', cast: ['khvosts', 'watsony'], presentation: 'minigame', steps: [
      skill('magnifier', [L('C2-2-01')]), minigame('c2l1-lupa'), L('C2-2-05'), L('C2-2-06'), reveal('c2-lupa'), goto(HUB),
    ] },
    { id: 'C2-3', title: 'Шифр на пуговицах', location: 'post-office', cast: ['khvosts', 'watsony'], presentation: 'minigame', steps: [
      skill('button-cipher', seq('C2-3-', 1, 3)), minigame('c2l1-cipher'), ...seq('C2-3-', 5, 11), reveal('c2-cipher'), goto(HUB),
    ] },
    { id: 'C2-4', title: 'Библиотека: «Чашка какао»', location: 'library-door', cast: ['mouse', 'khvosts', 'watsony'], presentation: 'minigame', steps: [
      ...seq('C2-4-', 1, 2), skill('cocoa', [L('C2-4-03')]), minigame('c2l1-cocoa'), reward('rw-c2-heart-mice'), ...seq('C2-4-', 12, 20), reveal('c2-cocoa'), goto(HUB),
    ] },
    { id: 'C2-5', title: 'Разговор с мэром', location: 'post-office', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'dialogue', steps: [...seq('C2-5-', 1, 4), reveal('c2-mayor'), goto(HUB)] },
    versionScene('C2-6', HUB),
    { id: 'C2-7', title: 'Парк Старого Дуба', location: 'old-oak', cast: ['stella', 'pudding', 'mouse', 'khvosts', 'watsony'], presentation: 'cutscene', steps: resolutionSteps([], 'C2-8') },
    { id: 'C2-8', title: 'Почтальон и Выставка писем', location: 'town-square', cast: ['stella', 'pudding', 'tyopa', 'khvosts'], presentation: 'minigame', steps: [
      skill('postal', Ls('C2-8-01', 'C2-8-02')), minigame('c2l1-postal'), ...seq('C2-8-', 5, 8), goto('C2-9'),
    ] },
    factsScene('C2-10'), rewardScene(1),
  ],
  logic: {
    axes: [
      { id: 'who', title: 'C2-AX-who', values: [who.stella, who.mouse, who.pudding] },
      { id: 'where', title: 'C2-AX-where', values: [where.porch, where.nest, where.hole] },
      { id: 'what', title: 'C2-AX-what', values: [what.rain, what.sparkle, what.lost] },
    ], intended,
    clues: [
      { id: 'c2-lupa', title: 'C2-CL-lupa', required: true, predicate: { op: 'in', axis: 'what', values: ['rain', 'sparkle', 'lost'] }, requires: [], source: 'C2-2', summary: 'Зонт, перо и записка без подписи открывают шифр.' },
      { id: 'c2-cipher', title: 'C2-CL-cipher-nest', required: true, predicate: and(eq('where', 'nest'), eq('what', 'rain'), ne('where', 'porch'), ne('where', 'hole'), ne('what', 'sparkle'), ne('what', 'lost')), requires: ['c2-lupa'], source: 'C2-3', summary: 'В записке: письма в гнездо, скоро дождь.' },
      { id: 'c2-cocoa', title: 'C2-CL-cocoa', required: true, predicate: and(eq('who', 'stella'), ne('who', 'mouse'), ne('who', 'pudding'), ne('where', 'hole')), requires: [], source: 'C2-4', summary: 'Мышата и мэр были в библиотеке; сороку с сумкой видели у Старого Дуба.' },
      { id: 'c2-mayor', title: 'C2-CL-mayor', required: false, predicate: ne('who', 'pudding'), requires: [], source: 'C2-5', summary: 'Мэр говорит, что держал лесенку в библиотеке.' },
    ],
    version: { button: 'UI-hud.version', available: has.visited('C2-6'), onSolved: 'C2-7' },
    wrongVersion: { intro: [cl('C2-6-03')], byValue: [
      { axis: 'who', value: 'mouse', clues: ['c2-cocoa'], lines: [cl('C2-6-04')] },
      { axis: 'who', value: 'pudding', clues: ['c2-cocoa'], lines: [cl('C2-6-05')] },
      { axis: 'where', value: 'porch', clues: ['c2-cipher'], lines: [cl('C2-6-06')] },
      { axis: 'where', value: 'hole', clues: ['c2-cocoa'], lines: [cl('C2-6-07')] },
      { axis: 'what', value: 'sparkle', clues: ['c2-cipher'], lines: [cl('C2-6-08')] },
      { axis: 'what', value: 'lost', clues: ['c2-cipher'], lines: [cl('C2-6-09')] },
    ], outro: [cl('C2-6-10')] },
    redHerrings: [
      { id: 'rh-c2-magpie-thief', summary: 'Миф «сорока-воровка».', presentedBy: ['C2-1-04'], explainedBy: ['C2-7-12'] },
      { id: 'rh-c2-paper-mice', summary: 'Мыши якобы грызли письма.', presentedBy: ['C2-1-05', 'C2-4-01'], explainedBy: ['C2-7-13'] },
      { id: 'rh-c2-mayor-loses', summary: 'Мэр всё теряет.', presentedBy: ['C2-1-08'], explainedBy: ['C2-7-14'] },
    ],
  },
  notebookHelp: { mode: 'suggest', marks: [
    { axis: 'who', value: 'stella', mark: 'confirmed', clues: ['c2-cocoa'], line: 'C2-NB-01' },
    { axis: 'who', value: 'mouse', mark: 'excluded', clues: ['c2-cocoa'], line: 'C2-6-04' },
    { axis: 'who', value: 'pudding', mark: 'excluded', clues: ['c2-cocoa'], line: 'C2-6-05' },
    { axis: 'where', value: 'nest', mark: 'confirmed', clues: ['c2-cipher'], line: 'C2-NB-02' },
    { axis: 'where', value: 'porch', mark: 'excluded', clues: ['c2-cipher'], line: 'C2-6-06' },
    { axis: 'where', value: 'hole', mark: 'excluded', clues: ['c2-cocoa'], line: 'C2-6-07' },
    { axis: 'what', value: 'rain', mark: 'confirmed', clues: ['c2-cipher'], line: 'C2-3-10' },
    { axis: 'what', value: 'sparkle', mark: 'excluded', clues: ['c2-cipher'], line: 'C2-6-08' },
    { axis: 'what', value: 'lost', mark: 'excluded', clues: ['c2-cipher'], line: 'C2-6-09' },
  ], pointers: [], nothing: 'UI-notebook.nothing' },
  hints: { klubok: { speaker: 'khvosts', precision: 'exact', allowance: 3, rules: [
    { id: 'C2-H-01', when: not(has.clue('c2-lupa')), cites: [] },
    { id: 'C2-H-02', when: all(has.clue('c2-lupa'), not(has.clue('c2-cipher'))), cites: ['c2-lupa'] },
    { id: 'C2-H-03', when: not(has.clue('c2-cocoa')), cites: [] },
  ], review: 'C2-H-04', exhausted: 'UI-hint.klubokEmptyShell' }, shell: { speaker: 'watsony', precision: 'exact', allowance: null, rules: [
    { id: 'C2-R-01', when: all(has.clue('c2-lupa'), not(has.clue('c2-cipher'))), cites: ['c2-lupa'] },
    { id: 'C2-R-02', when: not(has.clue('c2-cocoa')), cites: [] },
    { id: 'C2-R-03', when: all(has.clue('c2-cocoa'), not(has.clue('c2-cipher'))), cites: ['c2-cocoa'] },
  ], review: 'C2-H-04', exhausted: null } },
  minigames: [
    { id: 'c2l1-lupa', skill: 'magnifier', config: { kind: 'magnifier', targets: [
      { id: 'umbrella', label: 'C2-2-B01', required: true, reply: ['C2-2-02'] }, { id: 'feather', label: 'C2-2-B02', required: true, reply: ['C2-2-03'] }, { id: 'note', label: 'C2-2-B03', required: true, reply: ['C2-2-04'] },
    ], afterFirst: [], afterFirstSkill: null, assistAfterMisses: 3 } },
    { id: 'c2l1-cipher', skill: 'button-cipher', config: { kind: 'staged', mechanic: 'button-cipher', description: 'Сопоставить пуговицы с буквами.', steps: [
      { id: 'word1', prompt: null, pageSize: 3, options: [choice('nest', 'C2-3-B01', true, 'C2-3-05'), choice('rain', 'C2-3-B02', false, 'C2-3-04'), choice('oak', 'C2-L2-4-B01', false, 'C2-3-04')] },
      { id: 'word2', prompt: null, pageSize: 3, options: [choice('rain', 'C2-3-B02', true, 'C2-3-06'), choice('nest', 'C2-3-B01', false, 'C2-3-04'), choice('oak', 'C2-L2-4-B01', false, 'C2-3-04')] },
    ], lines: [] } },
    { id: 'c2l1-cocoa', skill: 'cocoa', config: { kind: 'cocoa', rounds: [
      { id: 'r1', options: [choice('kind1', 'C2-4-B01', true, 'C2-4-04'), choice('kind2', 'C2-4-B02', true, 'C2-4-05'), choice('paper', 'C2-4-B03', false, 'C2-4-06')], retry: ['C2-4-07'] },
      { id: 'r2', options: [choice('doing', 'C2-4-B04', true, 'C2-4-08'), choice('flags', 'C2-4-B05', true, 'C2-4-09'), choice('where', 'C2-4-B06', false, 'C2-4-10')], retry: ['C2-4-11'] },
    ] } },
    { id: 'c2l1-postal', skill: 'postal', config: { kind: 'staged', mechanic: 'postal', description: 'Посчитать дырочки и выбрать домик.', steps: [
      { id: 'p2', prompt: null, pageSize: 3, options: [choice('h1', 'C2-8-B01', false, 'C2-8-03'), choice('h2', 'C2-8-B02', true, 'C2-8-04'), choice('h4', 'C2-8-B03', false, 'C2-8-03')] },
      { id: 'p4', prompt: null, pageSize: 3, options: [choice('h1', 'C2-8-B01', false, 'C2-8-03'), choice('h2', 'C2-8-B02', false, 'C2-8-03'), choice('h4', 'C2-8-B03', true, 'C2-8-04')] },
    ], lines: [] } },
  ],
  facts, glossary, rewards: ['rw-c2-heart-mice', 'rw-c2-badge', 'rw-c2-buttons-l1', 'rw-c2-sticker-l1', 'rw-c2-title-helper', 'rw-c2-decor-poster', 'rw-c2-activity'], collections: [], activities: [activityCard], comfort: [], cutscenes: commonCutscenes, decisions: [...baseDecisions], reserved: [],
};


