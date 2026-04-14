import { NextRequest } from "next/server";
import { createCollagePin, createSingleProductPin } from "@/lib/imageCompositor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const format = String(body?.format ?? "single").toLowerCase();
    const theme = String(body?.theme ?? "fitness");
    const headline = String(body?.headline ?? "Top Picks").trim() || "Top Picks";
    const priceBadge = String(body?.priceBadge ?? "$19.99").trim() || "$19.99";
    const imageUrls = Array.isArray(body?.imageUrls)
      ? body.imageUrls
          .filter((item: unknown): item is string => typeof item === "string")
          .map((item: string) => item.trim())
          .filter(Boolean)
      : [];

    if (imageUrls.length === 0) {
      return Response.json({ error: "At least one image URL is required." }, { status: 400 });
    }

    let buffer: Buffer;
    if (format === "collage") {
      const collageUrls = imageUrls.slice(0, 4);
      if (collageUrls.length < 2) {
        return Response.json(
          { error: "Collage preview requires at least 2 image URLs." },
          { status: 400 }
        );
      }
      buffer = await createCollagePin({
        productImageUrls: collageUrls,
        headline,
        priceBadge,
        theme,
      });
    } else {
      buffer = await createSingleProductPin({
        productImageUrl: imageUrls[0],
        headline,
        priceBadge,
        theme,
      });
    }

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate preview.";
    return Response.json({ error: message }, { status: 500 });
  }
}
