// Starts an admin sign-in through SITA (PKCE). Work order "Admin login: IAMJCG".
import { NextResponse } from "next/server";
import { env } from "@/lib/config/env";
import { challengeFor, newState, newVerifier, signInUrl } from "@/lib/auth/sita";
import { COOKIES, cookieBase, safeNext, sealJson } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const sita = env.auth.sitaUrl();
  const returnTo = env.auth.sitaReturnUrl();
  if (!sita || !returnTo || !env.auth.sessionSecret()) {
    return new NextResponse("Admin sign-in is not set up for this deployment yet.", { status: 503 });
  }
  const next = safeNext(new URL(req.url).searchParams.get("next"));
  const verifier = newVerifier();
  const state = newState(env.auth.relayThroughProduction() ? env.auth.previewStatePrefix() : "");
  const res = NextResponse.redirect(signInUrl(sita, returnTo, state, challengeFor(verifier)), 302);
  res.cookies.set(COOKIES.signin, await sealJson({ state, verifier, next }, new Date(Date.now() + 10 * 60_000)), { ...cookieBase, maxAge: 600 });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
