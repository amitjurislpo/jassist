// SRS: work order "Database and deployment": preview never migrates production; a failed or
// changed migration stops the run.
import { describe, expect, it } from "vitest";
import { freshDb } from "./helpers";
import { migrate } from "@/scripts/migrate.mjs";

describe("migrations", () => {
  it("a second run applies nothing", async () => {
    await freshDb();
    const log: string[] = [];
    await migrate({ url: process.env.TEST_DATABASE_URL!, environment: "test", log: (m) => log.push(m) });
    expect(log).toEqual(["migrations up to date (0 applied now)"]);
  });
  it("refuses a database that belongs to another environment", async () => {
    await freshDb();
    await expect(migrate({ url: process.env.TEST_DATABASE_URL!, environment: "production" })).rejects.toThrow(/belongs to "test"/);
    await expect(migrate({ url: process.env.TEST_DATABASE_URL!, environment: "preview" })).rejects.toThrow(/Refusing/);
  });
  it("refuses a changed migration, a missing URL and an unknown environment", async () => {
    const pool = await freshDb();
    await pool.query("update schema_migrations set checksum = 'x' where name like '0001%'");
    await expect(migrate({ url: process.env.TEST_DATABASE_URL!, environment: "test" })).rejects.toThrow(/changed after it was applied/);
    await expect(migrate({ url: undefined, environment: "test" })).rejects.toThrow(/DIRECT_DATABASE_URL/);
    await expect(migrate({ url: process.env.TEST_DATABASE_URL!, environment: "staging" })).rejects.toThrow(/Unknown environment/);
  });
});
