// Sanity webhook: any create, update or delete of gated content purges the public caches at
// once, so an edited live post or a deletion request leaves the site straight away instead of
// after the ~60 s cache window. The cache window remains the safety net if a webhook is lost.
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { parseBody } from "next-sanity/webhook";
import { env } from "@/lib/config/env";
import { TAGS } from "@/lib/sanity/client";
import { publicPaths } from "@/lib/review/workflow";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = env.sanity.webhookSecret();
  if (!secret) return NextResponse.json({ error: "Not configured." }, { status: 503 });
  const { isValidSignature, body } = await parseBody<{ _type?: string; slug?: string | null }>(req, secret, true);
  if (!isValidSignature) return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  revalidateTag(TAGS.content, { expire: 0 });
  for (const p of publicPaths(body?._type ?? "post", body?.slug ?? null)) revalidatePath(p);
  revalidatePath("/admin/review");
  return NextResponse.json({ ok: true });
}
