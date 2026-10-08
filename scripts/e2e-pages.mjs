// The GitHub Pages layout check (T30): run the deployment-sensitive specs against a build served
// under /fluffy-bureau/. Expects `npm run build:pages` first. Extra arguments go to Playwright.
import { spawnSync } from 'node:child_process';

const specs = [
  'e2e/pages.spec.ts',
  'e2e/smoke.spec.ts',
  'e2e/offline.spec.ts',
  'e2e/lifecycle.spec.ts',
];
const result = spawnSync('npx', ['playwright', 'test', ...specs, ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, FLUFFY_E2E_BASE: '/fluffy-bureau/' },
});
process.exit(result.status ?? 1);
