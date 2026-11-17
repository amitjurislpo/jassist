// One-time Sanity project setup, run by the builder after the project exists.
// Needs SANITY_MANAGEMENT_TOKEN (Administrator) and NEXT_PUBLIC_SANITY_PROJECT_ID in the env
// (e.g. `doppler run --project juris_assist --config prd -- node scripts/setup-sanity.mjs`).
// Creates: private datasets "production" and "preview"; CORS origins with credentials; a Viewer
// and an Editor token; a webhook per dataset to /api/sanity/revalidate. Every secret goes straight
// into Doppler project DOPPLER_PROJECT (default "juris_assist") (prd and stg) through stdin. Nothing secret is printed.
// Safe to run twice: existing datasets, origins and hooks are left as they are; tokens are only
// created when Doppler does not already hold one.
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";

const PROJECT = process.env.DOPPLER_PROJECT || "juris_assist";
const P = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const T = process.env.SANITY_MANAGEMENT_TOKEN;
if (!P || !T) { console.error("Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_MANAGEMENT_TOKEN."); process.exit(1); }

const API = `https://api.sanity.io/v2021-06-07/projects/${P}`;
const call = async (method, url, body) => {
  const r = await fetch(url, { method, headers: { Authorization: `Bearer ${T}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  if (!r.ok && r.status !== 409) throw new Error(`${method} ${url.replace(P, "<project>")} -> ${r.status}`);
  return text ? JSON.parse(text) : null;
};
const dopplerHas = (key, cfg) => {
  try { return execFileSync("doppler", ["secrets", "get", key, "--project", PROJECT, "--config", cfg, "--plain"], { stdio: ["ignore", "pipe", "ignore"] }).length > 0; } catch { return false; }
};
const dopplerSet = (key, value, cfgs = ["prd", "stg"]) => {
  for (const cfg of cfgs) execFileSync("doppler", ["secrets", "set", key, "--project", PROJECT, "--config", cfg, "--silent"], { input: value, stdio: ["pipe", "ignore", "inherit"] });
  console.log(`stored ${key} in ${PROJECT}/${cfgs.join(", ")} (not shown)`);
};

const SITES = { production: "https://www.jurisassistme.com", preview: "https://preview.jurisassistme.com" };
const TYPES = ["post"];

// 1. Private datasets.
const existing = new Set((await call("GET", `${API}/datasets`)).map((d) => d.name));
for (const name of Object.keys(SITES)) {
  if (existing.has(name)) { await call("PATCH", `${API}/datasets/${name}`, { aclMode: "private" }); console.log(`dataset ${name}: set private`); }
  else { await call("PUT", `${API}/datasets/${name}`, { aclMode: "private" }); console.log(`dataset ${name}: created (private)`); }
}

// 2. CORS, with credentials (the embedded Studio signs in).
const origins = new Set((await call("GET", `${API}/cors`)).map((c) => c.origin));
for (const origin of [...Object.values(SITES), "http://localhost:3006"]) {
  if (!origins.has(origin)) await call("POST", `${API}/cors`, { origin, allowCredentials: true });
  console.log(`cors ${origin}: ok`);
}

// 3. Tokens: Viewer for all reads, Editor only for send-back and delete.
for (const [key, role, label] of [["SANITY_API_READ_TOKEN", "viewer", "jurisassist-site-read"], ["SANITY_API_WRITE_TOKEN", "editor", "jurisassist-site-write"]]) {
  if (dopplerHas(key, "prd")) { console.log(`${key}: already in Doppler, kept`); continue; }
  const t = await call("POST", `${API}/tokens`, { label, roleName: role });
  dopplerSet(key, t.key);
}
dopplerSet("NEXT_PUBLIC_SANITY_PROJECT_ID", P);

// 4. Webhooks: one per dataset, signed with a shared secret.
let secret;
if (dopplerHas("SANITY_WEBHOOK_SECRET", "prd")) {
  secret = execFileSync("doppler", ["secrets", "get", "SANITY_WEBHOOK_SECRET", "--project", PROJECT, "--config", "prd", "--plain"]).toString().trim();
} else {
  secret = randomBytes(32).toString("base64url");
  dopplerSet("SANITY_WEBHOOK_SECRET", secret);
}
const hooks = await call("GET", `https://api.sanity.io/v2021-10-04/hooks/projects/${P}`);
for (const [dataset, site] of Object.entries(SITES)) {
  const name = `jurisassist-revalidate-${dataset}`;
  if ((hooks ?? []).some((h) => h.name === name)) { console.log(`webhook ${name}: exists`); continue; }
  await call("POST", `https://api.sanity.io/v2021-10-04/hooks/projects/${P}`, {
    type: "document", name, url: `${site}/api/sanity/revalidate`, dataset, httpMethod: "POST", apiVersion: "v2025-02-19", includeDrafts: false,
    rule: { on: ["create", "update", "delete"], filter: `_type in ${JSON.stringify(TYPES)}`, projection: `{_type, "slug": slug.current}` },
    secret, isDisabledByUser: false,
  });
  console.log(`webhook ${name}: created`);
}
console.log("Sanity setup done.");
