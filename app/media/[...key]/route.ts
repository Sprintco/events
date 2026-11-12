import { Readable } from "node:stream";
import { COVER_KEY, getCover } from "@/lib/s3";

// Serves images from the (private) bucket under a stable URL: /media/covers/<id>.webp
export async function GET(_req: Request, ctx: RouteContext<"/media/[...key]">) {
  const { key } = await ctx.params;
  const path = key.join("/");
  if (!COVER_KEY.test(path)) return new Response("Not found", { status: 404 });

  try {
    const obj = await getCover(path);
    if (!obj.Body) return new Response("Not found", { status: 404 });
    return new Response(Readable.toWeb(obj.Body as Readable) as ReadableStream, {
      headers: {
        "Content-Type": obj.ContentType ?? "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
