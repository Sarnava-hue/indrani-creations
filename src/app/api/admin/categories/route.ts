import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();

    const categories = await db.orm.public.Category.select(
      "id",
      "name",
      "slug",
      "description",
      "imageUrl",
      "parentId",
      "isActive",
      "sortOrder",
      "createdAt",
      "updatedAt",
    )
      .orderBy((category) => category.sortOrder.asc())
      .all();

    return NextResponse.json({
      categories,
    });
  } catch (error) {
    console.error("Failed to fetch admin categories:", error);

    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";

    const slug =
      typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";

    const description =
      typeof body.description === "string" ? body.description.trim() : null;

    const imageUrl =
      typeof body.imageUrl === "string" && body.imageUrl.trim()
        ? body.imageUrl.trim()
        : null;

    const parentId =
      body.parentId === null ||
      body.parentId === undefined ||
      body.parentId === ""
        ? null
        : Number(body.parentId);

    const sortOrder =
      body.sortOrder === undefined || body.sortOrder === ""
        ? 0
        : Number(body.sortOrder);

    const isActive =
      body.isActive === undefined ? true : Boolean(body.isActive);

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 },
      );
    }

    if (!slug) {
      return NextResponse.json(
        { error: "Category slug is required" },
        { status: 400 },
      );
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return NextResponse.json(
        {
          error:
            "Slug must contain only lowercase letters, numbers, and hyphens",
        },
        { status: 400 },
      );
    }

    if (parentId !== null && (!Number.isInteger(parentId) || parentId <= 0)) {
      return NextResponse.json(
        { error: "Invalid parent category" },
        { status: 400 },
      );
    }

    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      return NextResponse.json(
        { error: "Invalid sort order" },
        { status: 400 },
      );
    }

    if (parentId !== null) {
      const parent = await db.orm.public.Category.where({ id: parentId })
        .select("id")
        .first();

      if (!parent) {
        return NextResponse.json(
          { error: "Parent category not found" },
          { status: 400 },
        );
      }
    }

    const existing = await db.orm.public.Category.where({ slug })
      .select("id")
      .first();

    if (existing) {
      return NextResponse.json(
        { error: "A category with this slug already exists" },
        { status: 409 },
      );
    }

    const plan = db.sql.public.category
      .insert([
        {
          name,
          slug,
          description,
          imageUrl,
          parentId,
          isActive,
          sortOrder,
        },
      ])
      .returning(
        "id",
        "name",
        "slug",
        "description",
        "imageUrl",
        "parentId",
        "isActive",
        "sortOrder",
        "createdAt",
        "updatedAt",
      )
      .build();

    const [category] = await db.runtime().query(plan);

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Failed to create category:", error);

    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}
