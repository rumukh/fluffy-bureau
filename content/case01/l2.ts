// Case 1, level 2 (4×4×4). SCRIPT_CASE01_LEVELS23_RU.md, L2-1…L2-9, expanded explicitly (R04).
import { all, cl, cutscene, dir, end, goto, has, L, menu, minigame, not, opt as mopt, reveal, reward, seq, skill, when, type VariantSource } from '../../tools/content/dsl.ts';
import {
  activity, and, bakerMeasures, eq, facts, factsScene, glossary, intended, intro, klubkiTutorial, ne, noConstraint, opt,
  rewardScene, versionScene, what, where, who,
} from './common.ts';
import { oven, reward as rewardCutscene, shedL2 } from '../cutscenes/index.ts';

const HUB = 'L2-HUB';
const ALL4 = ['eaten', 'mixed', 'cheeks', 'mail'];

export const level2: VariantSource = {
  pack: 'case01-l2',
  kind: 'case',
  title: 'C1-TITLE',
  case: { number: 1, level: 2 },
  start: 'L2-1',
  scenes: [
    {
      id: 'L2-1', title: 'Завязка', location: 'pirogovaya-street', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'dialogue',
      steps: [
        ...intro(),
        L('L2-1-01'),
        ...seq('C1-1-', 8, 12),
        L('L2-1-02'), L('L2-1-03'),
        skill('notebook', [dir('L2-1-D01', 'Блокнот раскрывается: три колонки, по четыре строки.'), ...seq('C1-1-', 15, 16)]),
        L('L2-1-04'), L('L2-1-05'),
        klubkiTutorial(),
        goto(HUB),
      ],
    },
    {
      id: HUB, title: 'Пироговая улица: выбор', location: 'pirogovaya-street', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'hub',
      steps: [
        when(all(has.clue('c1-lupa'), has.clue('c1-cocoa'), has.clue('c1-timeline'), has.clue('c1-tracks'), not(has.visited('L2-7'))), [goto('L2-7')]),
        menu('L2-M', null, [
          mopt('bench', 'C1-1-B01', 'L2-2', { hideWhen: has.visited('L2-2') }),
          mopt('tyopa', 'C1-1-B02', 'L2-3', { hideWhen: has.visited('L2-3') }),
          mopt('residents', 'L2-1-B01', 'L2-4', { hideWhen: all(has.visited('L2-4S'), has.visited('L2-6'), has.visited('C1-4')) }),
          mopt('tracks', 'C1-2-B01', 'L2-5', { when: has.visited('L2-2'), hideWhen: has.visited('L2-5') }),
        ]),
      ],
    },
    {
      id: 'L2-2', title: 'Скамейка: «Лупа»', location: 'bench', cast: ['khvosts', 'watsony'], presentation: 'minigame',
      steps: [skill('magnifier', [L('L2-2-01')]), minigame('c1l2-lupa'), dir('C1-2-D01', 'Игрок открывает коробку.'), ...seq('C1-2-', 5, 7), reveal('c1-lupa'), goto(HUB)],
    },
    {
      id: 'L2-3', title: 'Мыловарня: «Чашка какао», три раунда', location: 'soap-workshop', cast: ['tyopa', 'fitilyok', 'khvosts', 'watsony'], presentation: 'minigame',
      steps: [
        dir('C1-3-D01', 'Тёпа сидит у котла и прячет синие лапы за спину. Рядом светлячок Фитилёк.'),
        L('C1-3-01'), L('C1-3-02'),
        skill('cocoa', [L('C1-3-03')]),
        minigame('c1l2-cocoa'),
        reward('rw-c1-heart-tyopa'),
        ...seq('C1-3-', 12, 22),
        reveal('c1-cocoa'),
        goto(HUB),
      ],
    },
    {
      id: 'L2-4', title: 'Расспросы', location: 'pirogovaya-street', cast: ['khvosts', 'watsony'], presentation: 'hub',
      steps: [
        menu('L2-4-M', null, [
          mopt('stella', 'L2-4-B01', 'L2-4S', { hideWhen: has.visited('L2-4S') }),
          mopt('mayor', 'L2-4-B02', 'C1-4', { hideWhen: has.visited('C1-4'), optional: true }),
          mopt('clock', 'L2-4-B03', 'L2-6', { when: has.visited('L2-4S'), hideWhen: has.visited('L2-6') }),
          mopt('back', 'L2-4-B04', HUB),
        ], { back: HUB }),
      ],
    },
    {
      id: 'L2-4S', title: 'Разговор со Стеллой', location: 'post-box', cast: ['stella', 'khvosts', 'watsony'], presentation: 'dialogue',
      steps: [dir('L2-4-D01', 'Стелла сидит на почтовом ящике с большой сумкой.'), ...seq('L2-4-', 1, 8), goto('L2-4')],
    },
    {
      id: 'C1-4', title: 'Разговор с мэром', location: 'pirogovaya-street', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'dialogue',
      steps: [
        L('C1-4-01'), L('C1-4-02'),
        dir('C1-4-D01', 'Пудинг высыпает семечки в ладошку и смущённо собирает обратно.'),
        L('C1-4-03'), L('C1-4-04'), reveal('c1-mayor'), goto('L2-4'),
      ],
    },
    {
      id: 'L2-5', title: 'По следам: «Кто наследил?»', location: 'garden-path', cast: ['khvosts', 'watsony'], presentation: 'minigame',
      steps: [
        skill('tracks', [L('C1-5-01')]),
        minigame('c1l2-tracks'),
        dir('C1-5-D01', 'Следы ведут к сараю Картофана. Игрок нажимает на окно. У коробки мэра в крышке окошко, в нём виден пирог.'),
        ...seq('C1-5-', 5, 7),
        reveal('c1-tracks'),
        goto(HUB),
      ],
    },
    {
      id: 'L2-6', title: '«Лента времени»: часы на пекарне', location: 'bakery-clock', cast: ['khvosts', 'watsony'], presentation: 'minigame',
      steps: [
        dir('L2-6-D01', 'Часы на пекарне — заводные, с окошками. После каждого удара в окошке остаётся картинка.'),
        skill('timeline', seq('L2-6-', 1, 3)),
        minigame('c1l2-timeline'),
        ...seq('L2-6-', 5, 7),
        reveal('c1-timeline'),
        goto(HUB),
      ],
    },
    versionScene('L2-7', HUB),
    {
      id: 'L2-8', title: 'Разговор в сарае', location: 'shed', cast: ['kartofan', 'pudding', 'tyopa', 'stella', 'fitilyok', 'khvosts', 'watsony'], presentation: 'cutscene',
      steps: [cutscene('c1.shed.l2'), goto('L2-9')],
    },
    {
      id: 'L2-9', title: 'Финал: «Пекарь»', location: 'bakery', cast: ['pudding', 'kartofan', 'tyopa', 'stella', 'fitilyok', 'khvosts', 'watsony'], presentation: 'minigame',
      steps: [skill('baker', [L('C1-8-01')]), minigame('c1l2-baker'), cutscene('c1.oven'), goto('C1-9')],
    },
    { ...factsScene(), steps: [...factsScene().steps, goto('C1-10')] },
    rewardScene(2, [end()]),
  ],
  logic: {
    axes: [
      { id: 'who', title: 'C1-AX-who', values: [who.tyopa, who.kartofan, who.pudding, who.stella] },
      { id: 'where', title: 'C1-AX-where', values: [where.bakery, where.soap, where.post, where.shed] },
      { id: 'what', title: 'C1-AX-what', values: [what.eaten, what.mixed, what.cheeks, what.mail] },
    ],
    intended,
    clues: [
      { id: 'c1-lupa', title: 'C1-CL-lupa', required: true, predicate: noConstraint(ALL4), requires: [], source: 'L2-2', summary: 'Такая же коробка с рассадой; перо сороки. Открывает следы.' },
      { id: 'c1-cocoa', title: 'C1-CL-cocoa', required: true, predicate: and(ne('who', 'tyopa'), ne('where', 'soap')), requires: [], source: 'L2-3', summary: 'Алиби Тёпы (свидетель Фитилёк); кто-то щурился с коробкой.' },
      { id: 'c1-timeline', title: 'C1-CL-timeline', required: true, predicate: and(ne('who', 'stella'), ne('where', 'post'), ne('what', 'mail')), requires: [], source: 'L2-6', summary: 'Стелла улетела с почтой в 8:00, пирог появился в 9:00.' },
      { id: 'c1-tracks', title: 'C1-CL-tracks', required: true, predicate: and(eq('who', 'kartofan'), eq('where', 'shed'), ne('what', 'eaten'), ne('what', 'cheeks')), requires: ['c1-lupa'], source: 'L2-5', summary: 'Кротовые следы до сарая; в окошке коробки мэра виден несъеденный пирог (R03).' },
      { id: 'c1-mayor', title: 'C1-CL-mayor', required: false, predicate: ne('what', 'cheeks'), requires: [], source: 'C1-4', summary: 'В щеках у мэра семечки.' },
    ],
    version: { button: 'UI-hud.version', available: has.visited('L2-7'), onSolved: 'L2-8' },
    wrongVersion: {
      intro: [cl('C1-6-05')],
      byValue: [
        { axis: 'who', value: 'tyopa', clues: ['c1-cocoa'], lines: [cl('C1-6-06')] },
        { axis: 'who', value: 'pudding', clues: ['c1-tracks'], lines: [cl('C1-6-07')] },
        { axis: 'who', value: 'stella', clues: ['c1-timeline'], lines: [cl('L2-7-01')] },
        { axis: 'where', value: 'bakery', clues: ['c1-tracks'], lines: [cl('C1-6-08')] },
        { axis: 'where', value: 'soap', clues: ['c1-cocoa'], lines: [cl('C1-6-09')] },
        { axis: 'where', value: 'post', clues: ['c1-timeline'], lines: [cl('L2-7-02')] },
        { axis: 'what', value: 'eaten', clues: ['c1-tracks'], lines: [cl('C1-6-10')] },
        { axis: 'what', value: 'cheeks', clues: ['c1-tracks'], lines: [cl('C1-6-11')] },
        { axis: 'what', value: 'mail', clues: ['c1-timeline'], lines: [cl('L2-7-03')] },
      ],
      outro: [cl('C1-6-12')],
    },
    redHerrings: [
      { id: 'rh-c1-blue-paws', summary: 'Синие лапы Тёпы — черничное мыло.', presentedBy: ['C1-3-02'], explainedBy: ['C1-3-12', 'C1-7-11'] },
      { id: 'rh-c1-looks', summary: 'Подозрение «по виду»: Тёпа и Стелла.', presentedBy: ['C1-1-06', 'L2-1-01'], explainedBy: ['C1-7-13', 'C1-7-14', 'L2-8-03'] },
      { id: 'rh-c1-feather', summary: 'Перо сороки у скамейки: Стелла пролетала там в восемь.', presentedBy: ['L2-2-02'], explainedBy: ['L2-8-01'] },
      { id: 'rh-c1-stella-mistake', summary: 'Добросовестная ошибка: Стелла «видела Тёпу с коробкой» — это была коробка мыла.', presentedBy: ['L2-4-03'], explainedBy: ['L2-4-06', 'L2-8-02'] },
      { id: 'rh-c1-cheeks', summary: 'Полные щёки мэра — семечки.', presentedBy: ['C1-4-01'], explainedBy: ['C1-7-12'] },
    ],
  },
  notebookHelp: {
    mode: 'suggest',
    marks: [
      { axis: 'who', value: 'tyopa', mark: 'excluded', clues: ['c1-cocoa'], line: 'C1-6-06' },
      { axis: 'where', value: 'soap', mark: 'excluded', clues: ['c1-cocoa'], line: 'C1-6-09' },
      { axis: 'who', value: 'stella', mark: 'excluded', clues: ['c1-timeline'], line: 'L2-7-01' },
      { axis: 'where', value: 'post', mark: 'excluded', clues: ['c1-timeline'], line: 'L2-7-02' },
      { axis: 'what', value: 'mail', mark: 'excluded', clues: ['c1-timeline'], line: 'L2-7-03' },
      { axis: 'who', value: 'kartofan', mark: 'confirmed', clues: ['c1-tracks'], line: 'C1-NB-01' },
      { axis: 'who', value: 'pudding', mark: 'excluded', clues: ['c1-tracks'], line: 'C1-6-07' },
      { axis: 'where', value: 'shed', mark: 'confirmed', clues: ['c1-tracks'], line: 'C1-6-08' },
      { axis: 'where', value: 'bakery', mark: 'excluded', clues: ['c1-tracks'], line: 'C1-6-08' },
      { axis: 'what', value: 'eaten', mark: 'excluded', clues: ['c1-tracks'], line: 'C1-6-10' },
      { axis: 'what', value: 'cheeks', mark: 'excluded', clues: ['c1-mayor'], line: 'C1-4-04' },
      { axis: 'what', value: 'cheeks', mark: 'excluded', clues: ['c1-tracks'], line: 'C1-6-11' },
      { axis: 'what', value: 'mixed', mark: 'confirmed', clues: ['c1-tracks', 'c1-timeline'], line: 'L2-NB-01' },
    ],
    pointers: [],
    nothing: 'UI-notebook.nothing',
  },
  hints: {
    klubok: {
      speaker: 'khvosts', precision: 'exact', allowance: 3,
      rules: [
        { id: 'L2-H-01', when: not(has.clue('c1-lupa')), cites: [] },
        { id: 'L2-H-02', when: not(has.visited('L2-4S')), cites: [] },
        { id: 'L2-H-03', when: all(has.visited('L2-4S'), not(has.clue('c1-timeline'))), cites: [] },
        { id: 'L2-H-04', when: all(has.clue('c1-lupa'), not(has.clue('c1-tracks'))), cites: ['c1-lupa'] },
        { id: 'L2-H-05', when: not(has.clue('c1-cocoa')), cites: [] },
      ],
      review: 'L2-H-06',
      exhausted: 'UI-hint.klubokEmptyShell',
    },
    shell: {
      speaker: 'watsony', precision: 'vague', allowance: null,
      rules: [
        { id: 'L2-R-01', when: all(has.visited('L2-4S'), not(has.clue('c1-timeline'))), cites: [] },
        { id: 'L2-R-02', when: all(has.clue('c1-lupa'), not(has.clue('c1-tracks'))), cites: ['c1-lupa'] },
      ],
      review: 'L2-R-03',
      exhausted: null,
    },
  },
  minigames: [
    {
      id: 'c1l2-lupa', skill: 'magnifier',
      config: {
        kind: 'magnifier',
        targets: [
          { id: 'box', label: 'C1-2-B02', required: true, reply: ['C1-2-02'] },
          { id: 'soil', label: 'C1-2-B03', required: true, reply: ['C1-2-03'] },
          { id: 'paw-print', label: 'C1-2-B04', required: true, reply: ['C1-2-04'] },
          { id: 'feather', label: 'L2-2-B01', required: true, reply: ['L2-2-02'] },
        ],
        afterFirst: [], afterFirstSkill: null, assistAfterMisses: 3,
      },
    },
    {
      id: 'c1l2-cocoa', skill: 'cocoa',
      config: {
        kind: 'cocoa',
        rounds: [
          { id: 'r1', options: [opt('sort-out', 'C1-3-B01', true, 'C1-3-04'), opt('kind', 'C1-3-B02', true, 'C1-3-05'), opt('confess', 'C1-3-B03', false, 'C1-3-06')], retry: ['C1-3-07'] },
          { id: 'r2', options: [opt('show', 'C1-3-B04', true, 'C1-3-08'), opt('sit', 'C1-3-B05', true, 'C1-3-09'), opt('paws', 'C1-3-B06', false, 'C1-3-10')], retry: ['C1-3-11'] },
          { id: 'r3', options: [opt('thanks', 'L2-3-B01', true, 'L2-3-01'), opt('tell', 'L2-3-B02', true, 'L2-3-02'), opt('sure', 'L2-3-B03', false, 'L2-3-03')], retry: ['L2-3-04'] },
        ],
      },
    },
    {
      id: 'c1l2-tracks', skill: 'tracks',
      config: {
        kind: 'tracks',
        steps: [{
          id: 'wide', prompt: null, pageSize: 3,
          options: [opt('raccoon', 'C1-5-B01', false, 'C1-5-02'), opt('hamster', 'C1-5-B02', false, 'C1-5-03'), opt('mole', 'C1-5-B03', true, 'C1-5-04'), opt('magpie', 'L2-5-B01', false, 'L2-5-01')],
        }],
        question: null,
      },
    },
    {
      id: 'c1l2-timeline', skill: 'timeline',
      config: {
        kind: 'timeline',
        items: [
          { id: 't0800', time: '8:00', label: 'L2-6-B01' },
          { id: 't0900', time: '9:00', label: 'L2-6-B02' },
          { id: 't0930', time: '9:30', label: 'L2-6-B03' },
          { id: 't1000', time: '10:00', label: 'L2-6-B04' },
        ],
        solution: ['t0800', 't0900', 't0930', 't1000'],
        wrong: ['L2-6-04'],
      },
    },
    {
      id: 'c1l2-baker', skill: 'baker',
      config: {
        kind: 'baker',
        measures: bakerMeasures,
        steps: [
          { id: 'flour', prompt: 'C1-8-02', target: 16, ideal: ['cup'], afterWrong: [] },
          { id: 'sugar', prompt: 'C1-8-03', target: 4, ideal: ['half'], afterWrong: [] },
          { id: 'bilberry', prompt: 'C1-8-04', target: 8, ideal: ['cup'], afterWrong: [] },
          { id: 'honey', prompt: 'L2-9-01', target: 1, ideal: ['spoon'], afterWrong: [] },
        ],
        tooMuch: ['C1-8-05'],
        tooLittle: ['C1-8-06'],
      },
    },
  ],
  facts,
  glossary,
  rewards: ['rw-c1-heart-tyopa', 'rw-c1-badge', 'rw-c1-buttons-l2', 'rw-c1-sticker-l2', 'rw-c1-decor-basket', 'rw-c1-activity'],
  collections: [],
  activities: [activity],
  comfort: [],
  cutscenes: [shedL2, oven('L2-9'), rewardCutscene(2)],
  decisions: [
    { id: 'C1L2-T25', text: 'Ролики T25: разговор в сарае (L2-8, c1.shed.l2), пирог в печи (L2-9, c1.oven) и награда (C1-10, c1.reward). Реплики звучат в ролике в прежнем порядке; ремарки сцен заменены постановкой ролика; награды, «Уютный денёк» и переходы — шаги после ролика.', ref: 'T25' },
    { id: 'C1L2-D1', text: '«Часы на пекарне» открываются в меню «Расспросить жителей» (после разговора со Стеллой), а не на улице: иначе на экране было бы четыре варианта.', ref: 'Q11' },
    { id: 'C1L2-D2', text: 'В «Кто наследил?» четыре карточки; они показываются страницами по три.', ref: 'Q11' },
    { id: 'C1L2-D3', text: 'Ракушка (расплывчатая) не подсказывает начало дела: когда не подходит L2-R-01/02, звучит разбор L2-R-03. Клубок по-прежнему точен.', ref: 'D03' },
    { id: 'C1L2-D4', text: 'Сценарий собран явно, без «без изменений»: C1-1-13/14 заменены L2-1-02/03, C1-1-17/18 — L2-1-04/05, C1-7-15 — L2-8-03.', ref: 'R04' },
    { id: 'C1L2-D5', text: 'После мэра и Стеллы возвращаемся в меню расспросов; после часов — на улицу.', ref: 'Q11' },
  ],
};
