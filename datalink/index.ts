// The Lambda's entry point (bundled by datalink/build.mjs). Its settings are the Lambda's own
// environment variables, set by scripts/datalink-config.sh from Doppler, never printed:
//   DATABASE_URL          this environment's database on the group instance (inside the VPC)
//   DATA_LINK_SECRET      the signing secret, the same value the site holds for this environment
//   JASSIST_ENVIRONMENT   "production" or "preview"
//   IAMJCG_CONSUMER_CREDENTIAL, RESEND_API_KEY   the site's settings it reads through this link (siteSettings)
import pg from "pg";
import { sslFor } from "../scripts/db-ssl.mjs";
import { migrate, type Migration } from "../scripts/migrate.mjs";
import { makeOps } from "../lib/data/operations";
import { createHandler } from "./handler";
import bundled from "./migrations.json";

let pool: pg.Pool | null = null;
const getPool = () =>
  (pool ??= new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslFor(process.env.DATABASE_URL!),
    max: 1, // one connection per Lambda instance
    idleTimeoutMillis: 60_000,
    connectionTimeoutMillis: 8_000,
    statement_timeout: 15_000,
  }));

// Release safety (the CTO's rules of 17 Nov 2026): what "ready" means for the trial copy. Every setting this
// function needs, and its database reachable with its own login. The data link calls no other service at run time.
// Returns plain reasons (never a value). Used only by a direct invoke (the release's proof), never through the function URL.
export async function readiness(env: NodeJS.ProcessEnv = process.env, query?: () => Promise<unknown>): Promise<string[]> {
  const out: string[] = [];
  if (!env.DATABASE_URL) out.push("DATABASE_URL is missing");
  if (!env.DATA_LINK_SECRET || env.DATA_LINK_SECRET.length < 32) out.push("DATA_LINK_SECRET is missing or shorter than 32 characters");
  if (env.JASSIST_ENVIRONMENT !== "production" && env.JASSIST_ENVIRONMENT !== "preview") out.push("JASSIST_ENVIRONMENT is missing or not production/preview");
  if (out.length) return out;
  try {
    await (query ? query() : getPool().query("select 1"));
  } catch {
    out.push("its database did not answer with its own login");
  }
  return out;
}

export const handler = createHandler({
  secret: process.env.DATA_LINK_SECRET,
  environment: process.env.JASSIST_ENVIRONMENT,
  ops: () => makeOps(getPool()),
  settings: () => process.env,
  readiness: () => readiness(),
  migrate: () =>
    migrate({ url: process.env.DATABASE_URL, environment: process.env.JASSIST_ENVIRONMENT!, migrations: bundled as Migration[] }),
});
