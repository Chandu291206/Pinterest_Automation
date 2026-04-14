import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ASIN_REGEX = /(?:dp|product|amzn\.to)\/([A-Z0-9]{10})/i;
const STRICT_ASIN_REGEX = /^[A-Z0-9]{10}$/;
const validThemes = new Set(["fitness", "tech", "fashion", "home", "beauty", "productivity"]);

function parseAsinFromUrl(url: string): string | null {
  const match = url.match(ASIN_REGEX);
  return match?.[1]?.toUpperCase() ?? null;
}

function fallbackAsin(): string {
  return randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
}

export async function GET() {
  try {
    const { data, error } = await getSupabaseServer()
      .from("affiliate_links")
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const productName = String(body?.product_name ?? "").trim();
    const affiliateUrl = String(body?.affiliate_url ?? "").trim();
    const imageUrl = String(body?.image_url ?? "").trim();
    const price = String(body?.price ?? "").trim();
    const theme = String(body?.theme ?? "").trim().toLowerCase();
    const campaignId = String(body?.campaign_id ?? "").trim();
    const asinInput = String(body?.asin ?? "").trim().toUpperCase();

    if (!productName || !affiliateUrl || !imageUrl || !theme || !campaignId) {
      return NextResponse.json(
        {
          error:
            "product_name, affiliate_url, image_url, theme, and campaign_id are required.",
        },
        { status: 400 }
      );
    }
    if (!validThemes.has(theme)) {
      return NextResponse.json({ error: "Invalid theme value." }, { status: 400 });
    }
    if (asinInput && !STRICT_ASIN_REGEX.test(asinInput)) {
      return NextResponse.json(
        { error: "ASIN must be 10 uppercase letters or numbers." },
        { status: 400 }
      );
    }

    const parsedAsin = parseAsinFromUrl(affiliateUrl);
    const asin = asinInput || parsedAsin || fallbackAsin();

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
      .from("affiliate_links")
      .insert({
        campaign_id: campaignId,
        asin,
        product_name: productName,
        product_category: theme,
        affiliate_url: affiliateUrl,
        image_url: imageUrl,
        price: price || null,
        is_active: true,
      })
      .select("*")
      .single();

    if (error || !data) {
      if (error?.code === "23503") {
        return NextResponse.json({ error: "Invalid campaign reference." }, { status: 400 });
      }
      return NextResponse.json(
        { error: error?.message ?? "Failed to create product." },
        { status: 500 }
      );
    }

    return NextResponse.json({ product: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create product.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
