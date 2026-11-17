// SRS: work order Part 2 "SEO" fallbacks, empty strings, share images absolute, JSON-LD.
import { describe, expect, it } from "vitest";
import { absoluteUrl, resolvePostSeo } from "@/lib/seo/meta";
import { articleSchema, breadcrumbSchema, faqSchema, serializeJsonLd } from "@/lib/seo/jsonld";

const SITE = "https://www.jurisassistme.com";
const base = { title: "Post title", slug: "post-title", description: "Desc." };

describe("post SEO fallbacks", () => {
  it("no overrides", () => {
    expect(resolvePostSeo(base, SITE)).toEqual({
      title: "Post title", description: "Desc.", shareTitle: "Post title", shareDescription: "Desc.", shareImage: null,
      canonical: "https://www.jurisassistme.com/blog/post-title", canonicalIsExternal: false, focusKeyword: null,
    });
  });
  it("main image becomes the share image", () => {
    expect(resolvePostSeo({ ...base, mainImageUrl: "https://cdn.sanity.io/m.jpg" }, SITE).shareImage).toBe("https://cdn.sanity.io/m.jpg");
  });
  it("all overrides", () => {
    const s = resolvePostSeo({ ...base, mainImageUrl: "https://cdn.sanity.io/m.jpg", metaTitle: "Meta", metaOgImageUrl: "https://cdn.sanity.io/og.jpg", ogTitle: "OG", ogDescription: "OG desc", canonicalOverride: "https://example.org/x", focusKeyword: "llm" }, SITE);
    expect(s).toMatchObject({ title: "Meta", shareTitle: "OG", shareDescription: "OG desc", shareImage: "https://cdn.sanity.io/og.jpg", canonical: "https://example.org/x", canonicalIsExternal: true, focusKeyword: "llm" });
  });
  it("ogTitle falls back to metaTitle before the title", () => {
    expect(resolvePostSeo({ ...base, metaTitle: "Meta" }, SITE).shareTitle).toBe("Meta");
  });
  it("fields cleared to empty or blank strings count as empty", () => {
    const s = resolvePostSeo({ ...base, metaTitle: "", ogTitle: "  ", ogDescription: "", canonicalOverride: " ", metaOgImageUrl: "", focusKeyword: "" }, SITE);
    expect(s).toMatchObject({ title: "Post title", shareTitle: "Post title", shareDescription: "Desc.", canonical: `${SITE}/blog/post-title`, shareImage: null, focusKeyword: null });
  });
  it("share images and canonicals are absolute", () => {
    expect(resolvePostSeo({ ...base, metaOgImageUrl: "/assets/x.png" }, SITE).shareImage).toBe(`${SITE}/assets/x.png`);
    expect(absoluteUrl(`${SITE}/`, "/a")).toBe(`${SITE}/a`);
  });
});

describe("JSON-LD", () => {
  const post = { title: "T", slug: "t", description: "D", image: "https://cdn.sanity.io/i.jpg", authorName: null, publishedAt: "2026-11-10", updatedAt: "2026-11-11", faq: [] };
  it("Article", () => {
    const a = articleSchema(post, SITE, { name: "JurisAssistMe", logoPath: "/logo.svg" });
    expect(a).toMatchObject({ "@type": "Article", headline: "T", mainEntityOfPage: { "@id": `${SITE}/blog/t` }, datePublished: "2026-11-10", dateModified: "2026-11-11", author: { "@type": "Organization" } });
    expect(a.publisher.logo.url).toBe(`${SITE}/logo.svg`);
  });
  it("Breadcrumb", () => {
    const b = breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }], SITE);
    expect(b.itemListElement[1]).toEqual({ "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` });
  });
  it("FAQPage only when there are entries", () => {
    expect(faqSchema([])).toBeNull();
    expect(faqSchema([{ question: "Q", answer: "A" }])?.mainEntity[0]).toEqual({ "@type": "Question", name: "Q", acceptedAnswer: { "@type": "Answer", text: "A" } });
  });
  it("cannot break out of the script tag", () => {
    const s = serializeJsonLd({ x: "</script><script>alert(1)</script>" + String.fromCharCode(0x2028) });
    expect(s).not.toContain("<");
    expect(s).not.toContain(String.fromCharCode(0x2028));
    expect(JSON.parse(s).x).toContain("</script>");
  });
});
