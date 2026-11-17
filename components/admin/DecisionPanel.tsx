"use client";
// Approve / Reject (only when waiting) and the two retries. The server re-checks everything.
import { useActionState } from "react";
import type { Outcome } from "@/lib/review/workflow";

type Act = (prev: Outcome | null, form: FormData) => Promise<Outcome>;

function Result({ r }: { r: Outcome | null }) {
  if (!r) return null;
  return (
    <>
      <p role={r.ok ? "status" : "alert"} className={`adm-note ${r.ok ? "ok" : "warn"}`}>{r.message}</p>
      {r.warning ? <p role="alert" className="adm-note warn">{r.warning}</p> : null}
    </>
  );
}

export function DecisionPanel(props: {
  id: string; type: string; revision: string; title: string; slug: string | null;
  canDecide: boolean; isChecker: boolean; deletionRequested: boolean; email: string;
  decide: Act;
}) {
  const [res, act, pending] = useActionState(props.decide, null);
  const hidden = (
    <>
      <input type="hidden" name="id" value={props.id} />
      <input type="hidden" name="type" value={props.type} />
      <input type="hidden" name="revision" value={props.revision} />
      <input type="hidden" name="title" value={props.title} />
      <input type="hidden" name="slug" value={props.slug ?? ""} />
    </>
  );
  if (res?.ok) return <Result r={res} />;
  if (!props.canDecide) return <><Result r={res} /><p className="adm-note">This revision has already been decided. Approve and Reject come back when the author publishes a new version.</p></>;
  if (!props.isChecker) return <p role="status" className="adm-note">{props.email} is not a content checker, so Approve and Reject are not available. You can still read the preview. (Approving needs the JurisAssist Administrator role and a place on this site&apos;s checker list.)</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Result r={res} />
      <form action={act} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        {hidden}
        <input type="hidden" name="action" value="approve" />
        <button className="adm-btn primary" type="submit" disabled={pending}>{props.deletionRequested ? "Approve deletion" : "Approve"}</button>
        <span className="adm-dim">{props.deletionRequested ? "Deletes it from Sanity and the website." : "Goes live on the next page request."}</span>
      </form>
      <form action={act} style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 640 }}>
        {hidden}
        <input type="hidden" name="action" value="reject" />
        <label htmlFor="reason" style={{ fontWeight: 600 }}>Feedback for the author (required to reject)</label>
        <textarea id="reason" name="reason" className="adm-in" rows={4} required maxLength={2000} />
        <button className="adm-btn danger" type="submit" disabled={pending} style={{ alignSelf: "flex-start" }}>Reject and send back</button>
      </form>
    </div>
  );
}

export function RetryButton({ id, type, label, act }: { id: string; type: string; label: string; act: Act }) {
  const [res, run, pending] = useActionState(act, null);
  return (
    <form action={run} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="type" value={type} />
      <Result r={res} />
      {res?.ok ? null : <button className="adm-btn" type="submit" disabled={pending} style={{ alignSelf: "flex-start" }}>{label}</button>}
    </form>
  );
}
