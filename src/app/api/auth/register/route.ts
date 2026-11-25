import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

function isValidString(
  value: unknown,
  maxLength: number,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maxLength
  );
}

function isValidEmail(
  value: string,
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value,
  );
}

function isValidPassword(
  value: string,
): boolean {
  return (
    value.length >= 8 &&
    value.length <= 128
  );
}

export async function POST(
  request: Request,
) {
  try {
    const clientIp = getClientIp(request);

    const ipLimit = checkRateLimit(`auth:register:ip:${clientIp}`, {
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });

    if (!ipLimit.allowed) {
      return rateLimitResponse(
        ipLimit.retryAfterSeconds,
        "Too many registration attempts. Please try again later.",
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid request body.",
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
          error:
            "Invalid request body.",
        },
        { status: 400 },
      );
    }

    const payload =
      body as Partial<RegisterInput>;

    if (
      !isValidString(
        payload.name,
        100,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Please provide your name.",
        },
        { status: 400 },
      );
    }

    if (
      !isValidString(
        payload.email,
        200,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Please provide a valid email address.",
        },
        { status: 400 },
      );
    }

    const email =
      payload.email
        .trim()
        .toLowerCase();

    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          error:
            "Please provide a valid email address.",
        },
        { status: 400 },
      );
    }

    if (
      typeof payload.password !==
      "string"
    ) {
      return NextResponse.json(
        {
          error:
            "Please provide a password.",
        },
        { status: 400 },
      );
    }

    if (
      !isValidPassword(
        payload.password,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Password must be between 8 and 128 characters.",
        },
        { status: 400 },
      );
    }

    const existingUsers =
      await db.orm.public.User
        .where({
          email,
        })
        .select("id")
        .all();

    if (existingUsers.length > 0) {
      return NextResponse.json(
        {
          error:
            "An account with this email already exists.",
        },
        { status: 409 },
      );
    }

    const passwordHash =
      await hashPassword(
        payload.password,
      );

    const user =
      await db.orm.public.User.create({
        email,
        passwordHash,
        name:
          payload.name.trim(),
        role: "CUSTOMER",
      });

    await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Registration failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to create your account right now.",
      },
      { status: 500 },
    );
  }
}