// One slug rule for Studio validation, slug generation and the public read path.
// Work order (10 Nov 2026), Part 2 "Slugs".

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SLUG_MAX_LENGTH = 96;

export function isValidSlug(value: unknown): value is string {
  return typeof value === "string" && value.length <= SLUG_MAX_LENGTH && SLUG_PATTERN.test(value);
}

/** Turns any text into a slug that passes SLUG_PATTERN, or "" when nothing usable is left. */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/g, "");
}

export function slugError(value: string): string {
  const suggestion = slugify(value);
  return suggestion
    ? `Use lower-case letters, digits and single hyphens only, for example "${suggestion}".`
    : "Use lower-case letters, digits and single hyphens only.";
}
