import { del, put } from "@vercel/blob";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

export class ProductImageStorageConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductImageStorageConfigError";
  }
}

function hasVercelBlobCredentials(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
      (process.env.VERCEL_OIDC_TOKEN?.trim() &&
        process.env.BLOB_STORE_ID?.trim()),
  );
}

function isVercelBlobUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    return (
      parsed.protocol === "https:" &&
      (parsed.hostname.endsWith(".public.blob.vercel-storage.com") ||
        parsed.hostname.endsWith(".blob.vercel-storage.com"))
    );
  } catch {
    return false;
  }
}

type UploadProductImageParams = {
  productId: number;
  filename: string;
  buffer: Buffer;
  contentType: string;
};

/**
 * Uploads a validated product image to Vercel Blob when configured, or falls
 * back to `public/products/` in local development.
 */
export async function uploadProductImage({
  productId,
  filename,
  buffer,
  contentType,
}: UploadProductImageParams): Promise<{ url: string; storage: "blob" | "local" }> {
  if (hasVercelBlobCredentials()) {
    const pathname = `products/${productId}/${filename}`;
    const blob = await put(pathname, buffer, {
      access: "public",
      addRandomSuffix: false,
      contentType,
      cacheControlMaxAge: 31536000,
    });

    return {
      url: blob.url,
      storage: "blob",
    };
  }

  if (process.env.NODE_ENV === "production") {
    throw new ProductImageStorageConfigError(
      "Product image storage is not configured. Set BLOB_READ_WRITE_TOKEN.",
    );
  }

  const productsRoot = path.resolve(process.cwd(), "public", "products");
  const uploadDirectory = path.resolve(productsRoot, String(productId));

  if (!uploadDirectory.startsWith(`${productsRoot}${path.sep}`)) {
    throw new Error("Invalid product upload directory.");
  }

  await mkdir(uploadDirectory, { recursive: true });

  const filePath = path.resolve(uploadDirectory, filename);

  if (!filePath.startsWith(`${uploadDirectory}${path.sep}`)) {
    throw new Error("Invalid product image file path.");
  }

  await writeFile(filePath, buffer);

  return {
    url: `/products/${productId}/${filename}`,
    storage: "local",
  };
}

/**
 * Removes a stored product image from Vercel Blob or legacy `public/products/`
 * disk paths. Fails cleanly on unrecognized URLs without traversing outside
 * `public/products`.
 */
export async function deleteStoredProductImage(url: string): Promise<void> {
  if (isVercelBlobUrl(url)) {
    if (!hasVercelBlobCredentials()) {
      console.warn(
        "Skipping Vercel Blob deletion because BLOB_READ_WRITE_TOKEN is not set:",
        url,
      );
      return;
    }

    await del(url);
    return;
  }

  if (!url.startsWith("/products/")) {
    return;
  }

  const relativePath = url.slice(1);
  const productsRoot = path.resolve(process.cwd(), "public", "products");
  const filePath = path.resolve(process.cwd(), "public", relativePath);

  if (filePath.startsWith(`${productsRoot}${path.sep}`)) {
    await unlink(filePath);
  }
}
