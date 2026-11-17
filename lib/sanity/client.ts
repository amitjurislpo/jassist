import "server-only";
import { createClient, type SanityClient } from "@sanity/client";
import { env } from "../config/env";

// Three clients, three jobs:
//  public  - cached, CDN, published documents only (about 60 s cache window). The datasets are
//            private, so even the public read uses the server-only Viewer token: an unapproved
//            post can never be read from Sanity's API by an outsider.
//  review  - uncached, no CDN, published documents only (the review page and decisions)
//  write   - Editor token, used only to send back (reject) and delete. Never in the browser.

export const CACHE_SECONDS = 60;
export const TAGS = { content: "sanity-content", approvals: "approvals" } as const;

export function sanityConfigured(): boolean {
  return !!env.sanity.projectId();
}

function base(opts: { useCdn: boolean; token?: string }): SanityClient {
  return createClient({
    projectId: env.sanity.projectId() ?? "unset",
    dataset: env.sanity.dataset(),
    apiVersion: env.sanity.apiVersion(),
    useCdn: opts.useCdn,
    token: opts.token,
    perspective: "published",
  });
}

export const publicClient = () => base({ useCdn: true, token: env.sanity.readToken() });
export const reviewClient = () => base({ useCdn: false, token: env.sanity.readToken() });

export class SanityWriteUnavailable extends Error {
  constructor() {
    super("The Sanity write token is not set, so the change could not be sent to Sanity.");
  }
}

export function writeClient(): SanityClient {
  const token = env.sanity.writeToken();
  if (!token || !sanityConfigured()) throw new SanityWriteUnavailable();
  return createClient({
    projectId: env.sanity.projectId()!,
    dataset: env.sanity.dataset(),
    apiVersion: env.sanity.apiVersion(),
    useCdn: false,
    token,
    perspective: "raw",
  });
}
