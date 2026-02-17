import { defineConfig, devices } from "@playwright/test";
import path from "path";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e/tests",
  fullyParallel: !isCI,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "auth-setup",
      testDir: "./e2e",
      testMatch: "auth.setup.ts",
    },
    {
      name: "public-chromium",
      testDir: "./e2e/tests/public",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: path.join(__dirname, "playwright/.clerk/user.json"),
      },
      dependencies: ["auth-setup"],
    },
  ],
  globalSetup: "./e2e/global.setup.ts",
  webServer: [
    {
      command: "node e2e/mock-openai-server.mjs",
      port: 3100,
      reuseExistingServer: !isCI,
    },
    {
      command: "npm run dev",
      port: 3000,
      reuseExistingServer: !isCI,
      env: {
        OPENAI_BASE_URL: "http://localhost:3100/v1",
      },
      timeout: 120000,
    },
  ],
});
