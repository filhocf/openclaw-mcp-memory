import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text"],
      // thresholds disabled — @vitest/coverage-v8 version mismatch with Node 22
    },
  },
});
