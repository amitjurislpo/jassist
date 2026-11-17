// Fail-closed assembly of public posts. Pure: data sources are injected, so tests cover every failure path.
// "If the approval lookup fails, show no Sanity posts." "If there are no Sanity posts, do not query the database."
import { publicPosts, type ApprovedRevisions } from "./visibility";
import type { Post } from "./types";

export type Loader<T> = () => Promise<T>;

async function approvalsFor(count: number, approvals: Loader<ApprovedRevisions>): Promise<ApprovedRevisions | null> {
  if (count === 0) return new Map(); // nothing to check: never touch the database
  try {
    return await approvals();
  } catch {
    return null; // lookup failed: fail closed
  }
}

export async function assemblePosts<T extends Post>(load: Loader<T[]>, approvals: Loader<ApprovedRevisions>): Promise<(T & { slug: string })[]> {
  let posts: T[];
  try {
    posts = await load();
  } catch {
    return []; // Sanity unset or down: the static posts still show
  }
  const approved = await approvalsFor(posts.length, approvals);
  if (!approved) return [];
  return publicPosts(posts, approved) as (T & { slug: string })[];
}
