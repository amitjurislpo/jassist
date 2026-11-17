// SRS: work order Part 2 "Review page" (Waiting, Approved, Rejected, deletion marker) and
// "A post deleted directly through Sanity ... leaves the review queue".
import { describe, expect, it } from "vitest";
import { buildQueue, type QueueDoc } from "@/lib/review/queue";
import type { ApprovalRecord } from "@/lib/approval/machine";

const doc = (id: string, rev: string, extra: Partial<QueueDoc> = {}): QueueDoc => ({ _id: id, _type: "post", _rev: rev, title: id, ...extra });
const rec = (id: string, rev: string, state: "approved" | "rejected", title = id): ApprovalRecord => ({ objectType: "post", objectId: id, title, revision: rev, state, decidedBy: "c@x", decidedAt: new Date("2026-11-10"), reason: state === "rejected" ? "fix" : null });

describe("review queue", () => {
  const q = buildQueue(
    [doc("new", "r1"), doc("edited", "r2"), doc("live", "r1"), doc("delreq", "r3", { deletionRequested: true }), doc("rejStuck", "r1"), doc("delStuck", "r1", { deletionRequested: true })],
    [rec("edited", "r1", "approved"), rec("live", "r1", "approved"), rec("delreq", "r1", "approved"), rec("rejStuck", "r1", "rejected"), rec("sentBack", "r5", "rejected", "Sent back post"), rec("deletedInSanity", "r1", "approved"), rec("delStuck", "r1", "approved")],
  );
  it("waiting: never decided, or edited since the decision; deletion requests marked", () => {
    expect(q.waiting.map((i) => i.id).sort()).toEqual(["delreq", "edited", "new"]);
    expect(q.waiting.find((i) => i.id === "delreq")!.deletionRequested).toBe(true);
  });
  it("approved: approved at the current revision; a stuck deletion offers Delete now", () => {
    expect(q.approved.map((i) => i.id).sort()).toEqual(["delStuck", "live"]);
    expect(q.approved.find((i) => i.id === "delStuck")!.deletePending).toBe(true);
    expect(q.approved.find((i) => i.id === "live")!.deletePending).toBe(false);
  });
  it("rejected: sent back (from our record) and stuck (still published, retry offered)", () => {
    const ids = q.rejected.map((i) => i.id).sort();
    expect(ids).toEqual(["rejStuck", "sentBack"]);
    expect(q.rejected.find((i) => i.id === "rejStuck")!.sendBackPending).toBe(true);
    expect(q.rejected.find((i) => i.id === "sentBack")!.title).toBe("Sent back post");
  });
  it("items deleted in Sanity leave the queue", () => {
    expect([...q.waiting, ...q.approved, ...q.rejected].some((i) => i.id === "deletedInSanity")).toBe(false);
  });
});
