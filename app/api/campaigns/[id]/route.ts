import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const validStatuses = new Set(["active", "paused", "archived"]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const status = String(body?.status ?? "").trim().toLowerCase();

    if (!validStatuses.has(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const { data, error } = await getSupabaseServer()
      .from("campaigns")
      .update({ status })
      .eq("id", params.id)
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
