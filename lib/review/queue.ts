// The review page's sections, built from published Sanity documents plus our decisions.
// Pure, so every case is tested. Work order Part 2 "Review page" and "Deletion".
import { effectiveState, type ApprovalRecord } from "../approval/machine";
import type { GatedType } from "../content/types";

export interface QueueDoc {
  _id: string;
  _type: GatedType;
  _rev: string;
  _updatedAt?: string;
  title: string;
  slug?: string | null;
  deletionRequested?: boolean;
}

export interface QueueItem {
  id: string;
  type: GatedType;
  title: string;
  slug: string | null;
  revision: string;
  deletionRequested: boolean;
  decision: ApprovalRecord | null;
  /** Rejected, but the published document is still there: the Sanity step failed. Retry offered. */
  sendBackPending?: boolean;
  /** Deletion approved, but the document is still in Sanity: the delete failed. Retry offered. */
  deletePending?: boolean;
  updatedAt?: string;
}

export interface Queue {
  waiting: QueueItem[];
  approved: QueueItem[];
  rejected: QueueItem[];
}

export function buildQueue(docs: readonly QueueDoc[], decisions: readonly ApprovalRecord[]): Queue {
  const byId = new Map(decisions.map((d) => [d.objectId, d]));
  const published = new Map(docs.map((d) => [d._id, d]));
  const q: Queue = { waiting: [], approved: [], rejected: [] };

  for (const d of docs) {
    const decision = byId.get(d._id) ?? null;
    const item: QueueItem = {
      id: d._id, type: d._type, title: d.title || "(untitled)", slug: d.slug ?? null, revision: d._rev,
      deletionRequested: !!d.deletionRequested, decision, updatedAt: d._updatedAt,
    };
    const state = effectiveState(decision, d._rev);
    if (state === "waiting") q.waiting.push(item);
    else if (state === "approved") q.approved.push({ ...item, deletePending: item.deletionRequested });
    else q.rejected.push({ ...item, sendBackPending: true });
  }

  // Rejected and sent back: no longer published, so only our record knows it.
  for (const d of decisions) {
    if (d.state !== "rejected" || published.has(d.objectId)) continue;
    q.rejected.push({ id: d.objectId, type: d.objectType as GatedType, title: d.title || "(untitled)", slug: null, revision: d.revision, deletionRequested: false, decision: d });
  }
  // Approved items that are no longer published (deleted) leave the queue.

  const newest = (a: QueueItem, b: QueueItem) => (b.decision?.decidedAt?.getTime?.() ?? Date.parse(b.updatedAt ?? "0")) - (a.decision?.decidedAt?.getTime?.() ?? Date.parse(a.updatedAt ?? "0"));
  q.waiting.sort((a, b) => Date.parse(b.updatedAt ?? "0") - Date.parse(a.updatedAt ?? "0"));
  q.approved.sort(newest);
  q.rejected.sort(newest);
  return q;
}
