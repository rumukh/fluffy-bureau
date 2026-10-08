// T16 break reminder and Q43 update flow.
import { expect, test, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// @ts-expect-error -- plain ESM helper without declarations
import { serveStatic } from '../apps/game/scripts/preview.mjs';
import { BASE } from './env.js';
import { Player } from './player.js';

/** Stop listening and drop keep-alive sockets, so the next build is really what the browser sees. */
function stop(server: { close(): void; closeAllConnections(): void }) {
  server.close();
  server.closeAllConnections();
}

async function enterParentCorner(page: Page, player: Player, hold: () => Promise<void>) {
  await player.activate(player.key('parent-entry'));
  await player.key('gate-hold').hover();
  await page.mouse.down();
  await hold();
  await page.mouse.up();
  const question = await page.locator('label[for="gate-answer"]').innerText();
  const [, a, b] = /(\d+) × (\d+)/.exec(question)!;
  await page.locator('#gate-answer').fill(String(Number(a) * Number(b)));
  await player.activate(player.key('gate-ok'));
  await expect(page.getByRole('heading', { name: 'Родительский уголок' })).toBeVisible();
}

test('break reminder: off by default, parent enables it, appears at a safe point, no countdown, dismissible', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.clock.install();
  await page.goto('./');
  const player = new Player(page);
  await enterParentCorner(page, player, () => page.clock.fastForward(3500));
  await expect(player.key('pc-break-0')).toHaveAttribute('aria-pressed', 'true');
  await player.activate(player.key('pc-break-15'));
  await expect(player.key('pc-break-15')).toHaveAttribute('aria-pressed', 'true');
  await player.activate(player.key('overlay-close'));
  await player.createProfile();
  await player.activate(player.key('cutscene-skip'));
  await expect(player.key('next')).toBeVisible({ timeout: 30_000 });
  // No countdown or timer anywhere in the child's interface.
  await expect(page.locator('#app [role="timer"]')).toHaveCount(0);
  expect(await page.locator('#app').innerText()).not.toMatch(/\b\d{1,2}:\d{2}\b/);
  // Fourteen minutes of play: nothing yet.
  await page.clock.fastForward('14:00');
  await expect(page.locator('dialog.overlay-break')).toBeHidden();
  // Past fifteen minutes the reminder appears once the progress is saved.
  await page.clock.fastForward('01:30');
  const reminder = page.locator('dialog.overlay-break');
  await expect(reminder).toBeVisible();
  await expect(reminder).toContainText('Пора отдохнуть!');
  await expect(reminder).toContainText('Мы всё сохранили.');
  await expect(page.locator('.save-status')).toHaveAttribute('data-status', 'saved');
  expect(await reminder.innerText()).not.toMatch(/\d/);
  // «Ещё немного» dismisses it and the game continues where it was.
  await player.activate(player.key('break-more'));
  await expect(reminder).toBeHidden();
  await expect(player.key('next')).toBeVisible();
  // The next reminder comes a full interval later; «Отдохнуть» pauses on a calm screen.
  await page.clock.fastForward('15:30');
  await expect(reminder).toBeVisible();
  await player.activate(player.key('break-rest'));
  await expect(page.locator('.rest-screen')).toBeVisible();
  await player.activate(player.key('rest-continue'));
  await expect(player.key('next')).toBeVisible();
});

test('update: build B installs beside A without interrupting the case and takes over on the next launch', async ({
  playwright,
  browserName,
}) => {
  // The full release (cases 1–4) is ~110 MB: installing it in WebKit can take several minutes.
  test.setTimeout(900_000);
  const browserType = playwright[browserName];
  const root = mkdtempSync(join(tmpdir(), `fluffy-update-${browserName}-`));
  const builds = { a: join(root, 'a'), b: join(root, 'b') };
  for (const [name, dir] of Object.entries(builds))
    execFileSync(
      process.execPath,
      ['apps/game/scripts/build.mjs', '--out', dir, '--base', BASE, '--label', name.toUpperCase()],
      { stdio: 'ignore' },
    );
  const buildId = (dir: string) =>
    (JSON.parse(readFileSync(join(dir, 'build-report.json'), 'utf8')) as { buildId: string })
      .buildId;
  expect(buildId(builds.a)).not.toBe(buildId(builds.b));

  const profile = join(root, 'profile');
  const launch = (offline = false) =>
    browserType.launchPersistentContext(profile, {
      viewport: { width: 1280, height: 800 },
      serviceWorkers: 'allow',
      offline,
    });
  // An OS-assigned free port (kept for build B, which must be published at the same origin).
  let server = await serveStatic(builds.a, { port: 0, base: BASE });
  const port = (server.address() as { port: number }).port;
  const origin = `http://127.0.0.1:${port}${BASE}`;
  let context = await launch();
  try {
    // Build A: install for offline use, restart so the worker controls the page.
    let page = context.pages()[0] ?? (await context.newPage());
    await page.goto(origin);
    await expect
      .poll(
        () =>
          page.evaluate(
            async () => (await navigator.serviceWorker.getRegistration())?.active?.state,
          ),
        { timeout: 360_000, intervals: [500] },
      )
      .toBe('activated');
    await page.waitForTimeout(1000);
    await context.close();
    context = await launch();
    page = context.pages()[0] ?? (await context.newPage());
    await page.goto(origin);
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    const meta = () => page.locator('meta[name="fluffy-build"]').getAttribute('content');
    expect(await meta()).toBe(buildId(builds.a));
    // A case in progress: the first «Лупа» with one object found.
    const player = new Player(page);
    await player.createProfile();
    await player.playToEnd('prologue', {
      stopAt: async (p) =>
        (await p.stepKind()) === 'minigame' && !(await p.key('next').isVisible()),
    });
    await player.activate(page.locator('#app .hotspot.glow').first());
    while (await player.key('next').isVisible()) await player.activate(player.key('next'));
    await expect(page.locator('#app .minigame .progress')).toContainText('1 /');
    await page.evaluate(() => {
      (window as unknown as { untouched: boolean }).untouched = true;
    });

    // Publish build B on the same address; the game finds it when the tablet comes back online.
    stop(server);
    server = await serveStatic(builds.b, { port, base: BASE });
    await page.evaluate(() => dispatchEvent(new Event('online')));
    await expect(page.locator('html')).toHaveAttribute(
      'data-offline',
      'ready:installed-next-launch',
      {
        timeout: 180_000,
      },
    );
    await expect
      .poll(
        () =>
          page.evaluate(
            async () => (await navigator.serviceWorker.getRegistration())?.waiting?.state ?? null,
          ),
        { timeout: 60_000, intervals: [500] },
      )
      .toBe('installed');
    // The running case was not reloaded or reset and keeps going on build A.
    expect(
      await page.evaluate(() => (window as unknown as { untouched?: boolean }).untouched),
    ).toBe(true);
    expect(await meta()).toBe(buildId(builds.a));
    await expect(page.locator('#app .minigame .progress')).toContainText('1 /');
    await player.activate(page.locator('#app .hotspot.glow').first());
    while (await player.key('next').isVisible()) await player.activate(player.key('next'));
    await expect(page.locator('#app .minigame .progress')).toContainText('2 /');
    await page.waitForFunction(
      () => document.querySelector('.save-status')?.getAttribute('data-status') === 'saved',
    );
    await context.close();
    stop(server);

    // Next launch, offline: build B is in charge and the progress is intact.
    context = await launch(true);
    page = context.pages()[0] ?? (await context.newPage());
    await page.goto(origin);
    expect(await page.locator('meta[name="fluffy-build"]').getAttribute('content')).toBe(
      buildId(builds.b),
    );
    await new Player(page).activate(page.locator('#app .profile-card').first());
    await expect(page.locator('#app .minigame .progress')).toContainText('2 /');
  } finally {
    await context.close().catch(() => {});
    stop(server);
    try {
      rmSync(root, { recursive: true, force: true });
    } catch {
      // Browser profile files can stay locked briefly on Windows.
    }
  }
});
