import {defineConfig} from '@playwright/test';

/** One Chromium smoke against the already-built /lab/ candidate; never builds or starts Docker. */
export default defineConfig({
  testDir: './tests/neutral',
  testMatch: 'assets.spec.ts',
  timeout: 30_000,
  expect: {timeout: 10_000},
  workers: 1,
  retries: 0,
  outputDir: 'test-results/neutral-v1.2-assets',
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4197/lab/',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{name: 'chromium', use: {browserName: 'chromium'}}],
  webServer: {
    command:
      'node tests/neutral/prepare-preview.mjs && APP_BASE_PATH=/lab/ npx vite preview --host 127.0.0.1 --port 4197 --strictPort',
    url: 'http://127.0.0.1:4197/lab/',
    reuseExistingServer: false,
    timeout: 15_000,
  },
});
