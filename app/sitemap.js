import { getSupabaseServer } from "@/lib/supabase";

const allowedThemes = new Set([
  "fitness",
  "tech",
  "fashion",
  "home",
  "beauty",
  "productivity",
]);

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://curatedpicks.com";
  const supabase = getSupabaseServer();

  const { data: pinData } = await supabase.from("pins").select("id").eq("status", "posted");
  const pinIds = Array.from(new Set((pinData ?? []).map((row) => row.id))).filter(Boolean);

  const { data: campaignData } = await supabase.from("campaigns").select("theme");
  const uniqueThemes = Array.from(
    new Set(
      (campaignData ?? [])
        .map((row) => String(row.theme ?? "").toLowerCase())
        .filter((theme) => allowedThemes.has(theme))
    )
  );

  const lastModified = new Date().toISOString().split("T")[0];

  const staticUrls = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "daily",
      priority: 1,
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

  const goUrls = pinIds.map((id) => ({
    url: `${baseUrl}/go/${id}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const nicheUrls = uniqueThemes.map((theme) => ({
    url: `${baseUrl}/niche/${theme}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticUrls, ...nicheUrls, ...goUrls];
}
