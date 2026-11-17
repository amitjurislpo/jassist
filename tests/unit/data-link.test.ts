// SRS: IamJCG D-94 (10 Nov 2026): the secured HTTPS link to the private group database. The
// shared encoding and signing rules, the site's caller, how the site picks its data route, and
// that the Lambda bundles exactly the repository's migrations.
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { DataLinkError, MAX_SKEW_SECONDS, decode, encode, linkCaller, sign, verify, HEADERS } from "@/scripts/data-link.mjs";
import { migrationsJson } from "@/datalink/build.mjs";

const SECRET = "k".repeat(32);

describe("values travel as they are", () => {
  it("dates and bytes come back as dates and bytes; everything else is plain JSON", () => {
    const bytes = new Uint8Array([0, 1, 254, 255]);
    const value = { at: new Date("2026-11-16T00:00:00Z"), bytes, sub: Buffer.from([7]).subarray(0), list: [1, "a", null], n: { $d: 1 } };
    const back = decode(encode(value)) as typeof value;
    expect(back.at).toEqual(value.at);
    expect(back.bytes).toEqual(bytes);
    expect(back.sub).toEqual(new Uint8Array([7]));
    expect(back.list).toEqual([1, "a", null]);
    expect(back.n).toEqual({ $d: 1 });
    expect(decode('{"x":{"$b":"AQ==","y":1}}')).toEqual({ x: { $b: "AQ==", y: 1 } });
  });
});

describe("signing", () => {
  const now = 1_794_000_000_000;
  const time = String(now / 1000);
  const headers = (over = {}) => ({ [HEADERS.time]: time, [HEADERS.environment]: "production", [HEADERS.signature]: sign(SECRET, "production", time, "b"), ...over });
  it("accepts a fresh request for this environment and refuses everything else", () => {
    expect(verify({ secret: SECRET, environment: "production", headers: headers(), body: "b", now })).toBe(true);
    expect(verify({ secret: SECRET, environment: "production", headers: headers(), body: "b", now: now + MAX_SKEW_SECONDS * 1000 + 1000 })).toBe(false);
    expect(verify({ secret: SECRET, environment: "preview", headers: headers({ [HEADERS.environment]: "preview" }), body: "b", now })).toBe(false);
    expect(verify({ secret: "x".repeat(32), environment: "production", headers: headers(), body: "b", now })).toBe(false);
  });
  it("uses the clock when no time is given", () => {
    const t = String(Math.floor(Date.now() / 1000));
    const h = { [HEADERS.time]: t, [HEADERS.environment]: "preview", [HEADERS.signature]: sign(SECRET, "preview", t, "") };
    expect(verify({ secret: SECRET, environment: "preview", headers: h, body: "" })).toBe(true);
  });
});

describe("the site's caller", () => {
  it("needs a URL, a secret and an environment", () => {
    expect(() => linkCaller({ url: undefined, secret: SECRET, environment: "preview" })).toThrow(DataLinkError);
    expect(() => linkCaller({ url: "https://x", secret: undefined, environment: "preview" })).toThrow(DataLinkError);
    expect(() => linkCaller({ url: "https://x", secret: SECRET, environment: undefined })).toThrow(DataLinkError);
  });
  it("sends a signed POST, never cached, and returns the result", async () => {
    const fetchImpl = vi.fn(async (_u: string, init: RequestInit) => {
      const h = init.headers as Record<string, string>;
      expect(verify({ secret: SECRET, environment: "preview", headers: h, body: String(init.body) })).toBe(true);
      expect(init).toMatchObject({ method: "POST", cache: "no-store" });
      expect(decode(String(init.body))).toEqual({ op: "isChecker", args: ["a@b.c"] });
      return new Response(encode({ ok: true, result: true }));
    });
    expect(await linkCaller({ url: "https://x", secret: SECRET, environment: "preview", fetchImpl: fetchImpl as typeof fetch })("isChecker", ["a@b.c"])).toBe(true);
    expect(await linkCaller({ url: "https://x", secret: SECRET, environment: "preview", fetchImpl: (async () => new Response(encode({ ok: true, result: 1 }))) as typeof fetch })("x")).toBe(1);
  });
  it("a network failure, a refusal or a garbled answer is a DataLinkError, never a wrong answer", async () => {
    const call = (fetchImpl: () => Promise<Response>) => linkCaller({ url: "https://x", secret: SECRET, environment: "preview", fetchImpl: fetchImpl as typeof fetch })("isChecker", []);
    await expect(call(async () => { throw new Error("down"); })).rejects.toThrow(/did not answer/);
    await expect(call(async () => new Response(encode({ ok: false }), { status: 401 }))).rejects.toThrow(/refused isChecker \(401\)/);
    await expect(call(async () => new Response("<html>"))).rejects.toThrow(DataLinkError);
    await expect(call(async () => new Response(encode({ ok: false })))).rejects.toThrow(DataLinkError);
    await expect(call(async () => new Response("null"))).rejects.toThrow(DataLinkError);
  });
});

describe("the site's data route", () => {
  const keep = { ...process.env };
  afterEach(() => {
    process.env = { ...keep };
    delete (globalThis as { jassistData?: unknown }).jassistData;
    vi.resetModules();
  });
  const load = () => import("@/lib/data");

  it("uses the data link on Vercel, signed with the deployment's own environment", async () => {
    delete process.env.DATABASE_URL;
    Object.assign(process.env, { DATA_LINK_URL: "https://link.test", DATA_LINK_SECRET: SECRET, VERCEL_ENV: "preview" });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (_u, init) => {
      expect((init!.headers as Record<string, string>)[HEADERS.environment]).toBe("preview");
      return new Response(encode({ ok: true, result: false }));
    });
    const { data, hasData } = await load();
    expect(hasData()).toBe(true);
    expect(await data().isChecker("a@b.c")).toBe(false);
    expect(data()).toBe(data());
    fetchSpy.mockRestore();
  });
  it("uses a direct database locally", async () => {
    Object.assign(process.env, { DATABASE_URL: process.env.TEST_DATABASE_URL });
    const { data, hasData } = await load();
    expect(hasData()).toBe(true);
    expect(typeof data().decisionsAll).toBe("function");
  });
  it("with neither, it has no data and says so", async () => {
    delete process.env.DATABASE_URL;
    delete process.env.DATA_LINK_URL;
    const { data, hasData } = await load();
    expect(hasData()).toBe(false);
    expect(() => data()).toThrow(/No database or data link/);
  });
});

describe("the Lambda's bundle", () => {
  it("carries exactly the repository's migrations (run npm run datalink:build after adding one)", () => {
    expect(readFileSync(new URL("../../datalink/migrations.json", import.meta.url), "utf8")).toBe(migrationsJson());
  });
});
