import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    return null;
  }

  return session;
}

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
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        { error: "Admin authentication required." },
        { status: 401 },
      );
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
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        { error: "Admin authentication required." },
        { status: 401 },
      );
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

    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!baseSlug) {
      return NextResponse.json(
        {
          error: "Product name cannot generate a valid URL slug.",
        },
        { status: 400 },
      );
    }

    let slug = baseSlug;
    let suffix = 2;

    while (true) {
      const existingSlugs = await db.orm.public.Product.where({ slug })
        .select("id")
        .all();

      const conflicts = existingSlugs.some((product) => product.id !== id);

      if (!conflicts) {
        break;
      }

      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

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
    "isFeatured" = ${payload.isFeatured === true}

  WHERE "id" = ${id}
`
      .affectedCount()
      .build();

    const updateResult = await db.runtime().execute(updatePlan);

    if (updateResult.affectedRows !== 1) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    }

    const inventory = await db.orm.public.Inventory.where({ productId: id })
      .select("id")
      .all();

    if (inventory.length === 0) {
      await db.orm.public.Inventory.create({
        productId: id,
        quantity: inventoryQuantity,
        reserved: 0,
      });
    } else {
      const inventoryId = inventory[0].id;

      const inventoryPlan = db.raw.sql`
          UPDATE "inventory"
          SET "quantity" = ${inventoryQuantity}
          WHERE "id" = ${inventoryId}
        `
        .affectedCount()
        .build();

      await db.runtime().execute(inventoryPlan);
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
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        { error: "Admin authentication required." },
        { status: 401 },
      );
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
