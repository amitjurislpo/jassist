// The blog list: built-in posts plus Sanity posts approved at their current revision.
import * as site from "@/site/render";
import { getPublicPosts } from "@/lib/content/repository";
import { html } from "@/lib/blog/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return html(site.renderHtml(site.blogIndex(await getPublicPosts())));
}
