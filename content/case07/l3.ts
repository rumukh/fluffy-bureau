// Case 7, level 3 (5×5×4). Explicit normalized variant.
import { all, cl, goto, has, L, menu, minigame, not, opt as mopt, reveal, seq, skill, when, type VariantSource } from '../../tools/content/dsl.ts';
import { activity, and, baseDecisions, cocoaScene, commonCollections, commonComfort, commonCutscenes, eq, facts, factsScene, glossary, intended, intro, mayorScene, ne, opt, repairScene, resolutionScene, rewardScene, secretScene, versionScene, waterScene, what, where, who } from './common.ts';

const HUB = 'C7-L3-HUB';
const required = all(has.clue('c7-water'), has.clue('c7-garden'), has.clue('c7-timeline'), has.clue('c7-tracks'), has.clue('c7-chain'));

export const level3: VariantSource = {
  pack: 'case07-l3', kind: 'case', title: 'C7-TITLE', case: { number: 7, level: 3 }, start: 'C7-L3-1',
  scenes: [
    { id: 'C7-L3-1', title: 'Мокрое утро', location: 'office', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'dialogue', steps: [...intro([L('C7-L2-1-01'), L('C7-L3-1-01'), L('C7-L3-1-02')]), goto(HUB)] },
    { id: HUB, title: 'Площадь: выбор', location: 'square-flood', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'hub', steps: [
      when(all(required, not(has.visited('C7-L3-7'))), [goto('C7-L3-7')]),
      menu('C7-L3-M', null, [
        mopt('water', 'C7-1-B01', 'C7-L3-2', { hideWhen: has.visited('C7-L3-2') }),
        mopt('kartofan', 'C7-1-B02', 'C7-L3-3', { hideWhen: has.visited('C7-L3-3') }),
        mopt('more', 'UI-hud.map', 'C7-L3-MORE', { hideWhen: all(has.visited('C7-5-C7-L3-HUB'), has.visited('C7-4'), has.visited('C7-L3-5'), has.visited('C7-L3-6')) }),
      ]),
    ] },
    { id: 'C7-L3-MORE', title: 'Площадь: ещё места', location: 'square-flood', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'hub', steps: [
      menu('C7-L3-MORE-M', null, [
        mopt('mayor', 'C7-1-B03', 'C7-5-C7-L3-HUB', { hideWhen: has.visited('C7-5-C7-L3-HUB'), optional: true }),
        mopt('pond', 'C7-1-B04', 'C7-4', { when: { any: [has.clue('c7-water'), has.clue('c7-garden')] }, hideWhen: has.visited('C7-4') }),
        mopt('tracks', 'C7-L3-H-03', 'C7-L3-5', { when: has.clue('c7-timeline'), hideWhen: has.visited('C7-L3-5') }),
        mopt('chain', 'C7-4-B01', 'C7-L3-6', { when: has.clue('c7-tracks'), hideWhen: has.visited('C7-L3-6') }),
      ], { back: HUB }),
    ] },
    waterScene('C7-L3-2', 'c7l3-water', 'C7-L3-2-01', [L('C7-L2-2-03')]),
    cocoaScene('C7-L3-3', 'c7l3-cocoa', 3),
    secretScene('C7-4', 'C7-L3-4', true),
    { id: 'C7-L3-4', title: '«Лента времени»: дождемер', location: 'honey-pond-lock', cast: ['stella', 'khvosts', 'watsony'], presentation: 'minigame', steps: [L('C7-L3-4-01'), skill('timeline', [L('C7-L2-4-01')], [L('C7-L2-4-01')]), minigame('c7l3-timeline'), L('C7-L3-4-02'), L('C7-L3-4-03'), L('C7-L2-4-02'), L('C7-L2-4-03'), reveal('c7-timeline'), goto(HUB)] },
    { id: 'C7-L3-5', title: '«Кто наследил?» у шлюза', location: 'honey-pond-lock', cast: ['khvosts', 'watsony'], presentation: 'minigame', steps: [L('C7-L3-5-01'), skill('tracks', []), minigame('c7l3-tracks'), L('C7-L3-5-06'), L('C7-L3-5-07'), reveal('c7-tracks'), goto(HUB)] },
    { id: 'C7-L3-6', title: '«Цепочка причин»', location: 'honey-pond-lock', cast: ['khvosts', 'watsony'], presentation: 'minigame', steps: [skill('cause-chain', [L('C7-6-01'), L('C7-6-02')]), L('C7-L3-6-01'), minigame('c7l3-chain'), L('C7-L2-5-02'), L('C7-L3-6-02'), ...seq('C7-6-', 4, 5), L('C7-L3-6-03'), L('C7-6-07'), L('C7-6-08'), reveal('c7-chain'), goto(HUB)] },
    versionScene('C7-L3-7', HUB),
    resolutionScene('C7-L3-8', 'C7-L3-9', [L('C7-L2-7-01'), L('C7-L2-7-02'), L('C7-L3-8-01'), L('C7-L3-8-02')]),
    repairScene('C7-L3-9', 'c7l3-repair', 3),
    factsScene(), rewardScene(3), mayorScene(HUB),
  ],
  logic: {
    axes: [
      { id: 'who', title: 'C7-AX-who', values: [who.damka, who.pudding, who.kartofan, who.tyopa, who.stella] },
      { id: 'where', title: 'C7-AX-where', values: [where.pond, where.fountain, where.garden, where.barrels, where.drain] },
      { id: 'what', title: 'C7-AX-what', values: [what.unfinished, what.tap, what.pipe, what.barrels] },
    ], intended,
    clues: [
      { id: 'c7-water', title: 'C7-CL-water', required: true, predicate: and(eq('where', 'pond'), ne('where', 'barrels'), ne('where', 'drain'), ne('who', 'pudding'), ne('who', 'stella'), ne('what', 'tap')), requires: [], source: 'C7-L3-2', summary: 'Прудовые находки, нет пены, сухо под водостоком.' },
      { id: 'c7-garden', title: 'C7-CL-garden', required: true, predicate: and(ne('who', 'kartofan'), ne('where', 'garden')), requires: [], source: 'C7-L3-3', summary: 'Поливалка сломана; вода шла со стороны пруда.' },
      { id: 'c7-timeline', title: 'C7-CL-timeline', required: true, predicate: and(ne('who', 'tyopa'), ne('what', 'barrels')), requires: [], source: 'C7-L3-4', summary: 'Бочки закрыты до дождя; Стелла чистила водосток днём.' },
      { id: 'c7-tracks', title: 'C7-CL-tracks', required: true, predicate: eq('who', 'damka'), requires: [], source: 'C7-L3-5', summary: 'У шлюза бобровые следы: перепонки и хвост-лопата.' },
      { id: 'c7-chain', title: 'C7-CL-chain', required: true, predicate: and(eq('what', 'unfinished'), ne('what', 'pipe')), requires: [], source: 'C7-L3-6', summary: 'Цепочка показывает снятую створку; две лишние карточки убраны.' },
      { id: 'c7-fountain', title: 'C7-CL-fountain', required: false, predicate: ne('what', 'tap'), requires: [], source: 'C7-5-C7-L3-HUB', summary: 'Мэр закрывал фонтан на ночь.' },
    ],
    version: { button: 'UI-hud.version', available: has.visited('C7-L3-7'), onSolved: 'C7-L3-8' },
    wrongVersion: { intro: [cl('C7-7-03')], byValue: [
      { axis: 'who', value: 'pudding', clues: ['c7-water'], lines: [cl('C7-7-04')] },
      { axis: 'who', value: 'kartofan', clues: ['c7-garden'], lines: [cl('C7-7-05')] },
      { axis: 'who', value: 'tyopa', clues: ['c7-water', 'c7-timeline'], lines: [cl('C7-L2-6-01')] },
      { axis: 'who', value: 'stella', clues: ['c7-water'], lines: [cl('C7-L3-7-01')] },
      { axis: 'where', value: 'fountain', clues: ['c7-water'], lines: [cl('C7-7-04')] },
      { axis: 'where', value: 'garden', clues: ['c7-garden'], lines: [cl('C7-7-06')] },
      { axis: 'where', value: 'barrels', clues: ['c7-water', 'c7-timeline'], lines: [cl('C7-L2-6-01')] },
      { axis: 'where', value: 'drain', clues: ['c7-water'], lines: [cl('C7-L3-7-01')] },
      { axis: 'what', value: 'tap', clues: ['c7-water'], lines: [cl('C7-7-04')] },
      { axis: 'what', value: 'pipe', clues: ['c7-chain'], lines: [cl('C7-7-07')] },
      { axis: 'what', value: 'barrels', clues: ['c7-timeline'], lines: [cl('C7-L2-6-01')] },
    ], outro: [cl('C7-7-08')] },
    redHerrings: [
      { id: 'rh-c7-fountain', summary: 'Фонтан кажется источником воды.', presentedBy: ['C7-1-01'], explainedBy: ['C7-8-10'] },
      { id: 'rh-c7-sprinkler', summary: 'Поливалка Картофана могла залить площадь.', presentedBy: ['C7-1-02', 'C7-3-01'], explainedBy: ['C7-8-11'] },
      { id: 'rh-c7-pipe', summary: 'Пудинг предполагает прорыв трубы.', presentedBy: ['C7-1-03'], explainedBy: ['C7-8-12'] },
      { id: 'rh-c7-barrels', summary: 'Бочки Тёпы могли опрокинуться.', presentedBy: ['C7-L2-1-01'], explainedBy: ['C7-L2-7-01', 'C7-L2-7-02'] },
      { id: 'rh-c7-drain', summary: 'Стелла могла залить площадь через водосток.', presentedBy: ['C7-L3-1-01', 'C7-L3-1-02'], explainedBy: ['C7-L3-8-01', 'C7-L3-8-02'] },
    ],
  },
  notebookHelp: { mode: 'point', marks: [
    { axis: 'where', value: 'pond', mark: 'confirmed', clues: ['c7-water'], line: 'C7-NB-01' },
    { axis: 'where', value: 'fountain', mark: 'excluded', clues: ['c7-water'], line: 'C7-7-04' },
    { axis: 'where', value: 'barrels', mark: 'excluded', clues: ['c7-water'], line: 'C7-L2-2-03' },
    { axis: 'where', value: 'drain', mark: 'excluded', clues: ['c7-water'], line: 'C7-L3-7-01' },
    { axis: 'who', value: 'pudding', mark: 'excluded', clues: ['c7-water'], line: 'C7-7-04' },
    { axis: 'who', value: 'stella', mark: 'excluded', clues: ['c7-water'], line: 'C7-L3-7-01' },
    { axis: 'what', value: 'tap', mark: 'excluded', clues: ['c7-water'], line: 'C7-7-04' },
    { axis: 'who', value: 'kartofan', mark: 'excluded', clues: ['c7-garden'], line: 'C7-7-05' },
    { axis: 'where', value: 'garden', mark: 'excluded', clues: ['c7-garden'], line: 'C7-7-06' },
    { axis: 'who', value: 'tyopa', mark: 'excluded', clues: ['c7-timeline'], line: 'C7-L2-6-01' },
    { axis: 'what', value: 'barrels', mark: 'excluded', clues: ['c7-timeline'], line: 'C7-L2-6-01' },
    { axis: 'who', value: 'damka', mark: 'confirmed', clues: ['c7-tracks'], line: 'C7-NB-02' },
    { axis: 'what', value: 'unfinished', mark: 'confirmed', clues: ['c7-chain'], line: 'C7-NB-03' },
    { axis: 'what', value: 'pipe', mark: 'excluded', clues: ['c7-chain'], line: 'C7-7-07' },
  ], pointers: [
    { clue: 'c7-water', line: 'C7-L3-NB-01' }, { clue: 'c7-garden', line: 'C7-L3-NB-02' }, { clue: 'c7-timeline', line: 'C7-L3-NB-03' }, { clue: 'c7-tracks', line: 'C7-L3-NB-04' }, { clue: 'c7-chain', line: 'C7-L3-NB-05' },
  ], nothing: 'UI-notebook.nothing' },
  hints: { klubok: { speaker: 'khvosts', precision: 'exact', allowance: 3, rules: [
    { id: 'C7-L3-H-01', when: not(has.clue('c7-water')), cites: [] },
    { id: 'C7-L3-H-05', when: not(has.clue('c7-garden')), cites: [] },
    { id: 'C7-L3-H-02', when: not(has.clue('c7-timeline')), cites: [] },
    { id: 'C7-L3-H-03', when: not(has.clue('c7-tracks')), cites: [] },
    { id: 'C7-L3-H-04', when: not(has.clue('c7-chain')), cites: [] },
    { id: 'C7-L3-H-06', when: has.visited('C7-L3-7'), cites: ['c7-water','c7-garden','c7-timeline','c7-tracks','c7-chain'] },
  ], review: 'C7-L3-H-06', exhausted: 'UI-hint.klubokEmpty' }, shell: null },
  minigames: [
    { id: 'c7l3-water', skill: 'magnifier', config: { kind: 'magnifier', targets: [
      { id: 'duckweed', label: 'C7-2-B01', required: true, reply: ['C7-2-02'] }, { id: 'lily', label: 'C7-2-B02', required: true, reply: ['C7-2-03'] }, { id: 'tadpoles', label: 'C7-2-B03', required: true, reply: ['C7-2-04'] }, { id: 'foam', label: 'C7-L2-2-B01', required: true, reply: ['C7-L2-2-02'] }, { id: 'drain', label: 'C7-L3-2-B01', required: true, reply: ['C7-L3-2-02','C7-L3-2-03'] },
    ], afterFirst: [], afterFirstSkill: null, assistAfterMisses: 3 } },
    { id: 'c7l3-cocoa', skill: 'cocoa', config: { kind: 'cocoa', rounds: [
      { id: 'r1', options: [opt('help', 'C7-3-B01', true, 'C7-3-04'), opt('carrot', 'C7-3-B02', true, 'C7-3-05'), opt('confess', 'C7-3-B03', false, 'C7-3-06')], retry: ['C7-3-07'] },
      { id: 'r2', options: [opt('show-water', 'C7-3-B04', true, 'C7-3-08'), opt('sprinkler', 'C7-3-B05', true, 'C7-3-09'), opt('blame', 'C7-3-B06', false, 'C7-3-10')], retry: ['C7-3-11'] },
      { id: 'r3', options: [opt('mayor', 'C7-L2-3-B01', true, 'C7-L2-3-01'), opt('where', 'C7-L2-3-B02', true, 'C7-L2-3-02'), opt('forgot', 'C7-L2-3-B03', false, 'C7-L2-3-03')], retry: ['C7-L2-3-04'] },
    ] } },
    { id: 'c7l3-timeline', skill: 'timeline', config: { kind: 'timeline', items: [
      { id: 't1600', time: '16:00', label: 'C7-L3-4-B01' }, { id: 't2200', time: '22:00', label: 'C7-L2-4-B01' }, { id: 't2300', time: '23:00', label: 'C7-L2-4-B02' }, { id: 't0200', time: '2:00', label: 'C7-L2-4-B03' }, { id: 't0500', time: '5:00', label: 'C7-L2-4-B04' },
    ], solution: ['t1600','t2200','t2300','t0200','t0500'], wrong: ['C7-6-03'] } },
    { id: 'c7l3-tracks', skill: 'tracks', config: { kind: 'tracks', steps: [{ id: 'beaver', prompt: null, pageSize: 3, options: [opt('raccoon','C7-L3-5-B01', false, 'C7-L3-5-03'), opt('mole','C7-L3-5-B02', false, 'C7-L3-5-04'), opt('beaver','C7-L3-5-B03', true, 'C7-L3-5-02'), opt('magpie','C7-L3-5-B04', false, 'C7-L3-5-05')] }], question: null } },
    { id: 'c7l3-chain', skill: 'cause-chain', config: { kind: 'staged', mechanic: 'Цепочка причин', description: 'Найти две лишние карточки и выстроить порядок.', steps: [
      { id: 'extra', prompt: 'C7-L3-6-01', pageSize: 3, options: [opt('soap', 'C7-L2-5-B01', true, 'C7-L2-5-02'), opt('drain', 'C7-L3-6-B01', true, 'C7-L3-6-02'), opt('gate', 'C7-6-B01', false, 'C7-6-03')] },
      { id: 'order', prompt: 'C7-6-01', pageSize: 3, options: [opt('gate', 'C7-6-B01', true), opt('rain', 'C7-6-B02', true), opt('pond', 'C7-6-B03', true), opt('ditch', 'C7-6-B04', true), opt('square', 'C7-6-B05', true)] },
    ], lines: ['C7-6-01','C7-6-02','C7-6-03','C7-L3-6-01','C7-L2-5-02','C7-L3-6-02'] } },
    { id: 'c7l3-repair', skill: 'dam-repair', config: { kind: 'staged', mechanic: 'Почини плотину', description: 'Четыре шага ремонта, бревно складывается из двух частей.', steps: [
      { id: 'start', prompt: 'C7-9-01', pageSize: 3, options: [opt('close', 'C7-9-B01', true, 'C7-9-02'), opt('scoop', 'C7-9-B02', false, 'C7-9-03'), opt('fence', 'C7-9-B03', false, 'C7-9-04')] },
      { id: 'log', prompt: 'C7-L3-9-01', pageSize: 3, options: [opt('one-four', 'C7-L3-9-B01', true, 'C7-L3-9-02'), opt('two-three', 'C7-L3-9-B02', true, 'C7-L3-9-02'), opt('one-two', 'C7-L3-9-B03', false, 'C7-L3-9-03')] },
      { id: 'support', prompt: null, pageSize: 3, options: [opt('stakes', 'C7-L2-8-B01', true, 'C7-L2-8-01'), opt('lay', 'C7-L2-8-B02', false, 'C7-L2-8-02'), opt('ribbon', 'C7-L2-8-B03', false, 'C7-L2-8-03')] },
      { id: 'water', prompt: null, pageSize: 3, options: [opt('pond', 'C7-9-B07', true, 'C7-9-08'), opt('leave', 'C7-9-B08', false, 'C7-9-09'), opt('garden', 'C7-9-B09', false, 'C7-9-10')] },
    ], lines: ['C7-9-02','C7-9-03','C7-9-04','C7-L3-9-01','C7-L3-9-02','C7-L3-9-03','C7-L2-8-01','C7-L2-8-02','C7-L2-8-03','C7-9-08','C7-9-09','C7-9-10'] } },
  ], facts, glossary, rewards: ['rw-c7-heart-kartofan','rw-c7-badge','rw-c7-buttons-l3','rw-c7-sticker-l3','rw-c7-decor-lock','rw-c7-activity'], collections: commonCollections, activities: [activity], comfort: commonComfort, cutscenes: commonCutscenes, decisions: [...baseDecisions, { id: 'C7L3-D1', text: 'В C7-4 и C7-L3-5 инструменты Дамки отсутствуют; автора указывает только след бобра и чертёж.', ref: 'R04' }, { id: 'C7L3-D2', text: 'C7-6-06 не используется на сложности 3, потому что упоминало инструменты Дамки; заменено на C7-L3-6-03.', ref: 'R04' }],
  reserved: [],
};
