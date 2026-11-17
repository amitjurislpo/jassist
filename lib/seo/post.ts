import type { Post } from "../content/types";
import type { SeoSource } from "./meta";

export function postSeoInput(post: Post & { slug: string }): SeoSource {
  return {
    title: post.title, slug: post.slug, description: post.description, mainImageUrl: post.mainImage?.url ?? null,
    metaTitle: post.metaTitle, metaOgImageUrl: post.metaOgImage?.url ?? null, ogTitle: post.ogTitle, ogDescription: post.ogDescription,
    canonicalOverride: post.canonicalOverride, focusKeyword: post.focusKeyword,
  };
}
