// Authoring helpers for content/ sources. Sources are TypeScript so the
// compiler type-checks references; compiled packs are plain JSON.
import type {
  ActivityCard,
  AwaitAction,
  Axis,
  CaseLogic,
  ClueId,
  CollectionItem,
  ComfortLine,
  Cond,
  CondLine,
  Cutscene,
  Delivery,
  Fact,
  GlossaryEntry,
  Hints,
  LineKind,
  MenuOption,
  Minigame,
  NotebookHelp,
  Reward,
  Scene,
  Skill,
  Speaker,
  Step,
} from '../../packages/content/src/schema.ts';

// ---------------------------------------------------------------- lines

export interface Change {
  /** PM original text (null for new lines). Checked against docs/pm. */
  before: string | null;
  reason: string;
  /** R-, T-, D- or Q- reference. */
  ref: string;
}

export interface LineOpts {
  rev?: number;
  kind?: LineKind;
  delivery?: Delivery;
  note?: string;
  tts?: string;
  voiced?: boolean;
  /** One entry per revision step, oldest first. */
  changes?: Change[];
}

export type LineTuple = [id: string, speaker: string, text: string, opts?: LineOpts];

export interface AuthoredLine {
  id: string;
  speaker: string;
  text: string;
  rev: number;
  kind: LineKind;
  delivery: Delivery;
  note?: string;
  tts?: string;
  voiced: boolean;
  changes: Change[];
  origin: string; // source module, for diagnostics
}

function defaultDelivery(kind: LineKind, text: string): Delivery {
  if (kind === 'label') return 'neutral';
  if (kind === 'fact' || kind === 'hint' || kind === 'notebook' || kind === 'comfort' || kind === 'glossary') return 'warm';
  if (text.includes('…') && !text.includes('!')) return 'thinking';
  if (/!\s*$/.test(text)) return 'cheerful';
  return 'neutral';
}

export function lines(origin: string, defaultKind: LineKind, rows: LineTuple[]): AuthoredLine[] {
  return rows.map(([id, speaker, text, o = {}]) => {
    const kind = o.kind ?? defaultKind;
    const changes = o.changes ?? [];
    return {
      id,
      speaker,
      text,
      rev: o.rev ?? (changes.some((c) => c.before !== null) ? changes.filter((c) => c.before !== null).length + 1 : 1),
      kind,
      delivery: o.delivery ?? defaultDelivery(kind, text),
      ...(o.note ? { note: o.note } : {}),
      ...(o.tts ? { tts: o.tts } : {}),
      voiced: o.voiced ?? true,
      changes,
      origin,
    };
  });
}

/** Changed PM line: keeps the ID, bumps the revision. */
export function changed(before: string, reason: string, ref: string, extra: Omit<LineOpts, 'changes'> = {}): LineOpts {
  return { ...extra, changes: [{ before, reason, ref }] };
}

/** New line authored by workstream C (not in PM scripts). */
export function added(reason: string, ref: string, extra: Omit<LineOpts, 'changes'> = {}): LineOpts {
  return { ...extra, changes: [{ before: null, reason, ref }] };
}

// ---------------------------------------------------------------- steps

export const L = (line: string): Step => ({ t: 'line', line });
/** Consecutive numbered lines: seq('C1-1-', 1, 7) → C1-1-01 … C1-1-07. */
export function seq(prefix: string, from: number, to: number): Step[] {
  const out: Step[] = [];
  for (let i = from; i <= to; i++) out.push(L(`${prefix}${String(i).padStart(2, '0')}`));
  return out;
}
export const Ls = (...ids: string[]): Step[] => ids.map(L);
export const dir = (id: string, text: string, background?: string): Step => ({ t: 'dir', id, text, ...(background ? { background } : {}) });
export const skill = (id: string, first: Step[], known: Step[] = first): Step => ({ t: 'skill', skill: id, first, known });
export const minigame = (id: string): Step => ({ t: 'minigame', minigame: id });
export const cutscene = (id: string): Step => ({ t: 'cutscene', cutscene: id });
export const reveal = (clue: ClueId): Step => ({ t: 'clue', clue });
export const set = (flag: string): Step => ({ t: 'set', flag });
export const reward = (id: string): Step => ({ t: 'reward', reward: id });
export const when = (cond: Cond, then: Step[], otherwise: Step[] = []): Step => ({ t: 'if', when: cond, then, else: otherwise });
export const goto = (scene: string): Step => ({ t: 'goto', scene });
export const end = (): Step => ({ t: 'end' });
export const wait = (action: AwaitAction): Step => ({ t: 'await', action });
export function menu(id: string, prompt: string | null, options: MenuOption[], o: { pageSize?: number; back?: string } = {}): Step {
  return { t: 'menu', id, prompt, pageSize: o.pageSize ?? 3, options, back: o.back ?? null };
}
export function opt(
  id: string,
  label: string,
  to: string,
  o: { when?: Cond; hideWhen?: Cond; optional?: boolean } = {},
): MenuOption {
  return { id, label, to, when: o.when ?? null, hideWhen: o.hideWhen ?? null, optional: o.optional ?? false };
}

// ---------------------------------------------------------------- conditions

export const has = {
  clue: (clue: string): Cond => ({ clue }),
  visited: (visited: string): Cond => ({ visited }),
  flag: (flag: string): Cond => ({ flag }),
  skill: (skill: string): Cond => ({ skill }),
  confirmed: (axis: string): Cond => ({ notebookConfirmed: axis }),
};
export const all = (...c: Cond[]): Cond => ({ all: c });
export const any = (...c: Cond[]): Cond => ({ any: c });
export const not = (c: Cond): Cond => ({ not: c });
export const cl = (line: string, cond: Cond | null = null): CondLine => ({ line, when: cond });

export const scene = (s: Scene): Scene => s;

// ---------------------------------------------------------------- sources

export interface SharedSource {
  lines: AuthoredLine[];
  speakers: Speaker[];
  skills: Skill[];
  lexicon: { word: string; hint: string }[];
  rewards: Reward[];
}

/** One playable variant (prologue, or a case at one level). Fully explicit after compilation. */
export interface VariantSource {
  pack: string;
  kind: 'prologue' | 'case';
  title: string | null;
  case: { number: number; level: 1 | 2 | 3 } | null;
  start: string;
  scenes: Scene[];
  logic: CaseLogic;
  notebookHelp: NotebookHelp | null;
  hints: Hints | null;
  minigames: Minigame[];
  facts: Fact[];
  /** New glossary terms introduced by this case (≤3). */
  glossary: GlossaryEntry[];
  rewards: string[];
  collections: CollectionItem[];
  activities: ActivityCard[];
  comfort: ComfortLine[];
  cutscenes: Cutscene[];
  /** Editorial notes on structural (non-text) normalization decisions. */
  decisions: { id: string; text: string; ref: string }[];
  /** Lines used by systems the step language does not model yet (family mode, …). */
  reserved?: { lines: string[]; reason: string }[];
}

export interface CaseSource {
  id: string; // prologue | case01 …
  lines: AuthoredLine[];
  variants: VariantSource[];
  /** Mechanics introduced by this case (titles are lines SK-<id> in this case). */
  skills?: Skill[];
  /** Rewards introduced by this case (labels are lines in this case). */
  rewards?: Reward[];
  /** Gendered-address review entries for this case's lines. */
  genderReview?: { id: string; rev: number; reason: string }[];
}

export type { Axis };
