import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    productId: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    await requireAdmin();

    const { productId } =
      await context.params;

    const id = Number(productId);

    if (!Number.isInteger(id)) {
      return NextResponse.json(
        {
          error:
            "Invalid product ID",
        },
        {
          status: 400,
        },
      );
    }

    const body =
      await request.json();

    const quantity = Number(
      body.quantity,
    );

    if (
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Quantity must be a non-negative integer",
        },
        {
          status: 400,
        },
      );
    }

    const product =
      await db.orm.public.Product
        .where({
          id,
        })
        .select("id", "name")
        .first();

    if (!product) {
      return NextResponse.json(
        {
          error:
            "Product not found",
        },
        {
          status: 404,
        },
      );
    }

    const existing =
      await db.orm.public.Inventory
        .where({
          productId: id,
        })
        .select(
          "id",
          "quantity",
          "reserved",
        )
        .first();

    const reserved =
      existing?.reserved ?? 0;

    if (quantity < reserved) {
      return NextResponse.json(
        {
          error:
            `Quantity cannot be lower than reserved stock (${reserved})`,
        },
        {
          status: 409,
        },
      );
    }

    let plan;

    if (existing) {
      plan = db.sql.public.inventory
        .update({
          quantity,
        })
        .where((fields, fns) =>
          fns.eq(
            fields.productId,
            id,
          ),
        )
        .returning(
          "id",
          "productId",
          "quantity",
          "reserved",
        )
        .build();
    } else {
      plan = db.sql.public.inventory
        .insert([
          {
            productId: id,
            quantity,
            reserved: 0,
          },
        ])
        .returning(
          "id",
          "productId",
          "quantity",
          "reserved",
        )
        .build();
    }

    const [inventory] =
      await db.runtime().query(
        plan,
      );

    return NextResponse.json({
      inventory,
    });
  } catch (error) {
    console.error(
      "Failed to update inventory:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to update inventory",
      },
      {
        status: 500,
      },
    );
  }
}