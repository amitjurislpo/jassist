// Sanity Studio, embedded at /studio. Sanity is for writing only: publishing here does not make a post public.
// Approval happens on the site's own review page (/admin/review).
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { table } from "@sanity/table";
import { schemaTypes } from "./sanity/schemaTypes";
import { structure } from "./sanity/structure";
import { resolveDocumentActions } from "./sanity/documentActions";
import { sanityDataset, sanityProjectId } from "./sanity/env";

export default defineConfig({
  name: "jurisassistme",
  title: "JurisAssistMe",
  basePath: "/studio",
  projectId: sanityProjectId,
  dataset: sanityDataset,
  plugins: [structureTool({ structure }), table()],
  schema: { types: schemaTypes },
  document: { actions: resolveDocumentActions },
  // Sanity's own review, scheduling, task and release features are switched off: approval happens only on our
  // review page.
  scheduledPublishing: { enabled: false },
  tasks: { enabled: false },
  releases: { enabled: false },
  announcements: { enabled: false },
});
