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

export const dynamic = "force-dynamic";

type PinRow = {
  id: string;
  title: string;
  status: string | null;
  pin_format: string | null;
  posted_at: string | null;
  image_url: string | null;
  impressions: number | null;
  clicks: number | null;
};

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusVariant(status: string | null): "default" | "secondary" | "destructive" {
  if (status === "posted") return "default";
  if (status === "failed") return "destructive";
  return "secondary";
}

export default async function DashboardPage() {
  let totalPinsPosted = 0;
  let totalImpressions = 0;
  let totalClicks = 0;
  let activeCampaigns = 0;
  let recentPins: PinRow[] = [];
  let dataError = "";

  try {
    const supabase = getSupabaseServer();
    const [pinsCountRes, activeCampaignsRes, pinStatsRes, recentPinsRes] = await Promise.all([
      supabase.from("pins").select("id", { count: "exact", head: true }).eq("status", "posted"),
      supabase
        .from("campaigns")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase.from("pins").select("impressions,clicks"),
      supabase
        .from("pins")
        .select("id,title,status,pin_format,posted_at,image_url,impressions,clicks")
        .order("posted_at", { ascending: false, nullsFirst: false })
        .limit(10),
    ]);

    if (pinsCountRes.error) {
      throw new Error(`Failed to load total pins: ${pinsCountRes.error.message}`);
    }
    if (activeCampaignsRes.error) {
      throw new Error(`Failed to load active campaigns: ${activeCampaignsRes.error.message}`);
    }
    if (pinStatsRes.error) {
      throw new Error(`Failed to load pin stats: ${pinStatsRes.error.message}`);
    }
    if (recentPinsRes.error) {
      throw new Error(`Failed to load recent pins: ${recentPinsRes.error.message}`);
    }

    totalPinsPosted = pinsCountRes.count ?? 0;
    activeCampaigns = activeCampaignsRes.count ?? 0;
    totalImpressions = (pinStatsRes.data ?? []).reduce(
      (sum, pin) => sum + Number(pin.impressions ?? 0),
      0
    );
    totalClicks = (pinStatsRes.data ?? []).reduce(
      (sum, pin) => sum + Number(pin.clicks ?? 0),
      0
    );
    recentPins = (recentPinsRes.data ?? []) as PinRow[];
  } catch (error) {
    dataError = error instanceof Error ? error.message : "Failed to load dashboard data.";
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Snapshot of campaign publishing and Pinterest performance.
        </p>
      </header>

      {dataError ? (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">{dataError}</CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Pins Posted</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{totalPinsPosted}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Impressions</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {totalImpressions.toLocaleString()}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{totalClicks.toLocaleString()}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{activeCampaigns}</CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Latest Pins</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thumbnail</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Posted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No pins yet.
                  </TableCell>
                </TableRow>
              ) : null}
              {recentPins.map((pin) => (
                <TableRow key={pin.id}>
                  <TableCell>
                    {pin.image_url ? (
                      <img
                        src={pin.image_url}
                        alt={pin.title}
                        className="h-14 w-14 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[260px] truncate">{pin.title}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(pin.status)}>{pin.status ?? "unknown"}</Badge>
                  </TableCell>
                  <TableCell>{pin.pin_format ?? "-"}</TableCell>
                  <TableCell>{formatDate(pin.posted_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
