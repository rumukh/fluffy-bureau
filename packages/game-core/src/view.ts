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
} from './content.js';
import { currentStep, evaluate, visibleOptions, type AwaitAction } from './interpreter.js';
import { minigameDefinition } from './minigames.js';
import { rankOf, type Avatar, type ProfileState, type QueueSource } from './state.js';
import { isUnlocked, SHARED_PACK, type GameRules } from './rules.js';

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
  | { kind: 'await'; action: AwaitAction }
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
  scene: { id: string; location: string; cast: string[]; presentation: string };
  /**
   * Background asset for this moment: the latest `dir.background` at or before the cursor in this
   * scene, else `scene.background`, else null (the location's default).
   */
  background: string | null;
  /** Stage directions since the last blocking step: stable ID and editorial text (presentation cues). */
  stage: { id: string; text: string }[];
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
        stepView = { kind: 'await', action: step.action };
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
    },
    background: backgroundAt(scene, run.cursor),
    stage: run.stage.map((id) => ({ id, text: dirText(index, id) })),
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

const dirTexts = new WeakMap<object, Map<string, string>>();
function dirText(index: PackIndex, id: string): string {
  let map = dirTexts.get(index.pack);
  if (!map) {
    map = new Map();
    const walk = (steps: readonly unknown[]) => {
      for (const step of steps as { t: string; id?: string; text?: string }[]) {
        if (step.t === 'dir' && step.id) map!.set(step.id, step.text ?? '');
        for (const key of ['then', 'else', 'first', 'known'] as const) {
          const nested = (step as Record<string, unknown>)[key];
          if (Array.isArray(nested)) walk(nested);
        }
      }
    };
    for (const scene of index.pack.scenes) walk(scene.steps);
    dirTexts.set(index.pack, map);
  }
  return map.get(id) ?? '';
}

type StagedStep = { t: string; background?: unknown; [key: string]: unknown };

/** Latest `dir.background` on the path to the cursor (restart-safe: derived from position only). */
function backgroundAt(
  scene: { steps: readonly unknown[]; background?: unknown },
  cursor: readonly { i: number; b: string | null }[],
): string | null {
  let found: string | null = typeof scene.background === 'string' ? scene.background : null;
  let list = scene.steps as readonly StagedStep[];
  for (const segment of cursor) {
    for (let i = 0; i <= segment.i && i < list.length; i++) {
      const step = list[i]!;
      if (step.t === 'dir' && typeof step.background === 'string') found = step.background;
    }
    const current = list[segment.i];
    if (!current || !segment.b) break;
    const branch = current[segment.b];
    if (!Array.isArray(branch)) break;
    list = branch as StagedStep[];
  }
  return found;
}
