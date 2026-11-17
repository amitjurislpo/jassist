// The data link's Lambda: inside the group VPC, next to the private group database, reached by
// the site only over HTTPS (a Lambda function URL). See scripts/data-link.mjs for the rules.
//
// It answers one kind of request: POST, signed for this environment, naming an operation from
// lib/data/operations.ts (or schemaMigrate, which applies the migrations bundled into this
// Lambda and nothing else, or siteSettings, which gives the site the settings named in
// lib/config/linked-settings.ts and nothing else). Anything else is refused before the database is touched, and no
// error detail is ever sent back.
import { decode, encode, verify } from "../scripts/data-link.mjs";
import { isOpName, type DataOps } from "../lib/data/operations";
import { pickLinked, SITE_SETTINGS_OP } from "../lib/config/linked-settings";

export interface LinkEvent {
  body?: string | null;
  isBase64Encoded?: boolean;
  headers?: Record<string, string | undefined>;
  requestContext?: { http?: { method?: string } };
}

export interface LinkResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export interface HandlerConfig {
  secret: string | undefined;
  environment: string | undefined;
  ops: () => DataOps;
  migrate: () => Promise<{ name: string; checksum: string }[]>;
  /** This Lambda's own environment; only the settings named in lib/config/linked-settings.ts are given out. */
  settings?: () => Record<string, string | undefined>;
  /**
   * The release's proof (a trial copy, a published version, or the drill asking a live function): can this version do
   * its job. Reached only by a direct Lambda invoke, which needs AWS permission; never through the function URL.
   */
  readiness?: () => Promise<string[]>;
  now?: () => number;
  log?: (line: string) => void;
}

export const SCHEMA_MIGRATE = "schemaMigrate";

const reply = (statusCode: number, value: unknown): LinkResponse => ({
  statusCode,
  headers: { "content-type": "application/json", "cache-control": "no-store" },
  body: encode(value),
});

export function createHandler(cfg: HandlerConfig) {
  const log = cfg.log ?? ((line: string) => console.log(line));
  return async function handler(event: LinkEvent & { jcgReadiness?: boolean }): Promise<LinkResponse> {
    // Release safety (the CTO's rules of 17 Nov 2026, 1:05 and 1:35 pm): a trial copy, a new version or a live function
    // answers its readiness check (fixed text, reads nothing sensitive). A request through the function URL always
    // carries requestContext and can never reach this; a direct invoke needs AWS permission, which only the release role has.
    if (event.jcgReadiness === true && !event.requestContext) {
      const missing = cfg.readiness ? await cfg.readiness().catch(() => ["the readiness check itself failed"]) : ["no readiness check"];
      return reply(missing.length ? 503 : 200, { ok: missing.length === 0, missing });
    }
    if (event.requestContext?.http?.method !== "POST") return reply(405, { ok: false });
    const body = event.isBase64Encoded ? Buffer.from(event.body ?? "", "base64").toString("utf8") : (event.body ?? "");
    const headers = Object.fromEntries(Object.entries(event.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]));
    if (!verify({ secret: cfg.secret, environment: cfg.environment, headers, body, now: (cfg.now ?? Date.now)() })) {
      return reply(401, { ok: false });
    }
    let request: { op?: unknown; args?: unknown };
    try {
      request = decode(body) as { op?: unknown; args?: unknown };
    } catch {
      return reply(400, { ok: false });
    }
    const { op, args = [] } = request ?? {};
    if (!Array.isArray(args)) return reply(400, { ok: false });
    try {
      if (op === SCHEMA_MIGRATE) return reply(200, { ok: true, result: await cfg.migrate() });
      if (op === SITE_SETTINGS_OP) return reply(200, { ok: true, result: pickLinked(cfg.settings?.() ?? {}) });
      if (!isOpName(op)) return reply(404, { ok: false });
      const fn = cfg.ops()[op] as (...a: unknown[]) => Promise<unknown>;
      return reply(200, { ok: true, result: (await fn(...args)) ?? null });
    } catch (err) {
      // The reason stays in this Lambda's own log; the caller only learns that it failed.
      log(`operation ${String(op)} failed: ${err instanceof Error ? err.message : String(err)}`);
      return reply(500, { ok: false });
    }
  };
}
