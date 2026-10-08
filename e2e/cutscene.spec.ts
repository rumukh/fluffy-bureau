// T25 cutscenes on E's player, against a build with an injected test cutscene (`--test-cutscene`)
// until C's documents land: pause, skip, replay, captions with «Дальше», save/restore mid-cutscene,
// reduced motion and the bound avatar.
import { expect, test, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
// @ts-expect-error -- plain ESM helper without declarations
import { serveStatic } from '../apps/game/scripts/preview.mjs';
import { Player } from './player.js';

const dir = join(process.cwd(), 'apps', 'game', 'out', 'e2e-cutscene');
let server: { close(): void };
let origin = '';

test.beforeAll(async ({ browserName }) => {
  test.setTimeout(240_000);
  rmSync(dir, { recursive: true, force: true });
  execFileSync(process.execPath, ['apps/game/scripts/build.mjs', '--out', dir, '--test-cutscene'], {
    stdio: 'ignore',
  });
  const port = browserName === 'webkit' ? 4462 : 4461;
  server = await serveStatic(dir, { port });
  origin = `http://127.0.0.1:${port}/`;
});

test.afterAll(() => server?.close());

async function toCutscene(page: Page) {
  await page.goto(origin);
  const player = new Player(page);
  await player.createProfile();
  await player.playToEnd('prologue', {
    stopAt: async (p) => (await p.stepKind()) === 'cutscene',
  });
  return player;
}

const caption = (page: Page) => page.locator('#app .dialogue.cutscene .line-text');
const nextButton = (page: Page) => page.locator('#app .dialogue.cutscene [data-key="next"]');

test('captions wait for «Дальше»; pause, replay and skip; avatar bound; no extra rewards', async ({
  page,
}) => {
  test.setTimeout(180_000);
  const player = await toCutscene(page);
  const stage = page.locator('.stage-live');
  await expect(stage).toHaveAttribute('data-cutscene', 'test-letter');
  await expect(stage).toHaveAttribute('data-cutscene-avatar', 'bound');
  // The first line's caption appears and the cutscene waits for the child.
  await expect(caption(page)).toHaveText(/Письмо от мэра/, { timeout: 20_000 });
  await expect(nextButton(page)).toBeEnabled({ timeout: 20_000 });
  await page.waitForTimeout(1500);
  await expect(caption(page)).toHaveText(/Письмо от мэра/);
  await player.activate(nextButton(page));
  await expect(caption(page)).toHaveText(/Срочно/, { timeout: 20_000 });
  // Pause from the HUD stops the cutscene; continuing resumes it.
  await player.activate(player.key('hud-pause'));
  await expect(stage).toHaveClass(/paused/);
  await player.activate(player.key('p-continue'));
  await expect(stage).not.toHaveClass(/paused/);
  // Replay restarts from the beginning.
  await player.activate(player.key('cutscene-replay'));
  await expect(caption(page)).toHaveText(/Письмо от мэра/, { timeout: 20_000 });
  // Skip ends it; the story continues and rewards come from ordinary steps once.
  await player.activate(player.key('cutscene-skip'));
  await expect(page.locator('.game.run')).not.toHaveAttribute('data-step', 'cutscene');
  await player.playToEnd('prologue');
  await expect(page.locator('.case-end .wallet')).toContainText('🔘 5');
});

test('closing mid-cutscene resumes it from the last marker without re-applying effects', async ({
  page,
}) => {
  test.setTimeout(180_000);
  const player = await toCutscene(page);
  await expect(caption(page)).toHaveText(/Письмо от мэра/, { timeout: 20_000 });
  await page.waitForFunction(
    () => document.querySelector('.save-status')?.getAttribute('data-status') === 'saved',
  );
  await page.reload();
  await player.activate(page.locator('#app .profile-card').first());
  // Restored at the cutscene: it restarts from the stored marker («arrived»), before the lines.
  await expect(page.locator('.game.run')).toHaveAttribute('data-step', 'cutscene');
  await expect(caption(page)).toHaveText(/Письмо от мэра/, { timeout: 20_000 });
  await player.playToEnd('prologue');
  await expect(page.locator('.case-end .wallet')).toContainText('🔘 5');
});

test('reduced motion: the cutscene still plays to the end with captions', async ({ browser }) => {
  test.setTimeout(180_000);
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await toCutscene(page);
  await expect(page.locator('#app')).toHaveAttribute('data-reduced-motion', 'true');
  for (const text of [/Письмо от мэра/, /Срочно/, /Настоящее дело/]) {
    await expect(caption(page)).toHaveText(text, { timeout: 20_000 });
    await expect(nextButton(page)).toBeEnabled({ timeout: 20_000 });
    await nextButton(page).click();
  }
  await expect(page.locator('.game.run')).not.toHaveAttribute('data-step', 'cutscene', {
    timeout: 20_000,
  });
  await context.close();
});
