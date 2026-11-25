export type DetectedImageFormat = {
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/avif";
  extension: "jpg" | "png" | "webp" | "avif";
};

export function detectImageFormat(
  buffer: Buffer,
): DetectedImageFormat | null {
  // JPEG: FF D8 FF
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { mimeType: "image/jpeg", extension: "jpg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mimeType: "image/png", extension: "png" };
  }

  // WebP: "RIFF" .... "WEBP"
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { mimeType: "image/webp", extension: "webp" };
  }

  // AVIF: ISO BMFF ftyp box with avif/avis brand
  if (
    buffer.length >= 16 &&
    buffer.subarray(4, 8).toString("ascii") === "ftyp"
  ) {
    const rawBoxSize = buffer.readUInt32BE(0);
    const boxSize = Math.min(rawBoxSize, buffer.length, 128);
    const majorBrand = buffer.subarray(8, 12).toString("ascii");

    if (majorBrand === "avif" || majorBrand === "avis") {
      return { mimeType: "image/avif", extension: "avif" };
    }

    if (majorBrand === "mif1" || majorBrand === "miaf") {
      for (let offset = 16; offset + 4 <= boxSize; offset += 4) {
        const brand = buffer.subarray(offset, offset + 4).toString("ascii");

        if (brand === "avif" || brand === "avis") {
          return { mimeType: "image/avif", extension: "avif" };
        }
      }
    }
  }

  return null;
}
