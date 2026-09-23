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

function toPaise(value: unknown): number | null {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    return null;
  }

  return Math.round(value * 100);
}

export async function GET() {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        { error: "Admin authentication required." },
        { status: 401 },
      );
    }

    const products =
      await db.orm.public.Product
        .select(
          "id",
          "name",
          "slug",
          "sku",
          "pricePaise",
          "compareAtPricePaise",
          "isActive",
          "isFeatured",
          "isOneOfOne",
          "createdAt",
        )
        .orderBy((product) =>
          product.createdAt.desc(),
        )
        .all();

    return NextResponse.json({ products });
  } catch (error) {
    console.error(
      "Failed to fetch admin products:",
      error,
    );

    return NextResponse.json(
      { error: "Unable to load products." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
) {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        { error: "Admin authentication required." },
        { status: 401 },
      );
    }

    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null
    ) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const payload =
      body as Record<string, unknown>;

    const name =
      typeof payload.name === "string"
        ? payload.name.trim()
        : "";

    const sku =
      typeof payload.sku === "string"
        ? payload.sku.trim().toUpperCase()
        : "";

    const categoryId =
      typeof payload.categoryId === "number"
        ? payload.categoryId
        : 0;

    const pricePaise = toPaise(
      payload.price,
    );

    const compareAtPricePaise =
      payload.compareAtPrice === null ||
      payload.compareAtPrice === undefined ||
      payload.compareAtPrice === ""
        ? null
        : toPaise(payload.compareAtPrice);

    const inventoryQuantity =
      typeof payload.inventoryQuantity ===
      "number"
        ? Math.floor(
            payload.inventoryQuantity,
          )
        : -1;

    if (!name) {
      return NextResponse.json(
        { error: "Product name is required." },
        { status: 400 },
      );
    }

    if (!sku) {
      return NextResponse.json(
        { error: "SKU is required." },
        { status: 400 },
      );
    }

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return NextResponse.json(
        { error: "A valid category is required." },
        { status: 400 },
      );
    }

    if (
      pricePaise === null ||
      pricePaise <= 0
    ) {
      return NextResponse.json(
        { error: "A valid price is required." },
        { status: 400 },
      );
    }

    if (
      compareAtPricePaise !== null &&
      compareAtPricePaise < pricePaise
    ) {
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
          error:
            "Inventory quantity cannot be negative.",
        },
        { status: 400 },
      );
    }

    const category =
      await db.orm.public.Category
        .where({
          id: categoryId,
          isActive: true,
        })
        .select("id")
        .all();

    if (category.length === 0) {
      return NextResponse.json(
        { error: "Selected category was not found." },
        { status: 400 },
      );
    }

    const duplicateSku =
      await db.orm.public.Product
        .where({ sku })
        .select("id")
        .all();

    if (duplicateSku.length > 0) {
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
          error:
            "Product name cannot generate a valid URL slug.",
        },
        { status: 400 },
      );
    }

    let slug = baseSlug;
    let suffix = 2;

    while (true) {
      const existing =
        await db.orm.public.Product
          .where({ slug })
          .select("id")
          .all();

      if (existing.length === 0) {
        break;
      }

      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    const product =
      await db.orm.public.Product.create({
        categoryId,
        name,
        slug,
        sku,
        pricePaise,
        compareAtPricePaise,
        fabric:
          typeof payload.fabric === "string"
            ? payload.fabric.trim() || null
            : null,
        color:
          typeof payload.color === "string"
            ? payload.color.trim() || null
            : null,
        occasion:
          typeof payload.occasion === "string"
            ? payload.occasion.trim() || null
            : null,
        pattern:
          typeof payload.pattern === "string"
            ? payload.pattern.trim() || null
            : null,
        sareeLength:
          typeof payload.sareeLength === "string"
            ? payload.sareeLength.trim() || null
            : null,
        blouseIncluded:
          payload.blouseIncluded === true,
        blouseDetails:
          typeof payload.blouseDetails === "string"
            ? payload.blouseDetails.trim() || null
            : null,
        description:
          typeof payload.description === "string"
            ? payload.description.trim() || null
            : null,
        careInstructions:
          typeof payload.careInstructions ===
          "string"
            ? payload.careInstructions.trim() || null
            : null,
        isOneOfOne:
          payload.isOneOfOne !== false,
        isFeatured:
          payload.isFeatured === true,
      });

    await db.orm.public.Inventory.create({
      productId: product.id,
      quantity: inventoryQuantity,
      reserved: 0,
    });

    return NextResponse.json(
      {
        success: true,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Failed to create admin product:",
      error,
    );

    return NextResponse.json(
      { error: "Unable to create product." },
      { status: 500 },
    );
  }
}