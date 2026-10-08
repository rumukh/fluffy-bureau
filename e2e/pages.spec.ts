// Deployment layout (T30): everything the game loads stays under its base path, so it works at
// https://rumukh.github.io/fluffy-bureau/ exactly as at a local root. Run with FLUFFY_E2E_BASE.
import { expect, test } from '@playwright/test';
import { BASE } from './env.js';
import { Player } from './player.js';

test('every URL, the manifest, icons and the worker scope stay under the base path; unlisted', async ({
  page,
  baseURL,
}) => {
  test.setTimeout(180_000);
  const root = new URL(baseURL!);
  expect(root.pathname).toBe(BASE);
  const outside: string[] = [];
  const failed: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol === 'data:' || url.protocol === 'blob:') return;
    if (url.origin !== root.origin || !url.pathname.startsWith(BASE)) outside.push(request.url());
  });
  page.on('response', (response) => {
    if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`);
  });
  await page.goto('./');
  await expect(page.locator('meta[name="fluffy-base"]')).toHaveAttribute('content', BASE);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);

  // Worker installed for exactly the base path.
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const registration = await navigator.serviceWorker.getRegistration();
          return registration?.active ? registration.scope : null;
        }),
      { timeout: 120_000, intervals: [500] },
    )
    .toBe(root.href);

  // Manifest: start_url and scope resolve to the base; every icon is served.
  const manifestHref = await page
    .locator('link[rel="manifest"]')
    .evaluate((l) => (l as HTMLLinkElement).href);
  const manifest = (await (await page.request.get(manifestHref)).json()) as {
    start_url: string;
    scope: string;
    icons: { src: string }[];
  };
  expect(new URL(manifest.start_url, manifestHref).href).toBe(root.href);
  expect(new URL(manifest.scope, manifestHref).href).toBe(root.href);
  for (const icon of manifest.icons) {
    const url = new URL(icon.src, manifestHref);
    expect(url.pathname.startsWith(BASE)).toBe(true);
    expect((await page.request.get(url.href)).status(), url.href).toBe(200);
  }
  const touchIcon = await page
    .locator('link[rel="apple-touch-icon"]')
    .evaluate((l) => (l as HTMLLinkElement).href);
  expect((await page.request.get(touchIcon)).status()).toBe(200);
  const robots = await page.request.get(new URL('robots.txt', root).href);
  expect(await robots.text()).toContain('Disallow: /');

  // Every resource of every offline pack is addressed under the base and was verified on install.
  const index = (await (
    await page.request.get(new URL('offline/index.json', root).href)
  ).json()) as {
    packs: { id: string }[];
  };
  for (const { id } of index.packs) {
    const pack = (await (
      await page.request.get(new URL(`offline/${id}.json`, root).href)
    ).json()) as {
      resources: { src: string }[];
    };
    const stray = pack.resources.filter((r) => !new URL(r.src, root).pathname.startsWith(BASE));
    expect(stray, `pack ${id}`).toEqual([]);
  }

  // Play into the stage (fonts, art, voices, cutscene documents) and check nothing escaped.
  const player = new Player(page);
  await player.createProfile();
  await player.activate(player.key('cutscene-skip'));
  await expect(player.key('next')).toBeVisible({ timeout: 30_000 });
  await player.activate(player.key('next'));
  expect(outside).toEqual([]);
  expect(failed).toEqual([]);
});
