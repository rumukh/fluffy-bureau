import { all, cl, goto, has, L, Ls, menu, minigame, not, opt as mopt, reveal, reward, seq, skill, when, type VariantSource } from '../../tools/content/dsl.ts';
import { activityCard, and, baseDecisions, choice, commonCutscenes, eq, facts, factsScene, glossary, intended, intro0, intro1base, klubkiIntro, ne, notebookIntro, resolutionSteps, rewardScene, versionScene, what, where, who } from './common.ts';

const HUB = 'C2-L3-HUB';
const allClues = all(has.clue('c2-l3-lupa'), has.clue('c2-l3-cipher'), has.clue('c2-l3-cocoa'), has.clue('c2-l3-timeline'), has.clue('c2-l3-scents'));

export const level3: VariantSource = {
  pack: 'case02-l3', kind: 'case', title: 'C2-TITLE', case: { number: 2, level: 3 }, start: 'C2-0',
  scenes: [
    { id: 'C2-0', title: 'Контора: письма не пришли', location: 'office', cast: ['khvosts', 'watsony', 'pudding'], presentation: 'cutscene', steps: [...intro0(), goto('C2-L3-1')] },
    { id: 'C2-L3-1', title: 'Завязка', location: 'post-office', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'dialogue', steps: [
      ...intro1base(), ...seq('C2-L2-1-', 1, 3), ...seq('C2-L3-1-', 1, 2), ...notebookIntro('C2-L3-1-D01'), ...Ls('C2-L2-1-04', 'C2-L2-1-05', 'C2-1-12', 'C2-1-13'), klubkiIntro(), goto(HUB),
    ] },
    { id: HUB, title: 'Почта: выбор', location: 'post-office', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'hub', steps: [
      when(all(allClues, not(has.visited('C2-L3-8'))), [goto('C2-L3-8')]),
      menu('C2-L3-M', null, [
        mopt('porch', 'C2-1-B01', 'C2-L3-2', { hideWhen: has.visited('C2-L3-2') }),
        mopt('mice', 'C2-1-B02', 'C2-L3-3', { hideWhen: has.visited('C2-L3-3') }),
        mopt('fitilyok', 'C2-L3-4-B01', 'C2-L3-4', { hideWhen: has.visited('C2-L3-4'), optional: true }),
        mopt('cipher', 'C2-2-B04', 'C2-L3-5', { when: has.clue('c2-l3-lupa'), hideWhen: has.visited('C2-L3-5') }),
      ]),
    ] },
    { id: 'C2-L3-2', title: 'Лупа: пять мелочей', location: 'post-porch', cast: ['khvosts', 'watsony'], presentation: 'minigame', steps: [skill('magnifier', [L('C2-L3-2-01')]), minigame('c2l3-lupa'), L('C2-2-05'), L('C2-2-06'), reveal('c2-l3-lupa'), goto(HUB)] },
    { id: 'C2-L3-3', title: 'Шуршики: «Чашка какао»', location: 'library-door', cast: ['mouse', 'khvosts', 'watsony'], presentation: 'minigame', steps: [
      ...seq('C2-4-', 1, 2), skill('cocoa', [L('C2-4-03')]), minigame('c2l3-cocoa'), reward('rw-c2-heart-mice'), ...seq('C2-4-', 12, 16), ...Ls('C2-L2-3-05', 'C2-L2-3-06'), ...seq('C2-L3-3-', 1, 3), L('C2-4-19'), L('C2-4-20'), reveal('c2-l3-cocoa'), goto(HUB),
    ] },
    { id: 'C2-L3-4', title: 'Фитилёк', location: 'lamp-booth', cast: ['fitilyok', 'khvosts'], presentation: 'dialogue', steps: [...seq('C2-L3-4-', 1, 6), goto(HUB)] },
    { id: 'C2-L3-5', title: 'Шифр на пуговицах', location: 'post-office', cast: ['khvosts', 'watsony'], presentation: 'minigame', steps: [
      skill('button-cipher', seq('C2-3-', 1, 3), [L('C2-L2-4-01')]), ...seq('C2-L3-5-', 1, 2), minigame('c2l3-cipher'), ...Ls('C2-L2-4-02', 'C2-L2-4-03', 'C2-3-06', 'C2-3-07', 'C2-3-08', 'C2-3-09', 'C2-3-10', 'C2-3-11', 'C2-L2-4-04', 'C2-L3-5-03', 'C2-L3-5-B01'), reveal('c2-l3-cipher'), goto('C2-L3-6'),
    ] },
    { id: 'C2-L3-6', title: 'Почтовые часы', location: 'post-clock', cast: ['khvosts', 'watsony'], presentation: 'minigame', steps: [
      skill('timeline', Ls('C2-L2-5-N01', 'C2-L2-5-N02'), [L('C2-L2-5-01')]), minigame('c2l3-timeline'), ...Ls('C2-L3-6-01', 'C2-L3-6-02', 'C2-L2-5-04'), reveal('c2-l3-timeline'), goto('C2-L3-7'),
    ] },
    { id: 'C2-L3-7', title: 'Пары запахов у Старого Дуба', location: 'old-oak', cast: ['khvosts', 'watsony'], presentation: 'minigame', steps: [
      skill('scent-pairs', Ls('C2-L3-7-02', 'C2-L3-7-03'), [L('C2-L3-7-01')]), minigame('c2l3-scents'), L('C2-L3-7-07'), reveal('c2-l3-scents'), goto(HUB),
    ] },
    versionScene('C2-L3-8', HUB),
    { id: 'C2-L3-9', title: 'Парк Старого Дуба', location: 'old-oak', cast: ['stella', 'pudding', 'mouse', 'damka', 'fitilyok', 'khvosts', 'watsony'], presentation: 'cutscene', steps: resolutionSteps([...seq('C2-L2-7-', 1, 4), ...seq('C2-L3-9-', 1, 3)], 'C2-L3-10') },
    { id: 'C2-L3-10', title: 'Почтальон: улица и сумма', location: 'town-square', cast: ['stella', 'pudding', 'tyopa', 'fitilyok'], presentation: 'minigame', steps: [skill('postal', seq('C2-L3-10-', 1, 3)), minigame('c2l3-postal'), L('C2-L3-9-03'), ...seq('C2-8-', 5, 8), goto('C2-9')] },
    factsScene('C2-10'), rewardScene(3),
  ],
  logic: { axes: [
    { id: 'who', title: 'C2-AX-who', values: [who.stella, who.mouse, who.pudding, who.damka, who.fitilyok] },
    { id: 'where', title: 'C2-AX-where', values: [where.porch, where.nest, where.hole, where.duplo, where.booth] },
    { id: 'what', title: 'C2-AX-what', values: [what.rain, what.sparkle, what.lost, what.flags] },
  ], intended, clues: [
    { id: 'c2-l3-lupa', title: 'C2-CL-lupa', required: true, predicate: { op: 'in', axis: 'what', values: ['rain', 'sparkle', 'lost', 'flags'] }, requires: [], source: 'C2-L3-2', summary: 'Зонт, перо, записка, газетный обрывок и пыльца.' },
    { id: 'c2-l3-cipher', title: 'C2-CL-cipher-oak', required: true, predicate: and(eq('what', 'rain'), ne('where', 'porch'), ne('where', 'hole'), ne('where', 'booth'), ne('what', 'sparkle'), ne('what', 'lost')), requires: ['c2-l3-lupa'], source: 'C2-L3-5', summary: 'В записке: на дуб, скоро дождь.' },
    { id: 'c2-l3-cocoa', title: 'C2-CL-cocoa', required: true, predicate: and(ne('who', 'mouse'), ne('who', 'pudding'), ne('what', 'flags')), requires: [], source: 'C2-L3-3', summary: 'Флажки из газет; мышата и мэр с алиби; сорока летела к дубу.' },
    { id: 'c2-l3-timeline', title: 'C2-CL-timeline', required: true, predicate: and(ne('who', 'damka'), ne('who', 'fitilyok')), requires: ['c2-l3-cipher'], source: 'C2-L3-6', summary: 'Фитилёк и Дамка ушли до сумки.' },
    { id: 'c2-l3-scents', title: 'C2-CL-scents', required: true, predicate: and(eq('where', 'nest'), ne('where', 'duplo')), requires: ['c2-l3-cipher'], source: 'C2-L3-7', summary: 'Медовый сургуч пахнет под гнездом, а у дупла орехи.' },
  ], version: { button: 'UI-hud.version', available: has.visited('C2-L3-8'), onSolved: 'C2-L3-9' }, wrongVersion: { intro: [cl('C2-6-03')], byValue: [
    { axis: 'who', value: 'mouse', clues: ['c2-l3-cocoa'], lines: [cl('C2-6-04')] }, { axis: 'who', value: 'pudding', clues: ['c2-l3-cocoa'], lines: [cl('C2-6-05')] }, { axis: 'who', value: 'damka', clues: ['c2-l3-timeline'], lines: [cl('C2-L2-6-01')] }, { axis: 'who', value: 'fitilyok', clues: ['c2-l3-timeline'], lines: [cl('C2-L3-8-01')] },
    { axis: 'where', value: 'porch', clues: ['c2-l3-cipher'], lines: [cl('C2-L2-6-02')] }, { axis: 'where', value: 'hole', clues: ['c2-l3-cipher'], lines: [cl('C2-6-07')] }, { axis: 'where', value: 'duplo', clues: ['c2-l3-scents'], lines: [cl('C2-L3-8-02')] }, { axis: 'where', value: 'booth', clues: ['c2-l3-cipher'], lines: [cl('C2-L3-8-03')] },
    { axis: 'what', value: 'sparkle', clues: ['c2-l3-cipher'], lines: [cl('C2-6-08')] }, { axis: 'what', value: 'lost', clues: ['c2-l3-cipher'], lines: [cl('C2-6-09')] }, { axis: 'what', value: 'flags', clues: ['c2-l3-cocoa'], lines: [cl('C2-L2-6-04')] },
  ], outro: [cl('C2-6-10')] }, redHerrings: [
    { id: 'rh-c2-magpie-thief', summary: 'Миф «сорока-воровка».', presentedBy: ['C2-1-04'], explainedBy: ['C2-7-12'] },
    { id: 'rh-c2-paper-mice', summary: 'Газетный обрывок и флажки.', presentedBy: ['C2-L2-2-02', 'C2-4-01'], explainedBy: ['C2-L2-7-01'] },
    { id: 'rh-c2-damka-bark', summary: 'Фитилёк ошибся про бумагу Дамки.', presentedBy: ['C2-L3-4-02'], explainedBy: ['C2-L3-9-02'] },
    { id: 'rh-c2-pollen', summary: 'Пыльца у крыльца указывает на Фитилька.', presentedBy: ['C2-L3-2-02'], explainedBy: ['C2-L3-9-01'] },
    { id: 'rh-c2-duplo', summary: 'Дупло мэра.', presentedBy: ['C2-L2-1-02', 'C2-L2-1-03'], explainedBy: ['C2-L2-7-03', 'C2-L2-7-04'] },
  ] },
  notebookHelp: { mode: 'point', marks: [
    { axis: 'who', value: 'stella', mark: 'confirmed', clues: ['c2-l3-cocoa', 'c2-l3-timeline'], line: 'C2-NB-01' }, { axis: 'who', value: 'mouse', mark: 'excluded', clues: ['c2-l3-cocoa'], line: 'C2-6-04' }, { axis: 'who', value: 'pudding', mark: 'excluded', clues: ['c2-l3-cocoa'], line: 'C2-6-05' }, { axis: 'who', value: 'damka', mark: 'excluded', clues: ['c2-l3-timeline'], line: 'C2-NB-05' }, { axis: 'who', value: 'fitilyok', mark: 'excluded', clues: ['c2-l3-timeline'], line: 'C2-L3-8-01' },
    { axis: 'where', value: 'nest', mark: 'confirmed', clues: ['c2-l3-scents'], line: 'C2-NB-06' }, { axis: 'where', value: 'porch', mark: 'excluded', clues: ['c2-l3-cipher'], line: 'C2-L2-6-02' }, { axis: 'where', value: 'hole', mark: 'excluded', clues: ['c2-l3-cipher'], line: 'C2-6-07' }, { axis: 'where', value: 'duplo', mark: 'excluded', clues: ['c2-l3-scents'], line: 'C2-L3-8-02' }, { axis: 'where', value: 'booth', mark: 'excluded', clues: ['c2-l3-cipher'], line: 'C2-L3-8-03' },
    { axis: 'what', value: 'rain', mark: 'confirmed', clues: ['c2-l3-cipher'], line: 'C2-3-10' }, { axis: 'what', value: 'sparkle', mark: 'excluded', clues: ['c2-l3-cipher'], line: 'C2-6-08' }, { axis: 'what', value: 'lost', mark: 'excluded', clues: ['c2-l3-cipher'], line: 'C2-6-09' }, { axis: 'what', value: 'flags', mark: 'excluded', clues: ['c2-l3-cocoa'], line: 'C2-NB-04' },
  ], pointers: [
    { clue: 'c2-l3-lupa', line: 'C2-L3-NB-01' }, { clue: 'c2-l3-cipher', line: 'C2-L3-NB-02' }, { clue: 'c2-l3-cocoa', line: 'C2-L3-NB-03' }, { clue: 'c2-l3-timeline', line: 'C2-L3-NB-04' }, { clue: 'c2-l3-scents', line: 'C2-L3-NB-05' },
  ], nothing: 'UI-notebook.nothing' },
  hints: { klubok: { speaker: 'khvosts', precision: 'exact', allowance: 3, rules: [
    { id: 'C2-L3-H-01', when: not(has.clue('c2-l3-lupa')), cites: [] }, { id: 'C2-L3-H-02', when: all(has.clue('c2-l3-lupa'), not(has.clue('c2-l3-cipher'))), cites: ['c2-l3-lupa'] }, { id: 'C2-L3-H-03', when: all(has.clue('c2-l3-cipher'), not(has.clue('c2-l3-timeline'))), cites: ['c2-l3-cipher'] }, { id: 'C2-L3-H-04', when: all(has.clue('c2-l3-timeline'), not(has.clue('c2-l3-scents'))), cites: ['c2-l3-timeline'] }, { id: 'C2-L3-H-05', when: not(has.clue('c2-l3-cocoa')), cites: [] },
  ], review: 'C2-L3-H-06', exhausted: 'UI-hint.klubokEmpty' }, shell: null },
  minigames: [
    { id: 'c2l3-lupa', skill: 'magnifier', config: { kind: 'magnifier', targets: [
      { id: 'umbrella', label: 'C2-2-B01', required: true, reply: ['C2-2-02'] }, { id: 'feather', label: 'C2-2-B02', required: true, reply: ['C2-2-03'] }, { id: 'note', label: 'C2-2-B03', required: true, reply: ['C2-2-04'] }, { id: 'paper', label: 'C2-L2-2-B01', required: true, reply: ['C2-L2-2-02'] }, { id: 'pollen', label: 'C2-L3-2-B01', required: true, reply: ['C2-L3-2-02'] },
    ], afterFirst: [], afterFirstSkill: null, assistAfterMisses: 3 } },
    { id: 'c2l3-cocoa', skill: 'cocoa', config: { kind: 'cocoa', rounds: [
      { id: 'r1', options: [choice('kind1', 'C2-4-B01', true, 'C2-4-04'), choice('kind2', 'C2-4-B02', true, 'C2-4-05'), choice('paper', 'C2-4-B03', false, 'C2-4-06')], retry: ['C2-4-07'] },
      { id: 'r2', options: [choice('doing', 'C2-4-B04', true, 'C2-4-08'), choice('flags', 'C2-4-B05', true, 'C2-4-09'), choice('where', 'C2-4-B06', false, 'C2-4-10')], retry: ['C2-4-11'] },
      { id: 'r3', options: [choice('thanks', 'C2-L2-3-B01', true, 'C2-L2-3-01'), choice('show', 'C2-L2-3-B02', true, 'C2-L2-3-02'), choice('letters', 'C2-L2-3-B03', false, 'C2-L2-3-03')], retry: ['C2-L2-3-04'] },
    ] } },
    { id: 'c2l3-cipher', skill: 'button-cipher', config: { kind: 'staged', mechanic: 'button-cipher', description: 'Прочитать ДУБ и ДОЖДЬ; формы различают двойняшек.', steps: [
      { id: 'word1', prompt: null, pageSize: 3, options: [choice('oak', 'C2-L2-4-B01', true, 'C2-L2-4-02'), choice('nest', 'C2-3-B01', false, 'C2-3-04'), choice('rain', 'C2-3-B02', false, 'C2-3-04')] },
      { id: 'word2', prompt: null, pageSize: 3, options: [choice('rain', 'C2-3-B02', true, 'C2-3-06'), choice('oak', 'C2-L2-4-B01', false, 'C2-3-04'), choice('nest', 'C2-3-B01', false, 'C2-3-04')] },
    ], lines: [] } },
    { id: 'c2l3-timeline', skill: 'timeline', config: { kind: 'timeline', items: [
      { id: 't0730', time: '7:30', label: 'NM-fitilyok' }, { id: 't0800', time: '8:00', label: 'NM-damka' }, { id: 't0830', time: '8:30', label: 'NM-pudding' }, { id: 't0900', time: '9:00', label: 'C2-2-B01' }, { id: 't0930', time: '9:30', label: 'C2-3-B02' },
    ], solution: ['t0730', 't0800', 't0830', 't0900', 't0930'], wrong: ['C2-L2-5-N03'] } },
    { id: 'c2l3-scents', skill: 'scent-pairs', config: { kind: 'scent-pairs', fields: [
      { id: 'duplo', label: 'C2-AX-duplo', cards: [{ id: 'd-nuts-1', pair: 'nuts', label: 'C2-L2-7-04' }, { id: 'd-nuts-2', pair: 'nuts', label: 'C2-L2-7-04' }, { id: 'd-seeds-1', pair: 'seeds', label: 'C2-L2-7-04' }, { id: 'd-seeds-2', pair: 'seeds', label: 'C2-L2-7-04' }] },
      { id: 'nest', label: 'C2-AX-nest', cards: [{ id: 'n-honey-1', pair: 'honey', label: 'C2-L3-7-04' }, { id: 'n-honey-2', pair: 'honey', label: 'C2-L3-7-04' }, { id: 'n-twigs-1', pair: 'twigs', label: 'C2-9-03' }, { id: 'n-twigs-2', pair: 'twigs', label: 'C2-9-03' }] },
    ], mismatch: ['C2-L3-7-05'], question: { prompt: 'C2-L3-7-04', options: [choice('duplo', 'C2-AX-duplo', false, 'C2-L3-7-05'), choice('nest', 'C2-AX-nest', true, 'C2-L3-7-06')] } } },
    { id: 'c2l3-postal', skill: 'postal', config: { kind: 'staged', mechanic: 'postal', description: 'Выбрать улицу по значку и домик по сумме.', steps: [
      { id: 'street1', prompt: null, pageSize: 3, options: [choice('pirog', 'C2-L3-10-B01', true, 'C2-8-04'), choice('park', 'C2-L3-10-B02', false, 'C2-L3-10-04'), choice('h4', 'C2-8-B03', false, 'C2-8-03')] },
      { id: 'street2', prompt: null, pageSize: 3, options: [choice('pirog', 'C2-L3-10-B01', false, 'C2-L3-10-04'), choice('park', 'C2-L3-10-B02', true, 'C2-8-04'), choice('h5', 'C2-L2-8-B01', false, 'C2-8-03')] },
    ], lines: [] } },
  ],
  facts, glossary, rewards: ['rw-c2-heart-mice', 'rw-c2-badge', 'rw-c2-buttons-l3', 'rw-c2-sticker-l3', 'rw-c2-title-helper', 'rw-c2-decor-poster', 'rw-c2-activity'], collections: [], activities: [activityCard], comfort: [], cutscenes: [], plannedCutscenes: commonCutscenes.map((c) => c.scene === 'C2-7' ? { ...c, scene: 'C2-L3-9' } : c.scene === 'C2-8' ? { ...c, scene: 'C2-L3-10' } : c), decisions: [...baseDecisions, { id: 'C2L3-D1', text: 'После шифра маршрут ведёт через часы и запахи последовательно, чтобы меню всегда показывало не больше трёх вариантов.', ref: 'Q11' }, { id: 'C2L3-D2', text: 'Свидетельская ошибка одна: Фитилёк принимает кору Дамки за бумагу и сам исправляется.', ref: 'D04' }, { id: 'C2L3-D3', text: 'Пуговицы-двойняшки получают формы, а улицы — иконки сот и листика; цвет остаётся вторичным.', ref: 'R01, D17' }], reserved: [],
};



