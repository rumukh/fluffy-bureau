// Case 1, level 1 (3×3×3). SCRIPT_PROLOGUE_CASE01_RU.md, C1-1…C1-10.
import { all, cl, cutscene, dir, end, goto, has, L, menu, minigame, not, opt as mopt, reveal, reward, seq, skill, when, type VariantSource } from '../../tools/content/dsl.ts';
import {
  activity, and, bakerMeasures, eq, facts, factsScene, glossary, intended, intro, klubkiTutorial, ne, noConstraint, opt,
  rewardScene, versionScene, what, where, who,
} from './common.ts';
import { oven, reward as rewardCutscene, shedL1 } from '../cutscenes/index.ts';

const HUB = 'C1-HUB';

export const level1: VariantSource = {
  pack: 'case01-l1',
  kind: 'case',
  title: 'C1-TITLE',
  case: { number: 1, level: 1 },
  start: 'C1-1',
  scenes: [
    {
      id: 'C1-1', title: 'Завязка: Пироговая улица', location: 'pirogovaya-street', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'dialogue',
      steps: [
        ...intro(),
        ...seq('C1-1-', 8, 14),
        skill('notebook', [dir('C1-1-D03', 'Блокнот раскрывается на три колонки.'), ...seq('C1-1-', 15, 16)]),
        ...seq('C1-1-', 17, 18),
        klubkiTutorial(),
        goto(HUB),
      ],
    },
    {
      id: HUB, title: 'Пироговая улица: выбор', location: 'pirogovaya-street', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'hub',
      steps: [
        when(all(has.clue('c1-lupa'), has.clue('c1-cocoa'), has.clue('c1-tracks'), not(has.visited('C1-6'))), [goto('C1-6')]),
        menu('C1-M', null, [
          mopt('bench', 'C1-1-B01', 'C1-2', { hideWhen: has.visited('C1-2') }),
          mopt('tyopa', 'C1-1-B02', 'C1-3', { hideWhen: has.visited('C1-3') }),
          mopt('mayor', 'C1-1-B03', 'C1-4', { hideWhen: has.visited('C1-4'), optional: true }),
          mopt('tracks', 'C1-2-B01', 'C1-5', { when: has.visited('C1-2'), hideWhen: has.visited('C1-5') }),
        ]),
      ],
    },
    {
      id: 'C1-2', title: 'Скамейка: «Лупа»', location: 'bench', cast: ['khvosts', 'watsony'], presentation: 'minigame',
      steps: [
        skill('magnifier', [L('C1-2-01')]),
        minigame('c1l1-lupa'),
        dir('C1-2-D01', 'Игрок открывает коробку.'),
        ...seq('C1-2-', 5, 7),
        reveal('c1-lupa'),
        goto(HUB),
      ],
    },
    {
      id: 'C1-3', title: 'Мыловарня: «Чашка какао»', location: 'soap-workshop', cast: ['tyopa', 'fitilyok', 'khvosts', 'watsony'], presentation: 'minigame',
      steps: [
        dir('C1-3-D01', 'Тёпа сидит у котла и прячет синие лапы за спину. Рядом светлячок Фитилёк.'),
        L('C1-3-01'), L('C1-3-02'),
        skill('cocoa', [L('C1-3-03')]),
        minigame('c1l1-cocoa'),
        reward('rw-c1-heart-tyopa'),
        ...seq('C1-3-', 12, 22),
        reveal('c1-cocoa'),
        goto(HUB),
      ],
    },
    {
      id: 'C1-4', title: 'Разговор с мэром', location: 'pirogovaya-street', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'dialogue',
      steps: [
        L('C1-4-01'), L('C1-4-02'),
        dir('C1-4-D01', 'Пудинг высыпает семечки в ладошку и смущённо собирает обратно.'),
        L('C1-4-03'), L('C1-4-04'),
        reveal('c1-mayor'),
        goto(HUB),
      ],
    },
    {
      id: 'C1-5', title: 'По следам: «Кто наследил?»', location: 'garden-path', cast: ['khvosts', 'watsony'], presentation: 'minigame',
      steps: [
        skill('tracks', [L('C1-5-01')]),
        minigame('c1l1-tracks'),
        dir('C1-5-D01', 'Следы ведут к сараю Картофана.', 'bg.shed-exterior'),
        dir('C1-5-D02', 'Игрок нажимает на окно. Окно сарая крупно: у коробки мэра в крышке окошко, в нём виден пирог.', 'bg.shed-window'),
        ...seq('C1-5-', 5, 7),
        reveal('c1-tracks'),
        goto(HUB),
      ],
    },
    versionScene('C1-6', HUB),
    {
      id: 'C1-7', title: 'Разговор в сарае', location: 'shed', cast: ['kartofan', 'pudding', 'tyopa', 'fitilyok', 'khvosts', 'watsony'], presentation: 'cutscene',
      steps: [cutscene('c1.shed.l1'), goto('C1-8')],
    },
    {
      id: 'C1-8', title: 'Финал: «Пекарь»', location: 'bakery', cast: ['pudding', 'kartofan', 'tyopa', 'fitilyok', 'khvosts', 'watsony'], presentation: 'minigame',
      steps: [skill('baker', [L('C1-8-01')]), minigame('c1l1-baker'), cutscene('c1.oven.l1'), goto('C1-9')],
    },
    { ...factsScene(), steps: [...factsScene().steps, goto('C1-10')] },
    rewardScene(1, [end()]),
  ],
  logic: {
    axes: [
      { id: 'who', title: 'C1-AX-who', values: [who.tyopa, who.kartofan, who.pudding] },
      { id: 'where', title: 'C1-AX-where', values: [where.bakery, where.soap, where.shed] },
      { id: 'what', title: 'C1-AX-what', values: [what.eaten, what.mixed, what.cheeks] },
    ],
    intended,
    clues: [
      { id: 'c1-lupa', title: 'C1-CL-lupa', required: true, predicate: noConstraint(['eaten', 'mixed', 'cheeks']), requires: [], source: 'C1-2', summary: 'Под скамейкой такая же коробка, внутри рассада: коробку оставили взамен. Открывает следы.' },
      { id: 'c1-cocoa', title: 'C1-CL-cocoa', required: true, predicate: and(ne('who', 'tyopa'), ne('where', 'soap')), requires: [], source: 'C1-3', summary: 'Фитилёк — свидетель: Тёпа всё утро варил мыло; в котле пирога нет.' },
      { id: 'c1-tracks', title: 'C1-CL-tracks', required: true, predicate: and(eq('who', 'kartofan'), eq('where', 'shed'), ne('what', 'eaten'), ne('what', 'cheeks')), requires: ['c1-lupa'], source: 'C1-5', summary: 'Кротовые следы ведут к сараю; в окне сарая коробка мэра, в её окошке виден несъеденный пирог (R03).' },
      { id: 'c1-mayor', title: 'C1-CL-mayor', required: false, predicate: ne('what', 'cheeks'), requires: [], source: 'C1-4', summary: 'В щеках у мэра семечки; пирог туда не влезет.' },
    ],
    version: { button: 'UI-hud.version', available: has.visited('C1-6'), onSolved: 'C1-7' },
    wrongVersion: {
      intro: [cl('C1-6-05')],
      byValue: [
        { axis: 'who', value: 'tyopa', clues: ['c1-cocoa'], lines: [cl('C1-6-06')] },
        { axis: 'who', value: 'pudding', clues: ['c1-tracks'], lines: [cl('C1-6-07')] },
        { axis: 'where', value: 'bakery', clues: ['c1-tracks'], lines: [cl('C1-6-08')] },
        { axis: 'where', value: 'soap', clues: ['c1-cocoa'], lines: [cl('C1-6-09')] },
        { axis: 'what', value: 'eaten', clues: ['c1-tracks'], lines: [cl('C1-6-10')] },
        { axis: 'what', value: 'cheeks', clues: ['c1-tracks'], lines: [cl('C1-6-11')] },
      ],
      outro: [cl('C1-6-12')],
    },
    redHerrings: [
      { id: 'rh-c1-blue-paws', summary: 'Синие лапы Тёпы похожи на чернику — это черничное мыло.', presentedBy: ['C1-3-02'], explainedBy: ['C1-3-12', 'C1-7-11'] },
      { id: 'rh-c1-looks', summary: 'Мэр подозревает Тёпу «по виду».', presentedBy: ['C1-1-06', 'C1-1-07'], explainedBy: ['C1-7-13', 'C1-7-14'] },
      { id: 'rh-c1-cheeks', summary: 'Полные щёки мэра — там семечки к празднику.', presentedBy: ['C1-4-01'], explainedBy: ['C1-7-12'] },
    ],
  },
  notebookHelp: {
    mode: 'suggest',
    marks: [
      { axis: 'who', value: 'tyopa', mark: 'excluded', clues: ['c1-cocoa'], line: 'C1-6-06' },
      { axis: 'where', value: 'soap', mark: 'excluded', clues: ['c1-cocoa'], line: 'C1-6-09' },
      { axis: 'who', value: 'kartofan', mark: 'confirmed', clues: ['c1-tracks'], line: 'C1-NB-01' },
      { axis: 'who', value: 'pudding', mark: 'excluded', clues: ['c1-tracks'], line: 'C1-6-07' },
      { axis: 'where', value: 'shed', mark: 'confirmed', clues: ['c1-tracks'], line: 'C1-6-08' },
      { axis: 'where', value: 'bakery', mark: 'excluded', clues: ['c1-tracks'], line: 'C1-6-08' },
      { axis: 'what', value: 'eaten', mark: 'excluded', clues: ['c1-tracks'], line: 'C1-6-10' },
      { axis: 'what', value: 'cheeks', mark: 'excluded', clues: ['c1-mayor'], line: 'C1-4-04' },
      { axis: 'what', value: 'cheeks', mark: 'excluded', clues: ['c1-tracks'], line: 'C1-6-11' },
      { axis: 'what', value: 'mixed', mark: 'confirmed', clues: ['c1-lupa', 'c1-tracks'], line: 'C1-NB-02' },
    ],
    pointers: [],
    nothing: 'UI-notebook.nothing',
  },
  hints: {
    klubok: {
      speaker: 'khvosts', precision: 'exact', allowance: 3,
      rules: [
        { id: 'C1-H-01', when: not(has.clue('c1-lupa')), cites: [] },
        { id: 'C1-H-02', when: all(has.clue('c1-lupa'), not(has.clue('c1-tracks'))), cites: ['c1-lupa'] },
        { id: 'C1-H-03', when: not(has.clue('c1-cocoa')), cites: [] },
        { id: 'C1-H-04', when: has.visited('C1-6'), cites: ['c1-lupa', 'c1-cocoa', 'c1-tracks'] },
      ],
      review: 'C1-H-05',
      exhausted: 'UI-hint.klubokEmptyShell',
    },
    shell: {
      speaker: 'watsony', precision: 'exact', allowance: null,
      rules: [
        { id: 'C1-R-01', when: not(has.clue('c1-lupa')), cites: [] },
        { id: 'C1-R-02', when: all(has.clue('c1-lupa'), not(has.clue('c1-tracks'))), cites: ['c1-lupa'] },
        { id: 'C1-R-03', when: not(has.clue('c1-cocoa')), cites: [] },
        { id: 'C1-R-04', when: has.visited('C1-6'), cites: ['c1-lupa', 'c1-cocoa', 'c1-tracks'] },
      ],
      review: 'C1-R-05',
      exhausted: null,
    },
  },
  minigames: [
    {
      id: 'c1l1-lupa', skill: 'magnifier',
      config: {
        kind: 'magnifier',
        targets: [
          { id: 'box', label: 'C1-2-B02', required: true, reply: ['C1-2-02'] },
          { id: 'soil', label: 'C1-2-B03', required: true, reply: ['C1-2-03'] },
          { id: 'paw-print', label: 'C1-2-B04', required: true, reply: ['C1-2-04'] },
        ],
        afterFirst: [], afterFirstSkill: null, assistAfterMisses: 3,
      },
    },
    {
      id: 'c1l1-cocoa', skill: 'cocoa',
      config: {
        kind: 'cocoa',
        rounds: [
          { id: 'r1', options: [opt('sort-out', 'C1-3-B01', true, 'C1-3-04'), opt('kind', 'C1-3-B02', true, 'C1-3-05'), opt('confess', 'C1-3-B03', false, 'C1-3-06')], retry: ['C1-3-07'] },
          { id: 'r2', options: [opt('show', 'C1-3-B04', true, 'C1-3-08'), opt('sit', 'C1-3-B05', true, 'C1-3-09'), opt('paws', 'C1-3-B06', false, 'C1-3-10')], retry: ['C1-3-11'] },
        ],
      },
    },
    {
      id: 'c1l1-tracks', skill: 'tracks',
      config: {
        kind: 'tracks',
        steps: [{ id: 'wide', prompt: null, pageSize: 3, options: [opt('raccoon', 'C1-5-B01', false, 'C1-5-02'), opt('hamster', 'C1-5-B02', false, 'C1-5-03'), opt('mole', 'C1-5-B03', true, 'C1-5-04')] }],
        question: null,
      },
    },
    {
      id: 'c1l1-baker', skill: 'baker',
      config: {
        kind: 'baker',
        measures: bakerMeasures,
        steps: [
          { id: 'flour', prompt: 'C1-8-02', target: 16, ideal: ['cup'], afterWrong: [] },
          { id: 'sugar', prompt: 'C1-8-03', target: 4, ideal: ['half'], afterWrong: [] },
          { id: 'bilberry', prompt: 'C1-8-04', target: 8, ideal: ['cup'], afterWrong: [] },
        ],
        tooMuch: ['C1-8-05'],
        tooLittle: ['C1-8-06'],
      },
    },
  ],
  facts,
  glossary,
  rewards: ['rw-c1-heart-tyopa', 'rw-c1-badge', 'rw-c1-buttons-l1', 'rw-c1-sticker-l1', 'rw-c1-decor-basket', 'rw-c1-activity'],
  collections: [],
  activities: [activity],
  comfort: [],
  cutscenes: [shedL1, oven(1, 'C1-8'), rewardCutscene(1)],
  decisions: [
    { id: 'C1L1-T25', text: 'Ролики T25: разговор в сарае (C1-7, c1.shed.l1), пирог в печи (C1-8, c1.oven.l1) и награда (C1-10, c1.reward.l1). Реплики звучат в ролике в прежнем порядке; ремарки сцен заменены постановкой ролика; награды, «Уютный денёк» и переходы — шаги после ролика.', ref: 'T25' },
    { id: 'C1L1-D1', text: 'Варианты выбора на Пироговой улице исчезают после посещения; «Пойти по следам» появляется после «Лупы». На экране не больше трёх вариантов.', ref: 'Q11' },
    { id: 'C1L1-D2', text: 'Сцена C1-6 (вводная версии) звучит один раз, когда собраны У1–У3; затем кнопка «Приглашу на разговор» доступна в Блокноте.', ref: 'Q14' },
    { id: 'C1L1-D3', text: 'В «Помоги заполнить» ✔ «перепутал коробки» и ✖ «в щёки» предлагаются уже после У3: улика У3 их доказывает (сценарий предлагал только пять стикеров).', ref: 'D03, R03' },
    { id: 'C1L1-D4', text: 'Коробка мэра с окошком в крышке; в окошке виден несъеденный пирог (для художника и аниматора).', ref: 'R03' },
    { id: 'C1L1-D5', text: 'Тревожных сцен в деле нет, отдельных реплик «Лампы смелости» не требуется.', ref: 'Q22, D24' },
  ],
};
