// v0.2.1 prioritized offline install: the shell, the prologue and case 1 make the game usable
// offline; later cases download in the background and the parent corner shows each case's status.
import { expect, test } from '@playwright/test';
import { createReadStream, existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, normalize, resolve } from 'node:path';
// @ts-expect-error -- plain ESM helper without declarations
import { MIME } from '../apps/game/scripts/preview.mjs';
import { BASE } from './env.js';
import { Player } from './player.js';

/** Serves the build but refuses the media of cases 2–4 (their download "has not finished"). */
function serveWithout(dir: string, blocked: RegExp): Promise<Server> {
  const root = resolve(dir);
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    if (!url.pathname.startsWith(BASE)) return void response.writeHead(404).end();
    const relative = decodeURIComponent(url.pathname.slice(BASE.length));
    if (blocked.test(relative)) return void response.writeHead(503).end();
    let path = normalize(join(root, relative));
    if (!path.startsWith(root)) return void response.writeHead(403).end();
    if (existsSync(path) && statSync(path).isDirectory()) path = join(path, 'index.html');
    if (!existsSync(path)) return void response.writeHead(404).end();
    response.writeHead(200, {
      'content-type': (MIME as Record<string, string>)[extname(path)] ?? 'application/octet-stream',
      'cache-control': 'no-cache',
    });
    createReadStream(path).pipe(response);
  });
  return new Promise((done) => server.listen(0, '127.0.0.1', () => done(server)));
}

test('core first: offline-ready without cases 2–4, per-case status for parents, offline cold start', async ({
  playwright,
  browserName,
}) => {
  test.setTimeout(600_000);
  const browserType = playwright[browserName];
  const profile = mkdtempSync(join(tmpdir(), `fluffy-priority-${browserName}-`));
  const server = await serveWithout(
    'apps/game/dist',
    /^(packs\/case0[234]\/|offline\/case0[234]\.json)/,
  );
  const origin = `http://127.0.0.1:${(server.address() as { port: number }).port}${BASE}`;
  const launch = (offline = false) =>
    browserType.launchPersistentContext(profile, {
      viewport: { width: 1280, height: 800 },
      serviceWorkers: 'allow',
      offline,
    });
  let context = await launch();
  try {
    let page = context.pages()[0] ?? (await context.newPage());
    await page.goto(origin);
    // The worker activates once the core is stored, although cases 2–4 cannot download.
    await expect
      .poll(
        () =>
          page.evaluate(
            async () => (await navigator.serviceWorker.getRegistration())?.active?.state,
          ),
        { timeout: 360_000, intervals: [500] },
      )
      .toBe('activated');
    await expect(page.locator('html')).toHaveAttribute('data-offline', /^ready/, {
      timeout: 60_000,
    });
    await context.close();

    // Cold start without any network: the profile and the prologue open.
    context = await launch(true);
    page = context.pages()[0] ?? (await context.newPage());
    await page.goto(origin);
    const player = new Player(page);
    await player.createProfile();
    await expect(player.key('next').or(player.key('cutscene-skip')).first()).toBeVisible({
      timeout: 30_000,
    });
    // The parent corner lists each case: the core stored, cases 2–4 waiting for the internet.
    await page.goto(origin);
    await player.activate(player.key('parent-entry'));
    await player.key('gate-hold').hover();
    await page.mouse.down();
    await page.waitForTimeout(3300);
    await page.mouse.up();
    const question = await page.locator('label[for="gate-answer"]').innerText();
    const [, a, b] = /(\d+) × (\d+)/.exec(question)!;
    await page.locator('#gate-answer').fill(String(Number(a) * Number(b)));
    await player.activate(player.key('gate-ok'));
    const packs = page.locator('[data-testid="offline-packs"]');
    for (const id of ['shell', 'prologue', 'case01'])
      await expect(packs.locator(`[data-pack="${id}"]`)).toHaveAttribute('data-state', 'stored');
    for (const id of ['case02', 'case03', 'case04'])
      await expect(packs.locator(`[data-pack="${id}"]`)).not.toHaveAttribute(
        'data-state',
        'stored',
      );
  } finally {
    await context.close().catch(() => {});
    server.close();
    server.closeAllConnections();
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {
      // Windows may keep the profile locked briefly.
    }
  }
});
