import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeImages(value) {
  if (!Array.isArray(value)) return null;
  return value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
}

export async function PATCH(request, { params }) {
  try {
    const productId = String(params?.id ?? "").trim();
    if (!productId) {
      return NextResponse.json({ error: "Product id is required." }, { status: 400 });
    }

    const body = await request.json();
    const updates = {};

    if (typeof body?.is_active === "boolean") {
      updates.is_active = body.is_active;
    }

    if (typeof body?.product_name === "string") {
      updates.product_name = body.product_name.trim();
    }

    if (typeof body?.price === "string") {
      updates.price = body.price.trim() || null;
    }

    if (typeof body?.affiliate_url === "string") {
      updates.affiliate_url = body.affiliate_url.trim();
    }

    if (typeof body?.image_url === "string") {
      updates.image_url = body.image_url.trim();
    }

    if (typeof body?.product_description === "string") {
      updates.product_description = body.product_description.trim() || null;
    }

    const images = normalizeImages(body?.images);
    if (images) {
      updates.images = images;
      if (images.length > 0 && !updates.image_url) {
        updates.image_url = images[0];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates provided." }, { status: 400 });
    }

    const { data, error } = await getSupabaseServer()
      .from("products")
      .update(updates)
      .eq("id", productId)
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ product: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update product.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const productId = String(params?.id ?? "").trim();
    if (!productId) {
      return NextResponse.json({ error: "Product id is required." }, { status: 400 });
    }

    const { data: existing, error: lookupError } = await getSupabaseServer()
      .from("products")
      .select("id")
      .eq("id", productId)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json({ error: lookupError.message }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const { error } = await getSupabaseServer().from("products").delete().eq("id", productId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete product.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
