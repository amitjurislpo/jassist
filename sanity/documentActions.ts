// Studio document actions for approval-gated types. Work order Part 2 "Deletion" and
// "Workflow fields":
// - Unpublish is removed. A published document is removed only through "Request deletion".
// - Delete is offered only when the document has no published version (never-published or
//   rejected drafts can still be deleted).
// - Publishing clears any old checker feedback, so it never looks current after a resubmit
//   and never blocks publishing.
// Sanity's own review/workflow features are not used.
import { useDocumentOperation, type DocumentActionComponent, type DocumentActionsResolver } from "sanity";
import { GATED_TYPES } from "../lib/content/types";

const GATED = new Set<string>(GATED_TYPES);

export function deleteOnlyWhenUnpublished(original: DocumentActionComponent): DocumentActionComponent {
  const Guarded: DocumentActionComponent = (props) => {
    const description = original(props); // always call: the original may use hooks
    return props.published ? null : description;
  };
  Guarded.action = original.action;
  Guarded.displayName = "DeleteOnlyWhenUnpublished";
  return Guarded;
}

export function publishClearingFeedback(original: DocumentActionComponent): DocumentActionComponent {
  const Wrapped: DocumentActionComponent = (props) => {
    const description = original(props);
    const { patch } = useDocumentOperation(props.id, props.type);
    if (!description) return description;
    const hasFeedback = !!(props.draft as { reviewFeedback?: unknown } | null)?.reviewFeedback;
    return {
      ...description,
      onHandle: () => {
        if (hasFeedback) patch.execute([{ unset: ["reviewFeedback"] }]);
        description.onHandle?.();
      },
    };
  };
  Wrapped.action = original.action;
  Wrapped.displayName = "PublishClearingFeedback";
  return Wrapped;
}

export const resolveDocumentActions: DocumentActionsResolver = (prev, context) => {
  if (!GATED.has(context.schemaType)) return prev;
  return prev
    .filter((a) => a.action !== "unpublish")
    .map((a) => {
      if (a.action === "delete") return deleteOnlyWhenUnpublished(a);
      if (a.action === "publish") return publishClearingFeedback(a);
      return a;
    });
};
