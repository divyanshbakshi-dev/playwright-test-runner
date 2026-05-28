const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '/tmp',
  testMatch: '**/*.spec.js',
  timeout: 30000,
  use: {
    headless: true,
    launchOptions: {
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  },
});