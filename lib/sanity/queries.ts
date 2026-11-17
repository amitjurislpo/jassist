// GROQ queries. Published documents only: draft ids ("drafts.*") and version ids are excluded.
// Every projection returns _id, _type, _rev and deletionRequested for the visibility filter.

const PUBLISHED = `!(_id in path("drafts.**")) && !(_id in path("versions.**"))`;
const WORKFLOW = `_id, _type, _rev, _createdAt, _updatedAt, "deletionRequested": coalesce(deletionRequested, false)`;
const IMAGE = (field: string) => `"${field}": select(defined(${field}.asset) => {"url": ${field}.asset->url, "alt": ${field}.alt, "width": ${field}.asset->metadata.dimensions.width, "height": ${field}.asset->metadata.dimensions.height}, null)`;

export const POST_FIELDS = `${WORKFLOW}, title, "slug": slug.current, subtitle, description, ${IMAGE("mainImage")},
  "authorName": author, category, tags, readTime, publishedAt,
  "body": body[]{..., _type == "image" => {..., "url": asset->url, "width": asset->metadata.dimensions.width, "height": asset->metadata.dimensions.height}},
  "faq": faq[]{question, answer}, metaTitle, ${IMAGE("metaOgImage")}, ogTitle, ogDescription, canonicalOverride, focusKeyword, reviewFeedback`;

export const Q = {
  posts: `*[_type == "post" && ${PUBLISHED}] | order(coalesce(publishedAt, _createdAt) desc) { ${POST_FIELDS} }`,
  postBySlug: `*[_type == "post" && ${PUBLISHED} && slug.current == $slug] | order(_updatedAt desc) { ${POST_FIELDS} }`,
  /** Review page: every published gated document, uncached. */
  reviewQueue: `*[_type in $types && ${PUBLISHED}] | order(_updatedAt desc) { ${WORKFLOW}, "title": coalesce(title, "(untitled)"), "slug": slug.current }`,
  reviewDoc: `*[_id == $id && ${PUBLISHED}][0] {
    ${POST_FIELDS}
  }`,
  revision: `*[_id == $id && ${PUBLISHED}][0]._rev`,
};
