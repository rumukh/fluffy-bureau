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
const enter = (actor: string, from: 'left' | 'right', x: number, y = FLOOR, duration = 1): Step => ({ op: 'enter', actor, from, to: at(x, y), duration, wait: false });
const appear = (actor: string, x: number, y: number): Step[] => [{ op: 'enter', actor, from: at(x, y), to: at(x, y), duration: 0.1, walk: false }, { op: 'pose', actor, clip: 'present' }];
const expr = (actor: string, expression: string): Step => ({ op: 'pose', actor, expression });
const clip = (actor: string, name: string, wait = true): Step => ({ op: 'pose', actor, clip: name, wait });
const emote = (actor: string, name: string): Step => ({ op: 'emote', actor, emote: name });
const music = (name: string, fade = 1.2): Step => ({ op: 'music', asset: `music.${name}`, fade, comfort: { asset: `music.${name}-warm` } });
const background = (asset: string, crossfade = 0): Step => crossfade ? { op: 'background', asset, transition: { type: 'crossfade', duration: crossfade } } : { op: 'background', asset, transition: { type: 'cut' } };
const camera = (preset: string, duration = 1): Step => ({ op: 'camera', preset, duration, ease: 'easeInOutSine' });
const cut = (preset: string): Step => ({ op: 'camera', preset, cut: true });
const sfx = (name: string, gain = 0.8): Step => ({ op: 'sfx', asset: `sfx.${name}`, gain });
const effect = (name: string, x: number, y: number, duration: number): Step => ({ op: 'effect', effect: name, at: at(x, y), duration, wait: false });
const join = (): Step => ({ op: 'join' });

function doc(id: string, cast: CutsceneFile['cast'], steps: Step[]): CutsceneFile {
  return { format: 'aegis-cutscene/1', id, revision: '1', advance: 'input', cast, steps };
}

const baseCast = { pudding: rig('pudding'), khvosts: rig('khvosts'), watsony: rig('watsony'), player: avatar };

export function officeCutscene(id: string): Cutscene {
  return {
    id, scene: 'C4-0',
    summary: 'Мэр приносит пустую банку и сообщает о пропаже варенья; Хвостс зовёт в погреб.',
    document: doc(id, { ...baseCast, jar: rig('prop.empty-jam-jar') }, [
      background('bg.office'), music('title-office'), cut('wide'),
      enter('watsony', 'left', 520), enter('player', 'left', 860), enter('khvosts', 'right', 1400), enter('pudding', 'right', 1780), join(),
      ...appear('jar', 1700, 1130), expr('pudding', 'worried'), marker('office.arrive'),
      ...lines('pudding', 'C4-0-01', 'C4-0-02'),
      expr('khvosts', 'surprised'), line('khvosts', 'C4-0-03'),
      clip('khvosts', 'look-around'), expr('khvosts', 'happy'), line('khvosts', 'C4-0-04'),
      emote('player', 'nod'), marker('office.end'),
    ]),
  };
}

export function cellarCutscene(id: string, scene: string, extra: Step[] = []): Cutscene {
  return {
    id, scene,
    summary: 'В погребе видны пустые полки; мэр подозревает мышат, а Хвостс честно добавляет себя.',
    document: doc(id, baseCast, [
      background('bg.mayor-cellar'), music('title-office'), cut('wide'),
      enter('pudding', 'left', 520), enter('watsony', 'left', 820), enter('player', 'left', 1120), enter('khvosts', 'right', 1660), join(),
      effect('fireflies', 1280, 720, 4), marker('cellar.empty'),
      ...lines('pudding', 'C4-1-01', 'C4-1-02'),
      expr('watsony', 'surprised'), line('watsony', 'C4-1-03'),
      expr('pudding', 'worried'), line('pudding', 'C4-1-04'),
      camera('close-center'), expr('khvosts', 'happy'), ...lines('khvosts', 'C4-1-05', 'C4-1-06'),
      ...extra,
      camera('wide'), marker('cellar.end'),
    ]),
  };
}

export function pantryCutscene(id: string, scene: string, level: 1 | 2 | 3): Cutscene {
  const cast: Record<string, { rig: string } | { role: 'avatar' }> = { pudding: rig('pudding'), mouse: rig('mouse'), pukhlik: rig('pukhlik'), khvosts: rig('khvosts'), watsony: rig('watsony'), player: avatar, jars: rig('prop.jam-jars-c4'), note: rig('prop.note-khvosts') };
  if (level === 3) cast.kartofan = rig('kartofan');
  return {
    id, scene,
    summary: 'В кладовке находятся банки и записка Хвостса; он признаёт ошибку и разбирает ложные следы.',
    document: doc(id, cast, [
      background('bg.office-pantry'), music('heartfelt'), cut('wide'),
      ...appear('jars', 1460, 1320), enter('watsony', 'left', 420), enter('player', 'left', 700), enter('khvosts', 'left', 980), enter('pudding', 'right', 1680), enter('mouse', 'right', 1980), enter('pukhlik', 'right', 2180, FLY), join(),
      clip('pukhlik', 'hover', false), marker('pantry.found'),
      ...lines('khvosts', 'C4-7-01', 'C4-7-02'),
      ...appear('note', 1260, 960), sfx('page-turn'), expr('khvosts', 'worried'), ...lines('khvosts', 'C4-7-03', 'C4-7-04', 'C4-7-05', 'C4-7-06', 'C4-7-07'),
      expr('pudding', 'happy'), line('pudding', 'C4-7-08'), expr('mouse', 'happy'), line('mouse', 'C4-7-09'),
      marker('pantry.herrings'), camera('close-center'), ...lines('khvosts', 'C4-7-10', 'C4-7-11', 'C4-7-12'),
      ...(level >= 2 ? [...lines('khvosts', 'C4-L2-7-01', 'C4-L2-7-02'), line('watsony', 'C4-L2-7-03')] : []),
      ...(level === 3 ? [enter('kartofan', 'right', 2050), join(), line('khvosts', 'C4-L3-9-01'), line('khvosts', 'C4-L3-9-02'), line('kartofan', 'C4-L3-9-03')] : []),
      ...lines('khvosts', 'C4-7-13', 'C4-7-14', 'C4-7-15'), line('pukhlik', 'C4-7-16'), line('khvosts', 'C4-7-17'),
      camera('wide'), effect('sparkles', 1280, 820, 2), emote('player', 'joy'), marker('pantry.end'),
    ]),
  };
}

export function teaCutscene(id: string, scene: string, level: 1 | 2 | 3): Cutscene {
  const cast: Record<string, { rig: string } | { role: 'avatar' }> = { pudding: rig('pudding'), mouse: rig('mouse'), pukhlik: rig('pukhlik'), khvosts: rig('khvosts'), watsony: rig('watsony'), player: avatar, table: rig('prop.tea-table-c4') };
  if (level === 3) cast.kartofan = rig('kartofan');
  return {
    id, scene,
    summary: 'После дележа варенья герои празднуют честность и благодарят игрока.',
    document: doc(id, cast, [
      background('bg.town-square'), music('celebration-baking'), cut('wide'),
      ...appear('table', 1280, 1320), enter('pudding', 'left', 470), enter('watsony', 'left', 760), enter('player', 'left', 1030), enter('khvosts', 'right', 1540), enter('mouse', 'right', 1840), enter('pukhlik', 'right', 2100, FLY), join(),
      clip('pukhlik', 'hover', false), marker('tea.toast'),
      ...(level === 3 ? [line('khvosts', 'C4-L3-10-02')] : []),
      ...lines('khvosts', 'C4-8-05'), line('watsony', 'C4-8-06'), line('pudding', 'C4-8-07'),
      effect('confetti', 1280, 700, 2), emote('player', 'joy'), marker('tea.end'),
    ]),
  };
}

export function rewardCutscene(id: string, level: 1 | 2 | 3): Cutscene {
  return {
    id, scene: 'C4-10',
    summary: 'Награда за четвёртое дело: значок, звание и банка варенья для Конторы.',
    document: doc(id, { khvosts: rig('khvosts'), watsony: rig('watsony'), player: avatar, badge: rig('prop.badge-jam-c4'), sticker: rig(`prop.sticker-jam-c4-${level}`), jar: rig('prop.jam-jar-c4') }, [
      background('bg.office'), music('celebration-baking'), cut('wide'),
      enter('watsony', 'left', 520), enter('player', 'left', 880), enter('khvosts', 'right', 1540), join(),
      marker('reward.badge'), expr('khvosts', 'happy'), line('khvosts', 'C4-10-01'),
      ...appear('badge', 1240, 920), sfx('reward'), effect('sparkles', 1240, 920, 1.5), line('khvosts', 'C4-10-02'),
      ...appear('sticker', 1450, 940), line('khvosts', 'C4-10-03'),
      ...appear('jar', 1760, 1180), expr('watsony', 'happy'), line('watsony', 'C4-10-04'),
      emote('player', 'joy'), marker('reward.end'),
    ]),
  };
}
