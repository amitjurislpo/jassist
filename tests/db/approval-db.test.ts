// SRS: work order Part 2: latest decision per post, append-only audit (trigger refuses UPDATE
// and DELETE), checker table (lower case enforced, add/delete row takes effect, no redeploy),
// seeded checkers, compare-and-set.
import { beforeEach, describe, expect, it } from "vitest";
import type pg from "pg";
import { freshDb } from "./helpers";
import { isCheckerEmail, pgDecisionStore } from "@/lib/approval/pgStore";
import { decide } from "@/lib/approval/decide";

let pool: pg.Pool;
beforeEach(async () => { pool = await freshDb(); });

const at = new Date("2026-11-10T10:00:00Z");
const approve = (rev: string, by = "gopal@jurislpo.com") => ({ objectType: "post", objectId: "p1", title: "T", revision: rev, state: "approved" as const, decidedBy: by, decidedAt: at, reason: null });

describe("decisions in Postgres", () => {
  it("writes the latest decision and one audit line per transition", async () => {
    const s = pgDecisionStore(pool);
    expect(await s.writeDecision(approve("r1"), null, "waiting")).toBe(true);
    const r1 = await s.getLatest("post", "p1");
    expect(await s.writeDecision({ ...approve("r2"), state: "rejected", reason: "fix" }, r1, "waiting")).toBe(true);
    expect(await s.getLatest("post", "p1")).toMatchObject({ revision: "r2", state: "rejected", reason: "fix", title: "T" });
    const audit = await pool.query("select revision, from_state, to_state, actor from approval_audit order by id");
    expect(audit.rows).toEqual([
      { revision: "r1", from_state: "waiting", to_state: "approved", actor: "gopal@jurislpo.com" },
      { revision: "r2", from_state: "waiting", to_state: "rejected", actor: "gopal@jurislpo.com" },
    ]);
    expect(await s.approvedRevisions()).toEqual(new Map());
  });
  it("compare-and-set: a second checker deciding from an old view loses, no audit line", async () => {
    const s = pgDecisionStore(pool);
    expect(await s.writeDecision(approve("r1"), null, "waiting")).toBe(true);
    expect(await s.writeDecision(approve("r1", "ritz@jurislpo.com"), null, "waiting")).toBe(false);
    expect((await pool.query("select count(*)::int as n from approval_audit")).rows[0].n).toBe(1);
  });
  it("two checkers deciding at the same time: exactly one wins", async () => {
    const deps = (email: string) => ({ actor: { email }, isChecker: async () => true, currentRevision: async () => "r1", store: pgDecisionStore(pool), });
    const input = { objectType: "post", objectId: "p1", reviewedRevision: "r1", action: "approve" as const };
    const results = await Promise.allSettled([decide(input, deps("gopal@jurislpo.com")), decide(input, deps("ritz@jurislpo.com"))]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await pool.query("select count(*)::int as n from approval_audit")).rows[0].n).toBe(1);
  });
  it("the audit table refuses UPDATE, DELETE and TRUNCATE", async () => {
    await pgDecisionStore(pool).writeDecision(approve("r1"), null, "waiting");
    await expect(pool.query("update approval_audit set actor = 'x@y'")).rejects.toThrow(/append-only/);
    await expect(pool.query("delete from approval_audit")).rejects.toThrow(/append-only/);
    await expect(pool.query("truncate approval_audit")).rejects.toThrow(/append-only/);
  });
  it("emails must be lower case", async () => {
    await expect(pool.query("insert into approval (object_type, object_id, revision, state, decided_by) values ('post','x','r','approved','A@B.com')")).rejects.toThrow(/check/);
  });
});

describe("checker table", () => {
  it("starts with the three checkers from the work order", async () => {
    const { rows } = await pool.query("select email from blog_checker order by email");
    expect(rows.map((r) => r.email)).toEqual(["amit@jurislpo.com", "gopal@jurislpo.com", "ritz@jurislpo.com"]);
  });
  it("seeding twice adds nothing", async () => {
    const { listMigrations } = await import("@/scripts/migrate.mjs");
    const seed = listMigrations().find((m) => m.name.includes("seed_checkers"))!;
    await pool.query(seed.sql);
    expect((await pool.query("select count(*)::int as n from blog_checker")).rows[0].n).toBe(3);
  });
  it("matches whatever case the login uses; adding or deleting a row works at once", async () => {
    expect(await isCheckerEmail(pool, " Gopal@JurisLPO.com ")).toBe(true);
    expect(await isCheckerEmail(pool, "author@jurislpo.com")).toBe(false);
    await pool.query("insert into blog_checker (email) values ('author@jurislpo.com')");
    expect(await isCheckerEmail(pool, "author@jurislpo.com")).toBe(true);
    await pool.query("delete from blog_checker where email = 'gopal@jurislpo.com'");
    expect(await isCheckerEmail(pool, "gopal@jurislpo.com")).toBe(false);
  });
  it("refuses mixed-case, padded or empty emails", async () => {
    for (const e of ["New@jurislpo.com", " a@b.com", ""]) await expect(pool.query("insert into blog_checker (email) values ($1)", [e])).rejects.toThrow(/check/);
  });
  it("a database error means 'not a checker' (fail closed)", async () => {
    const broken = { query: async () => { throw new Error("down"); } } as unknown as pg.Pool;
    expect(await isCheckerEmail(broken, "gopal@jurislpo.com")).toBe(false);
  });
});
