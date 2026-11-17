import "server-only";
import pg from "pg";
import { env, required } from "../config/env";
import { sslFor } from "../../scripts/db-ssl.mjs";

// Local development and tests only: one small pool per server instance (DATABASE_URL). On Vercel
// the database is private and the site reaches it through the data link (lib/data).
const globalForPg = globalThis as unknown as { jassistPool?: pg.Pool };

export function db(): pg.Pool {
  if (!globalForPg.jassistPool) {
    const url = required("DATABASE_URL", env.databaseUrl());
    globalForPg.jassistPool = new pg.Pool({
      connectionString: url,
      ssl: sslFor(url),
      max: Number(process.env.DATABASE_POOL_MAX ?? 3),
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
      statement_timeout: 15_000,
    });
  }
  return globalForPg.jassistPool;
}
