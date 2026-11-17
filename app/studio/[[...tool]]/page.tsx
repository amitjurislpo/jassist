"use client";
// The Studio loads in the browser only, so a missing project ID can never cause a server error.
import dynamic from "next/dynamic";
import { sanityProjectId } from "@/sanity/env";

const Studio = dynamic(() => import("./StudioClient"), { ssr: false, loading: () => <p style={{ padding: 24 }}>Loading Studio…</p> });

export default function StudioPage() {
  if (!sanityProjectId) return <p style={{ padding: 24 }}>Sanity is not set up for this deployment yet.</p>;
  return <Studio />;
}
