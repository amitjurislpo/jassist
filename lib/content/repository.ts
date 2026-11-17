import "server-only";
// Public reads, cached for about 60 seconds. Sanity documents and approvals are cached under separate tags; every
// decision purges both together (app/admin/review/actions.ts), plus the list and post paths.
import { unstable_cache } from "next/cache";
import * as site from "@/site/render";
import { data, hasData } from "../data";
import { CACHE_SECONDS, TAGS, publicClient, sanityConfigured } from "../sanity/client";
import { Q } from "../sanity/queries";
import { fromSanity, mergePosts } from "../blog/fromSanity";
import { isValidSlug } from "../blog/slug";
import { assemblePosts } from "./public";
import type { Post } from "./types";

const cachedApprovals = unstable_cache(() => data().approvedRevisions(), ["approved-revisions"], { revalidate: CACHE_SECONDS, tags: [TAGS.approvals] });

async function approvals(): Promise<Map<string, string>> {
  if (!hasData()) throw new Error("No database configured.");
  return new Map(await cachedApprovals());
}

function sanityFetch<T>(query: string, params: Record<string, string> = {}): Promise<T> {
  if (!sanityConfigured()) return Promise.reject(new Error("Sanity is not configured."));
  return publicClient().fetch<T>(query, params, { next: { revalidate: CACHE_SECONDS, tags: [TAGS.content] } });
}

/** Approved Sanity posts in the template shape. Never throws: on any failure there are none. */
async function sanityPosts() {
  const posts = await assemblePosts(() => sanityFetch<Post[]>(Q.posts), approvals);
  return posts.map((p) => fromSanity(p, site.SITE_URL));
}

/** Every public post: built-in posts plus approved Sanity posts, newest first. */
export async function getPublicPosts() {
  return mergePosts(site.STATIC_POSTS, await sanityPosts());
}

/** One public post, or null (unapproved, rejected, deletion requested, deleted or unknown). */
export async function getPublicPost(slug: string) {
  if (!isValidSlug(slug)) return null;
  const posts = await assemblePosts(() => sanityFetch<Post[]>(Q.postBySlug, { slug }), approvals);
  if (posts[0]) return fromSanity(posts[0], site.SITE_URL);
  return site.STATIC_POSTS.find((p) => p.slug === slug) ?? null;
}
