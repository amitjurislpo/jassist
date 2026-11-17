import Link from "next/link";
import { getAdmin } from "@/lib/auth/session";

const WHY: Record<string, string> = {
  signin: "The sign-in did not complete. Please try again.",
  unavailable: "Sign-in to the JurisAssist admin area is not working right now. Your account was not checked. Please try again later.",
  access: "This account is not set up for the JurisAssist admin area. Ask the Access Administrator to grant the JurisAssist Administrator role in IamJCG.",
};

export default async function Denied({ searchParams }: { searchParams: Promise<{ why?: string; need?: string }> }) {
  const { why, need } = await searchParams;
  const admin = await getAdmin();
  const message = why && WHY[why] ? WHY[why] : need ? `${admin?.email ?? "This account"} does not have permission to open that page.` : "You can’t open that page.";
  return (
    <>
      <h1>Not available</h1>
      <p role="alert" className="adm-note warn">{message}</p>
      <p><Link href="/auth/sita/start?next=/admin">Sign in again</Link> · <a href="/">Go to the website</a></p>
    </>
  );
}
