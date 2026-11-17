// TLS settings for Postgres, shared by the app (lib/db/pool.ts) and migrations.
// Local databases run without TLS. Amazon RDS hosts are verified against Amazon's RDS
// certificate bundle; any other host is verified against the system's trusted roots.
import { RDS_CA } from "./rds-ca.mjs";

export function sslFor(url) {
  const u = new URL(url);
  if (["localhost", "127.0.0.1"].includes(u.hostname) || u.searchParams.get("sslmode") === "disable") return false;
  const rejectUnauthorized = process.env.PG_SSL_REJECT_UNAUTHORIZED !== "false";
  return u.hostname.endsWith(".rds.amazonaws.com") ? { rejectUnauthorized, ca: RDS_CA } : { rejectUnauthorized };
}
