// SRS: work order "Database and deployment": production migrations run in the build; a database
// that cannot be migrated, or is behind the build, fails the build. Through the data link
// (IamJCG D-94), because the group database is private.
import { describe, expect, it } from "vitest";
import { migrationPlan, schemaCheck } from "@/scripts/build-plan.mjs";

describe("build migration plan", () => {
  it.each(["production", "preview"])("%s with a data link migrates through it", (VERCEL_ENV) => {
    expect(migrationPlan({ VERCEL_ENV, DATA_LINK_URL: "https://x" }).action).toBe("link");
  });
  it.each(["production", "preview"])("%s with no data link skips, with a warning", (VERCEL_ENV) => {
    const p = migrationPlan({ VERCEL_ENV, DATABASE_URL: "postgres://x" });
    expect(p.action).toBe("skip");
    expect(p.message).toMatch(/^WARNING/);
  });
  it("local and development builds skip", () => {
    expect(migrationPlan({}).action).toBe("skip");
    expect(migrationPlan({ VERCEL_ENV: "development", DATA_LINK_URL: "https://x" }).action).toBe("skip");
  });
});

describe("schema check after migrating", () => {
  const a = { name: "0001_a.sql", checksum: "1" };
  const b = { name: "0002_b.sql", checksum: "2" };
  it("passes when every expected migration is applied, unchanged (extra ones from a newer Lambda are fine)", () => {
    expect(schemaCheck([a, b], [a, b])).toBeNull();
    expect(schemaCheck([a, b], [a])).toBeNull();
  });
  it("fails, naming them, when migrations are missing or were changed", () => {
    expect(schemaCheck([a], [a, b])).toMatch(/^MIGRATION FAILED: .*not applied: 0002_b\.sql/);
    expect(schemaCheck([{ ...a, checksum: "x" }], [a])).toMatch(/changed after they were applied: 0001_a\.sql/);
    const both = schemaCheck([{ ...a, checksum: "x" }], [a, b])!;
    expect(both).toContain("not applied: 0002_b.sql");
    expect(both).toContain("changed after they were applied: 0001_a.sql");
  });
});
