import type { Reward } from '../../packages/content/src/schema.ts';
// Case 3 (C2, preparatory). Three explicit variants; see content/case01 for the model.
import { finaleHeart, finaleHearts, type CaseSource } from '../../tools/content/dsl.ts';
import { level1 } from './l1.ts';
import { level2 } from './l2.ts';
import { level3 } from './l3.ts';
import { linesNew } from './lines-new.ts';
import { linesPm } from './lines-pm.ts';

export const case03: CaseSource = {
  id: 'case03',
  lines: [...linesPm, ...linesNew],
  variants: [finaleHeart(level1, 3, 1), finaleHeart(level2, 3, 2), finaleHeart(level3, 3, 3)],
  skills: [
    { id: 'sound-diff', title: 'SK-sound-diff' },
    { id: 'secret-notes', title: 'SK-secret-notes' },
    { id: 'light-code', title: 'SK-light-code' },
    { id: 'read-blink', title: 'SK-read-blink' },
  ],
  rewards: [...([
    { id: 'rw-c3-secret-note', kind: 'decor', label: 'RW-c3-secret-note', amount: 1, claimKey: 'case03:secret-notes' },
    { id: 'rw-c3-badge', kind: 'badge', label: 'RW-c3-badge', amount: 1, claimKey: 'case03:badge' },
    { id: 'rw-c3-buttons-l1', kind: 'buttons', label: 'RW-buttons-10', amount: 10, claimKey: 'case03:l1:buttons' },
    { id: 'rw-c3-buttons-l2', kind: 'buttons', label: 'RW-buttons-15', amount: 15, claimKey: 'case03:l2:buttons' },
    { id: 'rw-c3-buttons-l3', kind: 'buttons', label: 'RW-buttons-20', amount: 20, claimKey: 'case03:l3:buttons' },
    { id: 'rw-c3-sticker-l1', kind: 'sticker', label: 'RW-c3-sticker-1', amount: 1, claimKey: 'case03:l1:sticker' },
    { id: 'rw-c3-sticker-l2', kind: 'sticker', label: 'RW-c3-sticker-2', amount: 1, claimKey: 'case03:l2:sticker' },
    { id: 'rw-c3-sticker-l3', kind: 'sticker', label: 'RW-c3-sticker-3', amount: 1, claimKey: 'case03:l3:sticker' },
    { id: 'rw-c3-decor-lamp', kind: 'decor', label: 'RW-c3-decor-lamp', amount: 1, claimKey: 'case03:decor:lamp' },
    { id: 'rw-c3-activity', kind: 'activity', label: 'RW-c3-activity', amount: 1, claimKey: 'case03:activity:smells' },
  ] satisfies Reward[]), ...finaleHearts(3)],
  genderReview: [
    { id: 'C3-L3-4-05', rev: 1, reason: '«себя» относится к мышатам, не к игроку.' },
    { id: 'C3-8-13', rev: 1, reason: '«твоя дедукция» — род слова «дедукция», не игрока.' },
  ],
};