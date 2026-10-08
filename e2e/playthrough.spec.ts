import { expect, test } from '@playwright/test';
import { Player } from './player.js';

const ORIGIN = 'http://127.0.0.1';

test.describe('Stage 1 playthrough', () => {
  test('keyboard only: prologue and case 1 level 1 with every cutscene watched, no outbound requests', async ({
    page,
  }) => {
    test.setTimeout(600_000);
    const outbound: string[] = [];
    page.on('request', (request) => {
      if (!request.url().startsWith(ORIGIN) && !/^(data|blob):/.test(request.url()))
        outbound.push(request.url());
    });
    await page.goto('./');
    // Keyboard run watches every cutscene to the end (intro, P3, shed, oven, reward).
    const player = new Player(page, 'keyboard', true);
    await player.createProfile();
    await player.playToEnd('prologue');
    await expect(page.locator('.case-end')).toBeVisible();
    await player.activate(player.key('leave'));
    await player.activate(player.key('open-cases'));
    await player.activate(player.key('case-start'));
    await player.playToEnd('case01-l1');
    await expect(page.locator('.case-end')).toBeVisible();
    await expect(page.locator('.case-end .wallet')).toContainText('15');
    expect(outbound).toEqual([]);
    expect(
      await page.evaluate(() => Object.keys(window).filter((k) => /fluffy|aegis|__/i.test(k))),
    ).toEqual([]);
  });

  test('emulated touch: case 1 levels 2 and 3 after the prologue', async ({ browser }) => {
    test.setTimeout(600_000);
    const context = await browser.newContext({
      hasTouch: true,
      viewport: { width: 1180, height: 820 },
    });
    const page = await context.newPage();
    await page.goto('./');
    const player = new Player(page, 'touch');
    await player.createProfile();
    await player.playToEnd('prologue');
    await player.activate(player.key('leave'));
    for (const level of [2, 3]) {
      await player.activate(player.key('open-cases'));
      await player.activate(player.key(`level-${level}`));
      await player.activate(player.key('case-start'));
      await player.playToEnd(`case01-l${level}`);
      await expect(page.locator('.case-end')).toBeVisible();
      await player.activate(player.key('leave'));
    }
    await context.close();
  });
});
