// SITA, the group's sign-in service. A TypeScript port of the reference consumer
// (jcg-paracounsel/paracounsel-platform web/sita.py). Pure functions first, network calls after.
//
// Flow: /auth/sita/start -> SITA /sign-in (PKCE) -> /auth/sita/return?state&handoff ->
// redeem the handoff -> SITA credential (no identity inside) + the email it was issued to.
// Every request: Ed25519 signature against SITA's keys, the session not revoked (window
// fresh, else fail closed), not expired, not superseded, not REAUTH_REQUIRED.
import { createHash, createPublicKey, randomBytes, verify, type KeyObject } from "node:crypto";

export const VERSION = "sita1";
const B64URL = /^[A-Za-z0-9_-]+$/;

export const b64url = (b: Buffer) => b.toString("base64url");
export const newVerifier = () => b64url(randomBytes(32)); // 43 chars
/** SITA's state: ^[A-Za-z0-9_-]{8,256}$. Unprefixed states never begin with "pv" (reserved for preview relay). */
export function newState(prefix = ""): string {
  let s = b64url(randomBytes(24));
  while (!prefix && s.startsWith("pv")) s = b64url(randomBytes(24));
  return prefix + s;
}
export const challengeFor = (verifier: string) => b64url(createHash("sha256").update(verifier, "ascii").digest());

export function signInUrl(sitaUrl: string, returnTo: string, state: string, challenge: string): string {
  const q = new URLSearchParams({ return_to: returnTo, state, challenge });
  return `${sitaUrl.replace(/\/+$/, "")}/sign-in?${q.toString()}`;
}

export function sessionEndedUrl(sitaUrl: string, sessionId: string, application: string): string {
  return `${sitaUrl.replace(/\/+$/, "")}/session/ended?${new URLSearchParams({ session: sessionId, application })}`;
}

export const isHandoff = (v: unknown): v is string => typeof v === "string" && v.length === 43 && B64URL.test(v);
export const isState = (v: unknown): v is string => typeof v === "string" && /^[A-Za-z0-9_-]{8,256}$/.test(v);

// ---- Keys ----

export type Keyring = Map<string, KeyObject>;

export function keyringFrom(published: unknown): Keyring {
  const ring: Keyring = new Map();
  const keys = (published as { keys?: unknown })?.keys;
  if (!Array.isArray(keys)) return ring;
  for (const item of keys) {
    if (typeof item?.kid !== "string" || typeof item?.publicKey !== "string") continue;
    try {
      const key = createPublicKey({ key: Buffer.from(item.publicKey, "base64"), format: "der", type: "spki" });
      if (key.asymmetricKeyType === "ed25519") ring.set(item.kid, key);
    } catch {
      /* a key that does not load is dropped, never trusted */
    }
  }
  return ring;
}

// ---- Credential ----

export interface Claims {
  sid: string;
  cv: number;
  st: string;
  abs: Date;
}

export function openCredential(ring: Keyring, value: unknown): Claims | null {
  if (typeof value !== "string" || value.length > 8192) return null;
  const parts = value.split(".");
  if (parts.length !== 3 || parts[0] !== VERSION || !parts[1] || !parts[2]) return null;
  if (!B64URL.test(parts[1]) || !B64URL.test(parts[2])) return null;
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object" || typeof raw.kid !== "string" || typeof raw.sid !== "string") return null;
  const key = ring.get(raw.kid);
  if (!key) return null;
  let ok = false;
  try {
    ok = verify(null, Buffer.from(`${parts[0]}.${parts[1]}`, "ascii"), key, Buffer.from(parts[2], "base64url"));
  } catch {
    ok = false;
  }
  if (!ok) return null;
  const { cv, st, abs } = raw;
  if (typeof cv !== "number" || !Number.isInteger(cv) || typeof st !== "string" || typeof abs !== "string") return null;
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(abs)) return null; // must carry a time zone
  const expires = new Date(abs);
  if (Number.isNaN(expires.getTime())) return null;
  return { sid: raw.sid, cv, st, abs: expires };
}

// ---- Revocation window ----

export interface RevocationWindow {
  revoked: Set<string>;
  readAt: Date;
  freshnessSeconds: number;
}

export const digestOf = (ids: string[]) => createHash("sha256").update([...ids].sort().join("\n"), "utf8").digest("hex");

/** A complete, self-consistent window, or null (an unusable answer changes nothing). */
export function windowFrom(body: unknown): RevocationWindow | null {
  const b = body as Record<string, unknown> | null;
  if (!b || !Array.isArray(b.entries)) return null;
  const readAt = new Date(String(b.readAt));
  if (Number.isNaN(readAt.getTime()) || !/(Z|[+-]\d{2}:\d{2})$/.test(String(b.readAt))) return null;
  const ids: string[] = [];
  for (const e of b.entries) {
    if (!e || typeof e.sessionId !== "string") return null;
    ids.push(e.sessionId);
  }
  if (b.complete !== true || b.entryCount !== ids.length || b.digest !== digestOf(ids)) return null;
  if (typeof b.windowSeconds !== "number" || !Number.isInteger(b.windowSeconds) || b.windowSeconds <= 0) return null;
  return { revoked: new Set(ids), readAt, freshnessSeconds: b.windowSeconds };
}

// ---- The decision for one request ----

export interface BoundSession {
  sid: string;
  cv: number;
  st: string;
  abs: string;
  email: string;
  identityId: string;
}

export type Verdict = "authenticated" | "not_authenticated" | "unavailable" | "revoked" | "expired" | "reuse";

export function evaluate(input: { ring: Keyring; window: RevocationWindow | null; now: Date; credential: string | undefined; session: BoundSession | null }): Verdict {
  const claims = openCredential(input.ring, input.credential);
  if (!claims) return "not_authenticated";
  if (!input.window) return "unavailable";
  if (input.window.revoked.has(claims.sid)) return "revoked";
  if ((input.now.getTime() - input.window.readAt.getTime()) / 1000 > input.window.freshnessSeconds) return "unavailable";
  const s = input.session;
  if (!s || s.sid !== claims.sid) return "not_authenticated";
  if (claims.cv < s.cv || claims.st !== s.st) return "reuse";
  if (claims.abs.getTime() <= input.now.getTime() || new Date(s.abs).getTime() <= input.now.getTime()) return "expired";
  if (claims.st === "REAUTH_REQUIRED") return "not_authenticated";
  return "authenticated";
}

// ---- Network ----

export interface RedeemResult {
  sessionId: string;
  credential: string;
  email: string;
}

type Fetch = typeof fetch;
const json = { "content-type": "application/json" };

export async function redeem(sitaUrl: string, handoff: string, verifier: string, doFetch: Fetch = fetch): Promise<RedeemResult | null> {
  if (!isHandoff(handoff)) return null;
  const res = await doFetch(`${sitaUrl.replace(/\/+$/, "")}/v1/handoffs/${handoff}/redeem`, {
    method: "POST", headers: json, body: JSON.stringify({ verifier }), cache: "no-store", signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const body = (await res.json().catch(() => null)) as { sessionId?: unknown; credential?: unknown; identity?: { email?: unknown } } | null;
  if (typeof body?.sessionId !== "string" || typeof body.credential !== "string" || typeof body.identity?.email !== "string") return null;
  return { sessionId: body.sessionId, credential: body.credential, email: body.identity.email.trim().toLowerCase() };
}

export async function fetchKeys(sitaUrl: string, doFetch: Fetch = fetch): Promise<Keyring> {
  try {
    const res = await doFetch(`${sitaUrl.replace(/\/+$/, "")}/v1/keys`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    return res.ok ? keyringFrom(await res.json()) : new Map();
  } catch {
    return new Map();
  }
}

export async function fetchWindow(sitaUrl: string, consumer: string, doFetch: Fetch = fetch): Promise<RevocationWindow | null> {
  try {
    const res = await doFetch(`${sitaUrl.replace(/\/+$/, "")}/v1/revocations?${new URLSearchParams({ consumer })}`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    return res.ok ? windowFrom(await res.json()) : null;
  } catch {
    return null;
  }
}

export async function signOut(sitaUrl: string, sessionId: string, doFetch: Fetch = fetch): Promise<void> {
  await doFetch(`${sitaUrl.replace(/\/+$/, "")}/v1/sessions/${encodeURIComponent(sessionId)}/sign-out`, { method: "POST", headers: json, body: "{}", cache: "no-store", signal: AbortSignal.timeout(5000) }).catch(() => undefined);
}
