// Record a cutscene in E's animation lab: click the cutscene button, press «Дальше» whenever the
// player awaits input, and save a frame every `--every` seconds plus one per event.
// node tools/assets/art/record_cutscene.mjs <labUrl> <cutsceneId> <outDir> [--every 0.5] [--max 90]
//   [--reduced] [--comfort]
// Run from a folder where `playwright` is installed (NODE_PATH or a local node_modules).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(process.env.PLAYWRIGHT_HOME ? join(process.env.PLAYWRIGHT_HOME, 'x.js') : import.meta.url);
const { chromium } = require('playwright');

const [url, id, out, ...rest] = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = rest.indexOf(`--${name}`);
  return i < 0 ? dflt : rest[i + 1];
};
const every = Number(opt('every', '0.5'));
const max = Number(opt('max', '90'));
const reduced = rest.includes('--reduced');
const comfort = rest.includes('--comfort');
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--use-angle=swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
const log = [];
page.on('console', (m) => log.push(`console.${m.type()}: ${m.text()}`));
page.on('pageerror', (e) => log.push(`pageerror: ${e.message}`));
await page.goto(url + (reduced ? '&reducedMotion=1' : ''));
await page.getByRole('button', { name: `Ролик ${id}` }).waitFor({ timeout: 30000 });
if (comfort) await page.getByRole('button', { name: 'Лампа уюта' }).click();
await page.getByRole('button', { name: `Ролик ${id}` }).click();
const stage = page.locator('[data-testid=stage]');
const start = Date.now();
let n = 0;
let lastStatus = '';
const events = [];
while ((Date.now() - start) / 1000 < max) {
  const status = (await page.locator('[data-testid=speech]').textContent()) ?? '';
  const caption = (await page.locator('[data-testid=caption]').textContent()) ?? '';
  const t = ((Date.now() - start) / 1000).toFixed(1);
  if (status !== lastStatus) {
    events.push({ t, status, caption });
    lastStatus = status;
  }
  await stage.screenshot({ path: join(out, `f${String(n++).padStart(3, '0')}.png`) });
  if (status.includes('completed') || status.includes('skipped')) break;
  if (status.includes('awaiting-input')) {
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Дальше' }).click();
  }
  await page.waitForTimeout(every * 1000);
}
const diag = (await page.locator('[data-testid=diagnostics]').textContent()) ?? '';
writeFileSync(join(out, 'log.json'), JSON.stringify({ id, frames: n, events, diagnostics: diag, console: log }, null, 1));
console.log(JSON.stringify({ id, frames: n, last: lastStatus, events: events.length, errors: log.filter((l) => /error/i.test(l)).length }));
await browser.close();
