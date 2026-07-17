import { defineConfig } from "@playwright/test";

const previewUrl = "http://127.0.0.1:4321";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: previewUrl,
    browserName: "chromium",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "compact-390",
      use: { viewport: { width: 390, height: 844 } },
    },
    {
      name: "wide-1440",
      use: { viewport: { width: 1440, height: 1000 } },
    },
  ],
  webServer: {
    command: "corepack pnpm preview --host 127.0.0.1 --port 4321",
    url: previewUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
