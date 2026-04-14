import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const isActive = Boolean(body?.is_active);

    const affiliateId = String(params?.id ?? "").trim();
    if (!affiliateId) {
      return NextResponse.json({ error: "Affiliate link id is required." }, { status: 400 });
    }

    const { data, error } = await getSupabaseServer()
      .from("affiliate_links")
      .update({ is_active: isActive })
      .eq("id", affiliateId)
      .select("id,is_active")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Affiliate link not found." }, { status: 404 });
    }

    return NextResponse.json({ affiliate_link: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update affiliate link.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
