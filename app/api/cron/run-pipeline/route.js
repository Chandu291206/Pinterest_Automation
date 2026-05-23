import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { generatePinContent } from "@/lib/contentGenerator";
import { createCollagePin, createSingleProductPin, uploadPinImage } from "@/lib/imageCompositor";
import { getTrendingTerms, postPin } from "@/lib/pinterest";
import { getSetting } from "@/lib/settings";
import { getSupabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAuthErrorResponse(request) {
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

function randomFrom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function chooseProductImage(product) {
  const images = Array.isArray(product?.images)
    ? product.images.filter((item) => typeof item === "string" && item.trim())
    : [];

  if (images.length > 0) return images[0];
  if (typeof product?.image_url === "string" && product.image_url.trim()) {
    return product.image_url;
  }

  return "";
}

async function getCampaignProducts(campaignId) {
  const { data, error } = await getSupabaseServer()
    .from("products")
    .select("*")
    .eq("campaign_id", campaignId)
    .eq("is_active", true);

  if (error) {
    throw new Error(`Failed to load products: ${error.message}`);
  }

  return data ?? [];
}

async function countPinsToday(campaignId) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  const { count, error } = await getSupabaseServer()
    .from("pins")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .in("status", ["draft", "posted"])
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString());

  if (error) {
    throw new Error(`Failed to count pins today: ${error.message}`);
  }

  return count ?? 0;
}

async function insertFailedPin({ campaign, productId, pinFormat, variant, errorMessage }) {
  const nowIso = new Date().toISOString();
  const shortError = errorMessage.slice(0, 1800);

  await getSupabaseServer().from("pins").insert({
    campaign_id: campaign.id,
    product_id: productId,
    title: `Pipeline failed: ${campaign.name}`,
    description: `Pipeline error: ${shortError}`,
    hashtags: [],
    image_url: null,
    pinterest_pin_id: null,
    pin_format: pinFormat,
    variant,
    status: "failed",
    posted_at: nowIso,
    error_message: shortError,
  });
}

async function processCampaign(campaign, request, autoPost) {
  const now = new Date();
  const postsPerDay = Number.isFinite(Number(campaign.posts_per_day))
    ? Number(campaign.posts_per_day)
    : 3;

  const intervalHours = Number.isFinite(Number(campaign.interval_hours))
    ? Math.max(1, Number(campaign.interval_hours))
    : 1;

  if (campaign.last_pin_at) {
    const lastPinAt = new Date(campaign.last_pin_at).getTime();
    const nextAllowed = lastPinAt + intervalHours * 60 * 60 * 1000;
    if (Date.now() < nextAllowed) {
      return {
        campaignId: campaign.id,
        status: "skipped",
        reason: `Interval not reached (${intervalHours}h).`,
      };
    }
  }

  const pinsToday = await countPinsToday(campaign.id);
  if (pinsToday >= postsPerDay) {
    return {
      campaignId: campaign.id,
      status: "skipped",
      reason: "Daily post quota reached.",
    };
  }

  const pinFormat = pinsToday % 2 === 0 ? "single" : "collage";
  const variant = pinsToday % 2 === 0 ? "a" : "b";

  let selectedProduct = null;

  try {
    const trendingTerms = await getTrendingTerms(campaign.theme);
    const products = await getCampaignProducts(campaign.id);

    if (products.length === 0) {
      throw new Error("Campaign has no active products.");
    }

    selectedProduct = randomFrom(products);
    const selectedImage = chooseProductImage(selectedProduct);
    if (!selectedImage) {
      throw new Error("Selected product has no image.");
    }

    const collageProducts =
      pinFormat === "collage"
        ? [
            selectedProduct,
            ...products
              .filter((item) => item.id !== selectedProduct.id && chooseProductImage(item))
              .sort(() => Math.random() - 0.5)
              .slice(0, 3),
          ]
        : [selectedProduct];

    const collageUrls = collageProducts.map((product) => chooseProductImage(product)).filter(Boolean);

    if (pinFormat === "collage" && collageUrls.length < 2) {
      throw new Error("Collage pin requires at least 2 products with images.");
    }

    const content = await generatePinContent({
      theme: campaign.theme,
      productName: selectedProduct.product_name,
      productPrice: selectedProduct.price ?? "",
      trendingTerms,
      variant,
      pinFormat,
      relatedProducts:
        pinFormat === "collage"
          ? collageProducts
              .slice(1)
              .map((item) => item.product_name)
              .filter(Boolean)
          : undefined,
    });

    const composedImage =
      pinFormat === "single"
        ? await createSingleProductPin({
            productImageUrl: selectedImage,
            headline: content.overlay_headline || content.title,
            priceBadge: content.price_badge_text,
            theme: campaign.theme,
          })
        : await createCollagePin({
            productImageUrls: collageUrls,
            headline: content.overlay_headline || content.title,
            priceBadge: content.price_badge_text,
            theme: campaign.theme,
          });

    const pinId = randomUUID();
    const cdnUrl = await uploadPinImage(composedImage, pinId);

    const insertRes = await getSupabaseServer()
      .from("pins")
      .insert({
        id: pinId,
        campaign_id: campaign.id,
        product_id: selectedProduct.id,
        title: content.title,
        description: content.description,
        hashtags: content.hashtags,
        image_url: cdnUrl,
        pinterest_pin_id: null,
        pin_format: pinFormat,
        variant,
        status: "draft",
        posted_at: null,
      })
      .select("id")
      .single();

    if (insertRes.error || !insertRes.data) {
      throw new Error(`Failed to insert draft pin row: ${insertRes.error?.message ?? "unknown"}`);
    }

    let finalStatus = "draft";

    if (autoPost) {
      const postResult = await postPin({
        title: content.title,
        description: `${content.description}\n\n${content.hashtags.join(" ")}`,
        link: new URL(`/go/${pinId}`, request.url).toString(),
        imageUrl: cdnUrl,
        boardId: campaign.board_id,
      });

      const updateRes = await getSupabaseServer()
        .from("pins")
        .update({
          pinterest_pin_id: postResult.id,
          status: "posted",
          posted_at: new Date().toISOString(),
        })
        .eq("id", pinId);

      if (updateRes.error) {
        throw new Error(`Failed to mark pin as posted: ${updateRes.error.message}`);
      }

      finalStatus = "posted";
    }

    await getSupabaseServer()
      .from("campaigns")
      .update({ last_pin_at: now.toISOString() })
      .eq("id", campaign.id);

    return { campaignId: campaign.id, status: finalStatus };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Pipeline failed for campaign ${campaign.id}:`, error);

    if (selectedProduct?.id) {
      try {
        await insertFailedPin({
          campaign,
          productId: selectedProduct.id,
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

export async function GET(request) {
  const authError = getAuthErrorResponse(request);
  if (authError) return authError;

  const queryAutoPost = request.nextUrl.searchParams.get("auto_post");
  let autoPost = queryAutoPost === "true";

  if (!autoPost) {
    const storedBypass = await getSetting("auto_post_bypass", "false");
    autoPost = String(storedBypass).toLowerCase() === "true";
  }

  const { data, error } = await getSupabaseServer().from("campaigns").select("*").eq("status", "active");

  if (error) {
    return NextResponse.json(
      { error: `Failed to load campaigns: ${error.message}` },
      { status: 500 }
    );
  }

  const campaigns = data ?? [];
  const results = [];

  for (const campaign of campaigns) {
    const result = await processCampaign(campaign, request, autoPost);
    results.push(result);
  }

  const posted = results.filter((item) => item.status === "posted").length;
  const drafted = results.filter((item) => item.status === "draft").length;
  const skipped = results.filter((item) => item.status === "skipped").length;
  const failed = results.filter((item) => item.status === "failed").length;

  return NextResponse.json({
    ok: true,
    mode: autoPost ? "auto-post" : "draft-review",
    totals: { campaigns: campaigns.length, posted, drafted, skipped, failed },
    results,
    ranAt: new Date().toISOString(),
  });
}
