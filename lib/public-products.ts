import { getSupabaseServer } from "@/lib/supabase";

export type PublicProductCard = {
  pinId: string;
  affiliateLinkId: string;
  campaignId: string;
  productName: string;
  price: string | null;
  theme: string;
  imageUrl: string | null;
  createdAt: string | null;
};

type PinRow = {
  id: string;
  affiliate_link_id: string;
  campaign_id: string;
  image_url: string | null;
  created_at: string | null;
  title: string | null;
};

type AffiliateLinkRow = {
  id: string;
  product_name: string;
  price: string | null;
  image_url: string | null;
};

type CampaignRow = {
  id: string;
  theme: string;
};

export async function fetchLatestPostedProducts({
  limit = 12,
  theme,
}: {
  limit?: number;
  theme?: string;
}): Promise<PublicProductCard[]> {
  const supabase = getSupabaseServer();
  let campaignIds: string[] | null = null;

  if (theme) {
    const campaignRes = await supabase
      .from("campaigns")
      .select("id")
      .eq("theme", theme.toLowerCase());

    campaignIds = (campaignRes.data ?? []).map((row) => String(row.id));
    if (campaignIds.length === 0) {
      return [];
    }
  }

  let pinQuery = supabase
    .from("pins")
    .select("id,affiliate_link_id,campaign_id,image_url,created_at,title")
    .eq("status", "posted")
    .order("created_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (campaignIds) {
    pinQuery = pinQuery.in("campaign_id", campaignIds);
  }

  const pinRes = await pinQuery;
  const pins = (pinRes.data ?? []) as PinRow[];
  if (pins.length === 0) {
    return [];
  }

  const affiliateIds = Array.from(new Set(pins.map((pin) => pin.affiliate_link_id)));
  const usedCampaignIds = Array.from(new Set(pins.map((pin) => pin.campaign_id)));

  const [affiliateRes, campaignRes] = await Promise.all([
    supabase
      .from("affiliate_links")
      .select("id,product_name,price,image_url")
      .in("id", affiliateIds),
    supabase.from("campaigns").select("id,theme").in("id", usedCampaignIds),
  ]);

  const affiliateMap = new Map<string, AffiliateLinkRow>();
  for (const row of (affiliateRes.data ?? []) as AffiliateLinkRow[]) {
    affiliateMap.set(row.id, row);
  }

  const campaignMap = new Map<string, CampaignRow>();
  for (const row of (campaignRes.data ?? []) as CampaignRow[]) {
    campaignMap.set(row.id, row);
  }

  return pins.map((pin) => {
    const affiliate = affiliateMap.get(pin.affiliate_link_id);
    const campaign = campaignMap.get(pin.campaign_id);

    return {
      pinId: pin.id,
      affiliateLinkId: pin.affiliate_link_id,
      campaignId: pin.campaign_id,
      productName: affiliate?.product_name || pin.title || "Product",
      price: affiliate?.price ?? null,
      theme: campaign?.theme ?? "general",
      imageUrl: pin.image_url ?? affiliate?.image_url ?? null,
      createdAt: pin.created_at,
    };
  });
}

export function formatThemeLabel(theme: string): string {
  if (!theme) return "General";
  return `${theme.charAt(0).toUpperCase()}${theme.slice(1).toLowerCase()}`;
}
