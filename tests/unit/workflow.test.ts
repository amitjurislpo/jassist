// SRS: work order Part 2 "Decisions" (approve writes nothing to Sanity; reject recorded first,
// Sanity failure -> warning + retry) and "Deletion" (approve deletes; failure -> Delete now).
import { describe, expect, it, vi } from "vitest";
import { publicPaths, retryDelete, retrySendBack, runDecision, WARN, type WorkflowDeps } from "@/lib/review/workflow";
import type { ApprovalRecord } from "@/lib/approval/machine";

function deps(over: Partial<WorkflowDeps> = {}) {
  let latest: ApprovalRecord | null = null;
  const order: string[] = [];
  const d: WorkflowDeps = {
    actor: { email: "gopal@jurislpo.com" },
    isChecker: async () => true,
    currentRevision: async () => "r1",
    store: { getLatest: async () => latest, writeDecision: async (r) => { order.push("record"); latest = r; return true; } },
    sendBack: vi.fn(async () => { order.push("sanity"); }),
    deleteDoc: vi.fn(async () => { order.push("delete"); }),
    purge: vi.fn(),
    isDeletionRequest: async () => false,
    ...over,
  };
  return { d, order, latest: () => latest };
}
const input = { objectType: "post", objectId: "p1", reviewedRevision: "r1", slug: "hello" };

describe("decision workflow", () => {
  it("approve: recorded, nothing written to Sanity, caches and paths purged", async () => {
    const { d } = deps();
    expect(await runDecision({ ...input, action: "approve" }, d)).toEqual({ ok: true, message: "Approved.", warning: undefined });
    expect(d.sendBack).not.toHaveBeenCalled();
    expect(d.deleteDoc).not.toHaveBeenCalled();
    expect(d.purge).toHaveBeenCalledWith(["/sitemap.xml", "/blog", "/blog/hello"]);
  });
  it("reject: recorded first, then sent back with the feedback and revision", async () => {
    const { d, order } = deps();
    const r = await runDecision({ ...input, action: "reject", reason: "Fix the intro" }, d);
    expect(r.ok).toBe(true);
    expect(order).toEqual(["record", "sanity"]);
    expect(d.sendBack).toHaveBeenCalledWith("p1", expect.objectContaining({ note: "Fix the intro", by: "gopal@jurislpo.com", revision: "r1" }));
  });
  it("reject with Sanity failing (e.g. no token): still recorded, warning shown, purged", async () => {
    const { d, latest } = deps({ sendBack: async () => { throw new Error("no token"); } });
    const r = await runDecision({ ...input, action: "reject", reason: "x" }, d);
    expect(r).toMatchObject({ ok: true, warning: WARN.sendBack });
    expect(latest()?.state).toBe("rejected");
    expect(d.purge).toHaveBeenCalled();
  });
  it("approving a deletion request deletes it; failure warns and keeps it recorded", async () => {
    const a = deps({ isDeletionRequest: async () => true });
    expect((await runDecision({ ...input, action: "approve" }, a.d)).warning).toBeUndefined();
    expect(a.d.deleteDoc).toHaveBeenCalledWith("p1");
    const b = deps({ isDeletionRequest: async () => true, deleteDoc: async () => { throw new Error(); } });
    expect((await runDecision({ ...input, action: "approve" }, b.d)).warning).toBe(WARN.delete);
  });
  it("a failed deletion-request lookup never deletes", async () => {
    const { d } = deps({ isDeletionRequest: async () => { throw new Error(); } });
    await runDecision({ ...input, action: "approve" }, d);
    expect(d.deleteDoc).not.toHaveBeenCalled();
  });
  it("guards are enforced on the server: non-checker and stale are refused, nothing written", async () => {
    const nc = deps({ isChecker: async () => false });
    expect((await runDecision({ ...input, action: "approve" }, nc.d)).ok).toBe(false);
    expect(nc.d.purge).not.toHaveBeenCalled();
    const st = deps({ currentRevision: async () => "r2" });
    expect(await runDecision({ ...input, action: "approve" }, st.d)).toEqual({ ok: false, message: "This post changed. Reload and review the latest version." });
  });
  it("a database error is reported plainly", async () => {
    const { d } = deps({ store: { getLatest: async () => { throw new Error(); }, writeDecision: async () => true } });
    expect((await runDecision({ ...input, action: "approve" }, d)).ok).toBe(false);
  });
  it("public paths per type", () => {
    expect(publicPaths("post", "hello")).toEqual(["/sitemap.xml", "/blog", "/blog/hello"]);
    expect(publicPaths("post")).toEqual(["/sitemap.xml", "/blog"]);
  });
});

describe("retries", () => {
  const rejected = { state: "rejected", revision: "r1", reason: "fix", decidedBy: "c@x", decidedAt: new Date() };
  it("send back again needs a checker and a rejection", async () => {
    const ok = deps();
    expect(await retrySendBack("p1", "post", { ...ok.d, latest: async () => rejected })).toEqual({ ok: true, message: "Sent back to the author." });
    expect((await retrySendBack("p1", "post", { ...deps({ actor: null }).d, latest: async () => rejected })).ok).toBe(false);
    expect((await retrySendBack("p1", "post", { ...deps({ isChecker: async () => false }).d, latest: async () => rejected })).ok).toBe(false);
    expect((await retrySendBack("p1", "post", { ...ok.d, latest: async () => null })).ok).toBe(false);
    expect((await retrySendBack("p1", "post", { ...deps({ sendBack: async () => { throw new Error(); } }).d, latest: async () => rejected })).ok).toBe(false);
  });
  it("delete now only for an approved deletion request at the current revision", async () => {
    const approved = { state: "approved", revision: "r1" };
    expect((await retryDelete("p1", "post", { ...deps({ isDeletionRequest: async () => true }).d, latest: async () => approved })).message).toBe("Deleted.");
    expect((await retryDelete("p1", "post", { ...deps({ isDeletionRequest: async () => false }).d, latest: async () => approved })).ok).toBe(false);
    expect((await retryDelete("p1", "post", { ...deps({ isDeletionRequest: async () => true, currentRevision: async () => "r2" }).d, latest: async () => approved })).ok).toBe(false);
    expect((await retryDelete("p1", "post", { ...deps({ currentRevision: async () => null }).d, latest: async () => approved })).message).toBe("Already deleted.");
    expect((await retryDelete("p1", "post", { ...deps({ isChecker: async () => false }).d, latest: async () => approved })).ok).toBe(false);
  });
});
