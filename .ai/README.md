# lens
> Two lenses (needs-first, requirements-first) over a folder of Markdown files in a private GitHub repo.

**Path:** `~/Apps/lens`
**Status:** Active
**Stack:** Vite + React 19 + TypeScript, MiniSearch, Cloudflare Pages + Functions (jose), Cloudflare Access
**URLs:** https://github.com/ksmggg/lens · data: https://github.com/ksmggg/lens-data (private) · ticket ATS-95 (Plane skd/ATS) · hosting: Cloudflare Pages (domain to be decided)

## What This Is
A static shell plus one small server function. Cloudflare Access (email one-time PIN, allowlist) fronts the
site; `functions/api/*` verifies the Access JWT, then reads `index.json` from the data repo's `index` branch
with a server-side GitHub token and returns it. The browser holds no secret and talks only to its own origin.
v1 is read-only; v2 commits edits per save through the same proxy, author = Access email.

## Key Decisions
- Users never touch GitHub (16 Sep 2026): Access identity + server-side token, instead of a per-user token.
- Shell public, data private: the repo stays product-neutral (no client or project names — CI greps for them).
- `functions/access.ts` — `identify()`: `iss` = `TEAM_DOMAIN`, `aud` = `POLICY_AUD`, certs from
  `${TEAM_DOMAIN}/cdn-cgi/access/certs`. `DEV_IDENTITY` stands in for Access on localhost only (hostname check).
- Route is `/api/data`, not `/api/index` — Pages treats `index.ts` as the directory route.
- CSP: production `connect-src 'self'` only; `--mode development` builds add the HMR socket and api.github.com.
- Config: `wrangler.toml` holds `TEAM_DOMAIN`, `DATA_REPO`, `DATA_BRANCH`; `GITHUB_TOKEN` and `POLICY_AUD`
  are Pages secrets/vars set in the dashboard; local values in `.dev.vars` (gitignored, see `.dev.vars.example`).
- Local loop: `npm run dev` (vite build --watch) + `npm run dev:pages` (wrangler serves `dist` + Functions on
  :8788). Without `GITHUB_TOKEN` the function serves `public/index.json` (copy from lens-data `dist/`).
  `--proxy` is ignored once `pages_build_output_dir` is set, and `--live-reload` 500s in wrangler 4.132 — hence
  the build-watch loop. `npm run dev:token` is plain vite with the old token screen (dev fallback only).
- Launch config `lens` in `~/STARK/.claude/launch.json` runs both on port 8788.

## Publishing (pending Michi's decision)
1. Cloudflare Pages project `lens` from `ksmggg/lens` (build `npm run build`, output `dist`); secrets
   `GITHUB_TOKEN` (fine-grained, contents: read on lens-data), var `POLICY_AUD`.
2. Zero Trust → Access application (self-hosted) on the Pages domain; policy: allowlist of emails; copy its
   Application Audience tag into `POLICY_AUD`.
3. `lens-data`: push `main` so CI publishes the `index` branch (`/api/data` returns 502 until it exists).
