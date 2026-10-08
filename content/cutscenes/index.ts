// Stage 1 cutscenes (T25): aegis-cutscene/1 documents (docs/api/animation.md §9, SDK 711ec45).
// Only existing script line IDs are spoken. Gameplay effects (rewards, clues) stay as ordinary steps
// after the cutscene. Every cutscene except the wordless intro casts the player's avatar.
// advance is "input": after each line the player presses «Дальше» (Q29); motion without speech runs
// on its own. Rigs, clips, props and backgrounds are A's IDs (docs/art/STAGING_RU.md).
import type { CutsceneFile, CutsceneStep } from '@aegis/browser/animation';
import type { Cutscene } from '../../packages/content/src/schema.ts';

type Step = CutsceneStep;
type Vec = { x: number; y: number };

const FLOOR = 1450;
const FLY = 950;
const at = (x: number, y = FLOOR): Vec => ({ x, y });

const rig = (id: string) => ({ rig: id });
const avatar = { role: 'avatar' as const };

const line = (actor: string, id: string): Step => ({ op: 'line', actor, line: id });
const lines = (actor: string, ...ids: string[]): Step[] => ids.map((id) => line(actor, id));
const marker = (id: string): Step => ({ op: 'marker', id });
const enter = (actor: string, from: 'left' | 'right', x: number, y = FLOOR, duration = 1.2): Step => ({
  op: 'enter', actor, from, to: at(x, y), duration, wait: false,
});
/** Props and title appear in place: a very short entrance from their own point, then the `present` clip. */
const appear = (actor: string, x: number, y: number): Step[] => [
  { op: 'enter', actor, from: at(x, y), to: at(x, y), duration: 0.1, walk: false },
  { op: 'pose', actor, clip: 'present' },
];
const face = (actor: string, side: 'left' | 'right'): Step => ({ op: 'pose', actor, face: side });
const expr = (actor: string, expression: string): Step => ({ op: 'pose', actor, expression });
const clip = (actor: string, name: string, wait = true): Step => ({ op: 'pose', actor, clip: name, wait });
const emote = (actor: string, name: string): Step => ({ op: 'emote', actor, emote: name });
const music = (name: string, fade = 1.5): Step => ({
  op: 'music', asset: `music.${name}`, fade, comfort: { asset: `music.${name}-warm` },
});
const background = (asset: string, crossfade = 0): Step =>
  crossfade ? { op: 'background', asset, transition: { type: 'crossfade', duration: crossfade } } : { op: 'background', asset, transition: { type: 'cut' } };
const camera = (preset: string, duration = 1.2): Step => ({ op: 'camera', preset, duration, ease: 'easeInOutSine' });
const cut = (preset: string): Step => ({ op: 'camera', preset, cut: true });
const sfx = (name: string, gain = 0.8): Step => ({ op: 'sfx', asset: `sfx.${name}`, gain });
const effect = (name: string, x: number, y: number, duration: number): Step => ({ op: 'effect', effect: name, at: at(x, y), duration, wait: false });
const join = (): Step => ({ op: 'join' });
const pause = (seconds: number): Step => ({ op: 'wait', seconds });

function doc(id: string, cast: CutsceneFile['cast'], steps: Step[]): CutsceneFile {
  return { format: 'aegis-cutscene/1', id, revision: '1', advance: 'input', cast, steps };
}

// ---------------------------------------------------------------- intro (prologue, wordless, ~26 s)

export const intro: Cutscene = {
  id: 'intro',
  scene: 'P0',
  summary: 'Вступление без слов (≈26 с, только музыка): Пушистино на закате, флажки и гирлянда к юбилею, огоньки; название игры; вывеска бюро и пузыри Хвостса в круглом окне.',
  document: doc('intro', { title: rig('prop.title-card'), garland: rig('prop.garland-100'), bunting: rig('prop.bunting') }, [
    music('title-office', 2),
    background('bg.intro-town'),
    cut('wide'),
    marker('intro.town'),
    effect('fireflies', 640, 900, 8),
    effect('fireflies', 1900, 950, 8),
    ...appear('bunting', 1280, 330),
    { op: 'camera', to: { x: 1280, y: 760, zoom: 1.08 }, duration: 6, ease: 'easeInOutSine' },
    ...appear('garland', 1280, 1180),
    effect('confetti', 1280, 500, 3),
    pause(2),
    camera('sky', 2.5),
    marker('intro.title'),
    ...appear('title', 1280, 420),
    effect('glow', 1280, 420, 4),
    pause(4),
    { op: 'transition', type: 'crossfade', duration: 1.5 },
    { op: 'exit', actor: 'title', to: at(1280, 420), duration: 0.1, walk: false },
    { op: 'exit', actor: 'garland', to: at(1280, 1180), duration: 0.1, walk: false },
    { op: 'exit', actor: 'bunting', to: at(1280, 330), duration: 0.1, walk: false },
    background('bg.intro-bureau', 1.5),
    cut('wide'),
    marker('intro.bureau'),
    sfx('bubbles', 0.5),
    effect('bubbles', 520, 620, 5),
    pause(5),
    { op: 'music', asset: null, fade: 2 },
    { op: 'transition', type: 'fade', duration: 1.5, color: '#f3dca8' },
    marker('intro.end'),
  ]),
};

// ---------------------------------------------------------------- P3: the letter arrives

export const p3Letter: Cutscene = {
  id: 'p3.letter',
  scene: 'P3',
  summary: 'Почтовый жук влетает с письмом мэра (мягкий звон); Хвостс читает о пропаже пирога и вручает значок стажёра.',
  document: doc('p3.letter', {
    khvosts: rig('khvosts'), watsony: rig('watsony'), player: avatar,
    beetle: rig('prop.postal-beetle'), badge: rig('prop.badge-intern'),
  }, [
    background('bg.office'),
    cut('wide'),
    enter('watsony', 'left', 600, FLOOR, 0.8),
    enter('player', 'left', 1050, FLOOR, 1.0),
    enter('khvosts', 'right', 1700, FLOOR, 1.0),
    join(),
    face('khvosts', 'left'),
    marker('p3.letter.arrives'),
    sfx('postal-beetle'),
    { op: 'enter', actor: 'beetle', from: 'right', to: at(1420, 900), duration: 1.8, walk: false },
    clip('beetle', 'flutter', false),
    sfx('letter-chime'),
    expr('khvosts', 'surprised'),
    line('khvosts', 'P3-05'),
    expr('watsony', 'worried'),
    line('khvosts', 'P3-06'),
    { op: 'exit', actor: 'beetle', to: 'right', duration: 1.4, walk: false, wait: false },
    marker('p3.badge'),
    expr('khvosts', 'happy'),
    expr('watsony', 'happy'),
    camera('close-center'),
    ...appear('badge', 1280, 950),
    sfx('reward'),
    effect('sparkles', 1280, 950, 1.5),
    line('khvosts', 'P3-07'),
    emote('player', 'joy'),
    camera('wide'),
    marker('p3.end'),
  ]),
};

// ---------------------------------------------------------------- C1-7 shed resolution (three levels)

const SHED_CAST = {
  kartofan: rig('kartofan'),
  khvosts: rig('khvosts'),
  watsony: rig('watsony'),
  pudding: rig('pudding'),
  tyopa: rig('tyopa'),
  fitilyok: rig('fitilyok'),
  player: avatar,
  box: rig('prop.box-pie-closed'),
  boxOpen: rig('prop.box-pie-open'),
};

const shedOpening = (): Step[] => [
  background('bg.shed-interior'),
  music('heartfelt'),
  cut('wide'),
  ...appear('box', 1500, 1520),
  enter('kartofan', 'right', 1850, FLOOR, 0.8),
  enter('watsony', 'left', 380, FLOOR, 1.2),
  enter('player', 'left', 700, FLOOR, 1.2),
  enter('khvosts', 'left', 1020, FLOOR, 1.2),
  enter('pudding', 'left', 1300, FLOOR, 1.4),
  join(),
  face('kartofan', 'left'),
  marker('shed.arrive'),
  line('kartofan', 'C1-7-01'),
  line('khvosts', 'C1-7-02'),
  marker('shed.sniff'),
  camera('close-right'),
  { op: 'move', actor: 'kartofan', to: at(1700), duration: 0.6 },
  clip('kartofan', 'sniff'),
  expr('kartofan', 'surprised'),
  line('kartofan', 'C1-7-03'),
  expr('kartofan', 'worried'),
  line('kartofan', 'C1-7-04'),
  line('kartofan', 'C1-7-05'),
  clip('kartofan', 'bow'),
  line('kartofan', 'C1-7-06'),
  camera('wide'),
  expr('pudding', 'happy'),
  line('pudding', 'C1-7-07'),
  marker('shed.box'),
  camera('close-right'),
  clip('box', 'wobble'),
  { op: 'exit', actor: 'box', to: at(1500, 1520), duration: 0.1, walk: false },
  { op: 'enter', actor: 'boxOpen', from: at(1500, 1520), to: at(1500, 1520), duration: 0.1, walk: false },
  sfx('pick-up'),
  expr('pudding', 'surprised'),
  clip('kartofan', 'shrug-shy'),
  // Reduced motion keeps this held frame: the open box with the pie slid sideways stays in view during the line.
  line('kartofan', 'C1-7-08'),
  expr('pudding', 'neutral'),
  expr('kartofan', 'happy'),
  line('kartofan', 'C1-7-09'),
  camera('wide'),
  enter('tyopa', 'right', 2150, FLOOR, 1.0),
  enter('fitilyok', 'right', 2280, FLY, 1.0),
  join(),
  clip('fitilyok', 'hover', false),
  marker('shed.herrings'),
  effect('bubbles', 1020, 650, 3),
  sfx('bubbles', 0.4),
  line('khvosts', 'C1-7-10'),
  line('khvosts', 'C1-7-11'),
];

const shedExplain = (): Step[] => [
  ...lines('khvosts', 'C1-7-12', 'C1-7-13', 'C1-7-14'),
  emote('khvosts', 'nod'),
  line('khvosts', 'C1-7-14a'),
  emote('player', 'joy'),
  line('khvosts', 'C1-7-14b'),
  emote('fitilyok', 'joy'),
];

const shedFinale = (): Step[] => [
  marker('shed.solved'),
  expr('khvosts', 'happy'),
  line('khvosts', 'C1-7-17'),
  sfx('success'),
  effect('confetti', 1280, 700, 2.5),
  emote('player', 'joy'),
  marker('shed.end'),
];

export const shedL1: Cutscene = {
  id: 'c1.shed.l1',
  scene: 'C1-7',
  summary: 'Разговор в сарае: Картофан нюхает коробку, понимает, что перепутал, открывает её — пирог съехал набок; разбор ложных следов, примирение мэра и Тёпы.',
  document: doc('c1.shed.l1', SHED_CAST, [
    ...shedOpening(),
    ...shedExplain(),
    face('pudding', 'right'),
    clip('pudding', 'bow'),
    line('pudding', 'C1-7-15'),
    face('tyopa', 'left'),
    expr('tyopa', 'happy'),
    line('tyopa', 'C1-7-16'),
    ...shedFinale(),
  ]),
};

export const shedL2: Cutscene = {
  id: 'c1.shed.l2',
  scene: 'L2-8',
  summary: 'Разговор в сарае (сложность 2): как на сложности 1, плюс разбор пера и честной ошибки Стеллы; мэр извиняется перед Тёпой и Стеллой, Стелла обещает ленточку.',
  document: doc('c1.shed.l2', { ...SHED_CAST, stella: rig('stella') }, [
    ...shedOpening(),
    enter('stella', 'right', 1900, 900, 0.9),
    clip('stella', 'hover', false),
    line('khvosts', 'L2-8-01'),
    line('khvosts', 'L2-8-02'),
    ...shedExplain(),
    face('pudding', 'right'),
    clip('pudding', 'bow'),
    line('pudding', 'L2-8-03'),
    expr('stella', 'happy'),
    line('stella', 'L2-8-04'),
    face('tyopa', 'left'),
    expr('tyopa', 'happy'),
    line('tyopa', 'C1-7-16'),
    ...shedFinale(),
  ]),
};

export const shedL3: Cutscene = {
  id: 'c1.shed.l3',
  scene: 'L3-9',
  summary: 'Разговор в сарае (сложность 3): разбор пера, маковых крошек и мышиного следа; мэр извиняется перед Тёпой, Стеллой и мышатами; мышата просят пирога — рецепт удваивается.',
  document: doc('c1.shed.l3', { ...SHED_CAST, stella: rig('stella'), mouse: rig('mouse') }, [
    ...shedOpening(),
    enter('stella', 'right', 1900, 900, 0.9),
    clip('stella', 'hover', false),
    line('khvosts', 'L2-8-01'),
    enter('mouse', 'left', 520, FLOOR, 0.9),
    line('khvosts', 'L3-9-01'),
    line('khvosts', 'L3-9-02'),
    ...shedExplain(),
    face('pudding', 'right'),
    clip('pudding', 'bow'),
    line('pudding', 'L3-9-03'),
    expr('stella', 'happy'),
    line('stella', 'L2-8-04'),
    face('mouse', 'right'),
    clip('mouse', 'shrug-shy'),
    line('mouse', 'L3-9-04'),
    face('pudding', 'left'),
    emote('pudding', 'joy'),
    line('pudding', 'L3-9-05'),
    ...shedFinale(),
  ]),
};

// ---------------------------------------------------------------- C1-8 oven (optional in T25)

export const oven = (level: 1 | 2 | 3, scene: string): Cutscene => ({
  id: `c1.oven.l${level}`,
  scene,
  summary: 'Пирог в печи на медовой карамели, тёплый свет; Тёпа и мэр радуются. Ожидание декоративное, ролик можно пропустить.',
  document: doc(`c1.oven.l${level}`, { pudding: rig('pudding'), tyopa: rig('tyopa'), kartofan: rig('kartofan'), player: avatar, pie: rig('prop.pie-baked') }, [
    background('bg.bakery-oven'),
    music('celebration-baking'),
    cut('wide'),
    enter('pudding', 'left', 1000, FLOOR, 0.8),
    enter('player', 'left', 1350, FLOOR, 0.8),
    enter('kartofan', 'right', 1750, FLOOR, 0.8),
    enter('tyopa', 'right', 2100, FLOOR, 0.8),
    join(),
    marker('oven.baking'),
    sfx('oven', 0.6),
    camera('close-left', 1.5),
    effect('glow', 640, 820, 4),
    effect('steam', 640, 700, 4),
    pause(2.5),
    ...appear('pie', 1500, 1400),
    camera('wide'),
    face('tyopa', 'left'),
    expr('tyopa', 'happy'),
    line('tyopa', 'C1-8-07'),
    face('pudding', 'right'),
    emote('pudding', 'joy'),
    line('pudding', 'C1-8-08'),
    sfx('sparkle'),
    effect('sparkles', 1350, 900, 1.5),
    marker('oven.end'),
  ]),
});

// ---------------------------------------------------------------- C1-10 reward

export const reward = (level: 1 | 2 | 3): Cutscene => ({
  id: `c1.reward.l${level}`,
  scene: 'C1-10',
  summary: 'Награда в Конторе: значок-лапка «Пирог найден», стикер в альбом (звёздочки по сложности), корзинка черники. Сами награды выдаются шагами после ролика.',
  document: doc(`c1.reward.l${level}`, {
    khvosts: rig('khvosts'), watsony: rig('watsony'), player: avatar,
    badge: rig('prop.badge-pie-found'), sticker: rig(`prop.sticker-pie-${level}`), basket: rig('prop.blueberry-basket'),
  }, [
    background('bg.office'),
    music('celebration-baking'),
    cut('wide'),
    enter('watsony', 'left', 600, FLOOR, 0.8),
    enter('player', 'left', 1050, FLOOR, 1.0),
    enter('khvosts', 'right', 1700, FLOOR, 1.0),
    join(),
    face('khvosts', 'left'),
    marker('reward.solved'),
    expr('khvosts', 'happy'),
    line('khvosts', 'C1-10-01'),
    marker('reward.badge'),
    camera('close-center'),
    ...appear('badge', 1280, 900),
    sfx('reward'),
    effect('sparkles', 1280, 900, 2),
    line('khvosts', 'C1-10-02'),
    emote('player', 'joy'),
    camera('wide'),
    marker('reward.sticker'),
    ...appear('sticker', 1650, 700),
    sfx('sticker-check', 0.6),
    ...appear('basket', 900, 1300),
    sfx('pick-up', 0.5),
    emote('watsony', 'joy'),
    pause(1.5),
    marker('reward.end'),
  ]),
});
