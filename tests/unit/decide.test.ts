// SRS: work order Part 2 "Decisions" 1-4 (session, checker, staleness, state machine), audit.
import { describe, expect, it, vi } from "vitest";
import { decide, DecisionError, MESSAGES, type DecisionDeps, type DecisionStore } from "@/lib/approval/decide";
import type { ApprovalRecord } from "@/lib/approval/machine";

function memoryStore(initial: ApprovalRecord | null = null): DecisionStore & { latest: ApprovalRecord | null; writes: number } {
  return {
    latest: initial,
    writes: 0,
    async getLatest() { return this.latest; },
    async writeDecision(r, expected) {
      if ((this.latest?.revision ?? null) !== (expected?.revision ?? null) || (this.latest?.state ?? null) !== (expected?.state ?? null)) return false;
      this.latest = r; this.writes++; return true;
    },
  };
}
const deps = (over: Partial<DecisionDeps> = {}): DecisionDeps => ({
  actor: { email: "Gopal@JurisLPO.com " },
  isChecker: async (e) => e === "gopal@jurislpo.com",
  currentRevision: async () => "r1",
  store: memoryStore(),
  now: () => new Date("2026-11-10T10:00:00Z"),
  ...over,
});
const input = { objectType: "post", objectId: "p1", reviewedRevision: "r1", action: "approve" as const };

async function code(p: Promise<unknown>) {
  try { await p; return "ok"; } catch (e) { return e instanceof DecisionError ? e.code : "other"; }
}

describe("decide", () => {
  it("approves when all four checks pass, recording who, when, revision", async () => {
    const d = deps();
    const r = await decide(input, d);
    expect(r).toMatchObject({ state: "approved", revision: "r1", decidedBy: "gopal@jurislpo.com", reason: null });
    expect((d.store as ReturnType<typeof memoryStore>).writes).toBe(1);
  });
  it("refuses without a session", async () => expect(await code(decide(input, deps({ actor: null })))).toBe("no_session"));
  it("refuses an admin who is not a checker, naming the email", async () => {
    const err = await decide(input, deps({ actor: { email: "ops@jurislpo.com" } })).catch((e) => e);
    expect(err.code).toBe("not_checker");
    expect(err.message).toContain("ops@jurislpo.com");
  });
  it("refuses a stale revision with the exact message", async () => {
    const err = await decide(input, deps({ currentRevision: async () => "r2" })).catch((e) => e);
    expect(err.code).toBe("stale");
    expect(err.message).toBe("This post changed. Reload and review the latest version.");
    expect(MESSAGES.stale).toBe(err.message);
  });
  it("refuses when the document is no longer published", async () => expect(await code(decide(input, deps({ currentRevision: async () => null })))).toBe("gone"));
  it("checks staleness before reading the store (uncached revision first)", async () => {
    const store = memoryStore();
    const spy = vi.spyOn(store, "getLatest");
    await decide(input, deps({ store, currentRevision: async () => "r9" })).catch(() => {});
    expect(spy).not.toHaveBeenCalled();
  });
  it("refuses approve or reject on an already-decided revision", async () => {
    const decided = (state: "approved" | "rejected") => memoryStore({ objectType: "post", objectId: "p1", revision: "r1", state, decidedBy: "x@y", decidedAt: new Date(), reason: null });
    expect(await code(decide(input, deps({ store: decided("approved") })))).toBe("illegal");
    expect(await code(decide({ ...input, action: "reject", reason: "no" }, deps({ store: decided("rejected") })))).toBe("illegal");
    expect(await code(decide({ ...input, action: "reject", reason: "no" }, deps({ store: decided("approved") })))).toBe("illegal");
  });
  it("a new revision returns to waiting and can be decided again", async () => {
    const store = memoryStore({ objectType: "post", objectId: "p1", revision: "r0", state: "approved", decidedBy: "x@y", decidedAt: new Date(), reason: null });
    expect((await decide(input, deps({ store }))).state).toBe("approved");
  });
  it("reject needs feedback", async () => {
    expect(await code(decide({ ...input, action: "reject" }, deps()))).toBe("reason_required");
    expect(await code(decide({ ...input, action: "reject", reason: "   " }, deps()))).toBe("reason_required");
    expect((await decide({ ...input, action: "reject", reason: " Fix the intro " }, deps())).reason).toBe("Fix the intro");
  });
  it("loses cleanly when another checker decided first (compare-and-set)", async () => {
    const store = memoryStore();
    store.writeDecision = async () => false;
    expect(await code(decide(input, deps({ store })))).toBe("illegal");
  });
  it("a checker lookup failure is a refusal", async () => {
    expect(await code(decide(input, deps({ isChecker: async () => false })))).toBe("not_checker");
  });
});

