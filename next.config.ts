import type { NextConfig } from "next";

const security = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
];
const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "private, no-store" }];

// Permanent redirects (formerly in vercel.json and server.js).
const MOVED: [string, string][] = [
  ["/why-j-assist", "/why-jurisassistme"],
  ["/services/sales-lead-generation", "/services"],
  ["/services/real-estate-support", "/industries/real-estate"],
];

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["pg"],
  images: { remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }] },
  experimental: { serverActions: { bodySizeLimit: "1mb" } },
  async headers() {
    return [
      { source: "/:path*", headers: security },
      // The Vercel address is never indexed; jurisassistme.com stays indexable.
      { source: "/:path*", has: [{ type: "host", value: "jassist.vercel.app" }], headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/admin", headers: noindex },
      { source: "/admin/:path*", headers: noindex },
      { source: "/studio", headers: noindex.slice(0, 1) },
      { source: "/studio/:path*", headers: noindex.slice(0, 1) },
      { source: "/auth/:path*", headers: noindex },
    ];
  },
  async redirects() {
    return [
      ...MOVED.map(([source, destination]) => ({ source, destination, permanent: true })),
      // Clean URLs, as Vercel's cleanUrls did: /about.html -> /about, /index.html -> /.
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/index", destination: "/", permanent: true },
      { source: "/:path((?!_next/).*)\\.html", destination: "/:path", permanent: true },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", destination: "/index.html" }],
      // /about -> public/about.html when that file exists; otherwise the routes below are tried.
      afterFiles: [{ source: "/:path((?!_next/|admin|studio|auth|api|blog|sitemap\\.xml).*)", destination: "/:path.html" }],
      // Anything still unknown gets the site's own 404 page, with a 404 status.
      fallback: [{ source: "/:path*", destination: "/page-not-found" }],
    };
  },
};

export default config;
