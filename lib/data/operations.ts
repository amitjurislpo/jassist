// Every database operation the site may ask for, by name. This list is the whole surface of the data link
// (scripts/data-link.mjs): the Lambda inside the group VPC runs these and nothing else, so there is no way to send it
// SQL. Locally (and in tests) the same list runs on a direct pool.
import type { Pool } from "pg";
import { isCheckerEmail, pgDecisionStore } from "../approval/pgStore";
import type { ApprovalRecord } from "../approval/machine";

export function makeOps(pool: Pool) {
  const decisions = pgDecisionStore(pool);
  return {
    decisionLatest: (objectType: string, objectId: string) => decisions.getLatest(objectType, objectId),
    decisionWrite: (record: ApprovalRecord, expected: ApprovalRecord | null, fromState: string) => decisions.writeDecision(record, expected, fromState),
    decisionsAll: () => decisions.listAll(),
    /** [objectId, revision] pairs (a Map does not travel). */
    approvedRevisions: async (): Promise<[string, string][]> => [...(await decisions.approvedRevisions()).entries()],
    isChecker: (email: string) => isCheckerEmail(pool, email),
  };
}

export type DataOps = ReturnType<typeof makeOps>;
export type OpName = keyof DataOps;

export const OP_NAMES = Object.keys(makeOps(null as unknown as Pool)) as OpName[];

export function isOpName(name: unknown): name is OpName {
  return typeof name === "string" && (OP_NAMES as string[]).includes(name);
}

/** The same operations, each sent over the data link. */
export function remoteOps(call: (op: string, args: unknown[]) => Promise<unknown>): DataOps {
  return Object.fromEntries(OP_NAMES.map((name) => [name, (...args: unknown[]) => call(name, args)])) as unknown as DataOps;
}
