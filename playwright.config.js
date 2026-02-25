const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    channel: 'chrome'
  },
  webServer: {
    command: 'node tests/dev-server.js',
    port: 4173,
    reuseExistingServer: true,
    timeout: 30_000
  }
});
