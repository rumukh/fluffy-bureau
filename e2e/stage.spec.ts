import { expect, test } from '@playwright/test';
import { Player } from './player.js';

test('puppets lip-sync recorded lines from cue tracks on the AEGIS stage', async ({
  page,
  browserName,
}) => {
  test.setTimeout(90_000);
  await page.goto('./');
  const player = new Player(page);
  await player.createProfile();
  await player.activate(player.key('cutscene-skip'));
  await expect(page.locator('.game.run')).not.toHaveAttribute('data-step', 'cutscene', {
    timeout: 30_000,
  });
  const stage = page.locator('.stage-live');
  await expect(stage.locator('canvas')).toHaveCount(1);
  // The first line is spoken by Watsony's puppet: the mouth follows the narration clock.
  await expect
    .poll(() => stage.getAttribute('data-speech'), { timeout: 20_000, intervals: [100] })
    .toBe(
      // Playwright's WebKit on Windows has no audio output: the line is unheard, and the stage
      // honestly keeps the mouth neutral instead of claiming synchronized speech.
      browserName === 'webkit' ? 'unheard' : 'cues:synchronized',
    );
});
