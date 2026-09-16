import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { copyFileSync, mkdirSync } from "node:fs";

// Earlier portfolio builds archived under public/versions/. The dev server has to be told about all of them, because
// a bare directory URL would otherwise fall through to the current app. Only the single-page ones have their own
// routes to pre-render; V1 is one static page.
const ARCHIVES = ["v1", "v2", "v3"];
const SPA_ARCHIVES = ["v2", "v3"];
const ARCHIVE_ROUTES = ["about", "projects", "skills", "contact"];

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
    name: "serve-archived-versions",
    apply: "serve",
    configureServer(server) {
      // Without this the dev server answers an archive's URLs with the current app, which shows its 404 page.
      server.middlewares.use((req, _res, next) => {
        const version = req.url?.match(/^\/versions\/(v\d+)(\/[^.?]*)?(\?.*)?$/)?.[1];
        if (version && ARCHIVES.includes(version)) req.url = `/versions/${version}/index.html`;
        next();
      });
    },
  }, {
    name: "github-pages-spa-fallback",
    apply: "build",
    closeBundle() {
      // GitHub Pages serves this document on a direct visit to an SPA route.
      copyFileSync(path.resolve(__dirname, "dist/index.html"), path.resolve(__dirname, "dist/404.html"));
      // Each archived build has its own routes; give each one a page so refreshing or sharing it doesn't 404.
      for (const version of SPA_ARCHIVES) {
        for (const route of ARCHIVE_ROUTES) {
          const directory = path.resolve(__dirname, "dist/versions", version, route);
          mkdirSync(directory, { recursive: true });
          copyFileSync(path.resolve(__dirname, "dist/versions", version, "index.html"), path.join(directory, "index.html"));
        }
      }
    },
  }],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
