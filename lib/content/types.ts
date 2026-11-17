// Content written in Sanity Studio that goes live only through our approval: blog posts.
// Approval state lives only in our database, tied to the Sanity revision (_rev).

export const GATED_TYPES = ["post"] as const;
export type GatedType = (typeof GATED_TYPES)[number];

export const TYPE_LABELS: Record<GatedType, string> = { post: "Blog post" };

/** Fields every gated document carries for the approval workflow. */
export interface GatedDoc {
  _id: string;
  _type: GatedType;
  _rev: string;
  _createdAt?: string;
  _updatedAt?: string;
  deletionRequested?: boolean | null;
}

export interface ImageRef {
  url: string | null;
  alt: string | null;
  width?: number | null;
  height?: number | null;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Post extends GatedDoc {
  _type: "post";
  title: string;
  slug: string | null;
  subtitle?: string | null;
  description: string;
  mainImage: ImageRef | null;
  authorName?: string | null;
  category?: string | null;
  tags?: string[] | null;
  readTime?: number | null;
  publishedAt?: string | null;
  body?: unknown[] | null;
  faq?: FaqItem[] | null;
  metaTitle?: string | null;
  metaOgImage?: ImageRef | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  canonicalOverride?: string | null;
  focusKeyword?: string | null;
  reviewFeedback?: ReviewFeedback | null;
}

export interface ReviewFeedback {
  note: string;
  by: string;
  at: string;
  revision: string;
}
