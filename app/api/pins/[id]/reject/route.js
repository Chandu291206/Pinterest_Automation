import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(_request, { params }) {
  try {
    const pinId = String(params?.id ?? "").trim();
    if (!pinId) {
      return NextResponse.json({ error: "Pin id is required." }, { status: 400 });
    }

    const { data, error } = await getSupabaseServer()
      .from("pins")
      .update({ status: "rejected" })
      .eq("id", pinId)
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Pin not found." }, { status: 404 });
    }

    return NextResponse.json({ pin: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reject pin.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
