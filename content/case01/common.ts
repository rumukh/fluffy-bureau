// Building blocks shared by the three case 1 variants. Each variant still compiles to an
// explicit, self-contained pack: these helpers only avoid retyping identical data.
import {
  cl, cutscene, dir, goto, Ls, reward, seq, skill, wait, type VariantSource,
} from '../../tools/content/dsl.ts';
import type { ChoiceOption, Fact, GlossaryEntry, Predicate, Step } from '../../packages/content/src/schema.ts';

export const who = {
  tyopa: { id: 'tyopa', label: 'NM-tyopa' },
  kartofan: { id: 'kartofan', label: 'NM-kartofan' },
  pudding: { id: 'pudding', label: 'NM-pudding' },
  stella: { id: 'stella', label: 'NM-stella' },
  mice: { id: 'mice', label: 'NM-mouse' },
};
export const where = {
  bakery: { id: 'bakery', label: 'C1-AX-bakery' },
  soap: { id: 'soap', label: 'C1-AX-soap' },
  post: { id: 'post', label: 'C1-AX-post' },
  garden: { id: 'garden', label: 'C1-AX-garden' },
  shed: { id: 'shed', label: 'C1-AX-shed' },
};
export const what = {
  eaten: { id: 'eaten', label: 'C1-AX-eaten' },
  mixed: { id: 'mixed', label: 'C1-AX-mixed' },
  cheeks: { id: 'cheeks', label: 'C1-AX-cheeks' },
  mail: { id: 'mail', label: 'C1-AX-mail' },
};
export const intended = { who: 'kartofan', where: 'shed', what: 'mixed' };

export const eq = (axis: string, value: string): Predicate => ({ op: 'eq', axis, value });
export const ne = (axis: string, value: string): Predicate => ({ op: 'ne', axis, value });
export const and = (...terms: Predicate[]): Predicate => ({ op: 'and', terms });
/** A clue that excludes nothing on its own (it unlocks another clue). */
export const noConstraint = (values: string[]): Predicate => ({ op: 'in', axis: 'what', values });

export const opt = (id: string, label: string, correct: boolean, ...reply: string[]): ChoiceOption => ({ id, label, correct, reply });

export const facts: Fact[] = [
  { id: 'fact-c1-moles', line: 'C1-9-01' },
  { id: 'fact-c1-bilberry', line: 'C1-9-02' },
  { id: 'fact-c1-raccoons', line: 'C1-9-03' },
];

export const glossary: GlossaryEntry[] = [
  {
    id: 'evidence', word: 'улика', definition: 'GL-evidence-DEF', label: 'GL-evidence',
    forms: ['улика', 'улики', 'улике', 'улику', 'уликой', 'уликою', 'улик', 'уликам', 'уликами', 'уликах'],
  },
  {
    id: 'witness', word: 'свидетель', definition: 'GL-witness-DEF', label: 'GL-witness',
    forms: ['свидетель', 'свидетеля', 'свидетелю', 'свидетелем', 'свидетеле', 'свидетели', 'свидетелей', 'свидетелям', 'свидетелями', 'свидетелях'],
  },
  {
    id: 'version', word: 'версия', definition: 'GL-version-DEF', label: 'GL-version',
    forms: ['версия', 'версии', 'версию', 'версией', 'версиею', 'версий', 'версиям', 'версиями', 'версиях'],
  },
];

export const activity: VariantSource['activities'][number] = {
  id: 'act-c1-pie',
  title: 'ACT-C1-TITLE',
  steps: [
    ...['ACT-C1-01', 'ACT-C1-02', 'ACT-C1-03', 'ACT-C1-04', 'ACT-C1-05', 'ACT-C1-06', 'ACT-C1-07'].map((line) => ({ line, adultOnly: false })),
    { line: 'ACT-C1-08', adultOnly: true },
    ...['ACT-C1-09', 'ACT-C1-10', 'ACT-C1-11', 'ACT-C1-12', 'ACT-C1-13'].map((line) => ({ line, adultOnly: false })),
    ...['ACT-C1-14', 'ACT-C1-15', 'ACT-C1-16', 'ACT-C1-17', 'ACT-C1-18', 'ACT-C1-19'].map((line) => ({ line, adultOnly: true })),
  ],
  safety: ['ACT-C1-S01', 'ACT-C1-S02', 'ACT-C1-S03'],
  allergens: ['глютен', 'яйца', 'молоко'],
};

/** Intro C1-1-01…C1-1-07 (all levels). */
export const intro = (): Step[] => [
  dir('C1-1-D01', 'Пироговая улица. У пекарни стоит мэр-хомяк Пудинг. Рядом пустая скамейка.'),
  ...seq('C1-1-', 1, 7),
  dir('C1-1-D02', 'Хвостс пускает пузыри.'),
];

export const klubkiTutorial = (): Step => skill('klubki', Ls('C1-1-19', 'C1-1-20'));

export const versionScene = (id: string, hub: string): VariantSource['scenes'][number] => ({
  id, title: 'Версия: «Приглашу на разговор»', location: 'pirogovaya-street', cast: ['khvosts', 'watsony'], presentation: 'dialogue',
  steps: [skill('version', seq('C1-6-', 1, 4)), goto(hub)],
});

export const factsScene = (): VariantSource['scenes'][number] => ({
  id: 'C1-9', title: '«А ты знал?»', location: 'bakery', cast: ['watsony'], presentation: 'dialogue',
  steps: [skill('encyclopedia', [dir('C1-9-D01', 'Карточки в рамочке «Это правда» складываются в Энциклопедию.')]), ...seq('C1-9-', 1, 4)],
});

export const rewardScene = (level: 1 | 2 | 3, next: Step[]): VariantSource['scenes'][number] => ({
  id: 'C1-10', title: 'Награда и переход', location: 'office', cast: ['khvosts', 'watsony'], presentation: 'cutscene',
  steps: [
    cutscene('c1.reward'),
    reward('rw-c1-badge'), reward(`rw-c1-buttons-l${level}`), reward(`rw-c1-sticker-l${level}`),
    reward('rw-c1-decor-basket'), reward('rw-c1-activity'),
    dir('C1-10-D01', 'Новые слова в «Словарике сыщика»: улика, свидетель, версия.'),
    skill('cozy-day', [...Ls('C1-10-03', 'C1-10-04'), wait('office.place')]),
    ...next,
  ],
});

export const bakerMeasures = [
  { id: 'cup', label: 'C1-8-B01', units: 8 },
  { id: 'half', label: 'C1-8-B02', units: 4 },
  { id: 'spoon', label: 'C1-8-B03', units: 1 },
];

export { cl };
