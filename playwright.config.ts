import { defineConfig, devices } from "@playwright/test";

// Browsers come from nixpkgs via PLAYWRIGHT_BROWSERS_PATH (set in the flake devShell).
export default defineConfig({
  testDir: "test/e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // The production server doesn't read .env itself; CI sets the env directly.
    command: "pnpm build && node --env-file-if-exists=.env .output/server/index.mjs",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
