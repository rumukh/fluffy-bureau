import { all, cl, dir, goto, has, L, Ls, menu, minigame, not, opt as mopt, reveal, seq, skill, when, type VariantSource } from '../../tools/content/dsl.ts';
import { activityCard, and, baseDecisions, choice, commonCutscenes, eq, facts, factsScene, glossary, intended, introOffice, klubkiIntro, ne, rewardScene, versionScene, what, where, who } from './common.ts';

const HUB = 'C4-L2-HUB';
const allClues = all(has.clue('c4-cellar'), has.clue('c4-tracks'), has.clue('c4-diary'), has.clue('c4-dreams'));
const rewards = ['rw-c4-badge', 'rw-c4-buttons-l2', 'rw-c4-sticker-l2', 'rw-c4-title-junior', 'rw-c4-decor-jar', 'rw-c4-activity'];

export const level2: VariantSource = {
  pack: 'case04-l2', kind: 'case', title: 'C4-TITLE', case: { number: 4, level: 2 }, start: 'C4-0',
  scenes: [
    { id: 'C4-0', title: 'Контора: мэр в отчаянии', location: 'office', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'cutscene', steps: [...introOffice(), goto('C4-L2-1')] },
    { id: 'C4-L2-1', title: 'Завязка: четыре подозреваемых', location: 'mayor-cellar', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'dialogue', steps: [
      ...seq('C4-1-', 1, 6), ...seq('C4-L2-1-', 1, 3), skill('notebook', [dir('C4-L2-1-D01', 'Блокнот раскрывается: четыре строки в каждой колонке.'), L('C4-1-07')]), ...seq('C4-L2-1-', 4, 6), klubkiIntro(), goto(HUB),
    ] },
    { id: HUB, title: 'Погреб: выбор', location: 'mayor-cellar', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'hub', steps: [
      when(all(allClues, not(has.visited('C4-L2-6'))), [goto('C4-L2-6')]),
      menu('C4-L2-M', null, [
        mopt('shelves', 'C4-1-B01', 'C4-L2-2', { hideWhen: has.visited('C4-L2-2') }),
        mopt('mayor', 'C4-1-B02', 'C4-3', { hideWhen: has.visited('C4-3'), optional: true }),
        mopt('tracks', 'C4-2-B04', 'C4-L2-3', { when: has.clue('c4-cellar'), hideWhen: has.visited('C4-L2-3') }),
        mopt('diary', 'C4-L2-4-B01', 'C4-L2-4', { when: has.visited('C4-L2-3'), hideWhen: has.visited('C4-L2-4') }),
        mopt('dreams', 'C4-1-B03', 'C4-L2-5', { when: has.clue('c4-cellar'), hideWhen: has.visited('C4-L2-5') }),
      ]),
    ] },
    { id: 'C4-L2-2', title: 'Полки: «Лупа»', location: 'mayor-cellar-shelves', cast: ['khvosts', 'watsony'], presentation: 'minigame', steps: [
      skill('magnifier', [L('C4-L2-2-01')], []), minigame('c4l2-lupa'), ...seq('C4-2-', 5, 6), reveal('c4-cellar'), goto(HUB),
    ] },
    { id: 'C4-3', title: 'Мэр: три недели назад', location: 'mayor-cellar', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'dialogue', steps: [...seq('C4-3-', 1, 4), goto(HUB)] },
    { id: 'C4-L2-3', title: '«Кто наследил?»', location: 'cellar-steps', cast: ['khvosts', 'watsony'], presentation: 'minigame', steps: [
      ...seq('C4-4-', 1, 2), skill('tracks', [L('C4-4-N01')], []), minigame('c4l2-tracks'), ...seq('C4-4-', 7, 10), ...seq('C4-L2-3-', 2, 3), reveal('c4-tracks'), goto(HUB),
    ] },
    { id: 'C4-L2-4', title: '«Лента времени»: дневник', location: 'office-diary', cast: ['watsony', 'khvosts'], presentation: 'minigame', steps: [
      skill('timeline', Ls('C4-L2-4-01', 'C4-L2-4-02'), [L('C4-L2-4-03')]), L('C4-L2-4-04'), minigame('c4l2-timeline'), ...seq('C4-L2-4-', 5, 8), reveal('c4-diary'), goto(HUB),
    ] },
    { id: 'C4-L2-5', title: '«Хранитель снов»', location: 'mayor-cellar', cast: ['pukhlik', 'khvosts', 'watsony'], presentation: 'minigame', steps: [
      skill('dream-keeper', seq('C4-5-', 1, 4)), L('C4-L2-5-01'), minigame('c4l2-dreams'), ...seq('C4-5-', 9, 10), reveal('c4-dreams'), goto(HUB),
    ] },
    versionScene('C4-L2-6', HUB),
    { id: 'C4-L2-7', title: 'Кладовка Конторы', location: 'office-pantry', cast: ['pudding', 'mouse', 'pukhlik', 'khvosts', 'watsony'], presentation: 'cutscene', steps: [dir('C4-7-D01', 'Контора. Под лестницей маленькая дверка; внутри двенадцать банок с бантиками.'), ...seq('C4-7-', 1, 12), ...seq('C4-L2-7-', 1, 3), ...seq('C4-7-', 13, 17), goto('C4-L2-8')] },
    { id: 'C4-L2-8', title: 'Большое чаепитие', location: 'town-square', cast: ['pudding', 'mouse', 'pukhlik', 'khvosts', 'watsony'], presentation: 'minigame', steps: [
      skill('equal-share', Ls('C4-8-01', 'C4-8-02')), L('C4-L2-8-01'), minigame('c4l2-tea'), ...seq('C4-8-', 5, 7), goto('C4-9'),
    ] },
    factsScene('C4-10'), rewardScene(2),
  ],
  logic: {
    axes: [
      { id: 'who', title: 'C4-AX-who', values: [who.khvosts, who.pudding, who.mouse, who.watsony] },
      { id: 'where', title: 'C4-AX-where', values: [where.office, where.mouse, where.barrel, where.attic] },
      { id: 'what', title: 'C4-AX-what', values: [what.stock, what.eaten, what.broken, what.shared] },
    ], intended,
    clues: [
      { id: 'c4-cellar', title: 'C4-CL-cellar', required: true, predicate: and(ne('where', 'cellar-barrel'), ne('what', 'eaten'), ne('what', 'broken')), requires: [], source: 'C4-L2-2', summary: 'Кружки, целый пол, след тележки и заплатка-звёздочка.' },
      { id: 'c4-tracks', title: 'C4-CL-tracks', required: true, predicate: eq('who', 'khvosts'), requires: ['c4-cellar'], source: 'C4-L2-3', summary: 'Старые мышиные следы; свежие барсучьи; хомячьих и ежиных нет.' },
      { id: 'c4-diary', title: 'C4-CL-diary', required: true, predicate: and(ne('who', 'watsony'), ne('what', 'shared-early')), requires: ['c4-tracks'], source: 'C4-L2-4', summary: 'Ватсони вязала дома; мэр запретил раздавать варенье до юбилея.' },
      { id: 'c4-dreams', title: 'C4-CL-dreams', required: true, predicate: and(eq('where', 'office-pantry'), eq('what', 'secret-stock')), requires: ['c4-cellar'], source: 'C4-L2-5', summary: 'Сны мягко ведут к кладовке под лестницей и тайному запасу.' },
    ],
    version: { button: 'UI-hud.version', available: has.visited('C4-L2-6'), onSolved: 'C4-L2-7' },
    wrongVersion: { intro: [cl('C4-6-03')], byValue: [
      { axis: 'who', value: 'pudding', clues: ['c4-tracks'], lines: [cl('C4-6-04')] },
      { axis: 'who', value: 'mouse', clues: ['c4-tracks'], lines: [cl('C4-6-05')] },
      { axis: 'who', value: 'watsony', clues: ['c4-diary'], lines: [cl('C4-L2-6-01')] },
      { axis: 'where', value: 'mouse-hole', clues: ['c4-dreams'], lines: [cl('C4-6-06')] },
      { axis: 'where', value: 'cellar-barrel', clues: ['c4-cellar'], lines: [cl('C4-6-07')] },
      { axis: 'where', value: 'mayor-attic', clues: ['c4-dreams'], lines: [cl('C4-L2-6-02')] },
      { axis: 'what', value: 'eaten', clues: ['c4-cellar'], lines: [cl('C4-6-08')] },
      { axis: 'what', value: 'broken', clues: ['c4-cellar'], lines: [cl('C4-6-09')] },
      { axis: 'what', value: 'shared-early', clues: ['c4-diary'], lines: [cl('C4-L2-6-03')] },
    ], outro: [cl('C4-6-10')] },
    redHerrings: [
      { id: 'rh-c4-mice-sweet', summary: 'Мыши якобы любят сладкое.', presentedBy: ['C4-1-02'], explainedBy: ['C4-7-11'] },
      { id: 'rh-c4-sticky-mayor', summary: 'Липкие лапки мэра от мёда.', presentedBy: ['C4-1-03'], explainedBy: ['C4-7-12'] },
      { id: 'rh-c4-detective', summary: 'Сыщик тоже может быть подозреваемым.', presentedBy: ['C4-1-06'], explainedBy: ['C4-7-13', 'C4-7-14'] },
      { id: 'rh-c4-watsony', summary: 'Ватсони сомневается и думает, что была на чердаке.', presentedBy: ['C4-L2-1-02', 'C4-L2-1-03'], explainedBy: ['C4-L2-7-02', 'C4-L2-7-03'] },
      { id: 'rh-c4-attic-jar', summary: 'Пустая банка на чердаке старая.', presentedBy: ['C4-L2-1-01'], explainedBy: ['C4-L2-7-01'] },
    ],
  },
  notebookHelp: { mode: 'suggest', marks: [
    { axis: 'who', value: 'khvosts', mark: 'confirmed', clues: ['c4-tracks'], line: 'C4-NB-01' },
    { axis: 'who', value: 'pudding', mark: 'excluded', clues: ['c4-tracks'], line: 'C4-6-04' },
    { axis: 'who', value: 'mouse', mark: 'excluded', clues: ['c4-tracks'], line: 'C4-6-05' },
    { axis: 'who', value: 'watsony', mark: 'excluded', clues: ['c4-diary'], line: 'C4-L2-NB-01' },
    { axis: 'where', value: 'office-pantry', mark: 'confirmed', clues: ['c4-dreams'], line: 'C4-NB-02' },
    { axis: 'where', value: 'mouse-hole', mark: 'excluded', clues: ['c4-dreams'], line: 'C4-6-06' },
    { axis: 'where', value: 'cellar-barrel', mark: 'excluded', clues: ['c4-cellar'], line: 'C4-NB-06' },
    { axis: 'where', value: 'mayor-attic', mark: 'excluded', clues: ['c4-dreams'], line: 'C4-L2-NB-03' },
    { axis: 'what', value: 'secret-stock', mark: 'confirmed', clues: ['c4-dreams'], line: 'C4-NB-03' },
    { axis: 'what', value: 'eaten', mark: 'excluded', clues: ['c4-cellar'], line: 'C4-NB-04' },
    { axis: 'what', value: 'broken', mark: 'excluded', clues: ['c4-cellar'], line: 'C4-NB-05' },
    { axis: 'what', value: 'shared-early', mark: 'excluded', clues: ['c4-diary'], line: 'C4-L2-NB-02' },
  ], pointers: [], nothing: 'UI-notebook.nothing' },
  hints: { klubok: { speaker: 'khvosts', precision: 'exact', allowance: 3, rules: [
    { id: 'C4-L2-H-01', when: not(has.clue('c4-cellar')), cites: [] },
    { id: 'C4-L2-H-02', when: all(has.clue('c4-cellar'), not(has.clue('c4-tracks'))), cites: ['c4-cellar'] },
    { id: 'C4-L2-H-03', when: all(has.clue('c4-tracks'), not(has.clue('c4-diary'))), cites: ['c4-tracks'] },
    { id: 'C4-L2-H-04', when: all(has.clue('c4-cellar'), not(has.clue('c4-dreams'))), cites: ['c4-cellar'] },
    { id: 'C4-L2-H-05', when: has.visited('C4-L2-6'), cites: ['c4-cellar', 'c4-tracks', 'c4-diary', 'c4-dreams'] },
  ], review: 'C4-L2-H-05', exhausted: 'UI-hint.klubokEmptyShell' }, shell: { speaker: 'watsony', precision: 'vague', allowance: null, rules: [
    { id: 'C4-L2-R-03', when: all(has.clue('c4-cellar'), not(has.clue('c4-tracks'))), cites: ['c4-cellar'] },
    { id: 'C4-L2-R-01', when: all(has.clue('c4-tracks'), not(has.clue('c4-diary'))), cites: ['c4-tracks'] },
    { id: 'C4-L2-R-02', when: all(has.clue('c4-cellar'), not(has.clue('c4-dreams'))), cites: ['c4-cellar'] },
  ], review: 'C4-L2-R-04', exhausted: null } },
  minigames: [
    { id: 'c4l2-lupa', skill: 'magnifier', config: { kind: 'magnifier', targets: [
      { id: 'jar-circles', label: 'C4-2-B01', required: true, reply: ['C4-2-02'] }, { id: 'clean-floor', label: 'C4-2-B02', required: true, reply: ['C4-2-03'] }, { id: 'cart-track', label: 'C4-2-B03', required: true, reply: ['C4-2-04'] }, { id: 'patch', label: 'C4-L2-2-B01', required: true, reply: ['C4-L2-2-02'] },
    ], afterFirst: [], afterFirstSkill: null, assistAfterMisses: 3 } },
    { id: 'c4l2-tracks', skill: 'tracks', config: { kind: 'tracks', steps: [
      { id: 'old', prompt: null, pageSize: 3, options: [choice('mouse', 'C4-4-B01', true, 'C4-4-03'), choice('hamster', 'C4-4-B02', false, 'C4-4-04'), choice('badger', 'C4-4-B03', false, 'C4-4-04'), choice('hedgehog', 'C4-L2-3-B01', false, 'C4-4-04')] },
      { id: 'fresh', prompt: null, pageSize: 3, options: [choice('mouse', 'C4-4-B01', false, 'C4-4-06'), choice('hamster', 'C4-4-B02', false, 'C4-4-06'), choice('badger', 'C4-4-B03', true, 'C4-4-05'), choice('hedgehog', 'C4-L2-3-B01', false, 'C4-L2-3-01')] },
    ], question: null } },
    { id: 'c4l2-timeline', skill: 'timeline', config: { kind: 'timeline', items: [
      { id: 'count', time: 'три недели назад', label: 'C4-L2-4-B02' }, { id: 'rule', time: 'три недели назад', label: 'C4-L2-4-B03' }, { id: 'cart', time: 'две недели назад, вечер', label: 'C4-L2-4-B04' }, { id: 'home', time: 'две недели назад, вечер', label: 'C4-L2-4-B05' },
    ], solution: ['count', 'rule', 'cart', 'home'], wrong: ['C4-L2-4-09'] } },
    { id: 'c4l2-dreams', skill: 'dream-keeper', config: { kind: 'staged', mechanic: 'dream-keeper', description: 'Пухлик показывает по три мягкие карты-сна.', steps: [
      { id: 'where', prompt: 'C4-5-N01', pageSize: 3, options: [choice('office', 'C4-5-B01', true, 'C4-5-05'), choice('mouse', 'C4-5-B02', false, 'C4-5-06'), choice('barrel', 'C4-5-B03', false, 'C4-5-06'), choice('attic', 'C4-L2-5-B01', false, 'C4-5-06')] },
      { id: 'what', prompt: 'C4-5-N02', pageSize: 3, options: [choice('stock', 'C4-5-B04', true, 'C4-5-07'), choice('eaten', 'C4-5-B05', false, 'C4-5-06'), choice('broken', 'C4-5-B06', false, 'C4-5-06'), choice('shared', 'C4-L2-5-B02', false, 'C4-5-06')] },
      { id: 'who', prompt: 'C4-5-N03', pageSize: 3, options: [choice('khvosts', 'C4-5-B07', true, 'C4-5-08'), choice('pudding', 'C4-5-B08', false, 'C4-5-06'), choice('mouse', 'C4-5-B09', false, 'C4-5-06'), choice('watsony', 'C4-L2-5-B03', false, 'C4-5-06')] },
    ], lines: [] } },
    { id: 'c4l2-tea', skill: 'equal-share', config: { kind: 'staged', mechanic: 'equal-share', description: 'Разделить банки и посчитать розетки.', steps: [
      { id: 'tables', prompt: 'C4-8-02', pageSize: 3, options: [choice('four-tables', 'C4-8-B03', true, 'C4-8-04'), choice('three-tables', 'C4-8-B02', false, 'C4-8-03'), choice('wrong', 'C4-8-B01', false, 'C4-8-03')] },
      { id: 'open', prompt: 'C4-L2-8-01', pageSize: 3, options: [choice('three-jars', 'C4-L2-8-B01', true, 'C4-8-04'), choice('four-jars', 'C4-8-B02', false, 'C4-8-03'), choice('one', 'C4-8-B01', false, 'C4-8-03')] },
    ], lines: [] } },
  ],
  facts, glossary, rewards, collections: [], activities: [activityCard], comfort: [{ scene: '*', line: 'C4-L-01' }], cutscenes: commonCutscenes.map((c) => c.scene === 'C4-1' ? { ...c, scene: 'C4-L2-1' } : c.scene === 'C4-7' ? { ...c, scene: 'C4-L2-7' } : c.scene === 'C4-8' ? { ...c, scene: 'C4-L2-8' } : c), decisions: [...baseDecisions, { id: 'C4L2-D1', text: 'На сложности 2 добавлен дневник: он исключает Ватсони и раннюю раздачу гостям.', ref: 'D03, R04' }], reserved: [{ lines: ['C4-F-01', 'C4-F-02', 'C4-F-03', 'C4-F-04', 'C4-F-05'], reason: 'семейный «Хранитель снов», Q34 handoff' }, { lines: ['C4-0-B01'], reason: 'названия новых механик и точки карты используются системами каталога' }],
};
