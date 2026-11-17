// Every review decision, enforced on the server. Work order Part 2 "Decisions":
//  1. a valid admin session; 2. the admin is in the checker table;
//  3. the reviewed revision is still current (read uncached); 4. the state machine allows it.
// Sanity gives no reliable link between a Sanity author and a site account, so the site does not stop a checker
// approving a post they wrote; authors are kept out of the blog_checker table instead (README).
// The write is a compare-and-set, so two checkers deciding at once cannot both win.

import { effectiveState, nextState, type ApprovalRecord, type DecisionAction } from "./machine";

export const MESSAGES = {
  noSession: "Your admin session has ended. Sign in again.",
  notChecker: (email: string) => `${email} can view this page but is not a content checker, so it cannot approve or reject.`,
  stale: "This post changed. Reload and review the latest version.",
  gone: "This item is no longer published in Sanity. Reload the review page.",
  illegal: "This revision has already been decided. Only items that are waiting can be approved or rejected.",
  reasonRequired: "Write feedback for the author before rejecting.",
} as const;

export class DecisionError extends Error {
  constructor(
    public readonly code: "no_session" | "not_checker" | "stale" | "gone" | "illegal" | "reason_required",
    message: string,
  ) {
    super(message);
    this.name = "DecisionError";
  }
}

export interface Actor {
  email: string;
}

export interface DecisionInput {
  objectType: string;
  objectId: string;
  /** The revision the checker reviewed (sent by the review page). */
  reviewedRevision: string;
  title?: string;
  action: DecisionAction;
  reason?: string | null;
}

export interface DecisionStore {
  getLatest(objectType: string, objectId: string): Promise<ApprovalRecord | null>;
  /**
   * Writes the latest decision and one audit line in one database transaction, only if the
   * latest decision is still `expected` (compare-and-set). Returns false if it changed meanwhile.
   */
  writeDecision(record: ApprovalRecord, expected: ApprovalRecord | null, fromState: string): Promise<boolean>;
}

export interface DecisionDeps {
  /** The signed-in admin, or null. */
  actor: Actor | null;
  isChecker(email: string): Promise<boolean>;
  /** Uncached read of the published revision from Sanity. null = not published. */
  currentRevision(objectId: string): Promise<string | null>;
  store: DecisionStore;
  now?: () => Date;
}

export async function decide(input: DecisionInput, deps: DecisionDeps): Promise<ApprovalRecord> {
  if (!deps.actor) throw new DecisionError("no_session", MESSAGES.noSession);
  const email = deps.actor.email.trim().toLowerCase();
  if (!(await deps.isChecker(email))) throw new DecisionError("not_checker", MESSAGES.notChecker(email));

  const current = await deps.currentRevision(input.objectId);
  if (current === null) throw new DecisionError("gone", MESSAGES.gone);
  if (current !== input.reviewedRevision) throw new DecisionError("stale", MESSAGES.stale);

  const reason = input.reason?.trim() || null;
  if (input.action === "reject" && !reason) throw new DecisionError("reason_required", MESSAGES.reasonRequired);

  const latest = await deps.store.getLatest(input.objectType, input.objectId);
  const from = effectiveState(latest, current);
  const to = nextState(from, input.action);
  if (!to || to === "waiting") throw new DecisionError("illegal", MESSAGES.illegal);

  const record: ApprovalRecord = {
    objectType: input.objectType,
    objectId: input.objectId,
    title: input.title ?? "",
    revision: current,
    state: to,
    decidedBy: email,
    decidedAt: (deps.now ?? (() => new Date()))(),
    reason,
  };
  const written = await deps.store.writeDecision(record, latest, from);
  if (!written) throw new DecisionError("illegal", MESSAGES.illegal);
  return record;
}
