// Brief of 17 Nov 2026: Studio body (H2-H4, quotes, bold, italic, lists, links, images, tables; no H1), SEO fallbacks
// rendered into the page HTML (title, description, canonical, Open Graph, Twitter, absolute share images), Article and
// Breadcrumb JSON-LD with FAQPage only when there are FAQs, one shared design for built-in and Sanity posts, and
// which post wins when a Sanity slug matches a built-in post.
import { describe, expect, it } from "vitest";
import * as site from "@/site/render";
import { bodyToHtml, safeHref } from "@/lib/blog/portableText";
import { fromSanity, mergePosts } from "@/lib/blog/fromSanity";
import type { Post } from "@/lib/content/types";

const SITE = "https://www.jurisassistme.com";
const span = (text: string, marks: string[] = []) => ({ _type: "span", _key: Math.random().toString(36).slice(2), text, marks });
const block = (style: string, children: unknown[], extra: Record<string, unknown> = {}) => ({ _type: "block", _key: Math.random().toString(36).slice(2), style, markDefs: [], children, ...extra });

const base: Post = {
  _id: "p1", _type: "post", _rev: "r1", _createdAt: "2026-11-15T10:00:00Z", _updatedAt: "2026-11-16T10:00:00Z",
  title: "TEST post: hiring <help>", slug: "test-post", description: "A & B description.", mainImage: { url: "https://cdn.sanity.io/images/x/production/main.jpg", alt: "Main alt", width: 1600, height: 900 },
  body: [block("h2", [span("First section")]), block("normal", [span("Hello")])],
};

describe("rich text to HTML", () => {
  it("renders headings, quote, marks, lists, links, images and tables, and never an H1", () => {
    const html = bodyToHtml([
      block("h1", [span("Sneaky H1")]),
      block("h2", [span("Why "), span("hire", ["strong"])]),
      block("h3", [span("Three")]),
      block("h4", [span("Four")]),
      block("blockquote", [span("Quoted")]),
      { ...block("normal", [span("bold", ["strong"]), span(" "), span("it", ["em"]), span(" "), span("link", ["l1"])]), markDefs: [{ _key: "l1", _type: "link", href: "/services" }] },
      block("normal", [span("one")], { listItem: "bullet", level: 1 }),
      block("normal", [span("two")], { listItem: "number", level: 1 }),
      { _type: "image", _key: "i", url: "https://cdn.sanity.io/images/x/production/a.jpg", alt: "An image", caption: "Cap", width: 800, height: 400 },
      { _type: "table", _key: "t", rows: [{ cells: ["Factor", "Us"] }, { cells: ["Cost", "<b>Low</b>"] }] },
    ]);
    expect(html).not.toMatch(/<h1/);
    expect(html).toContain("<h2>Sneaky H1</h2>");
    expect(html).toContain("<h2>Why hire</h2>"); // plain heading: it becomes a table-of-contents entry
    expect(html).toContain("<h3>Three</h3>");
    expect(html).toContain("<h4>Four</h4>");
    expect(html).toContain("<blockquote><p>Quoted</p></blockquote>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>it</em>");
    expect(html).toContain('<a href="/services">link</a>');
    expect(html).toMatch(/<ul><li>one<\/li><\/ul>/);
    expect(html).toMatch(/<ol><li>two<\/li><\/ol>/);
    expect(html).toMatch(/<figure class="bp-inline"><img src="https:\/\/cdn\.sanity\.io[^"]+" alt="An image" width="800" height="400"/);
    expect(html).toContain('<div class="tbl"><table><thead><tr><th>Factor</th><th>Us</th></tr></thead><tbody><tr><td>Cost</td><td>&lt;b&gt;Low&lt;/b&gt;</td></tr></tbody></table></div>');
  });
  it("escapes text and drops unsafe links", () => {
    const html = bodyToHtml([{ ...block("normal", [span("<script>x</script>", ["l"])]), markDefs: [{ _key: "l", _type: "link", href: "javascript:alert(1)" }] }]);
    expect(html).toBe("<p>&lt;script&gt;x&lt;/script&gt;</p>");
    expect(safeHref("//evil.example")).toBeNull();
    expect(safeHref("https://example.com")).toBe("https://example.com");
    expect(safeHref("mailto:a@b.c")).toBe("mailto:a@b.c");
  });
  it("empty body is empty", () => {
    expect(bodyToHtml(undefined)).toBe("");
    expect(bodyToHtml([])).toBe("");
  });
});

const head = (html: string) => html.slice(0, html.indexOf("</head>"));
const meta = (html: string, attr: string, key: string) => head(html).match(new RegExp(`<meta ${attr}="${key}" content="([^"]*)">`))?.[1];
const ld = (html: string) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));

describe("a Sanity post's page HTML", () => {
  it("with no SEO overrides: every tag falls back", () => {
    const html = site.renderHtml(site.blogPost(fromSanity(base as Post & { slug: string }, SITE)));
    expect(head(html)).toContain("<title>TEST post: hiring &lt;help></title>");
    expect(meta(html, "name", "description")).toBe("A &amp; B description.");
    expect(head(html)).toContain(`<link rel="canonical" href="${SITE}/blog/test-post">`);
    expect(meta(html, "property", "og:title")).toBe("TEST post: hiring &lt;help>");
    expect(meta(html, "property", "og:description")).toBe("A &amp; B description.");
    expect(meta(html, "property", "og:url")).toBe(`${SITE}/blog/test-post`);
    expect(meta(html, "property", "og:image")).toMatch(/^https:\/\/cdn\.sanity\.io\/images\/x\/production\/main\.jpg\?/);
    expect(meta(html, "name", "twitter:title")).toBe("TEST post: hiring &lt;help>");
    expect(meta(html, "name", "twitter:description")).toBe("A &amp; B description.");
    expect(meta(html, "name", "twitter:card")).toBe("summary_large_image");
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain("By the JurisAssistMe team");
    const types = ld(html).map((x) => x["@type"]);
    expect(types).toEqual(expect.arrayContaining(["Article", "BreadcrumbList"]));
    expect(types).not.toContain("FAQPage");
  });
  it("with every SEO override", () => {
    const post = { ...base, metaTitle: "Meta T", ogTitle: "OG T", ogDescription: "OG D", canonicalOverride: "https://elsewhere.example/orig", focusKeyword: "secret-keyword",
      metaOgImage: { url: "https://cdn.sanity.io/images/x/production/og.jpg", alt: "", width: 1200, height: 630 }, authorName: "Asha", faq: [{ question: "Q1?", answer: "A1 <b>" }] } as Post & { slug: string };
    const html = site.renderHtml(site.blogPost(fromSanity(post, SITE)));
    expect(head(html)).toContain("<title>Meta T</title>");
    expect(head(html)).toContain('<link rel="canonical" href="https://elsewhere.example/orig">');
    expect(meta(html, "property", "og:title")).toBe("OG T");
    expect(meta(html, "property", "og:description")).toBe("OG D");
    expect(meta(html, "property", "og:image")).toMatch(/og\.jpg/);
    expect(meta(html, "name", "twitter:title")).toBe("OG T");
    expect(html).not.toContain("secret-keyword"); // the focus keyword is for editors only
    expect(html).toContain("By Asha");
    expect(html).toContain("A1 &lt;b&gt;");
    const faq = ld(html).find((x) => x["@type"] === "FAQPage");
    expect(faq.mainEntity[0]).toEqual({ "@type": "Question", name: "Q1?", acceptedAnswer: { "@type": "Answer", text: "A1 <b>" } });
  });
  it("fields cleared to empty strings count as empty", () => {
    const post = { ...base, metaTitle: "", ogTitle: " ", ogDescription: "", canonicalOverride: "", subtitle: "", category: "", authorName: "" } as Post & { slug: string };
    const html = site.renderHtml(site.blogPost(fromSanity(post, SITE)));
    expect(head(html)).toContain("<title>TEST post: hiring &lt;help></title>");
    expect(head(html)).toContain(`<link rel="canonical" href="${SITE}/blog/test-post">`);
    expect(html).toContain("By the JurisAssistMe team");
    expect(html).toContain("<b>Blog</b>");
  });
  it("JSON-LD cannot be broken out of", () => {
    const html = site.renderHtml(site.blogPost(fromSanity({ ...base, title: "</script><script>alert(1)</script>" } as Post & { slug: string }, SITE)));
    expect(html).not.toContain("</script><script>alert(1)");
    expect(ld(html).find((x) => x["@type"] === "Article").headline).toBe("</script><script>alert(1)</script>");
  });
});

describe("built-in posts", () => {
  it("keep their page, with the share tags added", () => {
    const html = site.renderHtml(site.blogPost(site.STATIC_POSTS[0]));
    expect(head(html)).toContain(`<link rel="canonical" href="${SITE}/blog/how-to-hire-a-virtual-assistant">`);
    expect(meta(html, "property", "og:image")).toBe(`${SITE}/images/blog/how-to-hire-a-virtual-assistant.jpg`);
    expect(meta(html, "name", "twitter:title")).toBeTruthy();
    expect(ld(html).map((x) => x["@type"]).sort()).toEqual(["Article", "BreadcrumbList", "FAQPage"]);
  });
  it("a Sanity post with the same slug wins; otherwise newest first", () => {
    const s = fromSanity({ ...base, slug: "how-to-hire-a-virtual-assistant", publishedAt: "2026-01-01" } as Post & { slug: string }, SITE);
    const merged = mergePosts(site.STATIC_POSTS, [s]);
    expect(merged.filter((p) => p.slug === "how-to-hire-a-virtual-assistant")).toEqual([s]);
    const newer = fromSanity({ ...base, slug: "newer", publishedAt: "2030-01-01" } as Post & { slug: string }, SITE);
    expect(mergePosts(site.STATIC_POSTS, [newer])[0].slug).toBe("newer");
  });
  it("the list and sitemap include the posts they are given, and nothing else", () => {
    const one = fromSanity(base as Post & { slug: string }, SITE);
    const list = site.renderHtml(site.blogIndex([one, ...site.STATIC_POSTS]));
    expect(list).toContain('href="/blog/test-post"');
    const xml = site.sitemapXml([one], "2026-11-17");
    expect(xml).toContain(`<loc>${SITE}/blog/test-post</loc><lastmod>2026-11-16</lastmod>`);
    expect(xml).toContain(`<loc>${SITE}/blog</loc>`);
    expect(xml).not.toContain("how-to-hire");
    expect(xml).not.toMatch(/privacy-policy|terms-of-service|404/);
  });
});
