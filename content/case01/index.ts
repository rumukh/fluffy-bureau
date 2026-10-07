// Case 1 «Пирог, которого не было»: three explicit variants.
import type { CaseSource } from '../../tools/content/dsl.ts';
import { level1 } from './l1.ts';
import { level2 } from './l2.ts';
import { level3 } from './l3.ts';
import { linesL1 } from './lines-l1.ts';
import { linesL23 } from './lines-l23.ts';

export const case01: CaseSource = {
  id: 'case01',
  lines: [...linesL1, ...linesL23],
  variants: [level1, level2, level3],
};