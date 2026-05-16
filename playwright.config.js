import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Single worker keeps RAM low by running tests sequentially in one
  // Chromium instance. The suite is small enough that the slowdown is
  // negligible.
  workers: 1,
  reporter: 'list',
  // Short timeouts: this is a fast local frontend, every interaction should
  // resolve in milliseconds. Long timeouts hide real failures.
  timeout: 5000,
  expect: { timeout: 2000 },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    actionTimeout: 2000,
    navigationTimeout: 5000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 5173',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
