// «Уютный денёк» (D23, T12, T28, T29) and ranks (D12). Authored in Stage 2.
import type { CozySource } from '../../tools/content/dsl.ts';

export const cozy: CozySource = {
  id: 'cozy',
  lines: [],
  rewards: [],
  cozy: {
    residents: [],
    shop: [],
    decorSlots: [],
    ranks: [],
    lines: { intro: [], bought: [], returned: [], notEnough: [], teaThanks: [] },
  },
};