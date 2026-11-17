// Brief of 17 Nov 2026 "Studio fields" (every field present), slug rule in Studio, workflow
// fields (reviewFeedback first/read-only/hidden until rejected; "Request deletion"), no status field.
import { describe, expect, it } from "vitest";
import { schemaTypes } from "@/sanity/schemaTypes";

type F = { name: string; type: string; title?: string; readOnly?: boolean; hidden?: (a: { value: unknown }) => boolean; validation?: (r: unknown) => unknown; options?: { list?: string[] }; group?: string };
const t = (name: string) => schemaTypes.find((s) => s.name === name) as unknown as { fields: F[] };
const names = (type: string) => t(type).fields.map((f) => f.name);

// A tiny stand-in for Sanity's Rule builder that records custom validators.
function runValidation(field: F, value: unknown): unknown[] {
  const customs: ((v: unknown, ctx?: unknown) => unknown)[] = [];
  const rule: Record<string, unknown> = {};
  for (const m of ["required", "min", "max", "integer", "uri", "warning", "error"]) rule[m] = () => rule;
  rule.custom = (fn: (v: unknown) => unknown) => { customs.push(fn); return rule; };
  field.validation?.(rule);
  return customs.map((fn) => fn(value, {}));
}

describe("post fields", () => {
  it("has every field in the work order, workflow fields first and last", () => {
    expect(names("post")).toEqual([
      "reviewFeedback", "title", "slug", "subtitle", "description", "mainImage", "author", "category", "tags", "readTime", "publishedAt", "body", "faq",
      "metaTitle", "metaOgImage", "ogTitle", "ogDescription", "canonicalOverride", "focusKeyword", "deletionRequested",
    ]);
  });
  it("has no workflow status or submitted-by field", () => {
    expect(names("post").some((n) => /status|submitted/i.test(n))).toBe(false);
  });
  it("title, slug and description are required", () => {
    for (const n of ["title", "slug", "description"]) expect(t("post").fields.find((f) => f.name === n)!.validation).toBeTypeOf("function");
  });
  it("only blog posts are in the Studio", () => {
    expect(schemaTypes.map((s) => s.name)).toEqual(["post"]);
  });
  it("SEO fields are in the SEO group and optional", () => {
    for (const n of ["metaTitle", "metaOgImage", "ogTitle", "ogDescription", "canonicalOverride", "focusKeyword"]) expect(t("post").fields.find((f) => f.name === n)!.group).toBe("seo");
  });
  it("reviewFeedback is read-only and hidden until a checker rejects", () => {
    const f = t("post").fields[0];
    expect(f.readOnly).toBe(true);
    expect(f.hidden!({ value: undefined })).toBe(true);
    expect(f.hidden!({ value: { note: "" } })).toBe(true);
    expect(f.hidden!({ value: { note: "Fix it" } })).toBe(false);
  });
  it("deletionRequested is labelled 'Request deletion'", () => {
    expect(t("post").fields.at(-1)).toMatchObject({ name: "deletionRequested", type: "boolean", title: "Request deletion" });
  });
  it("Studio rejects a bad slug such as '/test' and accepts a good one", () => {
    const slug = t("post").fields.find((f) => f.name === "slug")!;
    expect(runValidation(slug, { current: "/test" })[0]).toMatch(/lower-case/);
    expect(runValidation(slug, { current: "Hello World" })[0]).toMatch(/"hello-world"/);
    expect(runValidation(slug, { current: "hello-world" })[0]).toBe(true);
    expect(runValidation(slug, undefined)[0]).toMatch(/required/);
  });
  it("body: H2-H4 and quote only (no H1), lists, bold, italic, links, images, tables", () => {
    const body = t("post").fields.find((f) => f.name === "body") as unknown as { of: { type: string; styles?: { value: string }[]; lists?: { value: string }[]; marks?: { decorators: { value: string }[]; annotations: { name: string }[] } }[] };
    const block = body.of.find((o) => o.type === "block")!;
    expect(block.styles!.map((s) => s.value)).toEqual(["normal", "h2", "h3", "h4", "blockquote"]);
    expect(block.lists!.map((s) => s.value)).toEqual(["bullet", "number"]);
    expect(block.marks!.decorators.map((s) => s.value)).toEqual(["strong", "em"]);
    expect(block.marks!.annotations.map((s) => s.name)).toEqual(["link"]);
    expect(body.of.map((o) => o.type)).toEqual(["block", "image", "table"]);
  });
});

