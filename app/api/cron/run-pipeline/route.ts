import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { searchAmazonProducts } from "@/lib/amazon";
import { generatePinContent } from "@/lib/contentGenerator";
import {
  createCollagePin,
  createSingleProductPin,
  uploadPinImage,
} from "@/lib/imageCompositor";
import { getTrendingTerms, postPin } from "@/lib/pinterest";
import { getRedis } from "@/lib/redis";
import { getSupabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CampaignRow = {
  id: string;
  name: string;
  theme: string;
  amazon_keywords: string[] | null;
  posts_per_day: number | null;
  posting_hours: number[] | null;
  board_id: string;
  status: string | null;
};

type AffiliateLinkRow = {
  id: string;
  campaign_id: string;
  asin: string;
  product_name: string;
  product_category: string | null;
  affiliate_url: string;
  image_url: string | null;
  price: string | null;
  is_active: boolean;
};

type ProcessResult = {
  campaignId: string;
  status: "posted" | "skipped" | "failed";
  reason?: string;
};

function getAuthErrorResponse(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

function randomFrom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function normalizeNumberArray(value: unknown, fallback: number[]): number[] {
  if (!Array.isArray(value)) return fallback;

  const numbers = value
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item))
    .map((item) => Math.trunc(item));

  return numbers.length > 0 ? numbers : fallback;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function toUtcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toSearchIndex(theme: string): string {
  const normalized = theme.toLowerCase();
  if (normalized.includes("fitness")) return "SportsAndOutdoors";
  if (normalized.includes("tech")) return "Electronics";
  if (normalized.includes("fashion")) return "Fashion";
  if (normalized.includes("home")) return "HomeAndKitchen";
  if (normalized.includes("beauty")) return "Beauty";
  if (normalized.includes("productivity")) return "OfficeProducts";
  return "All";
}

function buildTrackingUrl(request: NextRequest, affiliateLinkId: string): string {
  return new URL(`/go/${affiliateLinkId}`, request.url).toString();
}

async function getCampaignAffiliateLinks(campaignId: string): Promise<AffiliateLinkRow[]> {
  const { data, error } = await getSupabaseServer()
    .from("affiliate_links")
    .select("*")
    .eq("campaign_id", campaignId)
    .eq("is_active", true);

  if (error) {
    throw new Error(`Failed to load affiliate links: ${error.message}`);
  }

  return (data ?? []) as AffiliateLinkRow[];
}

async function createAffiliateLinkFromAmazon(campaign: CampaignRow): Promise<AffiliateLinkRow> {
  const keywords = normalizeStringArray(campaign.amazon_keywords);
  const keyword = keywords.length > 0 ? randomFrom(keywords) : campaign.theme;
  const searchIndex = toSearchIndex(campaign.theme);
  const products = await searchAmazonProducts(keyword, searchIndex);
  const first = products[0];

  if (!first) {
    throw new Error("Amazon lookup returned no products.");
  }

  const { data, error } = await getSupabaseServer()
    .from("affiliate_links")
    .insert({
      campaign_id: campaign.id,
      asin: first.asin,
      product_name: first.title,
      product_category: searchIndex,
      affiliate_url: first.url,
      image_url: first.imageUrl,
      price: first.price,
      is_active: true,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert Amazon affiliate link: ${error?.message ?? "unknown error"}`);
  }

  return data as AffiliateLinkRow;
}

async function ensureFallbackAffiliateLink(campaign: CampaignRow): Promise<AffiliateLinkRow | null> {
  const { data: existing } = await getSupabaseServer()
    .from("affiliate_links")
    .select("*")
    .eq("campaign_id", campaign.id)
    .limit(1);

  if (existing && existing.length > 0) {
    return existing[0] as AffiliateLinkRow;
  }

  const { data, error } = await getSupabaseServer()
    .from("affiliate_links")
    .insert({
      campaign_id: campaign.id,
      asin: `fallback-${Date.now()}`,
      product_name: "Pipeline Fallback Link",
      product_category: "system",
      affiliate_url: "https://www.amazon.com",
      image_url: null,
      price: null,
      is_active: false,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error(`Failed to create fallback affiliate link for ${campaign.id}:`, error?.message);
    return null;
  }

  return data as AffiliateLinkRow;
}

async function insertFailedPin(params: {
  campaign: CampaignRow;
  affiliateLinkId: string;
  pinFormat: "single" | "collage";
  variant: "a" | "b";
  errorMessage: string;
}) {
  const nowIso = new Date().toISOString();
  const shortError = params.errorMessage.slice(0, 1800);
  const baseInsert = {
    campaign_id: params.campaign.id,
    affiliate_link_id: params.affiliateLinkId,
    title: `Pipeline failed: ${params.campaign.name}`,
    description: `Pipeline error: ${shortError}`,
    hashtags: [],
    image_url: null,
    pinterest_pin_id: null,
    pin_format: params.pinFormat,
    variant: params.variant,
    status: "failed",
    posted_at: nowIso,
  };

  const withErrorMessage = await getSupabaseServer()
    .from("pins")
    .insert({ ...baseInsert, error_message: shortError });

  if (!withErrorMessage.error) {
    return;
  }

  const withErrorMessageText = withErrorMessage.error.message.toLowerCase();
  if (!withErrorMessageText.includes("error_message")) {
    throw new Error(`Failed to insert failed pin row: ${withErrorMessage.error.message}`);
  }

  const fallbackInsert = await getSupabaseServer().from("pins").insert(baseInsert);
  if (fallbackInsert.error) {
    throw new Error(`Failed to insert failed pin row fallback: ${fallbackInsert.error.message}`);
  }
}

async function processCampaign(campaign: CampaignRow, request: NextRequest): Promise<ProcessResult> {
  const now = new Date();
  const currentHourUtc = now.getUTCHours();
  const postingHours = normalizeNumberArray(campaign.posting_hours, [9, 14, 20]);
  const postsPerDay = Number.isFinite(Number(campaign.posts_per_day))
    ? Number(campaign.posts_per_day)
    : 3;

  if (!postingHours.includes(currentHourUtc)) {
    return {
      campaignId: campaign.id,
      status: "skipped",
      reason: `Hour ${currentHourUtc} not in posting_hours.`,
    };
  }

  const dateKey = toUtcDateKey(now);
  const redisKey = `pins:${campaign.id}:${dateKey}`;
  const currentCountRaw = await getRedis().get<number | string>(redisKey);
  const pinsToday = Number(currentCountRaw ?? 0);

  if (pinsToday >= postsPerDay) {
    return {
      campaignId: campaign.id,
      status: "skipped",
      reason: "Daily post quota reached.",
    };
  }

  const pinFormat: "single" | "collage" = pinsToday % 2 === 0 ? "single" : "collage";
  const variant: "a" | "b" = pinsToday % 2 === 0 ? "a" : "b";

  let selectedLink: AffiliateLinkRow | null = null;
  try {
    const trendingTerms = await getTrendingTerms(campaign.theme);
    const links = await getCampaignAffiliateLinks(campaign.id);

    if (links.length === 0) {
      throw new Error("Campaign has no active affiliate links.");
    }

    selectedLink = randomFrom(links);
    let allLinks = links;

    if (!selectedLink.image_url) {
      const amazonLink = await createAffiliateLinkFromAmazon(campaign);
      selectedLink = amazonLink;
      allLinks = [...links, amazonLink];
    }

    if (!selectedLink.image_url) {
      throw new Error("Selected affiliate link has no image_url.");
    }

    const collageLinks =
      pinFormat === "collage"
        ? [
            selectedLink,
            ...allLinks
              .filter((item) => item.id !== selectedLink!.id && Boolean(item.image_url))
              .sort(() => Math.random() - 0.5)
              .slice(0, 3),
          ].filter((item) => Boolean(item.image_url))
        : [selectedLink];

    if (pinFormat === "collage" && collageLinks.length < 2) {
      throw new Error("Collage pin requires at least 2 links with images.");
    }

    const content = await generatePinContent({
      theme: campaign.theme,
      productName: selectedLink.product_name,
      productPrice: selectedLink.price ?? "",
      trendingTerms,
      variant,
      pinFormat,
      relatedProducts:
        pinFormat === "collage"
          ? collageLinks
              .slice(1)
              .map((item) => item.product_name)
              .filter(Boolean)
          : undefined,
    });

    const composedImage =
      pinFormat === "single"
        ? await createSingleProductPin({
            productImageUrl: selectedLink.image_url,
            headline: content.overlay_headline || content.title,
            priceBadge: content.price_badge_text,
            theme: campaign.theme,
          })
        : await createCollagePin({
            productImageUrls: collageLinks
              .map((item) => item.image_url)
              .filter((url): url is string => Boolean(url)),
            headline: content.overlay_headline || content.title,
            priceBadge: content.price_badge_text,
            theme: campaign.theme,
          });

    const pinRowId = randomUUID();
    const cdnUrl = await uploadPinImage(composedImage, pinRowId);
    const postResult = await postPin({
      title: content.title,
      description: `${content.description}\n\n${content.hashtags.join(" ")}`,
      link: buildTrackingUrl(request, selectedLink.id),
      imageUrl: cdnUrl,
      boardId: campaign.board_id,
    });

    const { error: insertError } = await getSupabaseServer().from("pins").insert({
      id: pinRowId,
      campaign_id: campaign.id,
      affiliate_link_id: selectedLink.id,
      title: content.title,
      description: content.description,
      hashtags: content.hashtags,
      image_url: cdnUrl,
      pinterest_pin_id: postResult.id,
      pin_format: pinFormat,
      variant,
      status: "posted",
      posted_at: new Date().toISOString(),
    });

    if (insertError) {
      throw new Error(`Failed to insert posted pin row: ${insertError.message}`);
    }

    try {
      await getRedis().set(redisKey, pinsToday + 1, { ex: 90000 });
    } catch (redisError) {
      console.error(`Failed to increment Redis counter for campaign ${campaign.id}:`, redisError);
    }

    return { campaignId: campaign.id, status: "posted" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Pipeline failed for campaign ${campaign.id}:`, error);

    const fallbackLink = selectedLink ?? (await ensureFallbackAffiliateLink(campaign));
    if (fallbackLink) {
      try {
        await insertFailedPin({
          campaign,
          affiliateLinkId: fallbackLink.id,
          pinFormat,
          variant,
          errorMessage: message,
        });
      } catch (insertFailure) {
        console.error(`Failed to record error pin for campaign ${campaign.id}:`, insertFailure);
      }
    }

    return {
      campaignId: campaign.id,
      status: "failed",
      reason: message,
    };
  }
}

export async function GET(request: NextRequest) {
  const authError = getAuthErrorResponse(request);
  if (authError) return authError;

  const { data, error } = await getSupabaseServer()
    .from("campaigns")
    .select("*")
    .eq("status", "active");

  if (error) {
    return NextResponse.json(
      { error: `Failed to load campaigns: ${error.message}` },
      { status: 500 }
    );
  }

  const campaigns = (data ?? []) as CampaignRow[];
  const results: ProcessResult[] = [];

  for (const campaign of campaigns) {
    const result = await processCampaign(campaign, request);
    results.push(result);
  }

  const posted = results.filter((item) => item.status === "posted").length;
  const skipped = results.filter((item) => item.status === "skipped").length;
  const failed = results.filter((item) => item.status === "failed").length;

  return NextResponse.json({
    ok: true,
    totals: { campaigns: campaigns.length, posted, skipped, failed },
    results,
    ranAt: new Date().toISOString(),
  });
}
