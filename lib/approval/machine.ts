// The single approval state machine. Work order Part 2 "Decisions", rule 4:
// only "waiting" can move to "approved" or "rejected".
// Approval state lives only in our database, tied to a Sanity revision (_rev).

export const STATES = ["waiting", "approved", "rejected"] as const;
export type ApprovalState = (typeof STATES)[number];

export const ACTIONS = ["approve", "reject"] as const;
export type DecisionAction = (typeof ACTIONS)[number];

export interface ApprovalRecord {
  objectType: string;
  objectId: string;
  /** Title at decision time, so a rejected item (no longer published) can still be listed. */
  title?: string;
  revision: string;
  state: Exclude<ApprovalState, "waiting">;
  decidedBy: string;
  decidedAt: Date;
  reason: string | null;
}

const TRANSITIONS: Record<ApprovalState, Partial<Record<DecisionAction, ApprovalState>>> = {
  waiting: { approve: "approved", reject: "rejected" },
  approved: {},
  rejected: {},
};

/**
 * The state of a document at a given revision. No record, or a record made at another
 * revision, means the current revision has not been decided yet: it is waiting.
 */
export function effectiveState(record: ApprovalRecord | null, currentRevision: string): ApprovalState {
  if (!record || record.revision !== currentRevision) return "waiting";
  return record.state;
}

export function nextState(from: ApprovalState, action: DecisionAction): ApprovalState | null {
  return TRANSITIONS[from][action] ?? null;
}

export function canDecide(record: ApprovalRecord | null, currentRevision: string): boolean {
  return effectiveState(record, currentRevision) === "waiting";
}

/** Public visibility rule: the latest decision is "approved" AND was made at the current revision. */
export function isApprovedAtRevision(
  record: Pick<ApprovalRecord, "state" | "revision"> | null | undefined,
  currentRevision: string,
): boolean {
  return !!record && record.state === "approved" && record.revision === currentRevision;
}
