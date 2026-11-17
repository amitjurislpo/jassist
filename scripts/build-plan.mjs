// What the Vercel build does about migrations, as pure decisions (tested in tests/unit).
// The group database is private (IamJCG D-94), so a Vercel build cannot reach it directly: it asks
// the data link's Lambda, inside the VPC, to apply the migrations bundled into it.
// - Production or preview with a data link: migrate through the link, then check that the database
//   has every migration this build's code expects (schemaCheck). Anything missing FAILS the build,
//   so the site never runs on a database that is behind it; the current deployment stays live.
// - Production or preview with no data link yet: skip with a warning; the site runs without
//   database features (it fails closed).
// - Local or other builds: skip.
export function migrationPlan(e) {
  const target = e.VERCEL_ENV;
  if (target !== "production" && target !== "preview") return { action: "skip", message: "Not a Vercel production or preview build: skipping migrations." };
  if (e.DATA_LINK_URL) return { action: "link", message: `Running ${target} migrations through the data link.` };
  return { action: "skip", message: `WARNING: no ${target} data link is configured yet. Skipping migrations; database features are unavailable until DATA_LINK_URL and DATA_LINK_SECRET are set.` };
}

/** null when the database has every expected migration, unchanged; otherwise why the build must stop. */
export function schemaCheck(applied, expected) {
  const have = new Map(applied.map((m) => [m.name, m.checksum]));
  const missing = expected.filter((m) => !have.has(m.name)).map((m) => m.name);
  const changed = expected.filter((m) => have.has(m.name) && have.get(m.name) !== m.checksum).map((m) => m.name);
  if (!missing.length && !changed.length) return null;
  const parts = [];
  if (missing.length) parts.push(`not applied: ${missing.join(", ")} (the release worker deploys the data link with them: scripts/release/jassist_release.py)`);
  if (changed.length) parts.push(`changed after they were applied: ${changed.join(", ")}`);
  return `MIGRATION FAILED: the database is behind this build. ${parts.join("; ")}.`;
}
