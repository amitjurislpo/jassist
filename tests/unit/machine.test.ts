// SRS: work order Part 2 "Decisions" rule 4 (single state machine) and "Core rule".
import { describe, expect, it } from "vitest";
import { canDecide, effectiveState, isApprovedAtRevision, nextState, type ApprovalRecord } from "@/lib/approval/machine";

const rec = (state: "approved" | "rejected", revision = "r1"): ApprovalRecord => ({ objectType: "post", objectId: "p", revision, state, decidedBy: "a@x", decidedAt: new Date(), reason: null });

describe("state machine", () => {
  it("only waiting can move, to approved or rejected", () => {
    expect(nextState("waiting", "approve")).toBe("approved");
    expect(nextState("waiting", "reject")).toBe("rejected");
    for (const from of ["approved", "rejected"] as const) for (const a of ["approve", "reject"] as const) expect(nextState(from, a)).toBeNull();
  });
  it("no record, or a record at another revision, is waiting", () => {
    expect(effectiveState(null, "r1")).toBe("waiting");
    expect(effectiveState(rec("approved", "r0"), "r1")).toBe("waiting");
    expect(effectiveState(rec("rejected", "r0"), "r1")).toBe("waiting");
    expect(effectiveState(rec("approved"), "r1")).toBe("approved");
    expect(effectiveState(rec("rejected"), "r1")).toBe("rejected");
  });
  it("canDecide only when waiting", () => {
    expect(canDecide(null, "r1")).toBe(true);
    expect(canDecide(rec("approved"), "r1")).toBe(false);
    expect(canDecide(rec("rejected"), "r1")).toBe(false);
    expect(canDecide(rec("approved"), "r2")).toBe(true);
  });
  it("public only when approved at the current revision", () => {
    expect(isApprovedAtRevision(rec("approved"), "r1")).toBe(true);
    expect(isApprovedAtRevision(rec("approved"), "r2")).toBe(false);
    expect(isApprovedAtRevision(rec("rejected"), "r1")).toBe(false);
    expect(isApprovedAtRevision(null, "r1")).toBe(false);
    expect(isApprovedAtRevision(undefined, "r1")).toBe(false);
  });
});
