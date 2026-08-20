import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { readAppVersion } from "./build/version.ts";

const appVersion = readAppVersion();

export default defineConfig({
  plugins: [react()],
  define: {
    CODEX_TRACE_VERSION: JSON.stringify(appVersion),
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "shared/**/*.test.{ts,tsx}"],
    passWithNoTests: true,
  },
});
