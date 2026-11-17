// Settings the site reads through the data link, so they reach it with no Vercel token (the Founding CTO's
// order of 11 Nov 2026: "The site must receive its settings, including the IamJCG credential, without any
// person creating a token or touching the Vercel dashboard").
//
// The release worker copies these from Doppler into the data link Lambda's own environment
// (scripts/release/jassist_release.py, LINK_SETTINGS). The Lambda gives exactly these, and nothing else, to a
// request signed for its environment (datalink/handler.ts, siteSettings). The site keeps them in memory for
// five minutes, so a changed value is in use within five minutes, with no rebuild. A value set directly in
// the site's own environment (local development, tests) is used as it is.

export const LINKED_SETTINGS = ["IAMJCG_CONSUMER_CREDENTIAL"] as const;
export type LinkedName = (typeof LINKED_SETTINGS)[number];
export const SITE_SETTINGS_OP = "siteSettings";
export const LINKED_TTL_MS = 5 * 60_000;

/** Only the named settings that have a value: what the data link gives the site. */
export function pickLinked(source: Record<string, string | undefined>): Partial<Record<LinkedName, string>> {
  const out: Partial<Record<LinkedName, string>> = {};
  for (const k of LINKED_SETTINGS) {
    const v = source[k]?.trim();
    if (v) out[k] = v;
  }
  return out;
}

export interface LinkedDeps {
  /** The site's own environment. */
  read: (name: string) => string | undefined;
  /** The data link, or null where there is none. */
  call: (() => (op: string, args?: unknown[]) => Promise<unknown>) | null;
  now?: () => number;
  ttlMs?: number;
}

/** get(name): the site's own value, else the data link's (kept five minutes), else undefined. Never throws. */
export function createLinkedSettings(deps: LinkedDeps) {
  const now = deps.now ?? Date.now;
  const ttl = deps.ttlMs ?? LINKED_TTL_MS;
  let held: { values: Partial<Record<LinkedName, string>>; at: number } | null = null;
  let pending: Promise<void> | null = null;

  async function refresh(): Promise<void> {
    try {
      const result = await deps.call!()(SITE_SETTINGS_OP, []);
      const values = pickLinked((result ?? {}) as Record<string, string | undefined>);
      held = { values, at: now() };
    } catch {
      // The data link did not answer: keep what was held (if anything) and try again on the next request.
    }
  }

  return async function get(name: LinkedName): Promise<string | undefined> {
    const own = deps.read(name);
    if (own) return own;
    if (!deps.call) return undefined;
    if (!held || now() - held.at >= ttl) {
      pending ??= refresh().finally(() => {
        pending = null;
      });
      await pending;
    }
    return held?.values[name];
  };
}
