// Stage 2 minigame kinds (T26): line references, flow lines, choice limits, semantic checks and
// referenced asset IDs. Kept separate from compile.ts so each kind's rules live in one place.
import type { ChoiceOption, LightPattern, MinigameConfig } from '../../packages/content/src/schema.ts';
import { norm, tokenize } from './text.ts';

type Lines = { sure: string[]; maybe: string[] };

const optLines = (os: ChoiceOption[], out: Lines) => os.forEach((o) => (o.correct ? out.sure : out.maybe).push(...o.reply));

/** Lines a Stage 2 kind speaks: `sure` on every completion, `maybe` only after a wrong move. */
export function kindLines(c: MinigameConfig): Lines | null {
  const out: Lines = { sure: [], maybe: [] };
  switch (c.kind) {
    case 'cipher':
      out.sure.push(...c.intro);
      c.words.forEach((w) => out.sure.push(...w.solved));
      out.maybe.push(...c.wrong);
      return out;
    case 'postman':
      out.sure.push(...c.intro, ...c.correct);
      out.maybe.push(...c.wrongStreet, ...c.wrongHouse);
      return out;
    case 'sound-match':
      out.sure.push(...c.intro, ...c.after);
      c.rounds.forEach((r) => { optLines(r.options, out); out.maybe.push(...r.wrong); });
      return out;
    case 'light-signals':
      out.sure.push(...c.intro);
      c.signals.forEach((s) => out.sure.push(...s.correct));
      out.maybe.push(...c.wrong);
      if (c.own) out.sure.push(...c.own.prompt, ...c.own.done);
      return out;
    case 'read-blink':
      optLines(c.lessons, out);
      out.maybe.push(...c.wrong);
      return out;
    case 'dream-keeper':
      out.sure.push(...c.intro, ...c.after);
      // Solo shows at least the first card of each round.
      c.rounds.forEach((r) => { out.sure.push(...r.correct); if (r.cards[0]) out.sure.push(r.cards[0].label); r.cards.slice(1).forEach((x) => out.maybe.push(x.label)); out.maybe.push(...r.wrong); });
      return out;
    case 'equal-share':
      out.sure.push(...c.intro);
      c.tasks.forEach((t) => out.sure.push(t.prompt, ...t.correct));
      out.maybe.push(...c.uneven);
      return out;
    case 'compare':
      c.steps.forEach((st) => { if (st.prompt) out.sure.push(st.prompt); optLines(st.options, out); });
      if (c.question) { out.sure.push(c.question.prompt); optLines(c.question.options, out); }
      return out;
    default:
      return null;
  }
}

/** Every line ID a Stage 2 kind references (labels included). */
export function kindRefs(c: MinigameConfig): string[] | null {
  const l = kindLines(c);
  if (!l) return null;
  const refs = [...l.sure, ...l.maybe];
  const opts = (os: ChoiceOption[]) => os.forEach((o) => refs.push(o.label));
  switch (c.kind) {
    case 'cipher': c.table.forEach((g) => refs.push(g.label)); break;
    case 'postman':
      c.streets?.forEach((s) => refs.push(s.label));
      c.letters.forEach((x) => refs.push(x.label));
      c.houseLabels.forEach((h) => refs.push(h.label));
      break;
    case 'sound-match': c.rounds.forEach((r) => opts(r.options)); break;
    case 'light-signals': c.signals.forEach((s) => refs.push(s.label)); break;
    case 'read-blink': opts(c.lessons); break;
    case 'dream-keeper':
      c.rounds.forEach((r) => r.cards.forEach((x) => refs.push(x.label)));
      refs.push(...c.family.intro, ...c.family.keeperPick, ...c.family.ask, ...c.family.win);
      c.family.questions.forEach((q) => refs.push(q.label));
      c.family.players.forEach((p) => refs.push(p.label));
      c.family.titles.forEach((t) => refs.push(t.label));
      break;
    case 'equal-share': c.tasks.forEach((t) => refs.push(t.itemLabel, t.groupLabel)); break;
    case 'compare':
      refs.push(c.subject.label);
      c.steps.forEach((st) => opts(st.options));
      if (c.question) opts(c.question.options);
      break;
  }
  return refs;
}

/** Choice sets shown at once (Q11: ≤3 per page). */
export function kindChoiceLists(c: MinigameConfig): { id: string; n: number; page: number }[] {
  switch (c.kind) {
    case 'cipher': return c.words.flatMap((w) => w.slots.map((s, i) => ({ id: `${w.id}#${i}`, n: s.options.length, page: 3 })));
    case 'postman': return c.letters.flatMap((x) => [
      ...(x.streetOptions ? [{ id: `${x.id}/street`, n: x.streetOptions.length, page: 3 }] : []),
      { id: `${x.id}/house`, n: x.houseOptions.length, page: 3 },
    ]);
    case 'sound-match': return c.rounds.map((r) => ({ id: r.id, n: r.options.length, page: 3 }));
    case 'read-blink': return [{ id: 'lessons', n: c.lessons.length, page: 3 }];
    case 'compare': return [...c.steps.map((s) => ({ id: s.id, n: s.options.length, page: s.pageSize })), ...(c.question ? [{ id: 'question', n: c.question.options.length, page: 3 }] : [])];
    default: return [];
  }
}

/** A sample IDs (assets/sound-clues/index.json) a kind needs. */
export function kindSamples(c: MinigameConfig): string[] {
  return c.kind === 'sound-match' ? c.rounds.flatMap((r) => [r.target, ...r.options.map((o) => o.sample)]) : [];
}

/** A image asset IDs a kind needs (dream cards, comparison pictures). */
export function kindAssets(c: MinigameConfig): string[] {
  switch (c.kind) {
    case 'dream-keeper': return c.rounds.flatMap((r) => r.cards.map((x) => x.image));
    case 'compare': return [c.subject.image];
    default: return [];
  }
}

const samePattern = (a: LightPattern, b: LightPattern) => a.length === b.length && a.every((x, i) => x === b[i]);
const STOP = new Set(['и', 'в', 'на', 'с', 'у', 'за', 'под', 'к', 'по', 'о', 'об', 'а', 'не']);

/**
 * Semantic checks. `labelText` resolves line IDs; `axisLabel(axis, value)` gives the notebook label
 * text of an axis value (dream-keeper answers).
 */
export function checkKind(
  c: MinigameConfig,
  labelText: (id: string) => string | undefined,
  axisValues: (axis: string) => { id: string; label: string }[] | undefined,
  err: (message: string) => void,
): void {
  switch (c.kind) {
    case 'cipher': {
      const ids = new Set(c.table.map((g) => g.id));
      const keys = new Set<string>();
      for (const g of c.table) {
        const key = `${g.colour}/${g.holes}/${g.shape}`;
        if (keys.has(key)) err(`cipher glyphs must differ: ${key} twice`);
        keys.add(key);
        if (!(g.holes >= 1 && g.holes <= 4)) err(`glyph ${g.id}: holes must be 1–4`);
        // R01: two glyphs must never differ only by colour.
        for (const h of c.table) if (h !== g && h.holes === g.holes && h.shape === g.shape && h.colour !== g.colour) err(`R01: ${g.id} and ${h.id} differ only by colour`);
      }
      for (const w of c.words) {
        const spelled = w.slots.map((s) => c.table.find((g) => g.id === s.glyph)?.letter ?? '?').join('');
        if (norm(spelled) !== norm(w.answer)) err(`word ${w.id}: slots spell «${spelled}», expected «${w.answer}»`);
        for (const s of w.slots) {
          if (!ids.has(s.glyph)) err(`word ${w.id}: unknown glyph ${s.glyph}`);
          if (!s.options.includes(s.glyph)) err(`word ${w.id}: options must include the glyph ${s.glyph}`);
          for (const o of s.options) if (!ids.has(o)) err(`word ${w.id}: unknown option ${o}`);
          const letters = s.options.map((o) => c.table.find((g) => g.id === o)?.letter);
          if (new Set(letters).size !== letters.length) err(`word ${w.id}: two options show the same letter`);
        }
        if (w.solved.length === 0) err(`word ${w.id}: needs a solved line`);
      }
      break;
    }
    case 'postman': {
      for (const x of c.letters) {
        if (!x.houseOptions.includes(x.house)) err(`letter ${x.id}: house options must include ${x.house}`);
        if (new Set(x.houseOptions).size !== x.houseOptions.length) err(`letter ${x.id}: duplicate house options`);
        for (const h of x.houseOptions) if (!c.houseLabels.some((l) => l.number === h)) err(`letter ${x.id}: no label for house ${h}`);
        if (c.streets) {
          if (!x.street || !c.streets.some((s) => s.id === x.street)) err(`letter ${x.id}: street required on this level`);
          if (!x.streetOptions?.includes(x.street ?? '')) err(`letter ${x.id}: street options must include ${x.street}`);
        } else if (x.street || x.streetOptions) err(`letter ${x.id}: no streets on this level`);
      }
      break;
    }
    case 'sound-match':
      for (const r of c.rounds) {
        if (r.options.filter((o) => o.correct).length !== 1) err(`round ${r.id}: exactly one matching sample`);
        if (new Set(r.options.map((o) => o.sample)).size !== r.options.length) err(`round ${r.id}: two options use the same sample`);
        if (r.options.some((o) => o.sample === r.target)) err(`round ${r.id}: the night sample must be its own recording, not an option's`);
      }
      break;
    case 'light-signals':
      for (const s of c.signals) if (s.pattern.length < 2 || s.pattern.length > 6) err(`signal ${s.id}: 2–6 lights`);
      for (const a of c.signals) for (const b of c.signals) if (a !== b && samePattern(a.pattern, b.pattern)) err(`signals ${a.id} and ${b.id} are identical`);
      if (c.own && !(c.own.min >= 1 && c.own.min <= c.own.max && c.own.max <= 8)) err('own signal: 1 ≤ min ≤ max ≤ 8');
      break;
    case 'read-blink': {
      const right = c.lessons.filter((l) => samePattern(l.pattern, c.drawing));
      if (right.length !== 1 || !right[0]!.correct) err('exactly one lesson must match the drawing, and it must be the correct option');
      if (c.lessons.some((l) => l.correct && !samePattern(l.pattern, c.drawing))) err('a correct lesson must match the drawing');
      break;
    }
    case 'dream-keeper':
      for (const r of c.rounds) {
        const values = axisValues(r.axis);
        if (!values) { err(`round ${r.id}: unknown axis ${r.axis}`); continue; }
        const answer = values.find((v) => v.id === r.answer);
        if (!answer) { err(`round ${r.id}: answer ${r.answer} is not a value of ${r.axis}`); continue; }
        if (r.cards.length < 3) err(`round ${r.id}: at least 3 cards (family Keeper picks 1 of 3, T31)`);
        // Q33: no card names the answer directly.
        const banned = new Set(tokenize(answer.label).map(norm).filter((w) => !STOP.has(w) && w.length > 2));
        for (const card of r.cards) {
          const words = tokenize(labelText(card.label) ?? '').map(norm);
          const hit = words.find((w) => banned.has(w));
          if (hit) err(`round ${r.id}: card ${card.id} names the answer («${hit}», Q33)`);
        }
      }
      for (const r of c.rounds) for (const card of r.cards) for (const q of c.family.questions) if (typeof card.facts[q.id] !== 'boolean') err(`round ${r.id}: card ${card.id} has no fact for question ${q.id} (T31)`);
      for (const r of c.rounds) for (const card of r.cards) for (const k of Object.keys(card.facts)) if (!c.family.questions.some((q) => q.id === k)) err(`card ${card.id}: fact for unknown question ${k}`);
      for (const role of ['keeper', 'asker', 'guesser'] as const) if (!c.family.titles.some((t) => t.for === role)) err(`titles: none for ${role} (Q36)`);
      if (c.family.players.length < 3) err('family players: at least 3 names (2–4 players with the child)');
      if (c.family.questions.length < 3) err('family questions: at least 3 ready-made questions (T31)');
      break;
    case 'equal-share':
      for (const t of c.tasks) {
        if (t.groups < 2 || t.items <= t.reserve) err(`task ${t.id}: needs at least 2 groups and items above the reserve`);
        else if ((t.items - t.reserve) % t.groups !== 0) err(`task ${t.id}: ${t.items - t.reserve} items cannot be shared equally among ${t.groups}`);
      }
      break;
    case 'compare':
      for (const st of c.steps) if (st.options.filter((o) => o.correct).length !== 1) err(`step ${st.id}: exactly one correct option`);
      break;
    default:
      break;
  }
}
