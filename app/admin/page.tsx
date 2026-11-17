import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin, requireAdmin } from "@/lib/auth/session";
import { isChecker } from "@/lib/review/server";

export default async function AdminHome() {
  const admin = await getAdmin();
  if (!admin) redirect("/auth/sita/start?next=/admin");
  if (!Object.values(admin.can).some(Boolean)) await requireAdmin("reviewView", "/admin");
  const checker = await isChecker(admin.email);
  return (
    <>
      <h1>Admin</h1>
      <p style={{ margin: 0 }}>Signed in as <strong>{admin.email}</strong>. {checker ? "You are a content checker: you can approve and reject." : "You are not a content checker: you can view the review page but not approve or reject."}</p>
      <ul className="adm-col" style={{ fontSize: 18 }}>
        {admin.can.reviewView ? <li><Link href="/admin/review">Review page</Link>: blog posts waiting for approval.</li> : null}
        <li><Link href="/studio">Sanity Studio</Link>: where authors write (Sanity asks them to sign in). Publishing there sends a post to the review page; it does not make it public.</li>
      </ul>
    </>
  );
}
