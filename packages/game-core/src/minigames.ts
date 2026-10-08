// Fluffy minigame kinds registered as custom @aegis/narrative minigame adapters.
// Every adapter is deterministic and keeps the reply lines of the latest move in `last`,
// which the interpreter moves into the dialogue queue.
import {
  createMinigameRegistry,
  type MinigameAdapter,
  type MinigameDefinition,
  type MinigameRegistry,
} from '@aegis/narrative';
import type { Minigame, MinigameConfig } from './content.js';

type Config<K extends MinigameConfig['kind']> = Extract<MinigameConfig, { kind: K }>;
type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

function record(value: unknown, what: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new Error(`Invalid ${what}`);
  return value as Record<string, unknown>;
}
function strings(value: unknown, what: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string'))
    throw new Error(`Invalid ${what}`);
  return [...(value as string[])];
}
function int(value: unknown, what: string, min = 0, max = 10_000): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max)
    throw new Error(`Invalid ${what}`);
  return value;
}
function configOf<K extends MinigameConfig['kind']>(kind: K) {
  return (value: unknown): Config<K> => {
    const config = record(value, `${kind} config`);
    if (config.kind !== kind) throw new Error(`Expected ${kind} config`);
    return structuredClone(config) as unknown as Config<K>;
  };
}

// ---------------------------------------------------------------- «Лупа»
interface MagnifierState {
  found: string[];
  misses: number;
  last: string[];
}
type MagnifierAction = { target: string } | { miss: true };
const magnifier: MinigameAdapter<Config<'magnifier'>, MagnifierState, MagnifierAction, Json> = {
  kind: 'magnifier',
  schema: 1,
  config: configOf('magnifier'),
  state(value, config) {
    const s = record(value, 'magnifier state');
    const found = strings(s.found, 'found');
    if (found.some((id) => !config.targets.some((t) => t.id === id)))
      throw new Error('Unknown found target');
    return { found, misses: int(s.misses, 'misses'), last: strings(s.last, 'last') };
  },
  action(value, config) {
    const a = record(value, 'magnifier move');
    if (a.miss === true) return { miss: true };
    if (typeof a.target === 'string' && config.targets.some((t) => t.id === a.target))
      return { target: a.target };
    throw new Error('Unknown magnifier target');
  },
  initial: () => ({ found: [], misses: 0, last: [] }),
  reduce(config, state, action) {
    if ('miss' in action) return { ...state, misses: state.misses + 1, last: [] };
    if (state.found.includes(action.target)) return { ...state, last: [] };
    const target = config.targets.find((t) => t.id === action.target)!;
    const first = state.found.length === 0 ? config.afterFirst : [];
    return { found: [...state.found, target.id], misses: 0, last: [...target.reply, ...first] };
  },
  project(config, state) {
    const remaining = config.targets.filter((t) => t.required && !state.found.includes(t.id));
    return {
      kind: 'magnifier',
      targets: config.targets.map((t) => ({
        id: t.id,
        label: t.label,
        found: state.found.includes(t.id),
      })),
      assist:
        config.assistAfterMisses > 0 && state.misses >= config.assistAfterMisses
          ? (remaining[0]?.id ?? null)
          : null,
      remaining: remaining.length,
    };
  },
  completed: (config, state) =>
    config.targets.every((t) => !t.required || state.found.includes(t.id)),
};

// ---------------------------------------------------------------- «Чашка какао»
interface CocoaState {
  round: number;
  tried: string[];
  last: string[];
}
const cocoa: MinigameAdapter<Config<'cocoa'>, CocoaState, { option: string }, Json> = {
  kind: 'cocoa',
  schema: 1,
  config: configOf('cocoa'),
  state(value, config) {
    const s = record(value, 'cocoa state');
    return {
      round: int(s.round, 'round', 0, config.rounds.length),
      tried: strings(s.tried, 'tried'),
      last: strings(s.last, 'last'),
    };
  },
  action(value) {
    const a = record(value, 'cocoa move');
    if (typeof a.option !== 'string') throw new Error('Missing option');
    return { option: a.option };
  },
  initial: () => ({ round: 0, tried: [], last: [] }),
  reduce(config, state, action) {
    const round = config.rounds[state.round];
    const option = round?.options.find((o) => o.id === action.option);
    if (!round || !option) throw new Error('Option is not in the current round');
    if (option.correct) return { round: state.round + 1, tried: [], last: [...option.reply] };
    return {
      round: state.round,
      tried: state.tried.includes(option.id) ? state.tried : [...state.tried, option.id],
      last: [...option.reply, ...round.retry],
    };
  },
  project(config, state) {
    const round = config.rounds[state.round];
    return {
      kind: 'cocoa',
      round: state.round,
      rounds: config.rounds.length,
      options: (round?.options ?? []).map((o) => ({
        id: o.id,
        label: o.label,
        tried: state.tried.includes(o.id),
      })),
    };
  },
  completed: (config, state) => state.round >= config.rounds.length,
};

// ---------------------------------------------------------------- «Кто наследил?»
interface ChoiceStepsState {
  step: number;
  off: string[];
  last: string[];
}
interface ChoiceStep {
  id: string;
  prompt: string | null;
  options: { id: string; label: string; correct: boolean; reply: string[] }[];
}
function tracksSteps(config: Config<'tracks'>): ChoiceStep[] {
  return [
    ...config.steps,
    ...(config.question
      ? [{ id: 'question', prompt: config.question.prompt, options: config.question.options }]
      : []),
  ];
}
const tracks: MinigameAdapter<Config<'tracks'>, ChoiceStepsState, { option: string }, Json> = {
  kind: 'tracks',
  schema: 1,
  config: configOf('tracks'),
  state(value, config) {
    const s = record(value, 'tracks state');
    return {
      step: int(s.step, 'step', 0, tracksSteps(config).length),
      off: strings(s.off, 'off'),
      last: strings(s.last, 'last'),
    };
  },
  action(value) {
    const a = record(value, 'tracks move');
    if (typeof a.option !== 'string') throw new Error('Missing option');
    return { option: a.option };
  },
  initial: () => ({ step: 0, off: [], last: [] }),
  reduce(config, state, action) {
    const step = tracksSteps(config)[state.step];
    const option = step?.options.find((o) => o.id === action.option);
    if (!step || !option || state.off.includes(option.id))
      throw new Error('Option is not available');
    if (option.correct) return { step: state.step + 1, off: [], last: [...option.reply] };
    return { step: state.step, off: [...state.off, option.id], last: [...option.reply] };
  },
  project(config, state) {
    const steps = tracksSteps(config);
    const step = steps[state.step];
    return {
      kind: 'tracks',
      step: state.step,
      steps: steps.length,
      question: step?.id === 'question' && Boolean(config.question),
      prompt: step?.prompt ?? null,
      options: (step?.options ?? []).map((o) => ({
        id: o.id,
        label: o.label,
        off: state.off.includes(o.id),
      })),
    };
  },
  completed: (config, state) => state.step >= tracksSteps(config).length,
};

// ---------------------------------------------------------------- «Лента времени»
interface TimelineState {
  slots: (string | null)[];
  solved: boolean;
  last: string[];
}
type TimelineAction = { place: string; index: number } | { remove: number } | { submit: true };
const timeline: MinigameAdapter<Config<'timeline'>, TimelineState, TimelineAction, Json> = {
  kind: 'timeline',
  schema: 1,
  config: configOf('timeline'),
  state(value, config) {
    const s = record(value, 'timeline state');
    if (!Array.isArray(s.slots) || s.slots.length !== config.solution.length)
      throw new Error('Invalid slots');
    const slots = s.slots.map((item) => {
      if (item === null) return null;
      if (typeof item !== 'string' || !config.items.some((i) => i.id === item))
        throw new Error('Unknown timeline item');
      return item;
    });
    if (typeof s.solved !== 'boolean') throw new Error('Invalid solved');
    return { slots, solved: s.solved, last: strings(s.last, 'last') };
  },
  action(value, config) {
    const a = record(value, 'timeline move');
    if (a.submit === true) return { submit: true };
    if (typeof a.remove === 'number')
      return { remove: int(a.remove, 'slot', 0, config.solution.length - 1) };
    if (typeof a.place === 'string' && config.items.some((i) => i.id === a.place))
      return { place: a.place, index: int(a.index, 'slot', 0, config.solution.length - 1) };
    throw new Error('Invalid timeline move');
  },
  initial: (config) => ({ slots: config.solution.map(() => null), solved: false, last: [] }),
  reduce(config, state, action) {
    if (state.solved) throw new Error('Timeline already solved');
    if ('submit' in action) {
      if (state.slots.some((slot) => slot === null)) throw new Error('Timeline is not full');
      const correct = state.slots.every((slot, index) => slot === config.solution[index]);
      if (correct) return { ...state, solved: true, last: [] };
      return {
        slots: state.slots.map((slot, index) => (slot === config.solution[index] ? slot : null)),
        solved: false,
        last: [...config.wrong],
      };
    }
    if ('remove' in action) {
      const slots = [...state.slots];
      slots[action.remove] = null;
      return { ...state, slots, last: [] };
    }
    const slots = state.slots.map((slot) => (slot === action.place ? null : slot));
    slots[action.index] = action.place;
    return { ...state, slots, last: [] };
  },
  project(config, state) {
    return {
      kind: 'timeline',
      slots: state.slots,
      items: config.items.map((i) => ({
        id: i.id,
        time: i.time,
        label: i.label,
        placed: state.slots.includes(i.id),
      })),
      solved: state.solved,
    };
  },
  completed: (_config, state) => state.solved,
};

// ---------------------------------------------------------------- «Пары запахов»
interface ScentState {
  field: number;
  matched: string[];
  open: string[];
  /** Wrong answers of the closing question. */
  off: string[];
  done: boolean;
  last: string[];
}
type ScentAction = { card: string } | { clear: true } | { option: string };
const scentPairs: MinigameAdapter<Config<'scent-pairs'>, ScentState, ScentAction, Json> = {
  kind: 'scent-pairs',
  schema: 1,
  config: configOf('scent-pairs'),
  state(value, config) {
    const s = record(value, 'scent state');
    return {
      field: int(s.field, 'field', 0, config.fields.length),
      matched: strings(s.matched, 'matched'),
      open: strings(s.open, 'open'),
      off: strings(s.off, 'off'),
      done: s.done === true,
      last: strings(s.last, 'last'),
    };
  },
  action(value) {
    const a = record(value, 'scent move');
    if (a.clear === true) return { clear: true };
    if (typeof a.option === 'string') return { option: a.option };
    if (typeof a.card === 'string') return { card: a.card };
    throw new Error('Invalid scent move');
  },
  initial: () => ({ field: 0, matched: [], open: [], off: [], done: false, last: [] }),
  reduce(config, state, action) {
    if ('option' in action) {
      const question = config.question;
      if (state.field < config.fields.length || !question || state.done)
        throw new Error('No question now');
      const option = question.options.find((o) => o.id === action.option);
      if (!option || state.off.includes(option.id)) throw new Error('Option is not available');
      if (option.correct) return { ...state, done: true, last: [...option.reply] };
      return { ...state, off: [...state.off, option.id], last: [...option.reply] };
    }
    const field = config.fields[state.field];
    if (!field) throw new Error('All fields are done');
    if ('clear' in action) return { ...state, open: [], last: [] };
    const card = field.cards.find((c) => c.id === action.card);
    if (!card) throw new Error('Card is not in this field');
    const open = state.open.length >= 2 ? [] : [...state.open];
    if (state.matched.includes(card.id) || open.includes(card.id))
      return { ...state, open, last: [] };
    open.push(card.id);
    if (open.length < 2) return { ...state, open, last: [] };
    const [a, b] = open.map((id) => field.cards.find((c) => c.id === id)!);
    if (a!.pair !== b!.pair) return { ...state, open, last: [...config.mismatch] };
    const matched = [...state.matched, a!.id, b!.id];
    if (field.cards.every((c) => matched.includes(c.id)))
      return { ...state, field: state.field + 1, matched: [], open: [], last: [] };
    return { ...state, matched, open: [], last: [] };
  },
  project(config, state) {
    const field = config.fields[state.field];
    const asking = !field && Boolean(config.question) && !state.done;
    return {
      kind: 'scent-pairs',
      question: asking,
      prompt: asking ? config.question!.prompt : null,
      options: asking
        ? config.question!.options.map((o) => ({
            id: o.id,
            label: o.label,
            off: state.off.includes(o.id),
          }))
        : [],
      field: state.field,
      fields: config.fields.length,
      fieldLabel: field?.label ?? null,
      cards: (field?.cards ?? []).map((c) => {
        const visible = state.open.includes(c.id) || state.matched.includes(c.id);
        return {
          id: c.id,
          open: state.open.includes(c.id),
          matched: state.matched.includes(c.id),
          // Hidden faces are absent from the projection, not merely hidden.
          label: visible ? c.label : null,
          pair: visible ? c.pair : null,
        };
      }),
    };
  },
  completed: (config, state) =>
    state.field >= config.fields.length && (!config.question || state.done),
};

// ---------------------------------------------------------------- «Пекарь»
interface BakerState {
  step: number;
  poured: number;
  last: string[];
}
const baker: MinigameAdapter<Config<'baker'>, BakerState, { measure: string }, Json> = {
  kind: 'baker',
  schema: 1,
  config: configOf('baker'),
  state(value, config) {
    const s = record(value, 'baker state');
    return {
      step: int(s.step, 'step', 0, config.steps.length),
      poured: int(s.poured, 'poured', 0, 10_000),
      last: strings(s.last, 'last'),
    };
  },
  action(value, config) {
    const a = record(value, 'baker move');
    if (typeof a.measure === 'string' && config.measures.some((m) => m.id === a.measure))
      return { measure: a.measure };
    throw new Error('Invalid baker move');
  },
  initial: () => ({ step: 0, poured: 0, last: [] }),
  reduce(config, state, action) {
    const step = config.steps[state.step];
    if (!step) throw new Error('Recipe is complete');
    const measure = config.measures.find((m) => m.id === action.measure)!;
    const poured = state.poured + measure.units;
    // Too much: the pick is undone. Wrong measure while still short: undone too («маловато»).
    if (poured > step.target) return { ...state, last: [...config.tooMuch, ...step.afterWrong] };
    if (poured < step.target && !step.ideal.includes(measure.id))
      return { ...state, last: [...config.tooLittle, ...step.afterWrong] };
    if (poured === step.target) return { step: state.step + 1, poured: 0, last: [] };
    return { ...state, poured, last: [] };
  },
  project(config, state) {
    const step = config.steps[state.step];
    return {
      kind: 'baker',
      step: state.step,
      steps: config.steps.length,
      prompt: step?.prompt ?? null,
      poured: state.poured,
      target: step?.target ?? 0,
      measures: config.measures.map((m) => ({ id: m.id, label: m.label, units: m.units })),
    };
  },
  completed: (config, state) => state.step >= config.steps.length,
};

export function createFluffyMinigames(): MinigameRegistry {
  return createMinigameRegistry()
    .register(magnifier)
    .register(cocoa)
    .register(tracks)
    .register(timeline)
    .register(scentPairs)
    .register(baker);
}

const definitions = new WeakMap<object, MinigameDefinition>();

/** The @aegis/narrative definition of a content minigame, pinned to its pack revision. */
export function minigameDefinition(game: Minigame, packRevision: string): MinigameDefinition {
  const cached = definitions.get(game);
  if (cached && cached.revision === packRevision) return cached;
  const definition: MinigameDefinition = {
    schema: 1,
    id: game.id,
    revision: packRevision,
    kind: game.config.kind,
    adapterSchema: 1,
    config: game.config as unknown as MinigameDefinition['config'],
    outputs: [],
  };
  definitions.set(game, definition);
  return definition;
}

/** Reply lines produced by the latest move (adapter-specific `last`). */
export function lastFeedback(progress: unknown): string[] {
  if (typeof progress === 'object' && progress !== null && 'last' in progress) {
    const last = (progress as { last: unknown }).last;
    if (Array.isArray(last)) return last.filter((item): item is string => typeof item === 'string');
  }
  return [];
}
