// Case 2 cutscenes (T25): only existing case line IDs are spoken.
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
const enter = (actor: string, from: 'left' | 'right', x: number, y = FLOOR, duration = 1.0): Step => ({ op: 'enter', actor, from, to: at(x, y), duration, wait: false });
const appear = (actor: string, x: number, y: number): Step[] => [{ op: 'enter', actor, from: at(x, y), to: at(x, y), duration: 0.1, walk: false }, { op: 'pose', actor, clip: 'present' }];
const face = (actor: string, side: 'left' | 'right'): Step => ({ op: 'pose', actor, face: side });
const expr = (actor: string, expression: string): Step => ({ op: 'pose', actor, expression });
const clip = (actor: string, name: string, wait = true): Step => ({ op: 'pose', actor, clip: name, wait });
const emote = (actor: string, name: string): Step => ({ op: 'emote', actor, emote: name });
const background = (asset: string, crossfade = 0): Step => crossfade ? { op: 'background', asset, transition: { type: 'crossfade', duration: crossfade } } : { op: 'background', asset, transition: { type: 'cut' } };
const cut = (preset: string): Step => ({ op: 'camera', preset, cut: true });
const camera = (preset: string, duration = 1.0): Step => ({ op: 'camera', preset, duration, ease: 'easeInOutSine' });
const sfx = (name: string, gain = 0.8): Step => ({ op: 'sfx', asset: `sfx.${name}`, gain });
const music = (name: string, fade = 1.0): Step => ({ op: 'music', asset: `music.${name}`, fade, comfort: { asset: `music.${name}-warm` } });
const effect = (name: string, x: number, y: number, duration = 1.5): Step => ({ op: 'effect', effect: name, at: at(x, y), duration, wait: false });
const join = (): Step => ({ op: 'join' });

function doc(id: string, cast: CutsceneFile['cast'], steps: Step[]): CutsceneFile {
  return { format: 'aegis-cutscene/1', id, revision: '1', advance: 'input', cast, steps };
}

const officeCast = {
  khvosts: rig('khvosts'), watsony: rig('watsony'), pudding: rig('pudding'), player: avatar,
  beetle: rig('prop.postal-beetle'), letter: rig('prop.letter'),
};

export const office = (level: 1 | 2 | 3): Cutscene => {
  const id = `c2.office.l${level}`;
  return {
    id, scene: 'C2-0',
    summary: 'В Конторе не прилетает почтовый жук; Пудинг вбегает и сообщает о пропаже писем.',
    document: doc(id, officeCast, [
      background('bg.office'), music('title-office'), cut('wide'),
      enter('watsony', 'left', 560), enter('player', 'left', 900), enter('khvosts', 'right', 1450), join(),
      marker('office.waiting'), expr('khvosts', 'worried'), line('khvosts', 'C2-0-01'),
      expr('watsony', 'worried'), line('watsony', 'C2-0-02'),
      marker('office.mayor'), sfx('letter-chime', 0.5), enter('pudding', 'right', 1900), join(), face('pudding', 'left'),
      expr('pudding', 'worried'), line('pudding', 'C2-0-03'),
      expr('khvosts', 'happy'), line('khvosts', 'C2-0-04'), emote('player', 'nod'), marker('office.end'),
    ]),
  };
};

const oakCastBase = {
  stella: rig('stella'), pudding: rig('pudding'), mouse: rig('mouse'), khvosts: rig('khvosts'), watsony: rig('watsony'), player: avatar,
  letters: rig('prop.c2-dry-letters'), nest: rig('prop.c2-magpie-nest'),
};

const oakOpening = (): Step[] => [
  background('bg.old-oak'), music('heartfelt'), cut('wide'),
  ...appear('nest', 1850, 340), enter('khvosts', 'left', 520), enter('watsony', 'left', 760), enter('player', 'left', 1000), enter('pudding', 'right', 1810),
  { op: 'enter', actor: 'stella', from: 'right', to: at(1510, 1150), duration: 1.1, walk: false }, clip('stella', 'hover', false), join(),
  marker('oak.arrive'), expr('stella', 'worried'), line('stella', 'C2-7-01'),
  expr('khvosts', 'happy'), line('khvosts', 'C2-7-02'),
  camera('close-right'), ...lines('stella', 'C2-7-03', 'C2-7-04', 'C2-7-05', 'C2-7-06', 'C2-7-07'),
  marker('oak.letters'), ...appear('letters', 1420, 980), sfx('page-turn', 0.5), effect('sparkles', 1420, 980),
  expr('pudding', 'surprised'), line('pudding', 'C2-7-08'), expr('pudding', 'worried'), line('pudding', 'C2-7-09'), line('pudding', 'C2-7-10'),
  camera('wide'), marker('oak.herrings'), line('khvosts', 'C2-7-11'), ...lines('khvosts', 'C2-7-12', 'C2-7-13'),
];

const oakFinale = (): Step[] => [
  ...lines('khvosts', 'C2-7-14', 'C2-7-15', 'C2-7-16'),
  expr('stella', 'happy'), line('stella', 'C2-7-17'),
  expr('khvosts', 'happy'), sfx('success'), effect('confetti', 1280, 720, 2.0), line('khvosts', 'C2-7-18'),
  emote('player', 'joy'), marker('oak.end'),
];

export const oak = (level: 1 | 2 | 3, scene: string): Cutscene => {
  const id = `c2.oak.l${level}`;
  const cast = level === 1 ? oakCastBase : level === 2 ? { ...oakCastBase, damka: rig('damka') } : { ...oakCastBase, damka: rig('damka'), fitilyok: rig('fitilyok') };
  const extra: Step[] = level === 1 ? [] : level === 2 ? [
    ...lines('khvosts', 'C2-L2-7-01', 'C2-L2-7-02', 'C2-L2-7-03'), line('pudding', 'C2-L2-7-04'),
  ] : [
    ...lines('khvosts', 'C2-L2-7-01', 'C2-L2-7-02', 'C2-L2-7-03'), line('pudding', 'C2-L2-7-04'),
    line('khvosts', 'C2-L3-9-01'), line('fitilyok', 'C2-L3-9-02'), line('fitilyok', 'C2-L3-9-03'),
  ];
  return { id, scene, summary: 'Стелла достаёт сухие письма из гнезда, объясняет поступок, и команда разбирает ложные следы.', document: doc(id, cast, [...oakOpening(), ...extra, ...oakFinale()]) };
};

export const exhibition = (level: 1 | 2 | 3, scene: string): Cutscene => {
  const id = `c2.exhibition.l${level}`;
  const cast = { stella: rig('stella'), pudding: rig('pudding'), tyopa: rig('tyopa'), player: avatar, garland: rig('prop.c2-letter-garland') };
  return { id, scene, summary: 'Жители развешивают спасённые приглашения на верёвочке с флажками мышат.', document: doc(id, cast, [
    background('bg.town-square'), music('celebration-baking'), cut('wide'),
    enter('player', 'left', 620), enter('tyopa', 'left', 930), enter('stella', 'right', 1430, FLY), enter('pudding', 'right', 1840), join(), clip('stella', 'hover', false),
    marker('exhibition.garland'), ...appear('garland', 1280, 640), sfx('reward'), effect('sparkles', 1280, 640),
    line('pudding', 'C2-8-05'), expr('stella', 'happy'), line('stella', 'C2-8-06'), expr('tyopa', 'happy'), line('tyopa', 'C2-8-07'), line('pudding', 'C2-8-08'),
    emote('player', 'joy'), marker('exhibition.end'),
  ]) };
};

export const rewardCutscene = (level: 1 | 2 | 3): Cutscene => {
  const id = `c2.reward.l${level}`;
  return { id, scene: 'C2-10', summary: 'Хвостс вручает значок, звание, стикер и плакат почтового шифра.', document: doc(id, {
    khvosts: rig('khvosts'), watsony: rig('watsony'), player: avatar,
    badge: rig('prop.badge-letters-saved'), sticker: rig(`prop.sticker-letters-${level}`), poster: rig('prop.c2-cipher-poster'),
  }, [
    background('bg.office'), music('celebration-baking'), cut('wide'), enter('watsony', 'left', 560), enter('player', 'left', 900), enter('khvosts', 'right', 1800), join(),
    marker('reward.badge'), expr('khvosts', 'happy'), line('khvosts', 'C2-10-01'), camera('close-center'), ...appear('badge', 1080, 860), sfx('reward'), effect('sparkles', 1080, 860), line('khvosts', 'C2-10-02'),
    ...appear('sticker', 1480, 860), line('khvosts', 'C2-10-03'), marker('reward.poster'), cut('wide'), { op: 'exit', actor: 'badge', to: at(1080, 860), duration: 0.1, walk: false }, { op: 'exit', actor: 'sticker', to: at(1480, 860), duration: 0.1, walk: false }, ...appear('poster', 1280, 720), line('watsony', 'C2-10-04'), emote('player', 'joy'), marker('reward.end'),
  ]) };
};
