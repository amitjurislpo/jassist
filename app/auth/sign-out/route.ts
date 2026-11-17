import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "@/lib/config/env";
import { sessionEndedUrl, signOut } from "@/lib/auth/sita";
import { COOKIES, getAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const admin = await getAdmin();
  const jar = await cookies();
  jar.delete(COOKIES.sita);
  jar.delete(COOKIES.session);
  const sita = env.auth.sitaUrl();
  if (admin && sita) {
    await signOut(sita, admin.sessionId);
    return NextResponse.redirect(sessionEndedUrl(sita, admin.sessionId, env.auth.application()), 303);
  }
  return NextResponse.redirect(new URL("/", req.url), 303);
}
