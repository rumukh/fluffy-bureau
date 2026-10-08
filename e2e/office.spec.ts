// Stage 2 office (T28, T29, D12, T26) and the live-stage staging of case 1 (U10, U11, dir.background).
import { expect, test } from '@playwright/test';
import { Player } from './player.js';

test('cozy day: not enough, buy, wear, return for the full price, tea story; window tap and staging', async ({
  page,
}) => {
  test.setTimeout(600_000);
  await page.goto('./');
  const player = new Player(page);
  await player.createProfile();
  await player.playToEnd('prologue');
  await player.activate(player.key('leave'));

  // After the prologue: 5 buttons, the acorn hat costs 8 — a gentle line, nothing taken.
  await player.activate(player.key('office-cozy'));
  await player.activate(player.key('buy-hat-acorn'));
  await expect(page.locator('.office-line')).toHaveAttribute('data-line', 'CZ-NOT-ENOUGH');
  await expect(page.locator('.office-panel .wallet')).toContainText('🔘 5');
  await player.activate(player.key('next'));
  await expect(player.key('open-cases')).toBeVisible();

  // Case 1: on the way to the shed the child taps the window (U11); the live stage switches to the
  // window close-up (dir.background) and stage directions are acted (U10).
  await player.activate(player.key('open-cases'));
  await player.activate(player.key('case-start'));
  const stage = page.locator('.stage-live');
  let sawTap = false;
  await player.playToEnd('case01-l1', {
    stopAt: async () => {
      if (!sawTap && (await player.key('await-tap').isVisible())) {
        sawTap = true;
        await expect(stage).toHaveAttribute('data-background', 'bg.shed-exterior');
        await expect(player.key('hs-window')).toBeVisible();
        await player.activate(player.key('hs-window'));
        await expect(stage).toHaveAttribute('data-background', 'bg.shed-window', {
          timeout: 15_000,
        });
      }
      return false;
    },
  });
  expect(sawTap).toBe(true);
  expect(Number(await stage.getAttribute('data-directed'))).toBeGreaterThan(0);
  await player.activate(player.key('leave'));

  // 15 buttons now: buy, wear (pressed), return (full price back).
  await player.activate(player.key('office-cozy'));
  await player.activate(player.key('buy-hat-acorn'));
  await expect(page.locator('.office-line')).toHaveAttribute('data-line', 'CZ-BOUGHT');
  await expect(page.locator('.office-panel .wallet')).toContainText('🔘 7');
  await player.activate(player.key('next'));
  await player.activate(player.key('office-cozy'));
  await player.activate(player.key('wear-hat-acorn'));
  await expect(player.key('wear-hat-acorn')).toHaveAttribute('aria-pressed', 'true');
  // The worn hat is drawn on E's stage in the avatar's hat slot.
  await expect(page.locator('.stage-live')).toHaveAttribute(
    'data-avatar-accessories',
    /acc\.hat\.acorn/,
  );
  await player.activate(player.key('return-hat-acorn'));
  await expect(page.locator('.office-line')).toHaveAttribute('data-line', 'CZ-RETURNED');
  await expect(page.locator('.office-panel .wallet')).toContainText('🔘 15');
  await player.activate(player.key('next'));

  // A tea party: the story never advances by itself and ends with thanks.
  const hearts = Number(
    /💗 (\d+)/.exec((await page.locator('.office-panel .wallet').innerText()) ?? '')?.[1] ?? 0,
  );
  if (hearts >= 2) {
    await player.activate(player.key('office-cozy'));
    await player.activate(player.key('cozy-tab-tea'));
    await player.activate(page.locator('#app [data-key^="tea-"]').first());
    const seen: string[] = [];
    for (let i = 0; i < 12 && (await page.locator('.office-line').isVisible()); i++) {
      seen.push((await page.locator('.office-line').getAttribute('data-line')) ?? '');
      await page.waitForTimeout(300);
      expect(await page.locator('.office-line').getAttribute('data-line')).toBe(seen.at(-1));
      await player.activate(player.key('next'));
    }
    expect(seen.at(-1)).toBe('CZ-TEA-THANKS');
    await expect(page.locator('.office-panel .wallet')).toContainText(`💗 ${hearts - 2}`);
  }
});
