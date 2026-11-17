import "server-only";
// The site's settings that come through the data link (see linked-settings.ts for why and how).
import { linkCaller } from "../../scripts/data-link.mjs";
import { env } from "./env";
import { createLinkedSettings, type LinkedName } from "./linked-settings";

const store = globalThis as unknown as { jassistLinked?: (name: LinkedName) => Promise<string | undefined> };

function get(name: LinkedName): Promise<string | undefined> {
  store.jassistLinked ??= createLinkedSettings({
    read: (n) => process.env[n]?.trim() || undefined,
    call: env.dataLink.url()
      ? () => linkCaller({ url: env.dataLink.url(), secret: env.dataLink.secret(), environment: env.dataLink.environment() })
      : null,
  });
  return store.jassistLinked(name);
}

export const linked = {
  /** JurisAssist's IamJCG consumer credential, signed by apps-1. */
  iamjcgCredential: () => get("IAMJCG_CONSUMER_CREDENTIAL"),
};
