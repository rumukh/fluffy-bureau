import { dir, end, goto, L, minigame, reward, seq, skill, type VariantSource } from '../../tools/content/dsl.ts';
import type { ChoiceOption, Fact, GlossaryEntry, Predicate, Step } from '../../packages/content/src/schema.ts';

export const who = {
  shadow: { id: 'shadow', label: 'C6-AX-shadow' }, stella: { id: 'stella', label: 'C6-AX-stella' }, mice: { id: 'mice', label: 'C6-AX-mice' }, fitilyok: { id: 'fitilyok', label: 'C6-AX-fitilyok' }, damka: { id: 'damka', label: 'C6-AX-damka' },
};
export const where = {
  roots: { id: 'roots', label: 'C6-AX-roots' }, lighthouse: { id: 'lighthouse', label: 'C6-AX-lighthouse' }, garden: { id: 'garden', label: 'C6-AX-garden' }, hollow: { id: 'hollow', label: 'C6-AX-hollow' }, bench: { id: 'bench', label: 'C6-AX-bench' },
};
export const what = {
  quest: { id: 'quest', label: 'C6-AX-quest' }, theft: { id: 'theft', label: 'C6-AX-theft' }, lost: { id: 'lost', label: 'C6-AX-lost' }, cleaning: { id: 'cleaning', label: 'C6-AX-cleaning' },
};
export const intended = { who: 'shadow', where: 'roots', what: 'quest' };
export const eq = (axis: string, value: string): Predicate => ({ op: 'eq', axis, value });
export const ne = (axis: string, value: string): Predicate => ({ op: 'ne', axis, value });
export const and = (...terms: Predicate[]): Predicate => ({ op: 'and', terms });
export const noWho = (values: string[]): Predicate => ({ op: 'in', axis: 'who', values });
export const opt = (id: string, label: string, correct: boolean, ...reply: string[]): ChoiceOption => ({ id, label, correct, reply });
export const facts: Fact[] = [
  { id: 'fact-c6-squirrels', line: 'C6-9-01' }, { id: 'fact-c6-compass', line: 'C6-9-02' }, { id: 'fact-c6-moss', line: 'C6-9-03' },
];
export const glossary: GlossaryEntry[] = [{ id: 'orientir', word: 'ориентир', definition: 'GL-orientir-DEF', label: 'GL-orientir', forms: ['ориентир', 'ориентира', 'ориентиру', 'ориентиром', 'ориентире', 'ориентиры', 'ориентиров', 'ориентирам', 'ориентирами', 'ориентирах'] }];
export const activity: VariantSource['activities'][number] = {
  id: 'act-c6-compass', title: 'ACT-C6-TITLE',
  steps: [{ line: 'ACT-C6-01', adultOnly: true }, { line: 'ACT-C6-02', adultOnly: true }, { line: 'ACT-C6-03', adultOnly: false }, { line: 'ACT-C6-04', adultOnly: false }, { line: 'ACT-C6-05', adultOnly: false }],
  safety: ['ACT-C6-S01', 'ACT-C6-S02'], allergens: [],
};
export const intro = (): Step[] => [dir('C6-0-D01', 'Контора. Мэр Пудинг показывает карточку со звёздочкой.'), ...seq('C6-0-', 1, 5), dir('C6-0-D02', 'В Блокнот добавлена коллекция «Карточки-символы»: звёздочка.')];
export const officeIntro = (extra: Step[] = []): Step[] => [...intro(), dir('C6-1-D01', 'Мэрия. Пустая витрина закрыта аккуратно.'), ...seq('C6-1-', 1, 7), ...extra, skill('notebook', [dir('C6-1-D02', 'Блокнот раскрывается на трёх колонках дела.')])];
export const versionIntro = (id: string, hub: string): VariantSource['scenes'][number] => ({ id, title: 'Версия', location: 'mayor-office', cast: ['khvosts'], presentation: 'dialogue', steps: [skill('version', [L('C6-6-01'), L('C6-6-02')]), goto(hub)] });
export const factsScene = (): VariantSource['scenes'][number] => ({ id: 'C6-9', title: '«А ты знал?»', location: 'office', cast: ['watsony'], presentation: 'dialogue', steps: [skill('encyclopedia', [dir('C6-9-D01', 'Три карточки фактов складываются в Энциклопедию.')]), ...seq('C6-9-', 1, 4)] });
export const rewardScene = (level: 1 | 2 | 3): VariantSource['scenes'][number] => ({ id: 'C6-10', title: 'Награда', location: 'office', cast: ['khvosts', 'watsony'], presentation: 'cutscene', steps: [
  ...seq('C6-10-', 1, 5), reward('rw-c6-badge'), reward(`rw-c6-buttons-l${level}`), reward(`rw-c6-sticker-l${level}`), reward('rw-c6-decor-compass'), reward('rw-c6-title-detective'), reward('rw-c6-activity'), dir('C6-10-D01', 'В Словарике открыто слово «ориентир», в альбоме — четыре карточки-символа.'), end(),
] });
export const cabinetScene = (next: string, extraAfterFalse: Step[] = []): VariantSource['scenes'][number] => ({ id: 'C6-7', title: 'Старый шкаф Конторы', location: 'office', cast: ['pudding', 'khvosts', 'watsony'], presentation: 'cutscene', steps: [dir('C6-7-D01', 'Золотой Жёлудь входит в замок старого шкафа.'), ...seq('C6-7-', 1, 13), L('C6-7-N01'), ...extraAfterFalse, goto(next)] });
export const alleyScene = (id: string, level: 1 | 2 | 3, next = 'C6-9'): VariantSource['scenes'][number] => ({ id, title: 'Аллея юбилея', location: 'fountain-square', cast: ['pudding', 'stella', 'khvosts'], presentation: 'minigame', steps: [skill('compass-directions', [L(level === 3 ? 'C6-L3-9-01' : level === 2 ? 'C6-L2-8-01' : 'C6-8-N01')]), minigame(`c6l${level}-alley`), ...seq('C6-8-', 1, 6), goto(next)] });
export const commonCutscenes: NonNullable<VariantSource['plannedCutscenes']> = [
  { id: 'cs-c6-intro', scene: 'C6-1', summary: 'Пустая витрина мэрии, Пудинг паникует, Хвостс открывает Блокнот.' },
  { id: 'cs-c6-cabinet', scene: 'C6-7', summary: 'Золотой Жёлудь открывает старый шкаф с альбомом первых сыщиков.' },
  { id: 'cs-c6-alley', scene: 'C6-8', summary: 'У фонтана сажают дубки будущей юбилейной аллеи.' },
  { id: 'cs-c6-reward', scene: 'C6-10', summary: 'Хвостс вручает значок «Золотой Жёлудь» и звание «Детектив».' },
];
export const collections: VariantSource['collections'] = [
  { id: 'c6-symbol-star', collection: 'symbol-cards', label: 'C6-COL-star', line: null }, { id: 'c6-symbol-paw', collection: 'symbol-cards', label: 'C6-COL-paw', line: null }, { id: 'c6-symbol-key', collection: 'symbol-cards', label: 'C6-COL-key', line: null }, { id: 'c6-symbol-acorn', collection: 'symbol-cards', label: 'C6-COL-acorn', line: null },
];
export const comfort = [{ scene: '*', line: 'C6-L-01' }];
export const directionsMinigame = (id: string, level: 1 | 2 | 3) => ({ id, skill: 'compass-directions', config: { kind: 'staged' as const, mechanic: 'Аллея юбилея', description: level === 3 ? 'Сажаем четыре жёлудя по двум указаниям.' : 'Сажаем жёлуди по сторонам света.', steps: [{ id: 'north', prompt: 'C6-8-B01', pageSize: 3, options: [opt('n', 'C6-8-B01', true, 'C6-8-04'), opt('e', 'C6-8-B02', false, 'C6-8-03'), opt('s', 'C6-8-B03', false, 'C6-8-03')] }, { id: 'east', prompt: 'C6-8-B02', pageSize: 3, options: [opt('e', 'C6-8-B02', true, 'C6-8-04'), opt('s', 'C6-8-B03', false, 'C6-8-03'), opt('w', 'C6-8-B04', false, 'C6-8-03')] }, { id: 'south', prompt: 'C6-8-B03', pageSize: 3, options: [opt('s', 'C6-8-B03', true, 'C6-8-04'), opt('n', 'C6-8-B01', false, 'C6-8-03'), opt('w', 'C6-8-B04', false, 'C6-8-03')] }], lines: ['C6-8-03', 'C6-8-04'] } });


