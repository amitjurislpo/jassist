// IamJCG, the group's permissions service: who may sign in to this application and what
// they may do. Server to server, with this application's consumer credential.
// Every error means "no" (fail closed); a refusal is a 200 with allowed:false.

type Fetch = typeof fetch;

export interface IamjcgConfig {
  url: string;
  credential: string;
  application: string;
}

async function post<T>(cfg: IamjcgConfig, path: string, body: unknown, doFetch: Fetch): Promise<T | null> {
  try {
    const res = await doFetch(`${cfg.url.replace(/\/+$/, "")}${path}`, {
      method: "POST",
      headers: { authorization: `Bearer ${cfg.credential}`, "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export interface Resolved {
  identityId: string;
}

/** The person behind an email, if they may sign in to this application. */
export async function resolveEmail(cfg: IamjcgConfig, email: string, doFetch: Fetch = fetch): Promise<Resolved | null> {
  const v = await resolvePerson(cfg, email, doFetch);
  return v.ok ? { identityId: v.identityId } : null;
}

/**
 * As resolveEmail, but says why not: "access" when IamJCG answered and this person may not sign in here;
 * "unavailable" when IamJCG gave no answer for this site at all (it refused the site's own credential, or did
 * not answer), so nothing is known about the person and the sign-in page must not blame their account.
 */
export async function resolvePerson(
  cfg: IamjcgConfig, email: string, doFetch: Fetch = fetch,
): Promise<{ ok: true; identityId: string } | { ok: false; why: "access" | "unavailable" }> {
  if (!cfg.url || !cfg.credential) return { ok: false, why: "unavailable" };
  const r = await post<{ found?: boolean; identityId?: string | null; signInPermitted?: boolean; applicationGranted?: boolean }>(
    cfg, "/v1/resolveEmail", { email, application: cfg.application }, doFetch,
  );
  if (!r) return { ok: false, why: "unavailable" };
  if (!r.found || !r.signInPermitted || !r.applicationGranted || typeof r.identityId !== "string") return { ok: false, why: "access" };
  return { ok: true, identityId: r.identityId };
}

export async function check(cfg: IamjcgConfig, identityId: string, permission: string, doFetch: Fetch = fetch): Promise<boolean> {
  const r = await post<{ allowed?: boolean }>(cfg, "/v1/check", { ref: { kind: "identity", identityId }, permission: `${cfg.application}:${permission}` }, doFetch);
  return r?.allowed === true;
}
