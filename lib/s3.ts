import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export const BUCKET = process.env.S3_BUCKET || "events";

// Reads AWS_ENDPOINT_URL_S3, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION from the environment.
const g = globalThis as unknown as { s3?: S3Client };
export const s3 = (g.s3 ??= new S3Client({ forcePathStyle: true }));

/** Only keys we generate ourselves may be read or deleted through the app. */
export const COVER_KEY = /^covers\/[a-f0-9-]{36}\.webp$/;

export async function putCover(key: string, body: Buffer) {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

export async function getCover(key: string) {
  return s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
}

export async function deleteCover(url: string | null) {
  const key = url?.replace(/^\/media\//, "");
  if (!key || !COVER_KEY.test(key)) return;
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key })).catch(() => null);
}
