// SRS: work order "Admin login: IAMJCG" (SITA sign-in, server-checked every request).
import { describe, expect, it } from "vitest";
import { generateKeyPairSync, sign } from "node:crypto";
import { challengeFor, digestOf, evaluate, isState, keyringFrom, newState, newVerifier, openCredential, redeem, signInUrl, windowFrom, type BoundSession } from "@/lib/auth/sita";

const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const other = generateKeyPairSync("ed25519");
const ring = keyringFrom({ keys: [{ kid: "k1", alg: "Ed25519", publicKey: publicKey.export({ format: "der", type: "spki" }).toString("base64"), active: true }, { kid: "bad", publicKey: "nope" }] });

function cred(claims: Record<string, unknown>, key = privateKey) {
  const p = Buffer.from(JSON.stringify({ kid: "k1", sid: "s1", cv: 1, st: "ACTIVE", abs: "2026-11-11T00:00:00Z", iat: "2026-11-10T00:00:00Z", ...claims })).toString("base64url");
  return `sita1.${p}.${sign(null, Buffer.from(`sita1.${p}`), key).toString("base64url")}`;
}
const now = new Date("2026-11-10T12:00:00Z");
const ids = ["gone-1"];
const win = windowFrom({ readAt: "2026-11-10T11:59:50Z", windowSeconds: 300, complete: true, entryCount: 1, digest: digestOf(ids), entries: [{ sessionId: "gone-1" }] })!;
const bound: BoundSession = { sid: "s1", cv: 1, st: "ACTIVE", abs: "2026-11-11T00:00:00Z", email: "gopal@jurislpo.com", identityId: "i1" };

describe("PKCE and sign-in URL", () => {
  it("challenge is base64url sha256 of the verifier (43 chars)", () => {
    const v = newVerifier();
    expect(v).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(challengeFor(v)).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(challengeFor("abc")).toBe("ungWv48Bz-pBQUDeXa4iI7ADYaOWF3qctBD_YfIAFa0");
  });
  it("state matches SITA's pattern; unprefixed states never look like a preview relay", () => {
    for (let i = 0; i < 200; i++) {
      const s = newState();
      expect(isState(s)).toBe(true);
      expect(s.startsWith("pv")).toBe(false);
    }
    expect(isState(newState("pv-"))).toBe(true);
    expect(isState("pv.abcdefgh")).toBe(false);
  });
  it("builds the sign-in URL", () => {
    const u = new URL(signInUrl("https://sita.example/", "https://a/auth/sita/return", "st4te123", "ch"));
    expect(u.pathname).toBe("/sign-in");
    expect(Object.fromEntries(u.searchParams)).toEqual({ return_to: "https://a/auth/sita/return", state: "st4te123", challenge: "ch" });
  });
});

describe("credential", () => {
  it("opens a valid credential", () => expect(openCredential(ring, cred({}))).toMatchObject({ sid: "s1", cv: 1, st: "ACTIVE" }));
  it("refuses a wrong signature, unknown kid, tampered payload, bad shape", () => {
    expect(openCredential(ring, cred({}, other.privateKey))).toBeNull();
    expect(openCredential(ring, cred({ kid: "zz" }))).toBeNull();
    const [v, , s] = cred({}).split(".");
    expect(openCredential(ring, `${v}.${Buffer.from(JSON.stringify({ kid: "k1", sid: "admin", cv: 1, st: "ACTIVE", abs: "2099-01-01T00:00:00Z" })).toString("base64url")}.${s}`)).toBeNull();
    expect(openCredential(ring, "sita2.a.b")).toBeNull();
    expect(openCredential(ring, undefined)).toBeNull();
    expect(openCredential(ring, cred({ cv: "1" }))).toBeNull();
    expect(openCredential(ring, cred({ abs: "2026-11-11T00:00:00" }))).toBeNull(); // no zone
  });
});

describe("revocation window", () => {
  it("accepts only a complete, consistent window", () => {
    expect(win.revoked.has("gone-1")).toBe(true);
    const base = { readAt: "2026-11-10T11:59:50Z", windowSeconds: 300, complete: true, entryCount: 1, digest: digestOf(ids), entries: [{ sessionId: "gone-1" }] };
    expect(windowFrom({ ...base, complete: false })).toBeNull();
    expect(windowFrom({ ...base, entryCount: 2 })).toBeNull();
    expect(windowFrom({ ...base, digest: "x" })).toBeNull();
    expect(windowFrom({ ...base, windowSeconds: 0 })).toBeNull();
    expect(windowFrom(null)).toBeNull();
  });
});

describe("every request", () => {
  const go = (over: Partial<Parameters<typeof evaluate>[0]> = {}) => evaluate({ ring, window: win, now, credential: cred({}), session: bound, ...over });
  it("authenticated", () => expect(go()).toBe("authenticated"));
  it("no cookie or forged credential", () => {
    expect(go({ credential: undefined })).toBe("not_authenticated");
    expect(go({ credential: cred({}, other.privateKey) })).toBe("not_authenticated");
  });
  it("fails closed without a fresh revocation window", () => {
    expect(go({ window: null })).toBe("unavailable");
    expect(go({ now: new Date("2026-11-10T12:10:00Z") })).toBe("unavailable");
  });
  it("revoked, expired, superseded, reauth, or a credential from another session", () => {
    expect(go({ credential: cred({ sid: "gone-1" }), session: { ...bound, sid: "gone-1" } })).toBe("revoked");
    expect(go({ credential: cred({ abs: "2026-11-10T11:00:00Z" }) })).toBe("expired");
    expect(go({ session: { ...bound, cv: 2 } })).toBe("reuse");
    expect(go({ credential: cred({ st: "REAUTH_REQUIRED" }), session: { ...bound, st: "REAUTH_REQUIRED" } })).toBe("not_authenticated");
    expect(go({ session: { ...bound, sid: "s2" } })).toBe("not_authenticated");
    expect(go({ session: null })).toBe("not_authenticated");
  });
});

describe("redeem", () => {
  const handoff = "a".repeat(43);
  it("returns the session, credential and lower-cased email", async () => {
    const f = (async () => Response.json({ sessionId: "s1", credential: "c", identity: { email: "Gopal@JurisLPO.com" } })) as unknown as typeof fetch;
    expect(await redeem("https://sita", handoff, "v", f)).toEqual({ sessionId: "s1", credential: "c", email: "gopal@jurislpo.com" });
  });
  it("refuses bad handoffs and failed or malformed answers", async () => {
    const ok = (async () => Response.json({})) as unknown as typeof fetch;
    expect(await redeem("https://sita", "short", "v", ok)).toBeNull();
    expect(await redeem("https://sita", handoff, "v", (async () => new Response("", { status: 401 })) as unknown as typeof fetch)).toBeNull();
    expect(await redeem("https://sita", handoff, "v", ok)).toBeNull();
  });
});
