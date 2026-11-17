// The public visibility filter: a post is public only if its latest approval is "approved" at its current _rev,
// it is a published document (never a draft or version), it is not a deletion request, and its slug is valid.
import { isApprovedAtRevision } from "../approval/machine";
import { isValidSlug } from "../blog/slug";
import type { GatedDoc, Post } from "./types";

/** objectId -> approved revision. */
export type ApprovedRevisions = ReadonlyMap<string, string>;

export function isPublic(doc: GatedDoc, approved: ApprovedRevisions): boolean {
  if (doc.deletionRequested) return false;
  if (doc._id.startsWith("drafts.") || doc._id.includes(".")) return false;
  const rev = approved.get(doc._id);
  return isApprovedAtRevision(rev === undefined ? null : { state: "approved", revision: rev }, doc._rev);
}

export function publicDocs<T extends GatedDoc>(docs: readonly T[], approved: ApprovedRevisions): T[] {
  return docs.filter((d) => isPublic(d, approved));
}

export function publicPosts(posts: readonly Post[], approved: ApprovedRevisions): (Post & { slug: string })[] {
  return publicDocs(posts, approved).filter((p): p is Post & { slug: string } => isValidSlug(p.slug));
}
