// SRS: work order Part 2 "Deletion" (Unpublish removed; Delete only without a published
// version) and "reviewFeedback ... must not look current after the author resubmits".
import { describe, expect, it, vi } from "vitest";

const patchExecute = vi.fn();
vi.mock("sanity", () => ({ useDocumentOperation: () => ({ patch: { execute: patchExecute } }) }));

const { resolveDocumentActions, deleteOnlyWhenUnpublished, publishClearingFeedback } = await import("@/sanity/documentActions");

const make = (action: string) => {
  const fn = Object.assign((): ReturnType<() => { label: string; onHandle: () => void }> => ({ label: action, onHandle: vi.fn() }), { action });
  return fn as unknown as Parameters<typeof deleteOnlyWhenUnpublished>[0];
};
const actions = ["publish", "unpublish", "delete", "discardChanges", "duplicate"].map(make);
const ctx = (schemaType: string) => ({ schemaType }) as Parameters<typeof resolveDocumentActions>[1];

describe("Studio document actions", () => {
  it.each(["post"])("%s: Unpublish removed, Delete and Publish wrapped", (t) => {
    const out = resolveDocumentActions(actions, ctx(t));
    expect(out.map((a) => a.action)).toEqual(["publish", "delete", "discardChanges", "duplicate"]);
  });
  it("other document types are untouched", () => {
    expect(resolveDocumentActions(actions, ctx("sanity.imageAsset"))).toBe(actions);
  });
  it("Delete is hidden when a published version exists, offered for drafts only", () => {
    const del = deleteOnlyWhenUnpublished(make("delete"));
    expect(del({ id: "p", type: "post", published: { _id: "p" }, draft: { _id: "drafts.p" } } as never)).toBeNull();
    expect(del({ id: "p", type: "post", published: null, draft: { _id: "drafts.p" } } as never)).toMatchObject({ label: "delete" });
  });
  it("Publish clears old checker feedback, then publishes", () => {
    const original = make("publish");
    const pub = publishClearingFeedback(original);
    const desc = pub({ id: "p", type: "post", published: null, draft: { reviewFeedback: { note: "x" } } } as never)!;
    desc.onHandle!();
    expect(patchExecute).toHaveBeenCalledWith([{ unset: ["reviewFeedback"] }]);
    patchExecute.mockClear();
    pub({ id: "p", type: "post", published: null, draft: { title: "t" } } as never)!.onHandle!();
    expect(patchExecute).not.toHaveBeenCalled();
  });
});
