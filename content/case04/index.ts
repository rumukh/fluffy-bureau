// Case 4 «Варенье из глубокого погреба»: three explicit variants.
import type { CaseSource } from '../../tools/content/dsl.ts';
import { rewards } from './common.ts';
import { level1 } from './l1.ts';
import { level2 } from './l2.ts';
import { level3 } from './l3.ts';
import { linesNew } from './lines-new.ts';
import { linesPm } from './lines-pm.ts';

export const case04: CaseSource = {
  id: 'case04',
  lines: [...linesPm, ...linesNew],
  variants: [level1, level2, level3],
  skills: [
    { id: 'dream-keeper', title: 'SK-dream-keeper' },
    { id: 'equal-share', title: 'SK-equal-share' },
    { id: 'cart-match', title: 'SK-cart-match' },
  ],
  rewards,
  genderReview: [
    { id: 'C4-L3-3-04', rev: 1, reason: 'Картофан говорит о себе («поправил себя»), не обращается к игроку.' },
    { id: 'C4-5-04', rev: 1, reason: '«ещё один» относится к сну, не к игроку.' },
    { id: 'C4-7-15', rev: 1, reason: '«подтвердилась» относится к версии, не к игроку.' },
    { id: 'C4-7-17', rev: 1, reason: 'Хвостс обращается к Пухлику, мужскому персонажу.' },
  ],
};
