import "server-only";
// Server configuration, read from environment variables. Every variable is documented in
// .env.example. Nothing here is ever sent to the browser except NEXT_PUBLIC_* values.

const read = (name: string): string | undefined => {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
};

export class ConfigError extends Error {}

export const env = {
  siteUrl: () => (read("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000").replace(/\/+$/, ""),
  /** "production" only on the production deployment. Preview and local are never indexed. */
  isProduction: () => read("VERCEL_ENV") === "production",

  /** Local development and tests only: a direct database. On Vercel the data link is used instead. */
  databaseUrl: () => read("DATABASE_URL"),

  /** The secured HTTPS link to the private group database (scripts/data-link.mjs). */
  dataLink: {
    url: () => read("DATA_LINK_URL"),
    secret: () => read("DATA_LINK_SECRET"),
    /** Signed into every request, so a preview can never be answered by production's Lambda. */
    environment: () => read("VERCEL_ENV") ?? read("APP_ENV"),
  },

  sanity: {
    projectId: () => read("NEXT_PUBLIC_SANITY_PROJECT_ID"),
    dataset: () => read("NEXT_PUBLIC_SANITY_DATASET") ?? "production",
    apiVersion: () => read("NEXT_PUBLIC_SANITY_API_VERSION") ?? "2025-02-19",
    readToken: () => read("SANITY_API_READ_TOKEN"),
    writeToken: () => read("SANITY_API_WRITE_TOKEN"),
    webhookSecret: () => read("SANITY_WEBHOOK_SECRET"),
  },

  auth: {
    sitaUrl: () => read("SITA_URL"),
    sitaReturnUrl: () => read("SITA_RETURN_URL"),
    iamjcgUrl: () => read("IAMJCG_URL"),
    // The IamJCG credential comes through the data link: lib/config/linked.ts.
    application: () => read("IAMJCG_APPLICATION") ?? "juris_assist",
    sessionSecret: () => read("SESSION_SECRET"),
    /** Preview only: sign-ins start with this prefix so production passes them on (see /auth/sita/return). */
    previewStatePrefix: () => "pv-",
    /** Production only: the one preview return address that production may pass a sign-in on to. */
    previewRelayUrl: () => read("SITA_PREVIEW_RELAY_URL"),
    /** Preview only: set to "true" so sign-ins are started for relay through production. */
    relayThroughProduction: () => read("SITA_RELAY_THROUGH_PRODUCTION") === "true",
  },
};

export function required(name: string, value: string | undefined): string {
  if (!value) throw new ConfigError(`${name} is not set.`);
  return value;
}
