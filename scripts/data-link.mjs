// The secured HTTPS link between the site (on Vercel) and its data (the group database, which
// is private and closed to the internet). The Founding CTO's decision of 10 Nov 2026 (D-94 in
// IamJCG's FRD), first for the Academy site and used the same way here: "the Academy site reaches its data on the group database only over a secured
// HTTPS link from a component inside our AWS network, with no new monthly cost and the database
// port closed to the internet."
//
// The component is a Lambda inside the group VPC (datalink/handler.ts). This file is the part both
// sides share: how values travel, and how every request is signed and checked.
//
//  - Only named operations travel (lib/data/operations.ts). There is no "run this SQL".
//  - Every request is signed with HMAC-SHA256 over environment, time and body, with a secret per
//    environment. A request more than five minutes old, for another environment, or with a wrong
//    signature is refused before anything runs.
//  - Dates and bytes are tagged so they arrive as Dates and bytes.
import { createHmac, timingSafeEqual } from "node:crypto";

export const MAX_SKEW_SECONDS = 300;
export const HEADERS = { time: "x-jassist-time", signature: "x-jassist-signature", environment: "x-jassist-environment" };

// ---- values ----

export function encode(value) {
  return JSON.stringify(value, function (key, v) {
    const raw = this[key];
    if (raw instanceof Date) return { $d: raw.toISOString() };
    if (raw instanceof Uint8Array) return { $b: Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength).toString("base64") };
    return v;
  });
}

export function decode(text) {
  return JSON.parse(text, (_key, v) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const keys = Object.keys(v);
      if (keys.length === 1 && typeof v.$d === "string") return new Date(v.$d);
      if (keys.length === 1 && typeof v.$b === "string") return new Uint8Array(Buffer.from(v.$b, "base64"));
    }
    return v;
  });
}

// ---- signing ----

export function sign(secret, environment, time, body) {
  return createHmac("sha256", secret).update(`${environment}\n${time}\n${body}`).digest("hex");
}

/** True only for a fresh request, signed with this secret, for this environment. */
export function verify({ secret, environment, headers, body, now = Date.now() }) {
  if (!secret || secret.length < 32 || !environment) return false;
  const time = headers[HEADERS.time];
  const given = headers[HEADERS.signature];
  if (headers[HEADERS.environment] !== environment) return false;
  if (typeof time !== "string" || !/^\d{10}$/.test(time) || typeof given !== "string" || !/^[0-9a-f]{64}$/.test(given)) return false;
  if (Math.abs(now / 1000 - Number(time)) > MAX_SKEW_SECONDS) return false;
  const want = Buffer.from(sign(secret, environment, time, body), "hex");
  return timingSafeEqual(want, Buffer.from(given, "hex"));
}

export class DataLinkError extends Error {}

/** A caller for the site: call(op, args) → the operation's result, or throws DataLinkError. */
export function linkCaller({ url, secret, environment, fetchImpl = fetch, now = () => Date.now(), timeoutMs = 15_000 }) {
  if (!url || !secret || !environment) throw new DataLinkError("The data link is not configured.");
  return async function call(op, args = []) {
    const body = encode({ op, args });
    const time = String(Math.floor(now() / 1000));
    let res;
    try {
      res = await fetchImpl(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          [HEADERS.time]: time,
          [HEADERS.environment]: environment,
          [HEADERS.signature]: sign(secret, environment, time, body),
        },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      throw new DataLinkError(`The data link did not answer (${op}).`);
    }
    const text = await res.text();
    let parsed = null;
    try {
      parsed = decode(text);
    } catch {
      parsed = null;
    }
    if (!res.ok || !parsed || parsed.ok !== true) throw new DataLinkError(`The data link refused ${op} (${res.status}).`);
    return parsed.result;
  };
}
