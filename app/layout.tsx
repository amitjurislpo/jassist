// Root layout for the pages Next.js renders with React: the admin area and the Studio. The public website is the
// static HTML in public/ plus the blog routes, which render the same templates (site/render.js).
import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
