import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        "dist/**",
        "client/**",
        "*.config.ts",
        "**/*.test.ts",
        "**/*.spec.ts",
      ],
    },
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["node_modules", "dist", "client"],
    setupFiles: ["./test-setup.ts"],
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "./shared"),
      "@": path.resolve(__dirname, "./client/src"),
    },
  },
});