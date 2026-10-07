import type { ActivityCard, Fact, GlossaryEntry, Predicate, Reward, Step } from '../../packages/content/src/schema.ts';
import { dir, L, Ls, reward, seq, skill, wait, type VariantSource } from '../../tools/content/dsl.ts';

export const who = {
  stella: { id: 'stella', label: 'NM-stella' },
  mouse: { id: 'mouse', label: 'NM-mouse' },
  pudding: { id: 'pudding', label: 'NM-pudding' },
  damka: { id: 'damka', label: 'NM-damka' },
  fitilyok: { id: 'fitilyok', label: 'NM-fitilyok' },
};
export const where = {
  porch: { id: 'porch', label: 'C2-AX-porch' },
  nest: { id: 'nest', label: 'C2-AX-nest' },
  hole: { id: 'hole', label: 'C2-AX-hole' },
  duplo: { id: 'duplo', label: 'C2-AX-duplo' },
  booth: { id: 'booth', label: 'C2-AX-booth' },
};
export const what = {
  rain: { id: 'rain', label: 'C2-AX-rain' },
  sparkle: { id: 'sparkle', label: 'C2-AX-sparkle' },
  lost: { id: 'lost', label: 'C2-AX-lost' },
  flags: { id: 'flags', label: 'C2-AX-flags' },
};
export const intended = { who: 'stella', where: 'nest', what: 'rain' };
export const eq = (axis: string, value: string): Predicate => ({ op: 'eq', axis, value });
export const ne = (axis: string, value: string): Predicate => ({ op: 'ne', axis, value });
export const and = (...terms: Predicate[]): Predicate => ({ op: 'and', terms });
export const or = (...terms: Predicate[]): Predicate => ({ op: 'or', terms });
export const anyWhat = (values: string[]): Predicate => ({ op: 'in', axis: 'what', values });
export const choice = (id: string, label: string, correct: boolean, ...reply: string[]) => ({ id, label, correct, reply });

export const facts: Fact[] = [
  { id: 'fact-c2-magpies-shiny', line: 'C2-9-01' },
  { id: 'fact-c2-pigeons', line: 'C2-9-02' },
  { id: 'fact-c2-nests', line: 'C2-9-03' },
];
export const glossary: GlossaryEntry[] = [
  { id: 'alibi', word: 'алиби', definition: 'GL-alibi-DEF', label: 'GL-alibi', forms: ['алиби'] },
  { id: 'motive', word: 'мотив', definition: 'GL-motive-DEF', label: 'GL-motive', forms: ['мотив', 'мотива', 'мотиву', 'мотивом', 'мотиве'] },
];
export const rewards: Reward[] = [
  { id: 'rw-c2-heart-mice', kind: 'hearts', label: 'RW-heart', amount: 1, claimKey: 'case02:heart:mice' },
  { id: 'rw-c2-badge', kind: 'badge', label: 'RW-c2-badge', amount: 1, claimKey: 'case02:badge' },
  { id: 'rw-c2-buttons-l1', kind: 'buttons', label: 'RW-buttons-10', amount: 10, claimKey: 'case02:l1:buttons' },
  { id: 'rw-c2-buttons-l2', kind: 'buttons', label: 'RW-buttons-15', amount: 15, claimKey: 'case02:l2:buttons' },
  { id: 'rw-c2-buttons-l3', kind: 'buttons', label: 'RW-buttons-20', amount: 20, claimKey: 'case02:l3:buttons' },
  { id: 'rw-c2-sticker-l1', kind: 'sticker', label: 'RW-c2-sticker-1', amount: 1, claimKey: 'case02:l1:sticker' },
  { id: 'rw-c2-sticker-l2', kind: 'sticker', label: 'RW-c2-sticker-2', amount: 1, claimKey: 'case02:l2:sticker' },
  { id: 'rw-c2-sticker-l3', kind: 'sticker', label: 'RW-c2-sticker-3', amount: 1, claimKey: 'case02:l3:sticker' },
  { id: 'rw-c2-decor-poster', kind: 'decor', label: 'RW-c2-decor-poster', amount: 1, claimKey: 'case02:decor:poster' },
  { id: 'rw-c2-title-helper', kind: 'title', label: 'RW-c2-title-helper', amount: 1, claimKey: 'case02:title:helper' },
  { id: 'rw-c2-activity', kind: 'activity', label: 'RW-c2-activity', amount: 1, claimKey: 'case02:activity:magnet-button' },
];
export const activityCard: ActivityCard = {
  id: 'act-c2-magnet-button', title: 'ACT-C2-TITLE',
  steps: [
    { line: 'ACT-C2-01', adultOnly: false },
    { line: 'ACT-C2-02', adultOnly: true },
    { line: 'ACT-C2-03', adultOnly: false },
    { line: 'ACT-C2-04', adultOnly: false },
  ],
  safety: ['ACT-C2-S01', 'ACT-C2-S02'], allergens: [],
};

export const intro0 = (): Step[] => [
  dir('C2-0-D01', 'Контора. Почтовый жук не прилетел. В дверь стучит мэр Пудинг.'),
  ...seq('C2-0-', 1, 4),
  skill('map', [dir('C2-0-D02', 'На карте Пушистино активна точка «Почта».'), L('C2-0-B01')]),
];
export const intro1base = (): Step[] => [
  dir('C2-1-D01', 'Крыльцо почты на Пироговой улице. Вокруг листья и ветки.'),
  ...seq('C2-1-', 1, 5),
  dir('C2-1-D02', 'Хвостс пускает пузыри.'),
  ...seq('C2-1-', 6, 9),
];
export const notebookIntro = (dirId: string): Step[] => [
  skill('notebook', [dir(dirId, 'Блокнот раскрывается на три колонки дела.'), L('C2-1-10')]),
];
export const klubkiIntro = (): Step => skill('klubki', Ls('C1-1-19', 'C1-1-20'), []);

export const versionScene = (id: string, hub: string): VariantSource['scenes'][number] => ({
  id, title: 'Версия: «Приглашу на разговор»', location: 'post-office', cast: ['khvosts', 'watsony'], presentation: 'dialogue',
  steps: [skill('version', Ls('C2-6-01', 'C2-6-02')), { t: 'goto', scene: hub }],
});

export const resolutionSteps = (extra: Step[], next: string): Step[] => [
  dir('C2-7-D01', 'Парк Старого Дуба. Высоко видно гнездо Стеллы с крышей из веточек.'),
  ...seq('C2-7-', 1, 18),
  ...extra,
  { t: 'goto', scene: next },
];
export const factsScene = (next: string): VariantSource['scenes'][number] => ({
  id: 'C2-9', title: '«А ты знал?»', location: 'town-square', cast: ['watsony'], presentation: 'dialogue',
  steps: [skill('encyclopedia', [dir('C2-9-D01', 'Карточки фактов складываются в Энциклопедию.')]), ...seq('C2-9-', 1, 4), { t: 'goto', scene: next }],
});
export const rewardScene = (level: 1 | 2 | 3): VariantSource['scenes'][number] => ({
  id: 'C2-10', title: 'Награда', location: 'office', cast: ['khvosts', 'watsony'], presentation: 'cutscene',
  steps: [
    ...seq('C2-10-', 1, 4),
    reward('rw-c2-badge'), reward(`rw-c2-buttons-l${level}`), reward(`rw-c2-sticker-l${level}`), reward('rw-c2-title-helper'), reward('rw-c2-decor-poster'), reward('rw-c2-activity'),
    dir('C2-10-D01', 'Новые слова в словарике: алиби, мотив. Плакат шифра появляется в Конторе.'),
    skill('cozy-day', [wait('office.place')], []),
    { t: 'end' },
  ],
});
export const commonCutscenes: VariantSource['cutscenes'] = [
  { id: 'cs-c2-office', scene: 'C2-0', summary: 'Почтовый жук не прилетает; мэр сообщает о пропаже писем.' },
  { id: 'cs-c2-oak', scene: 'C2-7', summary: 'Стелла показывает сухие письма в гнезде и объясняет, что спасла их от дождя.' },
  { id: 'cs-c2-exhibition', scene: 'C2-8', summary: 'Жители развешивают приглашения на Выставке писем.' },
  { id: 'cs-c2-reward', scene: 'C2-10', summary: 'Хвостс вручает значок, звание и плакат шифра.' },
];
export const baseDecisions: VariantSource['decisions'] = [
  { id: 'C2-D1', text: 'Стелла не крала письма: она спрятала разлетевшиеся письма в гнездо от дождя и забыла сказать.', ref: 'Q23' },
  { id: 'C2-D2', text: 'Финал называется «Выставка писем»; миф о «сороке-воровке» прямо опровергается.', ref: 'Q23, T18' },
  { id: 'C2-D3', text: '«Почтальон» — финальное закрепление и не даёт улику, как сценарно указано.', ref: 'R09' },
];

