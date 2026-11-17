// Structured data for blog posts: Article and BreadcrumbList on every post,
// FAQPage only when the post has FAQ entries. Work order Part 2 "Public site".

import { absoluteUrl, postPath } from "./meta";

export interface JsonLdPost {
  title: string;
  slug: string;
  description: string;
  image: string | null;
  authorName: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
  faq: { question: string; answer: string }[];
}

export interface Org {
  name: string;
  logoPath: string;
}

export function articleSchema(post: JsonLdPost, siteUrl: string, org: Org) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(siteUrl, postPath(post.slug)) },
    headline: post.title,
    description: post.description,
    ...(post.image ? { image: [absoluteUrl(siteUrl, post.image)] } : {}),
    author: post.authorName ? { "@type": "Person", name: post.authorName } : { "@type": "Organization", name: org.name },
    publisher: { "@type": "Organization", name: org.name, logo: { "@type": "ImageObject", url: absoluteUrl(siteUrl, org.logoPath) } },
    ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
    ...(post.updatedAt || post.publishedAt ? { dateModified: post.updatedAt ?? post.publishedAt } : {}),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[], siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absoluteUrl(siteUrl, it.path) })),
  };
}

export function faqSchema(faq: JsonLdPost["faq"]) {
  if (!faq.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };
}

/** JSON for a <script type="application/ld+json">, safe against "</script>" in post text. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(new RegExp(String.fromCharCode(0x2028), "g"), "\\u2028")
    .replace(new RegExp(String.fromCharCode(0x2029), "g"), "\\u2029");
}
