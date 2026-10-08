import { expect, test } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// @ts-expect-error -- plain ESM helper without declarations
import { serveStatic } from '../apps/game/scripts/preview.mjs';
import { BASE } from './env.js';
import { Player } from './player.js';

test('offline: install, close mid-minigame, cold start with the network gone, resume', async ({
  playwright,
  browserName,
}) => {
  const browserType = playwright[browserName];
  test.setTimeout(240_000);

  const profile = mkdtempSync(join(tmpdir(), `fluffy-offline-${browserName}-`));
  // An OS-assigned free port, so parallel runs on one machine never collide.
  const server = await serveStatic('apps/game/dist', { port: 0, base: BASE });
  const origin = `http://127.0.0.1:${(server.address() as { port: number }).port}${BASE}`;
  try {
    let context = await browserType.launchPersistentContext(profile, {
      viewport: { width: 1280, height: 800 },
      serviceWorkers: 'allow',
    });
    let page = context.pages()[0] ?? (await context.newPage());
    await page.goto(origin);
    // Installation starts automatically when online; wait until every pack is verified
    // and the worker controls the page.
    await expect
      .poll(
        () =>
          page.evaluate(async () => {
            const registration = await navigator.serviceWorker.getRegistration();
            return registration?.active?.state ?? 'none';
          }),
        { timeout: 120_000, intervals: [500] },
      )
      .toBe('activated');
    // Restart the browser: the next launch is controlled by the installed worker.
    await page.waitForTimeout(1000);
    await context.close();
    context = await browserType.launchPersistentContext(profile, {
      viewport: { width: 1280, height: 800 },
      serviceWorkers: 'allow',
    });
    page = context.pages()[0] ?? (await context.newPage());
    await page.goto(origin);
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, {
      timeout: 20_000,
    });
    const player = new Player(page);
    await player.createProfile();
    await player.playToEnd('prologue', {
      stopAt: async (p) =>
        (await p.stepKind()) === 'minigame' && !(await p.key('next').isVisible()),
    });
    await page.waitForTimeout(500);
    await player.activate(page.locator('#app .hotspot.glow').first());
    await expect(player.key('next')).toBeVisible();
    while (await player.key('next').isVisible()) await player.activate(player.key('next'));
    await expect(page.locator('#app .minigame .progress')).toContainText('1 /');
    await page.waitForFunction(
      () => document.querySelector('.save-status')?.getAttribute('data-status') === 'saved',
    );
    await context.close();
    server.close();

    // Cold start: the HTTP origin no longer exists at all.
    context = await browserType.launchPersistentContext(profile, {
      viewport: { width: 1280, height: 800 },
      offline: true,
      serviceWorkers: 'allow',
    });
    const outbound: string[] = [];
    page = context.pages()[0] ?? (await context.newPage());
    page.on('request', (request) => {
      if (!request.url().startsWith(origin) && !request.url().startsWith('data:'))
        outbound.push(request.url());
    });
    await page.goto(origin);
    const again = new Player(page);
    await again.activate(page.locator('#app .profile-card').first());
    await expect(page.locator('#app .minigame .progress')).toContainText('1 /');
    await expect(page.locator('#app .hotspot.found')).toHaveCount(1);
    // Keep playing offline to the end of the prologue.
    await again.playToEnd('prologue');
    await expect(page.locator('.case-end')).toBeVisible();
    expect(outbound).toEqual([]);
    await context.close();
  } finally {
    server.close();
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {
      // Browser profile files can stay locked briefly on Windows.
    }
  }
});
