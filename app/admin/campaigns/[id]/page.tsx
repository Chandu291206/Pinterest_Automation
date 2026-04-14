import Link from "next/link";
import { notFound } from "next/navigation";
import { AffiliateLinkToggle } from "@/components/affiliate-link-toggle";
import { CampaignStatusToggle } from "@/components/campaign-status-toggle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSupabaseServer } from "@/lib/supabase";

type CampaignRow = {
  id: string;
  name: string;
  theme: string;
  status: string | null;
  posts_per_day: number | null;
  board_id: string | null;
};

type PinRow = {
  id: string;
  title: string;
  image_url: string | null;
  impressions: number | null;
  saves: number | null;
  clicks: number | null;
  posted_at: string | null;
};

type AffiliateLinkRow = {
  id: string;
  product_name: string;
  affiliate_url: string;
  is_active: boolean;
  image_url: string | null;
};

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function CampaignDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = getSupabaseServer();
  const campaignId = params.id;

  const [campaignRes, pinsRes, affiliateRes] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id,name,theme,status,posts_per_day,board_id")
      .eq("id", campaignId)
      .maybeSingle(),
    supabase
      .from("pins")
      .select("id,title,image_url,impressions,saves,clicks,posted_at")
      .eq("campaign_id", campaignId)
      .order("posted_at", { ascending: false, nullsFirst: false }),
    supabase
      .from("affiliate_links")
      .select("id,product_name,affiliate_url,is_active,image_url")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false }),
  ]);

  const campaign = campaignRes.data as CampaignRow | null;
  if (!campaign) {
    notFound();
  }

  const pins = (pinsRes.data ?? []) as PinRow[];
  const affiliateLinks = (affiliateRes.data ?? []) as AffiliateLinkRow[];
  const totalImpressions = pins.reduce((sum, pin) => sum + Number(pin.impressions ?? 0), 0);
  const totalClicks = pins.reduce((sum, pin) => sum + Number(pin.clicks ?? 0), 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/campaigns" className="text-sm text-muted-foreground hover:underline">
            {"<- Back to campaigns"}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">{campaign.name}</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
              {campaign.status ?? "unknown"}
            </Badge>
            <span className="text-sm capitalize text-muted-foreground">{campaign.theme}</span>
          </div>
        </div>
        <CampaignStatusToggle campaignId={campaign.id} currentStatus={campaign.status} />
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pins Posted</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{pins.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Impressions</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {totalImpressions.toLocaleString()}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Clicks</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{totalClicks.toLocaleString()}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Posts Per Day</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{campaign.posts_per_day ?? 3}</CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Pins</CardTitle>
        </CardHeader>
        <CardContent>
          {pins.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pins posted for this campaign yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {pins.map((pin) => (
                <article key={pin.id} className="rounded-lg border bg-background">
                  {pin.image_url ? (
                    <img
                      src={pin.image_url}
                      alt={pin.title}
                      className="h-56 w-full rounded-t-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-56 w-full items-center justify-center rounded-t-lg bg-muted text-sm text-muted-foreground">
                      No image
                    </div>
                  )}
                  <div className="space-y-2 p-3">
                    <h3 className="line-clamp-2 font-medium">{pin.title}</h3>
                    <p className="text-xs text-muted-foreground">{formatDate(pin.posted_at)}</p>
                    <div className="text-xs text-muted-foreground">
                      {Number(pin.impressions ?? 0).toLocaleString()} impressions |{" "}
                      {Number(pin.saves ?? 0).toLocaleString()} saves |{" "}
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
          <CardTitle>Affiliate Links</CardTitle>
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
              {affiliateLinks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No affiliate links yet.
                  </TableCell>
                </TableRow>
              ) : null}
              {affiliateLinks.map((link) => (
                <TableRow key={link.id}>
                  <TableCell className="font-medium">{link.product_name}</TableCell>
                  <TableCell className="max-w-[380px] truncate">
                    <a
                      href={link.affiliate_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      {link.affiliate_url}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge variant={link.is_active ? "default" : "secondary"}>
                      {link.is_active ? "active" : "inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <AffiliateLinkToggle affiliateLinkId={link.id} isActive={link.is_active} />
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
