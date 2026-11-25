import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import type { SessionPayload } from "@/lib/auth/types";
import { db } from "@/lib/db";

async function resolveAdminSession(): Promise<
  | { status: "ok"; session: SessionPayload }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
> {
  const session = await getSession();

  if (!session) {
    return { status: "unauthenticated" };
  }

  if (session.role !== "ADMIN") {
    return { status: "forbidden" };
  }

  // Re-check role in the database so demoted/deleted accounts lose access immediately.
  const user = await db.orm.public.User.where({
    id: session.userId,
  })
    .select("id", "email", "role")
    .first();

  if (!user) {
    return { status: "unauthenticated" };
  }

  if (user.role !== "ADMIN") {
    return { status: "forbidden" };
  }

  return {
    status: "ok",
    session: {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
  };
}

export async function requireAdmin(): Promise<SessionPayload> {
  const auth = await resolveAdminSession();

  if (auth.status === "unauthenticated") {
    redirect("/login?redirect=/admin");
  }

  if (auth.status === "forbidden") {
    redirect("/account");
  }

  return auth.session;
}

type AdminApiAuthResult =
  | { session: SessionPayload; response: null }
  | { session: null; response: NextResponse };

export async function requireAdminApi(): Promise<AdminApiAuthResult> {
  const auth = await resolveAdminSession();

  if (auth.status === "unauthenticated") {
    return {
      session: null,
      response: NextResponse.json(
        { error: "Admin authentication required." },
        { status: 401 },
      ),
    };
  }

  if (auth.status === "forbidden") {
    return {
      session: null,
      response: NextResponse.json(
        { error: "Admin access required." },
        { status: 403 },
      ),
    };
  }

  return {
    session: auth.session,
    response: null,
  };
}