import type { ActivityCard, Fact, GlossaryEntry, Predicate, Reward, Step } from '../../packages/content/src/schema.ts';
import { dir, L, Ls, reward, seq, skill, wait, type VariantSource } from '../../tools/content/dsl.ts';

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

export const introOffice = (): Step[] => [
  dir('C4-0-D01', 'Контора. Мэр Пудинг в отчаянии держит пустую баночку.'),
  ...seq('C4-0-', 1, 4),
  skill('map', [dir('C4-0-D02', 'На карте активна точка «Погреб мэрии».')], []),
];
export const cellarBase = (): Step[] => [
  dir('C4-1-D01', 'Глубокий погреб мэрии: фонари-светлячки, полки, бочки, тёплые блики.'),
  ...seq('C4-1-', 1, 6),
];
export const notebookIntro = (dirId: string): Step[] => [
  skill('notebook', [dir(dirId, 'Блокнот раскрывается на три колонки дела.'), L('C4-1-07')]),
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
  id: 'C4-9', title: '«А ты знал?»', location: 'town-square', cast: ['khvosts', 'watsony'], presentation: 'dialogue',
  steps: [skill('encyclopedia', [dir('C4-9-D01', 'Три карточки фактов складываются в Энциклопедию.')], []), ...seq('C4-9-', 1, 4), { t: 'goto', scene: next }],
});
export const rewardScene = (level: 1 | 2 | 3): VariantSource['scenes'][number] => ({
  id: 'C4-10', title: 'Награда', location: 'office', cast: ['khvosts', 'watsony'], presentation: 'cutscene',
  steps: [
    ...seq('C4-10-', 1, 4),
    reward('rw-c4-badge'), reward(`rw-c4-buttons-l${level}`), reward(`rw-c4-sticker-l${level}`), reward('rw-c4-title-junior'), reward('rw-c4-decor-jar'), reward('rw-c4-activity'),
    dir('C4-10-D01', 'Новое слово в словарике: подозреваемый. Банка варенья ставится в Конторе.'),
    skill('cozy-day', [wait('office.place')], []),
    { t: 'end' },
  ],
});
export const commonCutscenes: VariantSource['cutscenes'] = [
  { id: 'cs-c4-office', scene: 'C4-0', summary: 'Мэр сообщает о пропаже варенья; Хвостс смутно вспоминает что-то.' },
  { id: 'cs-c4-cellar', scene: 'C4-1', summary: 'Освещённый погреб: пустые полки, липкие лапки мэра, Хвостс вписывает себя в подозреваемые.' },
  { id: 'cs-c4-pantry', scene: 'C4-7', summary: 'В кладовке Конторы находятся банки и записка Хвостса; он извиняется.' },
  { id: 'cs-c4-tea', scene: 'C4-8', summary: 'Большое чаепитие на площади; варенье делят поровну.' },
  { id: 'cs-c4-reward', scene: 'C4-10', summary: 'Награда «Честное варенье», банка для Конторы и звание «Младший детектив».' },
];
export const baseDecisions: VariantSource['decisions'] = [
  { id: 'C4-D1', text: 'Хронология зафиксирована: банки пересчитаны три недели назад, Хвостс увёз их две недели назад.', ref: 'D19' },
  { id: 'C4-D2', text: 'Соло «Хранитель снов» смоделирован staged-мини-игрой: Пухлик честно хранит секрет и подсказывает снами.', ref: 'D09, Q33, Q34' },
  { id: 'C4-D3', text: 'Семейный режим C4-F-01…C4-F-05 оставлен в reserved как система передачи роли, ещё не представленная шагами.', ref: 'Q34' },
  { id: 'C4-D4', text: '«Большое чаепитие» смоделировано staged-задачей без таймера и проигрыша.', ref: 'R09, Q16' },
  { id: 'C4-D5', text: 'Факт «барсуки запасливые» заменён на сахар, проветривание подстилки и старую нору.', ref: 'D13, D14, T18' },
];
