export declare const MAX_SKEW_SECONDS: number;
export declare const HEADERS: { time: string; signature: string; environment: string };
export declare function encode(value: unknown): string;
export declare function decode(text: string): unknown;
export declare function sign(secret: string, environment: string, time: string, body: string): string;
export declare function verify(input: {
  secret: string | undefined;
  environment: string | undefined;
  headers: Record<string, string | undefined>;
  body: string;
  now?: number;
}): boolean;
export declare class DataLinkError extends Error {}
export type LinkCall = (op: string, args?: unknown[]) => Promise<unknown>;
export declare function linkCaller(input: {
  url: string | undefined;
  secret: string | undefined;
  environment: string | undefined;
  fetchImpl?: typeof fetch;
  now?: () => number;
  timeoutMs?: number;
}): LinkCall;
