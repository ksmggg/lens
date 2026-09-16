import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// Built output is served by Cloudflare Pages behind Access; /api/* are Pages Functions in ./functions.
// Production: the browser talks only to this origin. Development (`--mode development`, or plain `vite`)
// also allows the HMR socket and the token fallback's GitHub API.
const csp = (dev: boolean): Plugin => ({
  name: "csp",
  transformIndexHtml: (html) =>
    html.replace("__CONNECT_SRC__", dev ? "'self' ws://localhost:* https://api.github.com" : "'self'"),
});

export default defineConfig(({ mode }) => ({
  plugins: [react(), csp(mode !== "production")],
  base: "/",
  build: { target: "es2022" },
}));
