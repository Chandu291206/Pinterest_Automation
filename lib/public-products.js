import { getSupabaseServer } from "@/lib/supabase";

export async function fetchLatestPostedProducts({ limit = 12, theme }) {
  const supabase = getSupabaseServer();
  let campaignIds = null;

  if (theme) {
    const campaignRes = await supabase.from("campaigns").select("id").eq("theme", theme.toLowerCase());
    campaignIds = (campaignRes.data ?? []).map((row) => String(row.id));
    if (campaignIds.length === 0) return [];
  }

  let pinQuery = supabase
    .from("pins")
    .select("id,product_id,campaign_id,image_url,created_at,title")
    .eq("status", "posted")
    .order("created_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (campaignIds) {
    pinQuery = pinQuery.in("campaign_id", campaignIds);
  }

  const pinRes = await pinQuery;
  const pins = pinRes.data ?? [];
  if (pins.length === 0) return [];

  const productIds = Array.from(new Set(pins.map((pin) => pin.product_id).filter(Boolean)));
  const usedCampaignIds = Array.from(new Set(pins.map((pin) => pin.campaign_id).filter(Boolean)));

  const [productRes, campaignRes] = await Promise.all([
    supabase
      .from("products")
      .select("id,product_name,price,image_url,images,slug")
      .in("id", productIds),
    supabase.from("campaigns").select("id,theme").in("id", usedCampaignIds),
  ]);

  const productMap = new Map();
  for (const row of productRes.data ?? []) {
    productMap.set(String(row.id), row);
  }

  const campaignMap = new Map();
  for (const row of campaignRes.data ?? []) {
    campaignMap.set(String(row.id), row);
  }

  return pins.map((pin) => {
    const product = productMap.get(String(pin.product_id));
    const campaign = campaignMap.get(String(pin.campaign_id));
    const imageFromArray = Array.isArray(product?.images) && product.images.length > 0
      ? product.images[0]
      : null;

    return {
      pinId: pin.id,
      productId: pin.product_id,
      productSlug: product?.slug ?? null,
      campaignId: pin.campaign_id,
      productName: product?.product_name || pin.title || "Product",
      price: product?.price ?? null,
      theme: campaign?.theme ?? "general",
      imageUrl: pin.image_url ?? imageFromArray ?? product?.image_url ?? null,
      createdAt: pin.created_at,
    };
  });
}

export function formatThemeLabel(theme) {
  if (!theme) return "General";
  return `${theme.charAt(0).toUpperCase()}${theme.slice(1).toLowerCase()}`;
}
