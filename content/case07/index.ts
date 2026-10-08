// Case 7 «Пруд идёт в гости»: three explicit variants.
import type { CaseSource } from '../../tools/content/dsl.ts';
import { level1 } from './l1.ts';
import { level2 } from './l2.ts';
import { level3 } from './l3.ts';
import { linesNew } from './lines-new.ts';
import { linesPm } from './lines-pm.ts';
import { rewardsCatalog } from './common.ts';

export const case07: CaseSource = {
  id: 'case07',
  lines: [...linesPm, ...linesNew],
  skills: [
    { id: 'cause-chain', title: 'SK-cause-chain' },
    { id: 'dam-repair', title: 'SK-dam-repair' },
  ],
  rewards: rewardsCatalog,
  variants: [level1, level2, level3],
  genderReview: [
    { id: 'C7-3-05', rev: 1, reason: '«Добрая» согласуется со словом «душа» (ж. р. существительного), а не с родом игрока; правка не нужна.' },
    { id: 'C7-L2-3-07', rev: 1, reason: '«поправил себя» относится к Картофану, а не к игроку.' },
    { id: 'C7-L3-4-03', rev: 1, reason: '«поправила себя» относится к Стелле, а не к игроку.' },
    { id: 'C7-8-14', rev: 1, reason: '«подтвердилась» согласовано со словом «версия», не обращение к игроку.' },
    { id: 'C7-9-13', rev: 1, reason: '«не успела» — реплика Дамки о себе, не обращение к игроку.' },
  ],
};
