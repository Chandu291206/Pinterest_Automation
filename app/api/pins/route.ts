import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const campaignId = request.nextUrl.searchParams.get("campaign_id");
    let query = getSupabaseServer()
      .from("pins")
      .select("*")
      .order("posted_at", { ascending: false, nullsFirst: false })
      .limit(100);

    if (campaignId) {
      query = query.eq("campaign_id", campaignId);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ pins: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list pins.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
