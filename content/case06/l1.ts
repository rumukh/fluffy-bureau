import { all, cl, dir, goto, has, L, menu, minigame, not, opt as mopt, reveal, seq, skill, when, type VariantSource } from '../../tools/content/dsl.ts';
import { activity, alleyScene, and, cabinetScene, collections, comfort, commonCutscenes, directionsMinigame, eq, facts, factsScene, glossary, intended, intro, ne, opt, rewardScene, versionIntro, what, where, who } from './common.ts';

const HUB = 'C6-HUB';
const ready = all(has.clue('c6-display'), has.clue('c6-time'), has.clue('c6-compass'));

export const level1: VariantSource = {
  pack: 'case06-l1', kind: 'case', title: 'C6-TITLE', case: { number: 6, level: 1 }, start: 'C6-0',
  scenes: [
    { id: 'C6-0', title: 'Тревога в Конторе', location: 'office', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'dialogue', steps: [...intro(), goto('C6-1')] },
    { id: 'C6-1', title: 'Витрина мэрии', location: 'mayor-office', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'hub', steps: [
      dir('C6-1-D01', 'Мэрия. Пустая витрина закрыта аккуратно.'), ...seq('C6-1-', 1, 7), skill('notebook', [dir('C6-1-D02', 'Блокнот раскрывается на трёх колонках дела.')]),
      menu('C6-M', null, [
        mopt('display', 'C6-1-B01', 'C6-2', { hideWhen: has.visited('C6-2') }),
        mopt('time', 'C6-1-B02', 'C6-3', { hideWhen: has.visited('C6-3') }),
        mopt('moss', 'C6-1-B03', 'C6-4', { hideWhen: has.visited('C6-4'), optional: true }),
        mopt('oak', 'C6-1-B04', 'C6-5', { when: all(has.clue('c6-display'), has.clue('c6-time')), hideWhen: has.visited('C6-5') }),
      ]),
    ] },
    { id: 'C6-2', title: 'Витрина: Лупа', location: 'mayor-office', cast: ['khvosts', 'watsony'], presentation: 'minigame', steps: [skill('magnifier', [L('C6-2-01')]), minigame('c6l1-magnifier'), ...seq('C6-2-', 2, 8), reveal('c6-display'), goto(HUB)] },
    { id: 'C6-3', title: 'Лента времени', location: 'town-square', cast: ['stella', 'fitilyok', 'khvosts', 'watsony'], presentation: 'minigame', steps: [skill('timeline', [L('C6-3-01'), L('C6-3-02')]), minigame('c6l1-timeline'), ...seq('C6-3-', 4, 8), reveal('c6-time'), goto(HUB)] },
    { id: 'C6-4', title: 'Мэр и мох', location: 'old-oak', cast: ['pudding', 'khvosts'], presentation: 'dialogue', steps: [...seq('C6-4-', 1, 3), goto(HUB)] },
    { id: HUB, title: 'Мэрия: выбор', location: 'mayor-office', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'hub', steps: [
      when(all(ready, not(has.visited('C6-6'))), [goto('C6-6')]),
      menu('C6-HM', null, [
        mopt('display', 'C6-1-B01', 'C6-2', { hideWhen: has.visited('C6-2') }),
        mopt('time', 'C6-1-B02', 'C6-3', { hideWhen: has.visited('C6-3') }),
        mopt('moss', 'C6-1-B03', 'C6-4', { hideWhen: has.visited('C6-4'), optional: true }),
        mopt('oak', 'C6-1-B04', 'C6-5', { when: all(has.clue('c6-display'), has.clue('c6-time')), hideWhen: has.visited('C6-5') }),
      ]),
    ] },
    { id: 'C6-5', title: 'Компас у Старого Дуба', location: 'old-oak', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'minigame', steps: [
      ...seq('C6-5-', 1, 7), L('C6-5-N01'), skill('compass', [L('C6-5-08'), L('C6-5-09')]), minigame('c6l1-compass'), ...seq('C6-5-', 10, 15), reveal('c6-compass'), goto(HUB),
    ] },
    versionIntro('C6-6', HUB), cabinetScene('C6-8'), alleyScene('C6-8', 1), { ...factsScene(), steps: [...factsScene().steps, goto('C6-10')] }, rewardScene(1),
  ],
  logic: {
    axes: [ { id: 'who', title: 'C6-AX-who', values: [who.shadow, who.stella, who.mice] }, { id: 'where', title: 'C6-AX-where', values: [where.roots, where.lighthouse, where.garden] }, { id: 'what', title: 'C6-AX-what', values: [what.quest, what.theft, what.lost] } ], intended,
    clues: [
      { id: 'c6-display', title: 'C6-CL-display', required: true, predicate: and(ne('what', 'theft'), ne('what', 'lost')), requires: [], source: 'C6-2', summary: 'Витрина цела; записка «Взят для игры» с серой печатью; карточка-лапка.' },
      { id: 'c6-time', title: 'C6-CL-time', required: true, predicate: and(ne('who', 'stella'), ne('who', 'mice')), requires: [], source: 'C6-3', summary: 'После дождя под карточками сухо; мышата спали с двух; Стелла спала до шести.' },
      { id: 'c6-compass', title: 'C6-CL-compass', required: true, predicate: and(eq('where', 'roots'), ne('where', 'lighthouse'), ne('where', 'garden'), eq('what', 'quest')), requires: ['c6-display', 'c6-time'], source: 'C6-5', summary: 'Карта с ориентирами и компас приводят к северным корням; это игра-квест.' },
    ],
    version: { button: 'C6-B-version', available: has.visited('C6-6'), onSolved: 'C6-7' },
    wrongVersion: { intro: [cl('C6-6-03')], byValue: [
      { axis: 'who', value: 'stella', clues: ['c6-time'], lines: [cl('C6-6-04')] }, { axis: 'who', value: 'mice', clues: ['c6-time'], lines: [cl('C6-6-05')] },
      { axis: 'where', value: 'lighthouse', clues: ['c6-compass'], lines: [cl('C6-6-06')] }, { axis: 'where', value: 'garden', clues: ['c6-compass'], lines: [cl('C6-6-06')] },
      { axis: 'what', value: 'theft', clues: ['c6-display'], lines: [cl('C6-6-07')] }, { axis: 'what', value: 'lost', clues: ['c6-display'], lines: [cl('C6-6-08')] },
    ], outro: [cl('C6-6-09')] },
    redHerrings: [
      { id: 'rh-c6-theft', summary: 'Пустая витрина похожа на кражу.', presentedBy: ['C6-1-02'], explainedBy: ['C6-7-09'] },
      { id: 'rh-c6-stella', summary: 'Стелла часто носит бумажки.', presentedBy: ['C6-1-06'], explainedBy: ['C6-7-10'] },
      { id: 'rh-c6-moss', summary: 'Мэр ищет север по мху.', presentedBy: ['C6-4-01', 'C6-4-02', 'C6-5-05'], explainedBy: ['C6-5-07', 'C6-7-11'] },
    ],
  },
  notebookHelp: { mode: 'suggest', marks: [
    { axis: 'who', value: 'shadow', mark: 'confirmed', clues: ['c6-display', 'c6-time'], line: 'C6-NB-01' }, { axis: 'who', value: 'stella', mark: 'excluded', clues: ['c6-time'], line: 'C6-NB-02' }, { axis: 'who', value: 'mice', mark: 'excluded', clues: ['c6-time'], line: 'C6-NB-03' },
    { axis: 'where', value: 'roots', mark: 'confirmed', clues: ['c6-compass'], line: 'C6-NB-06' }, { axis: 'where', value: 'lighthouse', mark: 'excluded', clues: ['c6-compass'], line: 'C6-NB-07' }, { axis: 'where', value: 'garden', mark: 'excluded', clues: ['c6-compass'], line: 'C6-NB-07' },
    { axis: 'what', value: 'quest', mark: 'confirmed', clues: ['c6-display', 'c6-compass'], line: 'C6-NB-10' }, { axis: 'what', value: 'theft', mark: 'excluded', clues: ['c6-display'], line: 'C6-NB-11' }, { axis: 'what', value: 'lost', mark: 'excluded', clues: ['c6-display'], line: 'C6-NB-12' },
  ], pointers: [], nothing: 'UI-notebook.nothing' },
  hints: { klubok: { speaker: 'khvosts', precision: 'exact', allowance: 3, rules: [ { id: 'C6-H-01', when: not(has.clue('c6-display')), cites: [] }, { id: 'C6-H-02', when: not(has.clue('c6-time')), cites: [] }, { id: 'C6-H-03', when: all(has.clue('c6-display'), has.clue('c6-time'), not(has.clue('c6-compass'))), cites: ['c6-display', 'c6-time'] }, { id: 'C6-H-04', when: has.visited('C6-5'), cites: ['c6-display', 'c6-time'] }, { id: 'C6-H-05', when: has.visited('C6-6'), cites: ['c6-display', 'c6-time', 'c6-compass'] } ], review: 'C6-H-05', exhausted: 'UI-hint.klubokEmptyShell' }, shell: { speaker: 'watsony', precision: 'exact', allowance: null, rules: [ { id: 'C6-R-01', when: not(has.clue('c6-display')), cites: [] }, { id: 'C6-R-04', when: not(has.clue('c6-time')), cites: [] }, { id: 'C6-R-03', when: all(has.clue('c6-display'), has.clue('c6-time'), not(has.clue('c6-compass'))), cites: ['c6-display', 'c6-time'] } ], review: 'C6-R-02', exhausted: null } },
  minigames: [
    { id: 'c6l1-magnifier', skill: 'magnifier', config: { kind: 'magnifier', targets: [ { id: 'lock', label: 'C6-2-B01', required: true, reply: ['C6-2-02'] }, { id: 'note', label: 'C6-2-B02', required: true, reply: ['C6-2-03', 'C6-2-04'] }, { id: 'card', label: 'C6-2-B03', required: true, reply: ['C6-2-05'] } ], afterFirst: [], afterFirstSkill: null, assistAfterMisses: 3 } },
    { id: 'c6l1-timeline', skill: 'timeline', config: { kind: 'timeline', items: [ { id: 'rain', time: '2:30', label: 'C6-3-B02' }, { id: 'mice', time: '3:00', label: 'C6-3-B03' }, { id: 'fitilyok', time: '4:00', label: 'C6-3-B04' }, { id: 'mayor', time: '5:00', label: 'C6-3-B05' }, { id: 'stella', time: '6:00', label: 'C6-3-B06' } ], solution: ['rain', 'mice', 'fitilyok', 'mayor', 'stella'], wrong: ['C6-3-03'] } },
    { id: 'c6l1-compass', skill: 'compass', config: { kind: 'staged', mechanic: 'Компас', description: 'Повернуть карту по стрелке компаса и выбрать северный корень.', steps: [ { id: 'map', prompt: 'C6-5-04', pageSize: 3, options: [opt('left', 'C6-5-B04', false, 'C6-5-10'), opt('right', 'C6-5-B05', false, 'C6-5-10'), opt('match', 'C6-5-B06', true, 'C6-5-11')] }, { id: 'root', prompt: 'C6-5-12', pageSize: 3, options: [opt('north', 'C6-5-B07', true, 'C6-5-13'), opt('south', 'C6-5-B08', false, 'C6-5-12'), opt('west', 'C6-5-B09', false, 'C6-5-12'), opt('east', 'C6-5-B10', false, 'C6-5-12')] } ], lines: ['C6-5-10', 'C6-5-11', 'C6-5-12', 'C6-5-13'] } },
    directionsMinigame('c6l1-alley', 1),
  ],
  facts, glossary, rewards: ['rw-c6-badge', 'rw-c6-buttons-l1', 'rw-c6-sticker-l1', 'rw-c6-decor-compass', 'rw-c6-title-detective', 'rw-c6-activity'], collections, activities: [activity], comfort, cutscenes: commonCutscenes, decisions: [
    { id: 'C6L1-D1', text: 'Кнопка версии — «Проверить версию», потому что Серую Тень нельзя пригласить на разговор.', ref: 'D08' },
    { id: 'C6L1-D2', text: 'Время карточек уточнено: дождь закончился в 2:30, под карточками сухо, мышата спят с 2:00, Стелла спит до 6:00.', ref: 'R03' },
    { id: 'C6L1-D3', text: 'Все четыре карточки-символа находятся на обязательном пути и входят в коллекцию symbol-cards.', ref: 'D10' },
  ],
};





