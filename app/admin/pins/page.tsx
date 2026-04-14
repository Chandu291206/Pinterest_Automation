import Link from "next/link";
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

export const dynamic = "force-dynamic";

type PinRow = {
  id: string;
  title: string;
  status: string | null;
  pin_format: string | null;
  impressions: number | null;
  clicks: number | null;
  posted_at: string | null;
};

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function PinsPage() {
  let pins: PinRow[] = [];
  let dataError = "";

  try {
    const { data, error } = await getSupabaseServer()
      .from("pins")
      .select("id,title,status,pin_format,impressions,clicks,posted_at")
      .order("posted_at", { ascending: false, nullsFirst: false })
      .limit(50);
    if (error) {
      throw new Error(`Failed to load pins: ${error.message}`);
    }
    pins = (data ?? []) as PinRow[];
  } catch (error) {
    dataError = error instanceof Error ? error.message : "Failed to load pins.";
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pins</h1>
          <p className="text-sm text-muted-foreground">Latest published and queued pins.</p>
        </div>
        <Link href="/admin/pins/preview" className={cn(buttonVariants())}>
          Open Preview Tool
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Recent Pins</CardTitle>
        </CardHeader>
        <CardContent>
          {dataError ? (
            <p className="text-sm text-destructive">{dataError}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Impressions</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Posted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No pins available.
                    </TableCell>
                  </TableRow>
                ) : null}
                {pins.map((pin) => (
                  <TableRow key={pin.id}>
                    <TableCell className="max-w-[420px] truncate">{pin.title}</TableCell>
                    <TableCell>{pin.status ?? "-"}</TableCell>
                    <TableCell>{pin.pin_format ?? "-"}</TableCell>
                    <TableCell>{Number(pin.impressions ?? 0).toLocaleString()}</TableCell>
                    <TableCell>{Number(pin.clicks ?? 0).toLocaleString()}</TableCell>
                    <TableCell>{formatDate(pin.posted_at)}</TableCell>
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
