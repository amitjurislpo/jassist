// Builds the data link's Lambda: datalink/migrations.json (the migrations it may apply, checked
// by tests/unit/datalink-bundle.test.ts), then one bundled file and its zip in dist/datalink.
// Run: npm run datalink:build. Deployed by the release worker (scripts/release/jassist_release.py).
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { build } from "esbuild";
import { listMigrations } from "../scripts/migrate.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "dist", "datalink");

export function migrationsJson() {
  return JSON.stringify(listMigrations(), null, 2) + "\n";
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(path.join(root, "datalink", "migrations.json"), migrationsJson());
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  await build({
    entryPoints: [path.join(root, "datalink", "index.ts")],
    outfile: path.join(out, "index.mjs"),
    bundle: true,
    platform: "node",
    target: "node22",
    format: "esm",
    minify: false,
    sourcemap: false,
    legalComments: "none",
    // pg's optional native binding is not used; the Sanity client is only for the seed script's command line.
    external: ["pg-native", "@sanity/client"],
    banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
  });
  // The release worker zips the bundle itself (scripts/release/jassist_release.py): its build container has no zip.
  if (process.env.DATALINK_NO_ZIP === "1") {
    console.log(`built ${path.relative(root, path.join(out, "index.mjs"))}`);
  } else {
    execFileSync("zip", ["-q", "-j", "-X", path.join(out, "datalink.zip"), path.join(out, "index.mjs")]);
    console.log(`built ${path.relative(root, path.join(out, "datalink.zip"))}`);
  }
}
