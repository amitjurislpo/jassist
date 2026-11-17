import type { Metadata } from "next";
import Link from "next/link";
import { getAdmin } from "@/lib/auth/session";
import "./admin.css";

// The admin area: never indexed, no analytics, never cached.
export const metadata: Metadata = { title: { absolute: "Admin · JurisAssistMe" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  return (
    <div className="adm-shell">
      <a href="#admin-main" className="adm-skip">Skip to content</a>
      <header className="adm-bar">
        <div className="adm-bar-in">
          <Link href="/admin" style={{ fontWeight: 700, color: "#EEF1F4", textDecoration: "none" }}>JurisAssist admin</Link>
          {admin ? (
            <nav aria-label="Admin" style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", alignItems: "center", fontSize: 15 }}>
              {admin.can.reviewView ? <Link href="/admin/review">Review</Link> : null}
              <Link href="/studio">Studio</Link>
              <span className="adm-dim">{admin.email}</span>
              <form action="/auth/sign-out" method="post"><button className="adm-btn" type="submit">Sign out</button></form>
            </nav>
          ) : null}
        </div>
      </header>
      <main id="admin-main" className="adm">{children}</main>
    </div>
  );
}
