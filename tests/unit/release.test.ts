// Serves: the CTO's JurisAssist blog work order of 17 Nov 2026 and the Founding CTO's order of 11 Nov 2026 (given for
// Juris Academy, applied to JurisAssist the same way): built, deployed and synced only through the release worker's
// limited role, never the Admin user; and the CTO's release safety rules of 17 Nov 2026. The release steps are
// Python (the release worker carries no Node); their own tests run here.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("the release worker's steps for JurisAssist", () => {
  it("pass their own tests", () => {
    const run = spawnSync("python3", ["tests/release/jassist_release_test.py"], { encoding: "utf8" });
    expect(run.stderr).toMatch(/\nOK\s*$/);
    expect(run.status).toBe(0);
  });

  it("a Vercel build waits for the worker's data link rather than fail on migrations it does not hold yet", () => {
    const build = readFileSync("scripts/vercel-build.mjs", "utf8");
    expect(build).toMatch(/waiting for the release worker to deploy it/);
  });
});
