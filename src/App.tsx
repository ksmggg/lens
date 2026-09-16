import { useEffect, useMemo, useState } from "react";
import { Chips } from "./Chips";
import { NeedDetail, RequirementDetail } from "./Detail";
import { SignIn } from "./SignIn";
import { EMPTY_FILTERS, applyNeedFilters, applyReqFilters, modulesOf, peopleOf, statusesOf, type Filters } from "./filters";
import { DEFAULT_SOURCE, GitHubError, fetchIndex } from "./github";
import { NEED_STATUS_LABEL, PROTO_LABEL, formatAt, type DataIndex, type Lens } from "./model";
import { buildSearch } from "./search";
import { clearToken, readToken, writeToken } from "./session";

type Load = { state: "idle" } | { state: "loading" } | { state: "ready"; index: DataIndex } | { state: "error"; message: string };

export function App() {
  const [token, setToken] = useState<string | null>(() => readToken());
  const [load, setLoad] = useState<Load>({ state: "idle" });

  useEffect(() => {
    if (!token) return;
    let alive = true;
    setLoad({ state: "loading" });
    fetchIndex(DEFAULT_SOURCE, token).then(
      (index) => alive && setLoad({ state: "ready", index }),
      (err: unknown) => {
        if (!alive) return;
        const message = err instanceof GitHubError ? err.message : "Could not reach GitHub.";
        if (err instanceof GitHubError && err.status === 401) { clearToken(); setToken(null); }
        setLoad({ state: "error", message });
      },
    );
    return () => { alive = false; };
  }, [token]);

  if (!token) return <SignIn error={load.state === "error" ? load.message : null} onSubmit={(t, remember) => { writeToken(t, remember); setToken(t); }} />;
  if (load.state === "loading" || load.state === "idle") return <main className="signin"><p className="muted">Loading…</p></main>;
  if (load.state === "error") return <main className="signin"><p className="error" role="alert">{load.message}</p><button type="button" onClick={() => { clearToken(); setToken(null); }}>Sign out</button></main>;
  return <Workspace index={load.index} onSignOut={() => { clearToken(); setToken(null); }} />;
}

function Workspace({ index, onSignOut }: { index: DataIndex; onSignOut: () => void }) {
  const [lens, setLens] = useState<Lens>(() => (location.hash === "#requirements" ? "requirements" : "needs"));
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [openId, setOpenId] = useState<string | null>(null);
  const search = useMemo(() => buildSearch(index), [index]);
  const hits = useMemo(() => search(filters.query, lens), [search, filters.query, lens]);
  const needs = useMemo(() => applyNeedFilters(index.needs, filters, hits), [index, filters, hits]);
  const reqs = useMemo(() => applyReqFilters(index.requirements, filters, hits, index), [index, filters, hits]);
  const switchLens = (next: Lens) => { setLens(next); setFilters((f) => ({ ...f, status: null })); setOpenId(null); location.hash = next; };
  const open = (id: string) => { setOpenId(id); if (id.startsWith("N-") !== (lens === "needs")) { setLens(id.startsWith("N-") ? "needs" : "requirements"); } };
  const openNeed = openId ? index.needs.find((n) => n.id === openId) : undefined;
  const openReq = openId ? index.requirements.find((r) => r.id === openId) : undefined;
  const count = lens === "needs" ? `${needs.length} of ${index.needs.length}` : `${reqs.length} of ${index.requirements.length}`;

  return (
    <div className={`app ${openId ? "has-detail" : ""}`}>
      <header className="bar">
        <div className="lens" role="tablist" aria-label="Lens">
          <button type="button" role="tab" aria-selected={lens === "needs"} onClick={() => switchLens("needs")}>Needs</button>
          <button type="button" role="tab" aria-selected={lens === "requirements"} onClick={() => switchLens("requirements")}>Requirements</button>
        </div>
        <input type="search" placeholder={lens === "needs" ? "Search needs, people, notes…" : "Search requirements, IDs…"} value={filters.query} onChange={(e) => setFilters({ ...filters, query: e.target.value })} aria-label="Search" />
        <span className="count">{count}</span>
        <button type="button" className="ghost" onClick={onSignOut}>Sign out</button>
      </header>
      <div className="filters">
        <Chips label="Module" values={modulesOf(index)} value={filters.module} onPick={(module) => setFilters({ ...filters, module })} />
        <Chips label="Status" values={statusesOf(index, lens)} value={filters.status} onPick={(status) => setFilters({ ...filters, status })} />
        <Chips label="Person" values={peopleOf(index)} value={filters.person} onPick={(person) => setFilters({ ...filters, person })} />
      </div>
      <div className="split">
        <ul className="list" aria-label={lens}>
          {lens === "needs"
            ? needs.map((n) => (
                <li key={n.id}>
                  <button type="button" className={`item ${openId === n.id ? "open" : ""}`} onClick={() => open(n.id)}>
                    <span className="meta">{n.id} · {n.module} · {n.raised_by}{n.sources[0] ? ` · ${formatAt(n.sources[0].at, n.sources[0].approx)}` : ""}</span>
                    <span className="title">{n.need}</span>
                    <span className="badges"><span className={`badge s-${n.status}`}>{NEED_STATUS_LABEL[n.status]}</span> <span className={`badge p-${n.prototype.state}`}>{PROTO_LABEL[n.prototype.state]}</span>{n.requirements.length ? <span className="muted"> {n.requirements.join(" ")}</span> : null}</span>
                  </button>
                </li>
              ))
            : reqs.map((r) => (
                <li key={r.id}>
                  <button type="button" className={`item ${openId === r.id ? "open" : ""}`} onClick={() => open(r.id)}>
                    <span className="meta">{r.id} · {r.module}</span>
                    <span className="title">{r.ears || <span className="muted">no text imported</span>}</span>
                    <span className="badges"><span className={`badge r-${(r.status || "unstatused").toLowerCase()}`}>{r.status || "unstatused"}</span> <span className="muted">{r.needs.length} need{r.needs.length === 1 ? "" : "s"}</span></span>
                  </button>
                </li>
              ))}
          {(lens === "needs" ? needs : reqs).length === 0 ? <li className="empty">Nothing matches. Clear a filter.</li> : null}
        </ul>
        <aside className="pane" aria-live="polite">
          {openNeed ? <NeedDetail need={openNeed} index={index} onOpen={open} /> : openReq ? <RequirementDetail req={openReq} index={index} onOpen={open} /> : <p className="muted placeholder">Pick an item.</p>}
          {openId ? <button type="button" className="close" onClick={() => setOpenId(null)} aria-label="Close">×</button> : null}
        </aside>
      </div>
      <footer className="foot">Data built {formatAt(index.generatedAt.slice(0, 16))} · {DEFAULT_SOURCE.owner}/{DEFAULT_SOURCE.repo}</footer>
    </div>
  );
}
