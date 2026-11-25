import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { expirePendingOrders } from "@/lib/orders/expire-pending-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();

  if (!secret) {
    return false;
  }

  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return false;
  }

  const supplied = authorization.slice("Bearer ".length).trim();

  const expectedBuffer = Buffer.from(secret);
  const suppliedBuffer = Buffer.from(supplied);

  if (expectedBuffer.length !== suppliedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, suppliedBuffer);
}

async function handleExpireOrdersCron(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await expirePendingOrders();

    return NextResponse.json(
      {
        success: true,
        result,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Order expiration cron failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Order expiration job failed.",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function GET(request: Request) {
  return handleExpireOrdersCron(request);
}

export async function POST(request: Request) {
  return handleExpireOrdersCron(request);
}
