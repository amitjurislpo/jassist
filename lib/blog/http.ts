import "server-only";
// HTML responses for the public pages the server renders with the site's own templates (site/render.js).
import * as site from "@/site/render";

// Public pages are rendered on each request from data cached about 60 seconds (lib/content/repository.ts), so a
// decision shows on the very next request. The CDN must not hold them longer.
const HEADERS = { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=0, must-revalidate" };

export const html = (body: string, status = 200) => new Response(body, { status, headers: HEADERS });

export const notFound = () =>
  new Response(site.renderHtml(site.notFoundPage()), { status: 404, headers: { ...HEADERS, "X-Robots-Tag": "noindex" } });
