// SITA sends the person back here with a one-time handoff. We redeem it with our PKCE
// verifier, ask IamJCG whether this person may use the application, and bind the session.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "@/lib/config/env";
import { linked } from "@/lib/config/linked";
import { isHandoff, isState, openCredential, redeem, type BoundSession } from "@/lib/auth/sita";
import { resolvePerson } from "@/lib/auth/iamjcg";
import { COOKIES, cookieBase, keyring, openJson, safeNext, sealJson } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const fail = (req: Request, why: string) => NextResponse.redirect(new URL(`/admin/denied?why=${why}`, req.url), 303);

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const state = q.get("state");
  const handoff = q.get("handoff");
  if (!isState(state) || !isHandoff(handoff)) return fail(req, "signin");

  // Production passes a preview's sign-in on to the ONE configured preview address. Safe: the
  // handoff is single-use and only the preview holds the matching PKCE verifier.
  const relay = env.auth.previewRelayUrl();
  if (relay && env.isProduction() && state.startsWith(env.auth.previewStatePrefix())) {
    const to = new URL(relay);
    to.search = new URLSearchParams({ state, handoff }).toString();
    return NextResponse.redirect(to, 303);
  }

  const jar = await cookies();
  const pending = await openJson<{ state: string; verifier: string; next: string }>(jar.get(COOKIES.signin)?.value);
  jar.delete(COOKIES.signin);
  if (!pending || pending.state !== state) return fail(req, "signin");

  const sita = env.auth.sitaUrl()!;
  const redeemed = await redeem(sita, handoff, pending.verifier).catch(() => null);
  if (!redeemed) return fail(req, "signin");

  const iam = { url: env.auth.iamjcgUrl() ?? "", credential: (await linked.iamjcgCredential()) ?? "", application: env.auth.application() };
  const person = await resolvePerson(iam, redeemed.email).catch(() => ({ ok: false as const, why: "unavailable" as const }));
  if (!person.ok) return fail(req, person.why);

  const claims = openCredential(await keyring(), redeemed.credential);
  if (!claims || claims.sid !== redeemed.sessionId) return fail(req, "signin");

  const bound: BoundSession = { sid: claims.sid, cv: claims.cv, st: claims.st, abs: claims.abs.toISOString(), email: redeemed.email, identityId: person.identityId };
  const res = NextResponse.redirect(new URL(safeNext(pending.next), req.url), 303);
  const opts = { ...cookieBase, expires: claims.abs };
  res.cookies.set(COOKIES.sita, redeemed.credential, opts);
  res.cookies.set(COOKIES.session, await sealJson({ ...bound }, claims.abs), opts);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
