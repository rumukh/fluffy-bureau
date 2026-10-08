import { describe, expect, it } from 'vitest';
import { case01 } from '../../../content/case01/index.ts';
import { prologue } from '../../../content/prologue/index.ts';
import { shared as sharedSource } from '../../../content/shared/index.ts';

const stage1 = [prologue, case01];
import { genderReview } from '../../../content/shared/gender-review.ts';
import type { AuthoredLine, CaseSource, SharedSource, VariantSource } from '../dsl.ts';
import { build } from '../compile.ts';
import { genderFlags, sentences, tokenize } from '../text.ts';

interface Src { shared: SharedSource; cases: CaseSource[] }
type Mut = (s: Src) => void;
const variant = (s: Src, pack: string): VariantSource => s.cases.flatMap((c) => c.variants).find((v) => v.pack === pack)!;
const line = (s: Src, id: string): AuthoredLine => [s.shared.lines, ...s.cases.map((c) => c.lines)].flat().find((l) => l.id === id)!;

function codes(mutate?: Mut): string[] {
  const s: Src = { shared: structuredClone(sharedSource), cases: structuredClone(stage1) };
  mutate?.(s);
  return build(s.shared, s.cases, genderReview).issues.filter((i) => i.level === 'error').map((i) => i.code);
}

describe('text rules', () => {
  it('counts {имя} as one word and hyphenated words once', () => {
    expect(tokenize('Записала, {имя}! Лапа-лопатка.')).toEqual(['Записала', 'ИМЯ', 'Лапа-лопатка']);
    expect(tokenize('8:00. Стелла — улетает.')).toEqual(['8', '00', 'Стелла', 'улетает']);
  });
  it('splits sentences but keeps lowercase continuations after an ellipsis', () => {
    expect(sentences('На голове? Ой… и правда! Вот они!')).toEqual(['На голове?', 'Ой… и правда!', 'Вот они!']);
    expect(sentences('Сравни след с карточками. Чья это лапа?')).toHaveLength(2);
  });
  it('flags gendered address to the player', () => {
    expect(genderFlags('Грустно. Но спасибо, что спросил.')).toHaveLength(1);
    expect(genderFlags('Ой, новенький стажёр!')).toHaveLength(1);
    expect(genderFlags('Ты устал?')).toHaveLength(1);
    expect(genderFlags('Нужен отдых? Нажми паузу.')).toHaveLength(0);
  });
});

describe('content build', () => {
  it('Stage 1 sources validate without errors', () => {
    expect(codes()).toEqual([]);
  });
  it('fails on sentences over ten words', () => {
    expect(codes((s) => {
      const l = line(s, 'C1-1-01');
      l.text = 'Беда! Мой большой вкусный черничный пирог совсем куда-то пропал прямо со скамейки утром!';
      l.changes = [{ before: 'Беда! Мой черничный пирог пропал!', reason: 'test', ref: 'test' }];
      l.rev = 2;
    })).toContain('WORDS-MAX');
  });
  it('fails when a PM line is dropped from content', () => {
    expect(codes((s) => { s.cases[1]!.lines = s.cases[1]!.lines.filter((l) => l.id !== 'C1-7-16'); })).toContain('PM-MISSING');
  });
  it('fails on text drift from the PM script without a change record', () => {
    expect(codes((s) => { line(s, 'C1-1-02').text = 'Я испёк его к ужину.'; })).toContain('PM-DRIFT');
  });
  it('fails on duplicate and missing IDs', () => {
    expect(codes((s) => { s.cases[1]!.lines.push({ ...line(s, 'C1-1-01') }); })).toContain('ID-DUPLICATE');
    expect(codes((s) => { variant(s, 'case01-l1').facts[0]!.line = 'C1-9-99'; })).toContain('REF-LINE');
  });
  it('fails when a case does not have exactly three facts', () => {
    expect(codes((s) => { variant(s, 'case01-l2').facts.pop(); })).toContain('FACTS');
  });
  it('fails on more than three new glossary terms', () => {
    expect(codes((s) => { const v = variant(s, 'case01-l1'); v.glossary.push({ ...v.glossary[0]!, id: 'extra' }); })).toContain('GLOSSARY-MAX');
  });
  it('fails when a glossary word is repeated fewer than three times on a route', () => {
    expect(codes((s) => { variant(s, 'case01-l1').glossary[1]!.forms = ['свидетелем']; })).toContain('GLOSSARY-REPEAT');
  });
  it('fails on gendered address to the player', () => {
    expect(codes((s) => { const l = line(s, 'L3-3-01'); l.text = 'Грустно. Но спасибо, что спросил.'; l.changes = []; l.rev = 1; })).toContain('GENDER');
  });
  it('fails when more than three options are visible', () => {
    expect(codes((s) => {
      const hub = variant(s, 'case01-l1').scenes.find((x) => x.id === 'C1-HUB')!;
      const menu = hub.steps.find((x) => x.t === 'menu');
      if (menu?.t === 'menu') menu.options[3]!.when = null;
    })).toContain('CHOICES-MAX');
  });
  it('fails when the required clues leave more than one candidate', () => {
    expect(codes((s) => { variant(s, 'case01-l2').logic.clues.find((c) => c.id === 'c1-timeline')!.predicate = { op: 'ne', axis: 'who', value: 'stella' }; })).toContain('LOGIC-UNIQUE');
  });
  it('fails when a cited clue does not really exclude the value (R03)', () => {
    expect(codes((s) => { variant(s, 'case01-l1').logic.wrongVersion.byValue.find((b) => b.value === 'pudding')!.clues = ['c1-cocoa']; })).toContain('R03-EXCLUSION');
  });
  it('fails when a wrong value has no explanation', () => {
    expect(codes((s) => { variant(s, 'case01-l3').logic.wrongVersion.byValue.pop(); })).toContain('WRONG-UNEXPLAINED');
  });
  it('fails when a clue contradicts the answer (false hard fact)', () => {
    expect(codes((s) => { variant(s, 'case01-l1').logic.clues.find((c) => c.id === 'c1-mayor')!.predicate = { op: 'ne', axis: 'what', value: 'mixed' }; })).toContain('LOGIC-CONTRADICTION');
  });
  it('fails when a red herring is not explained on a route', () => {
    expect(codes((s) => { variant(s, 'case01-l2').logic.redHerrings.find((r) => r.id === 'rh-c1-feather')!.explainedBy = ['L3-9-01']; })).toContain('RED-HERRING-UNEXPLAINED');
  });
  it('fails when a hint cites an unrevealed clue or exact hints leave a gap', () => {
    expect(codes((s) => { variant(s, 'case01-l1').hints!.klubok.rules[0]!.cites = ['c1-tracks']; })).toContain('HINT-REVEALS');
    expect(codes((s) => { variant(s, 'case01-l3').hints!.klubok.rules.splice(3, 1); })).toContain('HINT-GAP');
  });
  it('fails when notebook help claims an unproven mark', () => {
    expect(codes((s) => { variant(s, 'case01-l1').notebookHelp!.marks[0]!.clues = ['c1-lupa']; })).toContain('R03-NOTEBOOK');
  });
  it('fails when a required clue is unreachable', () => {
    expect(codes((s) => {
      const sc = variant(s, 'case01-l1').scenes.find((x) => x.id === 'C1-3')!;
      sc.steps = sc.steps.filter((x) => x.t !== 'clue');
    })).toContain('CLUE-UNREACHABLE');
  });
  it('fails when a scene condition reads an effect from the same scene (restart safety)', () => {
    expect(codes((s) => {
      const sc = variant(s, 'case01-l1').scenes.find((x) => x.id === 'C1-4')!;
      sc.steps.splice(6, 0, { t: 'if', when: { clue: 'c1-mayor' }, then: [], else: [] });
    })).toContain('RESTART-SAFETY');
  });
  describe('cutscenes (T25)', () => {
    const shed = (s: Src) => variant(s, 'case01-l1').cutscenes.find((c) => c.id === 'c1.shed.l1')!.document;
    it('fails on an unknown line ID', () => {
      expect(codes((s) => { const d = shed(s); (d.steps as unknown[]).push({ op: 'line', actor: 'khvosts', line: 'C1-7-99' }); })).toContain('CUTSCENE-LINE');
    });
    it('fails when the avatar role is missing', () => {
      expect(codes((s) => { const d = shed(s) as { cast: Record<string, unknown> }; delete d.cast['player']; })).toContain('CUTSCENE-AVATAR');
    });
    it('fails when a line is given to the wrong speaker', () => {
      expect(codes((s) => { const d = shed(s); const st = d.steps.find((x) => x.op === 'line') as { actor?: string }; st.actor = 'khvosts'; })).toContain('CUTSCENE-SPEAKER');
    });
    it('fails when a line does not wait for «Дальше»', () => {
      expect(codes((s) => { const d = shed(s); const st = d.steps.find((x) => x.op === 'line') as { advance?: string }; st.advance = 'auto'; })).toContain('CUTSCENE-ADVANCE');
    });
    it('fails on unknown assets and engine-invalid references', () => {
      const c = codes((s) => { const d = shed(s); (d.steps as unknown[]).unshift({ op: 'background', asset: 'bg.nowhere' }, { op: 'camera', preset: 'dolly' }); });
      expect(c).toContain('ASSET');
      expect(c.some((x) => x.startsWith('E:'))).toBe(true);
    });
    it('fails on an unknown or nested stage background', () => {
      expect(codes((s) => { const sc = variant(s, 'case01-l1').scenes.find((x) => x.id === 'C1-5')!; sc.background = 'bg.nowhere'; })).toContain('BACKGROUND');
      expect(codes((s) => { const sc = variant(s, 'case01-l1').scenes.find((x) => x.id === 'C1-5')!; sc.steps.unshift({ t: 'if', when: { flag: 'x' }, then: [{ t: 'dir', id: 'X-D01', text: 'x', background: 'bg.office' }], else: [] }); })).toContain('BACKGROUND');
    });
    it('fails when a cutscene loads more than four backgrounds', () => {
      expect(codes((s) => { const d = shed(s); (d.steps as unknown[]).unshift(...['bg.office', 'bg.bench', 'bg.garden', 'bg.post'].map((asset) => ({ op: 'background', asset }))); })).toContain('CUTSCENE-BUDGET');
    });
    it('fails when a cutscene step names an unknown cutscene', () => {
      expect(codes((s) => { const sc = variant(s, 'case01-l1').scenes.find((x) => x.id === 'C1-7')!; sc.steps[0] = { t: 'cutscene', cutscene: 'c1.nope' }; })).toContain('REF-CUTSCENE');
    });
  });});
