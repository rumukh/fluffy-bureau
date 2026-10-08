// Case 3 Stage 2 cutscenes (T25). Helpers are local copies of the Stage 1 style.
import type { CutsceneFile, CutsceneStep } from '@aegis/browser/animation';
import type { Cutscene } from '../../packages/content/src/schema.ts';

type Step = CutsceneStep;
type Vec = { x: number; y: number };

const FLOOR = 1450;
const at = (x: number, y = FLOOR): Vec => ({ x, y });
const rig = (id: string) => ({ rig: id });
const avatar = { role: 'avatar' as const };
const line = (actor: string, id: string): Step => ({ op: 'line', actor, line: id });
const marker = (id: string): Step => ({ op: 'marker', id });
const enter = (actor: string, from: 'left' | 'right', x: number, y = FLOOR, duration = 1): Step => ({ op: 'enter', actor, from, to: at(x, y), duration, wait: false });
const appear = (actor: string, x: number, y: number): Step[] => [
  { op: 'enter', actor, from: at(x, y), to: at(x, y), duration: 0.1, walk: false },
  { op: 'pose', actor, clip: 'present' },
];
const face = (actor: string, side: 'left' | 'right'): Step => ({ op: 'pose', actor, face: side });
const expr = (actor: string, expression: string): Step => ({ op: 'pose', actor, expression });
const clip = (actor: string, name: string, wait = true): Step => ({ op: 'pose', actor, clip: name, wait });
const emote = (actor: string, name: string): Step => ({ op: 'emote', actor, emote: name });
const background = (asset: string): Step => ({ op: 'background', asset, transition: { type: 'cut' } });
const cut = (preset: string): Step => ({ op: 'camera', preset, cut: true });
const camera = (preset: string, duration = 1): Step => ({ op: 'camera', preset, duration, ease: 'easeInOutSine' });
const sfx = (name: string, gain = 0.8): Step => ({ op: 'sfx', asset: `sfx.${name}`, gain });
const music = (name: string): Step => ({ op: 'music', asset: `music.${name}`, fade: 1.2, comfort: { asset: `music.${name}-warm` } });
const effect = (name: string, x: number, y: number, duration = 1.2): Step => ({ op: 'effect', effect: name, at: at(x, y), duration, wait: false });
const join = (): Step => ({ op: 'join' });

function doc(id: string, cast: CutsceneFile['cast'], steps: Step[]): CutsceneFile {
  return { format: 'aegis-cutscene/1', id, revision: '1', advance: 'input', cast, steps };
}

const introCast = {
  khvosts: rig('khvosts'),
  watsony: rig('watsony'),
  mouse: rig('mouse'),
  player: avatar,
  lantern: rig('prop.firefly-lantern'),
};

export function intro(level: 1 | 2 | 3, nextScene: string): Cutscene {
  const id = `c3.intro.l${level}`;
  return {
    id,
    scene: 'C3-0',
    summary: 'Вечером в Конторе мышата рассказывают о мигании на маяке; команда берёт фонари и идёт к Медовому пруду.',
    document: doc(id, introCast, [
      background('bg.office-evening'),
      music('title-office'),
      cut('wide'),
      ...appear('lantern', 2050, 760),
      enter('watsony', 'left', 560),
      enter('player', 'left', 860),
      enter('khvosts', 'right', 1700),
      join(),
      marker('intro.office'),
      effect('glow', 2050, 760),
      line('watsony', 'C3-0-01'),
      line('khvosts', 'C3-0-02'),
      line('khvosts', 'C3-0-03'),
      marker('intro.mice'),
      sfx('footsteps', 0.45),
      enter('mouse', 'left', 360, FLOOR, 0.8),
      expr('mouse', 'worried'),
      line('mouse', 'C3-0-04'),
      line('mouse', 'C3-0-05'),
      line('mouse', 'C3-0-06'),
      marker('intro.answer'),
      effect('bubbles', 1550, 760, 1.4),
      line('khvosts', 'C3-0-07'),
      expr('khvosts', 'happy'),
      line('khvosts', 'C3-0-08'),
      expr('watsony', 'happy'),
      line('watsony', 'C3-0-09'),
      marker(`intro.to.${nextScene}`),
    ]),
  };
}

export function note(level: 1 | 2 | 3): Cutscene {
  const id = `c3.note.l${level}`;
  return {
    id,
    scene: 'C3-3',
    summary: 'У двери маяка Дамка находит починенное весло с ромашкой; Ватсони называет первую Тайную заметку.',
    document: doc(id, {
      damka: rig('damka'), khvosts: rig('khvosts'), watsony: rig('watsony'), player: avatar,
      paddle: rig('prop.paddle-repaired'), chamomile: rig('prop.chamomile-note'),
    }, [
      background('bg.lighthouse-door'),
      cut('wide'),
      ...appear('paddle', 1500, 1350),
      ...appear('chamomile', 1540, 1180),
      enter('damka', 'right', 1780),
      enter('khvosts', 'left', 760),
      enter('watsony', 'left', 520),
      enter('player', 'left', 1040),
      join(),
      marker('note.door'),
      line('damka', 'C3-3-01'),
      expr('damka', 'surprised'),
      camera('close-right'),
      line('damka', 'C3-3-02'),
      line('damka', 'C3-3-03'),
      marker('note.shadow'),
      camera('wide'),
      face('khvosts', 'right'),
      line('khvosts', 'C3-3-04'),
      expr('watsony', 'surprised'),
      line('watsony', 'C3-3-05'),
      line('watsony', 'C3-3-06'),
      marker('note.smell'),
      camera('close-center'),
      effect('sparkles', 1540, 1180),
      line('khvosts', 'C3-3-07'),
      sfx('page-turn', 0.5),
      line('khvosts', 'C3-3-08'),
      marker('note.end'),
    ]),
  };
}

const revealBaseCast = {
  khvosts: rig('khvosts'),
  watsony: rig('watsony'),
  pukhlik: rig('pukhlik'),
  damka: rig('damka'),
  player: avatar,
  book: rig('prop.light-code-book'),
};

function revealOpening(): Step[] {
  return [
    background('bg.lighthouse-room'),
    music('heartfelt'),
    cut('wide'),
    ...appear('book', 1430, 1250),
    enter('khvosts', 'left', 730),
    enter('watsony', 'left', 500),
    enter('player', 'left', 980),
    enter('damka', 'right', 1850),
    join(),
    marker('reveal.knock'),
    sfx('page-turn', 0.35),
    line('khvosts', 'C3-8-01'),
    { op: 'enter', actor: 'pukhlik', from: at(1500, 1040), to: at(1500, 1040), duration: 0.1, walk: false },
    clip('pukhlik', 'shrug-shy'),
    expr('pukhlik', 'worried'),
    line('pukhlik', 'C3-8-02'),
    line('pukhlik', 'C3-8-03'),
    line('pukhlik', 'C3-8-04'),
    line('pukhlik', 'C3-8-05'),
    marker('reveal.kindness'),
    expr('khvosts', 'happy'),
    line('khvosts', 'C3-8-06'),
    line('khvosts', 'C3-8-07'),
    expr('pukhlik', 'happy'),
    line('pukhlik', 'C3-8-08'),
    marker('reveal.herrings'),
    line('khvosts', 'C3-8-09'),
    line('khvosts', 'C3-8-10'),
    line('khvosts', 'C3-8-11'),
  ];
}

function revealEnding(): Step[] {
  return [
    line('khvosts', 'C3-8-12'),
    marker('reveal.solved'),
    effect('confetti', 1280, 740, 1.8),
    line('khvosts', 'C3-8-13'),
    line('khvosts', 'C3-8-14'),
    line('pukhlik', 'C3-8-15'),
    line('pukhlik', 'C3-8-16'),
    emote('player', 'joy'),
    marker('reveal.end'),
  ];
}

export function reveal(level: 1 | 2 | 3, scene: string): Cutscene {
  const id = `c3.reveal.l${level}`;
  const cast = level === 3 ? { ...revealBaseCast, tyopa: rig('tyopa') } : revealBaseCast;
  const extra = level === 1 ? [] : [
    line('khvosts', 'C3-L2-8-01'),
    line('damka', 'C3-L2-8-02'),
    ...(level === 3 ? [
      enter('tyopa', 'right', 2100),
      join(),
      line('khvosts', 'C3-L3-10-01'),
      line('tyopa', 'C3-L3-10-02'),
    ] : []),
  ];
  return {
    id,
    scene,
    summary: 'Пухлик выходит в фонарной комнате, признаётся в тренировке огоньков, а Хвостс разбирает ложные следы.',
    document: doc(id, cast, [...revealOpening(), ...extra, ...revealEnding()]),
  };
}

export function reward(level: 1 | 2 | 3): Cutscene {
  const id = `c3.reward.l${level}`;
  return {
    id,
    scene: 'C3-11',
    summary: 'В Конторе Хвостс вручает значок «Огонёк маяка», а Ватсони напоминает о тайне Серой Тени.',
    document: doc(id, {
      khvosts: rig('khvosts'), watsony: rig('watsony'), player: avatar,
      badge: rig('prop.badge-beacon'), sticker: rig(`prop.sticker-beacon-${level}`), lamp: rig('prop.firefly-lamp'),
    }, [
      background('bg.office'),
      music('celebration-baking'),
      cut('wide'),
      enter('watsony', 'left', 560),
      enter('player', 'left', 900),
      enter('khvosts', 'right', 1660),
      join(),
      marker('reward.case'),
      line('khvosts', 'C3-11-01'),
      camera('close-center'),
      ...appear('badge', 1200, 900),
      ...appear('sticker', 1460, 900),
      ...appear('lamp', 1280, 1120),
      sfx('reward'),
      effect('sparkles', 1280, 900, 1.5),
      line('khvosts', 'C3-11-02'),
      marker('reward.shadow'),
      camera('wide'),
      expr('watsony', 'worried'),
      line('watsony', 'C3-11-03'),
      line('khvosts', 'C3-11-04'),
      emote('player', 'joy'),
      marker('reward.end'),
    ]),
  };
}
