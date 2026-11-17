// Types for site/render.js (the page templates shared by build.js and the Next.js routes).
export interface PostImage { src: string; alt: string | null; width?: number | null; height?: number | null }
export interface PostSeo { title: string; description: string; shareTitle: string; shareDescription: string; shareImage: string | null; canonical: string }
/** A post from src/blogs.js or Sanity, in the one shape the templates render. */
export interface NormalisedPost {
  source: "static" | "sanity";
  slug: string;
  url: string;
  tag: string;
  date: string;
  updated: string | null;
  h1: string;
  lead: string;
  excerpt: string;
  author: string | null;
  readMinutes: number | null;
  image: PostImage | null;
  html: string;
  /** [question, answer HTML, answer as plain text (optional)] */
  faqs: [string, string, string?][];
  keywords: string[];
  seo: PostSeo;
}
export interface Page { slug: string; url: string; title: string; desc: string; body: string; [k: string]: unknown }
export const SITE_URL: string;
export const STATIC_POSTS: NormalisedPost[];
export const FAQ_COUNT: number;
export function esc(t: string): string;
export function absolute(u: string): string;
export function blogIndex(posts: NormalisedPost[]): Page;
export function blogPost(post: NormalisedPost): Page;
export function notFoundPage(): Page;
export function notFoundFragment(): string;
export function renderHtml(page: Page): string;
export function staticPages(): Page[];
export function sitemapXml(posts: NormalisedPost[], lastmod: string): string;
export function robotsTxt(): string;
export function postReadTime(post: NormalisedPost): string;
