import type { Metadata, Viewport } from "next";

// Studio: never indexed, no analytics. Authors sign in with their own Sanity account (they are members of the Sanity
// project); the datasets are private, so nobody else can read or write. Publishing here never makes a post public.
export const metadata: Metadata = { title: "Studio · JurisAssistMe", robots: { index: false, follow: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <div style={{ height: "100dvh" }}>{children}</div>;
}
