import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { copyFileSync } from "node:fs";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), {
    name: "github-pages-spa-fallback",
    apply: "build",
    closeBundle() {
      // GitHub Pages serves this document on a direct visit to an SPA route.
      copyFileSync(path.resolve(__dirname, "dist/index.html"), path.resolve(__dirname, "dist/404.html"));
    },
  }],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
