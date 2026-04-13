import { NextRequest, NextResponse } from "next/server";
import { getPinAnalytics } from "@/lib/pinterest";
import { getSupabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET(request: NextRequest) {
  const authError = getAuthErrorResponse(request);
  if (authError) return authError;

  const sevenDaysAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await getSupabaseServer()
    .from("pins")
    .select("id,pinterest_pin_id")
    .not("pinterest_pin_id", "is", null)
    .gte("posted_at", sevenDaysAgoIso);

  if (error) {
    return NextResponse.json(
      { error: `Failed to load pins for analytics sync: ${error.message}` },
      { status: 500 }
    );
  }

  const pins = (data ?? []) as Array<{ id: string; pinterest_pin_id: string }>;
  let updated = 0;
  let failed = 0;

  for (const pin of pins) {
    try {
      const metrics = await getPinAnalytics(pin.pinterest_pin_id);
      const { error: updateError } = await getSupabaseServer()
        .from("pins")
        .update({
          impressions: metrics.impressions,
          saves: metrics.saves,
          clicks: metrics.clicks,
        })
        .eq("id", pin.id);

      if (updateError) {
        failed += 1;
        console.error(`Failed to update analytics for pin ${pin.id}: ${updateError.message}`);
        continue;
      }

      updated += 1;
    } catch (syncError) {
      failed += 1;
      console.error(`Analytics sync failed for pin ${pin.id}:`, syncError);
    }
  }

  return NextResponse.json({
    ok: true,
    scanned: pins.length,
    updated,
    failed,
    ranAt: new Date().toISOString(),
  });
}
