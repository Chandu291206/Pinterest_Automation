import { NextResponse } from "next/server";

import { postPin } from "@/lib/pinterest";
import { getSupabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  try {
    const pinId = String(params?.id ?? "").trim();
    if (!pinId) {
      return NextResponse.json({ error: "Pin id is required." }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const updates = {};

    if (typeof body?.title === "string") updates.title = body.title.trim();
    if (typeof body?.description === "string") updates.description = body.description.trim();
    if (Array.isArray(body?.hashtags)) {
      updates.hashtags = body.hashtags
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    const supabase = getSupabaseServer();

    if (Object.keys(updates).length > 0) {
      const editRes = await supabase.from("pins").update(updates).eq("id", pinId);
      if (editRes.error) {
        return NextResponse.json({ error: editRes.error.message }, { status: 500 });
      }
    }

    const pinRes = await supabase
      .from("pins")
      .select("id,title,description,hashtags,image_url,campaign_id")
      .eq("id", pinId)
      .maybeSingle();

    if (pinRes.error || !pinRes.data) {
      return NextResponse.json({ error: pinRes.error?.message ?? "Pin not found." }, { status: 404 });
    }

    const campaignRes = await supabase
      .from("campaigns")
      .select("id,board_id")
      .eq("id", pinRes.data.campaign_id)
      .maybeSingle();

    if (campaignRes.error || !campaignRes.data) {
      return NextResponse.json({ error: campaignRes.error?.message ?? "Campaign not found." }, { status: 404 });
    }

    const postResult = await postPin({
      title: pinRes.data.title,
      description: `${pinRes.data.description}\n\n${(pinRes.data.hashtags ?? []).join(" ")}`,
      link: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/go/${pinId}`,
      imageUrl: pinRes.data.image_url,
      boardId: campaignRes.data.board_id,
    });

    const updateRes = await supabase
      .from("pins")
      .update({
        status: "posted",
        pinterest_pin_id: postResult.id,
        posted_at: new Date().toISOString(),
      })
      .eq("id", pinId)
      .select("*")
      .maybeSingle();

    if (updateRes.error || !updateRes.data) {
      return NextResponse.json({ error: updateRes.error?.message ?? "Failed to update pin." }, { status: 500 });
    }

    return NextResponse.json({ pin: updateRes.data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to approve pin.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
