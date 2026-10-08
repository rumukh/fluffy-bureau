// Compiles authored sources into explicit packs and validates them.
import { createHash } from 'node:crypto';
import { inspectDeduction, tokenizeWords, validateDeduction } from '@aegis/narrative';
import type {
  ContentPack, DeductionCase, Line, ManifestEntry, Step, VoiceManifest,
} from '../../packages/content/src/schema.ts';
import { MANIFEST_FORMAT, NAME_PLACEHOLDER, NAME_TTS, PACK_FORMAT, PACK_SCHEMA } from '../../packages/content/src/schema.ts';
import type { AuthoredLine, CaseSource, SharedSource, VariantSource } from './dsl.ts';
import { checkCutscenes, cutsceneLines } from './cutscenes.ts';
import { exploreFlow, restartSafety, type FlowReport, type Issue } from './flow.ts';
import { proves, sameCandidate, solve } from './logic.ts';
import { pmIndex } from './pm-import.ts';
import { genderFlags, sentences, tokenize } from './text.ts';

export const MAX_WORDS = 10;
export const MAX_SENTENCES = 3;
export const MAX_NEW_TERMS = 3;
export const FACTS_PER_CASE = 3;
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;
const PROLOGUE_SKILLS = ['inspect', 'replay', 'lamp', 'notebook', 'guess', 'shell', 'pause', 'map'];
const PM_SPEAKERS: Record<string, string> = {
  Хвостс: 'khvosts', Ватсони: 'watsony', Пудинг: 'pudding', Тёпа: 'tyopa', Фитилёк: 'fitilyok',
  Картофан: 'kartofan', Стелла: 'stella', Мышонок: 'mouse', Дамка: 'damka', Пухлик: 'pukhlik', Все: 'all',
};
/** UI keys G maps by id (UI-<key>). */
export const REQUIRED_UI = [
  'title.play', 'profile.choose', 'profile.new', 'profile.full', 'avatar.species.kitten', 'avatar.species.fox', 'avatar.species.mouse',
  'avatar.species.squirrel', 'avatar.species.puppy', 'avatar.name.prompt', 'avatar.skip', 'avatar.done', 'scarf.honey', 'scarf.sage',
  'scarf.rose', 'scarf.sky', 'scarf.berry', 'scarf.mint', 'hud.pause', 'hud.notebook', 'hud.map', 'hud.lamp', 'hud.replay', 'hud.next',
  'hud.klubok', 'hud.shell', 'hud.help', 'hud.version', 'hud.guess', 'hud.back', 'hud.close', 'hud.ear', 'pause.title', 'pause.continue',
  'pause.settings', 'pause.restartCase', 'pause.restartConfirm', 'pause.yes', 'pause.no', 'pause.menu', 'pause.encyclopedia',
  'pause.glossary', 'pause.album', 'notebook.confirmed', 'notebook.excluded', 'notebook.unknown', 'notebook.clear', 'notebook.clues',
  'difficulty.title', 'difficulty.1', 'difficulty.2', 'difficulty.3', 'difficulty.1.desc', 'difficulty.2.desc', 'difficulty.3.desc',
  'difficulty.start', 'settings.title', 'settings.voice', 'settings.music', 'settings.effects', 'settings.textSize', 'settings.readable',
  'settings.calm', 'settings.readChoices', 'settings.on', 'settings.off', 'rotate', 'break.title', 'break.body', 'break.rest', 'break.more',
  'parent.enter', 'parent.hold', 'save.saved', 'save.failed', 'save.retry', 'save.otherTab', 'save.useHere', 'rewards.buttons',
  'rewards.hearts', 'rewards.rank', 'office.place', 'office.title', 'album.empty', 'encyclopedia.empty', 'glossary.empty', 'map.locked',
  'case.complete', 'cutscene.skip', 'cutscene.replay',
];

export interface GenderReview { id: string; rev: number; reason: string }

export interface BuildResult {
  packs: ContentPack[];
  manifest: VoiceManifest;
  issues: Issue[];
  flows: Map<string, FlowReport[]>;
  stats: Map<string, Record<string, number | string>>;
  lineIndex: Map<string, AuthoredLine>;
  sources: { shared: SharedSource; cases: CaseSource[] };
}

export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

/** Every line ID referenced by a variant, in a stable order. */
export function variantRefs(v: VariantSource, rewardLabel: (id: string) => string | undefined): string[] {
  const out: string[] = [];
  const add = (id: string | null | undefined) => { if (id && !out.includes(id)) out.push(id); };
  const walk = (steps: Step[]) => {
    for (const s of steps) {
      if (s.t === 'line') add(s.line);
      else if (s.t === 'skill') { walk(s.first); walk(s.known); }
      else if (s.t === 'if') { walk(s.then); walk(s.else); }
      else if (s.t === 'menu') { add(s.prompt); s.options.forEach((o) => add(o.label)); }
      else if (s.t === 'cutscene') { const c = v.cutscenes.find((x) => x.id === s.cutscene); if (c?.document) cutsceneLines(c.document).forEach((l) => add(l.line)); }
    }
  };
  add(v.title);
  v.scenes.forEach((s) => walk(s.steps));
  const L = v.logic;
  L.axes.forEach((a) => { add(a.title); a.values.forEach((x) => add(x.label)); });
  L.clues.forEach((c) => add(c.title));
  add(L.version.button);
  [...L.wrongVersion.intro, ...L.wrongVersion.byValue.flatMap((b) => b.lines), ...L.wrongVersion.outro].forEach((c) => add(c.line));
  L.redHerrings.forEach((r) => { r.presentedBy.forEach(add); r.explainedBy.forEach(add); });
  if (v.notebookHelp) { v.notebookHelp.marks.forEach((m) => add(m.line)); v.notebookHelp.pointers.forEach((p) => add(p.line)); add(v.notebookHelp.nothing); }
  for (const ch of [v.hints?.klubok, v.hints?.shell]) if (ch) { ch.rules.forEach((r) => add(r.id)); add(ch.review); add(ch.exhausted); }
  for (const m of v.minigames) {
    const c = m.config;
    switch (c.kind) {
      case 'magnifier': c.targets.forEach((t) => { add(t.label); t.reply.forEach(add); }); c.afterFirst.forEach(add); break;
      case 'cocoa': c.rounds.forEach((r) => { r.options.forEach((o) => { add(o.label); o.reply.forEach(add); }); r.retry.forEach(add); }); break;
      case 'tracks':
        c.steps.forEach((st) => { add(st.prompt); st.options.forEach((o) => { add(o.label); o.reply.forEach(add); }); });
        if (c.question) { add(c.question.prompt); c.question.options.forEach((o) => { add(o.label); o.reply.forEach(add); }); }
        break;
      case 'timeline': c.items.forEach((i) => add(i.label)); c.wrong.forEach(add); break;
      case 'scent-pairs':
        c.fields.forEach((f) => { add(f.label); f.cards.forEach((x) => add(x.label)); }); c.mismatch.forEach(add);
        if (c.question) { add(c.question.prompt); c.question.options.forEach((o) => { add(o.label); o.reply.forEach(add); }); }
        break;
      case 'staged': c.steps.forEach((st) => { add(st.prompt); st.options.forEach((o) => { add(o.label); o.reply.forEach(add); }); }); c.lines.forEach(add); break;
      case 'baker': c.measures.forEach((x) => add(x.label)); c.steps.forEach((st) => { add(st.prompt); st.afterWrong.forEach(add); }); c.tooMuch.forEach(add); c.tooLittle.forEach(add); break;
    }
  }
  v.facts.forEach((f) => add(f.line));
  v.glossary.forEach((g) => { add(g.definition); add(g.label); });
  v.rewards.forEach((r) => add(rewardLabel(r)));
  v.collections.forEach((c) => { add(c.label); add(c.line); });
  v.activities.forEach((a) => { add(a.title); a.steps.forEach((s) => add(s.line)); a.safety.forEach(add); });
  v.comfort.forEach((c) => add(c.line));
  (v.reserved ?? []).forEach((r) => r.lines.forEach(add));
  return out;
}

export function toDeduction(v: VariantSource): DeductionCase {
  const L = v.logic;
  return {
    schema: 1,
    id: v.pack,
    axes: L.axes.map((a) => ({ id: a.id, values: a.values.map((x) => x.id) })),
    compatibility: null,
    intended: { ...L.intended },
    clues: L.clues.filter((c) => c.required).map((c) => ({
      id: c.id, predicate: c.predicate, requires: c.requires.filter((r) => L.clues.find((x) => x.id === r)?.required), requiresAnswer: false, explanationKey: c.title,
    })),
    redHerrings: L.redHerrings.map((r) => ({ id: r.id, explanationKey: r.explainedBy[0]! })),
    maxCandidates: L.axes.reduce((n, a) => n * a.values.length, 1),
  };
}

const toLine = (l: AuthoredLine): Line => ({
  id: l.id, rev: l.rev, kind: l.kind, speaker: l.speaker, text: l.text, ...(l.tts ? { tts: l.tts } : {}),
  voiced: l.voiced, delivery: l.delivery, ...(l.note ? { note: l.note } : {}),
});

function withRevision<T extends { revision: string }>(body: Omit<T, 'revision'>): T {
  const revision = sha256(JSON.stringify(body));
  return { ...body, revision } as T;
}

export function build(shared: SharedSource, cases: CaseSource[], genderReview: GenderReview[]): BuildResult {
  const issues: Issue[] = [];
  const err = (code: string, where: string, message: string) => issues.push({ level: 'error', code, where, message });
  const warn = (code: string, where: string, message: string) => issues.push({ level: 'warning', code, where, message });

  // ---------------------------------------------------------------- line catalog
  const lineIndex = new Map<string, AuthoredLine>();
  const allLines = [...shared.lines, ...cases.flatMap((c) => c.lines)];
  for (const l of allLines) {
    if (lineIndex.has(l.id)) err('ID-DUPLICATE', l.id, `line defined twice (${lineIndex.get(l.id)!.origin}, ${l.origin})`);
    else lineIndex.set(l.id, l);
    if (!ID_RE.test(l.id)) err('ID-FORMAT', l.id, 'invalid ID (1–128 ASCII letters, digits, . _ : / -)');
    if (!shared.speakers.some((s) => s.id === l.speaker)) err('REF-SPEAKER', l.id, `unknown speaker ${l.speaker}`);
  }
  const sharedIds = new Set(shared.lines.map((l) => l.id));

  // PM drift and revisions
  const pm = pmIndex();
  for (const l of allLines) {
    const orig = pm.get(l.id)?.[0];
    const edits = l.changes.filter((c) => c.before !== null);
    if (orig) {
      if (l.changes.some((c) => c.before === null)) err('PM-ADDED', l.id, 'line exists in PM scripts but is marked as added');
      const pmSpeaker = orig.speaker?.replace(/\s*\(.*\)\s*$/u, '');
      if (pmSpeaker && PM_SPEAKERS[pmSpeaker] && PM_SPEAKERS[pmSpeaker] !== l.speaker) err('PM-SPEAKER', l.id, `speaker ${l.speaker} ≠ PM ${orig.speaker}`);
      if (edits.length === 0 && l.text !== orig.text) err('PM-DRIFT', l.id, `text differs from PM without a change record: «${l.text}» vs «${orig.text}»`);
      if (edits.length > 0 && edits[0]!.before !== orig.text) err('PM-BEFORE', l.id, `change.before «${edits[0]!.before}» ≠ PM «${orig.text}»`);
      if (edits.length > 0 && l.text === orig.text) err('PM-NOOP', l.id, 'change recorded but text equals PM');
    } else if (!l.changes.some((c) => c.before === null)) {
      err('NEW-UNRECORDED', l.id, 'line is not in PM scripts and has no «added» change record');
    }
    if (l.rev !== edits.length + 1) err('REVISION', l.id, `rev ${l.rev} but ${edits.length} recorded edits`);
    for (const c of l.changes) if (!c.reason || !c.ref) err('CHANGELOG', l.id, 'change without reason or reference');
  }

  // Text rules
  const reviewed = new Map([...genderReview, ...cases.flatMap((c) => c.genderReview ?? [])].map((g) => [`${g.id}@${g.rev}`, g]));
  const usedReviews = new Set<string>();
  for (const l of allLines) {
    const ss = sentences(l.text);
    if (ss.length === 0) err('TEXT-EMPTY', l.id, 'no words');
    for (const s of ss) {
      const n = tokenize(s).length;
      if (n > MAX_WORDS) err('WORDS-MAX', l.id, `${n} words: «${s}»`);
      if (tokenizeWords(s.replaceAll(NAME_PLACEHOLDER, 'ИМЯ')).length !== n) err('TOKENIZER', l.id, 'local tokenizer disagrees with @aegis/narrative');
    }
    if (['dialogue', 'hint', 'notebook', 'comfort'].includes(l.kind) && ss.length > MAX_SENTENCES) err('SENTENCES-MAX', l.id, `${ss.length} sentences (Q24: 1–3)`);
    if (l.text.split(NAME_PLACEHOLDER).some((part) => /[{}]/.test(part))) err('PLACEHOLDER', l.id, 'unknown placeholder');
    if (l.tts?.includes('{')) err('PLACEHOLDER', l.id, 'placeholder in tts override');
    for (const f of genderFlags(l.text)) {
      const key = `${l.id}@${l.rev}`;
      if (reviewed.has(key)) usedReviews.add(key);
      else err('GENDER', l.id, `possible gendered address to the player: «${f.sentence}» (${f.words.join(', ') || 'pattern'}) — fix or review in content/shared/gender-review.ts`);
    }
  }
  for (const key of reviewed.keys()) if (!usedReviews.has(key)) warn('GENDER-REVIEW-STALE', key, 'review entry no longer matches a flagged line revision');
  for (const k of REQUIRED_UI) if (!lineIndex.has(`UI-${k}`)) err('UI-MISSING', `UI-${k}`, 'interface label requested by G is missing');

  // ---------------------------------------------------------------- packs
  const allRewards = [...shared.rewards, ...cases.flatMap((c) => c.rewards ?? [])];
  const allSkills = [...shared.skills, ...cases.flatMap((c) => c.skills ?? [])];
  const rewardLabel = (id: string) => allRewards.find((r) => r.id === id)?.label;
  const packs: ContentPack[] = [];
  const flows = new Map<string, FlowReport[]>();
  const stats = new Map<string, Record<string, number | string>>();
  const usedIds = new Set<string>();
  const dirTexts = new Map<string, string>();

  const sharedRefs = [...sharedIds];
  packs.push(withRevision<ContentPack>({
    format: PACK_FORMAT, schema: PACK_SCHEMA, id: 'shared', kind: 'shared', title: null, case: null, requires: [], start: null,
    lines: shared.lines.map(toLine), speakers: shared.speakers, skills: shared.skills, scenes: [], logic: null, deduction: null,
    notebookHelp: null, hints: null, minigames: [], facts: [], glossary: [], rewards: shared.rewards, collections: [], activities: [], comfort: [], cutscenes: [], reserved: [],
  }));
  sharedRefs.forEach((id) => usedIds.add(id));
  for (const s of shared.skills) if (!lineIndex.has(s.title)) err('REF-LINE', `shared: skill ${s.id}`, `missing title ${s.title}`);
  for (const r of shared.rewards) if (!lineIndex.has(r.label)) err('REF-LINE', `shared: reward ${r.id}`, `missing label ${r.label}`);

  for (const c of cases) {
    for (const k of c.skills ?? []) if (!lineIndex.has(k.title)) err('REF-LINE', `: skill ${k.id}`, `missing title ${k.title}`);
    for (const rw of c.rewards ?? []) if (!lineIndex.has(rw.label)) err('REF-LINE', `: reward ${rw.id}`, `missing label ${rw.label}`);
    const caseNewTerms = new Set<string>();
    for (const v of c.variants) {
      const where = v.pack;
      const refs = variantRefs(v, rewardLabel);
      for (const id of refs) {
        usedIds.add(id);
        if (!lineIndex.has(id)) err('REF-LINE', where, `missing line ${id}`);
      }
      const own = refs.filter((id) => !sharedIds.has(id) && lineIndex.has(id));
      const textOf = (id: string) => lineIndex.get(id)?.text;

      // scene/dir/structure checks
      const sceneIds = new Set<string>();
      for (const s of v.scenes) {
        if (sceneIds.has(s.id)) err('ID-DUPLICATE', where, `scene ${s.id} twice`);
        sceneIds.add(s.id);
        for (const sp of s.cast) if (!shared.speakers.some((x) => x.id === sp)) err('REF-SPEAKER', `${where}: ${s.id}`, `unknown cast ${sp}`);
        const walk = (steps: Step[]) => steps.forEach((st) => {
          if (st.t === 'dir') {
            const prev = dirTexts.get(st.id);
            if (prev !== undefined && prev !== st.text) err('DIR-CONFLICT', st.id, `stage direction ID reused with different text`);
            dirTexts.set(st.id, st.text);
          }
          if (st.t === 'skill') { if (!allSkills.some((k) => k.id === st.skill)) err('REF-SKILL', where, st.skill); walk(st.first); walk(st.known); }
          if (st.t === 'if') { walk(st.then); walk(st.else); }
          if (st.t === 'minigame' && !v.minigames.some((m) => m.id === st.minigame)) err('REF-MINIGAME', where, st.minigame);
          if (st.t === 'reward' && !allRewards.some((r) => r.id === st.reward)) err('REF-REWARD', where, st.reward);
          if (st.t === 'reward' && !v.rewards.includes(st.reward)) err('REF-REWARD', where, `${st.reward} granted but not listed`);
          if (st.t === 'clue' && !v.logic.clues.some((k) => k.id === st.clue)) err('REF-CLUE', where, st.clue);
          if (st.t === 'goto' && !v.scenes.some((x) => x.id === st.scene)) err('REF-SCENE', where, st.scene);
          if (st.t === 'menu') {
            if (new Set(st.options.map((o) => o.id)).size !== st.options.length) err('ID-DUPLICATE', where, `menu ${st.id} option ids`);
            for (const o of st.options) if (!v.scenes.some((x) => x.id === o.to)) err('REF-SCENE', `${where}: ${st.id}`, o.to);
          }
        });
        walk(s.steps);
      }
      restartSafety(v, issues);
      checkCutscenes(v, lineIndex, new Set(refs), issues);

      // minigame choice limits
      for (const m of v.minigames) {
        const cfg = m.config;
        const lists: { id: string; n: number; page: number }[] = [];
        if (cfg.kind === 'cocoa') cfg.rounds.forEach((r) => {
          lists.push({ id: r.id, n: r.options.length, page: 3 });
          if (!r.options.some((o) => o.correct)) err('MINIGAME', `${where}: ${m.id}`, `round ${r.id} has no correct option`);
        });
        if (cfg.kind === 'tracks') {
          cfg.steps.forEach((st) => { lists.push({ id: st.id, n: st.options.length, page: st.pageSize }); if (st.options.filter((o) => o.correct).length !== 1) err('MINIGAME', `${where}: ${m.id}`, `step ${st.id} needs exactly one correct card`); });
          if (cfg.question) lists.push({ id: 'question', n: cfg.question.options.length, page: 3 });
        }
        if (cfg.kind === 'staged') cfg.steps.forEach((st) => lists.push({ id: st.id, n: st.options.length, page: st.pageSize }));
        if (cfg.kind === 'scent-pairs' && cfg.question) lists.push({ id: 'question', n: cfg.question.options.length, page: 3 });
        if (cfg.kind === 'timeline' && [...cfg.solution].sort().join() !== cfg.items.map((i) => i.id).sort().join()) err('MINIGAME', `${where}: ${m.id}`, 'solution must list every item once');
        if (cfg.kind === 'scent-pairs') for (const f of cfg.fields) {
          const counts = new Map<string, number>();
          f.cards.forEach((x) => counts.set(x.pair, (counts.get(x.pair) ?? 0) + 1));
          if ([...counts.values()].some((n) => n !== 2)) err('MINIGAME', `${where}: ${m.id}`, `field ${f.id}: every pair needs exactly two cards`);
        }
        if (cfg.kind === 'baker') for (const st of cfg.steps) {
          const ideal = cfg.measures.filter((x) => st.ideal.includes(x.id));
          if (!ideal.some((x) => st.target % x.units === 0)) err('MINIGAME', `${where}: ${m.id}`, `step ${st.id}: target ${st.target} not reachable with ideal measures`);
        }
        for (const l of lists) if (l.page > 3 || (l.n > 3 && l.page >= l.n)) err('CHOICES-MAX', `${where}: ${m.id}/${l.id}`, `${l.n} options shown at once (pageSize ${l.page}); Q11 allows 3`);
        if (!v.scenes.some((s) => JSON.stringify(s.steps).includes(`"minigame":"${m.id}"`))) warn('UNUSED', where, `minigame ${m.id} never started`);
      }

      // ---------------------------------------------------------------- logic (R03)
      const L = v.logic;
      const required = L.clues.filter((k) => k.required).map((k) => k.id);
      const all = solve(L, L.clues.map((k) => k.id));
      if (!all.some((x) => sameCandidate(x, L.intended))) err('LOGIC-CONTRADICTION', where, 'intended answer violates a clue (a clue is a false hard fact)');
      const left = solve(L, required);
      if (left.length !== 1 || !sameCandidate(left[0]!, L.intended)) err('LOGIC-UNIQUE', where, `${left.length} candidates after required clues: ${JSON.stringify(left.slice(0, 5))}`);
      for (const k of L.clues) for (const r of k.requires) if (!L.clues.some((x) => x.id === r)) err('REF-CLUE', where, `${k.id} requires unknown ${r}`);
      for (const axis of L.axes) for (const val of axis.values) {
        if (L.intended[axis.id] === val.id) continue;
        const wv = L.wrongVersion.byValue.find((b) => b.axis === axis.id && b.value === val.id);
        if (!wv) { err('WRONG-UNEXPLAINED', where, `no wrong-version explanation for ${axis.id}=${val.id}`); continue; }
        if (wv.lines.length === 0) err('WRONG-UNEXPLAINED', where, `${axis.id}=${val.id} has no line`);
        if (wv.clues.length === 0 || !proves(L, wv.clues, axis.id, val.id, 'excluded')) err('R03-EXCLUSION', where, `clues [${wv.clues}] do not exclude ${axis.id}=${val.id}`);
        if (wv.clues.some((k) => !required.includes(k))) err('R03-EXCLUSION', where, `${axis.id}=${val.id} explained by an optional clue`);
      }
      for (const b of L.wrongVersion.byValue) if (L.intended[b.axis] === b.value) err('WRONG-INTENDED', where, `${b.axis}=${b.value} is the answer`);
      const herringLines = new Set(L.redHerrings.flatMap((r) => r.presentedBy));
      const clueIds = new Set(L.clues.map((k) => k.id));
      for (const r of L.redHerrings) {
        if (clueIds.has(r.id)) err('RED-HERRING-FACT', where, `${r.id} is also a clue`);
        if (r.explainedBy.length === 0) err('RED-HERRING-UNEXPLAINED', where, r.id);
      }
      for (const b of L.wrongVersion.byValue) for (const x of b.lines) if (herringLines.has(x.line)) err('RED-HERRING-FACT', where, `wrong-version line ${x.line} presents a red herring`);
      if (v.notebookHelp) {
        for (const m of v.notebookHelp.marks) {
          if (!proves(L, m.clues, m.axis, m.value, m.mark)) err('R03-NOTEBOOK', where, `clues [${m.clues}] do not prove ${m.mark} ${m.axis}=${m.value}`);
          if (herringLines.has(m.line)) err('RED-HERRING-FACT', where, `notebook line ${m.line} presents a red herring`);
        }
        if (v.notebookHelp.mode === 'point') for (const k of new Set(v.notebookHelp.marks.flatMap((m) => m.clues))) {
          if (!v.notebookHelp.pointers.some((p) => p.clue === k)) err('NOTEBOOK-POINTER', where, `no pointer line for clue ${k}`);
        }
        // every provable mark after all clues must have a rule (so help never stalls)
        for (const axis of L.axes) for (const val of axis.values) {
          const mark = L.intended[axis.id] === val.id ? 'confirmed' : 'excluded';
          if (!v.notebookHelp.marks.some((m) => m.axis === axis.id && m.value === val.id && m.mark === mark)) err('NOTEBOOK-GAP', where, `no notebook help rule for ${mark} ${axis.id}=${val.id}`);
        }
      }
      for (const ch of [v.hints?.klubok, v.hints?.shell]) if (ch) for (const r of ch.rules) for (const k of r.cites) if (!clueIds.has(k)) err('REF-CLUE', where, `hint ${r.id} cites ${k}`);
      const deduction = toDeduction(v);
      const aegis = validateDeduction(deduction);
      if (!aegis.ok) err('AEGIS-DEDUCTION', where, aegis.diagnostics.map((d) => `${d.code}: ${d.message}`).join('; '));
      const inspect = inspectDeduction(deduction);

      // ---------------------------------------------------------------- case-level content rules
      if (v.kind === 'case') {
        if (v.facts.length !== FACTS_PER_CASE) err('FACTS', where, `${v.facts.length} facts (need exactly ${FACTS_PER_CASE})`);
        if (v.glossary.length > MAX_NEW_TERMS) err('GLOSSARY-MAX', where, `${v.glossary.length} new terms (max ${MAX_NEW_TERMS})`);
        v.glossary.forEach((g) => caseNewTerms.add(g.id));
        for (const f of v.facts) if (lineIndex.get(f.line)?.kind !== 'fact') err('FACTS', where, `${f.line} is not a fact line`);
      }

      // ---------------------------------------------------------------- flow
      const fresh = exploreFlow(v, textOf, v.kind === 'prologue' ? [] : PROLOGUE_SKILLS, 'fresh', issues);
      const veteran = exploreFlow(v, textOf, allSkills.map((s) => s.id), 'veteran', issues);
      flows.set(v.pack, [fresh, veteran]);
      const revealsAnywhere = (k: string) => {
        const has = (steps: Step[]): boolean => steps.some((st) => (st.t === 'clue' && st.clue === k) || (st.t === 'skill' && (has(st.first) || has(st.known))) || (st.t === 'if' && (has(st.then) || has(st.else))));
        return v.scenes.some((s) => has(s.steps));
      };
      for (const k of required) if (!revealsAnywhere(k) || !fresh.cluesRevealed.has(k)) err('CLUE-UNREACHABLE', where, `required clue ${k} is never revealed`);
      // skills used by minigames must have a first-encounter block somewhere in the pack (R09)
      for (const m of v.minigames) {
        const block = (steps: Step[]): boolean => steps.some((st) => (st.t === 'skill' && st.skill === m.skill) || (st.t === 'if' && (block(st.then) || block(st.else))));
        const hasBlock = v.scenes.some((s) => block(s.steps));
        if (!hasBlock && !(v.kind === 'case' && PROLOGUE_SKILLS.includes(m.skill))) err('R09-TUTORIAL', where, `mechanic ${m.skill} has no [НАВЫК] block`);
      }

      packs.push(withRevision<ContentPack>({
        format: PACK_FORMAT, schema: PACK_SCHEMA, id: v.pack, kind: v.kind, title: v.title, case: v.case, requires: ['shared'], start: v.start,
        lines: own.map((id) => toLine(lineIndex.get(id)!)), speakers: [], skills: c.skills ?? [], scenes: v.scenes, logic: v.logic, deduction,
        notebookHelp: v.notebookHelp, hints: v.hints, minigames: v.minigames, facts: v.facts, glossary: v.glossary,
        rewards: allRewards.filter((r) => v.rewards.includes(r.id)),
        collections: v.collections, activities: v.activities, comfort: v.comfort, cutscenes: v.cutscenes,
        reserved: v.reserved ?? [],
      }));
      const sentenceCounts = own.flatMap((id) => sentences(lineIndex.get(id)!.text).map((s) => tokenize(s).length));
      stats.set(v.pack, {
        lines: own.length,
        spokenSentences: sentenceCounts.length,
        maxWords: Math.max(0, ...sentenceCounts),
        candidates: L.axes.reduce((n, a) => n * a.values.length, 1),
        requiredClues: required.length,
        afterRequired: left.length,
        aegisRemaining: inspect.candidates.length,
        redHerrings: L.redHerrings.length,
        wrongValues: L.wrongVersion.byValue.length,
      });
    }
    if (caseNewTerms.size > MAX_NEW_TERMS) err('GLOSSARY-MAX', c.id, `${caseNewTerms.size} new terms in the case`);
  }
  for (const l of allLines) if (!usedIds.has(l.id)) warn('UNUSED', l.id, 'line is not referenced by any pack');
  // Cutscene IDs are unique across all packs (E's bundle validator, AEG-ANIM-0006).
  const csSeen = new Map<string, string>();
  for (const c of cases) for (const v of c.variants) for (const cs of v.cutscenes) {
    const prev = csSeen.get(cs.id);
    if (prev && prev !== v.pack) err('ID-DUPLICATE', `${v.pack}: cutscene ${cs.id}`, `cutscene ID also used in ${prev}`);
    csSeen.set(cs.id, v.pack);
  }

  // ---------------------------------------------------------------- manifest
  const membership = new Map<string, string[]>();
  for (const p of packs) for (const l of p.lines) membership.set(l.id, [...(membership.get(l.id) ?? []), p.id]);
  const firstAudio = new Map<string, string>();
  const entries: ManifestEntry[] = [];
  for (const p of packs) for (const l of p.lines) {
    if (!l.voiced || entries.some((e) => e.id === l.id)) continue;
    const ttsText = (l.tts ?? l.text).replaceAll(NAME_PLACEHOLDER, NAME_TTS);
    const pron: { word: string; hint: string }[] = [];
    for (const w of tokenize(ttsText)) {
      const lex = shared.lexicon.find((x) => w.toLowerCase().startsWith(x.word.toLowerCase()));
      if (lex && !pron.some((p2) => p2.word === w)) pron.push({ word: w, hint: lex.hint + w.slice(lex.word.length) });
    }
    const audioKey = `${l.speaker}\u0000${ttsText}`;
    if (!firstAudio.has(audioKey)) firstAudio.set(audioKey, l.id);
    entries.push({
      id: l.id, revision: l.rev, kind: l.kind, speaker: l.speaker, displayText: l.text, ttsText, ttsHash: sha256(ttsText),
      pronunciation: pron, delivery: l.delivery, note: l.note ?? '', packs: membership.get(l.id) ?? [],
      ...(firstAudio.get(audioKey) !== l.id ? { sameAudioAs: firstAudio.get(audioKey)! } : {}),
    } as ManifestEntry);
  }
  const manifest: VoiceManifest = {
    format: MANIFEST_FORMAT, schema: 1,
    packs: Object.fromEntries(packs.map((p) => [p.id, p.revision])),
    lexicon: shared.lexicon, speakers: shared.speakers, entries,
  };

  return { packs, manifest, issues, flows, stats, lineIndex, sources: { shared, cases } };
}
