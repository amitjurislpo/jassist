import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { isChecker, loadQueue } from "@/lib/review/server";
import { TYPE_LABELS } from "@/lib/content/types";
import type { QueueItem } from "@/lib/review/queue";

export default async function ReviewPage() {
  const admin = await requireAdmin("reviewView", "/admin/review");
  const checker = await isChecker(admin.email);
  let queue;
  try {
    queue = await loadQueue();
  } catch {
    return <p role="alert" className="adm-note warn">The review queue could not be loaded (Sanity or the database is not reachable). No Sanity post is shown on the website until approvals can be checked again.</p>;
  }
  const section = (title: string, items: QueueItem[], empty: string) => (
    <section aria-labelledby={`h-${title}`} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2 id={`h-${title}`} style={{ margin: 0, fontSize: 24 }}>{title} <span style={{ color: "#A7A3AE", fontWeight: 400 }}>({items.length})</span></h2>
      {items.length === 0 ? <p style={{ margin: 0, color: "#A7A3AE" }}>{empty}</p> : (
        <table>
          <thead><tr><th scope="col">Item</th><th scope="col">Type</th><th scope="col">Decision</th><th scope="col">Notes</th></tr></thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id + it.revision}>
                <td>{it.decision?.state === "rejected" && !it.sendBackPending ? it.title : <Link href={`/admin/review/${encodeURIComponent(it.id)}`}>{it.title}</Link>}</td>
                <td>{TYPE_LABELS[it.type] ?? it.type}</td>
                <td>{it.decision && it.decision.revision === it.revision ? `${it.decision.state} by ${it.decision.decidedBy}, ${it.decision.decidedAt.toISOString().slice(0, 16).replace("T", " ")} UTC` : it.decision?.state === "rejected" && title === "Rejected" ? `rejected by ${it.decision.decidedBy}` : "—"}</td>
                <td style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {it.deletionRequested ? <span className="adm-tag del">DELETION REQUEST</span> : null}
                  {it.sendBackPending ? <span className="adm-tag del">NOT YET SENT BACK</span> : null}
                  {it.deletePending ? <span className="adm-tag del">NOT YET DELETED</span> : null}
                  {it.decision?.state === "rejected" && title === "Rejected" && it.decision.reason ? <span style={{ color: "#C9C5CF" }}>“{it.decision.reason}”</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
  return (
    <>
      <h1>Review</h1>
      {checker ? null : <p role="status" className="adm-note">{admin.email} is not a content checker. You can view everything here, but you cannot approve or reject.</p>}
      <p className="adm-dim">Publishing in Studio sends work here. Nothing is public until a checker approves the exact version shown. Any later edit sends it back to Waiting.</p>
      {section("Waiting", queue.waiting, "Nothing is waiting.")}
      {section("Approved", queue.approved, "Nothing approved yet.")}
      {section("Rejected", queue.rejected, "Nothing rejected.")}
    </>
  );
}
