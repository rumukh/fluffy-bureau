// Case 7, level 1 (3×3×3). Explicit normalized variant.
import { all, cl, goto, has, L, menu, minigame, not, opt as mopt, reveal, seq, skill, when, type VariantSource } from '../../tools/content/dsl.ts';
import { activity, and, baseDecisions, cocoaScene, commonCollections, commonComfort, commonCutscenes, eq, facts, factsScene, glossary, intended, intro, mayorScene, ne, opt, repairScene, resolutionScene, rewardScene, secretScene, versionScene, waterScene, what, where, who } from './common.ts';

const HUB = 'C7-HUB';
const required = all(has.clue('c7-water'), has.clue('c7-garden'), has.clue('c7-chain'));

export const level1: VariantSource = {
  pack: 'case07-l1', kind: 'case', title: 'C7-TITLE', case: { number: 7, level: 1 }, start: 'C7-0',
  scenes: [
    { id: 'C7-0', title: 'Мокрое утро', location: 'office', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'dialogue', steps: [...intro(), goto(HUB)] },
    { id: HUB, title: 'Площадь: выбор', location: 'square-flood', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'hub', steps: [
      when(all(required, not(has.visited('C7-7'))), [goto('C7-7')]),
      menu('C7-M', null, [
        mopt('water', 'C7-1-B01', 'C7-2', { hideWhen: has.visited('C7-2') }),
        mopt('kartofan', 'C7-1-B02', 'C7-3', { hideWhen: has.visited('C7-3') }),
        mopt('more', 'UI-hud.map', 'C7-MORE', { hideWhen: all(has.visited('C7-5-C7-HUB'), has.visited('C7-4')) }),
      ]),
    ] },
    { id: 'C7-MORE', title: 'Площадь: ещё места', location: 'square-flood', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'hub', steps: [
      menu('C7-MORE-M', null, [
        mopt('mayor', 'C7-1-B03', 'C7-5-C7-HUB', { hideWhen: has.visited('C7-5-C7-HUB'), optional: true }),
        mopt('pond', 'C7-1-B04', 'C7-4', { when: { any: [has.clue('c7-water'), has.clue('c7-garden')] }, hideWhen: has.visited('C7-4') }),
        mopt('back', 'UI-hud.back', HUB),
      ], { back: HUB }),
    ] },
    waterScene('C7-2', 'c7l1-water', 'C7-2-01'),
    cocoaScene('C7-3', 'c7l1-cocoa', 1),
    secretScene('C7-4', 'C7-6'),
    { id: 'C7-6', title: '«Цепочка причин» у шлюза', location: 'honey-pond-lock', cast: ['khvosts', 'watsony'], presentation: 'minigame', steps: [skill('cause-chain', [L('C7-6-01'), L('C7-6-02')]), minigame('c7l1-chain'), ...seq('C7-6-', 4, 8), reveal('c7-chain'), goto(HUB)] },
    { ...versionScene('C7-7', HUB) },
    resolutionScene('C7-8', 'C7-9'),
    repairScene('C7-9', 'c7l1-repair', 1),
    factsScene(), rewardScene(1),
    mayorScene(HUB),
  ],
  logic: {
    axes: [
      { id: 'who', title: 'C7-AX-who', values: [who.damka, who.pudding, who.kartofan] },
      { id: 'where', title: 'C7-AX-where', values: [where.pond, where.fountain, where.garden] },
      { id: 'what', title: 'C7-AX-what', values: [what.unfinished, what.tap, what.pipe] },
    ], intended,
    clues: [
      { id: 'c7-water', title: 'C7-CL-water', required: true, predicate: and(eq('where', 'pond'), ne('who', 'pudding'), ne('what', 'tap')), requires: [], source: 'C7-2', summary: 'В луже ряска, кувшинка и головастики; фонтан закрыт и чист.' },
      { id: 'c7-garden', title: 'C7-CL-garden', required: true, predicate: and(ne('who', 'kartofan'), ne('where', 'garden')), requires: [], source: 'C7-3', summary: 'Поливалка сломана неделю; огород тоже залило со стороны пруда.' },
      { id: 'c7-chain', title: 'C7-CL-chain', required: true, predicate: and(eq('who', 'damka'), eq('what', 'unfinished'), ne('what', 'pipe')), requires: [], source: 'C7-6', summary: 'Старая створка снята, новой нет; чертёж водяного салюта и инструменты бобра.' },
      { id: 'c7-fountain', title: 'C7-CL-fountain', required: false, predicate: ne('what', 'tap'), requires: [], source: 'C7-5-C7-HUB', summary: 'Мэр говорит, что закрывает фонтан на ночь; кран проверяют.' },
    ],
    version: { button: 'UI-hud.version', available: has.visited('C7-7'), onSolved: 'C7-8' },
    wrongVersion: { intro: [cl('C7-7-03')], byValue: [
      { axis: 'who', value: 'pudding', clues: ['c7-water'], lines: [cl('C7-7-04')] },
      { axis: 'who', value: 'kartofan', clues: ['c7-garden'], lines: [cl('C7-7-05')] },
      { axis: 'where', value: 'fountain', clues: ['c7-water'], lines: [cl('C7-7-04')] },
      { axis: 'where', value: 'garden', clues: ['c7-garden'], lines: [cl('C7-7-06')] },
      { axis: 'what', value: 'tap', clues: ['c7-water'], lines: [cl('C7-7-04')] },
      { axis: 'what', value: 'pipe', clues: ['c7-chain'], lines: [cl('C7-7-07')] },
    ], outro: [cl('C7-7-08')] },
    redHerrings: [
      { id: 'rh-c7-fountain', summary: 'Фонтан кажется источником воды.', presentedBy: ['C7-1-01'], explainedBy: ['C7-8-10'] },
      { id: 'rh-c7-sprinkler', summary: 'Поливалка Картофана могла залить площадь.', presentedBy: ['C7-1-02', 'C7-3-01'], explainedBy: ['C7-8-11'] },
      { id: 'rh-c7-pipe', summary: 'Пудинг предполагает прорыв трубы.', presentedBy: ['C7-1-03'], explainedBy: ['C7-8-12'] },
    ],
  },
  notebookHelp: { mode: 'suggest', marks: [
    { axis: 'where', value: 'pond', mark: 'confirmed', clues: ['c7-water'], line: 'C7-NB-01' },
    { axis: 'where', value: 'fountain', mark: 'excluded', clues: ['c7-water'], line: 'C7-7-04' },
    { axis: 'who', value: 'pudding', mark: 'excluded', clues: ['c7-water'], line: 'C7-7-04' },
    { axis: 'what', value: 'tap', mark: 'excluded', clues: ['c7-water'], line: 'C7-7-04' },
    { axis: 'who', value: 'kartofan', mark: 'excluded', clues: ['c7-garden'], line: 'C7-7-05' },
    { axis: 'where', value: 'garden', mark: 'excluded', clues: ['c7-garden'], line: 'C7-7-06' },
    { axis: 'who', value: 'damka', mark: 'confirmed', clues: ['c7-chain'], line: 'C7-NB-02' },
    { axis: 'what', value: 'unfinished', mark: 'confirmed', clues: ['c7-chain'], line: 'C7-NB-03' },
    { axis: 'what', value: 'pipe', mark: 'excluded', clues: ['c7-chain'], line: 'C7-7-07' },
  ], pointers: [], nothing: 'UI-notebook.nothing' },
  hints: { klubok: { speaker: 'khvosts', precision: 'exact', allowance: 3, rules: [
    { id: 'C7-H-01', when: not(has.clue('c7-water')), cites: [] },
    { id: 'C7-H-02', when: not(has.clue('c7-garden')), cites: [] },
    { id: 'C7-H-03', when: all(has.clue('c7-water'), not(has.clue('c7-chain'))), cites: ['c7-water'] },
    { id: 'C7-H-04', when: all(has.clue('c7-garden'), not(has.clue('c7-chain'))), cites: ['c7-garden'] },
    { id: 'C7-H-06', when: has.visited('C7-7'), cites: ['c7-water', 'c7-garden', 'c7-chain'] },
  ], review: 'C7-H-05', exhausted: 'UI-hint.klubokEmptyShell' }, shell: { speaker: 'watsony', precision: 'exact', allowance: null, rules: [
    { id: 'C7-R-01', when: not(has.clue('c7-water')), cites: [] },
    { id: 'C7-R-02', when: not(has.clue('c7-garden')), cites: [] },
    { id: 'C7-R-03', when: not(has.clue('c7-chain')), cites: [] },
    { id: 'C7-R-04', when: has.visited('C7-7'), cites: ['c7-water', 'c7-garden', 'c7-chain'] },
  ], review: 'C7-R-03', exhausted: null } },
  minigames: [
    { id: 'c7l1-water', skill: 'magnifier', config: { kind: 'magnifier', targets: [
      { id: 'duckweed', label: 'C7-2-B01', required: true, reply: ['C7-2-02'] },
      { id: 'lily', label: 'C7-2-B02', required: true, reply: ['C7-2-03'] },
      { id: 'tadpoles', label: 'C7-2-B03', required: true, reply: ['C7-2-04'] },
    ], afterFirst: [], afterFirstSkill: null, assistAfterMisses: 3 } },
    { id: 'c7l1-cocoa', skill: 'cocoa', config: { kind: 'cocoa', rounds: [
      { id: 'r1', options: [opt('help', 'C7-3-B01', true, 'C7-3-04'), opt('carrot', 'C7-3-B02', true, 'C7-3-05'), opt('confess', 'C7-3-B03', false, 'C7-3-06')], retry: ['C7-3-07'] },
      { id: 'r2', options: [opt('show-water', 'C7-3-B04', true, 'C7-3-08'), opt('sprinkler', 'C7-3-B05', true, 'C7-3-09'), opt('blame', 'C7-3-B06', false, 'C7-3-10')], retry: ['C7-3-11'] },
    ] } },
    { id: 'c7l1-chain', skill: 'cause-chain', config: { kind: 'staged', mechanic: 'Цепочка причин', description: 'Поставить пять причин и следствий по порядку.', steps: [
      { id: 'order', prompt: 'C7-6-01', pageSize: 3, options: [opt('gate', 'C7-6-B01', true, 'C7-6-04'), opt('rain', 'C7-6-B02', true), opt('pond', 'C7-6-B03', true), opt('ditch', 'C7-6-B04', true), opt('square', 'C7-6-B05', true), opt('wrong', 'C7-9-B02', false, 'C7-6-03')] },
    ], lines: ['C7-6-01', 'C7-6-02', 'C7-6-03'] } },
    { id: 'c7l1-repair', skill: 'dam-repair', config: { kind: 'staged', mechanic: 'Почини плотину', description: 'Выбрать причину, подходящее бревно и путь воды.', steps: [
      { id: 'start', prompt: 'C7-9-01', pageSize: 3, options: [opt('close', 'C7-9-B01', true, 'C7-9-02'), opt('scoop', 'C7-9-B02', false, 'C7-9-03'), opt('fence', 'C7-9-B03', false, 'C7-9-04')] },
      { id: 'log', prompt: null, pageSize: 3, options: [opt('short', 'C7-9-B04', false, 'C7-9-05'), opt('right', 'C7-9-B05', true, 'C7-9-06'), opt('long', 'C7-9-B06', false, 'C7-9-07')] },
      { id: 'water', prompt: null, pageSize: 3, options: [opt('pond', 'C7-9-B07', true, 'C7-9-08'), opt('leave', 'C7-9-B08', false, 'C7-9-09'), opt('garden', 'C7-9-B09', false, 'C7-9-10')] },
    ], lines: ['C7-9-02','C7-9-03','C7-9-04','C7-9-05','C7-9-06','C7-9-07','C7-9-08','C7-9-09','C7-9-10'] } },
  ], facts, glossary, rewards: ['rw-c7-heart-kartofan','rw-c7-badge','rw-c7-buttons-l1','rw-c7-sticker-l1','rw-c7-decor-lock','rw-c7-activity'], collections: commonCollections, activities: [activity], comfort: commonComfort, cutscenes: [], plannedCutscenes: commonCutscenes, decisions: [...baseDecisions, { id: 'C7L1-D1', text: 'C7-5 оставлена необязательной уликой о фонтане; обязательная У1 уже проверяет кран.', ref: 'D01, Q16' }],
  reserved: [],
};
