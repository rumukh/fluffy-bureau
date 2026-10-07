import type { MinigameState, NotebookState } from '@aegis/narrative';

export const SPECIES = ['kitten', 'fox', 'mouse', 'squirrel', 'puppy'] as const;
export type Species = (typeof SPECIES)[number];
export const SCARVES = ['honey', 'sage', 'rose', 'sky', 'berry', 'mint'] as const;
export type Scarf = (typeof SCARVES)[number];
export const DEFAULT_NAME = 'Стажёр';
/** T04: one word, 2–12 Cyrillic or Latin letters, optional inner hyphen. */
export const NAME_PATTERN = /^[A-Za-zА-Яа-яЁё]+(?:-[A-Za-zА-Яа-яЁё]+)?$/u;

export function isValidName(name: string): boolean {
  const letters = name.replace(/-/g, '');
  return NAME_PATTERN.test(name) && letters.length >= 2 && letters.length <= 12;
}

export interface Avatar {
  species: Species | null;
  name: string;
  scarf: Scarf | null;
  hat: string | null;
}

/** A position inside a scene: indexes into nested step lists, with the branch taken. */
export interface CursorSegment {
  i: number;
  /** Branch entered at this step (for `if` and `skill` steps), else null. */
  b: 'then' | 'else' | 'first' | 'known' | null;
}

export type QueueSource =
  'feedback' | 'hint' | 'help' | 'version' | 'comfort' | 'reward' | 'system';

export interface QueuedLine {
  line: string;
  source: QueueSource;
}

export interface Suggestion {
  axis: string;
  value: string;
  mark: 'confirmed' | 'excluded';
  clues: string[];
  line: string;
}

export interface RunState {
  pack: string;
  packRevision: string;
  scene: string;
  cursor: CursorSegment[];
  /** Interjected lines shown before the current step continues (hints, replies, explanations). */
  queue: QueuedLine[];
  visited: string[];
  flags: string[];
  clues: string[];
  notebook: NotebookState | null;
  klubokUsed: number;
  hintsUsed: string[];
  minigame: MinigameState | null;
  minigameCount: number;
  suggestions: Suggestion[];
  versionAttempts: number;
  /** Stage directions passed since the last blocking step (presentation cues). */
  stage: string[];
  ended: boolean;
}

export interface ProfileState {
  v: 1;
  avatar: Avatar;
  skills: string[];
  buttons: number;
  hearts: number;
  /** Reward claim keys already granted (kept in state so content migrations never re-grant). */
  claimed: string[];
  /** Granted reward IDs (badges, stickers, decor items, titles, activity cards). */
  rewards: string[];
  decor: { item: string; slot: string }[];
  facts: string[];
  glossary: string[];
  collections: string[];
  /** Pack IDs finished at least once (prologue, case01-l1, …). */
  completed: string[];
  lamp: boolean;
  /** Number of case runs started; keeps minigame instance identities unique per profile. */
  runs: number;
  run: RunState | null;
}

export function initialProfile(): ProfileState {
  return {
    v: 1,
    avatar: { species: null, name: DEFAULT_NAME, scarf: null, hat: null },
    skills: [],
    buttons: 0,
    hearts: 0,
    claimed: [],
    rewards: [],
    decor: [],
    facts: [],
    glossary: [],
    collections: [],
    completed: [],
    lamp: false,
    runs: 0,
    run: null,
  };
}

/** D12 ranks; Stage 1 only reaches «Стажёр». */
export function rankOf(profile: Pick<ProfileState, 'completed'>): string {
  const cases = new Set(
    profile.completed.map((id) => /^(case\d\d)-l[123]$/.exec(id)?.[1]).filter(Boolean),
  );
  const has = (n: number) => cases.has(`case0${n}`);
  if (has(8)) return 'rank.master';
  if (has(6)) return 'rank.detective';
  if (has(4)) return 'rank.junior';
  if (has(2)) return 'rank.assistant';
  return 'rank.intern';
}
