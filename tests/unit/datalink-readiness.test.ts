// The CTO's release-safety words of 17 Nov 2026 (1:05 and 1:35 pm): the trial copy of the data link answers its
// readiness check only. Ready = every setting present and its database reachable. The check can never be reached
// through the function URL, and a live function (no JASSIST_TRIAL) ignores it.
import { describe, expect, it } from "vitest";
import { createHandler } from "../../datalink/handler";
import { readiness } from "../../datalink/index";

const S = "s".repeat(40);
const base = { DATABASE_URL: "postgres://x", DATA_LINK_SECRET: S, JASSIST_ENVIRONMENT: "production" } as unknown as NodeJS.ProcessEnv;
const handlerFor = (missing: string[]) =>
  createHandler({
    secret: S,
    environment: "production",
    ops: () => { throw new Error("no database work in a readiness check"); },
    migrate: async () => { throw new Error("no migration in a readiness check"); },
    readiness: async () => missing,
    log: () => {},
  });

describe("readiness of the data link trial copy", () => {
  it("is ready when every setting is present and the database answers", async () => {
    expect(await readiness(base, async () => 1)).toEqual([]);
  });
  it("names each missing setting, never a value, and does not touch the database", async () => {
    let touched = false;
    const out = await readiness({ ...base, DATA_LINK_SECRET: "tinyvalue", DATABASE_URL: "" }, async () => { touched = true; });
    expect(out.join(" ")).toMatch(/DATABASE_URL/);
    expect(out.join(" ")).toMatch(/DATA_LINK_SECRET/);
    expect(out.join(" ")).not.toContain("tinyvalue");
    expect(touched).toBe(false);
  });
  it("is not ready when its database does not answer", async () => {
    expect(await readiness(base, async () => { throw new Error("password authentication failed for user secretuser"); })).toEqual(["its database did not answer with its own login"]);
  });
  it("the trial copy answers 200 when ready and 503 when not", async () => {
    expect((await handlerFor([])({ jcgReadiness: true } as never)).statusCode).toBe(200);
    const r = await handlerFor(["DATA_LINK_SECRET is missing"])({ jcgReadiness: true } as never);
    expect(r.statusCode).toBe(503);
    expect(JSON.parse(r.body)).toMatchObject({ ok: false });
  });
  it("is answered by a direct invoke of a live function too, and never through the function URL", async () => {
    const viaUrl = await handlerFor([])({ jcgReadiness: true, requestContext: { http: { method: "POST" } }, body: "{}" } as never);
    expect(viaUrl.statusCode).toBe(401);
    expect((await handlerFor([])({ jcgReadiness: true } as never)).statusCode).toBe(200);
  });
});
