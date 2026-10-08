// Exhaustive exploration of a variant's flow. Every reachable decision point is visited for a
// fresh profile and for a veteran profile (all mechanics already learned).
import type { CaseLogic, HintChannel, Scene, Step } from '../../packages/content/src/schema.ts';
import type { VariantSource } from './dsl.ts';
import { kindLines } from './kinds.ts';
import { condRefs, evalCond, type RunState } from './logic.ts';
import { norm, tokenize } from './text.ts';

export interface Issue {
  level: 'error' | 'warning';
  code: string;
  where: string;
  message: string;
}

export interface FlowReport {
  profile: string;
  states: number;
  endings: number;
  maxVisibleOptions: number;
  minGlossary: Record<string, number>;
  scenesReached: Set<string>;
  linesReached: Set<string>;
  cluesRevealed: Set<string>;
}

interface Walk {
  st: RunState;
  solved: boolean;
  gloss: Record<string, string[]>; // distinct line IDs per term, capped at 3
  presented: string[]; // red herrings presented and not yet explained
}

const clone = (w: Walk): Walk => ({
  st: {
    visited: new Set(w.st.visited), flags: new Set(w.st.flags), clues: new Set(w.st.clues),
    skills: new Set(w.st.skills), confirmed: new Set(w.st.confirmed),
  },
  solved: w.solved,
  gloss: Object.fromEntries(Object.entries(w.gloss).map(([k, v]) => [k, [...v]])),
  presented: [...w.presented],
});

const keyOf = (scene: string, w: Walk) =>
  [scene, w.solved ? 'S' : '', [...w.st.visited].sort().join(','), [...w.st.flags].sort().join(','), [...w.st.clues].sort().join(','),
    [...w.st.skills].sort().join(','), [...w.st.confirmed].sort().join(','),
    Object.entries(w.gloss).map(([k, v]) => `${k}=${[...v].sort().join('+')}`).join(';'), [...w.presented].sort().join(',')].join('|');

export function exploreFlow(
  v: VariantSource,
  textOf: (id: string) => string | undefined,
  initialSkills: string[],
  profile: string,
  issues: Issue[],
): FlowReport {
  const scenes = new Map(v.scenes.map((s) => [s.id, s]));
  const logic: CaseLogic = v.logic;
  const required = logic.clues.filter((c) => c.required).map((c) => c.id);
  const rhPresent = new Map<string, string[]>();
  const rhExplain = new Map<string, string>();
  for (const rh of logic.redHerrings) {
    for (const l of rh.presentedBy) rhPresent.set(l, [...(rhPresent.get(l) ?? []), rh.id]);
    for (const l of rh.explainedBy) rhExplain.set(l, rh.id);
  }
  const confirmAxes = new Set<string>();
  const scanConds = (steps: Step[]) => {
    for (const s of steps) {
      if (s.t === 'if') { condRefs(s.when).filter((r) => r.kind === 'axis').forEach((r) => confirmAxes.add(r.id)); scanConds(s.then); scanConds(s.else); }
      if (s.t === 'skill') { scanConds(s.first); scanConds(s.known); }
    }
  };
  v.scenes.forEach((s) => scanConds(s.steps));
  condRefs(logic.version.available).filter((r) => r.kind === 'axis').forEach((r) => confirmAxes.add(r.id));

  const report: FlowReport = {
    profile, states: 0, endings: 0, maxVisibleOptions: 0, minGlossary: Object.fromEntries(v.glossary.map((g) => [g.id, Infinity])),
    scenesReached: new Set(), linesReached: new Set(), cluesRevealed: new Set(),
  };
  const seen = new Set<string>();
  const err = (code: string, where: string, message: string) => {
    const full = `${v.pack}/${profile}: ${where}`;
    if (!issues.some((i) => i.code === code && i.where === full && i.message === message)) issues.push({ level: 'error', code, where: full, message });
  };
  const formsByTerm = v.glossary.map((g) => ({ id: g.id, forms: new Set(g.forms.map(norm)) }));

  const playLine = (w: Walk, id: string) => {
    report.linesReached.add(id);
    const text = textOf(id);
    if (text === undefined) return;
    const words = new Set(tokenize(text).map(norm));
    for (const t of formsByTerm) {
      if ([...words].some((x) => t.forms.has(x))) {
        const list = (w.gloss[t.id] ??= []);
        if (!list.includes(id) && list.length < 3) list.push(id);
      }
    }
    for (const rh of rhPresent.get(id) ?? []) if (!w.presented.includes(rh)) w.presented.push(rh);
    const ex = rhExplain.get(id);
    if (ex) w.presented = w.presented.filter((x) => x !== ex);
  };

  const checkHints = (where: string, w: Walk, ch: HintChannel | null, name: string, exact: boolean) => {
    if (!ch || w.solved) return;
    const rule = ch.rules.find((r) => evalCond(r.when, w.st));
    if (rule) {
      for (const c of rule.cites) if (!w.st.clues.has(c)) err('HINT-REVEALS', where, `${name} ${rule.id} cites unrevealed clue ${c}`);
    } else if (exact && required.some((c) => !w.st.clues.has(c))) {
      err('HINT-GAP', where, `${name}: no exact hint applies while required clues are missing (${required.filter((c) => !w.st.clues.has(c)).join(', ')})`);
    }
  };

  const finish = (w: Walk, where: string) => {
    report.endings++;
    if (!w.solved) err('FLOW-END-UNSOLVED', where, 'route ends without solving the case');
    for (const g of v.glossary) {
      const n = w.gloss[g.id]?.length ?? 0;
      report.minGlossary[g.id] = Math.min(report.minGlossary[g.id]!, n);
      if (n < 3) err('GLOSSARY-REPEAT', where, `term «${g.word}» occurs in ${n} distinct lines on a route (need ≥3)`);
    }
    for (const rh of w.presented) err('RED-HERRING-UNEXPLAINED', where, `red herring ${rh} presented but never explained on this route`);
  };

  // Runs steps; returns false when control left the scene (goto/menu/end).
  const run = (steps: Step[], w: Walk, sceneId: string, depth: number): boolean => {
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i]!;
      const where = `${sceneId}#${i}`;
      switch (s.t) {
        case 'line': playLine(w, s.line); break;
        case 'minigame': {
          const m = v.minigames.find((x) => x.id === s.minigame);
          if (!m) break;
          const c = m.config;
          const sure: string[] = [];
          const maybe: string[] = [];
          const opts = (os: { correct: boolean; reply: string[] }[]) => os.forEach((o) => (o.correct ? sure : maybe).push(...o.reply));
          if (c.kind === 'magnifier') { c.targets.forEach((t) => (t.required ? sure : maybe).push(...t.reply)); sure.push(...c.afterFirst); }
          if (c.kind === 'cocoa') c.rounds.forEach((r) => { r.options.forEach((o) => maybe.push(...o.reply)); maybe.push(...r.retry); });
          if (c.kind === 'tracks') { c.steps.forEach((st) => { if (st.prompt) sure.push(st.prompt); opts(st.options); }); if (c.question) { sure.push(c.question.prompt); opts(c.question.options); } }
          if (c.kind === 'scent-pairs') { maybe.push(...c.mismatch); if (c.question) { sure.push(c.question.prompt); opts(c.question.options); } }
          if (c.kind === 'timeline') maybe.push(...c.wrong);
          if (c.kind === 'staged') { c.steps.forEach((st) => { if (st.prompt) sure.push(st.prompt); opts(st.options); }); maybe.push(...c.lines); }
          if (c.kind === 'baker') { c.steps.forEach((st) => { sure.push(st.prompt); maybe.push(...st.afterWrong); }); maybe.push(...c.tooMuch, ...c.tooLittle); }
          const extra = kindLines(c);
          if (extra) { sure.push(...extra.sure); maybe.push(...extra.maybe); }
          sure.forEach((id) => playLine(w, id));
          // Optional replies may present a red herring (never count as teaching or as an explanation).
          for (const id of maybe) {
            report.linesReached.add(id);
            for (const rh of rhPresent.get(id) ?? []) if (!w.presented.includes(rh)) w.presented.push(rh);
          }
          break;
        }
        case 'cutscene': {
          const c = v.cutscenes.find((x) => x.id === s.cutscene);
          for (const st of c?.document?.steps ?? []) if (st.op === 'line') playLine(w, st.line);
          break;
        }
        case 'dir': case 'await': case 'reward': break;
        case 'clue': w.st.clues.add(s.clue); report.cluesRevealed.add(s.clue); break;
        case 'set': w.st.flags.add(s.flag); break;
        case 'skill': {
          const known = w.st.skills.has(s.skill);
          w.st.skills.add(s.skill);
          if (!run(known ? s.known : s.first, w, sceneId, depth)) return false;
          break;
        }
        case 'if':
          if (!run(evalCond(s.when, w.st) ? s.then : s.else, w, sceneId, depth)) return false;
          break;
        case 'goto': enter(s.scene, w, depth + 1); return false;
        case 'end': finish(w, where); return false;
        case 'menu': {
          const visible = s.options.filter((o) => (o.when === null || evalCond(o.when, w.st)) && !(o.hideWhen && evalCond(o.hideWhen, w.st)));
          report.maxVisibleOptions = Math.max(report.maxVisibleOptions, visible.length);
          if (visible.length > 3) err('CHOICES-MAX', where, `${visible.length} options visible: ${visible.map((o) => o.id).join(', ')}`);
          if (!Number.isInteger(s.pageSize) || s.pageSize < 1 || s.pageSize > 3) err('CHOICES-PAGE', where, `pageSize ${JSON.stringify(s.pageSize)} must be 1–3`);
          const available = evalCond(logic.version.available, w.st);
          if (v.kind === 'case' && available && required.some((c) => !w.st.clues.has(c))) err('VERSION-EARLY', where, 'version button available before all required clues');
          checkHints(where, w, v.hints?.klubok ?? null, 'klubok', true);
          checkHints(where, w, v.hints?.shell ?? null, 'shell', v.hints?.shell?.precision === 'exact');
          const branches: (() => void)[] = visible.map((o) => () => enter(o.to, clone(w), depth + 1));
          if (s.back) branches.push(() => enter(s.back!, clone(w), depth + 1));
          if (available && !w.solved) branches.push(() => { const n = clone(w); n.solved = true; enter(logic.version.onSolved, n, depth + 1); });
          for (const axis of confirmAxes) if (!w.st.confirmed.has(axis)) branches.push(() => { const n = clone(w); n.st.confirmed.add(axis); enter(sceneId, n, depth + 1); });
          if (branches.length === 0) err('FLOW-STUCK', where, 'menu has no visible option, back or version');
          branches.forEach((b) => b());
          return false;
        }
      }
    }
    return true;
  };

  const enter = (sceneId: string, w: Walk, depth: number) => {
    const scene: Scene | undefined = scenes.get(sceneId);
    if (!scene) { err('REF-SCENE', sceneId, 'unknown scene'); return; }
    if (depth > 400) { err('FLOW-DEPTH', sceneId, 'flow too deep (loop?)'); return; }
    w.st.visited.add(sceneId);
    const key = keyOf(sceneId, w);
    if (seen.has(key)) return;
    seen.add(key);
    report.states++;
    report.scenesReached.add(sceneId);
    if (run(scene.steps, w, sceneId, depth)) err('FLOW-FALLTHROUGH', sceneId, 'scene ends without goto, menu or end');
  };

  enter(v.start, {
    st: { visited: new Set(), flags: new Set(), clues: new Set(), skills: new Set(initialSkills), confirmed: new Set() },
    solved: false, gloss: {}, presented: [],
  }, 0);
  for (const s of v.scenes) if (!report.scenesReached.has(s.id)) err('FLOW-UNREACHABLE', s.id, 'scene is never reached');
  return report;
}

/** G amendment 1: a scene must be safe to re-enter from step 0 — no condition may depend on an effect earlier in the same scene. */
export function restartSafety(v: VariantSource, issues: Issue[]) {
  for (const scene of v.scenes) {
    const produced = new Set<string>();
    const walk = (steps: Step[]) => {
      for (const s of steps) {
        if (s.t === 'clue') produced.add(`clue:${s.clue}`);
        if (s.t === 'set') produced.add(`flag:${s.flag}`);
        if (s.t === 'if') {
          for (const r of condRefs(s.when)) if (produced.has(`${r.kind}:${r.id}`)) {
            issues.push({ level: 'error', code: 'RESTART-SAFETY', where: `${v.pack}: ${scene.id}`, message: `condition reads ${r.kind} ${r.id} produced earlier in the same scene` });
          }
          walk(s.then); walk(s.else);
        }
        if (s.t === 'skill') { walk(s.first); walk(s.known); }
        if ((s.t === 'menu' || s.t === 'goto' || s.t === 'end') && s !== steps[steps.length - 1]) {
          issues.push({ level: 'error', code: 'FLOW-AFTER-EXIT', where: `${v.pack}: ${scene.id}`, message: `${s.t} must be the last step of its block` });
        }
      }
    };
    walk(scene.steps);
  }
}
