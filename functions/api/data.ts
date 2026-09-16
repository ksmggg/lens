import { json, type ApiContext } from "./_middleware";

/** The prebuilt index from the private data repository, read with the server-side token — never the viewer's. */
export const onRequestGet = async ({ env, request }: ApiContext) => {
  if (!env.GITHUB_TOKEN) return localIndex(env.ASSETS, request);
  const url = `https://api.github.com/repos/${env.DATA_REPO}/contents/index.json?ref=${env.DATA_BRANCH}`;
  const upstream = await fetch(url, {
    headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: "application/vnd.github.raw+json", "User-Agent": "lens" },
  });
  if (!upstream.ok) return json({ error: `data repository answered ${upstream.status}` }, 502);
  return new Response(upstream.body, { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
};

// Local development without a token: `public/index.json` (gitignored), served by the asset host.
async function localIndex(assets: Fetcher, request: Request): Promise<Response> {
  const res = await assets.fetch(new URL("/index.json", request.url));
  if (!res.ok) return json({ error: "no local index — copy the data repo's dist/index.json to public/" }, 404);
  return new Response(res.body, { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
