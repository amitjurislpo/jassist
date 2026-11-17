// Blog post: every field the brief of 17 Nov 2026 lists, plus what the existing post pages show.
// Category is the short label on the card and post (the built-in posts call it "tag").
import { defineArrayMember, defineField, defineType } from "sanity";
import { isValidSlug, slugError, slugify, SLUG_MAX_LENGTH } from "../../lib/blog/slug";
import { withWorkflow } from "./workflow";

const imageWithAlt = (name: string, title: string, description?: string) =>
  defineField({
    name,
    title,
    description,
    type: "image",
    options: { hotspot: true },
    fields: [defineField({ name: "alt", title: "Alt text", description: "Describe the image for people who can't see it.", type: "string" })],
  });

export const post = defineType({
  name: "post",
  title: "Blog post",
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "seo", title: "SEO" },
  ],
  fields: withWorkflow([
    defineField({ name: "title", title: "Title", type: "string", group: "content", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      title: "Slug",
      description: "The post's web address after /blog/. Lower-case letters, digits and single hyphens only.",
      type: "slug",
      group: "content",
      options: { source: "title", maxLength: SLUG_MAX_LENGTH, slugify: (input: string) => slugify(input) },
      validation: (r) =>
        r.required().custom((v: { current?: string } | undefined) => {
          const current = v?.current ?? "";
          if (!current) return "A slug is required.";
          return isValidSlug(current) ? true : slugError(current);
        }),
    }),
    defineField({ name: "subtitle", title: "Subtitle", description: "Optional. Shown under the title. Left empty, the description is shown there.", type: "string", group: "content" }),
    defineField({
      name: "description",
      title: "Description / excerpt",
      description: "One or two sentences. Shown in the blog list and used for search and sharing.",
      type: "text",
      rows: 3,
      group: "content",
      validation: (r) => r.required(),
    }),
    { ...imageWithAlt("mainImage", "Main image"), group: "content" },
    defineField({ name: "author", title: "Author", description: "Optional. Shown as \"By …\". Left empty, the post says \"By the JurisAssistMe team\".", type: "string", group: "content" }),
    defineField({ name: "category", title: "Category", description: "A short label shown on the card and above the title, for example Hiring, Delegation or Finance support.", type: "string", group: "content", validation: (r) => r.max(40) }),
    defineField({ name: "tags", title: "Tags", description: "Keywords for search engines.", type: "array", group: "content", of: [defineArrayMember({ type: "string" })], options: { layout: "tags" } }),
    defineField({ name: "readTime", title: "Read time (minutes)", description: "Optional. Left empty, it is worked out from the text.", type: "number", group: "content", validation: (r) => r.min(1).max(120).integer() }),
    defineField({ name: "publishedAt", title: "Published date", description: "The date shown on the post. The blog lists newest first.", type: "datetime", group: "content" }),
    defineField({
      name: "body",
      title: "Body",
      description: "Use Heading 2 to 4. The page shows the title as the only H1.",
      type: "array",
      group: "content",
      of: [
        defineArrayMember({
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "Heading 2", value: "h2" },
            { title: "Heading 3", value: "h3" },
            { title: "Heading 4", value: "h4" },
            { title: "Quote", value: "blockquote" },
          ],
          lists: [
            { title: "Bullet", value: "bullet" },
            { title: "Numbered", value: "number" },
          ],
          marks: {
            decorators: [
              { title: "Bold", value: "strong" },
              { title: "Italic", value: "em" },
            ],
            annotations: [
              defineArrayMember({
                name: "link",
                title: "Link",
                type: "object",
                fields: [
                  defineField({
                    name: "href",
                    title: "URL",
                    type: "url",
                    validation: (r) => r.required().uri({ allowRelative: true, scheme: ["http", "https", "mailto", "tel"] }),
                  }),
                ],
              }),
            ],
          },
        }),
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({ name: "alt", title: "Alt text", type: "string" }),
            defineField({ name: "caption", title: "Caption", type: "string" }),
          ],
        }),
        defineArrayMember({ type: "table" }),
      ],
    }),
    defineField({
      name: "faq",
      title: "FAQ",
      description: "Question and answer pairs. Shown at the end of the post and added to search results data. Up to 10.",
      type: "array",
      group: "content",
      of: [
        defineArrayMember({
          type: "object",
          name: "faqItem",
          fields: [
            defineField({ name: "question", title: "Question", type: "string", validation: (r) => r.required() }),
            defineField({ name: "answer", title: "Answer", type: "text", rows: 3, validation: (r) => r.required() }),
          ],
          preview: { select: { title: "question", subtitle: "answer" } },
        }),
      ],
      validation: (r) => r.max(10),
    }),
    defineField({ name: "metaTitle", title: "Meta title", description: "Optional. Falls back to the post title.", type: "string", group: "seo" }),
    { ...imageWithAlt("metaOgImage", "Share image", "Optional. Falls back to the main image."), group: "seo" },
    defineField({ name: "ogTitle", title: "Share title", description: "Optional. Falls back to the meta title, then the post title.", type: "string", group: "seo" }),
    defineField({ name: "ogDescription", title: "Share description", description: "Optional. Falls back to the description.", type: "text", rows: 2, group: "seo" }),
    defineField({
      name: "canonicalOverride",
      title: "Canonical URL",
      description: "Optional. Falls back to this post's own address. Only set this if the post first appeared on another site.",
      type: "url",
      group: "seo",
      validation: (r) => r.uri({ scheme: ["https", "http"] }),
    }),
    defineField({ name: "focusKeyword", title: "Focus keyword", description: "For editors only. Never shown on the website.", type: "string", group: "seo" }),
  ]),
  orderings: [{ title: "Published date, newest", name: "publishedDesc", by: [{ field: "publishedAt", direction: "desc" }] }],
  preview: { select: { title: "title", subtitle: "slug.current", media: "mainImage" } },
});
