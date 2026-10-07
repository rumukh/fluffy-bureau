import { cl, dir, goto, L, Ls, reward, seq, skill, wait, type VariantSource } from '../../tools/content/dsl.ts';
import type { ActivityCard, ChoiceOption, Fact, GlossaryEntry, Predicate, Reward, Step } from '../../packages/content/src/schema.ts';

export const who = {
  damka: { id: 'damka', label: 'C7-AX-damka' },
  pudding: { id: 'pudding', label: 'C7-AX-pudding' },
  kartofan: { id: 'kartofan', label: 'C7-AX-kartofan' },
  tyopa: { id: 'tyopa', label: 'C7-AX-tyopa' },
  stella: { id: 'stella', label: 'C7-AX-stella' },
};
export const where = {
  pond: { id: 'pond', label: 'C7-AX-pond' },
  fountain: { id: 'fountain', label: 'C7-AX-fountain' },
  garden: { id: 'garden', label: 'C7-AX-garden' },
  barrels: { id: 'barrels', label: 'C7-AX-barrels' },
  drain: { id: 'drain', label: 'C7-AX-drain' },
};
export const what = {
  unfinished: { id: 'unfinished', label: 'C7-AX-unfinished' },
  tap: { id: 'tap', label: 'C7-AX-tap' },
  pipe: { id: 'pipe', label: 'C7-AX-pipe' },
  barrels: { id: 'barrels', label: 'C7-AX-barrels-what' },
};
export const intended = { who: 'damka', where: 'pond', what: 'unfinished' };

export const eq = (axis: string, value: string): Predicate => ({ op: 'eq', axis, value });
export const ne = (axis: string, value: string): Predicate => ({ op: 'ne', axis, value });
export const and = (...terms: Predicate[]): Predicate => ({ op: 'and', terms });
export const opt = (id: string, label: string, correct: boolean, ...reply: string[]): ChoiceOption => ({ id, label, correct, reply });

export const facts: Fact[] = [
  { id: 'fact-c7-dams', line: 'C7-10-01' },
  { id: 'fact-c7-teeth', line: 'C7-10-02' },
  { id: 'fact-c7-lodge', line: 'C7-10-03' },
];

export const glossary: GlossaryEntry[] = [
  { id: 'cause', word: 'причина', definition: 'GL-cause-DEF', label: 'GL-cause', forms: ['причина', 'причины', 'причине', 'причину', 'причиной', 'причиною', 'причин', 'причинам', 'причинами', 'причинах'] },
  { id: 'effect', word: 'следствие', definition: 'GL-effect-DEF', label: 'GL-effect', forms: ['следствие', 'следствия', 'следствию', 'следствием', 'следствии', 'следствий', 'следствиям', 'следствиями', 'следствиях'] },
];

export const rewardsCatalog: Reward[] = [
  { id: 'rw-c7-heart-kartofan', kind: 'hearts', label: 'RW-heart', amount: 1, claimKey: 'case07:heart:kartofan' },
  { id: 'rw-c7-badge', kind: 'badge', label: 'RW-c7-badge', amount: 1, claimKey: 'case07:badge' },
  { id: 'rw-c7-buttons-l1', kind: 'buttons', label: 'RW-buttons-10', amount: 10, claimKey: 'case07:l1:buttons' },
  { id: 'rw-c7-buttons-l2', kind: 'buttons', label: 'RW-buttons-15', amount: 15, claimKey: 'case07:l2:buttons' },
  { id: 'rw-c7-buttons-l3', kind: 'buttons', label: 'RW-buttons-20', amount: 20, claimKey: 'case07:l3:buttons' },
  { id: 'rw-c7-sticker-l1', kind: 'sticker', label: 'RW-c7-sticker-1', amount: 1, claimKey: 'case07:l1:sticker' },
  { id: 'rw-c7-sticker-l2', kind: 'sticker', label: 'RW-c7-sticker-2', amount: 1, claimKey: 'case07:l2:sticker' },
  { id: 'rw-c7-sticker-l3', kind: 'sticker', label: 'RW-c7-sticker-3', amount: 1, claimKey: 'case07:l3:sticker' },
  { id: 'rw-c7-decor-lock', kind: 'decor', label: 'RW-c7-decor-lock', amount: 1, claimKey: 'case07:decor:lock' },
  { id: 'rw-c7-activity', kind: 'activity', label: 'RW-c7-activity', amount: 1, claimKey: 'case07:activity:dam' },
];

export const activity: ActivityCard = {
  id: 'act-c7-dam',
  title: 'ACT-C7-TITLE',
  steps: [
    { line: 'ACT-C7-01', adultOnly: false },
    { line: 'ACT-C7-02', adultOnly: true },
    { line: 'ACT-C7-03', adultOnly: true },
    { line: 'ACT-C7-04', adultOnly: false },
    { line: 'ACT-C7-05', adultOnly: false },
    { line: 'ACT-C7-06', adultOnly: true },
  ],
  safety: ['ACT-C7-S01', 'ACT-C7-S02', 'ACT-C7-S03'],
  allergens: [],
};

export const intro = (extra: Step[] = []): Step[] => [
  dir('C7-0-D01', 'Контора утром. За окном мокрая площадь Пушистино.'),
  ...seq('C7-0-', 1, 4),
  skill('map', [dir('C7-0-D02', 'На карте открывается точка «Площадь».')]),
  dir('C7-1-D01', 'Площадь в воде по щиколотку. У фонтана плавают утки, жители в сапожках.'),
  ...seq('C7-1-', 1, 3),
  ...extra,
  ...seq('C7-1-', 4, 7),
  skill('notebook', [dir('C7-1-D02', 'Блокнот раскрывается: Кто? Откуда вода? Что случилось?'), L('C7-1-08')]),
  skill('klubki', [dir('C7-1-D03', 'Хвостс даёт три волшебных клубка для подсказок.')]),
];

export const waterScene = (id: string, minigameId: string, introLine: string, extraAfter: Step[] = []): VariantSource['scenes'][number] => ({
  id, title: 'Площадь: «Лупа»', location: 'square-flood', cast: ['khvosts', 'watsony'], presentation: 'minigame',
  steps: [skill('magnifier', [L(introLine)]), minigameId ? { t: 'minigame', minigame: minigameId } : dir(`${id}-D99`, 'Осмотр воды без мини-игры'), ...seq('C7-2-', 2, 6), ...extraAfter, L('C7-2-07'), { t: 'clue', clue: 'c7-water' }, goto(`${id.includes('L2') ? 'C7-L2' : id.includes('L3') ? 'C7-L3' : 'C7'}-HUB`)],
});

export const cocoaScene = (id: string, minigameId: string, level: 1 | 2 | 3): VariantSource['scenes'][number] => ({
  id, title: 'Огород: «Чашка какао»', location: 'kartofan-garden-flood', cast: ['kartofan', 'khvosts', 'watsony'], presentation: 'minigame',
  steps: [
    dir(`${id}-D01`, 'Огород Картофана тоже в воде. Картофан сидит на перевёрнутом ведре.'),
    ...seq('C7-3-', 1, 3),
    skill('cocoa', []),
    { t: 'minigame', minigame: minigameId },
    reward('rw-c7-heart-kartofan'),
    ...(level === 1 ? seq('C7-3-', 12, 17) : [...Ls('C7-3-12', 'C7-3-13'), ...seq('C7-L2-3-', 5, 7), ...seq('C7-3-', 14, 17)]),
    { t: 'clue', clue: 'c7-garden' },
    goto(level === 1 ? 'C7-HUB' : level === 2 ? 'C7-L2-HUB' : 'C7-L3-HUB'),
  ],
});

export const mayorScene = (back: string): VariantSource['scenes'][number] => ({
  id: `C7-5-${back}`, title: 'Мэр и фонтан', location: 'square-fountain', cast: ['pudding', 'watsony'], presentation: 'dialogue',
  steps: [...seq('C7-5-', 1, 3), { t: 'clue', clue: 'c7-fountain' }, goto(back)],
});

export const secretScene = (id: string, next: string, level3 = false): VariantSource['scenes'][number] => ({
  id, title: 'Шлюз: тайная заметка', location: 'honey-pond-lock', cast: ['khvosts', 'watsony'], presentation: 'cutscene',
  steps: [
    dir(level3 ? 'C7-L3-4-D01' : 'C7-4-D01', level3
      ? 'Берег пруда: новый шлюз, брёвна, чертёж под камнем. Инструментов Дамки нет; мокрая глина хранит следы.'
      : 'Берег пруда: новый шлюз, брёвна, инструменты Дамки, чертёж под камнем.'),
    ...seq('C7-4-', 1, 4),
    dir('C7-4-D02', 'Запись показана волной: «плеск», «ква», «тук», тихое низкое «ух».'),
    ...seq('C7-4-', 5, 10),
    goto(next),
  ],
});

export const versionScene = (id: string, hub: string): VariantSource['scenes'][number] => ({
  id, title: 'Версия', location: 'honey-pond-lock', cast: ['khvosts', 'watsony'], presentation: 'dialogue',
  steps: [skill('version', [L('C7-7-01'), L('C7-7-02')]), goto(hub)],
});

export const resolutionScene = (id: string, next: string, extra: Step[] = []): VariantSource['scenes'][number] => ({
  id, title: 'Доброе разрешение', location: 'honey-pond-lock', cast: ['damka', 'pudding', 'kartofan', 'khvosts', 'watsony'], presentation: 'cutscene',
  steps: [...seq('C7-8-', 1, 12), ...extra, ...seq('C7-8-', 13, 16), goto(next)],
});

export const repairScene = (id: string, minigameId: string, level: 1 | 2 | 3): VariantSource['scenes'][number] => ({
  id, title: 'Финал: «Почини плотину»', location: 'honey-pond-lock', cast: ['damka', 'pudding', 'kartofan'], presentation: 'minigame',
  steps: [skill('dam-repair', [L('C7-9-01')]), { t: 'minigame', minigame: minigameId }, ...seq('C7-9-', 11, 13), goto('C7-10')],
});

export const factsScene = (): VariantSource['scenes'][number] => ({
  id: 'C7-10', title: '«А ты знал?»', location: 'honey-pond', cast: ['watsony'], presentation: 'dialogue',
  steps: [skill('encyclopedia', [dir('C7-10-D01', 'Три карточки о бобрах складываются в Энциклопедию.')]), ...seq('C7-10-', 1, 4), goto('C7-11')],
});

export const rewardScene = (level: 1 | 2 | 3): VariantSource['scenes'][number] => ({
  id: 'C7-11', title: 'Награда', location: 'office', cast: ['khvosts', 'watsony'], presentation: 'cutscene',
  steps: [
    L('C7-11-01'), L('C7-11-02'),
    reward('rw-c7-badge'), reward(`rw-c7-buttons-l${level}`), reward(`rw-c7-sticker-l${level}`), reward('rw-c7-decor-lock'), reward('rw-c7-activity'),
    dir('C7-11-D01', 'Новые слова в «Словарике сыщика»: причина, следствие.'),
    skill('cozy-day', [dir('C7-11-D02', 'Игрок ставит модель шлюза в Конторе.'), wait('office.place')]),
    ...seq('C7-11-', 3, 5), { t: 'end' },
  ],
});

export const commonCollections: VariantSource['collections'] = [
  { id: 'c7-secret-uh', collection: 'secret-notes', label: 'C7-COL-secret-uh', line: 'C7-4-05' },
  { id: 'c7-symbol-bell', collection: 'symbol-cards', label: 'C7-COL-bell', line: 'C7-4-09' },
  { id: 'c7-symbol-heart', collection: 'symbol-cards', label: 'C7-COL-heart', line: 'C7-4-09' },
];

export const commonCutscenes: VariantSource['cutscenes'] = [
  { id: 'cs-c7-intro', scene: 'C7-0', summary: 'Пудинг зовёт Бюро на залитую площадь; утки плавают у фонтана.' },
  { id: 'cs-c7-secret', scene: 'C7-4', summary: 'Ночная запись у шлюза показывает тихое «ух»; под брёвнами найдены колокольчик и сердечко.' },
  { id: 'cs-c7-resolution', scene: 'C7-8', summary: 'Дамка признаётся: строила новый шлюз с водяным салютом и не успела до дождя.' },
  { id: 'cs-c7-salute', scene: 'C7-9', summary: 'Игрок помогает закрыть шлюз; водяной салют переливается радугой.' },
  { id: 'cs-c7-reward', scene: 'C7-11', summary: 'Вручение значка «Водяной салют» и модели шлюза для Конторы.' },
];

export const baseDecisions: VariantSource['decisions'] = [
  { id: 'C7-D1', text: 'Сцена C7-4 с тихим «ух» и двумя карточками-символами поставлена перед уликoй у шлюза на обязательном пути всех сложностей.', ref: 'D06, D07, D10' },
  { id: 'C7-D2', text: 'Пухлик не появляется; реплика C7-4-06 остаётся отвлекающей догадкой Ватсони.', ref: 'D07' },
  { id: 'C7-D3', text: 'Дамка описана как смотритель Медового маяка и инженер, строившая шлюз к празднику.', ref: 'D20' },
  { id: 'C7-D4', text: 'Сцена версии звучит один раз после всех обязательных улик; затем кнопка «Приглашу на разговор» доступна в Блокноте.', ref: 'Q14, Q16' },
];

export const commonComfort: VariantSource['comfort'] = [{ scene: 'C7-1', line: 'C7-L-01' }, { scene: 'C7-4', line: 'C7-L-02' }];
export { cl };
