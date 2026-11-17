// Writes to Sanity, used only after a decision has been recorded in our database.
// Work order Part 2 "Decisions" and "Deletion".
//
// Reject = ONE transaction: delete the published document and put its content back as a
// draft carrying the checker's feedback. If the author already has a newer draft open, that
// draft keeps the author's work and only gains the feedback.
// Approve writes nothing to Sanity (any write changes _rev and would void the approval).

import type { SanityClient } from "@sanity/client";
import type { ReviewFeedback } from "../content/types";

export const draftId = (id: string) => `drafts.${id}`;

const SYSTEM_FIELDS = ["_id", "_rev", "_createdAt", "_updatedAt"] as const;

export class RevisionMoved extends Error {
  constructor() {
    super("The published document changed after the decision, so it was not sent back. The new version is waiting for review.");
  }
}

/**
 * The published revision must still be the one the checker rejected (feedback.revision); the
 * transaction itself re-checks it (ifRevisionId), so a newer version is never removed.
 */
export async function sendBackToAuthor(client: SanityClient, publishedId: string, feedback: ReviewFeedback): Promise<void> {
  const [published, draft] = await Promise.all([
    client.getDocument<Record<string, unknown> & { _type: string }>(publishedId),
    client.getDocument<Record<string, unknown> & { _type: string }>(draftId(publishedId)),
  ]);
  if (!published) return; // already sent back
  if (published._rev !== feedback.revision) throw new RevisionMoved();
  const tx = client.transaction();
  // Guard: fails the whole transaction if the published revision moved meanwhile.
  tx.patch(publishedId, (p) => p.ifRevisionId(feedback.revision).unset(["__jassistGuard"]));
  if (draft) {
    tx.patch(draftId(publishedId), (p) => p.set({ reviewFeedback: feedback }));
  } else {
    const content: Record<string, unknown> = { ...published };
    for (const f of SYSTEM_FIELDS) delete content[f];
    tx.create({ ...content, _id: draftId(publishedId), _type: published._type, reviewFeedback: feedback });
  }
  tx.delete(publishedId);
  await tx.commit({ visibility: "sync" });
}

/** Approved deletion: remove the published document and any draft. */
export async function deleteFromSanity(client: SanityClient, publishedId: string): Promise<void> {
  await client.transaction().delete(publishedId).delete(draftId(publishedId)).commit({ visibility: "sync" });
}
