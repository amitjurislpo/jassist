"use server";
// Review decisions, enforced on the server (work order Part 2 "Decisions"). Each call re-checks
// the admin session, the checker table, the revision (uncached) and the state machine.
import { revalidatePath, updateTag } from "next/cache";
import { getAdmin } from "@/lib/auth/session";
import { ACTIONS, type DecisionAction } from "@/lib/approval/machine";
import { currentRevision, decisionStore, isChecker, latestDecision, loadReviewDoc } from "@/lib/review/server";
import { retryDelete, retrySendBack, runDecision, type Outcome, type WorkflowDeps } from "@/lib/review/workflow";
import { deleteFromSanity, sendBackToAuthor } from "@/lib/sanity/studioWrite";
import { TAGS, writeClient } from "@/lib/sanity/client";
import { GATED_TYPES } from "@/lib/content/types";

async function deps(): Promise<WorkflowDeps> {
  const admin = await getAdmin();
  return {
    actor: admin && admin.can.reviewView && admin.can.reviewDecide ? { email: admin.email } : null,
    isChecker,
    currentRevision,
    store: decisionStore(),
    sendBack: (id, feedback) => sendBackToAuthor(writeClient(), id, feedback),
    deleteDoc: (id) => deleteFromSanity(writeClient(), id),
    isDeletionRequest: async (id) => !!(await loadReviewDoc(id))?.deletionRequested,
    purge: (paths) => {
      updateTag(TAGS.content);
      updateTag(TAGS.approvals);
      for (const p of paths) revalidatePath(p);
      revalidatePath("/admin/review");
    },
  };
}

const text = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" ? v : "";
};
const isType = (t: string) => (GATED_TYPES as readonly string[]).includes(t);

export async function decideAction(_prev: Outcome | null, form: FormData): Promise<Outcome> {
  const action = text(form, "action") as DecisionAction;
  const objectType = text(form, "type");
  const objectId = text(form, "id");
  if (!ACTIONS.includes(action) || !isType(objectType) || !objectId) return { ok: false, message: "Bad request." };
  return runDecision(
    { objectType, objectId, reviewedRevision: text(form, "revision"), action, reason: text(form, "reason"), title: text(form, "title").slice(0, 300), slug: text(form, "slug") || null },
    await deps(),
  );
}

export async function retrySendBackAction(_prev: Outcome | null, form: FormData): Promise<Outcome> {
  const id = text(form, "id");
  const type = text(form, "type");
  if (!id || !isType(type)) return { ok: false, message: "Bad request." };
  return retrySendBack(id, type, { ...(await deps()), latest: () => latestDecision(type, id) });
}

export async function retryDeleteAction(_prev: Outcome | null, form: FormData): Promise<Outcome> {
  const id = text(form, "id");
  const type = text(form, "type");
  if (!id || !isType(type)) return { ok: false, message: "Bad request." };
  return retryDelete(id, type, { ...(await deps()), latest: () => latestDecision(type, id) });
}
