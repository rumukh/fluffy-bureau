// Lists lines that are new compared with master's packs (Stage 2 PM notice, T28, Q47).
// Usage (repo root): node <this> > docs/content/STAGE2_NEW_TEXTS_RU.md
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';

const masterIds = new Set();
const masterFiles = execSync('git ls-tree --name-only origin/master packages/content/packs/', { encoding: 'utf8' }).trim().split('\n');
for (const f of masterFiles) {
  const p = JSON.parse(execSync(`git show origin/master:${f}`, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
  for (const l of p.lines) masterIds.add(l.id);
}
// PM originals are not new texts.
const pmIds = new Set();
for (const f of readdirSync('docs/pm/2026-10-07').filter((x) => x.startsWith('SCRIPT_'))) {
  for (const m of readFileSync(`docs/pm/2026-10-07/${f}`, 'utf8').matchAll(/(?<![\w-])((?:P\d|C\d|L[23])(?:-[A-Za-z0-9]+)+)\s+(?:\*\*[^*]+?:\*\*\s+)?«/gu)) pmIds.add(m[1]);
}
const productionPacks = ['shared', 'prologue', 'case01-l1', 'case01-l2', 'case01-l3', 'case02-l1', 'case02-l2', 'case02-l3', 'case03-l1', 'case03-l2', 'case03-l3', 'case04-l1', 'case04-l2', 'case04-l3', 'cozy'];
const rows = new Map();
for (const id of productionPacks) {
  const p = JSON.parse(readFileSync(`packages/content/packs/${id}.json`, 'utf8'));
  for (const l of p.lines) {
    if (masterIds.has(l.id) || pmIds.has(l.id) || rows.has(l.id)) continue;
    rows.set(l.id, { ...l, pack: id });
  }
}
const groups = [
  ['Истории жителей и реплики «Уютного денька» (T28, T29)', (l) => l.pack === 'cozy' && l.kind !== 'label'],
  ['Звания (D12)', (l) => /^RANK-/.test(l.id) && l.kind !== 'label'],
  ['Реплики дел 2–4 (новые, не из сценариев)', (l) => /^case0[234]/.test(l.pack) && l.kind !== 'label'],
  ['Подписи (кнопки, карточки, предметы магазина, карты-сны и т. п.)', (l) => l.kind === 'label'],
  ['Прочее', () => true],
];
const speakerName = { narrator: 'Рассказчик', khvosts: 'Хвостс', watsony: 'Ватсони', pudding: 'Пудинг', tyopa: 'Тёпа', fitilyok: 'Фитилёк', kartofan: 'Картофан', stella: 'Стелла', mouse: 'Мышонок', damka: 'Дамка', pukhlik: 'Пухлик', all: 'Все' };
const out = ['# Новые тексты Этапа 2 (уведомление PM, Q47, T28)', '',
  `Строки, которых нет ни в сценариях PM, ни в выпуске v0.1.0. Всего: ${rows.size}. Правила текста те же (≤10 слов в предложении, без рода в обращении, всё озвучено); история изменений — \`CHANGELOG_RU.md\`.`, ''];
const taken = new Set();
for (const [title, pick] of groups) {
  const list = [...rows.values()].filter((l) => !taken.has(l.id) && pick(l));
  if (!list.length) continue;
  list.forEach((l) => taken.add(l.id));
  out.push(`## ${title} (${list.length})`, '', '| ID | Кто | Текст | Пакет |', '|---|---|---|---|');
  for (const l of list) out.push(`| \`${l.id}\` | ${speakerName[l.speaker] ?? l.speaker} | «${l.text}»${l.private ? ' 🔒' : ''} | ${l.pack} |`);
  out.push('');
}
console.log(out.join('\n'));
