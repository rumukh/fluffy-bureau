// Case 8 «Дело о Большом Сюрпризе»: three explicit variants.
import { finaleHeart, finaleHearts, type CaseSource } from '../../tools/content/dsl.ts';
import { level1 } from './l1.ts';
import { level2 } from './l2.ts';
import { level3 } from './l3.ts';
import { skillDefs, rewardDefs } from './common.ts';
import { linesNew } from './lines-new.ts';
import { linesPm } from './lines-pm.ts';

export const case08: CaseSource = {
  id: 'case08',
  lines: [...linesPm, ...linesNew],
  variants: [finaleHeart(level1, 8, 1), finaleHeart(level2, 8, 2), finaleHeart(level3, 8, 3)],
  skills: skillDefs,
  rewards: [...rewardDefs, ...finaleHearts(8)],
  genderReview: [
    { id: 'C8-0-03', rev: 1, reason: 'Хвостс говорит о себе: «я оставил», это не обращение к игроку (D05).' },
    { id: 'C8-L2-5-03', rev: 1, reason: 'Фраза обращена к Фитильку, не к игроку (D05).' },
    { id: 'C8-L2-8-02', rev: 1, reason: 'Пухлик говорит о себе: «я брал», это не обращение к игроку (D05).' },
    { id: 'C8-L3-6-03', rev: 1, reason: 'Фраза обращена к мышонку, не к игроку (D05).' },
    { id: 'C8-8-13', rev: 1, reason: 'Пудинг говорит Пухлику о записке, не игроку (D05).' },
    { id: 'C8-8-21', rev: 1, reason: '«Версия подтвердилась» относится к версии, не к игроку (D05).' },
    { id: 'C8-11-07', rev: 1, reason: '«Шлюз бы не успел» относится к шлюзу, не к игроку (D05).' },
    { id: 'C8-11-09', rev: 1, reason: 'Ватсони говорит о себе и названии дневника, не о поле игрока (D05).' },
  ],
};
