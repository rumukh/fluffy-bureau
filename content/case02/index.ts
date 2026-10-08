// Case 2 «Письма, которые улетели»: three explicit variants.
import { finaleHeart, finaleHearts, type CaseSource } from '../../tools/content/dsl.ts';
import { level1 } from './l1.ts';
import { level2 } from './l2.ts';
import { level3 } from './l3.ts';
import { linesNew } from './lines-new.ts';
import { linesPm } from './lines-pm.ts';
import { rewards } from './common.ts';

export const case02: CaseSource = {
  id: 'case02',
  lines: [...linesPm, ...linesNew],
  skills: [
    { id: 'button-cipher', title: 'SK-button-cipher' },
    { id: 'postal', title: 'SK-postal' },
  ],
  rewards: [...rewards, ...finaleHearts(2)],
  variants: [finaleHeart(level1, 2, 1), finaleHeart(level2, 2, 2), finaleHeart(level3, 2, 3)],
  genderReview: [
    { id: 'C2-7-15', rev: 1, reason: '«Твоя версия» относится к слову «версия», не к игроку.' },
    { id: 'C2-L2-3-09', rev: 1, reason: '«Поправили себя» обращено к мышатам во множественном числе, не к игроку.' },
    { id: 'C2-7-09', rev: 1, reason: 'Пудинг обращается к Стелле женского рода; это не обращение к игроку.' },
  ],
};
