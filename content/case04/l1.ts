import { all, cl, dir, goto, has, L, Ls, menu, minigame, not, opt as mopt, reveal, seq, skill, when, type VariantSource } from '../../tools/content/dsl.ts';
import { activityCard, and, baseDecisions, choice, commonCutscenes, eq, facts, factsScene, glossary, intended, introOffice, klubkiIntro, ne, notebookIntro, resolution, rewardScene, versionScene, what, where, who } from './common.ts';

const HUB = 'C4-HUB';
const allClues = all(has.clue('c4-cellar'), has.clue('c4-tracks'), has.clue('c4-dreams'));
const rewards = ['rw-c4-badge', 'rw-c4-buttons-l1', 'rw-c4-sticker-l1', 'rw-c4-title-junior', 'rw-c4-decor-jar', 'rw-c4-activity'];

export const level1: VariantSource = {
  pack: 'case04-l1', kind: 'case', title: 'C4-TITLE', case: { number: 4, level: 1 }, start: 'C4-0',
  scenes: [
    { id: 'C4-0', title: 'Контора: мэр в отчаянии', location: 'office', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'cutscene', steps: [...introOffice(), goto('C4-1')] },
    { id: 'C4-1', title: 'Завязка: погреб мэрии', location: 'mayor-cellar', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'dialogue', steps: [
      ...seq('C4-1-', 1, 6), ...notebookIntro('C4-1-D01'), L('C4-1-08'), L('C4-1-09'), L('C4-1-10'), klubkiIntro(), goto(HUB),
    ] },
    { id: HUB, title: 'Погреб: выбор', location: 'mayor-cellar', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'hub', steps: [
      when(all(allClues, not(has.visited('C4-6'))), [goto('C4-6')]),
      menu('C4-M', null, [
        mopt('shelves', 'C4-1-B01', 'C4-2', { hideWhen: has.visited('C4-2') }),
        mopt('mayor', 'C4-1-B02', 'C4-3', { hideWhen: has.visited('C4-3'), optional: true }),
        mopt('tracks', 'C4-2-B04', 'C4-4', { when: has.clue('c4-cellar'), hideWhen: has.visited('C4-4') }),
        mopt('dreams', 'C4-1-B03', 'C4-5', { when: has.clue('c4-cellar'), hideWhen: has.visited('C4-5') }),
      ]),
    ] },
    { id: 'C4-2', title: 'Полки: «Лупа»', location: 'mayor-cellar-shelves', cast: ['khvosts', 'watsony'], presentation: 'minigame', steps: [
      skill('magnifier', [L('C4-2-01')], []), minigame('c4l1-lupa'), ...seq('C4-2-', 5, 6), reveal('c4-cellar'), goto(HUB),
    ] },
    { id: 'C4-3', title: 'Мэр: три недели назад', location: 'mayor-cellar', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'dialogue', steps: [...seq('C4-3-', 1, 4), goto(HUB)] },
    { id: 'C4-4', title: '«Кто наследил?»', location: 'cellar-steps', cast: ['khvosts', 'watsony'], presentation: 'minigame', steps: [
      ...seq('C4-4-', 1, 2), skill('tracks', [L('C4-4-N01')], []), minigame('c4l1-tracks'), ...seq('C4-4-', 7, 10), reveal('c4-tracks'), goto(HUB),
    ] },
    { id: 'C4-5', title: '«Хранитель снов»', location: 'mayor-cellar', cast: ['pukhlik', 'khvosts', 'watsony'], presentation: 'minigame', steps: [
      dir('C4-5-D01', 'Пухлик спускается с фонарём снов; в фонаре мягкий туман.'),
      skill('dream-keeper', seq('C4-5-', 1, 4)), minigame('c4l1-dreams'), ...seq('C4-5-', 9, 10), reveal('c4-dreams'), goto(HUB),
    ] },
    versionScene('C4-6', HUB),
    { id: 'C4-7', title: 'Кладовка Конторы', location: 'office-pantry', cast: ['pudding', 'mouse', 'pukhlik', 'khvosts', 'watsony'], presentation: 'cutscene', steps: resolution([], 'C4-8') },
    { id: 'C4-8', title: 'Большое чаепитие', location: 'town-square', cast: ['pudding', 'mouse', 'pukhlik', 'khvosts', 'watsony'], presentation: 'minigame', steps: [
      skill('equal-share', Ls('C4-8-01', 'C4-8-02')), minigame('c4l1-tea'), ...seq('C4-8-', 5, 7), goto('C4-9'),
    ] },
    factsScene('C4-10'), rewardScene(1),
  ],
  logic: {
    axes: [
      { id: 'who', title: 'C4-AX-who', values: [who.khvosts, who.pudding, who.mouse] },
      { id: 'where', title: 'C4-AX-where', values: [where.office, where.mouse, where.barrel] },
      { id: 'what', title: 'C4-AX-what', values: [what.stock, what.eaten, what.broken] },
    ], intended,
    clues: [
      { id: 'c4-cellar', title: 'C4-CL-cellar', required: true, predicate: and(ne('where', 'cellar-barrel'), ne('what', 'eaten'), ne('what', 'broken')), requires: [], source: 'C4-2', summary: 'Кружки в пыли, нет осколков и ложек, след тележки к выходу.' },
      { id: 'c4-tracks', title: 'C4-CL-tracks', required: true, predicate: eq('who', 'khvosts'), requires: ['c4-cellar'], source: 'C4-4', summary: 'Старые мышиные следы и свежие барсучьи; хомячьих нет.' },
      { id: 'c4-dreams', title: 'C4-CL-dreams', required: true, predicate: and(eq('where', 'office-pantry'), eq('what', 'secret-stock')), requires: ['c4-cellar'], source: 'C4-5', summary: 'Сны Пухлика ведут к дверке под лестницей и праздничному запасу.' },
    ],
    version: { button: 'UI-hud.version', available: has.visited('C4-6'), onSolved: 'C4-7' },
    wrongVersion: { intro: [cl('C4-6-03')], byValue: [
      { axis: 'who', value: 'pudding', clues: ['c4-tracks'], lines: [cl('C4-6-04')] },
      { axis: 'who', value: 'mouse', clues: ['c4-tracks'], lines: [cl('C4-6-05')] },
      { axis: 'where', value: 'mouse-hole', clues: ['c4-dreams'], lines: [cl('C4-6-06')] },
      { axis: 'where', value: 'cellar-barrel', clues: ['c4-cellar'], lines: [cl('C4-6-07')] },
      { axis: 'what', value: 'eaten', clues: ['c4-cellar'], lines: [cl('C4-6-08')] },
      { axis: 'what', value: 'broken', clues: ['c4-cellar'], lines: [cl('C4-6-09')] },
    ], outro: [cl('C4-6-10')] },
    redHerrings: [
      { id: 'rh-c4-mice-sweet', summary: 'Мыши якобы любят сладкое.', presentedBy: ['C4-1-02'], explainedBy: ['C4-7-11'] },
      { id: 'rh-c4-sticky-mayor', summary: 'Липкие лапки мэра от мёда.', presentedBy: ['C4-1-03'], explainedBy: ['C4-7-12'] },
      { id: 'rh-c4-detective', summary: 'Сыщик тоже может быть подозреваемым.', presentedBy: ['C4-1-06'], explainedBy: ['C4-7-13', 'C4-7-14'] },
    ],
  },
  notebookHelp: { mode: 'suggest', marks: [
    { axis: 'who', value: 'khvosts', mark: 'confirmed', clues: ['c4-tracks'], line: 'C4-NB-01' },
    { axis: 'who', value: 'pudding', mark: 'excluded', clues: ['c4-tracks'], line: 'C4-6-04' },
    { axis: 'who', value: 'mouse', mark: 'excluded', clues: ['c4-tracks'], line: 'C4-6-05' },
    { axis: 'where', value: 'office-pantry', mark: 'confirmed', clues: ['c4-dreams'], line: 'C4-NB-02' },
    { axis: 'where', value: 'mouse-hole', mark: 'excluded', clues: ['c4-dreams'], line: 'C4-6-06' },
    { axis: 'where', value: 'cellar-barrel', mark: 'excluded', clues: ['c4-cellar'], line: 'C4-NB-06' },
    { axis: 'what', value: 'secret-stock', mark: 'confirmed', clues: ['c4-dreams'], line: 'C4-NB-03' },
    { axis: 'what', value: 'eaten', mark: 'excluded', clues: ['c4-cellar'], line: 'C4-NB-04' },
    { axis: 'what', value: 'broken', mark: 'excluded', clues: ['c4-cellar'], line: 'C4-NB-05' },
  ], pointers: [], nothing: 'UI-notebook.nothing' },
  hints: { klubok: { speaker: 'khvosts', precision: 'exact', allowance: 3, rules: [
    { id: 'C4-H-01', when: not(has.clue('c4-cellar')), cites: [] },
    { id: 'C4-H-02', when: all(has.clue('c4-cellar'), not(has.clue('c4-tracks'))), cites: ['c4-cellar'] },
    { id: 'C4-H-03', when: all(has.clue('c4-cellar'), not(has.clue('c4-dreams'))), cites: ['c4-cellar'] },
    { id: 'C4-H-04', when: has.visited('C4-6'), cites: ['c4-cellar', 'c4-tracks', 'c4-dreams'] },
  ], review: 'C4-H-04', exhausted: 'UI-hint.klubokEmptyShell' }, shell: { speaker: 'watsony', precision: 'exact', allowance: null, rules: [
    { id: 'C4-R-01', when: not(has.clue('c4-cellar')), cites: [] },
    { id: 'C4-R-02', when: all(has.clue('c4-cellar'), not(has.clue('c4-tracks'))), cites: ['c4-cellar'] },
    { id: 'C4-R-04', when: all(has.clue('c4-cellar'), not(has.clue('c4-dreams'))), cites: ['c4-cellar'] },
    { id: 'C4-R-03', when: has.visited('C4-6'), cites: ['c4-dreams'] },
  ], review: 'C4-R-03', exhausted: null } },
  minigames: [
    { id: 'c4l1-lupa', skill: 'magnifier', config: { kind: 'magnifier', targets: [
      { id: 'jar-circles', label: 'C4-2-B01', required: true, reply: ['C4-2-02'] }, { id: 'clean-floor', label: 'C4-2-B02', required: true, reply: ['C4-2-03'] }, { id: 'cart-track', label: 'C4-2-B03', required: true, reply: ['C4-2-04'] },
    ], afterFirst: [], afterFirstSkill: null, assistAfterMisses: 3 } },
    { id: 'c4l1-tracks', skill: 'tracks', config: { kind: 'tracks', steps: [
      { id: 'old', prompt: null, pageSize: 3, options: [choice('mouse', 'C4-4-B01', true, 'C4-4-03'), choice('hamster', 'C4-4-B02', false, 'C4-4-04'), choice('badger', 'C4-4-B03', false, 'C4-4-04')] },
      { id: 'fresh', prompt: null, pageSize: 3, options: [choice('mouse', 'C4-4-B01', false, 'C4-4-06'), choice('hamster', 'C4-4-B02', false, 'C4-4-06'), choice('badger', 'C4-4-B03', true, 'C4-4-05')] },
    ], question: null } },
    { id: 'c4l1-dreams', skill: 'dream-keeper', config: { kind: 'staged', mechanic: 'dream-keeper', description: 'Пухлик показывает карты-сны; ребёнок выбирает смысл.', steps: [
      { id: 'where', prompt: 'C4-5-N01', pageSize: 3, options: [choice('office', 'C4-5-B01', true, 'C4-5-05'), choice('mouse', 'C4-5-B02', false, 'C4-5-06'), choice('barrel', 'C4-5-B03', false, 'C4-5-06')] },
      { id: 'what', prompt: 'C4-5-N02', pageSize: 3, options: [choice('stock', 'C4-5-B04', true, 'C4-5-07'), choice('eaten', 'C4-5-B05', false, 'C4-5-06'), choice('broken', 'C4-5-B06', false, 'C4-5-06')] },
      { id: 'who', prompt: 'C4-5-N03', pageSize: 3, options: [choice('khvosts', 'C4-5-B07', true, 'C4-5-08'), choice('pudding', 'C4-5-B08', false, 'C4-5-06'), choice('mouse', 'C4-5-B09', false, 'C4-5-06')] },
    ], lines: [] } },
    { id: 'c4l1-tea', skill: 'equal-share', config: { kind: 'staged', mechanic: 'equal-share', description: 'Разделить варенье поровну.', steps: [
      { id: 'tables', prompt: 'C4-8-02', pageSize: 3, options: [choice('three', 'C4-8-B01', true, 'C4-8-04'), choice('four', 'C4-8-B02', false, 'C4-8-03'), choice('three-jars', 'C4-8-B03', false, 'C4-8-03')] },
    ], lines: [] } },
  ],
  facts, glossary, rewards, collections: [], activities: [activityCard], comfort: [{ scene: '*', line: 'C4-L-01' }], cutscenes: [], plannedCutscenes: commonCutscenes, decisions: [...baseDecisions], reserved: [{ lines: ['C4-F-01', 'C4-F-02', 'C4-F-03', 'C4-F-04', 'C4-F-05'], reason: 'семейный «Хранитель снов», Q34 handoff' }, { lines: ['C4-0-B01'], reason: 'названия новых механик и точки карты используются системами каталога' }],
};
