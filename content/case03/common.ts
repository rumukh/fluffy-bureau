import {
  act, all, cl, cutscene, dir, end, goto, has, L, Ls, menu, minigame, not, opt as mopt, reveal, reward, seq, skill, wait, type VariantSource,
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

export const secretNotesPage: NonNullable<VariantSource['notebookPages']>[number] = {
  id: 'secret-notes',
  kind: 'secret-notes',
  title: 'UI-notebook.secretNotes',
  unlock: 'rw-c3-secret-note',
  cipher: null,
};

export const sceneProps = {
  map: { mapPoint: 'prop.map-honey-lighthouse' },
  secretNote: { notebook: 'prop.notebook-secret-notes', chamomile: 'prop.chamomile-note' },
  facts: { factCards: 'prop.fact-cards-c3' },
  light: { signalStrip: 'prop.light-signal-strip' },
};

export const commonComfort: VariantSource['comfort'] = [
  { scene: 'C3-1', line: 'C3-L-01' },
  { scene: 'C3-5', line: 'C3-L-02' },
  { scene: 'C3-L2-4', line: 'C3-L-02' },
  { scene: 'C3-L3-5', line: 'C3-L-02' },
];

export const introOffice = (): Step[] => [
  skill('map', [dir('C3-0-D03', 'На карте открывается точка «Медовый пруд и маяк».', null, [
    act.show('mapPoint', 1280, 820),
    act.sfx('page-turn', 0.45),
    act.effect('glow', 1280, 820, 1.2),
  ])]),
];

export const secretNote = (cutsceneId: string, after: Step[] = []): VariantSource['scenes'][number] => ({
  id: 'C3-3',
  title: 'Дверь маяка и Тайная заметка',
  location: 'lighthouse-door',
  cast: ['damka', 'khvosts', 'watsony'],
  presentation: 'dialogue',
  props: sceneProps.secretNote,
  steps: [
    cutscene(cutsceneId),
    skill('secret-notes', [dir('C3-3-D01', 'В Блокноте открывается страница «Тайные заметки».', null, [
      act.show('notebook', 1280, 900),
      act.show('chamomile', 1510, 880),
      act.sfx('page-turn', 0.5),
      act.effect('sparkles', 1510, 880, 1.2),
    ])]),
    reward('rw-c3-secret-note'),
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
  props: sceneProps.facts,
  steps: [skill('encyclopedia', [dir('C3-10-D01', 'Карточки фактов складываются в Энциклопедию.', null, [
    act.show('factCards', 1280, 900),
    act.sfx('page-turn', 0.45),
    act.effect('sparkles', 1280, 900, 1.2),
  ])]), ...seq('C3-10-', 1, 4), goto('C3-11')],
});

export const rewardScene = (level: 1 | 2 | 3, cutsceneId: string): VariantSource['scenes'][number] => ({
  id: 'C3-11',
  title: 'Награда',
  location: 'office',
  cast: ['khvosts', 'watsony'],
  presentation: 'cutscene',
  steps: [
    cutscene(cutsceneId),
    reward('rw-c3-badge'),
    reward(`rw-c3-buttons-l${level}`),
    reward(`rw-c3-sticker-l${level}`),
    reward('rw-c3-decor-lamp'),
    reward('rw-c3-activity'),
    reward('rw-c3-title'),
    wait('office.place'),
    end(),
  ],
});

export const baseRewards = (level: 1 | 2 | 3) => [
  'rw-c3-secret-note',
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
    kind: 'sound-match',
    intro: [],
    rounds: [
      { id: 'rustle', target: 'night-rustle', options: level === 3
        ? [
          { ...opt('pages', 'C3-2-B01', true, 'C3-2-03'), sample: 'pages' },
          { ...opt('reeds', 'C3-2-B02', false, 'C3-L3-2-01'), sample: 'reeds-rustle' },
          { ...opt('wings', 'C3-2-B09', false), sample: 'wing-rustle' },
        ]
        : [
          { ...opt('pages', 'C3-2-B01', true, 'C3-2-03'), sample: 'pages' },
          { ...opt('reeds', 'C3-2-B02', false), sample: 'wind-reeds' },
          { ...opt('wings', 'C3-2-B03', false), sample: 'magpie-wings' },
        ], wrong: ['C3-2-04'] },
      { id: 'click', target: 'night-click', options: [
        { ...opt('shutter', 'C3-2-B04', true, 'C3-2-05'), sample: 'lamp-shutter' },
        { ...opt('door', 'C3-2-B05', false), sample: 'door-creak' },
        { ...opt('woodpecker', 'C3-2-B06', false), sample: 'woodpecker' },
      ], wrong: ['C3-2-04'] },
      ...(level > 1 ? [{ id: 'knock', target: 'night-drops', options: [
        { ...opt('hammer', 'C3-2-B07', false), sample: 'hammer-knock' },
        { ...opt('drops', 'C3-2-B08', true, 'C3-L2-2-01'), sample: 'roof-drops' },
        { ...opt('shutter', 'C3-2-B04', false), sample: 'lamp-shutter' },
      ], wrong: ['C3-2-04'] }] : []),
    ],
    after: [],
  },
});

export const lightGame = (id: string, level: 1 | 2 | 3): VariantSource['minigames'][number] => ({
  id,
  skill: 'light-code',
  config: {
    kind: 'light-signals',
    intro: [],
    signals: [
      { id: 'hello', label: 'C3-L3-7-B01', pattern: ['dot', 'dot', 'dash'], correct: [] },
      { id: 'friends', label: 'C3-L3-7-B02', pattern: ['dash', 'dot', 'dash'], correct: [] },
      { id: 'night', label: 'C3-9-B03', pattern: ['dash', 'dash', 'dot', 'dot'], correct: [] },
      ...(level > 1 ? [{ id: 'lighthouse', label: 'C3-9-B04', pattern: ['dash', 'dot', 'dot', 'dash'] as ('dot' | 'dash')[], correct: [] }] : []),
    ],
    wrong: ['C3-9-04'],
    own: level === 3 ? { min: 3, max: 5, prompt: ['C3-L3-11-01'], done: ['C3-L3-11-02', 'C3-L3-11-03'] } : null,
  },
});

export const finalLightScene = (id: string, level: 1 | 2 | 3, game: string): VariantSource['scenes'][number] => ({
  id,
  title: level === 3 ? 'Азбука огоньков: свой привет' : 'Азбука огоньков',
  location: 'lighthouse-room',
  cast: ['pukhlik', 'pudding', 'mouse'],
  presentation: 'minigame',
  props: sceneProps.light,
  steps: [
    ...seq('C3-9-', 1, 3),
    skill('light-code', [dir(`${id}-D01`, 'Пухлик показывает игровой ритм точками и чёрточками.', null, [
      act.show('signalStrip', 1280, 520),
      act.pose('pukhlik', { clip: 'present', expression: 'happy' }),
      act.effect('glow', 1280, 520, 1.4),
    ])]),
    minigame(game),
    ...seq('C3-9-', 5, 8),
    goto('C3-10'),
  ],
});

export { act, all, cl, cutscene, dir, goto, has, L, Ls, menu, minigame, mopt, not, reveal, seq, skill };
