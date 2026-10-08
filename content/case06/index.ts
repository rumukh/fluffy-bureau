import type { Reward } from '../../packages/content/src/schema.ts';
// Case 6 «Загадка Золотого Жёлудя»: normalized preparatory variants.
import { finaleHeart, finaleHearts, type CaseSource } from '../../tools/content/dsl.ts';
import { level1 } from './l1.ts';
import { level2 } from './l2.ts';
import { level3 } from './l3.ts';
import { linesNew } from './lines-new.ts';
import { linesPm } from './lines-pm.ts';

export const case06: CaseSource = {
  id: 'case06',
  lines: [...linesPm, ...linesNew],
  skills: [    { id: 'compass-route', title: 'SK-compass-route' },
    { id: 'compass-directions', title: 'SK-compass-directions' },  ],
  rewards: [...([
    { id: 'rw-c6-badge', kind: 'badge', label: 'RW-c6-badge', amount: 1, claimKey: 'case06:badge' },
    { id: 'rw-c6-buttons-l1', kind: 'buttons', label: 'RW-buttons-10', amount: 10, claimKey: 'case06:l1:buttons' },
    { id: 'rw-c6-buttons-l2', kind: 'buttons', label: 'RW-buttons-15', amount: 15, claimKey: 'case06:l2:buttons' },
    { id: 'rw-c6-buttons-l3', kind: 'buttons', label: 'RW-buttons-20', amount: 20, claimKey: 'case06:l3:buttons' },
    { id: 'rw-c6-sticker-l1', kind: 'sticker', label: 'RW-c6-sticker-1', amount: 1, claimKey: 'case06:l1:sticker' },
    { id: 'rw-c6-sticker-l2', kind: 'sticker', label: 'RW-c6-sticker-2', amount: 1, claimKey: 'case06:l2:sticker' },
    { id: 'rw-c6-sticker-l3', kind: 'sticker', label: 'RW-c6-sticker-3', amount: 1, claimKey: 'case06:l3:sticker' },
    { id: 'rw-c6-decor-compass', kind: 'decor', label: 'RW-c6-decor-compass', amount: 1, claimKey: 'case06:decor:compass' },
    { id: 'rw-c6-title-detective', kind: 'title', label: 'RW-c6-title-detective', amount: 1, claimKey: 'case06:title:detective' },
    { id: 'rw-c6-activity', kind: 'activity', label: 'RW-c6-activity', amount: 1, claimKey: 'case06:activity:compass' },
  ] satisfies Reward[]), ...finaleHearts(6)],
  variants: [finaleHeart(level1, 6, 1), finaleHeart(level2, 6, 2), finaleHeart(level3, 6, 3)],
  genderReview: [
    { id: 'C6-L2-3-04', rev: 1, reason: '«поправила себя» относится к Стелле, не к игроку' },
    { id: 'C6-L3-3-03', rev: 1, reason: '«поправила себя» относится к Дамке, не к игроку' },
    { id: 'C6-7-02', rev: 1, reason: '«форма знакома» относится к форме замка, не к роду игрока' },
    { id: 'C6-7-12', rev: 1, reason: '«версия подтвердилась» относится к версии, не к игроку' },
  ],
};

