import "server-only";
// The admin session. Two httpOnly cookies:
//  juris_assist_sita      - SITA's credential, checked on every request (signature, revocation, expiry)
//  juris_assist_session   - our signed record binding that SITA session to the person (email, IamJCG id)
// Permissions are asked of IamJCG (cached 15 s, fail closed). Every admin page, server action and
// route calls getAdmin()/requireAdmin(); hiding a button is never the only guard.
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify, SignJWT } from "jose";
import { env } from "../config/env";
import { linked } from "../config/linked";
import { PERMISSIONS, type Admin, type Capability } from "./permissions";
import { evaluate, fetchKeys, fetchWindow, type BoundSession, type Keyring, type RevocationWindow } from "./sita";
import { check } from "./iamjcg";

export const COOKIES = { sita: "juris_assist_sita", session: "juris_assist_session", signin: "juris_assist_signin" } as const;
const KEYS_TTL_MS = 10 * 60_000;
const WINDOW_REFRESH_MS = 25_000;
const PERMISSION_TTL_MS = 15_000;

const state = globalThis as unknown as {
  jassistAuth?: { ring: Keyring; ringAt: number; window: RevocationWindow | null; windowAt: number; perms: Map<string, { v: boolean; at: number }> };
};
const mem = () => (state.jassistAuth ??= { ring: new Map(), ringAt: 0, window: null, windowAt: 0, perms: new Map() });

function secret(): Uint8Array {
  const s = env.auth.sessionSecret();
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set (32+ characters).");
  return new TextEncoder().encode(s);
}

export const cookieBase = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" };

export async function sealJson(payload: Record<string, unknown>, expires: Date): Promise<string> {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(expires).sign(secret());
}

export async function openJson<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return payload as T;
  } catch {
    return null;
  }
}

export async function keyring(): Promise<Keyring> {
  const m = mem();
  const sita = env.auth.sitaUrl();
  if (sita && (m.ring.size === 0 || Date.now() - m.ringAt > KEYS_TTL_MS)) {
    const fresh = await fetchKeys(sita);
    if (fresh.size) {
      m.ring = fresh; // never replace held keys with nothing
      m.ringAt = Date.now();
    }
  }
  return m.ring;
}

async function revocations(): Promise<RevocationWindow | null> {
  const m = mem();
  const sita = env.auth.sitaUrl();
  if (sita && Date.now() - m.windowAt > WINDOW_REFRESH_MS) {
    const w = await fetchWindow(sita, env.auth.application());
    if (w) {
      m.window = w;
      m.windowAt = Date.now();
    }
  }
  return m.window;
}

async function allowed(identityId: string, permission: string): Promise<boolean> {
  const url = env.auth.iamjcgUrl();
  const credential = await linked.iamjcgCredential();
  if (!url || !credential) return false;
  const k = `${identityId} ${permission}`;
  const hit = mem().perms.get(k);
  if (hit && Date.now() - hit.at < PERMISSION_TTL_MS) return hit.v;
  const v = await check({ url, credential, application: env.auth.application() }, identityId, permission);
  mem().perms.set(k, { v, at: Date.now() });
  return v;
}

/** The signed-in admin for this request, or null. Cached per request. */
export const getAdmin = cache(async (): Promise<Admin | null> => {
  try {
    const jar = await cookies();
    const bound = await openJson<BoundSession>(jar.get(COOKIES.session)?.value);
    if (!bound) return null;
    const verdict = evaluate({ ring: await keyring(), window: await revocations(), now: new Date(), credential: jar.get(COOKIES.sita)?.value, session: bound });
    if (verdict !== "authenticated") return null;
    const entries = await Promise.all(
      (Object.keys(PERMISSIONS) as Capability[]).map(async (c) => [c, await allowed(bound.identityId, PERMISSIONS[c])] as const),
    );
    return { email: bound.email, identityId: bound.identityId, sessionId: bound.sid, can: Object.fromEntries(entries) as Admin["can"] };
  } catch {
    return null; // fail closed
  }
});

/** For pages: sends people who are not signed in to sign-in, and refuses those without the right. */
export async function requireAdmin(capability: Capability, next: string): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect(`/auth/sita/start?next=${encodeURIComponent(next)}`);
  if (!admin.can[capability]) redirect(`/admin/denied?need=${capability}`);
  return admin;
}

export function safeNext(next: unknown): string {
  return typeof next === "string" && /^\/(admin|studio)(\/[A-Za-z0-9._~%/?=&-]*)?$/.test(next) && !next.startsWith("//") ? next : "/admin";
}
