import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import type { SessionPayload } from "@/lib/auth/types";

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();

  if (!session) {
    redirect("/login?redirect=/admin");
  }

  if (session.role !== "ADMIN") {
    redirect("/account");
  }

  return session;
}

type AdminApiAuthResult =
  | { session: SessionPayload; response: null }
  | { session: null; response: NextResponse };

export async function requireAdminApi(): Promise<AdminApiAuthResult> {
  const session = await getSession();

  if (!session) {
    return {
      session: null,
      response: NextResponse.json(
        { error: "Admin authentication required." },
        { status: 401 },
      ),
    };
  }

  if (session.role !== "ADMIN") {
    return {
      session: null,
      response: NextResponse.json(
        { error: "Admin access required." },
        { status: 403 },
      ),
    };
  }

  return {
    session,
    response: null,
  };
}