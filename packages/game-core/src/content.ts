// Consumer-side view of C's compiled content packs (`@fluffy/content`, format "fluffy-content-pack").
// The runtime content pack is a small *index* of pack IDs and content-addressed revisions; the
// packs themselves live in a PackLibrary, resolved by revision, so that rules read immutable data
// whose identity is covered by the runtime content hash.
import type { ContentPack as FluffyPack, Line, Minigame, Scene, Step } from '@fluffy/content';

export type { FluffyPack };
export type {
  AwaitAction,
  Cond,
  Line,
  Minigame,
  Scene,
  Step,
  MenuOption,
  CaseLogic,
  Hints,
  HintChannel,
  NotebookHelp,
  MinigameConfig,
  Reward,
  Speaker,
  Fact,
  GlossaryEntry,
} from '@fluffy/content';

export interface PackRef {
  id: string;
  revision: string;
}

/** Runtime content data: which packs (by exact revision) this build plays. */
export interface ContentIndex {
  packs: PackRef[];
}

export interface PackIndex {
  pack: FluffyPack;
  lines: Map<string, Line>;
  scenes: Map<string, Scene>;
  minigames: Map<string, Minigame>;
}

const indexes = new WeakMap<object, PackIndex>();

export function indexPack(pack: FluffyPack): PackIndex {
  const cached = indexes.get(pack);
  if (cached) return cached;
  const index: PackIndex = {
    pack,
    lines: new Map(pack.lines.map((line) => [line.id, line])),
    scenes: new Map(pack.scenes.map((scene) => [scene.id, scene])),
    minigames: new Map(pack.minigames.map((game) => [game.id, game])),
  };
  indexes.set(pack, index);
  return index;
}

export class PackLibrary {
  private readonly byRevision = new Map<string, FluffyPack>();
  private readonly latest = new Map<string, FluffyPack>();

  constructor(packs: readonly FluffyPack[] = []) {
    for (const pack of packs) this.add(pack);
  }

  add(pack: FluffyPack): void {
    if (pack.format !== 'fluffy-content-pack' || pack.schema !== 1)
      throw new Error(`Unsupported content pack format for ${String(pack.id)}`);
    const existing = this.byRevision.get(pack.revision);
    if (existing && existing.id !== pack.id)
      throw new Error(`Revision collision between ${existing.id} and ${pack.id}`);
    this.byRevision.set(pack.revision, pack);
    this.latest.set(pack.id, pack);
  }

  get(ref: PackRef): PackIndex {
    const pack = this.byRevision.get(ref.revision);
    if (!pack || pack.id !== ref.id)
      throw new Error(`Content pack ${ref.id}@${ref.revision} is not installed`);
    return indexPack(pack);
  }

  has(ref: PackRef): boolean {
    return this.byRevision.get(ref.revision)?.id === ref.id;
  }

  current(id: string): FluffyPack | undefined {
    return this.latest.get(id);
  }

  index(): ContentIndex {
    return {
      packs: [...this.latest.values()]
        .map((pack) => ({ id: pack.id, revision: pack.revision }))
        .sort((a, b) => a.id.localeCompare(b.id)),
    };
  }
}

export function lineOf(index: PackIndex, id: string, shared?: PackIndex): Line {
  const line = index.lines.get(id) ?? shared?.lines.get(id);
  if (!line) throw new Error(`Unknown line ${id} in ${index.pack.id}`);
  return line;
}

export function sceneOf(index: PackIndex, id: string): Scene {
  const scene = index.scenes.get(id);
  if (!scene) throw new Error(`Unknown scene ${id} in ${index.pack.id}`);
  return scene;
}

export function minigameOf(index: PackIndex, id: string): Minigame {
  const game = index.minigames.get(id);
  if (!game) throw new Error(`Unknown minigame ${id} in ${index.pack.id}`);
  return game;
}

/** Case identity of a pack ID, e.g. case01-l2 → { case: 'case01', level: 2 }. */
export function caseOfPack(packId: string): { caseId: string; level: 1 | 2 | 3 | null } {
  const match = /^(case\d\d)-l([123])$/.exec(packId);
  if (match) return { caseId: match[1]!, level: Number(match[2]) as 1 | 2 | 3 };
  return { caseId: packId, level: null };
}

export function stepAt(steps: readonly Step[], index: number): Step | undefined {
  return steps[index];
}
