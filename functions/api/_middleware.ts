import { AccessDenied, identify, type AccessEnv, type Identity } from "../access";

export interface ApiEnv extends AccessEnv {
  ASSETS: Fetcher;
  /** Fine-grained token with contents: read on the data repository. Absent locally → index served from public/. */
  GITHUB_TOKEN?: string;
  /** owner/repo of the data repository. */
  DATA_REPO: string;
  /** Branch that carries the generated index.json. */
  DATA_BRANCH: string;
}

export type ApiContext = EventContext<ApiEnv, string, { identity: Identity }>;

/** Every /api/* request is identified first; handlers read `data.identity`. */
export const onRequest: PagesFunction<ApiEnv, string, { identity: Identity }> = async (context) => {
  try {
    context.data.identity = await identify(context.request, context.env);
  } catch (err) {
    if (err instanceof AccessDenied) return json({ error: "not signed in" }, 403);
    throw err;
  }
  return context.next();
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
