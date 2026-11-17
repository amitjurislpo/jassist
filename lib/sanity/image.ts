// Sized, compressed image URL from Sanity's image CDN (absolute https URL).
export function sanityImage(url: string, width: number, height?: number): string {
  const u = new URL(url);
  if (u.hostname !== "cdn.sanity.io") return url;
  u.searchParams.set("w", String(width * 2));
  if (height) {
    u.searchParams.set("h", String(height * 2));
    u.searchParams.set("fit", "crop");
  }
  u.searchParams.set("auto", "format");
  u.searchParams.set("q", "80");
  return u.toString();
}
