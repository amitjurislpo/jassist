// What happens after a checker presses Approve or Reject, and the two retries.
// Work order Part 2 "Decisions" and "Deletion":
// - Approve: recorded, nothing written to Sanity; live on the next request (caches purged).
//   A deletion request that is approved is deleted from Sanity; if that fails it stays off the
//   site (deletionRequested is never public) and "Delete now" is offered.
// - Reject: recorded FIRST, then sent back to the author in one Sanity transaction. If that
//   fails the post is still off the site (the rejection means it is not approved) and
//   "Send back to author" is offered.
import { decide, DecisionError, type DecisionDeps, type DecisionInput } from "../approval/decide";
import type { ReviewFeedback } from "../content/types";

export interface WorkflowDeps extends DecisionDeps {
  sendBack(objectId: string, feedback: ReviewFeedback): Promise<void>;
  deleteDoc(objectId: string): Promise<void>;
  /** Purges the Sanity cache and the approval cache together, plus the public paths. */
  purge(paths: string[]): void;
  /** Uncached read: is this published revision a deletion request? */
  isDeletionRequest(objectId: string): Promise<boolean>;
}

export interface Outcome {
  ok: boolean;
  message: string;
  warning?: string;
}

export const WARN = {
  sendBack: "Recorded as rejected, and it is off the website. But it could not be sent back to the author in Sanity. Use “Send back to author” to try again.",
  delete: "Deletion approved, and it is off the website. But it could not be deleted from Sanity. Use “Delete now” to try again.",
} as const;

export function publicPaths(type: string, slug?: string | null): string[] {
  const paths = ["/sitemap.xml"];
  if (type === "post") paths.push("/blog", ...(slug ? [`/blog/${slug}`] : []));
  return paths;
}

export async function runDecision(input: DecisionInput & { slug?: string | null }, deps: WorkflowDeps): Promise<Outcome> {
  let record;
  try {
    record = await decide(input, deps);
  } catch (err) {
    if (err instanceof DecisionError) return { ok: false, message: err.message };
    return { ok: false, message: "The decision could not be saved. Nothing changed. Please try again." };
  }
  const paths = publicPaths(input.objectType, input.slug);
  let warning: string | undefined;

  if (record.state === "rejected") {
    try {
      await deps.sendBack(input.objectId, { note: record.reason ?? "", by: record.decidedBy, at: record.decidedAt.toISOString(), revision: record.revision });
    } catch {
      warning = WARN.sendBack;
    }
  } else if (await deps.isDeletionRequest(input.objectId).catch(() => false)) {
    try {
      await deps.deleteDoc(input.objectId);
    } catch {
      warning = WARN.delete;
    }
  }
  deps.purge(paths);
  const verb = record.state === "approved" ? "Approved" : "Rejected and sent back to the author";
  return { ok: true, message: warning ? "Decision recorded." : `${verb}.`, warning };
}

/** Retries need the same guards as a decision: a session and a checker. */
async function guard(deps: Pick<DecisionDeps, "actor" | "isChecker">): Promise<Outcome | null> {
  if (!deps.actor) return { ok: false, message: "Your admin session has ended. Sign in again." };
  if (!(await deps.isChecker(deps.actor.email))) return { ok: false, message: `${deps.actor.email} is not a content checker.` };
  return null;
}

export async function retrySendBack(objectId: string, type: string, deps: WorkflowDeps & { latest(): Promise<{ state: string; revision: string; reason: string | null; decidedBy: string; decidedAt: Date } | null> }): Promise<Outcome> {
  const refused = await guard(deps);
  if (refused) return refused;
  const latest = await deps.latest();
  if (!latest || latest.state !== "rejected") return { ok: false, message: "There is no rejection to send back." };
  try {
    await deps.sendBack(objectId, { note: latest.reason ?? "", by: latest.decidedBy, at: latest.decidedAt.toISOString(), revision: latest.revision });
  } catch {
    return { ok: false, message: "Still could not reach Sanity. It stays off the website. Try again later." };
  }
  deps.purge(publicPaths(type));
  return { ok: true, message: "Sent back to the author." };
}

export async function retryDelete(objectId: string, type: string, deps: WorkflowDeps & { latest(): Promise<{ state: string; revision: string } | null> }): Promise<Outcome> {
  const refused = await guard(deps);
  if (refused) return refused;
  const latest = await deps.latest();
  const current = await deps.currentRevision(objectId);
  if (current === null) return { ok: true, message: "Already deleted." };
  if (!latest || latest.state !== "approved" || latest.revision !== current || !(await deps.isDeletionRequest(objectId))) {
    return { ok: false, message: "This item is not an approved deletion request." };
  }
  try {
    await deps.deleteDoc(objectId);
  } catch {
    return { ok: false, message: "Still could not delete it in Sanity. It stays off the website. Try again later." };
  }
  deps.purge(publicPaths(type));
  return { ok: true, message: "Deleted." };
}
