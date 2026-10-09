import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

if (existsSync('.env')) {
  process.loadEnvFile();
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 240_000,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'https://dmoneyportal.roadtocareer.net',
    headless: false,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      testMatch: ['**/fullworkflow.spec.ts', '**/testReadMail.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
