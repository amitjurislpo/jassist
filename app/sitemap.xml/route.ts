// sitemap.xml, generated from the data: indexable pages plus every public post.
import * as site from "@/site/render";
import { getPublicPosts } from "@/lib/content/repository";

export const dynamic = "force-dynamic";

// The day this deployment was built: the "last changed" date of the pages that only change with a deployment.
const BUILT = process.env.BUILD_DATE || new Date().toISOString().slice(0, 10);

export async function GET() {
  return new Response(site.sitemapXml(await getPublicPosts(), BUILT), {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=0, must-revalidate" },
  });
}
