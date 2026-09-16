# lens
> Two lenses (needs-first, requirements-first) over a folder of Markdown files in a private GitHub repo.

**Path:** `~/Apps/lens`
**Status:** Active
**Stack:** Vite + React 19 + TypeScript, MiniSearch, GitHub REST (contents API), GitHub Pages
**URLs:** https://github.com/ksmggg/lens · https://ksmggg.github.io/lens/ · data: https://github.com/ksmggg/lens-data (private) · ticket ATS-95 (Plane skd/ATS)

## What This Is
A static PWA shell. After a GitHub token is entered it fetches `index.json` from the data repo's `index`
branch (built by that repo's CI) and shows needs or requirements, searchable and filterable, mobile-first.
v1 is read-only; v2 commits edits per save through the contents API.

## Key Decisions
- Shell public, data private: Pages serves no data; everything comes through the API with the viewer's token.
- Token in sessionStorage by default, localStorage only with "remember on this device"; no offline data cache.
- CSP in index.html allows connections to api.github.com only.
- Product-neutral: no client or project names in this repo (same rule as kosmos-ui).
- Local dev: `VITE_LOCAL_INDEX=1 npm run dev` reads `public/index.json` (gitignored).
