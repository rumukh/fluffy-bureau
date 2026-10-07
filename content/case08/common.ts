import { dir, end, goto, L, Ls, minigame, reward, seq, skill, type VariantSource } from '../../tools/content/dsl.ts';
import type { ChoiceOption, Fact, Predicate, Step } from '../../packages/content/src/schema.ts';

export const eq = (axis: string, value: string): Predicate => ({ op: 'eq', axis, value });
export const ne = (axis: string, value: string): Predicate => ({ op: 'ne', axis, value });
export const and = (...terms: Predicate[]): Predicate => ({ op: 'and', terms });
export const anyOf = (axis: string, values: string[]): Predicate => ({ op: 'in', axis, values });
export const opt = (id: string, label: string, correct: boolean, ...reply: string[]): ChoiceOption => ({ id, label, correct, reply });

export const who = {
  pukhlik: { id: 'pukhlik', label: 'NM-pukhlik' },
  fitilyok: { id: 'fitilyok', label: 'NM-fitilyok' },
  stella: { id: 'stella', label: 'NM-stella' },
  damka: { id: 'damka', label: 'NM-damka' },
  mouse: { id: 'mouse', label: 'NM-mouse' },
};
export const where = {
  attic: { id: 'attic', label: 'C8-AX-attic' },
  lighthouse: { id: 'lighthouse', label: 'C8-AX-lighthouse' },
  cellar: { id: 'cellar', label: 'C8-AX-cellar' },
  library: { id: 'library', label: 'C8-AX-library' },
  hall: { id: 'hall', label: 'C8-AX-hall' },
};
export const what = {
  party: { id: 'party', label: 'C8-AX-party' },
  treasure: { id: 'treasure', label: 'C8-AX-treasure' },
  walks: { id: 'walks', label: 'C8-AX-walks' },
  repair: { id: 'repair', label: 'C8-AX-repair' },
};
export const intended = { who: 'pukhlik', where: 'attic', what: 'party' };

export const facts: Fact[] = [
  { id: 'fact-c8-owl-eyes', line: 'C8-13-01' },
  { id: 'fact-c8-owl-head', line: 'C8-13-02' },
  { id: 'fact-c8-owlets', line: 'C8-13-03' },
];
export const activity: VariantSource['activities'][number] = {
  id: 'act-c8-surprise', title: 'ACT-C8-TITLE',
  steps: ['ACT-C8-01', 'ACT-C8-02', 'ACT-C8-03', 'ACT-C8-04', 'ACT-C8-05', 'ACT-C8-06'].map((line, i) => ({ line, adultOnly: i === 1 || i === 4 })),
  safety: ['ACT-C8-S01', 'ACT-C8-S02'], allergens: [],
};
export const comfort = [{ scene: 'C8-8', line: 'C8-L-01' }];

export const invitationCards = [
  opt('star', 'C8-1-B01', true, 'C8-N01'), opt('paw', 'C8-1-B02', true, 'C8-N01'), opt('key', 'C8-1-B03', true, 'C8-N01'),
  opt('acorn', 'C8-1-B04', true, 'C8-N01'), opt('bell', 'C8-1-B05', true, 'C8-N01'), opt('heart', 'C8-1-B06', true, 'C8-N01'),
];
export const symbolCollections: VariantSource['collections'] = [
  { id: 'c8-symbols', collection: 'symbol-cards', label: 'COL-C8-symbols', line: 'COL-C8-symbols' },
];
export const heroCollections = (ids: ('pukhlik' | 'stella' | 'fitilyok' | 'damka' | 'mouse')[]): VariantSource['collections'] => [
  ...symbolCollections,
  { id: 'c8-heroes', collection: 'hero-traits' as const, label: 'COL-C8-heroes', line: 'COL-C8-heroes' },
  { id: 'c8-hero-all', collection: 'hero-traits' as const, label: 'NM-all', line: 'NM-all' },
  ...ids.map((id) => ({ id: `c8-hero-${id}`, collection: 'hero-traits' as const, label: `COL-C8-${id}`, line: `COL-C8-${id}` })),
];

export const baseCutscenes: VariantSource['cutscenes'] = [
  { id: 'cs-c8-office-closed', scene: 'C8-0', summary: 'Контора украшена, но Ватсони мягко закрывает дверь: сегодня экзамен.' },
  { id: 'cs-c8-attic-lights', scene: 'C8-8', summary: 'На чердаке огоньки включаются по одному, все шепчут «Сюрприз…».' },
  { id: 'cs-c8-oath', scene: 'C8-9', summary: 'Хвостс принимает Клятву сыщика и повторяет слова кампании.' },
  { id: 'cs-c8-jubilee', scene: 'C8-12', summary: 'Площадь показывает результаты всех дел и световой сигнал игрока.' },
];

export function introScene(id = 'C8-0', next = 'C8-1'): VariantSource['scenes'][number] {
  return { id, title: 'Утро юбилея: Контору закрыли', location: 'office-door', cast: ['watsony', 'khvosts', 'stella'], presentation: 'dialogue', steps: [
    dir(`${id}-D01`, 'Украшенная дверь Конторы приоткрыта; Ватсони держит ленту и честно просит не входить.'),
    ...seq('C8-0-', 1, 5),
    skill('detective-exam', seq('C8-0-', 6, 8)),
    goto(next),
  ] };
}

export function versionScene(id: string, hub: string): VariantSource['scenes'][number] {
  return { id, title: 'Версия', location: 'lighthouse', cast: ['khvosts', 'watsony'], presentation: 'dialogue', steps: [skill('version', Ls('C8-7-01', 'C8-7-02')), goto(hub)] };
}

export function finalScenes(prefix: string, level: 1 | 2 | 3): VariantSource['scenes'] {
  const finalExtra: Step[] = level === 1 ? [] : level === 2 ? Ls('C8-L2-8-01', 'C8-L2-8-02', 'C8-L2-8-03') : Ls('C8-L2-8-01', 'C8-L2-8-02', 'C8-L2-8-03', 'C8-L3-9-01', 'C8-L3-9-02', 'C8-L3-9-03');
  return [
    { id: `${prefix}-8`, title: 'Сумерки: чердак Конторы', location: 'office-attic', cast: ['all', 'khvosts', 'watsony', 'pukhlik', 'pudding', 'damka', 'stella', 'fitilyok', 'mouse'], presentation: 'cutscene', steps: [
      dir(`${prefix}-8-D01`, 'У двери горит один фонарь. Огоньки сюрприза включаются по одному: гирлянды, фонари, свечи-светлячки.'),
      L('C8-8-01'), L('C8-8-02'), ...seq('C8-8-', 3, 10),
      dir(`${prefix}-8-D02`, 'Пухлик отдаёт Золотой Жёлудь мэру; мэр ставит его на подставку.'),
      ...seq('C8-8-', 12, 21), ...finalExtra, goto(`${prefix}-9`),
    ] },
    { id: `${prefix}-9`, title: 'Клятва сыщика', location: 'office-attic', cast: ['khvosts'], presentation: 'minigame', steps: [skill('detective-oath', [L('C8-9-01')]), minigame(`c8l${level}-oath`), ...seq('C8-9-', 2, 6), goto(`${prefix}-10`)] },
    { id: `${prefix}-10`, title: 'Орден Золотой Лапы', location: 'office-attic', cast: ['khvosts', 'watsony'], presentation: 'cutscene', steps: [dir(`${prefix}-10-D01`, 'Ватсони выносит Орден Золотой Лапы на подушечке.'), ...seq('C8-10-', 1, 2), goto(`${prefix}-11`)] },
    { id: `${prefix}-11`, title: 'Тёплые слова', location: 'office-attic', cast: ['pudding', 'tyopa', 'stella', 'kartofan', 'mouse', 'fitilyok', 'damka', 'pukhlik', 'watsony', 'khvosts'], presentation: 'cutscene', steps: [...seq('C8-11-', 1, 10), goto(`${prefix}-12`)] },
    { id: `${prefix}-12`, title: 'Юбилей на площади', location: 'town-square', cast: ['pudding', 'khvosts', 'pukhlik', 'all'], presentation: 'cutscene', steps: [
      dir(`${prefix}-12-D01`, 'На площади: пирог, письма, маяк, варенье, Ночная библиотека, дубки и водяной салют.'),
      ...seq('C8-12-', 1, 3), L('C8-N06'), goto(`${prefix}-13`),
    ] },
    { id: `${prefix}-13`, title: 'А ты знал?', location: 'town-square', cast: ['pukhlik'], presentation: 'dialogue', steps: [skill('encyclopedia', [dir(`${prefix}-13-D01`, 'Три карточки про сов складываются в Энциклопедию.')]), ...seq('C8-13-', 1, 4), goto(`${prefix}-14`)] },
    { id: `${prefix}-14`, title: 'Награды и новые загадки', location: 'office', cast: ['khvosts', 'watsony'], presentation: 'cutscene', steps: [
      reward('rw-c8-badge'), reward('rw-c8-title'), reward(`rw-c8-buttons-l${level}`), reward(`rw-c8-sticker-l${level}`), reward('rw-c8-decor-portrait'), reward('rw-c8-decor-news'), reward('rw-c8-activity'), reward('rw-c8-heart'),
      ...seq('C8-14-', 1, 2), end(),
    ] },
  ];
}

export const oathGame = (id: string, skillId = 'detective-oath') => ({
  id, skill: skillId,
  config: { kind: 'staged' as const, mechanic: 'Клятва сыщика', description: 'Три мягких выбора без проигрыша.', lines: ['C8-N05'], steps: [
    { id: 'evidence', prompt: null, pageSize: 3, options: [opt('evidence', 'C8-9-B01', true, 'C8-9-02'), opt('pies', 'C8-9-B02', false, 'C8-9-05'), opt('umbrellas', 'C8-9-B03', false, 'C8-9-05')] },
    { id: 'hypothesis', prompt: null, pageSize: 3, options: [opt('hypothesis', 'C8-9-B04', true, 'C8-9-03'), opt('alibi', 'C8-9-B05', false, 'C8-9-05'), opt('motive', 'C8-9-B06', false, 'C8-9-05')] },
    { id: 'truth', prompt: null, pageSize: 3, options: [opt('truth', 'C8-9-B07', true, 'C8-9-04'), opt('hurt', 'C8-9-B08', false, 'C8-9-05'), opt('hurry', 'C8-9-B09', false, 'C8-9-05')] },
  ] },
});

export const rewardsFor = (level: 1 | 2 | 3) => ['rw-c8-badge', 'rw-c8-title', `rw-c8-buttons-l${level}`, `rw-c8-sticker-l${level}`, 'rw-c8-decor-portrait', 'rw-c8-decor-news', 'rw-c8-activity', 'rw-c8-heart'];
export const rewardDefs = [
  { id: 'rw-c8-badge', kind: 'badge' as const, label: 'RW-c8-badge', amount: 1, claimKey: 'case08:badge' },
  { id: 'rw-c8-title', kind: 'title' as const, label: 'RW-c8-title', amount: 1, claimKey: 'case08:title' },
  { id: 'rw-c8-buttons-l1', kind: 'buttons' as const, label: 'RW-buttons-10', amount: 10, claimKey: 'case08:l1:buttons' },
  { id: 'rw-c8-buttons-l2', kind: 'buttons' as const, label: 'RW-buttons-15', amount: 15, claimKey: 'case08:l2:buttons' },
  { id: 'rw-c8-buttons-l3', kind: 'buttons' as const, label: 'RW-buttons-20', amount: 20, claimKey: 'case08:l3:buttons' },
  { id: 'rw-c8-sticker-l1', kind: 'sticker' as const, label: 'RW-c8-sticker-1', amount: 1, claimKey: 'case08:l1:sticker' },
  { id: 'rw-c8-sticker-l2', kind: 'sticker' as const, label: 'RW-c8-sticker-2', amount: 1, claimKey: 'case08:l2:sticker' },
  { id: 'rw-c8-sticker-l3', kind: 'sticker' as const, label: 'RW-c8-sticker-3', amount: 1, claimKey: 'case08:l3:sticker' },
  { id: 'rw-c8-decor-portrait', kind: 'decor' as const, label: 'RW-c8-decor-portrait', amount: 1, claimKey: 'case08:decor:portrait' },
  { id: 'rw-c8-decor-news', kind: 'decor' as const, label: 'RW-c8-decor-news', amount: 1, claimKey: 'case08:decor:news' },
  { id: 'rw-c8-activity', kind: 'activity' as const, label: 'RW-c8-activity', amount: 1, claimKey: 'case08:activity:surprise' },
  { id: 'rw-c8-heart', kind: 'hearts' as const, label: 'RW-heart', amount: 1, claimKey: 'case08:heart:team' },
];
export const skillDefs = ['invitation', 'compare-traits', 'sound-match', 'detective-oath', 'detective-exam'].map((id) => ({ id, title: `SK-${id}` }));

export function commonDecisions(level: 1 | 2 | 3): VariantSource['decisions'] {
  return [
    { id: `C8L${level}-D1`, text: 'Финальное дело ведёт ребёнок; Хвостс и Ватсони дают честные подсказки из ракушки и не врут о сюрпризе.', ref: 'D09' },
    { id: `C8L${level}-D2`, text: 'Приглашение из шести карточек доказывает место и событие; карточки занесены в коллекцию символов.', ref: 'D10, R03' },
    { id: `C8L${level}-D3`, text: '«Сравни приметы» превращает три тайные заметки в единственный вывод: Пухлик.', ref: 'D06, D07, R03' },
    { id: `C8L${level}-D4`, text: 'Новых слов словарика нет; «Клятва сыщика» повторяет слова прежних дел.', ref: 'D11' },
    { id: `C8L${level}-D5`, text: 'Финал выдаёт Орден Золотой Лапы, звание «Магистр Лапы», декор, активность и пуговки по сложности.', ref: 'D12, T11' },
    { id: `C8L${level}-D6`, text: 'Сцена сюрприза не пугает: огоньки зажигаются по одному, хор говорит шёпотом, есть «Лампа смелости».', ref: 'D24' },
  ];
}
