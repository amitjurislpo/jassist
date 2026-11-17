import pg from "pg";
import { migrate } from "@/scripts/migrate.mjs";

const url = () => process.env.TEST_DATABASE_URL!;
let pool: pg.Pool | null = null;

/** A clean, migrated test database (all tables emptied; the audit table is recreated by migration). */
export async function freshDb(): Promise<pg.Pool> {
  const admin = new pg.Client({ connectionString: url() });
  await admin.connect();
  await admin.query("drop schema public cascade; create schema public;");
  await admin.end();
  await migrate({ url: url(), environment: "test", log: () => {} });
  pool ??= new pg.Pool({ connectionString: url(), max: 4 });
  return pool;
}
