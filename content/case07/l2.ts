// Case 7, level 2 (4×4×4). Explicit normalized variant.
import { all, cl, goto, has, L, menu, minigame, not, opt as mopt, reveal, seq, skill, when, type VariantSource } from '../../tools/content/dsl.ts';
import { activity, and, baseDecisions, cocoaScene, commonCollections, commonComfort, commonCutscenes, eq, facts, factsScene, glossary, intended, intro, mayorScene, ne, opt, repairScene, resolutionScene, rewardScene, secretScene, versionScene, waterScene, what, where, who } from './common.ts';

const HUB = 'C7-L2-HUB';
const required = all(has.clue('c7-water'), has.clue('c7-garden'), has.clue('c7-timeline'), has.clue('c7-chain'));

export const level2: VariantSource = {
  pack: 'case07-l2', kind: 'case', title: 'C7-TITLE', case: { number: 7, level: 2 }, start: 'C7-L2-1',
  scenes: [
    { id: 'C7-L2-1', title: 'Мокрое утро', location: 'office', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'dialogue', steps: [...intro([L('C7-L2-1-01')]), goto(HUB)] },
    { id: HUB, title: 'Площадь: выбор', location: 'square-flood', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'hub', steps: [
      when(all(required, not(has.visited('C7-L2-6'))), [goto('C7-L2-6')]),
      menu('C7-L2-M', null, [
        mopt('water', 'C7-1-B01', 'C7-L2-2', { hideWhen: has.visited('C7-L2-2') }),
        mopt('kartofan', 'C7-1-B02', 'C7-L2-3', { hideWhen: has.visited('C7-L2-3') }),
        mopt('more', 'UI-hud.map', 'C7-L2-MORE', { hideWhen: all(has.visited('C7-5-C7-L2-HUB'), has.visited('C7-4'), has.visited('C7-L2-5')) }),
      ]),
    ] },
    { id: 'C7-L2-MORE', title: 'Площадь: ещё места', location: 'square-flood', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'hub', steps: [
      menu('C7-L2-MORE-M', null, [
        mopt('mayor', 'C7-1-B03', 'C7-5-C7-L2-HUB', { hideWhen: has.visited('C7-5-C7-L2-HUB'), optional: true }),
        mopt('pond', 'C7-1-B04', 'C7-4', { when: { any: [has.clue('c7-water'), has.clue('c7-garden')] }, hideWhen: has.visited('C7-4') }),
        mopt('chain', 'C7-4-B01', 'C7-L2-5', { when: has.clue('c7-timeline'), hideWhen: has.visited('C7-L2-5') }),
      ], { back: HUB }),
    ] },
    waterScene('C7-L2-2', 'c7l2-water', 'C7-L2-2-01', [L('C7-L2-2-03')]),
    cocoaScene('C7-L2-3', 'c7l2-cocoa', 2),
    secretScene('C7-4', 'C7-L2-4'),
    { id: 'C7-L2-4', title: '«Лента времени»: дождемер', location: 'honey-pond-lock', cast: ['khvosts', 'watsony'], presentation: 'minigame', steps: [skill('timeline', [L('C7-L2-4-01')], [L('C7-L2-4-01')]), minigame('c7l2-timeline'), L('C7-L2-4-02'), L('C7-L2-4-03'), reveal('c7-timeline'), goto(HUB)] },
    { id: 'C7-L2-5', title: '«Цепочка причин»', location: 'honey-pond-lock', cast: ['khvosts', 'watsony'], presentation: 'minigame', steps: [skill('cause-chain', [L('C7-6-01'), L('C7-6-02')]), L('C7-L2-5-01'), minigame('c7l2-chain'), L('C7-L2-5-02'), ...seq('C7-6-', 4, 8), reveal('c7-chain'), goto(HUB)] },
    versionScene('C7-L2-6', HUB),
    resolutionScene('C7-L2-7', 'C7-L2-8', [L('C7-L2-7-01'), L('C7-L2-7-02')]),
    repairScene('C7-L2-8', 'c7l2-repair', 2),
    factsScene(), rewardScene(2), mayorScene(HUB),
  ],
  logic: {
    axes: [
      { id: 'who', title: 'C7-AX-who', values: [who.damka, who.pudding, who.kartofan, who.tyopa] },
      { id: 'where', title: 'C7-AX-where', values: [where.pond, where.fountain, where.garden, where.barrels] },
      { id: 'what', title: 'C7-AX-what', values: [what.unfinished, what.tap, what.pipe, what.barrels] },
    ], intended,
    clues: [
      { id: 'c7-water', title: 'C7-CL-water', required: true, predicate: and(eq('where', 'pond'), ne('where', 'barrels'), ne('who', 'pudding'), ne('what', 'tap')), requires: [], source: 'C7-L2-2', summary: 'Прудовые находки, закрытый кран и отсутствие мыльной пены.' },
      { id: 'c7-garden', title: 'C7-CL-garden', required: true, predicate: and(ne('who', 'kartofan'), ne('where', 'garden')), requires: [], source: 'C7-L2-3', summary: 'Поливалка сломана; вода шла со стороны пруда.' },
      { id: 'c7-timeline', title: 'C7-CL-timeline', required: true, predicate: and(ne('who', 'tyopa'), ne('what', 'barrels')), requires: [], source: 'C7-L2-4', summary: 'Тёпа закрыл бочки до дождя; дождь поднял пруд позже.' },
      { id: 'c7-chain', title: 'C7-CL-chain', required: true, predicate: and(eq('who', 'damka'), eq('what', 'unfinished'), ne('what', 'pipe')), requires: [], source: 'C7-L2-5', summary: 'Снятая створка начинает цепочку; «Тёпа варил мыло» лишнее.' },
      { id: 'c7-fountain', title: 'C7-CL-fountain', required: false, predicate: ne('what', 'tap'), requires: [], source: 'C7-5-C7-L2-HUB', summary: 'Мэр закрывал фонтан на ночь.' },
    ],
    version: { button: 'UI-hud.version', available: has.visited('C7-L2-6'), onSolved: 'C7-L2-7' },
    wrongVersion: { intro: [cl('C7-7-03')], byValue: [
      { axis: 'who', value: 'pudding', clues: ['c7-water'], lines: [cl('C7-7-04')] },
      { axis: 'who', value: 'kartofan', clues: ['c7-garden'], lines: [cl('C7-7-05')] },
      { axis: 'who', value: 'tyopa', clues: ['c7-water', 'c7-timeline'], lines: [cl('C7-L2-6-01')] },
      { axis: 'where', value: 'fountain', clues: ['c7-water'], lines: [cl('C7-7-04')] },
      { axis: 'where', value: 'garden', clues: ['c7-garden'], lines: [cl('C7-7-06')] },
      { axis: 'where', value: 'barrels', clues: ['c7-water', 'c7-timeline'], lines: [cl('C7-L2-6-01')] },
      { axis: 'what', value: 'tap', clues: ['c7-water'], lines: [cl('C7-7-04')] },
      { axis: 'what', value: 'pipe', clues: ['c7-chain'], lines: [cl('C7-7-07')] },
      { axis: 'what', value: 'barrels', clues: ['c7-timeline'], lines: [cl('C7-L2-6-01')] },
    ], outro: [cl('C7-7-08')] },
    redHerrings: [
      { id: 'rh-c7-fountain', summary: 'Фонтан кажется источником воды.', presentedBy: ['C7-1-01'], explainedBy: ['C7-8-10'] },
      { id: 'rh-c7-sprinkler', summary: 'Поливалка Картофана могла залить площадь.', presentedBy: ['C7-1-02', 'C7-3-01'], explainedBy: ['C7-8-11'] },
      { id: 'rh-c7-pipe', summary: 'Пудинг предполагает прорыв трубы.', presentedBy: ['C7-1-03'], explainedBy: ['C7-8-12'] },
      { id: 'rh-c7-barrels', summary: 'Бочки Тёпы могли опрокинуться.', presentedBy: ['C7-L2-1-01'], explainedBy: ['C7-L2-7-01', 'C7-L2-7-02'] },
    ],
  },
  notebookHelp: { mode: 'suggest', marks: [
    { axis: 'where', value: 'pond', mark: 'confirmed', clues: ['c7-water'], line: 'C7-NB-01' },
    { axis: 'where', value: 'fountain', mark: 'excluded', clues: ['c7-water'], line: 'C7-7-04' },
    { axis: 'where', value: 'barrels', mark: 'excluded', clues: ['c7-water'], line: 'C7-L2-2-03' },
    { axis: 'who', value: 'pudding', mark: 'excluded', clues: ['c7-water'], line: 'C7-7-04' },
    { axis: 'what', value: 'tap', mark: 'excluded', clues: ['c7-water'], line: 'C7-7-04' },
    { axis: 'who', value: 'kartofan', mark: 'excluded', clues: ['c7-garden'], line: 'C7-7-05' },
    { axis: 'where', value: 'garden', mark: 'excluded', clues: ['c7-garden'], line: 'C7-7-06' },
    { axis: 'who', value: 'tyopa', mark: 'excluded', clues: ['c7-timeline'], line: 'C7-L2-6-01' },
    { axis: 'what', value: 'barrels', mark: 'excluded', clues: ['c7-timeline'], line: 'C7-L2-6-01' },
    { axis: 'who', value: 'damka', mark: 'confirmed', clues: ['c7-chain'], line: 'C7-NB-02' },
    { axis: 'what', value: 'unfinished', mark: 'confirmed', clues: ['c7-chain'], line: 'C7-NB-03' },
    { axis: 'what', value: 'pipe', mark: 'excluded', clues: ['c7-chain'], line: 'C7-7-07' },
  ], pointers: [], nothing: 'UI-notebook.nothing' },
  hints: { klubok: { speaker: 'khvosts', precision: 'exact', allowance: 3, rules: [
    { id: 'C7-L2-H-01', when: not(has.clue('c7-water')), cites: [] },
    { id: 'C7-L2-H-02', when: not(has.clue('c7-garden')), cites: [] },
    { id: 'C7-L2-H-03', when: not(has.clue('c7-timeline')), cites: [] },
    { id: 'C7-L2-H-04', when: not(has.clue('c7-chain')), cites: [] },
    { id: 'C7-L2-H-05', when: has.visited('C7-L2-6'), cites: ['c7-water','c7-garden','c7-timeline','c7-chain'] },
  ], review: 'C7-L2-H-05', exhausted: 'UI-hint.klubokEmptyShell' }, shell: { speaker: 'watsony', precision: 'vague', allowance: null, rules: [
    { id: 'C7-L2-R-01', when: not(has.clue('c7-water')), cites: [] },
    { id: 'C7-L2-R-02', when: not(has.clue('c7-timeline')), cites: [] },
    { id: 'C7-L2-R-03', when: not(has.clue('c7-chain')), cites: [] },
  ], review: 'C7-L2-R-03', exhausted: null } },
  minigames: [
    { id: 'c7l2-water', skill: 'magnifier', config: { kind: 'magnifier', targets: [
      { id: 'duckweed', label: 'C7-2-B01', required: true, reply: ['C7-2-02'] }, { id: 'lily', label: 'C7-2-B02', required: true, reply: ['C7-2-03'] }, { id: 'tadpoles', label: 'C7-2-B03', required: true, reply: ['C7-2-04'] }, { id: 'foam', label: 'C7-L2-2-B01', required: true, reply: ['C7-L2-2-02'] },
    ], afterFirst: [], afterFirstSkill: null, assistAfterMisses: 3 } },
    { id: 'c7l2-cocoa', skill: 'cocoa', config: { kind: 'cocoa', rounds: [
      { id: 'r1', options: [opt('help', 'C7-3-B01', true, 'C7-3-04'), opt('carrot', 'C7-3-B02', true, 'C7-3-05'), opt('confess', 'C7-3-B03', false, 'C7-3-06')], retry: ['C7-3-07'] },
      { id: 'r2', options: [opt('show-water', 'C7-3-B04', true, 'C7-3-08'), opt('sprinkler', 'C7-3-B05', true, 'C7-3-09'), opt('blame', 'C7-3-B06', false, 'C7-3-10')], retry: ['C7-3-11'] },
      { id: 'r3', options: [opt('mayor', 'C7-L2-3-B01', true, 'C7-L2-3-01'), opt('where', 'C7-L2-3-B02', true, 'C7-L2-3-02'), opt('forgot', 'C7-L2-3-B03', false, 'C7-L2-3-03')], retry: ['C7-L2-3-04'] },
    ] } },
    { id: 'c7l2-timeline', skill: 'timeline', config: { kind: 'timeline', items: [
      { id: 't2200', time: '22:00', label: 'C7-L2-4-B01' }, { id: 't2300', time: '23:00', label: 'C7-L2-4-B02' }, { id: 't0200', time: '2:00', label: 'C7-L2-4-B03' }, { id: 't0500', time: '5:00', label: 'C7-L2-4-B04' },
    ], solution: ['t2200','t2300','t0200','t0500'], wrong: ['C7-6-03'] } },
    { id: 'c7l2-chain', skill: 'cause-chain', config: { kind: 'staged', mechanic: 'Цепочка причин', description: 'Найти лишнюю карточку и выстроить порядок.', steps: [
      { id: 'extra', prompt: 'C7-L2-5-01', pageSize: 3, options: [opt('soap', 'C7-L2-5-B01', true, 'C7-L2-5-02'), opt('gate', 'C7-6-B01', false, 'C7-6-03'), opt('rain', 'C7-6-B02', false, 'C7-6-03')] },
      { id: 'order', prompt: 'C7-6-01', pageSize: 3, options: [opt('gate', 'C7-6-B01', true), opt('rain', 'C7-6-B02', true), opt('pond', 'C7-6-B03', true), opt('ditch', 'C7-6-B04', true), opt('square', 'C7-6-B05', true)] },
    ], lines: ['C7-6-01','C7-6-02','C7-6-03','C7-L2-5-01','C7-L2-5-02'] } },
    { id: 'c7l2-repair', skill: 'dam-repair', config: { kind: 'staged', mechanic: 'Почини плотину', description: 'Четыре шага ремонта.', steps: [
      { id: 'start', prompt: 'C7-9-01', pageSize: 3, options: [opt('close', 'C7-9-B01', true, 'C7-9-02'), opt('scoop', 'C7-9-B02', false, 'C7-9-03'), opt('fence', 'C7-9-B03', false, 'C7-9-04')] },
      { id: 'log', prompt: null, pageSize: 3, options: [opt('short', 'C7-9-B04', false, 'C7-9-05'), opt('right', 'C7-9-B05', true, 'C7-9-06'), opt('long', 'C7-9-B06', false, 'C7-9-07')] },
      { id: 'support', prompt: null, pageSize: 3, options: [opt('stakes', 'C7-L2-8-B01', true, 'C7-L2-8-01'), opt('lay', 'C7-L2-8-B02', false, 'C7-L2-8-02'), opt('ribbon', 'C7-L2-8-B03', false, 'C7-L2-8-03')] },
      { id: 'water', prompt: null, pageSize: 3, options: [opt('pond', 'C7-9-B07', true, 'C7-9-08'), opt('leave', 'C7-9-B08', false, 'C7-9-09'), opt('garden', 'C7-9-B09', false, 'C7-9-10')] },
    ], lines: ['C7-9-02','C7-9-03','C7-9-04','C7-9-05','C7-9-06','C7-9-07','C7-9-08','C7-9-09','C7-9-10','C7-L2-8-01','C7-L2-8-02','C7-L2-8-03'] } },
  ], facts, glossary, rewards: ['rw-c7-heart-kartofan','rw-c7-badge','rw-c7-buttons-l2','rw-c7-sticker-l2','rw-c7-decor-lock','rw-c7-activity'], collections: commonCollections, activities: [activity], comfort: commonComfort, cutscenes: commonCutscenes, decisions: [...baseDecisions, { id: 'C7L2-D1', text: 'У3 и У4 размещены у шлюза после обязательной C7-4: сначала дождемер, затем цепочка с лишней карточкой.', ref: 'D03, R04' }],
  reserved: [],
};
