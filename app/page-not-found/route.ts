// The site's own 404 page with a real 404 status. next.config.ts sends every unknown address here.
import { notFound } from "@/lib/blog/http";

export const dynamic = "force-static";

export function GET() {
  return notFound();
}
