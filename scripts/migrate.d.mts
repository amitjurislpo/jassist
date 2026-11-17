export type Migration = { name: string; sql: string; checksum: string };
export function listMigrations(dir?: string): Migration[];
export function looksPooled(url: string): boolean;
export function sslFor(url: string): false | { rejectUnauthorized: boolean };
export function migrate(opts: {
  url: string | undefined;
  environment: string;
  log?: (m: string) => void;
  migrations?: Migration[];
}): Promise<{ name: string; checksum: string }[]>;
