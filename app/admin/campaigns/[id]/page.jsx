import Link from "next/link";
import { notFound } from "next/navigation";

import { AffiliateLinkToggle } from "@/components/affiliate-link-toggle";
import { CampaignIntervalSelect } from "@/components/campaign-interval-select";
import { CampaignStatusToggle } from "@/components/campaign-status-toggle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSupabaseServer } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function CampaignDetailPage({ params }) {
  const supabase = getSupabaseServer();
  const campaignId = String(params?.id ?? "").trim();
  if (!campaignId) notFound();

  let dataError = "";

  const [campaignRes, pinsRes, productsRes] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id,name,theme,status,posts_per_day,interval_hours,last_pin_at,board_id")
      .eq("id", campaignId)
      .maybeSingle(),
    supabase
      .from("pins")
      .select("id,title,image_url,status,impressions,clicks,posted_at")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false, nullsFirst: false }),
    supabase
      .from("products")
      .select("id,product_name,affiliate_url,is_active,image_url")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false }),
  ]);

  if (campaignRes.error) {
    dataError = `Failed to load campaign: ${campaignRes.error.message}`;
  } else if (pinsRes.error) {
    dataError = `Failed to load campaign pins: ${pinsRes.error.message}`;
  } else if (productsRes.error) {
    dataError = `Failed to load products: ${productsRes.error.message}`;
  }

  const campaign = campaignRes.data ?? null;
  if (!dataError && !campaign) notFound();

  const pins = pinsRes.data ?? [];
  const products = productsRes.data ?? [];

  const totalImpressions = pins.reduce((sum, pin) => sum + Number(pin.impressions ?? 0), 0);
  const totalClicks = pins.reduce((sum, pin) => sum + Number(pin.clicks ?? 0), 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/campaigns" className="text-sm text-muted-foreground hover:underline">
            {"< Back to campaigns"}
          </Link>
          {campaign ? <h1 className="mt-1 text-2xl font-semibold">{campaign.name}</h1> : null}
          {campaign ? (
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                {campaign.status ?? "unknown"}
              </Badge>
              <span className="text-sm capitalize text-muted-foreground">{campaign.theme}</span>
            </div>
          ) : null}
        </div>
        {campaign ? <CampaignStatusToggle campaignId={campaign.id} currentStatus={campaign.status} /> : null}
      </header>

      {dataError ? (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">{dataError}</CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pins (All Statuses)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{pins.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Impressions</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{totalImpressions.toLocaleString()}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Clicks</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{totalClicks.toLocaleString()}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Post Interval</CardTitle>
          </CardHeader>
          <CardContent>
            {campaign ? (
              <CampaignIntervalSelect campaignId={campaign.id} currentInterval={campaign.interval_hours ?? 1} />
            ) : null}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Pins</CardTitle>
        </CardHeader>
        <CardContent>
          {pins.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pins for this campaign yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {pins.map((pin) => (
                <article key={pin.id} className="rounded-lg border bg-background">
                  {pin.image_url ? (
                    <img src={pin.image_url} alt={pin.title} className="h-56 w-full rounded-t-lg object-cover" />
                  ) : (
                    <div className="flex h-56 w-full items-center justify-center rounded-t-lg bg-muted text-sm text-muted-foreground">
                      No image
                    </div>
                  )}
                  <div className="space-y-2 p-3">
                    <h3 className="line-clamp-2 font-medium">{pin.title}</h3>
                    <p className="text-xs text-muted-foreground">{pin.status} | {formatDate(pin.posted_at)}</p>
                    <div className="text-xs text-muted-foreground">
                      {Number(pin.impressions ?? 0).toLocaleString()} impressions | {" "}
                      {Number(pin.clicks ?? 0).toLocaleString()} clicks
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No products yet.
                  </TableCell>
                </TableRow>
              ) : null}
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.product_name}</TableCell>
                  <TableCell className="max-w-[380px] truncate">
                    <a href={product.affiliate_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      {product.affiliate_url}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? "active" : "inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <AffiliateLinkToggle affiliateLinkId={product.id} isActive={product.is_active} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
