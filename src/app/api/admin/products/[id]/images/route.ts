import { NextResponse } from "next/server";
import crypto from "crypto";

import { requireAdminApi } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { detectImageFormat } from "@/lib/security/image-validation";
import {
  deleteStoredProductImage,
  ProductImageStorageConfigError,
  uploadProductImage,
} from "@/lib/storage/product-images";

function parseId(value: string) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
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
    const productId = parseId(rawId);

    if (!productId) {
      return NextResponse.json(
        { error: "Invalid product ID." },
        { status: 400 },
      );
    }

    const products =
      await db.orm.public.Product
        .where({ id: productId })
        .select("id")
        .all();

    if (products.length === 0) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    }

    const images =
      await db.orm.public.ProductImage
        .where({ productId })
        .select(
          "id",
          "url",
          "altText",
          "sortOrder",
          "isPrimary",
          "createdAt",
        )
        .orderBy((image) =>
          image.sortOrder.asc(),
        )
        .all();

    return NextResponse.json({ images });
  } catch (error) {
    console.error(
      "Failed to fetch product images:",
      error,
    );

    return NextResponse.json(
      { error: "Unable to load product images." },
      { status: 500 },
    );
  }
}

export async function POST(
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
    const productId = parseId(rawId);

    if (!productId) {
      return NextResponse.json(
        { error: "Invalid product ID." },
        { status: 400 },
      );
    }

    const products =
      await db.orm.public.Product
        .where({ id: productId })
        .select("id")
        .all();

    if (products.length === 0) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    }

    const formData =
      await request.formData();

    const file = formData.get("file");
    const altTextValue =
      formData.get("altText");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Image file is required." },
        { status: 400 },
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        { error: "The uploaded image is empty." },
        { status: 400 },
      );
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error:
            "Image must be smaller than 10 MB.",
        },
        { status: 400 },
      );
    }

    const allowedTypes = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ]);

    if (!allowedTypes.has(file.type)) {
      return NextResponse.json(
        {
          error:
            "Only JPEG, PNG, WebP and AVIF images are supported.",
        },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const detectedFormat = detectImageFormat(buffer);

    if (!detectedFormat || detectedFormat.mimeType !== file.type) {
      return NextResponse.json(
        {
          error:
            "File contents do not match a valid JPEG, PNG, WebP, or AVIF image.",
        },
        { status: 400 },
      );
    }

    const altText =
      typeof altTextValue === "string"
        ? altTextValue.trim() || null
        : null;

    if (altText && altText.length > 300) {
      return NextResponse.json(
        { error: "Alt text must be 300 characters or fewer." },
        { status: 400 },
      );
    }

    const filename = `${crypto.randomUUID()}.${detectedFormat.extension}`;

    const uploaded = await uploadProductImage({
      productId,
      filename,
      buffer,
      contentType: detectedFormat.mimeType,
    });

    try {
      const existingImages =
        await db.orm.public.ProductImage
          .where({ productId })
          .select(
            "id",
            "isPrimary",
            "sortOrder",
          )
          .all();

      const isFirstImage =
        existingImages.length === 0;

      const nextSortOrder =
        existingImages.reduce(
          (highest, image) =>
            Math.max(
              highest,
              image.sortOrder,
            ),
          -1,
        ) + 1;

      const image =
        await db.orm.public.ProductImage.create({
          productId,
          url: uploaded.url,
          altText,
          sortOrder: nextSortOrder,
          isPrimary: isFirstImage,
        });

      return NextResponse.json(
        {
          success: true,
          image: {
            id: image.id,
            url: image.url,
            altText: image.altText,
            sortOrder: image.sortOrder,
            isPrimary: image.isPrimary,
          },
        },
        { status: 201 },
      );
    } catch (dbError) {
      await deleteStoredProductImage(uploaded.url).catch(() => {});
      throw dbError;
    }
  } catch (error) {
    console.error(
      "Failed to upload product image:",
      error,
    );

    if (error instanceof ProductImageStorageConfigError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Unable to upload image." },
      { status: 500 },
    );
  }
}