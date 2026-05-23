import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOURCE_OPTIONS = new Set(["amazon", "flipkart", "shareasale", "cj", "other"]);
const ASIN_REGEX = /(?:dp|product|amzn\.to)\/([A-Z0-9]{10})/i;

function parseSourceIdFromUrl(url) {
  const match = url.match(ASIN_REGEX);
  return match?.[1]?.toUpperCase() ?? null;
}

function fallbackSourceId() {
  return randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
}

function buildSlug(name) {
  const core = String(name ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `${core || "product"}-${Date.now().toString(36).slice(-6)}`;
}

function normalizeImages(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
}

export async function GET() {
  try {
    const { data, error } = await getSupabaseServer()
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ products: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list products.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const productName = String(body?.product_name ?? "").trim();
    const affiliateUrl = String(body?.affiliate_url ?? "").trim();
    const imageUrl = String(body?.image_url ?? "").trim();
    const price = String(body?.price ?? "").trim();
    const theme = String(body?.theme ?? "").trim().toLowerCase();
    const campaignId = String(body?.campaign_id ?? "").trim();
    const sourceInput = String(body?.source_id ?? body?.asin ?? "").trim().toUpperCase();
    const affiliateSource = String(body?.affiliate_source ?? "amazon").trim().toLowerCase();
    const description = String(body?.product_description ?? "").trim();
    const images = normalizeImages(body?.images);

    if (!productName || !affiliateUrl || !campaignId) {
      return NextResponse.json(
        { error: "product_name, affiliate_url, and campaign_id are required." },
        { status: 400 }
      );
    }

    if (!SOURCE_OPTIONS.has(affiliateSource)) {
      return NextResponse.json({ error: "Invalid affiliate_source value." }, { status: 400 });
    }

    const selectedImage = images[0] || imageUrl || "";
    if (!selectedImage) {
      return NextResponse.json(
        { error: "Provide at least one image URL (image_url or images[])." },
        { status: 400 }
      );
    }

    const sourceId = sourceInput || parseSourceIdFromUrl(affiliateUrl) || fallbackSourceId();

    const { data: campaignExists, error: campaignCheckError } = await getSupabaseServer()
      .from("campaigns")
      .select("id")
      .eq("id", campaignId)
      .maybeSingle();

    if (campaignCheckError) {
      return NextResponse.json(
        { error: `Failed to verify campaign: ${campaignCheckError.message}` },
        { status: 500 }
      );
    }

    if (!campaignExists) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }

    const { data, error } = await getSupabaseServer()
      .from("products")
      .insert({
        campaign_id: campaignId,
        source_id: sourceId,
        product_name: productName,
        product_category: theme || null,
        affiliate_url: affiliateUrl,
        image_url: selectedImage,
        images: images.length > 0 ? images : [selectedImage],
        price: price || null,
        product_description: description || null,
        affiliate_source: affiliateSource,
        slug: buildSlug(productName),
        is_active: true,
      })
      .select("*")
      .single();

    if (error || !data) {
      if (error?.code === "23503") {
        return NextResponse.json({ error: "Invalid campaign reference." }, { status: 400 });
      }
      return NextResponse.json({ error: error?.message ?? "Failed to create product." }, { status: 500 });
    }

    return NextResponse.json({ product: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create product.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
