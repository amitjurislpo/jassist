# JurisAssistMe

Your Trusted Virtual Assistance Partner. Marketing site for jurisassistme.com, with a blog that authors write in
Sanity Studio and that goes public only after a checker approves it on the site's own review page.

    npm ci
    cp .env.example .env.local   # fill in what you need (never commit secrets)
    npm run dev                  # builds public/ and serves on http://localhost:3006
    npm run check                # typecheck + lint + tests + production build

Tests need a local PostgreSQL database `jassist_test` (`createdb jassist_test`); set `TEST_DATABASE_URL` to use
another.

## Stack

- **Pages:** `build.js` + `site/render.js` + `src/` write the static pages into `public/`, as before. Next.js 16 (App
  Router, on Vercel) serves them at clean URLs (`next.config.ts` rewrites `/about` to `public/about.html`).
- **Rendered on request, with the same templates:** `/blog`, `/blog/<slug>` and `/sitemap.xml` (they change when a
  checker approves a post), and the 404 page for unknown addresses.
- **Studio:** Sanity Studio embedded at `/studio` (loaded in the browser only).
- **Review page:** `/admin/review`. Admin sign-in is through SITA, the group's sign-in service, with permissions from
  IamJCG (application `juris_assist`).
- **Database:** the group's private AWS RDS PostgreSQL. On Vercel the site reaches it only through the data link: a
  Lambda inside the group VPC with an HTTPS address that runs a fixed list of named operations and accepts only
  requests signed for its own environment (`infra/datalink/README.md`). Plain SQL migrations in `db/migrations`.

## How a blog post goes live

1. An author writes in Studio (`/studio`) and presses **Publish**. That does **not** make it public: it appears on
   the review page (`/admin/review`) under **Waiting**, and its address still returns 404.
2. A checker opens it and sees the exact version, rendered with the public page's own templates, plus the final
   page title, share title, share description, share image, canonical URL (marked if it points to another site) and
   focus keyword.
3. **Approve** (only while it is waiting): it is public on the next request. Nothing is written to Sanity.
4. A post is public only if its latest decision is "approved" **and** was made at its current Sanity revision
   (`_rev`). Any later edit changes the revision, so it leaves the site and is Waiting again. There is no background
   job: the revision change is the transition.
5. **Reject** (feedback required): the decision is recorded first, then, in one Sanity transaction, the published
   document is removed and put back as a draft carrying the feedback. If Sanity fails, it stays off the site, the
   review page warns, and **Send back to author** retries.
6. Every decision is checked again on the server: a valid admin session, a row in the checker table, the reviewed
   revision still current (read uncached), and the state machine (only Waiting can move to Approved or Rejected).
   The latest decision per post is in `approval`; every transition is a line in `approval_audit`, which a trigger
   keeps append-only.
7. If the approval lookup fails, no Sanity post is shown (the built-in posts still are). If Sanity is unset or down,
   the site works and shows the built-in posts.

Public reads are cached for about 60 seconds, so edits and outside deletions are noticed within that window; a
Sanity webhook (`/api/sanity/revalidate`) clears the cache at once when it fires. Every decision clears the Sanity
cache and the approval cache together, plus `/blog`, the post and `/sitemap.xml`.

**Built-in posts** (`src/blogs.js`, see `ADD_BLOG_INSTRUCTIONS.md`) keep working and look the same. If a Sanity post
uses the same slug as a built-in post, the approved Sanity post wins; the review page warns the checker first.

### Roles

- **Authors** are members of the Sanity project. To invite one: sanity.io/manage → project **JurisAssist** →
  **Members** → **Invite members** → their email → role **Editor** → send. They sign in at
  `https://www.jurisassistme.com/studio` (opening the Studio from the site needs a SITA sign-in with the JurisAssist
  Author or Administrator role; Sanity then signs them in to their own Sanity account).
- **Checkers** are admins of this site (the JurisAssist Administrator role in IamJCG) **and** rows in the
  `blog_checker` table, lower-case emails, enforced by the database. Add or delete a row; no redeploy. Being an admin
  alone, or a Sanity user (even a Sanity administrator), gives no right to approve. An admin who is not a checker
  sees the review page read-only, with a message naming their email.
- **Keep authors out of `blog_checker`.** Sanity gives no reliable link between a Sanity author and a site account,
  so the site **does not** stop, per post, a checker from approving a post they wrote. Keeping the two lists apart is
  what prevents self-approval.

### Deleting a post

Unpublish is removed in Studio, and Delete only appears for posts that have no published version (never-published
drafts and rejected drafts can still be deleted). To remove a live post, the author ticks **Request deletion** and
publishes: it leaves the site at once and shows on the review page as a deletion request. Approving deletes it from
Sanity (if that fails, it stays off the site and **Delete now** retries); rejecting sends it back as a draft with
feedback.

**Known limit:** a Sanity project administrator can still delete a post through sanity.io or the API; the Studio
cannot prevent that. The post then disappears from the blog list, its page and the sitemap within the cache window
(about 60 seconds, or at once when the webhook fires), and it leaves the review queue.

### Slugs

One rule, `^[a-z0-9]+(?:-[a-z0-9]+)*$` (`lib/blog/slug.ts`), is used by Studio validation, slug generation and the
public read path. Studio rejects anything else (for example `/test`); an older post with a bad slug is never listed.

## Database and deploy

- `vercel.json` sets the build command to `npm run vercel-build`: `build.js`, then `scripts/vercel-build.mjs`, which
  asks the data link to apply the migrations bundled into its Lambda and checks the database has every migration the
  code expects before `next build`. Anything missing or failing fails the build, so the current deployment stays live.
- Production and preview each have their own Lambda and database, and each database records which environment it
  is, so a preview build can never migrate production.
- The checkers are seeded by `db/migrations/0002_seed_checkers.sql` (`on conflict do nothing`: safe to run twice).

## Build-time settings (`site/render.js`)

- `SHOW_CLIENT_LOGOS` (default `false`): the home-page client-logo strip and its caption are **not written to the HTML** while this is `false`. To turn them on, set it to `true`, replace the placeholder tiles that `public/js/main.js` fills into `#lgTrack` with approved logos, then rebuild. `main.js` is safe when `#lgTrack` is absent.
- `HOURS` (default `Mon–Fri, 9 AM – 6 PM ET`): the single source for business hours. It feeds the contact card, FAQs, the contact meta description and the Organization JSON-LD. Change it there only.
- Other contact constants: `EMAIL`, `PHONE_DISPLAY`, `PHONE_HREF` (the phone stays a `tel:` link).

## Team section

Members live in `src/team.js`. Put photos in `public/images/team/` (keep the full-size original, and use a 4:5 copy of about 600×750, under 150KB, named `<name>-600.jpg`). Bios are drafts until confirmed.

## 404 page

`build.js` generates `public/404.html` (noindex, not in `sitemap.xml`, no FAQ). The server returns the same page with
HTTP 404 for unknown addresses and for any blog post that is not public (`app/page-not-found`, `app/blog/[slug]`).

## Keeping the Vercel preview out of search engines

`next.config.ts` adds `X-Robots-Tag: noindex, nofollow` only when the host is `jassist.vercel.app`, so jurisassistme.com stays indexable. It also gives clean URLs (`/about.html` redirects to `/about`), no trailing slash, and the three permanent redirects (`/why-j-assist`, `/services/sales-lead-generation`, `/services/real-estate-support`). HTTPS and www/non-www redirects are handled in Vercel. `vercel.json` sets the framework, install and build commands, so the dashboard settings cannot override them. Pages carry no `noindex` meta tag (except privacy, terms and 404). The Studio, the admin area and sign-in are `noindex` by header and carry no analytics tag.

## Canonical domain, sitemap and robots

`SITE_URL` in `site/render.js` is `https://www.jurisassistme.com` (Vercel's primary domain; non-www redirects to it). Canonical tags, `sitemap.xml`, `robots.txt` and JSON-LD all derive from it, so they always agree. `sitemap.xml` lists every indexable page; privacy, terms and 404 are `noindex` and left out. `robots.txt` allows all and points to the sitemap. `robots.txt` is generated by `npm run build` into `public/`; `sitemap.xml` is generated on request from the data (pages, built-in posts and approved Sanity posts).

`robots.txt` also lists AI search crawlers (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, anthropic-ai, PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended) with an explicit `Allow: /`. Edit the `AI_BOTS` list in `site/render.js` to change it.
