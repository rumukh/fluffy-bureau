import { describe, expect, it } from 'vitest';
import { case01 } from '../../../content/case01/index.ts';
import { prologue } from '../../../content/prologue/index.ts';
import { shared as sharedSource } from '../../../content/shared/index.ts';

const stage1 = [prologue, case01];
import { genderReview } from '../../../content/shared/gender-review.ts';
import type { MinigameConfig } from '../../../packages/content/src/schema.ts';
import { checkCozy } from '../cozy.ts';
import type { CaseSource, VariantSource } from '../dsl.ts';
import { build } from '../compile.ts';
import { checkKind } from '../kinds.ts';
import { AssetLedger } from '../staging.ts';

const errors = (c: MinigameConfig, axis?: { id: string; label: string }[], text: Record<string, string> = {}) => {
  const out: string[] = [];
  checkKind(c, (id) => text[id] ?? id, () => axis, (m) => out.push(m));
  return out;
};

describe('Stage 2 minigame kinds', () => {
  const glyph = (id: string, letter: string, colour: string, holes: number, shape: 'circle' | 'square' | 'flower' | 'heart') => ({ id, letter, colour, holes, shape, label: `L-${id}` });
  it('cipher: rejects glyphs that differ only by colour (R01) and wrong spelling', () => {
    const c: MinigameConfig = {
      kind: 'cipher', intro: [], wrong: ['w'],
      table: [glyph('a', 'Д', 'синий', 2, 'circle'), glyph('b', 'У', 'жёлтый', 2, 'circle'), glyph('c', 'Б', 'синий', 3, 'square')],
      words: [{ id: 'w1', answer: 'ДУБ', slots: [{ glyph: 'a', options: ['a', 'b'] }, { glyph: 'b', options: ['b', 'c'] }, { glyph: 'c', options: ['c'] }], solved: ['s'] }],
    };
    expect(errors(c).some((e) => e.startsWith('R01'))).toBe(true);
    const ok: MinigameConfig = { ...c, table: [glyph('a', 'Д', 'синий', 2, 'circle'), glyph('b', 'У', 'жёлтый', 2, 'heart'), glyph('c', 'Б', 'синий', 3, 'square')] };
    expect(errors(ok)).toEqual([]);
    const misspelt: MinigameConfig = { ...ok, words: [{ ...ok.words[0]!, answer: 'ДОБ' }] };
    expect(errors(misspelt).some((e) => e.includes('spell'))).toBe(true);
  });
  it('equal-share: items minus reserve must divide among groups', () => {
    const c: MinigameConfig = { kind: 'equal-share', intro: [], uneven: [], tasks: [{ id: 't', prompt: 'p', items: 13, groups: 3, reserve: 0, itemLabel: 'i', groupLabel: 'g', correct: [] }] };
    expect(errors(c).length).toBe(1);
    expect(errors({ ...c, tasks: [{ ...c.tasks[0]!, reserve: 1 }] })).toEqual([]);
  });
  it('dream-keeper: a card must not name the answer (Q33) and needs facts for every question (T31)', () => {
    const card = (id: string, facts: Record<string, boolean>) => ({ id, label: id, image: `img.${id}`, facts });
    const c: MinigameConfig = {
      kind: 'dream-keeper', intro: [], after: [],
      rounds: [{ id: 'where', axis: 'where', answer: 'pantry', correct: [], wrong: [], cards: [card('c1', { q1: true }), card('c2', { q1: true }), card('c3', {})] }],
      family: { intro: [], keeperPick: [], ask: [], win: [], players: [{ id: 'm', label: 'm' }, { id: 'p', label: 'p' }, { id: 'b', label: 'b' }], questions: [{ id: 'q1', label: 'q' }, { id: 'q2', label: 'q' }, { id: 'q3', label: 'q' }], titles: [{ id: 'k', label: 'k', for: 'keeper' }, { id: 'a', label: 'a', for: 'asker' }, { id: 'g', label: 'g', for: 'guesser' }] },
    };
    const out = errors(c, [{ id: 'pantry', label: 'Кладовка Конторы' }], { c1: 'Дверка в кладовке под лестницей', c2: 'Табличка с лупой', c3: 'Старые зонты' });
    expect(out.some((e) => e.includes('Q33'))).toBe(true);
    expect(out.some((e) => e.includes('T31'))).toBe(true);
  });
  it('read-blink: exactly one lesson matches the drawing', () => {
    const c: MinigameConfig = { kind: 'read-blink', drawing: ['dot', 'dot', 'dash'], wrong: [], lessons: [
      { id: 'hi', label: 'l', correct: true, reply: [], pattern: ['dot', 'dot', 'dash'] },
      { id: 'fr', label: 'l', correct: false, reply: [], pattern: ['dash', 'dot', 'dash'] },
    ] };
    expect(errors(c)).toEqual([]);
    expect(errors({ ...c, lessons: c.lessons.map((l) => ({ ...l, correct: !l.correct })) }).length).toBeGreaterThan(0);
  });
});

describe('stage actions, hotspots and cozy day', () => {
  const codes = (mutate: (v: VariantSource) => void) => {
    const cases = structuredClone(stage1) as CaseSource[];
    mutate(cases[1]!.variants[0]!);
    return build(structuredClone(sharedSource), cases, genderReview).issues.filter((i) => i.level === 'error').map((i) => i.code);
  };
  it('fails when a stage action names an actor outside the scene', () => {
    expect(codes((v) => { const s = v.scenes.find((x) => x.id === 'C1-4')!; s.steps.unshift({ t: 'dir', id: 'X-D01', text: 'x', actions: [{ op: 'emote', actor: 'stella', emote: 'joy' }] }); })).toContain('STAGE-ACTION');
  });
  it('fails on an unknown clip in a stage action (engine validator)', () => {
    expect(codes((v) => { const s = v.scenes.find((x) => x.id === 'C1-4')!; s.steps.unshift({ t: 'dir', id: 'X-D01', text: 'x', actions: [{ op: 'pose', actor: 'pudding', clip: 'moonwalk' }] }); }).some((c) => c.startsWith('E:'))).toBe(true);
  });
  it('fails when the hotspot does not exist on the shown background (U11)', () => {
    expect(codes((v) => { const s = v.scenes.find((x) => x.id === 'C1-5')!; const i = s.steps.findIndex((x) => x.t === 'await'); s.steps[i] = { t: 'await', action: 'hotspot', hotspot: 'chimney' }; })).toContain('HOTSPOT');
  });
  it('cozy: prices follow T11 and stories have 3–5 lines (T28)', () => {
    const issues: { level: 'error' | 'warning'; code: string; where: string; message: string }[] = [];
    checkCozy({
      residents: [{ speaker: 'tyopa', unlockAfter: 1, invite: 'i', stories: [['a', 'b']], teaPrice: 3 }],
      shop: [{ id: 'x', kind: 'decor', label: 'l', asset: 'decor.x', price: { currency: 'buttons', amount: 30 }, unlockAfter: 1 }],
      decorSlots: [], ranks: [], lines: { intro: [], bought: [], returned: [], notEnough: [], teaThanks: [] },
    }, { speakers: ['tyopa'], rewards: [], lineText: () => '', tier: 'skip', ledger: new AssetLedger(), issues });
    const msgs = issues.map((i) => i.message).join(' | ');
    expect(msgs).toContain('3–5');
    expect(msgs).toContain('tea costs');
    expect(msgs).toContain('paid in hearts');
  });
});
