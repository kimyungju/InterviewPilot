import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Unit tests only; Playwright owns e2e/ and uses its own runner.
    include: ["lib/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
