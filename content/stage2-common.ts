// Lines shared by cases 2–8 that do not belong to Stage 1 (kept out of the Stage 1 shared pack).
import { added, lines, type CaseSource } from '../tools/content/dsl.ts';

const lbl = (reason: string) => added(reason, 'R06', { kind: 'label' });

export const stage2Common: CaseSource = {
  id: 'stage2-common',
  lines: lines('stage2-common', 'label', [
    ['NM-damka', 'narrator', 'Бобёрша Дамка', lbl('Имя героя как озвученная подпись')],
    ['NM-pukhlik', 'narrator', 'Совёнок Пухлик', lbl('Имя героя как озвученная подпись')],
    ['NM-all', 'narrator', 'Все вместе', lbl('Имя хора как озвученная подпись')],
    ['SK-button-cipher', 'narrator', 'Шифр на пуговицах', lbl('Название механики (дела 2, 6, 8)')],
    ['SK-compass', 'narrator', 'Компас', lbl('Название механики (дела 6, 8)')],
  ]),
  variants: [],
  skills: [
    { id: 'button-cipher', title: 'SK-button-cipher' },
    { id: 'compass', title: 'SK-compass' },
  ],
};