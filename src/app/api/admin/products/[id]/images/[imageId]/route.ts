import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";

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

async function getProductImage(
  productId: number,
  imageId: number,
) {
  const images =
    await db.orm.public.ProductImage
      .where({
        id: imageId,
        productId,
      })
      .select(
        "id",
        "url",
        "altText",
        "sortOrder",
        "isPrimary",
      )
      .all();

  return images[0] ?? null;
}

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      id: string;
      imageId: string;
    }>;
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

    const {
      id: rawProductId,
      imageId: rawImageId,
    } = await context.params;

    const productId = parseId(rawProductId);
    const imageId = parseId(rawImageId);

    if (!productId || !imageId) {
      return NextResponse.json(
        { error: "Invalid product or image ID." },
        { status: 400 },
      );
    }

    const image = await getProductImage(
      productId,
      imageId,
    );

    if (!image) {
      return NextResponse.json(
        { error: "Image not found." },
        { status: 404 },
      );
    }

    const body: unknown =
      await request.json();

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

    /*
     * SET PRIMARY
     */
    if (payload.action === "set-primary") {
      const unsetPrimaryPlan =
        db.raw.sql`
          UPDATE "productImage"
          SET "isPrimary" = false
          WHERE "productId" = ${productId}
        `.affectedCount().build();

      const setPrimaryPlan =
        db.raw.sql`
          UPDATE "productImage"
          SET "isPrimary" = true
          WHERE "id" = ${imageId}
          AND "productId" = ${productId}
        `.affectedCount().build();

      await db.transaction(async (tx) => {
        await tx.execute(
          unsetPrimaryPlan,
        );

        await tx.execute(
          setPrimaryPlan,
        );
      });

      return NextResponse.json({
        success: true,
      });
    }

    /*
     * UPDATE ALT TEXT
     */
    if (payload.action === "update-alt") {
      const altText =
        typeof payload.altText === "string"
          ? payload.altText.trim()
          : "";

      const updatePlan =
        db.raw.sql`
          UPDATE "productImage"
          SET "altText" = NULLIF(${altText}, '')
          WHERE "id" = ${imageId}
          AND "productId" = ${productId}
        `.affectedCount().build();

      const result =
        await db.runtime().execute(
          updatePlan,
        );

      if (result.affectedRows !== 1) {
        return NextResponse.json(
          {
            error:
              "Unable to update image.",
          },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
      });
    }

    /*
     * MOVE IMAGE
     */
    if (payload.action === "move") {
      const direction =
        payload.direction === "left"
          ? "left"
          : payload.direction === "right"
            ? "right"
            : null;

      if (!direction) {
        return NextResponse.json(
          {
            error:
              "Invalid move direction.",
          },
          { status: 400 },
        );
      }

      const allImages =
        await db.orm.public.ProductImage
          .where({ productId })
          .select(
            "id",
            "sortOrder",
          )
          .orderBy((item) =>
            item.sortOrder.asc(),
          )
          .all();

      const currentIndex =
        allImages.findIndex(
          (item) => item.id === imageId,
        );

      if (currentIndex === -1) {
        return NextResponse.json(
          { error: "Image not found." },
          { status: 404 },
        );
      }

      const targetIndex =
        direction === "left"
          ? currentIndex - 1
          : currentIndex + 1;

      if (
        targetIndex < 0 ||
        targetIndex >= allImages.length
      ) {
        return NextResponse.json({
          success: true,
        });
      }

      const currentImage =
        allImages[currentIndex];

      const targetImage =
        allImages[targetIndex];

      const moveCurrentToTemporary =
        db.raw.sql`
          UPDATE "productImage"
          SET "sortOrder" = -1
          WHERE "id" = ${currentImage.id}
        `.affectedCount().build();

      const moveTarget =
        db.raw.sql`
          UPDATE "productImage"
          SET "sortOrder" = ${currentImage.sortOrder}
          WHERE "id" = ${targetImage.id}
        `.affectedCount().build();

      const moveCurrent =
        db.raw.sql`
          UPDATE "productImage"
          SET "sortOrder" = ${targetImage.sortOrder}
          WHERE "id" = ${currentImage.id}
        `.affectedCount().build();

      await db.transaction(async (tx) => {
        await tx.execute(
          moveCurrentToTemporary,
        );

        await tx.execute(moveTarget);

        await tx.execute(moveCurrent);
      });

      return NextResponse.json({
        success: true,
      });
    }

    return NextResponse.json(
      {
        error:
          "Unsupported image action.",
      },
      { status: 400 },
    );
  } catch (error) {
    console.error(
      "Failed to update product image:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to update product image.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: {
    params: Promise<{
      id: string;
      imageId: string;
    }>;
  },
) {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Admin authentication required.",
        },
        { status: 401 },
      );
    }

    const {
      id: rawProductId,
      imageId: rawImageId,
    } = await context.params;

    const productId = parseId(rawProductId);
    const imageId = parseId(rawImageId);

    if (!productId || !imageId) {
      return NextResponse.json(
        {
          error:
            "Invalid product or image ID.",
        },
        { status: 400 },
      );
    }

    const image =
      await getProductImage(
        productId,
        imageId,
      );

    if (!image) {
      return NextResponse.json(
        { error: "Image not found." },
        { status: 404 },
      );
    }

    const allImages =
      await db.orm.public.ProductImage
        .where({ productId })
        .select(
          "id",
          "url",
          "sortOrder",
          "isPrimary",
        )
        .orderBy((item) =>
          item.sortOrder.asc(),
        )
        .all();

    /*
     * Never allow a product to have zero
     * images.
     */
    if (allImages.length === 1) {
      return NextResponse.json(
        {
          error:
            "A product must keep at least one image.",
        },
        { status: 400 },
      );
    }

    /*
     * If deleting the primary image,
     * promote the first remaining image.
     */
    const nextPrimary =
      image.isPrimary
        ? allImages.find(
            (item) => item.id !== imageId,
          )
        : null;

    const deletePlan =
      db.raw.sql`
        DELETE FROM "productImage"
        WHERE "id" = ${imageId}
        AND "productId" = ${productId}
      `.affectedCount().build();

    await db.runtime().execute(
      deletePlan,
    );

    if (nextPrimary) {
      const primaryPlan =
        db.raw.sql`
          UPDATE "productImage"
          SET "isPrimary" = true
          WHERE "id" = ${nextPrimary.id}
        `.affectedCount().build();

      await db.runtime().execute(
        primaryPlan,
      );
    }

    /*
     * Re-number sortOrder so there are no gaps.
     */
    const remaining =
      await db.orm.public.ProductImage
        .where({ productId })
        .select(
          "id",
          "sortOrder",
        )
        .orderBy((item) =>
          item.sortOrder.asc(),
        )
        .all();

    for (
      let index = 0;
      index < remaining.length;
      index += 1
    ) {
      const imageToUpdate =
        remaining[index];

      if (
        imageToUpdate.sortOrder !== index
      ) {
        const reorderPlan =
          db.raw.sql`
            UPDATE "productImage"
            SET "sortOrder" = ${index}
            WHERE "id" = ${imageToUpdate.id}
          `.affectedCount().build();

        await db.runtime().execute(
          reorderPlan,
        );
      }
    }

    /*
     * Delete physical file.
     *
     * Database deletion has already succeeded,
     * so failure here should not report the
     * entire operation as failed.
     */
    try {
      const relativePath =
        image.url.startsWith("/")
          ? image.url.slice(1)
          : image.url;

      const filePath = path.join(
        process.cwd(),
        "public",
        relativePath,
      );

      await unlink(filePath);
    } catch (fileError) {
      console.warn(
        "Could not delete image file:",
        fileError,
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Failed to delete product image:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to delete product image.",
      },
      { status: 500 },
    );
  }
}