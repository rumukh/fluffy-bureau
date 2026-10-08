// Offline install metrics for the release layout (files, MB, seconds to offline-ready per browser).
// Records only; the budgets live in offline/lifecycle/pages specs. Output: test-results/install-<browser>.json
import { expect, test } from '@playwright/test';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// @ts-expect-error -- plain ESM helper without declarations
import { serveStatic } from '../apps/game/scripts/preview.mjs';
import { BASE } from './env.js';

test('offline install: time to offline-ready', async ({ playwright, browserName }) => {
  test.skip(!process.env.FLUFFY_E2E_METRICS, 'measurement only: FLUFFY_E2E_METRICS=1');
  test.setTimeout(600_000);
  const index = JSON.parse(readFileSync('apps/game/dist/offline/index.json', 'utf8')) as {
    packs: { id: string; bytes: number; files: number }[];
  };
  const server = await serveStatic('apps/game/dist', { port: 0, base: BASE });
  const origin = `http://127.0.0.1:${(server.address() as { port: number }).port}${BASE}`;
  const profile = mkdtempSync(join(tmpdir(), `fluffy-metrics-${browserName}-`));
  let requests = 0;
  try {
    const context = await playwright[browserName].launchPersistentContext(profile, {
      viewport: { width: 1280, height: 800 },
      serviceWorkers: 'allow',
    });
    context.on('request', () => requests++);
    const page = context.pages()[0] ?? (await context.newPage());
    const started = Date.now();
    await page.goto(origin);
    await expect(page.locator('#app h1')).toBeVisible({ timeout: 60_000 });
    const interactive = (Date.now() - started) / 1000;
    await expect
      .poll(
        () =>
          page.evaluate(
            async () => (await navigator.serviceWorker.getRegistration())?.active?.state,
          ),
        { timeout: 540_000, intervals: [500] },
      )
      .toBe('activated');
    const ready = (Date.now() - started) / 1000;
    await context.close();
    const result = {
      browser: browserName,
      base: BASE,
      packs: index.packs.map((p) => ({
        id: p.id,
        files: p.files,
        mb: +(p.bytes / 2 ** 20).toFixed(1),
      })),
      files: index.packs.reduce((n, p) => n + p.files, 0),
      mb: +(index.packs.reduce((n, p) => n + p.bytes, 0) / 2 ** 20).toFixed(1),
      requests,
      secondsToTitle: +interactive.toFixed(1),
      secondsToOfflineReady: +ready.toFixed(1),
    };
    mkdirSync('test-results', { recursive: true });
    writeFileSync(`test-results/install-${browserName}.json`, JSON.stringify(result, null, 1));
    console.log('INSTALL', JSON.stringify(result));
  } finally {
    server.close();
    server.closeAllConnections();
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {
      // Windows may keep the profile locked briefly.
    }
  }
});
