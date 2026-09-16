import { SignJWT, exportJWK, generateKeyPair } from "jose";
import { beforeAll, describe, expect, it } from "vitest";
import { AccessDenied, identify, type AccessEnv } from "./access";

const TEAM = "https://example.cloudflareaccess.com";
const AUD = "a".repeat(64);
const env: AccessEnv = { TEAM_DOMAIN: TEAM, POLICY_AUD: AUD };

let privateKey: CryptoKey;
let jwks: { keys: JsonWebKey[] };

beforeAll(async () => {
  const pair = await generateKeyPair("RS256");
  privateKey = pair.privateKey;
  jwks = { keys: [{ ...(await exportJWK(pair.publicKey)), alg: "RS256", use: "sig", kid: "test" }] };
});

async function sign(claims: Record<string, unknown>, opts: { aud?: string; iss?: string; expired?: boolean } = {}) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "RS256", kid: "test" })
    .setIssuer(opts.iss ?? TEAM)
    .setAudience(opts.aud ?? AUD)
    .setIssuedAt()
    .setExpirationTime(opts.expired ? "-1h" : "1h")
    .sign(privateKey);
}

function request(url: string, jwt?: string) {
  return new Request(url, { headers: jwt ? { "Cf-Access-Jwt-Assertion": jwt } : {} });
}

describe("identify", () => {
  it("returns the email from a valid Access JWT", async () => {
    const jwt = await sign({ email: "someone@example.com" });
    await expect(identify(request("https://lens.example/api/index", jwt), env, jwks)).resolves.toEqual({ email: "someone@example.com" });
  });

  it("rejects a missing header", async () => {
    await expect(identify(request("https://lens.example/api/index"), env, jwks)).rejects.toBeInstanceOf(AccessDenied);
  });

  it("rejects a token for another application", async () => {
    const jwt = await sign({ email: "someone@example.com" }, { aud: "b".repeat(64) });
    await expect(identify(request("https://lens.example/api/index", jwt), env, jwks)).rejects.toBeInstanceOf(AccessDenied);
  });

  it("rejects a token from another team", async () => {
    const jwt = await sign({ email: "someone@example.com" }, { iss: "https://other.cloudflareaccess.com" });
    await expect(identify(request("https://lens.example/api/index", jwt), env, jwks)).rejects.toBeInstanceOf(AccessDenied);
  });

  it("rejects an expired token", async () => {
    const jwt = await sign({ email: "someone@example.com" }, { expired: true });
    await expect(identify(request("https://lens.example/api/index", jwt), env, jwks)).rejects.toBeInstanceOf(AccessDenied);
  });

  it("rejects a valid token that carries no email", async () => {
    const jwt = await sign({ sub: "service" });
    await expect(identify(request("https://lens.example/api/index", jwt), env, jwks)).rejects.toBeInstanceOf(AccessDenied);
  });

  it("refuses to run without an audience configured", async () => {
    const jwt = await sign({ email: "someone@example.com" });
    await expect(identify(request("https://lens.example/api/index", jwt), { TEAM_DOMAIN: TEAM }, jwks)).rejects.toBeInstanceOf(AccessDenied);
  });

  describe("DEV_IDENTITY stub", () => {
    const dev: AccessEnv = { ...env, DEV_IDENTITY: "dev@example.com" };

    it("stands in for Access on localhost", async () => {
      await expect(identify(request("http://localhost:8788/api/index"), dev, jwks)).resolves.toEqual({ email: "dev@example.com" });
      await expect(identify(request("http://127.0.0.1:8788/api/index"), dev, jwks)).resolves.toEqual({ email: "dev@example.com" });
    });

    it("is ignored on any other host, so a leaked variable cannot open production", async () => {
      await expect(identify(request("https://lens.example/api/index"), dev, jwks)).rejects.toBeInstanceOf(AccessDenied);
    });
  });
});
