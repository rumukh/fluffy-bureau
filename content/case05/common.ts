import { cl, dir, end, goto, L, Ls, reward, seq, skill, type VariantSource } from '../../tools/content/dsl.ts';
import type { ChoiceOption, Fact, GlossaryEntry, Predicate, Step } from '../../packages/content/src/schema.ts';

export const who = {
  mice: { id: 'mice', label: 'NM-mouse' },
  fitilyok: { id: 'fitilyok', label: 'NM-fitilyok' },
  kartofan: { id: 'kartofan', label: 'NM-kartofan' },
  stella: { id: 'stella', label: 'NM-stella' },
  pudding: { id: 'pudding', label: 'NM-pudding' },
};
export const where = {
  reading: { id: 'reading', label: 'C5-AX-reading' },
  basement: { id: 'basement', label: 'C5-AX-basement' },
  attic: { id: 'attic', label: 'C5-AX-attic' },
  storage: { id: 'storage', label: 'C5-AX-storage' },
  kids: { id: 'kids', label: 'C5-AX-kids' },
};
export const what = {
  nightReading: { id: 'night-reading', label: 'C5-AX-night-reading' },
  moleTunnel: { id: 'mole-tunnel', label: 'C5-AX-mole-tunnel' },
  oldFloor: { id: 'old-floor', label: 'C5-AX-old-floor' },
  draft: { id: 'draft', label: 'C5-AX-draft' },
};
export const intended = { who: 'mice', where: 'reading', what: 'night-reading' };

export const eq = (axis: string, value: string): Predicate => ({ op: 'eq', axis, value });
export const ne = (axis: string, value: string): Predicate => ({ op: 'ne', axis, value });
export const and = (...terms: Predicate[]): Predicate => ({ op: 'and', terms });
export const noConstraint = (axis: string, values: string[]): Predicate => ({ op: 'in', axis, values });
export const opt = (id: string, label: string, correct: boolean, ...reply: string[]): ChoiceOption => ({ id, label, correct, reply });

export const facts: Fact[] = [
  { id: 'fact-c5-mouse-songs', line: 'C5-10-01' },
  { id: 'fact-c5-ashurbanipal', line: 'C5-10-02' },
  { id: 'fact-c5-alphabet', line: 'C5-10-03' },
];

export const glossary: GlossaryEntry[] = [{
  id: 'hypothesis',
  word: 'гипотеза',
  definition: 'GL-hypothesis-DEF',
  label: 'GL-hypothesis',
  forms: ['гипотеза', 'гипотезы', 'гипотезу', 'гипотезой', 'гипотезою', 'гипотезе', 'гипотез', 'гипотезам', 'гипотезами', 'гипотезах'],
}];

export const activity: VariantSource['activities'][number] = {
  id: 'act-c5-library',
  title: 'ACT-C5-TITLE',
  steps: [
    { line: 'ACT-C5-01', adultOnly: false },
    { line: 'ACT-C5-02', adultOnly: false },
    { line: 'ACT-C5-03', adultOnly: false },
    { line: 'ACT-C5-04', adultOnly: false },
  ],
  safety: ['ACT-C5-S01'],
  allergens: [],
};

export const intro0 = (): Step[] => [...seq('C5-0-', 1, 5)];
export const secretNote = (hub: string): Step[] => [
  dir('C5-2-D01', 'Холл библиотеки. Высокая полка починена; на верхней доске лежит серое пёрышко.'),
  ...seq('C5-2-', 1, 4),
  dir('C5-2-D02', 'Игрок нажимает на пёрышко. Оно ложится на страницу «Тайные заметки».'),
  ...seq('C5-2-', 5, 8),
  reward('rw-c5-secret-note'),
  goto(hub),
];

export const factsScene = (next: string): VariantSource['scenes'][number] => ({
  id: 'C5-10', title: '«А ты знал?»', location: 'night-library', cast: ['watsony'], presentation: 'dialogue',
  steps: [skill('encyclopedia', [dir('C5-10-D01', 'Три карточки «Это правда» складываются в Энциклопедию.')]), ...seq('C5-10-', 1, 4), goto(next)],
});

export const rewardScene = (level: 1 | 2 | 3): VariantSource['scenes'][number] => ({
  id: 'C5-11', title: 'Награда', location: 'office', cast: ['khvosts', 'watsony'], presentation: 'cutscene',
  steps: [
    L('C5-11-01'), L('C5-11-02'),
    reward('rw-c5-badge'), reward(`rw-c5-buttons-l${level}`), reward(`rw-c5-sticker-l${level}`),
    reward('rw-c5-decor-shelf'), reward('rw-c5-activity'),
    dir('C5-11-D01', 'Новое слово в «Словарике сыщика»: гипотеза.'),
    ...seq('C5-11-', 3, 4),
    end(),
  ],
});

export const finale = (id: string, rulesScene: string, extra: Step[] = []): VariantSource['scenes'][number] => ({
  id, title: 'Дальний стеллаж: доброе разрешение', location: 'reading-room', cast: ['mouse', 'pudding', 'khvosts', 'watsony'], presentation: 'cutscene',
  steps: [
    dir(`${id}-D01`, 'Хвостс тихо стучит по стеллажу. Из-за книг выглядывают мышата в пижамах.'),
    ...seq('C5-8-', 1, 16),
    ...extra,
    goto(rulesScene),
  ],
});

export const rulesScene = (id: string, minigameId: string, level: 1 | 2 | 3): VariantSource['scenes'][number] => ({
  id, title: 'Правила Ночной библиотеки', location: 'reading-room', cast: ['mouse', 'pudding', 'watsony'], presentation: 'minigame',
  steps: [
    skill('night-rules', [L('C5-9-01'), L('C5-9-02')]),
    minigameId ? ({ t: 'minigame', minigame: minigameId } as Step) : L('C5-9-01'),
    reward('rw-c5-heart-rules'),
    L('C5-9-05'),
    dir(`${id}-D01`, 'Мышата вешают табличку «Ночная библиотека». Фитилёк подсвечивает её с улицы.'),
    L('C5-9-06'), L('C5-9-07'),
    goto('C5-10'),
  ],
});

export const commonCollections: VariantSource['collections'] = [
  { id: 'c5-secret-feather', collection: 'secret-notes', label: 'C5-COL-secret-feather', line: 'C5-2-05' },
];

export const commonCutscenes: VariantSource['cutscenes'] = [
  { id: 'cs-c5-secret-note', scene: 'C5-2', summary: 'Починенная высокая полка и серое пёрышко в Тайных заметках.' },
  { id: 'cs-c5-mice', scene: 'C5-8', summary: 'Мышата Шуршики выходят из-за дальнего стеллажа и просят разрешения.' },
  { id: 'cs-c5-rules', scene: 'C5-9', summary: 'Мэр, мышата и Ватсони рисуют правила Ночной библиотеки.' },
  { id: 'cs-c5-reward', scene: 'C5-11', summary: 'Вручение значка-лапки «Тихая нора» и книжной полки для Конторы.' },
];

export const comfort = [{ scene: '*', line: 'C5-L-01' }];

export const commonDecisions = [
  { id: 'C5-D1', text: '«Услышь разницу» нормализована как staged-механика с визуальными волнами и текстовыми иконками: звук не требуется для решения.', ref: 'Q31, T19' },
  { id: 'C5-D2', text: 'Сцена C5-2 с серым пёрышком стоит до первого хаба на всех сложностях; коллекционный предмет выдаётся сразу и не зависит от разгадки.', ref: 'D06, D07' },
  { id: 'C5-D3', text: 'Финальная версия запускается кнопкой Блокнота после вводной сцены версии; неверная версия не завершает дело.', ref: 'Q16, D03' },
  { id: 'C5-D4', text: '«Тихая полка» оставлена staged-механикой с выбором до трёх карточек на шаг; на сложности 3 сохраняется сортировка по третьей букве и помечена для проверки с ребёнком.', ref: 'Q11, D25' },
];

export { cl, Ls };
