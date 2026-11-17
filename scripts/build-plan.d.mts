export function migrationPlan(e: Record<string, string | undefined>): { action: "link" | "skip"; message: string };
export function schemaCheck(applied: { name: string; checksum: string }[], expected: { name: string; checksum: string }[]): string | null;
