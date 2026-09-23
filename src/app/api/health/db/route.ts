import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/lib/db/health";

export async function GET() {
  try {
    const databaseConnected = await checkDatabaseConnection();

    if (!databaseConnected) {
      return NextResponse.json(
        {
          status: "error",
          database: "disconnected",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
      },
      { status: 503 }
    );
  }
}