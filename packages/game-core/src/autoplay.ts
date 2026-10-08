// Deterministic content-driven player used for scenario traces (tests, QA) — never shipped UI logic.
import type { RuntimeHost } from '@aegis/runtime';
import type { ContentIndex, MinigameConfig } from './content.js';
import { minigameOf } from './content.js';
import type { GameAction, GameRules } from './rules.js';
import type { ProfileState } from './state.js';
import type { GameView } from './view.js';

export interface AutoplayPolicy {
  /** Try every wrong option of choice minigames before the right one. */
  wrongFirst?: boolean;
  /** Before the right version, submit one wrong version per wrong value (column order). */
  wrongVersions?: boolean;
  /** Ask the klubok and the shell at every hub until they only review. */
  exhaustHints?: boolean;
  /** Ask notebook help at every hub and accept every suggestion. */
  useHelp?: boolean;
  /** Called after every accepted action (e.g. to save/restore-check). */
  after?: (action: GameAction, view: GameView) => Promise<void> | void;
  maxActions?: number;
  /** Stop (successfully) as soon as this holds. */
  stopWhen?: (view: GameView) => boolean;
}

type Host = RuntimeHost<ProfileState, GameAction, GameView, ContentIndex>;

export interface AutoplayResult {
  actions: GameAction[];
  view: GameView;
}

export async function autoplay(
  host: Host,
  rules: GameRules,
  pack: string,
  policy: AutoplayPolicy = {},
): Promise<AutoplayResult> {
  const actions: GameAction[] = [];
  const triedVersions = new Set<string>();
  const hintedAt = new Set<string>();
  const helpedAt = new Set<string>();
  const send = async (action: GameAction) => {
    const outcome = await host.dispatch(action);
    if (!outcome.ok)
      throw new Error(
        `Autoplay rejected ${JSON.stringify(action)}: ${JSON.stringify(outcome.error)}`,
      );
    actions.push(action);
    await policy.after?.(action, host.getView());
  };
  if (!host.getView().run || host.getView().run?.pack !== pack) await send({ type: 'start', pack });
  const max = policy.maxActions ?? 5000;
  while (actions.length < max) {
    const view = host.getView();
    if (policy.stopWhen?.(view)) return { actions, view };
    const run = view.run;
    if (!run) throw new Error('Run disappeared');
    if (run.queue) {
      await send({ type: 'next' });
      continue;
    }
    const step = run.step;
    if (!step) throw new Error('No current step');
    if (step.kind === 'end') return { actions, view };
    const read = host.inspect();
    const state = read.state as ProfileState;
    const contentIndex = read.content.data as ContentIndex;
    const index = rules.pack(contentIndex, run.pack);
    switch (step.kind) {
      case 'line':
        await send({ type: 'next' });
        break;
      case 'cutscene':
        await send({ type: 'cutscene', outcome: 'completed' });
        break;
      case 'await':
        if (step.action === 'office.place') {
          const decor = view.rewards.filter((r) => r.kind === 'decor');
          const item = decor.find((r) => !view.decor.some((d) => d.item === r.id)) ?? decor[0];
          if (!item) throw new Error('Nothing to place in the office');
          await send({ type: 'decor', item: item.id, slot: 'shelf' });
        } else await send(awaitAction(step.action));
        break;
      case 'menu': {
        const at = `${run.scene.id}:${state.run!.clues.length}`;
        if (policy.exhaustHints && !hintedAt.has(at)) {
          hintedAt.add(at);
          for (const channel of ['klubok', 'shell'] as const) {
            if (!run.hints[channel].available) continue;
            for (let i = 0; i < 8; i++) {
              await send({ type: 'hint', channel });
              const line = host.getView().run?.queue?.line.id;
              await send({ type: 'next' });
              const review = index.pack.hints?.[channel];
              if (line === review?.review || line === review?.exhausted) break;
              if (channel === 'shell') break;
            }
          }
          break;
        }
        if (policy.useHelp && run.help && !helpedAt.has(at)) {
          helpedAt.add(at);
          await send({ type: 'help' });
          while (host.getView().run?.queue) await send({ type: 'next' });
          for (const s of host.getView().run?.notebook?.suggestions ?? [])
            await send({ type: 'accept', axis: s.axis, value: s.value });
          break;
        }
        const unvisited = step.options.find((o) => !state.run!.visited.includes(o.to));
        if (run.version?.available && !unvisited) {
          const logic = index.pack.logic!;
          const intended = { ...logic.intended } as Record<string, string>;
          let selection = intended;
          if (policy.wrongVersions) {
            for (const axis of logic.axes) {
              const wrong = axis.values.find(
                (v) => v.id !== intended[axis.id] && !triedVersions.has(`${axis.id}:${v.id}`),
              );
              if (wrong) {
                triedVersions.add(`${axis.id}:${wrong.id}`);
                selection = { ...intended, [axis.id]: wrong.id };
                break;
              }
            }
          }
          await send({ type: 'version', selection });
          break;
        }
        const visited = state.run!.visited;
        const option = step.options.find((o) => !visited.includes(o.to)) ?? step.options[0];
        if (!option) throw new Error(`Menu ${step.id} has no options`);
        await send({ type: 'choose', option: option.id });
        break;
      }
      case 'minigame': {
        const game = minigameOf(index, step.id);
        await send({ type: 'move', value: solveMove(game.config, step.view, policy) });
        break;
      }
    }
  }
  throw new Error(`Autoplay exceeded ${max} actions`);
}

function awaitAction(action: string): GameAction {
  switch (action) {
    case 'avatar.species':
      return { type: 'avatar.species', value: 'kitten' };
    case 'avatar.name':
      return { type: 'avatar.name', value: 'Ася' };
    case 'avatar.scarf':
      return { type: 'avatar.scarf', value: 'honey' };
    case 'lamp.on':
      return { type: 'lamp', on: true };
    case 'lamp.off':
      return { type: 'lamp', on: false };
    default:
      return { type: 'await', action: action as never };
  }
}

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

const bakerTried = new Set<string>();

function solveMove(config: MinigameConfig, view: unknown, policy: AutoplayPolicy): Json {
  const v = view as Record<string, unknown>;
  switch (config.kind) {
    case 'magnifier': {
      const targets = v.targets as { id: string; found: boolean }[];
      const next = targets.find((t) => !t.found)!;
      return { target: next.id };
    }
    case 'cocoa': {
      const round = config.rounds[v.round as number]!;
      const tried = (v.options as { id: string; tried: boolean }[]).filter((o) => o.tried);
      const wrong = round.options.find((o) => !o.correct && !tried.some((t) => t.id === o.id));
      return {
        option: (policy.wrongFirst && wrong ? wrong : round.options.find((o) => o.correct)!).id,
      };
    }
    case 'tracks': {
      const steps = [...config.steps, ...(config.question ? [config.question] : [])];
      const step = steps[v.step as number]!;
      const off = (v.options as { id: string; off: boolean }[]).filter((o) => o.off);
      const wrong = step.options.find((o) => !o.correct && !off.some((t) => t.id === o.id));
      return {
        option: (policy.wrongFirst && wrong ? wrong : step.options.find((o) => o.correct)!).id,
      };
    }
    case 'timeline': {
      const slots = v.slots as (string | null)[];
      const empty = slots.findIndex((s, i) => s !== config.solution[i]);
      if (empty === -1) return { submit: true };
      return { place: config.solution[empty]!, index: empty };
    }
    case 'scent-pairs': {
      if (v.question) {
        const off = (v.options as { id: string; off: boolean }[]).filter((o) => o.off);
        const options = config.question!.options;
        const wrong = options.find((o) => !o.correct && !off.some((t) => t.id === o.id));
        return {
          option: (policy.wrongFirst && wrong ? wrong : options.find((o) => o.correct)!).id,
        };
      }
      const field = config.fields[v.field as number]!;
      const cards = v.cards as { id: string; open: boolean; matched: boolean }[];
      const open = cards.filter((c) => c.open);
      if (open.length === 1) {
        const first = field.cards.find((c) => c.id === open[0]!.id)!;
        return { card: field.cards.find((c) => c.pair === first.pair && c.id !== first.id)!.id };
      }
      return { card: cards.find((c) => !c.matched)!.id };
    }
    case 'baker': {
      const step = config.steps[v.step as number]!;
      const remaining = (v.target as number) - (v.poured as number);
      if (policy.wrongFirst && (v.poured as number) === 0) {
        const wrong =
          config.measures.find((m) => m.units > remaining) ??
          config.measures.find((m) => !step.ideal.includes(m.id) && m.units < remaining);
        if (wrong && !bakerTried.has(step.id)) {
          bakerTried.add(step.id);
          return { measure: wrong.id };
        }
      }
      const measure = config.measures
        .filter((m) => step.ideal.includes(m.id) && m.units <= remaining)
        .sort((a, b) => b.units - a.units)[0]!;
      return { measure: measure.id };
    }
    default:
      throw new Error(`Autoplay cannot play ${config.kind}`);
  }
}
