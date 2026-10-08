// Case 1, level 3 (5×5×4). SCRIPT_CASE01_LEVELS23_RU.md, L3-1…L3-10, expanded explicitly (R04).
import { act, all, cl, cutscene, dir, end, goto, has, L, Ls, menu, minigame, not, opt as mopt, reveal, reward, seq, skill, tap, when, type VariantSource } from '../../tools/content/dsl.ts';
import {
  activity, and, bakerMeasures, eq, facts, factsScene, glossary, intended, intro, klubkiTutorial, ne, noConstraint, opt,
  rewardScene, versionScene, what, where, who,
} from './common.ts';
import { oven, reward as rewardCutscene, shedL3 } from '../cutscenes/index.ts';

const HUB = 'L3-HUB';
const ALL4 = ['eaten', 'mixed', 'cheeks', 'mail'];
const residentsDone = all(has.visited('L3-4S'), has.visited('L3-4M'), has.visited('L3-4P'), has.visited('L3-6'));

export const level3: VariantSource = {
  pack: 'case01-l3',
  kind: 'case',
  title: 'C1-TITLE',
  case: { number: 1, level: 3 },
  start: 'L3-1',
  scenes: [
    {
      id: 'L3-1', title: 'Завязка', location: 'pirogovaya-street', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'dialogue',
      steps: [
        ...intro(),
        L('L3-1-01'), L('L3-1-02'),
        ...seq('C1-1-', 8, 12),
        L('L3-1-03'), L('L3-1-04'), L('C1-1-14'),
        skill('notebook', [dir('L3-1-D01', 'Блокнот раскрывается: три колонки, до пяти строк.', null, [act.sfx('page-turn', 0.6)]), ...seq('C1-1-', 15, 16)]),
        L('L2-1-04'), L('L2-1-05'),
        klubkiTutorial(),
        goto(HUB),
      ],
    },
    {
      id: HUB, title: 'Пироговая улица: выбор', location: 'pirogovaya-street', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'hub',
      steps: [
        when(all(has.clue('c1-lupa'), has.clue('c1-cocoa'), has.clue('c1-timeline'), has.clue('c1-tracks'), has.clue('c1-scents'), not(has.visited('L3-8'))), [goto('L3-8')]),
        menu('L3-M', null, [
          mopt('bench', 'C1-1-B01', 'L3-2', { hideWhen: has.visited('L3-2') }),
          mopt('tyopa', 'C1-1-B02', 'L3-3', { hideWhen: has.visited('L3-3') }),
          mopt('residents', 'L2-1-B01', 'L3-4', { hideWhen: residentsDone }),
          mopt('tracks', 'C1-2-B01', 'L3-5', { when: has.visited('L3-2'), hideWhen: has.visited('L3-5') }),
          mopt('sniff', 'L3-5-B04', 'L3-7', { when: has.visited('L3-5'), hideWhen: has.visited('L3-7') }),
        ]),
      ],
    },
    {
      id: 'L3-2', title: 'Скамейка: «Лупа»', location: 'bench', cast: ['khvosts', 'watsony'], presentation: 'minigame',
      steps: [skill('magnifier', [L('L3-2-01')]), minigame('c1l3-lupa'), dir('C1-2-D01', 'Игрок открывает коробку.', null, [act.sfx('pick-up', 0.6)]), ...seq('C1-2-', 5, 7), reveal('c1-lupa'), goto(HUB)],
    },
    {
      id: 'L3-3', title: 'Мыловарня: «Чашка какао», три раунда', location: 'soap-workshop', cast: ['tyopa', 'fitilyok', 'khvosts', 'watsony'], presentation: 'minigame',
      steps: [
        dir('C1-3-D01', 'Тёпа сидит у котла и прячет синие лапы за спину. Рядом светлячок Фитилёк.', null, [act.pose('tyopa', { expression: 'worried', clip: 'shrug-shy' }), act.pose('fitilyok', { clip: 'hover' })]),
        L('C1-3-01'), L('C1-3-02'),
        skill('cocoa', [L('C1-3-03')]),
        minigame('c1l3-cocoa'),
        reward('rw-c1-heart-tyopa-l3'),
        ...seq('C1-3-', 12, 22),
        reveal('c1-cocoa'),
        goto(HUB),
      ],
    },
    {
      id: 'L3-4', title: 'Расспросы', location: 'pirogovaya-street', cast: ['khvosts', 'watsony'], presentation: 'hub',
      steps: [
        when(residentsDone, [goto(HUB)]),
        menu('L3-4-M', null, [
          mopt('stella', 'NM-stella', 'L3-4S', { hideWhen: has.visited('L3-4S') }),
          mopt('mice', 'NM-mouse', 'L3-4M', { hideWhen: has.visited('L3-4M'), optional: true }),
          mopt('mayor', 'NM-pudding', 'L3-4P', { hideWhen: has.visited('L3-4P'), optional: true }),
          mopt('clock', 'L2-4-B03', 'L3-6', { when: has.visited('L3-4S'), hideWhen: has.visited('L3-6') }),
        ], { back: HUB }),
      ],
    },
    {
      id: 'L3-4S', title: 'Стелла', location: 'post-box', cast: ['stella', 'khvosts', 'watsony'], presentation: 'dialogue',
      steps: [dir('L2-4-D01', 'Стелла сидит на почтовом ящике с большой сумкой.', null, [act.pose('stella', { face: 'left', clip: 'nod' })]), ...Ls('L2-4-01', 'L2-4-02', 'L3-4-01', 'L2-4-08'), goto('L3-4')],
    },
    {
      id: 'L3-4M', title: 'Мышата Шуршики', location: 'mouse-hole', cast: ['mouse', 'khvosts', 'watsony'], presentation: 'dialogue',
      steps: [dir('L3-4-D01', 'Мышата Шуршики выглядывают из норки у пекарни.', null, [act.pose('mouse', { clip: 'look-around' })]), ...seq('L3-4-', 2, 4), goto('L3-4')],
    },
    {
      id: 'L3-4P', title: 'Мэр: щёки и время', location: 'pirogovaya-street', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'dialogue',
      steps: [
        L('C1-4-01'), L('C1-4-02'),
        dir('C1-4-D01', 'Пудинг высыпает семечки в ладошку и смущённо собирает обратно.', null, [act.pose('pudding', { expression: 'surprised', clip: 'shrug-shy' }), act.sfx('pick-up', 0.5)]),
        L('C1-4-03'), L('C1-4-04'), reveal('c1-mayor'),
        ...seq('L3-4-', 5, 7),
        when(has.visited('L3-6'), [L('L3-4-08')]),
        goto('L3-4'),
      ],
    },
    {
      id: 'L3-5', title: '«Кто наследил?»: два следа', location: 'garden-path', cast: ['khvosts', 'watsony'], presentation: 'minigame',
      steps: [L('L3-5-01'), skill('tracks', [L('C1-5-01')], []), minigame('c1l3-tracks'), ...seq('L3-5-', 7, 9), reveal('c1-tracks'), goto(HUB)],
    },
    {
      id: 'L3-6', title: '«Лента времени»: пять карточек', location: 'bakery-clock', cast: ['khvosts', 'watsony'], presentation: 'minigame',
      steps: [
        dir('L2-6-D01', 'Часы на пекарне — заводные, с окошками. После каждого удара в окошке остаётся картинка.', null, [act.effect('sparkles', 760, 360, 1.5), act.sfx('sparkle', 0.4)]),
        skill('timeline', seq('L2-6-', 1, 3), [L('L3-6-01')]),
        minigame('c1l3-timeline'),
        ...Ls('L2-6-05', 'L2-6-06', 'L3-6-02', 'L2-6-07'),
        reveal('c1-timeline'),
        when(has.visited('L3-4P'), [L('L3-4-08')]),
        goto(HUB),
      ],
    },
    {
      id: 'L3-7', title: '«Пары запахов»', location: 'garden-and-shed', cast: ['khvosts', 'watsony'], presentation: 'minigame',
      steps: [
        dir('L3-7-D01', 'У огорода и у сарая лежат перевёрнутые карточки-запахи. Огород и сарай — явно разные места.', null, [act.sfx('card-flip', 0.6)]),
        skill('scent-pairs', seq('L3-7-', 1, 2)),
        minigame('c1l3-scents'),
        dir('L3-7-D03', 'Стена сарая мягко светится: в ней щёлка.', null, [act.effect('sparkles', 1700, 800, 1.5)]),
        tap('shed'),
        dir('L3-7-D02', 'Щёлка в стене сарая крупно: коробка мэра, в окошке крышки виден пирог.', 'bg.shed-window', [act.sfx('magnifier-find', 0.6)]),
        ...seq('L3-7-', 7, 9),
        reveal('c1-scents'),
        goto(HUB),
      ],
    },
    versionScene('L3-8', HUB),
    {
      id: 'L3-9', title: 'Разговор в сарае', location: 'shed', cast: ['kartofan', 'pudding', 'tyopa', 'stella', 'mouse', 'fitilyok', 'khvosts', 'watsony'], presentation: 'cutscene',
      steps: [cutscene('c1.shed.l3'), goto('L3-10')],
    },
    {
      id: 'L3-10', title: 'Финал: «Пекарь», двойной рецепт', location: 'bakery', cast: ['pudding', 'kartofan', 'tyopa', 'stella', 'mouse', 'fitilyok', 'khvosts', 'watsony'], presentation: 'minigame',
      steps: [skill('baker', [L('L3-10-01')]), minigame('c1l3-baker'), cutscene('c1.oven.l3'), goto('C1-9')],
    },
    { ...factsScene(), steps: [...factsScene().steps, goto('C1-10')] },
    rewardScene(3, [end()]),
  ],
  logic: {
    axes: [
      { id: 'who', title: 'C1-AX-who', values: [who.tyopa, who.kartofan, who.pudding, who.stella, who.mice] },
      { id: 'where', title: 'C1-AX-where', values: [where.bakery, where.soap, where.post, where.garden, where.shed] },
      { id: 'what', title: 'C1-AX-what', values: [what.eaten, what.mixed, what.cheeks, what.mail] },
    ],
    intended,
    clues: [
      { id: 'c1-lupa', title: 'C1-CL-lupa', required: true, predicate: noConstraint(ALL4), requires: [], source: 'L3-2', summary: 'Коробка с рассадой; перо; маковые крошки. Открывает следы.' },
      { id: 'c1-cocoa', title: 'C1-CL-cocoa', required: true, predicate: and(ne('who', 'tyopa'), ne('where', 'soap')), requires: [], source: 'L3-3', summary: 'Алиби Тёпы; кто-то щурился с коробкой.' },
      { id: 'c1-timeline', title: 'C1-CL-timeline', required: true, predicate: and(ne('who', 'stella'), ne('who', 'mice'), ne('where', 'post'), ne('what', 'mail')), requires: [], source: 'L3-6', summary: 'Стелла улетела в 8:00; пирог в 9:00; пропал к 10:00; мышата пришли в 10:30.' },
      { id: 'c1-tracks', title: 'C1-CL-two-tracks', required: true, predicate: eq('who', 'kartofan'), requires: ['c1-lupa'], source: 'L3-5', summary: 'Мышиный след — к норке, лёгкий; кротовый — глубокий, в огород, где теряется.' },
      { id: 'c1-scents', title: 'C1-CL-scents', required: true, predicate: and(eq('where', 'shed'), ne('what', 'eaten'), ne('what', 'cheeks')), requires: ['c1-tracks'], source: 'L3-7', summary: 'Черникой и тестом пахнет у сарая; в щёлку видна коробка мэра, в окошке несъеденный пирог (R03).' },
      { id: 'c1-mayor', title: 'C1-CL-mayor', required: false, predicate: ne('what', 'cheeks'), requires: [], source: 'L3-4P', summary: 'В щеках у мэра семечки.' },
    ],
    version: { button: 'UI-hud.version', available: has.visited('L3-8'), onSolved: 'L3-9' },
    wrongVersion: {
      intro: [cl('C1-6-05')],
      byValue: [
        { axis: 'who', value: 'tyopa', clues: ['c1-cocoa'], lines: [cl('C1-6-06')] },
        { axis: 'who', value: 'pudding', clues: ['c1-tracks'], lines: [cl('C1-6-07')] },
        { axis: 'who', value: 'stella', clues: ['c1-timeline'], lines: [cl('L2-7-01')] },
        { axis: 'who', value: 'mice', clues: ['c1-timeline'], lines: [cl('L3-8-01')] },
        { axis: 'where', value: 'bakery', clues: ['c1-scents'], lines: [cl('L3-8-02')] },
        { axis: 'where', value: 'soap', clues: ['c1-cocoa'], lines: [cl('C1-6-09')] },
        { axis: 'where', value: 'post', clues: ['c1-timeline'], lines: [cl('L2-7-02')] },
        { axis: 'where', value: 'garden', clues: ['c1-scents'], lines: [cl('L3-8-03')] },
        { axis: 'what', value: 'eaten', clues: ['c1-scents'], lines: [cl('L3-8-04')] },
        { axis: 'what', value: 'cheeks', clues: ['c1-scents'], lines: [cl('C1-6-11')] },
        { axis: 'what', value: 'mail', clues: ['c1-timeline'], lines: [cl('L2-7-03')] },
      ],
      outro: [cl('C1-6-12')],
    },
    redHerrings: [
      { id: 'rh-c1-blue-paws', summary: 'Синие лапы Тёпы — черничное мыло.', presentedBy: ['C1-3-02'], explainedBy: ['C1-3-12', 'C1-7-11'] },
      { id: 'rh-c1-looks', summary: 'Подозрение «по виду»: Тёпа, Стелла, Шуршики.', presentedBy: ['C1-1-06', 'L3-1-01', 'L3-1-02'], explainedBy: ['C1-7-13', 'C1-7-14', 'L3-9-03'] },
      { id: 'rh-c1-feather', summary: 'Перо сороки: Стелла пролетала там в восемь.', presentedBy: ['L2-2-02'], explainedBy: ['L2-8-01'] },
      { id: 'rh-c1-crumbs', summary: 'Маковые крошки — от булочки мэра.', presentedBy: ['L3-2-02'], explainedBy: ['L3-9-01'] },
      { id: 'rh-c1-mouse-track', summary: 'Мышиный след: мышата собирали крошки, след ведёт к норке.', presentedBy: ['L3-5-02'], explainedBy: ['L3-9-02'] },
      { id: 'rh-c1-cheeks', summary: 'Полные щёки мэра — семечки.', presentedBy: ['C1-4-01'], explainedBy: ['C1-7-12'] },
      { id: 'rh-c1-mayor-time', summary: 'Добросовестная ошибка: мэр называет 9:00 вместо 9:30 и сам поправляется.', presentedBy: ['L3-4-06'], explainedBy: ['L3-4-08'] },
    ],
  },
  notebookHelp: {
    mode: 'point',
    marks: [
      { axis: 'who', value: 'tyopa', mark: 'excluded', clues: ['c1-cocoa'], line: 'C1-6-06' },
      { axis: 'where', value: 'soap', mark: 'excluded', clues: ['c1-cocoa'], line: 'C1-6-09' },
      { axis: 'who', value: 'stella', mark: 'excluded', clues: ['c1-timeline'], line: 'L2-7-01' },
      { axis: 'who', value: 'mice', mark: 'excluded', clues: ['c1-timeline'], line: 'L3-8-01' },
      { axis: 'where', value: 'post', mark: 'excluded', clues: ['c1-timeline'], line: 'L2-7-02' },
      { axis: 'what', value: 'mail', mark: 'excluded', clues: ['c1-timeline'], line: 'L2-7-03' },
      { axis: 'who', value: 'kartofan', mark: 'confirmed', clues: ['c1-tracks'], line: 'L3-5-06' },
      { axis: 'who', value: 'pudding', mark: 'excluded', clues: ['c1-tracks'], line: 'C1-6-07' },
      { axis: 'where', value: 'shed', mark: 'confirmed', clues: ['c1-scents'], line: 'L3-7-06' },
      { axis: 'where', value: 'garden', mark: 'excluded', clues: ['c1-scents'], line: 'L3-8-03' },
      { axis: 'where', value: 'bakery', mark: 'excluded', clues: ['c1-scents'], line: 'L3-8-02' },
      { axis: 'what', value: 'eaten', mark: 'excluded', clues: ['c1-scents'], line: 'L3-8-04' },
      { axis: 'what', value: 'cheeks', mark: 'excluded', clues: ['c1-mayor'], line: 'C1-4-04' },
      { axis: 'what', value: 'cheeks', mark: 'excluded', clues: ['c1-scents'], line: 'C1-6-11' },
      { axis: 'what', value: 'mixed', mark: 'confirmed', clues: ['c1-timeline', 'c1-scents'], line: 'L2-NB-01' },
    ],
    pointers: [
      { clue: 'c1-lupa', line: 'L3-NB-01' },
      { clue: 'c1-cocoa', line: 'L3-NB-02' },
      { clue: 'c1-timeline', line: 'L3-NB-03' },
      { clue: 'c1-tracks', line: 'L3-NB-04' },
      { clue: 'c1-scents', line: 'L3-NB-05' },
      { clue: 'c1-mayor', line: 'L3-NB-06' },
    ],
    nothing: 'UI-notebook.nothing',
  },
  hints: {
    klubok: {
      speaker: 'khvosts', precision: 'exact', allowance: 3,
      rules: [
        { id: 'L3-H-01', when: not(has.clue('c1-lupa')), cites: [] },
        { id: 'L2-H-02', when: not(has.visited('L3-4S')), cites: [] },
        { id: 'L3-H-02', when: all(has.visited('L3-4S'), not(has.clue('c1-timeline'))), cites: [] },
        { id: 'L2-H-04', when: all(has.clue('c1-lupa'), not(has.visited('L3-5'))), cites: ['c1-lupa'] },
        { id: 'L3-H-03', when: all(has.visited('L3-5'), not(has.clue('c1-tracks'))), cites: [] },
        { id: 'L3-H-04', when: all(has.clue('c1-tracks'), not(has.clue('c1-scents'))), cites: ['c1-tracks'] },
        { id: 'L3-H-05', when: not(has.clue('c1-cocoa')), cites: [] },
      ],
      review: 'L3-H-06',
      exhausted: 'UI-hint.klubokEmpty',
    },
    shell: null,
  },
  minigames: [
    {
      id: 'c1l3-lupa', skill: 'magnifier',
      config: {
        kind: 'magnifier',
        targets: [
          { id: 'box', label: 'C1-2-B02', required: true, reply: ['C1-2-02'] },
          { id: 'soil', label: 'C1-2-B03', required: true, reply: ['C1-2-03'] },
          { id: 'paw-print', label: 'C1-2-B04', required: true, reply: ['C1-2-04'] },
          { id: 'feather', label: 'L2-2-B01', required: true, reply: ['L2-2-02'] },
          { id: 'crumbs', label: 'L3-2-B01', required: true, reply: ['L3-2-02'] },
        ],
        afterFirst: [], afterFirstSkill: null, assistAfterMisses: 3,
      },
    },
    {
      id: 'c1l3-cocoa', skill: 'cocoa',
      config: {
        kind: 'cocoa',
        rounds: [
          { id: 'r1', options: [opt('hello', 'L3-3-B01', true, 'L3-3-01'), opt('pie', 'L3-3-B02', false, 'L3-3-02', 'L3-3-03'), opt('pot', 'L3-3-B03', false, 'L3-3-04', 'L3-3-03')], retry: [] },
          { id: 'r2', options: [opt('not-you', 'L3-3-B04', true, 'L3-3-05'), opt('dont-be-sad', 'L3-3-B05', false, 'L3-3-06', 'L3-3-07'), opt('scared', 'L3-3-B06', false, 'L3-3-08', 'L3-3-07')], retry: [] },
          { id: 'r3', options: [opt('thanks', 'L2-3-B01', true, 'L2-3-01'), opt('tell', 'L2-3-B02', true, 'L2-3-02'), opt('sure', 'L2-3-B03', false, 'L2-3-03')], retry: ['L2-3-04'] },
        ],
      },
    },
    {
      id: 'c1l3-tracks', skill: 'tracks',
      config: {
        kind: 'tracks',
        steps: [
          { id: 'small', prompt: null, pageSize: 3, options: [opt('mouse', 'L3-5-B01', true, 'L3-5-02'), opt('magpie', 'L2-5-B01', false, 'L2-5-01'), opt('hamster', 'C1-5-B02', false, 'L3-5-03')] },
          { id: 'wide', prompt: null, pageSize: 3, options: [opt('raccoon', 'C1-5-B01', false, 'C1-5-02'), opt('mole', 'C1-5-B03', true, 'C1-5-04'), opt('hamster', 'C1-5-B02', false, 'L3-5-03')] },
        ],
        question: { prompt: 'L3-5-04', options: [opt('mouse-deep', 'L3-5-B02', false, 'L3-5-05'), opt('mole-deep', 'L3-5-B03', true, 'L3-5-06')] },
      },
    },
    {
      id: 'c1l3-timeline', skill: 'timeline',
      config: {
        kind: 'timeline',
        items: [
          { id: 't0800', time: '8:00', label: 'L2-6-B01' },
          { id: 't0900', time: '9:00', label: 'L2-6-B02' },
          { id: 't0930', time: '9:30', label: 'L3-6-B03' },
          { id: 't1000', time: '10:00', label: 'L2-6-B04' },
          { id: 't1030', time: '10:30', label: 'L3-6-B05' },
        ],
        solution: ['t0800', 't0900', 't0930', 't1000', 't1030'],
        wrong: ['L2-6-04'],
      },
    },
    {
      id: 'c1l3-scents', skill: 'scent-pairs',
      config: {
        kind: 'scent-pairs',
        fields: [
          { id: 'garden', label: 'L3-7-B01', cards: [
            { id: 'g-soil-1', pair: 'soil', label: 'L3-7-B03' }, { id: 'g-soil-2', pair: 'soil', label: 'L3-7-B03' },
            { id: 'g-carrot-1', pair: 'carrot', label: 'L3-7-B04' }, { id: 'g-carrot-2', pair: 'carrot', label: 'L3-7-B04' },
            { id: 'g-dill-1', pair: 'dill', label: 'L3-7-B05' }, { id: 'g-dill-2', pair: 'dill', label: 'L3-7-B05' },
          ] },
          { id: 'shed', label: 'L3-7-B02', cards: [
            { id: 's-soil-1', pair: 'soil', label: 'L3-7-B03' }, { id: 's-soil-2', pair: 'soil', label: 'L3-7-B03' },
            { id: 's-bilberry-1', pair: 'bilberry', label: 'L3-7-B06' }, { id: 's-bilberry-2', pair: 'bilberry', label: 'L3-7-B06' },
            { id: 's-dough-1', pair: 'dough', label: 'L3-7-B07' }, { id: 's-dough-2', pair: 'dough', label: 'L3-7-B07' },
          ] },
        ],
        mismatch: ['L3-7-03'],
        question: { prompt: 'L3-7-04', options: [opt('garden', 'L3-7-B01', false, 'L3-7-05'), opt('shed', 'L3-7-B02', true, 'L3-7-06')] },
      },
    },
    {
      id: 'c1l3-baker', skill: 'baker',
      config: {
        kind: 'baker',
        measures: bakerMeasures,
        steps: [
          { id: 'flour', prompt: 'L3-10-02', target: 32, ideal: ['cup'], afterWrong: ['L3-10-05'] },
          { id: 'sugar', prompt: 'L3-10-03', target: 8, ideal: ['cup', 'half'], afterWrong: ['L3-10-05'] },
          { id: 'bilberry', prompt: 'L3-10-04', target: 16, ideal: ['cup'], afterWrong: ['L3-10-05'] },
        ],
        tooMuch: ['C1-8-05'],
        tooLittle: ['C1-8-06'],
      },
    },
  ],
  facts,
  glossary,
  rewards: ['rw-c1-heart-tyopa-l3', 'rw-c1-badge', 'rw-c1-buttons-l3', 'rw-c1-sticker-l3', 'rw-c1-decor-basket', 'rw-c1-activity'],
  collections: [],
  activities: [activity],
  comfort: [],
  cutscenes: [shedL3, oven(3, 'L3-10'), rewardCutscene(3)],
  decisions: [
    { id: 'C1L3-HEART', text: 'Сердечко доброты за утешение Тёпы выдаётся один раз на каждой сложности (как пуговки, Q38); на сложности 1 ключ прежний (case01:heart:tyopa), сохранения совместимы.', ref: 'T11, Q38' },
    { id: 'C1L3-T25', text: 'Ролики T25: разговор в сарае (L3-9, c1.shed.l3), пирог в печи (L3-10, c1.oven.l3) и награда (C1-10, c1.reward.l3). Реплики звучат в ролике в прежнем порядке; ремарки сцен заменены постановкой ролика; награды, «Уютный денёк» и переходы — шаги после ролика.', ref: 'T25' },
    { id: 'C1L3-D1', text: 'Реплика L2-8-02 убрана: на сложности 3 Стелла ничего не видела (L3-4-01).', ref: 'R04' },
    { id: 'C1L3-D2', text: '«Чашка какао» на сложности 3 начинается с C1-3-01…C1-3-03 (вводная механики), как на сложностях 1–2.', ref: 'R09, R04' },
    { id: 'C1L3-D3', text: '«Кто наследил?» на сложности 3 при первой встрече добавляет вводную C1-5-01 после L3-5-01.', ref: 'R09' },
    { id: 'C1L3-D4', text: 'Поправка мэра L3-4-08 звучит в той сцене, которая проходит второй: в разговоре с мэром (если часы уже разложены) или после «Ленты времени» (если с мэром уже говорили).', ref: 'Q17, D04' },
    { id: 'C1L3-D5', text: 'Меню расспросов: Стелла, мышата, мэр; после Стеллы появляются «Часы на пекарне». Выход на улицу — служебной кнопкой «Назад». На экране не больше трёх вариантов.', ref: 'Q11' },
    { id: 'C1L3-D6', text: 'Подсказки клубка дополнены сценарными репликами L2-H-02 и L2-H-04, чтобы к каждой обязательной улике вела точная подсказка.', ref: 'D03, R05' },
    { id: 'C1L3-D7', text: 'В меню расспросов имена жителей озвучиваются общими подписями NM-* («Сорока Стелла», «Мышата Шуршики», «Мэр Пудинг») — без новых записей.', ref: 'R06' },
    { id: 'C1L3-D8', text: '«Пекарь» на сложности 3: сахар можно отмерить стаканом или двумя половинками; после ошибки звучит L3-10-05.', ref: 'Q14' },
    { id: 'C1L3-D9', text: 'В «Чашке какао» неверный ответ сразу получает мягкую реплику Хвостса (L3-3-03 / L3-3-07) и раунд повторяется без штрафа.', ref: 'Q16' },
  ],
};
