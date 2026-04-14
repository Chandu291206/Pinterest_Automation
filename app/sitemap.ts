import { MetadataRoute } from "next";
import { getSupabaseServer } from "@/lib/supabase";

const allowedThemes = new Set([
  "fitness",
  "tech",
  "fashion",
  "home",
  "beauty",
  "productivity",
]);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://curatedpicks.com";
  const supabase = getSupabaseServer();

  // Get all unique affiliate link IDs from posted pins
  const { data: affiliateData } = await supabase
    .from("pins")
    .select("affiliate_link_id")
    .eq("status", "posted");

  const uniqueAffiliateIds = Array.from(
    new Set((affiliateData ?? []).map((row) => row.affiliate_link_id))
  );

  // Get all unique themes from campaigns
  const { data: campaignData } = await supabase
    .from("campaigns")
    .select("theme");

  const uniqueThemes = Array.from(
    new Set(
      (campaignData ?? [])
        .map((row) => row.theme?.toLowerCase())
        .filter((theme): theme is string => allowedThemes.has(theme))
    )
  );

  const lastModified = new Date().toISOString().split("T")[0];

  // Static pages
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.1,
    },
    {
      url: `${baseUrl}/disclosure`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.1,
    },
  ];

  // Dynamic shop pages
  const shopUrls: MetadataRoute.Sitemap = uniqueAffiliateIds.map((id) => ({
    url: `${baseUrl}/shop/${id}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Dynamic niche/theme pages
  const nicheUrls: MetadataRoute.Sitemap = uniqueThemes.map((theme) => ({
    url: `${baseUrl}/niche/${theme}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticUrls, ...nicheUrls, ...shopUrls];
}
