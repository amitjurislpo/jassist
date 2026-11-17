// SRS: the Founding CTO's decision of 10 Nov 2026 (IamJCG D-94): the site reaches its data only over
// a secured HTTPS link from a component inside the AWS network; the database is closed to the
// internet. These tests run the Lambda's handler on a real database and call it the way the site
// does, through the signed link.
import { beforeEach, describe, expect, it, vi } from "vitest";
import type pg from "pg";
import { freshDb } from "./helpers";
import { createHandler, SCHEMA_MIGRATE, type LinkEvent } from "@/datalink/handler";
import { makeOps, remoteOps, OP_NAMES } from "@/lib/data/operations";
import { DataLinkError, HEADERS, encode, linkCaller, sign } from "@/scripts/data-link.mjs";

const SECRET = "s".repeat(40);
const NOW = 1_794_000_000_000;
let pool: pg.Pool;
const logs: string[] = [];

function lambda(over: Partial<Parameters<typeof createHandler>[0]> = {}) {
  return createHandler({
    secret: SECRET,
    environment: "preview",
    ops: () => makeOps(pool),
    migrate: async () => [{ name: "0001", checksum: "c" }],
    now: () => NOW,
    log: (l) => logs.push(l),
    ...over,
  });
}

/** fetch, as the site's link sees it, answered by the Lambda handler in-process. */
function viaLambda(handler: ReturnType<typeof createHandler>, base64 = false): typeof fetch {
  return (async (_url: string, init: RequestInit) => {
    const body = String(init.body);
    const res = await handler({
      body: base64 ? Buffer.from(body).toString("base64") : body,
      isBase64Encoded: base64,
      headers: init.headers as Record<string, string>,
      requestContext: { http: { method: init.method } },
    });
    return new Response(res.body, { status: res.statusCode, headers: res.headers });
  }) as typeof fetch;
}

const remote = (handler = lambda(), base64 = false) =>
  remoteOps(linkCaller({ url: "https://link.test/", secret: SECRET, environment: "preview", fetchImpl: viaLambda(handler, base64), now: () => NOW }));

function signed(body: string, over: Record<string, string> = {}): LinkEvent {
  const time = String(Math.floor(NOW / 1000));
  return {
    body,
    headers: { [HEADERS.time]: time, [HEADERS.environment]: "preview", [HEADERS.signature]: sign(SECRET, "preview", time, body), ...over },
    requestContext: { http: { method: "POST" } },
  };
}

beforeEach(async () => {
  pool = await freshDb();
  logs.length = 0;
});

describe("data link: every operation, through the signed link", () => {
  it("approvals: decisions with their dates, compare-and-set, checkers, approved revisions", async () => {
    const d = remote();
    const rec = { objectType: "post", objectId: "p1", title: "Hello", revision: "r1", state: "approved" as const, decidedBy: "gopal@jurislpo.com", decidedAt: new Date("2026-11-10T10:00:00Z"), reason: null };
    expect(await d.decisionWrite(rec, null, "waiting")).toBe(true);
    expect(await d.decisionWrite(rec, null, "waiting")).toBe(false);
    const latest = await d.decisionLatest("post", "p1");
    expect(latest!.decidedAt).toEqual(rec.decidedAt);
    expect(await d.decisionsAll()).toHaveLength(1);
    expect(await d.approvedRevisions()).toEqual([["p1", "r1"]]);
    expect(await d.isChecker(" Ritz@JurisLPO.com ")).toBe(true);
    expect(await d.isChecker("someone@else.com")).toBe(false);
  });

  it("the list of operations is exactly what the link carries", () => {
    expect([...OP_NAMES].sort()).toEqual(["approvedRevisions", "decisionLatest", "decisionWrite", "decisionsAll", "isChecker"]);
    expect(OP_NAMES).not.toContain(SCHEMA_MIGRATE);
  });

  it("schemaMigrate applies only what the Lambda bundles, and says what is applied", async () => {
    const call = linkCaller({ url: "https://link.test/", secret: SECRET, environment: "preview", fetchImpl: viaLambda(lambda()), now: () => NOW });
    expect(await call(SCHEMA_MIGRATE)).toEqual([{ name: "0001", checksum: "c" }]);
  });
});

describe("data link: refusals", () => {
  const body = encode({ op: "decisionsAll", args: [] });

  it("refuses anything but POST", async () => {
    expect((await lambda()({ ...signed(body), requestContext: { http: { method: "GET" } } })).statusCode).toBe(405);
    expect((await lambda()({ ...signed(body), requestContext: undefined })).statusCode).toBe(405);
  });
  it("refuses a wrong signature, another environment, an old request, a short secret or missing headers", async () => {
    const h = lambda();
    expect((await h(signed(body, { [HEADERS.signature]: "0".repeat(64) }))).statusCode).toBe(401);
    expect((await h(signed(body, { [HEADERS.environment]: "production" }))).statusCode).toBe(401);
    expect((await h(signed(body + " "))).statusCode).toBe(200);
    expect((await h({ ...signed(body), body: body + " " })).statusCode).toBe(401);
    expect((await h({ ...signed(body), headers: {} })).statusCode).toBe(401);
    expect((await h({ ...signed(body), headers: undefined, body: undefined })).statusCode).toBe(401);
    expect((await lambda({ now: () => NOW + 301_000 })(signed(body))).statusCode).toBe(401);
    expect((await lambda({ secret: "short" })(signed(body))).statusCode).toBe(401);
    expect((await lambda({ secret: undefined })(signed(body))).statusCode).toBe(401);
    expect((await lambda({ environment: undefined })(signed(body))).statusCode).toBe(401);
    expect((await h(signed(body, { [HEADERS.time]: "12" }))).statusCode).toBe(401);
    expect((await h(signed(body, { [HEADERS.signature]: "xyz" }))).statusCode).toBe(401);
  });
  it("a production site's link is refused by the preview Lambda, so preview data and production data never meet", async () => {
    const call = linkCaller({ url: "https://link.test/", secret: SECRET, environment: "production", fetchImpl: viaLambda(lambda()), now: () => NOW });
    await expect(call("decisionsAll")).rejects.toBeInstanceOf(DataLinkError);
  });
  it("header names are matched in any case", async () => {
    const e = signed(body);
    const upper = Object.fromEntries(Object.entries(e.headers!).map(([k, v]) => [k.toUpperCase(), v]));
    expect((await lambda()({ ...e, headers: upper })).statusCode).toBe(200);
  });
  it("refuses bodies that are not a request, and unknown operations", async () => {
    const h = lambda();
    expect((await h(signed("{nope"))).statusCode).toBe(400);
    expect((await h(signed(encode({ op: "decisionsAll", args: "x" })))).statusCode).toBe(400);
    expect((await h(signed(encode({ op: "dropEverything", args: [] })))).statusCode).toBe(404);
    expect((await h(signed(encode({ op: "constructor" })))).statusCode).toBe(404);
    expect((await h(signed("null"))).statusCode).toBe(404);
  });
  it("a failed operation says only that it failed; the reason stays in the Lambda's log", async () => {
    const h = lambda({ ops: () => ({ ...makeOps(pool), decisionsAll: async () => { throw new Error("relation is missing"); } }) });
    const res = await h(signed(body));
    expect(res.statusCode).toBe(500);
    expect(res.body).not.toMatch(/relation/);
    expect(logs).toEqual(["operation decisionsAll failed: relation is missing"]);
    await lambda({ ops: () => { throw "plain"; } })(signed(body));
    expect(logs[1]).toBe("operation decisionsAll failed: plain");
  });
  it("logs to the console when no logger is given", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const h = createHandler({ secret: SECRET, environment: "preview", ops: () => { throw new Error("x"); }, migrate: async () => [], now: () => NOW });
    expect((await h(signed(body))).statusCode).toBe(500);
    expect(spy).toHaveBeenCalledWith("operation decisionsAll failed: x");
    spy.mockRestore();
  });
});
