import "server-only";
// Review reads: uncached and without Sanity's CDN. Work order Part 2 "Review reads are uncached".
import { data } from "../data";
import { reviewClient, sanityConfigured } from "../sanity/client";
import { Q } from "../sanity/queries";
import { GATED_TYPES } from "../content/types";
import { buildQueue, type QueueDoc } from "./queue";

export async function loadQueue() {
  if (!sanityConfigured()) throw new Error("Sanity is not configured for this deployment.");
  const [docs, decisions] = await Promise.all([
    reviewClient().fetch<QueueDoc[]>(Q.reviewQueue, { types: [...GATED_TYPES] }, { cache: "no-store" }),
    data().decisionsAll(),
  ]);
  return buildQueue(docs, decisions);
}

export async function loadReviewDoc(id: string) {
  if (!sanityConfigured()) return null;
  return reviewClient().fetch<Record<string, unknown> & QueueDoc>(Q.reviewDoc, { id }, { cache: "no-store" });
}

export async function currentRevision(id: string): Promise<string | null> {
  const rev = await reviewClient().fetch<string | null>(Q.revision, { id }, { cache: "no-store" });
  return rev ?? null;
}

export function latestDecision(type: string, id: string) {
  return data().decisionLatest(type, id);
}

/** Fails closed: if the answer cannot be had, the person is not a checker. */
export async function isChecker(email: string): Promise<boolean> {
  try {
    return (await data().isChecker(email)) === true;
  } catch {
    return false;
  }
}

/** The decision store for the review workflow, over the site's data route. */
export function decisionStore() {
  const d = data();
  return { getLatest: d.decisionLatest, writeDecision: d.decisionWrite };
}
