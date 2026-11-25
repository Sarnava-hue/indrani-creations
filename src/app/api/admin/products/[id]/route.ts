import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/auth/admin";
import { db } from "@/lib/db";

function parseId(value: string) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

function toPaise(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }

  return Math.round(value * 100);
}

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const { response } = await requireAdminApi();

    if (response) {
      return response;
    }

    const { id: rawId } = await context.params;
    const id = parseId(rawId);

    if (!id) {
      return NextResponse.json(
        { error: "Invalid product ID." },
        { status: 400 },
      );
    }

    const products = await db.orm.public.Product.where({ id })
      .select(
        "id",
        "categoryId",
        "name",
        "slug",
        "sku",
        "shortDescription",
        "description",
        "pricePaise",
        "compareAtPricePaise",
        "fabric",
        "color",
        "occasion",
        "pattern",
        "sareeLength",
        "blouseIncluded",
        "blouseDetails",
        "careInstructions",
        "isOneOfOne",
        "isActive",
        "isFeatured",
        "createdAt",
        "updatedAt",
      )
      .all();

    const product = products[0];

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    }

    const inventories = await db.orm.public.Inventory.where({ productId: id })
      .select("quantity", "reserved")
      .all();

    const inventory = inventories[0] ?? {
      quantity: 0,
      reserved: 0,
    };

    return NextResponse.json({
      product: {
        ...product,
        inventory,
      },
    });
  } catch (error) {
    console.error("Failed to fetch admin product:", error);

    return NextResponse.json(
      { error: "Unable to load product." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const { response } = await requireAdminApi();

    if (response) {
      return response;
    }

    const { id: rawId } = await context.params;
    const id = parseId(rawId);

    if (!id) {
      return NextResponse.json(
        { error: "Invalid product ID." },
        { status: 400 },
      );
    }

    const existingProducts = await db.orm.public.Product.where({ id })
      .select("id", "name", "slug", "sku")
      .all();

    const existing = existingProducts[0];

    if (!existing) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    }

    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const payload = body as Record<string, unknown>;

    const name = typeof payload.name === "string" ? payload.name.trim() : "";

    const sku =
      typeof payload.sku === "string" ? payload.sku.trim().toUpperCase() : "";

    const categoryId =
      typeof payload.categoryId === "number" ? payload.categoryId : 0;

    const pricePaise = toPaise(payload.price);

    const compareAtPricePaise =
      payload.compareAtPrice === null ||
      payload.compareAtPrice === undefined ||
      payload.compareAtPrice === ""
        ? null
        : toPaise(payload.compareAtPrice);

    const inventoryQuantity =
      typeof payload.inventoryQuantity === "number"
        ? Math.floor(payload.inventoryQuantity)
        : -1;

    if (!name) {
      return NextResponse.json(
        { error: "Product name is required." },
        { status: 400 },
      );
    }

    if (!sku) {
      return NextResponse.json({ error: "SKU is required." }, { status: 400 });
    }

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return NextResponse.json(
        { error: "A valid category is required." },
        { status: 400 },
      );
    }

    if (pricePaise === null || pricePaise <= 0) {
      return NextResponse.json(
        { error: "A valid price is required." },
        { status: 400 },
      );
    }

    if (compareAtPricePaise !== null && compareAtPricePaise < pricePaise) {
      return NextResponse.json(
        {
          error:
            "Compare-at price must be greater than or equal to the selling price.",
        },
        { status: 400 },
      );
    }

    if (inventoryQuantity < 0) {
      return NextResponse.json(
        {
          error: "Inventory quantity cannot be negative.",
        },
        { status: 400 },
      );
    }

    const categories = await db.orm.public.Category.where({
      id: categoryId,
      isActive: true,
    })
      .select("id")
      .all();

    if (categories.length === 0) {
      return NextResponse.json(
        { error: "Selected category was not found." },
        { status: 400 },
      );
    }

    const duplicateSku = await db.orm.public.Product.where({ sku })
      .select("id")
      .all();

    if (duplicateSku.some((product) => product.id !== id)) {
      return NextResponse.json(
        { error: "That SKU is already in use." },
        { status: 409 },
      );
    }

    // Preserve the existing URL slug when a product is edited.
    // This avoids breaking previously shared or indexed product URLs.
    const slug = existing.slug;

    const fabric =
      typeof payload.fabric === "string" ? payload.fabric.trim() : "";

    const color = typeof payload.color === "string" ? payload.color.trim() : "";

    const occasion =
      typeof payload.occasion === "string" ? payload.occasion.trim() : "";

    const pattern =
      typeof payload.pattern === "string" ? payload.pattern.trim() : "";

    const sareeLength =
      typeof payload.sareeLength === "string" ? payload.sareeLength.trim() : "";

    const blouseDetails =
      typeof payload.blouseDetails === "string"
        ? payload.blouseDetails.trim()
        : "";

    const description =
      typeof payload.description === "string" ? payload.description.trim() : "";

    const shortDescription =
      typeof payload.shortDescription === "string"
        ? payload.shortDescription.trim()
        : "";

    const careInstructions =
      typeof payload.careInstructions === "string"
        ? payload.careInstructions.trim()
        : "";

    const updatePlan = db.raw.sql`
  UPDATE "product"
  SET
    "categoryId" = ${categoryId},
    "name" = ${name},
    "slug" = ${slug},
    "sku" = ${sku},
    "shortDescription" = NULLIF(${shortDescription}, ''),
    "pricePaise" = ${pricePaise},

    "compareAtPricePaise" = NULLIF(
      ${compareAtPricePaise ?? 0},
      0
    ),

    "fabric" = NULLIF(${fabric}, ''),
    "color" = NULLIF(${color}, ''),
    "occasion" = NULLIF(${occasion}, ''),
    "pattern" = NULLIF(${pattern}, ''),
    "sareeLength" = NULLIF(${sareeLength}, ''),

    "blouseIncluded" = ${payload.blouseIncluded === true},

    "blouseDetails" = NULLIF(
      ${blouseDetails},
      ''
    ),

    "description" = NULLIF(
      ${description},
      ''
    ),

    "careInstructions" = NULLIF(
      ${careInstructions},
      ''
    ),

    "isOneOfOne" = ${payload.isOneOfOne !== false},
    "isFeatured" = ${payload.isFeatured === true},
    "updatedAt" = NOW()

  WHERE "id" = ${id}
`
      .affectedCount()
      .build();

    const txResult = await db.transaction(async (tx) => {
      const inventory = await tx.orm.public.Inventory.where({ productId: id })
        .select("id", "reserved")
        .first();

      const reserved = inventory?.reserved ?? 0;

      if (inventoryQuantity < reserved) {
        return {
          ok: false as const,
          status: 409,
          error: `Inventory quantity cannot be lower than reserved stock (${reserved}).`,
        };
      }

      const updateResult = await tx.execute(updatePlan);

      if (updateResult.affectedRows !== 1) {
        return {
          ok: false as const,
          status: 404,
          error: "Product not found.",
        };
      }

      if (!inventory) {
        await tx.orm.public.Inventory.create({
          productId: id,
          quantity: inventoryQuantity,
          reserved: 0,
        });
      } else {
        const inventoryPlan = db.raw.sql`
          UPDATE "inventory"
          SET
            "quantity" = ${inventoryQuantity},
            "updatedAt" = NOW()
          WHERE "id" = ${inventory.id}
            AND "reserved" <= ${inventoryQuantity}
        `
          .affectedCount()
          .build();

        const inventoryResult = await tx.execute(inventoryPlan);

        if (inventoryResult.affectedRows !== 1) {
          return {
            ok: false as const,
            status: 409,
            error: "Inventory quantity cannot be lower than reserved stock.",
          };
        }
      }

      return { ok: true as const };
    });

    if (!txResult.ok) {
      return NextResponse.json(
        { error: txResult.error },
        { status: txResult.status },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product updated successfully.",
    });
  } catch (error) {
    console.error("Failed to update admin product:", error);

    return NextResponse.json(
      { error: "Unable to update product." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const { response } = await requireAdminApi();

    if (response) {
      return response;
    }

    const { id: rawId } = await context.params;
    const id = parseId(rawId);

    if (!id) {
      return NextResponse.json(
        { error: "Invalid product ID." },
        { status: 400 },
      );
    }

    const plan = db.raw.sql`
      UPDATE "product"
      SET "isActive" = NOT "isActive"
      WHERE "id" = ${id}
    `
      .affectedCount()
      .build();

    const result = await db.runtime().execute(plan);

    if (result.affectedRows !== 1) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product status updated.",
    });
  } catch (error) {
    console.error("Failed to update product status:", error);

    return NextResponse.json(
      {
        error: "Unable to update product status.",
      },
      { status: 500 },
    );
  }
}
