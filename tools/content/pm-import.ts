// Extracts every ID-bearing line from the read-only PM scripts.
// Used to detect drift between normalized content and PM originals.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export interface PmLine {
  id: string;
  speaker: string | null;
  text: string;
  file: string;
  line: number;
}

const PM_DIR = join(import.meta.dirname, '..', '..', 'docs', 'pm', '2026-10-07');
const ID = String.raw`(?:P\d|C\d|L[23])(?:-[A-Za-z0-9]+)+`;
const ENTRY = new RegExp(
  String.raw`(?<![\w-])(${ID})\s+(?:\*\*([^*]+?):\*\*\s+)?«(.+?)»(?=\s*(?:\(|\||→|$|\.|,|;|—|\*))`,
  'gu',
);

export function readPmLines(dir = PM_DIR): PmLine[] {
  const out: PmLine[] = [];
  for (const file of readdirSync(dir).filter((f) => f.startsWith('SCRIPT_') && f !== 'SCRIPT_INDEX_RU.md')) {
    const rows = readFileSync(join(dir, file), 'utf8').split(/\r?\n/);
    rows.forEach((row, i) => {
      for (const m of row.matchAll(ENTRY)) {
        out.push({ id: m[1]!, speaker: m[2]?.trim() ?? null, text: m[3]!.trim(), file, line: i + 1 });
      }
    });
  }
  return out;
}

export function pmIndex(dir = PM_DIR): Map<string, PmLine[]> {
  const map = new Map<string, PmLine[]>();
  for (const l of readPmLines(dir)) {
    const list = map.get(l.id) ?? [];
    list.push(l);
    map.set(l.id, list);
  }
  return map;
}

if (import.meta.main) {
  const lines = readPmLines();
  const idx = pmIndex();
  const conflicts = [...idx.values()].filter((v) => new Set(v.map((x) => x.text)).size > 1);
  const byFile = new Map<string, number>();
  for (const l of lines) byFile.set(l.file, (byFile.get(l.file) ?? 0) + 1);
  console.log(`entries: ${lines.length}, unique ids: ${idx.size}`);
  for (const [f, n] of byFile) console.log(`  ${f}: ${n}`);
  console.log(`ids with conflicting text: ${conflicts.length}`);
  for (const c of conflicts.slice(0, 40)) console.log(`  ${c[0]!.id}: ${c.map((x) => `${x.file}:${x.line} «${x.text}»`).join(' | ')}`);
  if (process.argv.includes('--dump')) console.log(JSON.stringify(lines, null, 1));
}
