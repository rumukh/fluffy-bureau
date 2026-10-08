import type { ActivityCard, DreamKeeperConfig, EqualShareConfig, Fact, GlossaryEntry, MinigameConfig, Predicate, Reward, Step } from '../../packages/content/src/schema.ts';
import { act, cutscene, dir, L, Ls, reward, seq, skill, wait, type VariantSource } from '../../tools/content/dsl.ts';

export const who = {
  khvosts: { id: 'khvosts', label: 'NM-khvosts' },
  pudding: { id: 'pudding', label: 'NM-pudding' },
  mouse: { id: 'mouse', label: 'NM-mouse' },
  watsony: { id: 'watsony', label: 'NM-watsony' },
  kartofan: { id: 'kartofan', label: 'NM-kartofan' },
};
export const where = {
  office: { id: 'office-pantry', label: 'C4-AX-office-pantry' },
  mouse: { id: 'mouse-hole', label: 'C4-AX-mouse-hole' },
  barrel: { id: 'cellar-barrel', label: 'C4-AX-cellar-barrel' },
  attic: { id: 'mayor-attic', label: 'C4-AX-mayor-attic' },
  shed: { id: 'kartofan-shed', label: 'C4-AX-kartofan-shed' },
};
export const what = {
  stock: { id: 'secret-stock', label: 'C4-AX-secret-stock' },
  eaten: { id: 'eaten', label: 'C4-AX-eaten' },
  broken: { id: 'broken', label: 'C4-AX-broken' },
  shared: { id: 'shared-early', label: 'C4-AX-shared-early' },
};
export const intended = { who: 'khvosts', where: 'office-pantry', what: 'secret-stock' };
export const eq = (axis: string, value: string): Predicate => ({ op: 'eq', axis, value });
export const ne = (axis: string, value: string): Predicate => ({ op: 'ne', axis, value });
export const and = (...terms: Predicate[]): Predicate => ({ op: 'and', terms });
export const noConstraint = (values: string[]): Predicate => ({ op: 'in', axis: 'what', values });
export const choice = (id: string, label: string, correct: boolean, ...reply: string[]) => ({ id, label, correct, reply });

const dreamFacts = (place: boolean, office: boolean, holiday: boolean): Record<string, boolean> => ({ place, office, holiday });
const dreamDecks: Record<1 | 2 | 3, DreamKeeperConfig['rounds']> = {
  1: [
    {
      id: 'where', axis: 'where', answer: 'office-pantry', correct: ['C4-5-05'], wrong: ['C4-5-06'],
      cards: [
        { id: 'door-stairs', label: 'C4-5-L1-DC01', image: 'dream.c4.l1.door-stairs', facts: dreamFacts(true, true, false) },
        { id: 'magnifier-sign', label: 'C4-5-L1-DC02', image: 'dream.c4.l1.magnifier-sign', facts: dreamFacts(true, true, false) },
        { id: 'old-umbrellas', label: 'C4-5-L1-DC03', image: 'dream.c4.l1.old-umbrellas', facts: dreamFacts(true, true, false) },
      ],
    },
    {
      id: 'what', axis: 'what', answer: 'secret-stock', correct: ['C4-5-07'], wrong: ['C4-5-06'],
      cards: [
        { id: 'jars-ribbons', label: 'C4-5-L1-DC04', image: 'dream.c4.l1.jars-ribbons', facts: dreamFacts(false, false, true) },
        { id: 'jubilee-flag', label: 'C4-5-L1-DC05', image: 'dream.c4.l1.jubilee-flag', facts: dreamFacts(false, false, true) },
        { id: 'exclamation-note', label: 'C4-5-L1-DC06', image: 'dream.c4.l1.exclamation-note', facts: dreamFacts(false, false, false) },
      ],
    },
    {
      id: 'who', axis: 'who', answer: 'khvosts', correct: ['C4-5-08'], wrong: ['C4-5-06'],
      cards: [
        { id: 'soap-bubbles', label: 'C4-5-L1-DC07', image: 'dream.c4.l1.soap-bubbles', facts: dreamFacts(false, false, false) },
        { id: 'muzzle-stripes', label: 'C4-5-L1-DC08', image: 'dream.c4.l1.muzzle-stripes', facts: dreamFacts(false, false, false) },
        { id: 'detective-hat', label: 'C4-5-L1-DC09', image: 'dream.c4.l1.detective-hat', facts: dreamFacts(false, false, false) },
      ],
    },
  ],
  2: [
    {
      id: 'where', axis: 'where', answer: 'office-pantry', correct: ['C4-5-05'], wrong: ['C4-5-06'],
      cards: [
        { id: 'umbrellas-corner', label: 'C4-L2-5-DC01', image: 'dream.c4.l2.umbrellas-corner', facts: dreamFacts(true, true, false) },
        { id: 'narrow-door', label: 'C4-L2-5-DC02', image: 'dream.c4.l2.narrow-door', facts: dreamFacts(true, true, false) },
        { id: 'stairs-overhead', label: 'C4-L2-5-DC03', image: 'dream.c4.l2.stairs-overhead', facts: dreamFacts(true, true, false) },
      ],
    },
    {
      id: 'what', axis: 'what', answer: 'secret-stock', correct: ['C4-5-07'], wrong: ['C4-5-06'],
      cards: [
        { id: 'ribbon', label: 'C4-L2-5-DC04', image: 'dream.c4.l2.ribbon', facts: dreamFacts(false, false, true) },
        { id: 'jubilee-flag', label: 'C4-L2-5-DC05', image: 'dream.c4.l2.jubilee-flag', facts: dreamFacts(false, false, true) },
        { id: 'exclamation-note', label: 'C4-L2-5-DC06', image: 'dream.c4.l2.exclamation-note', facts: dreamFacts(false, false, false) },
      ],
    },
    {
      id: 'who', axis: 'who', answer: 'khvosts', correct: ['C4-5-08'], wrong: ['C4-5-06'],
      cards: [
        { id: 'bubble', label: 'C4-L2-5-DC07', image: 'dream.c4.l2.bubble', facts: dreamFacts(false, false, false) },
        { id: 'detective-hat', label: 'C4-L2-5-DC08', image: 'dream.c4.l2.detective-hat', facts: dreamFacts(false, false, false) },
        { id: 'muzzle-stripes', label: 'C4-L2-5-DC09', image: 'dream.c4.l2.muzzle-stripes', facts: dreamFacts(false, false, false) },
      ],
    },
  ],
  3: [
    {
      id: 'where', axis: 'where', answer: 'office-pantry', correct: ['C4-5-05'], wrong: ['C4-5-06'],
      cards: [
        { id: 'umbrella-smell', label: 'C4-L3-6-DC01', image: 'dream.c4.l3.umbrella-smell', facts: dreamFacts(true, true, false) },
        { id: 'mouse-door', label: 'C4-L3-6-DC02', image: 'dream.c4.l3.mouse-door', facts: dreamFacts(true, true, false) },
        { id: 'creaking-stairs', label: 'C4-L3-6-DC03', image: 'dream.c4.l3.creaking-stairs', facts: dreamFacts(true, true, false) },
      ],
    },
    {
      id: 'what', axis: 'what', answer: 'secret-stock', correct: ['C4-5-07'], wrong: ['C4-5-06'],
      cards: [
        { id: 'tied-ribbon', label: 'C4-L3-6-DC04', image: 'dream.c4.l3.tied-ribbon', facts: dreamFacts(false, false, true) },
        { id: 'circled-calendar', label: 'C4-L3-6-DC05', image: 'dream.c4.l3.circled-calendar', facts: dreamFacts(false, false, true) },
        { id: 'hush-finger', label: 'C4-L3-6-DC06', image: 'dream.c4.l3.hush-finger', facts: dreamFacts(false, false, false) },
      ],
    },
    {
      id: 'who', axis: 'who', answer: 'khvosts', correct: ['C4-5-08'], wrong: ['C4-5-06'],
      cards: [
        { id: 'bubble', label: 'C4-L3-6-DC07', image: 'dream.c4.l3.bubble', facts: dreamFacts(false, false, false) },
        { id: 'magnifier', label: 'C4-L3-6-DC08', image: 'dream.c4.l3.magnifier', facts: dreamFacts(false, false, false) },
        { id: 'office-key', label: 'C4-L3-6-DC09', image: 'dream.c4.l3.office-key', facts: dreamFacts(false, true, false) },
      ],
    },
  ],
};

export const dreamKeeperConfig = (level: 1 | 2 | 3, intro: string[]): DreamKeeperConfig => ({
  kind: 'dream-keeper',
  intro,
  rounds: dreamDecks[level],
  after: ['C4-5-09', 'C4-5-10'],
  family: {
    intro: ['C4-F-01', 'C4-F-02'],
    keeperPick: ['C4-F-03'],
    ask: ['C4-F-04'],
    win: ['C4-F-05'],
    players: [
      { id: 'mama', label: 'C4-F-P01' }, { id: 'papa', label: 'C4-F-P02' }, { id: 'grandma', label: 'C4-F-P03' },
      { id: 'grandpa', label: 'C4-F-P04' }, { id: 'brother', label: 'C4-F-P05' }, { id: 'sister', label: 'C4-F-P06' }, { id: 'friend', label: 'C4-F-P07' },
    ],
    questions: [
      { id: 'place', label: 'C4-F-Q01' },
      { id: 'office', label: 'C4-F-Q02' },
      { id: 'holiday', label: 'C4-F-Q03' },
    ],
    titles: [
      { id: 'kind-dreamer', label: 'C4-F-T01', for: 'keeper' },
      { id: 'best-question', label: 'C4-F-T02', for: 'asker' },
      { id: 'sharp-eye', label: 'C4-F-T03', for: 'guesser' },
      { id: 'warm-heart', label: 'C4-F-T04', for: 'guesser' },
    ],
  },
});

export const equalShareConfig = (level: 1 | 2 | 3): EqualShareConfig => ({
  kind: 'equal-share',
  intro: ['C4-8-01'],
  tasks: [
    { id: 'tables', prompt: 'C4-8-02', items: 12, groups: 3, reserve: 0, itemLabel: 'C4-8-ITEM-jar', groupLabel: 'C4-8-GROUP-table', correct: ['C4-8-04'] },
    ...(level >= 2 ? [{ id: 'guests', prompt: 'C4-L2-8-01', items: 6, groups: 6, reserve: 0, itemLabel: 'C4-8-ITEM-spoon', groupLabel: 'C4-8-GROUP-guest', correct: ['C4-8-04'] }] : []),
    ...(level === 3 ? [{ id: 'reserve', prompt: 'C4-L3-10-01', items: 12, groups: 4, reserve: 4, itemLabel: 'C4-8-ITEM-jar', groupLabel: 'C4-8-GROUP-reserve', correct: ['C4-8-04'] }] : []),
  ],
  uneven: ['C4-8-03'],
});

export const cartCompareConfig: MinigameConfig = {
  kind: 'compare',
  subject: { label: 'C4-L3-5-B01', image: 'compare.c4.cart-track' },
  steps: [
    { id: 'width', prompt: 'C4-L3-5-02', pageSize: 3, options: [choice('narrow', 'C4-L3-5-B03', true, 'C4-L3-5-04'), choice('wide', 'C4-L3-5-B04', false, 'C4-L3-5-03')] },
    { id: 'patch', prompt: 'C4-L3-5-02', pageSize: 3, options: [choice('star', 'C4-L3-5-B05', true, 'C4-L3-5-04'), choice('smooth', 'C4-L3-5-B06', false, 'C4-L3-5-03')] },
  ],
  question: null,
};

export const facts: Fact[] = [
  { id: 'fact-c4-sugar-preserves', line: 'C4-9-01' },
  { id: 'fact-c4-badger-bedding', line: 'C4-9-02' },
  { id: 'fact-c4-old-sett', line: 'C4-9-03' },
];
export const glossary: GlossaryEntry[] = [{
  id: 'suspect', word: 'подозреваемый', definition: 'GL-suspect-DEF', label: 'GL-suspect',
  forms: ['подозреваемый', 'подозреваемого', 'подозреваемому', 'подозреваемым', 'подозреваемом', 'подозреваемые', 'подозреваемых', 'подозреваемыми'],
}];
export const rewards: Reward[] = [
  { id: 'rw-c4-badge', kind: 'badge', label: 'RW-c4-badge', amount: 1, claimKey: 'case04:badge' },
  { id: 'rw-c4-buttons-l1', kind: 'buttons', label: 'RW-buttons-10', amount: 10, claimKey: 'case04:l1:buttons' },
  { id: 'rw-c4-buttons-l2', kind: 'buttons', label: 'RW-buttons-15', amount: 15, claimKey: 'case04:l2:buttons' },
  { id: 'rw-c4-buttons-l3', kind: 'buttons', label: 'RW-buttons-20', amount: 20, claimKey: 'case04:l3:buttons' },
  { id: 'rw-c4-sticker-l1', kind: 'sticker', label: 'RW-c4-sticker-1', amount: 1, claimKey: 'case04:l1:sticker' },
  { id: 'rw-c4-sticker-l2', kind: 'sticker', label: 'RW-c4-sticker-2', amount: 1, claimKey: 'case04:l2:sticker' },
  { id: 'rw-c4-sticker-l3', kind: 'sticker', label: 'RW-c4-sticker-3', amount: 1, claimKey: 'case04:l3:sticker' },
  { id: 'rw-c4-decor-jar', kind: 'decor', label: 'RW-c4-decor-jar', amount: 1, claimKey: 'case04:decor:jar' },
  { id: 'rw-c4-title-junior', kind: 'title', label: 'RW-c4-title-junior', amount: 1, claimKey: 'case04:title:junior-detective' },
  { id: 'rw-c4-activity', kind: 'activity', label: 'RW-c4-activity', amount: 1, claimKey: 'case04:activity:sugar-berries' },
];
export const activityCard: ActivityCard = {
  id: 'act-c4-sugar-berries', title: 'ACT-C4-TITLE',
  steps: [
    { line: 'ACT-C4-01', adultOnly: false },
    { line: 'ACT-C4-02', adultOnly: true },
    { line: 'ACT-C4-03', adultOnly: false },
    { line: 'ACT-C4-04', adultOnly: false },
  ],
  safety: ['ACT-C4-S01', 'ACT-C4-S02'], allergens: ['ягоды'],
};

export const introOffice = (level: 1 | 2 | 3): Step[] => [
  cutscene(`c4.office.l${level}`),
  skill('map', [dir('C4-0-D02', 'На карте активна точка «Погреб мэрии».', null, [act.sfx('page-turn'), act.effect('glow', 1280, 760, 1.2)])], []),
];
export const cellarBase = (): Step[] => [
  dir('C4-1-D01', 'Глубокий погреб мэрии: фонари-светлячки, полки, бочки, тёплые блики.'),
  ...seq('C4-1-', 1, 6),
];
export const notebookIntro = (dirId: string): Step[] => [
  skill('notebook', [dir(dirId, 'Блокнот раскрывается на три колонки дела.', null, [act.sfx('page-turn'), act.pose('khvosts', { clip: 'present' })]), L('C4-1-07')]),
];
export const klubkiIntro = (): Step => skill('klubki', Ls('C4-1-N01', 'C4-1-N02'), []);
export const versionScene = (id: string, hub: string): VariantSource['scenes'][number] => ({
  id, title: 'Версия: «Приглашу на разговор»', location: 'mayor-cellar', cast: ['khvosts', 'watsony'], presentation: 'dialogue',
  steps: [skill('version', Ls('C4-6-01', 'C4-6-02'), []), { t: 'goto', scene: hub }],
});
export const resolution = (extra: Step[], next: string): Step[] => [
  dir('C4-7-D01', 'Контора. Под лестницей маленькая дверка; внутри двенадцать банок с бантиками.'),
  ...seq('C4-7-', 1, 12),
  ...extra,
  ...seq('C4-7-', 13, 17),
  { t: 'goto', scene: next },
];
export const factsScene = (next: string): VariantSource['scenes'][number] => ({
  id: 'C4-9', title: '«А ты знал?»', location: 'tea-square', cast: ['khvosts', 'watsony'], presentation: 'dialogue',
  steps: [skill('encyclopedia', [dir('C4-9-D01', 'Три карточки фактов складываются в Энциклопедию.', null, [act.sfx('page-turn'), act.effect('sparkles', 1280, 900, 1.4)])], []), ...seq('C4-9-', 1, 4), { t: 'goto', scene: next }],
});
export const rewardScene = (level: 1 | 2 | 3): VariantSource['scenes'][number] => ({
  id: 'C4-10', title: 'Награда', location: 'office', cast: ['khvosts', 'watsony'], presentation: 'cutscene',
  props: { jar: 'prop.jam-jar-c4' },
  steps: [
    cutscene(`c4.reward.l${level}`),
    reward('rw-c4-badge'), reward(`rw-c4-buttons-l${level}`), reward(`rw-c4-sticker-l${level}`), reward('rw-c4-title-junior'), reward('rw-c4-decor-jar'), reward('rw-c4-activity'),
    dir('C4-10-D01', 'Новое слово в словарике: подозреваемый. Банка варенья ставится в Конторе.', null, [act.show('jar', 1760, 1180), act.pose('jar', { clip: 'present' }), act.effect('sparkles', 1760, 1050, 1.4)]),
    skill('cozy-day', [wait('office.place')], []),
    { t: 'end' },
  ],
});
export const legacyChoiceLabels = [
  'C4-5-B01', 'C4-5-B02', 'C4-5-B03', 'C4-L2-5-B01', 'C4-5-B04', 'C4-5-B05', 'C4-5-B06', 'C4-L2-5-B02',
  'C4-5-B07', 'C4-5-B08', 'C4-5-B09', 'C4-L2-5-B03', 'C4-L3-5-B02',
  'C4-8-B01', 'C4-8-B02', 'C4-8-B03', 'C4-L2-8-B01', 'C4-L3-10-B01',
];
export const baseDecisions: VariantSource['decisions'] = [
  { id: 'C4-D1', text: 'Хронология зафиксирована: банки пересчитаны три недели назад, Хвостс увёз их две недели назад.', ref: 'D19' },
  { id: 'C4-D2', text: 'Соло и семейный «Хранитель снов» оформлены dedicated kind с приватными карточками.', ref: 'U12, Q33, Q34' },
  { id: 'C4-D4', text: '«Большое чаепитие» оформлено equal-share без таймера и проигрыша.', ref: 'U12, R09, Q16' },
  { id: 'C4-D5', text: 'Факт «барсуки запасливые» заменён на сахар, проветривание подстилки и старую нору.', ref: 'D13, D14, T18' },
];
