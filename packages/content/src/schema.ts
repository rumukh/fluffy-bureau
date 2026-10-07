// Fluffy Bureau content pack schema (format "fluffy-content-pack", schema 1).
// Compiled packs are plain JSON; every reference is explicit (no inheritance).
// Deduction data embeds the @aegis/narrative DeductionCase (schema 1) verbatim.

export const PACK_FORMAT = 'fluffy-content-pack' as const;
export const PACK_SCHEMA = 1 as const;
export const MANIFEST_FORMAT = 'fluffy-voice-manifest' as const;

/** Player-name placeholder in display text. Counts as one word (T04); spoken as «пушинка» (Q28). */
export const NAME_PLACEHOLDER = '{имя}';
export const NAME_TTS = 'пушинка';

export type PackId = string; // shared | prologue | case01-l1 ... case08-l3
export type LineId = string; // see docs/content/ID_PATTERNS.md
export type SceneId = string;
export type ClueId = string;
export type FlagId = string;
export type SkillId = string;
export type SpeakerId = string;
export type AxisId = 'who' | 'where' | 'what' | string;
export type ValueId = string;

// ---------------------------------------------------------------- lines

export type LineKind =
  | 'dialogue' // spoken by a character in a scene
  | 'hint' // «Клубок» / «Телефон-ракушка»
  | 'notebook' // «Помоги заполнить» reasons and pointers
  | 'fact' // «А ты знал?» card text
  | 'glossary' // glossary definition (also spoken in dialogue)
  | 'label' // child-facing button/choice/card/interface label (R06)
  | 'activity' // real-world activity card text
  | 'reward' // reward names and notices
  | 'comfort'; // «Лампа смелости» line

export interface Line {
  id: LineId;
  /** Starts at 1; incremented whenever displayText changes. */
  rev: number;
  kind: LineKind;
  speaker: SpeakerId; // 'narrator' for labels, facts, cards
  /** Text shown to the player. May contain {имя}. */
  text: string;
  /** Spoken? false only for parent-corner text (Q29). */
  voiced: boolean;
  /** Delivery/emotion note for voice production. */
  note?: string;
}

export interface Speaker {
  id: SpeakerId;
  name: string; // display name, e.g. «Шерлок Хвостс»
  nameLabel: LineId; // spoken label of the name
  species: string;
  voiceNote: string; // casting note for A
}

// ---------------------------------------------------------------- conditions

/** Pure state predicates evaluated by the runtime. */
export type Cond =
  | { clue: ClueId } // clue revealed in this case
  | { visited: SceneId } // scene entered at least once in this run
  | { flag: FlagId } // case-run flag set by a {t:'set'} step
  | { skill: SkillId } // mechanic already learned in this profile (persists across cases)
  | { all: Cond[] }
  | { any: Cond[] }
  | { not: Cond };

// ---------------------------------------------------------------- flow

export type Step =
  | { t: 'line'; line: LineId }
  /** Stage direction / animation cue. Not child-facing text; never voiced. */
  | { t: 'dir'; id: string; text: string }
  /** First-encounter tutorial ([НАВЫК]). `first` plays when the profile lacks the skill, else `known`. Afterwards the skill is learned. */
  | { t: 'skill'; skill: SkillId; first: Step[]; known: Step[] }
  | { t: 'minigame'; minigame: string }
  /** Reveal a clue in the notebook; enables notebook-help marks that cite it. */
  | { t: 'clue'; clue: ClueId }
  | { t: 'set'; flag: FlagId }
  | { t: 'reward'; reward: string }
  | { t: 'if'; when: Cond; then: Step[]; else: Step[] }
  /** Decision screen. Options whose `when` fails or `hideWhen` holds are not shown. */
  | { t: 'menu'; id: string; prompt: LineId | null; pageSize: number; options: MenuOption[] }
  /** Notebook version / guess check (C1-6, P2). Loops until correct, then continues. */
  | { t: 'version'; button: LineId }
  | { t: 'goto'; scene: SceneId }
  | { t: 'end' };

export interface MenuOption {
  id: string;
  label: LineId;
  to: SceneId;
  when: Cond | null;
  hideWhen: Cond | null;
  /** Editorial: optional branch, not needed for the solution. */
  optional: boolean;
}

export type Presentation = 'dialogue' | 'cutscene' | 'hub' | 'minigame';

export interface Scene {
  id: SceneId;
  title: string; // editorial
  location: string; // background id for A/G
  cast: SpeakerId[]; // characters on stage (the player avatar is always present)
  presentation: Presentation;
  steps: Step[];
}

// ---------------------------------------------------------------- deduction (aegis)

export type Predicate =
  | { op: 'eq' | 'ne'; axis: string; value: string }
  | { op: 'in'; axis: string; values: string[] }
  | { op: 'and' | 'or'; terms: Predicate[] };

/** Identical to @aegis/narrative DeductionCase schema 1. Contains only required clues. */
export interface DeductionCase {
  schema: 1;
  id: string;
  axes: { id: string; values: string[] }[];
  compatibility: Predicate | null;
  intended: Record<string, string>;
  clues: { id: string; predicate: Predicate; requires: string[]; requiresAnswer: boolean; explanationKey: string }[];
  redHerrings: { id: string; explanationKey: string }[];
  maxCandidates: number;
}

export interface Axis {
  id: AxisId;
  title: LineId; // column label, e.g. «Кто?»
  values: { id: ValueId; label: LineId }[];
}

export interface Clue {
  id: ClueId;
  title: LineId; // notebook entry label
  required: boolean; // optional clues (Д1) are not in DeductionCase
  predicate: Predicate;
  requires: ClueId[];
  source: SceneId;
  summary: string; // editorial
}

export interface WrongValue {
  axis: AxisId;
  value: ValueId;
  /** Clues that, alone, exclude this value (checked by the solver, R03). */
  clues: ClueId[];
  lines: CondLine[];
}

export interface CondLine {
  line: LineId;
  when: Cond | null;
}

export interface CaseLogic {
  axes: Axis[];
  intended: Record<AxisId, ValueId>;
  clues: Clue[];
  /** Version button enabled when this holds. */
  versionAvailable: Cond;
  wrongVersion: {
    intro: CondLine[];
    /** Explain the first wrong value by column order. */
    byValue: WrongValue[];
    outro: CondLine[];
  };
  redHerrings: RedHerring[];
}

export interface RedHerring {
  id: string;
  summary: string; // editorial
  /** Lines that present the misleading observation. */
  presentedBy: LineId[];
  /** Lines that explain it; at least one must be on every completing route. */
  explainedBy: LineId[];
}

// ---------------------------------------------------------------- notebook help (D03)

export interface NotebookMarkRule {
  axis: AxisId;
  value: ValueId;
  mark: 'confirmed' | 'excluded';
  /** Must all be revealed; together they must prove the mark. */
  clues: ClueId[];
  /** Reason spoken in suggest mode. */
  line: LineId;
}

export interface NotebookHelp {
  /** suggest: propose stickers and explain (levels 1–2); point: only name the clue to revisit (level 3). */
  mode: 'suggest' | 'point';
  marks: NotebookMarkRule[];
  /** point mode: one line per clue, «Вернись к улике …». */
  pointers: { clue: ClueId; line: LineId }[];
  /** Spoken when nothing can be proposed yet. */
  nothing: LineId;
}

// ---------------------------------------------------------------- hints (D03, Q16)

export interface HintRule {
  id: LineId; // the hint line
  /** Rule applies while this holds (usually "clue not yet revealed"). */
  when: Cond;
  /** Clues whose content the hint mentions; must be revealed (hints reveal only revealed information). */
  cites: ClueId[];
}

export interface HintChannel {
  available: boolean;
  speaker: SpeakerId;
  precision: 'exact' | 'vague';
  /** null = unlimited (shell). Klubok: 3 per case run. */
  allowance: number | null;
  /** First applicable rule wins. */
  rules: HintRule[];
  /** When no rule applies: Watsony reviews known facts (Q16). Never spends allowance. */
  review: LineId;
  /** Shown when allowance is spent. */
  exhausted: LineId | null;
}

export interface Hints {
  klubok: HintChannel;
  shell: HintChannel;
}

// ---------------------------------------------------------------- minigames

export interface ChoiceOption {
  id: string;
  label: LineId;
  correct: boolean;
  reply: LineId[];
}

export type MinigameConfig =
  | {
      kind: 'magnifier'; // «Лупа» (aegis scene-selection)
      targets: { id: string; label: LineId; required: boolean; reply: LineId[] }[];
      /** Highlight a remaining target after this many misses (no timer). */
      assistAfterMisses: number;
    }
  | {
      kind: 'cocoa'; // «Чашка какао»
      rounds: { id: string; options: ChoiceOption[]; retry: LineId[] }[];
    }
  | {
      kind: 'tracks'; // «Кто наследил?»
      steps: { id: string; prompt: LineId | null; pageSize: number; options: ChoiceOption[] }[];
    }
  | {
      kind: 'timeline'; // «Лента времени» (aegis ordering)
      items: { id: string; time: string; label: LineId }[];
      solution: string[];
      wrong: LineId[];
    }
  | {
      kind: 'scent-pairs'; // «Пары запахов» (aegis matching)
      fields: { id: string; label: LineId; cards: { id: string; pair: string; label: LineId }[] }[];
      mismatch: LineId[];
    }
  | {
      kind: 'baker'; // «Пекарь»: amounts in quarter-cup units (exactQuantity)
      measures: { id: string; label: LineId; quarters: number }[];
      steps: { id: string; prompt: LineId; targetQuarters: number }[];
      tooMuch: LineId[];
      tooLittle: LineId[];
    }
  | {
      kind: 'question'; // closing question inside a minigame scene (e.g. «Какой след глубже?»)
      prompt: LineId;
      options: ChoiceOption[];
    };

export interface Minigame {
  id: string;
  skill: SkillId;
  config: MinigameConfig;
}

// ---------------------------------------------------------------- catalogs

export interface Skill {
  id: SkillId;
  title: LineId;
}

export interface Fact {
  id: string;
  line: LineId;
}

export interface GlossaryEntry {
  id: string;
  word: string;
  definition: LineId;
  label: LineId; // the word as a spoken label
  /** Inflected forms counted as a repetition. */
  forms: string[];
}

export type RewardKind = 'badge' | 'buttons' | 'hearts' | 'sticker' | 'decor' | 'title' | 'activity';

export interface Reward {
  id: string;
  kind: RewardKind;
  label: LineId;
  amount: number;
  /** Granted once per profile per claim key (Q38, Q40). */
  claimKey: string;
}

export interface CollectionItem {
  id: string;
  collection: 'secret-notes' | 'symbol-cards' | 'hero-traits';
  label: LineId;
  line: LineId | null;
}

export interface ActivityCard {
  id: string;
  title: LineId;
  steps: { line: LineId; adultOnly: boolean }[];
  safety: LineId[];
  allergens: string[];
}

export interface ComfortLine {
  scene: SceneId | '*';
  line: LineId;
}

export interface Cutscene {
  id: string;
  scene: SceneId;
  summary: string;
}

// ---------------------------------------------------------------- pack

export interface ContentPack {
  format: typeof PACK_FORMAT;
  schema: typeof PACK_SCHEMA;
  id: PackId;
  /** sha256 of the canonical pack body. */
  revision: string;
  kind: 'shared' | 'prologue' | 'case';
  title: LineId | null;
  case: { number: number; level: 1 | 2 | 3 } | null;
  requires: PackId[];
  start: SceneId | null;
  lines: Line[];
  speakers: Speaker[];
  skills: Skill[];
  scenes: Scene[];
  logic: CaseLogic | null;
  deduction: DeductionCase | null;
  notebookHelp: NotebookHelp | null;
  hints: Hints | null;
  minigames: Minigame[];
  facts: Fact[];
  glossary: GlossaryEntry[];
  rewards: Reward[];
  collections: CollectionItem[];
  activities: ActivityCard[];
  comfort: ComfortLine[];
  cutscenes: Cutscene[];
}

// ---------------------------------------------------------------- voice manifest

export interface ManifestEntry {
  id: LineId;
  revision: number;
  kind: LineKind;
  speaker: SpeakerId;
  displayText: string;
  ttsText: string;
  /** sha256(ttsText); combine with voice configuration for audio cache keys. */
  ttsHash: string;
  pronunciation: { word: string; hint: string }[];
  note: string;
  packs: PackId[];
}

export interface VoiceManifest {
  format: typeof MANIFEST_FORMAT;
  schema: 1;
  packs: Record<PackId, string>;
  lexicon: { word: string; hint: string; ipa?: string }[];
  speakers: Speaker[];
  entries: ManifestEntry[];
}
