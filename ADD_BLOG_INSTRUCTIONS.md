# Adding a new blog post (JurisAssistMe)

Use this when the user says "read the blog instruction file and add this blog" and gives a **PDF** (content + SEO metadata) and an **image**.
A new post means exactly two things: **(1)** a new entry in `src/blogs.js` (this generates the post page **and** the card on the `/blog` hub), **(2)** the image file. Do not redesign the hub or post layout.

The site is a static build: `src/*.js` + `build.js` write HTML into `public/`. Run `npm run build`, then `npm start` (http://localhost:3006).

## Hard rules

- **Do not commit or push** until the user explicitly says so. Show what changed and wait.
- Use the PDF text **verbatim**. Do not rewrite, shorten or "improve" the copy.
- Never invent an author, reviewer, credentials, statistics or client names. Posts are bylined "the JurisAssistMe team". If the PDF has an author, tell the user before using it.
- Do not use yellow keyword highlighting. `<strong>` the first natural occurrence of each target keyword only.
- Brand is **JurisAssistMe** (one word, capital J, A, M). Tagline: "Your Trusted Virtual Assistance Partner".
- Newest post goes **first** in the `BLOGS` array (the hub shows them in array order).

## 1. Read the PDF

Extract: H1, URL slug, meta title, meta description, keywords (primary, secondary, supporting), excerpt, featured-image alt text, the body, the FAQ list, the internal link map and the closing CTA text.

## 2. Image

1. Convert the supplied image to JPG (1600 px wide is ideal, 16:9 works best, quality ~82) and save as `public/images/blog/<slug>.jpg`. Note the width and height.
   (Playwright can be used for conversion if `sharp` is not installed: no extra dependency is added to this project.)
2. Alt text: the PDF's "Featured image alt text". If missing, write a plain descriptive alt and tell the user.

## 3. The entry in `src/blogs.js`

Copy the shape of the existing entry (`how-to-hire-a-virtual-assistant` is the worked example):

| Field | Source |
|---|---|
| `slug` | PDF URL slug (no leading/trailing slash). Page URL becomes `/blog/<slug>` |
| `tag` | short topic label, e.g. Hiring, Delegation, Finance support |
| `date` | publish date `YYYY-MM-DD` (today unless the PDF says otherwise) |
| `h1` | PDF H1 |
| `metaTitle` / `metaDesc` | PDF meta title / description (keep title about 60 chars, description about 155) |
| `keywords` | all keywords from the PDF |
| `excerpt` | PDF excerpt (used on the card and as the post's intro line) |
| `image` | `{ file, alt, width, height }` |
| `html` | the whole body (rules below). **Not** the FAQ |
| `faqs` | `[[question, answer], ...]` from the PDF. Plain text answers. **Exactly 6** (build.js caps at 6): if the PDF has more, keep the 6 most useful and tell the user; if fewer, ask the user or add strictly on-topic ones (real search questions, no invented facts). Never put FAQ content in `html` |

What the build produces automatically (do not hand-write any of this):
- hero: **"Back to Blog" button**, breadcrumb, tag, H1, excerpt (H1 and excerpt run the full content width), byline, date, read time, and **share icons** (Facebook, X, Pinterest, LinkedIn, WhatsApp, email)
- full-width banner image
- **sticky table of contents on the left, built from the `<h2>`s, with the article on the right**. The TOC **highlights the active section** (scroll-spy in `public/js/main.js`) and the clicked entry highlights immediately
- share icons and the Back button appear **only at the top** (not repeated at the end of the article)
- **no "Keep reading" section and no CTA section** on blog posts: the article ends with the table of contents column and the **FAQ section starts right below it. Questions are listed on the left (01-06, one under the other); the selected question and answer animate into a dark gold-bordered panel on the right with a "03 / 06" counter, progress bars and previous/next arrows. On mobile the answer opens inline under its question. Arrow keys work. Built automatically from `faqs`, never hand-written, as the very last section** (above the footer), plus Article + BreadcrumbList + FAQPage JSON-LD, canonical, Open Graph / Twitter image, keywords meta and the sitemap entry. Read time = (body + FAQ words) / 200, rounded up.

### Rules for the `html` string

- Section headings are plain `<h2>Heading</h2>`: **no attributes, no nested tags**. Every `<h2>` becomes a TOC entry. Sub-headings use `<h3>`.
- Allowed: `<p>`, `<ul>`, `<ol>`, `<strong>`, `<h3>`, tables, always wrapped as `<div class="tbl"><table><thead>...</thead><tbody>...</tbody></table></div>`. Table style (already in CSS, do not restyle): compact 14px text, equal-width columns, black header row with gold labels, first column is the row label (bold, tinted), **the last column is highlighted in gold as the recommended option** (put JurisAssistMe / the recommended choice last), 3-5 columns max, short cell text (a few words). On mobile it scrolls sideways inside its own box.
- Optional answer box at the very top (good for AEO/GEO): `<p class="answer"><strong>Quick answer:</strong> ...</p>`.
- Internal links use **single-quoted** hrefs: `<a href='/services/seo-management'>anchor</a>`.
- **Check every internal link target exists** (a page in `public/` after build: `/services/...`, `/industries/...`, `/solutions`, `/why-jurisassistme`, `/contact`, other `/blog/...`). If a target is missing, drop the link, keep the text and tell the user.
- Do not add links the PDF does not list.

## 4. SEO / GEO / AEO checklist (when writing or reviewing)

- H2s phrased as the questions people search; first sentence under each H2 answers it directly.
- One H1 only; title and description contain the primary keyword.
- FAQ questions are real search questions, answers 1-3 sentences.
- No made-up numbers; compare, define, list steps. Use tables for comparisons.

## 5. Verify before reporting

1. `npm run build` succeeds and `npm start` serves it.
2. `/blog` shows the new card **first** with image and alt; clicking opens `/blog/<slug>`.
3. On the post: "Back to Blog" works (top only), share icons are present (top only) and open the networks' share dialogs, one H1, TOC entries match the `<h2>`s, clicking an entry scrolls to it **and highlights it**, scrolling by hand moves the highlight, banner is full width and rounded, exactly 6 FAQs, starting right below the article, and no CTA or Keep-reading section, exactly one each of `Article`, `FAQPage`, `BreadcrumbList` JSON-LD, `og:image` and canonical are right, `/sitemap.xml` lists the URL.
4. Check 320, 375, 768, 1024 and 1440 px in a real browser: **no horizontal scroll**, TOC stacks above the article on tablet/mobile, tables scroll inside their box.
5. Look at the screenshots. Do not assume it renders correctly.

## 6. Report back

List: what was added, anything skipped or changed (missing links, author, alt text, image crop), and any PDF metadata the site cannot express. Then **stop and wait**. Do not commit or push until told.
