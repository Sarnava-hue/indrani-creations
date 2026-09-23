import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const categoryId = Number(id);

    if (!Number.isInteger(categoryId)) {
      return NextResponse.json(
        { error: "Invalid category ID" },
        { status: 400 },
      );
    }

    const category = await db.orm.public.Category.where({ id: categoryId })
      .select(
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
      .first();

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      category,
    });
  } catch (error) {
    console.error("Failed to fetch category:", error);

    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const categoryId = Number(id);

    if (!Number.isInteger(categoryId)) {
      return NextResponse.json(
        { error: "Invalid category ID" },
        { status: 400 },
      );
    }

    const existing = await db.orm.public.Category.where({ id: categoryId })
      .select(
        "id",
        "name",
        "slug",
        "description",
        "imageUrl",
        "parentId",
        "isActive",
        "sortOrder",
      )
      .first();

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : existing.name;

    const slug =
      typeof body.slug === "string"
        ? body.slug.trim().toLowerCase()
        : existing.slug;

    const description =
      body.description === null
        ? null
        : typeof body.description === "string"
          ? body.description.trim()
          : existing.description;

    const imageUrl =
      body.imageUrl === null
        ? null
        : typeof body.imageUrl === "string"
          ? body.imageUrl.trim()
          : existing.imageUrl;

    const parentId =
      body.parentId === null ||
      body.parentId === undefined ||
      body.parentId === ""
        ? null
        : Number(body.parentId);

    const sortOrder =
      body.sortOrder === undefined || body.sortOrder === ""
        ? existing.sortOrder
        : Number(body.sortOrder);

    const isActive =
      body.isActive === undefined ? existing.isActive : Boolean(body.isActive);

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
        { error: "Invalid category slug" },
        { status: 400 },
      );
    }

    if (parentId !== null && (!Number.isInteger(parentId) || parentId <= 0)) {
      return NextResponse.json(
        { error: "Invalid parent category" },
        { status: 400 },
      );
    }

    if (parentId === categoryId) {
      return NextResponse.json(
        {
          error: "A category cannot be its own parent",
        },
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

    if (slug !== existing.slug) {
      const duplicate = await db.orm.public.Category.where({ slug })
        .select("id")
        .first();

      if (duplicate && duplicate.id !== categoryId) {
        return NextResponse.json(
          {
            error: "A category with this slug already exists",
          },
          { status: 409 },
        );
      }
    }

    const plan = db.sql.public.category
      .update({
        name,
        slug,
        description,
        imageUrl,
        parentId,
        isActive,
        sortOrder,
      })
      .where((fields, fns) => fns.eq(fields.id, categoryId))
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

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      category,
    });
  } catch (error) {
    console.error("Failed to update category:", error);

    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const categoryId = Number(id);

    if (!Number.isInteger(categoryId)) {
      return NextResponse.json(
        { error: "Invalid category ID" },
        { status: 400 },
      );
    }

    const category = await db.orm.public.Category.where({ id: categoryId })
      .select("id")
      .first();

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    const child = await db.orm.public.Category.where({ parentId: categoryId })
      .select("id")
      .first();

    if (child) {
      return NextResponse.json(
        {
          error: "Cannot deactivate a category that has child categories",
        },
        { status: 409 },
      );
    }

    const plan = db.raw.sql`
      UPDATE "category"
      SET "isActive" = false
      WHERE "id" = ${categoryId}
    `
      .affectedCount()
      .build();

    const result = await db.runtime().execute(plan);

    if (result.affectedRows !== 1) {
      return NextResponse.json(
        { error: "Category was not updated" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Failed to deactivate category:", error);

    return NextResponse.json(
      { error: "Failed to deactivate category" },
      { status: 500 },
    );
  }
}
