// Finite deduction solver and condition evaluation. Mirrors @aegis/narrative semantics
// (solveDeduction uses only revealed predicates) and adds Fluffy checks (R03).
import type { CaseLogic, Cond, Predicate } from '../../packages/content/src/schema.ts';

export type Candidate = Record<string, string>;

export function evalPredicate(p: Predicate, c: Candidate): boolean {
  if (p.op === 'eq') return c[p.axis] === p.value;
  if (p.op === 'ne') return c[p.axis] !== p.value;
  if (p.op === 'in') return p.values.includes(c[p.axis]!);
  if (!('terms' in p)) throw new Error('bad predicate');
  return p.op === 'and' ? p.terms.every((t) => evalPredicate(t, c)) : p.terms.some((t) => evalPredicate(t, c));
}

export function predicateRefs(p: Predicate, out: { axis: string; value: string }[] = []): { axis: string; value: string }[] {
  if (p.op === 'eq' || p.op === 'ne') out.push({ axis: p.axis, value: p.value });
  else if (p.op === 'in') for (const v of p.values) out.push({ axis: p.axis, value: v });
  else if ('terms' in p) for (const t of p.terms) predicateRefs(t, out);
  return out;
}

export function allCandidates(logic: CaseLogic): Candidate[] {
  let out: Candidate[] = [{}];
  for (const axis of logic.axes) {
    const next: Candidate[] = [];
    for (const c of out) for (const v of axis.values) next.push({ ...c, [axis.id]: v.id });
    out = next;
  }
  return out;
}

/** Candidates consistent with the given clue IDs (required or optional). */
export function solve(logic: CaseLogic, clueIds: readonly string[]): Candidate[] {
  const preds = clueIds.map((id) => {
    const clue = logic.clues.find((c) => c.id === id);
    if (!clue) throw new Error(`unknown clue ${id}`);
    return clue.predicate;
  });
  return allCandidates(logic).filter((c) => preds.every((p) => evalPredicate(p, c)));
}

/** True when every candidate left by `clueIds` has (or lacks, for 'excluded') this value. */
export function proves(logic: CaseLogic, clueIds: readonly string[], axis: string, value: string, mark: 'excluded' | 'confirmed'): boolean {
  const left = solve(logic, clueIds);
  if (left.length === 0) return false;
  return mark === 'excluded' ? left.every((c) => c[axis] !== value) : left.every((c) => c[axis] === value);
}

export const sameCandidate = (a: Candidate, b: Candidate) =>
  Object.keys(a).length === Object.keys(b).length && Object.keys(a).every((k) => a[k] === b[k]);

// ---------------------------------------------------------------- conditions

export interface RunState {
  visited: Set<string>;
  flags: Set<string>;
  clues: Set<string>;
  skills: Set<string>;
  confirmed: Set<string>;
}

export function evalCond(c: Cond, s: RunState): boolean {
  if ('clue' in c) return s.clues.has(c.clue);
  if ('visited' in c) return s.visited.has(c.visited);
  if ('flag' in c) return s.flags.has(c.flag);
  if ('skill' in c) return s.skills.has(c.skill);
  if ('notebookConfirmed' in c) return s.confirmed.has(c.notebookConfirmed);
  if ('all' in c) return c.all.every((x) => evalCond(x, s));
  if ('any' in c) return c.any.some((x) => evalCond(x, s));
  return !evalCond(c.not, s);
}

export function condRefs(c: Cond, out: { kind: string; id: string }[] = []): { kind: string; id: string }[] {
  if ('clue' in c) out.push({ kind: 'clue', id: c.clue });
  else if ('visited' in c) out.push({ kind: 'visited', id: c.visited });
  else if ('flag' in c) out.push({ kind: 'flag', id: c.flag });
  else if ('skill' in c) out.push({ kind: 'skill', id: c.skill });
  else if ('notebookConfirmed' in c) out.push({ kind: 'axis', id: c.notebookConfirmed });
  else if ('all' in c) c.all.forEach((x) => condRefs(x, out));
  else if ('any' in c) c.any.forEach((x) => condRefs(x, out));
  else condRefs(c.not, out);
  return out;
}
