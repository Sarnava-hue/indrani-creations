import { NextResponse } from "next/server";

import { destroySession } from "@/lib/auth/session";

export async function POST() {
  try {
    await destroySession();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Logout failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to sign you out right now.",
      },
      { status: 500 },
    );
  }
}