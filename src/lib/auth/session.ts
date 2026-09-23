import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import type {
  SessionPayload,
} from "@/lib/auth/types";

const SESSION_COOKIE = "indrani_session";

function getAuthSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error(
      "AUTH_SECRET is not configured.",
    );
  }

  return new TextEncoder().encode(secret);
}

export async function createSession(
  payload: SessionPayload,
) {
  const token =
    await new SignJWT({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    })
      .setProtectedHeader({
        alg: "HS256",
      })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(getAuthSecret());

  const cookieStore =
    await cookies();

  cookieStore.set(
    SESSION_COOKIE,
    token,
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    },
  );
}

export async function getSession():
  Promise<SessionPayload | null> {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      SESSION_COOKIE,
    )?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } =
      await jwtVerify(
        token,
        getAuthSecret(),
      );

    if (
      typeof payload.userId !==
        "number" ||
      typeof payload.email !==
        "string" ||
      (payload.role !==
        "CUSTOMER" &&
        payload.role !== "ADMIN")
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore =
    await cookies();

  cookieStore.delete(
    SESSION_COOKIE,
  );
}