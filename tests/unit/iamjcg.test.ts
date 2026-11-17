// SRS: work order "Admin login: IAMJCG" (permissions from IamJCG, fail closed).
import { describe, expect, it, vi } from "vitest";
import { check, resolveEmail, resolvePerson } from "@/lib/auth/iamjcg";

const cfg = { url: "https://iam/", credential: "cred", application: "juris_assist" };
const reply = (body: unknown, status = 200) => vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch & { mock: { calls: unknown[][] } };

describe("IamJCG", () => {
  it("check sends the namespaced permission with the bearer credential", async () => {
    const f = reply({ allowed: true });
    expect(await check(cfg, "id1", "application.read", f)).toBe(true);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://iam/v1/check");
    expect(JSON.parse(String(init.body))).toEqual({ ref: { kind: "identity", identityId: "id1" }, permission: "juris_assist:application.read" });
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer cred");
  });
  it("check fails closed", async () => {
    expect(await check(cfg, "i", "p", reply({ allowed: false }))).toBe(false);
    expect(await check(cfg, "i", "p", reply({ error: "x" }, 401))).toBe(false);
    expect(await check(cfg, "i", "p", reply({}))).toBe(false);
    expect(await check(cfg, "i", "p", (async () => { throw new Error(); }) as unknown as typeof fetch)).toBe(false);
  });
  it("resolveEmail needs found, sign-in permitted and the application granted", async () => {
    const ok = { found: true, identityId: "id1", signInPermitted: true, applicationGranted: true };
    expect(await resolveEmail(cfg, "a@b", reply(ok))).toEqual({ identityId: "id1" });
    for (const k of ["found", "signInPermitted", "applicationGranted"]) expect(await resolveEmail(cfg, "a@b", reply({ ...ok, [k]: false }))).toBeNull();
    expect(await resolveEmail(cfg, "a@b", reply({ error: "application_not_registered" }, 400))).toBeNull();
  });

  it("resolvePerson blames the account only when IamJCG answered about it", async () => {
    const ok = { found: true, identityId: "id1", signInPermitted: true, applicationGranted: true };
    expect(await resolvePerson(cfg, "a@b", reply(ok))).toEqual({ ok: true, identityId: "id1" });
    expect(await resolvePerson(cfg, "a@b", reply({ ...ok, applicationGranted: false }))).toEqual({ ok: false, why: "access" });
    // IamJCG refused the site's own credential, failed, or has no credential to check: the account is not judged.
    expect(await resolvePerson(cfg, "a@b", reply({ error: "unauthorized" }, 401))).toEqual({ ok: false, why: "unavailable" });
    expect(await resolvePerson(cfg, "a@b", reply({}, 503))).toEqual({ ok: false, why: "unavailable" });
    expect(await resolvePerson({ ...cfg, credential: "" }, "a@b", reply(ok))).toEqual({ ok: false, why: "unavailable" });
  });
});
