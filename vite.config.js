import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 5174,
    strictPort: true
  },
  preview: {
    port: 5174,
    strictPort: true
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        admin: resolve(__dirname, "wp-admin/index.html")
      }
    }
  }
});
