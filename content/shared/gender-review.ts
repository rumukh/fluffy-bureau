// Manual review of sentences flagged by the gendered-address heuristic (R07, D05).
// Key: line ID + revision. A changed line must be reviewed again.
import type { GenderReview } from '../../tools/content/compile.ts';

export const genderReview: GenderReview[] = [
  { id: 'P0-05', rev: 1, reason: '«Записала» — о себе говорит Ватсони; {имя} — обращение без рода.' },
  { id: 'C1-7-14a', rev: 1, reason: '«Подтвердилась» согласуется с «версия», не с игроком.' },
  { id: 'C1-3-B02', rev: 1, reason: 'Игрок говорит Тёпе (енот, он): «ты добрый» — о Тёпе.' },
  { id: 'L2-3-B02', rev: 1, reason: 'Игрок спрашивает Тёпу: «что видел» — о Тёпе.' },
  { id: 'L2-3-B03', rev: 1, reason: 'Игрок спрашивает Тёпу: «не брал» — о Тёпе.' },
];
