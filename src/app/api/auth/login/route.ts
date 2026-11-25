import { NextResponse } from "next/server";

import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

type LoginInput = {
  email: string;
  password: string;
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    const ipLimit = checkRateLimit(`auth:login:ip:${clientIp}`, {
      limit: 20,
      windowMs: 15 * 60 * 1000,
    });

    if (!ipLimit.allowed) {
      return rateLimitResponse(
        ipLimit.retryAfterSeconds,
        "Too many sign-in attempts. Please wait a few minutes before trying again.",
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid request body.",
        },
        { status: 400 },
      );
    }

    if (
      typeof body !== "object" ||
      body === null
    ) {
      return NextResponse.json(
        {
          error: "Invalid request body.",
        },
        { status: 400 },
      );
    }

    const payload =
      body as Partial<LoginInput>;

    if (
      typeof payload.email !== "string" ||
      typeof payload.password !== "string"
    ) {
      return NextResponse.json(
        {
          error:
            "Email and password are required.",
        },
        { status: 400 },
      );
    }

    const email =
      payload.email.trim().toLowerCase();

    if (
      email.length === 0 ||
      email.length > 200 ||
      !isValidEmail(email)
    ) {
      return NextResponse.json(
        {
          error:
            "Please provide a valid email address.",
        },
        { status: 400 },
      );
    }

    const emailLimit = checkRateLimit(
      `auth:login:ip-email:${clientIp}:${email}`,
      {
        limit: 10,
        windowMs: 15 * 60 * 1000,
      },
    );

    if (!emailLimit.allowed) {
      return rateLimitResponse(
        emailLimit.retryAfterSeconds,
        "Too many sign-in attempts for this account. Please try again later.",
      );
    }

    if (
      payload.password.length < 1 ||
      payload.password.length > 128
    ) {
      return NextResponse.json(
        {
          error:
            "Please provide a valid password.",
        },
        { status: 400 },
      );
    }

    const users =
      await db.orm.public.User
        .where({
          email,
        })
        .select(
          "id",
          "email",
          "name",
          "passwordHash",
          "role",
        )
        .all();

    if (users.length === 0) {
      return NextResponse.json(
        {
          error:
            "Invalid email or password.",
        },
        { status: 401 },
      );
    }

    const user = users[0];

    const passwordValid =
      await verifyPassword(
        payload.password,
        user.passwordHash,
      );

    if (!passwordValid) {
      return NextResponse.json(
        {
          error:
            "Invalid email or password.",
        },
        { status: 401 },
      );
    }

    await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(
      "Login failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to sign you in right now.",
      },
      { status: 500 },
    );
  }
}