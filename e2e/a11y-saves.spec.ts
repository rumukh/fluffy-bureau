import { expect, test, type Page } from '@playwright/test';
import { Player } from './player.js';

async function toFirstMinigame(page: Page, player: Player) {
  await player.createProfile();
  await player.playToEnd('prologue', {
    stopAt: async (p) => (await p.stepKind()) === 'minigame' && !(await p.key('next').isVisible()),
  });
}

test.describe('accessibility and comfort', () => {
  test('200% text, readable font and calm motion keep controls usable', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('./');
    const player = new Player(page);
    await toFirstMinigame(page, player);
    await player.activate(player.key('hud-pause'));
    await player.activate(player.key('p-settings'));
    await player.activate(player.key('size-2'));
    await player.activate(player.key('pref-readable'));
    await player.activate(player.key('motion-calm'));
    await player.activate(player.key('overlay-close'));
    const root = page.locator('#app');
    await expect(root).toHaveClass(/readable/);
    await expect(root).toHaveAttribute('data-reduced-motion', 'true');
    expect(await root.evaluate((n) => getComputedStyle(n).fontSize)).toBe('44px');
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
    // No horizontal overflow and every visible button keeps a 48px target.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const small = await page
      .locator('#app button:visible')
      .evaluateAll(
        (nodes) =>
          nodes
            .map((n) => n.getBoundingClientRect())
            .filter((r) => r.width > 0 && (r.width < 47.5 || r.height < 47.5)).length,
      );
    expect(small).toBe(0);
    // The game remains playable at 200%.
    await player.playToEnd('prologue');
    await expect(page.locator('.case-end')).toBeVisible();
  });

  test('system reduced motion is followed by default', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('./');
    const player = new Player(page);
    await player.createProfile();
    await expect(page.locator('#app')).toHaveAttribute('data-reduced-motion', 'true');
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
    await context.close();
  });

  test('comfort lamp warms the scene and pause stops the game', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('./');
    const player = new Player(page);
    await toFirstMinigame(page, player);
    await player.playToEnd('prologue', {
      stopAt: async (p) => (await p.key('hud-lamp').count()) > 0,
    });
    await player.activate(player.key('hud-lamp'));
    await expect(player.key('hud-lamp')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.stage')).toHaveClass(/comfort/);
    await player.activate(player.key('hud-pause'));
    await expect(page.locator('dialog.overlay-pause')).toBeVisible();
    await expect(page.locator('.stage')).toHaveClass(/paused/);
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog.overlay')).toBeHidden();
  });

  test('portrait orientation shows the rotate prompt', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 800, height: 1180 } });
    const page = await context.newPage();
    await page.goto('./');
    await expect(page.getByText('Поверни планшет')).toBeVisible();
    await context.close();
  });
});

test.describe('saves', () => {
  test('closing mid-minigame resumes in the same place with the same notebook', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await page.goto('./');
    const player = new Player(page);
    await player.createProfile();
    await player.playToEnd('prologue', {
      stopAt: async (p) =>
        (await p.page.locator('.game[data-scene="P2-HUB"]').count()) > 0 &&
        (await p.stepKind()) === 'menu',
    });
    await player.activate(player.key('hud-notebook'));
    await player.activate(page.locator('#app [data-key^="cell-where-"]').first());
    await player.activate(page.locator('#app [data-key$="-unknown"]').first());
    await player.activate(player.key('overlay-close'));
    await player.activate(page.locator('#app .menu .choice').first());
    await expect(player.key('next')).toBeVisible();
    const before = await page.locator('#app .panel .line-text').innerText();
    await page.waitForFunction(
      () => document.querySelector('.save-status')?.getAttribute('data-status') === 'saved',
    );
    await page.reload();
    await player.activate(page.locator('#app .profile-card').first());
    await expect(page.locator('#app .panel .line-text')).toHaveText(before);
    await player.activate(player.key('hud-notebook'));
    await expect(page.locator('#app .cell.mark-unknown')).toHaveCount(1);
  });

  test('a second window cannot silently take over the same profile', async ({ context }) => {
    const first = await context.newPage();
    await first.goto('./');
    const one = new Player(first);
    await one.createProfile();
    await expect(first.locator('.game')).toBeVisible();
    const second = await context.newPage();
    await second.goto('./');
    const two = new Player(second);
    await two.activate(second.locator('#app .profile-card').first());
    await expect(second.getByText('Игра открыта в другом окне.')).toBeVisible();
    await two.activate(two.key('use-here'));
    await expect(second.locator('.game')).toBeVisible();
    await expect(first.getByText('Игра открыта в другом окне.')).toBeVisible();
  });

  test('parent corner: hold gate, multiplication, profiles and licences', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('./');
    const player = new Player(page);
    await player.activate(player.key('parent-entry'));
    const hold = player.key('gate-hold');
    await hold.hover();
    await page.mouse.down();
    await page.waitForTimeout(3300);
    await page.mouse.up();
    const question = await page.locator('label[for="gate-answer"]').innerText();
    const [, a, b] = /(\d+) × (\d+)/.exec(question)!;
    await page.locator('#gate-answer').fill(String(Number(a) * Number(b)));
    await player.activate(player.key('gate-ok'));
    await expect(page.getByRole('heading', { name: 'Родительский уголок' })).toBeVisible();
    await expect(page.getByText('Благодарности и лицензии')).toBeVisible();
    expect(await page.locator('dialog a[href]').count()).toBe(0);
    await player.activate(player.key('pc-break-20'));
    await expect(player.key('pc-break-20')).toHaveAttribute('aria-pressed', 'true');
  });
});
