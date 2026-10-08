// Frame-rate measurement against the T02 targets (60 fps target, 30 fps floor on iPad 9 class).
// Chromium runs with 4× CPU throttling as a rough low-end tablet proxy; this is emulation, not a
// physical-device measurement.
import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { Player } from './player.js';

async function measureFps(page: import('@playwright/test').Page, ms: number) {
  return page.evaluate(
    (duration) =>
      new Promise<{ fps: number; p95FrameMs: number; worstFrameMs: number }>((resolve) => {
        const frames: number[] = [];
        let last = performance.now();
        const start = last;
        const tick = (now: number) => {
          frames.push(now - last);
          last = now;
          if (now - start < duration) requestAnimationFrame(tick);
          else {
            const sorted = [...frames].sort((a, b) => a - b);
            resolve({
              fps: Math.round((frames.length / (now - start)) * 1000 * 10) / 10,
              p95FrameMs: Math.round(sorted[Math.floor(sorted.length * 0.95)]! * 10) / 10,
              worstFrameMs: Math.round(sorted[sorted.length - 1]! * 10) / 10,
            });
          }
        };
        requestAnimationFrame(tick);
      }),
    ms,
  );
}

test('frame rate on an animated scene and command latency', async ({ page, browserName }) => {
  test.setTimeout(120_000);
  await page.goto('./');
  const player = new Player(page);
  await player.createProfile();
  await player.playToEnd('prologue', {
    stopAt: async (p) => (await p.page.locator('.game[data-scene="P1"]').count()) > 0,
  });
  if (browserName === 'chromium') {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  }
  const idle = await measureFps(page, 3000);
  // Latency: from activating «Дальше» to the next line being on screen.
  const latencies: number[] = [];
  for (let i = 0; i < 8; i++) {
    const next = player.key('next');
    if (!(await next.isVisible())) break;
    const before = await page.locator('#app .line-text').first().innerText();
    const started = Date.now();
    await next.click();
    await page.waitForFunction(
      (text) => document.querySelector('#app .line-text')?.textContent !== text,
      before,
    );
    latencies.push(Date.now() - started);
  }
  const result = {
    browser: browserName,
    cpuThrottle: browserName === 'chromium' ? 4 : 1,
    viewport: page.viewportSize(),
    idleScene: idle,
    nextLineLatencyMs: latencies,
    measuredAt: new Date().toISOString(),
  };
  mkdirSync('test-results', { recursive: true });
  writeFileSync(`test-results/perf-${browserName}.json`, JSON.stringify(result, null, 1));
  console.log(JSON.stringify(result));
  expect(idle.fps).toBeGreaterThanOrEqual(30);
});
