// SEO fallbacks for a blog post. Work order Part 2 "Studio fields / SEO".
// A field cleared to an empty (or blank) string counts as empty.

export interface SeoSource {
  title: string;
  slug: string;
  description: string;
  mainImageUrl?: string | null;
  metaTitle?: string | null;
  metaOgImageUrl?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  canonicalOverride?: string | null;
  focusKeyword?: string | null;
}

export interface ResolvedSeo {
  title: string;
  description: string;
  shareTitle: string;
  shareDescription: string;
  shareImage: string | null;
  canonical: string;
  canonicalIsExternal: boolean;
  /** Editors only. Never rendered on public pages. */
  focusKeyword: string | null;
}

export const blank = (v: string | null | undefined): string | null => {
  const t = typeof v === "string" ? v.trim() : "";
  return t ? t : null;
};

export function absoluteUrl(siteUrl: string, pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return new URL(pathOrUrl, siteUrl.endsWith("/") ? siteUrl : siteUrl + "/").toString();
}

export function postPath(slug: string): string {
  return `/blog/${slug}`;
}

export function resolvePostSeo(post: SeoSource, siteUrl: string): ResolvedSeo {
  const metaTitle = blank(post.metaTitle) ?? post.title;
  const image = blank(post.metaOgImageUrl) ?? blank(post.mainImageUrl);
  const canonical = blank(post.canonicalOverride) ?? absoluteUrl(siteUrl, postPath(post.slug));
  const canonicalAbs = absoluteUrl(siteUrl, canonical);
  return {
    title: metaTitle,
    description: post.description,
    shareTitle: blank(post.ogTitle) ?? metaTitle,
    shareDescription: blank(post.ogDescription) ?? post.description,
    shareImage: image ? absoluteUrl(siteUrl, image) : null,
    canonical: canonicalAbs,
    canonicalIsExternal: new URL(canonicalAbs).origin !== new URL(siteUrl).origin,
    focusKeyword: blank(post.focusKeyword),
  };
}
