// The Founding CTO's order of 11 Nov 2026: "The site must receive its settings, including the IamJCG credential,
// without any person creating a token or touching the Vercel dashboard." The site reads them through the data
// link's signed siteSettings request; the Lambda gives out exactly the named settings and nothing else.
import { describe, expect, it } from "vitest";
import { createHandler } from "@/datalink/handler";
import { encode, decode, sign, HEADERS } from "@/scripts/data-link.mjs";
import { createLinkedSettings, LINKED_SETTINGS, pickLinked, SITE_SETTINGS_OP } from "@/lib/config/linked-settings";

const SECRET = "k".repeat(32);
const LAMBDA_ENV = {
  IAMJCG_CONSUMER_CREDENTIAL: "jwt.from.apps-1",
  DATABASE_URL: "postgres://never-given-out",
  DATA_LINK_SECRET: SECRET,
};

function lambda(environment = "production") {
  return createHandler({
    secret: SECRET,
    environment,
    ops: () => ({}) as never,
    migrate: async () => [],
    settings: () => LAMBDA_ENV,
    log: () => {},
  });
}

function signed(op: string, environment = "production", secret = SECRET) {
  const body = encode({ op, args: [] });
  const time = String(Math.floor(Date.now() / 1000));
  return {
    body,
    requestContext: { http: { method: "POST" } },
    headers: { [HEADERS.time]: time, [HEADERS.environment]: environment, [HEADERS.signature]: sign(secret, environment, time, body) },
  };
}

describe("the data link gives the site its settings", () => {
  it("names exactly the IamJCG credential", () => {
    expect([...LINKED_SETTINGS]).toEqual(["IAMJCG_CONSUMER_CREDENTIAL"]);
  });

  it("answers a signed siteSettings request with those two and never the database login or the link secret", async () => {
    const res = await lambda()(signed(SITE_SETTINGS_OP));
    expect(res.statusCode).toBe(200);
    const { result } = decode(res.body) as { result: Record<string, string> };
    expect(result).toEqual({ IAMJCG_CONSUMER_CREDENTIAL: "jwt.from.apps-1" });
    expect(res.body).not.toContain("postgres://");
    expect(res.body).not.toContain(SECRET);
  });

  it("refuses an unsigned request, a wrong secret, and a request signed for the other environment", async () => {
    expect((await lambda()({ ...signed(SITE_SETTINGS_OP), headers: {} })).statusCode).toBe(401);
    expect((await lambda()(signed(SITE_SETTINGS_OP, "production", "x".repeat(32)))).statusCode).toBe(401);
    expect((await lambda("production")(signed(SITE_SETTINGS_OP, "preview"))).statusCode).toBe(401);
  });

  it("leaves out a setting with no value", () => {
    expect(pickLinked({ IAMJCG_CONSUMER_CREDENTIAL: " ", OTHER: "x" })).toEqual({});
    expect(pickLinked({ IAMJCG_CONSUMER_CREDENTIAL: "jwt", DATABASE_URL: "never" })).toEqual({ IAMJCG_CONSUMER_CREDENTIAL: "jwt" });
  });
});

describe("the site reads them", () => {
  const link = (values: unknown, counter: { n: number }) => () => async (op: string) => {
    counter.n++;
    expect(op).toBe(SITE_SETTINGS_OP);
    if (values instanceof Error) throw values;
    return values;
  };

  it("uses its own value first, then the data link's", async () => {
    const c = { n: 0 };
    expect(await createLinkedSettings({ read: () => "own", call: link({ IAMJCG_CONSUMER_CREDENTIAL: "jwt" }, c) })("IAMJCG_CONSUMER_CREDENTIAL")).toBe("own");
    expect(c.n).toBe(0);
    expect(await createLinkedSettings({ read: () => undefined, call: link({ IAMJCG_CONSUMER_CREDENTIAL: "jwt" }, c) })("IAMJCG_CONSUMER_CREDENTIAL")).toBe("jwt");
  });

  it("asks the data link once per five minutes, so a changed value is in use within five minutes", async () => {
    const c = { n: 0 };
    let t = 0;
    let values: Record<string, string> = { IAMJCG_CONSUMER_CREDENTIAL: "old" };
    const get = createLinkedSettings({ read: () => undefined, call: () => async () => (c.n++, values), now: () => t });
    expect(await Promise.all([get("IAMJCG_CONSUMER_CREDENTIAL"), get("IAMJCG_CONSUMER_CREDENTIAL")])).toEqual(["old", "old"]);
    expect(c.n).toBe(1);
    values = { IAMJCG_CONSUMER_CREDENTIAL: "new" };
    t = 4 * 60_000;
    expect(await get("IAMJCG_CONSUMER_CREDENTIAL")).toBe("old");
    t = 5 * 60_000;
    expect(await get("IAMJCG_CONSUMER_CREDENTIAL")).toBe("new");
    expect(c.n).toBe(2);
  });

  it("keeps the last values when the data link does not answer, and has none to give before the first answer", async () => {
    const c = { n: 0 };
    const none = createLinkedSettings({ read: () => undefined, call: link(new Error("down"), c) });
    expect(await none("IAMJCG_CONSUMER_CREDENTIAL")).toBeUndefined();
    let t = 0;
    let fail = false;
    const get = createLinkedSettings({
      read: () => undefined,
      call: () => async () => {
        if (fail) throw new Error("down");
        return { IAMJCG_CONSUMER_CREDENTIAL: "re" };
      },
      now: () => t,
    });
    expect(await get("IAMJCG_CONSUMER_CREDENTIAL")).toBe("re");
    fail = true;
    t = 10 * 60_000;
    expect(await get("IAMJCG_CONSUMER_CREDENTIAL")).toBe("re");
  });

  it("has nothing where there is no data link and no own value", async () => {
    expect(await createLinkedSettings({ read: () => undefined, call: null })("IAMJCG_CONSUMER_CREDENTIAL")).toBeUndefined();
  });
});
