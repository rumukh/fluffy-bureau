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

function uniqueStrings(value: unknown, what: string): string[] {
  const list = strings(value, what);
  if (new Set(list).size !== list.length) throw new Error(`Duplicate ${what}`);
  return list;
}
function pattern(value: unknown, what: string, min = 0, max = 5): ('dot' | 'dash')[] {
  if (
    !Array.isArray(value) ||
    value.length < min ||
    value.length > max ||
    value.some((item) => item !== 'dot' && item !== 'dash')
  )
    throw new Error(`Invalid ${what}`);
  return [...(value as ('dot' | 'dash')[])];
}
function samePattern(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((item, index) => item === b[index]);
}
export function initialFeedback(config: MinigameConfig): string[] {
  switch (config.kind) {
    case 'cipher':
    case 'postman':
    case 'sound-match':
    case 'light-signals':
    case 'equal-share':
      return [...config.intro];
    default:
      return [];
  }
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
  pageSize?: number;
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
      pageSize: 'pageSize' in (step ?? {}) ? Math.min(3, Number(step?.pageSize ?? 3)) : 3,
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

// ---------------------------------------------------------------- «Шифр на пуговицах»
interface CipherState {
  word: number;
  slot: number;
  filled: string[][];
  last: string[];
}
const cipher: MinigameAdapter<Config<'cipher'>, CipherState, { option: string }, Json> = {
  kind: 'cipher',
  schema: 1,
  config: configOf('cipher'),
  state(value, config) {
    const s = record(value, 'cipher state');
    const filledRaw = Array.isArray(s.filled) ? s.filled : [];
    const filled = config.words.map((word, i) => {
      const row = Array.isArray(filledRaw[i]) ? filledRaw[i] : [];
      return word.slots.map((slot, j) => {
        const glyph = row[j];
        if (glyph === '') return '';
        if (typeof glyph !== 'string' || glyph !== slot.glyph)
          throw new Error('Invalid filled slot');
        return glyph;
      });
    });
    return {
      word: int(s.word, 'word', 0, config.words.length),
      slot: int(s.slot, 'slot', 0, Math.max(...config.words.map((w) => w.slots.length), 0)),
      filled,
      last: strings(s.last, 'last'),
    };
  },
  action(value, config) {
    const a = record(value, 'cipher move');
    if (typeof a.option !== 'string' || !config.table.some((g) => g.id === a.option))
      throw new Error('Unknown cipher option');
    return { option: a.option };
  },
  initial: (config) => ({
    word: 0,
    slot: 0,
    filled: config.words.map((word) => word.slots.map(() => '')),
    last: [],
  }),
  reduce(config, state, action) {
    const word = config.words[state.word];
    const slot = word?.slots[state.slot];
    if (!word || !slot || !slot.options.includes(action.option))
      throw new Error('Option is not in the current slot');
    if (action.option !== slot.glyph) return { ...state, last: [...config.wrong] };
    const filled = state.filled.map((row) => [...row]);
    filled[state.word]![state.slot] = action.option;
    if (state.slot + 1 < word.slots.length)
      return { ...state, slot: state.slot + 1, filled, last: [] };
    return { word: state.word + 1, slot: 0, filled, last: [...word.solved] };
  },
  project(config, state) {
    const table = new Map(config.table.map((g) => [g.id, g]));
    const glyph = (id: string) => {
      const item = table.get(id);
      if (!item) throw new Error(`Unknown cipher glyph ${id}`);
      return {
        id: item.id,
        letter: item.letter,
        colour: item.colour,
        holes: item.holes,
        shape: item.shape,
        label: item.label,
      };
    };
    const word = config.words[state.word];
    const slot = word?.slots[state.slot];
    return {
      kind: 'cipher',
      word: state.word,
      slot: state.slot,
      words: config.words.map((w, wi) => ({
        id: w.id,
        answer: w.answer,
        slots: w.slots.map((s, si) => ({
          glyph: glyph(s.glyph),
          filled: Boolean(state.filled[wi]?.[si]),
        })),
      })),
      current: word ? { word: word.id, slot: state.slot } : null,
      options: (slot?.options ?? []).map(glyph),
    };
  },
  completed: (config, state) => state.word >= config.words.length,
};

// ---------------------------------------------------------------- «Почтальон»
interface PostmanState {
  letter: number;
  phase: 'street' | 'house';
  last: string[];
}
type PostmanAction = { street: string } | { house: number };
const postman: MinigameAdapter<Config<'postman'>, PostmanState, PostmanAction, Json> = {
  kind: 'postman',
  schema: 1,
  config: configOf('postman'),
  state(value, config) {
    const s = record(value, 'postman state');
    if (s.phase !== 'street' && s.phase !== 'house') throw new Error('Invalid postman phase');
    return {
      letter: int(s.letter, 'letter', 0, config.letters.length),
      phase: s.phase,
      last: strings(s.last, 'last'),
    };
  },
  action(value) {
    const a = record(value, 'postman move');
    if (typeof a.street === 'string') return { street: a.street };
    if (typeof a.house === 'number') return { house: int(a.house, 'house', 0, 999) };
    throw new Error('Invalid postman move');
  },
  initial: (config) => ({
    letter: 0,
    phase: config.letters[0]?.streetOptions ? 'street' : 'house',
    last: [],
  }),
  reduce(config, state, action) {
    const letter = config.letters[state.letter];
    if (!letter) throw new Error('Post is delivered');
    if (state.phase === 'street') {
      if (!('street' in action) || !letter.streetOptions?.includes(action.street))
        throw new Error('Street is not available');
      if (action.street !== letter.street) return { ...state, last: [...config.wrongStreet] };
      return { ...state, phase: 'house', last: [] };
    }
    if (!('house' in action) || !letter.houseOptions.includes(action.house))
      throw new Error('House is not available');
    if (action.house !== letter.house) return { ...state, last: [...config.wrongHouse] };
    const next = state.letter + 1;
    return {
      letter: next,
      phase: config.letters[next]?.streetOptions ? 'street' : 'house',
      last: [...config.correct],
    };
  },
  project(config, state) {
    const letter = config.letters[state.letter];
    return {
      kind: 'postman',
      letter: state.letter,
      phase: letter ? state.phase : 'done',
      current: letter
        ? {
            id: letter.id,
            label: letter.label,
            buttons: [...letter.buttons],
            cipher: config.cipher,
          }
        : null,
      options:
        letter && state.phase === 'street'
          ? (letter.streetOptions ?? []).map((id) => ({
              id,
              label: config.streets?.find((s) => s.id === id)?.label ?? id,
            }))
          : (letter?.houseOptions ?? []).map((house) => ({ house })),
      houseLabels: config.houseLabels.map((h) => ({ number: h.number, label: h.label })),
    };
  },
  completed: (config, state) => state.letter >= config.letters.length,
};

// ---------------------------------------------------------------- «Услышь разницу»
interface SoundMatchState {
  round: number;
  tried: string[];
  last: string[];
}
const soundMatch: MinigameAdapter<
  Config<'sound-match'>,
  SoundMatchState,
  { option: string },
  Json
> = {
  kind: 'sound-match',
  schema: 1,
  config: configOf('sound-match'),
  state(value, config) {
    const s = record(value, 'sound-match state');
    return {
      round: int(s.round, 'round', 0, config.rounds.length),
      tried: strings(s.tried, 'tried'),
      last: strings(s.last, 'last'),
    };
  },
  action(value) {
    const a = record(value, 'sound-match move');
    if (typeof a.option !== 'string') throw new Error('Missing option');
    return { option: a.option };
  },
  initial: () => ({ round: 0, tried: [], last: [] }),
  reduce(config, state, action) {
    const round = config.rounds[state.round];
    const option = round?.options.find((o) => o.id === action.option);
    if (!round || !option) throw new Error('Option is not in the current round');
    if (option.correct)
      return {
        round: state.round + 1,
        tried: [],
        last: [...option.reply, ...(state.round + 1 >= config.rounds.length ? config.after : [])],
      };
    return {
      round: state.round,
      tried: state.tried.includes(option.id) ? state.tried : [...state.tried, option.id],
      last: [...option.reply, ...round.wrong],
    };
  },
  project(config, state) {
    const round = config.rounds[state.round];
    return {
      kind: 'sound-match',
      round: state.round,
      rounds: config.rounds.length,
      target: round?.target ?? null,
      options: (round?.options ?? []).map((o) => ({
        id: o.id,
        label: o.label,
        sample: o.sample,
        tried: state.tried.includes(o.id),
      })),
    };
  },
  completed: (config, state) => state.round >= config.rounds.length,
};

// ---------------------------------------------------------------- «Азбука огоньков»
interface LightSignalsState {
  signal: number;
  input: ('dot' | 'dash')[];
  phase: 'signals' | 'own' | 'done';
  own: ('dot' | 'dash')[] | null;
  last: string[];
}
type LightSignalsAction = { symbol: 'dot' | 'dash' } | { erase: true } | { send: true };
const lightSignals: MinigameAdapter<
  Config<'light-signals'>,
  LightSignalsState,
  LightSignalsAction,
  Json
> = {
  kind: 'light-signals',
  schema: 1,
  config: configOf('light-signals'),
  state(value, config) {
    const s = record(value, 'light-signals state');
    if (s.phase !== 'signals' && s.phase !== 'own' && s.phase !== 'done')
      throw new Error('Invalid light phase');
    return {
      signal: int(s.signal, 'signal', 0, config.signals.length),
      input: pattern(s.input, 'input', 0, 5),
      phase: s.phase,
      own: s.own === null ? null : pattern(s.own, 'own', 0, 5),
      last: strings(s.last, 'last'),
    };
  },
  action(value) {
    const a = record(value, 'light-signals move');
    if (a.symbol === 'dot' || a.symbol === 'dash') return { symbol: a.symbol };
    if (a.erase === true) return { erase: true };
    if (a.send === true) return { send: true };
    throw new Error('Invalid light-signals move');
  },
  initial: () => ({ signal: 0, input: [], phase: 'signals', own: null, last: [] }),
  reduce(config, state, action) {
    if ('symbol' in action) {
      if (state.input.length >= 5) throw new Error('Signal input is full');
      return { ...state, input: [...state.input, action.symbol], last: [] };
    }
    if ('erase' in action) return { ...state, input: state.input.slice(0, -1), last: [] };
    if (state.phase === 'signals') {
      const signal = config.signals[state.signal];
      if (!signal) throw new Error('All signals are complete');
      if (!samePattern(state.input, signal.pattern))
        return { ...state, input: [], last: [...config.wrong] };
      const next = state.signal + 1;
      if (next >= config.signals.length && config.own)
        return {
          signal: next,
          input: [],
          phase: 'own',
          own: null,
          last: [...signal.correct, ...config.own.prompt],
        };
      return {
        ...state,
        signal: next,
        input: [],
        phase: next >= config.signals.length ? 'done' : 'signals',
        last: [...signal.correct],
      };
    }
    if (state.phase === 'own') {
      const own = config.own;
      if (!own) throw new Error('No own signal');
      if (state.input.length < own.min || state.input.length > own.max)
        throw new Error('Own signal length is not available');
      return { ...state, input: [], phase: 'done', own: [...state.input], last: [...own.done] };
    }
    throw new Error('Signals already complete');
  },
  project(config, state) {
    const signal = config.signals[state.signal];
    return {
      kind: 'light-signals',
      signal: state.signal,
      phase: state.phase,
      input: [...state.input],
      own: state.own ? [...state.own] : null,
      ownRules: config.own ? { min: config.own.min, max: config.own.max } : null,
      current: signal
        ? { id: signal.id, label: signal.label, patternLength: signal.pattern.length }
        : null,
      signals: config.signals.map((s, index) => ({
        id: s.id,
        label: s.label,
        done: index < state.signal,
        patternLength: s.pattern.length,
      })),
    };
  },
  completed: (_config, state) => state.phase === 'done',
};

// ---------------------------------------------------------------- «Прочитай мигание»
interface ReadBlinkState {
  done: boolean;
  off: string[];
  last: string[];
}
const readBlink: MinigameAdapter<Config<'read-blink'>, ReadBlinkState, { option: string }, Json> = {
  kind: 'read-blink',
  schema: 1,
  config: configOf('read-blink'),
  state(value) {
    const s = record(value, 'read-blink state');
    return { done: s.done === true, off: strings(s.off, 'off'), last: strings(s.last, 'last') };
  },
  action(value) {
    const a = record(value, 'read-blink move');
    if (typeof a.option !== 'string') throw new Error('Missing option');
    return { option: a.option };
  },
  initial: () => ({ done: false, off: [], last: [] }),
  reduce(config, state, action) {
    if (state.done) throw new Error('Blink already read');
    const option = config.lessons.find((o) => o.id === action.option);
    if (!option || state.off.includes(option.id)) throw new Error('Option is not available');
    if (option.correct) return { done: true, off: state.off, last: [...option.reply] };
    return {
      done: false,
      off: [...state.off, option.id],
      last: option.reply.length ? [...option.reply] : [...config.wrong],
    };
  },
  project(config, state) {
    return {
      kind: 'read-blink',
      drawing: [...config.drawing],
      lessons: config.lessons.map((l) => ({
        id: l.id,
        label: l.label,
        pattern: [...l.pattern],
        off: state.off.includes(l.id),
      })),
    };
  },
  completed: (_config, state) => state.done,
};

// ---------------------------------------------------------------- «Хранитель снов»
interface DreamAskAnswer {
  player: string;
  question: string;
  answer: boolean;
}
interface DreamContributions {
  keeper: number;
  asker: number;
  guesser: number;
}
interface DreamKeeperState {
  mode: 'select' | 'solo' | 'family';
  round: number;
  card: number;
  phase: 'mode' | 'card' | 'keeper' | 'pick' | 'ask' | 'done';
  players: string[];
  keeper: string | null;
  picked: string | null;
  asked: DreamAskAnswer[];
  contributions: Record<string, DreamContributions>;
  titles: Record<string, string>;
  last: string[];
}
type DreamKeeperAction =
  | { mode: 'solo' }
  | { mode: 'family'; players: string[] }
  | { value: string }
  | { keeper: string }
  | { pick: string }
  | { ask: string; player: string }
  | { guess: string; player: string };
function contribution(): DreamContributions {
  return { keeper: 0, asker: 0, guesser: 0 };
}
function playerLabel(id: string): string {
  return id === 'child' ? 'child' : id;
}
const dreamKeeper: MinigameAdapter<
  Config<'dream-keeper'>,
  DreamKeeperState,
  DreamKeeperAction,
  Json
> = {
  kind: 'dream-keeper',
  schema: 1,
  config: configOf('dream-keeper'),
  state(value) {
    const s = record(value, 'dream-keeper state');
    if (s.mode !== 'select' && s.mode !== 'solo' && s.mode !== 'family')
      throw new Error('Bad mode');
    const phase = s.phase;
    if (!['mode', 'card', 'keeper', 'pick', 'ask', 'done'].includes(String(phase)))
      throw new Error('Bad dream phase');
    const contribRaw = record(s.contributions ?? {}, 'contributions');
    const contributions: Record<string, DreamContributions> = {};
    for (const [id, value] of Object.entries(contribRaw)) {
      const c = record(value, 'contribution');
      contributions[id] = {
        keeper: int(c.keeper, 'keeper contribution', 0, 999),
        asker: int(c.asker, 'asker contribution', 0, 999),
        guesser: int(c.guesser, 'guesser contribution', 0, 999),
      };
    }
    const titleRaw = record(s.titles ?? {}, 'titles');
    const titles: Record<string, string> = {};
    for (const [id, title] of Object.entries(titleRaw)) {
      if (typeof title !== 'string') throw new Error('Bad title');
      titles[id] = title;
    }
    const askedRaw = Array.isArray(s.asked) ? s.asked : [];
    return {
      mode: s.mode,
      round: int(s.round, 'round', 0, 999),
      card: int(s.card, 'card', 0, 999),
      phase: phase as DreamKeeperState['phase'],
      players: uniqueStrings(s.players, 'players'),
      keeper: s.keeper === null ? null : String(s.keeper),
      picked: s.picked === null ? null : String(s.picked),
      asked: askedRaw.map((item) => {
        const a = record(item, 'answer');
        if (
          typeof a.player !== 'string' ||
          typeof a.question !== 'string' ||
          typeof a.answer !== 'boolean'
        )
          throw new Error('Bad answer');
        return { player: a.player, question: a.question, answer: a.answer };
      }),
      contributions,
      titles,
      last: strings(s.last, 'last'),
    };
  },
  action(value) {
    const a = record(value, 'dream-keeper move');
    if (a.mode === 'solo') return { mode: 'solo' };
    if (a.mode === 'family')
      return { mode: 'family', players: uniqueStrings(a.players, 'players') };
    if (typeof a.value === 'string') return { value: a.value };
    if (typeof a.keeper === 'string') return { keeper: a.keeper };
    if (typeof a.pick === 'string') return { pick: a.pick };
    if (typeof a.ask === 'string' && typeof a.player === 'string')
      return { ask: a.ask, player: a.player };
    if (typeof a.guess === 'string' && typeof a.player === 'string')
      return { guess: a.guess, player: a.player };
    throw new Error('Invalid dream move');
  },
  initial: () => ({
    mode: 'select',
    round: 0,
    card: 0,
    phase: 'mode',
    players: [],
    keeper: null,
    picked: null,
    asked: [],
    contributions: {},
    titles: {},
    last: [],
  }),
  reduce(config, state, action) {
    if (state.mode === 'select') {
      if ('mode' in action && action.mode === 'solo')
        return { ...state, mode: 'solo', phase: 'card', last: [...config.intro] };
      if ('mode' in action && action.mode === 'family') {
        if (
          action.players.length < 2 ||
          action.players.length > 4 ||
          !action.players.includes('child') ||
          action.players.some(
            (p) => p !== 'child' && !config.family.players.some((player) => player.id === p),
          )
        )
          throw new Error('Invalid family players');
        const contributions = Object.fromEntries(action.players.map((p) => [p, contribution()]));
        return {
          ...state,
          mode: 'family',
          phase: 'keeper',
          players: [...action.players],
          contributions,
          last: [...config.family.intro],
        };
      }
      throw new Error('Choose dream mode first');
    }
    if (state.mode === 'solo') {
      if (!('value' in action) || state.phase !== 'card') throw new Error('Expected solo value');
      const round = config.rounds[state.round];
      if (!round) throw new Error('Dreams are complete');
      if (action.value === round.answer) {
        const next = state.round + 1;
        return {
          ...state,
          round: next,
          card: 0,
          phase: next >= config.rounds.length ? 'done' : 'card',
          last: [...round.correct, ...(next >= config.rounds.length ? config.after : [])],
        };
      }
      return {
        ...state,
        card: Math.min(state.card + 1, Math.max(round.cards.length - 1, 0)),
        last: [...round.wrong],
      };
    }
    const round = config.rounds[state.round];
    if (!round) throw new Error('Family dreams are complete');
    const contributionFor = (player: string, key: keyof DreamContributions) => {
      const contributions = Object.fromEntries(
        Object.entries(state.contributions).map(([id, c]) => [id, { ...c }]),
      ) as Record<string, DreamContributions>;
      contributions[player] ??= contribution();
      contributions[player][key]++;
      return contributions;
    };
    const finishRound = (last: string[], contributions = state.contributions): DreamKeeperState => {
      const next = state.round + 1;
      if (next < config.rounds.length)
        return {
          ...state,
          round: next,
          card: 0,
          phase: 'keeper',
          keeper: null,
          picked: null,
          asked: [],
          contributions,
          last,
        };
      const titles = Object.fromEntries(
        state.players.map((player) => {
          const c = contributions[player] ?? contribution();
          const main =
            c.guesser >= c.keeper && c.guesser >= c.asker
              ? 'guesser'
              : c.asker >= c.keeper
                ? 'asker'
                : 'keeper';
          return [
            player,
            config.family.titles.find((t) => t.for === main)?.id ?? config.family.titles[0]!.id,
          ];
        }),
      );
      return {
        ...state,
        round: next,
        phase: 'done',
        contributions,
        titles,
        last: [...last, ...config.family.win],
      };
    };
    if ('keeper' in action) {
      if (state.phase !== 'keeper' || !state.players.includes(action.keeper))
        throw new Error('Keeper is not available');
      return {
        ...state,
        keeper: action.keeper,
        phase: 'pick',
        contributions: contributionFor(action.keeper, 'keeper'),
        last: [...config.family.keeperPick],
      };
    }
    if ('pick' in action) {
      if (state.phase !== 'pick' || !round.cards.slice(0, 3).some((c) => c.id === action.pick))
        throw new Error('Card is not available');
      return {
        ...state,
        picked: action.pick,
        phase: 'ask',
        asked: [],
        last: [...config.family.ask],
      };
    }
    if ('ask' in action) {
      if (
        state.phase !== 'ask' ||
        !state.players.includes(action.player) ||
        action.player === state.keeper ||
        !config.family.questions.some((q) => q.id === action.ask) ||
        state.asked.some((a) => a.player === action.player)
      )
        throw new Error('Question is not available');
      const card = round.cards.find((c) => c.id === state.picked);
      if (!card) throw new Error('No picked card');
      return {
        ...state,
        asked: [
          ...state.asked,
          { player: action.player, question: action.ask, answer: card.facts[action.ask] === true },
        ],
        contributions: contributionFor(action.player, 'asker'),
        last: [],
      };
    }
    if ('guess' in action) {
      if (
        state.phase !== 'ask' ||
        !state.players.includes(action.player) ||
        action.player === state.keeper
      )
        throw new Error('Guess is not available');
      if (action.guess === round.answer)
        return finishRound([...round.correct], contributionFor(action.player, 'guesser'));
      return { ...state, last: [...round.wrong] };
    }
    throw new Error('Invalid family move');
  },
  project(config, state) {
    const round = config.rounds[state.round];
    return {
      kind: 'dream-keeper',
      mode: state.mode,
      round: state.round,
      rounds: config.rounds.length,
      phase: state.phase,
      card: state.card,
      players: state.players.map((id) => ({ id, label: playerLabel(id) })),
      keeper: state.keeper,
      picked: state.picked,
      asked: state.asked.map((a) => ({ ...a })),
      contributions: structuredClone(state.contributions) as unknown as Json,
      titles:
        state.phase === 'done'
          ? Object.entries(state.titles).map(([player, title]) => ({
              player,
              title,
              label: config.family.titles.find((t) => t.id === title)?.label ?? title,
            }))
          : [],
      axis: round?.axis ?? null,
      solo: round
        ? {
            card: round.cards[Math.min(state.card, round.cards.length - 1)]
              ? {
                  id: round.cards[Math.min(state.card, round.cards.length - 1)]!.id,
                  image: round.cards[Math.min(state.card, round.cards.length - 1)]!.image,
                  label: round.cards[Math.min(state.card, round.cards.length - 1)]!.label,
                }
              : null,
          }
        : null,
      cards: (round?.cards ?? []).map((c) => ({ id: c.id, image: c.image, label: c.label })),
      questions: config.family.questions.map((q) => ({ id: q.id, label: q.label })),
    };
  },
  completed: (_config, state) => state.phase === 'done',
};

// ---------------------------------------------------------------- «Раздели поровну»
interface EqualShareState {
  task: number;
  groups: number[];
  last: string[];
}
type EqualShareAction = { add: number } | { remove: number } | { check: true };
const equalShare: MinigameAdapter<
  Config<'equal-share'>,
  EqualShareState,
  EqualShareAction,
  Json
> = {
  kind: 'equal-share',
  schema: 1,
  config: configOf('equal-share'),
  state(value, config) {
    const s = record(value, 'equal-share state');
    const task = int(s.task, 'task', 0, config.tasks.length);
    const expected = task >= config.tasks.length ? 0 : (config.tasks[task]?.groups ?? 0);
    if (!Array.isArray(s.groups) || s.groups.length !== expected) throw new Error('Invalid groups');
    return {
      task,
      groups: s.groups.map((g) => int(g, 'group', 0, 999)),
      last: strings(s.last, 'last'),
    };
  },
  action(value, config) {
    const a = record(value, 'equal-share move');
    const maxGroups = Math.max(...config.tasks.map((t) => t.groups), 1);
    if (typeof a.add === 'number') return { add: int(a.add, 'group', 0, maxGroups - 1) };
    if (typeof a.remove === 'number') return { remove: int(a.remove, 'group', 0, maxGroups - 1) };
    if (a.check === true) return { check: true };
    throw new Error('Invalid equal-share move');
  },
  initial: (config) => ({
    task: 0,
    groups: config.tasks[0]?.groups ? Array(config.tasks[0].groups).fill(0) : [],
    last: [],
  }),
  reduce(config, state, action) {
    const task = config.tasks[state.task];
    if (!task) throw new Error('Sharing is complete');
    const remaining = task.items - task.reserve - state.groups.reduce((a, b) => a + b, 0);
    if ('add' in action) {
      if (action.add >= state.groups.length || remaining <= 0) throw new Error('Cannot add item');
      const groups = [...state.groups];
      groups[action.add] = (groups[action.add] ?? 0) + 1;
      return { ...state, groups, last: [] };
    }
    if ('remove' in action) {
      if (action.remove >= state.groups.length || state.groups[action.remove]! <= 0)
        throw new Error('Cannot remove item');
      const groups = [...state.groups];
      groups[action.remove] = (groups[action.remove] ?? 0) - 1;
      return { ...state, groups, last: [] };
    }
    const sum = state.groups.reduce((a, b) => a + b, 0);
    const equal = state.groups.every((g) => g === state.groups[0]);
    if (sum === task.items - task.reserve && equal) {
      const next = state.task + 1;
      return {
        task: next,
        groups: config.tasks[next]?.groups ? Array(config.tasks[next]!.groups).fill(0) : [],
        last: [...task.correct],
      };
    }
    return { ...state, last: [...config.uneven] };
  },
  project(config, state) {
    const task = config.tasks[state.task];
    return {
      kind: 'equal-share',
      task: state.task,
      tasks: config.tasks.length,
      prompt: task?.prompt ?? null,
      items: task?.items ?? 0,
      reserve: task?.reserve ?? 0,
      itemLabel: task?.itemLabel ?? null,
      groupLabel: task?.groupLabel ?? null,
      groups: [...state.groups],
      pool: task ? task.items - task.reserve - state.groups.reduce((a, b) => a + b, 0) : 0,
    };
  },
  completed: (config, state) => state.task >= config.tasks.length,
};

// ---------------------------------------------------------------- «Чья тележка?»
function compareSteps(config: Config<'compare'>): ChoiceStep[] {
  return [
    ...config.steps,
    ...(config.question
      ? [{ id: 'question', prompt: config.question.prompt, options: config.question.options }]
      : []),
  ];
}
const compare: MinigameAdapter<Config<'compare'>, ChoiceStepsState, { option: string }, Json> = {
  kind: 'compare',
  schema: 1,
  config: configOf('compare'),
  state(value, config) {
    const s = record(value, 'compare state');
    return {
      step: int(s.step, 'step', 0, compareSteps(config).length),
      off: strings(s.off, 'off'),
      last: strings(s.last, 'last'),
    };
  },
  action(value) {
    const a = record(value, 'compare move');
    if (typeof a.option !== 'string') throw new Error('Missing option');
    return { option: a.option };
  },
  initial: () => ({ step: 0, off: [], last: [] }),
  reduce(config, state, action) {
    const step = compareSteps(config)[state.step];
    const option = step?.options.find((o) => o.id === action.option);
    if (!step || !option || state.off.includes(option.id))
      throw new Error('Option is not available');
    if (option.correct) return { step: state.step + 1, off: [], last: [...option.reply] };
    return { step: state.step, off: [...state.off, option.id], last: [...option.reply] };
  },
  project(config, state) {
    const steps = compareSteps(config);
    const step = steps[state.step];
    return {
      kind: 'compare',
      subject: { ...config.subject },
      step: state.step,
      steps: steps.length,
      question: step?.id === 'question' && Boolean(config.question),
      prompt: step?.prompt ?? null,
      pageSize: 'pageSize' in (step ?? {}) ? Math.min(3, Number(step?.pageSize ?? 3)) : 3,
      options: (step?.options ?? []).map((o) => ({
        id: o.id,
        label: o.label,
        off: state.off.includes(o.id),
      })),
    };
  },
  completed: (config, state) => state.step >= compareSteps(config).length,
};

export function createFluffyMinigames(): MinigameRegistry {
  return createMinigameRegistry()
    .register(magnifier)
    .register(cocoa)
    .register(tracks)
    .register(timeline)
    .register(scentPairs)
    .register(baker)
    .register(cipher)
    .register(postman)
    .register(soundMatch)
    .register(lightSignals)
    .register(readBlink)
    .register(dreamKeeper)
    .register(equalShare)
    .register(compare);
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
