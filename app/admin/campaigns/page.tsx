import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getSupabaseServer } from "@/lib/supabase";

type CampaignRow = {
  id: string;
  name: string;
  theme: string;
  posts_per_day: number | null;
  status: string | null;
};

export default async function CampaignsPage() {
  let campaigns: CampaignRow[] = [];
  const pinCounts: Record<string, number> = {};
  let dataError = "";

  try {
    const supabase = getSupabaseServer();
    const [campaignsRes, pinsRes] = await Promise.all([
      supabase.from("campaigns").select("id,name,theme,posts_per_day,status").order("created_at", {
        ascending: false,
      }),
      supabase.from("pins").select("campaign_id"),
    ]);

    campaigns = (campaignsRes.data ?? []) as CampaignRow[];
    for (const row of pinsRes.data ?? []) {
      const campaignId = String(row.campaign_id ?? "");
      if (!campaignId) continue;
      pinCounts[campaignId] = (pinCounts[campaignId] ?? 0) + 1;
    }
  } catch (error) {
    dataError = error instanceof Error ? error.message : "Failed to load campaigns.";
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Campaigns</h1>
          <p className="text-sm text-muted-foreground">
            Manage campaign settings, status, and posting volume.
          </p>
        </div>
        <Link href="/admin/campaigns/new" className={cn(buttonVariants())}>
          Create New Campaign
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {dataError ? (
            <p className="text-sm text-destructive">{dataError}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Theme</TableHead>
                  <TableHead>Posts/Day</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pin Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No campaigns found.
                    </TableCell>
                  </TableRow>
                ) : null}
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <Link
                        href={`/admin/campaigns/${campaign.id}`}
                        className="font-medium hover:underline"
                      >
                        {campaign.name}
                      </Link>
                    </TableCell>
                    <TableCell className="capitalize">{campaign.theme}</TableCell>
                    <TableCell>{campaign.posts_per_day ?? 3}</TableCell>
                    <TableCell>
                      <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                        {campaign.status ?? "unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>{pinCounts[campaign.id] ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
