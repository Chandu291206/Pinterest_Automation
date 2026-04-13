import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: { id: string } }
) {
  const affiliateLinkId = context.params.id;

  const { data: link, error } = await getSupabaseServer()
    .from("affiliate_links")
    .select("id,affiliate_url")
    .eq("id", affiliateLinkId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!link?.affiliate_url) {
    return NextResponse.json({ error: "Affiliate link not found." }, { status: 404 });
  }

  try {
    const { data: matchingPins, error: pinQueryError } = await getSupabaseServer()
      .from("pins")
      .select("id,clicks")
      .eq("affiliate_link_id", affiliateLinkId);

    if (pinQueryError) {
      console.error("Failed to fetch pins for click increment:", pinQueryError.message);
    } else if (matchingPins && matchingPins.length > 0) {
      await Promise.all(
        matchingPins.map((pin) =>
          getSupabaseServer()
            .from("pins")
            .update({ clicks: Number(pin.clicks ?? 0) + 1 })
            .eq("id", pin.id)
        )
      );
    }
  } catch (clickError) {
    console.error("Failed to increment pin clicks:", clickError);
  }

  return NextResponse.redirect(link.affiliate_url, 302);
}
