import type { CutsceneFile } from '@aegis/browser/animation';

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
  /** Spoken form when it differs from text (numbers, times), before {имя} substitution. */
  tts?: string;
  /** Spoken? false only for parent-corner text (Q29). */
  voiced: boolean;
  /** Private family-mode content (T31): never shown or voiced outside its owner's screen. */
  private?: boolean;
  /** Delivery for SSML prosody (A). */
  delivery: Delivery;
  /** Free-text context/emotion note for voice production. */
  note?: string;
}

export type Delivery = 'neutral' | 'cheerful' | 'excited' | 'worried' | 'sad' | 'shy' | 'thinking' | 'whisper' | 'warm';

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
  | { notebookConfirmed: AxisId } // the player placed a ✔ in this notebook column
  | { skill: SkillId } // mechanic already learned in this profile (persists across cases)
  | { all: Cond[] }
  | { any: Cond[] }
  | { not: Cond };

// ---------------------------------------------------------------- flow

export type Step =
  | { t: 'line'; line: LineId }
  /**
   * Stage direction / animation cue. Not child-facing text; never voiced. Optional background (A asset
   * ID): from this step on, until the scene ends or another dir sets one, the stage shows that
   * background (top-level steps only). Optional actions (U10) play when the cursor reaches the dir;
   * they never block and never change game state.
   */
  | { t: 'dir'; id: string; text: string; background?: string; actions?: StageAction[] }
  /** First-encounter tutorial ([НАВЫК]). `first` plays when the profile lacks the skill, else `known`. Afterwards the skill is learned. */
  | { t: 'skill'; skill: SkillId; first: Step[]; known: Step[] }
  | { t: 'minigame'; minigame: string }
  /**
   * Play a cutscene (T25) from this pack's cutscenes. Blocking; completes when the player
   * finishes or skips it. Gameplay effects never live inside a cutscene: they follow as steps.
   */
  | { t: 'cutscene'; cutscene: string }
  /** Reveal a clue in the notebook; enables notebook-help marks that cite it. */
  | { t: 'clue'; clue: ClueId }
  | { t: 'set'; flag: FlagId }
  | { t: 'reward'; reward: string }
  | { t: 'if'; when: Cond; then: Step[]; else: Step[] }
  /** Decision screen. Options whose `when` fails or `hideWhen` holds are not shown. */
  | { t: 'menu'; id: string; prompt: LineId | null; pageSize: number; options: MenuOption[]; back: SceneId | null }
  /** Wait until the player performs a taught interaction. `hotspot` names the hotspot for action "hotspot" (U11). */
  | { t: 'await'; action: AwaitAction; hotspot?: string }
  | { t: 'goto'; scene: SceneId }
  | { t: 'end' };

/**
 * Presentation-only stage action on a stage direction (U10): a subset of the engine's cutscene ops
 * (aegis-cutscene/1). Actors are the scene's cast speaker IDs, "player" (the avatar) or prop keys of
 * `Scene.props`. Never blocking.
 */
export type StageAction =
  | { op: 'pose'; actor: string; expression?: string; clip?: string; face?: 'left' | 'right' }
  | { op: 'emote'; actor: string; emote: string }
  | { op: 'sfx'; asset: string; gain?: number }
  | { op: 'effect'; effect: string; at?: { x: number; y: number }; duration?: number }
  | { op: 'move'; actor: string; to: { x: number; y: number }; duration?: number }
  | { op: 'enter'; actor: string; from: 'left' | 'right' | { x: number; y: number }; to: { x: number; y: number }; duration?: number; walk?: boolean }
  | { op: 'exit'; actor: string; to: 'left' | 'right' | { x: number; y: number }; duration?: number; walk?: boolean };

/** Blocking interaction: the runtime shows the matching UI and continues when the child does it. */
export type AwaitAction =
  | 'avatar.species'
  | 'avatar.name'
  | 'avatar.scarf'
  | 'lamp.on'
  | 'lamp.off'
  | 'replay'
  | 'notebook.open'
  | 'pause'
  | 'office.place'
  /** Tap a named hotspot of the current background (U11, e.g. the shed window). */
  | 'hotspot';

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
  /** Default background (A asset ID), overriding the location's default. */
  background?: string;
  /** Props that stage-direction actions may use (key → A prop rig ID), U10. */
  props?: Record<string, string>;
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
  /** Notebook version / guess check: button label, availability, scene played on success. Wrong versions never end the case. */
  version: { button: LineId; available: Cond; onSolved: SceneId };
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
  /** null when the shell is unavailable (level 3, D03). */
  shell: HintChannel | null;
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
      /** Played once after the first found target (e.g. teaching the replay button). */
      afterFirst: LineId[];
      /** Skill learned together with afterFirst, or null. */
      afterFirstSkill: SkillId | null;
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
      question: Question | null;
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
      question: Question | null;
    }
  | {
      /**
       * Preparatory generic mechanic for cases 2–8 (C2): a sequence of choice steps plus any
       * extra lines the mechanic speaks. Replaced by a dedicated kind when the runtime builds it.
       */
      kind: 'staged';
      mechanic: string;
      description: string;
      steps: { id: string; prompt: LineId | null; pageSize: number; options: ChoiceOption[] }[];
      lines: LineId[];
    }
  | {
      kind: 'baker'; // «Пекарь»: amounts in eighths of a cup (integer units, exactQuantity-style)
      measures: { id: string; label: LineId; units: number }[];
      /** Each pick adds a measure. sum > target → tooMuch, pick undone; a pick outside `ideal` while sum < target → tooLittle. sum = target → next step. */
      steps: { id: string; prompt: LineId; target: number; ideal: string[]; afterWrong: LineId[] }[];
      tooMuch: LineId[];
      tooLittle: LineId[];
    }
  | CipherConfig
  | PostmanConfig
  | SoundMatchConfig
  | LightSignalsConfig
  | ReadBlinkConfig
  | DreamKeeperConfig
  | EqualShareConfig
  | CompareConfig;

/** Choice step shared by tracks, compare and staged. */
export interface ChoiceStep {
  id: string;
  prompt: LineId | null;
  pageSize: number;
  options: ChoiceOption[];
}

export type ButtonShape = 'circle' | 'square' | 'flower' | 'heart';

/** One cell of the postal button cipher (D17, R01: colour is never the only cue). */
export interface CipherGlyph {
  id: string;
  letter: string;
  colour: string; // colour name (also an A art key)
  holes: number; // 1–4
  shape: ButtonShape;
  /** Spoken cell label, e.g. «Синяя круглая пуговица, две дырочки — Д». */
  label: LineId;
}

/** «Шифр на пуговицах» (case 2; later 6 and 8). Each slot offers ≤3 letters; solved letters stay. */
export interface CipherConfig {
  kind: 'cipher';
  table: CipherGlyph[];
  words: {
    id: string;
    /** The word, for validation: the slots' letters must spell it. */
    answer: string;
    slots: { glyph: string; options: string[] }[];
    solved: LineId[];
  }[];
  wrong: LineId[];
  /** Played before the first word (e.g. «пуговицы-двойняшки» on level 3). */
  intro: LineId[];
}

/** «Почтальон» (case 2 finale): house number = sum of the letter's button holes; on level 3 the street comes from the button's icon. */
export interface PostmanConfig {
  kind: 'postman';
  /** Cipher table the buttons come from (minigame ID of a `cipher` in the same pack). */
  cipher: string;
  streets: { id: string; label: LineId; icon: 'honeycomb' | 'leaf' }[] | null;
  /** Which button shape stands for which street (level 3). */
  streetByShape: Partial<Record<ButtonShape, string>> | null;
  letters: {
    id: string;
    label: LineId;
    buttons: string[];
    street: string | null;
    streetOptions: string[] | null;
    house: number;
    houseOptions: number[];
  }[];
  houseLabels: { number: number; label: LineId }[];
  intro: LineId[];
  wrongStreet: LineId[];
  wrongHouse: LineId[];
  correct: LineId[];
}

/**
 * Sound sample: an ID in A's assets/sound-clues/index.json, which is the single source for the audio
 * and its silent visual form (wave, loudness, pitch, length, rhythm; Q31). A guarantees the night
 * card matches the correct option and differs from every distractor.
 */
export type Sample = string;

/** «Услышь разницу» (case 3; later 5 and 8). The target never shows its source name. */
export interface SoundMatchConfig {
  kind: 'sound-match';
  intro: LineId[];
  rounds: {
    id: string;
    target: Sample;
    options: (ChoiceOption & { sample: Sample })[];
    wrong: LineId[];
  }[];
  after: LineId[];
}

export type LightPattern = ('dot' | 'dash')[];

/** «Азбука огоньков» (case 3 finale; game signals, not Morse, D21). `own` (level 3) is the D22 profile signal. */
export interface LightSignalsConfig {
  kind: 'light-signals';
  intro: LineId[];
  signals: { id: string; label: LineId; pattern: LightPattern; correct: LineId[] }[];
  wrong: LineId[];
  own: { min: number; max: number; prompt: LineId[]; done: LineId[] } | null;
}

/** «Прочитай мигание» (case 3, level 3): match the mice's drawing to a lesson of the book. */
export interface ReadBlinkConfig {
  kind: 'read-blink';
  drawing: LightPattern;
  lessons: (ChoiceOption & { pattern: LightPattern })[];
  wrong: LineId[];
}

export interface DreamCard {
  id: string;
  /** Spoken description of the dream picture (never names the answer, Q33). Its line is `private`. */
  label: LineId;
  /** A art asset ID of the dream card. */
  image: string;
  /** Truthful answer to each family yes/no question (T31): the game answers, the Keeper never has to. */
  facts: Record<string, boolean>;
}

/**
 * «Хранитель снов» (case 4, D16). Solo: Пухлик shows the cards of a round in order; the child picks the
 * axis value in the notebook (paged by 3); a wrong pick shows the next card. Family (T31): the Keeper
 * picks 1 of the round's first 3 cards; the others may ask one yes/no question per round, answered
 * from the chosen card's `facts`. Card faces and their lines are never shown or voiced outside the
 * Keeper's own screen.
 */
export interface DreamKeeperConfig {
  kind: 'dream-keeper';
  intro: LineId[];
  rounds: {
    id: string;
    axis: string;
    answer: string;
    cards: DreamCard[];
    correct: LineId[];
    wrong: LineId[];
  }[];
  after: LineId[];
  family: {
    intro: LineId[];
    keeperPick: LineId[];
    ask: LineId[];
    win: LineId[];
    /** Fixed player names (no typing); the child is the current profile. */
    players: { id: string; label: LineId }[];
    questions: { id: string; label: LineId }[];
    /** Contribution titles (Q36): one per player, no ranking. */
    titles: { id: string; label: LineId; for: 'keeper' | 'asker' | 'guesser' }[];
  };
}

/** «Раздели поровну» (case 4 finale). Tap or drag with an alternative; no timer. */
export interface EqualShareConfig {
  kind: 'equal-share';
  intro: LineId[];
  tasks: {
    id: string;
    prompt: LineId;
    items: number;
    groups: number;
    /** Items deliberately kept aside (level 3 «запас»). */
    reserve: number;
    itemLabel: LineId;
    groupLabel: LineId;
    correct: LineId[];
  }[];
  uneven: LineId[];
}

/** «Чья тележка?» and similar side-by-side comparisons. */
export interface CompareConfig {
  kind: 'compare';
  subject: { label: LineId; image: string };
  steps: ChoiceStep[];
  question: Question | null;
}

/** Closing question: wrong options reply and stay; the correct option completes. */
export interface Question {
  prompt: LineId;
  options: ChoiceOption[];
}

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

/** Engine-played cutscene (T25): an aegis-cutscene/1 document (@aegis/browser/animation). */
export interface Cutscene {
  id: string;
  scene: SceneId;
  summary: string;
  /** Lines name this pack's line IDs; the narration pack is the content pack. advance is always input. */
  document: CutsceneFile;
}

// ---------------------------------------------------------------- pack

export interface ContentPack {
  format: typeof PACK_FORMAT;
  schema: typeof PACK_SCHEMA;
  id: PackId;
  /** sha256 of the canonical pack body. */
  revision: string;
  kind: 'shared' | 'prologue' | 'case' | 'cozy';
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
  /** Editorial plan for cutscenes not yet authored (preview packs only); never played. */
  plannedCutscenes: { id: string; scene: SceneId; summary: string }[];
  /** Notebook pages this pack unlocks (T26): «Тайные заметки», the postal cipher poster. */
  notebookPages: NotebookPage[];
  /** Cozy day (kind "cozy" only): residents' stories, shop, decor slots, ranks (T28, T29, D12). */
  cozy: CozyDay | null;
  /** Lines owned by systems not modelled by the step language yet (family mode, …); still validated and voiced. */
  reserved: { lines: LineId[]; reason: string }[];
}

/** A notebook page that persists across cases once unlocked (T26). */
export interface NotebookPage {
  id: string;
  kind: 'secret-notes' | 'cipher-poster' | 'symbol-cards';
  title: LineId;
  /** Unlocked when this reward is granted. */
  unlock: string;
  /** cipher-poster: the `cipher` minigame whose table it shows. */
  cipher: string | null;
}

/** «Уютный денёк» (D23, T12, T28, T29) and ranks (D12). */
export interface CozyDay {
  residents: {
    speaker: SpeakerId;
    /** Available after this case is solved at any level (0 = after the prologue). */
    unlockAfter: number;
    invite: LineId;
    /** Tea-party stories, each 3–5 lines (T28). One tea plays the next untold story, then they repeat. */
    stories: LineId[][];
    /** Hearts spent on the tea party (T11). */
    teaPrice: number;
  }[];
  shop: ShopItem[];
  decorSlots: { id: string; label: LineId }[];
  ranks: { id: string; label: LineId; afterCase: number; message: LineId[]; reward: string | null }[];
  lines: { intro: LineId[]; bought: LineId[]; returned: LineId[]; notEnough: LineId[]; teaThanks: LineId[] };
}

export interface ShopItem {
  id: string;
  kind: 'hat' | 'scarf-pattern' | 'decor';
  label: LineId;
  /** A asset or accessory rig ID. */
  asset: string;
  price: { currency: 'buttons' | 'hearts'; amount: number };
  /** Available after this case is solved at any level. */
  unlockAfter: number;
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
  delivery: Delivery;
  note: string;
  packs: PackId[];
  /** Present when an earlier entry has the same speaker and ttsText: reuse that recording. */
  sameAudioAs?: LineId;
}

export interface VoiceManifest {
  format: typeof MANIFEST_FORMAT;
  schema: 1;
  packs: Record<PackId, string>;
  lexicon: { word: string; hint: string; ipa?: string }[];
  speakers: Speaker[];
  entries: ManifestEntry[];
}
