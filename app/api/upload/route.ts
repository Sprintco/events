import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { isAdmin } from "@/lib/auth";
import { putCover } from "@/lib/s3";

const MAX_INPUT_BYTES = 15 * 1024 * 1024; // reject anything larger before processing

// Admin only: accepts an image, compresses it, stores it in the bucket, returns its URL.
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  if (file.size > MAX_INPUT_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 15 MB)." }, { status: 413 });
  }

  const input = Buffer.from(await file.arrayBuffer());
  let output: Buffer;
  try {
    output = await sharp(input)
      .rotate() // respect EXIF orientation, then metadata is dropped
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "That file isn't a supported image." }, { status: 400 });
  }

  const key = `covers/${randomUUID()}.webp`;
  try {
    await putCover(key, output);
  } catch (e) {
    console.error("upload failed", e);
    return NextResponse.json({ error: "Could not store the image. Try again." }, { status: 502 });
  }

  return NextResponse.json({
    url: `/media/${key}`,
    originalBytes: input.length,
    storedBytes: output.length,
  });
}
