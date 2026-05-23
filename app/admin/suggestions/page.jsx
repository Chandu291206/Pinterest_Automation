import Link from "next/link";

import { getTrendingTerms } from "@/lib/pinterest";
import { getSupabaseServer } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function SuggestionsPage() {
  const supabase = getSupabaseServer();

  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("id,name,theme,status")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    return <p className="text-sm text-destructive">Failed to load campaigns: {error.message}</p>;
  }

  const list = campaigns ?? [];

  const trendRows = [];
  for (const campaign of list) {
    try {
      const terms = await getTrendingTerms(campaign.theme);
      trendRows.push({ campaign, terms: terms.slice(0, 10), error: "" });
    } catch (trendError) {
      trendRows.push({
        campaign,
        terms: [],
        error: trendError instanceof Error ? trendError.message : "Failed to fetch trends",
      });
    }
  }

  const [pinsRes, productsRes] = await Promise.all([
    supabase.from("pins").select("campaign_id,id"),
    supabase.from("products").select("campaign_id,clicks"),
  ]);

  const pinCountMap = new Map();
  for (const row of pinsRes.data ?? []) {
    const id = String(row.campaign_id ?? "");
    pinCountMap.set(id, (pinCountMap.get(id) ?? 0) + 1);
  }

  const clickMap = new Map();
  for (const row of productsRes.data ?? []) {
    const id = String(row.campaign_id ?? "");
    clickMap.set(id, (clickMap.get(id) ?? 0) + Number(row.clicks ?? 0));
  }

  const performance = list
    .map((campaign) => {
      const pinCount = pinCountMap.get(campaign.id) ?? 0;
      const clicks = clickMap.get(campaign.id) ?? 0;
      const ratio = pinCount > 0 ? clicks / pinCount : 0;
      return { campaign, pinCount, clicks, ratio };
    })
    .sort((a, b) => a.ratio - b.ratio)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Niche & Trend Suggestions</h1>
        <p className="text-sm text-muted-foreground">
          Discover trend keywords by active campaign and spot low-performing niches.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Trending Terms by Campaign</h2>
        {trendRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active campaigns.</p>
        ) : (
          <div className="space-y-3">
            {trendRows.map(({ campaign, terms, error: trendError }) => (
              <article key={campaign.id} className="rounded-md border p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-medium">{campaign.name}</h3>
                    <p className="text-xs capitalize text-muted-foreground">{campaign.theme}</p>
                  </div>
                  <Link href={`/admin/campaigns/${campaign.id}`} className="text-xs text-primary hover:underline">
                    Open campaign
                  </Link>
                </div>
                {trendError ? (
                  <p className="mt-2 text-xs text-destructive">{trendError}</p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {terms.map((term) => (
                      <span key={`${campaign.id}-${term}`} className="rounded-full bg-muted px-2 py-1 text-xs">
                        {term}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Lowest Performing Campaigns</h2>
        {performance.length === 0 ? (
          <p className="text-sm text-muted-foreground">No campaign performance data yet.</p>
        ) : (
          <div className="space-y-2">
            {performance.map((row) => (
              <div key={row.campaign.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <div>
                  <p className="font-medium">{row.campaign.name}</p>
                  <p className="text-xs text-muted-foreground">{row.clicks} clicks / {row.pinCount} pins</p>
                </div>
                <p className="text-xs">ratio: {row.ratio.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <Link href="/admin/campaigns/new" className="inline-flex rounded-md bg-black px-4 py-2 text-sm font-medium text-white">
        Create campaign
      </Link>
    </div>
  );
}
