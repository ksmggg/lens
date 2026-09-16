# lens

Two views over one folder of needs and requirements: **needs first** for whoever collects asks,
**requirements first** for whoever owns the requirement set. Static, hosted on GitHub Pages; the data
stays in a private repository and is read through the GitHub API with your own token.

- Sign in with a fine-grained token that can read the data repository (contents: read).
- Search is instant and local; filters by module, status and person.
- Every source shows when it was said — the offset into the recording and the wall-clock time.

Data repository layout and validation: see the data repo's README. Local development against a copy
of the data: put its `index.json` in `public/` and run `VITE_LOCAL_INDEX=1 npm run dev`.
