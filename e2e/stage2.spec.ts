import { expect, test } from '@playwright/test';
import { Player, type InputMode } from './player.js';

async function drainOffice(player: Player) {
  for (let i = 0; i < 10; i++) {
    if (
      await player
        .key('next')
        .isVisible()
        .catch(() => false)
    ) {
      await player.activate(player.key('next'));
      continue;
    }
    if (
      await player
        .key('rank-ok')
        .isVisible()
        .catch(() => false)
    ) {
      await player.activate(player.key('rank-ok'));
      continue;
    }
    const slot = player.page.locator('#app [data-key^="slot-"]').first();
    if (await slot.isVisible().catch(() => false)) {
      await slot.click({ force: true });
      await player.page.waitForFunction(() => !document.querySelector('#app [aria-busy="true"]'));
      continue;
    }
    break;
  }
}

async function startCase(player: Player, pack: string) {
  const match = /^(case\d\d)-l([123])$/.exec(pack)!;
  await drainOffice(player);
  await player.activate(player.key('open-cases'));
  await player.activate(player.key(`case-${match[1]}`));
  await player.activate(player.key(`level-${match[2]}`));
  await player.activate(player.key('case-start'));
}

async function drainDialogue(player: Player) {
  for (
    let i = 0;
    i < 10 &&
    (await player
      .key('next')
      .isVisible()
      .catch(() => false));
    i++
  )
    await player.activate(player.key('next'));
}

async function completeCase(player: Player, pack: string) {
  await startCase(player, pack);
  await player.playToEnd(pack);
  await expect(player.page.locator('.case-end')).toBeVisible({ timeout: 30_000 });
  await player.activate(player.key('leave'));
  await drainOffice(player);
}

async function unlockTo(player: Player, level: 1 | 2 | 3, upToCaseExclusive: number) {
  await player.playToEnd('prologue');
  await player.activate(player.key('leave'));
  for (let caseNo = 1; caseNo < upToCaseExclusive; caseNo++)
    await completeCase(player, `case${String(caseNo).padStart(2, '0')}-l${level}`);
}

test.describe('Stage 2 UI playthroughs', () => {
  test('keyboard only completes case 2 level 1', async ({ page }) => {
    test.setTimeout(420_000);
    await page.goto('./');
    const player = new Player(page, 'keyboard');
    await player.createProfile();
    await unlockTo(player, 1, 2);
    await startCase(player, 'case02-l1');
    await player.playToEnd('case02-l1');
    await expect(page.locator('.case-end')).toBeVisible();
  });

  for (const [pack, mode] of [
    ['case03-l3', 'mouse'],
    ['case04-l2', 'touch'],
  ] as const satisfies readonly [string, InputMode][]) {
    test(`${mode}: completes ${pack}`, async ({ browser, page }) => {
      test.setTimeout(720_000);
      const context =
        mode === 'touch'
          ? await browser.newContext({ hasTouch: true, viewport: { width: 1180, height: 820 } })
          : null;
      const p = context ? await context.newPage() : page;
      await p.goto('./');
      const player = new Player(p, mode);
      await player.createProfile();
      const level = Number(pack.at(-1)) as 1 | 2 | 3;
      const caseNo = Number(pack.slice(4, 6));
      await unlockTo(player, level, caseNo);
      await startCase(player, pack);
      if (pack === 'case03-l3') {
        await player.playToEnd(pack, {
          stopAt: async () => {
            const own = p.locator('#app .minigame-light-signals[data-phase="own"]');
            return (await own.count()) > 0;
          },
        });
        await player.activate(player.key('signal-dot'));
        await player.activate(player.key('signal-dash'));
        await player.activate(player.key('signal-dot'));
        await expect(p.locator('#app .light-pattern')).toContainText('●▬●');
        await player.activate(player.key('signal-send'));
      }
      await player.playToEnd(pack);
      await expect(p.locator('.case-end')).toBeVisible();
      await context?.close();
    });
  }

  test('family dream handoff keeps the picked card private on others screens', async ({ page }) => {
    test.setTimeout(720_000);
    await page.goto('./');
    const player = new Player(page);
    await player.createProfile();
    await unlockTo(player, 1, 4);
    await startCase(player, 'case04-l1');
    await player.playToEnd('case04-l1', {
      stopAt: async () => (await page.locator('#app .minigame-dream-keeper').count()) > 0,
    });
    await player.activate(player.key('dream-family'));
    await player.activate(player.page.locator('#app [data-key^="family-player-"]').nth(1));
    await player.activate(player.page.locator('#app [data-key^="family-player-"]').nth(2));
    await player.activate(player.key('family-start'));
    await drainDialogue(player);
    await player.activate(player.key('keeper-child'));
    await drainDialogue(player);
    await player.activate(player.key('handoff-pick'));
    const firstCard = page.locator('#app .dream-card-button').first();
    const privateLabel = (await firstCard.locator('figcaption').textContent()) ?? '';
    const privateSrc = await firstCard
      .locator('img')
      .getAttribute('src')
      .catch(() => null);
    await player.activate(firstCard);
    while (
      await player
        .key('next')
        .isVisible()
        .catch(() => false)
    )
      await player.activate(player.key('next'));
    await player.activate(player.key('handoff-ask'));
    await expect(page.locator('#app')).not.toContainText(privateLabel);
    if (privateSrc) await expect(page.locator(`#app img[src="${privateSrc}"]`)).toHaveCount(0);
  });
});
