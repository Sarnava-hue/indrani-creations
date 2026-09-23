import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";

export async function requireAdmin() {
  const session = await getSession();

  if (!session) {
    redirect("/login?redirect=/admin");
  }

  if (session.role !== "ADMIN") {
    redirect("/account");
  }

  return session;
}