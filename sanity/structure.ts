import type { StructureResolver } from "sanity/structure";

export const structure: StructureResolver = (S) => S.list().title("JurisAssistMe").items([S.documentTypeListItem("post").title("Blog posts")]);
