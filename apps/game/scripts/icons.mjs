// Regenerates PNG icons from icons/icon.svg: node apps/game/scripts/icons.mjs
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { appRoot } from './site.mjs';

const svg = readFileSync(join(appRoot, 'public', 'icons', 'icon.svg'), 'utf8');
const browser = await chromium.launch();
for (const size of [180, 512]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(
    `<style>html,body{margin:0}</style><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" width="${size}" height="${size}">`,
  );
  await page.screenshot({
    path: join(appRoot, 'public', 'icons', `icon-${size}.png`),
    omitBackground: true,
  });
  await page.close();
}
await browser.close();
