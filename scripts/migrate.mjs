// Runs db/migrations/*.sql in order over a DIRECT database connection (never a pooler/proxy).
// Each migration runs in its own transaction under an advisory lock; a changed, already-applied
// file stops the run. Exits non-zero on any failure so the build fails and the current
// deployment stays live. Work order "Database and deployment".
//
// Safety: the database records which environment it belongs to ("production" or "preview").
// A run for one environment refuses to touch a database marked for the other.

import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { sslFor } from "./db-ssl.mjs";

export { sslFor };

const here = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(here, "..", "db", "migrations");
const LOCK_KEY = 7_316_220_261; // any fixed number; shared by every run of this migrator

export function listMigrations(dir = MIGRATIONS_DIR) {
  return readdirSync(dir)
    .filter((f) => /^\d{4}_[a-z0-9_]+\.sql$/.test(f))
    .sort()
    .map((name) => {
      const sql = readFileSync(path.join(dir, name), "utf8");
      return { name, sql, checksum: createHash("sha256").update(sql).digest("hex") };
    });
}

export function looksPooled(url) {
  const u = new URL(url);
  return u.port === "6543" || /pooler|pgbouncer|proxy-/i.test(u.hostname) || u.searchParams.has("pgbouncer");
}

export async function migrate({ url, environment, log = console.log, migrations }) {
  if (!url) throw new Error("DIRECT_DATABASE_URL is not set. Migrations need a direct connection.");
  if (looksPooled(url)) throw new Error("DIRECT_DATABASE_URL points at a pooler or proxy. Use the direct database endpoint.");
  if (!["production", "preview", "development", "test"].includes(environment)) throw new Error(`Unknown environment "${environment}".`);

  const client = new pg.Client({ connectionString: url, ssl: sslFor(url), statement_timeout: 120_000, connectionTimeoutMillis: 15_000 });
  await client.connect();
  try {
    await client.query("select pg_advisory_lock($1)", [LOCK_KEY]);
    await client.query(`create table if not exists schema_migrations (
      name text primary key, checksum text not null, applied_at timestamptz not null default now())`);
    await client.query(`create table if not exists environment_marker (
      only_row boolean primary key default true check (only_row), environment text not null)`);
    const marker = await client.query("select environment from environment_marker");
    if (marker.rowCount === 0) {
      await client.query("insert into environment_marker (environment) values ($1)", [environment]);
    } else if (marker.rows[0].environment !== environment) {
      throw new Error(`This database belongs to "${marker.rows[0].environment}", not "${environment}". Refusing to migrate.`);
    }

    const done = new Map((await client.query("select name, checksum from schema_migrations")).rows.map((r) => [r.name, r.checksum]));
    let applied = 0;
    for (const m of migrations ?? listMigrations()) {
      if (done.has(m.name)) {
        if (done.get(m.name) !== m.checksum) throw new Error(`Migration ${m.name} was changed after it was applied. Add a new migration instead.`);
        continue;
      }
      await client.query("begin");
      try {
        await client.query(m.sql);
        await client.query("insert into schema_migrations (name, checksum) values ($1, $2)", [m.name, m.checksum]);
        await client.query("commit");
      } catch (err) {
        await client.query("rollback");
        throw new Error(`Migration ${m.name} failed: ${err.message}`);
      }
      applied += 1;
      log(`applied ${m.name}`);
    }
    log(`migrations up to date (${applied} applied now)`);
    return (await client.query("select name, checksum from schema_migrations order by name")).rows;
  } finally {
    await client.query("select pg_advisory_unlock($1)", [LOCK_KEY]).catch(() => {});
    await client.end();
  }
}


if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrate({ url: process.env.DIRECT_DATABASE_URL, environment: process.env.APP_ENV || process.env.VERCEL_ENV || "development" }).catch((err) => {
    console.error(`MIGRATION FAILED: ${err.message}`);
    process.exit(1);
  });
}
