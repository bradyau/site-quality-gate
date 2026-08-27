import { defineConfig } from '@playwright/test';
import config from './site-quality.config.json' with { type: 'json' };

const baseURL = process.env.SITE_URL || `http://127.0.0.1:${config.fixturePort}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  outputDir: './reports/playwright',
  reporter: [
    ['list'],
    ['json', { outputFile: './reports/playwright-results.json' }]
  ],
  use: {
    baseURL,
    browserName: 'chromium',
    colorScheme: 'light',
    reducedMotion: 'reduce',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  }
});
