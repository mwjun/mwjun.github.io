import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { copyFileSync, mkdirSync } from "node:fs";

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
    name: "serve-archived-v2",
    apply: "serve",
    configureServer(server) {
      // Without this the dev server answers /versions/v2/ with the current app, which shows its 404 page.
      server.middlewares.use((req, _res, next) => {
        if (req.url && /^\/versions\/v2(\/[^.?]*)?(\?.*)?$/.test(req.url)) req.url = "/versions/v2/index.html";
        next();
      });
    },
  }, {
    name: "github-pages-spa-fallback",
    apply: "build",
    closeBundle() {
      // GitHub Pages serves this document on a direct visit to an SPA route.
      copyFileSync(path.resolve(__dirname, "dist/index.html"), path.resolve(__dirname, "dist/404.html"));
      // The archived V2 build has its own routes; give each one a page so refreshing or sharing it doesn't 404.
      for (const route of ["about", "projects", "skills", "contact"]) {
        const directory = path.resolve(__dirname, "dist/versions/v2", route);
        mkdirSync(directory, { recursive: true });
        copyFileSync(path.resolve(__dirname, "dist/versions/v2/index.html"), path.join(directory, "index.html"));
      }
    },
  }],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
