// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

const repoRoot = __dirname;

// Load backend/.env before defaults (root devDependency `dotenv` — do not rely on backend/node_modules path).
require('dotenv').config({
  path: path.join(repoRoot, 'backend', '.env'),
  override: true,
});

process.env.MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nestory';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'playwright-test-secret';

const backendEnv = {
  ...process.env,
  PORT: '5000',
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV: 'test',
};

// Same-origin `/api` so Vite proxies to the backend and `page.route('**/api/**')` can intercept.
const frontendEnv = {
  ...process.env,
  VITE_API_URL: '/api',
};

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  projects: [
    {
      name: 'api',
      testMatch: ['**/reading.api.spec.js', '**/reading-analytics.unit.spec.js'],
      use: {
        baseURL: 'http://127.0.0.1:5000',
      },
    },
    {
      name: 'chromium',
      testMatch: '**/*.ui.spec.js',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://127.0.0.1:5173',
      },
    },
  ],
  webServer: [
    {
      command: 'npm start',
      cwd: path.join(repoRoot, 'backend'),
      url: 'http://127.0.0.1:5000/',
      reuseExistingServer: !process.env.CI,
      timeout: 90_000,
      env: backendEnv,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5173',
      cwd: path.join(repoRoot, 'frontend'),
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: frontendEnv,
    },
  ],
});
