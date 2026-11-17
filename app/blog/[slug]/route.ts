// One post. Anything not public (unapproved, rejected, deletion requested, deleted, bad slug) is a 404.
import * as site from "@/site/render";
import { getPublicPost } from "@/lib/content/repository";
import { html, notFound } from "@/lib/blog/http";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const post = await getPublicPost(slug);
  return post ? html(site.renderHtml(site.blogPost(post))) : notFound();
}
