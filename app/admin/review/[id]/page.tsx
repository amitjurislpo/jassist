// Review one post: the current revision rendered with the public page's own templates (approved or not), the final
// search and sharing values readers never see on the page, and the decision buttons that fit its state.
import Link from "next/link";
import * as site from "@/site/render";
import { requireAdmin } from "@/lib/auth/session";
import { isChecker, latestDecision, loadReviewDoc } from "@/lib/review/server";
import { canDecide, effectiveState } from "@/lib/approval/machine";
import type { Post } from "@/lib/content/types";
import { isValidSlug } from "@/lib/blog/slug";
import { fromSanity } from "@/lib/blog/fromSanity";
import { DecisionPanel, RetryButton } from "@/components/admin/DecisionPanel";
import { decideAction, retryDeleteAction, retrySendBackAction } from "../actions";

function SeoPanel({ post, staticClash }: { post: Post; staticClash: boolean }) {
  const slugOk = isValidSlug(post.slug);
  const n = fromSanity({ ...post, slug: post.slug ?? "" }, site.SITE_URL);
  const external = new URL(n.seo.canonical).origin !== new URL(site.SITE_URL).origin;
  const warn = (t: React.ReactNode) => <strong className="adm-warn">⚠ {t}</strong>;
  const rows: [string, React.ReactNode][] = [
    ["Page title", n.seo.title],
    ["Description", n.seo.description],
    ["Share title", n.seo.shareTitle],
    ["Share description", n.seo.shareDescription],
    ["Share image", n.seo.shareImage ? <a href={n.seo.shareImage} target="_blank" rel="noopener noreferrer">{n.seo.shareImage}</a> : "None (no main image or share image)"],
    ["Canonical URL", external ? warn(<>Points to another site: {n.seo.canonical}</>) : n.seo.canonical],
    ["Focus keyword (editors only)", post.focusKeyword?.trim() || "—"],
    ["Web address", slugOk ? (staticClash ? warn(<>/blog/{post.slug} is also a built-in post. If approved, this post replaces it.</>) : `/blog/${post.slug}`) : warn(<>Invalid slug “{post.slug}”: this post will not be listed even if approved.</>)],
  ];
  return (
    <section aria-labelledby="seo-h" className="adm-col">
      <h2 id="seo-h">Search and sharing</h2>
      <table><tbody>{rows.map(([k, v]) => <tr key={k}><th scope="row" style={{ width: 220 }}>{k}</th><td>{v}</td></tr>)}</tbody></table>
    </section>
  );
}

function Preview({ post }: { post: Post }) {
  const n = fromSanity({ ...post, slug: isValidSlug(post.slug) ? post.slug : "preview" }, site.SITE_URL);
  // The exact HTML the public page would send. Sandboxed: no scripts run, so no analytics are counted.
  const doc = site.renderHtml(site.blogPost(n));
  return (
    <section aria-labelledby="pv-h" className="adm-col">
      <h2 id="pv-h">Preview (as readers will see it)</h2>
      <iframe title="Post preview" srcDoc={doc} sandbox="allow-same-origin" style={{ width: "100%", height: "80vh", border: "1px solid #3a4450", borderRadius: 8, background: "#151A20" }} />
    </section>
  );
}

export default async function ReviewItem({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = decodeURIComponent(raw);
  const admin = await requireAdmin("reviewView", `/admin/review/${encodeURIComponent(id)}`);
  const [doc, checker] = await Promise.all([loadReviewDoc(id), isChecker(admin.email)]);
  if (!doc) {
    return (
      <>
        <p><Link href="/admin/review">← Review</Link></p>
        <p className="adm-note">This post is not published in Sanity (it may have been sent back to its author or deleted).</p>
      </>
    );
  }
  const post = doc as unknown as Post;
  const latest = await latestDecision(doc._type, doc._id);
  const state = effectiveState(latest, doc._rev);
  const title = String(post.title ?? "(untitled)");
  const staticClash = site.STATIC_POSTS.some((p) => p.slug === post.slug);
  return (
    <>
      <p style={{ margin: 0 }}><Link href="/admin/review">← Review</Link></p>
      <div className="adm-col" style={{ gap: 6 }}>
        <span className="adm-tag" style={{ alignSelf: "flex-start" }}>Blog post · {state.toUpperCase()}</span>
        <h1>{title}</h1>
        <span className="adm-dim">Revision {doc._rev}{doc._updatedAt ? ` · published ${String(doc._updatedAt).slice(0, 16).replace("T", " ")} UTC` : ""}</span>
        {doc.deletionRequested ? <p className="adm-note warn" role="status">The author asked for this post to be deleted. It is already off the website. Approving deletes it from Sanity; rejecting sends it back to the author.</p> : null}
      </div>
      <DecisionPanel id={doc._id} type={doc._type} revision={doc._rev} title={title} slug={typeof post.slug === "string" ? post.slug : null} canDecide={canDecide(latest, doc._rev)} isChecker={checker && admin.can.reviewDecide} deletionRequested={!!doc.deletionRequested} email={admin.email} decide={decideAction} />
      {state === "rejected" ? <><p role="alert" className="adm-note warn">Rejected, but it has not been sent back to the author in Sanity yet. It is off the website.</p><RetryButton id={doc._id} type={doc._type} label="Send back to author" act={retrySendBackAction} /></> : null}
      {state === "approved" && doc.deletionRequested ? <><p role="alert" className="adm-note warn">Deletion approved, but the post is still in Sanity. It is off the website.</p><RetryButton id={doc._id} type={doc._type} label="Delete now" act={retryDeleteAction} /></> : null}
      <SeoPanel post={post} staticClash={staticClash} />
      <Preview post={post} />
    </>
  );
}
