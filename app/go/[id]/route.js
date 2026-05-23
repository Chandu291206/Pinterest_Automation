import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadProductFromPinId(supabase, id) {
  const pinRes = await supabase.from("pins").select("id,product_id").eq("id", id).maybeSingle();
  if (pinRes.error || !pinRes.data?.product_id) return null;

  const productRes = await supabase
    .from("products")
    .select("id,slug,affiliate_url,clicks")
    .eq("id", pinRes.data.product_id)
    .maybeSingle();

  return productRes.data ?? null;
}

async function loadProductFromProductIdOrSlug(supabase, id) {
  const productRes = await supabase
    .from("products")
    .select("id,slug,affiliate_url,clicks")
    .or(`id.eq.${id},slug.eq.${id}`)
    .maybeSingle();

  if (productRes.error) return null;
  return productRes.data ?? null;
}

async function incrementClicks(supabase, product) {
  await supabase
    .from("products")
    .update({
      clicks: Number(product?.clicks ?? 0) + 1,
      last_clicked_at: new Date().toISOString(),
    })
    .eq("id", product.id);
}

export async function GET(request, { params }) {
  const id = String(params?.id ?? "").trim();
  if (!id) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const supabase = getSupabaseServer();

  const fromPin = await loadProductFromPinId(supabase, id);
  const product = fromPin ?? (await loadProductFromProductIdOrSlug(supabase, id));

  if (!product?.affiliate_url) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  await incrementClicks(supabase, product);
  return NextResponse.redirect(product.affiliate_url);
}
