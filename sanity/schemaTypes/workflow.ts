// Workflow fields shared by every approval-gated document. Work order Part 2 "Workflow fields".
// There is deliberately no status or submitted-by field: approval state lives only in our database.
import { defineField } from "sanity";

export const reviewFeedbackField = defineField({
  name: "reviewFeedback",
  title: "Feedback from the checker",
  description: "Why this was sent back. Make the changes, then publish again to ask for a new review.",
  type: "object",
  readOnly: true,
  // Hidden until a checker has rejected the document. Cleared automatically when the author
  // publishes again (sanity/documentActions.ts), so it never looks current after a resubmit.
  hidden: ({ value }) => !(value as { note?: string } | undefined)?.note,
  fields: [
    defineField({ name: "note", title: "Feedback", type: "text", rows: 4 }),
    defineField({ name: "by", title: "Checker", type: "string" }),
    defineField({ name: "at", title: "When", type: "datetime" }),
    defineField({ name: "revision", title: "Revision reviewed", type: "string", hidden: true }),
  ],
});

export const deletionRequestedField = defineField({
  name: "deletionRequested",
  title: "Request deletion",
  description: "Tick and publish to ask a checker to delete this. It leaves the website straight away.",
  type: "boolean",
  initialValue: false,
});

/** reviewFeedback first in the form, deletionRequested last. */
export function withWorkflow<T>(fields: T[]): (T | typeof reviewFeedbackField | typeof deletionRequestedField)[] {
  return [reviewFeedbackField, ...fields, deletionRequestedField];
}
