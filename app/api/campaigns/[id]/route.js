import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const validStatuses = new Set(["active", "paused", "archived"]);
const validIntervals = new Set([1, 2, 4, 6, 12, 24]);

export async function PATCH(request, { params }) {
  try {
    const campaignId = String(params?.id ?? "").trim();
    if (!campaignId) {
      return NextResponse.json({ error: "Campaign id is required." }, { status: 400 });
    }

    const body = await request.json();
    const updates = {};

    if (typeof body?.status === "string") {
      const status = body.status.trim().toLowerCase();
      if (!validStatuses.has(status)) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      }
      updates.status = status;
    }

    if (body?.interval_hours !== undefined) {
      const interval = Number(body.interval_hours);
      if (!validIntervals.has(interval)) {
        return NextResponse.json({ error: "Invalid interval_hours." }, { status: 400 });
      }
      updates.interval_hours = interval;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates provided." }, { status: 400 });
    }

    const { data, error } = await getSupabaseServer()
      .from("campaigns")
      .update(updates)
      .eq("id", campaignId)
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }

    return NextResponse.json({ campaign: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update campaign.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
