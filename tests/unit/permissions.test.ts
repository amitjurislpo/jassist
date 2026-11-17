// Brief of 17 Nov 2026 "Roles": sign-in through SITA, permissions from IamJCG (application juris_assist);
// approving needs review.decide AND the site's own checker list.
import { afterEach, describe, expect, it } from "vitest";
import { PERMISSIONS, isAdmin } from "@/lib/auth/permissions";
import { COOKIES, safeNext } from "@/lib/auth/session";
import { env } from "@/lib/config/env";

describe("juris_assist in IamJCG", () => {
  const keep = process.env.IAMJCG_APPLICATION;
  afterEach(() => {
    if (keep === undefined) delete process.env.IAMJCG_APPLICATION;
    else process.env.IAMJCG_APPLICATION = keep;
  });
  it("asks about the application juris_assist unless told otherwise", () => {
    delete process.env.IAMJCG_APPLICATION;
    expect(env.auth.application()).toBe("juris_assist");
    process.env.IAMJCG_APPLICATION = "other_site";
    expect(env.auth.application()).toBe("other_site");
  });
  it("uses exactly the two permissions", () => {
    expect(Object.values(PERMISSIONS).sort()).toEqual(["review.decide", "review.read"]);
  });
  it("anyone holding any of them is an admin; nobody else", () => {
    const none = Object.fromEntries(Object.keys(PERMISSIONS).map((k) => [k, false])) as Record<keyof typeof PERMISSIONS, boolean>;
    expect(isAdmin({ can: none })).toBe(false);
    expect(isAdmin({ can: { ...none, reviewView: true } })).toBe(true);
    expect(isAdmin(null)).toBe(false);
  });
  it("its cookies are named for this application, so another site's never collide", () => {
    for (const name of Object.values(COOKIES)) expect(name).toMatch(/^juris_assist_/);
  });
});

describe("where sign-in may return to", () => {
  it("the admin area and the Studio only", () => {
    expect(safeNext("/admin/review")).toBe("/admin/review");
    expect(safeNext("/studio")).toBe("/studio");
    expect(safeNext("/studio/structure/post")).toBe("/studio/structure/post");
    for (const bad of ["/", "//evil.example/admin", "https://evil.example", "/studios", "/blog", 42]) expect(safeNext(bad)).toBe("/admin");
  });
});
