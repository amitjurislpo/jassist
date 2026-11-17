// What an admin may do, by IamJCG permission in the application juris_assist (IAMJCG_APPLICATION).
// Approving or rejecting content needs BOTH review.decide here AND a row in our own blog_checker
// table (lib/approval/decide.ts): an IamJCG grant alone never lets anyone approve.
export const PERMISSIONS = {
  reviewView: "review.read",
  reviewDecide: "review.decide",
} as const;
export type Capability = keyof typeof PERMISSIONS;

export interface Admin {
  email: string;
  identityId: string;
  sessionId: string;
  can: Record<Capability, boolean>;
}

export function isAdmin(a: Pick<Admin, "can"> | null): boolean {
  return !!a && Object.values(a.can).some(Boolean);
}
