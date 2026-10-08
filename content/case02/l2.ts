import { all, cl, goto, has, L, Ls, menu, minigame, not, opt as mopt, reveal, reward, seq, skill, when, type VariantSource } from '../../tools/content/dsl.ts';
import { activityCard, and, baseDecisions, choice, commonCutscenes, eq, facts, factsScene, glossary, intended, intro0, intro1base, klubkiIntro, ne, notebookIntro, resolutionSteps, rewardScene, versionScene, what, where, who } from './common.ts';

const HUB = 'C2-L2-HUB';
const allClues = all(has.clue('c2-l2-lupa'), has.clue('c2-l2-cipher'), has.clue('c2-l2-cocoa'), has.clue('c2-l2-timeline'));

export const level2: VariantSource = {
  pack: 'case02-l2', kind: 'case', title: 'C2-TITLE', case: { number: 2, level: 2 }, start: 'C2-0',
  scenes: [
    { id: 'C2-0', title: 'Контора: письма не пришли', location: 'office', cast: ['khvosts', 'watsony', 'pudding'], presentation: 'cutscene', steps: [...intro0(), goto('C2-L2-1')] },
    { id: 'C2-L2-1', title: 'Завязка', location: 'post-office', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'dialogue', steps: [
      ...intro1base(), ...seq('C2-L2-1-', 1, 3), ...notebookIntro('C2-L2-1-D01'), ...Ls('C2-L2-1-04', 'C2-L2-1-05', 'C2-1-12', 'C2-1-13'), klubkiIntro(), goto(HUB),
    ] },
    { id: HUB, title: 'Почта: выбор', location: 'post-office', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'hub', steps: [
      when(all(allClues, not(has.visited('C2-L2-6'))), [goto('C2-L2-6')]),
      menu('C2-L2-M', null, [
        mopt('porch', 'C2-1-B01', 'C2-L2-2', { hideWhen: has.visited('C2-L2-2') }),
        mopt('mice', 'C2-1-B02', 'C2-L2-3', { hideWhen: has.visited('C2-L2-3') }),
        mopt('mayor', 'C2-1-B03', 'C2-5', { hideWhen: has.visited('C2-5'), optional: true }),
        mopt('cipher', 'C2-2-B04', 'C2-L2-4', { when: has.clue('c2-l2-lupa'), hideWhen: has.visited('C2-L2-4') }),
        mopt('clock', 'C2-L2-4-B02', 'C2-L2-5', { when: has.clue('c2-l2-cipher'), hideWhen: has.visited('C2-L2-5') }),
      ]),
    ] },
    { id: 'C2-L2-2', title: 'Лупа: четыре мелочи', location: 'post-porch', cast: ['khvosts', 'watsony'], presentation: 'minigame', steps: [skill('magnifier', [L('C2-L2-2-01')]), minigame('c2l2-lupa'), L('C2-2-05'), L('C2-2-06'), reveal('c2-l2-lupa'), goto(HUB)] },
    { id: 'C2-L2-3', title: 'Шуршики: «Чашка какао»', location: 'library-door', cast: ['mouse', 'khvosts', 'watsony'], presentation: 'minigame', steps: [
      ...seq('C2-4-', 1, 2), skill('cocoa', [L('C2-4-03')]), minigame('c2l2-cocoa'), reward('rw-c2-heart-mice'), ...seq('C2-4-', 12, 16), ...seq('C2-L2-3-', 5, 11), L('C2-4-19'), L('C2-4-20'), reveal('c2-l2-cocoa'), goto(HUB),
    ] },
    { id: 'C2-5', title: 'Разговор с мэром', location: 'post-office', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'dialogue', steps: [...seq('C2-5-', 1, 4), reveal('c2-l2-mayor'), goto(HUB)] },
    { id: 'C2-L2-4', title: 'Шифр на пуговицах', location: 'post-office', cast: ['khvosts', 'watsony'], presentation: 'minigame', steps: [
      skill('button-cipher', seq('C2-3-', 1, 3), [L('C2-L2-4-01')]), minigame('c2l2-cipher'), ...Ls('C2-L2-4-02', 'C2-L2-4-03', 'C2-3-06', 'C2-3-07', 'C2-3-08', 'C2-3-09', 'C2-3-10', 'C2-3-11', 'C2-L2-4-04'), reveal('c2-l2-cipher'), goto(HUB),
    ] },
    { id: 'C2-L2-5', title: 'Почтовые часы', location: 'post-clock', cast: ['khvosts', 'watsony'], presentation: 'minigame', steps: [
      skill('timeline', Ls('C2-L2-5-N01', 'C2-L2-5-N02'), [L('C2-L2-5-01')]), minigame('c2l2-timeline'), ...seq('C2-L2-5-', 2, 4), reveal('c2-l2-timeline'), goto(HUB),
    ] },
    versionScene('C2-L2-6', HUB),
    { id: 'C2-L2-7', title: 'Парк Старого Дуба', location: 'old-oak', cast: ['stella', 'pudding', 'mouse', 'damka', 'khvosts', 'watsony'], presentation: 'cutscene', steps: resolutionSteps([...seq('C2-L2-7-', 1, 4)], 'C2-L2-8') },
    { id: 'C2-L2-8', title: 'Почтальон: сумма пуговиц', location: 'town-square', cast: ['stella', 'pudding', 'tyopa'], presentation: 'minigame', steps: [skill('postal', Ls('C2-L2-8-01', 'C2-L2-8-02')), minigame('c2l2-postal'), ...seq('C2-8-', 5, 8), goto('C2-9')] },
    factsScene('C2-10'), rewardScene(2),
  ],
  logic: { axes: [
    { id: 'who', title: 'C2-AX-who', values: [who.stella, who.mouse, who.pudding, who.damka] },
    { id: 'where', title: 'C2-AX-where', values: [where.porch, where.nest, where.hole, where.duplo] },
    { id: 'what', title: 'C2-AX-what', values: [what.rain, what.sparkle, what.lost, what.flags] },
  ], intended, clues: [
    { id: 'c2-l2-lupa', title: 'C2-CL-lupa', required: true, predicate: { op: 'in', axis: 'what', values: ['rain', 'sparkle', 'lost', 'flags'] }, requires: [], source: 'C2-L2-2', summary: 'Зонт, перо, записка и газетный обрывок.' },
    { id: 'c2-l2-cipher', title: 'C2-CL-cipher-oak', required: true, predicate: and(eq('what', 'rain'), ne('where', 'porch'), ne('where', 'hole'), ne('what', 'sparkle'), ne('what', 'lost')), requires: ['c2-l2-lupa'], source: 'C2-L2-4', summary: 'В записке: на дуб, скоро дождь.' },
    { id: 'c2-l2-cocoa', title: 'C2-CL-cocoa', required: true, predicate: and(ne('who', 'mouse'), ne('who', 'pudding'), eq('where', 'nest'), ne('where', 'duplo'), ne('what', 'flags')), requires: [], source: 'C2-L2-3', summary: 'Флажки из газет; сорока летела на верхушку дуба; мышата и мэр с алиби.' },
    { id: 'c2-l2-timeline', title: 'C2-CL-timeline', required: true, predicate: ne('who', 'damka'), requires: ['c2-l2-cipher'], source: 'C2-L2-5', summary: 'Дамка ушла к пруду до сумки и несла кору.' },
    { id: 'c2-l2-mayor', title: 'C2-CL-mayor', required: false, predicate: ne('who', 'pudding'), requires: [], source: 'C2-5', summary: 'Мэр был в библиотеке.' },
  ], version: { button: 'UI-hud.version', available: has.visited('C2-L2-6'), onSolved: 'C2-L2-7' }, wrongVersion: { intro: [cl('C2-6-03')], byValue: [
    { axis: 'who', value: 'mouse', clues: ['c2-l2-cocoa'], lines: [cl('C2-6-04')] }, { axis: 'who', value: 'pudding', clues: ['c2-l2-cocoa'], lines: [cl('C2-6-05')] }, { axis: 'who', value: 'damka', clues: ['c2-l2-timeline'], lines: [cl('C2-L2-6-01')] },
    { axis: 'where', value: 'porch', clues: ['c2-l2-cipher'], lines: [cl('C2-L2-6-02')] }, { axis: 'where', value: 'hole', clues: ['c2-l2-cipher'], lines: [cl('C2-6-07')] }, { axis: 'where', value: 'duplo', clues: ['c2-l2-cocoa'], lines: [cl('C2-L2-6-03')] },
    { axis: 'what', value: 'sparkle', clues: ['c2-l2-cipher'], lines: [cl('C2-6-08')] }, { axis: 'what', value: 'lost', clues: ['c2-l2-cipher'], lines: [cl('C2-6-09')] }, { axis: 'what', value: 'flags', clues: ['c2-l2-cocoa'], lines: [cl('C2-L2-6-04')] },
  ], outro: [cl('C2-6-10')] }, redHerrings: [
    { id: 'rh-c2-magpie-thief', summary: 'Миф «сорока-воровка».', presentedBy: ['C2-1-04'], explainedBy: ['C2-7-12'] },
    { id: 'rh-c2-paper-mice', summary: 'Газетный обрывок похож на письма.', presentedBy: ['C2-L2-2-02', 'C2-4-01'], explainedBy: ['C2-7-13', 'C2-L2-7-01'] },
    { id: 'rh-c2-duplo', summary: 'Дупло мэра на Старом Дубе.', presentedBy: ['C2-L2-1-02', 'C2-L2-1-03'], explainedBy: ['C2-L2-7-03', 'C2-L2-7-04'] },
    { id: 'rh-c2-damka-bark', summary: 'Охапка Дамки похожа на бумагу.', presentedBy: ['C2-L2-1-01'], explainedBy: ['C2-L2-7-02'] },
  ] },
  notebookHelp: { mode: 'suggest', marks: [
    { axis: 'who', value: 'stella', mark: 'confirmed', clues: ['c2-l2-cocoa', 'c2-l2-timeline'], line: 'C2-NB-01' }, { axis: 'who', value: 'mouse', mark: 'excluded', clues: ['c2-l2-cocoa'], line: 'C2-6-04' }, { axis: 'who', value: 'pudding', mark: 'excluded', clues: ['c2-l2-cocoa'], line: 'C2-6-05' }, { axis: 'who', value: 'damka', mark: 'excluded', clues: ['c2-l2-timeline'], line: 'C2-NB-05' },
    { axis: 'where', value: 'nest', mark: 'confirmed', clues: ['c2-l2-cocoa'], line: 'C2-NB-03' }, { axis: 'where', value: 'porch', mark: 'excluded', clues: ['c2-l2-cipher'], line: 'C2-L2-6-02' }, { axis: 'where', value: 'hole', mark: 'excluded', clues: ['c2-l2-cipher'], line: 'C2-6-07' }, { axis: 'where', value: 'duplo', mark: 'excluded', clues: ['c2-l2-cocoa'], line: 'C2-L2-6-03' },
    { axis: 'what', value: 'rain', mark: 'confirmed', clues: ['c2-l2-cipher'], line: 'C2-3-10' }, { axis: 'what', value: 'sparkle', mark: 'excluded', clues: ['c2-l2-cipher'], line: 'C2-6-08' }, { axis: 'what', value: 'lost', mark: 'excluded', clues: ['c2-l2-cipher'], line: 'C2-6-09' }, { axis: 'what', value: 'flags', mark: 'excluded', clues: ['c2-l2-cocoa'], line: 'C2-NB-04' },
  ], pointers: [], nothing: 'UI-notebook.nothing' },
  hints: { klubok: { speaker: 'khvosts', precision: 'exact', allowance: 3, rules: [
    { id: 'C2-L2-H-01', when: not(has.clue('c2-l2-lupa')), cites: [] }, { id: 'C2-L2-H-02', when: all(has.clue('c2-l2-lupa'), not(has.clue('c2-l2-cipher'))), cites: ['c2-l2-lupa'] }, { id: 'C2-L2-H-03', when: not(has.clue('c2-l2-cocoa')), cites: [] }, { id: 'C2-L2-H-04', when: all(has.clue('c2-l2-cipher'), not(has.clue('c2-l2-timeline'))), cites: ['c2-l2-cipher'] }, { id: 'C2-L2-H-05', when: all(has.clue('c2-l2-cocoa'), not(has.clue('c2-l2-timeline'))), cites: ['c2-l2-cocoa'] },
  ], review: 'C2-L2-H-06', exhausted: 'UI-hint.klubokEmptyShell' }, shell: { speaker: 'watsony', precision: 'vague', allowance: null, rules: [
    { id: 'C2-L2-R-01', when: all(has.clue('c2-l2-lupa'), not(has.clue('c2-l2-cipher'))), cites: ['c2-l2-lupa'] }, { id: 'C2-L2-R-02', when: not(has.clue('c2-l2-cocoa')), cites: [] }, { id: 'C2-L2-R-03', when: all(has.clue('c2-l2-cipher'), not(has.clue('c2-l2-timeline'))), cites: ['c2-l2-cipher'] },
  ], review: 'C2-L2-H-06', exhausted: null } },
  minigames: [
    { id: 'c2l2-lupa', skill: 'magnifier', config: { kind: 'magnifier', targets: [
      { id: 'umbrella', label: 'C2-2-B01', required: true, reply: ['C2-2-02'] }, { id: 'feather', label: 'C2-2-B02', required: true, reply: ['C2-2-03'] }, { id: 'note', label: 'C2-2-B03', required: true, reply: ['C2-2-04'] }, { id: 'paper', label: 'C2-L2-2-B01', required: true, reply: ['C2-L2-2-02'] },
    ], afterFirst: [], afterFirstSkill: null, assistAfterMisses: 3 } },
    { id: 'c2l2-cocoa', skill: 'cocoa', config: { kind: 'cocoa', rounds: [
      { id: 'r1', options: [choice('kind1', 'C2-4-B01', true, 'C2-4-04'), choice('kind2', 'C2-4-B02', true, 'C2-4-05'), choice('paper', 'C2-4-B03', false, 'C2-4-06')], retry: ['C2-4-07'] },
      { id: 'r2', options: [choice('doing', 'C2-4-B04', true, 'C2-4-08'), choice('flags', 'C2-4-B05', true, 'C2-4-09'), choice('where', 'C2-4-B06', false, 'C2-4-10')], retry: ['C2-4-11'] },
      { id: 'r3', options: [choice('thanks', 'C2-L2-3-B01', true, 'C2-L2-3-01'), choice('show', 'C2-L2-3-B02', true, 'C2-L2-3-02'), choice('letters', 'C2-L2-3-B03', false, 'C2-L2-3-03')], retry: ['C2-L2-3-04'] },
    ] } },
    { id: 'c2l2-cipher', skill: 'button-cipher', config: { kind: 'staged', mechanic: 'button-cipher', description: 'Прочитать ДУБ и ДОЖДЬ по пуговицам.', steps: [
      { id: 'word1', prompt: null, pageSize: 3, options: [choice('oak', 'C2-L2-4-B01', true, 'C2-L2-4-02'), choice('nest', 'C2-3-B01', false, 'C2-3-04'), choice('rain', 'C2-3-B02', false, 'C2-3-04')] },
      { id: 'word2', prompt: null, pageSize: 3, options: [choice('rain', 'C2-3-B02', true, 'C2-3-06'), choice('oak', 'C2-L2-4-B01', false, 'C2-3-04'), choice('nest', 'C2-3-B01', false, 'C2-3-04')] },
    ], lines: [] } },
    { id: 'c2l2-timeline', skill: 'timeline', config: { kind: 'timeline', items: [
      { id: 't0800', time: '8:00', label: 'NM-damka' }, { id: 't0830', time: '8:30', label: 'NM-pudding' }, { id: 't0900', time: '9:00', label: 'C2-2-B01' }, { id: 't0930', time: '9:30', label: 'C2-3-B02' },
    ], solution: ['t0800', 't0830', 't0900', 't0930'], wrong: ['C2-L2-5-N03'] } },
    { id: 'c2l2-postal', skill: 'postal', config: { kind: 'staged', mechanic: 'postal', description: 'Сложить дырочки двух пуговиц.', steps: [
      { id: 'p23', prompt: null, pageSize: 3, options: [choice('h4', 'C2-8-B03', false, 'C2-8-03'), choice('h5', 'C2-L2-8-B01', true, 'C2-8-04'), choice('h6', 'C2-L2-8-B02', false, 'C2-8-03')] },
      { id: 'p33', prompt: null, pageSize: 3, options: [choice('h4', 'C2-8-B03', false, 'C2-8-03'), choice('h5', 'C2-L2-8-B01', false, 'C2-8-03'), choice('h6', 'C2-L2-8-B02', true, 'C2-8-04')] },
    ], lines: [] } },
  ],
  facts, glossary, rewards: ['rw-c2-heart-mice', 'rw-c2-badge', 'rw-c2-buttons-l2', 'rw-c2-sticker-l2', 'rw-c2-title-helper', 'rw-c2-decor-poster', 'rw-c2-activity'], collections: [], activities: [activityCard], comfort: [], cutscenes: [], plannedCutscenes: commonCutscenes.map((c) => c.scene === 'C2-7' ? { ...c, scene: 'C2-L2-7' } : c.scene === 'C2-8' ? { ...c, scene: 'C2-L2-8' } : c), decisions: [...baseDecisions, { id: 'C2L2-D1', text: 'Свидетельская ошибка одна: мышата говорят «ворону», затем сами исправляют на сороку.', ref: 'D04' }, { id: 'C2L2-D2', text: 'Дамка несёт кору к пруду как подводка к делу 7; улика часов исключает её.', ref: 'D20' }], reserved: [],
};

