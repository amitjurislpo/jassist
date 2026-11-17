// Sanity rich text (Portable Text) to the same HTML the site's hand-written posts use (ADD_BLOG_INSTRUCTIONS.md):
// plain <h2> headings (they become the table of contents), <h3>/<h4>, paragraphs, lists, bold, italic, links,
// quotes, images and tables wrapped in <div class="tbl">. No H1: the page renders the title as the only H1.
// All text is escaped; a link is kept only if it is http(s), mailto, tel or a path on this site.
import { escapeHTML, toHTML, type PortableTextHtmlComponents } from "@portabletext/to-html";
import { sanityImage } from "../sanity/image";

export function safeHref(href: unknown): string | null {
  if (typeof href !== "string") return null;
  const h = href.trim();
  if (/^\/(?!\/)/.test(h)) return h;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(h)) return h;
  return null;
}

const attr = (v: string) => escapeHTML(v);
type Cell = string;
interface TableValue { rows?: { cells?: Cell[] }[] }
interface ImageValue { url?: string; alt?: string; caption?: string; width?: number; height?: number }

const components: Partial<PortableTextHtmlComponents> = {
  block: {
    normal: ({ children }) => (children && children.trim() ? `<p>${children}</p>` : ""),
    h1: ({ children }) => `<h2>${children}</h2>`, // never a second H1
    h2: ({ value }) => `<h2>${escapeHTML(plain(value))}</h2>`, // plain text: it becomes a table-of-contents entry
    h3: ({ children }) => `<h3>${children}</h3>`,
    h4: ({ children }) => `<h4>${children}</h4>`,
    blockquote: ({ children }) => `<blockquote><p>${children}</p></blockquote>`,
  },
  list: {
    bullet: ({ children }) => `<ul>${children}</ul>`,
    number: ({ children }) => `<ol>${children}</ol>`,
  },
  listItem: ({ children }) => `<li>${children}</li>`,
  marks: {
    strong: ({ children }) => `<strong>${children}</strong>`,
    em: ({ children }) => `<em>${children}</em>`,
    link: ({ children, value }) => {
      const href = safeHref((value as { href?: unknown } | undefined)?.href);
      if (!href) return children;
      const external = /^https?:\/\//i.test(href);
      return `<a href="${attr(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${children}</a>`;
    },
  },
  types: {
    image: ({ value }) => {
      const v = value as ImageValue;
      if (!v?.url) return "";
      const size = v.width && v.height ? ` width="${v.width}" height="${v.height}"` : "";
      return `<figure class="bp-inline"><img src="${attr(sanityImage(v.url, 860))}" alt="${attr(v.alt ?? "")}"${size} loading="lazy" decoding="async">${v.caption ? `<figcaption>${escapeHTML(v.caption)}</figcaption>` : ""}</figure>`;
    },
    table: ({ value }) => {
      const rows = ((value as TableValue)?.rows ?? []).map((r) => (r.cells ?? []).map((c) => escapeHTML(String(c ?? ""))));
      if (!rows.length) return "";
      const [head, ...body] = rows;
      return `<div class="tbl"><table><thead><tr>${head.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    },
  },
  hardBreak: () => "<br>",
  unknownType: () => "",
  unknownBlockStyle: ({ children }) => `<p>${children}</p>`,
  unknownMark: ({ children }) => children,
  unknownList: ({ children }) => `<ul>${children}</ul>`,
  unknownListItem: ({ children }) => `<li>${children}</li>`,
};

function plain(block: unknown): string {
  const children = (block as { children?: { text?: unknown }[] })?.children ?? [];
  return children.map((c) => (typeof c?.text === "string" ? c.text : "")).join("").replace(/\s+/g, " ").trim();
}

export function bodyToHtml(body: unknown): string {
  if (!Array.isArray(body) || !body.length) return "";
  return toHTML(body as Parameters<typeof toHTML>[0], { components, onMissingComponent: false }).replace(/<h2><\/h2>/g, "");
}
