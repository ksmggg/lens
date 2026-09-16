import type { DataIndex } from "./model";

export interface Session {
  email: string;
}

/** Thrown when the site's own API is not there at all — only plain `vite` dev without wrangler does that. */
export class NoApi extends Error {}
/** Thrown when Access has not identified the viewer (or the identity failed verification at the proxy). */
export class NotSignedIn extends Error {}

const BASE = `${import.meta.env.BASE_URL}api`;
export const SIGN_OUT_URL = "/cdn-cgi/access/logout";

/** Who Access says we are. The proxy verified the Access token; the browser never holds any secret. */
export async function fetchSession(): Promise<Session> {
  const res = await fetch(`${BASE}/me`, { headers: { Accept: "application/json" } });
  if (res.status === 403) throw new NotSignedIn("Not signed in.");
  if (!res.ok || !res.headers.get("Content-Type")?.includes("application/json")) throw new NoApi(`API answered ${res.status}`);
  return (await res.json()) as Session;
}

/** The prebuilt index, read on our behalf by the proxy. */
export async function fetchIndexViaApi(): Promise<DataIndex> {
  const res = await fetch(`${BASE}/data`, { headers: { Accept: "application/json" } });
  if (res.status === 403) throw new NotSignedIn("Not signed in.");
  if (!res.ok) throw new Error(res.status === 502 ? "The data repository could not be read." : `API answered ${res.status}.`);
  return (await res.json()) as DataIndex;
}
