import { createLocalJWKSet, createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

export interface AccessEnv {
  /** Team domain, e.g. https://example.cloudflareaccess.com — also the JWT issuer. */
  TEAM_DOMAIN: string;
  /** Audience tag of the Access application that fronts this site. */
  POLICY_AUD?: string;
  /** Local development only: the email to act as. Honoured on localhost, ignored everywhere else. */
  DEV_IDENTITY?: string;
}

export interface Identity {
  email: string;
}

export class AccessDenied extends Error {}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const HEADER = "Cf-Access-Jwt-Assertion";

/** Who is making this request, according to Cloudflare Access — or the local stub when developing. */
export async function identify(request: Request, env: AccessEnv, jwks?: { keys: JsonWebKey[] }): Promise<Identity> {
  if (env.DEV_IDENTITY && LOCAL_HOSTS.has(new URL(request.url).hostname)) return { email: env.DEV_IDENTITY };
  if (!env.POLICY_AUD) throw new AccessDenied("POLICY_AUD is not configured");
  const token = request.headers.get(HEADER);
  if (!token) throw new AccessDenied("no Access token on the request");
  try {
    const { payload } = await jwtVerify(token, keyOf(env, jwks), { issuer: env.TEAM_DOMAIN, audience: env.POLICY_AUD });
    if (typeof payload["email"] !== "string") throw new AccessDenied("Access token carries no email");
    return { email: payload["email"] };
  } catch (err) {
    throw err instanceof AccessDenied ? err : new AccessDenied(err instanceof Error ? err.message : "invalid Access token");
  }
}

// Tests hand in a key set; at runtime the team's published certs are fetched (jose caches them).
function keyOf(env: AccessEnv, jwks?: { keys: JsonWebKey[] }): JWTVerifyGetKey {
  return jwks ? createLocalJWKSet(jwks) : createRemoteJWKSet(new URL(`${env.TEAM_DOMAIN}/cdn-cgi/access/certs`));
}
