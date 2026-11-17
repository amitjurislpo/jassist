// SRS: work order Part 2 "Reject: ... in one transaction, delete the published document and
// create a draft with the same content plus the feedback"; "Approving deletes the post".
import { describe, expect, it } from "vitest";
import { createClient } from "@sanity/client";
import { deleteFromSanity, RevisionMoved, sendBackToAuthor } from "@/lib/sanity/studioWrite";

function fakeClient(docs: Record<string, Record<string, unknown>>) {
  const commits: unknown[] = [];
  const real = createClient({ projectId: "abc", dataset: "d", apiVersion: "2025-02-19", useCdn: false });
  const client = Object.assign(Object.create(real), {
    getDocument: async (id: string) => docs[id] ?? undefined,
    transaction: () => {
      const tx = real.transaction();
      return Object.assign(tx, { commit: async () => { commits.push(tx.serialize()); return {}; } });
    },
  });
  return { client, commits };
}
const feedback = { note: "Fix it", by: "c@x", at: "2026-11-10T10:00:00Z", revision: "r1" };

describe("send back to author", () => {
  it("one transaction: guard on the revision, create the draft with feedback, delete published", async () => {
    const { client, commits } = fakeClient({ p1: { _id: "p1", _type: "post", _rev: "r1", _createdAt: "c", _updatedAt: "u", title: "T", deletionRequested: true } });
    await sendBackToAuthor(client, "p1", feedback);
    expect(commits).toHaveLength(1);
    const muts = commits[0] as Record<string, unknown>[];
    expect(muts[0]).toMatchObject({ patch: { id: "p1", ifRevisionID: "r1" } });
    expect(muts[1]).toEqual({ create: { _id: "drafts.p1", _type: "post", title: "T", deletionRequested: true, reviewFeedback: feedback } });
    expect(muts[2]).toEqual({ delete: { id: "p1" } });
  });
  it("keeps an author's newer draft and only adds the feedback", async () => {
    const { client, commits } = fakeClient({ p1: { _id: "p1", _type: "post", _rev: "r1", title: "Old" }, "drafts.p1": { _id: "drafts.p1", _type: "post", title: "New work" } });
    await sendBackToAuthor(client, "p1", feedback);
    const muts = commits[0] as Record<string, unknown>[];
    expect(muts[1]).toMatchObject({ patch: { id: "drafts.p1", set: { reviewFeedback: feedback } } });
    expect(muts.some((m) => "create" in m)).toBe(false);
  });
  it("never removes a newer published version", async () => {
    const { client, commits } = fakeClient({ p1: { _id: "p1", _type: "post", _rev: "r2" } });
    await expect(sendBackToAuthor(client, "p1", feedback)).rejects.toBeInstanceOf(RevisionMoved);
    expect(commits).toHaveLength(0);
  });
  it("already sent back: nothing to do", async () => {
    const { client, commits } = fakeClient({});
    await sendBackToAuthor(client, "p1", feedback);
    expect(commits).toHaveLength(0);
  });
  it("delete removes published and draft together", async () => {
    const { client, commits } = fakeClient({});
    await deleteFromSanity(client, "p1");
    expect(commits[0]).toEqual([{ delete: { id: "p1" } }, { delete: { id: "drafts.p1" } }]);
  });
});
