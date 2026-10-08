import {
  all, cl, dir, end, goto, has, L, Ls, menu, minigame, not, opt as mopt, reveal, reward, seq, skill, wait, type VariantSource,
} from '../../tools/content/dsl.ts';
import type { ChoiceOption, Fact, GlossaryEntry, Predicate, Step } from '../../packages/content/src/schema.ts';

export const HUB = 'C3-HUB';

export const who = {
  pukhlik: { id: 'pukhlik', label: 'C3-AX-pukhlik' },
  fitilyok: { id: 'fitilyok', label: 'C3-AX-fitilyok' },
  stella: { id: 'stella', label: 'C3-AX-stella' },
  damka: { id: 'damka', label: 'C3-AX-damka' },
  tyopa: { id: 'tyopa', label: 'C3-AX-tyopa' },
};
export const where = {
  top: { id: 'top', label: 'C3-AX-top' },
  shed: { id: 'shed', label: 'C3-AX-shed' },
  reeds: { id: 'reeds', label: 'C3-AX-reeds' },
  pier: { id: 'pier', label: 'C3-AX-pier' },
  cauldron: { id: 'cauldron', label: 'C3-AX-cauldron' },
};
export const what = {
  training: { id: 'training', label: 'C3-AX-training' },
  broken: { id: 'broken', label: 'C3-AX-broken' },
  ghost: { id: 'ghost', label: 'C3-AX-ghost' },
  repair: { id: 'repair', label: 'C3-AX-repair' },
};
export const intended = { who: 'pukhlik', where: 'top', what: 'training' };

export const eq = (axis: string, value: string): Predicate => ({ op: 'eq', axis, value });
export const ne = (axis: string, value: string): Predicate => ({ op: 'ne', axis, value });
export const and = (...terms: Predicate[]): Predicate => ({ op: 'and', terms });

export const opt = (id: string, label: string, correct: boolean, ...reply: string[]): ChoiceOption => ({ id, label, correct, reply });

export const facts: Fact[] = [
  { id: 'fact-c3-fireflies', line: 'C3-10-01' },
  { id: 'fact-c3-bats', line: 'C3-10-02' },
  { id: 'fact-c3-owls', line: 'C3-10-03' },
];

export const glossary: GlossaryEntry[] = [{
  id: 'deduction',
  word: 'дедукция',
  definition: 'GL-deduction-DEF',
  label: 'GL-deduction',
  forms: ['дедукция', 'дедукции', 'дедукцию', 'дедукцией', 'дедукциею'],
}];

export const activity: VariantSource['activities'][number] = {
  id: 'act-c3-smells',
  title: 'ACT-C3-TITLE',
  steps: ['ACT-C3-01', 'ACT-C3-02', 'ACT-C3-03', 'ACT-C3-04', 'ACT-C3-05', 'ACT-C3-06'].map((line, i) => ({ line, adultOnly: i === 0 })),
  safety: ['ACT-C3-S01', 'ACT-C3-S02', 'ACT-C3-S03'],
  allergens: ['ромашка', 'мята', 'корица'],
};

export const collections: VariantSource['collections'] = [
  { id: 'c3-chamomile-note', collection: 'secret-notes', label: 'C3-COL-secret-note', line: 'C3-COL-secret-note-L' },
];

export const commonCutscenes: NonNullable<VariantSource['plannedCutscenes']> = [
  { id: 'cs-c3-intro', scene: 'C3-0', summary: 'Вечером мышата сообщают о мигании на маяке; команда идёт к Медовому пруду.' },
  { id: 'cs-c3-note', scene: 'C3-3', summary: 'У починенного весла Дамки найдена ромашка; первая Тайная заметка попадает в Блокнот.' },
  { id: 'cs-c3-reveal', scene: 'C3-8', summary: 'Пухлик признаётся, что по ночам учил игровые сигналы огоньков.' },
  { id: 'cs-c3-reward', scene: 'C3-11', summary: 'Хвостс вручает значок «Огонёк маяка», а Ватсони вспоминает тайну Серой Тени.' },
];

export const commonComfort: VariantSource['comfort'] = [
  { scene: 'C3-1', line: 'C3-L-01' },
  { scene: 'C3-5', line: 'C3-L-02' },
  { scene: 'C3-L2-4', line: 'C3-L-02' },
  { scene: 'C3-L3-5', line: 'C3-L-02' },
];

export const introOffice = (): Step[] => [
  dir('C3-0-D01', 'Контора вечером: в окне горит тёплый фонарь-светлячок.'),
  ...seq('C3-0-', 1, 3),
  dir('C3-0-D02', 'Входят мышата Шуршики, держась за лапки.'),
  ...seq('C3-0-', 4, 9),
  skill('map', [dir('C3-0-D03', 'На карте открывается точка «Медовый пруд и маяк».')]),
];

export const secretNote = (after: Step[] = []): VariantSource['scenes'][number] => ({
  id: 'C3-3',
  title: 'Дверь маяка и Тайная заметка',
  location: 'lighthouse-door',
  cast: ['damka', 'khvosts', 'watsony'],
  presentation: 'dialogue',
  steps: [
    ...seq('C3-3-', 1, 6),
    skill('secret-notes', [dir('C3-3-D01', 'В Блокноте открывается страница «Тайные заметки».')]),
    L('C3-3-07'),
    dir('C3-3-D02', 'Игрок нажимает на ромашку; значок запаха ложится на страницу.'),
    L('C3-3-08'),
    reveal('c3-secret-note'),
    ...Ls('C3-3-09'),
    ...after,
    goto(HUB),
  ],
});

export const fitilyokScene = (): VariantSource['scenes'][number] => ({
  id: 'C3-4',
  title: 'Про Фитилька',
  location: 'pond-bank',
  cast: ['pudding', 'khvosts', 'watsony'],
  presentation: 'dialogue',
  steps: [...seq('C3-4-', 1, 4), reveal('c3-fitilyok'), goto(HUB)],
});

export const versionScene = (id: string): VariantSource['scenes'][number] => ({
  id,
  title: 'Версия: «Приглашу на разговор»',
  location: 'lighthouse-room',
  cast: ['khvosts', 'watsony'],
  presentation: 'dialogue',
  steps: [skill('version', seq('C3-7-', 1, 3)), goto(HUB)],
});

export const factsScene = (): VariantSource['scenes'][number] => ({
  id: 'C3-10',
  title: '«А ты знал?»',
  location: 'lighthouse-room',
  cast: ['watsony'],
  presentation: 'dialogue',
  steps: [skill('encyclopedia', [dir('C3-10-D01', 'Карточки фактов складываются в Энциклопедию.')]), ...seq('C3-10-', 1, 4), goto('C3-11')],
});

export const rewardScene = (level: 1 | 2 | 3): VariantSource['scenes'][number] => ({
  id: 'C3-11',
  title: 'Награда',
  location: 'office',
  cast: ['khvosts', 'watsony'],
  presentation: 'cutscene',
  steps: [
    L('C3-11-01'), L('C3-11-02'),
    reward('rw-c3-badge'),
    reward(`rw-c3-buttons-l${level}`),
    reward(`rw-c3-sticker-l${level}`),
    reward('rw-c3-decor-lamp'),
    reward('rw-c3-activity'),
    reward('rw-c3-title'),
    dir('C3-11-D01', 'Новое слово в Словарике: дедукция. Тайная заметка: запах ромашки.'),
    ...seq('C3-11-', 3, 4),
    wait('office.place'),
    end(),
  ],
});

export const baseRewards = (level: 1 | 2 | 3) => [
  'rw-c3-badge',
  `rw-c3-buttons-l${level}`,
  `rw-c3-sticker-l${level}`,
  'rw-c3-decor-lamp',
  'rw-c3-activity',
  'rw-c3-title',
];

export const redHerringsBase: VariantSource['logic']['redHerrings'] = [
  { id: 'rh-c3-ghost', summary: 'Жители назвали шорох и мигание призраком.', presentedBy: ['C3-0-06', 'C3-1-09'], explainedBy: ['C3-8-12', 'C3-9-06'] },
  { id: 'rh-c3-fitilyok', summary: 'Фитилёк светится, но зажигал фонари на улице.', presentedBy: ['C3-1-03'], explainedBy: ['C3-8-10'] },
  { id: 'rh-c3-stella', summary: 'Стелла шуршит крыльями, но ночью шуршали страницы.', presentedBy: ['C3-1-04'], explainedBy: ['C3-8-11'] },
];

export const soundGame = (id: string, level: 1 | 2 | 3): VariantSource['minigames'][number] => ({
  id,
  skill: 'sound-diff',
  config: {
    kind: 'staged',
    mechanic: 'Услышь разницу',
    description: 'Ночной звук сравнивается с образцами. Без звука показаны волны ритма и иконки тихо-громко, высоко-низко, коротко-длинно.',
    steps: [
      { id: 'rustle', prompt: 'C3-2-Q01', pageSize: 3, options: level === 3
        ? [opt('pages', 'C3-2-B01', true, 'C3-2-03'), opt('reeds', 'C3-2-B02', false, 'C3-L3-2-01', 'C3-2-04'), opt('wings', 'C3-2-B09', false, 'C3-2-04')]
        : [opt('pages', 'C3-2-B01', true, 'C3-2-03'), opt('reeds', 'C3-2-B02', false, 'C3-2-04'), opt('wings', 'C3-2-B03', false, 'C3-2-04')] },
      { id: 'click', prompt: 'C3-2-Q02', pageSize: 3, options: [opt('shutter', 'C3-2-B04', true, 'C3-2-05'), opt('door', 'C3-2-B05', false, 'C3-2-04'), opt('woodpecker', 'C3-2-B06', false, 'C3-2-04')] },
      ...(level > 1 ? [{ id: 'knock', prompt: 'C3-2-Q03', pageSize: 3, options: [opt('hammer', 'C3-2-B07', false, 'C3-2-04'), opt('drops', 'C3-2-B08', true, 'C3-L2-2-01'), opt('shutter', 'C3-2-B04', false, 'C3-2-04')] }] : []),
    ],
    lines: [],
  },
});

export const lightGame = (id: string, level: 1 | 2 | 3): VariantSource['minigames'][number] => ({
  id,
  skill: 'light-code',
  config: {
    kind: 'staged',
    mechanic: 'Азбука огоньков',
    description: 'Игровые световые ритмы: точка — короткий огонёк, чёрточка — длинный. Это не азбука Морзе.',
    steps: [
      { id: 'hello', prompt: 'C3-9-Q01', pageSize: 2, options: [opt('short', 'C3-9-B01', true), opt('long', 'C3-9-B02', false, 'C3-9-04')] },
      { id: 'friends', prompt: 'C3-9-Q02', pageSize: 2, options: [opt('long', 'C3-9-B02', true), opt('short', 'C3-9-B01', false, 'C3-9-04')] },
      { id: 'night', prompt: 'C3-9-Q03', pageSize: 2, options: [opt('long', 'C3-9-B02', true), opt('short', 'C3-9-B01', false, 'C3-9-04')] },
      ...(level > 1 ? [{ id: 'lighthouse', prompt: 'C3-9-Q04', pageSize: 2, options: [opt('long', 'C3-9-B02', true), opt('short', 'C3-9-B01', false, 'C3-9-04')] }] : []),
      ...(level === 3 ? [{ id: 'own', prompt: 'C3-L3-11-B01', pageSize: 2, options: [opt('short', 'C3-9-B01', true, 'C3-L3-11-N01'), opt('long', 'C3-9-B02', true, 'C3-L3-11-N01')] }] : []),
    ],
    lines: [],
  },
});

export const finalLightScene = (id: string, level: 1 | 2 | 3, game: string): VariantSource['scenes'][number] => ({
  id,
  title: level === 3 ? 'Азбука огоньков: свой привет' : 'Азбука огоньков',
  location: 'lighthouse-room',
  cast: ['pukhlik', 'pudding', 'mouse'],
  presentation: 'minigame',
  steps: [
    ...seq('C3-9-', 1, 3),
    ...(level === 3 ? [L('C3-L3-11-01')] : []),
    skill('light-code', [dir(`${id}-D01`, 'Пухлик показывает игровой ритм точками и чёрточками.')]),
    minigame(game),
    ...(level === 3 ? seq('C3-L3-11-', 2, 3) : []),
    ...seq('C3-9-', 5, 8),
    goto('C3-10'),
  ],
});

export { all, cl, dir, goto, has, L, Ls, menu, minigame, mopt, not, reveal, seq, skill };
