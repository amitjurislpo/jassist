// The repo's build command on Vercel (vercel.json "buildCommand"). Work order "Database and deployment":
// - Production builds migrate the production database; preview builds only the preview database.
//   Both go through the data link (the group database is private, IamJCG D-94). Each Lambda holds
//   only its own environment's database, and the link signs the build's own VERCEL_ENV into every
//   request, so a preview build can never migrate production.
// - A failed or missing migration fails the build; Vercel then keeps the current deployment live.
// The decisions themselves are scripts/build-plan.mjs.
import { spawnSync } from "node:child_process";
import { listMigrations } from "./migrate.mjs";
import { migrationPlan, schemaCheck } from "./build-plan.mjs";
import { linkCaller } from "./data-link.mjs";

const plan = migrationPlan(process.env);
if (plan.action === "link") {
  console.log(plan.message);
  try {
    const call = linkCaller({ url: process.env.DATA_LINK_URL, secret: process.env.DATA_LINK_SECRET, environment: process.env.VERCEL_ENV, timeoutMs: 120_000 });
    // The release worker deploys the data link from the same merge (scripts/release/jassist_release.py) while
    // Vercel builds it. A build whose migrations the link does not hold yet waits for it, up to 15 minutes,
    // rather than fail; changed migrations never wait.
    const waitUntil = Date.now() + Number(process.env.DATALINK_WAIT_SECONDS ?? 900) * 1000;
    let problem = schemaCheck(await call("schemaMigrate"), listMigrations());
    while (problem && problem.includes("not applied:") && !problem.includes("changed after") && Date.now() < waitUntil) {
      console.log("The data link does not hold this build's migrations yet; waiting for the release worker to deploy it.");
      await new Promise((r) => setTimeout(r, 20_000));
      problem = schemaCheck(await call("schemaMigrate"), listMigrations());
    }
    if (problem) {
      console.error(problem);
      process.exit(1);
    }
    console.log("Migrations are up to date.");
  } catch (err) {
    console.error(`MIGRATION FAILED: ${err.message}`);
    process.exit(1);
  }
} else {
  console.warn(plan.message);
}

const build = spawnSync("npx", ["next", "build"], { stdio: "inherit", env: process.env });
process.exit(build.status ?? 1);
