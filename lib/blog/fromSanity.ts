// A Sanity post in the shape the site's templates render (site/render.js), with the SEO fallbacks applied.
import type { NormalisedPost } from "@/site/render";
import type { Post } from "../content/types";
import { resolvePostSeo, blank } from "../seo/meta";
import { postSeoInput } from "../seo/post";
import { sanityImage } from "../sanity/image";
import { bodyToHtml } from "./portableText";

const day = (iso: string | null | undefined): string | null => (typeof iso === "string" && /^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 10) : null);
const escHtml = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function fromSanity(post: Post & { slug: string }, siteUrl: string): NormalisedPost {
  const seo = resolvePostSeo(postSeoInput(post), siteUrl);
  const main = post.mainImage?.url ? post.mainImage : null;
  const date = day(post.publishedAt) ?? day(post._createdAt) ?? day(post._updatedAt) ?? new Date().toISOString().slice(0, 10);
  const shareImage = blank(post.metaOgImage?.url) ? sanityImage(post.metaOgImage!.url!, 600, 315) : main ? sanityImage(main.url!, 600, 315) : null;
  return {
    source: "sanity",
    slug: post.slug,
    url: `/blog/${post.slug}`,
    tag: blank(post.category) ?? "Blog",
    date,
    updated: day(post._updatedAt) ?? date,
    h1: post.title,
    lead: blank(post.subtitle) ?? post.description,
    excerpt: post.description,
    author: blank(post.authorName),
    readMinutes: typeof post.readTime === "number" && post.readTime > 0 ? post.readTime : null,
    image: main ? { src: sanityImage(main.url!, 800), alt: main.alt ?? "", width: main.width ?? null, height: main.height ?? null } : null,
    html: bodyToHtml(post.body),
    faqs: (post.faq ?? []).filter((f) => blank(f?.question) && blank(f?.answer)).map((f) => [f.question.trim(), escHtml(f.answer.trim()), f.answer.trim()]),
    keywords: (post.tags ?? []).map((t) => (typeof t === "string" ? t.trim() : "")).filter(Boolean),
    seo: { title: seo.title, description: seo.description, shareTitle: seo.shareTitle, shareDescription: seo.shareDescription, shareImage, canonical: seo.canonical },
  };
}

/**
 * The public blog: the built-in posts (src/blogs.js) plus every public Sanity post, newest first.
 * If a Sanity post has the same slug as a built-in post, the Sanity post wins (a checker approved it, and it lets
 * the team move a built-in post into the Studio); the review page warns the checker before approving.
 */
export function mergePosts(staticPosts: readonly NormalisedPost[], sanityPosts: readonly NormalisedPost[]): NormalisedPost[] {
  const taken = new Set(sanityPosts.map((p) => p.slug));
  const all = [...sanityPosts, ...staticPosts.filter((p) => !taken.has(p.slug))];
  return all.map((p, i) => ({ p, i })).sort((a, b) => b.p.date.localeCompare(a.p.date) || a.i - b.i).map(({ p }) => p);
}
