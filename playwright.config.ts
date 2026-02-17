import { defineConfig, devices } from "@playwright/test";
import path from "path";

const isCI = !!process.env.CI;
const BASE_PORT = parseInt(process.env.E2E_PORT || "3000");
const hasClerkCredentials =
  !!process.env.CLERK_SECRET_KEY && !!process.env.E2E_CLERK_USER_EMAIL;

export default defineConfig({
  testDir: "./e2e/tests",
  fullyParallel: !isCI,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: `http://localhost:${BASE_PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    // Auth-dependent projects only when Clerk credentials are available
    ...(hasClerkCredentials
      ? [
          {
            name: "auth-setup",
            testDir: "./e2e",
            testMatch: "auth.setup.ts",
          },
          {
            name: "chromium",
            use: {
              ...devices["Desktop Chrome"],
              storageState: path.join(
                __dirname,
                "playwright/.clerk/user.json"
              ),
            },
            dependencies: ["auth-setup"],
          },
        ]
      : []),
    // Public tests always run
    {
      name: "public-chromium",
      testDir: "./e2e/tests/public",
      use: { ...devices["Desktop Chrome"] },
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
      command: `npx next dev --port ${BASE_PORT}`,
      port: BASE_PORT,
      reuseExistingServer: !isCI,
      env: {
        OPENAI_BASE_URL: "http://localhost:3100/v1",
      },
      timeout: 120000,
    },
  ],
});
