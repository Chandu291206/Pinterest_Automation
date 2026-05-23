import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  try {
    const body = await request.json();
    const isActive = Boolean(body?.is_active);
    const productId = String(params?.id ?? "").trim();

    if (!productId) {
      return NextResponse.json({ error: "Product id is required." }, { status: 400 });
    }

    const { data, error } = await getSupabaseServer()
      .from("products")
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
