// SRS: work order Part 2 "Slugs".
import { describe, expect, it } from "vitest";
import { isValidSlug, slugError, slugify, SLUG_PATTERN } from "@/lib/blog/slug";

describe("slug rule", () => {
  it("is exactly the work order's pattern", () => {
    expect(SLUG_PATTERN.source).toBe("^[a-z0-9]+(?:-[a-z0-9]+)*$");
  });
  it.each(["a", "llm-in-us-legal-support", "6-words", "a1-b2-c3"])("accepts %s", (s) => expect(isValidSlug(s)).toBe(true));
  it.each(["/test", "Test", "a--b", "-a", "a-", "a_b", "a b", "", "é", "a/b", "a.b", "x".repeat(97)])("rejects %j", (s) => expect(isValidSlug(s)).toBe(false));
  it.each([null, undefined, 3, {}])("rejects non-strings %j", (s) => expect(isValidSlug(s)).toBe(false));
  it("slugify always produces a valid slug or empty", () => {
    expect(slugify("Do you need an LLM to work in U.S. legal support?")).toBe("do-you-need-an-llm-to-work-in-u-s-legal-support");
    expect(slugify("/test")).toBe("test");
    expect(slugify("  Café — Über!  ")).toBe("cafe-uber");
    expect(slugify("!!!")).toBe("");
    for (const s of ["A  B", "--x--", "x".repeat(200) + " y"]) expect(isValidSlug(slugify(s))).toBe(true);
  });
  it("explains the error with a suggestion", () => {
    expect(slugError("/test")).toContain('"test"');
    expect(slugError("///")).not.toContain('""');
  });
});
