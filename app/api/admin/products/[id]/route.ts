import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = String(params?.id ?? "").trim();
    if (!productId) {
      return NextResponse.json({ error: "Product id is required." }, { status: 400 });
    }

    const body = await request.json();
    if (typeof body?.is_active !== "boolean") {
      return NextResponse.json({ error: "is_active must be a boolean." }, { status: 400 });
    }
    const isActive = body.is_active;

    const { data, error } = await getSupabaseServer()
      .from("affiliate_links")
      .update({ is_active: isActive })
      .eq("id", productId)
      .select("id,is_active")
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = String(params?.id ?? "").trim();
    if (!productId) {
      return NextResponse.json({ error: "Product id is required." }, { status: 400 });
    }

    const { data: existing, error: lookupError } = await getSupabaseServer()
      .from("affiliate_links")
      .select("id")
      .eq("id", productId)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json({ error: lookupError.message }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const { error } = await getSupabaseServer().from("affiliate_links").delete().eq("id", productId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete product.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
