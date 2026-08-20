import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { readAppVersion } from "./build/version.ts";

const host = process.env.TAURI_DEV_HOST;
const appVersion = readAppVersion();

export default defineConfig(async () => ({
  plugins: [react(), viteSingleFile()],
  define: {
    CODEX_TRACE_VERSION: JSON.stringify(appVersion),
  },
  clearScreen: false,
  build: {
    chunkSizeWarningLimit: 1500,
  },
  server: {
    port: process.env.VITE_PORT ? parseInt(process.env.VITE_PORT) : 1420,
    strictPort: !process.env.VITE_PORT,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));
