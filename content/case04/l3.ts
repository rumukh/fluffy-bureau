import { all, any, cl, cutscene, dir, goto, has, L, Ls, menu, minigame, not, opt as mopt, reveal, seq, skill, when, type VariantSource } from '../../tools/content/dsl.ts';
import { activityCard, and, baseDecisions, cartCompareConfig, choice, dreamKeeperConfig, equalShareConfig, eq, facts, factsScene, glossary, intended, introOffice, klubkiIntro, legacyChoiceLabels, ne, rewardScene, versionScene, what, where, who } from './common.ts';
import { cellarCutscene, officeCutscene, pantryCutscene, rewardCutscene, teaCutscene } from './cutscenes.ts';

const HUB = 'C4-L3-HUB';
const allClues = all(has.clue('c4-cellar'), has.clue('c4-tracks'), has.clue('c4-cart'), has.clue('c4-diary'), has.clue('c4-dreams'));
const rewards = ['rw-c4-badge', 'rw-c4-buttons-l3', 'rw-c4-sticker-l3', 'rw-c4-title-junior', 'rw-c4-decor-jar', 'rw-c4-activity'];

export const level3: VariantSource = {
  pack: 'case04-l3', kind: 'case', title: 'C4-TITLE', case: { number: 4, level: 3 }, start: 'C4-0',
  scenes: [
    { id: 'C4-0', title: 'Контора: мэр в отчаянии', location: 'office', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'cutscene', steps: [...introOffice(3), goto('C4-L3-1')] },
    { id: 'C4-L3-1', title: 'Завязка: пять подозреваемых', location: 'mayor-cellar', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'dialogue', steps: [
      cutscene('c4.cellar.l3'), skill('notebook', [dir('C4-L3-1-D01', 'Блокнот раскрывается: пять строк в двух колонках.', null, [{ op: 'sfx', asset: 'sfx.page-turn' }, { op: 'pose', actor: 'khvosts', clip: 'present' }]), L('C4-1-07')]), L('C4-L2-1-04'), L('C4-L2-1-05'), L('C4-1-09'), L('C4-L3-1-02'), klubkiIntro(), goto(HUB),
    ] },
    { id: HUB, title: 'Погреб: выбор', location: 'mayor-cellar', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'hub', steps: [
      when(all(allClues, not(has.visited('C4-L3-8'))), [goto('C4-L3-8')]),
      menu('C4-L3-M', null, [
        mopt('shelves', 'C4-1-B01', 'C4-L3-2', { hideWhen: has.visited('C4-L3-2') }),
        mopt('kartofan', 'C4-L3-3-B01', 'C4-L3-3', { hideWhen: any(has.visited('C4-L3-3'), has.clue('c4-cellar')), optional: true }),
        mopt('tracks', 'C4-2-B04', 'C4-L3-4', { when: has.clue('c4-cellar'), hideWhen: has.visited('C4-L3-4') }),
        mopt('cart', 'C4-L3-5-B01', 'C4-L3-5', { when: has.clue('c4-cellar'), hideWhen: has.visited('C4-L3-5') }),
        mopt('diary', 'C4-L2-4-B01', 'C4-L3-7', { when: has.visited('C4-L3-4'), hideWhen: has.visited('C4-L3-7') }),
        mopt('dreams', 'C4-1-B03', 'C4-L3-6', { when: has.clue('c4-cellar'), hideWhen: has.visited('C4-L3-6') }),
      ]),
    ] },
    { id: 'C4-L3-2', title: 'Полки: «Лупа»', location: 'mayor-cellar-shelves', cast: ['khvosts', 'watsony'], presentation: 'minigame', steps: [
      skill('magnifier', [L('C4-L3-2-01')], []), minigame('c4l3-lupa'), ...seq('C4-2-', 5, 6), reveal('c4-cellar'), goto(HUB),
    ] },
    { id: 'C4-L3-3', title: 'Картофан у входа', location: 'mayor-cellar-entrance', cast: ['kartofan', 'khvosts'], presentation: 'dialogue', steps: [...seq('C4-L3-3-', 1, 4), goto(HUB)] },
    { id: 'C4-L3-4', title: '«Кто наследил?»', location: 'cellar-steps', cast: ['khvosts', 'watsony'], presentation: 'minigame', steps: [
      ...seq('C4-4-', 1, 2), skill('tracks', [L('C4-4-N01')], []), minigame('c4l3-tracks'), ...seq('C4-4-', 7, 10), ...seq('C4-L2-3-', 2, 3), L('C4-L3-4-03'), reveal('c4-tracks'), goto(HUB),
    ] },
    { id: 'C4-L3-5', title: '«Чья тележка?»', location: 'mayor-yard-carts', cast: ['khvosts', 'watsony'], presentation: 'minigame', steps: [
      skill('cart-match', Ls('C4-L3-5-01', 'C4-L3-5-02')), minigame('c4l3-cart'), ...seq('C4-L3-5-', 4, 6), reveal('c4-cart'), goto(HUB),
    ] },
    { id: 'C4-L3-6', title: '«Хранитель снов»', location: 'mayor-cellar', cast: ['pukhlik', 'khvosts', 'watsony'], presentation: 'minigame', steps: [
      skill('dream-keeper', seq('C4-5-', 1, 4)), L('C4-L3-6-01'), minigame('c4l3-dreams'), reveal('c4-dreams'), goto(HUB),
    ] },
    { id: 'C4-L3-7', title: '«Лента времени»: дневник', location: 'office-diary', cast: ['watsony', 'khvosts'], presentation: 'minigame', steps: [
      skill('timeline', Ls('C4-L2-4-01', 'C4-L2-4-02'), [L('C4-L2-4-03')]), L('C4-L2-4-04'), minigame('c4l3-timeline'), ...seq('C4-L2-4-', 5, 8), L('C4-L3-7-01'), reveal('c4-diary'), goto(HUB),
    ] },
    versionScene('C4-L3-8', HUB),
    { id: 'C4-L3-9', title: 'Кладовка Конторы', location: 'office-pantry', cast: ['pudding', 'mouse', 'kartofan', 'pukhlik', 'khvosts', 'watsony'], presentation: 'cutscene', steps: [cutscene('c4.pantry.l3'), goto('C4-L3-10')] },
    { id: 'C4-L3-10', title: 'Большое чаепитие', location: 'town-square', cast: ['pudding', 'mouse', 'kartofan', 'pukhlik', 'khvosts', 'watsony'], presentation: 'minigame', steps: [
      skill('equal-share', []), minigame('c4l3-tea'), cutscene('c4.tea.l3'), goto('C4-9'),
    ] },
    factsScene('C4-10'), rewardScene(3),
  ],
  logic: {
    axes: [
      { id: 'who', title: 'C4-AX-who', values: [who.khvosts, who.pudding, who.mouse, who.watsony, who.kartofan] },
      { id: 'where', title: 'C4-AX-where', values: [where.office, where.mouse, where.barrel, where.attic, where.shed] },
      { id: 'what', title: 'C4-AX-what', values: [what.stock, what.eaten, what.broken, what.shared] },
    ], intended,
    clues: [
      { id: 'c4-cellar', title: 'C4-CL-cellar', required: true, predicate: and(ne('where', 'cellar-barrel'), ne('what', 'eaten'), ne('what', 'broken')), requires: [], source: 'C4-L3-2', summary: 'Как на сложности 2 плюс земля у порога.' },
      { id: 'c4-tracks', title: 'C4-CL-tracks', required: true, predicate: and(eq('who', 'khvosts'), ne('who', 'kartofan')), requires: ['c4-cellar'], source: 'C4-L3-4', summary: 'Барсучьи следы у полок; кротовые только у порога.' },
      { id: 'c4-cart', title: 'C4-CL-cart', required: true, predicate: ne('where', 'kartofan-shed'), requires: ['c4-cellar'], source: 'C4-L3-5', summary: 'Узкое колесо со звёздочкой — тележка Конторы, не Картофана.' },
      { id: 'c4-diary', title: 'C4-CL-diary', required: true, predicate: and(ne('who', 'watsony'), ne('what', 'shared-early')), requires: ['c4-tracks'], source: 'C4-L3-7', summary: 'Картофан был днём; Хвостс ушёл вечером; Ватсони была дома.' },
      { id: 'c4-dreams', title: 'C4-CL-dreams', required: true, predicate: and(eq('where', 'office-pantry'), eq('what', 'secret-stock')), requires: ['c4-cellar'], source: 'C4-L3-6', summary: 'Хитрые сны указывают на Контору и тайный запас.' },
    ],
    version: { button: 'UI-hud.version', available: has.visited('C4-L3-8'), onSolved: 'C4-L3-9' },
    wrongVersion: { intro: [cl('C4-6-03')], byValue: [
      { axis: 'who', value: 'pudding', clues: ['c4-tracks'], lines: [cl('C4-6-04')] },
      { axis: 'who', value: 'mouse', clues: ['c4-tracks'], lines: [cl('C4-6-05')] },
      { axis: 'who', value: 'watsony', clues: ['c4-diary'], lines: [cl('C4-L2-6-01')] },
      { axis: 'who', value: 'kartofan', clues: ['c4-tracks'], lines: [cl('C4-L3-8-01')] },
      { axis: 'where', value: 'mouse-hole', clues: ['c4-dreams'], lines: [cl('C4-6-06')] },
      { axis: 'where', value: 'cellar-barrel', clues: ['c4-cellar'], lines: [cl('C4-6-07')] },
      { axis: 'where', value: 'mayor-attic', clues: ['c4-dreams'], lines: [cl('C4-L2-6-02')] },
      { axis: 'where', value: 'kartofan-shed', clues: ['c4-cart'], lines: [cl('C4-L3-8-02')] },
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
      { id: 'rh-c4-kartofan', summary: 'Картофан привозил картошку, но не спускался.', presentedBy: ['C4-L3-1-01', 'C4-L3-3-01'], explainedBy: ['C4-L3-9-01', 'C4-L3-9-03'] },
      { id: 'rh-c4-kartofan-cart', summary: 'Тележка Картофана не совпадает со следом.', presentedBy: ['C4-L3-5-01'], explainedBy: ['C4-L3-9-02'] },
    ],
  },
  notebookHelp: { mode: 'point', marks: [
    { axis: 'who', value: 'khvosts', mark: 'confirmed', clues: ['c4-tracks'], line: 'C4-NB-01' },
    { axis: 'who', value: 'pudding', mark: 'excluded', clues: ['c4-tracks'], line: 'C4-6-04' },
    { axis: 'who', value: 'mouse', mark: 'excluded', clues: ['c4-tracks'], line: 'C4-6-05' },
    { axis: 'who', value: 'watsony', mark: 'excluded', clues: ['c4-diary'], line: 'C4-L2-NB-01' },
    { axis: 'who', value: 'kartofan', mark: 'excluded', clues: ['c4-tracks'], line: 'C4-L3-NB-01' },
    { axis: 'where', value: 'office-pantry', mark: 'confirmed', clues: ['c4-dreams'], line: 'C4-NB-02' },
    { axis: 'where', value: 'mouse-hole', mark: 'excluded', clues: ['c4-dreams'], line: 'C4-6-06' },
    { axis: 'where', value: 'cellar-barrel', mark: 'excluded', clues: ['c4-cellar'], line: 'C4-NB-06' },
    { axis: 'where', value: 'mayor-attic', mark: 'excluded', clues: ['c4-dreams'], line: 'C4-L2-NB-03' },
    { axis: 'where', value: 'kartofan-shed', mark: 'excluded', clues: ['c4-cart'], line: 'C4-L3-NB-02' },
    { axis: 'what', value: 'secret-stock', mark: 'confirmed', clues: ['c4-dreams'], line: 'C4-NB-03' },
    { axis: 'what', value: 'eaten', mark: 'excluded', clues: ['c4-cellar'], line: 'C4-NB-04' },
    { axis: 'what', value: 'broken', mark: 'excluded', clues: ['c4-cellar'], line: 'C4-NB-05' },
    { axis: 'what', value: 'shared-early', mark: 'excluded', clues: ['c4-diary'], line: 'C4-L2-NB-02' },
  ], pointers: [
    { clue: 'c4-cellar', line: 'C4-L3-NB-P01' }, { clue: 'c4-tracks', line: 'C4-L3-NB-P02' }, { clue: 'c4-cart', line: 'C4-L3-NB-P03' }, { clue: 'c4-diary', line: 'C4-L3-NB-P04' }, { clue: 'c4-dreams', line: 'C4-L3-NB-P05' },
  ], nothing: 'UI-notebook.nothing' },
  hints: { klubok: { speaker: 'khvosts', precision: 'exact', allowance: 3, rules: [
    { id: 'C4-L3-H-01', when: not(has.clue('c4-cellar')), cites: [] },
    { id: 'C4-L3-H-02', when: all(has.clue('c4-cellar'), not(has.clue('c4-tracks'))), cites: ['c4-cellar'] },
    { id: 'C4-L3-H-03', when: all(has.clue('c4-cellar'), not(has.clue('c4-cart'))), cites: ['c4-cellar'] },
    { id: 'C4-L3-H-04', when: all(has.clue('c4-tracks'), not(has.clue('c4-diary'))), cites: ['c4-tracks'] },
    { id: 'C4-L3-H-05', when: all(has.clue('c4-cellar'), not(has.clue('c4-dreams'))), cites: ['c4-cellar'] },
    { id: 'C4-L3-H-06', when: has.visited('C4-L3-8'), cites: ['c4-cellar', 'c4-tracks', 'c4-cart', 'c4-diary', 'c4-dreams'] },
  ], review: 'C4-L3-H-06', exhausted: 'UI-hint.klubokEmpty' }, shell: null },
  minigames: [
    { id: 'c4l3-lupa', skill: 'magnifier', config: { kind: 'magnifier', targets: [
      { id: 'jar-circles', label: 'C4-2-B01', required: true, reply: ['C4-2-02'] }, { id: 'clean-floor', label: 'C4-2-B02', required: true, reply: ['C4-2-03'] }, { id: 'cart-track', label: 'C4-2-B03', required: true, reply: ['C4-2-04'] }, { id: 'patch', label: 'C4-L2-2-B01', required: true, reply: ['C4-L2-2-02'] }, { id: 'soil', label: 'C4-L3-2-B01', required: true, reply: ['C4-L3-2-02'] },
    ], afterFirst: [], afterFirstSkill: null, assistAfterMisses: 3 } },
    { id: 'c4l3-tracks', skill: 'tracks', config: { kind: 'tracks', steps: [
      { id: 'old', prompt: null, pageSize: 3, options: [choice('mouse', 'C4-4-B01', true, 'C4-4-03'), choice('hamster', 'C4-4-B02', false, 'C4-4-04'), choice('badger', 'C4-4-B03', false, 'C4-4-04'), choice('hedgehog', 'C4-L2-3-B01', false, 'C4-4-04')] },
      { id: 'fresh', prompt: null, pageSize: 3, options: [choice('badger', 'C4-4-B03', true, 'C4-4-05'), choice('mouse', 'C4-4-B01', false, 'C4-4-06'), choice('hedgehog', 'C4-L2-3-B01', false, 'C4-L2-3-01')] },
      { id: 'porch', prompt: null, pageSize: 3, options: [choice('mole', 'C4-L3-4-B01', true, 'C4-L3-4-01'), choice('badger', 'C4-4-B03', false, 'C4-L3-4-02'), choice('hedgehog', 'C4-L2-3-B01', false, 'C4-L3-4-02')] },
    ], question: null } },
    { id: 'c4l3-cart', skill: 'cart-match', config: cartCompareConfig },
    { id: 'c4l3-timeline', skill: 'timeline', config: { kind: 'timeline', items: [
      { id: 'count', time: 'три недели назад', label: 'C4-L2-4-B02' }, { id: 'rule', time: 'три недели назад', label: 'C4-L2-4-B03' }, { id: 'kartofan', time: 'две недели назад, день', label: 'C4-L3-7-B01' }, { id: 'cart', time: 'две недели назад, вечер', label: 'C4-L2-4-B04' }, { id: 'home', time: 'две недели назад, вечер', label: 'C4-L2-4-B05' },
    ], solution: ['count', 'rule', 'kartofan', 'cart', 'home'], wrong: ['C4-L2-4-09'] } },
    { id: 'c4l3-dreams', skill: 'dream-keeper', config: dreamKeeperConfig(3, ['C4-5-N01', 'C4-5-N02', 'C4-5-N03']) },
    { id: 'c4l3-tea', skill: 'equal-share', config: equalShareConfig(3) },
  ],
  facts, glossary, rewards, collections: [], activities: [activityCard], comfort: [{ scene: '*', line: 'C4-L-01' }], cutscenes: [
    officeCutscene('c4.office.l3'),
    cellarCutscene('c4.cellar.l3', 'C4-L3-1', [
      { op: 'line', actor: 'pudding', line: 'C4-L2-1-01' },
      { op: 'line', actor: 'watsony', line: 'C4-L2-1-02' },
      { op: 'line', actor: 'watsony', line: 'C4-L2-1-03' },
      { op: 'line', actor: 'pudding', line: 'C4-L3-1-01' },
    ]),
    pantryCutscene('c4.pantry.l3', 'C4-L3-9', 3),
    teaCutscene('c4.tea.l3', 'C4-L3-10', 3),
    rewardCutscene('c4.reward.l3', 3),
  ], decisions: [...baseDecisions, { id: 'C4L3-D1', text: '«Чья тележка?» использует тележку Конторы со звёздочкой из угла офиса с дела 1.', ref: 'D19, SCRIPT_INDEX_RU §5' }], reserved: [{ lines: ['C4-0-B01', ...legacyChoiceLabels], reason: 'названия новых механик и старые подписи выбора сохраняются для систем каталога' }],
};
