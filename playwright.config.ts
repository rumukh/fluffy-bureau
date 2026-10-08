import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.FLUFFY_E2E_PORT ?? 4330);
// Run the suite under a sub-path (GitHub Pages: FLUFFY_E2E_BASE=/fluffy-bureau/ with a matching build).
const base = process.env.FLUFFY_E2E_BASE ?? '/';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  // Service-worker installation and persistent browser profiles are timing-sensitive: run serially.
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${port}${base}`,
    viewport: { width: 1280, height: 800 },
    locale: 'ru-RU',
    actionTimeout: 15_000,
  },
  webServer: {
    command: `node apps/game/scripts/preview.mjs --dir apps/game/dist --port ${port} --base ${base}`,
    url: `http://127.0.0.1:${port}${base}`,
    reuseExistingServer: false,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], viewport: { width: 1280, height: 800 } },
    },
  ],
});
