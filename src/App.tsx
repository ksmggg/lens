import { useEffect, useMemo, useState } from "react";
import { Chips } from "./Chips";
import { NeedDetail, RequirementDetail } from "./Detail";
import { SignIn } from "./SignIn";
import { Matrix } from "./Matrix";
import { NoApi, NotSignedIn, SIGN_OUT_URL, fetchIndexViaApi, fetchSession } from "./api";
import { EMPTY_FILTERS, applyNeedFilters, applyReqFilters, modulesOf, peopleOf, statusesOf, type Filters } from "./filters";
import { DEFAULT_SOURCE, GitHubError, fetchIndex } from "./github";
import { formatAt, type DataIndex, type Lens } from "./model";
import { buildSearch } from "./search";
import { clearToken, readToken, writeToken } from "./session";
import type { Sort } from "./sort";

/** Who is looking, and how they leave. Access gives an email; the dev token fallback gives none. */
interface Viewer {
  email: string | null;
  signOut: () => void;
}

type Load =
  | { state: "loading" }
  | { state: "ready"; index: DataIndex; viewer: Viewer }
  | { state: "error"; message: string; retry?: () => void }
  | { state: "token"; error: string | null };

/** Default path: the site's proxy identifies the viewer through Cloudflare Access and reads the data for them. */
export function App() {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [token, setToken] = useState<string | null>(() => readToken());
  const reload = () => location.reload();

  useEffect(() => {
    let alive = true;
    const fail = (message: string, retry?: () => void) => alive && setLoad(retry ? { state: "error", message, retry } : { state: "error", message });
    fetchSession()
      .then(async (session) => ({ session, index: await fetchIndexViaApi() }))
      .then(({ session, index }) => alive && setLoad({ state: "ready", index, viewer: { email: session.email, signOut: () => location.assign(SIGN_OUT_URL) } }))
      .catch((err: unknown) => {
        if (err instanceof NoApi && import.meta.env.DEV) return alive && setLoad({ state: "token", error: null });
        if (err instanceof NoApi) return fail("This site is not set up to read the data.");
        if (err instanceof NotSignedIn) return fail("Your session has ended. Reload to sign in again.", reload);
        fail(err instanceof Error ? err.message : "Could not load the data.", reload);
      });
    return () => { alive = false; };
  }, []);

  // Dev fallback (plain `vite`, no wrangler): read the data repository directly with a token from the viewer.
  useEffect(() => {
    if (load.state !== "token" || !token) return;
    let alive = true;
    const signOut = () => { clearToken(); setToken(null); setLoad({ state: "token", error: null }); };
    fetchIndex(DEFAULT_SOURCE, token).then(
      (index) => alive && setLoad({ state: "ready", index, viewer: { email: null, signOut } }),
      (err: unknown) => {
        if (!alive) return;
        if (err instanceof GitHubError && err.status === 401) clearToken();
        setToken(null);
        setLoad({ state: "token", error: err instanceof GitHubError ? err.message : "Could not reach GitHub." });
      },
    );
    return () => { alive = false; };
  }, [load.state, token]);

  if (load.state === "token") return <SignIn error={load.error} onSubmit={(t, remember) => { writeToken(t, remember); setToken(t); }} />;
  if (load.state === "loading") return <main className="signin"><p className="muted">Loading…</p></main>;
  if (load.state === "error") return <main className="signin"><p className="error" role="alert">{load.message}</p>{load.retry ? <button type="button" onClick={load.retry}>Reload</button> : null}</main>;
  return <Workspace index={load.index} viewer={load.viewer} />;
}

function Workspace({ index, viewer }: { index: DataIndex; viewer: Viewer }) {
  const [lens, setLens] = useState<Lens>(() => (location.hash === "#requirements" ? "requirements" : "needs"));
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [openId, setOpenId] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>(null);
  const search = useMemo(() => buildSearch(index), [index]);
  const hits = useMemo(() => search(filters.query, lens), [search, filters.query, lens]);
  const needs = useMemo(() => applyNeedFilters(index.needs, filters, hits), [index, filters, hits]);
  const reqs = useMemo(() => applyReqFilters(index.requirements, filters, hits, index), [index, filters, hits]);
  const switchLens = (next: Lens) => { setLens(next); setFilters((f) => ({ ...f, status: null })); setOpenId(null); setSort(null); location.hash = next; };
  const open = (id: string) => { setOpenId(id); if (id.startsWith("N-") !== (lens === "needs")) { setLens(id.startsWith("N-") ? "needs" : "requirements"); } };
  const openNeed = openId ? index.needs.find((n) => n.id === openId) : undefined;
  const openReq = openId ? index.requirements.find((r) => r.id === openId) : undefined;
  const count = lens === "needs" ? `${needs.length} of ${index.needs.length}` : `${reqs.length} of ${index.requirements.length}`;

  return (
    <div className={`app ${openId ? "has-detail" : ""}`}>
      <header className="bar">
        <div className="lens" role="tablist" aria-label="Lens">
          <button type="button" role="tab" aria-selected={lens === "needs"} onClick={() => switchLens("needs")}>Needs first</button>
          <button type="button" role="tab" aria-selected={lens === "requirements"} onClick={() => switchLens("requirements")}>Requirements first</button>
        </div>
        <input type="search" placeholder={lens === "needs" ? "Search needs, people, notes…" : "Search requirements, IDs…"} value={filters.query} onChange={(e) => setFilters({ ...filters, query: e.target.value })} aria-label="Search" />
        <span className="count">{count}</span>
      </header>
      <div className="filters">
        <Chips label="Module" values={modulesOf(index)} value={filters.module} onPick={(module) => setFilters({ ...filters, module })} />
        <Chips label="Status" values={statusesOf(index, lens)} value={filters.status} onPick={(status) => setFilters({ ...filters, status })} />
        <Chips label="Person" values={peopleOf(index)} value={filters.person} onPick={(person) => setFilters({ ...filters, person })} />
      </div>
      <div className="tablewrap">
        <Matrix grain={lens} needs={needs} reqs={reqs} index={index} openId={openId} onOpen={open} sort={sort} onSort={setSort} />
        {(lens === "needs" ? needs : reqs).length === 0 ? <p className="empty">Nothing matches. Clear a filter.</p> : null}
      </div>
      <aside className="pane" aria-live="polite">
        {openNeed ? <NeedDetail need={openNeed} index={index} onOpen={open} /> : openReq ? <RequirementDetail req={openReq} index={index} onOpen={open} /> : null}
        {openId ? <button type="button" className="close" onClick={() => setOpenId(null)} aria-label="Close">×</button> : null}
      </aside>
      <footer className="foot">
        <span>Data built {formatAt(index.generatedAt.slice(0, 16))} · {DEFAULT_SOURCE.owner}/{DEFAULT_SOURCE.repo}</span>
        <span>{viewer.email ? `${viewer.email} · ` : ""}<button type="button" className="ghost" onClick={viewer.signOut}>Sign out</button></span>
      </footer>
    </div>
  );
}
