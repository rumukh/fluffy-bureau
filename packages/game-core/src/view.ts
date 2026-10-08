// Child-facing projection of the authoritative profile state.
import { projectMinigame } from '@aegis/narrative';
import {
  caseOfPack,
  lineOf,
  minigameOf,
  sceneOf,
  type ContentIndex,
  type FluffyPack,
  type PackIndex,
  type Scene,
  type Step,
} from './content.js';
import type { StageAction } from '@fluffy/content';
import { currentStep, evaluate, visibleOptions, type AwaitAction } from './interpreter.js';
import { minigameDefinition } from './minigames.js';
import { rankOf, type Avatar, type ProfileState, type QueueSource } from './state.js';
import { isUnlocked, SHARED_PACK, type GameRules } from './rules.js';
import { canAfford, isOnSale, newRank, rankFor, residentsAvailable } from './cozy.js';

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export interface LineView {
  id: string;
  speaker: string;
  speakerName: string;
  text: string;
  voiced: boolean;
  kind: string;
}

export type StepView =
  | { kind: 'line'; line: LineView }
  | {
      kind: 'menu';
      id: string;
      prompt: LineView | null;
      pageSize: number;
      hub: boolean;
      location: string;
      back: boolean;
      options: { id: string; label: LineView; optional: boolean; to: string }[];
    }
  | {
      kind: 'minigame';
      id: string;
      game: string;
      skill: string;
      status: string;
      revision: number;
      view: Json;
    }
  | { kind: 'await'; action: AwaitAction; hotspot: string | null }
  | {
      kind: 'cutscene';
      id: string;
      /** E's `aegis-cutscene/1` document from the content pack. */
      document: Json;
      marker: string | null;
    }
  | { kind: 'end' };

export interface NotebookView {
  axes: { id: string; title: LineView; values: { id: string; label: LineView }[] }[];
  marks: { axis: string; value: string; mark: string; source: string }[];
  suggestions: { axis: string; value: string; mark: string; line: LineView }[];
  clues: { id: string; title: LineView }[];
}

export interface RunView {
  pack: string;
  caseId: string;
  level: 1 | 2 | 3 | null;
  ended: boolean;
  scene: {
    id: string;
    location: string;
    cast: string[];
    presentation: string;
    /** Prop keys for stage-direction actions (U10). */
    props: Record<string, string>;
  };
  /**
   * Background asset for this moment: the latest `dir.background` at or before the cursor in this
   * scene, else `scene.background`, else null (the location's default).
   */
  background: string | null;
  /** Stage directions since the last blocking step: stable ID and editorial text (presentation cues). */
  stage: { id: string; text: string; actions: readonly StageAction[] }[];
  queue: { line: LineView; source: QueueSource; remaining: number } | null;
  step: StepView | null;
  notebook: NotebookView | null;
  hints: {
    klubok: { available: boolean; remaining: number | null };
    shell: { available: boolean };
  };
  /** «Приглашу на разговор» / «Сказать догадку»: offered at hubs once available. */
  version: { button: LineView; available: boolean } | null;
  help: 'suggest' | 'point' | null;
  versionAttempts: number;
}

export interface PackView {
  id: string;
  kind: string;
  caseId: string;
  level: 1 | 2 | 3 | null;
  title: LineView | null;
  unlocked: boolean;
  completed: boolean;
}

export interface GameView {
  avatar: Avatar;
  rank: string;
  buttons: number;
  hearts: number;
  lamp: boolean;
  skills: string[];
  rewards: { id: string; kind: string; label: LineView }[];
  decor: { item: string; slot: string }[];
  facts: { id: string; line: LineView }[];
  glossary: { id: string; word: string; definition: LineView }[];
  /** «Настоящее дело» cards (Q25) of completed packs; optional, never blocking. */
  activities: {
    id: string;
    title: LineView;
    steps: { line: LineView; adultOnly: boolean }[];
    safety: LineView[];
    allergens: string[];
  }[];
  packs: PackView[];
  run: RunView | null;
  /** D12 rank from the cozy pack (Stage 2), else null (the UI falls back to `rank`). */
  rankLine: LineView | null;
  /** A reached rank not yet announced: shown once in the office. */
  newRank: { id: string; label: LineView; message: LineView[] } | null;
  /** Notebook pages unlocked so far (T26). */
  notebookPages: NotebookPageView[];
  /** The child's own light signal (D22). */
  signal: ('dot' | 'dash')[] | null;
  pattern: string | null;
  cozy: CozyView | null;
}

export type NotebookPageView =
  | { id: string; kind: 'cipher-poster'; title: LineView; table: CipherCellView[] }
  | { id: string; kind: 'secret-notes' | 'symbol-cards'; title: LineView };

export interface CipherCellView {
  id: string;
  letter: string;
  colour: string;
  holes: number;
  shape: string;
  label: LineView;
}

export interface CozyView {
  /** A line playing in the office (tea story, shop reply), with how many follow. */
  office: { line: LineView; remaining: number } | null;
  intro: LineView[];
  shop: {
    id: string;
    kind: 'hat' | 'scarf-pattern' | 'decor';
    label: LineView;
    asset: string;
    price: { currency: 'buttons' | 'hearts'; amount: number };
    onSale: boolean;
    owned: boolean;
    affordable: boolean;
    worn: boolean;
    placed: string | null;
  }[];
  residents: { speaker: string; name: string; price: number; affordable: boolean; told: number }[];
  decorSlots: { id: string; label: LineView }[];
}

export function substituteName(text: string, name: string): string {
  return text.replaceAll('{имя}', name);
}

function makeLine(index: PackIndex, shared: PackIndex | undefined, id: string, name: string) {
  const line = lineOf(index, id, shared);
  const speaker =
    index.pack.speakers.find((s) => s.id === line.speaker) ??
    shared?.pack.speakers.find((s) => s.id === line.speaker);
  return {
    id: line.id,
    speaker: line.speaker,
    speakerName: speaker?.name ?? '',
    text: substituteName(line.text, name),
    voiced: line.voiced,
    kind: line.kind,
  } satisfies LineView;
}

export function projectProfile(
  state: ProfileState,
  rules: GameRules,
  contentIndex: ContentIndex,
): GameView {
  const name = state.avatar.name;
  const shared = rules.shared(contentIndex);
  const packs = contentIndex.packs.map((ref) => rules.library.get(ref));
  const findLine = (id: string): LineView => {
    for (const index of [shared, ...packs])
      if (index?.lines.has(id)) return makeLine(index, shared, id, name);
    throw new Error(`Unknown line ${id}`);
  };
  const allPacks = packs.map((p) => p.pack);
  const findIn = <T extends { id: string }>(
    pick: (pack: FluffyPack) => readonly T[],
    id: string,
  ): T | undefined => allPacks.flatMap((pack) => pick(pack)).find((item) => item.id === id);
  return {
    avatar: { ...state.avatar },
    rank: rankOf(state),
    buttons: state.buttons,
    hearts: state.hearts,
    lamp: state.lamp,
    skills: [...state.skills],
    rewards: state.rewards.flatMap((id) => {
      const reward = findIn((p) => p.rewards, id);
      return reward ? [{ id, kind: reward.kind, label: findLine(reward.label) }] : [];
    }),
    decor: state.decor.map((d) => ({ ...d })),
    facts: state.facts.flatMap((id) => {
      const fact = findIn((p) => p.facts, id);
      return fact ? [{ id, line: findLine(fact.line) }] : [];
    }),
    glossary: state.glossary.flatMap((id) => {
      const entry = findIn((p) => p.glossary, id);
      return entry ? [{ id, word: entry.word, definition: findLine(entry.definition) }] : [];
    }),
    activities: [
      ...new Map(
        packs
          .filter((p) => state.completed.includes(p.pack.id))
          .flatMap((p) => p.pack.activities)
          .map((a) => [
            a.id,
            {
              id: a.id,
              title: findLine(a.title),
              steps: a.steps.map((step) => ({
                line: findLine(step.line),
                adultOnly: step.adultOnly,
              })),
              safety: a.safety.map(findLine),
              allergens: [...a.allergens],
            },
          ]),
      ).values(),
    ],
    packs: packs
      .filter((p) => p.pack.id !== SHARED_PACK)
      .map((p) => {
        const { caseId, level } = caseOfPack(p.pack.id);
        return {
          id: p.pack.id,
          kind: p.pack.kind,
          caseId,
          level,
          title: p.pack.title ? makeLine(p, shared, p.pack.title, name) : null,
          unlocked: isUnlocked(state, p.pack.id, contentIndex),
          completed: state.completed.includes(p.pack.id),
        };
      }),
    run: state.run ? projectRun(state, rules, contentIndex) : null,
    ...projectStage2(state, rules, contentIndex, findLine),
  };
}

function projectStage2(
  state: ProfileState,
  rules: GameRules,
  contentIndex: ContentIndex,
  findLine: (id: string) => LineView,
): Pick<GameView, 'rankLine' | 'newRank' | 'notebookPages' | 'signal' | 'pattern' | 'cozy'> {
  const packs = contentIndex.packs.map((ref) => rules.library.get(ref).pack);
  const cozyPack = rules.cozy(contentIndex)?.pack;
  const cozy = cozyPack?.cozy ?? null;
  const rank = rankFor(state, cozy);
  const fresh = newRank(state, cozy);
  const pages = new Map<string, NotebookPageView>();
  for (const pack of packs)
    for (const page of pack.notebookPages ?? []) {
      if (pages.has(page.id) || !state.rewards.includes(page.unlock)) continue;
      const title = findLine(page.title);
      if (page.kind === 'cipher-poster') {
        const config = pack.minigames.find((m) => m.id === page.cipher)?.config;
        const table = config?.kind === 'cipher' ? config.table : [];
        pages.set(page.id, {
          id: page.id,
          kind: 'cipher-poster',
          title,
          table: table.map((g) => ({ ...g, label: findLine(g.label) })),
        });
      } else pages.set(page.id, { id: page.id, kind: page.kind, title });
    }
  const speakers = packs.flatMap((p) => p.speakers);
  return {
    rankLine: rank ? findLine(rank.label) : null,
    newRank: fresh
      ? { id: fresh.id, label: findLine(fresh.label), message: fresh.message.map(findLine) }
      : null,
    notebookPages: [...pages.values()],
    signal: state.signal ? [...state.signal] : null,
    pattern: state.pattern,
    cozy: cozy
      ? {
          office: state.office.length
            ? { line: findLine(state.office[0]!), remaining: state.office.length - 1 }
            : null,
          intro: cozy.lines.intro.map(findLine),
          shop: cozy.shop.map((item) => ({
            id: item.id,
            kind: item.kind,
            label: findLine(item.label),
            asset: item.asset,
            price: { ...item.price },
            onSale: isOnSale(state, item),
            owned: state.owned.includes(item.id),
            affordable: canAfford(state, item),
            worn: state.avatar.hat === item.id || state.pattern === item.id,
            placed: state.decor.find((d) => d.item === item.id)?.slot ?? null,
          })),
          residents: residentsAvailable(state, cozy).map((r) => ({
            speaker: r.speaker,
            name: speakers.find((s) => s.id === r.speaker)?.name ?? r.speaker,
            price: r.teaPrice,
            affordable: state.hearts >= r.teaPrice,
            told: state.teas.find((t) => t.speaker === r.speaker)?.told ?? 0,
          })),
          decorSlots: cozy.decorSlots.map((s) => ({ id: s.id, label: findLine(s.label) })),
        }
      : null,
  };
}

function projectRun(state: ProfileState, rules: GameRules, contentIndex: ContentIndex): RunView {
  const run = state.run!;
  const index = rules.pack(contentIndex, run.pack);
  const shared = rules.shared(contentIndex);
  const name = state.avatar.name;
  const line = (id: string) => makeLine(index, shared, id, name);
  const scene = sceneOf(index, run.scene);
  const step = currentStep(index, run);
  let stepView: StepView | null = null;
  if (step) {
    switch (step.t) {
      case 'line':
        stepView = { kind: 'line', line: line(step.line) };
        break;
      case 'menu':
        stepView = {
          kind: 'menu',
          id: step.id,
          prompt: step.prompt ? line(step.prompt) : null,
          pageSize: Math.min(3, step.pageSize),
          hub: scene.presentation === 'hub',
          back: step.back !== null,
          location: scene.location,
          options: visibleOptions(step, run, state).map((o) => ({
            id: o.id,
            label: line(o.label),
            optional: o.optional,
            to: o.to,
          })),
        };
        break;
      case 'minigame': {
        const game = minigameOf(index, step.minigame);
        const instance = run.minigame;
        if (instance) {
          const projected = projectMinigame(
            minigameDefinition(game, index.pack.revision),
            instance,
            rules.registry,
          );
          stepView = {
            kind: 'minigame',
            id: game.id,
            game: game.config.kind,
            skill: game.skill,
            status: projected.status,
            revision: projected.revision,
            view: projected.view as Json,
          };
        }
        break;
      }
      case 'await':
        stepView = { kind: 'await', action: step.action, hotspot: step.hotspot ?? null };
        break;
      case 'cutscene': {
        const entry = (index.pack.cutscenes as unknown as { id: string; document?: Json }[]).find(
          (c) => c.id === step.cutscene,
        );
        if (!entry?.document) throw new Error(`Cutscene ${step.cutscene} has no document`);
        stepView = {
          kind: 'cutscene',
          id: step.cutscene,
          document: entry.document,
          marker: run.cutsceneMarker,
        };
        break;
      }
      case 'end':
        stepView = { kind: 'end' };
        break;
      default:
        stepView = null;
    }
  }
  const logic = index.pack.logic;
  const notebook: NotebookView | null = logic
    ? {
        axes: logic.axes.map((axis) => ({
          id: axis.id,
          title: line(axis.title),
          values: axis.values.map((v) => ({ id: v.id, label: line(v.label) })),
        })),
        marks: (run.notebook?.marks ?? []).map((m) => ({
          axis: m.axis,
          value: m.value,
          mark: m.mark,
          source: m.source,
        })),
        suggestions: run.suggestions.map((s) => ({
          axis: s.axis,
          value: s.value,
          mark: s.mark,
          line: line(s.line),
        })),
        clues: logic.clues
          .filter((c) => run.clues.includes(c.id))
          .map((c) => ({ id: c.id, title: line(c.title) })),
      }
    : null;
  const hints = index.pack.hints;
  const head = run.queue[0];
  const { caseId, level } = caseOfPack(run.pack);
  return {
    pack: run.pack,
    caseId,
    level,
    ended: run.ended,
    scene: {
      id: scene.id,
      location: scene.location,
      cast: [...scene.cast],
      presentation: scene.presentation,
      props: { ...(scene.props ?? {}) },
    },
    background: backgroundAt(scene, run.cursor),
    stage: run.stage.map((id) => ({
      id,
      text: dirText(index, id),
      actions: dirActions(index, id),
    })),
    queue: head
      ? { line: line(head.line), source: head.source, remaining: run.queue.length }
      : null,
    step: stepView,
    notebook,
    hints: {
      klubok: {
        available: Boolean(hints?.klubok),
        remaining: hints?.klubok.allowance == null ? null : hints.klubok.allowance - run.klubokUsed,
      },
      shell: { available: Boolean(hints?.shell) },
    },
    version: logic
      ? {
          button: line(logic.version.button),
          available:
            step?.t === 'menu' &&
            !run.queue.length &&
            evaluate(logic.version.available, run, state),
        }
      : null,
    help: index.pack.notebookHelp?.mode ?? null,
    versionAttempts: run.versionAttempts,
  };
}

type DirStep = Extract<Step, { t: 'dir' }>;
const dirSteps = new WeakMap<object, Map<string, DirStep>>();
function dirStep(index: PackIndex, id: string): DirStep | undefined {
  let map = dirSteps.get(index.pack);
  if (!map) {
    const found = new Map<string, DirStep>();
    const walk = (steps: readonly Step[]) => {
      for (const step of steps) {
        if (step.t === 'dir') found.set(step.id, step);
        if (step.t === 'if') walk([...step.then, ...step.else]);
        if (step.t === 'skill') walk([...step.first, ...step.known]);
      }
    };
    for (const scene of index.pack.scenes) walk(scene.steps);
    dirSteps.set(index.pack, found);
    map = found;
  }
  return map.get(id);
}
function dirText(index: PackIndex, id: string): string {
  return dirStep(index, id)?.text ?? '';
}
function dirActions(index: PackIndex, id: string): readonly StageAction[] {
  return dirStep(index, id)?.actions ?? [];
}

/**
 * The latest `dir.background` at or before the cursor, else `scene.background`. C's validator keeps
 * background directions at the scene's top level. Derived from the position alone, so a restored
 * or restarted scene shows the same stage.
 */
function backgroundAt(scene: Scene, cursor: readonly { i: number }[]): string | null {
  let found = scene.background ?? null;
  for (const step of scene.steps.slice(0, (cursor[0]?.i ?? -1) + 1))
    if (step.t === 'dir' && step.background) found = step.background;
  return found;
}
