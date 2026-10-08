import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.FLUFFY_E2E_PORT ?? 4330);

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  // Service-worker installation and persistent browser profiles are timing-sensitive: run serially.
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${port}/`,
    viewport: { width: 1280, height: 800 },
    locale: 'ru-RU',
  },
  webServer: {
    command: `node apps/game/scripts/preview.mjs --dir apps/game/dist --port ${port}`,
    url: `http://127.0.0.1:${port}/`,
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
