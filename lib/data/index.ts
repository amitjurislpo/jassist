import "server-only";
// The site's one way to its data. On Vercel: the secured HTTPS data link to the Lambda inside the
// group VPC (the database is private). Locally and in tests: a direct database, same operations.
import { ConfigError, env } from "../config/env";
import { db } from "../db/pool";
import { linkCaller } from "../../scripts/data-link.mjs";
import { makeOps, remoteOps, type DataOps } from "./operations";

const cache = globalThis as unknown as { jassistData?: DataOps };

export function hasData(): boolean {
  return !!env.databaseUrl() || !!env.dataLink.url();
}

export function data(): DataOps {
  if (cache.jassistData) return cache.jassistData;
  if (env.databaseUrl()) return (cache.jassistData = makeOps(db()));
  if (env.dataLink.url()) {
    const call = linkCaller({ url: env.dataLink.url(), secret: env.dataLink.secret(), environment: env.dataLink.environment() });
    return (cache.jassistData = remoteOps(call));
  }
  throw new ConfigError("No database or data link is configured.");
}
