// Step interpreter: walks C's scene step language deterministically over a RunState.
import type { ProfileState, RunState, CursorSegment } from './state.js';
import type { AwaitAction, Cond, PackIndex, Step, Scene, MenuOption } from './content.js';
import { sceneOf } from './content.js';

export type { AwaitAction };
export type GameStep = Step;

export interface Effects {
  learnSkill(skill: string): void;
  grantReward(rewardId: string): void;
  reachEnd(): void;
}

const MAX_STEPS = 10_000;

export function evaluate(cond: Cond | null, run: RunState, profile: ProfileState): boolean {
  if (cond === null) return true;
  if ('clue' in cond) return run.clues.includes(cond.clue);
  if ('visited' in cond) return run.visited.includes(cond.visited);
  if ('flag' in cond) return run.flags.includes(cond.flag);
  if ('skill' in cond) return profile.skills.includes(cond.skill);
  if ('notebookConfirmed' in cond)
    return (run.notebook?.marks ?? []).some(
      (m) => m.axis === cond.notebookConfirmed && m.mark === 'confirmed',
    );
  if ('all' in cond) return cond.all.every((c) => evaluate(c, run, profile));
  if ('any' in cond) return cond.any.some((c) => evaluate(c, run, profile));
  if ('not' in cond) return !evaluate(cond.not, run, profile);
  throw new Error('Unknown condition');
}

function branchOf(step: GameStep, b: CursorSegment['b']): readonly GameStep[] {
  if (step.t === 'if' && (b === 'then' || b === 'else')) return step[b] as GameStep[];
  if (step.t === 'skill' && (b === 'first' || b === 'known')) return step[b] as GameStep[];
  throw new Error('Cursor branch does not match its step');
}

/** The list that contains the cursor's last segment, plus its parent chain. */
function listAt(scene: Scene, cursor: readonly CursorSegment[]): readonly GameStep[] {
  let list = scene.steps as readonly GameStep[];
  for (let depth = 0; depth < cursor.length - 1; depth++) {
    const segment = cursor[depth]!;
    const step = list[segment.i];
    if (!step) throw new Error('Cursor points outside its scene');
    list = branchOf(step, segment.b);
  }
  return list;
}

export function currentStep(index: PackIndex, run: RunState): GameStep | null {
  const scene = sceneOf(index, run.scene);
  const last = run.cursor[run.cursor.length - 1];
  if (!last) return null;
  return listAt(scene, run.cursor)[last.i] ?? null;
}

/** Ancestor `skill` steps whose branch is entered at the cursor. */
function exitBlock(index: PackIndex, run: RunState, effects: Effects): void {
  const scene = sceneOf(index, run.scene);
  run.cursor.pop();
  const parent = run.cursor[run.cursor.length - 1];
  if (!parent) throw new Error(`Scene ${scene.id} ended without goto or end`);
  const step = listAt(scene, run.cursor)[parent.i];
  if (step?.t === 'skill') effects.learnSkill(step.skill);
  parent.b = null;
  parent.i++;
}

export function enter(run: RunState, scene: string): void {
  run.scene = scene;
  run.cursor = [{ i: 0, b: null }];
  run.stage = [];
  if (!run.visited.includes(scene)) run.visited.push(scene);
}

export function visibleOptions(
  step: Extract<GameStep, { t: 'menu' }>,
  run: RunState,
  profile: ProfileState,
): MenuOption[] {
  return step.options.filter(
    (option) =>
      evaluate(option.when, run, profile) &&
      !(option.hideWhen && evaluate(option.hideWhen, run, profile)),
  );
}

/**
 * Executes automatic steps until a blocking step (line, menu, minigame, version, await, end).
 * Stage directions passed on the way are collected in `run.stage`.
 */
export function settle(index: PackIndex, run: RunState, profile: ProfileState, effects: Effects) {
  for (let count = 0; count < MAX_STEPS; count++) {
    const scene = sceneOf(index, run.scene);
    const list = listAt(scene, run.cursor);
    const segment = run.cursor[run.cursor.length - 1]!;
    const step = list[segment.i];
    if (!step) {
      exitBlock(index, run, effects);
      continue;
    }
    switch (step.t) {
      case 'line':
      case 'menu':
      case 'await':
        return;
      case 'minigame':
        if (run.flags.includes(`minigame:${step.minigame}`) && run.minigame === null) {
          segment.i++;
          continue;
        }
        return;
      case 'end':
        if (!run.ended) {
          run.ended = true;
          effects.reachEnd();
        }
        return;
      case 'dir':
        run.stage.push(step.id);
        segment.i++;
        continue;
      case 'clue':
        if (!run.clues.includes(step.clue)) run.clues.push(step.clue);
        segment.i++;
        continue;
      case 'set':
        if (!run.flags.includes(step.flag)) run.flags.push(step.flag);
        segment.i++;
        continue;
      case 'reward':
        effects.grantReward(step.reward);
        segment.i++;
        continue;
      case 'if':
        segment.b = evaluate(step.when, run, profile) ? 'then' : 'else';
        run.cursor.push({ i: 0, b: null });
        continue;
      case 'skill':
        segment.b = profile.skills.includes(step.skill) ? 'known' : 'first';
        run.cursor.push({ i: 0, b: null });
        continue;
      case 'goto':
        enter(run, step.scene);
        continue;
      default:
        throw new Error(`Unknown step ${(step as { t: string }).t}`);
    }
  }
  throw new Error('Automatic step budget exceeded');
}

/** Moves past the current blocking step and settles again. */
export function proceed(index: PackIndex, run: RunState, profile: ProfileState, effects: Effects) {
  const segment = run.cursor[run.cursor.length - 1];
  if (!segment) throw new Error('No cursor');
  segment.i++;
  run.stage = [];
  settle(index, run, profile, effects);
}

export function startRun(index: PackIndex, profile: ProfileState, effects: Effects): RunState {
  const pack = index.pack;
  if (!pack.start) throw new Error(`Pack ${pack.id} has no start scene`);
  const run: RunState = {
    pack: pack.id,
    packRevision: pack.revision,
    scene: pack.start,
    cursor: [{ i: 0, b: null }],
    queue: [],
    visited: [pack.start],
    flags: [],
    clues: [],
    notebook: null,
    klubokUsed: 0,
    hintsUsed: [],
    minigame: null,
    minigameCount: 0,
    suggestions: [],
    versionAttempts: 0,
    stage: [],
    ended: false,
  };
  settle(index, run, profile, effects);
  return run;
}

/** Restart position after a content update replaced the run's pack revision (Q43). */
export function rebaseRun(index: PackIndex, run: RunState): RunState {
  const scene = index.scenes.has(run.scene) ? run.scene : index.pack.start;
  if (!scene) throw new Error('Pack has no start scene');
  return {
    ...run,
    packRevision: index.pack.revision,
    scene,
    cursor: [{ i: 0, b: null }],
    queue: [],
    minigame: null,
    suggestions: [],
    stage: [],
    ended: false,
  };
}

export function selectStep<T extends GameStep['t']>(
  step: GameStep | null,
  kind: T,
): Extract<GameStep, { t: T }> {
  if (!step || step.t !== kind) throw new Error(`Expected a ${kind} step`);
  return step as Extract<GameStep, { t: T }>;
}
