import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 5175,
    strictPort: true
  },
  preview: {
    port: 5175,
    strictPort: true
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        admin: resolve(__dirname, "wp-admin/index.html")
      },
      output: {
        manualChunks(id) {
          const normalizedId = id.split("\\").join("/");
          if (normalizedId.includes("/node_modules/")) return "vendor";
          if (normalizedId.endsWith("/src/i18n.js")) return "i18n";
          if (normalizedId.endsWith("/src/lib/data.js")) return "seed-data";
          return undefined;
        }
      }
    }
  }
});
