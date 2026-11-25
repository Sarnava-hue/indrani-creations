import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

/**
 * Returns the authenticated customer's saved wishlist product IDs in a single
 * lightweight query, avoiding N+1 fan-out and unauthenticated 401 noise on
 * public storefront catalog pages.
 */
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({
        authenticated: false,
        productIds: [],
      });
    }

    const items = await db.orm.public.WishlistItem.where({
      userId: session.userId,
    })
      .select("productId")
      .all();

    return NextResponse.json({
      authenticated: true,
      productIds: items.map((item) => item.productId),
    });
  } catch (error) {
    console.error("Failed to fetch wishlist product IDs:", error);

    return NextResponse.json(
      { error: "Unable to retrieve wishlist state right now." },
      { status: 500 },
    );
  }
}
