import type { Reward } from '../../packages/content/src/schema.ts';
// Case 5 (C2, preparatory). Three explicit variants; see content/case01 for the model.
import { finaleHeart, finaleHearts, type CaseSource } from '../../tools/content/dsl.ts';
import { level1 } from './l1.ts';
import { level2 } from './l2.ts';
import { level3 } from './l3.ts';
import { linesNew } from './lines-new.ts';
import { linesPm } from './lines-pm.ts';

export const case05: CaseSource = {
  id: 'case05',
  lines: [...linesPm, ...linesNew],
  skills: [
    { id: 'quiet-shelf', title: 'SK-quiet-shelf' },
    { id: 'sound-waves', title: 'SK-sound-waves' },
    { id: 'night-rules', title: 'SK-night-rules' },
  ],
  rewards: [...([
    { id: 'rw-c5-secret-note', kind: 'sticker', label: 'C5-COL-secret-feather', amount: 1, claimKey: 'case05:secret-note:feather' },
    { id: 'rw-c5-heart-rules', kind: 'hearts', label: 'RW-heart', amount: 1, claimKey: 'case05:heart:rules' },
    { id: 'rw-c5-badge', kind: 'badge', label: 'RW-c5-badge', amount: 1, claimKey: 'case05:badge' },
    { id: 'rw-c5-buttons-l1', kind: 'buttons', label: 'RW-buttons-10', amount: 10, claimKey: 'case05:l1:buttons' },
    { id: 'rw-c5-buttons-l2', kind: 'buttons', label: 'RW-buttons-15', amount: 15, claimKey: 'case05:l2:buttons' },
    { id: 'rw-c5-buttons-l3', kind: 'buttons', label: 'RW-buttons-20', amount: 20, claimKey: 'case05:l3:buttons' },
    { id: 'rw-c5-sticker-l1', kind: 'sticker', label: 'RW-c5-sticker-1', amount: 1, claimKey: 'case05:l1:sticker' },
    { id: 'rw-c5-sticker-l2', kind: 'sticker', label: 'RW-c5-sticker-2', amount: 1, claimKey: 'case05:l2:sticker' },
    { id: 'rw-c5-sticker-l3', kind: 'sticker', label: 'RW-c5-sticker-3', amount: 1, claimKey: 'case05:l3:sticker' },
    { id: 'rw-c5-decor-shelf', kind: 'decor', label: 'RW-c5-decor-shelf', amount: 1, claimKey: 'case05:decor:shelf' },
    { id: 'rw-c5-activity', kind: 'activity', label: 'RW-c5-activity', amount: 1, claimKey: 'case05:activity:library' },
  ] satisfies Reward[]), ...finaleHearts(5)],
  variants: [finaleHeart(level1, 5, 1), finaleHeart(level2, 5, 2), finaleHeart(level3, 5, 3)],
  genderReview: [
    { id: 'C5-L2-4-06', rev: 1, reason: 'Вежливое обращение к мэру Пудингу, не к игроку.' },
    { id: 'C5-8-15', rev: 1, reason: 'Слово «подтвердилась» относится к версии, не к игроку.' },
  ],
};