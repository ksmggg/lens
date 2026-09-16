# lens

Two views over one folder of needs and requirements: **needs first** for whoever collects asks,
**requirements first** for whoever owns the requirement set. Static shell on Cloudflare Pages behind
Cloudflare Access; a Pages Function reads the data from a private repository with a server-side token,
so viewers sign in with their email and never handle a GitHub token.

- Search is instant and local; filters by module, status and person.
- Every source shows when it was said — the offset into the recording and the wall-clock time.

## Run it locally

    cp .dev.vars.example .dev.vars        # DEV_IDENTITY stands in for Access on localhost
    cp ../lens-data/dist/index.json public/   # or set GITHUB_TOKEN in .dev.vars to read the real index
    npm run dev                            # rebuilds dist on change
    npm run dev:pages                      # serves dist + functions on http://localhost:8788

`npm run ci` = typecheck (app + functions), build, tests. Data repository layout and validation: see the
data repo's README.
