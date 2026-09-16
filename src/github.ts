import type { DataIndex } from "./model";

export interface DataSource {
  owner: string;
  repo: string;
  /** Branch that carries the generated index.json (written by the data repo's CI). */
  branch: string;
}

export const DEFAULT_SOURCE: DataSource = { owner: "ksmggg", repo: "lens-data", branch: "index" };

export class GitHubError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

/** One request: the prebuilt index from the private repo, readable only with a token that can see it. */
export async function fetchIndex(source: DataSource, token: string): Promise<DataIndex> {
  // Local development against a copy of the data: `public/index.json` (never committed).
  if (import.meta.env.DEV && import.meta.env["VITE_LOCAL_INDEX"] === "1") {
    const local = await fetch(`${import.meta.env.BASE_URL}index.json`);
    if (local.ok) return (await local.json()) as DataIndex;
  }
  const url = `https://api.github.com/repos/${source.owner}/${source.repo}/contents/index.json?ref=${source.branch}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.raw+json" },
  });
  if (!res.ok) throw new GitHubError(res.status, describe(res.status));
  return (await res.json()) as DataIndex;
}

function describe(status: number): string {
  if (status === 401) return "That token was not accepted.";
  if (status === 403) return "This token cannot read the data repository.";
  if (status === 404) return "No index found — the token may lack access, or the data has not been built yet.";
  return `GitHub answered ${status}.`;
}
