// The authoritative Fluffy Bureau runtime adapter on @aegis/runtime.
import {
  createMinigame,
  createNotebook,
  reduceMinigame,
  restoreMinigame,
  restoreNotebook,
  setNotebookMark,
  type MinigameRegistry,
  type NotebookMark,
  type NotebookState,
} from '@aegis/narrative';
import {
  dataHash,
  failure,
  isRecord,
  requireValue,
  schema,
  success,
  type ContentPack,
  type ContentRegistration,
  type RuntimeAdapter,
  type Schema,
  type TransitionContext,
} from '@aegis/runtime';
import {
  caseOfPack,
  lineOf,
  minigameOf,
  sceneOf,
  type Cond,
  type ContentIndex,
  type FluffyPack,
  type PackIndex,
  type PackLibrary,
} from './content.js';
import {
  currentStep,
  enter,
  evaluate,
  proceed,
  rebaseRun,
  selectStep,
  settle,
  startRun,
  visibleOptions,
  type AwaitAction,
  type Effects,
} from './interpreter.js';
import {
  createFluffyMinigames,
  initialFeedback,
  lastFeedback,
  minigameDefinition,
} from './minigames.js';
import {
  DEFAULT_NAME,
  SCARVES,
  SPECIES,
  initialProfile,
  isValidName,
  rankOf,
  type ProfileState,
  type QueueSource,
  type RunState,
  type Scarf,
  type Species,
} from './state.js';
import { projectProfile, type GameView } from './view.js';
import { buy, canAfford, itemOf, newRank, refund, seeRank, tea, wear } from './cozy.js';

export const GAME_ID = 'fluffy-bureau';
export const STATE_VERSION = 1;
export const SHARED_PACK = 'shared';
export const COZY_PACK = 'cozy';

export type Mark = 'confirmed' | 'excluded' | 'unknown';

export type GameAction =
  | { type: 'avatar.species'; value: Species }
  | { type: 'avatar.name'; value: string | null }
  | { type: 'avatar.scarf'; value: Scarf }
  | { type: 'start'; pack: string }
  | { type: 'next' }
  | { type: 'choose'; option: string }
  | { type: 'back' }
  | { type: 'move'; value: JsonValue }
  | { type: 'mark'; axis: string; value: string; mark: Mark | 'none' }
  | { type: 'help' }
  | { type: 'accept'; axis: string; value: string }
  | { type: 'hint'; channel: 'klubok' | 'shell' }
  | { type: 'version'; selection: Record<string, string> }
  | { type: 'lamp'; on: boolean }
  | { type: 'await'; action: AwaitAction }
  | { type: 'tap'; hotspot: string }
  | { type: 'buy'; item: string }
  | { type: 'refund'; item: string }
  | { type: 'wear'; item: string; on: boolean }
  | { type: 'tea'; speaker: string }
  | { type: 'office-next' }
  | { type: 'rank-seen'; rank: string }
  | { type: 'decor'; item: string; slot: string }
  | { type: 'leave' }
  | { type: 'cutscene'; outcome: 'completed' | 'skipped' }
  | { type: 'cutscene-marker'; marker: string }
  | { type: 'import'; state: JsonValue };

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

const id = schema.string({ maxLength: 128 });
const json = schema.json as Schema<JsonValue>;
const actionSchema: Schema<GameAction> = schema.union(
  schema.object({
    type: schema.literal('avatar.species'),
    value: schema.union(...SPECIES.map((s) => schema.literal(s))),
  }),
  schema.object({
    type: schema.literal('avatar.name'),
    value: schema.union(schema.literal(null), schema.string({ maxLength: 40 })),
  }),
  schema.object({
    type: schema.literal('avatar.scarf'),
    value: schema.union(...SCARVES.map((s) => schema.literal(s))),
  }),
  schema.object({ type: schema.literal('start'), pack: id }),
  schema.object({ type: schema.literal('next') }),
  schema.object({ type: schema.literal('choose'), option: id }),
  schema.object({ type: schema.literal('back') }),
  schema.object({ type: schema.literal('move'), value: json }),
  schema.object({
    type: schema.literal('mark'),
    axis: id,
    value: id,
    mark: schema.union(
      schema.literal('confirmed'),
      schema.literal('excluded'),
      schema.literal('unknown'),
      schema.literal('none'),
    ),
  }),
  schema.object({ type: schema.literal('help') }),
  schema.object({ type: schema.literal('accept'), axis: id, value: id }),
  schema.object({
    type: schema.literal('hint'),
    channel: schema.union(schema.literal('klubok'), schema.literal('shell')),
  }),
  schema.object({ type: schema.literal('version'), selection: schema.record(id) }),
  schema.object({ type: schema.literal('lamp'), on: schema.boolean }),
  schema.object({
    type: schema.literal('await'),
    action: schema.union(
      schema.literal('avatar.species'),
      schema.literal('avatar.name'),
      schema.literal('avatar.scarf'),
      schema.literal('lamp.on'),
      schema.literal('lamp.off'),
      schema.literal('replay'),
      schema.literal('notebook.open'),
      schema.literal('pause'),
      schema.literal('office.place'),
    ),
  }),
  schema.object({ type: schema.literal('tap'), hotspot: id }),
  schema.object({ type: schema.literal('buy'), item: id }),
  schema.object({ type: schema.literal('refund'), item: id }),
  schema.object({ type: schema.literal('wear'), item: id, on: schema.boolean }),
  schema.object({ type: schema.literal('tea'), speaker: id }),
  schema.object({ type: schema.literal('office-next') }),
  schema.object({ type: schema.literal('rank-seen'), rank: id }),
  schema.object({ type: schema.literal('decor'), item: id, slot: id }),
  schema.object({ type: schema.literal('leave') }),
  schema.object({
    type: schema.literal('cutscene'),
    outcome: schema.union(schema.literal('completed'), schema.literal('skipped')),
  }),
  schema.object({ type: schema.literal('cutscene-marker'), marker: id }),
  schema.object({ type: schema.literal('import'), state: json }),
) as Schema<GameAction>;

/** Fixed decoration slots of the office (T12). */
export const OFFICE_SLOTS = ['shelf', 'window', 'table'] as const;

export interface GameRules {
  library: PackLibrary;
  registry: MinigameRegistry;
  registration: ContentRegistration<ContentIndex>;
  pack(index: ContentIndex, packId: string): PackIndex;
  shared(index: ContentIndex): PackIndex | undefined;
  /** The «Уютный денёк» pack (Stage 2), if this build carries it. */
  cozy(index: ContentIndex): PackIndex | undefined;
}

export function createRules(library: PackLibrary): GameRules {
  const registry = createFluffyMinigames();
  const refSchema = schema.object({ id, revision: schema.string({ maxLength: 128 }) });
  const registration: ContentRegistration<ContentIndex> = {
    schemaVersion: 1,
    schema: schema.object({ packs: schema.array(refSchema, { max: 64 }) }),
    validate: (data) =>
      data.packs
        .filter((ref) => !library.has(ref))
        .map((ref) => ({
          code: 'missing-pack',
          message: `Content pack ${ref.id}@${ref.revision} is unavailable`,
          recordId: ref.id,
        })),
  };
  const find = (index: ContentIndex, packId: string) => {
    const ref = index.packs.find((p) => p.id === packId);
    if (!ref) throw new Error(`Pack ${packId} is not part of this content`);
    return library.get(ref);
  };
  return {
    library,
    registry,
    registration,
    pack: find,
    shared: (index) =>
      index.packs.some((p) => p.id === SHARED_PACK) ? find(index, SHARED_PACK) : undefined,
    cozy: (index) =>
      index.packs.some((p) => p.id === COZY_PACK) ? find(index, COZY_PACK) : undefined,
  };
}

export function contentPackFor(library: PackLibrary): ContentPack<ContentIndex> {
  const data = library.index();
  return {
    id: 'fluffy-bureau-content',
    revision:
      'c-' +
      dataHash(data)
        .replace(/[^A-Za-z0-9]/g, '')
        .slice(0, 32),
    schemaVersion: 1,
    data,
  };
}

// ---------------------------------------------------------------- state validation

function stringList(value: unknown, max = 4096): string[] {
  if (!Array.isArray(value) || value.length > max || value.some((v) => typeof v !== 'string'))
    throw new Error('Invalid string list');
  return [...(value as string[])];
}

export function parseProfile(value: unknown, rules: GameRules, index: ContentIndex): ProfileState {
  if (!isRecord(value) || value.v !== 1) throw new Error('Unsupported profile state');
  const base = initialProfile();
  const avatar = value.avatar;
  if (!isRecord(avatar)) throw new Error('Invalid avatar');
  const species = avatar.species;
  const scarf = avatar.scarf;
  if (species !== null && !SPECIES.includes(species as Species)) throw new Error('Bad species');
  if (scarf !== null && !SCARVES.includes(scarf as Scarf)) throw new Error('Bad scarf');
  if (
    typeof avatar.name !== 'string' ||
    !(avatar.name === DEFAULT_NAME || isValidName(avatar.name))
  )
    throw new Error('Bad name');
  if (avatar.hat !== null && typeof avatar.hat !== 'string') throw new Error('Bad hat');
  const count = (v: unknown) => {
    if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 0) throw new Error('Bad counter');
    return v;
  };
  if (!Array.isArray(value.decor)) throw new Error('Bad decor');
  const decor = value.decor.map((d) => {
    if (!isRecord(d) || typeof d.item !== 'string' || typeof d.slot !== 'string')
      throw new Error('Bad decor');
    return { item: d.item, slot: d.slot };
  });
  if (typeof value.lamp !== 'boolean') throw new Error('Bad lamp');
  // Stage 2 fields: absent in Stage 1 saves (v0.1.0), which stay valid without migration.
  const full: Record<string, unknown> = {
    ...{ owned: [], pattern: null, teas: [], signal: null, ranksSeen: [], office: [] },
    ...value,
  };
  if (full.pattern !== null && typeof full.pattern !== 'string') throw new Error('Bad pattern');
  if (!Array.isArray(full.teas)) throw new Error('Bad teas');
  const teas = full.teas.map((t) => {
    if (!isRecord(t) || typeof t.speaker !== 'string' || typeof t.told !== 'number')
      throw new Error('Bad teas');
    return { speaker: t.speaker, told: t.told };
  });
  const signal =
    full.signal === null
      ? null
      : stringList(full.signal, 8).map((s) => {
          if (s !== 'dot' && s !== 'dash') throw new Error('Bad signal');
          return s;
        });
  const profile: ProfileState = {
    ...base,
    avatar: {
      species: species as Species | null,
      name: avatar.name,
      scarf: scarf as Scarf | null,
      hat: (avatar.hat as string | null) ?? null,
    },
    skills: stringList(value.skills),
    buttons: count(value.buttons),
    hearts: count(value.hearts),
    claimed: stringList(value.claimed),
    rewards: stringList(value.rewards),
    decor,
    facts: stringList(value.facts),
    glossary: stringList(value.glossary),
    collections: stringList(value.collections),
    completed: stringList(value.completed),
    lamp: value.lamp,
    owned: stringList(full.owned),
    pattern: full.pattern as string | null,
    teas,
    signal,
    ranksSeen: stringList(full.ranksSeen),
    office: stringList(full.office, 64),
    runs: count(value.runs),
    run: value.run === null ? null : parseRun(value.run, rules, index),
  };
  const keys = Object.keys(base).sort().join();
  if (Object.keys(full).sort().join() !== keys) throw new Error('Unexpected profile fields');
  return profile;
}

function parseRun(value: unknown, rules: GameRules, contentIndex: ContentIndex): RunState {
  if (!isRecord(value)) throw new Error('Invalid run');
  const { pack, packRevision, scene } = value;
  if (typeof pack !== 'string' || typeof packRevision !== 'string' || typeof scene !== 'string')
    throw new Error('Invalid run identity');
  const index = rules.pack(contentIndex, pack);
  if (index.pack.revision !== packRevision) throw new Error('Run is bound to another revision');
  sceneOf(index, scene);
  if (!Array.isArray(value.cursor) || value.cursor.length < 1 || value.cursor.length > 32)
    throw new Error('Invalid cursor');
  const cursor = value.cursor.map((segment) => {
    if (
      !isRecord(segment) ||
      typeof segment.i !== 'number' ||
      !Number.isSafeInteger(segment.i) ||
      segment.i < 0 ||
      !(segment.b === null || ['then', 'else', 'first', 'known'].includes(segment.b as string))
    )
      throw new Error('Invalid cursor segment');
    return { i: segment.i, b: segment.b as RunState['cursor'][number]['b'] };
  });
  if (!Array.isArray(value.queue)) throw new Error('Invalid queue');
  const shared = rules.shared(contentIndex);
  const queue = value.queue.map((item) => {
    if (!isRecord(item) || typeof item.line !== 'string' || typeof item.source !== 'string')
      throw new Error('Invalid queued line');
    lineOf(index, item.line, shared);
    return { line: item.line, source: item.source as QueueSource };
  });
  const clues = stringList(value.clues, 64);
  const deduction = index.pack.deduction;
  const revealed = deductionClues(index, clues);
  const notebook =
    value.notebook === null
      ? null
      : deduction
        ? restoreNotebook(deduction, value.notebook, revealed)
        : (() => {
            throw new Error('Notebook without deduction');
          })();
  let minigame = null;
  if (value.minigame !== null) {
    if (!isRecord(value.minigame) || typeof value.minigame.definitionId !== 'string')
      throw new Error('Invalid minigame');
    const game = minigameOf(index, value.minigame.definitionId);
    minigame = restoreMinigame(
      minigameDefinition(game, index.pack.revision),
      value.minigame,
      rules.registry,
    );
  }
  if (!Array.isArray(value.suggestions)) throw new Error('Invalid suggestions');
  const run: RunState = {
    pack,
    packRevision,
    scene,
    cursor,
    queue,
    visited: stringList(value.visited, 256),
    flags: stringList(value.flags, 512),
    clues,
    notebook,
    klubokUsed: Number(value.klubokUsed),
    hintsUsed: stringList(value.hintsUsed, 256),
    minigame,
    minigameCount: Number(value.minigameCount),
    suggestions: value.suggestions.map((s) => {
      if (
        !isRecord(s) ||
        typeof s.axis !== 'string' ||
        typeof s.value !== 'string' ||
        (s.mark !== 'confirmed' && s.mark !== 'excluded') ||
        typeof s.line !== 'string'
      )
        throw new Error('Invalid suggestion');
      return {
        axis: s.axis,
        value: s.value,
        mark: s.mark,
        clues: stringList(s.clues, 16),
        line: s.line,
      };
    }),
    versionAttempts: Number(value.versionAttempts),
    cutsceneMarker:
      value.cutsceneMarker === undefined || value.cutsceneMarker === null
        ? null
        : String(value.cutsceneMarker),
    stage: stringList(value.stage, 256),
    ended: value.ended === true,
  };
  for (const n of [run.klubokUsed, run.minigameCount, run.versionAttempts])
    if (!Number.isSafeInteger(n) || n < 0) throw new Error('Invalid run counter');
  // The cursor must address a real step (or a list end awaiting exit).
  currentStep(index, run);
  return run;
}

/** Only clues declared in the @aegis/narrative deduction may be cited as evidence. */
function deductionClues(index: PackIndex, clues: readonly string[]): string[] {
  const declared = new Set(index.pack.deduction?.clues.map((c) => c.id) ?? []);
  return clues.filter((c) => declared.has(c));
}

// ---------------------------------------------------------------- adapter

type Ctx = TransitionContext<ProfileState, ContentIndex>;

export function createGameAdapter(
  rules: GameRules,
  contentIndex: ContentIndex,
): RuntimeAdapter<ProfileState, GameAction, GameView, ContentIndex> {
  const stateSchema: Schema<ProfileState> = {
    parse(value) {
      try {
        return success(parseProfile(value, rules, contentIndex));
      } catch (error) {
        return failure('invalid-profile', error instanceof Error ? error.message : String(error));
      }
    },
  };

  const effectsFor = (context: Ctx, index: PackIndex): Effects => ({
    learnSkill(skill) {
      if (!context.state.skills.includes(skill)) context.state.skills.push(skill);
    },
    grantReward(rewardId) {
      const reward =
        index.pack.rewards.find((r) => r.id === rewardId) ??
        rules
          .shared(context.content.data as ContentIndex)
          ?.pack.rewards.find((r) => r.id === rewardId);
      if (!reward) throw new Error(`Unknown reward ${rewardId}`);
      const profile = context.state;
      if (profile.claimed.includes(reward.claimKey)) return;
      profile.claimed.push(reward.claimKey);
      context.claim(`reward:${reward.claimKey}`);
      if (reward.kind === 'buttons') profile.buttons += reward.amount;
      else if (reward.kind === 'hearts') profile.hearts += reward.amount;
      else if (!profile.rewards.includes(reward.id)) profile.rewards.push(reward.id);
    },
    reachEnd() {
      const profile = context.state;
      if (!profile.completed.includes(index.pack.id)) profile.completed.push(index.pack.id);
      for (const fact of index.pack.facts)
        if (!profile.facts.includes(fact.id)) profile.facts.push(fact.id);
      for (const entry of index.pack.glossary)
        if (!profile.glossary.includes(entry.id)) profile.glossary.push(entry.id);
    },
  });

  const requireCozy = (context: Ctx) => {
    if (context.state.run) throw new Error('The cozy day is in the office, not during a case');
    const cozy = rules.cozy(context.content.data as ContentIndex)?.pack.cozy;
    if (!cozy) throw new Error('No cozy day in this build');
    return cozy;
  };

  const requireRun = (context: Ctx) => {
    const run = context.state.run;
    if (!run) throw new Error('No case is running');
    const index = rules.pack(context.content.data as ContentIndex, run.pack);
    return { run, index, effects: effectsFor(context, index) };
  };

  const requireIdle = (run: RunState) => {
    if (run.queue.length) throw new Error('Finish the current lines first');
  };

  /** Create the minigame instance when the cursor reaches a minigame step. */
  const syncMinigame = (run: RunState, index: PackIndex, runs: number) => {
    const step = currentStep(index, run);
    if (step?.t !== 'minigame' || run.minigame) return;
    if (run.flags.includes(`minigame:${step.minigame}`)) return;
    const game = minigameOf(index, step.minigame);
    run.minigameCount++;
    run.minigame = createMinigame(
      minigameDefinition(game, index.pack.revision),
      `r${runs}:${run.pack}:${game.id}:${run.minigameCount}`,
      rules.registry,
    );
    for (const line of initialFeedback(game.config)) run.queue.push({ line, source: 'feedback' });
  };

  const ensureNotebook = (run: RunState, index: PackIndex) => {
    if (!run.notebook && index.pack.deduction) run.notebook = createNotebook(index.pack.deduction);
  };

  const settleRun = (context: Ctx, run: RunState, index: PackIndex) => {
    settle(index, run, context.state, effectsFor(context, index));
    syncMinigame(run, index, context.state.runs);
  };

  const advance = (context: Ctx, run: RunState, index: PackIndex) => {
    proceed(index, run, context.state, effectsFor(context, index));
    syncMinigame(run, index, context.state.runs);
  };

  /** Hub scenes are re-evaluated whenever their inputs may have changed (SCHEMA.md). */
  const reevaluateHub = (context: Ctx, run: RunState, index: PackIndex) => {
    if (run.queue.length || currentStep(index, run)?.t !== 'menu') return;
    if (sceneOf(index, run.scene).presentation !== 'hub') return;
    run.cursor = [{ i: 0, b: null }];
    settleRun(context, run, index);
  };

  const queue = (run: RunState, lines: readonly string[], source: QueueSource) => {
    for (const line of lines) run.queue.push({ line, source });
  };

  const setMark = (
    run: RunState,
    index: PackIndex,
    axis: string,
    value: string,
    mark: Mark | 'none',
    evidence: string[] | null,
  ) => {
    const deduction = index.pack.deduction;
    if (!deduction) throw new Error('This pack has no notebook');
    ensureNotebook(run, index);
    const notebook = run.notebook as NotebookState;
    const revealed = deductionClues(index, run.clues);
    if (!deduction.axes.some((a) => a.id === axis && a.values.includes(value)))
      throw new Error('Unknown notebook cell');
    if (mark === 'none') {
      run.notebook = restoreNotebook(
        deduction,
        { ...notebook, marks: notebook.marks.filter((m) => m.axis !== axis || m.value !== value) },
        revealed,
      );
      return;
    }
    const input: NotebookMark = evidence
      ? { axis, value, mark, source: 'evidence', clueIds: evidence }
      : { axis, value, mark, source: 'user', clueIds: [] };
    run.notebook = setNotebookMark(deduction, notebook, revealed, input, 'replace-user');
  };

  const commands: Record<GameAction['type'], (context: Ctx, action: never) => void> = {
    'avatar.species': (context, action: { value: Species }) => {
      context.state.avatar.species = action.value;
      resolveAwait(context, 'avatar.species');
    },
    'avatar.name': (context, action: { value: string | null }) => {
      const name = action.value === null ? DEFAULT_NAME : action.value.trim();
      if (name !== DEFAULT_NAME && !isValidName(name)) throw new Error('Name must be one word');
      context.state.avatar.name = name;
      resolveAwait(context, 'avatar.name');
    },
    'avatar.scarf': (context, action: { value: Scarf }) => {
      context.state.avatar.scarf = action.value;
      resolveAwait(context, 'avatar.scarf');
    },
    start: (context, action: { pack: string }) => {
      const contentIndex = context.content.data as ContentIndex;
      const index = rules.pack(contentIndex, action.pack);
      const profile = context.state;
      const current = profile.run;
      const target = caseOfPack(action.pack);
      if (current && !current.ended && caseOfPack(current.pack).caseId !== target.caseId)
        throw new Error('Another case is in progress');
      if (!isUnlocked(profile, action.pack, contentIndex)) throw new Error('Pack is locked');
      profile.runs++;
      profile.run = startRun(index, profile, effectsFor(context, index));
      ensureNotebook(profile.run, index);
      syncMinigame(profile.run, index, profile.runs);
    },
    next: (context) => {
      const { run, index } = requireRun(context);
      if (run.queue.length) {
        run.queue.shift();
        return;
      }
      selectStep(currentStep(index, run), 'line');
      advance(context, run, index);
    },
    choose: (context, action: { option: string }) => {
      const { run, index } = requireRun(context);
      requireIdle(run);
      const menu = selectStep(currentStep(index, run), 'menu');
      const option = visibleOptions(menu, run, context.state).find((o) => o.id === action.option);
      if (!option) throw new Error('Option is not available');
      run.scene = option.to;
      run.cursor = [{ i: 0, b: null }];
      run.stage = [];
      if (!run.visited.includes(option.to)) run.visited.push(option.to);
      settleRun(context, run, index);
    },
    back: (context) => {
      const { run, index } = requireRun(context);
      requireIdle(run);
      const menu = selectStep(currentStep(index, run), 'menu');
      if (!menu.back) throw new Error('This menu has no way back');
      enter(run, menu.back);
      settleRun(context, run, index);
    },
    move: (context, action: { value: JsonValue }) => {
      const { run, index } = requireRun(context);
      requireIdle(run);
      const step = selectStep(currentStep(index, run), 'minigame');
      const state = run.minigame;
      if (!state || state.definitionId !== step.minigame) throw new Error('Minigame not active');
      const game = minigameOf(index, step.minigame);
      const definition = minigameDefinition(game, index.pack.revision);
      const next = reduceMinigame(
        definition,
        state,
        { type: 'move', revision: state.revision, value: action.value },
        rules.registry,
      );
      queue(run, lastFeedback(next.progress), 'feedback');
      if (game.config.kind === 'magnifier' && game.config.afterFirstSkill) {
        const found = (next.progress as { found?: unknown[] }).found ?? [];
        if (found.length === 1 && !context.state.skills.includes(game.config.afterFirstSkill))
          context.state.skills.push(game.config.afterFirstSkill);
      }
      if (next.status === 'completed' && next.result) {
        if (!context.claim(next.result.id)) throw new Error('Minigame result already consumed');
        // D22: the child's own light signal (case 3, level 3) belongs to the profile.
        const own = (next.progress as { own?: unknown }).own;
        if (game.config.kind === 'light-signals' && Array.isArray(own) && own.length)
          context.state.signal = own.filter(
            (s): s is 'dot' | 'dash' => s === 'dot' || s === 'dash',
          );
        run.flags.push(`minigame:${game.id}`);
        run.minigame = null;
        advance(context, run, index);
      } else {
        run.minigame = next;
      }
    },
    mark: (context, action: { axis: string; value: string; mark: Mark | 'none' }) => {
      const { run, index } = requireRun(context);
      setMark(run, index, action.axis, action.value, action.mark, null);
      run.suggestions = run.suggestions.filter(
        (s) => s.axis !== action.axis || s.value !== action.value,
      );
      reevaluateHub(context, run, index);
    },
    help: (context) => {
      const { run, index } = requireRun(context);
      requireIdle(run);
      const help = index.pack.notebookHelp;
      if (!help) throw new Error('No notebook help in this pack');
      ensureNotebook(run, index);
      const marks = run.notebook?.marks ?? [];
      const open = help.marks.filter(
        (rule) =>
          rule.clues.every((c) => run.clues.includes(c)) &&
          !marks.some(
            (m) => m.axis === rule.axis && m.value === rule.value && m.mark === rule.mark,
          ),
      );
      if (help.mode === 'suggest') {
        run.suggestions = open.map((rule) => ({ ...rule, clues: [...rule.clues] }));
        queue(run, open[0] ? [open[0].line] : [help.nothing], 'help');
      } else {
        run.suggestions = [];
        const pointer = open
          .flatMap((rule) => rule.clues)
          .map((clue) => help.pointers.find((p) => p.clue === clue))
          .find(Boolean);
        queue(run, [pointer ? pointer.line : help.nothing], 'help');
      }
    },
    accept: (context, action: { axis: string; value: string }) => {
      const { run, index } = requireRun(context);
      const suggestion = run.suggestions.find(
        (s) => s.axis === action.axis && s.value === action.value,
      );
      if (!suggestion) throw new Error('No such suggestion');
      const clues = index.pack.deduction?.clues ?? [];
      const declared = new Set(clues.map((c) => c.id));
      let evidence: string[] | null = null;
      if (suggestion.clues.every((c) => declared.has(c))) {
        // Evidence citations must be closed under the deduction's reveal prerequisites.
        const closed = new Set<string>();
        const add = (id: string) => {
          if (closed.has(id)) return;
          closed.add(id);
          for (const req of clues.find((c) => c.id === id)?.requires ?? []) add(req);
        };
        suggestion.clues.forEach(add);
        evidence = clues.map((c) => c.id).filter((id) => closed.has(id));
      }
      setMark(run, index, suggestion.axis, suggestion.value, suggestion.mark, evidence);
      run.suggestions = run.suggestions.filter((s) => s !== suggestion);
      reevaluateHub(context, run, index);
    },
    hint: (context, action: { channel: 'klubok' | 'shell' }) => {
      const { run, index } = requireRun(context);
      requireIdle(run);
      const channel = index.pack.hints?.[action.channel];
      if (!channel) throw new Error('This hint channel is not available');
      const applicable = channel.rules.filter(
        (rule) =>
          evaluate(rule.when, run, context.state) && rule.cites.every((c) => run.clues.includes(c)),
      );
      if (action.channel === 'shell') {
        queue(run, [applicable[0]?.id ?? channel.review], 'hint');
        return;
      }
      const fresh = applicable.find((rule) => !run.hintsUsed.includes(rule.id));
      if (!fresh) {
        queue(run, [channel.review], 'hint');
        return;
      }
      if (channel.allowance !== null && run.klubokUsed >= channel.allowance) {
        queue(run, [channel.exhausted ?? channel.review], 'hint');
        return;
      }
      run.klubokUsed++;
      run.hintsUsed.push(fresh.id);
      queue(run, [fresh.id], 'hint');
    },
    version: (context, action: { selection: Record<string, string> }) => {
      const { run, index } = requireRun(context);
      requireIdle(run);
      const logic = index.pack.logic;
      if (!logic) throw new Error('No case logic');
      if (currentStep(index, run)?.t !== 'menu') throw new Error('Versions are checked from a hub');
      if (!evaluate(logic.version.available, run, context.state))
        throw new Error('Collect the clues first');
      for (const axis of logic.axes) {
        const value = action.selection[axis.id];
        if (!value || !axis.values.some((v) => v.id === value))
          throw new Error('Choose one card in every column');
      }
      run.versionAttempts++;
      const wrongAxis = logic.axes.find(
        (axis) => action.selection[axis.id] !== logic.intended[axis.id],
      );
      if (!wrongAxis) {
        if (!run.flags.includes('version:solved')) run.flags.push('version:solved');
        enter(run, logic.version.onSolved);
        settleRun(context, run, index);
        return;
      }
      const pick = (lines: readonly { line: string; when: Cond | null }[]) =>
        lines.filter((l) => evaluate(l.when, run, context.state)).map((l) => l.line);
      const wrong = logic.wrongVersion.byValue.find(
        (w) => w.axis === wrongAxis.id && w.value === action.selection[wrongAxis.id],
      );
      queue(
        run,
        [
          ...pick(logic.wrongVersion.intro),
          ...(wrong ? pick(wrong.lines) : []),
          ...pick(logic.wrongVersion.outro),
        ],
        'version',
      );
    },
    lamp: (context, action: { on: boolean }) => {
      const profile = context.state;
      profile.lamp = action.on;
      const run = profile.run;
      if (!run) return;
      const index = rules.pack(context.content.data as ContentIndex, run.pack);
      const step = currentStep(index, run);
      if (step?.t === 'await' && step.action === (action.on ? 'lamp.on' : 'lamp.off')) {
        advance(context, run, index);
        return;
      }
      if (action.on && !run.queue.some((q) => q.source === 'comfort')) {
        const comfort =
          index.pack.comfort.find((c) => c.scene === run.scene) ??
          index.pack.comfort.find((c) => c.scene === '*');
        if (comfort) queue(run, [comfort.line], 'comfort');
      }
    },
    await: (context, action: { action: AwaitAction }) => {
      if (
        action.action.startsWith('avatar.') ||
        action.action.startsWith('lamp.') ||
        action.action === 'office.place' ||
        action.action === 'hotspot'
      )
        throw new Error('This step is completed by its own command');
      resolveAwait(context, action.action, true);
    },
    // U11: the child taps the named hotspot of the current background (e.g. the shed window).
    tap: (context, action: { hotspot: string }) => {
      const { run, index } = requireRun(context);
      requireIdle(run);
      const step = selectStep(currentStep(index, run), 'await');
      if (step.action !== 'hotspot' || step.hotspot !== action.hotspot)
        throw new Error('Nothing is waiting for this hotspot');
      advance(context, run, index);
    },
    // «Уютный денёк» (T28, T29, D12): only in the office, never during a case.
    buy: (context, action: { item: string }) => {
      const cozy = requireCozy(context);
      const profile = context.state;
      const item = itemOf(cozy, action.item);
      if (!canAfford(profile, item)) {
        profile.office = [...cozy.lines.notEnough];
        return;
      }
      buy(profile, cozy, action.item);
      profile.office = [...cozy.lines.bought];
    },
    refund: (context, action: { item: string }) => {
      const cozy = requireCozy(context);
      refund(context.state, cozy, action.item);
      context.state.office = [...cozy.lines.returned];
    },
    wear: (context, action: { item: string; on: boolean }) => {
      wear(context.state, requireCozy(context), action.item, action.on);
    },
    tea: (context, action: { speaker: string }) => {
      const cozy = requireCozy(context);
      const profile = context.state;
      const resident = cozy.residents.find((r) => r.speaker === action.speaker);
      if (resident && profile.hearts < resident.teaPrice) {
        profile.office = [...cozy.lines.notEnough];
        return;
      }
      profile.office = tea(profile, cozy, action.speaker);
    },
    'office-next': (context) => {
      if (!context.state.office.length) throw new Error('Nothing is playing');
      context.state.office = context.state.office.slice(1);
    },
    'rank-seen': (context, action: { rank: string }) => {
      const cozy = rules.cozy(context.content.data as ContentIndex)?.pack.cozy ?? null;
      const rank = newRank(context.state, cozy);
      if (!rank || rank.id !== action.rank || !cozy) throw new Error('No new rank');
      seeRank(context.state, cozy, rank.id);
    },
    decor: (context, action: { item: string; slot: string }) => {
      const profile = context.state;
      if (!profile.rewards.includes(action.item) && !profile.owned.includes(action.item))
        throw new Error('Decoration not owned');
      const cozy = rules.cozy(context.content.data as ContentIndex)?.pack.cozy;
      const slots = cozy ? cozy.decorSlots.map((s) => s.id) : [...OFFICE_SLOTS];
      if (!slots.includes(action.slot)) throw new Error('No slot');
      profile.decor = profile.decor.filter((d) => d.item !== action.item && d.slot !== action.slot);
      profile.decor.push({ item: action.item, slot: action.slot });
      resolveAwait(context, 'office.place');
    },
    cutscene: (context, action: { outcome: 'completed' | 'skipped' }) => {
      const { run, index } = requireRun(context);
      requireIdle(run);
      const step = selectStep(currentStep(index, run), 'cutscene');
      // Presentation only: finishing or skipping never grants anything by itself (effects are steps).
      run.flags.push(`cutscene:${step.cutscene}`);
      if (action.outcome === 'skipped') run.flags.push(`cutscene-skipped:${step.cutscene}`);
      run.cutsceneMarker = null;
      advance(context, run, index);
    },
    'cutscene-marker': (context, action: { marker: string }) => {
      const { run, index } = requireRun(context);
      selectStep(currentStep(index, run), 'cutscene');
      run.cutsceneMarker = action.marker;
    },
    leave: (context) => {
      const { run } = requireRun(context);
      if (!run.ended) throw new Error('The case is not finished');
      context.state.run = null;
    },
    import: (context, action: { state: JsonValue }) => {
      const pristine = JSON.stringify(context.state) === JSON.stringify(initialProfile());
      if (!pristine) throw new Error('Import is only allowed into an empty profile');
      context.state = parseProfile(action.state, rules, context.content.data as ContentIndex);
      const run = context.state.run;
      if (run && !run.ended) {
        const index = rules.pack(context.content.data as ContentIndex, run.pack);
        ensureNotebook(run, index);
        settleRun(context, run, index);
      }
    },
  };

  function resolveAwait(context: Ctx, action: AwaitAction, required = false) {
    const run = context.state.run;
    if (!run) {
      if (required) throw new Error('Nothing is waiting');
      return;
    }
    const index = rules.pack(context.content.data as ContentIndex, run.pack);
    const step = currentStep(index, run);
    if (step?.t === 'await' && step.action === action && !run.queue.length) {
      advance(context, run, index);
    } else if (required) {
      throw new Error('Nothing is waiting for this');
    }
  }

  return {
    id: GAME_ID,
    stateVersion: STATE_VERSION,
    state: stateSchema,
    action: actionSchema,
    content: rules.registration,
    eventPhases: ['game'],
    initialize: () => initialProfile(),
    resolve: (action) => success({ rule: 'game', payload: action as JsonValue, turns: 0 }),
    commands: [
      {
        id: 'game',
        payload: actionSchema as Schema<JsonValue>,
        progress: schema.literal(null),
        start(context, pending) {
          const action = requireValue(actionSchema.parse(pending.payload));
          const handler = commands[action.type] as (context: Ctx, action: GameAction) => void;
          handler(context, action);
        },
      },
    ],
    view: ({ state, content }) =>
      projectProfile(state as ProfileState, rules, content.data as ContentIndex),
  };
}

export function isUnlocked(profile: ProfileState, packId: string, index: ContentIndex): boolean {
  if (!index.packs.some((p) => p.id === packId) || packId === SHARED_PACK) return false;
  if (packId === 'prologue') return true;
  const { caseId } = caseOfPack(packId);
  const caseNumber = Number(/^case(\d\d)$/.exec(caseId)?.[1] ?? 0);
  if (caseNumber === 1) return profile.completed.includes('prologue');
  if (caseNumber >= 2 && caseNumber <= 4)
    return [1, 2, 3].some((level) =>
      profile.completed.includes(`case${String(caseNumber - 1).padStart(2, '0')}-l${level}`),
    );
  return false;
}

export function packCatalog(rules: GameRules, index: ContentIndex): FluffyPack[] {
  return index.packs.map((ref) => rules.library.get(ref).pack);
}

export { rankOf, rebaseRun };

/**
 * Prepares profile state saved under another content revision (Q43: saves stay compatible).
 * A run whose pack revision is no longer installed restarts at the beginning of the same scene
 * (scenes are re-entrant by contract with C); everything profile-level is kept.
 */
export function migrateProfileJson(
  raw: unknown,
  rules: GameRules,
  contentIndex: ContentIndex,
): ProfileState {
  if (!isRecord(raw)) throw new Error('Invalid profile');
  const value = structuredClone(raw) as Record<string, unknown>;
  for (const key of ['claimed', 'rewards', 'collections'] as const)
    if (!Array.isArray(value[key])) value[key] = [];
  if (typeof value.runs !== 'number') value.runs = 0;
  const run = value.run;
  if (isRecord(run) && typeof run.pack === 'string' && typeof run.packRevision === 'string') {
    const ref = contentIndex.packs.find((p) => p.id === run.pack);
    if (!ref) value.run = null;
    else if (ref.revision !== run.packRevision) {
      const index = rules.library.get(ref);
      const scene =
        typeof run.scene === 'string' && index.scenes.has(run.scene) ? run.scene : index.pack.start;
      const declared = new Set(index.pack.logic?.clues.map((c) => c.id) ?? []);
      value.run = {
        ...run,
        packRevision: ref.revision,
        scene,
        cursor: [{ i: 0, b: null }],
        queue: [],
        minigame: null,
        suggestions: [],
        stage: [],
        cutsceneMarker: null,
        ended: false,
        clues: Array.isArray(run.clues) ? run.clues.filter((c) => declared.has(c as string)) : [],
        notebook: null,
      };
    }
  }
  return parseProfile(value, rules, contentIndex);
}
