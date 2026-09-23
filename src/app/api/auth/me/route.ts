import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
        },
        { status: 200 },
      );
    }

    const users =
      await db.orm.public.User
        .where({
          id: session.userId,
        })
        .select(
          "id",
          "email",
          "name",
          "phone",
          "role",
        )
        .all();

    if (users.length === 0) {
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
        },
        { status: 200 },
      );
    }

    const user = users[0];

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(
      "Session lookup failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to retrieve your session.",
      },
      { status: 500 },
    );
  }
}